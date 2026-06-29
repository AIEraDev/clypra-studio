import type { EffectPreset, SourceMedia } from "./types";

export { FILTER_CATEGORY_IDS as FILTER_CATEGORIES } from "../../constants/filterCategories";
export type { FilterCategoryId } from "../../constants/filterCategories";

export const DEFAULT_TEST_IMAGES: SourceMedia[] = [
  { id: "clypra-logo", name: "Clypra Logo", url: "/clypra.svg", kind: "image" },
  { id: "sample-portrait", name: "Sample Portrait", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80", kind: "image" },
  { id: "sample-landscape", name: "Sample Landscape", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", kind: "image" },
];

/** Node types available in the linear effect stack designer */
export const STACKABLE_NODE_TYPES = [
  "Brightness",
  "Contrast",
  "Saturation",
  "Temperature",
  "Tint",
  "HueRotate",
  "Sepia",
  "Grayscale",
  "Vignette",
  "GaussianBlur",
] as const;

/** @deprecated use FILTER_CATEGORIES export */
export const MPG_CATEGORIES = [
  "essentials",
  "portrait",
  "landscape",
  "cinematic",
  "movies",
  "vintage",
  "vibrant",
  "mono",
  "aesthetic",
  "life",
] as const;

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "brightness-only",
    name: "Brightness Boost",
    description: "Lift exposure slightly",
    effects: [{ type: "Brightness", params: { brightness: 0.2 } }],
  },
  {
    id: "blur-only",
    name: "Soft Blur",
    description: "Dreamy gaussian blur",
    effects: [{ type: "GaussianBlur", params: { blur: 12.0 } }],
  },
  {
    id: "bright-blur",
    name: "Glow + Blur",
    description: "Brightened with soft blur",
    effects: [
      { type: "Brightness", params: { brightness: 0.15 } },
      { type: "GaussianBlur", params: { blur: 10.0 } },
    ],
  },
  {
    id: "full-stack",
    name: "Full Effect Stack",
    description: "Brightness, contrast, and blur",
    effects: [
      { type: "Brightness", params: { brightness: 0.1 } },
      { type: "Contrast", params: { contrast: 0.15 } },
      { type: "GaussianBlur", params: { blur: 8.0 } },
    ],
  },
  {
    id: "teal-orange",
    name: "Teal & Orange",
    description: "Hollywood cinematic grade",
    effects: [
      { type: "Temperature", params: { temperature: 0.25 } },
      { type: "Contrast", params: { contrast: 0.2 } },
      { type: "Saturation", params: { saturation: 0.15 } },
      { type: "Vignette", params: { vignette: 0.35 } },
    ],
  },
  {
    id: "golden-portrait",
    name: "Golden Portrait",
    description: "Warm skin tones with soft glow",
    effects: [
      { type: "Temperature", params: { temperature: 0.35 } },
      { type: "Brightness", params: { brightness: 0.08 } },
      { type: "Saturation", params: { saturation: 0.12 } },
      { type: "GaussianBlur", params: { blur: 4.0 } },
    ],
  },
  {
    id: "moody-noir",
    name: "Moody Noir",
    description: "Dark cinematic with heavy vignette",
    effects: [
      { type: "Brightness", params: { brightness: -0.15 } },
      { type: "Contrast", params: { contrast: 0.3 } },
      { type: "Saturation", params: { saturation: -0.2 } },
      { type: "Vignette", params: { vignette: 0.55 } },
    ],
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description: "Sepia fade with muted contrast",
    effects: [
      { type: "Sepia", params: { sepia: 0.45 } },
      { type: "Contrast", params: { contrast: -0.1 } },
      { type: "Vignette", params: { vignette: 0.3 } },
    ],
  },
  {
    id: "bold-saturation",
    name: "Bold Saturation",
    description: "CapCut-style punchy color pop",
    effects: [
      { type: "Saturation", params: { saturation: 0.45 } },
      { type: "Contrast", params: { contrast: 0.15 } },
      { type: "Brightness", params: { brightness: 0.05 } },
    ],
  },
  {
    id: "cool-minimal",
    name: "Cool Minimal",
    description: "Clean cold tones, low saturation",
    effects: [
      { type: "Temperature", params: { temperature: -0.3 } },
      { type: "Saturation", params: { saturation: -0.15 } },
      { type: "Contrast", params: { contrast: 0.08 } },
    ],
  },
  {
    id: "mono-classic",
    name: "Classic Mono",
    description: "Black and white with contrast punch",
    effects: [
      { type: "Grayscale", params: { grayscale: 1.0 } },
      { type: "Contrast", params: { contrast: 0.25 } },
    ],
  },
  {
    id: "dreamy-landscape",
    name: "Dreamy Landscape",
    description: "Airy landscape with cool tint",
    effects: [
      { type: "Brightness", params: { brightness: 0.12 } },
      { type: "Tint", params: { tint: -0.1 } },
      { type: "Saturation", params: { saturation: 0.2 } },
      { type: "GaussianBlur", params: { blur: 3.0 } },
    ],
  },
];

export const PROMPT_SUGGESTIONS = [
  "Soft dreamy portrait with warm glow",
  "High contrast cinematic teal and orange",
  "Muted vintage film aesthetic with sepia",
  "Bold saturated social media pop",
  "Cool minimalist landscape mood",
  "Moody noir with heavy vignette",
  "Classic black and white high contrast",
];
