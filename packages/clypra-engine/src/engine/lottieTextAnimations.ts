/**
 * Lottie Text Animation Presets — CapCut-grade entrance, exit, and loop animations.
 * Each preset returns a set of Lottie keyframe tracks to bake into a text layer.
 */

export type AnimationCategory = "entrance" | "exit" | "loop" | "emphasis";

export interface LottieAnimPreset {
  id: string;
  name: string;
  category: AnimationCategory;
  icon: string;
  description: string;
  /** Duration in frames this animation occupies */
  defaultDurationFrames: number;
  /** Build keyframes for a given layer, start frame, total frames, and comp size */
  buildTracks: (opts: AnimBuildOpts) => AnimTrackDef[];
}

export interface AnimBuildOpts {
  layerIndex: number;
  startFrame: number;
  endFrame: number;
  totalFrames: number;
  compW: number;
  compH: number;
  /** For exit animations, the frame at which exit begins */
  exitStartFrame?: number;
}

export interface AnimKeyframe {
  t: number;
  s: number[] | number;
  i?: { x: number[]; y: number[] };
  o?: { x: number[]; y: number[] };
}

export interface AnimTrackDef {
  /** Lottie property path e.g. "ks.p", "ks.s", "ks.o", "ks.r" */
  path: string;
  keyframes: AnimKeyframe[];
}

// ─── Easing helpers ──────────────────────────────────────────────────────────

const EASE_OUT = { i: { x: [0.58], y: [1] }, o: { x: [0.42], y: [0] } };
const EASE_IN = { i: { x: [1], y: [1] }, o: { x: [0.42], y: [0] } };
const EASE_IO = { i: { x: [0.58], y: [1] }, o: { x: [0.42], y: [0] } };
const SPRING = { i: { x: [0.175], y: [0.885] }, o: { x: [0.32], y: [1.275] } };
const LINEAR = { i: { x: [1], y: [1] }, o: { x: [0], y: [0] } };
const BOUNCE = { i: { x: [0.215], y: [0.61] }, o: { x: [0.755], y: [0.05] } };

function kf(t: number, s: number[] | number, easing = EASE_OUT): AnimKeyframe {
  return { t, s, ...easing };
}

function lastKf(t: number, s: number[] | number): AnimKeyframe {
  return { t, s };
}

// ─── Entrance Animations ─────────────────────────────────────────────────────

const fadeIn: LottieAnimPreset = {
  id: "fade-in",
  name: "Fade In",
  category: "entrance",
  icon: "✨",
  description: "Simple opacity fade from 0 to 100",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame, endFrame }) => [
    {
      path: "ks.o",
      keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)],
    },
  ],
};

const slideUp: LottieAnimPreset = {
  id: "slide-up",
  name: "Slide Up",
  category: "entrance",
  icon: "⬆️",
  description: "Slides in from below with fade",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame, compH }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [0, compH * 0.15, 0], SPRING), lastKf(endFrame, [0, 0, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const slideDown: LottieAnimPreset = {
  id: "slide-down",
  name: "Slide Down",
  category: "entrance",
  icon: "⬇️",
  description: "Slides in from above with fade",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame, compH }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [0, -compH * 0.15, 0], SPRING), lastKf(endFrame, [0, 0, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const slideLeft: LottieAnimPreset = {
  id: "slide-left",
  name: "Slide Left",
  category: "entrance",
  icon: "⬅️",
  description: "Slides in from the right",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame, compW }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [compW * 0.3, 0, 0], SPRING), lastKf(endFrame, [0, 0, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const slideRight: LottieAnimPreset = {
  id: "slide-right",
  name: "Slide Right",
  category: "entrance",
  icon: "➡️",
  description: "Slides in from the left",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame, compW }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [-compW * 0.3, 0, 0], SPRING), lastKf(endFrame, [0, 0, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const zoomIn: LottieAnimPreset = {
  id: "zoom-in",
  name: "Zoom In",
  category: "entrance",
  icon: "🔍",
  description: "Scales up from 0 with spring overshoot",
  defaultDurationFrames: 22,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [0, 0, 100], SPRING), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const zoomInBounce: LottieAnimPreset = {
  id: "zoom-in-bounce",
  name: "Zoom Bounce",
  category: "entrance",
  icon: "💥",
  description: "Scales up with elastic overshoot",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame, endFrame }) => {
    const mid = Math.round(startFrame + (endFrame - startFrame) * 0.7);
    return [
      { path: "ks.s", keyframes: [kf(startFrame, [0, 0, 100], SPRING), kf(mid, [115, 115, 100], BOUNCE), lastKf(endFrame, [100, 100, 100])] },
      { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
    ];
  },
};

const popIn: LottieAnimPreset = {
  id: "pop-in",
  name: "Pop In",
  category: "entrance",
  icon: "🎯",
  description: "Quick scale pop with overshoot",
  defaultDurationFrames: 18,
  buildTracks: ({ startFrame, endFrame }) => {
    const mid = Math.round(startFrame + (endFrame - startFrame) * 0.6);
    return [
      { path: "ks.s", keyframes: [kf(startFrame, [60, 60, 100], SPRING), kf(mid, [110, 110, 100], BOUNCE), lastKf(endFrame, [100, 100, 100])] },
      { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
    ];
  },
};

const flipX: LottieAnimPreset = {
  id: "flip-x",
  name: "Flip X",
  category: "entrance",
  icon: "🔄",
  description: "Horizontal flip reveal",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [0, 100, 100], EASE_OUT), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const flipY: LottieAnimPreset = {
  id: "flip-y",
  name: "Flip Y",
  category: "entrance",
  icon: "🔃",
  description: "Vertical flip reveal",
  defaultDurationFrames: 25,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [100, 0, 100], EASE_OUT), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const rotateIn: LottieAnimPreset = {
  id: "rotate-in",
  name: "Rotate In",
  category: "entrance",
  icon: "🌀",
  description: "Spins in from -90 degrees",
  defaultDurationFrames: 28,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.r", keyframes: [kf(startFrame, -90, SPRING), lastKf(endFrame, 0)] },
    { path: "ks.s", keyframes: [kf(startFrame, [60, 60, 100], EASE_OUT), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const blurIn: LottieAnimPreset = {
  id: "blur-in",
  name: "Blur In",
  category: "entrance",
  icon: "🌫️",
  description: "Fades in from blurred state (opacity only; blur via filter layer)",
  defaultDurationFrames: 22,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [120, 120, 100], EASE_OUT), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 0, EASE_OUT), lastKf(endFrame, 100)] },
  ],
};

const dropIn: LottieAnimPreset = {
  id: "drop-in",
  name: "Drop In",
  category: "entrance",
  icon: "🪂",
  description: "Drops from above with bounce landing",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame, endFrame, compH }) => {
    const land = Math.round(startFrame + (endFrame - startFrame) * 0.75);
    const bounce = Math.round(startFrame + (endFrame - startFrame) * 0.88);
    return [
      { path: "ks.p", keyframes: [kf(startFrame, [0, -compH * 0.4, 0], EASE_IN), kf(land, [0, 8, 0], BOUNCE), kf(bounce, [0, -4, 0], EASE_OUT), lastKf(endFrame, [0, 0, 0])] },
      { path: "ks.o", keyframes: [kf(startFrame, 100), lastKf(endFrame, 100)] },
    ];
  },
};

const typewriter: LottieAnimPreset = {
  id: "typewriter",
  name: "Typewriter",
  category: "entrance",
  icon: "⌨️",
  description: "Classic typewriter reveal via scale-X wipe",
  defaultDurationFrames: 35,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [0, 100, 100], LINEAR), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 100), lastKf(endFrame, 100)] },
  ],
};

const wipeLeft: LottieAnimPreset = {
  id: "wipe-left",
  name: "Wipe Left",
  category: "entrance",
  icon: "◀️",
  description: "Horizontal wipe reveal from left",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [0, 100, 100], EASE_OUT), lastKf(endFrame, [100, 100, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 100), lastKf(endFrame, 100)] },
  ],
};

const glitchIn: LottieAnimPreset = {
  id: "glitch-in",
  name: "Glitch In",
  category: "entrance",
  icon: "⚡",
  description: "Rapid position glitch then settle",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame, endFrame }) => {
    const f1 = startFrame + 2,
      f2 = startFrame + 4,
      f3 = startFrame + 6,
      f4 = startFrame + 9;
    return [
      { path: "ks.p", keyframes: [kf(startFrame, [-12, 4, 0], LINEAR), kf(f1, [8, -6, 0], LINEAR), kf(f2, [-5, 3, 0], LINEAR), kf(f3, [4, -2, 0], LINEAR), kf(f4, [0, 0, 0], EASE_OUT), lastKf(endFrame, [0, 0, 0])] },
      { path: "ks.o", keyframes: [kf(startFrame, 0, LINEAR), kf(f1, 100, LINEAR), lastKf(endFrame, 100)] },
    ];
  },
};

// ─── Exit Animations ─────────────────────────────────────────────────────────

const fadeOut: LottieAnimPreset = {
  id: "fade-out",
  name: "Fade Out",
  category: "exit",
  icon: "💨",
  description: "Simple opacity fade to 0",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame, endFrame }) => [
    {
      path: "ks.o",
      keyframes: [kf(startFrame, 100, EASE_IN), lastKf(endFrame, 0)],
    },
  ],
};

const slideOutUp: LottieAnimPreset = {
  id: "slide-out-up",
  name: "Slide Out Up",
  category: "exit",
  icon: "🚀",
  description: "Slides out upward with fade",
  defaultDurationFrames: 22,
  buildTracks: ({ startFrame, endFrame, compH }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [0, 0, 0], EASE_IN), lastKf(endFrame, [0, -compH * 0.2, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 100, EASE_IN), lastKf(endFrame, 0)] },
  ],
};

const slideOutDown: LottieAnimPreset = {
  id: "slide-out-down",
  name: "Slide Out Down",
  category: "exit",
  icon: "⬇️",
  description: "Slides out downward with fade",
  defaultDurationFrames: 22,
  buildTracks: ({ startFrame, endFrame, compH }) => [
    { path: "ks.p", keyframes: [kf(startFrame, [0, 0, 0], EASE_IN), lastKf(endFrame, [0, compH * 0.2, 0])] },
    { path: "ks.o", keyframes: [kf(startFrame, 100, EASE_IN), lastKf(endFrame, 0)] },
  ],
};

const zoomOut: LottieAnimPreset = {
  id: "zoom-out",
  name: "Zoom Out",
  category: "exit",
  icon: "🔎",
  description: "Scales down to 0 with fade",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame, endFrame }) => [
    { path: "ks.s", keyframes: [kf(startFrame, [100, 100, 100], EASE_IN), lastKf(endFrame, [0, 0, 100])] },
    { path: "ks.o", keyframes: [kf(startFrame, 100, EASE_IN), lastKf(endFrame, 0)] },
  ],
};

const zoomOutBlast: LottieAnimPreset = {
  id: "zoom-out-blast",
  name: "Zoom Blast",
  category: "exit",
  icon: "💣",
  description: "Scales up then disappears",
  defaultDurationFrames: 18,
  buildTracks: ({ startFrame, endFrame }) => {
    const mid = Math.round(startFrame + (endFrame - startFrame) * 0.5);
    return [
      { path: "ks.s", keyframes: [kf(startFrame, [100, 100, 100], EASE_IN), kf(mid, [140, 140, 100], EASE_IN), lastKf(endFrame, [0, 0, 100])] },
      { path: "ks.o", keyframes: [kf(startFrame, 100, LINEAR), kf(mid, 80, LINEAR), lastKf(endFrame, 0)] },
    ];
  },
};

const glitchOut: LottieAnimPreset = {
  id: "glitch-out",
  name: "Glitch Out",
  category: "exit",
  icon: "📺",
  description: "Glitches then disappears",
  defaultDurationFrames: 18,
  buildTracks: ({ startFrame, endFrame }) => {
    const f1 = endFrame - 8,
      f2 = endFrame - 5,
      f3 = endFrame - 3;
    return [
      { path: "ks.p", keyframes: [kf(startFrame, [0, 0, 0], LINEAR), kf(f1, [10, -4, 0], LINEAR), kf(f2, [-8, 3, 0], LINEAR), kf(f3, [5, -2, 0], LINEAR), lastKf(endFrame, [0, 0, 0])] },
      { path: "ks.o", keyframes: [kf(startFrame, 100), kf(f1, 80, LINEAR), kf(f2, 60, LINEAR), lastKf(endFrame, 0)] },
    ];
  },
};

// ─── Loop Animations ─────────────────────────────────────────────────────────

const pulse: LottieAnimPreset = {
  id: "pulse",
  name: "Pulse",
  category: "loop",
  icon: "💓",
  description: "Rhythmic scale pulse",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame, totalFrames }) => {
    const half = Math.round(totalFrames / 2);
    return [
      {
        path: "ks.s",
        keyframes: [kf(startFrame, [100, 100, 100], EASE_IO), kf(startFrame + half, [108, 108, 100], EASE_IO), lastKf(startFrame + totalFrames, [100, 100, 100])],
      },
    ];
  },
};

const breathe: LottieAnimPreset = {
  id: "breathe",
  name: "Breathe",
  category: "loop",
  icon: "🌬️",
  description: "Slow gentle scale breathe",
  defaultDurationFrames: 60,
  buildTracks: ({ startFrame, totalFrames }) => {
    const half = Math.round(totalFrames / 2);
    return [
      { path: "ks.s", keyframes: [kf(startFrame, [100, 100, 100], EASE_IO), kf(startFrame + half, [104, 104, 100], EASE_IO), lastKf(startFrame + totalFrames, [100, 100, 100])] },
      { path: "ks.o", keyframes: [kf(startFrame, 85, EASE_IO), kf(startFrame + half, 100, EASE_IO), lastKf(startFrame + totalFrames, 85)] },
    ];
  },
};

const floatUp: LottieAnimPreset = {
  id: "float-up",
  name: "Float",
  category: "loop",
  icon: "🎈",
  description: "Gentle vertical float",
  defaultDurationFrames: 60,
  buildTracks: ({ startFrame, totalFrames }) => {
    const half = Math.round(totalFrames / 2);
    return [
      {
        path: "ks.p",
        keyframes: [kf(startFrame, [0, 0, 0], EASE_IO), kf(startFrame + half, [0, -8, 0], EASE_IO), lastKf(startFrame + totalFrames, [0, 0, 0])],
      },
    ];
  },
};

const shake: LottieAnimPreset = {
  id: "shake",
  name: "Shake",
  category: "loop",
  icon: "📳",
  description: "Rapid horizontal shake",
  defaultDurationFrames: 20,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.p",
      keyframes: [kf(startFrame, [0, 0, 0], LINEAR), kf(startFrame + 3, [-6, 0, 0], LINEAR), kf(startFrame + 6, [6, 0, 0], LINEAR), kf(startFrame + 9, [-4, 0, 0], LINEAR), kf(startFrame + 12, [4, 0, 0], LINEAR), kf(startFrame + 15, [-2, 0, 0], LINEAR), lastKf(startFrame + 18, [0, 0, 0])],
    },
  ],
};

const wobble: LottieAnimPreset = {
  id: "wobble",
  name: "Wobble",
  category: "loop",
  icon: "🌊",
  description: "Rotation wobble",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.r",
      keyframes: [kf(startFrame, 0, EASE_IO), kf(startFrame + 7, -5, EASE_IO), kf(startFrame + 14, 5, EASE_IO), kf(startFrame + 21, -3, EASE_IO), lastKf(startFrame + 28, 0)],
    },
  ],
};

const neonFlicker: LottieAnimPreset = {
  id: "neon-flicker",
  name: "Neon Flicker",
  category: "loop",
  icon: "💡",
  description: "Neon sign flicker via opacity",
  defaultDurationFrames: 24,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.o",
      keyframes: [kf(startFrame, 100, LINEAR), kf(startFrame + 2, 20, LINEAR), kf(startFrame + 3, 100, LINEAR), kf(startFrame + 5, 60, LINEAR), kf(startFrame + 6, 100, LINEAR), kf(startFrame + 14, 100, LINEAR), kf(startFrame + 15, 30, LINEAR), kf(startFrame + 16, 100, LINEAR), lastKf(startFrame + 23, 100)],
    },
  ],
};

const wave: LottieAnimPreset = {
  id: "wave",
  name: "Wave",
  category: "loop",
  icon: "👋",
  description: "Vertical wave motion",
  defaultDurationFrames: 40,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.p",
      keyframes: [kf(startFrame, [0, 0, 0], EASE_IO), kf(startFrame + 10, [0, -10, 0], EASE_IO), kf(startFrame + 20, [0, 0, 0], EASE_IO), kf(startFrame + 30, [0, 10, 0], EASE_IO), lastKf(startFrame + 40, [0, 0, 0])],
    },
  ],
};

// ─── Emphasis Animations ─────────────────────────────────────────────────────

const attention: LottieAnimPreset = {
  id: "attention",
  name: "Attention",
  category: "emphasis",
  icon: "❗",
  description: "Quick scale pop for emphasis",
  defaultDurationFrames: 15,
  buildTracks: ({ startFrame }) => {
    const mid = startFrame + 7;
    return [
      {
        path: "ks.s",
        keyframes: [kf(startFrame, [100, 100, 100], EASE_OUT), kf(mid, [120, 120, 100], BOUNCE), lastKf(startFrame + 14, [100, 100, 100])],
      },
    ];
  },
};

const jello: LottieAnimPreset = {
  id: "jello",
  name: "Jello",
  category: "emphasis",
  icon: "🍮",
  description: "Elastic squash and stretch",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.s",
      keyframes: [kf(startFrame, [100, 100, 100], EASE_IO), kf(startFrame + 5, [120, 80, 100], BOUNCE), kf(startFrame + 10, [85, 115, 100], BOUNCE), kf(startFrame + 15, [110, 92, 100], BOUNCE), kf(startFrame + 20, [96, 104, 100], BOUNCE), lastKf(startFrame + 28, [100, 100, 100])],
    },
  ],
};

const swing: LottieAnimPreset = {
  id: "swing",
  name: "Swing",
  category: "emphasis",
  icon: "🎷",
  description: "Pendulum rotation swing",
  defaultDurationFrames: 30,
  buildTracks: ({ startFrame }) => [
    {
      path: "ks.r",
      keyframes: [kf(startFrame, 0, EASE_IO), kf(startFrame + 6, 15, EASE_IO), kf(startFrame + 12, -10, EASE_IO), kf(startFrame + 18, 6, EASE_IO), kf(startFrame + 24, -3, EASE_IO), lastKf(startFrame + 29, 0)],
    },
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const LOTTIE_ANIM_PRESETS: LottieAnimPreset[] = [
  // Entrance
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  zoomIn,
  zoomInBounce,
  popIn,
  flipX,
  flipY,
  rotateIn,
  blurIn,
  dropIn,
  typewriter,
  wipeLeft,
  glitchIn,
  // Exit
  fadeOut,
  slideOutUp,
  slideOutDown,
  zoomOut,
  zoomOutBlast,
  glitchOut,
  // Loop
  pulse,
  breathe,
  floatUp,
  shake,
  wobble,
  neonFlicker,
  wave,
  // Emphasis
  attention,
  jello,
  swing,
];

export const ENTRANCE_PRESETS = LOTTIE_ANIM_PRESETS.filter((p) => p.category === "entrance");
export const EXIT_PRESETS = LOTTIE_ANIM_PRESETS.filter((p) => p.category === "exit");
export const LOOP_PRESETS = LOTTIE_ANIM_PRESETS.filter((p) => p.category === "loop");
export const EMPHASIS_PRESETS = LOTTIE_ANIM_PRESETS.filter((p) => p.category === "emphasis");

export function getAnimPreset(id: string): LottieAnimPreset | undefined {
  return LOTTIE_ANIM_PRESETS.find((p) => p.id === id);
}

/**
 * Bake an animation preset into a Lottie layer's keyframe tracks.
 * Merges with existing keyframes rather than replacing them.
 */
export function bakeAnimationIntoLayer(lottieData: any, layerIndex: number, preset: LottieAnimPreset, opts: Omit<AnimBuildOpts, "layerIndex">): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers?.[layerIndex];
  if (!layer) return clone;

  const tracks = preset.buildTracks({ ...opts, layerIndex });

  for (const track of tracks) {
    const keys = track.path.split(".");
    let prop = layer;
    for (const k of keys) {
      if (!prop[k]) prop[k] = {};
      prop = prop[k];
    }

    // Convert to animated if static
    if (prop.a === 0 || prop.a === undefined) {
      const staticVal = prop.k ?? (track.path === "ks.o" ? 100 : track.path === "ks.r" ? 0 : [0, 0, 0]);
      prop.a = 1;
      prop.k = [{ t: 0, s: staticVal }];
    }

    // Merge new keyframes
    const existing: AnimKeyframe[] = prop.k || [];
    for (const newKf of track.keyframes) {
      const idx = existing.findIndex((k) => k.t === newKf.t);
      if (idx >= 0) {
        existing[idx] = newKf;
      } else {
        existing.push(newKf);
      }
    }
    existing.sort((a, b) => a.t - b.t);

    // Ensure last keyframe has no easing
    existing.forEach((k, i) => {
      if (i === existing.length - 1) {
        delete (k as any).i;
        delete (k as any).o;
      }
    });

    prop.k = existing;
  }

  return clone;
}

/**
 * Remove all animation keyframes from a layer property, reverting to static.
 */
export function clearAnimationFromLayer(lottieData: any, layerIndex: number, paths: string[] = ["ks.p", "ks.s", "ks.r", "ks.o"]): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers?.[layerIndex];
  if (!layer) return clone;

  for (const path of paths) {
    const keys = path.split(".");
    let prop = layer;
    for (const k of keys) {
      if (!prop[k]) break;
      if (k === keys[keys.length - 1]) {
        if (prop[k].a === 1 && Array.isArray(prop[k].k)) {
          const lastKf = prop[k].k[prop[k].k.length - 1];
          prop[k] = { a: 0, k: lastKf?.s ?? (path === "ks.o" ? 100 : path === "ks.r" ? 0 : [0, 0, 0]) };
        }
      } else {
        prop = prop[k];
      }
    }
  }

  return clone;
}
