import { useEffect, useRef, useState } from "react";
import {
  Box,
  Bone,
  Boxes,
  WandSparkles,
  FolderOpen,
  ArrowUpRight,
  ChevronRight,
  RotateCcw,
  Grid2X2,
  Download,
  Plus,
  X,
  Check,
  Search,
  Trash2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Move3D,
  RefreshCw,
  Palette,
  Info,
  MousePointer2,
  Maximize,
  Play,
  Pause,
  Menu,
  Layers3,
  CircleHelp,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Viewport from "./Viewport.jsx";
import DesktopUpdates from "./DesktopUpdates.jsx";
import AssetArt from "./AssetArt.jsx";
import SizeControls from "./SizeControls.jsx";
import HumanControls from "./HumanControls.jsx";
import {
  HUMAN_PRESETS,
  HUMAN_OPTIONS,
  HUMAN_RANGES,
  SKIN_TONES,
  getHumanSettings,
  isHumanType,
  makeHumanConfig,
  validHumanSettings,
} from "./humans.js";
import CreatureControls from "./CreatureControls.jsx";
import RigControls from "./RigControls.jsx";
import { getRigSettings, validRigSettings } from "./rigging.js";
import {
  CREATURE_PRESETS,
  CREATURE_OPTIONS,
  ELEMENTS,
  getCreatureSettings,
  isCreatureType,
  makeCreatureConfig,
  validCreatureSettings,
} from "./creatures.js";
import { ASSETS, interpretPrompt, SCALE_LIMITS } from "./models.js";
import { exportModel } from "./export.js";

const STORAGE_KEY = "meshcraft-collection-v1";
const DRAFT_KEY = "meshcraft-draft-v1";
const DEFAULT_PROMPT =
  "A friendly nature creature with long ears and a fluffy tail";
const SWATCHES = [
  "#9ebcab",
  "#789bbd",
  "#a08bb7",
  "#bd7370",
  "#d1b77b",
  "#aab4be",
];

function readStorage(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data ?? fallback;
  } catch {
    return fallback;
  }
}
function isValidConfig(value) {
  return (
    value &&
    ASSETS.some((a) => a.id === value.type) &&
    typeof value.name === "string" &&
    Number.isFinite(value.seed) &&
    Number.isFinite(value.scale) &&
    value.scale >= SCALE_LIMITS.min &&
    value.scale <= SCALE_LIMITS.max &&
    [0, 1, 2].includes(value.detail) &&
    /^#[0-9a-f]{6}$/i.test(value.primary) &&
    /^#[0-9a-f]{6}$/i.test(value.accent) &&
    validRigSettings(value.rig) &&
    (!isHumanType(value.type) || validHumanSettings(value.human)) &&
    (!isCreatureType(value.type) || validCreatureSettings(value.creature))
  );
}
function initialDraft() {
  const draft = readStorage(DRAFT_KEY, null);
  return isValidConfig(draft)
    ? draft
    : { ...makeCreatureConfig(), prompt: DEFAULT_PROMPT };
}

function Dialog({ title, subtitle, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="dialog"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">MESHCRAFT STUDIO</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const desktopMode = Boolean(window.meshcraftDesktop);
  const [config, setConfig] = useState(initialDraft);
  const [prompt, setPrompt] = useState(
    () => initialDraft().prompt || DEFAULT_PROMPT,
  );
  const [page, setPage] = useState("studio");
  const [collection, setCollection] = useState(() => {
    const data = readStorage(STORAGE_KEY, []);
    return Array.isArray(data)
      ? data.filter(
          (item) => isValidConfig(item) && typeof item.id === "string",
        )
      : [];
  });
  const [toast, setToast] = useState(null);
  const [promptError, setPromptError] = useState("");
  const [generation, setGeneration] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [grid, setGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showSizeReference, setShowSizeReference] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [stats, setStats] = useState(null);
  const [rigInfo, setRigInfo] = useState(null);
  const [motion, setMotion] = useState("Rest");
  const [playing, setPlaying] = useState(true);
  const [showBones, setShowBones] = useState(false);
  const [viewFocus, setViewFocus] = useState("full");
  const [selectedJoint, setSelectedJoint] = useState("Rig_head");
  const [viewportError, setViewportError] = useState("");
  const [modal, setModal] = useState(null);
  const [format, setFormat] = useState("glb");
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All assets");
  const [mobileNav, setMobileNav] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const generationTimer = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
    } catch {
      setStorageError(true);
    }
  }, [config]);
  useEffect(
    () => () => {
      clearTimeout(generationTimer.current);
      clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (motion !== "Rest" && rigInfo && !rigInfo.clips.includes(motion))
      setMotion("Rest");
  }, [rigInfo, motion]);

  function notify(message, error = false) {
    clearTimeout(toastTimer.current);
    setToast({ message, error });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }
  function patch(values) {
    setConfig((old) => {
      if (!isHumanType(old.type)) return { ...old, ...values };
      const human = {
        ...getHumanSettings(old),
        ...(values.primary ? { topColor: values.primary } : {}),
        ...(values.accent ? { accessoryColor: values.accent } : {}),
      };
      return { ...old, ...values, human };
    });
  }
  function patchHuman(values) {
    setConfig((old) => ({
      ...old,
      human: { ...getHumanSettings(old), ...values },
      ...(values.topColor ? { primary: values.topColor } : {}),
      ...(values.accessoryColor ? { accent: values.accessoryColor } : {}),
    }));
  }
  function humanPosePreset(pose) {
    setMotion("Rest");
    const angle = pose === "t" ? 71 : pose === "a" ? 25 : 0;
    patchRig({
      pose: { Rig_arm_L_upper: [0, 0, -angle], Rig_arm_R_upper: [0, 0, angle] },
    });
  }
  function randomizeHuman() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const next = makeHumanConfig(config.type, config),
      human = next.human;
    for (const [key, [, min, max]] of Object.entries(HUMAN_RANGES))
      human[key] = Math.round((min + (max - min) * Math.random()) * 100) / 100;
    for (const [key, options] of Object.entries(HUMAN_OPTIONS))
      human[key] = pick(Object.keys(options));
    human.skin = pick(SKIN_TONES);
    human.hairColor = pick([
      "#403229",
      "#d7b56f",
      "#a45d43",
      "#24242c",
      "#dcd9d0",
      "#97649c",
    ]);
    human.eyeColor = pick(["#648c81", "#6c8caf", "#805b43", "#92916b"]);
    human.freckles = Math.random() > 0.5;
    human.scar = Math.random() > 0.8;
    human.shoulderArmor = Math.random() > 0.65;
    next.seed = Math.floor(Math.random() * 999999);
    next.name = `${HUMAN_PRESETS.find((p) => p.id === config.type).name} ${next.seed}`;
    setConfig(next);
    setMotion("Rest");
    setViewFocus("full");
    notify("A new character to make your own.");
  }
  function navigate(next) {
    setPage(next);
    setMobileNav(false);
  }
  function chooseAsset(type) {
    clearTimeout(generationTimer.current);
    setGeneration(false);
    const preset = ASSETS.find((a) => a.id === type);
    const nextPrompt = `A low-poly ${preset.name.toLowerCase()} for a fantasy videogame`;
    if (isHumanType(type)) {
      setConfig({ ...makeHumanConfig(type, config), prompt: nextPrompt });
      setPrompt(nextPrompt);
      setPromptError("");
      setViewFocus("full");
      setMotion("Rest");
      return;
    }
    if (isCreatureType(type)) {
      setConfig({
        ...makeCreatureConfig(type, config),
        rig: { ...getRigSettings(config), pose: {} },
        prompt: nextPrompt,
      });
      setPrompt(nextPrompt);
      setPromptError("");
      return;
    }
    patch({
      type,
      name:
        type === "sword" ? "Verdant blade" : `${preset.name} ${config.seed}`,
      primary: preset.primary,
      accent: preset.accent,
      prompt: nextPrompt,
    });
    setPrompt(nextPrompt);
    setPromptError("");
  }
  function patchRig(values) {
    setConfig((old) => ({
      ...old,
      rig: { ...getRigSettings(old), ...values },
    }));
  }
  function chooseMotion(clip) {
    setMotion(clip);
    setPlaying(true);
  }
  function poseJoint(name, values) {
    setMotion("Rest");
    setConfig((old) => ({
      ...old,
      rig: {
        ...getRigSettings(old),
        pose: { ...getRigSettings(old).pose, [name]: values },
      },
    }));
  }
  function patchCreature(values) {
    setConfig((old) => ({
      ...old,
      creature: { ...getCreatureSettings(old), ...values },
    }));
  }
  function bossBuild() {
    setMotion("Rest");
    setPreviewZoom(1);
    setConfig((old) => ({
      ...old,
      scale: Math.max(10, old.scale),
      rig: { ...getRigSettings(old), pose: {} },
      creature: {
        ...getCreatureSettings(old),
        headSize: 0.85,
        bodyWidth: 1.4,
        legLength: 1.3,
        snout: 1,
        temperament: 0.95,
        ears: "none",
        crest: "spikes",
        tail: "pointed",
      },
    }));
    notify(
      "Boss proportions applied. Adjust the size and anatomy to make it yours.",
    );
  }
  function changeElement(element) {
    setConfig((old) => ({
      ...old,
      primary: ELEMENTS[element].primary,
      accent: ELEMENTS[element].accent,
      creature: { ...getCreatureSettings(old), element },
    }));
  }
  function surpriseCreature() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const preset = pick(CREATURE_PRESETS);
    const next = makeCreatureConfig(preset.id, config);
    const element = pick(Object.keys(ELEMENTS));
    next.seed = Math.floor(Math.random() * 999999);
    next.name = `${preset.name} ${next.seed}`;
    next.primary = ELEMENTS[element].primary;
    next.accent = ELEMENTS[element].accent;
    next.creature = {
      ...next.creature,
      element,
      bodyPlan: pick(Object.keys(CREATURE_OPTIONS.bodyPlan)),
      ears: pick(Object.keys(CREATURE_OPTIONS.ears)),
      horns: pick(Object.keys(CREATURE_OPTIONS.horns)),
      wings: pick(["none", "none", "feathered", "bat", "crystal"]),
      tail: pick(Object.keys(CREATURE_OPTIONS.tail)),
      crest: pick(Object.keys(CREATURE_OPTIONS.crest)),
      eyeCount: pick([1, 2, 2, 2, 3]),
      pattern: pick(Object.keys(CREATURE_OPTIONS.pattern)),
      headSize: Math.round((0.85 + Math.random() * 0.55) * 20) / 20,
      bodyWidth: Math.round((0.75 + Math.random() * 0.6) * 20) / 20,
      legLength: Math.round((0.7 + Math.random() * 0.6) * 20) / 20,
      temperament: Math.round(Math.random() * 20) / 20,
    };
    next.prompt = `A ${ELEMENTS[element].name.toLowerCase()} ${CREATURE_OPTIONS.bodyPlan[next.creature.bodyPlan].toLowerCase()} creature`;
    setConfig(next);
    setPrompt(next.prompt);
    setPromptError("");
    clearTimeout(generationTimer.current);
    setGeneration(false);
    notify("A new species to make your own.");
  }
  function generate(e) {
    e.preventDefault();
    if (!prompt.trim()) {
      setPromptError("Describe a creature or a world prop to get started.");
      return;
    }
    const result = interpretPrompt(prompt, config);
    if (result.error) {
      setPromptError(result.error);
      return;
    }
    setPromptError("");
    setGeneration(true);
    generationTimer.current = setTimeout(() => {
      setConfig(result);
      setGeneration(false);
      notify("Your asset is ready. Make it your own.");
    }, 450);
  }
  function updateCollection(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCollection(next);
      return true;
    } catch {
      notify(
        "Browser storage is full or unavailable. Export your model to keep it.",
        true,
      );
      return false;
    }
  }
  function saveAsset() {
    const item = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    if (updateCollection([item, ...collection]))
      notify("Saved to your collection on this browser.");
  }
  async function doExport() {
    setExporting(true);
    try {
      const exported = await exportModel(config, format);
      if (exported === false) return;
      setModal(null);
      notify(
        format === "glb"
          ? "GLB exported. Your next world is waiting."
          : "OBJ and MTL exported. Keep the two files together.",
      );
    } catch (error) {
      console.error(error);
      notify("Export failed. Please try again.", true);
    } finally {
      setExporting(false);
    }
  }
  function loadAsset(item) {
    const { id, createdAt, ...asset } = item;
    setConfig(asset);
    setPrompt(
      asset.prompt || `A low-poly ${asset.type} for a fantasy videogame`,
    );
    setPromptError("");
    setPage("studio");
    notify(`${asset.name} opened in the studio.`);
  }
  const activeAsset = ASSETS.find((a) => a.id === config.type);
  const creatureMode = isCreatureType(config.type);
  const humanMode = isHumanType(config.type);
  const characterMode = creatureMode || humanMode;
  const pickerAssets = ASSETS.filter((asset) =>
    humanMode
      ? isHumanType(asset.id)
      : creatureMode
        ? isCreatureType(asset.id)
        : !isHumanType(asset.id) && !isCreatureType(asset.id),
  );
  const startingAssets = characterMode
    ? pickerAssets
    : pickerAssets.filter((asset) => asset.id !== "sword");
  const filteredCollection = collection.filter((item) => {
    const preset = ASSETS.find((a) => a.id === item.type);
    return (
      `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All assets" || preset.category === category)
    );
  });

  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("studio")}
          aria-label="Meshcraft home"
        >
          <span className="brand-mark">
            <Box size={24} strokeWidth={1.6} />
          </span>
          <span>
            meshcraft<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="workspace-switch">
          <span className="workspace-icon">P</span>
          <div>
            <strong>Personal workspace</strong>
            <span>Local studio</span>
          </div>
          <ChevronRight size={15} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          <button
            className={page === "studio" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("studio")}
          >
            <WandSparkles size={19} />
            Asset studio
            <span className="nav-active-dot" />
          </button>
          <button
            className={page === "collection" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("collection")}
          >
            <FolderOpen size={19} />
            My collection<span className="nav-count">{collection.length}</span>
          </button>
          <button
            className={page === "guide" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("guide")}
          >
            <BookOpen size={19} />
            Export guide
          </button>
        </nav>
        <div className="sidebar-divider" />
        <span className="nav-label">A LITTLE INSPIRATION</span>
        <button
          className="inspiration"
          onClick={() => {
            navigate("studio");
            chooseAsset("creature-mossling");
          }}
        >
          <span className="inspiration-art">
            <AssetArt
              type="creature-mossling"
              primary="#85ad8b"
              accent="#e1dbaf"
            />
          </span>
          <span>
            <strong>Meet your next companion</strong>
            <span>A creature only you could make</span>
          </span>
          <ArrowUpRight size={16} />
        </button>
        <div className="sidebar-bottom">
          <div className="local-badge">
            <span className="status-dot" />
            All yours. All local.
          </div>
          <p>
            Your models stay{" "}
            {desktopMode ? "on this computer" : "in your browser"}.
            <br />
            No account or API key needed.
          </p>
          <button className="help-link" onClick={() => setModal("help")}>
            <CircleHelp size={17} />A hand getting started
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-footer">
            <span className="avatar">Y</span>
            <div>
              <strong>Your workspace</strong>
              <span>Let’s make something.</span>
            </div>
            <span className="free-label">FREE</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {page === "studio"
                ? "Asset studio"
                : page === "collection"
                  ? "My collection"
                  : "Export guide"}
            </strong>
          </div>
          <div className="topbar-right">
            {desktopMode && window.meshcraftDesktop.getUpdateStatus && (
              <DesktopUpdates
                Dialog={Dialog}
                persistBeforeRestart={() => {
                  localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
                }}
              />
            )}
            <span className="beta-pill">CHARACTER STUDIO</span>
            <span className="top-divider" />
            <button
              className="icon-button help-top"
              aria-label="Help"
              onClick={() => setModal("help")}
            >
              <CircleHelp size={19} />
            </button>
            <span className="avatar top-avatar">Y</span>
          </div>
        </header>
        <div className="page-content">
          {page === "studio" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow heading-eyebrow">
                    <span className="tiny-star">✳</span> FROM AN IDEA TO YOUR
                    NEXT GAME
                  </div>
                  <h1>
                    {humanMode
                      ? "Build your next hero"
                      : creatureMode
                        ? "Bring your creatures to life"
                        : "Your ideas, in another dimension"}
                    <span>.</span>
                  </h1>
                  <p>
                    {humanMode
                      ? "From everyday citizens to fantasy adventurers. Make every character your own."
                      : creatureMode
                        ? "Small companions. Giant beasts. A whole world of possibilities."
                        : "Create a little something. Make it yours. Bring it to your world."}
                  </p>
                </div>
                <div className="heading-actions">
                  <button className="button secondary" onClick={saveAsset}>
                    <Plus size={17} />
                    Save to collection
                  </button>
                  <button
                    className="button primary"
                    onClick={() => setModal("export")}
                  >
                    <Download size={17} />
                    Export model
                  </button>
                </div>
              </div>

              <section
                className={`studio ${characterMode ? "creature-studio" : ""} ${humanMode ? "human-studio" : ""}`}
                aria-label="3D asset editor"
              >
                <div className="creation-panel">
                  <div className="panel-heading">
                    <span className="step-number">01</span>
                    <h2>
                      {humanMode
                        ? "Create a human"
                        : creatureMode
                          ? "Create a creature"
                          : "Create your asset"}
                    </h2>
                    <WandSparkles size={16} />
                  </div>
                  <div className="creation-body">
                    <div
                      className="studio-mode-tabs"
                      aria-label="Choose studio mode"
                    >
                      <button
                        className={creatureMode ? "active" : ""}
                        aria-pressed={creatureMode}
                        onClick={() => chooseAsset("creature-mossling")}
                      >
                        Creatures
                      </button>
                      <button
                        className={humanMode ? "active" : ""}
                        aria-pressed={humanMode}
                        onClick={() => chooseAsset("human-ranger")}
                      >
                        Humans
                      </button>
                      <button
                        className={!characterMode ? "active" : ""}
                        aria-pressed={!characterMode}
                        onClick={() => chooseAsset("sword")}
                      >
                        World props
                      </button>
                    </div>
                    <div className="field-header">
                      <span className="field-label">
                        {humanMode
                          ? "Choose an archetype"
                          : creatureMode
                            ? "Pick a starting species"
                            : "Start with a shape"}
                      </span>
                      <span className="small-label">
                        {creatureMode ? "Mix & match" : "6 templates"}
                      </span>
                    </div>
                    <div className="asset-picker">
                      {pickerAssets.map((asset) => (
                        <button
                          key={asset.id}
                          className={`asset-option ${asset.id === config.type ? "selected" : ""}`}
                          onClick={() => chooseAsset(asset.id)}
                          aria-pressed={asset.id === config.type}
                        >
                          <AssetArt
                            type={asset.id}
                            primary={asset.primary}
                            accent={asset.accent}
                          />
                          <span>{asset.name}</span>
                          {asset.id === config.type && (
                            <span className="selected-tick">
                              <Check size={9} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {humanMode && (
                      <HumanControls
                        config={config}
                        onChange={patchHuman}
                        onRandom={randomizeHuman}
                        onReset={() => chooseAsset(config.type)}
                        onFocus={setViewFocus}
                        onPosePreset={humanPosePreset}
                      />
                    )}
                    {!humanMode && (
                      <>
                        <div className="section-rule">
                          <span>or make it personal</span>
                        </div>
                        <form onSubmit={generate}>
                          <label className="field-label" htmlFor="prompt">
                            Describe your asset <Sparkles size={13} />
                          </label>
                          <div
                            className={`prompt-box ${promptError ? "has-error" : ""}`}
                          >
                            <textarea
                              id="prompt"
                              maxLength={500}
                              value={prompt}
                              onChange={(e) => {
                                setPrompt(e.target.value);
                                setPromptError("");
                              }}
                              placeholder="A cute blue dragon with antlers and crystal wings…"
                              aria-describedby={
                                promptError ? "prompt-error" : "prompt-help"
                              }
                            />
                            <div className="prompt-footer">
                              <span>Keep it simple. Be creative.</span>
                              <span>{prompt.length}/500</span>
                            </div>
                          </div>
                          {promptError ? (
                            <p
                              className="field-error"
                              id="prompt-error"
                              role="alert"
                            >
                              {promptError}
                            </p>
                          ) : (
                            <p className="prompt-help" id="prompt-help">
                              {creatureMode
                                ? "Try rabbit, dragon, bird, or slime, plus wings, antlers, spots, and colors."
                                : "Uses prop templates, color words, and detail level."}
                            </p>
                          )}
                          <button
                            className="button generate-button"
                            disabled={generation}
                            type="submit"
                          >
                            <WandSparkles size={16} />
                            {generation
                              ? "Creating your asset…"
                              : "Generate asset"}
                            <span className="button-spark" aria-hidden="true">
                              ✧
                            </span>
                          </button>
                        </form>
                        <div className="generation-note">
                          <span className="status-dot" />
                          <span>Procedural generation · no credits needed</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="panel-footnote">
                    <Info size={14} />
                    <span>Small polygons. Endless possibilities.</span>
                  </div>
                </div>

                <div className="preview-panel">
                  <div className="preview-header">
                    <div>
                      <span className="status-dot" />
                      <strong>Live preview</strong>
                      <span className="preview-divider" />
                      <span>3D viewport</span>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setPreviewZoom(1);
                        setResetKey((k) => k + 1);
                        setAutoRotate(false);
                      }}
                      aria-label="Fit model to view"
                      title="Fit model to view"
                    >
                      <Maximize size={15} />
                    </button>
                  </div>
                  {characterMode && getRigSettings(config).enabled && (
                    <div className="viewport-rig-controls">
                      <label>
                        Motion{" "}
                        <select
                          aria-label="Viewport animation"
                          value={
                            rigInfo?.clips.includes(motion) ? motion : "Rest"
                          }
                          onChange={(e) => chooseMotion(e.target.value)}
                        >
                          {["Rest", ...(rigInfo?.clips || [])].map((clip) => (
                            <option key={clip} value={clip}>
                              {clip}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="icon-button"
                        disabled={motion === "Rest"}
                        onClick={() => setPlaying(!playing)}
                        aria-label={playing ? "Pause preview" : "Play preview"}
                        title={playing ? "Pause preview" : "Play preview"}
                      >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button
                        className="icon-button"
                        aria-pressed={showBones}
                        onClick={() => setShowBones(!showBones)}
                        aria-label="Toggle skeleton overlay"
                        title="Show skeleton"
                      >
                        <Bone size={16} />
                      </button>
                      {humanMode && (
                        <select
                          aria-label="Character view"
                          value={viewFocus}
                          onChange={(e) => setViewFocus(e.target.value)}
                        >
                          <option value="full">Full body</option>
                          <option value="face">Face</option>
                        </select>
                      )}
                      <a href="#creature-rig" title="Edit joint poses">
                        Rig controls <ChevronRight size={12} />
                      </a>
                    </div>
                  )}
                  <div
                    className={`viewport-wrap ${generation ? "generating" : ""}`}
                  >
                    <div className="viewport-label">
                      <span className="viewport-tag">
                        <Box size={12} /> {activeAsset.category}
                      </span>
                      <span className="viewport-tag light">LOW POLY</span>
                    </div>
                    <Viewport
                      config={config}
                      wireframe={wireframe}
                      grid={grid}
                      autoRotate={autoRotate}
                      showSizeReference={creatureMode && showSizeReference}
                      previewZoom={previewZoom}
                      resetKey={resetKey}
                      viewFocus={humanMode ? viewFocus : "full"}
                      onRigInfo={setRigInfo}
                      motion={motion}
                      playing={playing}
                      showBones={showBones}
                      onStats={setStats}
                      onError={setViewportError}
                    />
                    {viewportError && (
                      <div className="viewport-error" role="alert">
                        <Info size={23} />
                        <p>{viewportError}</p>
                      </div>
                    )}
                    {generation && (
                      <div className="generating-badge">
                        <RefreshCw size={16} className="spin" />
                        Creating your asset
                      </div>
                    )}
                    <div className="axis-widget" aria-hidden="true">
                      <span className="axis-y">Y</span>
                      <span className="axis-z">Z</span>
                      <span className="axis-x">X</span>
                      <i />
                    </div>
                    <div
                      className="preview-zoom-controls"
                      role="group"
                      aria-label="Preview zoom controls"
                    >
                      <button
                        aria-label="Zoom out preview"
                        title="Zoom out preview"
                        disabled={previewZoom <= 0.5}
                        onClick={() =>
                          setPreviewZoom((z) => Math.max(0.5, z - 0.25))
                        }
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span aria-live="polite">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        aria-label="Zoom in preview"
                        title="Zoom in preview"
                        disabled={previewZoom >= 3}
                        onClick={() =>
                          setPreviewZoom((z) => Math.min(3, z + 0.25))
                        }
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>
                    <div className="viewport-toolbar">
                      <button
                        className={!wireframe ? "selected" : ""}
                        aria-pressed={!wireframe}
                        onClick={() => setWireframe(false)}
                        aria-label="Solid view"
                        title="Solid view"
                      >
                        <Box size={17} />
                      </button>
                      <button
                        className={wireframe ? "selected" : ""}
                        aria-pressed={wireframe}
                        onClick={() => setWireframe(true)}
                        aria-label="Wireframe view"
                        title="Wireframe view"
                      >
                        <Boxes size={17} />
                      </button>
                      <span />
                      <button
                        className={grid ? "selected" : ""}
                        aria-pressed={grid}
                        onClick={() => setGrid((g) => !g)}
                        aria-label="Toggle grid"
                        title="Toggle grid"
                      >
                        <Grid2X2 size={17} />
                      </button>
                      <button
                        className={autoRotate ? "selected" : ""}
                        aria-pressed={autoRotate}
                        onClick={() => setAutoRotate((v) => !v)}
                        aria-label={
                          autoRotate ? "Pause rotation" : "Auto rotate"
                        }
                        title={autoRotate ? "Pause rotation" : "Auto rotate"}
                      >
                        {autoRotate ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setPreviewZoom(1);
                          setResetKey((k) => k + 1);
                          setAutoRotate(false);
                        }}
                        aria-label="Reset camera"
                        title="Reset camera"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="preview-footer">
                    <span>
                      <MousePointer2 size={13} />
                      Drag to orbit
                    </span>
                    <span>
                      <Move3D size={13} />
                      Scroll to zoom
                    </span>
                    <span className="units-label">Y-up · meters</span>
                  </div>
                </div>

                <div className="properties-panel">
                  <div className="panel-heading">
                    <span className="step-number">02</span>
                    <h2>Make it yours</h2>
                    <Palette size={16} />
                  </div>
                  <div className="properties-body">
                    <label className="field-label" htmlFor="asset-name">
                      Asset name
                    </label>
                    <input
                      id="asset-name"
                      className="text-input"
                      maxLength={60}
                      value={config.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                    <div className="property-section">
                      <div className="property-heading">
                        <Palette size={14} />
                        <span>Color palette</span>
                      </div>
                      <label className="color-row" htmlFor="primary-color">
                        <span>Primary</span>
                        <div>
                          <span>{config.primary.toUpperCase()}</span>
                          <input
                            type="color"
                            id="primary-color"
                            aria-label="Primary color"
                            value={config.primary}
                            onChange={(e) => patch({ primary: e.target.value })}
                          />
                        </div>
                      </label>
                      <label className="color-row" htmlFor="accent-color">
                        <span>Accent</span>
                        <div>
                          <span>{config.accent.toUpperCase()}</span>
                          <input
                            type="color"
                            id="accent-color"
                            aria-label="Accent color"
                            value={config.accent}
                            onChange={(e) => patch({ accent: e.target.value })}
                          />
                        </div>
                      </label>
                      <div className="color-swatches">
                        {SWATCHES.map((color) => (
                          <button
                            key={color}
                            style={{ "--swatch": color }}
                            className={config.primary === color ? "chosen" : ""}
                            aria-label={`Set primary color to ${color}`}
                            aria-pressed={config.primary === color}
                            onClick={() => patch({ primary: color })}
                          >
                            {config.primary === color && <Check size={13} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="property-section">
                      <div className="property-heading">
                        <Layers3 size={14} />
                        <span>Geometry</span>
                      </div>
                      <div className="range-label">
                        <label htmlFor="detail">Detail level</label>
                        <span>
                          {["Simple", "Balanced", "Detailed"][config.detail]}
                        </span>
                      </div>
                      <input
                        className="range-input"
                        type="range"
                        id="detail"
                        min="0"
                        max="2"
                        step="1"
                        value={config.detail}
                        onChange={(e) =>
                          patch({ detail: Number(e.target.value) })
                        }
                      />
                      <div className="range-ticks">
                        <span>Less</span>
                        <span>More</span>
                      </div>
                      <SizeControls
                        value={config.scale}
                        stats={stats}
                        onChange={(scale) => patch({ scale })}
                        creature={creatureMode}
                        onBoss={bossBuild}
                        showReference={showSizeReference}
                        onReference={setShowSizeReference}
                      />
                      <div className="seed-row">
                        <label htmlFor="seed">Variation seed</label>
                        <div>
                          <input
                            id="seed"
                            type="number"
                            min="0"
                            max="999999"
                            value={config.seed}
                            onChange={(e) =>
                              patch({
                                seed: Math.max(
                                  0,
                                  Math.min(999999, Number(e.target.value) || 0),
                                ),
                              })
                            }
                          />
                          <button
                            className="icon-button"
                            aria-label="Randomize variation seed"
                            title="Randomize variation seed"
                            onClick={() =>
                              patch({
                                seed: Math.floor(Math.random() * 999999),
                              })
                            }
                          >
                            <RefreshCw size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="seed-hint">
                        {humanMode
                          ? "Seeds vary freckles. Randomize look creates new appearance settings."
                          : creatureMode
                            ? "Seeds vary proportions, markings, and back details."
                            : "Seeds vary the blade, foliage, and rocks."}
                      </p>
                    </div>
                    <div className="asset-stats">
                      <div className="stats-heading">
                        <Box size={14} />
                        <span>Asset details</span>
                        <span className="ready-pill">EXPORT READY</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Triangles</dt>
                          <dd data-testid="triangle-count">
                            {stats?.triangles.toLocaleString() || "—"}
                          </dd>
                        </div>
                        <div>
                          <dt>Materials</dt>
                          <dd>{stats?.materials || "—"}</dd>
                        </div>
                        <div>
                          <dt>Dimensions</dt>
                          <dd className="dimensions">
                            {stats
                              ? stats.size.map((n) => n.toFixed(2)).join(" × ")
                              : "—"}{" "}
                            m
                          </dd>
                        </div>
                      </dl>
                      <span className="stats-note">
                        <Check size={12} />
                        {characterMode && getRigSettings(config).enabled
                          ? "Rigged character · animation clips · PBR colors"
                          : "Static mesh · geometry UVs · PBR colors"}
                      </span>
                    </div>
                    <button
                      className="reset-settings"
                      onClick={() => {
                        chooseAsset(config.type);
                        setPreviewZoom(1);
                        patch({ scale: 1, detail: 1, seed: 42 });
                        setResetKey((k) => k + 1);
                        notify("Asset settings reset.");
                      }}
                    >
                      <RotateCcw size={13} />
                      Reset settings
                    </button>
                  </div>
                </div>
              </section>

              {creatureMode && (
                <CreatureControls
                  config={config}
                  onChange={patchCreature}
                  onElement={changeElement}
                  onSurprise={surpriseCreature}
                />
              )}

              {characterMode && (
                <RigControls
                  config={config}
                  info={rigInfo}
                  motion={motion}
                  onMotion={chooseMotion}
                  playing={playing}
                  onPlaying={setPlaying}
                  showBones={showBones}
                  onShowBones={setShowBones}
                  joint={selectedJoint}
                  onJoint={setSelectedJoint}
                  onChange={patchRig}
                  onPose={poseJoint}
                />
              )}

              <section className="starter-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {humanMode
                        ? "The cast of your next adventure"
                        : creatureMode
                          ? "A field guide to your next world"
                          : "A few starting points"}
                      <span>
                        {humanMode
                          ? "Six archetypes. Endless identities."
                          : creatureMode
                            ? "Six species. Countless variations."
                            : "Made for your next adventure"}
                      </span>
                    </h2>
                  </div>
                  <button onClick={() => navigate("collection")}>
                    Your collection
                    <ArrowUpRight size={15} />
                  </button>
                </div>
                <div
                  className={`starter-grid ${characterMode ? "creature-starter-grid" : ""}`}
                >
                  {startingAssets.map((asset, i) => (
                    <button
                      className={`starter-card starter-${i}`}
                      key={asset.id}
                      onClick={() => chooseAsset(asset.id)}
                    >
                      <div className="starter-art">
                        <AssetArt
                          type={asset.id}
                          primary={asset.primary}
                          accent={asset.accent}
                        />
                        <span className="starter-arrow">
                          <ArrowUpRight size={14} />
                        </span>
                      </div>
                      <div className="starter-info">
                        <strong>
                          {characterMode
                            ? asset.name
                            : [
                                "Guardian shield",
                                "Woodland pine",
                                "Mossy boulder",
                                "Treasure chest",
                                "Healing potion",
                              ][i]}
                        </strong>
                        <span>
                          {asset.category}
                          <span>·</span>Low poly
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <div className="bottom-note">
                <span>
                  <span className="tiny-star">✳</span>Made by you. Ready for
                  your world.
                </span>
                <span>
                  GLB & OBJ exports<span className="dot-separator">·</span>
                  Unity, Unreal & Godot
                </span>
              </div>
            </>
          )}

          {page === "collection" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow heading-eyebrow">
                    YOUR LITTLE WORLD, IN THE MAKING
                  </div>
                  <h1>
                    My collection<span>.</span>
                  </h1>
                  <p>
                    Your saved assets, ready for their next adventure. Stored on
                    this {desktopMode ? "computer" : "browser"}.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => navigate("studio")}
                >
                  <Plus size={17} />
                  Create an asset
                </button>
              </div>
              <div className="collection-controls">
                <div className="category-tabs" aria-label="Filter by category">
                  {[
                    "All assets",
                    "Creatures",
                    "Humans",
                    "Weapons",
                    "Nature",
                    "Props",
                  ].map((cat) => (
                    <button
                      key={cat}
                      className={category === cat ? "active" : ""}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <label className="search-field">
                  <Search size={16} />
                  <input
                    placeholder="Search your collection"
                    aria-label="Search your collection"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {filteredCollection.length ? (
                <div className="collection-grid">
                  {filteredCollection.map((item) => (
                    <article className="collection-card" key={item.id}>
                      <button
                        className="collection-art"
                        onClick={() => loadAsset(item)}
                        aria-label={`Open ${item.name}`}
                      >
                        <AssetArt
                          type={item.type}
                          creature={item.creature}
                          human={item.human}
                          primary={item.primary}
                          accent={item.accent}
                        />
                        <span className="open-asset">
                          Open in studio
                          <ArrowUpRight size={16} />
                        </span>
                      </button>
                      <div className="collection-card-info">
                        <div>
                          <h2>{item.name || "Untitled asset"}</h2>
                          <p>
                            {ASSETS.find((a) => a.id === item.type).category} ·{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          className="icon-button delete-button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => setModal({ type: "delete", item })}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <AssetArt type="tree" />
                    <AssetArt type="sword" />
                    <AssetArt type="potion" />
                  </div>
                  <h2>
                    {collection.length
                      ? "No assets found"
                      : "A new world starts with one asset."}
                  </h2>
                  <p>
                    {collection.length
                      ? "Try another search or category."
                      : "Create something in the studio, then save it here to keep building."}
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate("studio")}
                  >
                    <WandSparkles size={17} />
                    Go to the studio
                  </button>
                </div>
              )}
            </>
          )}

          {page === "guide" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow heading-eyebrow">
                    FROM YOUR STUDIO TO YOUR WORLD
                  </div>
                  <h1>
                    Good to game<span>.</span>
                  </h1>
                  <p>
                    A small guide to getting your assets into your favorite game
                    engine.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => navigate("studio")}
                >
                  <ArrowLeft size={17} />
                  Back to studio
                </button>
              </div>
              <div className="guide-intro">
                <span className="guide-icon">
                  <Box size={32} />
                </span>
                <div>
                  <h2>A clean starting point for your game.</h2>
                  <p>
                    Humans and creatures can include a skeleton, skin weights,
                    and in-place animation clips. Every asset includes material
                    colors, normals, and geometry UVs. Models stand on the
                    ground, use a Y-up axis, and measure in meters. Add textures
                    and collision shapes in your game tools. OBJ keeps the
                    configured pose but cannot carry bones or animations.
                  </p>
                </div>
              </div>
              <div className="guide-grid">
                {[
                  {
                    name: "Unity",
                    letter: "U",
                    format: "GLB with glTFast, or OBJ",
                    steps: [
                      "For GLB, install the official Unity glTFast package (com.unity.cloud.gltfast) from Package Manager.",
                      "Import the GLB using glTFast. For an OBJ, place both the .obj and .mtl files in the same Assets folder.",
                      "Use a Generic animation rig for creatures and wire the imported clips into your Animator. Add a collider and adjust scale.",
                    ],
                  },
                  {
                    name: "Unreal Engine",
                    letter: "UE",
                    format: "GLB / FBX via Blender",
                    steps: [
                      "Use Unreal Engine 5’s Interchange glTF import support; enable the relevant plugin if needed.",
                      "For rigged creatures, check your engine version’s skeletal glTF support. If needed, open the GLB in Blender and export FBX for Unreal.",
                      "Import rigged creatures as Skeletal Meshes. Add an Animation Blueprint and collision; world props remain Static Meshes.",
                    ],
                  },
                  {
                    name: "Godot",
                    letter: "G",
                    format: "GLB recommended",
                    steps: [
                      "Drag the .glb file into your project’s FileSystem dock.",
                      "Let Godot import the model, skeleton, and animations. Use AnimationPlayer or AnimationTree to play creature clips.",
                      "Create an inherited scene to add collisions, scripts, and your own game logic.",
                    ],
                  },
                ].map((engine) => (
                  <article className="guide-card" key={engine.name}>
                    <div className="engine-heading">
                      <span>{engine.letter}</span>
                      <h2>{engine.name}</h2>
                    </div>
                    <span className="engine-format">{engine.format}</span>
                    <ol>
                      {engine.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
              <div className="guide-tip">
                <Info size={20} />
                <div>
                  <strong>GLB keeps things together.</strong>
                  <p>
                    GLB includes geometry, PBR colors, and creature skeletons
                    and clips in one file.{" "}
                    {desktopMode
                      ? "OBJ exports save the model and matching MTL file together in your chosen folder."
                      : "OBJ exports download a separate MTL file for colors; keep both files together and allow multiple downloads if your browser asks."}{" "}
                    Generate collisions and LODs in your engine as needed.
                  </p>
                </div>
              </div>
            </>
          )}
          {storageError && (
            <p className="storage-warning" role="alert">
              Browser storage is unavailable. Export your assets before leaving
              this page.
            </p>
          )}
        </div>
      </main>

      {modal === "export" && (
        <Dialog
          title="Ready for your next world."
          subtitle="Export your asset and make it part of the adventure."
          onClose={() => !exporting && setModal(null)}
        >
          <div className="export-asset">
            <AssetArt
              type={config.type}
              creature={config.creature}
              primary={config.primary}
              accent={config.accent}
            />
            <div>
              <strong>{config.name || "Untitled asset"}</strong>
              <span>
                {stats?.triangles.toLocaleString() || "—"} triangles ·{" "}
                {stats?.materials || "—"} materials
              </span>
            </div>
            <span className="ready-pill">READY</span>
          </div>
          <span className="field-label">Choose your format</span>
          <div className="format-options">
            {[
              {
                id: "glb",
                title: "GLB",
                note: "One file. Geometry + materials.",
                badge: "RECOMMENDED",
              },
              {
                id: "obj",
                title: "OBJ + MTL",
                note: "Two files. Wide compatibility.",
              },
            ].map((option) => (
              <button
                key={option.id}
                className={`format-option ${format === option.id ? "selected" : ""}`}
                onClick={() => setFormat(option.id)}
                aria-pressed={format === option.id}
              >
                <span className="radio-dot" />
                <div>
                  <strong>{option.title}</strong>
                  <span>{option.note}</span>
                </div>
                {option.badge && (
                  <span className="format-badge">{option.badge}</span>
                )}
              </button>
            ))}
          </div>
          <p className="export-note">
            <Info size={15} />
            {characterMode && getRigSettings(config).enabled
              ? "GLB includes bones + clips · OBJ bakes your joint pose · meters · Y-up"
              : "Static mesh · meters · Y-up"}
          </p>
          <button
            className="button primary dialog-action"
            disabled={exporting}
            onClick={doExport}
          >
            <Download size={17} />
            {exporting
              ? "Preparing your model…"
              : `${desktopMode ? "Save" : "Download"} ${format === "glb" ? "GLB" : "OBJ + MTL"}`}
          </button>
        </Dialog>
      )}
      {modal === "help" && (
        <Dialog
          title="A little idea goes a long way."
          subtitle={
            desktopMode
              ? "Your desktop 3D workshop. Here’s how to use it."
              : "Your browser is a tiny 3D workshop. Here’s how to use it."
          }
          onClose={() => setModal(null)}
        >
          <div className="help-steps">
            <div>
              <span className="step-number">01</span>
              <div>
                <h3>Find your starting point</h3>
                <p>
                  Choose Humans for a character editor, or pick a creature
                  species or world prop. Describe a dragon, rabbit, bird, slime,
                  or creature with colors, antlers, wings, spots, and other
                  supported features. Generation uses editable procedural
                  anatomy, rather than an AI service.
                </p>
              </div>
            </div>
            <div>
              <span className="step-number">02</span>
              <div>
                <h3>Give it some personality</h3>
                <p>
                  Mix body plans, ears, horns, wings, tails, patterns, eyes, and
                  temperament in the anatomy panel. Change colors, scale,
                  detail, and seed. Drag the preview to orbit, scroll to zoom,
                  and right-drag to pan.
                </p>
              </div>
            </div>
            <div>
              <span className="step-number">03</span>
              <div>
                <h3>Take it into your world</h3>
                <p>
                  Save to your collection, or export a GLB or OBJ. Collection
                  saves are local; export models for a permanent backup.
                </p>
              </div>
            </div>
          </div>
          <button
            className="button primary dialog-action"
            onClick={() => setModal(null)}
          >
            Let’s make something
            <ArrowUpRight size={17} />
          </button>
        </Dialog>
      )}
      {modal?.type === "delete" && (
        <Dialog
          title="Remove this asset?"
          subtitle={`“${modal.item.name || "Untitled asset"}” will be removed from this browser’s collection.`}
          onClose={() => setModal(null)}
        >
          <p className="delete-note">
            Downloaded files stay on your device. This collection entry cannot
            be restored after deletion.
          </p>
          <div className="delete-actions">
            <button className="button secondary" onClick={() => setModal(null)}>
              Keep asset
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (
                  updateCollection(
                    collection.filter((item) => item.id !== modal.item.id),
                  )
                ) {
                  setModal(null);
                  notify("Asset removed from your collection.");
                }
              }}
            >
              <Trash2 size={16} />
              Remove asset
            </button>
          </div>
        </Dialog>
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <Info size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
