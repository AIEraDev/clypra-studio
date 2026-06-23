/**
 * Transition Helpers
 * Utility functions for working with transition presets
 *
 * Part of @clypra/engine - shared between clypra-studio and clypra app
 */

import type { TransitionPreset, TransitionCategory, TransitionRenderer } from "./types";
import { TRANSITION_PRESETS, TRANSITION_CATEGORIES } from "./presets";

/**
 * Get all available transition categories
 */
export function getTransitionCategories(): TransitionCategory[] {
  return [...TRANSITION_CATEGORIES];
}

/**
 * Get transitions filtered by category
 */
export function getTransitionsByCategory(category: TransitionCategory): TransitionPreset[] {
  return TRANSITION_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Search transitions by query (name, description, or tags)
 */
export function searchTransitions(query: string): TransitionPreset[] {
  if (!query || query.trim() === "") {
    return TRANSITION_PRESETS;
  }

  const lowerQuery = query.toLowerCase().trim();

  return TRANSITION_PRESETS.filter((preset) => {
    // Search in name
    if (preset.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in description
    if (preset.description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in tags
    if (preset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Search in renderer name
    if (preset.renderer.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
}

/**
 * Get a specific transition preset by ID
 */
export function getTransitionById(id: string): TransitionPreset | undefined {
  return TRANSITION_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get a transition preset by renderer type
 */
export function getTransitionByRenderer(renderer: TransitionRenderer): TransitionPreset | undefined {
  return TRANSITION_PRESETS.find((preset) => preset.renderer === renderer);
}

/**
 * Get all transition presets
 */
export function getAllTransitions(): TransitionPreset[] {
  return [...TRANSITION_PRESETS];
}

/**
 * Get transition count by category
 */
export function getTransitionCountByCategory(): Record<TransitionCategory, number> {
  const counts = {} as Record<TransitionCategory, number>;

  for (const category of TRANSITION_CATEGORIES) {
    counts[category] = getTransitionsByCategory(category).length;
  }

  return counts;
}

/**
 * Get all unique tags from all transitions
 */
export function getAllTransitionTags(): string[] {
  const tagsSet = new Set<string>();

  for (const preset of TRANSITION_PRESETS) {
    for (const tag of preset.tags) {
      tagsSet.add(tag);
    }
  }

  return Array.from(tagsSet).sort();
}

/**
 * Filter transitions by multiple tags (AND logic)
 */
export function getTransitionsByTags(tags: string[]): TransitionPreset[] {
  if (tags.length === 0) {
    return TRANSITION_PRESETS;
  }

  const lowerTags = tags.map((tag) => tag.toLowerCase());

  return TRANSITION_PRESETS.filter((preset) => {
    const presetTags = preset.tags.map((tag) => tag.toLowerCase());
    return lowerTags.every((tag) => presetTags.includes(tag));
  });
}

/**
 * Get recommended transition duration for a preset
 */
export function getRecommendedDuration(presetId: string): number {
  const preset = getTransitionById(presetId);
  return preset?.defaultDuration ?? 1.0;
}
