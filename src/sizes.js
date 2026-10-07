import { normalizeScale, SCALE_LIMITS } from "./models.js";

export const SIZE_PRESETS = Object.freeze(
  [
    { label: "Tiny", height: 0.15 },
    { label: "Miniature", height: 0.3 },
    { label: "Pet", height: 0.5 },
    { label: "Companion", height: 0.85 },
    { label: "Small", height: 1.2 },
    { label: "Nearly human", height: 1.5 },
    { label: "Human-sized", height: 1.8 },
    { label: "Tall", height: 2.5 },
    { label: "Large", height: 4 },
    { label: "Huge", height: 8 },
    { label: "Giant", height: 15 },
    { label: "Titan", height: 40 },
    { label: "Colossal", height: 100 },
    { label: "World boss", height: 500 },
  ].map(Object.freeze),
);

export function scaleForHeight(height, baseHeight) {
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isFinite(baseHeight) ||
    baseHeight <= 0
  )
    return null;
  return normalizeScale(height / baseHeight);
}

// Give small and giant sizes equal room on the slider.
const low = Math.log10(SCALE_LIMITS.min);
const span = Math.log10(SCALE_LIMITS.max) - low;
export function scaleToSlider(scale) {
  return ((Math.log10(normalizeScale(scale)) - low) / span) * 100;
}
export function sliderToScale(position) {
  if (!Number.isFinite(position)) return 1;
  return normalizeScale(
    Number(
      (
        10 **
        (low + (Math.min(100, Math.max(0, position)) / 100) * span)
      ).toPrecision(6),
    ),
  );
}
