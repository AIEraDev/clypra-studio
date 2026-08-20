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
import { TRANSITION_PRESETS } from "./presets";
export { TRANSITION_PRESETS, TRANSITION_CATEGORIES } from "./presets";

// Helper functions
export { getTransitionCategories, getTransitionsByCategory, searchTransitions, getTransitionById, getTransitionByRenderer, getAllTransitions, getTransitionCountByCategory, getAllTransitionTags, getTransitionsByTags, getRecommendedDuration } from "./helpers";

/**
 * Native transition metadata consumed by Studio controls. Rendering is owned
 * by the Rust/native frame contract; these records intentionally contain no
 * browser renderer or GPU object factories.
 */
export interface NativeTransitionParam {
  key: string;
  label: string;
  type: "range" | "color" | "toggle" | "select" | "text";
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface NativeTransitionDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  defaultDurationMs: number;
  params: NativeTransitionParam[];
  renderer: string;
}

export const ALL_TRANSITIONS: NativeTransitionDefinition[] = TRANSITION_PRESETS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  category: preset.category,
  description: preset.description,
  tags: preset.tags,
  defaultDurationMs: preset.defaultDurationMs,
  renderer: preset.renderer,
  params: Object.entries(preset.params).map(([key, value]) => ({
    key,
    label: key.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    type: typeof value === "number" ? "range" : typeof value === "boolean" ? "toggle" : "text",
    value,
  })),
}));
