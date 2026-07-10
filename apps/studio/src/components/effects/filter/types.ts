import type { FilterCategoryId } from "../../../constants/filterCategories";

/** High-res grading params powering GLSL ColorAdjustmentsEffect (GPU primary path). */
export interface GradingParams {
  // ── Existing ────────────────────────────────────────────────────────────────
  exposure?:    number;
  brightness?:  number;
  contrast?:    number;
  saturation?:  number;
  temperature?: number;
  tint?:        number;
  sepia?:       number;
  grayscale?:   number;
  hueRotate?:   number;
  vignette?:    number;
  invert?:      number;

  // ── NEW: Lift ────────────────────────────────────────────────────────────────
  lift?: number;

  // ── NEW: Split-toning ────────────────────────────────────────────────────────
  splitTone?: {
    shadowColor:       string;
    shadowStrength:    number;
    highlightColor:    string;
    highlightStrength: number;
    balance:           number;
  };

  // ── NEW: Film grain ──────────────────────────────────────────────────────────
  grain?: {
    intensity: number;
    size:      number;
  };

  // ── NEW: Halation ────────────────────────────────────────────────────────────
  halation?: {
    color:     string;
    threshold: number;
    intensity: number;
  };

  // ── NEW: Channel-mix B&W ─────────────────────────────────────────────────────
  channelMix?: {
    r: number;
    g: number;
    b: number;
  };

  // ── NEW: Duotone ─────────────────────────────────────────────────────────────
  duotone?: {
    darkColor:  string;
    lightColor: string;
  };

  // ── NEW: Vibrance ────────────────────────────────────────────────────────────
  vibrance?: {
    amount:        number;
    protectedHue?: string;
  };

  // ── NEW: Cross-process ───────────────────────────────────────────────────────
  crossProcess?: {
    amount: number;
  };
}

export interface FilterPreset {
  id:          string;
  name:        string;
  category:    FilterCategoryId;
  description: string;
  cssFilter:   string;
  gradingParams?: GradingParams;
  intensity:   number;
}

export type CategoryType = "all" | FilterCategoryId;

export const INITIAL_MANUAL_ADJUSTMENTS = {
  // ── Existing ────────────────────────────────────────────────────────────────
  exposure:    0,
  brightness:  0,
  contrast:    0,
  saturation:  0,
  temperature: 0,
  tint:        0,
  sepia:       0,
  grayscale:   0,
  hueRotate:   0,
  blur:        0,
  vignette:    0,
  invert:      0,
  // ── NEW ─────────────────────────────────────────────────────────────────────
  lift:            0,
  vibrance:        0,
  grainIntensity:  0,
  grainSize:       1,
  crossProcess:    0,
};
