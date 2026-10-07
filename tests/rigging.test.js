import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { buildModel, disposeModel } from "../src/models.js";
import { makeCreatureConfig, CREATURE_OPTIONS } from "../src/creatures.js";
import {
  buildPreviewModel,
  buildRiggedModel,
  bakeSkinnedPose,
  restorePose,
  validRigSettings,
} from "../src/rigging.js";

function configFor(plan) {
  const config = makeCreatureConfig();
  config.creature = {
    ...config.creature,
    bodyPlan: plan,
    wings: "bat",
    tail: "curled",
    horns: "antlers",
    crest: "crystals",
    eyeCount: 3,
  };
  return config;
}
function vertexWorld(mesh, index) {
  return mesh
    .getVertexPosition(index, new THREE.Vector3())
    .applyMatrix4(mesh.matrixWorld);
}
for (const plan of Object.keys(CREATURE_OPTIONS.bodyPlan)) {
  test(`${plan}: real skeleton, normalized weights, finite deforming animation clips`, () => {
    const model = buildRiggedModel(configFor(plan));
    assert.equal(model.userData.rigged, true);
    assert.ok(model.rig.bones.length >= 10);
    assert.equal(
      new Set(model.rig.bones.map((b) => b.name)).size,
      model.rig.bones.length,
    );
    const meshes = model.children.filter((c) => c.isMesh);
    assert.ok(
      meshes.every((m) => m.isSkinnedMesh && m.skeleton === model.rig.skeleton),
    );
    let blendedVertices = 0;
    for (const mesh of meshes) {
      const weights = mesh.geometry.getAttribute("skinWeight"),
        indices = mesh.geometry.getAttribute("skinIndex");
      for (let i = 0; i < weights.count; i++) {
        let sum = 0;
        for (let s = 0; s < 4; s++) {
          const weight = weights.getComponent(i, s),
            index = indices.getComponent(i, s);
          assert.ok(weight >= 0 && Number.isFinite(weight));
          assert.ok(index >= 0 && index < model.rig.bones.length);
          sum += weight;
        }
        assert.ok(Math.abs(sum - 1) < 1e-6);
        if (weights.getY(i) > 0 && weights.getX(i) > 0) blendedVertices++;
      }
    }
    assert.ok(blendedVertices > 100);
    assert.deepEqual(
      model.animations.map((c) => c.name),
      [
        "Idle",
        plan === "serpent" ? "Slither" : plan === "orb" ? "Bounce" : "Walk",
        "Fly",
      ],
    );
    for (const clip of model.animations) {
      restorePose(model);
      const eye = model.getObjectByName("pupil_0"),
        before = vertexWorld(eye, 12);
      const mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(clip).play();
      mixer.update(clip.duration * 0.25);
      model.updateMatrixWorld(true);
      model.rig.skeleton.update();
      assert.ok(
        vertexWorld(eye, 12).distanceTo(before) > 0.001,
        `${clip.name} must deform vertices`,
      );
      for (const m of meshes)
        assert.ok(vertexWorld(m, 0).toArray().every(Number.isFinite));
      for (const track of clip.tracks) {
        assert.ok([...track.values].every(Number.isFinite));
        const width = track.getValueSize();
        for (let i = 0; i < width; i++)
          assert.ok(
            Math.abs(
              track.values[i] - track.values[track.values.length - width + i],
            ) < 1e-6,
            "loop is seamless",
          );
      }
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
    disposeModel(model);
  });
}

test("Rest binding preserves static geometry at different model scales", () => {
  for (const scale of [0.5, 1, 2]) {
    const config = { ...configFor("quadruped"), scale };
    const plain = buildModel(config),
      rigged = buildRiggedModel(config);
    for (const name of [
      "head",
      "body",
      "pupil_0",
      "tail",
      "wing_membrane_-1",
      "foot_0",
    ]) {
      const a = plain.getObjectByName(name),
        b = rigged.getObjectByName(name);
      for (const index of [0, 12, 24])
        assert.ok(
          vertexWorld(a, index).distanceTo(vertexWorld(b, index)) < 2e-6,
          `${name} rest vertex mismatch at scale ${scale}`,
        );
    }
    disposeModel(plain);
    disposeModel(rigged);
  }
});

test("Manual pose deforms head attachments; OBJ baking keeps the pose and independent resources", () => {
  const config = configFor("biped");
  const rest = buildRiggedModel(config);
  config.rig = { pose: { Rig_head: [0, 35, 0], Rig_leg_L_upper: [25, 0, 0] } };
  const posed = buildRiggedModel(config),
    baked = bakeSkinnedPose(posed);
  for (const name of ["head", "pupil_0", "horn_-1", "leg_L"]) {
    const a = rest.getObjectByName(name),
      b = posed.getObjectByName(name),
      c = baked.getObjectByName(name);
    assert.ok(
      vertexWorld(a, 40).distanceTo(vertexWorld(b, 40)) > 0.01,
      `${name} should follow pose`,
    );
    assert.ok(vertexWorld(b, 40).distanceTo(vertexWorld(c, 40)) < 2e-6);
    assert.equal(c.isSkinnedMesh, undefined);
    assert.equal(c.geometry.getAttribute("skinWeight"), undefined);
    assert.notEqual(c.material, b.material);
  }
  assert.equal(baked.animations.length, 0);
  disposeModel(rest);
  disposeModel(posed);
  disposeModel(baked);
});

test("Disabling rigging and world props produce static exports; animation settings affect clips", () => {
  const config = configFor("avian");
  const baseline = buildPreviewModel(config);
  config.rig = { speed: 2, intensity: 0.5 };
  const adjusted = buildPreviewModel(config);
  assert.equal(
    adjusted.animations[0].duration,
    baseline.animations[0].duration / 2,
  );
  assert.notDeepEqual(
    [
      ...adjusted.animations[0].tracks.find(
        (t) => t.name === "Rig_head.quaternion",
      ).values,
    ],
    [
      ...baseline.animations[0].tracks.find(
        (t) => t.name === "Rig_head.quaternion",
      ).values,
    ],
  );
  config.rig.enabled = false;
  const off = buildPreviewModel(config),
    prop = buildPreviewModel({ ...config, type: "sword" });
  assert.equal(off.rig, undefined);
  assert.equal(off.animations.length, 0);
  assert.equal(prop.rig, undefined);
  assert.equal(prop.animations.length, 0);
  [baseline, adjusted, off, prop].forEach(disposeModel);
});

test("Stored rig settings reject malformed poses, joint names, and out-of-range numbers", () => {
  assert.ok(validRigSettings(undefined));
  assert.ok(
    validRigSettings({
      enabled: true,
      speed: 1.4,
      intensity: 1,
      pose: { Rig_head: [5, -35, 0] },
    }),
  );
  for (const rig of [
    null,
    [],
    { enabled: "yes" },
    { speed: Infinity },
    { intensity: 0 },
    { pose: [] },
    { pose: { head: [0, 0, 0] } },
    { pose: { Rig_head: [0, 91, 0] } },
    { pose: { Rig_head: [0, NaN, 0] } },
  ])
    assert.equal(validRigSettings(rig), false);
});
