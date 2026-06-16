/**
 * Video Effects Type System
 *
 * Distinguishes between:
 * - Overlay Assets: Actual video files (smoke.mov, fire.mov)
 * - Effect Presets: JSON behavior definitions (shake, blur)
 * - Transitions: JSON animation definitions (zoom, dissolve)
 */

export type EffectCategory = "overlay" | "effect" | "transition" | "filter";

// ============================================================================
// OVERLAY ASSETS (Data-driven: actual video/image files)
// ============================================================================

export interface OverlayAsset {
  id: string;
  name: string;
  type: "overlay";
  category: string; // "particle", "light", "atmospheric", "lens", etc.
  description: string;
  thumbnail: string;

  // The actual video file URL
  url: string;

  // Media properties
  duration: number; // in seconds
  width: number;
  height: number;
  hasAlpha: boolean; // Does it have transparency?
  fileFormat: "mov" | "webm" | "mp4" | "png-sequence";
  fileSize: number; // in bytes

  // Metadata
  tags: string[];
  isPremium?: boolean;
  blendMode?: BlendMode; // Recommended blend mode

  // Usage hints
  loopable: boolean;
  recommended: {
    opacity?: number; // Default opacity
    blendMode?: BlendMode;
    placement?: "fullscreen" | "overlay";
  };
}

// ============================================================================
// EFFECT PRESETS (Behavior-driven: JSON definitions)
// ============================================================================

export type EffectRenderer =
  // Camera effects
  | "shake"
  | "zoom"
  | "pan"
  | "rotate"
  | "dolly"

  // Visual effects
  | "blur"
  | "motion_blur"
  | "radial_blur"
  | "zoom_blur"

  // Color/Style effects
  | "vhs"
  | "glitch"
  | "rgb_split"
  | "chromatic_aberration"
  | "film_grain"
  | "scanlines"
  | "crt"
  | "pixelate"

  // Distortion effects
  | "wave"
  | "ripple"
  | "bulge"
  | "twist"
  | "fisheye"

  // Light effects
  | "flash"
  | "flicker"
  | "vignette"
  | "glow"
  | "light_leak"

  // Time effects
  | "speed_ramp"
  | "freeze_frame"
  | "echo"
  | "strobe"

  // Body-tracked effects
  | "body-segmentation-glow"
  | "body_glow"
  | "body_outline"
  | "body_particles";

export interface EffectPreset {
  id: string;
  name: string;
  type: "effect" | "video-effect" | "body-effect";
  category: string; // "camera", "distortion", "color", "time", etc.
  description: string;
  thumbnail: string;

  // The renderer that generates this effect
  renderer: EffectRenderer;

  // Parameters for the renderer
  params: EffectParameters;

  // Metadata
  tags: string[];
  isPremium?: boolean;

  // UI hints
  intensity: {
    min: number;
    max: number;
    default: number;
    step: number;
  };

  requirements?: {
    bodySegmentation?: boolean;
    minConfidence?: number;
  };
}

// ============================================================================
// TRANSITIONS (Behavior-driven: JSON definitions)
// ============================================================================

export type TransitionRenderer =
  // Basic
  | "fade"
  | "dissolve"
  | "cut"

  // Zoom/Scale
  | "zoom_in"
  | "zoom_out"
  | "zoom_blur"

  // Slide
  | "slide_left"
  | "slide_right"
  | "slide_up"
  | "slide_down"

  // Wipe
  | "wipe_left"
  | "wipe_right"
  | "wipe_up"
  | "wipe_down"
  | "wipe_clockwise"
  | "wipe_center"

  // Shape
  | "circle_expand"
  | "circle_collapse"
  | "diamond_expand"
  | "rectangle_expand"

  // Blur
  | "blur_fade"
  | "directional_blur"

  // Creative
  | "glitch"
  | "rgb_split"
  | "chromatic"
  | "film_burn"
  | "light_leak"
  | "whip_pan";

export interface TransitionPreset {
  id: string;
  name: string;
  type: "transition";
  category: string; // "basic", "slide", "zoom", "wipe", "creative", etc.
  description: string;
  thumbnail: string;

  // The renderer that generates this transition
  renderer: TransitionRenderer;

  // Parameters for the renderer
  params: TransitionParameters;

  // Metadata
  tags: string[];
  isPremium?: boolean;

  // Duration constraints
  duration: {
    min: number; // minimum duration in seconds
    max: number; // maximum duration in seconds
    default: number;
    step: number;
  };

  // Transition behavior
  easing: EasingFunction;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "add" | "subtract";

export type EasingFunction = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "ease-in-quad" | "ease-out-quad" | "ease-in-out-quad" | "ease-in-cubic" | "ease-out-cubic" | "ease-in-out-cubic" | "ease-in-quart" | "ease-out-quart" | "ease-in-out-quart" | "spring" | "bounce";

// ============================================================================
// PARAMETER TYPES (for runtime rendering)
// ============================================================================

export interface EffectParameters {
  // Camera shake
  intensity?: number; // 0-100
  frequency?: number; // Hz

  // Blur
  blurAmount?: number; // pixels
  direction?: number; // degrees for motion blur

  // VHS/Glitch
  glitchIntensity?: number;
  scanlineCount?: number;
  noiseAmount?: number;
  colorOffset?: number;

  // RGB Split
  splitDistance?: number;
  angle?: number;

  // Speed ramp
  startSpeed?: number;
  endSpeed?: number;
  curve?: EasingFunction;

  // Zoom
  scale?: number;
  centerX?: number; // 0-1
  centerY?: number; // 0-1

  // Flash
  flashColor?: string;
  flashIntensity?: number;

  // Film grain
  grainSize?: number;
  grainIntensity?: number;

  // Generic
  [key: string]: any;
}

export interface TransitionParameters {
  // Common
  easing?: EasingFunction;

  // Directional
  direction?: "left" | "right" | "up" | "down";
  angle?: number; // degrees

  // Scale/Zoom
  scale?: number;
  centerX?: number; // 0-1
  centerY?: number; // 0-1

  // Blur
  blurAmount?: number;

  // Wipe
  feather?: number; // edge softness

  // Color
  color?: string;

  // Generic
  [key: string]: any;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// ============================================================================
// FILTER ASSETS (Data-driven: canvas filter definitions)
// ============================================================================

export interface FilterAsset {
  id: string;
  name: string;
  type: "filter";
  category: string; // "vintage", "modern", "cinematic", "bw", "color"
  description: string;
  thumbnail: string;
  swatch?: string;
  status?: string;
  intensity: {
    min: number;
    max: number;
    default: number;
    step: number;
  };
}

export type VideoEffectItem = OverlayAsset | EffectPreset | TransitionPreset | FilterAsset;

export interface VideoEffectCategory {
  id: string;
  name: string;
  type: EffectCategory;
  description: string;
  thumbnail: string;
  itemCount: number;
}

export interface VideoEffectManifest {
  categories: VideoEffectCategory[];
  featured: VideoEffectItem[];
  version: string;
}

// ============================================================================
// APPLIED EFFECT TYPES (for timeline clips)
// ============================================================================

export interface AppliedOverlay {
  id: string;
  effectId: string;
  type: "overlay";
  url: string;

  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  // Appearance
  opacity: number;
  blendMode: BlendMode;

  // Timing
  startTime: number; // relative to clip
  duration: number;
  loop: boolean;
}

export interface AppliedEffect {
  id: string;
  effectId: string;
  type: "effect";
  renderer: EffectRenderer;
  params: EffectParameters;

  // Timing
  startTime: number; // relative to clip
  duration: number;

  // Intensity envelope (for keyframing)
  intensity: number; // 0-1
  keyframes?: Array<{
    time: number;
    intensity: number;
    easing: EasingFunction;
  }>;
}

export interface AppliedTransition {
  id: string;
  transitionId: string;
  type: "transition";
  renderer: TransitionRenderer;
  params: TransitionParameters;

  // Timing
  duration: number;

  // Placement
  fromClipId: string;
  toClipId: string;
  alignment: "center" | "start" | "end";
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface VideoEffectState {
  // Manifests
  manifest: VideoEffectManifest | null;
  categories: Record<string, VideoEffectItem[]>;

  // Loading states
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Cache
  overlayCache: Map<string, Blob>; // Pre-downloaded overlay files

  // User favorites
  favorites: Set<string>;
}
