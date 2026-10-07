import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { _electron as electron } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const appPath = process.env.MESHCRAFT_DESKTOP_APP || root;
const folder = await mkdtemp(join(tmpdir(), "meshcraft-desktop-"));
const profile = join(folder, "profile");
let desktop;
let checks = 0;
const passed = (message) => {
  checks++;
  console.log(`PASS ${message}`);
};
const errors = [];

async function launch() {
  const instance = await electron.launch({
    args: [
      appPath,
      `--meshcraft-profile=${profile}`,
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
    env: { ...process.env },
    timeout: 30000,
  });
  const page = await instance.firstWindow();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => errors.push(error.message));
  await instance.context().setOffline(true);
  await page
    .getByRole("heading", { name: "Bring your creatures to life." })
    .waitFor();
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector('[data-testid="triangle-count"]')
          ?.textContent.replaceAll(",", ""),
      ) > 0,
  );
  return { instance, page };
}

async function chooseFile(path, canceled = false) {
  await desktop.instance.evaluate(
    ({ dialog }, value) => {
      dialog.showSaveDialog = async () => ({
        canceled: value.canceled,
        filePath: value.path,
      });
    },
    { path, canceled },
  );
}

function glbJSON(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const length = bytes.readUInt32LE(12);
  return JSON.parse(bytes.toString("utf8", 20, 20 + length));
}

try {
  desktop = await launch();
  let { page } = desktop;
  assert.ok(page.url().startsWith("file:"));
  const security = await desktop.instance.evaluate(({ BrowserWindow, app }) => {
    const preferences =
      BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return {
      node: preferences.nodeIntegration,
      isolated: preferences.contextIsolation,
      sandbox: preferences.sandbox,
      profile: app.getPath("userData"),
    };
  });
  assert.deepEqual(security, {
    node: false,
    isolated: true,
    sandbox: true,
    profile,
  });
  assert.deepEqual(
    await page.evaluate(() => ({
      bridge: typeof window.meshcraftDesktop.exportFiles,
      node: typeof window.require,
    })),
    { bridge: "function", node: "undefined" },
  );
  assert.equal(await page.locator(".viewport-error").count(), 0);
  const pixels = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2"),
      data = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
    );
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 230) count++;
    return count;
  });
  assert.ok(pixels > 1000);
  passed(
    "The real Electron window loads local app files, renders WebGL offline, and isolates the native bridge",
  );

  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await page
    .getByText(
      "Install Meshcraft using the Windows installer to enable updates.",
    )
    .waitFor();
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  const rejected = await desktop.instance.evaluate(
    async ({ BrowserWindow, app }) => {
      const { join } = process.getBuiltinModule("path");
      const outsider = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: join(app.getAppPath(), "desktop/preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      try {
        await outsider.loadFile(
          join(app.getAppPath(), "release/Meshcraft.html"),
        );
        return await outsider.webContents.executeJavaScript(
          "window.meshcraftDesktop.checkForUpdates().then(() => false, () => true)",
        );
      } finally {
        outsider.destroy();
      }
    },
  );
  assert.equal(rejected, true);
  passed(
    "Uninstalled sessions never check remotely and update IPC rejects other windows",
  );

  const updateBytes = Buffer.concat([
    Buffer.from("MZ"),
    Buffer.alloc(8192, 42),
  ]);
  const updateHash = createHash("sha512").update(updateBytes).digest("base64");
  const feedServer = createServer((request, response) => {
    if (request.url.startsWith("/latest.yml"))
      response.end(
        `version: 1.4.0\nfiles:\n  - url: patch.exe\n    sha512: ${updateHash}\n    size: ${updateBytes.length}\npath: patch.exe\nsha512: ${updateHash}\n`,
      );
    else if (request.url === "/patch.exe") {
      response.setHeader("Content-Length", updateBytes.length);
      response.end(updateBytes);
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  await new Promise((resolve) => feedServer.listen(0, "127.0.0.1", resolve));
  const updateConfig = join(folder, "update-config.yml");
  await (
    await import("node:fs/promises")
  ).writeFile(updateConfig, "updaterCacheDirName: desktop-smoke-test\n");
  try {
    const result = await desktop.instance.evaluate(
      async ({ app }, { port, config }) => {
        const require = process
          .getBuiltinModule("module")
          .createRequire(app.getAppPath() + "/package.json");
        const { join } = require("node:path");
        const { NsisUpdater } = require(
          join(app.getAppPath(), "node_modules/electron-updater"),
        );
        const { createUpdateController } = require(
          join(app.getAppPath(), "desktop/updates.cjs"),
        );
        const updater = new NsisUpdater();
        Object.defineProperty(updater.app, "baseCachePath", {
          value: require("node:path").dirname(config),
        });
        updater.logger = null;
        updater.forceDevUpdateConfig = true;
        updater.updateConfigPath = config;
        updater._testOnlyOptions = {
          platform: "win32",
          isUseDifferentialDownload: false,
        };
        updater.setFeedURL({
          provider: "generic",
          url: `http://127.0.0.1:${port}/`,
        });
        const controller = createUpdateController({
          updater,
          version: app.getVersion(),
          supported: true,
          onStatus: () => {},
          confirmRestart: async () => false,
        });
        const checked = await controller.check();
        const downloaded = await controller.download();
        return {
          checked: checked.state,
          downloaded: downloaded.state,
          path: updater.installerPath,
        };
      },
      { port: feedServer.address().port, config: updateConfig },
    );
    assert.equal(result.checked, "available");
    assert.equal(result.downloaded, "ready");
    assert.deepEqual(await readFile(result.path), updateBytes);
    passed(
      "The real Electron NSIS updater uses its own session, verifies bytes, and loads packaged production dependencies",
    );
  } finally {
    feedServer.closeAllConnections();
    await new Promise((resolve) => feedServer.close(resolve));
  }

  // Exercise the real controller and preload with an injected updater, without
  // downloading or executing any installer during a graphical smoke test.
  await desktop.instance.evaluate(({ ipcMain, BrowserWindow, app, dialog }) => {
    const require = process
      .getBuiltinModule("module")
      .createRequire(app.getAppPath() + "/package.json");
    const { EventEmitter } = require("node:events");
    const { join } = require("node:path");
    const { createUpdateController } = require(
      join(app.getAppPath(), "desktop/updates.cjs"),
    );
    const window = BrowserWindow.getAllWindows()[0];
    const fake = new EventEmitter();
    globalThis.meshcraftUpdateTest = {
      fake,
      installs: 0,
      confirms: 0,
      choice: 1,
      offline: false,
    };
    const state = globalThis.meshcraftUpdateTest;
    fake.checkForUpdates = async () => {
      if (state.offline) throw Error("offline");
      fake.emit("update-available", { version: "1.4.0" });
      return {};
    };
    fake.downloadUpdate = () =>
      new Promise((resolve) => {
        state.finishDownload = resolve;
      });
    fake.quitAndInstall = () => {
      state.installs++;
    };
    dialog.showMessageBox = async () => {
      state.confirms++;
      return { response: state.choice };
    };
    const controller = createUpdateController({
      updater: fake,
      version: app.getVersion(),
      supported: true,
      onStatus: (status) =>
        window.webContents.send("meshcraft:update-status", status),
      confirmRestart: async () =>
        (await dialog.showMessageBox()).response === 0,
    });
    for (const [channel, action] of [
      ["meshcraft:update-status", "getStatus"],
      ["meshcraft:update-check", "check"],
      ["meshcraft:update-download", "download"],
      ["meshcraft:update-restart", "restart"],
    ]) {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, (event) => {
        if (
          event.sender !== window.webContents ||
          event.senderFrame !== window.webContents.mainFrame
        )
          throw Error("Untrusted update request");
        return controller[action]();
      });
    }
  });
  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Download update", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Download update", exact: true })
    .click();
  await desktop.instance.evaluate(() =>
    globalThis.meshcraftUpdateTest.fake.emit("download-progress", {
      percent: 42,
    }),
  );
  await page.getByText("42%", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  await desktop.instance.evaluate(() => {
    globalThis.meshcraftUpdateTest.fake.emit("update-downloaded", {
      version: "1.4.0",
    });
    globalThis.meshcraftUpdateTest.finishDownload([]);
  });
  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restart to update", exact: true })
    .click();
  assert.deepEqual(
    await desktop.instance.evaluate(() => ({
      installs: globalThis.meshcraftUpdateTest.installs,
      confirms: globalThis.meshcraftUpdateTest.confirms,
    })),
    { installs: 0, confirms: 1 },
  );
  passed(
    "The native update bridge shows progress and keeps working when restart is canceled",
  );
  await desktop.instance.evaluate(() => {
    globalThis.meshcraftUpdateTest.choice = 0;
  });
  await page
    .getByRole("button", { name: "Restart to update", exact: true })
    .click();
  assert.equal(
    await desktop.instance.evaluate(
      () => globalThis.meshcraftUpdateTest.installs,
    ),
    1,
  );
  assert.ok(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")),
    ),
  );
  passed(
    "Restart to update saves the current draft and installs only after native confirmation",
  );
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  await desktop.instance.evaluate(() => {
    globalThis.meshcraftUpdateTest.offline = true;
    globalThis.meshcraftUpdateTest.fake.emit("error", Error("offline"));
  });
  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "The update could not be completed" })
    .waitFor();
  await page.getByRole("button", { name: "Keep working", exact: true }).click();
  passed("An offline update error leaves the editor usable");

  await page.getByRole("button", { name: "Humans", exact: true }).click();
  await page.getByRole("tab", { name: "Face", exact: true }).click();
  await page
    .getByRole("button", { name: "Skin tone #6b422f", exact: true })
    .click();
  for (const style of ["Soft", "Defined", "Heroic", "Elegant"]) {
    await page
      .getByRole("button", { name: `${style} appearance`, exact: true })
      .click();
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("meshcraft-draft-v1")).human.skin ===
        "#6b422f",
    );
    assert.equal(
      await page
        .getByRole("tab", { name: "Face", exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
  }
  assert.equal(
    await page.getByLabel("Jaw width", { exact: true }).inputValue(),
    "0.86",
  );
  passed(
    "All four appearance presets work in the desktop editor, preserve skin tone, and leave the face editable",
  );
  await page.getByLabel("Asset name", { exact: true }).fill("Polished hero");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await chooseFile(join(folder, "Polished hero.glb"));
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: "Save GLB", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const humanGLB = glbJSON(await readFile(join(folder, "Polished hero.glb")));
  assert.equal(humanGLB.skins[0].joints.length, 19);
  assert.ok(humanGLB.animations.length >= 2);
  assert.ok(
    humanGLB.nodes.some(
      (node) =>
        node.extras?.humanSettings?.jawWidth === 0.86 &&
        node.extras.humanSettings.skin === "#6b422f",
    ),
  );
  passed(
    "Polished human GLB exports preserve customized appearance, the full skeleton, and animations",
  );
  await page.getByRole("button", { name: "Creatures", exact: true }).click();

  await page.getByRole("button", { name: "Emberfang", exact: true }).click();
  await page
    .getByRole("button", { name: "Boss proportions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Titan size (30x)", exact: true })
    .click();
  await page.getByLabel("Asset name", { exact: true }).fill("Desktop titan");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")).name ===
      "Desktop titan",
  );
  await desktop.instance.close();
  desktop = await launch();
  page = desktop.page;
  assert.equal(
    await page.getByLabel("Asset name", { exact: true }).inputValue(),
    "Desktop titan",
  );
  assert.equal(
    await page.getByLabel("Exact scale", { exact: true }).inputValue(),
    "30",
  );
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Polished hero", exact: true })
    .click();
  const savedLook = await page.evaluate(
    () => JSON.parse(localStorage.getItem("meshcraft-draft-v1")).human,
  );
  assert.equal(savedLook.skin, "#6b422f");
  assert.equal(savedLook.jawWidth, 0.86);
  assert.equal(savedLook.hair, "long");
  passed(
    "Saved polished characters retain their look and custom colors across a desktop restart",
  );
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Desktop titan", exact: true })
    .click();
  passed(
    "Giant creature drafts and collections survive closing and restarting the desktop app",
  );

  const glbPath = join(folder, "Windows boss.glb");
  await chooseFile(glbPath);
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: "Save GLB", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const gltf = glbJSON(await readFile(glbPath));
  assert.ok(gltf.skins.length > 0);
  assert.ok(gltf.animations.length >= 2);
  assert.ok(gltf.nodes.some((node) => node.scale?.[0] === 30));
  passed(
    "The native export bridge saves a real giant GLB with bones, skinning, scale, and animations",
  );

  const objPath = join(folder, "Renamed boss.obj");
  await chooseFile(objPath);
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: /^OBJ \+ MTL/ }).click();
  await page
    .getByRole("button", { name: "Save OBJ + MTL", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.match(await readFile(objPath, "utf8"), /^mtllib Renamed boss\.mtl\n/);
  assert.match(
    await readFile(join(folder, "Renamed boss.mtl"), "utf8"),
    /newmtl/,
  );
  passed(
    "One native save choice writes the OBJ and MTL together, preserving renamed material references",
  );

  const before = await readdir(folder);
  await chooseFile(join(folder, "Canceled.glb"), true);
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: /^GLB One file/ }).click();
  await page.getByRole("button", { name: "Save GLB", exact: true }).click();
  await page.waitForFunction(() => {
    const button = document.querySelector(".dialog-action");
    return button && !button.disabled;
  });
  assert.equal(await page.getByRole("dialog").count(), 1);
  assert.deepEqual(await readdir(folder), before);
  passed(
    "Canceling the native save dialog leaves the export panel open and writes no files",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Mossling", exact: true }).click();
  const heightPresets = page.getByRole("group", {
    name: "Height presets",
    exact: true,
  });
  assert.equal(await heightPresets.getByRole("button").count(), 14);
  for (const [label, height] of [
    ["Tiny", 0.15],
    ["Pet", 0.5],
    ["Nearly human", 1.5],
    ["Human-sized", 1.8],
    ["World boss", 500],
  ]) {
    await heightPresets
      .getByRole("button", { name: `${label} size (${height}m)`, exact: true })
      .click();
    await page.waitForFunction(
      (height) =>
        Math.abs(
          Number(
            document.querySelector('[aria-label="Height in meters"]').value,
          ) - height,
        ) < 0.001,
      height,
    );
  }
  await heightPresets
    .getByRole("button", { name: "Tiny size (0.15m)", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Height in meters"]').value ===
      "0.15",
  );
  const tinyScale = Number(
    await page.getByLabel("Exact scale", { exact: true }).inputValue(),
  );
  assert.ok(tinyScale < 0.25);
  await page
    .getByLabel("Asset name", { exact: true })
    .fill("Desktop pocket pal");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await chooseFile(join(folder, "Pocket pal.glb"));
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: "Save GLB", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const pocket = glbJSON(await readFile(join(folder, "Pocket pal.glb")));
  assert.ok(pocket.nodes.some((node) => node.scale?.[0] === tinyScale));
  await desktop.instance.close();
  desktop = await launch();
  page = desktop.page;
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Height in meters"]').value ===
      "0.15",
  );
  assert.equal(
    await page.getByLabel("Asset name", { exact: true }).inputValue(),
    "Desktop pocket pal",
  );
  passed(
    "All 14 height presets work on desktop; tiny sizes export and survive a full restart",
  );
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(folder, "desktop.png"), fullPage: true });
  console.log(`\n${checks} desktop checks passed. Artifacts: ${folder}`);
} finally {
  await desktop?.instance.close();
}
