import { useEffect, useRef, useState } from "react";
import { SCALE_LIMITS, normalizeScale } from "./models.js";
import {
  SIZE_PRESETS,
  scaleForHeight,
  scaleToSlider,
  sliderToScale,
} from "./sizes.js";

export default function SizeControls({
  value,
  stats,
  measurementReady = true,
  onChange,
  creature,
  onBoss,
  showReference,
  onReference,
}) {
  const baseHeight = stats?.size[1] / stats?.scale;
  const height = Number.isFinite(baseHeight) ? baseHeight * value : null;
  const [draft, setDraft] = useState(String(value)),
    [heightDraft, setHeightDraft] = useState("");
  const editingHeight = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => {
    if (!editingHeight.current) setHeightDraft(height?.toFixed(2) || "");
  }, [height]);
  function commitScale() {
    if (!draft.trim() || !Number.isFinite(Number(draft))) {
      setDraft(String(value));
      return;
    }
    const next = normalizeScale(Number(draft));
    setDraft(String(next));
    onChange(next);
  }
  function commitHeight() {
    editingHeight.current = false;
    if (
      !heightDraft.trim() ||
      !Number.isFinite(Number(heightDraft)) ||
      !baseHeight
    ) {
      setHeightDraft(height?.toFixed(2) || "");
      return;
    }
    const next = normalizeScale(Number(heightDraft) / baseHeight);
    setHeightDraft((baseHeight * next).toFixed(2));
    onChange(next);
  }
  const enter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };
  return (
    <div className="size-controls">
      <div className="range-label scale-label">
        <label htmlFor="scale">Scale</label>
        <span>{value.toFixed(2)}×</span>
      </div>
      <input
        id="scale"
        className="range-input"
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={scaleToSlider(value)}
        aria-valuemin={SCALE_LIMITS.min}
        aria-valuemax={SCALE_LIMITS.max}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)} times original size`}
        onChange={(e) => onChange(sliderToScale(Number(e.target.value)))}
      />
      <label className="size-exact">
        Exact scale{" "}
        <div>
          <input
            aria-label="Exact scale"
            type="number"
            min={SCALE_LIMITS.min}
            max={SCALE_LIMITS.max}
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitScale}
            onKeyDown={enter}
          />
          <span>×</span>
        </div>
      </label>
      <label className="size-exact">
        Height in meters{" "}
        <div>
          <input
            aria-label="Height in meters"
            type="number"
            min={height === null ? 0 : baseHeight * SCALE_LIMITS.min}
            max={height === null ? 1000 : baseHeight * SCALE_LIMITS.max}
            step="0.1"
            value={heightDraft}
            disabled={height === null}
            onFocus={() => {
              editingHeight.current = true;
            }}
            onChange={(e) => setHeightDraft(e.target.value)}
            onBlur={commitHeight}
            onKeyDown={enter}
          />
          <span>m</span>
        </div>
      </label>
      <p className="size-preset-label">Height presets</p>
      <div
        className="size-presets height-presets"
        role="group"
        aria-label="Height presets"
      >
        {SIZE_PRESETS.map((preset) => {
          const next = scaleForHeight(preset.height, baseHeight);
          const reachable =
            measurementReady &&
            next !== null &&
            Math.abs(next * baseHeight - preset.height) <
              Math.max(0.001, preset.height * 0.0001);
          return (
            <button
              key={preset.label}
              aria-label={`${preset.label} size (${preset.height}m)`}
              aria-pressed={
                height !== null &&
                Math.abs(height - preset.height) <
                  Math.max(0.001, preset.height * 0.0001)
              }
              disabled={!reachable}
              title={
                reachable
                  ? `${preset.height} meters tall`
                  : "Outside this model’s scale range"
              }
              onClick={() => onChange(next)}
            >
              {preset.label}
              <span>
                {preset.height < 1
                  ? `${Math.round(preset.height * 100)} cm`
                  : `${preset.height} m`}
              </span>
            </button>
          );
        })}
      </div>
      <p className="size-preset-label">Scale shortcuts</p>
      <div
        className="size-presets"
        role="group"
        aria-label="Creature size presets"
      >
        {[
          ["Companion", 0.5],
          ["Large", 3],
          ["Giant", 10],
          ["Titan", 30],
        ].map(([label, scale]) => (
          <button
            key={label}
            aria-label={`${label} size (${scale}x)`}
            aria-pressed={value === scale}
            onClick={() => onChange(scale)}
          >
            {label}
            <span>{scale}×</span>
          </button>
        ))}
      </div>
      {creature && (
        <>
          <button className="button secondary boss-build" onClick={onBoss}>
            Boss proportions
          </button>
          <label className="size-reference-toggle">
            <input
              type="checkbox"
              checked={showReference}
              onChange={(e) => onReference(e.target.checked)}
            />
            Show 1.8 m person
          </label>
        </>
      )}
      <p className="size-note">
        {SCALE_LIMITS.min}–{SCALE_LIMITS.max}× scale. Height includes the posed
        model’s highest features and can change when you edit anatomy. Size is
        preserved in exports. Hide the person to inspect tiny creatures up
        close.
      </p>
    </div>
  );
}
