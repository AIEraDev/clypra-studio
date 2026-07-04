/**
 * Transition Presets
 *
 * DEPRECATED: This file is deprecated. Use @clypra-studio/engine/transitions instead.
 *
 * All transition presets, helpers, and types are now managed by @clypra-studio/engine
 * as the single source of truth shared between clypra app and clypra-studio.
 *
 * Migration guide:
 * - Import presets from: @clypra-studio/engine/transitions (TRANSITION_PRESETS)
 * - Import helpers from: @clypra-studio/engine/transitions (getTransitionsByCategory, searchTransitions)
 * - Import types from: @clypra-studio/engine/transitions
 *
 * @deprecated Use @clypra-studio/engine/transitions instead
 */

// Re-export from engine for backwards compatibility
import { TRANSITION_PRESETS, TRANSITION_CATEGORIES, getTransitionsByCategory, searchTransitions, type TransitionPreset, type TransitionCategory } from "@clypra-studio/engine/transitions";

export const PRESET_TRANSITIONS = TRANSITION_PRESETS;
export { TRANSITION_CATEGORIES, getTransitionsByCategory, searchTransitions };
export type { TransitionPreset, TransitionCategory };
export type TransitionCategoryType = TransitionCategory;
