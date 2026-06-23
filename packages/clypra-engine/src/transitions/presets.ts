/**
 * Transition Presets
 * Professional transition definitions mapped to TransitionRenderer types
 *
 * Part of @clypra/engine - shared between clypra-studio and clypra app
 */

import type { TransitionPreset, TransitionCategory } from "./types";

export const TRANSITION_CATEGORIES: TransitionCategory[] = ["fade", "slide", "wipe", "zoom", "dissolve", "creative"];

/**
 * Professional Transition Preset Library
 * Maps UI-friendly presets to engine TransitionRenderer types
 */
export const TRANSITION_PRESETS: TransitionPreset[] = [
  // ========== FADE ==========
  {
    id: "simple-fade",
    name: "Simple Fade",
    category: "fade",
    description: "Classic crossfade - smooth opacity transition",
    tags: ["basic", "smooth", "classic"],
    defaultDuration: 1.0,
    renderer: "fade",
    params: {},
  },
  {
    id: "fade-to-black",
    name: "Fade to Black",
    category: "fade",
    description: "Fade out to black, then fade in from black",
    tags: ["dramatic", "black", "film"],
    defaultDuration: 1.5,
    renderer: "fade",
    params: {
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
    renderer: "fade",
    params: {
      color: "#FFFFFF",
    },
  },
  {
    id: "dissolve",
    name: "Dissolve",
    category: "dissolve",
    description: "Smooth crossfade dissolution",
    tags: ["smooth", "classic", "blend"],
    defaultDuration: 1.0,
    renderer: "dissolve",
    params: {},
  },

  // ========== SLIDE ==========
  {
    id: "slide-left",
    name: "Slide Left",
    category: "slide",
    description: "New clip slides in from right to left",
    tags: ["directional", "smooth", "horizontal"],
    defaultDuration: 0.8,
    renderer: "slide_left",
    params: {},
  },
  {
    id: "slide-right",
    name: "Slide Right",
    category: "slide",
    description: "New clip slides in from left to right",
    tags: ["directional", "smooth", "horizontal"],
    defaultDuration: 0.8,
    renderer: "slide_right",
    params: {},
  },
  {
    id: "slide-up",
    name: "Slide Up",
    category: "slide",
    description: "New clip slides in from bottom to top",
    tags: ["directional", "smooth", "vertical"],
    defaultDuration: 0.8,
    renderer: "slide_up",
    params: {},
  },
  {
    id: "slide-down",
    name: "Slide Down",
    category: "slide",
    description: "New clip slides in from top to bottom",
    tags: ["directional", "smooth", "vertical"],
    defaultDuration: 0.8,
    renderer: "slide_down",
    params: {},
  },

  // ========== WIPE ==========
  {
    id: "wipe-left",
    name: "Wipe Left",
    category: "wipe",
    description: "Clean horizontal wipe from left",
    tags: ["directional", "clean", "horizontal"],
    defaultDuration: 0.9,
    renderer: "wipe_left",
    params: {},
  },
  {
    id: "wipe-right",
    name: "Wipe Right",
    category: "wipe",
    description: "Clean horizontal wipe from right",
    tags: ["directional", "clean", "horizontal"],
    defaultDuration: 0.9,
    renderer: "wipe_right",
    params: {},
  },
  {
    id: "wipe-up",
    name: "Wipe Up",
    category: "wipe",
    description: "Clean vertical wipe from bottom",
    tags: ["directional", "clean", "vertical"],
    defaultDuration: 0.9,
    renderer: "wipe_up",
    params: {},
  },
  {
    id: "wipe-down",
    name: "Wipe Down",
    category: "wipe",
    description: "Clean vertical wipe from top",
    tags: ["directional", "clean", "vertical"],
    defaultDuration: 0.9,
    renderer: "wipe_down",
    params: {},
  },
  {
    id: "wipe-clockwise",
    name: "Clock Wipe",
    category: "wipe",
    description: "Rotating clock hand wipe effect",
    tags: ["radial", "rotating", "clock"],
    defaultDuration: 1.2,
    renderer: "wipe_clockwise",
    params: {},
  },
  {
    id: "wipe-center",
    name: "Circle Wipe",
    category: "wipe",
    description: "Circular reveal from center outward",
    tags: ["radial", "reveal", "circular"],
    defaultDuration: 1.0,
    renderer: "wipe_center",
    params: {},
  },

  // ========== ZOOM ==========
  {
    id: "zoom-in",
    name: "Zoom In",
    category: "zoom",
    description: "Outgoing clip zooms in while new clip fades in",
    tags: ["scale", "dramatic", "zoom"],
    defaultDuration: 1.0,
    renderer: "zoom_in",
    params: {
      scale: 1.3,
    },
  },
  {
    id: "zoom-out",
    name: "Zoom Out",
    category: "zoom",
    description: "Outgoing clip zooms out while new clip fades in",
    tags: ["scale", "reveal", "zoom"],
    defaultDuration: 1.0,
    renderer: "zoom_out",
    params: {
      scale: 0.7,
    },
  },
  {
    id: "zoom-blur",
    name: "Zoom with Blur",
    category: "zoom",
    description: "Fast zoom with motion blur for energy",
    tags: ["fast", "blur", "energy"],
    defaultDuration: 0.6,
    renderer: "zoom_blur",
    params: {
      scale: 1.3,
      blurAmount: 12,
    },
  },

  // ========== SHAPE ==========
  {
    id: "circle-expand",
    name: "Circle Expand",
    category: "wipe",
    description: "New clip expands from center in a circle",
    tags: ["radial", "expand", "circle"],
    defaultDuration: 1.0,
    renderer: "circle_expand",
    params: {},
  },
  {
    id: "circle-collapse",
    name: "Circle Collapse",
    category: "wipe",
    description: "Old clip collapses to center in a circle",
    tags: ["radial", "collapse", "circle"],
    defaultDuration: 1.0,
    renderer: "circle_collapse",
    params: {},
  },
  {
    id: "diamond-expand",
    name: "Diamond Expand",
    category: "wipe",
    description: "New clip expands from center in a diamond shape",
    tags: ["geometric", "expand", "diamond"],
    defaultDuration: 1.0,
    renderer: "diamond_expand",
    params: {},
  },
  {
    id: "rectangle-expand",
    name: "Rectangle Expand",
    category: "wipe",
    description: "New clip expands from center in a rectangle",
    tags: ["geometric", "expand", "rectangle"],
    defaultDuration: 1.0,
    renderer: "rectangle_expand",
    params: {},
  },

  // ========== BLUR ==========
  {
    id: "blur-fade",
    name: "Blur Fade",
    category: "creative",
    description: "Dreamy fade with motion blur effect",
    tags: ["blur", "dreamy", "soft"],
    defaultDuration: 1.2,
    renderer: "blur_fade",
    params: {
      blurAmount: 15,
    },
  },
  {
    id: "directional-blur",
    name: "Directional Blur",
    category: "creative",
    description: "Fade with directional motion blur",
    tags: ["blur", "motion", "directional"],
    defaultDuration: 1.0,
    renderer: "directional_blur",
    params: {
      blurAmount: 12,
    },
  },

  // ========== CREATIVE ==========
  {
    id: "glitch",
    name: "Glitch",
    category: "creative",
    description: "Digital glitch transition with artifacts",
    tags: ["glitch", "digital", "distortion"],
    defaultDuration: 0.8,
    renderer: "glitch",
    params: {},
  },
  {
    id: "rgb-split",
    name: "RGB Split",
    category: "creative",
    description: "Chromatic aberration RGB channel split",
    tags: ["chromatic", "rgb", "split"],
    defaultDuration: 0.7,
    renderer: "rgb_split",
    params: {},
  },
  {
    id: "chromatic",
    name: "Chromatic",
    category: "creative",
    description: "Chromatic aberration effect",
    tags: ["chromatic", "aberration", "color"],
    defaultDuration: 0.8,
    renderer: "chromatic",
    params: {},
  },
  {
    id: "film-burn",
    name: "Film Burn",
    category: "creative",
    description: "Vintage film burn effect",
    tags: ["film", "burn", "vintage"],
    defaultDuration: 1.2,
    renderer: "film_burn",
    params: {},
  },
  {
    id: "light-leak",
    name: "Light Leak",
    category: "creative",
    description: "Light leak overlay transition",
    tags: ["light", "leak", "vintage"],
    defaultDuration: 1.0,
    renderer: "light_leak",
    params: {},
  },
  {
    id: "whip-pan",
    name: "Whip Pan",
    category: "creative",
    description: "Fast whip pan with motion blur",
    tags: ["whip", "fast", "blur"],
    defaultDuration: 0.5,
    renderer: "whip_pan",
    params: {},
  },

  // ========== BASIC (for compatibility) ==========
  {
    id: "cut",
    name: "Cut",
    category: "fade",
    description: "Instant cut (no transition)",
    tags: ["instant", "cut", "basic"],
    defaultDuration: 0.0,
    renderer: "cut",
    params: {},
  },
];
