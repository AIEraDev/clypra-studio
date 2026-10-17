import type { TextAnimationPreset } from "../../../types/animation";

export const STARTER_ANIMATION_PRESETS: TextAnimationPreset[] = [
  // ── IN PRESETS ────────────────────────────────────────────────────────────
  {
    id: "anim-in-typewriter",
    name: "Typewriter",
    phase: "in",
    category: "Basic",
    tags: ["typewriter", "terminal", "typing", "text"],
    defaultDuration: 0.6,
    minDuration: 0.1,
    maxDuration: 4.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    stagger: {
      unit: "character",
      overlap: 0.1,
      order: "left-to-right",
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.1, value: 1 },
          { progress: 1.0, value: 1 },
        ],
      },
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 0.95 },
          { progress: 0.3, value: 1.05, easing: "easeOutBack" },
          { progress: 1.0, value: 1.0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-slide-up",
    name: "Slide Up",
    phase: "in",
    category: "Motion",
    tags: ["slide", "up", "motion", "smooth"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.8, value: 1, easing: "easeOutQuad" },
          { progress: 1.0, value: 1 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 60, easing: "easeOutCubic" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-zoom-in",
    name: "Zoom In",
    phase: "in",
    category: "Motion",
    tags: ["zoom", "pop", "bounce", "scale"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.5, value: 1 },
          { progress: 1.0, value: 1 },
        ],
      },
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 0.3, easing: "easeOutBack" },
          { progress: 1.0, value: 1.0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-flip-in",
    name: "Flip In",
    phase: "in",
    category: "3D",
    tags: ["flip", "3d", "rotate", "perspective"],
    defaultDuration: 0.6,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    stagger: {
      unit: "character",
      overlap: 0.4,
      order: "left-to-right",
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.6, value: 1 },
          { progress: 1.0, value: 1 },
        ],
      },
      {
        property: "rotation",
        keyframes: [
          { progress: 0.0, value: -90, easing: "easeOutQuad" },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: -30, easing: "easeOutBack" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-wave-in",
    name: "Wave In",
    phase: "in",
    category: "Motion",
    tags: ["wave", "bounce", "stagger"],
    defaultDuration: 0.7,
    minDuration: 0.2,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    stagger: {
      unit: "character",
      overlap: 0.6,
      order: "left-to-right",
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.5, value: 1 },
          { progress: 1.0, value: 1 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 50, easing: "easeOutBounce" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-glitch-in",
    name: "Glitch In",
    phase: "in",
    category: "Glitch",
    tags: ["glitch", "cyber", "jitter", "vfx"],
    isPro: true,
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 2.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    procedural: {
      type: "glitch",
      intensity: 0.8,
      frequency: 24,
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.2, value: 0.7 },
          { progress: 0.4, value: 0.2 },
          { progress: 0.6, value: 1.0 },
          { progress: 1.0, value: 1.0 },
        ],
      },
      {
        property: "translateX",
        keyframes: [
          { progress: 0.0, value: -25 },
          { progress: 0.3, value: 18 },
          { progress: 0.6, value: -6 },
          { progress: 0.8, value: 3 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "skewX",
        keyframes: [
          { progress: 0.0, value: 20 },
          { progress: 0.4, value: -15 },
          { progress: 0.7, value: 5 },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-arc-fade",
    name: "Arc Fade",
    phase: "in",
    category: "Basic",
    tags: ["arc", "fade", "blur", "cinematic"],
    defaultDuration: 0.6,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 1, easing: "easeOutQuad" },
        ],
      },
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 1.35, easing: "easeOutCubic" },
          { progress: 1.0, value: 1.0 },
        ],
      },
      {
        property: "blur",
        keyframes: [
          { progress: 0.0, value: 16, easing: "easeOutQuad" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-in-fade",
    name: "Fade In",
    phase: "in",
    category: "Basic",
    tags: ["fade", "simple", "clean"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 1, easing: "easeOut" },
        ],
      },
    ],
  },

  // ── OUT PRESETS ───────────────────────────────────────────────────────────
  {
    id: "anim-out-fade",
    name: "Fade Out",
    phase: "out",
    category: "Basic",
    tags: ["fade", "out", "simple"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 1.0, value: 0, easing: "easeIn" },
        ],
      },
    ],
  },
  {
    id: "anim-out-slide-down",
    name: "Slide Down",
    phase: "out",
    category: "Motion",
    tags: ["slide", "down", "exit"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 0.7, value: 0.4 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 60, easing: "easeInCubic" },
        ],
      },
    ],
  },
  {
    id: "anim-out-zoom-out",
    name: "Zoom Out",
    phase: "out",
    category: "Motion",
    tags: ["zoom", "out", "scale"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 0.8, value: 0.2 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 1.0 },
          { progress: 1.0, value: 0.2, easing: "easeInBack" },
        ],
      },
    ],
  },
  {
    id: "anim-out-flip-out",
    name: "Flip Out",
    phase: "out",
    category: "3D",
    tags: ["flip", "out", "3d"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    stagger: {
      unit: "character",
      overlap: 0.4,
      order: "left-to-right",
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 0.7, value: 0.3 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "rotation",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 90, easing: "easeInQuad" },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 30, easing: "easeInBack" },
        ],
      },
    ],
  },
  {
    id: "anim-out-8bit-melt",
    name: "8bit Melt-Out",
    phase: "out",
    category: "Glitch",
    tags: ["melt", "8bit", "retro", "pixel"],
    isPro: true,
    defaultDuration: 0.6,
    minDuration: 0.1,
    maxDuration: 2.5,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    procedural: {
      type: "melt",
      intensity: 0.9,
    },
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 0.6, value: 0.7 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 45, easing: "easeInCubic" },
        ],
      },
      {
        property: "scaleY",
        keyframes: [
          { progress: 0.0, value: 1.0 },
          { progress: 1.0, value: 0.1, easing: "easeInQuad" },
        ],
      },
    ],
  },
  {
    id: "anim-out-blur-dissolve",
    name: "Blur Dissolve",
    phase: "out",
    category: "Basic",
    tags: ["blur", "dissolve", "cinematic"],
    defaultDuration: 0.5,
    minDuration: 0.1,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1 },
          { progress: 1.0, value: 0, easing: "easeInQuad" },
        ],
      },
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 1.0 },
          { progress: 1.0, value: 1.25, easing: "easeInQuad" },
        ],
      },
      {
        property: "blur",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 1.0, value: 20, easing: "easeInQuad" },
        ],
      },
    ],
  },

  // ── LOOP PRESETS ──────────────────────────────────────────────────────────
  {
    id: "anim-loop-pulse",
    name: "Pulse",
    phase: "loop",
    category: "Basic",
    tags: ["pulse", "scale", "breathe", "loop"],
    defaultDuration: 1.2,
    minDuration: 0.3,
    maxDuration: 4.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 1.0, easing: "easeInOut" },
          { progress: 0.5, value: 1.12, easing: "easeInOut" },
          { progress: 1.0, value: 1.0 },
        ],
      },
    ],
  },
  {
    id: "anim-loop-wave",
    name: "Wave",
    phase: "loop",
    category: "Motion",
    tags: ["wave", "sine", "ambient"],
    defaultDuration: 1.4,
    minDuration: 0.4,
    maxDuration: 4.0,
    previewLoopDuration: 1.4,
    thumbnailUrl: "",
    version: 1,
    stagger: {
      unit: "character",
      overlap: 0.75,
      order: "left-to-right",
    },
    tracks: [
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0, easing: "easeInOut" },
          { progress: 0.5, value: -16, easing: "easeInOut" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-loop-beating",
    name: "Beating",
    phase: "loop",
    category: "Motion",
    tags: ["beating", "heartbeat", "rhythm"],
    defaultDuration: 1.0,
    minDuration: 0.3,
    maxDuration: 3.0,
    previewLoopDuration: 1.0,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "scale",
        keyframes: [
          { progress: 0.0, value: 1.0 },
          { progress: 0.15, value: 1.18, easing: "easeOutBack" },
          { progress: 0.3, value: 0.96, easing: "easeInOut" },
          { progress: 0.45, value: 1.1, easing: "easeOut" },
          { progress: 0.7, value: 1.0 },
          { progress: 1.0, value: 1.0 },
        ],
      },
    ],
  },
  {
    id: "anim-loop-float",
    name: "Float",
    phase: "loop",
    category: "Motion",
    tags: ["float", "hover", "levitate"],
    defaultDuration: 2.0,
    minDuration: 0.5,
    maxDuration: 5.0,
    previewLoopDuration: 2.0,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0, easing: "easeInOut" },
          { progress: 0.5, value: -12, easing: "easeInOut" },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "rotation",
        keyframes: [
          { progress: 0.0, value: 0, easing: "easeInOut" },
          { progress: 0.25, value: 2.5, easing: "easeInOut" },
          { progress: 0.75, value: -2.5, easing: "easeInOut" },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-loop-shiver",
    name: "Shiver",
    phase: "loop",
    category: "Glitch",
    tags: ["shiver", "jitter", "shake", "anxious"],
    isPro: true,
    defaultDuration: 0.8,
    minDuration: 0.2,
    maxDuration: 2.0,
    previewLoopDuration: 0.8,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "translateX",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.1, value: -3 },
          { progress: 0.2, value: 3 },
          { progress: 0.3, value: -2 },
          { progress: 0.4, value: 4 },
          { progress: 0.5, value: -4 },
          { progress: 0.6, value: 2 },
          { progress: 0.7, value: -3 },
          { progress: 0.8, value: 3 },
          { progress: 0.9, value: -1 },
          { progress: 1.0, value: 0 },
        ],
      },
      {
        property: "translateY",
        keyframes: [
          { progress: 0.0, value: 0 },
          { progress: 0.2, value: 2 },
          { progress: 0.4, value: -2 },
          { progress: 0.6, value: 1 },
          { progress: 0.8, value: -1 },
          { progress: 1.0, value: 0 },
        ],
      },
    ],
  },
  {
    id: "anim-loop-neon-blink",
    name: "Neon Blink",
    phase: "loop",
    category: "Glitch",
    tags: ["neon", "flicker", "blink", "light"],
    defaultDuration: 1.2,
    minDuration: 0.3,
    maxDuration: 3.0,
    previewLoopDuration: 1.2,
    thumbnailUrl: "",
    version: 1,
    tracks: [
      {
        property: "opacity",
        keyframes: [
          { progress: 0.0, value: 1.0 },
          { progress: 0.2, value: 0.2 },
          { progress: 0.25, value: 1.0 },
          { progress: 0.4, value: 0.3 },
          { progress: 0.45, value: 1.0 },
          { progress: 0.85, value: 1.0 },
          { progress: 0.9, value: 0.4 },
          { progress: 0.95, value: 1.0 },
          { progress: 1.0, value: 1.0 },
        ],
      },
    ],
  },
];
