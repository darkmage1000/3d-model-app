import * as THREE from "three";

export const CREATURE_OPTIONS = {
  bodyPlan: {
    biped: "Two-legged",
    quadruped: "Four-legged",
    avian: "Bird",
    serpent: "Serpentine",
    orb: "Round / blob",
  },
  ears: { none: "None", round: "Round", pointed: "Pointed", long: "Long" },
  horns: { none: "None", small: "Small", swept: "Swept", antlers: "Antlers" },
  wings: {
    none: "None",
    feathered: "Feathered",
    bat: "Bat-like",
    crystal: "Crystal",
  },
  tail: {
    none: "None",
    tuft: "Fluffy",
    pointed: "Pointed",
    fin: "Fin",
    curled: "Curled",
  },
  crest: {
    none: "None",
    leaves: "Leaves",
    spikes: "Spikes",
    crystals: "Crystals",
  },
  pattern: {
    belly: "Belly patch",
    spots: "Spots",
    stripes: "Stripes",
    none: "None",
  },
};

export const ELEMENTS = {
  nature: { name: "Nature", primary: "#85ad8b", accent: "#e1dbaf" },
  fire: { name: "Fire", primary: "#cf8063", accent: "#f3d48c" },
  water: { name: "Water", primary: "#7eafb9", accent: "#d9e9d4" },
  earth: { name: "Earth", primary: "#8d9387", accent: "#c6ae83" },
  frost: { name: "Frost", primary: "#a0c4d1", accent: "#e8eff0" },
  storm: { name: "Storm", primary: "#899dc7", accent: "#eee0a6" },
  shadow: { name: "Shadow", primary: "#9b89b2", accent: "#d7b4cf" },
};

export const BASE_CREATURE = {
  bodyPlan: "biped",
  element: "nature",
  ears: "long",
  horns: "none",
  wings: "none",
  tail: "tuft",
  crest: "leaves",
  pattern: "belly",
  headSize: 1.1,
  bodyWidth: 1,
  legLength: 1,
  snout: 0.35,
  temperament: 0.15,
  eyeCount: 2,
};

export const CREATURE_PRESETS = [
  {
    ...ELEMENTS.nature,
    id: "creature-mossling",
    name: "Mossling",
    description: "A curious woodland companion",
    creature: { ...BASE_CREATURE },
  },
  {
    ...ELEMENTS.fire,
    id: "creature-emberfang",
    name: "Emberfang",
    description: "A fiery, horned forest hunter",
    creature: {
      ...BASE_CREATURE,
      bodyPlan: "quadruped",
      element: "fire",
      ears: "pointed",
      horns: "swept",
      tail: "pointed",
      crest: "spikes",
      pattern: "stripes",
      headSize: 0.95,
      snout: 0.85,
      temperament: 0.85,
    },
  },
  {
    ...ELEMENTS.water,
    id: "creature-tidewhisk",
    name: "Tidewhisk",
    description: "A playful fin-tailed explorer",
    creature: {
      ...BASE_CREATURE,
      bodyPlan: "quadruped",
      element: "water",
      ears: "round",
      tail: "fin",
      crest: "none",
      pattern: "spots",
      bodyWidth: 0.85,
      legLength: 0.75,
      snout: 0.5,
    },
  },
  {
    ...ELEMENTS.earth,
    id: "creature-cragback",
    name: "Cragback",
    description: "A sturdy crystal-backed guardian",
    creature: {
      ...BASE_CREATURE,
      bodyPlan: "quadruped",
      element: "earth",
      ears: "none",
      horns: "small",
      tail: "pointed",
      crest: "crystals",
      bodyWidth: 1.35,
      headSize: 0.9,
      legLength: 0.8,
      snout: 0.65,
      temperament: 0.55,
    },
  },
  {
    ...ELEMENTS.storm,
    id: "creature-skyplume",
    name: "Skyplume",
    description: "A bright-eyed thunderbird",
    creature: {
      ...BASE_CREATURE,
      bodyPlan: "avian",
      element: "storm",
      ears: "none",
      wings: "feathered",
      tail: "tuft",
      crest: "none",
      snout: 0.8,
      headSize: 1.05,
    },
  },
  {
    ...ELEMENTS.shadow,
    id: "creature-riftwyrm",
    name: "Riftwyrm",
    description: "An unusual winged dusk serpent",
    creature: {
      ...BASE_CREATURE,
      bodyPlan: "serpent",
      element: "shadow",
      ears: "none",
      horns: "swept",
      wings: "bat",
      tail: "none",
      crest: "crystals",
      pattern: "spots",
      headSize: 0.9,
      snout: 0.65,
      temperament: 0.7,
    },
  },
];

export function isCreatureType(type) {
  return CREATURE_PRESETS.some((preset) => preset.id === type);
}
export function creaturePreset(type) {
  return (
    CREATURE_PRESETS.find((preset) => preset.id === type) || CREATURE_PRESETS[0]
  );
}
export function getCreatureSettings(config) {
  const defaults = creaturePreset(config.type).creature;
  const values = { ...defaults, ...config.creature };
  const result = { ...defaults };
  for (const [key, options] of Object.entries(CREATURE_OPTIONS)) {
    if (Object.hasOwn(options, values[key])) result[key] = values[key];
  }
  if (Object.hasOwn(ELEMENTS, values.element)) result.element = values.element;
  for (const [key, min, max] of [
    ["headSize", 0.7, 1.5],
    ["bodyWidth", 0.7, 1.4],
    ["legLength", 0.65, 1.4],
    ["snout", 0, 1],
    ["temperament", 0, 1],
  ]) {
    if (Number.isFinite(values[key]))
      result[key] = THREE.MathUtils.clamp(values[key], min, max);
  }
  if ([1, 2, 3].includes(values.eyeCount)) result.eyeCount = values.eyeCount;
  return result;
}

export function makeCreatureConfig(
  type = CREATURE_PRESETS[0].id,
  current = {},
) {
  const preset = creaturePreset(type);
  return {
    ...current,
    type: preset.id,
    name: preset.name,
    seed: current.seed ?? 42,
    detail: current.detail ?? 1,
    scale: current.scale ?? 1,
    primary: preset.primary,
    accent: preset.accent,
    creature: { ...preset.creature },
  };
}

export function validCreatureSettings(settings) {
  if (settings == null) return true;
  if (typeof settings !== "object" || Array.isArray(settings)) return false;
  for (const [key, options] of Object.entries(CREATURE_OPTIONS))
    if (settings[key] != null && !Object.hasOwn(options, settings[key]))
      return false;
  if (settings.element != null && !Object.hasOwn(ELEMENTS, settings.element))
    return false;
  for (const [key, min, max] of [
    ["headSize", 0.7, 1.5],
    ["bodyWidth", 0.7, 1.4],
    ["legLength", 0.65, 1.4],
    ["snout", 0, 1],
    ["temperament", 0, 1],
  ]) {
    if (
      settings[key] != null &&
      (!Number.isFinite(settings[key]) ||
        settings[key] < min ||
        settings[key] > max)
    )
      return false;
  }
  return settings.eyeCount == null || [1, 2, 3].includes(settings.eyeCount);
}

export function parseCreaturePrompt(text, current) {
  const lower = text.toLowerCase();
  if (
    !/\b(creature|monster|companion|critter|beast|dragon|wyvern|lizard|crocodile|dinosaur|reptile|serpent|snake|rabbit|bunny|fox|wolf|cat|bird|owl|griffin|slime|blob|golem|turtle|mossling|emberfang|tidewhisk|cragback|skyplume|riftwyrm)\b/.test(
      lower,
    )
  )
    return null;
  let preset = CREATURE_PRESETS.find((p) =>
    new RegExp(`\\b${p.name.toLowerCase()}\\b`).test(lower),
  );
  if (!preset) {
    const index = /\b(serpent|snake|wyvern)\b/.test(lower)
      ? 5
      : /\b(bird|owl|griffin)\b/.test(lower)
        ? 4
        : /\b(golem|turtle|earth|stone|crystal)\b/.test(lower)
          ? 3
          : /\b(water|aquatic|sea)\b/.test(lower)
            ? 2
            : /\b(fire|fiery|dragon|lizard|crocodile|dinosaur|reptile)\b/.test(
                  lower,
                )
              ? 1
              : 0;
    preset =
      isCreatureType(current.type) &&
      /\b(creature|monster|companion|critter|beast)\b/.test(lower) &&
      !/\b(fire|water|earth|nature|storm|shadow|frost|dragon|rabbit|bunny|wolf|fox|cat|bird|slime|blob)\b/.test(
        lower,
      )
        ? creaturePreset(current.type)
        : CREATURE_PRESETS[index];
  }
  const result = makeCreatureConfig(preset.id, current);
  const anatomy = { ...result.creature };
  if (/\b(rabbit|bunny)\b/.test(lower))
    Object.assign(anatomy, {
      bodyPlan: "biped",
      ears: "long",
      horns: "none",
      headSize: 1.25,
      temperament: 0.05,
    });
  if (/\b(wolf|fox|cat)\b/.test(lower))
    Object.assign(anatomy, {
      bodyPlan: "quadruped",
      ears: "pointed",
      horns: "none",
      tail: "tuft",
      snout: 0.8,
    });
  if (/\b(slime|blob)\b/.test(lower))
    Object.assign(anatomy, {
      bodyPlan: "orb",
      ears: "none",
      horns: "none",
      tail: "none",
      crest: "none",
      snout: 0,
      bodyWidth: 1.2,
    });
  if (/\b(dragon|wyvern)\b/.test(lower))
    Object.assign(anatomy, {
      horns: "swept",
      wings: "bat",
      tail: "pointed",
      temperament: 0.8,
    });
  if (/\b(lizard|crocodile|dinosaur|reptile)\b/.test(lower))
    Object.assign(anatomy, {
      bodyPlan: "quadruped",
      ears: "none",
      horns: "none",
      wings: "none",
      tail: "pointed",
      crest: "spikes",
      headSize: 0.85,
      bodyWidth: 1.3,
      snout: 1,
      temperament: 0.85,
    });
  if (/\b(four[- ]legged|quadruped)\b/.test(lower))
    anatomy.bodyPlan = "quadruped";
  if (/\b(two[- ]legged|biped)\b/.test(lower)) anatomy.bodyPlan = "biped";
  if (/\b(cute|friendly|gentle|adorable)\b/.test(lower))
    anatomy.temperament = 0.05;
  if (/\b(fierce|angry|scary|ferocious)\b/.test(lower))
    anatomy.temperament = 0.95;
  for (const element of Object.keys(ELEMENTS))
    if (new RegExp(`\\b${element}\\b`).test(lower)) {
      anatomy.element = element;
      result.primary = ELEMENTS[element].primary;
      result.accent = ELEMENTS[element].accent;
      break;
    }
  if (/\b(antlers|antlered)\b/.test(lower)) anatomy.horns = "antlers";
  else if (/\b(horns|horned)\b/.test(lower)) anatomy.horns = "swept";
  if (/\b(long ears|bunny ears)\b/.test(lower)) anatomy.ears = "long";
  if (/\b(round ears)\b/.test(lower)) anatomy.ears = "round";
  if (/\b(pointed ears)\b/.test(lower)) anatomy.ears = "pointed";
  if (/\b(feathered wings|feathers)\b/.test(lower)) anatomy.wings = "feathered";
  else if (/\b(crystal wings)\b/.test(lower)) anatomy.wings = "crystal";
  else if (/\b(wings|winged)\b/.test(lower)) anatomy.wings = "bat";
  if (/\b(curled tail|curly tail)\b/.test(lower)) anatomy.tail = "curled";
  if (/\b(fin tail|fin[- ]tailed)\b/.test(lower)) anatomy.tail = "fin";
  if (/\b(fluffy tail)\b/.test(lower)) anatomy.tail = "tuft";
  if (/\b(crystal[- ]backed|crystal back|crystals)\b/.test(lower))
    anatomy.crest = "crystals";
  if (/\b(spikes|spiky)\b/.test(lower)) anatomy.crest = "spikes";
  if (/\b(spots|spotted)\b/.test(lower)) anatomy.pattern = "spots";
  if (/\b(stripes|striped)\b/.test(lower)) anatomy.pattern = "stripes";
  if (/\b(cyclops|one eye|one[- ]eyed)\b/.test(lower)) anatomy.eyeCount = 1;
  if (/\b(three eyes|three[- ]eyed)\b/.test(lower)) anatomy.eyeCount = 3;
  if (/\b(no wings|without wings|wingless)\b/.test(lower))
    anatomy.wings = "none";
  if (/\b(no horns|without horns|hornless)\b/.test(lower))
    anatomy.horns = "none";
  if (/\b(no tail|without a tail|tailless)\b/.test(lower))
    anatomy.tail = "none";
  result.creature = anatomy;
  result.name = `${preset.name} ${current.seed}`;
  return result;
}

// Every part has a name and UVs for downstream editing. These are assembled
// static meshes, not a skinned rig or a watertight sculpt.
export function populateCreature(group, config, random) {
  const c = getCreatureSettings(config);
  const segments = [8, 12, 16][config.detail] || 12;
  const rings = [5, 7, 9][config.detail] || 7;
  const mat = (color, name, roughness = 0.75) => {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      flatShading: true,
    });
    material.name = name;
    return material;
  };
  const skin = mat(config.primary, "creature_skin");
  const accent = mat(config.accent, "creature_accent");
  const shade = mat(
    new THREE.Color(config.primary).offsetHSL(0, 0.03, -0.14),
    "creature_markings",
  );
  const dark = mat("#29352f", "creature_eyes", 0.32);
  const white = mat("#fff6e2", "creature_ivory", 0.4);
  const feature =
    c.element === "earth" || c.element === "frost" ? accent : shade;
  function add(geo, material, pos, name) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function oval(pos, size, material = skin, name = "body") {
    const mesh = add(
      new THREE.SphereGeometry(1, segments, rings),
      material,
      pos,
      name,
    );
    mesh.scale.set(...size);
    return mesh;
  }
  function link(a, b, radiusA, radiusB, material, name) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const mesh = add(
      new THREE.CylinderGeometry(
        radiusB,
        radiusA,
        direction.length(),
        segments,
        1,
      ),
      material,
      start.clone().add(end).multiplyScalar(0.5).toArray(),
      name,
    );
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    return mesh;
  }
  function plate(points, material, name, depth = 0.07) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) =>
      index ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    return add(geometry, material, [0, 0, 0], name);
  }
  function curve(points, radius, material, name, tubularSegments = 14) {
    const path = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
    );
    return add(
      new THREE.TubeGeometry(path, tubularSegments, radius, 5, false),
      material,
      [0, 0, 0],
      name,
    );
  }
  const variation = () => 0.94 + random() * 0.12;
  const width = c.bodyWidth * variation();
  const headScale = c.headSize * variation();
  const legs = c.legLength * variation();
  let bodyY = 1.13,
    bw = 0.63 * width,
    bh = 0.8,
    bd = 0.48;
  let head = [0, 2.17, 0.14],
    hs = [0.64 * headScale, 0.57 * headScale, 0.52 * headScale];
  const feet = [];
  if (c.bodyPlan === "biped") {
    bodyY = 0.7 * legs + 0.5;
    head = [0, bodyY + 0.95, 0.14];
    for (const sign of [-1, 1]) {
      const x = sign * bw * 0.57;
      link(
        [x, 0.22, 0],
        [x, bodyY - 0.42, -0.04],
        0.2,
        0.24,
        skin,
        `leg_${sign < 0 ? "L" : "R"}`,
      );
      feet.push([x, 0.16, 0.19]);
      const armTop = [sign * bw * 0.8, bodyY + 0.3, 0];
      const paw = [sign * (bw + 0.19), bodyY - 0.34, 0.13];
      link(armTop, paw, 0.18, 0.14, skin, `arm_${sign < 0 ? "L" : "R"}`);
      oval(paw, [0.17, 0.19, 0.18], accent, `hand_${sign < 0 ? "L" : "R"}`);
    }
  } else if (c.bodyPlan === "quadruped") {
    bodyY = 0.72 * legs + 0.43;
    bh = 0.55;
    bd = 0.96;
    bw = 0.65 * width;
    head = [0, bodyY + 0.48, 0.9];
    for (const sign of [-1, 1])
      for (const front of [-1, 1]) {
        const x = sign * bw * 0.66,
          z = front * 0.62;
        link(
          [x, 0.17, z],
          [x, bodyY - 0.17, z],
          0.17,
          0.22,
          skin,
          `leg_${front > 0 ? "front" : "back"}_${sign < 0 ? "L" : "R"}`,
        );
        feet.push([x, 0.14, z + 0.12]);
      }
    oval([0, bodyY + 0.34, 0.65], [bw * 0.62, 0.51, 0.49], skin, "neck");
  } else if (c.bodyPlan === "avian") {
    bodyY = 0.65 * legs + 0.63;
    bh = 0.78;
    bd = 0.55;
    head = [0, bodyY + 0.82, 0.12];
    hs = [0.49 * headScale, 0.49 * headScale, 0.45 * headScale];
    for (const sign of [-1, 1]) {
      const x = sign * bw * 0.47;
      link(
        [x, 0.16, 0],
        [x, bodyY - 0.4, 0],
        0.075,
        0.13,
        accent,
        `bird_leg_${sign}`,
      );
      feet.push([x, 0.1, 0.15]);
    }
  } else if (c.bodyPlan === "serpent") {
    bw = 0.5 * width;
    bh = 0.57;
    bd = 0.72;
    bodyY = 0.88;
    head = [0, 1.66, 0.58];
    const centers = [
      [0, 0.23, -1.65],
      [-0.23, 0.3, -1.2],
      [-0.28, 0.46, -0.7],
      [0, 0.75, -0.2],
    ];
    centers.forEach((point, index) =>
      oval(
        point,
        [bw * (0.4 + index * 0.17), 0.19 + index * 0.1, 0.46],
        skin,
        `serpent_segment_${index}`,
      ),
    );
    link([0, 0.9, 0.2], [0, 1.4, 0.46], 0.37, 0.31, skin, "serpent_neck");
    feet.push([0, 0.13, -0.37]);
  } else {
    bodyY = 0.79;
    bw = 0.87 * width;
    bh = 0.7;
    bd = 0.72;
    head = [0, bodyY + 0.32, 0.3];
    hs = [0.7 * headScale, 0.54 * headScale, 0.59 * headScale];
    for (const sign of [-1, 1]) feet.push([sign * bw * 0.56, 0.13, 0.3]);
  }
  oval([0, bodyY, 0], [bw, bh, bd], skin, "body");
  oval(head, hs, skin, "head");
  feet.forEach((point, i) => {
    oval(
      point,
      [c.bodyPlan === "avian" ? 0.18 : 0.25, 0.17, 0.33],
      accent,
      `foot_${i}`,
    );
    if (c.temperament > 0.55 || c.bodyPlan === "avian")
      for (const toe of [-1, 0, 1]) {
        link(
          [point[0] + toe * 0.105, point[1], point[2] + 0.18],
          [point[0] + toe * 0.105, point[1] - 0.02, point[2] + 0.42],
          0.06,
          0.008,
          white,
          `claw_${i}_${toe}`,
        );
      }
  });
  if (c.pattern === "belly")
    oval(
      [0, bodyY - 0.04, bd * 0.83],
      [bw * 0.62, bh * 0.71, 0.12],
      accent,
      "belly_patch",
    );
  if (c.pattern === "spots")
    for (let i = 0; i < 8; i++) {
      const x = (random() - 0.5) * bw * 1.35,
        y = (random() - 0.5) * bh * 1.35;
      const z =
        bd * Math.sqrt(Math.max(0.1, 1 - (x / bw) ** 2 - (y / bh) ** 2));
      const radius = 0.09 + random() * 0.06;
      oval(
        [x, bodyY + y, z + 0.014],
        [radius, radius * 0.8, 0.025],
        accent,
        `spot_${i}`,
      );
    }
  if (c.pattern === "stripes")
    for (let i = -1; i <= 1; i++) {
      const y = i * bh * 0.34;
      oval(
        [0, bodyY + y, bd * Math.sqrt(1 - (y / bh) ** 2)],
        [bw * 0.76, 0.065, 0.04],
        shade,
        `stripe_${i}`,
      );
    }
  const [hx, hy, hz] = head;
  const [hw, hh, hd] = hs;
  if (c.bodyPlan === "avian") {
    link(
      [0, hy - 0.12, hz + hd * 0.75],
      [0, hy - 0.17, hz + hd + 0.24 + c.snout * 0.16],
      0.16,
      0.005,
      accent,
      "beak",
    );
  } else {
    const muzzleZ = hz + hd * 0.77;
    const muzzleDepth = 0.15 + c.snout * 0.25;
    oval(
      [0, hy - hh * 0.35, muzzleZ],
      [hw * 0.47, hh * 0.32, muzzleDepth],
      accent,
      "muzzle",
    );
    oval(
      [0, hy - hh * 0.17, muzzleZ + muzzleDepth * 0.9],
      [0.082 * headScale, 0.059 * headScale, 0.043],
      dark,
      "nose",
    );
    const mouthY = hy - hh * 0.51,
      mouthZ = muzzleZ + muzzleDepth * 0.88;
    curve(
      [
        [-hw * 0.2, mouthY + 0.025, mouthZ],
        [0, mouthY - (1 - c.temperament) * 0.04, mouthZ + 0.02],
        [hw * 0.2, mouthY + 0.025, mouthZ],
      ],
      0.014,
      dark,
      "mouth",
      8,
    );
    if (c.temperament > 0.55)
      for (const sign of [-1, 1])
        link(
          [sign * hw * 0.2, mouthY + 0.05, mouthZ + 0.02],
          [sign * hw * 0.2, mouthY - 0.08, mouthZ + 0.025],
          0.046,
          0.006,
          white,
          `fang_${sign}`,
        );
  }
  const eyePositions =
    c.eyeCount === 1
      ? [[0, 0.05]]
      : c.eyeCount === 3
        ? [
            [-hw * 0.37, 0.02],
            [hw * 0.37, 0.02],
            [0, hh * 0.42],
          ]
        : [
            [-hw * 0.37, 0.05],
            [hw * 0.37, 0.05],
          ];
  eyePositions.forEach(([x, y], index) => {
    const z =
      hz + hd * Math.sqrt(Math.max(0.15, 1 - (x / hw) ** 2 - (y / hh) ** 2));
    const size = (c.eyeCount === 1 ? 0.24 : 0.155) * headScale;
    const eyeY = size * (1.34 - c.temperament * 0.65);
    oval(
      [x, hy + y, z + 0.014],
      [size, eyeY, 0.067],
      white,
      `eye_white_${index}`,
    );
    oval(
      [x, hy + y, z + 0.069],
      [size * 0.62, eyeY * 0.76, 0.032],
      dark,
      `pupil_${index}`,
    );
    oval(
      [x - size * 0.2, hy + y + eyeY * 0.3, z + 0.099],
      [size * 0.23, size * 0.25, 0.012],
      white,
      `eye_glint_${index}`,
    );
    if (c.temperament > 0.5) {
      const brow = oval(
        [x, hy + y + eyeY * 0.86, z + 0.061],
        [size * 1.12, 0.035, 0.045],
        shade,
        `brow_${index}`,
      );
      brow.rotation.z = x < 0 ? -0.25 : 0.25;
    }
  });
  for (const sign of [-1, 1]) {
    const earX = sign * hw * 0.88,
      earY = hy + hh * 0.67;
    if (c.ears === "round") {
      oval([earX, earY, hz], [hw * 0.32, hw * 0.34, 0.13], skin, `ear_${sign}`);
      oval(
        [earX, earY, hz + 0.11],
        [hw * 0.21, hw * 0.23, 0.033],
        accent,
        `inner_ear_${sign}`,
      );
    } else if (c.ears !== "none") {
      const length = (c.ears === "long" ? 0.88 : 0.51) * headScale;
      const ear = oval(
        [earX, earY + length * 0.32, hz - 0.03],
        [hw * 0.23, length * 0.58, 0.13],
        skin,
        `ear_${sign}`,
      );
      ear.rotation.z = -sign * 0.27;
      const inner = oval(
        [earX, earY + length * 0.37, hz + 0.075],
        [hw * 0.13, length * 0.4, 0.026],
        accent,
        `inner_ear_${sign}`,
      );
      inner.rotation.z = ear.rotation.z;
    }
    if (c.horns !== "none") {
      const root = [sign * hw * 0.49, hy + hh * 0.78, hz - hd * 0.12];
      const tip = [
        sign * hw * 0.82,
        root[1] + (c.horns === "small" ? 0.28 : 0.65) * headScale,
        root[2] - (c.horns === "swept" ? 0.35 : 0.05),
      ];
      link(root, tip, 0.115 * headScale, 0.008, accent, `horn_${sign}`);
      if (c.horns === "antlers")
        for (let i = 0; i < 2; i++) {
          const t = 0.38 + i * 0.24;
          const branch = root.map((value, j) => value + (tip[j] - value) * t);
          link(
            branch,
            [branch[0] + sign * 0.27, branch[1] + 0.24, branch[2] + 0.1],
            0.052,
            0.006,
            accent,
            `antler_branch_${sign}_${i}`,
          );
        }
    }
  }
  if (c.crest !== "none")
    for (let i = 0; i < 5; i++) {
      const z = -bd * 0.8 + i * bd * 0.32;
      const y = bodyY + bh * Math.sqrt(Math.max(0.05, 1 - (z / bd) ** 2));
      if (c.crest === "leaves") {
        const leaf = plate(
          [
            [-0.12, 0],
            [-0.21, 0.3],
            [0, 0.55],
            [0.15, 0.25],
          ],
          feature,
          `back_leaf_${i}`,
        );
        leaf.position.set(0, y, z);
        leaf.rotation.y = i * 0.9;
      } else {
        link(
          [0, y - 0.03, z],
          [(random() - 0.5) * 0.1, y + 0.25 + random() * 0.27, z - 0.12],
          c.crest === "crystals" ? 0.15 : 0.11,
          0.003,
          feature,
          `back_${c.crest}_${i}`,
        );
      }
    }
  if (c.wings !== "none")
    for (const sign of [-1, 1]) {
      const anchorX = sign * bw * 0.63,
        anchorY = bodyY + bh * 0.48;
      if (c.wings === "bat") {
        const points = [
          [0, 0],
          [sign * 0.65, 0.55],
          [sign * 1.52, 0.37],
          [sign * 1.14, -0.16],
          [sign * 0.89, 0.04],
          [sign * 0.61, -0.38],
          [sign * 0.42, -0.15],
          [0, -0.41],
        ];
        const membrane = plate(points, accent, `wing_membrane_${sign}`);
        membrane.position.set(anchorX, anchorY, -0.22);
        for (const tip of [
          [sign * 0.65, 0.55],
          [sign * 1.52, 0.37],
          [sign * 0.61, -0.38],
        ])
          link(
            [anchorX, anchorY, -0.17],
            [anchorX + tip[0], anchorY + tip[1], -0.17],
            0.07,
            0.03,
            skin,
            `wing_finger_${sign}_${tip[0]}`,
          );
      } else if (c.wings === "feathered") {
        oval(
          [anchorX + sign * 0.48, anchorY + 0.02, -0.15],
          [0.6, 0.21, 0.19],
          skin,
          `wing_shoulder_${sign}`,
        );
        for (let i = 0; i < 5; i++) {
          const feather = oval(
            [
              anchorX + sign * (0.56 + i * 0.17),
              anchorY - 0.25 - i * 0.04,
              -0.1,
            ],
            [0.15, 0.51 - i * 0.03, 0.095],
            i % 2 ? accent : skin,
            `wing_feather_${sign}_${i}`,
          );
          feather.rotation.z = -sign * (0.3 + i * 0.15);
        }
      } else
        for (let i = 0; i < 4; i++) {
          link(
            [anchorX + sign * 0.15, anchorY - 0.2, -0.16],
            [
              anchorX + sign * (0.72 + i * 0.23),
              anchorY + 0.6 - i * 0.19,
              -0.15,
            ],
            0.16,
            0.006,
            accent,
            `crystal_wing_${sign}_${i}`,
          );
        }
    }
  if (c.tail !== "none") {
    const start = [0, bodyY - 0.05, -bd * 0.78];
    const points =
      c.tail === "curled"
        ? [
            start,
            [0.3, bodyY + 0.12, -bd - 0.55],
            [0.6, bodyY + 0.63, -bd - 0.75],
            [0.28, bodyY + 0.82, -bd - 0.7],
            [0.08, bodyY + 0.56, -bd - 0.62],
          ]
        : [
            start,
            [0.2, bodyY - 0.1, -bd - 0.48],
            [0.35, bodyY + 0.18, -bd - 0.95],
          ];
    curve(points, 0.11, skin, "tail");
    const tip = points.at(-1);
    if (c.tail === "tuft") {
      oval(tip, [0.24, 0.25, 0.33], accent, "tail_tuft");
      if (c.bodyPlan === "avian")
        for (const sign of [-1, 1]) {
          const feather = oval(
            [tip[0] + sign * 0.18, tip[1], tip[2] - 0.1],
            [0.15, 0.12, 0.49],
            accent,
            `tail_feather_${sign}`,
          );
          feather.rotation.y = -sign * 0.2;
        }
    } else if (c.tail === "pointed")
      link(
        tip,
        [tip[0], tip[1] + 0.14, tip[2] - 0.32],
        0.16,
        0.005,
        accent,
        "tail_point",
      );
    else if (c.tail === "fin")
      for (const sign of [-1, 1]) {
        const fin = plate(
          [
            [0, 0],
            [sign * 0.44, 0.3],
            [sign * 0.33, -0.22],
          ],
          accent,
          `tail_fin_${sign}`,
          0.09,
        );
        fin.position.set(...tip);
        fin.rotation.x = 0.6;
      }
  }
  // Small elemental motifs reinforce each silhouette without adding textures.
  if (c.element === "nature")
    for (const sign of [-1, 1]) {
      const sprout = plate(
        [
          [0, 0],
          [sign * 0.3, 0.12],
          [sign * 0.26, 0.43],
          [sign * 0.05, 0.23],
        ],
        shade,
        `head_leaf_${sign}`,
      );
      sprout.position.set(0, hy + hh * 0.9, hz + 0.04);
    }
  if (c.element === "fire")
    for (let i = -1; i <= 1; i++)
      link(
        [i * 0.16, hy + hh * 0.81, hz + 0.1],
        [i * 0.19, hy + hh + 0.29 + (i === 0 ? 0.17 : 0), hz - 0.03],
        0.14,
        0.005,
        accent,
        `flame_crest_${i}`,
      );
  if (c.element === "water")
    for (const sign of [-1, 1]) {
      const fin = plate(
        [
          [0, 0],
          [sign * 0.4, 0.2],
          [sign * 0.29, -0.32],
          [0, -0.23],
        ],
        accent,
        `cheek_fin_${sign}`,
      );
      fin.position.set(sign * hw * 0.82, hy - 0.1, hz);
    }
  if (c.element === "frost")
    for (let i = -1; i <= 1; i++)
      link(
        [i * 0.15, hy + hh * 0.86, hz],
        [i * 0.2, hy + hh + 0.3, hz],
        0.11,
        0.002,
        white,
        `ice_crown_${i}`,
      );
  if (c.element === "storm") {
    const bolt = plate(
      [
        [-0.09, 0],
        [0.13, 0.27],
        [0.01, 0.25],
        [0.09, 0.52],
        [-0.17, 0.2],
        [-0.04, 0.2],
      ],
      accent,
      "lightning_crest",
    );
    bolt.position.set(0, hy + hh * 0.92, hz);
  }
  group.userData = {
    ...group.userData,
    kind: "procedural-creature",
    bodyPlan: c.bodyPlan,
    element: c.element,
    rigged: false,
    seed: config.seed,
  };
}
