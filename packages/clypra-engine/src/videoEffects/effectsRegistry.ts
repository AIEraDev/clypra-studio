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
  category: "essentials" | "glitch" | "retro" | "light" | "motion" | "color" | "body" | "cinematic" | "distortion";
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

  fire: {
    id: "fire",
    name: "Fire",
    category: "light",
    description: "Animated fire effect with particles",
    defaultParams: {
      fireHeight: 0.4,
      particleCount: 50,
      fireColor1: "#FF4500",
      fireColor2: "#FFA500",
      fireColor3: "#FFD700",
    },
    parameterSchema: {
      fireHeight: {
        type: "number",
        label: "Fire Height",
        min: 0.1,
        max: 0.8,
        default: 0.4,
        step: 0.05,
      },
      particleCount: {
        type: "number",
        label: "Particle Count",
        min: 10,
        max: 100,
        default: 50,
        step: 5,
      },
      fireColor1: {
        type: "color",
        label: "Base Color",
        default: "#FF4500",
      },
      fireColor2: {
        type: "color",
        label: "Mid Color",
        default: "#FFA500",
      },
      fireColor3: {
        type: "color",
        label: "Top Color",
        default: "#FFD700",
      },
    },
    tags: ["light", "animated", "fire", "particles"],
  },

  particles: {
    id: "particles",
    name: "Particles",
    category: "light",
    description: "Floating particle effect",
    defaultParams: {
      particleCount: 100,
      particleSize: 3,
      particleColor: "#FFFFFF",
      driftSpeed: 1,
      fadeEffect: true,
    },
    parameterSchema: {
      particleCount: {
        type: "number",
        label: "Particle Count",
        min: 20,
        max: 200,
        default: 100,
        step: 10,
      },
      particleSize: {
        type: "number",
        label: "Particle Size",
        min: 1,
        max: 10,
        default: 3,
        step: 0.5,
      },
      particleColor: {
        type: "color",
        label: "Color",
        default: "#FFFFFF",
      },
      driftSpeed: {
        type: "number",
        label: "Drift Speed",
        min: 0.1,
        max: 3,
        default: 1,
        step: 0.1,
      },
      fadeEffect: {
        type: "boolean",
        label: "Fade at Edges",
        default: true,
      },
    },
    tags: ["light", "animated", "particles", "floating"],
  },

  dust_particles: {
    id: "dust_particles",
    name: "Dust Particles",
    category: "light",
    description: "Slow drifting dust particles",
    defaultParams: {
      particleCount: 60,
      particleSize: 2,
      particleColor: "#E0E0E0",
    },
    parameterSchema: {
      particleCount: {
        type: "number",
        label: "Particle Count",
        min: 20,
        max: 150,
        default: 60,
        step: 10,
      },
      particleSize: {
        type: "number",
        label: "Particle Size",
        min: 1,
        max: 5,
        default: 2,
        step: 0.5,
      },
      particleColor: {
        type: "color",
        label: "Color",
        default: "#E0E0E0",
      },
    },
    tags: ["light", "particles", "dust", "subtle"],
  },

  // ==================== BODY EFFECTS ====================
  body_glow: {
    id: "body_glow",
    name: "Body Glow",
    category: "body",
    description: "Adds a soft neon glow around the body silhouette",
    defaultParams: { glowColor: "#7C6FFF", glowRadius: 20, glowIntensity: 0.8 },
    parameterSchema: {
      glowColor: { type: "color", label: "Glow Color", default: "#7C6FFF" },
      glowRadius: { type: "number", label: "Glow Radius", min: 5, max: 50, default: 20, step: 1 },
      glowIntensity: { type: "number", label: "Glow Intensity", min: 0.1, max: 1, default: 0.8, step: 0.05 }
    },
    tags: ["body", "neon", "glow"]
  },
  body_outline: {
    id: "body_outline",
    name: "Body Outline",
    category: "body",
    description: "Traces the outline of the body with a glowing line",
    defaultParams: { outlineColor: "#00E5FF", outlineWidth: 6, feather: 15 },
    parameterSchema: {
      outlineColor: { type: "color", label: "Outline Color", default: "#00E5FF" },
      outlineWidth: { type: "number", label: "Outline Width", min: 2, max: 20, default: 6, step: 1 },
      feather: { type: "number", label: "Feather", min: 0, max: 30, default: 15, step: 1 }
    },
    tags: ["body", "outline", "glowing"]
  },
  body_particles: {
    id: "body_particles",
    name: "Body Particles",
    category: "body",
    description: "Emits floating particles tracing the body shape",
    defaultParams: { particleColor: "#FF2A85", particleCount: 60, particleSize: 3, drift: 8 },
    parameterSchema: {
      particleColor: { type: "color", label: "Particle Color", default: "#FF2A85" },
      particleCount: { type: "number", label: "Particle Count", min: 10, max: 150, default: 60, step: 5 },
      particleSize: { type: "number", label: "Particle Size", min: 1, max: 8, default: 3, step: 0.5 },
      drift: { type: "number", label: "Drift", min: 2, max: 20, default: 8, step: 1 }
    },
    tags: ["body", "particles", "floating"]
  },
  "body-segmentation-glow": {
    id: "body-segmentation-glow",
    name: "Segmentation Glow",
    category: "body",
    description: "Glow overlay matching body segmentation mask",
    defaultParams: { glowColor: "#FFD700", glowRadius: 25 },
    parameterSchema: {
      glowColor: { type: "color", label: "Color", default: "#FFD700" },
      glowRadius: { type: "number", label: "Radius", min: 5, max: 50, default: 25, step: 1 }
    },
    tags: ["body", "segmentation", "glow"]
  },

  // Native video filter effects (unified registry metadata)
  "light-leak": {
    id: "light-leak",
    name: "Light Leak",
    category: "light",
    description: "Classic cinematic light sweep across the frame",
    defaultParams: { gain: 0.6, lacunarity: 2.5, alpha: 0.8, angle: 30, speed: 1.0, animated: true },
    parameterSchema: {
      gain: { type: "number", label: "Gain", min: 0, max: 1, default: 0.6, step: 0.05 },
      lacunarity: { type: "number", label: "Lacunarity", min: 0, max: 5, default: 2.5, step: 0.1 },
      alpha: { type: "number", label: "Alpha", min: 0, max: 1, default: 0.8, step: 0.05 },
      angle: { type: "number", label: "Angle", min: -180, max: 180, default: 30, step: 5 },
      speed: { type: "number", label: "Speed", min: 0, max: 5, default: 1.0, step: 0.1 }
    },
    tags: ["light", "vintage", "film"]
  },
  "lens-flare": {
    id: "lens-flare",
    name: "Lens Flare",
    category: "light",
    description: "Double-stage lens flare: Godray filter coupled with an animated GPU starburst shader.",
    defaultParams: { godrayGain: 0.4, godrayAlpha: 0.5, flareIntensity: 0.8, flareColor: "#7C6FFF", speed: 1.0, animated: true },
    parameterSchema: {
      godrayGain: { type: "number", label: "Rays Gain", min: 0, max: 1, default: 0.4, step: 0.05 },
      godrayAlpha: { type: "number", label: "Rays Alpha", min: 0, max: 1, default: 0.5, step: 0.05 },
      flareIntensity: { type: "number", label: "Intensity", min: 0, max: 3, default: 0.8, step: 0.05 },
      flareColor: { type: "color", label: "Color", default: "#7C6FFF" },
      speed: { type: "number", label: "Speed", min: 0, max: 4, default: 1.0, step: 0.1 }
    },
    tags: ["light", "flare", "cinematic"]
  },
  "rgb-split": {
    id: "rgb-split",
    name: "RGB Split",
    category: "glitch",
    description: "Split red, green, and blue channels",
    defaultParams: { redX: 4, redY: 0, blueX: -4, blueY: 0, greenX: 0, greenY: 0, speed: 1.5, animated: true },
    parameterSchema: {
      redX: { type: "number", label: "Red X", min: -50, max: 50, default: 4, step: 0.5 },
      redY: { type: "number", label: "Red Y", min: -50, max: 50, default: 0, step: 0.5 },
      blueX: { type: "number", label: "Blue X", min: -50, max: 50, default: -4, step: 0.5 },
      blueY: { type: "number", label: "Blue Y", min: -50, max: 50, default: 0, step: 0.5 },
      greenX: { type: "number", label: "Green X", min: -50, max: 50, default: 0, step: 0.5 },
      greenY: { type: "number", label: "Green Y", min: -50, max: 50, default: 0, step: 0.5 },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.5, step: 0.1 }
    },
    tags: ["glitch", "rgb", "chromatic"]
  },
  "vhs": {
    id: "vhs",
    name: "VHS",
    category: "glitch",
    description: "Vintage tape tracking lines and phosphor noise",
    defaultParams: { noise: 0.08, scanlines: true, lineAlpha: 0.25, hShift: 0.003, bandSpeed: 1.2, bandAlpha: 0.35 },
    parameterSchema: {
      noise: { type: "number", label: "Noise", min: 0, max: 0.3, default: 0.08, step: 0.01 },
      scanlines: { type: "boolean", label: "Scanlines", default: true },
      lineAlpha: { type: "number", label: "Line Alpha", min: 0, max: 1, default: 0.25, step: 0.05 },
      hShift: { type: "number", label: "H-Shift", min: 0, max: 0.02, default: 0.003, step: 0.001 },
      bandSpeed: { type: "number", label: "Band Speed", min: 0.1, max: 5, default: 1.2, step: 0.1 },
      bandAlpha: { type: "number", label: "Band Alpha", min: 0, max: 1, default: 0.35, step: 0.05 }
    },
    tags: ["glitch", "retro", "vhs", "tape"]
  },
  "glitch-band": {
    id: "glitch-band",
    name: "Glitch Band",
    category: "glitch",
    description: "Digital glitch slices running dynamically",
    defaultParams: { slices: 15, offset: 80, direction: 0, redX: -3, redY: 0, blueX: 3, blueY: 0, animated: true },
    parameterSchema: {
      slices: { type: "number", label: "Slices", min: 2, max: 80, default: 15, step: 1 },
      offset: { type: "number", label: "Offset", min: 0, max: 400, default: 80, step: 5 },
      direction: { type: "number", label: "Direction", min: 0, max: 360, default: 0, step: 5 },
      redX: { type: "number", label: "Red X", min: -20, max: 20, default: -3, step: 1 },
      redY: { type: "number", label: "Red Y", min: -20, max: 20, default: 0, step: 1 },
      blueX: { type: "number", label: "Blue X", min: -20, max: 20, default: 3, step: 1 },
      blueY: { type: "number", label: "Blue Y", min: -20, max: 20, default: 0, step: 1 }
    },
    tags: ["glitch", "digital", "distortion"]
  },
  "crt": {
    id: "crt",
    name: "CRT Monitor",
    category: "glitch",
    description: "Old television curve display and phosphor noise",
    defaultParams: { curvature: 1.0, lineWidth: 1.0, lineContrast: 0.25, noise: 0.15, vignetting: 0.3, flicker: 0.15, animated: true },
    parameterSchema: {
      curvature: { type: "number", label: "Curvature", min: 0, max: 6, default: 1.0, step: 0.1 },
      lineWidth: { type: "number", label: "Line Width", min: 0, max: 5, default: 1.0, step: 0.5 },
      lineContrast: { type: "number", label: "Line Contrast", min: 0, max: 1, default: 0.25, step: 0.05 },
      noise: { type: "number", label: "Noise", min: 0, max: 0.8, default: 0.15, step: 0.05 },
      vignetting: { type: "number", label: "Vignette Size", min: 0, max: 0.8, default: 0.3, step: 0.05 },
      flicker: { type: "number", label: "Flicker", min: 0, max: 0.5, default: 0.15, step: 0.05 }
    },
    tags: ["glitch", "retro", "tv"]
  },
  "film-grain": {
    id: "film-grain",
    name: "Film Grain",
    category: "cinematic",
    description: "Real organic analog movie grain",
    defaultParams: { intensity: 0.25, size: 2.0, animated: true },
    parameterSchema: {
      intensity: { type: "number", label: "Intensity", min: 0, max: 1, default: 0.25, step: 0.05 },
      size: { type: "number", label: "Grain Size", min: 0.5, max: 6, default: 2.0, step: 0.1 }
    },
    tags: ["cinematic", "film", "grain"]
  },
  "tilt-shift": {
    id: "tilt-shift",
    name: "Tilt Shift",
    category: "cinematic",
    description: "Miniature belt blur focus effect",
    defaultParams: { blur: 40, gradientBlur: 300, focusY: 0.5, focusRange: 0.15 },
    parameterSchema: {
      blur: { type: "number", label: "Edge Blur", min: 0, max: 100, default: 40, step: 1 },
      gradientBlur: { type: "number", label: "Gradient Blur", min: 50, max: 800, default: 300, step: 10 },
      focusY: { type: "number", label: "Focus Position", min: 0, max: 1, default: 0.5, step: 0.05 },
      focusRange: { type: "number", label: "Focus Range", min: 0.05, max: 0.4, default: 0.15, step: 0.05 }
    },
    tags: ["cinematic", "blur", "miniature"]
  },
  "cinematic-lut": {
    id: "cinematic-lut",
    name: "Cinematic LUT",
    category: "cinematic",
    description: "Orange and Teal cinematic lookup table filter",
    defaultParams: { lutIntensity: 0.8, brightness: 1.0, contrast: 1.0, saturation: 1.0 },
    parameterSchema: {
      lutIntensity: { type: "number", label: "LUT Intensity", min: 0, max: 1, default: 0.8, step: 0.05 },
      brightness: { type: "number", label: "Brightness", min: 0.5, max: 1.5, default: 1.0, step: 0.05 },
      contrast: { type: "number", label: "Contrast", min: 0.5, max: 1.5, default: 1.0, step: 0.05 },
      saturation: { type: "number", label: "Saturation", min: 0, max: 2, default: 1.0, step: 0.05 }
    },
    tags: ["cinematic", "color", "lut"]
  },
  "motion-blur": {
    id: "motion-blur",
    name: "Motion Blur",
    category: "cinematic",
    description: "Speed-based directional camera blur",
    defaultParams: { velocityX: 20, velocityY: 0, kernelSize: 9, offset: 0 },
    parameterSchema: {
      velocityX: { type: "number", label: "Velocity X", min: -80, max: 80, default: 20, step: 1 },
      velocityY: { type: "number", label: "Velocity Y", min: -80, max: 80, default: 0, step: 1 },
      kernelSize: { type: "number", label: "Kernel Size", min: 5, max: 25, default: 9, step: 2 },
      offset: { type: "number", label: "Offset", min: 0, max: 10, default: 0, step: 1 }
    },
    tags: ["cinematic", "blur", "motion"]
  },
  "shockwave": {
    id: "shockwave",
    name: "Shockwave",
    category: "distortion",
    description: "Expanding shockwave wave refraction",
    defaultParams: { centerX: 0.5, centerY: 0.5, speed: 1.5, amplitude: 30, wavelength: 160, brightness: 1.0, radius: 600, animated: true },
    parameterSchema: {
      centerX: { type: "number", label: "Center X", min: 0, max: 1, default: 0.5, step: 0.05 },
      centerY: { type: "number", label: "Center Y", min: 0, max: 1, default: 0.5, step: 0.05 },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.5, step: 0.1 },
      amplitude: { type: "number", label: "Amplitude", min: 1, max: 100, default: 30, step: 1 },
      wavelength: { type: "number", label: "Wavelength", min: 10, max: 300, default: 160, step: 5 },
      brightness: { type: "number", label: "Brightness", min: 0.5, max: 2, default: 1.0, step: 0.05 },
      radius: { type: "number", label: "Max Radius", min: 100, max: 1000, default: 600, step: 10 }
    },
    tags: ["distortion", "ripple", "shockwave"]
  },
  "bulge-pinch": {
    id: "bulge-pinch",
    name: "Bulge Pinch",
    category: "distortion",
    description: "Spherical bulge or pinch warp",
    defaultParams: { centerX: 0.5, centerY: 0.5, radius: 200, strength: 0.5, speed: 1.5, animated: true },
    parameterSchema: {
      centerX: { type: "number", label: "Center X", min: 0, max: 1, default: 0.5, step: 0.05 },
      centerY: { type: "number", label: "Center Y", min: 0, max: 1, default: 0.5, step: 0.05 },
      radius: { type: "number", label: "Warp Radius", min: 10, max: 600, default: 200, step: 10 },
      strength: { type: "number", label: "Warp Strength", min: -1.0, max: 1.0, default: 0.5, step: 0.05 },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.5, step: 0.1 }
    },
    tags: ["distortion", "bulge", "pinch"]
  },
  "twist": {
    id: "twist",
    name: "Twist Twirl",
    category: "distortion",
    description: "Warp frame in a spiral twirl",
    defaultParams: { centerX: 0.5, centerY: 0.5, radius: 300, angle: 4.0, speed: 1.0, animated: true },
    parameterSchema: {
      centerX: { type: "number", label: "Center X", min: 0, max: 1, default: 0.5, step: 0.05 },
      centerY: { type: "number", label: "Center Y", min: 0, max: 1, default: 0.5, step: 0.05 },
      radius: { type: "number", label: "Twirl Radius", min: 50, max: 800, default: 300, step: 10 },
      angle: { type: "number", label: "Angle", min: -15, max: 15, default: 4.0, step: 0.5 },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.0, step: 0.1 }
    },
    tags: ["distortion", "twist", "twirl"]
  },
  "reflection": {
    id: "reflection",
    name: "Reflection",
    category: "distortion",
    description: "Water mirror ripple reflection",
    defaultParams: { boundary: 0.5, amplitudeStart: 0, amplitudeEnd: 20, wavelengthStart: 30, wavelengthEnd: 100, alphaStart: 1.0, alphaEnd: 1.0, speed: 1.0, mirror: true, animated: true },
    parameterSchema: {
      boundary: { type: "number", label: "Boundary", min: 0.1, max: 0.9, default: 0.5, step: 0.05 },
      amplitudeStart: { type: "number", label: "Amp Start", min: 0, max: 50, default: 0, step: 1 },
      amplitudeEnd: { type: "number", label: "Amp End", min: 0, max: 100, default: 20, step: 1 },
      wavelengthStart: { type: "number", label: "Wavelength Start", min: 10, max: 100, default: 30, step: 5 },
      wavelengthEnd: { type: "number", label: "Wavelength End", min: 10, max: 300, default: 100, step: 5 },
      alphaStart: { type: "number", label: "Alpha Start", min: 0, max: 1, default: 1.0, step: 0.05 },
      alphaEnd: { type: "number", label: "Alpha End", min: 0, max: 1, default: 1.0, step: 0.05 },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.0, step: 0.1 }
    },
    tags: ["distortion", "reflection", "water"]
  },
  "color-gradient": {
    id: "color-gradient",
    name: "Color Gradient",
    category: "light",
    description: "Overlay a linear or radial multi-stop color gradient.",
    defaultParams: { gradientType: 0, color1: "#7C6FFF", color2: "#0E0E12", alpha: 0.5 },
    parameterSchema: {
      gradientType: { type: "number", label: "Type (0:Lin, 1:Rad)", min: 0, max: 1, default: 0, step: 1 },
      color1: { type: "color", label: "Start Color", default: "#7C6FFF" },
      color2: { type: "color", label: "End Color", default: "#0E0E12" },
      alpha: { type: "number", label: "Alpha", min: 0, max: 1, default: 0.5, step: 0.05 }
    },
    tags: ["light", "color", "gradient"]
  },
  "color-overlay": {
    id: "color-overlay",
    name: "Color Overlay",
    category: "light",
    description: "Overlay a solid tint color onto the frame.",
    defaultParams: { color: "#7C6FFF", alpha: 0.3 },
    parameterSchema: {
      color: { type: "color", label: "Color", default: "#7C6FFF" },
      alpha: { type: "number", label: "Opacity", min: 0, max: 1, default: 0.3, step: 0.05 }
    },
    tags: ["light", "color", "overlay"]
  },
  "color-adjustments": {
    id: "color-adjustments",
    name: "Color Adjustments",
    category: "light",
    description: "Adjust exposure, brightness, contrast, saturation, temperature, tint, sepia, grayscale, hue, invert, and vignette.",
    defaultParams: {
      exposure: 0.0,
      brightness: 0.0,
      contrast: 0.0,
      saturation: 0.0,
      temperature: 0.0,
      tint: 0.0,
      sepia: 0.0,
      grayscale: 0.0,
      hueRotate: 0.0,
      vignette: 0.0,
      invert: 0.0,
      blur: 0.0
    },
    parameterSchema: {
      exposure: { type: "number", label: "Exposure", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      brightness: { type: "number", label: "Brightness", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      contrast: { type: "number", label: "Contrast", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      saturation: { type: "number", label: "Saturation", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      temperature: { type: "number", label: "Temperature", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      tint: { type: "number", label: "Tint", min: -1.0, max: 1.0, default: 0.0, step: 0.01 },
      sepia: { type: "number", label: "Sepia", min: 0.0, max: 1.0, default: 0.0, step: 0.01 },
      grayscale: { type: "number", label: "Grayscale", min: 0.0, max: 1.0, default: 0.0, step: 0.01 },
      hueRotate: { type: "number", label: "Hue Rotate", min: 0.0, max: 6.28318, default: 0.0, step: 0.01 },
      vignette: { type: "number", label: "Vignette", min: 0.0, max: 1.0, default: 0.0, step: 0.01 },
      invert: { type: "number", label: "Invert", min: 0.0, max: 1.0, default: 0.0, step: 0.01 },
      blur: { type: "number", label: "Blur", min: 0.0, max: 15.0, default: 0.0, step: 0.5 }
    },
    tags: ["color", "adjustments", "light", "vignette"]
  },
  "hsl-adjustment": {
    id: "hsl-adjustment",
    name: "HSL Adjustment",
    category: "light",
    description: "Adjust hue, saturation, and lightness of the video.",
    defaultParams: { hue: 0, saturation: 0, lightness: 0, colorize: false, alpha: 1.0 },
    parameterSchema: {
      hue: { type: "number", label: "Hue", min: -180, max: 180, default: 0, step: 1 },
      saturation: { type: "number", label: "Saturation", min: -1.0, max: 1.0, default: 0, step: 0.05 },
      lightness: { type: "number", label: "Lightness", min: -1.0, max: 1.0, default: 0, step: 0.05 },
      colorize: { type: "boolean", label: "Colorize", default: false },
      alpha: { type: "number", label: "Alpha", min: 0, max: 1, default: 1.0, step: 0.05 }
    },
    tags: ["light", "color", "hsl", "hue"]
  },
  "alpha": {
    id: "alpha",
    name: "Opacity (Alpha)",
    category: "light",
    description: "Adjust layer opacity / alpha transparency.",
    defaultParams: { alpha: 1.0 },
    parameterSchema: {
      alpha: { type: "number", label: "Opacity", min: 0, max: 1, default: 1.0, step: 0.05 }
    },
    tags: ["light", "alpha", "opacity"]
  },
  "color-matrix": {
    id: "color-matrix",
    name: "Color Matrix Presets",
    category: "light",
    description: "Color grading adjustments and retro filter presets.",
    defaultParams: { brightness: 1.0, contrast: 1.0, saturation: 1.0, hue: 0, mode: "none" },
    parameterSchema: {
      brightness: { type: "number", label: "Brightness", min: 0, max: 2, default: 1.0, step: 0.05 },
      contrast: { type: "number", label: "Contrast", min: 0, max: 2, default: 1.0, step: 0.05 },
      saturation: { type: "number", label: "Saturation", min: 0, max: 2, default: 1.0, step: 0.05 },
      hue: { type: "number", label: "Hue", min: -180, max: 180, default: 0, step: 2 },
      mode: { type: "string", label: "Preset", default: "none" }
    },
    tags: ["light", "color", "presets", "vintage"]
  },
  "neon-glow": {
    id: "neon-glow",
    name: "Neon Glow (Community)",
    category: "light",
    description: "Wrap your visual features in a premium neon glow outline.",
    defaultParams: { distance: 15, innerStrength: 1.0, outerStrength: 2.0, color: "#7C6FFF", quality: 0.1, knockout: false },
    parameterSchema: {
      distance: { type: "number", label: "Distance", min: 1, max: 100, default: 15, step: 1 },
      innerStrength: { type: "number", label: "Inner Strength", min: 0, max: 10, default: 1.0, step: 0.2 },
      outerStrength: { type: "number", label: "Outer Strength", min: 0, max: 10, default: 2.0, step: 0.2 },
      color: { type: "color", label: "Glow Color", default: "#7C6FFF" },
      quality: { type: "number", label: "Quality", min: 0.01, max: 1.0, default: 0.1, step: 0.05 },
      knockout: { type: "boolean", label: "Knockout", default: false }
    },
    tags: ["light", "glow", "neon", "outline"]
  },
  "gaussian-blur": {
    id: "gaussian-blur",
    name: "Gaussian Blur",
    category: "cinematic",
    description: "Classic high-fidelity Gaussian blur filter.",
    defaultParams: { blur: 8, quality: 4 },
    parameterSchema: {
      blur: { type: "number", label: "Blur Strength", min: 0, max: 100, default: 8, step: 0.5 },
      quality: { type: "number", label: "Quality passes", min: 1, max: 15, default: 4, step: 1 }
    },
    tags: ["cinematic", "blur", "gaussian"]
  },
  "kawase-blur": {
    id: "kawase-blur",
    name: "Kawase Blur",
    category: "cinematic",
    description: "Fast, high-quality multi-pass Kawase blur.",
    defaultParams: { blur: 8, quality: 4 },
    parameterSchema: {
      blur: { type: "number", label: "Blur Radius", min: 0, max: 100, default: 8, step: 0.5 },
      quality: { type: "number", label: "Quality passes", min: 1, max: 15, default: 4, step: 1 }
    },
    tags: ["cinematic", "blur", "kawase"]
  },
  "zoom-blur": {
    id: "zoom-blur",
    name: "Zoom Blur",
    category: "cinematic",
    description: "Radial focal zoom blur emanating from a point.",
    defaultParams: { strength: 0.15, centerX: 0.5, centerY: 0.5, innerRadius: 0, radius: 400 },
    parameterSchema: {
      strength: { type: "number", label: "Blur Strength", min: 0, max: 1, default: 0.15, step: 0.02 },
      centerX: { type: "number", label: "Center X", min: 0, max: 1, default: 0.5, step: 0.05 },
      centerY: { type: "number", label: "Center Y", min: 0, max: 1, default: 0.5, step: 0.05 },
      innerRadius: { type: "number", label: "Inner Rad", min: 0, max: 600, default: 0, step: 10 },
      radius: { type: "number", label: "Outer Rad", min: 50, max: 1200, default: 400, step: 10 }
    },
    tags: ["cinematic", "blur", "zoom", "focus"]
  },
  "radial-blur": {
    id: "radial-blur",
    name: "Radial Blur",
    category: "cinematic",
    description: "Radial spin blur around a focal center point.",
    defaultParams: { angle: 10, centerX: 0.5, centerY: 0.5, kernelSize: 9, radius: -1 },
    parameterSchema: {
      angle: { type: "number", label: "Spin Angle", min: -180, max: 180, default: 10, step: 1 },
      centerX: { type: "number", label: "Center X", min: 0, max: 1, default: 0.5, step: 0.05 },
      centerY: { type: "number", label: "Center Y", min: 0, max: 1, default: 0.5, step: 0.05 },
      kernelSize: { type: "number", label: "Kernel Size", min: 3, max: 25, default: 9, step: 2 },
      radius: { type: "number", label: "Max Radius", min: -1, max: 1200, default: -1, step: 10 }
    },
    tags: ["cinematic", "blur", "radial", "spin"]
  },
  "drop-shadow": {
    id: "drop-shadow",
    name: "Drop Shadow",
    category: "cinematic",
    description: "Apply an adjustable drop shadow overlay onto your layer.",
    defaultParams: { blur: 4, alpha: 0.5, offsetX: 4, offsetY: 4, color: "#000000", shadowOnly: false },
    parameterSchema: {
      blur: { type: "number", label: "Shadow Blur", min: 0, max: 50, default: 4, step: 0.5 },
      alpha: { type: "number", label: "Shadow Alpha", min: 0, max: 1, default: 0.5, step: 0.05 },
      offsetX: { type: "number", label: "Offset X", min: -100, max: 100, default: 4, step: 1 },
      offsetY: { type: "number", label: "Offset Y", min: -100, max: 100, default: 4, step: 1 },
      color: { type: "color", label: "Shadow Color", default: "#000000" },
      shadowOnly: { type: "boolean", label: "Shadow Only", default: false }
    },
    tags: ["cinematic", "shadow", "drop"]
  },
  "static-noise": {
    id: "static-noise",
    name: "Static Noise",
    category: "glitch",
    description: "Classic static analog noise/grain filter.",
    defaultParams: { noise: 0.15, animated: true },
    parameterSchema: {
      noise: { type: "number", label: "Noise Density", min: 0, max: 1, default: 0.15, step: 0.02 },
      animated: { type: "boolean", label: "Animated Seed", default: true }
    },
    tags: ["glitch", "noise", "grain", "static"]
  },
  "old-film": {
    id: "old-film",
    name: "Old Film",
    category: "cinematic",
    description: "Simulates vintage cinema projector noise, sepia tint, vignette, and scratches.",
    defaultParams: { sepia: 0.3, noise: 0.15, noiseSize: 1.0, scratchDensity: 0.3, scratchWidth: 1.0, vignetting: 0.3, vignettingAlpha: 1.0, vignettingBlur: 0.3 },
    parameterSchema: {
      sepia: { type: "number", label: "Sepia", min: 0, max: 1, default: 0.3, step: 0.05 },
      noise: { type: "number", label: "Noise", min: 0, max: 1, default: 0.15, step: 0.05 },
      noiseSize: { type: "number", label: "Noise Size", min: 0.2, max: 5, default: 1.0, step: 0.1 },
      scratchDensity: { type: "number", label: "Scratch Density", min: 0, max: 1, default: 0.3, step: 0.05 },
      scratchWidth: { type: "number", label: "Scratch Width", min: 0.5, max: 6, default: 1.0, step: 0.2 },
      vignetting: { type: "number", label: "Vignette", min: 0, max: 1, default: 0.3, step: 0.05 },
      vignettingAlpha: { type: "number", label: "Vignette Alpha", min: 0, max: 1, default: 1.0, step: 0.05 },
      vignettingBlur: { type: "number", label: "Vignette Blur", min: 0, max: 1, default: 0.3, step: 0.05 }
    },
    tags: ["cinematic", "film", "vintage", "retro", "scratches"]
  },
  "displacement": {
    id: "displacement",
    name: "Displacement Map",
    category: "distortion",
    description: "Warp and distort the frame using a procedural noise displacement sprite.",
    defaultParams: { scaleX: 20, scaleY: 20, animated: true, speed: 1.0 },
    parameterSchema: {
      scaleX: { type: "number", label: "Scale X", min: -200, max: 200, default: 20, step: 1 },
      scaleY: { type: "number", label: "Scale Y", min: -200, max: 200, default: 20, step: 1 },
      animated: { type: "boolean", label: "Flow Motion", default: true },
      speed: { type: "number", label: "Speed", min: 0.1, max: 5, default: 1.0, step: 0.1 }
    },
    tags: ["distortion", "displacement", "warp", "liquid"]
  },
  "outline": {
    id: "outline",
    name: "Outline Overlay",
    category: "distortion",
    description: "Draws a solid colored outline around the non-transparent boundaries.",
    defaultParams: { thickness: 3, color: "#7C6FFF", quality: 0.1, alpha: 1.0 },
    parameterSchema: {
      thickness: { type: "number", label: "Thickness", min: 0, max: 20, default: 3, step: 1 },
      color: { type: "color", label: "Color", default: "#7C6FFF" },
      quality: { type: "number", label: "Quality", min: 0.01, max: 1.0, default: 0.1, step: 0.05 },
      alpha: { type: "number", label: "Alpha", min: 0, max: 1, default: 1.0, step: 0.05 }
    },
    tags: ["distortion", "outline", "stroke", "border"]
  },
  "grayscale": {
    id: "grayscale",
    name: "Grayscale",
    category: "cinematic",
    description: "Converts the layer to monochrome black and white.",
    defaultParams: {},
    parameterSchema: {},
    tags: ["cinematic", "grayscale", "monochrome", "bw"]
  },
  "dot": {
    id: "dot",
    name: "Halftone Dots",
    category: "distortion",
    description: "Halftone dot raster pattern, simulating newspaper or comic book prints.",
    defaultParams: { scale: 1.0, angle: 1.0, grayscale: true },
    parameterSchema: {
      scale: { type: "number", label: "Dot Scale", min: 0.1, max: 10, default: 1.0, step: 0.1 },
      angle: { type: "number", label: "Angle", min: 0, max: 6.28, default: 1.0, step: 0.05 },
      grayscale: { type: "boolean", label: "Grayscale", default: true }
    },
    tags: ["distortion", "dot", "halftone", "comic"]
  },
  "emboss": {
    id: "emboss",
    name: "Emboss Relief",
    category: "distortion",
    description: "Simulates an embossed 3D relief depth on the frame.",
    defaultParams: { strength: 5.0 },
    parameterSchema: {
      strength: { type: "number", label: "Strength", min: 0, max: 20, default: 5.0, step: 0.5 }
    },
    tags: ["distortion", "emboss", "relief"]
  },
  "cross-hatch": {
    id: "cross-hatch",
    name: "Cross Hatch Sketch",
    category: "distortion",
    description: "Simulates a crosshatched pencil sketch on paper.",
    defaultParams: {},
    parameterSchema: {},
    tags: ["distortion", "sketch", "drawing", "hatch"]
  },
  "pixelate": {
    id: "pixelate",
    name: "Pixelate Mosaic",
    category: "distortion",
    description: "Pixelate the video frame into large blocky mosaic cells.",
    defaultParams: { sizeX: 10, sizeY: 10 },
    parameterSchema: {
      sizeX: { type: "number", label: "Cell Width", min: 1, max: 200, default: 10, step: 1 },
      sizeY: { type: "number", label: "Cell Height", min: 1, max: 200, default: 10, step: 1 }
    },
    tags: ["distortion", "pixelate", "mosaic", "8bit"]
  },
  "ascii": {
    id: "ascii",
    name: "ASCII Art",
    category: "distortion",
    description: "Converts the video frame into interactive retro matrix ASCII text characters.",
    defaultParams: { size: 8, replaceColor: false },
    parameterSchema: {
      size: { type: "number", label: "Char Size", min: 2, max: 50, default: 8, step: 1 },
      replaceColor: { type: "boolean", label: "Replace Color", default: false }
    },
    tags: ["distortion", "ascii", "text", "terminal"]
  }
};

// Auxiliary helper to draw body silhouette
function drawBodySilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  // Head
  ctx.ellipse(cx, cy - h * 0.22, w * 0.28, w * 0.28, 0, 0, Math.PI * 2);
  // Neck
  ctx.rect(cx - w * 0.08, cy - h * 0.1, w * 0.16, h * 0.06);
  // Shoulders & Torso
  ctx.moveTo(cx - w * 0.5, cy - h * 0.04);
  ctx.quadraticCurveTo(cx - w * 0.4, cy - h * 0.08, cx, cy - h * 0.08);
  ctx.quadraticCurveTo(cx + w * 0.4, cy - h * 0.08, cx + w * 0.5, cy - h * 0.04);
  ctx.lineTo(cx + w * 0.45, cy + h * 0.4);
  ctx.lineTo(cx - w * 0.45, cy + h * 0.4);
  ctx.closePath();
}

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement | OffscreenCanvas {
  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(imageData.width, imageData.height)
    : document.createElement("canvas");
  
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
  }
  
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function renderBodyGlow(ctx: CanvasRenderingContext2D, params: any, intensity: number, time: number, bodyMask?: ImageData) {
  const canvas = ctx.canvas;
  const glowColor = params.glowColor || "#7C6FFF";
  const glowRadius = (params.glowRadius ?? 20) * intensity * (1 + Math.sin(time * 3) * 0.2);
  const glowIntensity = (params.glowIntensity ?? 0.8) * intensity * 0.18;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = glowColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = glowIntensity;

  if (bodyMask) {
    const maskCanvas = imageDataToCanvas(bodyMask);
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  } else {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.5;
    const w = canvas.width * 0.28;
    const h = canvas.height * 0.52;
    drawBodySilhouette(ctx, cx, cy, w, h);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function renderBodyOutline(ctx: CanvasRenderingContext2D, params: any, intensity: number, time: number, bodyMask?: ImageData) {
  const canvas = ctx.canvas;
  const outlineColor = params.outlineColor || "#00E5FF";
  const pulseWidth = (params.outlineWidth ?? 6) * intensity * (1 + Math.sin(time * 2.5) * 0.15);
  const feather = (params.feather ?? 15) * (1 + Math.sin(time * 2) * 0.15);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(1, intensity);

  if (bodyMask) {
    const maskCanvas = imageDataToCanvas(bodyMask);
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.save();
      maskCtx.globalCompositeOperation = "source-in";
      maskCtx.fillStyle = outlineColor;
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskCtx.restore();
    }
    
    ctx.filter = `blur(${pulseWidth}px)`;
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.drawImage(maskCanvas, -pulseWidth * 0.5, 0, canvas.width, canvas.height);
    ctx.drawImage(maskCanvas, pulseWidth * 0.5, 0, canvas.width, canvas.height);
    ctx.drawImage(maskCanvas, 0, -pulseWidth * 0.5, canvas.width, canvas.height);
    ctx.drawImage(maskCanvas, 0, pulseWidth * 0.5, canvas.width, canvas.height);
  } else {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(1, pulseWidth);
    ctx.shadowColor = outlineColor;
    ctx.shadowBlur = feather;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.5;
    const w = canvas.width * 0.28;
    const h = canvas.height * 0.52;
    drawBodySilhouette(ctx, cx, cy, w, h);
    ctx.stroke();
  }
  ctx.restore();
}

function renderBodyParticles(ctx: CanvasRenderingContext2D, params: any, intensity: number, time: number, bodyMask?: ImageData) {
  const canvas = ctx.canvas;
  const particleColor = params.particleColor || "#FF2A85";
  const count = Math.min(150, (params.particleCount ?? 60) * intensity);
  const size = params.particleSize ?? 3;
  const drift = params.drift ?? 8;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = particleColor;

  if (bodyMask) {
    ctx.globalAlpha = Math.min(0.85, 0.25 + intensity * 0.6);
    const seed = Math.floor(time * 24);
    
    for (let i = 0; i < count; i++) {
      const x = Math.floor(pseudoRandom(seed + i * 37) * canvas.width);
      const y = Math.floor(pseudoRandom(seed + i * 43) * canvas.height);
      const maskIdx = (Math.floor(y * bodyMask.height / canvas.height) * bodyMask.width + Math.floor(x * bodyMask.width / canvas.width)) * 4 + 3;
      if (bodyMask.data[maskIdx] < 64) continue;
      const xDrift = Math.sin((time + i) * 2.1) * drift * intensity;
      const pSize = 1 + pseudoRandom(seed + i * 53) * (size - 1);
      ctx.beginPath();
      ctx.arc(x + xDrift, y - pseudoRandom(seed + i * 59) * 20 * intensity, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.5;
    const w = canvas.width * 0.28;
    const h = canvas.height * 0.52;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.8 + Math.sin(angle * 3) * 0.15;
      const px = cx + Math.cos(angle + time * 0.2) * w * radius;
      const py = cy + Math.sin(angle + time * 0.2) * h * radius;
      
      const dy = -((time * 25 + i * 4) % 35);
      const dx = Math.sin(time * 1.5 + i * 0.6) * drift;
      
      ctx.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(time * 3 + i));
      ctx.beginPath();
      ctx.arc(px + dx, py + dy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function renderBodySegmentationGlow(ctx: CanvasRenderingContext2D, params: any, intensity: number, time: number, bodyMask?: ImageData) {
  const canvas = ctx.canvas;
  const glowColor = params.glowColor || "#FFD700";
  const glowRadius = (params.glowRadius ?? 25) * intensity;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = glowColor;
  ctx.globalAlpha = 0.12 * intensity;

  if (bodyMask) {
    const maskCanvas = imageDataToCanvas(bodyMask);
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  } else {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.5;
    const w = canvas.width * 0.28;
    const h = canvas.height * 0.52;
    drawBodySilhouette(ctx, cx, cy, w, h);
    ctx.fill();
  }
  ctx.restore();
}

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
export function getEffectRenderer(id: EffectRendererType): ((ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number, bodyMask?: ImageData) => void) | null {
  // Map effect IDs to Canvas2D source-preview renderer functions.
  const renderers: Record<string, any> = {
    // Light
    flash: LightEffects.renderFlash,
    flicker: LightEffects.renderFlicker,
    vignette: LightEffects.renderVignette,
    glow: LightEffects.renderGlow,
    light_leak: LightEffects.renderLightLeak,
    light_leak_2: LightEffects.renderLightLeak2,
    fire: LightEffects.renderFire,
    particles: LightEffects.renderParticles,
    dust_particles: LightEffects.renderDustParticles,
    
    // Body
    body_glow: renderBodyGlow,
    body_outline: renderBodyOutline,
    body_particles: renderBodyParticles,
    "body-segmentation-glow": renderBodySegmentationGlow,

    // Normalized aliases retained for existing saved projects.
    "light-leak": LightEffects.renderLightLeak,
    "lens-flare": LightEffects.renderLightLeak2,
    "lens_flare": LightEffects.renderLightLeak2,
    
    "rgb-split": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const shift = Math.floor((Number(params.redX ?? 4)) * intensity);
      if (shift === 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.4 * intensity;
      ctx.drawImage(ctx.canvas, -shift, 0);
      ctx.drawImage(ctx.canvas, shift, 0);
      ctx.restore();
    },
    "rgb_split": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const shift = Math.floor((Number(params.redX ?? 4)) * intensity);
      if (shift === 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.4 * intensity;
      ctx.drawImage(ctx.canvas, -shift, 0);
      ctx.drawImage(ctx.canvas, shift, 0);
      ctx.restore();
    },
    
    "vhs": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.15})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }
      ctx.restore();
    },

    "glitch-band": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const y = Math.floor(Math.random() * height);
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.35})`;
      ctx.fillRect(0, y, width, 8);
      ctx.restore();
    },
    "glitch_band": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const y = Math.floor(Math.random() * height);
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.35})`;
      ctx.fillRect(0, y, width, 8);
      ctx.restore();
    },

    "crt": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.12})`;
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    },

    "film-grain": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      for (let i = 0; i < 120 * intensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const alpha = 0.04 + Math.random() * 0.05;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    },
    "film_grain": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      for (let i = 0; i < 120 * intensity; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const alpha = 0.04 + Math.random() * 0.05;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    },

    "tilt-shift": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor(6 * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },
    "tilt_shift": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor(6 * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },

    "cinematic-lut": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = `rgba(255, 140, 0, ${intensity * 0.18})`; // Orange/Teal warm look color cast
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
    "cinematic_lut": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = `rgba(255, 140, 0, ${intensity * 0.18})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },

    "motion-blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalAlpha = 0.4 * intensity;
      const shiftX = Math.floor((Number(params.velocityX ?? 20)) * intensity * 0.2);
      const shiftY = Math.floor((Number(params.velocityY ?? 0)) * intensity * 0.2);
      ctx.drawImage(ctx.canvas, shiftX, shiftY);
      ctx.restore();
    },
    "motion_blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalAlpha = 0.4 * intensity;
      const shiftX = Math.floor((Number(params.velocityX ?? 20)) * intensity * 0.2);
      const shiftY = Math.floor((Number(params.velocityY ?? 0)) * intensity * 0.2);
      ctx.drawImage(ctx.canvas, shiftX, shiftY);
      ctx.restore();
    },

    "shockwave": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.25})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, (time * 160) % (width / 2 + 50), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },

    "bulge-pinch": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      const scale = 1.0 + (Number(params.strength ?? 0.5)) * intensity * 0.08;
      ctx.scale(scale, scale);
      ctx.drawImage(ctx.canvas, -width / 2, -height / 2);
      ctx.restore();
    },
    "bulge_pinch": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      const scale = 1.0 + (Number(params.strength ?? 0.5)) * intensity * 0.08;
      ctx.scale(scale, scale);
      ctx.drawImage(ctx.canvas, -width / 2, -height / 2);
      ctx.restore();
    },

    "twist": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((Number(params.angle ?? 4)) * intensity * 0.02);
      ctx.drawImage(ctx.canvas, -width / 2, -height / 2);
      ctx.restore();
    },

    "reflection": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const boundaryY = (Number(params.boundary ?? 0.5)) * height;
      ctx.save();
      ctx.translate(0, boundaryY * 2);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.7 * intensity;
      ctx.drawImage(ctx.canvas, 0, boundaryY, width, height - boundaryY, 0, boundaryY, width, height - boundaryY);
      ctx.restore();
    },

    "color-gradient": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      const grad = params.gradientType === 1
        ? ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) / 2)
        : ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, params.color1 as string || "#7C6FFF");
      grad.addColorStop(1, params.color2 as string || "#0E0E12");
      ctx.fillStyle = grad;
      ctx.globalAlpha = (Number(params.alpha ?? 0.5)) * intensity;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
    "color-overlay": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.fillStyle = params.color as string || "#7C6FFF";
      ctx.globalAlpha = (Number(params.alpha ?? 0.3)) * intensity;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
    "color-adjustments": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const f = intensity;

      const exp = Number(params.exposure ?? 0.0) * f;
      const brightnessVal = 1.0 + (Number(params.brightness ?? 0.0)) * f + exp;
      const contrastVal = 1.0 + (Number(params.contrast ?? 0.0)) * f;
      const saturationVal = 1.0 + (Number(params.saturation ?? 0.0)) * f;
      const sepiaVal = (Number(params.sepia ?? 0.0)) * f;
      const grayscaleVal = (Number(params.grayscale ?? 0.0)) * f;
      const hueVal = (Number(params.hueRotate ?? 0.0)) * f;
      const invertVal = (Number(params.invert ?? 0.0)) * f;
      const blurVal = (Number(params.blur ?? 0.0)) * f;

      const filterParts: string[] = [];
      if (brightnessVal !== 1.0) filterParts.push(`brightness(${brightnessVal})`);
      if (contrastVal !== 1.0) filterParts.push(`contrast(${contrastVal})`);
      if (saturationVal !== 1.0) filterParts.push(`saturate(${saturationVal})`);
      if (sepiaVal > 0) filterParts.push(`sepia(${sepiaVal * 100}%)`);
      if (grayscaleVal > 0) filterParts.push(`grayscale(${grayscaleVal * 100}%)`);
      if (hueVal !== 0) filterParts.push(`hue-rotate(${(hueVal * 180) / Math.PI}deg)`);
      if (invertVal > 0) filterParts.push(`invert(${invertVal * 100}%)`);
      if (blurVal > 0) filterParts.push(`blur(${blurVal}px)`);

      if (filterParts.length > 0) {
        ctx.save();
        const temp = document.createElement("canvas");
        temp.width = width;
        temp.height = height;
        const tempCtx = temp.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(ctx.canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          ctx.filter = filterParts.join(" ");
          ctx.drawImage(temp, 0, 0);
          ctx.filter = "none";
        }
        ctx.restore();
      }

      const tempVal = (Number(params.temperature ?? 0.0)) * f;
      if (tempVal !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        if (tempVal > 0) {
          ctx.fillStyle = `rgba(255, 140, 40, ${tempVal})`;
        } else {
          ctx.fillStyle = `rgba(40, 120, 255, ${-tempVal})`;
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      const tintVal = (Number(params.tint ?? 0.0)) * f;
      if (tintVal !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = "soft-light";
        if (tintVal > 0) {
          ctx.fillStyle = `rgba(255, 40, 180, ${tintVal})`;
        } else {
          ctx.fillStyle = `rgba(40, 255, 100, ${-tintVal})`;
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      const vignetteVal = (Number(params.vignette ?? 0.0)) * f;
      if (vignetteVal > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy);
        const gradient = ctx.createRadialGradient(cx, cy, maxRadius * 0.45, cx, cy, maxRadius * 1.0);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(0.5, `rgba(0, 0, 0, ${vignetteVal * 0.15})`);
        gradient.addColorStop(0.8, `rgba(0, 0, 0, ${vignetteVal * 0.55})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteVal * 0.9})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    },
    "hsl-adjustment": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      if (params.colorize) {
        ctx.save();
        ctx.fillStyle = "rgba(124, 111, 255, 0.2)";
        ctx.globalAlpha = (Number(params.alpha ?? 1.0)) * intensity;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
    },
    "alpha": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalAlpha = 1.0 - (1.0 - (Number(params.alpha ?? 1.0))) * intensity;
      ctx.restore();
    },
    "color-matrix": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = `rgba(255, 120, 0, ${0.1 * intensity})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    },
    "neon-glow": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.shadowBlur = (Number(params.distance ?? 15)) * intensity;
      ctx.shadowColor = params.color as string || "#7C6FFF";
      ctx.restore();
    },
    "gaussian-blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor((Number(params.blur ?? 8)) * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },
    "kawase-blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor((Number(params.blur ?? 8)) * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },
    "zoom-blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor(4 * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },
    "radial-blur": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      try {
        (ctx as any).filter = `blur(${Math.max(1, Math.floor(4 * intensity))}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
      } catch {}
      ctx.restore();
    },
    "drop-shadow": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.shadowBlur = (Number(params.blur ?? 4)) * intensity;
      ctx.shadowColor = params.color as string || "#000000";
      ctx.shadowOffsetX = (Number(params.offsetX ?? 4)) * intensity;
      ctx.shadowOffsetY = (Number(params.offsetY ?? 4)) * intensity;
      ctx.restore();
    },
    "static-noise": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      const density = (Number(params.noise ?? 0.15)) * intensity;
      for (let i = 0; i < 200 * density; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.15})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    },
    "old-film": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = `rgba(139, 69, 19, ${(Number(params.sepia ?? 0.3)) * intensity})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < 50 * intensity; i++) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
      }
      ctx.restore();
    },
    "displacement": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      const shiftX = (Number(params.scaleX ?? 20)) * intensity * 0.1;
      const shiftY = (Number(params.scaleY ?? 20)) * intensity * 0.1;
      ctx.drawImage(ctx.canvas, shiftX, shiftY);
      ctx.restore();
    },
    "outline": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.strokeStyle = params.color as string || "#7C6FFF";
      ctx.lineWidth = (Number(params.thickness ?? 3)) * intensity;
      ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    },
    "grayscale": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "luminosity";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    },
    "dot": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      const step = Math.max(4, Math.floor(10 * (Number(params.scale ?? 1.0))));
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5 * intensity, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    },
    "emboss": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      ctx.save();
      ctx.globalAlpha = 0.3 * intensity;
      ctx.drawImage(ctx.canvas, 1, 1);
      ctx.restore();
    },
    "cross-hatch": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      ctx.save();
      ctx.strokeStyle = `rgba(0,0,0,${0.15 * intensity})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
      ctx.restore();
    },
    "pixelate": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const cellW = Math.max(2, Math.floor((Number(params.sizeX ?? 10)) * intensity));
      const cellH = Math.max(2, Math.floor((Number(params.sizeY ?? 10)) * intensity));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = Math.max(4, Math.floor(width / cellW));
      tempCanvas.height = Math.max(4, Math.floor(height / cellH));
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
      ctx.restore();
    },
    "ascii": (ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const size = Math.max(4, Math.floor((Number(params.size ?? 8)) * intensity));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = Math.max(4, Math.floor(width / size));
      tempCanvas.height = Math.max(4, Math.floor(height / size));
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
      ctx.restore();
    }
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
