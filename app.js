const STORAGE_KEY = "idea-tracker:v1";
const API_KEYS_KEY = "idea-tracker:api-keys:v1";
const API_PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "google", name: "Google AI", placeholder: "AIza..." },
  { id: "groq", name: "Groq", placeholder: "gsk_..." },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-..." }
];
const quickForm = document.querySelector("#quickForm");
const quickInput = document.querySelector("#quickInput");
const quickCount = document.querySelector("#quickCount");
const form = document.querySelector("#ideaForm");
const ideasList = document.querySelector("#ideasList");
const detailContent = document.querySelector("#detailContent");
const detailScore = document.querySelector("#detailScore");
const ideaCount = document.querySelector("#ideaCount");
const saveState = document.querySelector("#saveState");
const searchInput = document.querySelector("#searchInput");
const statusChips = document.querySelector("#statusChips");
const sortInput = document.querySelector("#sortInput");
const writeup = document.querySelector("#writeup");
const resetButton = document.querySelector("#resetButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const settingsButton = document.querySelector("#settingsButton");
const settingsModal = document.querySelector("#settingsModal");
const settingsForm = document.querySelector("#settingsForm");
const settingsCloseButton = document.querySelector("#settingsCloseButton");
const apiKeyFields = document.querySelector("#apiKeyFields");
const clearApiKeysButton = document.querySelector("#clearApiKeysButton");
const settingsState = document.querySelector("#settingsState");
const settingsNote = document.querySelector("#settingsNote");
const aiPanel = document.querySelector("#aiPanel");
const aiStatus = document.querySelector("#aiStatus");
const aiProviderInput = document.querySelector("#aiProviderInput");
const aiModelSearchInput = document.querySelector("#aiModelSearchInput");
const aiModelInput = document.querySelector("#aiModelInput");
const aiCustomModelInput = document.querySelector("#aiCustomModelInput");
const aiRefreshButton = document.querySelector("#aiRefreshButton");
const aiForm = document.querySelector("#aiForm");
const aiQuestionInput = document.querySelector("#aiQuestionInput");
const aiAnswer = document.querySelector("#aiAnswer");

let ideas = loadIdeas();
let activeId = ideas[0]?.id || null;
let statusValue = "all";
let aiProviders = [];
let selectedProviderId = null;
let currentModelOptions = [];
let apiKeys = loadApiKeys();
let apiKeyStatus = getLocalApiKeyStatus();

function loadIdeas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(normalizeIdea);
  } catch {
    return [];
  }
}

function normalizeIdea(idea) {
  return {
    kind: idea.kind || (idea.status === "Inbox" ? "Thought" : "Idea"),
    title: idea.title || "Untitled",
    notes: idea.notes || "",
    category: idea.category || "",
    status: idea.status || "New",
    impact: idea.impact || "3",
    effort: idea.effort || "3",
    next: idea.next || "",
    tags: Array.isArray(idea.tags) ? idea.tags : [],
    createdAt: idea.createdAt || new Date().toISOString(),
    updatedAt: idea.updatedAt || new Date().toISOString(),
    id: idea.id || crypto.randomUUID()
  };
}

function saveIdeas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  saveState.textContent = "Saved locally";
}

function loadApiKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem(API_KEYS_KEY) || "{}");
    return API_PROVIDERS.reduce((keys, provider) => {
      keys[provider.id] = typeof stored[provider.id] === "string" ? stored[provider.id] : "";
      return keys;
    }, {});
  } catch {
    return API_PROVIDERS.reduce((keys, provider) => ({ ...keys, [provider.id]: "" }), {});
  }
}

function saveApiKeys() {
  localStorage.setItem(API_KEYS_KEY, JSON.stringify(apiKeys));
}

function emptyApiKeys() {
  return API_PROVIDERS.reduce((keys, provider) => ({ ...keys, [provider.id]: "" }), {});
}

function hasDesktopKeyStorage() {
  const barsAI = getBarsAI();
  return Boolean(barsAI?.getApiKeyStatus && barsAI?.saveApiKeys && barsAI?.clearApiKeys);
}

function getLocalApiKeyStatus() {
  return API_PROVIDERS.reduce((status, provider) => {
    status[provider.id] = Boolean(apiKeys?.[provider.id]);
    return status;
  }, {});
}

async function refreshApiKeyStatus() {
  if (!hasDesktopKeyStorage()) {
    apiKeyStatus = getLocalApiKeyStatus();
    if (settingsNote) {
      settingsNote.textContent = "Keys stay in this browser and are not included in bar exports.";
    }
    return;
  }

  try {
    const status = await getBarsAI().getApiKeyStatus();
    apiKeyStatus = API_PROVIDERS.reduce((configured, provider) => {
      configured[provider.id] = Boolean(status.providers?.find((item) => item.id === provider.id)?.configured);
      return configured;
    }, {});
    if (settingsNote) {
      settingsNote.textContent = status.encrypted
        ? "Desktop keys are encrypted with Electron safeStorage and are not included in bar exports."
        : "Secure desktop key storage is unavailable in this session.";
    }
  } catch (error) {
    flashSettingsState(error.message || "Could not read key status");
  }
}

async function migrateLocalApiKeysToDesktop() {
  if (!hasDesktopKeyStorage()) return;
  const localKeys = loadApiKeys();
  if (!Object.values(localKeys).some(Boolean)) {
    await refreshApiKeyStatus();
    return;
  }

  await getBarsAI().saveApiKeys(localKeys);
  localStorage.removeItem(API_KEYS_KEY);
  apiKeys = emptyApiKeys();
  await refreshApiKeyStatus();
}

function flashSettingsState(message) {
  settingsState.textContent = message;
  clearTimeout(flashSettingsState.timer);
  flashSettingsState.timer = setTimeout(() => {
    settingsState.textContent = "";
  }, 2400);
}

function renderApiKeyFields() {
  if (!apiKeyFields) return;
  const desktopStorage = hasDesktopKeyStorage();
  apiKeyFields.innerHTML = API_PROVIDERS.map((provider) => {
    const configured = Boolean(apiKeyStatus[provider.id]);
    const value = desktopStorage ? "" : apiKeys[provider.id] || "";
    const status = configured ? "Configured" : "Not set";
    const placeholder = desktopStorage && configured ? "Saved securely - enter a new key to replace" : provider.placeholder;
    return `
      <label class="key-field">
        <span>${escapeHtml(provider.name)}</span>
        <input
          name="${escapeHtml(provider.id)}"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="${escapeHtml(placeholder)}"
          value="${escapeHtml(value)}"
        >
        <small>${status}</small>
      </label>
    `;
  }).join("");
}

let saveStateTimer;
function flashSaveState(message) {
  saveState.textContent = message;
  clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    saveState.textContent = "Saved locally";
  }, 2400);
}

function scoreIdea(idea) {
  if (idea.status === "Inbox") return 0;
  return Number(idea.impact) * 2 - Number(idea.effort) + (idea.status === "Building" ? 2 : 0);
}

function normalizeTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function formatRelative(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

function dots(value) {
  return "●".repeat(Number(value)) + "○".repeat(5 - Number(value));
}

function getBarsAI() {
  return window.barsAI || null;
}

function getSelectedProvider() {
  return aiProviders.find((provider) => provider.id === selectedProviderId) || null;
}

function getSelectedModel() {
  return aiModelInput.value === "__custom" ? aiCustomModelInput.value.trim() : aiModelInput.value;
}

function setCustomModelVisible(visible) {
  aiCustomModelInput.classList.toggle("is-hidden", !visible);
  aiCustomModelInput.disabled = !visible;
  if (visible) aiCustomModelInput.focus();
}

function getFilteredModelOptions() {
  const query = aiModelSearchInput.value.trim().toLowerCase();
  if (!query) return currentModelOptions;
  return currentModelOptions.filter((model) => model.toLowerCase().includes(query));
}

function renderModelOptions(provider, previousModel = getSelectedModel()) {
  const filteredModels = getFilteredModelOptions();
  const modelOptions = filteredModels.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`);
  if (provider?.kind === "cloud") {
    modelOptions.push('<option value="__custom">Custom model...</option>');
  }
  aiModelInput.innerHTML = modelOptions.join("") || "<option>No matching models</option>";

  if (provider?.kind === "local") {
    aiModelInput.value = filteredModels.includes(previousModel) ? previousModel : filteredModels[0] || "";
    setCustomModelVisible(false);
    aiForm.querySelector("button").disabled = !filteredModels.length;
  } else if (previousModel && !filteredModels.includes(previousModel) && !currentModelOptions.includes(previousModel)) {
    aiModelInput.value = "__custom";
    aiCustomModelInput.value = previousModel;
    setCustomModelVisible(true);
  } else {
    aiModelInput.value = filteredModels.includes(previousModel)
      ? previousModel
      : filteredModels.includes(provider?.defaultModel)
        ? provider.defaultModel
        : filteredModels[0] || "__custom";
    setCustomModelVisible(aiModelInput.value === "__custom");
  }
}

function renderAiProviders() {
  if (!aiPanel) return;
  const visibleProviders = aiProviders.filter((provider) => provider.available || provider.kind === "cloud");
  aiProviderInput.innerHTML = visibleProviders.map((provider) => {
    const suffix = provider.kind === "cloud"
      ? provider.configured ? " - cloud" : " - add key"
      : " - local";
    return `<option value="${escapeHtml(provider.id)}">${escapeHtml(provider.name + suffix)}</option>`;
  }).join("");

  if (!visibleProviders.length) {
    aiProviderInput.innerHTML = "<option>No AI provider configured</option>";
    aiModelSearchInput.value = "";
    aiModelInput.innerHTML = "<option>No model detected</option>";
    aiCustomModelInput.value = "";
    setCustomModelVisible(false);
    aiProviderInput.disabled = true;
    aiModelInput.disabled = true;
    aiForm.querySelector("button").disabled = true;
    aiStatus.textContent = getBarsAI() ? "Add a cloud API key in Settings or start LM Studio, Jan, or Ollama" : "Desktop app required for AI";
    return;
  }

  aiProviderInput.disabled = false;
  aiModelInput.disabled = false;
  aiForm.querySelector("button").disabled = false;
  if (!selectedProviderId || !visibleProviders.some((provider) => provider.id === selectedProviderId)) {
    selectedProviderId = visibleProviders.find((provider) => provider.available)?.id || visibleProviders[0].id;
  }
  aiProviderInput.value = selectedProviderId;

  const provider = getSelectedProvider();
  const models = provider?.models?.length
    ? provider.models
    : provider?.kind === "cloud"
      ? [provider?.defaultModel].filter(Boolean)
      : [];
  const previousModel = getSelectedModel();
  currentModelOptions = models;
  renderModelOptions(provider, previousModel);
  const readyProviders = visibleProviders.filter((provider) => provider.available).map((provider) => provider.name);
  aiStatus.textContent = provider?.kind === "cloud" && !provider.configured
    ? `Add a ${provider.name} API key in Settings to use it.`
    : readyProviders.length ? readyProviders.join(" + ") : "Start LM Studio, Jan, or Ollama or add a cloud API key in Settings";
}

async function detectAiProviders() {
  if (!aiPanel) return;
  const barsAI = getBarsAI();
  if (!barsAI) {
    aiProviders = [];
    renderAiProviders();
    return;
  }

  aiStatus.textContent = "Detecting AI providers";
  aiAnswer.textContent = "";
  try {
    const result = await barsAI.detectProviders();
    aiProviders = result.providers || [];
    selectedProviderId = result.selectedId || selectedProviderId;
    if (result.keyStatus?.providers) {
      apiKeyStatus = API_PROVIDERS.reduce((configured, provider) => {
        configured[provider.id] = Boolean(result.keyStatus.providers.find((item) => item.id === provider.id)?.configured);
        return configured;
      }, {});
    }
  } catch (error) {
    aiProviders = [];
    aiStatus.textContent = error.message || "AI provider detection failed";
  }
  renderAiProviders();
}

function captureStreak() {
  const days = new Set(ideas.map((idea) => new Date(idea.createdAt).toDateString()));
  const cursor = new Date();
  let streak = 0;
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getFilteredIdeas() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = ideas.filter((idea) => {
    const haystack = [idea.title, idea.notes, idea.category, idea.next, idea.tags.join(" ")].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (statusValue === "all" || idea.status === statusValue);
  });

  return filtered.sort((a, b) => {
    if (sortInput.value === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (sortInput.value === "created") return new Date(b.createdAt) - new Date(a.createdAt);
    return scoreIdea(b) - scoreIdea(a);
  });
}

function render() {
  const filtered = getFilteredIdeas();
  ideaCount.textContent = `${ideas.length} ${ideas.length === 1 ? "bar" : "bars"}`;
  const inboxCount = ideas.filter((idea) => idea.status === "Inbox").length;
  quickCount.textContent = `${inboxCount} in the inbox`;

  document.querySelector("#statTotal").textContent = ideas.length;
  document.querySelector("#statInbox").textContent = inboxCount;
  document.querySelector("#statBuilding").textContent = ideas.filter((idea) => idea.status === "Building").length;
  document.querySelector("#statStreak").textContent = captureStreak();

  if (!filtered.length) {
    ideasList.innerHTML = `<div class="empty-state"><p>Nothing on this page. The best bar is the one you almost forgot — drop it up top.</p></div>`;
  } else {
    ideasList.innerHTML = filtered.map(renderIdeaCard).join("");
  }

  if (!ideas.some((idea) => idea.id === activeId)) activeId = filtered[0]?.id || null;
  renderDetail();
}

function renderIdeaCard(idea) {
  const tags = idea.tags.slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const scoreLabel = idea.status === "Inbox" ? "Inbox" : `Heat ${scoreIdea(idea)}`;
  return `
    <button class="idea-card ${idea.id === activeId ? "is-active" : ""}" type="button" data-id="${idea.id}">
      <div class="idea-card-header">
        <h3>${escapeHtml(idea.title)}</h3>
        <span class="score-pill">${scoreLabel}</span>
      </div>
      ${notesHtml(idea)}
      <div class="meta-row">
        <span class="status-pill" data-status="${escapeHtml(idea.status)}">${escapeHtml(idea.status)}</span>
        <span>${escapeHtml(idea.category || idea.kind || "Uncategorized")}</span>
        <span>${formatRelative(idea.updatedAt)}</span>
      </div>
      <div class="tag-row">${tags}</div>
    </button>
  `;
}

function notesHtml(idea) {
  if (idea.notes === idea.title) return "";
  return `<p>${escapeHtml(idea.notes || "No notes yet.")}</p>`;
}

function renderDetail() {
  const idea = ideas.find((item) => item.id === activeId);
  if (!idea) {
    detailScore.textContent = "—";
    detailContent.innerHTML = "<p>Pick a bar from the book to put it on the page.</p>";
    return;
  }

  detailScore.textContent = idea.status === "Inbox" ? "Inbox" : `Heat ${scoreIdea(idea)}`;
  if (idea.status === "Inbox") {
    detailContent.innerHTML = `
      <h3>${escapeHtml(idea.title)}</h3>
      ${notesHtml(idea)}
      <dl>
        <dt>Status</dt><dd>Inbox</dd>
        <dt>Captured</dt><dd>${formatDate(idea.createdAt)}</dd>
        <dt>Tags</dt><dd>${idea.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ") || "None"}</dd>
      </dl>
      <div class="detail-actions">
        <button class="secondary-button" type="button" data-action="promote">Turn into idea</button>
        <button class="secondary-button" type="button" data-action="edit">Edit</button>
        <button class="danger-button" type="button" data-action="delete">Delete</button>
      </div>
    `;
    return;
  }

  detailContent.innerHTML = `
    <h3>${escapeHtml(idea.title)}</h3>
    <p>${escapeHtml(idea.notes || "No notes yet.")}</p>
    <dl>
      <dt>Status</dt><dd>${escapeHtml(idea.status)}</dd>
      <dt>Category</dt><dd>${escapeHtml(idea.category || idea.kind || "Uncategorized")}</dd>
      <dt>Impact</dt><dd class="dots">${dots(idea.impact)}</dd>
      <dt>Effort</dt><dd class="dots">${dots(idea.effort)}</dd>
      <dt>Next</dt><dd>${escapeHtml(idea.next || "No next action set.")}</dd>
      <dt>Tags</dt><dd>${idea.tags.map((tag) => `#${escapeHtml(tag)}`).join(" ") || "None"}</dd>
    </dl>
    <div class="detail-actions">
      <button class="secondary-button" type="button" data-action="edit">Edit</button>
      <button class="danger-button" type="button" data-action="delete">Delete</button>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearForm() {
  form.reset();
  document.querySelector("#statusInput").value = "New";
  document.querySelector("#impactInput").value = 3;
  document.querySelector("#effortInput").value = 3;
  form.dataset.editing = "";
  const summary = writeup.querySelector("summary");
  if (summary) {
    summary.textContent = "Write one up properly";
  }
}

function fillForm(idea) {
  document.querySelector("#titleInput").value = idea.title;
  document.querySelector("#notesInput").value = idea.notes;
  document.querySelector("#categoryInput").value = idea.category;
  document.querySelector("#statusInput").value = idea.status;
  document.querySelector("#impactInput").value = idea.impact;
  document.querySelector("#effortInput").value = idea.effort;
  document.querySelector("#nextInput").value = idea.next;
  document.querySelector("#tagsInput").value = idea.tags.join(", ");
  form.dataset.editing = idea.id;
  writeup.open = true;
  const summary = writeup.querySelector("summary");
  if (summary) {
    summary.textContent = "Edit details";
  }
  document.querySelector("#titleInput").focus();
}

quickForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = quickInput.value.trim();
  if (!text) return;

  const now = new Date().toISOString();
  const title = text.length > 70 ? `${text.slice(0, 67)}...` : text;
  const idea = normalizeIdea({
    id: crypto.randomUUID(),
    kind: "Thought",
    title,
    notes: text,
    category: "Quick thought",
    status: "Inbox",
    impact: "1",
    effort: "1",
    tags: ["quick"],
    createdAt: now,
    updatedAt: now
  });

  ideas.unshift(idea);
  activeId = idea.id;
  quickInput.value = "";
  quickInput.style.height = "auto";
  saveIdeas();
  render();
});

quickInput.addEventListener("input", () => {
  quickInput.style.height = "auto";
  quickInput.style.height = `${quickInput.scrollHeight}px`;
});

quickInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") quickForm.requestSubmit();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const now = new Date().toISOString();
  const editingId = form.dataset.editing;
  const payload = {
    kind: data.get("status") === "Inbox" ? "Thought" : "Idea",
    title: data.get("title").trim(),
    notes: data.get("notes").trim(),
    category: data.get("category").trim(),
    status: data.get("status"),
    impact: data.get("impact"),
    effort: data.get("effort"),
    next: data.get("next").trim(),
    tags: normalizeTags(data.get("tags")),
    updatedAt: now
  };

  if (editingId) {
    ideas = ideas.map((idea) => idea.id === editingId ? { ...idea, ...payload } : idea);
    activeId = editingId;
  } else {
    const idea = normalizeIdea({ id: crypto.randomUUID(), ...payload, createdAt: now });
    ideas.unshift(idea);
    activeId = idea.id;
  }

  saveIdeas();
  clearForm();
  render();
});

ideasList.addEventListener("click", (event) => {
  const card = event.target.closest(".idea-card");
  if (!card) return;
  activeId = card.dataset.id;
  render();
});

detailContent.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const idea = ideas.find((item) => item.id === activeId);
  if (!action || !idea) return;

  if (action === "edit") fillForm(idea);
  if (action === "promote") {
    fillForm({ ...idea, status: "New", kind: "Idea" });
  }
  if (action === "delete") {
    ideas = ideas.filter((item) => item.id !== activeId);
    activeId = ideas[0]?.id || null;
    saveIdeas();
    render();
  }
});

[searchInput, sortInput].forEach((control) => {
  control.addEventListener("input", render);
});

statusChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  statusValue = chip.dataset.status;
  statusChips.querySelectorAll(".chip").forEach((button) => {
    button.classList.toggle("is-active", button === chip);
  });
  render();
});

resetButton.addEventListener("click", clearForm);

if (settingsButton && settingsModal) {
  settingsButton.addEventListener("click", async () => {
    await refreshApiKeyStatus();
    renderApiKeyFields();
    settingsModal.showModal();
    apiKeyFields.querySelector("input")?.focus();
  });
}

if (settingsCloseButton && settingsModal) {
  settingsCloseButton.addEventListener("click", () => settingsModal.close());
}

if (settingsModal) {
  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) settingsModal.close();
  });
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(settingsForm);
    const incoming = {};
    API_PROVIDERS.forEach((provider) => {
      incoming[provider.id] = String(data.get(provider.id) || "").trim();
    });

    try {
      if (hasDesktopKeyStorage()) {
        if (!Object.values(incoming).some(Boolean)) {
          flashSettingsState("No new keys entered");
          return;
        }
        const status = await getBarsAI().saveApiKeys(incoming);
        apiKeyStatus = API_PROVIDERS.reduce((configured, provider) => {
          configured[provider.id] = Boolean(status.providers?.find((item) => item.id === provider.id)?.configured);
          return configured;
        }, {});
        settingsForm.reset();
        flashSettingsState("Saved keys securely");
      } else {
        apiKeys = incoming;
        saveApiKeys();
        apiKeyStatus = getLocalApiKeyStatus();
        flashSettingsState("Saved keys locally");
      }
      renderApiKeyFields();
      await detectAiProviders();
    } catch (error) {
      flashSettingsState(error.message || "Could not save keys");
    }
  });
}

if (clearApiKeysButton) {
  clearApiKeysButton.addEventListener("click", async () => {
    try {
      if (hasDesktopKeyStorage()) {
        const status = await getBarsAI().clearApiKeys();
        apiKeyStatus = API_PROVIDERS.reduce((configured, provider) => {
          configured[provider.id] = Boolean(status.providers?.find((item) => item.id === provider.id)?.configured);
          return configured;
        }, {});
      } else {
        apiKeys = emptyApiKeys();
        saveApiKeys();
        apiKeyStatus = getLocalApiKeyStatus();
      }
      settingsForm.reset();
      renderApiKeyFields();
      await detectAiProviders();
      flashSettingsState("Cleared keys");
    } catch (error) {
      flashSettingsState(error.message || "Could not clear keys");
    }
  });
}

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ideas }, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `idea-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  flashSaveState(`Exported ${ideas.length} ${ideas.length === 1 ? "bar" : "bars"} ✓`);
});

if (aiProviderInput) {
  aiProviderInput.addEventListener("change", () => {
    selectedProviderId = aiProviderInput.value;
    aiModelSearchInput.value = "";
    aiModelInput.value = "";
    aiCustomModelInput.value = "";
    renderAiProviders();
  });
}

if (aiModelSearchInput) {
  aiModelSearchInput.addEventListener("input", () => {
    renderModelOptions(getSelectedProvider());
  });
}

if (aiModelInput) {
  aiModelInput.addEventListener("change", () => {
    setCustomModelVisible(aiModelInput.value === "__custom");
  });
}

if (aiRefreshButton) {
  aiRefreshButton.addEventListener("click", detectAiProviders);
}

if (aiForm) {
  aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const barsAI = getBarsAI();
    const question = aiQuestionInput.value.trim();
    const provider = getSelectedProvider();
    if (!barsAI || !question || !provider) return;

    aiAnswer.textContent = "Thinking...";
    aiForm.querySelector("button").disabled = true;
    try {
      const result = await barsAI.ask({
        providerId: provider.id,
        model: getSelectedModel(),
        question,
        ideas
      });
      aiAnswer.textContent = result.answer;
    } catch (error) {
      aiAnswer.textContent = error.message || "AI request failed.";
    } finally {
      aiForm.querySelector("button").disabled = false;
    }
  });
}

importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;
  const text = await file.text();
  const imported = JSON.parse(text);
  const incomingIdeas = Array.isArray(imported) ? imported : imported.ideas;
  if (!Array.isArray(incomingIdeas)) return;

  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  incomingIdeas.forEach((idea) => {
    const normalized = normalizeIdea(idea);
    byId.set(normalized.id, normalized);
  });
  ideas = Array.from(byId.values());
  activeId = ideas[0]?.id || null;
  saveIdeas();
  render();
  flashSaveState(`Imported ${incomingIdeas.length} ${incomingIdeas.length === 1 ? "bar" : "bars"} ✓`);
  importInput.value = "";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((bool) => {
        if (bool) {
          console.log("Service worker successfully removed.");
          window.location.reload();
        }
      });
    }
  });
}

render();
renderApiKeyFields();
migrateLocalApiKeysToDesktop()
  .catch((error) => flashSettingsState(error.message || "Could not migrate local keys"))
  .finally(detectAiProviders);
