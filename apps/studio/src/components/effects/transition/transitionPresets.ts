/**
 * Transition Presets
 *
 * DEPRECATED: This file is deprecated. Use @clypra/engine/transitions instead.
 *
 * All transition presets, helpers, and types are now managed by @clypra/engine
 * as the single source of truth shared between clypra app and clypra-studio.
 *
 * Migration guide:
 * - Import presets from: @clypra/engine/transitions (TRANSITION_PRESETS)
 * - Import helpers from: @clypra/engine/transitions (getTransitionsByCategory, searchTransitions)
 * - Import types from: @clypra/engine/transitions
 *
 * @deprecated Use @clypra/engine/transitions instead
 */

// Re-export from engine for backwards compatibility
import { TRANSITION_PRESETS, TRANSITION_CATEGORIES, getTransitionsByCategory, searchTransitions, type TransitionPreset, type TransitionCategory } from "@clypra/engine/transitions";

export const PRESET_TRANSITIONS = TRANSITION_PRESETS;
export { TRANSITION_CATEGORIES, getTransitionsByCategory, searchTransitions };
export type { TransitionPreset, TransitionCategory };
export type TransitionCategoryType = TransitionCategory;
