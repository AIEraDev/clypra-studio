export interface FilterPreset {
  id: string;
  name: string;
  category: "essentials" | "cinematic" | "vintage" | "vibrant" | "mono" | "aesthetic";
  description: string;

  // Legacy CSS path
  cssFilter: string;

  // GLSL parameters (used by PixiJS ColorAdjustmentsEffect)
  gradingParams?: {
    exposure?: number; // -1.0 to 1.0
    brightness?: number; // -1.0 to 1.0
    contrast?: number; // -1.0 to 1.0
    saturation?: number; // -1.0 to 1.0
    temperature?: number; // -1.0 to 1.0
    tint?: number; // -1.0 to 1.0
    sepia?: number; // 0.0 to 1.0
    grayscale?: number; // 0.0 to 1.0
    hueRotate?: number; // radians
    invert?: number; // 0.0 to 1.0
    vignette?: number; // 0.0 to 1.0
    blur?: number; // pixels
  };

  intensity: number; // default strength 0-100
}

export type CategoryType = "all" | "essentials" | "cinematic" | "vintage" | "vibrant" | "mono" | "aesthetic";

export const INITIAL_MANUAL_ADJUSTMENTS = {
  exposure: 0, // -100 to 100
  brightness: 0, // -100 to 100
  contrast: 0, // -100 to 100
  saturation: 0, // -100 to 100
  temperature: 0, // -100 to 100 (blue to orange)
  tint: 0, // -100 to 100 (green to magenta)
  sepia: 0, // 0 to 100
  grayscale: 0, // 0 to 100
  hueRotate: 0, // 0 to 360
  blur: 0, // 0 to 15
  vignette: 0, // 0 to 100
  invert: 0, // 0 to 100
};
