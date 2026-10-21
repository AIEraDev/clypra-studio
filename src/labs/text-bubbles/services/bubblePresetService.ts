import { createBubbleAssetDefinition, createFreeformBubbleAssetDefinition, validateBubbleAssetDefinition, type TextBubblePreset, type TextBubbleCategory } from "@clypra-studio/engine";
import { DEFAULT_BUBBLE_CATALOG } from "../data/defaultBubbleCatalog";

const STORAGE_KEY = "clypra_studio_bubble_presets_v1";
const CURATED_PRESET_IDS = new Set(DEFAULT_BUBBLE_CATALOG.map((preset) => preset.id));

function isCurrentCatalogPreset(preset: unknown): preset is TextBubblePreset {
  if (!preset || typeof preset !== "object") return false;
  const candidate = preset as Partial<TextBubblePreset>;
  return CURATED_PRESET_IDS.has(candidate.id ?? "") || (
    candidate.id?.startsWith("bubble-custom-") === true &&
    (candidate.definition !== undefined || candidate.appearance !== undefined)
  );
}

/**
 * Loads custom bubble presets from browser storage or falls back to default catalog.
 */
export function loadBubblePresets(): TextBubblePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(isCurrentCatalogPreset)
      ) {
        return parsed;
      }
      // Retire the previous broad catalog rather than silently carrying old
      // drafts into the intentionally small, curated collection.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUBBLE_CATALOG));
    }
  } catch (err) {
    console.warn("Failed to parse custom bubble presets from localStorage:", err);
  }
  return DEFAULT_BUBBLE_CATALOG;
}

/**
 * Persists presets array to browser storage.
 */
export function saveBubblePresets(presets: TextBubblePreset[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return true;
  } catch (err) {
    console.error("Failed to save bubble presets to localStorage:", err);
    return false;
  }
}

/**
 * Creates a new blank/starter custom bubble preset.
 */
export function createCustomPreset(
  category: TextBubbleCategory = "paper",
  count = 1,
): TextBubblePreset {
  const id = `bubble-custom-${Date.now().toString(36)}`;
  return {
    schemaVersion: 1,
    id,
    version: 1,
    name: `Custom Bubble ${count}`,
    category,
    tags: ["custom", category],
    definition: createBubbleAssetDefinition(),
    layout: {
      contentBounds: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
      minWidth: 140,
      minHeight: 50,
      preserveAspectRatio: false,
      padding: { top: 14, right: 20, bottom: 14, left: 20 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 26,
      fontWeight: 600,
      color: "#ffffff",
    },
    sampleText: "Custom Bubble Text",
  };
}

/** Starts a new authored asset directly in the freeform node editor. */
export function createFreeformPreset(
  category: TextBubbleCategory = "speech",
  count = 1,
): TextBubblePreset {
  const preset = createCustomPreset(category, count);
  return {
    ...preset,
    name: `Freeform Bubble ${count}`,
    tags: ["custom", "freeform", category],
    definition: createFreeformBubbleAssetDefinition(),
  };
}

/** Starts a parametric bubble with deterministic Rough.js presentation enabled. */
export function createRoughPreset(
  category: TextBubbleCategory = "comic",
  count = 1,
): TextBubblePreset {
  const preset = createCustomPreset(category, count);
  const definition = preset.definition!;
  definition.layers.outline.roughness = 0.3;
  definition.layers.accent = { color: "#ffffff", opacity: 0.22, texture: "hatch" };
  return {
    ...preset,
    name: `Hand-Drawn Bubble ${count}`,
    tags: ["custom", "roughjs", "hand-drawn", category],
    definition,
  };
}

/**
 * Duplicates an existing preset with a new ID and timestamp.
 */
export function duplicatePreset(preset: TextBubblePreset): TextBubblePreset {
  return {
    ...preset,
    id: `${preset.id}-copy-${Date.now().toString(36)}`,
    name: `${preset.name} (Copy)`,
    tags: [...(preset.tags || []), "copy"],
  };
}

/**
 * Validates a preset against schema constraints.
 */
export function validateBubblePreset(preset: TextBubblePreset): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!preset.id || !preset.id.trim()) {
    errors.push("Preset ID is required.");
  }
  if (!preset.name || !preset.name.trim()) {
    errors.push("Preset name is required.");
  }
  if (!preset.category) {
    errors.push("Preset category is required.");
  }
  if (!preset.layout) {
    errors.push("Preset layout definition is missing.");
  } else {
    if (preset.layout.minWidth < 0 || preset.layout.minHeight < 0) {
      errors.push("Minimum dimensions cannot be negative.");
    }
  }
  if (!preset.definition && preset.id.startsWith("bubble-custom-")) {
    errors.push("An editable bubble definition is required for published custom presets.");
  } else if (preset.definition) {
    errors.push(...validateBubbleAssetDefinition(preset.definition));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
