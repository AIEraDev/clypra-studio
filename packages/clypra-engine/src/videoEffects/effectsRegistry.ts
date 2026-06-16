/**
 * Effects Registry
 * Central registry for all available video effects
 */

import type { EffectRenderer as EffectRendererType, EffectParameters } from "./types";

// Import renderer functions
import * as LightEffects from "./renderers/light";

/**
 * Effect metadata for UI and documentation
 */
export interface EffectMetadata {
  id: EffectRendererType;
  name: string;
  category: "camera" | "light" | "blur" | "style" | "distortion" | "time" | "body";
  description: string;
  defaultParams: EffectParameters;
  parameterSchema: {
    [key: string]: {
      type: "number" | "string" | "boolean" | "color";
      label: string;
      min?: number;
      max?: number;
      default: any;
      step?: number;
    };
  };
  tags: string[];
  premium?: boolean;
}

/**
 * Registry of all available effects with their metadata
 */
export const EFFECTS_REGISTRY: Record<string, EffectMetadata> = {
  // ==================== LIGHT EFFECTS ====================
  light_leak: {
    id: "light_leak",
    name: "Light Leak",
    category: "light",
    description: "Classic light leak effect",
    defaultParams: {},
    parameterSchema: {},
    tags: ["light", "vintage", "film"],
  },

  light_leak_2: {
    id: "light_leak_2",
    name: "Leak 2",
    category: "light",
    description: "Animated red/orange light moving across the frame",
    defaultParams: {
      duration: 3,
      size: 0.8,
      color1: "#FF6B35",
      color2: "#FF8C42",
      color3: "#FFA500",
    },
    parameterSchema: {
      duration: {
        type: "number",
        label: "Duration",
        min: 1,
        max: 10,
        default: 3,
        step: 0.5,
      },
      size: {
        type: "number",
        label: "Size",
        min: 0.1,
        max: 1.5,
        default: 0.8,
        step: 0.1,
      },
      color1: {
        type: "color",
        label: "Primary Color",
        default: "#FF6B35",
      },
      color2: {
        type: "color",
        label: "Secondary Color",
        default: "#FF8C42",
      },
      color3: {
        type: "color",
        label: "Tertiary Color",
        default: "#FFA500",
      },
    },
    tags: ["light", "animated", "cinematic", "warm"],
  },

  flash: {
    id: "flash",
    name: "Flash",
    category: "light",
    description: "Bright flash effect",
    defaultParams: { flashColor: "#ffffff", flashIntensity: 1 },
    parameterSchema: {
      flashColor: {
        type: "color",
        label: "Flash Color",
        default: "#ffffff",
      },
      flashIntensity: {
        type: "number",
        label: "Intensity",
        min: 0,
        max: 1,
        default: 1,
        step: 0.1,
      },
    },
    tags: ["light", "bright", "instant"],
  },

  flicker: {
    id: "flicker",
    name: "Flicker",
    category: "light",
    description: "Random light flickering effect",
    defaultParams: {},
    parameterSchema: {},
    tags: ["light", "flicker", "dynamic"],
  },

  vignette: {
    id: "vignette",
    name: "Vignette",
    category: "light",
    description: "Darkens the edges of the frame",
    defaultParams: { radius: 0.7 },
    parameterSchema: {
      radius: {
        type: "number",
        label: "Radius",
        min: 0.1,
        max: 1,
        default: 0.7,
        step: 0.05,
      },
    },
    tags: ["light", "vintage", "cinematic"],
  },

  glow: {
    id: "glow",
    name: "Glow",
    category: "light",
    description: "Adds a glow effect",
    defaultParams: { glowAmount: 10, glowColor: "#ffffff" },
    parameterSchema: {
      glowAmount: {
        type: "number",
        label: "Amount",
        min: 0,
        max: 50,
        default: 10,
        step: 1,
      },
      glowColor: {
        type: "color",
        label: "Color",
        default: "#ffffff",
      },
    },
    tags: ["light", "soft", "dreamy"],
  },
};

/**
 * Get effect metadata by ID
 */
export function getEffectMetadata(id: EffectRendererType): EffectMetadata | undefined {
  return EFFECTS_REGISTRY[id];
}

/**
 * Get all effects by category
 */
export function getEffectsByCategory(category: EffectMetadata["category"]): EffectMetadata[] {
  return Object.values(EFFECTS_REGISTRY).filter((effect) => effect.category === category);
}

/**
 * Get effect renderer function by ID
 */
export function getEffectRenderer(id: EffectRendererType): ((ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number) => void) | null {
  // Map effect IDs to renderer functions
  const renderers: Record<string, any> = {
    // Light
    flash: LightEffects.renderFlash,
    flicker: LightEffects.renderFlicker,
    vignette: LightEffects.renderVignette,
    glow: LightEffects.renderGlow,
    light_leak: LightEffects.renderLightLeak,
    light_leak_2: LightEffects.renderLightLeak2,
  };

  return renderers[id] || null;
}

/**
 * Search effects by name or tag
 */
export function searchEffects(query: string): EffectMetadata[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(EFFECTS_REGISTRY).filter((effect) => effect.name.toLowerCase().includes(lowerQuery) || effect.description.toLowerCase().includes(lowerQuery) || effect.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)));
}
