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
  category: "essentials" | "glitch" | "retro" | "light" | "motion" | "color" | "body";
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
  // Map effect IDs to renderer functions
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
