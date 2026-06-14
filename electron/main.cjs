const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REQUEST_TIMEOUT_MS = 3500;

const PROVIDERS = [
  {
    id: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://127.0.0.1:1234",
    modelsPath: "/v1/models",
    chatPath: "/v1/chat/completions"
  },
  {
    id: "ollama",
    name: "Ollama",
    baseUrl: "http://127.0.0.1:11434",
    modelsPath: "/api/tags",
    chatPath: "/api/chat"
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    timeout.cancel();
  }
}

function normalizeModels(providerId, payload) {
  if (providerId === "lmstudio") {
    return Array.isArray(payload?.data)
      ? payload.data.map((model) => model.id).filter(Boolean)
      : [];
  }

  return Array.isArray(payload?.models)
    ? payload.models.map((model) => model.name).filter(Boolean)
    : [];
}

async function detectProviders() {
  const checks = await Promise.all(PROVIDERS.map(async (provider) => {
    try {
      const payload = await fetchJson(`${provider.baseUrl}${provider.modelsPath}`);
      const models = normalizeModels(provider.id, payload);
      return { ...provider, available: true, models };
    } catch (error) {
      return { ...provider, available: false, models: [], error: error.message };
    }
  }));

  return {
    providers: checks,
    selectedId: checks.find((provider) => provider.available)?.id || null
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
      content: "You are a concise local assistant for Bars, a personal idea notebook. Answer from the supplied notes. If the notes do not contain enough evidence, say what is missing. Keep practical next steps clear."
    },
    {
      role: "user",
      content: `Question:\n${question}\n\nBars notes:\n${context || "No notes saved yet."}`
    }
  ];
}

async function askProvider({ providerId, model, question, ideas }) {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error("Unknown local model provider.");

  const messages = buildMessages(question, ideas);
  const selectedModel = model || "local-model";

  if (provider.id === "lmstudio") {
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

    return {
      providerId: provider.id,
      model: selectedModel,
      answer: payload?.choices?.[0]?.message?.content?.trim() || "No response text returned."
    };
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

  return {
    providerId: provider.id,
    model: selectedModel,
    answer: payload?.message?.content?.trim() || "No response text returned."
  };
}

app.whenReady().then(() => {
  ipcMain.handle("bars-ai:detect", detectProviders);
  ipcMain.handle("bars-ai:ask", (_event, payload) => askProvider(payload));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
