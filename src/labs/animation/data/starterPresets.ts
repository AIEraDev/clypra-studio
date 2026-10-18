import type { TextAnimationPreset } from "../../../types/animation";

type PresetSeed = Omit<TextAnimationPreset, "thumbnailUrl" | "version">;

const preset = (seed: PresetSeed): TextAnimationPreset => ({
  ...seed,
  thumbnailUrl: "",
  version: 1,
});

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

  // ── CAPCUT-STYLE IN PRESETS ──────────────────────────────────────────────
  preset({
    id: "anim-in-flip-bounce", name: "Flip Bounce", phase: "in", category: "3D",
    tags: ["flip", "bounce", "3d", "spring"], defaultDuration: 0.7, minDuration: 0.15, maxDuration: 3,
    previewLoopDuration: 1.3, stagger: { unit: "character", overlap: 0.64, order: "center-out" },
    tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.22, value: 1 }, { progress: 1, value: 1 }] },
      { property: "rotation", keyframes: [{ progress: 0, value: -110, easing: "easeOutBack" }, { progress: 0.72, value: 10, easing: "easeInOut" }, { progress: 1, value: 0 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 0.48 }, { progress: 0.72, value: 1.12, easing: "easeOutBack" }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-in-halved-text", name: "Halved Text", phase: "in", category: "Motion",
    tags: ["split", "halved", "reveal", "slide"], defaultDuration: 0.62, minDuration: 0.1, maxDuration: 3,
    previewLoopDuration: 1.2, stagger: { unit: "character", overlap: 0.72, order: "center-out" },
    tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.34, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateY", keyframes: [{ progress: 0, value: 34, easing: "easeOutCubic" }, { progress: 0.62, value: -4, easing: "easeOutBack" }, { progress: 1, value: 0 }] },
      { property: "scaleY", keyframes: [{ progress: 0, value: 0.04 }, { progress: 0.6, value: 1.08, easing: "easeOutBack" }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-in-flame-puff", name: "Flame Puff", phase: "in", category: "VFX",
    tags: ["flame", "fire", "puff", "embers"], defaultDuration: 0.72, minDuration: 0.2, maxDuration: 3,
    previewLoopDuration: 1.4, procedural: { type: "flame", intensity: 0.85, frequency: 16 },
    tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.38, value: 1 }, { progress: 1, value: 1 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 1.42, easing: "easeOutCubic" }, { progress: 0.7, value: 0.94, easing: "easeOutBack" }, { progress: 1, value: 1 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 14 }, { progress: 0.7, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-sunset-rush", name: "Sunset Rush", phase: "in", category: "VFX",
    tags: ["sunset", "rush", "warm", "light"], defaultDuration: 0.58, minDuration: 0.12, maxDuration: 3,
    previewLoopDuration: 1.2, procedural: { type: "shine", intensity: 0.8, frequency: 8 },
    tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.28, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: -130, easing: "easeOutCubic" }, { progress: 0.76, value: 7, easing: "easeOutBack" }, { progress: 1, value: 0 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 10 }, { progress: 0.72, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-flying-up", name: "Flying Up", phase: "in", category: "Motion",
    tags: ["flying", "up", "lift", "capcut"], defaultDuration: 0.58, minDuration: 0.1, maxDuration: 3,
    previewLoopDuration: 1.2, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.45, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateY", keyframes: [{ progress: 0, value: 110, easing: "easeOutCubic" }, { progress: 0.82, value: -6, easing: "easeOutBack" }, { progress: 1, value: 0 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 0.72 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-in-glitter-comet", name: "Glitter Comet", phase: "in", category: "VFX",
    tags: ["glitter", "comet", "sparkle", "particles"], defaultDuration: 0.75, minDuration: 0.2, maxDuration: 3,
    previewLoopDuration: 1.4, procedural: { type: "sparkle", intensity: 0.9, frequency: 20 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.42, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: 100, easing: "easeOutCubic" }, { progress: 1, value: 0 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 8 }, { progress: 0.7, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-letter-reveal", name: "Letter Reveal", phase: "in", category: "Basic",
    tags: ["letter", "reveal", "typing", "clean"], defaultDuration: 0.72, minDuration: 0.15, maxDuration: 4,
    previewLoopDuration: 1.3, stagger: { unit: "character", overlap: 0.46, order: "left-to-right" }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.15, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateY", keyframes: [{ progress: 0, value: 18, easing: "easeOutCubic" }, { progress: 1, value: 0 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 5 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-flying-in", name: "Flying In", phase: "in", category: "Motion",
    tags: ["flying", "in", "motion", "dynamic"], defaultDuration: 0.58, minDuration: 0.1, maxDuration: 3,
    previewLoopDuration: 1.2, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.35, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: 150, easing: "easeOutCubic" }, { progress: 0.82, value: -8, easing: "easeOutBack" }, { progress: 1, value: 0 }] },
      { property: "rotation", keyframes: [{ progress: 0, value: 16 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-petal-swish", name: "Petal Swish", phase: "in", category: "VFX",
    tags: ["petal", "swish", "floral", "particles"], defaultDuration: 0.72, minDuration: 0.2, maxDuration: 3,
    previewLoopDuration: 1.4, procedural: { type: "petal", intensity: 0.75, frequency: 14 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.4, value: 1 }, { progress: 1, value: 1 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: -65, easing: "easeOutCubic" }, { progress: 1, value: 0 }] },
      { property: "rotation", keyframes: [{ progress: 0, value: -9 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-center-splash", name: "Center Splash", phase: "in", category: "VFX",
    tags: ["center", "splash", "burst", "particles"], defaultDuration: 0.65, minDuration: 0.15, maxDuration: 3,
    previewLoopDuration: 1.3, procedural: { type: "sparkle", intensity: 0.8, frequency: 18 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.3, value: 1 }, { progress: 1, value: 1 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 0.18, easing: "easeOutBack" }, { progress: 0.68, value: 1.12, easing: "easeOutBack" }, { progress: 1, value: 1 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 12 }, { progress: 0.62, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-in-slanted-open", name: "Slanted Open", phase: "in", category: "Motion",
    tags: ["slanted", "open", "skew", "reveal"], defaultDuration: 0.55, minDuration: 0.1, maxDuration: 3,
    previewLoopDuration: 1.2, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.42, value: 1 }, { progress: 1, value: 1 }] },
      { property: "skewX", keyframes: [{ progress: 0, value: -38, easing: "easeOutCubic" }, { progress: 0.82, value: 3, easing: "easeOutBack" }, { progress: 1, value: 0 }] },
      { property: "scaleX", keyframes: [{ progress: 0, value: 0.1 }, { progress: 1, value: 1 }] },
    ],
  }),

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
  preset({
    id: "anim-out-blur-left", name: "Blur to the Left", phase: "out", category: "Motion",
    tags: ["blur", "left", "exit", "dissolve"], defaultDuration: 0.52, minDuration: 0.1, maxDuration: 3,
    previewLoopDuration: 1.2, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 1 }, { progress: 0.7, value: 0.52 }, { progress: 1, value: 0 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: 0 }, { progress: 1, value: -96, easing: "easeInCubic" }] },
      { property: "blur", keyframes: [{ progress: 0, value: 0 }, { progress: 1, value: 18, easing: "easeInQuad" }] },
    ],
  }),

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
  // ── CAPCUT-STYLE LOOP PRESETS ────────────────────────────────────────────
  preset({
    id: "anim-loop-dot-cursor", name: "Dot Cursor", phase: "loop", category: "Basic",
    tags: ["dot", "cursor", "typing", "minimal"], defaultDuration: 1.05, minDuration: 0.25, maxDuration: 4,
    previewLoopDuration: 1.05, procedural: { type: "cursor", intensity: 0.45, frequency: 6 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.45 }, { progress: 0.12, value: 1 }, { progress: 0.5, value: 1 }, { progress: 0.62, value: 0.45 }, { progress: 1, value: 0.45 }] },
    ],
  }),
  preset({
    id: "anim-loop-pixel-cursor", name: "Pixel Cursor", phase: "loop", category: "Glitch",
    tags: ["pixel", "cursor", "typing", "retro"], defaultDuration: 1.1, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.1, procedural: { type: "cursor", intensity: 0.85, frequency: 7 },
    stagger: { unit: "character", overlap: 0.56, order: "left-to-right" }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.12, value: 1 }, { progress: 0.78, value: 1 }, { progress: 0.86, value: 0 }, { progress: 1, value: 0 }] },
      { property: "tracking", keyframes: [{ progress: 0, value: 8 }, { progress: 0.5, value: 0 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-double-cursor", name: "Double Cursor", phase: "loop", category: "Basic",
    tags: ["double", "cursor", "typing", "reveal"], defaultDuration: 1.35, minDuration: 0.4, maxDuration: 4,
    previewLoopDuration: 1.35, procedural: { type: "cursor", intensity: 0.55, frequency: 5 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.35 }, { progress: 0.1, value: 1 }, { progress: 0.84, value: 1 }, { progress: 0.92, value: 0.35 }, { progress: 1, value: 0.35 }] },
      { property: "tracking", keyframes: [{ progress: 0, value: 3 }, { progress: 0.5, value: 0 }, { progress: 1, value: 3 }] },
    ],
  }),
  preset({
    id: "anim-loop-chroma-water", name: "Chroma Water", phase: "loop", category: "VFX",
    tags: ["chroma", "water", "rgb", "wave"], defaultDuration: 1.6, minDuration: 0.5, maxDuration: 5,
    previewLoopDuration: 1.6, procedural: { type: "water", intensity: 0.8, frequency: 8 }, tracks: [
      { property: "translateY", keyframes: [{ progress: 0, value: 0, easing: "easeInOut" }, { progress: 0.25, value: -5, easing: "easeInOut" }, { progress: 0.75, value: 5, easing: "easeInOut" }, { progress: 1, value: 0 }] },
      { property: "skewX", keyframes: [{ progress: 0, value: 0 }, { progress: 0.25, value: 2.2 }, { progress: 0.75, value: -2.2 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-3d-neon-turn", name: "3D Neon Turn", phase: "loop", category: "3D",
    tags: ["3d", "neon", "turn", "rotate"], defaultDuration: 1.8, minDuration: 0.5, maxDuration: 5,
    previewLoopDuration: 1.8, procedural: { type: "neon", intensity: 0.9, frequency: 4 }, tracks: [
      { property: "rotation", keyframes: [{ progress: 0, value: 0, easing: "easeInOut" }, { progress: 0.5, value: 360, easing: "easeInOut" }, { progress: 1, value: 720 }] },
      { property: "scaleX", keyframes: [{ progress: 0, value: 1 }, { progress: 0.25, value: 0.18 }, { progress: 0.5, value: 1 }, { progress: 0.75, value: 0.18 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-loop-ember-breath", name: "Ember Breath", phase: "loop", category: "VFX",
    tags: ["ember", "breath", "fire", "glow"], defaultDuration: 1.5, minDuration: 0.4, maxDuration: 5,
    previewLoopDuration: 1.5, procedural: { type: "flame", intensity: 0.58, frequency: 10 }, tracks: [
      { property: "scale", keyframes: [{ progress: 0, value: 1, easing: "easeInOut" }, { progress: 0.5, value: 1.06, easing: "easeInOut" }, { progress: 1, value: 1 }] },
      { property: "opacity", keyframes: [{ progress: 0, value: 0.78 }, { progress: 0.5, value: 1 }, { progress: 1, value: 0.78 }] },
    ],
  }),
  preset({
    id: "anim-loop-electric-stream", name: "Electric Stream", phase: "loop", category: "VFX",
    tags: ["electric", "stream", "energy", "blue"], defaultDuration: 1.25, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.25, procedural: { type: "neon", intensity: 0.8, frequency: 14 }, tracks: [
      { property: "translateX", keyframes: [{ progress: 0, value: -3 }, { progress: 0.18, value: 4 }, { progress: 0.42, value: -2 }, { progress: 0.66, value: 3 }, { progress: 1, value: -3 }] },
      { property: "opacity", keyframes: [{ progress: 0, value: 0.72 }, { progress: 0.15, value: 1 }, { progress: 0.3, value: 0.7 }, { progress: 0.45, value: 1 }, { progress: 1, value: 0.72 }] },
    ],
  }),
  preset({
    id: "anim-loop-cut-echoes", name: "Cut Echoes", phase: "loop", category: "Glitch",
    tags: ["cut", "echo", "glitch", "scan"], defaultDuration: 1.05, minDuration: 0.25, maxDuration: 4,
    previewLoopDuration: 1.05, procedural: { type: "glitch", intensity: 0.62, frequency: 18 }, tracks: [
      { property: "translateX", keyframes: [{ progress: 0, value: 0 }, { progress: 0.18, value: -11 }, { progress: 0.22, value: 6 }, { progress: 0.28, value: 0 }, { progress: 0.75, value: 0 }, { progress: 0.83, value: 8 }, { progress: 0.9, value: 0 }, { progress: 1, value: 0 }] },
      { property: "skewX", keyframes: [{ progress: 0, value: 0 }, { progress: 0.2, value: -8 }, { progress: 0.3, value: 0 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-led-text-bg", name: "LED Text BG", phase: "loop", category: "VFX",
    tags: ["led", "text", "background", "dot-matrix"], defaultDuration: 1.3, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.3, procedural: { type: "pixel", intensity: 0.7, frequency: 12 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.8 }, { progress: 0.2, value: 1 }, { progress: 0.4, value: 0.76 }, { progress: 0.6, value: 1 }, { progress: 1, value: 0.8 }] },
      { property: "scaleX", keyframes: [{ progress: 0, value: 1 }, { progress: 0.5, value: 1.025 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-loop-offset-typing", name: "Offset Typing", phase: "loop", category: "Glitch",
    tags: ["offset", "typing", "rgb", "cursor"], defaultDuration: 1.3, minDuration: 0.35, maxDuration: 4,
    previewLoopDuration: 1.3, procedural: { type: "chromatic", intensity: 0.75, frequency: 11 }, stagger: { unit: "character", overlap: 0.55, order: "left-to-right" }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0 }, { progress: 0.15, value: 1 }, { progress: 0.78, value: 1 }, { progress: 0.92, value: 0 }, { progress: 1, value: 0 }] },
      { property: "translateX", keyframes: [{ progress: 0, value: 9 }, { progress: 0.45, value: 0 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-reflection-glitch", name: "Reflection Glitch", phase: "loop", category: "Glitch",
    tags: ["reflection", "glitch", "mirror", "rgb"], defaultDuration: 1.15, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.15, procedural: { type: "chromatic", intensity: 0.9, frequency: 18 }, tracks: [
      { property: "translateY", keyframes: [{ progress: 0, value: 0 }, { progress: 0.15, value: 3 }, { progress: 0.22, value: -3 }, { progress: 0.3, value: 0 }, { progress: 1, value: 0 }] },
      { property: "scaleY", keyframes: [{ progress: 0, value: 1 }, { progress: 0.25, value: 0.92 }, { progress: 0.33, value: 1 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-loop-star-wiggle", name: "Star Wiggle", phase: "loop", category: "VFX",
    tags: ["star", "wiggle", "sparkle", "playful"], defaultDuration: 1.25, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.25, procedural: { type: "sparkle", intensity: 0.75, frequency: 8 }, tracks: [
      { property: "rotation", keyframes: [{ progress: 0, value: 0 }, { progress: 0.2, value: -4 }, { progress: 0.45, value: 4 }, { progress: 0.7, value: -2 }, { progress: 1, value: 0 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 1 }, { progress: 0.45, value: 1.08 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-loop-cyber-line", name: "Cyber Line", phase: "loop", category: "VFX",
    tags: ["cyber", "line", "scan", "neon"], defaultDuration: 1.35, minDuration: 0.35, maxDuration: 4,
    previewLoopDuration: 1.35, procedural: { type: "neon", intensity: 0.75, frequency: 9 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.68 }, { progress: 0.42, value: 1 }, { progress: 0.58, value: 1 }, { progress: 1, value: 0.68 }] },
      { property: "tracking", keyframes: [{ progress: 0, value: 0 }, { progress: 0.5, value: 2.5 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-display-shine", name: "Display Shine", phase: "loop", category: "VFX",
    tags: ["display", "shine", "light", "gloss"], defaultDuration: 1.6, minDuration: 0.4, maxDuration: 5,
    previewLoopDuration: 1.6, procedural: { type: "shine", intensity: 0.8, frequency: 5 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.7 }, { progress: 0.3, value: 1 }, { progress: 0.6, value: 0.75 }, { progress: 1, value: 0.7 }] },
      { property: "scale", keyframes: [{ progress: 0, value: 1 }, { progress: 0.45, value: 1.035 }, { progress: 1, value: 1 }] },
    ],
  }),
  preset({
    id: "anim-loop-dust-shine", name: "Dust Shine", phase: "loop", category: "VFX",
    tags: ["dust", "shine", "sparkle", "cinematic"], defaultDuration: 1.55, minDuration: 0.4, maxDuration: 5,
    previewLoopDuration: 1.55, procedural: { type: "dust", intensity: 0.8, frequency: 13 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.76 }, { progress: 0.5, value: 1 }, { progress: 1, value: 0.76 }] },
      { property: "translateY", keyframes: [{ progress: 0, value: 0 }, { progress: 0.5, value: -2 }, { progress: 1, value: 0 }] },
    ],
  }),
  preset({
    id: "anim-loop-coal-scrub", name: "Coal Scrub-In", phase: "loop", category: "Glitch",
    tags: ["coal", "scrub", "grain", "dissolve"], defaultDuration: 1.2, minDuration: 0.3, maxDuration: 4,
    previewLoopDuration: 1.2, procedural: { type: "dust", intensity: 0.9, frequency: 20 }, tracks: [
      { property: "opacity", keyframes: [{ progress: 0, value: 0.28 }, { progress: 0.35, value: 1 }, { progress: 0.72, value: 1 }, { progress: 1, value: 0.28 }] },
      { property: "blur", keyframes: [{ progress: 0, value: 3 }, { progress: 0.35, value: 0 }, { progress: 0.8, value: 0 }, { progress: 1, value: 3 }] },
    ],
  }),
];
