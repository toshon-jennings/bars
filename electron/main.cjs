const { app, BrowserWindow, ipcMain, safeStorage, shell } = require("electron");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REQUEST_TIMEOUT_MS = 3500;
const API_KEYS_FILE = "api-keys.enc";

const LOCAL_PROVIDERS = [
  {
    id: "lmstudio",
    name: "LM Studio",
    kind: "local",
    baseUrl: "http://127.0.0.1:1234",
    modelsPath: "/v1/models",
    chatPath: "/v1/chat/completions",
    defaultModel: "local-model",
    api: "openai"
  },
  {
    id: "jan",
    name: "Jan",
    kind: "local",
    baseUrl: "http://127.0.0.1:1337",
    modelsPath: "/v1/models",
    chatPath: "/v1/chat/completions",
    defaultModel: "local-model",
    api: "openai"
  },
  {
    id: "ollama",
    name: "Ollama",
    kind: "local",
    baseUrl: "http://127.0.0.1:11434",
    modelsPath: "/api/tags",
    chatPath: "/api/chat",
    defaultModel: "local-model",
    api: "ollama"
  }
];

const CLOUD_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    kind: "cloud",
    defaultModel: "gpt-5.5",
    models: ["gpt-5.5", "gpt-5.4", "gpt-4.1-mini"],
    chatPath: "https://api.openai.com/v1/chat/completions",
    api: "openai"
  },
  {
    id: "anthropic",
    name: "Anthropic",
    kind: "cloud",
    defaultModel: "claude-sonnet-4-5",
    models: ["claude-sonnet-4-5", "claude-opus-4-8", "claude-opus-4-7"],
    chatPath: "https://api.anthropic.com/v1/messages",
    api: "anthropic"
  },
  {
    id: "google",
    name: "Google AI",
    kind: "cloud",
    defaultModel: "gemini-3.5-flash",
    models: ["gemini-3.5-flash", "gemini-3.5-pro"],
    chatPath: "https://generativelanguage.googleapis.com/v1beta/models",
    api: "google"
  },
  {
    id: "groq",
    name: "Groq",
    kind: "cloud",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "moonshotai/kimi-k2-instruct"],
    chatPath: "https://api.groq.com/openai/v1/chat/completions",
    api: "openai"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "cloud",
    defaultModel: "openrouter/auto",
    models: ["openrouter/auto"],
    modelsPath: "https://openrouter.ai/api/v1/models",
    chatPath: "https://openrouter.ai/api/v1/chat/completions",
    api: "openai",
    extraHeaders: { "X-Title": "Bars" }
  }
];

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 920,
    minWidth: 980,
    minHeight: 720,
    title: "Bars",
    backgroundColor: "#131009",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(ROOT, "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function timeoutSignal(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

async function fetchJson(url, options = {}) {
  const timeout = timeoutSignal(options.timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: timeout.signal });
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || (typeof payload === "string" ? payload : "");
      throw new Error([`HTTP ${response.status}`, message].filter(Boolean).join(": "));
    }
    return payload;
  } finally {
    timeout.cancel();
  }
}

function emptyApiKeys() {
  return CLOUD_PROVIDERS.reduce((keys, provider) => {
    keys[provider.id] = "";
    return keys;
  }, {});
}

function apiKeysPath() {
  return path.join(app.getPath("userData"), API_KEYS_FILE);
}

function normalizeApiKeys(value) {
  const keys = emptyApiKeys();
  if (!value || typeof value !== "object") return keys;
  CLOUD_PROVIDERS.forEach((provider) => {
    keys[provider.id] = typeof value[provider.id] === "string" ? value[provider.id].trim() : "";
  });
  return keys;
}

function readApiKeys() {
  if (!safeStorage.isEncryptionAvailable()) return emptyApiKeys();
  try {
    const target = apiKeysPath();
    if (!fs.existsSync(target)) return emptyApiKeys();
    const decrypted = safeStorage.decryptString(fs.readFileSync(target));
    return normalizeApiKeys(JSON.parse(decrypted));
  } catch {
    return emptyApiKeys();
  }
}

function writeApiKeys(keys) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure key storage is not available on this desktop session.");
  }
  fs.mkdirSync(path.dirname(apiKeysPath()), { recursive: true });
  fs.writeFileSync(apiKeysPath(), safeStorage.encryptString(JSON.stringify(normalizeApiKeys(keys))), { mode: 0o600 });
}

function getApiKeyStatus() {
  const keys = readApiKeys();
  return {
    encrypted: safeStorage.isEncryptionAvailable(),
    providers: CLOUD_PROVIDERS.map((provider) => ({
      id: provider.id,
      name: provider.name,
      configured: Boolean(keys[provider.id])
    }))
  };
}

function saveApiKeys(incoming) {
  const next = readApiKeys();
  CLOUD_PROVIDERS.forEach((provider) => {
    const value = typeof incoming?.[provider.id] === "string" ? incoming[provider.id].trim() : "";
    if (value) next[provider.id] = value;
  });
  writeApiKeys(next);
  return getApiKeyStatus();
}

function clearApiKeys() {
  writeApiKeys(emptyApiKeys());
  return getApiKeyStatus();
}

function normalizeModels(provider, payload) {
  if (provider.api === "openai") {
    return Array.isArray(payload?.data)
      ? payload.data.map((model) => model.id).filter(Boolean)
      : [];
  }

  return Array.isArray(payload?.models)
    ? payload.models.map((model) => model.name).filter(Boolean)
    : [];
}

async function detectLocalProvider(provider) {
  try {
    const payload = await fetchJson(`${provider.baseUrl}${provider.modelsPath}`);
    const models = normalizeModels(provider, payload);
    return { ...provider, available: true, models };
  } catch (error) {
    return { ...provider, available: false, models: [], error: error.message };
  }
}

async function fetchCloudModels(provider) {
  if (!provider.modelsPath) return provider.models;
  try {
    const payload = await fetchJson(provider.modelsPath, { timeoutMs: 12000 });
    const ids = Array.isArray(payload?.data)
      ? payload.data.map((model) => model.id).filter(Boolean)
      : [];
    return Array.from(new Set([provider.defaultModel, ...ids].filter(Boolean)));
  } catch {
    return provider.models;
  }
}

async function detectCloudProviders() {
  const keys = readApiKeys();
  return Promise.all(CLOUD_PROVIDERS.map(async (provider) => ({
    ...provider,
    available: Boolean(keys[provider.id]),
    configured: Boolean(keys[provider.id]),
    models: await fetchCloudModels(provider)
  })));
}

async function detectProviders() {
  const [localChecks, cloudChecks] = await Promise.all([
    Promise.all(LOCAL_PROVIDERS.map(detectLocalProvider)),
    detectCloudProviders()
  ]);
  const checks = [...localChecks, ...cloudChecks];

  return {
    providers: checks,
    selectedId: checks.find((provider) => provider.available)?.id || null,
    keyStatus: getApiKeyStatus()
  };
}

function compactIdeas(ideas) {
  return ideas.slice(0, 80).map((idea, index) => {
    const tags = Array.isArray(idea.tags) && idea.tags.length ? ` tags: ${idea.tags.join(", ")}` : "";
    const next = idea.next ? ` next: ${idea.next}` : "";
    return [
      `${index + 1}. ${idea.title || "Untitled"}`,
      `status: ${idea.status || "New"}; category: ${idea.category || idea.kind || "Uncategorized"};${tags}${next}`,
      idea.notes ? `notes: ${idea.notes}` : ""
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

function buildMessages(question, ideas) {
  const context = compactIdeas(Array.isArray(ideas) ? ideas : []);
  return [
    {
      role: "system",
      content: "You are a concise assistant for Bars, a personal idea notebook. Answer from the supplied notes. If the notes do not contain enough evidence, say what is missing. Keep practical next steps clear."
    },
    {
      role: "user",
      content: `Question:\n${question}\n\nBars notes:\n${context || "No notes saved yet."}`
    }
  ];
}

async function askOpenAiCompatible(provider, key, model, messages) {
  const payload = await fetchJson(provider.chatPath, {
    method: "POST",
    timeoutMs: 90000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(provider.extraHeaders || {})
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      stream: false
    })
  });

  return payload?.choices?.[0]?.message?.content?.trim() || "No response text returned.";
}

async function askAnthropic(provider, key, model, messages) {
  const payload = await fetchJson(provider.chatPath, {
    method: "POST",
    timeoutMs: 90000,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: messages[0].content,
      messages: [{ role: "user", content: messages[1].content }]
    })
  });

  return Array.isArray(payload?.content)
    ? payload.content.map((part) => part?.text || "").join("").trim() || "No response text returned."
    : "No response text returned.";
}

async function askGoogle(provider, key, model, messages) {
  const payload = await fetchJson(`${provider.chatPath}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    timeoutMs: 90000,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: messages[0].content }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: messages[1].content }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1024
      }
    })
  });

  const parts = payload?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts)
    ? parts.map((part) => part?.text || "").join("").trim() || "No response text returned."
    : "No response text returned.";
}

async function askLocalProvider(provider, selectedModel, messages) {
  if (provider.api === "openai") {
    const payload = await fetchJson(`${provider.baseUrl}${provider.chatPath}`, {
      method: "POST",
      timeoutMs: 90000,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.2,
        stream: false
      })
    });

    return payload?.choices?.[0]?.message?.content?.trim() || "No response text returned.";
  }

  const payload = await fetchJson(`${provider.baseUrl}${provider.chatPath}`, {
    method: "POST",
    timeoutMs: 90000,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      stream: false
    })
  });

  return payload?.message?.content?.trim() || "No response text returned.";
}

async function askProvider({ providerId, model, question, ideas }) {
  const provider = [...LOCAL_PROVIDERS, ...CLOUD_PROVIDERS].find((item) => item.id === providerId);
  if (!provider) throw new Error("Unknown AI provider.");

  const messages = buildMessages(question, ideas);
  const selectedModel = model || provider.defaultModel || "local-model";

  if (provider.kind === "local") {
    return {
      providerId: provider.id,
      model: selectedModel,
      answer: await askLocalProvider(provider, selectedModel, messages)
    };
  }

  const key = readApiKeys()[provider.id];
  if (!key) throw new Error(`Add a ${provider.name} API key in Settings first.`);

  const ask = provider.api === "anthropic"
    ? askAnthropic
    : provider.api === "google"
      ? askGoogle
      : askOpenAiCompatible;

  return {
    providerId: provider.id,
    model: selectedModel,
    answer: await ask(provider, key, selectedModel, messages)
  };
}

app.whenReady().then(() => {
  ipcMain.handle("bars-ai:detect", detectProviders);
  ipcMain.handle("bars-ai:ask", (_event, payload) => askProvider(payload));
  ipcMain.handle("bars-ai:get-api-key-status", getApiKeyStatus);
  ipcMain.handle("bars-ai:save-api-keys", (_event, payload) => saveApiKeys(payload));
  ipcMain.handle("bars-ai:clear-api-keys", clearApiKeys);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
