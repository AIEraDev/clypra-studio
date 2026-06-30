/**
 * Body Effects
 *
 * Mask-based effects that consume feature maps from feature providers.
 * These effects demonstrate the extensible feature provider architecture.
 *
 * Phase 5 Week 9 - Body Effects Implementation
 */

export { neonOutlineEffect } from "./neonOutline";
export { backgroundBlurEffect } from "./backgroundBlur";
export { spotlightEffect } from "./spotlight";
export { particleAuraEffect } from "./particleAura";
export { colorIsolationEffect } from "./colorIsolation";

/**
 * Body Effects Collection
 *
 * All effects require a 'mask' feature map from a feature provider.
 * Compatible providers: ChromaKeyProvider, SegmentationProvider, or any
 * custom provider that outputs a mask feature type.
 */
export const bodyEffects = [
  {
    id: "neon-outline",
    name: "Neon Outline",
    description: "Glowing neon outline around the subject",
    requiredFeatures: ["mask"],
    category: "stylize",
  },
  {
    id: "background-blur",
    name: "Background Blur",
    description: "Blur the background while keeping subject sharp",
    requiredFeatures: ["mask"],
    category: "blur",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Dramatic spotlight effect on subject",
    requiredFeatures: ["mask"],
    category: "lighting",
  },
  {
    id: "particle-aura",
    name: "Particle Aura",
    description: "Animated particles around subject edges",
    requiredFeatures: ["mask"],
    category: "stylize",
  },
  {
    id: "color-isolation",
    name: "Color Isolation",
    description: "Keep subject in color, desaturate background",
    requiredFeatures: ["mask"],
    category: "color",
  },
];
