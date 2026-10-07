import { useState, useEffect } from "react";
import { getRigSettings } from "./rigging.js";
import { Shuffle, RotateCcw, UserRound } from "lucide-react";
import {
  getHumanSettings,
  HUMAN_RANGES,
  HUMAN_OPTIONS,
  HUMAN_COLORS,
  SKIN_TONES,
  HUMAN_LOOKS,
} from "./humans.js";

const GROUPS = {
  Body: {
    ranges: [
      "height",
      "shoulderWidth",
      "chest",
      "waist",
      "hips",
      "musculature",
      "armLength",
      "legLength",
      "torsoLength",
      "handSize",
      "footSize",
    ],
    options: [],
    colors: [],
  },
  Face: {
    ranges: [
      "headSize",
      "faceWidth",
      "jawWidth",
      "chinLength",
      "cheekbones",
      "eyeSize",
      "eyeSpacing",
      "browAngle",
      "noseWidth",
      "noseLength",
      "mouthWidth",
      "lipFullness",
      "earSize",
    ],
    options: ["ears", "expression", "eyebrows"],
    colors: ["skin", "eyeColor", "lipColor"],
  },
  Hair: {
    ranges: ["hairVolume", "hairLength"],
    options: ["hair", "facialHair"],
    colors: ["hairColor", "browColor"],
  },
  Outfit: {
    ranges: [],
    options: ["top", "sleeves", "bottom", "footwear", "gloves"],
    colors: ["topColor", "bottomColor", "shoeColor"],
  },
  Accessories: {
    ranges: [],
    options: [
      "headwear",
      "glasses",
      "earrings",
      "necklace",
      "belt",
      "cape",
      "backpack",
    ],
    colors: ["accessoryColor"],
  },
  Colors: { ranges: [], options: [], colors: Object.keys(HUMAN_COLORS) },
};
const LABELS = {
  hair: "Hairstyle",
  facialHair: "Facial hair",
  eyebrows: "Eyebrow style",
  ears: "Ear shape",
  expression: "Expression",
  top: "Top style",
  sleeves: "Sleeve length",
  bottom: "Bottom style",
  footwear: "Footwear",
  gloves: "Gloves",
  headwear: "Headwear",
  glasses: "Eyewear",
  earrings: "Earrings",
  necklace: "Necklace",
  belt: "Belt",
  cape: "Cape",
  backpack: "Backpack",
};
const FRAMES = {
  Balanced: { shoulderWidth: 1, chest: 1, waist: 1, hips: 1, musculature: 0.3 },
  Slender: {
    shoulderWidth: 0.85,
    chest: 0.8,
    waist: 0.8,
    hips: 0.9,
    musculature: 0.15,
  },
  Broad: {
    shoulderWidth: 1.3,
    chest: 1.25,
    waist: 1.1,
    hips: 1,
    musculature: 0.85,
  },
  Curvy: {
    shoulderWidth: 0.9,
    chest: 1.15,
    waist: 0.78,
    hips: 1.32,
    musculature: 0.2,
  },
};
export default function HumanControls({
  config,
  onChange,
  onRandom,
  onReset,
  onFocus,
  onPosePreset,
}) {
  const [tab, setTab] = useState("Body"),
    h = getHumanSettings(config),
    group = GROUPS[tab];
  useEffect(() => {
    setTab("Body");
  }, [config.type]);
  const pose = getRigSettings(config).pose;
  const angle = pose.Rig_arm_R_upper?.[2] || 0;
  const presetPose =
    angle === 71 && pose.Rig_arm_L_upper?.[2] === -71
      ? "t"
      : angle === 25 && pose.Rig_arm_L_upper?.[2] === -25
        ? "a"
        : Object.values(pose).some((values) => values.some((v) => v !== 0))
          ? "custom"
          : "relaxed";
  return (
    <section
      className="human-controls"
      aria-label="Human character customization"
    >
      <div className="human-controls-heading">
        <UserRound size={15} />
        <strong>Character creator</strong>
        <span>56 controls</span>
      </div>
      <div
        className="human-look-presets"
        role="group"
        aria-label="Appearance presets"
      >
        <span className="field-label">A polished starting look</span>
        <div>
          {Object.entries(HUMAN_LOOKS).map(([key, look]) => (
            <button
              key={key}
              className="button secondary"
              aria-label={`${look.label} appearance`}
              title={look.description}
              onClick={() => {
                onChange(look.values);
                setTab("Face");
                onFocus("face");
              }}
            >
              {look.label}
            </button>
          ))}
        </div>
        <p>
          Coordinated features and proportions. Your colors and outfit stay
          yours.
        </p>
      </div>
      <div className="human-tabs" role="tablist" aria-label="Character options">
        {Object.keys(GROUPS).map((name) => (
          <button
            key={name}
            role="tab"
            id={`human-tab-${name}`}
            aria-selected={tab === name}
            aria-controls="human-options"
            onClick={() => {
              setTab(name);
              onFocus(["Face", "Hair"].includes(name) ? "face" : "full");
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        className="human-options"
        id="human-options"
        role="tabpanel"
        aria-labelledby={`human-tab-${tab}`}
      >
        {tab === "Body" && (
          <>
            <div
              className="human-frame-buttons"
              role="group"
              aria-label="Body frame"
            >
              {Object.entries(FRAMES).map(([name, values]) => (
                <button
                  className="button secondary"
                  key={name}
                  onClick={() => onChange(values)}
                >
                  {name}
                </button>
              ))}
            </div>
            <label className="human-select">
              Base pose
              <select
                aria-label="Character pose"
                onChange={(e) => onPosePreset(e.target.value)}
                value={presetPose}
              >
                <option value="custom" disabled>
                  Custom joint pose
                </option>
                <option value="relaxed">Relaxed</option>
                <option value="a">A-pose</option>
                <option value="t">T-pose</option>
              </select>
            </label>
          </>
        )}
        {group.options.map((key) => (
          <label className="human-select" key={key}>
            {LABELS[key]}
            <select
              aria-label={LABELS[key]}
              value={h[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
            >
              {Object.entries(HUMAN_OPTIONS[key]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {group.ranges.map((key) => {
          const [label, min, max] = HUMAN_RANGES[key];
          return (
            <label className="human-range" key={key}>
              {label}
              <span>
                {h[key].toFixed(2)}
                {key === "browAngle" || key === "musculature" ? "" : "×"}
              </span>
              <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                step="0.01"
                value={h[key]}
                disabled={
                  (key === "hairVolume" && h.hair === "none") ||
                  (key === "hairLength" &&
                    !["bob", "long", "braids", "ponytail"].includes(h.hair))
                }
                onChange={(e) => onChange({ [key]: Number(e.target.value) })}
              />
            </label>
          );
        })}
        {["Face", "Colors"].includes(tab) && (
          <div
            className="human-skin-tones"
            role="group"
            aria-label="Skin tone presets"
          >
            {SKIN_TONES.map((color) => (
              <button
                key={color}
                aria-label={`Skin tone ${color}`}
                aria-pressed={h.skin === color}
                style={{ backgroundColor: color }}
                onClick={() => onChange({ skin: color })}
              />
            ))}
          </div>
        )}
        {group.colors.map((key) => (
          <label className="human-color" key={key}>
            <span>{HUMAN_COLORS[key][0]}</span>
            <input
              type="color"
              aria-label={HUMAN_COLORS[key][0]}
              value={h[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </label>
        ))}
        {tab === "Face" &&
          ["freckles", "scar"].map((key) => (
            <label className="human-checkbox" key={key}>
              <input
                type="checkbox"
                checked={h[key]}
                onChange={(e) => onChange({ [key]: e.target.checked })}
              />
              {key === "scar" ? "Face scar" : "Freckles"}
            </label>
          ))}
        {tab === "Accessories" &&
          ["shoulderArmor", "wristbands"].map((key) => (
            <label className="human-checkbox" key={key}>
              <input
                type="checkbox"
                checked={h[key]}
                onChange={(e) => onChange({ [key]: e.target.checked })}
              />
              {key === "shoulderArmor" ? "Shoulder armor" : "Wristbands"}
            </label>
          ))}
      </div>
      <div className="human-editor-actions">
        <button className="button secondary" onClick={onRandom}>
          <Shuffle size={13} />
          Randomize look
        </button>
        <button
          className="icon-button"
          onClick={onReset}
          aria-label="Reset human appearance"
          title="Reset appearance"
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <p className="human-note">
        Original low-poly humans. Your body, face, outfit, and rig settings stay
        editable and are saved with the character.
      </p>
    </section>
  );
}
