/**
 * Transitions Module
 *
 * Professional transition effects for video editing
 * Part of @clypra-studio/engine - shared between clypra-studio and clypra app
 *
 * @module transitions
 */

// Core renderer
export { TransitionRenderer } from "./TransitionRenderer";

// Types
export type { TransitionRenderer as TransitionRendererType, EasingFunction, TransitionParameters, TransitionCategory, TransitionPreset, AppliedTransition } from "./types";

// Preset library
export { TRANSITION_PRESETS, TRANSITION_CATEGORIES } from "./presets";

// Helper functions
export { getTransitionCategories, getTransitionsByCategory, searchTransitions, getTransitionById, getTransitionByRenderer, getAllTransitions, getTransitionCountByCategory, getAllTransitionTags, getTransitionsByTags, getRecommendedDuration } from "./helpers";

// GPU Transitions Registry
export * from "../effects/transitions/index";
