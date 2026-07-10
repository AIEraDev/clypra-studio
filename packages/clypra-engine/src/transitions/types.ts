/**
 * Transition Types
 * Type definitions for transition effects between video clips
 *
 * Part of @clypra/engine - shared between clypra-studio and clypra app
 */

// ============================================================================
// TRANSITION RENDERER TYPES
// ============================================================================

export type TransitionRenderer =
  // Basic
  | "fade"
  | "dissolve"
  | "cut"
  | "canvas" // Legacy fallback (renders as fade)

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

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export type EasingFunction = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "ease-in-quad" | "ease-out-quad" | "ease-in-out-quad" | "ease-in-cubic" | "ease-out-cubic" | "ease-in-out-cubic" | "ease-in-quart" | "ease-out-quart" | "ease-in-out-quart" | "spring" | "bounce";

// ============================================================================
// TRANSITION PARAMETERS
// ============================================================================

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
// TRANSITION PRESET
// ============================================================================

export type TransitionCategory = "fade" | "slide" | "wipe" | "zoom" | "dissolve" | "creative";

export interface TransitionPreset {
  id: string;
  name: string;
  category: TransitionCategory;
  description: string;
  tags: string[];

  // Timing
  defaultDuration: number; // seconds
  defaultDurationMs: number; // milliseconds (compatibility)
  durationConstraints?: {
    min: number;
    max: number;
  };

  // Rendering
  renderer: TransitionRenderer;
  params: TransitionParameters;

  // Metadata
  isPremium?: boolean;
  thumbnail?: string;
}

// ============================================================================
// APPLIED TRANSITION (Runtime)
// ============================================================================

export interface AppliedTransition {
  id: string;
  transitionId: string;
  renderer: TransitionRenderer;
  params: TransitionParameters;
  duration: number;

  // Optional metadata
  easing?: EasingFunction;
}
