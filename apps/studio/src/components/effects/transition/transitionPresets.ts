/**
 * Transition Presets
 *
 * DEPRECATED: This file is deprecated. Use @clypra/engine/transitions instead.
 *
 * All transition presets, helpers, and types are now managed by @clypra/engine
 * as the single source of truth shared between clypra app and clypra-studio.
 *
 * Migration guide:
 * - Import presets from: @clypra/engine/transitions (presets.PRESET_TRANSITIONS)
 * - Import helpers from: @clypra/engine/transitions (helpers.getTransitionsByCategory, helpers.searchTransitions)
 * - Import types from: @clypra/engine/transitions
 *
 * @deprecated Use @clypra/engine/transitions instead
 */

// Re-export from engine for backwards compatibility
import { presets, helpers, type TransitionPreset, type TransitionCategory } from "@clypra/engine/transitions";

export const PRESET_TRANSITIONS = presets.PRESET_TRANSITIONS;
export const TRANSITION_CATEGORIES = presets.TRANSITION_CATEGORIES;
export const getTransitionsByCategory = helpers.getTransitionsByCategory;
export const searchTransitions = helpers.searchTransitions;

export type { TransitionPreset, TransitionCategory };
export type TransitionCategoryType = TransitionCategory;
