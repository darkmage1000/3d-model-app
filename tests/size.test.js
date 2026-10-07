import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  buildModel,
  disposeModel,
  modelStats,
  interpretPrompt,
  normalizeScale,
  SCALE_LIMITS,
} from "../src/models.js";
import { CREATURE_PRESETS, makeCreatureConfig } from "../src/creatures.js";
import { buildPreviewModel, bakeSkinnedPose } from "../src/rigging.js";
import {
  SIZE_PRESETS,
  scaleForHeight,
  scaleToSlider,
  sliderToScale,
} from "../src/sizes.js";

test("Large creatures scale to 100x without clipping the generator at its old limit", () => {
  for (const preset of CREATURE_PRESETS) {
    const config = makeCreatureConfig(preset.id),
      base = buildPreviewModel(config),
      huge = buildPreviewModel({ ...config, scale: 100 });
    const original = modelStats(base),
      grown = modelStats(huge);
    assert.equal(grown.scale, 100);
    assert.equal(grown.triangles, original.triangles);
    for (let axis = 0; axis < 3; axis++)
      assert.ok(Math.abs(grown.size[axis] / original.size[axis] - 100) < 1e-4);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(huge).min.y) < 1e-5);
    const mixer = new THREE.AnimationMixer(huge);
    mixer.clipAction(huge.animations[1]).play();
    mixer.update(0.35);
    huge.updateMatrixWorld(true);
    huge.rig.skeleton.update();
    for (const part of huge.children.filter((p) => p.isSkinnedMesh))
      assert.ok(
        part
          .getVertexPosition(10, new THREE.Vector3())
          .toArray()
          .every(Number.isFinite),
      );
    mixer.stopAllAction();
    mixer.uncacheRoot(huge);
    disposeModel(base);
    disposeModel(huge);
  }
});

test("Giant rig rest binding and baked OBJ vertices preserve dimensions", () => {
  const config = { ...makeCreatureConfig("creature-emberfang"), scale: 30 },
    staticModel = buildModel(config),
    rigged = buildPreviewModel(config),
    baked = bakeSkinnedPose(rigged);
  for (const name of ["head", "body", "pupil_0", "foot_0"]) {
    const a = staticModel.getObjectByName(name),
      b = rigged.getObjectByName(name),
      c = baked.getObjectByName(name);
    for (const index of [0, 12, 24]) {
      const v = a
        .getVertexPosition(index, new THREE.Vector3())
        .applyMatrix4(a.matrixWorld);
      assert.ok(
        v.distanceTo(
          b
            .getVertexPosition(index, new THREE.Vector3())
            .applyMatrix4(b.matrixWorld),
        ) < 1e-4,
      );
      assert.ok(
        v.distanceTo(
          c
            .getVertexPosition(index, new THREE.Vector3())
            .applyMatrix4(c.matrixWorld),
        ) < 1e-4,
      );
    }
  }
  [staticModel, rigged, baked].forEach(disposeModel);
});

test("Size bounds reject non-finite scales and safely clamp explicit inputs", () => {
  assert.deepEqual(SCALE_LIMITS, { min: 0.01, max: 1000 });
  assert.equal(normalizeScale(30), 30);
  assert.equal(normalizeScale(200), 200);
  assert.equal(normalizeScale(2000), 1000);
  assert.equal(normalizeScale(-1), 0.01);
  assert.equal(normalizeScale(NaN), 1);
  assert.equal(normalizeScale(Infinity), 1);
});

test("Giant, large, and titan prompts set scale; lizard prompts build reptile anatomy", () => {
  for (const [text, scale] of [
    ["A giant lizard", 10],
    ["A large fierce dragon", 3],
    ["A colossal monster", 30],
  ]) {
    const config = interpretPrompt(text, makeCreatureConfig());
    assert.equal(config.scale, scale);
    assert.ok(config.type.startsWith("creature-"));
  }
  const lizard = interpretPrompt(
    "A giant green lizard with no wings",
    makeCreatureConfig(),
  );
  assert.equal(lizard.creature.bodyPlan, "quadruped");
  assert.equal(lizard.creature.ears, "none");
  assert.equal(lizard.creature.wings, "none");
  assert.equal(lizard.creature.snout, 1);
  assert.equal(lizard.creature.tail, "pointed");
});

test("Height presets produce consistent physical sizes across different creatures without changing their geometry", () => {
  for (const preset of CREATURE_PRESETS) {
    const config = makeCreatureConfig(preset.id);
    const base = buildPreviewModel(config);
    const original = modelStats(base);
    for (const size of SIZE_PRESETS) {
      const scale = scaleForHeight(
        size.height,
        original.size[1] / original.scale,
      );
      const model = buildPreviewModel({ ...config, scale });
      const result = modelStats(model);
      assert.ok(
        Math.abs(result.size[1] - size.height) <
          Math.max(0.00001, size.height * 0.00001),
        `${preset.name} at ${size.label}`,
      );
      assert.equal(result.triangles, original.triangles);
      disposeModel(model);
    }
    disposeModel(base);
  }
  assert.equal(scaleForHeight(0.5, 0), null);
  assert.equal(scaleForHeight(NaN, 1), null);
});

test("Tiny and extreme scales preserve rigged and baked positions with finite animation", () => {
  for (const scale of [SCALE_LIMITS.min, SCALE_LIMITS.max]) {
    const config = { ...makeCreatureConfig("creature-emberfang"), scale };
    const model = buildPreviewModel(config);
    const baked = bakeSkinnedPose(model);
    const a = modelStats(model),
      b = modelStats(baked);
    for (let axis = 0; axis < 3; axis++)
      assert.ok(
        Math.abs(a.size[axis] - b.size[axis]) <
          Math.max(1e-6, a.size[axis] * 1e-5),
      );
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(model.animations[1]).play();
    mixer.update(0.4);
    model.updateMatrixWorld(true);
    model.rig.skeleton.update();
    for (const part of model.children.filter((part) => part.isSkinnedMesh))
      assert.ok(
        part
          .getVertexPosition(0, new THREE.Vector3())
          .toArray()
          .every(Number.isFinite),
      );
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    disposeModel(model);
    disposeModel(baked);
  }
});

test("The scale slider remains precise from tiny creatures to world bosses", () => {
  for (const scale of [0.01, 0.02, 0.1, 0.5, 1, 3, 10, 100, 500, 1000])
    assert.ok(
      Math.abs(sliderToScale(scaleToSlider(scale)) - scale) < scale * 0.00001,
    );
  assert.equal(sliderToScale(-1), 0.01);
  assert.equal(sliderToScale(101), 1000);
  assert.equal(sliderToScale(NaN), 1);
});
