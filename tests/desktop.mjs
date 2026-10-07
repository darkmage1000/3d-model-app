import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(folder, "desktop.png"), fullPage: true });
  console.log(`\n${checks} desktop checks passed. Artifacts: ${folder}`);
} finally {
  await desktop?.instance.close();
}
