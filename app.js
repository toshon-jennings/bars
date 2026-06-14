const STORAGE_KEY = "idea-tracker:v1";
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

let ideas = loadIdeas();
let activeId = ideas[0]?.id || null;
let statusValue = "all";

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
