import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  ASSETS,
  DEFAULT_CONFIG,
  buildModel,
  disposeModel,
  interpretPrompt,
  modelStats,
} from "../src/models.js";
import {
  CREATURE_OPTIONS,
  getCreatureSettings,
  makeCreatureConfig,
  validCreatureSettings,
} from "../src/creatures.js";

for (const asset of ASSETS) {
  test(`${asset.name}: generates finite, grounded geometry with normals, UVs, and materials`, () => {
    for (const detail of [0, 1, 2]) {
      const model = buildModel({ ...DEFAULT_CONFIG, type: asset.id, detail });
      const stats = modelStats(model);
      assert.ok(
        stats.triangles > 20,
        "A real model must have more than a placeholder triangle",
      );
      assert.ok(stats.vertices > 0);
      assert.ok(stats.materials >= 2);
      const bounds = new THREE.Box3().setFromObject(model);
      assert.ok(Math.abs(bounds.min.y) < 1e-6, "Models must sit on the ground");
      assert.ok(stats.size.every((size) => size > 0 && Number.isFinite(size)));
      model.traverse((part) => {
        if (!part.isMesh) return;
        for (const name of ["position", "normal", "uv"]) {
          assert.ok(
            part.geometry.attributes[name],
            `${part.name} missing ${name}`,
          );
          assert.ok(
            [...part.geometry.attributes[name].array].every(Number.isFinite),
          );
        }
        assert.ok(part.material.name, "OBJ materials need stable names");
      });
      disposeModel(model);
    }
  });
}

test("A seed reproduces the same rock; changing it changes geometry", () => {
  const one = buildModel({ ...DEFAULT_CONFIG, type: "rock", seed: 42 });
  const two = buildModel({ ...DEFAULT_CONFIG, type: "rock", seed: 42 });
  const three = buildModel({ ...DEFAULT_CONFIG, type: "rock", seed: 43 });
  assert.deepEqual(
    one.children[0].geometry.attributes.position.array,
    two.children[0].geometry.attributes.position.array,
  );
  assert.notDeepEqual(
    one.children[0].geometry.attributes.position.array,
    three.children[0].geometry.attributes.position.array,
  );
  [one, two, three].forEach(disposeModel);
});

test("Scale doubles all exported dimensions while keeping the model grounded", () => {
  const one = buildModel(DEFAULT_CONFIG);
  const two = buildModel({ ...DEFAULT_CONFIG, scale: 2 });
  modelStats(one).size.forEach((size, index) =>
    assert.ok(Math.abs(modelStats(two).size[index] - size * 2) < 1e-6),
  );
  assert.ok(Math.abs(new THREE.Box3().setFromObject(two).min.y) < 1e-6);
  [one, two].forEach(disposeModel);
});

test("Detailed tree and rock presets have more triangles than simple ones", () => {
  for (const type of ["tree", "rock"]) {
    const simple = buildModel({ ...DEFAULT_CONFIG, type, detail: 0 });
    const detailed = buildModel({ ...DEFAULT_CONFIG, type, detail: 2 });
    assert.ok(modelStats(detailed).triangles > modelStats(simple).triangles);
    [simple, detailed].forEach(disposeModel);
  }
});

test("Prompts select supported templates, color words, and detail without claiming arbitrary generation", () => {
  const potion = interpretPrompt("A detailed purple potion for my game");
  assert.equal(potion.type, "potion");
  assert.equal(potion.primary, "#a08bb7");
  assert.equal(potion.detail, 2);
  assert.equal(interpretPrompt("a simple pine").type, "tree");
  assert.equal(interpretPrompt("a low-poly blue sword").detail, 0);
  assert.ok(interpretPrompt("a spaceship").error);
  assert.ok(
    interpretPrompt("stonework castle").error,
    "Only complete words should match templates",
  );
});

test("All creature body plans stay finite and grounded at extreme proportions", () => {
  for (const bodyPlan of Object.keys(CREATURE_OPTIONS.bodyPlan))
    for (const extreme of [false, true]) {
      const config = makeCreatureConfig();
      config.seed = extreme ? 999999 : 0;
      config.creature = {
        ...config.creature,
        bodyPlan,
        headSize: extreme ? 1.5 : 0.7,
        bodyWidth: extreme ? 1.4 : 0.7,
        legLength: extreme ? 1.4 : 0.65,
        wings: "crystal",
        horns: "antlers",
        eyeCount: 3,
      };
      const model = buildModel(config);
      const bounds = new THREE.Box3().setFromObject(model);
      assert.ok(Math.abs(bounds.min.y) < 1e-6);
      assert.ok(
        modelStats(model).size.every(
          (value) => Number.isFinite(value) && value > 0,
        ),
      );
      model.traverse((part) => {
        if (part.isMesh)
          assert.ok(
            [...part.geometry.attributes.position.array].every(Number.isFinite),
          );
      });
      disposeModel(model);
    }
});

test("Creature seeds reproduce anatomy and patterns, and change actual geometry", () => {
  const config = makeCreatureConfig("creature-tidewhisk");
  const models = [
    buildModel(config),
    buildModel(config),
    buildModel({ ...config, seed: 43 }),
  ];
  const snapshot = (model) =>
    model.children.map((part) => ({
      name: part.name,
      position: part.position.toArray(),
      scale: part.scale.toArray(),
      rotation: part.quaternion.toArray(),
      geometry: [...part.geometry.attributes.position.array],
    }));
  assert.deepEqual(snapshot(models[0]), snapshot(models[1]));
  assert.notDeepEqual(snapshot(models[0]), snapshot(models[2]));
  models.forEach(disposeModel);
});

test("Creature features change mesh parts and export bounds, rather than only labels", () => {
  const config = makeCreatureConfig();
  config.creature = {
    ...config.creature,
    ears: "none",
    horns: "none",
    wings: "none",
    tail: "none",
    crest: "none",
    eyeCount: 1,
  };
  const plain = buildModel(config);
  const elaborate = buildModel({
    ...config,
    creature: {
      ...config.creature,
      ears: "long",
      horns: "antlers",
      wings: "crystal",
      tail: "fin",
      crest: "crystals",
      eyeCount: 3,
    },
  });
  assert.equal(
    plain.children.filter((part) => part.name.startsWith("eye_white_")).length,
    1,
  );
  assert.equal(
    elaborate.children.filter((part) => part.name.startsWith("eye_white_"))
      .length,
    3,
  );
  for (const prefix of [
    "inner_ear",
    "antler_branch",
    "crystal_wing",
    "tail_fin",
    "back_crystals",
  ]) {
    assert.ok(
      elaborate.children.some((part) => part.name.startsWith(prefix)),
      `${prefix} must be actual geometry`,
    );
    assert.ok(!plain.children.some((part) => part.name.startsWith(prefix)));
  }
  assert.ok(modelStats(elaborate).triangles > modelStats(plain).triangles);
  assert.ok(modelStats(elaborate).size[0] > modelStats(plain).size[0]);
  [plain, elaborate].forEach(disposeModel);
});

test("Temperament creates visible brows, fangs, and claws", () => {
  const config = makeCreatureConfig();
  const friendly = buildModel({
    ...config,
    creature: { ...config.creature, temperament: 0 },
  });
  const fierce = buildModel({
    ...config,
    creature: { ...config.creature, temperament: 1 },
  });
  for (const prefix of ["brow_", "fang_", "claw_"]) {
    assert.ok(!friendly.children.some((part) => part.name.startsWith(prefix)));
    assert.ok(fierce.children.some((part) => part.name.startsWith(prefix)));
  }
  [friendly, fierce].forEach(disposeModel);
});

test("Creature prompts combine anatomy, color, eye counts, elements, and explicit exclusions", () => {
  const rabbit = interpretPrompt(
    "A cute purple rabbit with antlers, crystal wings, a fin tail, and three eyes",
  );
  assert.equal(rabbit.primary, "#a08bb7");
  assert.equal(rabbit.creature.bodyPlan, "biped");
  assert.equal(rabbit.creature.horns, "antlers");
  assert.equal(rabbit.creature.wings, "crystal");
  assert.equal(rabbit.creature.tail, "fin");
  assert.equal(rabbit.creature.eyeCount, 3);
  assert.ok(rabbit.creature.temperament < 0.2);
  const dragon = interpretPrompt(
    "A fierce fire dragon with no wings and no horns",
  );
  assert.equal(dragon.creature.element, "fire");
  assert.equal(dragon.creature.wings, "none");
  assert.equal(dragon.creature.horns, "none");
  assert.ok(dragon.creature.temperament > 0.8);
  assert.equal(interpretPrompt("A blue slime").creature.bodyPlan, "orb");
  assert.equal(
    interpretPrompt("A shadow serpent").creature.bodyPlan,
    "serpent",
  );
});

test("Invalid stored anatomy is rejected and direct generator inputs safely fall back", () => {
  assert.equal(validCreatureSettings({ eyeCount: 100 }), false);
  assert.equal(validCreatureSettings({ bodyPlan: "spaceship" }), false);
  assert.equal(validCreatureSettings({ headSize: NaN }), false);
  assert.equal(validCreatureSettings({ element: "__proto__" }), false);
  assert.equal(validCreatureSettings(makeCreatureConfig().creature), true);
  const settings = getCreatureSettings({
    type: "creature-mossling",
    creature: { headSize: 100, wings: "missing", temperament: -5 },
  });
  assert.equal(settings.headSize, 1.5);
  assert.equal(settings.wings, "none");
  assert.equal(settings.temperament, 0);
});
