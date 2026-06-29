export interface FilterPreset {
  id: string;
  name: string;
  category: "essentials" | "cinematic" | "vintage" | "vibrant" | "mono" | "aesthetic";
  description: string;
  cssFilter: string;
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
