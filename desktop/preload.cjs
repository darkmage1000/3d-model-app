const { contextBridge, ipcRenderer } = require("electron");

// Keep Node and the filesystem out of the renderer. Only model export is exposed.
contextBridge.exposeInMainWorld("meshcraftDesktop", {
  exportFiles: (files) => ipcRenderer.invoke("meshcraft:export", files),
});
