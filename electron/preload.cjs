const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("barsAI", {
  detectProviders: () => ipcRenderer.invoke("bars-ai:detect"),
  ask: (payload) => ipcRenderer.invoke("bars-ai:ask", payload)
});
