import * as THREE from "three";
import {
  CREATURE_PRESETS,
  isCreatureType,
  parseCreaturePrompt,
  populateCreature,
} from "./creatures.js";

import {
  HUMAN_PRESETS,
  isHumanType,
  parseHumanPrompt,
  populateHuman,
} from "./humans.js";

export const ASSETS = [
  {
    id: "sword",
    name: "Sword",
    category: "Weapons",
    description: "A blade for your next adventure",
    primary: "#9ebcab",
    accent: "#dcc399",
  },
  {
    id: "shield",
    name: "Shield",
    category: "Weapons",
    description: "A trusty guardian of the realm",
    primary: "#819b8b",
    accent: "#dcc399",
  },
  {
    id: "tree",
    name: "Tree",
    category: "Nature",
    description: "Bring your world to life",
    primary: "#719776",
    accent: "#a38362",
  },
  {
    id: "rock",
    name: "Rock",
    category: "Nature",
    description: "A little terrain, a lot of character",
    primary: "#9caaa7",
    accent: "#bdd29e",
  },
  {
    id: "chest",
    name: "Chest",
    category: "Props",
    description: "Something worth discovering",
    primary: "#a17b59",
    accent: "#d5bc85",
  },
  {
    id: "potion",
    name: "Potion",
    category: "Props",
    description: "A pocket-sized bit of magic",
    primary: "#99baa8",
    accent: "#d1b78e",
  },
  ...CREATURE_PRESETS.map((preset) => ({ ...preset, category: "Creatures" })),
  ...HUMAN_PRESETS.map((preset) => ({ ...preset, category: "Humans" })),
];

export const SCALE_LIMITS = Object.freeze({ min: 0.25, max: 100 });
export function normalizeScale(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? THREE.MathUtils.clamp(number, SCALE_LIMITS.min, SCALE_LIMITS.max)
    : 1;
}

export const DEFAULT_CONFIG = {
  type: "sword",
  name: "Verdant blade",
  seed: 42,
  detail: 1,
  scale: 1,
  primary: "#9ebcab",
  accent: "#dcc399",
};

function randomGenerator(seed) {
  let n = Number(seed) >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildModel(config = DEFAULT_CONFIG) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const group = new THREE.Group();
  group.name = settings.name || settings.type;
  const random = randomGenerator(settings.seed);
  const segments = [6, 8, 12][settings.detail] || 8;
  if (isCreatureType(settings.type) || isHumanType(settings.type)) {
    if (isHumanType(settings.type)) populateHuman(group, settings, random);
    else populateCreature(group, settings, random);
    group.scale.setScalar(normalizeScale(settings.scale));
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(group);
    group.position.y -= bounds.min.y;
    group.updateMatrixWorld(true);
    return group;
  }
  let materialIndex = 0;
  const material = (color, metalness = 0, roughness = 0.7) => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      flatShading: true,
    });
    mat.name = `material_${materialIndex++}`;
    return mat;
  };
  const main = material(
    settings.primary,
    settings.type === "sword" ? 0.42 : 0.08,
  );
  const trim = material(settings.accent, 0.4, 0.45);
  const dark = material("#4b5b50");
  const wood = material("#745b48");
  function add(
    geometry,
    mat,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    name = "part",
  ) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const box = (size, mat, pos, rot, name) =>
    add(new THREE.BoxGeometry(...size), mat, pos, rot, name);
  const cylinder = (top, bottom, height, mat, pos, name) =>
    add(
      new THREE.CylinderGeometry(top, bottom, height, segments),
      mat,
      pos,
      [0, 0, 0],
      name,
    );
  function extrude(points, depth, mat, pos, name, bevel = 0.035) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    geo.translate(0, 0, -depth / 2);
    return add(geo, mat, pos, [0, 0, 0], name);
  }
  if (settings.type === "sword") {
    const width = 0.23 + random() * 0.035;
    extrude(
      [
        [-width, 1.18],
        [-width, 2.8],
        [0, 3.34],
        [width, 2.8],
        [width, 1.18],
      ],
      0.12,
      main,
      [0, 0, 0],
      "blade",
    );
    extrude(
      [
        [-0.025, 1.28],
        [-0.025, 2.83],
        [0, 3.13],
        [0.025, 2.83],
        [0.025, 1.28],
      ],
      0.014,
      trim,
      [0, 0, 0.105],
      "blade-inlay",
      0.004,
    );
    extrude(
      [
        [-0.61, 1.03],
        [-0.58, 1.23],
        [-0.2, 1.31],
        [0, 1.2],
        [0.2, 1.31],
        [0.58, 1.23],
        [0.61, 1.03],
        [0.2, 1.12],
        [-0.2, 1.12],
      ],
      0.18,
      trim,
      [0, 0, 0],
      "crossguard",
    );
    cylinder(0.115, 0.115, 0.72, dark, [0, 0.69, 0], "grip");
    for (let i = 0; i < 7; i++) {
      cylinder(0.124, 0.124, 0.042, wood, [0, 0.4 + i * 0.096, 0], "grip-wrap");
    }
    cylinder(0.15, 0.17, 0.15, trim, [0, 0.27, 0], "pommel");
    add(
      new THREE.IcosahedronGeometry(0.14, 0),
      main,
      [0, 0.14, 0],
      [0, 0, 0],
      "pommel-gem",
    );
    add(
      new THREE.OctahedronGeometry(0.13),
      main,
      [0, 1.17, 0.19],
      [0, 0, Math.PI / 4],
      "guard-gem",
    );
  } else if (settings.type === "shield") {
    const outline = [
      [-0.94, 2.8],
      [0, 3.1],
      [0.94, 2.8],
      [0.85, 1.23],
      [0, 0.25],
      [-0.85, 1.23],
    ];
    extrude(outline, 0.16, trim, [0, 0, 0], "shield-rim");
    extrude(
      outline.map(([x, y]) => [x * 0.88, (y - 1.7) * 0.89 + 1.7]),
      0.16,
      main,
      [0, 0, 0.115],
      "shield-face",
    );
    box([0.085, 2.12, 0.09], trim, [0, 1.73, 0.25], [0, 0, 0], "vertical-band");
    box(
      [1.62, 0.095, 0.09],
      trim,
      [0, 2.05, 0.25],
      [0, 0, 0],
      "horizontal-band",
    );
    add(
      new THREE.OctahedronGeometry(0.3),
      trim,
      [0, 1.93, 0.32],
      [0, 0, Math.PI / 4],
      "boss",
    );
    [-0.73, 0.73].forEach((x) =>
      add(
        new THREE.IcosahedronGeometry(0.065),
        trim,
        [x, 2.58, 0.24],
        [0, 0, 0],
        "rivet",
      ),
    );
    box([0.7, 0.13, 0.15], dark, [0, 1.6, -0.25], [0, 0, 0], "handle");
  } else if (settings.type === "tree") {
    cylinder(0.12, 0.23, 1.1, trim, [0, 0.55, 0], "trunk");
    for (let i = 0; i < 3; i++) {
      const color = new THREE.Color(settings.primary).offsetHSL(
        0,
        0,
        i * 0.045,
      );
      add(
        new THREE.ConeGeometry(1.0 - i * 0.23, 1.65 - i * 0.2, segments),
        material(color),
        [0, 1.65 + i * 0.65, 0],
        [0, random() * Math.PI, 0],
        "foliage",
      );
    }
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const root = box(
        [0.11, 0.18, 0.52],
        trim,
        [Math.sin(angle) * 0.17, 0.07, Math.cos(angle) * 0.17],
        [0, angle, 0],
        "root",
      );
      root.rotation.x = -0.15;
    }
  } else if (settings.type === "rock") {
    const geometry = new THREE.IcosahedronGeometry(1, settings.detail);
    const positions = geometry.attributes.position;
    const offsets = new Map();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i);
      const key = `${x.toFixed(5)}:${y.toFixed(5)}:${z.toFixed(5)}`;
      if (!offsets.has(key)) offsets.set(key, 0.85 + random() * 0.28);
      const jitter = offsets.get(key);
      positions.setXYZ(
        i,
        x * jitter * 1.3,
        Math.max(0.06, y * jitter * 0.9 + 0.75),
        z * jitter,
      );
    }
    geometry.computeVertexNormals();
    add(geometry, main, [0, 0, 0], [0, 0, 0], "rock");
    for (let i = 0; i < 4; i++) {
      const piece = add(
        new THREE.IcosahedronGeometry(0.2 + random() * 0.13, 0),
        trim,
        [(random() - 0.5) * 1.3, 0.12, (random() - 0.5) * 1.3],
        [random(), random(), random()],
        "moss",
      );
      piece.scale.y = 0.45;
    }
  } else if (settings.type === "chest") {
    box([1.9, 1, 1.2], main, [0, 0.6, 0], [0, 0, 0], "chest-base");
    const profile = new THREE.Shape();
    profile.moveTo(-0.6, 0);
    profile.lineTo(0.6, 0);
    for (let i = 1; i <= segments; i++) {
      const angle = (i / segments) * Math.PI;
      profile.lineTo(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6);
    }
    profile.closePath();
    const lidGeometry = new THREE.ExtrudeGeometry(profile, {
      depth: 1.9,
      bevelEnabled: false,
      steps: 1,
    });
    lidGeometry.translate(0, 0, -0.95);
    add(lidGeometry, main, [0, 1.1, 0], [0, Math.PI / 2, 0], "arched-lid");
    [-0.72, 0.72].forEach((x) => {
      box([0.12, 1.13, 1.28], trim, [x, 0.57, 0], [0, 0, 0], "base-band");
      const band = add(
        new THREE.TorusGeometry(0.63, 0.06, 4, segments, Math.PI),
        trim,
        [x, 1.1, 0],
        [0, Math.PI / 2, 0],
        "lid-band",
      );
      band.rotation.x = 0;
    });
    box([0.3, 0.38, 0.09], trim, [0, 1.01, 0.66], [0, 0, 0], "latch");
    box([0.055, 0.1, 0.02], dark, [0, 1.01, 0.715], [0, 0, 0], "keyhole");
    for (const x of [-0.73, 0.73])
      for (const z of [-0.42, 0.42])
        box([0.22, 0.16, 0.22], wood, [x, 0.08, z], [0, 0, 0], "foot");
  } else if (settings.type === "potion") {
    const points = [
      [0, 0.05],
      [0.45, 0.05],
      [0.7, 0.35],
      [0.76, 0.95],
      [0.55, 1.45],
      [0.23, 1.7],
      [0.23, 2.05],
      [0.29, 2.08],
      [0.29, 2.2],
      [0.17, 2.2],
      [0.17, 1.8],
      [0, 1.7],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    add(
      new THREE.LatheGeometry(points, segments),
      main,
      [0, 0, 0],
      [0, 0, 0],
      "bottle",
    );
    cylinder(0.22, 0.18, 0.27, wood, [0, 2.27, 0], "cork");
    cylinder(0.255, 0.255, 0.1, trim, [0, 1.82, 0], "neck-band");
    const label = box(
      [0.4, 0.5, 0.06],
      trim,
      [0, 0.92, 0.72],
      [0, 0, 0.12],
      "label",
    );
    label.rotation.x = -0.08;
    add(
      new THREE.OctahedronGeometry(0.115),
      dark,
      [0, 0.94, 0.77],
      [0, 0, Math.PI / 4],
      "label-emblem",
    );
  } else {
    throw new Error(`Unsupported asset type: ${settings.type}`);
  }
  group.scale.setScalar(normalizeScale(settings.scale));
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  group.position.y -= bounds.min.y;
  group.updateMatrixWorld(true);
  return group;
}

export function modelStats(model) {
  let triangles = 0,
    vertices = 0;
  const materials = new Set();
  model.traverse((child) => {
    if (!child.isMesh) return;
    const geometry = child.geometry;
    vertices += geometry.attributes.position.count;
    triangles +=
      (geometry.index
        ? geometry.index.count
        : geometry.attributes.position.count) / 3;
    materials.add(child.material.uuid);
  });
  const size = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  return {
    scale: model.scale.x,
    triangles: Math.round(triangles),
    vertices,
    materials: materials.size,
    bones: model.rig?.bones.length || 0,
    size: [size.x, size.y, size.z],
  };
}

export function disposeModel(model) {
  const materials = new Set();
  model.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();
      const list = Array.isArray(child.material)
        ? child.material
        : [child.material];
      list.forEach((mat) => materials.add(mat));
    }
  });
  materials.forEach((mat) => mat.dispose());
  model.rig?.skeleton.dispose();
}

export function interpretPrompt(text, current = DEFAULT_CONFIG) {
  const lower = text.toLowerCase();
  const humanResult = parseHumanPrompt(text, current);
  const creatureResult = humanResult || parseCreaturePrompt(text, current);
  const words = {
    sword: /\b(sword|blade|weapon|dagger)\b/,
    shield: /\b(shield|buckler)\b/,
    tree: /\b(tree|pine|fir|forest)\b/,
    rock: /\b(rock|boulder|stone)\b/,
    chest: /\b(chest|treasure|crate)\b/,
    potion: /\b(potion|bottle|elixir|flask)\b/,
  };
  const type =
    creatureResult?.type ||
    Object.keys(words).find((key) => words[key].test(lower));
  if (!type)
    return {
      error:
        "Try a human, knight, mage, elf, creature, dragon, rabbit, bird, slime, or a sword, shield, tree, rock, chest, or potion. Use supported anatomy and color words to customize the templates.",
    };
  const preset = ASSETS.find((asset) => asset.id === type);
  let primary = creatureResult?.primary || preset.primary;
  const colors = {
    red: "#bd7370",
    blue: "#789bbd",
    purple: "#a08bb7",
    pink: "#c99aaa",
    green: "#9ebcab",
    sage: "#9ebcab",
    gold: "#d1b77b",
    black: "#50545b",
    white: "#deded3",
    orange: "#c9976e",
    silver: "#aab4be",
  };
  for (const [name, hex] of Object.entries(colors))
    if (new RegExp(`\\b${name}\\b`).test(lower)) {
      primary = hex;
      break;
    }
  if (humanResult) {
    humanResult.human.topColor = primary;
    primary = humanResult.human.topColor;
  }
  const detail = /\b(simple|low-poly|low poly)\b/.test(lower)
    ? 0
    : /\b(detailed|high detail)\b/.test(lower)
      ? 2
      : current.detail;
  return {
    ...(creatureResult || current),
    type,
    primary,
    accent: creatureResult?.accent || preset.accent,
    detail,
    name: `${preset.name} ${current.seed}`,
    prompt: text,
    ...(isCreatureType(type) &&
    /\b(giant|huge|massive|titan|colossal|large)\b/.test(lower)
      ? {
          scale: /\b(titan|colossal)\b/.test(lower)
            ? 30
            : /\blarge\b/.test(lower) && !/\b(giant|huge|massive)\b/.test(lower)
              ? 3
              : 10,
        }
      : {}),
  };
}
