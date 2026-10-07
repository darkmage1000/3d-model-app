const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
} = require("electron");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const { saveModelFiles } = require("./export-files.cjs");

app.setName("Meshcraft");
// An explicit profile is useful for isolated smoke tests and does not affect normal installs.
const profileArgument = process.argv.find((arg) =>
  arg.startsWith("--meshcraft-profile="),
);
if (profileArgument)
  app.setPath("userData", profileArgument.slice("--meshcraft-profile=".length));

let mainWindow;
const htmlPath = join(__dirname, "..", "release", "Meshcraft.html");
const appURL = pathToFileURL(htmlPath).href;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Meshcraft",
    width: 1440,
    height: 1000,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#f5f7f2",
    icon: join(__dirname, "icon.png"),
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== appURL) event.preventDefault();
  });
  const session = mainWindow.webContents.session;
  session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  session.setPermissionCheckHandler(() => false);
  session.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  mainWindow.loadFile(htmlPath).catch((error) => {
    dialog.showErrorBox("Meshcraft could not open", error.message);
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    ipcMain.handle("meshcraft:export", async (event, files) => {
      if (
        !mainWindow ||
        event.sender !== mainWindow.webContents ||
        event.senderFrame !== mainWindow.webContents.mainFrame ||
        event.senderFrame.url !== appURL
      )
        throw new Error("Export is only available in the Meshcraft editor.");
      return saveModelFiles(files, (name, format) =>
        dialog.showSaveDialog(mainWindow, {
          title:
            format === "glb" ? "Export GLB model" : "Export OBJ and MTL files",
          defaultPath: join(app.getPath("downloads"), name),
          filters: [
            {
              name:
                format === "glb" ? "Binary glTF model" : "Wavefront OBJ model",
              extensions: [format],
            },
          ],
          properties: ["createDirectory", "showOverwriteConfirmation"],
        }),
      );
    });
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: "File",
          submenu: [
            {
              label: "Open exports folder",
              click: () => shell.openPath(app.getPath("downloads")),
            },
            { type: "separator" },
            { role: "quit" },
          ],
        },
        { role: "editMenu" },
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
          ],
        },
        {
          label: "Help",
          submenu: [
            {
              label: "About Meshcraft",
              click: () =>
                dialog.showMessageBox(mainWindow, {
                  type: "info",
                  title: "Meshcraft",
                  message: `Meshcraft ${app.getVersion()}`,
                  detail:
                    "Create and rig low-poly videogame creatures, humans, and props. Works offline; collections are stored on this computer.",
                }),
            },
          ],
        },
      ]),
    );
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
