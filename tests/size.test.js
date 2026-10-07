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
  assert.deepEqual(SCALE_LIMITS, { min: 0.25, max: 100 });
  assert.equal(normalizeScale(30), 30);
  assert.equal(normalizeScale(200), 100);
  assert.equal(normalizeScale(-1), 0.25);
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
