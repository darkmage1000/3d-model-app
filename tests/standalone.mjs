import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const releaseFolder = fileURLToPath(new URL("../release/", import.meta.url));
assert.deepEqual(
  await readdir(releaseFolder),
  ["Meshcraft.html"],
  "The release must contain just one app file",
);
// Copy only the HTML to an unrelated folder: no repo, node_modules, or server.
const temporaryFolder = await mkdtemp(join(tmpdir(), "meshcraft-click-open-"));
const appPath = join(temporaryFolder, "Meshcraft.html");
await copyFile(join(releaseFolder, "Meshcraft.html"), appPath);
let appURL = pathToFileURL(appPath).href;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
await context.setOffline(true);
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const externalResources = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  const url = request.url();
  if (url !== appURL && !url.startsWith("data:") && !url.startsWith("blob:"))
    externalResources.push(url);
});

try {
  try {
    await page.goto(appURL);
  } catch (error) {
    if (!error.message.includes("ERR_BLOCKED_BY_ADMINISTRATOR")) throw error;
    console.log(
      "SKIP Direct file:// launch: the cloud browser's administrator policy blocks local files.",
    );
    // Respect the managed browser policy. Fulfill one document from memory,
    // with networking still disabled; this fallback does not test file-origin
    // behavior and must not be reported as a successful direct file launch.
    appURL = "http://127.0.0.1/meshcraft-standalone-test";
    const html = await readFile(appPath, "utf8");
    await page.route(appURL, (route) =>
      route.fulfill({ contentType: "text/html", body: html }),
    );
    await page.goto(appURL);
  }
  await page
    .getByRole("heading", { name: "Bring your creatures to life." })
    .waitFor();
  await page.locator("canvas").waitFor();
  await page.waitForFunction(
    () =>
      Number(
        document
          .querySelector('[data-testid="triangle-count"]')
          ?.textContent.replaceAll(",", ""),
      ) > 0,
  );
  assert.equal(await page.locator(".viewport-error").count(), 0);
  const hasModel = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2");
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 230) count++;
    return count > 1000;
  });
  assert.ok(hasModel, "The standalone app must render real geometry");
  console.log(
    "PASS The isolated HTML renders 3D offline without companion files or a network server",
  );

  await page
    .getByRole("button", { name: "Zoom in preview", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.previewZoom ===
      "1.25",
  );
  await page
    .getByRole("button", { name: "Zoom out preview", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.previewZoom ===
      "1",
  );
  console.log("PASS Preview zoom controls work in the offline app");

  await page
    .getByLabel("Describe your asset")
    .fill(
      "A detailed blue creature with antlers, bat wings, a fin tail, and three eyes",
    );
  await page
    .getByRole("button", { name: "Generate asset", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector("#primary-color")?.value === "#789bbd",
  );
  await page.getByLabel("Body plan", { exact: true }).selectOption("quadruped");
  assert.equal(
    await page.getByLabel("Horn style", { exact: true }).inputValue(),
    "antlers",
  );
  assert.equal(
    await page.getByLabel("Wing style", { exact: true }).inputValue(),
    "bat",
  );
  assert.equal(
    await page.getByLabel("Eye count", { exact: true }).inputValue(),
    "3",
  );
  await page.getByLabel("Asset name").fill("Offline guardian");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("heading", { name: "Offline guardian", exact: true })
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("heading", { name: "Offline guardian", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Open Offline guardian", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Primary color", { exact: true }).inputValue(),
    "#789bbd",
  );
  assert.equal(
    await page.getByLabel("Detail level", { exact: true }).inputValue(),
    "2",
  );
  assert.equal(
    await page.getByLabel("Body plan", { exact: true }).inputValue(),
    "quadruped",
  );
  assert.equal(
    await page.getByLabel("Tail style", { exact: true }).inputValue(),
    "fin",
  );
  console.log(
    "PASS Generation, editing, and saved collections work from the offline app file",
  );

  await page
    .getByLabel("Viewport animation", { exact: true })
    .selectOption("Walk");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.animation ===
        "Walk" &&
      Number(
        document.querySelector('[data-testid="viewport"]').dataset
          .animationTime,
      ) > 0.1,
  );
  await page
    .getByRole("button", { name: "Toggle skeleton overlay", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Show skeleton", { exact: true }).isChecked(),
    true,
  );
  await page
    .getByRole("button", { name: "Pause preview", exact: true })
    .click();
  const time = await page
    .getByTestId("viewport")
    .getAttribute("data-animation-time");
  await page.waitForTimeout(100);
  assert.equal(
    await page.getByTestId("viewport").getAttribute("data-animation-time"),
    time,
  );
  console.log(
    "PASS Rigged animation playback and skeleton controls work offline",
  );
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const glbEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const glb = await glbEvent;
  assert.equal(glb.suggestedFilename(), "offline-guardian.glb");
  const bytes = await readFile(await glb.path());
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const json = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  assert.ok(json.meshes.length >= 4 && json.materials.length >= 2);
  assert.ok(json.nodes.some((node) => node.name === "Offline guardian"));
  assert.equal(
    json.nodes.find((node) => node.name === "Offline guardian").extras.bodyPlan,
    "quadruped",
  );
  assert.equal(
    json.nodes.filter((node) => node.name.startsWith("eye_white_")).length,
    3,
  );
  assert.ok(json.nodes.some((node) => node.name.startsWith("wing_membrane")));
  assert.ok(
    json.skins.every(
      (skin) =>
        skin.joints.length > 20 && skin.inverseBindMatrices !== undefined,
    ),
  );
  assert.deepEqual(
    json.animations.map((a) => a.name),
    ["Idle", "Walk", "Fly"],
  );
  assert.ok(json.nodes.some((node) => node.name === "Rig_head"));
  assert.ok(
    json.meshes.every((mesh) =>
      mesh.primitives.every(
        (p) =>
          p.attributes.JOINTS_0 !== undefined &&
          p.attributes.WEIGHTS_0 !== undefined,
      ),
    ),
  );
  console.log(
    "PASS The offline app exports a GLB with skin weights, bones, animations, and materials",
  );

  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: /OBJ \+ MTL Two files/ }).click();
  const downloads = [];
  const listener = (download) => downloads.push(download);
  page.on("download", listener);
  await page
    .getByRole("button", { name: "Download OBJ + MTL", exact: true })
    .click();
  const deadline = Date.now() + 10000;
  while (downloads.length < 2 && Date.now() < deadline)
    await page.waitForTimeout(100);
  page.off("download", listener);
  assert.equal(downloads.length, 2);
  const obj = await readFile(
    await downloads
      .find((download) => download.suggestedFilename().endsWith(".obj"))
      .path(),
    "utf8",
  );
  const mtl = await readFile(
    await downloads
      .find((download) => download.suggestedFilename().endsWith(".mtl"))
      .path(),
    "utf8",
  );
  assert.ok(obj.startsWith("mtllib offline-guardian.mtl"));
  assert.ok(/^v /m.test(obj) && /^f /m.test(obj));
  for (const match of obj.matchAll(/^usemtl (.+)$/gm))
    assert.ok(mtl.includes(`newmtl ${match[1]}\n`));
  console.log("PASS The offline app exports OBJ and matching MTL files");
  await page.getByRole("button", { name: "Humans", exact: true }).click();
  await page.getByRole("tab", { name: "Face", exact: true }).click();
  await page.getByLabel("Skin tone", { exact: true }).fill("#6b422f");
  await page.getByLabel("Ear shape", { exact: true }).selectOption("pointed");
  await page.getByRole("tab", { name: "Hair", exact: true }).click();
  await page.getByLabel("Hairstyle", { exact: true }).selectOption("long");
  await page.getByLabel("Asset name", { exact: true }).fill("Offline hero");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Offline hero", exact: true })
    .click();
  const humanConfig = JSON.parse(
    await page.evaluate(() => localStorage.getItem("meshcraft-draft-v1")),
  );
  assert.equal(humanConfig.human.skin, "#6b422f");
  assert.equal(humanConfig.human.ears, "pointed");
  assert.equal(humanConfig.human.hair, "long");
  await page
    .getByLabel("Viewport animation", { exact: true })
    .selectOption("Walk");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.animation ===
        "Walk" &&
      Number(
        document.querySelector('[data-testid="viewport"]').dataset
          .animationTime,
      ) > 0.1,
  );
  console.log(
    "PASS Human editing, appearance persistence, and animation work offline",
  );
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const heroEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const heroBytes = await readFile(await (await heroEvent).path()),
    heroJSON = JSON.parse(
      heroBytes.toString("utf8", 20, 20 + heroBytes.readUInt32LE(12)),
    );
  const hero = heroJSON.nodes.find((n) => n.name === "Offline hero");
  assert.equal(hero.extras.kind, "procedural-human");
  assert.equal(hero.extras.humanSettings.skin, "#6b422f");
  assert.ok(heroJSON.skins.every((s) => s.joints.length === 19));
  assert.deepEqual(
    heroJSON.animations.map((a) => a.name),
    ["Idle", "Walk"],
  );
  assert.ok(heroJSON.nodes.some((n) => n.name.startsWith("elf_ear")));
  assert.ok(
    heroJSON.meshes.every((m) =>
      m.primitives.every(
        (p) =>
          p.attributes.JOINTS_0 !== undefined &&
          p.attributes.WEIGHTS_0 !== undefined,
      ),
    ),
  );
  console.log(
    "PASS Customized human GLB exports include bones, skinning, outfits, and clips offline",
  );
  await page.getByRole("button", { name: "Creatures", exact: true }).click();
  await page
    .getByRole("button", { name: "Giant size (10x)", exact: true })
    .click();
  await page.getByLabel("Asset name", { exact: true }).fill("Offline giant");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Offline giant", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Scale", { exact: true }).inputValue(),
    "10",
  );
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const giantEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const giantBytes = await readFile(await (await giantEvent).path()),
    giantJSON = JSON.parse(
      giantBytes.toString("utf8", 20, 20 + giantBytes.readUInt32LE(12)),
    );
  const giantNode = giantJSON.nodes.find((n) => n.name === "Offline giant");
  assert.equal(giantNode.scale[0], 10);
  assert.equal(giantNode.extras.rigged, true);
  assert.ok(giantJSON.skins.length > 0);
  assert.ok(giantJSON.animations.length >= 2);
  console.log(
    "PASS Giant creature sizes persist and export with animated rigs offline",
  );
  assert.deepEqual(errors, [], "No uncaught exceptions are allowed");
  assert.deepEqual(
    externalResources,
    [],
    "No companion files or network resources may be requested",
  );
  console.log("\n9 standalone app checks passed.");
} finally {
  await browser.close();
}
