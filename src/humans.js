import * as THREE from "three";

export const HUMAN_RANGES = {
  height: ["Height", 0.85, 1.2, 1],
  shoulderWidth: ["Shoulder width", 0.7, 1.4, 1],
  chest: ["Chest size", 0.65, 1.45, 1],
  waist: ["Waist width", 0.65, 1.35, 1],
  hips: ["Hip width", 0.7, 1.45, 1],
  musculature: ["Muscle definition", 0, 1, 0.3],
  armLength: ["Arm length", 0.8, 1.25, 1],
  legLength: ["Leg length", 0.8, 1.25, 1],
  torsoLength: ["Torso length", 0.8, 1.2, 1],
  handSize: ["Hand size", 0.75, 1.3, 1],
  footSize: ["Foot size", 0.75, 1.3, 1],
  headSize: ["Head size", 0.8, 1.2, 1],
  faceWidth: ["Face width", 0.8, 1.3, 1],
  jawWidth: ["Jaw width", 0.65, 1.3, 1],
  chinLength: ["Chin length", 0.7, 1.3, 1],
  cheekbones: ["Cheekbone width", 0.7, 1.3, 1],
  eyeSize: ["Eye size", 0.7, 1.4, 1],
  eyeSpacing: ["Eye spacing", 0.75, 1.3, 1],
  browAngle: ["Brow angle", -0.5, 0.5, 0],
  noseWidth: ["Nose width", 0.7, 1.4, 0.9],
  noseLength: ["Nose projection", 0.5, 1.5, 0.85],
  mouthWidth: ["Mouth width", 0.65, 1.4, 1],
  lipFullness: ["Lip fullness", 0.6, 1.6, 1],
  earSize: ["Ear size", 0.7, 1.4, 1],
  hairVolume: ["Hair volume", 0.7, 1.4, 1],
  hairLength: ["Hair length", 0.65, 1.4, 1],
};
export const HUMAN_OPTIONS = {
  hair: {
    none: "Bald",
    cropped: "Cropped",
    swept: "Side swept",
    bob: "Bob",
    long: "Long",
    ponytail: "Ponytail",
    bun: "Bun",
    mohawk: "Mohawk",
    spiky: "Spiky",
    curls: "Curls",
    braids: "Braids",
  },
  facialHair: {
    none: "Clean shaven",
    stubble: "Stubble",
    moustache: "Moustache",
    goatee: "Goatee",
    beard: "Full beard",
  },
  eyebrows: { none: "None", slim: "Slim", natural: "Natural", thick: "Thick" },
  ears: { human: "Human", pointed: "Elf" },
  expression: { neutral: "Neutral", smile: "Smile", stern: "Stern" },
  top: {
    shirt: "T-shirt",
    tunic: "Tunic",
    vest: "Vest",
    jacket: "Jacket",
    armor: "Plate armor",
    robe: "Mage robe",
  },
  sleeves: { none: "Sleeveless", short: "Short", long: "Long" },
  bottom: { trousers: "Trousers", shorts: "Shorts", skirt: "Skirt" },
  footwear: { shoes: "Shoes", boots: "Boots", sandals: "Sandals" },
  gloves: { none: "None", leather: "Leather", gauntlets: "Gauntlets" },
  headwear: {
    none: "None",
    cap: "Cap",
    hood: "Hood",
    helmet: "Helmet",
    crown: "Crown",
    wizard: "Wizard hat",
  },
  glasses: {
    none: "None",
    round: "Round glasses",
    square: "Square glasses",
    eyepatch: "Eye patch",
  },
  earrings: { none: "None", studs: "Studs", hoops: "Hoops" },
  necklace: { none: "None", pendant: "Pendant", beads: "Beads" },
  belt: { none: "None", simple: "Simple", utility: "Utility" },
  cape: { none: "None", short: "Short cape", long: "Long cape" },
  backpack: { none: "None", small: "Satchel", large: "Adventure pack" },
};
export const HUMAN_COLORS = {
  skin: ["Skin tone", "#c68e6b"],
  hairColor: ["Hair color", "#403229"],
  eyeColor: ["Eye color", "#648c81"],
  browColor: ["Eyebrow color", "#403229"],
  lipColor: ["Lip color", "#a7665c"],
  topColor: ["Top color", "#638c79"],
  bottomColor: ["Bottom color", "#4d5562"],
  shoeColor: ["Footwear color", "#493c35"],
  accessoryColor: ["Accessory color", "#c8ae73"],
};
export const SKIN_TONES = [
  "#f3d5bd",
  "#e8bfa1",
  "#dba47f",
  "#c68e6b",
  "#a87250",
  "#88583e",
  "#6b422f",
  "#4d3026",
];
export const HUMAN_LOOKS = {
  soft: {
    label: "Soft",
    description: "Gentle jaw, open eyes, relaxed smile",
    values: {
      jawWidth: 0.82,
      cheekbones: 1.02,
      chinLength: 0.92,
      eyeSize: 1.08,
      eyeSpacing: 1.02,
      browAngle: -0.04,
      eyebrows: "natural",
      noseWidth: 0.85,
      noseLength: 0.78,
      mouthWidth: 1.05,
      lipFullness: 1.06,
      earSize: 0.9,
      expression: "smile",
      hair: "bob",
      hairVolume: 1.03,
      hairLength: 0.95,
      headSize: 1,
      faceWidth: 1.03,
      shoulderWidth: 0.96,
      waist: 0.94,
      musculature: 0.22,
      legLength: 1.04,
      handSize: 0.96,
      footSize: 0.94,
    },
  },
  defined: {
    label: "Defined",
    description: "Sculpted jaw, clear brows, swept hair",
    values: {
      jawWidth: 1.1,
      cheekbones: 1.06,
      chinLength: 1.02,
      eyeSize: 0.96,
      eyeSpacing: 1,
      browAngle: 0.02,
      eyebrows: "natural",
      noseWidth: 0.96,
      noseLength: 0.95,
      mouthWidth: 1.05,
      lipFullness: 0.9,
      earSize: 0.94,
      expression: "neutral",
      hair: "swept",
      hairVolume: 1.05,
      hairLength: 1,
      headSize: 1,
      faceWidth: 1,
      shoulderWidth: 1.12,
      waist: 0.96,
      musculature: 0.48,
      legLength: 1.04,
      handSize: 1,
      footSize: 0.96,
    },
  },
  elegant: {
    label: "Elegant",
    description: "Longer silhouette, fine brows, flowing hair",
    values: {
      jawWidth: 0.86,
      cheekbones: 1.05,
      chinLength: 1,
      eyeSize: 1.02,
      eyeSpacing: 1.04,
      browAngle: -0.02,
      eyebrows: "slim",
      noseWidth: 0.84,
      noseLength: 0.84,
      mouthWidth: 0.98,
      lipFullness: 1.08,
      earSize: 0.86,
      expression: "smile",
      hair: "long",
      hairVolume: 1.02,
      hairLength: 1.06,
      headSize: 0.97,
      faceWidth: 0.97,
      shoulderWidth: 0.95,
      waist: 0.9,
      musculature: 0.25,
      legLength: 1.1,
      handSize: 0.94,
      footSize: 0.9,
    },
  },
  heroic: {
    label: "Heroic",
    description: "Athletic silhouette, strong jaw, confident eyes",
    values: {
      jawWidth: 1.06,
      cheekbones: 1.08,
      chinLength: 1.03,
      eyeSize: 0.98,
      eyeSpacing: 1.03,
      browAngle: 0.04,
      eyebrows: "thick",
      noseWidth: 0.96,
      noseLength: 0.96,
      mouthWidth: 1.06,
      lipFullness: 0.95,
      earSize: 0.94,
      expression: "neutral",
      hair: "swept",
      hairVolume: 1.12,
      hairLength: 1,
      headSize: 0.96,
      faceWidth: 1.02,
      shoulderWidth: 1.18,
      chest: 1.12,
      waist: 0.93,
      musculature: 0.6,
      legLength: 1.08,
      handSize: 1,
      footSize: 0.96,
    },
  },
};

function humanHeadProfile(h) {
  return [
    [-1, 0.28 * h.jawWidth, 0.4],
    [-0.78, 0.62 * h.jawWidth, 0.65],
    [-0.45, 0.84 * h.jawWidth, 0.84],
    [-0.1, h.cheekbones, 0.99],
    [0.25, 1, 1],
    [0.58, 0.96, 0.94],
    [0.83, 0.72, 0.72],
    [1, 0.18, 0.2],
  ];
}

function humanHeadGeometry(h, segments) {
  // One continuous face: cheek and jaw controls change the silhouette rather
  // than attaching spherical lumps. Front facets are flatter for facial details.
  const profile = humanHeadProfile(h);
  const positions = [],
    uvs = [],
    indices = [];
  profile.forEach(([height, width, depth], row) => {
    const y = height < -0.45 ? -0.45 + (height + 0.45) * h.chinLength : height;
    for (let column = 0; column <= segments; column++) {
      const angle = (column / segments) * Math.PI * 2,
        cosine = Math.cos(angle);
      positions.push(
        Math.sin(angle) * width,
        y,
        Math.sign(cosine) * Math.abs(cosine) ** (cosine >= 0 ? 0.3 : 1) * depth,
      );
      uvs.push(column / segments, row / (profile.length - 1));
      if (row && column < segments) {
        const a = (row - 1) * (segments + 1) + column,
          b = row * (segments + 1) + column;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  });
  for (const [row, reverse] of [
    [0, true],
    [profile.length - 1, false],
  ]) {
    const center = positions.length / 3;
    positions.push(0, positions[row * (segments + 1) * 3 + 1], 0);
    uvs.push(0.5, reverse ? 0 : 1);
    for (let column = 0; column < segments; column++) {
      const a = row * (segments + 1) + column;
      indices.push(center, reverse ? a + 1 : a, reverse ? a : a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
export const BASE_HUMAN = Object.fromEntries([
  ...Object.entries(HUMAN_RANGES).map(([key, v]) => [key, v[3]]),
  ...Object.entries(HUMAN_COLORS).map(([key, v]) => [key, v[1]]),
  ...Object.entries(HUMAN_OPTIONS).map(([key, v]) => [key, Object.keys(v)[0]]),
  ["hair", "swept"],
  ["eyebrows", "natural"],
  ["sleeves", "short"],
  ["belt", "simple"],
  ["freckles", false],
  ["scar", false],
  ["shoulderArmor", false],
  ["wristbands", false],
]);
export const HUMAN_PRESETS = [
  {
    id: "human-ranger",
    name: "Ranger",
    description: "A woodland adventurer",
    primary: "#638c79",
    accent: "#c8ae73",
    human: {
      top: "tunic",
      sleeves: "long",
      footwear: "boots",
      belt: "utility",
      cape: "short",
      backpack: "small",
      hair: "ponytail",
    },
  },
  {
    id: "human-knight",
    name: "Knight",
    description: "A sturdy armored guardian",
    primary: "#9ba7b1",
    accent: "#c8ae73",
    human: {
      top: "armor",
      sleeves: "long",
      footwear: "boots",
      gloves: "gauntlets",
      shoulderArmor: true,
      shoulderWidth: 1.25,
      musculature: 0.8,
      hair: "cropped",
    },
  },
  {
    id: "human-mage",
    name: "Mage",
    description: "A curious wandering spellcaster",
    primary: "#8975ad",
    accent: "#dbbf7d",
    human: {
      top: "robe",
      sleeves: "long",
      headwear: "wizard",
      necklace: "pendant",
      hair: "long",
      waist: 0.8,
      hips: 1.15,
      jawWidth: 0.85,
      facialHair: "none",
    },
  },
  {
    id: "human-rogue",
    name: "Rogue",
    description: "A nimble shadow explorer",
    primary: "#555c70",
    accent: "#b88665",
    human: {
      top: "vest",
      sleeves: "none",
      hair: "mohawk",
      gloves: "leather",
      footwear: "boots",
      belt: "utility",
      scar: true,
      chest: 0.85,
      armLength: 1.05,
    },
  },
  {
    id: "human-traveler",
    name: "Traveler",
    description: "A warm, well traveled companion",
    primary: "#aa755d",
    accent: "#d8c391",
    human: {
      top: "jacket",
      sleeves: "long",
      backpack: "large",
      glasses: "round",
      facialHair: "beard",
      hair: "curls",
      skin: "#88583e",
      freckles: true,
    },
  },
  {
    id: "human-citizen",
    name: "Citizen",
    description: "Someone to populate your world",
    primary: "#819cb8",
    accent: "#d7b98b",
    human: {
      top: "shirt",
      bottom: "skirt",
      hair: "bob",
      hips: 1.2,
      shoulderWidth: 0.85,
      earrings: "hoops",
      necklace: "beads",
      skin: "#e8bfa1",
    },
  },
];
export const isHumanType = (type) => HUMAN_PRESETS.some((p) => p.id === type);
export function getHumanSettings(config) {
  const preset = HUMAN_PRESETS.find((p) => p.id === config.type);
  const input = { ...BASE_HUMAN, ...preset?.human, ...config.human },
    result = {};
  for (const [key, [, min, max, fallback]] of Object.entries(HUMAN_RANGES))
    result[key] = THREE.MathUtils.clamp(
      Number.isFinite(input[key]) ? input[key] : fallback,
      min,
      max,
    );
  for (const [key, options] of Object.entries(HUMAN_OPTIONS))
    result[key] = Object.hasOwn(options, input[key])
      ? input[key]
      : BASE_HUMAN[key];
  for (const [key, [, fallback]] of Object.entries(HUMAN_COLORS))
    result[key] = /^#[0-9a-f]{6}$/i.test(input[key]) ? input[key] : fallback;
  for (const key of ["freckles", "scar", "shoulderArmor", "wristbands"])
    result[key] = input[key] === true;
  return result;
}
export function validHumanSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, v]) => {
    if (HUMAN_RANGES[key])
      return (
        Number.isFinite(v) &&
        v >= HUMAN_RANGES[key][1] &&
        v <= HUMAN_RANGES[key][2]
      );
    if (HUMAN_OPTIONS[key]) return Object.hasOwn(HUMAN_OPTIONS[key], v);
    if (HUMAN_COLORS[key])
      return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
    return (
      ["freckles", "scar", "shoulderArmor", "wristbands"].includes(key) &&
      typeof v === "boolean"
    );
  });
}
export function makeHumanConfig(type = "human-ranger", current = {}) {
  const preset = HUMAN_PRESETS.find((p) => p.id === type) || HUMAN_PRESETS[0];
  return {
    ...current,
    type: preset.id,
    name: preset.name,
    seed: current.seed ?? 42,
    detail: current.detail ?? 1,
    scale: current.scale ?? 1,
    primary: preset.primary,
    accent: preset.accent,
    human: {
      ...BASE_HUMAN,
      ...preset.human,
      topColor: preset.primary,
      accessoryColor: preset.accent,
    },
    rig: { enabled: true, speed: 1, intensity: 1, pose: {} },
  };
}
export function parseHumanPrompt(text, current) {
  const lower = text.toLowerCase();
  if (
    /\b(creature|dragon|rabbit|bird|slime|serpent|lizard|crocodile|dinosaur|reptile)\b/.test(
      lower,
    ) &&
    !/\b(human|person|man|woman|elf|knight|mage|rogue|ranger)\b/.test(lower)
  )
    return null;
  if (
    !/\b(human|person|character|ranger|knight|mage|rogue|traveler|citizen|man|woman|warrior|wizard|elf)\b/.test(
      lower,
    )
  )
    return null;
  const species = /\bknight|warrior\b/.test(lower)
    ? "knight"
    : /\bmage|wizard\b/.test(lower)
      ? "mage"
      : /\brogue\b/.test(lower)
        ? "rogue"
        : /\btraveler\b/.test(lower)
          ? "traveler"
          : /\bcitizen\b/.test(lower)
            ? "citizen"
            : "ranger";
  const next =
    isHumanType(current.type) &&
    !/\b(ranger|knight|mage|rogue|traveler|citizen|warrior|wizard)\b/.test(
      lower,
    ) &&
    /\b(human|person|character|man|woman|elf)\b/.test(lower)
      ? { ...current, human: getHumanSettings(current) }
      : makeHumanConfig(`human-${species}`, current);
  const h = next.human;
  for (const [key, options] of Object.entries(HUMAN_OPTIONS))
    for (const option of Object.keys(options))
      if (
        option !== "none" &&
        new RegExp(`\\b${option === "ponytail" ? "ponytail" : option}\\b`).test(
          lower,
        )
      )
        h[key] = option;
  if (/\belf\b/.test(lower)) h.ears = "pointed";
  if (/\bbald\b/.test(lower)) h.hair = "none";
  if (/\bno beard|clean shaven\b/.test(lower)) h.facialHair = "none";
  if (/\bfreckles\b/.test(lower)) h.freckles = true;
  if (/\bscar\b/.test(lower)) h.scar = true;
  const hair = {
    black: "#29272c",
    brown: "#594032",
    blonde: "#d7b56f",
    red: "#a95d3e",
    white: "#e1ded3",
    pink: "#c992b0",
    blue: "#6e95bc",
  };
  for (const [word, color] of Object.entries(hair))
    if (new RegExp(`\\b${word} hair\\b`).test(lower)) h.hairColor = color;
  return next;
}

export function populateHuman(group, config, random) {
  const h = getHumanSettings(config),
    seg = [8, 12, 16][config.detail] || 12,
    rings = [5, 7, 9][config.detail] || 7;
  let materialIndex = 0;
  const materialPool = [];
  const mat = (color, name, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: metalness ? 0.4 : 0.8,
      metalness,
    });
    m.name = `human_${name}_${materialIndex++}`;
    materialPool.push(m);
    return m;
  };
  const skin = mat(h.skin, "skin"),
    hair = mat(h.hairColor, "hair"),
    brow = mat(h.browColor, "brows"),
    lips = mat(h.lipColor, "lips"),
    white = mat("#f8f1e6", "eye_white"),
    dark = mat("#262b30", "pupil"),
    iris = mat(h.eyeColor, "iris");
  const top = mat(h.topColor, "top", h.top === "armor" ? 0.65 : 0),
    bottom = mat(h.bottomColor, "bottom"),
    shoes = mat(h.shoeColor, "shoes"),
    trim = mat(h.accessoryColor, "trim", 0.55);
  const add = (geo, material, pos, name) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const oval = (pos, size, material, name) => {
    const m = add(new THREE.SphereGeometry(1, seg, rings), material, pos, name);
    m.scale.set(...size);
    return m;
  };
  const box = (pos, size, material, name) =>
    add(new THREE.BoxGeometry(...size), material, pos, name);
  const link = (a, b, ra, rb, material, name) => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      d = end.clone().sub(start);
    const m = add(
      new THREE.CylinderGeometry(rb, ra, d.length(), seg, 1),
      material,
      start.clone().add(end).multiplyScalar(0.5).toArray(),
      name,
    );
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  };
  const tube = (points, radius, material, name) =>
    add(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        12,
        radius,
        5,
        false,
      ),
      material,
      [0, 0, 0],
      name,
    );
  const legH = 0.76 * h.legLength * h.height,
    pelvisY = legH + 0.15,
    torsoH = 0.46 * h.torsoLength * h.height;
  const shoulderY = pelvisY + torsoH * 0.84,
    shoulderX = 0.205 * h.shoulderWidth,
    pelvisX = 0.13 * h.hips;
  const headScale = 0.9 * h.headSize,
    headY = pelvisY + torsoH + 0.235 * headScale,
    hw = 0.125 * h.faceWidth * headScale,
    hh = 0.17 * headScale,
    hd = 0.118 * headScale;
  const bodyY = pelvisY + torsoH * 0.42,
    bodyWidth = 0.175 * h.chest;
  oval(
    [0, bodyY, 0],
    [bodyWidth, torsoH * 0.55, 0.105 * h.chest],
    skin,
    "body",
  );
  oval([0, pelvisY - 0.01, 0], [0.17 * h.hips, 0.13, 0.115], bottom, "pelvis");
  oval(
    [0, pelvisY + torsoH * 0.1, 0],
    [0.145 * h.waist, 0.17, 0.098],
    top,
    "waist",
  );
  oval(
    [0, bodyY, 0],
    [bodyWidth * 1.045, torsoH * 0.58, 0.11 * h.chest],
    top,
    "shirt",
  );
  if (h.musculature > 0.35)
    for (const sign of [-1, 1])
      oval(
        [sign * 0.08 * h.chest, bodyY + 0.09, 0.067],
        [0.09 * h.chest, 0.09, 0.065 * (0.6 + h.musculature)],
        top,
        `chest_detail_${sign}`,
      );
  link(
    [0, pelvisY + torsoH - 0.02, 0],
    [0, headY - 0.12, 0],
    0.052,
    0.047,
    skin,
    "neck",
  );
  const head = add(humanHeadGeometry(h, seg), skin, [0, headY, 0], "head");
  head.scale.set(hw, hh, hd);
  const bindings = {};
  for (const [i, sign] of [-1, 1].entries()) {
    const side = sign < 0 ? "L" : "R",
      hip = [sign * pelvisX, pelvisY - 0.035, 0],
      ankle = [sign * pelvisX, 0.13, 0.015];
    const legRadius = 0.077 * (1 + h.musculature * 0.22) * h.hips;
    link(ankle, hip, legRadius * 0.7, legRadius, bottom, `leg_${side}`);
    if (h.bottom === "shorts") {
      const leg = group.getObjectByName(`leg_${side}`);
      leg.material = skin;
      link(
        [sign * pelvisX, pelvisY - legH * 0.38, 0],
        hip,
        legRadius * 0.9,
        legRadius * 1.05,
        bottom,
        `pants_${side}`,
      );
      bindings[`pants_${side}`] = `leg_${side}`;
    }
    oval(
      [sign * pelvisX, 0.085, 0.073],
      [0.087 * h.footSize, 0.067, 0.155 * h.footSize],
      h.footwear === "sandals" ? skin : shoes,
      `foot_${i}`,
    );
    if (h.footwear === "boots") {
      link(
        [sign * pelvisX, 0.09, 0],
        [sign * pelvisX, 0.34, 0],
        legRadius * 0.86,
        legRadius * 0.98,
        shoes,
        `boot_${i}`,
      );
      bindings[`boot_${i}`] = `leg_${side}`;
    }
    if (h.footwear === "sandals") {
      box(
        [sign * pelvisX, 0.035, 0.072],
        [0.175 * h.footSize, 0.025, 0.29 * h.footSize],
        shoes,
        `sandal_${i}`,
      );
      bindings[`sandal_${i}`] = `foot_${i}`;
      box(
        [sign * pelvisX, 0.12, 0.11],
        [0.176 * h.footSize, 0.025, 0.045],
        shoes,
        `sandal_strap_${i}`,
      );
      bindings[`sandal_strap_${i}`] = `foot_${i}`;
    }
    const shoulder = [sign * shoulderX, shoulderY, 0],
      wrist = [
        sign * (shoulderX + 0.15 * h.armLength),
        shoulderY - 0.43 * h.armLength,
        0.015,
      ];
    link(
      [sign * bodyWidth * 0.55, shoulderY - 0.06, 0],
      shoulder,
      0.062,
      0.058,
      top,
      `chest_bridge_${side}`,
    );
    const armRadius = 0.049 * (1 + h.musculature * 0.55);
    link(shoulder, wrist, armRadius, armRadius * 0.75, skin, `arm_${side}`);
    oval(
      [shoulder[0], shoulder[1] - 0.015, 0],
      [armRadius * 1.35, 0.075, 0.064],
      h.sleeves === "none" ? skin : top,
      `shoulder_${side}`,
    );
    bindings[`shoulder_${side}`] = `arm_${side}`;
    oval(
      [wrist[0], wrist[1] - 0.04, 0.019],
      [0.044 * h.handSize, 0.075 * h.handSize, 0.028 * h.handSize],
      h.gloves === "none" ? skin : h.gloves === "gauntlets" ? trim : shoes,
      `hand_${side}`,
    );
    oval(
      [wrist[0] - sign * 0.035 * h.handSize, wrist[1] - 0.018, 0.028],
      [0.02 * h.handSize, 0.04 * h.handSize, 0.02 * h.handSize],
      h.gloves === "none" ? skin : shoes,
      `thumb_${side}`,
    );
    bindings[`thumb_${side}`] = `hand_${side}`;
    if (h.sleeves !== "none") {
      const end = new THREE.Vector3(...shoulder)
        .lerp(new THREE.Vector3(...wrist), h.sleeves === "short" ? 0.4 : 0.94)
        .toArray();
      link(
        shoulder,
        end,
        armRadius * 1.16,
        armRadius * 0.86,
        top,
        `sleeve_${side}`,
      );
      bindings[`sleeve_${side}`] = `arm_${side}`;
    }
    if (h.wristbands) {
      oval(wrist, [0.059, 0.029, 0.045], trim, `wristband_${side}`);
      bindings[`wristband_${side}`] = `hand_${side}`;
    }
    if (h.shoulderArmor) {
      oval(
        [shoulder[0], shoulder[1] + 0.025, 0],
        [0.09, 0.065, 0.085],
        trim,
        `pauldron_${side}`,
      );
      bindings[`pauldron_${side}`] = `arm_${side}`;
    }
    const eyeX = sign * hw * 0.43 * h.eyeSpacing,
      eyeY = headY + hh * 0.09,
      eyeZ = hd * 1.01;
    const eyeWidth = 0.028 * h.eyeSize * headScale,
      eyeHeight = 0.019 * h.eyeSize * headScale;
    const eyeShape = new THREE.Shape();
    eyeShape.moveTo(-eyeWidth, 0);
    eyeShape.quadraticCurveTo(-eyeWidth * 0.2, eyeHeight * 1.55, eyeWidth, 0);
    eyeShape.quadraticCurveTo(eyeWidth * 0.1, -eyeHeight * 1.25, -eyeWidth, 0);
    add(
      new THREE.ShapeGeometry(eyeShape, 4),
      white,
      [eyeX, eyeY, eyeZ],
      `eye_white_${i}`,
    );
    tube(
      [
        [eyeX - eyeWidth, eyeY, eyeZ + 0.0005],
        [eyeX, eyeY + eyeHeight * 0.75, eyeZ + 0.0005],
        [eyeX + eyeWidth, eyeY, eyeZ + 0.0005],
      ],
      0.0011 * headScale,
      dark,
      `upper_lid_${i}`,
    );
    oval(
      [eyeX, eyeY, eyeZ + 0.001],
      [0.009 * h.eyeSize * headScale, 0.012 * h.eyeSize * headScale, 0.002],
      iris,
      `iris_${i}`,
    );
    oval(
      [eyeX, eyeY, eyeZ + 0.003],
      [0.004 * h.eyeSize * headScale, 0.009 * h.eyeSize * headScale, 0.0015],
      dark,
      `pupil_${i}`,
    );
    oval(
      [eyeX - 0.0025 * headScale, eyeY + 0.0035 * headScale, eyeZ + 0.005],
      [0.0018, 0.0018, 0.001],
      white,
      `eye_glint_${i}`,
    );
    if (h.eyebrows !== "none") {
      const m = box(
        [eyeX, eyeY + 0.025 * h.eyeSize * headScale, eyeZ],
        [
          0.052 * headScale,
          0.006 *
            (h.eyebrows === "thick" ? 2 : h.eyebrows === "slim" ? 0.7 : 1),
          0.003,
        ],
        brow,
        `brow_${i}`,
      );
      m.rotation.z =
        sign * (h.browAngle + (h.expression === "stern" ? 0.18 : 0));
    }
    const earX = sign * hw * 0.98;
    const ear = oval(
      [earX, headY - 0.005, -0.002],
      [0.027 * h.earSize, 0.045 * h.earSize, 0.023],
      skin,
      `ear_${sign}`,
    );
    if (h.ears === "pointed") {
      const tip = add(
        new THREE.ConeGeometry(0.029 * h.earSize, 0.09 * h.earSize, 5),
        skin,
        [earX + sign * 0.008, headY + 0.043, 0],
        `elf_ear_${sign}`,
      );
      tip.rotation.z = -sign * 0.35;
      bindings[tip.name] = ear.name;
    }
    if (h.earrings === "studs")
      oval(
        [earX, headY - 0.038, 0.019],
        [0.008, 0.008, 0.008],
        trim,
        `earring_${sign}`,
      );
    if (h.earrings === "hoops") {
      const ring = add(
        new THREE.TorusGeometry(0.016, 0.0035, 5, 10),
        trim,
        [earX, headY - 0.051, 0.013],
        `earring_${sign}`,
      );
      bindings[ring.name] = ear.name;
    }
    if (h.earrings !== "none") bindings[`earring_${sign}`] = ear.name;
    if (h.freckles)
      for (let k = 0; k < 4; k++)
        oval(
          [
            sign * (hw * 0.3 + random() * 0.041),
            headY - 0.025 - random() * 0.016,
            hd * 0.93,
          ],
          [0.0025, 0.0025, 0.002],
          brow,
          `freckle_${sign}_${k}`,
        );
  }
  const noseGeometry = new THREE.BufferGeometry();
  const noseW = 0.014 * h.noseWidth * headScale,
    noseD = 0.02 * h.noseLength * headScale;
  noseGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -noseW,
        -0.025 * headScale,
        0,
        noseW,
        -0.025 * headScale,
        0,
        0,
        0.009 * headScale,
        0,
        0,
        -0.021 * headScale,
        noseD,
      ],
      3,
    ),
  );
  noseGeometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1, 0.5, 0.2], 2),
  );
  noseGeometry.setIndex([2, 0, 3, 2, 3, 1, 0, 1, 3, 2, 1, 0]);
  noseGeometry.computeVertexNormals();
  add(
    noseGeometry,
    skin,
    [0, headY - 0.012 * headScale, hd * 0.96],
    "nose_bridge",
  );
  const mouthY = headY - hh * 0.43,
    mouthZ = hd * 0.91;
  const curve =
    h.expression === "smile" ? 0.004 : h.expression === "stern" ? -0.004 : 0;
  tube(
    [
      [-0.027 * h.mouthWidth * headScale, mouthY + curve, mouthZ],
      [0, mouthY, mouthZ + 0.002],
      [0.027 * h.mouthWidth * headScale, mouthY + curve, mouthZ],
    ],
    0.0023 * h.lipFullness * headScale,
    lips,
    "mouth",
  );
  if (h.scar) {
    const scar = box(
      [hw * 0.66, headY + 0.035, hd * 0.73],
      [0.003, 0.065, 0.004],
      lips,
      "face_scar",
    );
    scar.rotation.z = -0.4;
  }
  if (
    h.facialHair === "stubble" ||
    h.facialHair === "beard" ||
    h.facialHair === "goatee"
  )
    oval(
      [0, headY - hh * 0.69, 0.043],
      [
        hw * (h.facialHair === "goatee" ? 0.28 : 0.84),
        h.facialHair === "beard" ? 0.084 : 0.034,
        hd * 0.78,
      ],
      hair,
      "beard",
    );
  if (h.facialHair === "moustache" || h.facialHair === "beard")
    for (const sign of [-1, 1])
      oval(
        [sign * 0.019, mouthY + 0.02, mouthZ + 0.008],
        [0.027, 0.007, 0.009],
        hair,
        `moustache_${sign}`,
      );
  if (h.hair !== "none") {
    const capGeometry = new THREE.SphereGeometry(
      1,
      seg,
      rings,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.65,
    );
    const vertices = capGeometry.getAttribute("position");
    const headProfile = humanHeadProfile(h);
    for (let i = 0; i < vertices.count; i++) {
      const oldY = vertices.getY(i),
        oldRadius = Math.sqrt(Math.max(0, 1 - oldY * oldY));
      const front = oldRadius > 0.001 ? vertices.getZ(i) / oldRadius : 1;
      const floor = front > 0 ? -0.12 + front * 0.58 : -0.12 + front * 0.38;
      const progress = (1 - oldY) / (1 - Math.cos(Math.PI * 0.65));
      const y = 1 - progress * (1 - floor);
      let section = headProfile.findIndex(([height]) => height >= y);
      section = Math.max(1, section < 0 ? headProfile.length - 1 : section);
      const a = headProfile[section - 1],
        b = headProfile[section];
      const mix = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
      const width = THREE.MathUtils.lerp(a[1], b[1], mix),
        depth = THREE.MathUtils.lerp(a[2], b[2], mix);
      const sine = oldRadius > 0.001 ? vertices.getX(i) / oldRadius : 0;
      const z =
        oldRadius > 0.001
          ? Math.sign(front) * Math.abs(front) ** (front >= 0 ? 0.3 : 1) * depth
          : 0;
      vertices.setXYZ(i, sine * width, y, z);
    }
    capGeometry.computeVertexNormals();
    const cap = add(capGeometry, hair, [0, headY + 0.012, 0], "hair_cap");
    cap.scale.set(
      hw * (1.06 + (h.hairVolume - 0.7) * 0.12),
      hh * (1.07 + (h.hairVolume - 0.7) * 0.2),
      hd * (1.06 + (h.hairVolume - 0.7) * 0.12),
    );
    if (["swept", "bob", "long"].includes(h.hair)) {
      const fringe = new THREE.Shape();
      fringe.moveTo(-hw * 0.98, -hh * 0.08);
      fringe.quadraticCurveTo(
        -hw * 0.8,
        hh * 0.36 * h.hairVolume,
        hw * 0.45,
        hh * 0.34,
      );
      fringe.quadraticCurveTo(hw * 0.87, hh * 0.15, hw * 0.9, hh * 0.03);
      fringe.quadraticCurveTo(-hw * 0.1, hh * 0.12, -hw * 0.98, -hh * 0.08);
      fringe.closePath();
      const fringeGeometry = new THREE.ExtrudeGeometry(fringe, {
        depth: 0.009,
        bevelEnabled: true,
        bevelSize: 0.002,
        bevelThickness: 0.002,
        bevelSegments: 1,
        steps: 1,
        curveSegments: 5,
      });
      const fringeVertices = fringeGeometry.getAttribute("position");
      for (let i = 0; i < fringeVertices.count; i++)
        fringeVertices.setZ(
          i,
          fringeVertices.getZ(i) - (fringeVertices.getX(i) / hw) ** 2 * 0.025,
        );
      fringeGeometry.computeVertexNormals();
      add(
        fringeGeometry,
        hair,
        [0, headY + hh * 0.4, hd * 0.92],
        "hair_fringe",
      );
    }
    if (["bob", "long", "braids"].includes(h.hair))
      for (const sign of [-1, 1]) {
        const length = (h.hair === "bob" ? 0.16 : 0.35) * h.hairLength;
        oval(
          [sign * hw * 0.92, headY + hh * 0.25 - length * 0.42, -hd * 0.1],
          [0.042 * h.hairVolume, length * 0.62, 0.095],
          hair,
          `hair_side_${sign}`,
        );
      }
    if (h.hair === "long")
      oval(
        [0, headY - 0.08 * h.hairLength, -hd * 0.82],
        [hw * 0.97, 0.25 * h.hairLength, 0.039],
        hair,
        "hair_back",
      );
    if (h.hair === "ponytail" || h.hair === "braids") {
      const count = h.hair === "braids" ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const x = count === 1 ? 0 : (i ? 1 : -1) * hw * 0.85;
        tube(
          [
            [x, headY + 0.1, -hd],
            [x + 0.02, headY - 0.06, -hd - 0.04],
            [x + 0.035, headY - 0.22 * h.hairLength, -hd - 0.055],
          ],
          0.033 * h.hairVolume,
          hair,
          `hair_tail_${i}`,
        );
        oval(
          [x, headY + 0.1, -hd],
          [0.034, 0.015, 0.034],
          trim,
          `hair_tie_${i}`,
        );
      }
    }
    if (h.hair === "bun")
      oval(
        [0, headY + hh * 0.62, -hd * 0.84],
        [0.07 * h.hairVolume, 0.065 * h.hairVolume, 0.067],
        hair,
        "hair_bun",
      );
    if (h.hair === "mohawk")
      for (let i = 0; i < 6; i++) {
        const spike = add(
          new THREE.ConeGeometry(0.035, 0.095 * h.hairVolume, 5),
          hair,
          [0, headY + hh * 0.95, -hd * 0.7 + i * hd * 0.27],
          `hair_mohawk_${i}`,
        );
        spike.rotation.x = (i - 2.5) * 0.12;
      }
    if (h.hair === "spiky")
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const spike = add(
          new THREE.ConeGeometry(0.045, 0.105 * h.hairVolume, 5),
          hair,
          [Math.cos(a) * hw * 0.65, headY + hh * 0.88, Math.sin(a) * hd * 0.7],
          `hair_spike_${i}`,
        );
        spike.rotation.z = -Math.cos(a) * 0.4;
        spike.rotation.x = Math.sin(a) * 0.4;
      }
    if (h.hair === "curls")
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        oval(
          [
            Math.cos(a) * hw * 0.82,
            headY + hh * (0.7 + (i % 2) * 0.16),
            Math.sin(a) * hd * 0.9,
          ],
          [0.047, 0.046, 0.047],
          hair,
          `hair_curl_${i}`,
        );
      }
  }
  if (h.bottom === "skirt" || h.top === "robe") {
    const length = h.top === "robe" ? legH * 0.84 : legH * 0.48;
    add(
      new THREE.CylinderGeometry(0.19 * h.hips, 0.25 * h.hips, length, seg, 3),
      h.top === "robe" ? top : bottom,
      [0, pelvisY - length * 0.45, 0],
      "skirt",
    );
  }
  if (h.top === "jacket" || h.top === "vest") {
    for (const sign of [-1, 1]) {
      const lapel = box(
        [sign * 0.047, bodyY + 0.11, 0.115 * h.chest],
        [0.034, 0.18, 0.013],
        trim,
        `lapel_${sign}`,
      );
      lapel.rotation.z = -sign * 0.2;
    }
  }
  if (h.top === "jacket") {
    for (let i = 0; i < 3; i++)
      oval(
        [0, bodyY + 0.1 - i * 0.065, 0.114 * h.chest],
        [0.007, 0.007, 0.006],
        trim,
        `lapel_button_${i}`,
      );
    box(
      [bodyWidth * 0.54, bodyY + 0.04, 0.102 * h.chest],
      [0.045, 0.05, 0.011],
      shoes,
      "lapel_pocket",
    );
  }
  if (h.top === "tunic")
    add(
      new THREE.CylinderGeometry(bodyWidth, bodyWidth * 1.15, 0.19, seg),
      top,
      [0, pelvisY - 0.05, 0],
      "tunic_hem",
    );
  if (h.belt !== "none") {
    const belt = add(
      new THREE.TorusGeometry(0.16, 0.017, 5, seg),
      shoes,
      [0, pelvisY + 0.075, 0],
      "belt",
    );
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(h.waist, 0.67, 1);
    box([0, pelvisY + 0.075, 0.115], [0.045, 0.042, 0.018], trim, "buckle");
    if (h.belt === "utility")
      for (const sign of [-1, 1])
        box(
          [sign * 0.155, pelvisY, 0.02],
          [0.068, 0.11, 0.058],
          shoes,
          `belt_pouch_${sign}`,
        );
  }
  if (h.glasses === "round" || h.glasses === "square") {
    for (const sign of [-1, 1]) {
      if (h.glasses === "round")
        add(
          new THREE.TorusGeometry(0.032, 0.0035, 5, 12),
          trim,
          [sign * hw * 0.43 * h.eyeSpacing, headY + hh * 0.09, hd + 0.025],
          `glasses_${sign}`,
        );
      else {
        for (const axis of [0, 1])
          for (const edge of [-1, 1])
            box(
              [
                sign * hw * 0.43 * h.eyeSpacing +
                  (axis === 1 ? edge * 0.033 : 0),
                headY + hh * 0.09 + (axis === 0 ? edge * 0.025 : 0),
                hd + 0.025,
              ],
              axis === 0 ? [0.066, 0.005, 0.006] : [0.005, 0.05, 0.006],
              trim,
              `glasses_${sign}_${axis}_${edge}`,
            );
      }
    }
    box(
      [0, headY + hh * 0.09, hd + 0.025],
      [0.043, 0.004, 0.005],
      trim,
      "glasses_bridge",
    );
  }
  if (h.glasses === "eyepatch") {
    oval(
      [hw * 0.43 * h.eyeSpacing, headY + hh * 0.09, hd + 0.022],
      [0.036, 0.029, 0.009],
      shoes,
      "eyepatch",
    );
    tube(
      [
        [-hw, headY + 0.02, hd * 0.6],
        [0, headY + 0.07, hd + 0.022],
        [hw, headY + 0.09, hd * 0.6],
      ],
      0.003,
      shoes,
      "eyepatch_strap",
    );
  }
  if (h.necklace !== "none") {
    tube(
      [
        [-0.058, shoulderY + 0.08, 0.064],
        [0, bodyY + 0.105, 0.124 * h.chest],
        [0.058, shoulderY + 0.08, 0.064],
      ],
      0.005,
      trim,
      "necklace",
    );
    if (h.necklace === "pendant")
      oval(
        [0, bodyY + 0.094, 0.133 * h.chest],
        [0.018, 0.026, 0.006],
        trim,
        "pendant",
      );
    else
      for (let i = -2; i <= 2; i++)
        oval(
          [i * 0.017, bodyY + 0.105 + Math.abs(i) * 0.013, 0.125 * h.chest],
          [0.009, 0.009, 0.007],
          trim,
          `necklace_bead_${i}`,
        );
  }
  if (h.cape !== "none") {
    const len = h.cape === "long" ? torsoH + legH * 0.68 : torsoH * 0.93;
    const cape = box(
      [0, shoulderY - len * 0.42, -0.139],
      [shoulderX * 1.7, len, 0.023],
      top,
      "cape",
    );
    cape.rotation.x = 0.1;
  }
  if (h.backpack !== "none") {
    const large = h.backpack === "large";
    box(
      [0, bodyY, -0.18],
      [large ? 0.28 : 0.18, large ? 0.35 : 0.23, 0.13],
      shoes,
      "backpack",
    );
    box(
      [0, bodyY - 0.05, -0.252],
      [large ? 0.2 : 0.13, 0.12, 0.025],
      trim,
      "backpack_pocket",
    );
    for (const sign of [-1, 1])
      tube(
        [
          [sign * 0.09, bodyY - 0.13, 0.092],
          [sign * 0.13, shoulderY + 0.012, 0],
          [sign * 0.1, bodyY + 0.06, -0.24],
        ],
        0.014,
        shoes,
        `pack_strap_${sign}`,
      );
  }
  if (h.headwear !== "none") {
    if (
      h.headwear === "cap" ||
      h.headwear === "helmet" ||
      h.headwear === "hood"
    ) {
      const shell = add(
        new THREE.SphereGeometry(
          1,
          seg,
          rings,
          h.headwear === "hood" ? Math.PI - 0.4 : 0,
          h.headwear === "hood" ? Math.PI + 0.8 : Math.PI * 2,
          0,
          h.headwear === "hood" ? Math.PI * 0.79 : Math.PI * 0.55,
        ),
        h.headwear === "helmet" ? trim : top,
        [0, headY + 0.065, -0.008],
        "headwear_shell",
      );
      shell.scale.set(
        hw * 1.17,
        hh * (h.headwear === "hood" ? 1.24 : 0.94),
        hd * 1.2,
      );
      if (h.headwear === "cap")
        oval([0, headY + 0.13, hd * 1.1], [hw, 0.012, 0.078], top, "cap_brim");
    }
    if (h.headwear === "wizard") {
      add(
        new THREE.ConeGeometry(hw * 1.22, 0.29, seg),
        top,
        [0, headY + hh + 0.12, 0],
        "wizard_hat",
      );
      const brim = add(
        new THREE.CylinderGeometry(hw * 1.65, hw * 1.65, 0.02, seg),
        top,
        [0, headY + hh * 0.9, 0],
        "hat_brim",
      );
      brim.scale.z = 0.87;
    }
    if (h.headwear === "crown") {
      const crown = add(
        new THREE.TorusGeometry(hw * 1.02, 0.009, 5, seg),
        trim,
        [0, headY + hh * 0.7, 0],
        "crown_ring",
      );
      crown.rotation.x = Math.PI / 2;
      crown.scale.y = hd / hw;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        add(
          new THREE.ConeGeometry(0.012, 0.05, 4),
          trim,
          [Math.sin(a) * hw * 1.02, headY + hh * 0.82, Math.cos(a) * hd * 1.02],
          `crown_tip_${i}`,
        );
      }
    }
  }
  const usedMaterials = new Set(group.children.map((p) => p.material));
  for (const material of materialPool)
    if (!usedMaterials.has(material)) material.dispose();
  group.userData = {
    kind: "procedural-human",
    rigged: false,
    seed: config.seed,
    bodyPlan: "human",
    humanSettings: h,
  };
  group.humanRig = {
    hips: [0, pelvisY, 0],
    spine: [0, shoulderY - 0.045, 0],
    neck: [0, headY - 0.13, 0],
    head: [0, headY - hh * 0.65, 0],
    bindings,
  };
}
