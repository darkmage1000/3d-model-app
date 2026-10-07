module.exports = {
  appId: "com.meshcraft.studio",
  productName: "Meshcraft",
  directories: { output: "desktop-release", buildResources: "desktop" },
  files: [
    "desktop/*.cjs",
    "desktop/icon.png",
    "release/Meshcraft.html",
    "package.json",
    "!node_modules{,/**/*}",
  ],
  asar: true,
  npmRebuild: false,
  ...(process.env.MESHCRAFT_ELECTRON_CACHE && {
    electronDownload: { cache: process.env.MESHCRAFT_ELECTRON_CACHE },
  }),
  win: {
    target: ["nsis", "zip"],
    icon: "desktop/icon.ico",
    // Apply Meshcraft branding while building without a signing certificate.
    signExecutable: false,
    artifactName: "Meshcraft-${version}-Windows-${arch}.${ext}",
  },
  nsis: {
    artifactName: "Meshcraft-Setup-${version}-Windows-${arch}.${ext}",
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Meshcraft",
    runAfterFinish: true,
    deleteAppDataOnUninstall: false,
    installerIcon: "desktop/icon.ico",
    uninstallerIcon: "desktop/icon.ico",
  },
};
