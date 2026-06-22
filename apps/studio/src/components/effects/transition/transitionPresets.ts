/**
 * Transition Presets
 * Professional transition definitions for preview and export
 */

export interface TransitionPreset {
  id: string;
  name: string;
  category: "fade" | "slide" | "wipe" | "zoom" | "dissolve" | "creative";
  description: string;
  tags: string[];
  defaultDuration: number; // seconds
  defaultAlignment: "start" | "center" | "end";
  defaultEasing: "linear" | "easeIn" | "easeOut" | "easeInOut";
  renderer: "canvas";
  type: "fade" | "slide" | "wipe" | "zoom" | "pixelate" | "blur";
  params: Record<string, any>;
}

export const TRANSITION_CATEGORIES = ["fade", "slide", "wipe", "zoom", "dissolve", "creative"] as const;
export type TransitionCategoryType = (typeof TRANSITION_CATEGORIES)[number];

/**
 * Professional Transition Presets
 */
export const PRESET_TRANSITIONS: TransitionPreset[] = [
  // ========== FADE ==========
  {
    id: "simple-fade",
    name: "Simple Fade",
    category: "fade",
    description: "Classic crossfade - smooth opacity transition",
    tags: ["basic", "smooth", "classic"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "linear",
    renderer: "canvas",
    type: "fade",
    params: {
      opacity: true,
    },
  },
  {
    id: "fade-to-black",
    name: "Fade to Black",
    category: "fade",
    description: "Fade out to black, then fade in from black",
    tags: ["dramatic", "black", "film"],
    defaultDuration: 1.5,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "fade",
    params: {
      opacity: true,
      color: "#000000",
    },
  },
  {
    id: "fade-to-white",
    name: "Fade to White",
    category: "fade",
    description: "Bright flash transition through white",
    tags: ["bright", "flash", "clean"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "fade",
    params: {
      opacity: true,
      color: "#FFFFFF",
    },
  },
  {
    id: "cross-dissolve-blur",
    name: "Dissolve with Blur",
    category: "dissolve",
    description: "Smooth dissolve with motion blur effect",
    tags: ["smooth", "blur", "motion"],
    defaultDuration: 1.2,
    defaultAlignment: "center",
    defaultEasing: "easeOut",
    renderer: "canvas",
    type: "blur",
    params: {
      maxBlur: 8,
    },
  },

  // ========== SLIDE ==========
  {
    id: "slide-left",
    name: "Slide Left",
    category: "slide",
    description: "New clip slides in from right to left",
    tags: ["directional", "smooth", "horizontal"],
    defaultDuration: 0.8,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "left",
      push: false,
    },
  },
  {
    id: "slide-right",
    name: "Slide Right",
    category: "slide",
    description: "New clip slides in from left to right",
    tags: ["directional", "smooth", "horizontal"],
    defaultDuration: 0.8,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "right",
      push: false,
    },
  },
  {
    id: "slide-up",
    name: "Slide Up",
    category: "slide",
    description: "New clip slides in from bottom to top",
    tags: ["directional", "smooth", "vertical"],
    defaultDuration: 0.8,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "up",
      push: false,
    },
  },
  {
    id: "slide-down",
    name: "Slide Down",
    category: "slide",
    description: "New clip slides in from top to bottom",
    tags: ["directional", "smooth", "vertical"],
    defaultDuration: 0.8,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "down",
      push: false,
    },
  },
  {
    id: "push-left",
    name: "Push Left",
    category: "slide",
    description: "New clip pushes old clip out to the left",
    tags: ["push", "directional", "horizontal"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "left",
      push: true,
    },
  },
  {
    id: "push-right",
    name: "Push Right",
    category: "slide",
    description: "New clip pushes old clip out to the right",
    tags: ["push", "directional", "horizontal"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "slide",
    params: {
      direction: "right",
      push: true,
    },
  },

  // ========== WIPE ==========
  {
    id: "wipe-horizontal",
    name: "Horizontal Wipe",
    category: "wipe",
    description: "Clean horizontal wipe from left to right",
    tags: ["directional", "clean", "horizontal"],
    defaultDuration: 0.9,
    defaultAlignment: "center",
    defaultEasing: "linear",
    renderer: "canvas",
    type: "wipe",
    params: {
      direction: "horizontal",
      feather: 0,
    },
  },
  {
    id: "wipe-vertical",
    name: "Vertical Wipe",
    category: "wipe",
    description: "Clean vertical wipe from top to bottom",
    tags: ["directional", "clean", "vertical"],
    defaultDuration: 0.9,
    defaultAlignment: "center",
    defaultEasing: "linear",
    renderer: "canvas",
    type: "wipe",
    params: {
      direction: "vertical",
      feather: 0,
    },
  },
  {
    id: "wipe-diagonal",
    name: "Diagonal Wipe",
    category: "wipe",
    description: "Dynamic diagonal wipe across the frame",
    tags: ["directional", "dynamic", "diagonal"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "wipe",
    params: {
      direction: "diagonal",
      feather: 10,
    },
  },
  {
    id: "wipe-circle",
    name: "Circle Wipe",
    category: "wipe",
    description: "Circular reveal from center outward",
    tags: ["radial", "reveal", "circular"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeOut",
    renderer: "canvas",
    type: "wipe",
    params: {
      direction: "circle",
      feather: 5,
    },
  },
  {
    id: "clock-wipe",
    name: "Clock Wipe",
    category: "wipe",
    description: "Rotating clock hand wipe effect",
    tags: ["radial", "rotating", "clock"],
    defaultDuration: 1.2,
    defaultAlignment: "center",
    defaultEasing: "linear",
    renderer: "canvas",
    type: "wipe",
    params: {
      direction: "clock",
      feather: 5,
    },
  },

  // ========== ZOOM ==========
  {
    id: "zoom-in",
    name: "Zoom In",
    category: "zoom",
    description: "New clip zooms in from small to full size",
    tags: ["scale", "dramatic", "zoom"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeOut",
    renderer: "canvas",
    type: "zoom",
    params: {
      direction: "in",
      scaleFrom: 0.5,
      scaleTo: 1.0,
    },
  },
  {
    id: "zoom-out",
    name: "Zoom Out",
    category: "zoom",
    description: "Old clip zooms out, revealing new clip",
    tags: ["scale", "reveal", "zoom"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeIn",
    renderer: "canvas",
    type: "zoom",
    params: {
      direction: "out",
      scaleFrom: 1.0,
      scaleTo: 1.5,
    },
  },
  {
    id: "zoom-blur",
    name: "Zoom with Blur",
    category: "zoom",
    description: "Fast zoom with motion blur for energy",
    tags: ["fast", "blur", "energy"],
    defaultDuration: 0.6,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "zoom",
    params: {
      direction: "in",
      scaleFrom: 0.3,
      scaleTo: 1.0,
      blur: 12,
    },
  },

  // ========== CREATIVE ==========
  {
    id: "pixelate-dissolve",
    name: "Pixelate Dissolve",
    category: "creative",
    description: "Pixel grid dissolution effect",
    tags: ["digital", "pixelate", "glitch"],
    defaultDuration: 1.0,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "pixelate",
    params: {
      maxPixelSize: 16,
    },
  },
  {
    id: "blur-dissolve",
    name: "Blur Dissolve",
    category: "creative",
    description: "Dreamy blur transition with soft edges",
    tags: ["blur", "dreamy", "soft"],
    defaultDuration: 1.5,
    defaultAlignment: "center",
    defaultEasing: "easeInOut",
    renderer: "canvas",
    type: "blur",
    params: {
      maxBlur: 15,
    },
  },
];

/**
 * Get transitions by category
 */
export function getTransitionsByCategory(category: TransitionCategoryType): TransitionPreset[] {
  return PRESET_TRANSITIONS.filter((t) => t.category === category);
}

/**
 * Search transitions by query
 */
export function searchTransitions(query: string): TransitionPreset[] {
  const lowerQuery = query.toLowerCase();
  return PRESET_TRANSITIONS.filter((t) => t.name.toLowerCase().includes(lowerQuery) || t.description.toLowerCase().includes(lowerQuery) || t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)));
}
