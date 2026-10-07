const { contextBridge, ipcRenderer } = require("electron");

// Keep Node, update feeds, installers, and the filesystem out of the renderer.
function subscribe(channel, callback) {
  if (typeof callback !== "function")
    throw new TypeError("A callback is required.");
  const listener = (_event, value) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}
contextBridge.exposeInMainWorld("meshcraftDesktop", {
  exportFiles: (files) => ipcRenderer.invoke("meshcraft:export", files),
  getUpdateStatus: () => ipcRenderer.invoke("meshcraft:update-status"),
  checkForUpdates: () => ipcRenderer.invoke("meshcraft:update-check"),
  downloadUpdate: () => ipcRenderer.invoke("meshcraft:update-download"),
  restartToUpdate: () => ipcRenderer.invoke("meshcraft:update-restart"),
  onUpdateStatus: (callback) => subscribe("meshcraft:update-status", callback),
  onShowUpdates: (callback) => subscribe("meshcraft:show-updates", callback),
});
