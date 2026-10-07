import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

// Use the cloud's installed browser. Override for a different machine or installed Playwright browser.
const executablePath = process.env.CHROMIUM_PATH || "/usr/bin/chromium";
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
const output = await mkdtemp(join(tmpdir(), "meshcraft-browser-"));
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const errors = [];
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(20000);
page.on("pageerror", (error) => errors.push(error.message));
let checks = 0;
function passed(message) {
  checks++;
  console.log(`PASS ${message}`);
}

try {
  await page.goto(baseURL);
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
  const opaqueCoverage = () =>
    page.locator("canvas").evaluate((canvas) => {
      const gl = canvas.getContext("webgl2"),
        pixels = new Uint8Array(canvas.width * canvas.height * 4);
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
      return count;
    });
  const coverageBefore = await opaqueCoverage();
  assert.ok(coverageBefore > 1000, "Expected visible opaque mesh geometry");
  passed("3D scene renders actual geometry");
  const exportedSizeBefore = await page.locator(".dimensions").textContent();
  await page
    .getByRole("button", { name: "Zoom in preview", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.previewZoom ===
      "1.25",
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.ok(
    (await opaqueCoverage()) > coverageBefore * 1.1,
    "Zoom must make actual rendered geometry larger",
  );
  assert.equal(
    await page.locator(".dimensions").textContent(),
    exportedSizeBefore,
    "Preview zoom preserves model dimensions",
  );
  await page
    .getByRole("button", { name: "Fit model to view", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.previewZoom ===
      "1",
  );
  await page
    .getByRole("button", { name: "Zoom in preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.previewZoom ===
      "1",
  );
  passed(
    "Preview zoom enlarges rendered geometry, preserves model dimensions, and resets correctly",
  );

  await page.screenshot({ path: join(output, "desktop.png"), fullPage: true });

  await page.getByRole("button", { name: "World props", exact: true }).click();
  for (const name of ["Shield", "Tree", "Rock", "Chest", "Potion", "Sword"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(
      () =>
        Number(
          document
            .querySelector('[data-testid="triangle-count"]')
            ?.textContent.replaceAll(",", ""),
        ) > 0,
    );
  }
  passed("All six templates open in the viewport");

  await page.getByLabel("Describe your asset").fill("A detailed purple potion");
  await page
    .getByRole("button", { name: "Generate asset", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector("#primary-color")?.value === "#a08bb7",
  );
  assert.equal(
    await page.getByLabel("Detail level", { exact: true }).inputValue(),
    "2",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Potion", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  passed("Prompt generation applies the template, color, and detail");

  await page.getByLabel("Describe your asset").fill("A spaceship");
  await page
    .getByRole("button", { name: "Generate asset", exact: true })
    .click();
  await page
    .getByText("Try a human, knight, mage, elf, creature,", {
      exact: false,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Potion", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  passed("Unsupported prompts explain the available templates");

  await page.getByLabel("Asset name").fill("Test elixir");
  await page.getByLabel("Exact scale", { exact: true }).fill("2");
  await page.getByLabel("Exact scale", { exact: true }).press("Enter");
  await page
    .getByRole("button", { name: "Wireframe view", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Wireframe view", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Solid view", exact: true }).click();
  await page.getByRole("button", { name: "Toggle grid", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Toggle grid", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  await page.getByRole("button", { name: "Auto rotate", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause rotation", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  passed("Geometry and viewport controls respond");

  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("heading", { name: "Test elixir", exact: true })
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("heading", { name: "Test elixir", exact: true })
    .waitFor();
  await page.getByLabel("Search your collection").fill("missing");
  await page.getByRole("heading", { name: "No assets found" }).waitFor();
  await page.getByLabel("Search your collection").fill("");
  await page
    .getByRole("button", { name: "Open Test elixir", exact: true })
    .click();
  assert.equal(await page.getByLabel("Asset name").inputValue(), "Test elixir");
  assert.equal(
    await page
      .getByLabel("Scale", { exact: true })
      .getAttribute("aria-valuenow"),
    "2",
  );
  passed(
    "Collection saves, survives reload, searches, and restores model settings",
  );

  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const glbDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const glb = await glbDownload;
  assert.equal(glb.suggestedFilename(), "test-elixir.glb");
  const buffer = await readFile(await glb.path());
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonSize = buffer.readUInt32LE(12);
  const document = JSON.parse(buffer.toString("utf8", 20, 20 + jsonSize));
  assert.ok(document.meshes.length >= 4);
  assert.ok(document.materials.length >= 3);
  assert.ok(
    document.accessors.some(
      (accessor) => accessor.type === "VEC3" && accessor.count > 20,
    ),
  );
  assert.ok(
    document.nodes.some(
      (node) =>
        node.name === "Test elixir" &&
        (node.scale?.[0] === 2 || node.matrix?.[0] === 2),
    ),
  );
  // Load the download with Three.js to validate the real file, not just its header.
  const roundtrip = await page.evaluate(async (base64) => {
    const { GLTFLoader } =
      await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const model = await new GLTFLoader().parseAsync(bytes.buffer, "");
    let meshes = 0,
      triangles = 0;
    model.scene.traverse((node) => {
      if (node.isMesh) {
        meshes++;
        triangles +=
          (node.geometry.index?.count ||
            node.geometry.attributes.position.count) / 3;
      }
    });
    return { meshes, triangles, scale: model.scene.children[0]?.scale.x };
  }, buffer.toString("base64"));
  assert.ok(roundtrip.meshes >= 4 && roundtrip.triangles > 100);
  assert.equal(roundtrip.scale, 2);
  passed(
    "GLB download preserves geometry, colors, name, scale, and round-trips through GLTFLoader",
  );

  await page.getByRole("button", { name: "Export model", exact: true }).click();
  await page.getByRole("button", { name: /OBJ \+ MTL Two files/ }).click();
  const downloads = [];
  const handler = (download) => downloads.push(download);
  page.on("download", handler);
  await page
    .getByRole("button", { name: "Download OBJ + MTL", exact: true })
    .click();
  const deadline = Date.now() + 10000;
  while (downloads.length < 2 && Date.now() < deadline)
    await page.waitForTimeout(100);
  page.off("download", handler);
  assert.equal(downloads.length, 2);
  const objDownload = downloads.find((d) =>
    d.suggestedFilename().endsWith(".obj"),
  );
  const mtlDownload = downloads.find((d) =>
    d.suggestedFilename().endsWith(".mtl"),
  );
  const obj = await readFile(await objDownload.path(), "utf8");
  const mtl = await readFile(await mtlDownload.path(), "utf8");
  assert.ok(obj.startsWith("mtllib test-elixir.mtl"));
  assert.ok(
    /^v /m.test(obj) &&
      /^vn /m.test(obj) &&
      /^vt /m.test(obj) &&
      /^f /m.test(obj),
  );
  const materialReferences = [...obj.matchAll(/^usemtl (.+)$/gm)].map(
    (match) => match[1],
  );
  assert.ok(materialReferences.length >= 4);
  for (const name of materialReferences)
    assert.ok(mtl.includes(`newmtl ${name}\n`), `MTL is missing ${name}`);
  passed(
    "OBJ and MTL downloads contain geometry, UVs, normals, and matching materials",
  );

  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Delete Test elixir", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep asset", exact: true }).click();
  await page
    .getByRole("heading", { name: "Test elixir", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Delete Test elixir", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove asset", exact: true }).click();
  await page
    .getByRole("heading", { name: "A new world starts with one asset." })
    .waitFor();
  passed("Collection deletion is confirmed and persisted");

  await page.getByRole("button", { name: "Export guide", exact: true }).click();
  for (const name of ["Unity", "Unreal Engine", "Godot"])
    await page.getByRole("heading", { name, exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Back to studio", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Mobile layout must not overflow",
  );
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("heading", { name: "My collection.", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Create an asset", exact: true })
    .click();
  await page.screenshot({ path: join(output, "mobile.png"), fullPage: true });
  passed("Engine guide and mobile navigation work without horizontal overflow");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Creatures", exact: true }).click();
  for (const name of [
    "Mossling",
    "Emberfang",
    "Tidewhisk",
    "Cragback",
    "Skyplume",
    "Riftwyrm",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    assert.equal(await page.getByLabel("Asset name").inputValue(), name);
    await page.waitForFunction(
      (expected) =>
        JSON.parse(localStorage.getItem("meshcraft-draft-v1"))?.name ===
        expected,
      name,
    );
    assert.equal(await page.locator(".viewport-error").count(), 0);
  }
  passed("Six creature species open with persisted anatomy and live meshes");

  await page
    .getByLabel("Describe your asset")
    .fill(
      "A cute purple rabbit with antlers, crystal wings, a fin tail, and three eyes",
    );
  await page
    .getByRole("button", { name: "Generate asset", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelector("#primary-color")?.value === "#a08bb7",
  );
  assert.equal(
    await page.getByLabel("Horn style", { exact: true }).inputValue(),
    "antlers",
  );
  assert.equal(
    await page.getByLabel("Wing style", { exact: true }).inputValue(),
    "crystal",
  );
  assert.equal(
    await page.getByLabel("Tail style", { exact: true }).inputValue(),
    "fin",
  );
  assert.equal(
    await page.getByLabel("Eye count", { exact: true }).inputValue(),
    "3",
  );
  assert.equal(
    await page.getByLabel("Body plan", { exact: true }).inputValue(),
    "biped",
  );
  passed("Creature prompts combine species, features, colors, and eye counts");

  for (const [field, value] of [
    ["Body plan", "quadruped"],
    ["Ear style", "round"],
    ["Horn style", "small"],
    ["Wing style", "bat"],
    ["Tail style", "curled"],
    ["Back details", "spikes"],
    ["Body pattern", "spots"],
    ["Element", "frost"],
  ]) {
    await page.getByLabel(field, { exact: true }).selectOption(value);
    assert.equal(
      await page.getByLabel(field, { exact: true }).inputValue(),
      value,
    );
  }
  for (const [field, value] of [
    ["Head size", "1.35"],
    ["Body width", "1.25"],
    ["Leg length", "0.8"],
    ["Snout length", "0.9"],
    ["Temperament", "0.95"],
  ]) {
    await page.getByLabel(field, { exact: true }).fill(value);
    assert.equal(
      await page.getByLabel(field, { exact: true }).inputValue(),
      value,
    );
  }
  await page.getByLabel("Body plan", { exact: true }).selectOption("orb");
  assert.equal(
    await page.getByLabel("Leg length", { exact: true }).isDisabled(),
    true,
  );
  await page.getByLabel("Asset name").fill("Frost oddling");
  assert.equal(
    await page.getByLabel("Primary color", { exact: true }).inputValue(),
    "#a0c4d1",
  );
  passed(
    "Anatomy, proportions, element palette, and temperament controls change the creature",
  );

  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page.getByRole("button", { name: "Creatures", exact: true }).click();
  await page
    .getByRole("heading", { name: "Frost oddling", exact: true })
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Frost oddling", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Body plan", { exact: true }).inputValue(),
    "orb",
  );
  assert.equal(
    await page.getByLabel("Wing style", { exact: true }).inputValue(),
    "bat",
  );
  assert.equal(
    await page.getByLabel("Tail style", { exact: true }).inputValue(),
    "curled",
  );
  assert.equal(
    await page.getByLabel("Head size", { exact: true }).inputValue(),
    "1.35",
  );
  assert.equal(
    await page.getByLabel("Temperament", { exact: true }).inputValue(),
    "0.95",
  );
  passed(
    "Creature collection entries preserve edited anatomy through reload and category filtering",
  );

  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const creatureDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const creatureDownload = await creatureDownloadEvent;
  const creatureBytes = await readFile(await creatureDownload.path());
  const creatureJSON = JSON.parse(
    creatureBytes.toString("utf8", 20, 20 + creatureBytes.readUInt32LE(12)),
  );
  assert.equal(creatureDownload.suggestedFilename(), "frost-oddling.glb");
  const root = creatureJSON.nodes.find((node) => node.name === "Frost oddling");
  assert.equal(root.extras.bodyPlan, "orb");
  assert.equal(root.extras.element, "frost");
  assert.equal(root.extras.rigged, true);
  assert.ok(creatureJSON.skins.length >= 1);
  assert.ok(
    creatureJSON.skins.every(
      (skin) =>
        skin.joints.length === root.extras.boneCount &&
        skin.inverseBindMatrices !== undefined,
    ),
  );
  assert.deepEqual(
    creatureJSON.animations.map((a) => a.name),
    ["Idle", "Bounce", "Fly"],
  );
  assert.ok(
    creatureJSON.meshes.every((mesh) =>
      mesh.primitives.every(
        (p) =>
          p.attributes.JOINTS_0 !== undefined &&
          p.attributes.WEIGHTS_0 !== undefined,
      ),
    ),
  );
  for (const prefix of [
    "wing_membrane",
    "tail",
    "fang",
    "back_spikes",
    "eye_white",
  ])
    assert.ok(
      creatureJSON.nodes.some((node) => node.name.startsWith(prefix)),
      `Export is missing ${prefix}`,
    );
  const creatureRoundtrip = await page.evaluate(async (base64) => {
    const { GLTFLoader } =
      await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    );
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
    const { AnimationMixer, Vector3 } =
      await import("/node_modules/three/build/three.module.js");
    let meshes = 0,
      skins = 0,
      eye;
    gltf.scene.traverse((node) => {
      if (node.isMesh) meshes++;
      if (node.isSkinnedMesh) skins++;
      if (node.name === "pupil_0") eye = node;
    });
    gltf.scene.updateMatrixWorld(true);
    const before = eye
      .getVertexPosition(40, new Vector3())
      .applyMatrix4(eye.matrixWorld);
    const mixer = new AnimationMixer(gltf.scene);
    const clip = gltf.animations.find((c) => c.name === "Bounce");
    mixer.clipAction(clip).play();
    mixer.update(clip.duration * 0.25);
    gltf.scene.updateMatrixWorld(true);
    eye.skeleton.update();
    const after = eye
      .getVertexPosition(40, new Vector3())
      .applyMatrix4(eye.matrixWorld);
    return {
      meshes,
      skins,
      displacement: before.distanceTo(after),
      bodyPlan: gltf.scene.children[0].userData.bodyPlan,
    };
  }, creatureBytes.toString("base64"));
  assert.ok(creatureRoundtrip.meshes > 20);
  assert.equal(creatureRoundtrip.bodyPlan, "orb");
  assert.equal(creatureRoundtrip.skins, creatureRoundtrip.meshes);
  assert.ok(creatureRoundtrip.displacement > 0.02);
  passed(
    "Customized GLB re-imports real skinning, bones, and clips with verified vertex deformation",
  );

  await page.getByLabel("Show skeleton", { exact: true }).check();
  await page.getByRole("button", { name: "Bounce", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.animation ===
        "Bounce" &&
      Number(
        document.querySelector('[data-testid="viewport"]').dataset
          .animationTime,
      ) > 0.1,
  );
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  const pausedTime = await page
    .getByTestId("viewport")
    .getAttribute("data-animation-time");
  await page.waitForTimeout(180);
  assert.equal(
    await page.getByTestId("viewport").getAttribute("data-animation-time"),
    pausedTime,
  );
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await page.waitForFunction(
    (previous) =>
      document.querySelector('[data-testid="viewport"]').dataset
        .animationTime !== previous,
    pausedTime,
  );
  await page
    .getByLabel("Selected joint", { exact: true })
    .selectOption("Rig_head");
  await page.getByLabel("Y joint rotation", { exact: true }).fill("35");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset.animation ===
      "Rest",
  );
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector('select[aria-label="Selected joint"]')?.value ===
      "Rig_head",
  );
  assert.equal(
    await page.getByLabel("Y joint rotation", { exact: true }).inputValue(),
    "35",
  );
  assert.equal(
    JSON.parse(
      await page.evaluate(() => localStorage.getItem("meshcraft-draft-v1")),
    ).rig.pose.Rig_head[1],
    35,
  );
  passed(
    "Animation playback, pause/resume, skeleton overlay, and persisted joint poses work",
  );
  await page.getByLabel("Asset name", { exact: true }).fill("Posed oddling");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Posed oddling", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('select[aria-label="Selected joint"]')?.value ===
      "Rig_head",
  );
  assert.equal(
    await page.getByLabel("Y joint rotation", { exact: true }).inputValue(),
    "35",
  );
  passed("Saved collections preserve the creature joint pose");
  await page.getByLabel("Auto rig", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const staticEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const staticBytes = await readFile(await (await staticEvent).path());
  const staticJSON = JSON.parse(
    staticBytes.toString("utf8", 20, 20 + staticBytes.readUInt32LE(12)),
  );
  assert.equal(staticJSON.skins, undefined);
  assert.equal(staticJSON.animations, undefined);
  passed("Auto rig can be disabled to export a static creature");
  await page.getByLabel("Auto rig", { exact: true }).check();
  await page.getByRole("button", { name: "Surprise me", exact: true }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")).name !==
      "Frost oddling",
  );
  assert.ok(await page.getByLabel("Body plan", { exact: true }).inputValue());
  assert.equal(await page.locator(".viewport-error").count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.getByLabel("Wing style", { exact: true }).selectOption("crystal");
  await page.screenshot({
    path: join(output, "creature-mobile.png"),
    fullPage: true,
  });
  passed(
    "Surprise generation and mobile creature editing work without horizontal overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Humans", exact: true }).click();
  await page.getByRole("heading", { name: "Build your next hero." }).waitFor();
  for (const name of [
    "Knight",
    "Mage",
    "Rogue",
    "Traveler",
    "Citizen",
    "Ranger",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")).type.startsWith(
        "human-",
      ),
    );
  }
  assert.equal(
    await page
      .getByRole("tab", { name: "Body", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  passed("Six original human archetypes open with a full character editor");
  await page.getByLabel("Height", { exact: true }).fill("1.15");
  await page.getByLabel("Shoulder width", { exact: true }).fill("1.3");
  await page.getByLabel("Character pose", { exact: true }).selectOption("t");
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")).rig.pose
        .Rig_arm_L_upper[2] === -71,
  );
  await page.getByRole("tab", { name: "Face", exact: true }).click();
  assert.equal(
    await page.getByLabel("Character view", { exact: true }).inputValue(),
    "face",
  );
  await page.getByLabel("Jaw width", { exact: true }).fill("0.8");
  await page.getByLabel("Ear shape", { exact: true }).selectOption("pointed");
  await page.getByLabel("Expression", { exact: true }).selectOption("smile");
  await page.getByLabel("Freckles", { exact: true }).check();
  await page.getByLabel("Skin tone", { exact: true }).fill("#88583e");
  passed(
    "Human proportions, T-pose, face sliders, skin tone, and elf ears are editable",
  );
  await page.getByRole("tab", { name: "Hair", exact: true }).click();
  await page.getByLabel("Hairstyle", { exact: true }).selectOption("braids");
  await page.getByLabel("Hair length", { exact: true }).fill("1.25");
  await page.getByLabel("Hair color", { exact: true }).fill("#d7b56f");
  await page.getByRole("tab", { name: "Outfit", exact: true }).click();
  await page.getByLabel("Top style", { exact: true }).selectOption("jacket");
  await page.getByLabel("Sleeve length", { exact: true }).selectOption("long");
  await page.getByLabel("Top color", { exact: true }).fill("#789bbd");
  assert.equal(
    await page.getByLabel("Primary color", { exact: true }).inputValue(),
    "#789bbd",
  );
  await page.getByRole("tab", { name: "Accessories", exact: true }).click();
  await page.getByLabel("Eyewear", { exact: true }).selectOption("square");
  await page.getByLabel("Earrings", { exact: true }).selectOption("hoops");
  await page.getByLabel("Headwear", { exact: true }).selectOption("crown");
  await page.getByLabel("Shoulder armor", { exact: true }).check();
  await page.getByLabel("Accessory color", { exact: true }).fill("#e5bb68");
  assert.equal(
    await page.getByLabel("Accent color", { exact: true }).inputValue(),
    "#e5bb68",
  );
  passed(
    "Hair, outfits, accessories, and shared palette edits update the human",
  );
  await page.getByLabel("Asset name", { exact: true }).fill("Golden scout");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page.getByRole("button", { name: "Humans", exact: true }).click();
  assert.equal(
    await page
      .getByRole("heading", { name: "Golden scout", exact: true })
      .count(),
    1,
  );
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page.getByRole("button", { name: "Humans", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Golden scout", exact: true })
    .click();
  await page.getByRole("tab", { name: "Hair", exact: true }).click();
  assert.equal(
    await page.getByLabel("Hairstyle", { exact: true }).inputValue(),
    "braids",
  );
  assert.equal(
    await page.getByLabel("Hair color", { exact: true }).inputValue(),
    "#d7b56f",
  );
  const savedHuman = JSON.parse(
    await page.evaluate(() => localStorage.getItem("meshcraft-draft-v1")),
  );
  assert.equal(savedHuman.human.height, 1.15);
  assert.equal(savedHuman.human.glasses, "square");
  assert.equal(savedHuman.rig.pose.Rig_arm_L_upper[2], -71);
  passed(
    "Human collection filtering and reload preserve the complete appearance and rig pose",
  );
  await page.getByLabel("Character view", { exact: true }).selectOption("full");
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
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const humanEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const humanDownload = await humanEvent,
    humanBytes = await readFile(await humanDownload.path());
  const humanJSON = JSON.parse(
    humanBytes.toString("utf8", 20, 20 + humanBytes.readUInt32LE(12)),
  );
  const humanRoot = humanJSON.nodes.find((n) => n.name === "Golden scout");
  assert.equal(humanDownload.suggestedFilename(), "golden-scout.glb");
  assert.equal(humanRoot.extras.kind, "procedural-human");
  assert.equal(humanRoot.extras.rigged, true);
  assert.equal(humanRoot.extras.humanSettings.hair, "braids");
  assert.equal(humanRoot.extras.humanSettings.topColor, "#789bbd");
  assert.equal(humanRoot.extras.boneCount, 19);
  assert.deepEqual(
    humanJSON.animations.map((a) => a.name),
    ["Idle", "Walk"],
  );
  for (const prefix of [
    "hair_tail",
    "glasses",
    "elf_ear",
    "crown",
    "sleeve",
    "pauldron",
  ])
    assert.ok(humanJSON.nodes.some((n) => n.name.startsWith(prefix)));
  const humanLoaded = await page.evaluate(async (b64) => {
    const { GLTFLoader } =
      await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { AnimationMixer, Vector3 } =
      await import("/node_modules/three/build/three.module.js");
    const gltf = await new GLTFLoader().parseAsync(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer,
      "",
    );
    const meshes = [];
    gltf.scene.traverse((n) => {
      if (n.isSkinnedMesh) meshes.push(n);
    });
    gltf.scene.updateMatrixWorld(true);
    const sleeve = meshes.find((n) => n.name === "sleeve_L"),
      before = sleeve
        .getVertexPosition(20, new Vector3())
        .applyMatrix4(sleeve.matrixWorld);
    const mixer = new AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations.find((c) => c.name === "Walk")).play();
    mixer.update(0.35);
    gltf.scene.updateMatrixWorld(true);
    sleeve.skeleton.update();
    const after = sleeve
      .getVertexPosition(20, new Vector3())
      .applyMatrix4(sleeve.matrixWorld);
    return {
      meshes: meshes.length,
      displacement: before.distanceTo(after),
      boneNames: sleeve.skeleton.bones.map((b) => b.name),
    };
  }, humanBytes.toString("base64"));
  assert.ok(humanLoaded.meshes > 40);
  assert.ok(humanLoaded.displacement > 0.002);
  assert.ok(humanLoaded.boneNames.includes("Rig_head"));
  passed(
    "Customized human GLB reloads with skinning and actual animated clothing deformation",
  );
  await page.getByRole("tab", { name: "Body", exact: true }).click();
  await page
    .getByLabel("Character pose", { exact: true })
    .selectOption("relaxed");
  await page
    .getByRole("button", { name: "Randomize look", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("meshcraft-draft-v1")).name !==
      "Golden scout",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Accessories", exact: true }).click();
  await page.getByLabel("Headwear", { exact: true }).selectOption("hood");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.screenshot({
    path: join(output, "human-mobile.png"),
    fullPage: true,
  });
  passed(
    "Human randomization and mobile customization work without horizontal overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Creatures", exact: true }).click();
  await page.getByRole("button", { name: "Emberfang", exact: true }).click();
  await page
    .getByRole("button", { name: "Giant size (10x)", exact: true })
    .click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("meshcraft-draft-v1")).scale === 10,
  );
  assert.equal(
    await page
      .getByLabel("Scale", { exact: true })
      .getAttribute("aria-valuenow"),
    "10",
  );
  await page.getByLabel("Height in meters", { exact: true }).fill("25");
  // A pending preview update must not replace a height the user is entering.
  const beforeDetail = await page
    .locator('[data-testid="triangle-count"]')
    .textContent();
  await page.getByLabel("Detail level", { exact: true }).evaluate((input) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, input.value === "2" ? "1" : "2");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForFunction(
    (previous) =>
      document.querySelector('[data-testid="triangle-count"]').textContent !==
      previous,
    beforeDetail,
  );
  assert.equal(
    await page.getByLabel("Height in meters", { exact: true }).inputValue(),
    "25",
  );
  await page.getByLabel("Height in meters", { exact: true }).press("Enter");
  await page.waitForFunction(
    () =>
      Math.abs(
        Number(
          document.querySelector('[aria-label="Height in meters"]').value,
        ) - 25,
      ) < 0.02,
  );
  const scaledConfig = JSON.parse(
    await page.evaluate(() => localStorage.getItem("meshcraft-draft-v1")),
  );
  assert.ok(scaledConfig.scale > 3);
  await page.getByLabel("Show 1.8 m person", { exact: true }).check();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset
        .referenceVisible === "true",
  );
  await page.getByLabel("Show 1.8 m person", { exact: true }).uncheck();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="viewport"]').dataset
        .referenceVisible === "false",
  );
  await page.getByLabel("Exact scale", { exact: true }).fill("100");
  await page.getByLabel("Exact scale", { exact: true }).press("Enter");
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("meshcraft-draft-v1")).scale === 100,
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.ok(
    (await opaqueCoverage()) > 1000,
    "100x models must render through the enlarged camera clip range",
  );
  await page
    .getByRole("button", { name: "Boss proportions", exact: true })
    .click();
  const boss = JSON.parse(
    await page.evaluate(() => localStorage.getItem("meshcraft-draft-v1")),
  );
  assert.equal(boss.scale, 100);
  assert.equal(boss.creature.temperament, 0.95);
  assert.equal(boss.creature.headSize, 0.85);
  await page.getByLabel("Asset name", { exact: true }).fill("Titan hunter");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Titan hunter", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("#scale")?.getAttribute("aria-valuenow") === "100",
  );
  await page
    .getByLabel("Viewport animation", { exact: true })
    .selectOption("Walk");
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const titanEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const titanBytes = await readFile(await (await titanEvent).path());
  const loadedTitan = await page.evaluate(async (b64) => {
    const { GLTFLoader } =
      await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { Vector3, Box3, AnimationMixer } =
      await import("/node_modules/three/build/three.module.js");
    const gltf = await new GLTFLoader().parseAsync(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer,
      "",
    );
    gltf.scene.updateMatrixWorld(true);
    const root = gltf.scene.children[0];
    const bounds = new Box3().setFromObject(gltf.scene).getSize(new Vector3());
    const foot = gltf.scene.getObjectByName("foot_0");
    const before = foot
      .getVertexPosition(20, new Vector3())
      .applyMatrix4(foot.matrixWorld);
    const mixer = new AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations.find((c) => c.name === "Walk")).play();
    mixer.update(0.35);
    gltf.scene.updateMatrixWorld(true);
    foot.skeleton.update();
    const after = foot
      .getVertexPosition(20, new Vector3())
      .applyMatrix4(foot.matrixWorld);
    return {
      scale: root.scale.x,
      height: bounds.y,
      displacement: before.distanceTo(after),
      boneCount: foot.skeleton.bones.length,
    };
  }, titanBytes.toString("base64"));
  assert.equal(loadedTitan.scale, 100);
  assert.ok(loadedTitan.height > 100);
  assert.ok(loadedTitan.displacement > 1);
  assert.ok(loadedTitan.boneCount > 10);
  passed(
    "Giant presets, meter height, 100x rendering, size reference, boss builds, saved sizes, and animated GLB exports work",
  );
  await page.getByRole("button", { name: "Mossling", exact: true }).click();
  await page.getByLabel("Show 1.8 m person", { exact: true }).uncheck();
  assert.equal(
    await page
      .getByRole("group", { name: "Height presets", exact: true })
      .getByRole("button")
      .count(),
    14,
  );
  for (const [label, height] of [
    ["Tiny", 0.15],
    ["Pet", 0.5],
    ["Nearly human", 1.5],
    ["Human-sized", 1.8],
    ["World boss", 500],
  ]) {
    const button = page.getByRole("button", {
      name: `${label} size (${height}m)`,
      exact: true,
    });
    await button.click();
    await page.waitForFunction(
      (height) =>
        Math.abs(
          Number(
            document.querySelector('[aria-label="Height in meters"]').value,
          ) - height,
        ) < 0.001,
      height,
    );
    assert.equal(await button.getAttribute("aria-pressed"), "true");
  }
  await page
    .getByRole("button", { name: "Tiny size (0.15m)", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Height in meters"]').value ===
      "0.15",
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const tinyCoverage = await page.locator("canvas").evaluate((canvas) => {
    const gl = canvas.getContext("webgl2"),
      pixels = new Uint8Array(canvas.width * canvas.height * 4);
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
    for (let i = 0; i < pixels.length; i += 4)
      if (
        pixels[i + 3] > 230 &&
        pixels[i + 1] > pixels[i] * 1.1 &&
        pixels[i + 1] > pixels[i + 2] * 1.1 &&
        pixels[i] < 180
      )
        count++;
    return count;
  });
  assert.ok(
    tinyCoverage > 2000,
    `Tiny creatures must fit close enough to inspect (${tinyCoverage} green model pixels)`,
  );
  await page.getByLabel("Asset name", { exact: true }).fill("Pocket pal");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /My collection/ }).click();
  await page
    .getByRole("button", { name: "Open Pocket pal", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Height in meters"]').value ===
      "0.15",
  );
  await page.getByRole("button", { name: "Export model", exact: true }).click();
  const pocketEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GLB", exact: true }).click();
  const pocketBytes = await readFile(await (await pocketEvent).path());
  const pocketHeight = await page.evaluate(async (b64) => {
    const { GLTFLoader } =
      await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { Vector3, Box3 } =
      await import("/node_modules/three/build/three.module.js");
    const gltf = await new GLTFLoader().parseAsync(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer,
      "",
    );
    gltf.scene.updateMatrixWorld(true);
    return new Box3().setFromObject(gltf.scene).getSize(new Vector3()).y;
  }, pocketBytes.toString("base64"));
  assert.ok(Math.abs(pocketHeight - 0.15) < 0.0001);
  passed(
    "Physical height presets cover tiny pets, human-sized creatures and world bosses; tiny previews, saves and GLB meters stay accurate",
  );
  assert.deepEqual(
    errors,
    [],
    "There should be no uncaught browser exceptions",
  );
  console.log(`\n${checks} browser checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
}
