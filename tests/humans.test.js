import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import {
  HUMAN_PRESETS,
  HUMAN_RANGES,
  HUMAN_OPTIONS,
  HUMAN_COLORS,
  HUMAN_LOOKS,
  makeHumanConfig,
  getHumanSettings,
  validHumanSettings,
} from "../src/humans.js";
import { buildModel, disposeModel, interpretPrompt } from "../src/models.js";
import { buildPreviewModel, bakeSkinnedPose } from "../src/rigging.js";

function fingerprint(config) {
  const model = buildModel(config),
    hash = createHash("sha256");
  for (const part of model.children) {
    part.updateMatrix();
    hash.update(part.name);
    hash.update(
      Buffer.from(part.geometry.getAttribute("position").array.buffer),
    );
    hash.update(JSON.stringify(part.matrix.elements));
    hash.update(part.material.color.getHexString());
    hash.update(String(part.material.metalness));
  }
  disposeModel(model);
  return hash.digest("hex");
}

test("Appearance presets create distinct valid looks while preserving skin, colors, and outfit", () => {
  const config = makeHumanConfig("human-knight");
  config.human.skin = "#6b422f";
  config.human.eyeColor = "#aabbcc";
  const results = new Set();
  for (const look of Object.values(HUMAN_LOOKS)) {
    const next = { ...config, human: { ...config.human, ...look.values } };
    assert.ok(validHumanSettings(next.human));
    for (const key of [
      "skin",
      "eyeColor",
      "top",
      "topColor",
      "gloves",
      "footwear",
    ])
      assert.equal(next.human[key], config.human[key]);
    results.add(fingerprint(next));
  }
  assert.equal(results.size, 4);
});

test("The continuous low-poly face has visible outward facets across jaw and cheek extremes", () => {
  for (const detail of [0, 1, 2]) {
    for (const jawWidth of [0.65, 1.3]) {
      const config = makeHumanConfig();
      config.detail = detail;
      config.human = {
        ...config.human,
        jawWidth,
        cheekbones: jawWidth === 0.65 ? 0.7 : 1.3,
        hair: "none",
      };
      const model = buildModel(config),
        head = model.getObjectByName("head");
      const origin = head.localToWorld(new THREE.Vector3(0, 0, 3));
      const hits = new THREE.Raycaster(
        origin,
        new THREE.Vector3(0, 0, -1),
      ).intersectObject(head);
      assert.ok(hits.length > 0, "Head surface must be visible from the front");
      assert.ok(hits[0].face.normal.z > 0);
      assert.equal(model.getObjectByName("jaw"), undefined);
      assert.equal(model.getObjectByName("cheek_-1"), undefined);
      disposeModel(model);
    }
  }
});
for (const preset of HUMAN_PRESETS)
  test(`${preset.name}: human skeleton, weighted apparel, and animated GLB-ready parts`, () => {
    const config = makeHumanConfig(preset.id),
      model = buildPreviewModel(config);
    assert.equal(model.userData.kind, "procedural-human");
    assert.equal(model.userData.rigged, true);
    assert.deepEqual(
      model.animations.map((c) => c.name),
      ["Idle", "Walk"],
    );
    assert.equal(model.rig.bones.length, 19);
    for (const part of model.children.filter((p) => p.isMesh)) {
      assert.ok(part.isSkinnedMesh);
      const weights = part.geometry.getAttribute("skinWeight");
      for (let i = 0; i < weights.count; i++) {
        assert.ok(
          Math.abs(
            weights.getX(i) +
              weights.getY(i) +
              weights.getZ(i) +
              weights.getW(i) -
              1,
          ) < 1e-6,
        );
        assert.ok(
          part
            .getVertexPosition(i, new THREE.Vector3())
            .toArray()
            .every(Number.isFinite),
        );
      }
    }
    const sleeve = model.getObjectByName("sleeve_L");
    if (sleeve)
      assert.deepEqual(
        new Set(sleeve.geometry.getAttribute("skinIndex").array),
        new Set(
          model.getObjectByName("arm_L").geometry.getAttribute("skinIndex")
            .array,
        ),
      );
    const eye = model.getObjectByName("iris_0"),
      before = eye.getVertexPosition(30, new THREE.Vector3());
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(model.animations[1]).play();
    mixer.update(0.35);
    model.updateMatrixWorld(true);
    model.rig.skeleton.update();
    assert.ok(
      eye.getVertexPosition(30, new THREE.Vector3()).distanceTo(before) > 0.001,
    );
    mixer.uncacheRoot(model);
    disposeModel(model);
  });

test("All 26 human sliders change actual geometry at their endpoints", () => {
  const config = makeHumanConfig();
  for (const [key, [, min, max]] of Object.entries(HUMAN_RANGES)) {
    const low = { ...config, human: { ...config.human, [key]: min } },
      high = { ...config, human: { ...config.human, [key]: max } };
    assert.notEqual(
      fingerprint(low),
      fingerprint(high),
      `${key} should affect the generated model`,
    );
  }
});

test("Every human style option creates distinct geometry or materials", () => {
  const config = makeHumanConfig();
  for (const [key, options] of Object.entries(HUMAN_OPTIONS)) {
    const variants = new Set(
      Object.keys(options).map((value) =>
        fingerprint({ ...config, human: { ...config.human, [key]: value } }),
      ),
    );
    assert.equal(
      variants.size,
      Object.keys(options).length,
      `All ${key} options should be distinct`,
    );
  }
  for (const key of Object.keys(HUMAN_COLORS)) {
    assert.notEqual(
      fingerprint({
        ...config,
        human: { ...config.human, facialHair: "beard", [key]: "#123456" },
      }),
      fingerprint({
        ...config,
        human: { ...config.human, facialHair: "beard", [key]: "#fedcba" },
      }),
      `${key} should affect visible materials`,
    );
  }
});

test("Human extreme proportions remain finite, grounded, and bind without distortion", () => {
  for (const max of [false, true]) {
    const config = makeHumanConfig();
    for (const [key, [, min, upper]] of Object.entries(HUMAN_RANGES))
      config.human[key] = max ? upper : min;
    const staticModel = buildModel(config),
      rigged = buildPreviewModel(config);
    assert.ok(
      Math.abs(new THREE.Box3().setFromObject(staticModel).min.y) < 1e-6,
    );
    for (const name of ["head", "body", "foot_0", "iris_0"]) {
      const a = staticModel.getObjectByName(name),
        b = rigged.getObjectByName(name);
      for (let i = 0; i < a.geometry.getAttribute("position").count; i++) {
        const first = a
            .getVertexPosition(i, new THREE.Vector3())
            .applyMatrix4(a.matrixWorld),
          second = b
            .getVertexPosition(i, new THREE.Vector3())
            .applyMatrix4(b.matrixWorld);
        assert.ok(first.distanceTo(second) < 1e-5);
      }
    }
    disposeModel(staticModel);
    disposeModel(rigged);
  }
});

test("Human clothing, ears, and hair follow poses; OBJ bakes the same deformed mesh", () => {
  const config = makeHumanConfig("human-knight");
  config.human.earrings = "hoops";
  config.rig.pose = { Rig_arm_L_upper: [0, 0, -71], Rig_head: [0, 25, 0] };
  const model = buildPreviewModel(config),
    baked = bakeSkinnedPose(model);
  for (const part of model.children.filter((p) => p.isSkinnedMesh)) {
    const mesh = baked.getObjectByName(part.name);
    for (const i of [
      0,
      Math.floor(part.geometry.getAttribute("position").count / 2),
    ])
      assert.ok(
        part
          .getVertexPosition(i, new THREE.Vector3())
          .distanceTo(mesh.getVertexPosition(i, new THREE.Vector3())) < 1e-5,
      );
  }
  assert.ok(
    new THREE.Box3().setFromObject(model.getObjectByName("hand_L")).max.y > 1.1,
  );
  disposeModel(model);
  disposeModel(baked);
});

test("Human looks are deterministic and input validation prevents malformed saved settings", () => {
  const config = makeHumanConfig();
  config.human.freckles = true;
  assert.equal(fingerprint(config), fingerprint(config));
  assert.notEqual(fingerprint(config), fingerprint({ ...config, seed: 43 }));
  assert.ok(validHumanSettings(config.human));
  for (const value of [
    null,
    [],
    { height: 9 },
    { noseLength: NaN },
    { hair: "banana" },
    { skin: "red" },
    { scar: "yes" },
    { unexpected: true },
  ])
    assert.equal(validHumanSettings(value), false);
  const fallback = getHumanSettings({
    ...config,
    human: { height: NaN, hair: "banana", skin: "red" },
  });
  assert.equal(fallback.height, 1);
  assert.equal(fallback.hair, "swept");
  assert.equal(fallback.skin, "#c68e6b");
});

test("Supported human prompts choose archetypes, outfits, hair, and facial details", () => {
  const next = interpretPrompt(
    "A detailed elf mage with long blonde hair, a crown, freckles and a scar",
    makeHumanConfig(),
  );
  assert.equal(next.type, "human-mage");
  assert.equal(next.human.ears, "pointed");
  assert.equal(next.human.hair, "long");
  assert.equal(next.human.hairColor, "#d7b56f");
  assert.equal(next.human.headwear, "crown");
  assert.ok(next.human.freckles && next.human.scar);
  assert.equal(interpretPrompt("A knight with a helmet").type, "human-knight");
});
