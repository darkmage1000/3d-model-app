const { build, Platform, Arch } = require("electron-builder");
const { basename, dirname, join, resolve } = require("node:path");
const config = require("../electron-builder.config.cjs");
const { prepareUpdateFeed } = require("./prepare-update-feed.cjs");

// electron-builder 26.15.3 normally executes a temporary NSIS stub in Wine
// to obtain its uninstaller. Its bundled Linux Wine lacks the 32-bit DLLs
// required by that stub. Use the same native extractor electron-builder
// already uses on macOS, retaining its normal NSIS compilation and signing flow.
if (process.platform === "linux") {
  const { WineVmManager } = require("app-builder-lib/out/vm/WineVm.js");
  const {
    UninstallerReader,
  } = require("app-builder-lib/out/targets/nsis/nsisUtil.js");
  const output = resolve(__dirname, "..", config.directories.output);
  WineVmManager.prototype.execWine = async ({ file }) => {
    if (
      dirname(resolve(file)) !== output ||
      !basename(file).startsWith("Meshcraft-Setup-") ||
      !file.endsWith(".exe")
    )
      throw new Error(
        "The native build helper only supports Meshcraft's temporary NSIS installer.",
      );
    const uninstaller = join(
      output,
      `${basename(file, "exe")}__uninstaller.exe`,
    );
    await UninstallerReader.exec(file, uninstaller);
    console.log(
      "  • extracted NSIS uninstaller natively; no Wine runtime required",
    );
    return "";
  };
}

const installerOnly = process.argv.includes("--installer-only");
build({
  projectDir: resolve(__dirname, ".."),
  config,
  // Release assets and update metadata are published together by the workflow.
  publish: "never",
  targets: Platform.WINDOWS.createTarget(
    installerOnly ? ["nsis"] : ["nsis", "zip"],
    Arch.x64,
  ),
  ...(process.argv.includes("--prepackaged") && {
    prepackaged: resolve(
      __dirname,
      "..",
      config.directories.output,
      "win-unpacked",
    ),
  }),
})
  .then((artifacts) => {
    // Versioned download URLs stay valid if another release is published later.
    // They also let the updater find the previous release's differential blockmap.
    prepareUpdateFeed(
      resolve(__dirname, "..", config.directories.output),
      require("../package.json").version,
    );
    console.log(`\nWindows downloads:\n${artifacts.join("\n")}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
