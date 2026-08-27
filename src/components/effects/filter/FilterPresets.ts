import { FilterPreset } from "./types";
import { FILTER_CATEGORY_IDS } from "../../../constants/filterCategories";

export const FILTER_CATEGORIES = ["all", ...FILTER_CATEGORY_IDS] as const;

export const PRESET_FILTERS: FilterPreset[] = [

  // ESSENTIALS
  {
    id: "natural-balance",
    name: "Natural Balance",
    category: "essentials",
    description: "Precise white balance and filmic highlight rolloff.",
    cssFilter: "brightness(103%) contrast(106%) saturate(102%)",
    gradingParams: {
      exposure: 0.03,
      contrast: 0.06,
      vibrance: { amount: 0.15, protectedHue: "#E8B08C" },
    },
    intensity: 90,
  },
  {
    id: "clean-punch",
    name: "Clean Punch",
    category: "essentials",
    description: "Contrast boost with hue-selective vibrance.",
    cssFilter: "brightness(105%) contrast(115%) saturate(115%)",
    gradingParams: {
      exposure: 0.05,
      contrast: 0.15,
      vibrance: { amount: 0.35, protectedHue: "#E8B08C" },
    },
    intensity: 85,
  },

  // CINEMATIC
  {
    id: "golden-hour",
    name: "Golden Hour",
    category: "cinematic",
    description: "Warm amber highlight tint with neutral shadows.",
    cssFilter: "sepia(15%) saturate(115%) brightness(103%) contrast(98%) hue-rotate(-4deg)",
    gradingParams: {
      exposure: 0.05,
      temperature: 0.02,
      splitTone: {
        shadowColor: "#FFFFFF",
        shadowStrength: 0,
        highlightColor: "#FFB366",
        highlightStrength: 0.35,
        balance: 0.6,
      },
    },
    intensity: 90,
  },
  {
    id: "blockbuster",
    name: "Blockbuster",
    category: "cinematic",
    description: "Hollywood teal-and-orange grade with high contrast.",
    cssFilter: "",
    gradingParams: {
      contrast: 0.25,
      vignette: 0.3,
      splitTone: {
        shadowColor: "#1A4D4D",
        shadowStrength: 0.4,
        highlightColor: "#FF9D42",
        highlightStrength: 0.4,
        balance: 0.5,
      },
    },
    intensity: 80,
  },
  {
    id: "sage-drama",
    name: "Sage Drama",
    category: "cinematic",
    description: "Sage-green shadow tint, warm midtone protection, desaturated overall.",
    cssFilter: "",
    gradingParams: {
      saturation: -0.25,
      splitTone: {
        shadowColor: "#7A8B6F",
        shadowStrength: 0.45,
        highlightColor: "#E8C9A0",
        highlightStrength: 0.15,
        balance: 0.45,
      },
    },
    intensity: 80,
  },

  // VINTAGE
  {
    id: "kodak-fade",
    name: "Kodak Fade",
    category: "vintage",
    description: "Heavy lifted blacks for a matte/faded film look, warm cast, moderate grain.",
    cssFilter: "contrast(85%) brightness(104%) sepia(10%)",
    gradingParams: {
      contrast: -0.15,
      lift: 0.08,
      temperature: 0.015,
      grain: { intensity: 0.25, size: 1.5 },
    },
    intensity: 80,
  },
  {
    id: "super-8",
    name: "Super 8",
    category: "vintage",
    description: "Heavy grain with amber halation bloom around highlights.",
    cssFilter: "",
    gradingParams: {
      temperature: 0.0125,
      grain: { intensity: 0.4, size: 2.0 },
      halation: { color: "#FF8844", threshold: 0.75, intensity: 0.5 },
    },
    intensity: 85,
  },
  {
    id: "sepia-ink",
    name: "Sepia Ink",
    category: "vintage",
    description: "Classic full-frame warm sepia tint with grain and darkened corners.",
    cssFilter: "grayscale(100%) sepia(80%) contrast(96%) brightness(97%)",
    gradingParams: {
      sepia: 0.8,
      vignette: 0.35,
      grain: { intensity: 0.15, size: 1.2 },
    },
    intensity: 90,
  },

  // VIBRANT
  {
    id: "tropic-pop",
    name: "Tropic Pop",
    category: "vibrant",
    description: "Hue-selective saturation boost favoring warm oranges and yellows.",
    cssFilter: "brightness(105%) contrast(105%) saturate(130%)",
    gradingParams: {
      exposure: 0.05,
      saturation: 0.1,
      vibrance: { amount: 0.5, protectedHue: "#E8B08C" },
    },
    intensity: 90,
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    category: "vibrant",
    description: "Global hue rotation with high saturation and cool cast.",
    cssFilter: "contrast(125%) saturate(155%) hue-rotate(15deg) brightness(96%)",
    gradingParams: {
      hueRotate: 0.262,
      saturation: 0.4,
      temperature: -0.025,
      vignette: 0.2,
    },
    intensity: 85,
  },

  // MONO
  {
    id: "silver-gelatin",
    name: "Silver Gelatin",
    category: "mono",
    description: "Classic fine-art monochrome with neutral luminance mix.",
    cssFilter: "grayscale(100%) contrast(112%) brightness(98%)",
    gradingParams: {
      contrast: 0.15,
      channelMix: { r: 0.30, g: 0.59, b: 0.11 },
    },
    intensity: 100,
  },
  {
    id: "noir-drama",
    name: "Noir Drama",
    category: "mono",
    description: "Red-filter channel mix — darkens blue skies, brightens warm skin tones.",
    cssFilter: "grayscale(100%) contrast(142%) brightness(92%)",
    gradingParams: {
      contrast: 0.35,
      lift: -0.05,
      channelMix: { r: 0.55, g: 0.35, b: 0.10 },
    },
    intensity: 100,
  },
  {
    id: "documentary-gray",
    name: "Documentary Gray",
    category: "mono",
    description: "Green-filter channel mix — classic photojournalism skin rendering.",
    cssFilter: "grayscale(100%) contrast(105%) brightness(101%)",
    gradingParams: {
      contrast: 0.05,
      channelMix: { r: 0.20, g: 0.65, b: 0.15 },
      grain: { intensity: 0.12, size: 1.0 },
    },
    intensity: 100,
  },

  // AESTHETIC
  {
    id: "vaporwave",
    name: "Vaporwave",
    category: "aesthetic",
    description: "Duotone gradient mapping — deep magenta shadows to electric cyan highlights.",
    cssFilter: "",
    gradingParams: {
      duotone: {
        darkColor: "#4A1B5C",
        lightColor: "#5CE1E6",
      },
    },
    intensity: 90,
  },
  {
    id: "bleach-bypass",
    name: "Bleach Bypass",
    category: "aesthetic",
    description: "Near-desaturated, high-contrast bleach bypass — silver retention aesthetic.",
    cssFilter: "saturate(25%) contrast(140%) brightness(105%)",
    gradingParams: {
      exposure: 0.05,
      saturation: -0.75,
      contrast: 0.4,
    },
    intensity: 85,
  },
  {
    id: "lomo-cross",
    name: "Lomo Cross",
    category: "aesthetic",
    description: "Channel curve swap with heavy vignette — analog cross-process look.",
    cssFilter: "",
    gradingParams: {
      saturation: 0.25,
      vignette: 0.5,
      crossProcess: { amount: 0.6 },
    },
    intensity: 85,
  },
];

export const PROMPT_SUGGESTIONS = [
  { label: "Teal & Orange",    prompt: "cinematic Hollywood style teal and orange with warm skin tones",            category: "cinematic" },
  { label: "Kodak Fade",       prompt: "warm faded 1970s film look with soft matte blacks and grain",               category: "vintage"   },
  { label: "Cyberpunk Glow",   prompt: "futuristic neon cyberpunk style with deep blue shadows and pink highlights", category: "vibrant"   },
  { label: "Noir Drama",       prompt: "highly dramatic high contrast black and white with deep crushed shadows",    category: "mono"      },
  { label: "Vaporwave",        prompt: "synthwave duotone aesthetic with magenta shadows and cyan highlights",       category: "aesthetic" },
  { label: "Golden Hour",      prompt: "dreamy sunlit golden hour glow with warm amber highlights",                  category: "cinematic" },
];

export const parseCSSFilter = (filterStr: string) => {
  const adjustments = {
    brightness:  1.0,
    contrast:    1.0,
    saturation:  1.0,
    sepia:       0.0,
    grayscale:   0.0,
    hueRotate:   0.0,
    invert:      0.0,
  };

  const matches = filterStr.match(/(\w+-?\w+)\(([^)]+)\)/g) || [];
  for (const match of matches) {
    const parts = match.split("(");
    const name  = parts[0].trim();
    const value = parts[1].replace(")", "").trim();

    if      (name === "brightness") { adjustments.brightness = parseFloat(value) / 100; }
    else if (name === "contrast")   { adjustments.contrast   = parseFloat(value) / 100; }
    else if (name === "saturate")   { adjustments.saturation = parseFloat(value) / 100; }
    else if (name === "sepia")      { adjustments.sepia      = parseFloat(value) / 100; }
    else if (name === "grayscale")  { adjustments.grayscale  = parseFloat(value) / 100; }
    else if (name === "hue-rotate") { adjustments.hueRotate  = parseFloat(value) * (Math.PI / 180); }
    else if (name === "invert")     { adjustments.invert     = parseFloat(value) / 100; }
  }

  return adjustments;
};
