import type { FilterCategoryId } from "../../../constants/filterCategories";

export interface FilterPreset {
  id: string;
  name: string;
  category: FilterCategoryId;
  description: string;

  // Legacy CSS path
  cssFilter: string;

  // GLSL parameters (used by PixiJS ColorAdjustmentsEffect)
  gradingParams?: {
    exposure?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    temperature?: number;
    tint?: number;
    sepia?: number;
    grayscale?: number;
    hueRotate?: number;
    invert?: number;
    vignette?: number;
    blur?: number;
  };

  intensity: number;
}

export type CategoryType = "all" | FilterCategoryId;

export const INITIAL_MANUAL_ADJUSTMENTS = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  blur: 0,
  vignette: 0,
  invert: 0,
};
