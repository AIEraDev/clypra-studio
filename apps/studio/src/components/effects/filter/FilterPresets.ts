import { FilterPreset } from "./types";
import { FILTER_CATEGORY_IDS } from "../../../constants/filterCategories";

export const FILTER_CATEGORIES = ["all", ...FILTER_CATEGORY_IDS] as const;

export const PRESET_FILTERS: FilterPreset[] = [
  // Essentials
  { id: "clean-bright", name: "Clean & Bright", category: "essentials", description: "Luminous highlights and crisp clean whites", cssFilter: "brightness(107%) contrast(103%) saturate(106%)", intensity: 90 },
  { id: "matte-contrast", name: "Matte Contrast", category: "essentials", description: "Deep faded matte blacks and clinical details", cssFilter: "contrast(116%) brightness(96%) saturate(94%) sepia(4%)", intensity: 80 },
  { id: "cold-minimalist", name: "Cold Minimalist", category: "essentials", description: "Chilly blue hues and minimal saturation", cssFilter: "hue-rotate(12deg) saturate(78%) contrast(104%) brightness(99%)", intensity: 75 },

  // Cinematic
  { id: "teal-orange", name: "Teal & Orange", category: "cinematic", description: "Hollywood style teal shadows and warm orange midtones", cssFilter: "contrast(115%) saturate(125%) hue-rotate(-5deg) sepia(8%)", intensity: 80 },
  { id: "blockbuster", name: "Blockbuster", category: "cinematic", description: "High-contrast, cold desaturated green/cyan atmosphere", cssFilter: "contrast(122%) saturate(82%) sepia(12%) hue-rotate(-12deg)", intensity: 75 },
  { id: "moody-noir", name: "Moody Film", category: "cinematic", description: "Rich cinematic shadows with faded highlights", cssFilter: "contrast(118%) brightness(88%) saturate(75%) sepia(8%)", intensity: 80 },

  // Vintage
  { id: "polaroid", name: "Polaroid Fade", category: "vintage", description: "Muted retro blacks and warm polaroid paper tone", cssFilter: "contrast(92%) saturate(92%) sepia(22%) brightness(104%) hue-rotate(-3deg)", intensity: 70 },
  { id: "super8", name: "Super 8 Film", category: "vintage", description: "Organic vintage 8mm warmth and high saturation", cssFilter: "sepia(28%) contrast(112%) saturate(110%) brightness(97%)", intensity: 80 },
  { id: "sunset-70s", name: "1970s Sunset", category: "vintage", description: "Sun-drenched golden amber and warm tones", cssFilter: "sepia(35%) hue-rotate(-15deg) saturate(118%) contrast(94%)", intensity: 85 },
  { id: "washed-indie", name: "Washed Indie", category: "vintage", description: "Desaturated, low-contrast washed-out indie look", cssFilter: "contrast(88%) brightness(106%) saturate(72%) sepia(10%)", intensity: 75 },

  // Vibrant
  { id: "golden-hour", name: "Golden Hour", category: "vibrant", description: "Warm sunset hues and soft glowing highlights", cssFilter: "sepia(22%) saturate(120%) brightness(103%) contrast(96%) hue-rotate(-4deg)", intensity: 90 },

  // Mono
  { id: "silver-gelatin", name: "Silver Gelatin", category: "mono", description: "Classic fine-art monochrome with rich midtones", cssFilter: "grayscale(100%) contrast(112%) brightness(98%)", intensity: 100 },
  { id: "high-contrast-mono", name: "Noir Drama", category: "mono", description: "Aggressive contrast, deep blacks, and sharp whites", cssFilter: "grayscale(100%) contrast(142%) brightness(92%)", intensity: 100 },
  { id: "warm-sepia", name: "Sepia Ink", category: "mono", description: "Aesthetic warm sepia paper tint with lower contrast", cssFilter: "grayscale(100%) sepia(68%) contrast(96%) brightness(97%)", intensity: 90 },

  // Aesthetic
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    category: "aesthetic",
    description: "Vibrant neon purples and electric turquoise glow",
    cssFilter: "contrast(125%) saturate(155%) hue-rotate(15deg) brightness(96%)",
    gradingParams: { contrast: 0.25, saturation: 0.55, hueRotate: 0.262, brightness: -0.04 },
    intensity: 85,
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    category: "aesthetic",
    description: "Psychedelic pastel pinks and dreamy violet shadows",
    cssFilter: "hue-rotate(135deg) saturate(135%) contrast(108%) brightness(103%)",
    gradingParams: {
      hueRotate: 2.356, // 135 degrees in radians
      saturation: 0.35,
      contrast: 0.08,
      brightness: 0.03,
      temperature: -0.3, // Cool cyan push
      tint: 0.2, // Magenta/pink tint
    },
    intensity: 85,
  },
  {
    id: "duotone-violet",
    name: "Duotone Purple",
    category: "aesthetic",
    description: "Deep purple shadows and glowing warm highlights",
    cssFilter: "contrast(112%) saturate(125%) sepia(18%) hue-rotate(245deg) brightness(96%)",
    gradingParams: { contrast: 0.12, saturation: 0.25, sepia: 0.18, hueRotate: 4.276, brightness: -0.04 },
    intensity: 90,
  },
  {
    id: "acid-green",
    name: "Acid Glow",
    category: "aesthetic",
    description: "High-saturation radioactive neon look",
    cssFilter: "hue-rotate(55deg) saturate(155%) contrast(122%) brightness(96%)",
    gradingParams: { hueRotate: 0.96, saturation: 0.55, contrast: 0.22, brightness: -0.04 },
    intensity: 80,
  },
];

export const PROMPT_SUGGESTIONS = [
  { label: "Teal & Orange", prompt: "cinematic Hollywood style teal and orange with warm skin tones", category: "cinematic" },
  { label: "1970s Polaroid", prompt: "warm faded 1970s polaroid film with soft contrast and yellow hues", category: "vintage" },
  { label: "Cyberpunk Glow", prompt: "futuristic neon cyberpunk style with deep blue shadows and pink highlights", category: "aesthetic" },
  { label: "Moody Noir", prompt: "highly dramatic high contrast black and white with deep crushed shadows", category: "mono" },
  { label: "Washed Indie", prompt: "retro indie film aesthetic with flat blacks and desaturated soft colors", category: "vintage" },
  { label: "Golden Hour", prompt: "dreamy sunlit golden hour glow with warm amber highlights", category: "vibrant" },
];

export const parseCSSFilter = (filterStr: string) => {
  const adjustments = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sepia: 0.0,
    grayscale: 0.0,
    hueRotate: 0.0,
    invert: 0.0,
  };

  const matches = filterStr.match(/(\w+-?\w+)\(([^)]+)\)/g) || [];
  for (const match of matches) {
    const parts = match.split("(");
    const name = parts[0].trim();
    const value = parts[1].replace(")", "").trim();

    if (name === "brightness") {
      adjustments.brightness = parseFloat(value) / 100;
    } else if (name === "contrast") {
      adjustments.contrast = parseFloat(value) / 100;
    } else if (name === "saturate") {
      adjustments.saturation = parseFloat(value) / 100;
    } else if (name === "sepia") {
      adjustments.sepia = parseFloat(value) / 100;
    } else if (name === "grayscale") {
      adjustments.grayscale = parseFloat(value) / 100;
    } else if (name === "hue-rotate") {
      adjustments.hueRotate = parseFloat(value) * (Math.PI / 180);
    } else if (name === "invert") {
      adjustments.invert = parseFloat(value) / 100;
    }
  }

  return adjustments;
};
