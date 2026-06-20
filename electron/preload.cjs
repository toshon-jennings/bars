const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("barsAI", {
  detectProviders: () => ipcRenderer.invoke("bars-ai:detect"),
  ask: (payload) => ipcRenderer.invoke("bars-ai:ask", payload),
  getApiKeyStatus: () => ipcRenderer.invoke("bars-ai:get-api-key-status"),
  saveApiKeys: (payload) => ipcRenderer.invoke("bars-ai:save-api-keys", payload),
  clearApiKeys: () => ipcRenderer.invoke("bars-ai:clear-api-keys")
});
