/**
 * Video Effects API Integration
 *
 * Provides metadata about effects for the API to consume
 */

import { getEffectMetadata, getEffectsByCategory, searchEffects, EFFECTS_REGISTRY, type EffectMetadata } from "./effectsRegistry";
import type { EffectRenderer as EffectRendererType, EffectParameters } from "./types";

/**
 * API-compatible effect definition
 */
export interface VideoEffectApiDefinition {
  id: string;
  name: string;
  type: "effect" | "video-effect";
  category: "camera" | "light" | "blur" | "style" | "distortion" | "time" | "body";
  description: string;
  thumbnail: string;

  // Renderer info
  renderer: EffectRendererType;

  // Parameters
  params: EffectParameters;
  parameterSchema: EffectMetadata["parameterSchema"];

  // UI metadata
  tags: string[];
  isPremium?: boolean;

  // Intensity configuration
  intensity: {
    min: number;
    max: number;
    default: number;
    step: number;
  };

  // Preview video (for effects with .webm exports)
  previewUrl?: string;
  previewDuration?: number;
}

/**
 * Convert effect metadata to API format
 */
export function effectMetadataToApi(metadata: EffectMetadata, previewUrl?: string): VideoEffectApiDefinition {
  return {
    id: metadata.id,
    name: metadata.name,
    type: "effect",
    category: metadata.category,
    description: metadata.description,
    thumbnail: generateThumbnailUrl(metadata.id),
    renderer: metadata.id,
    params: metadata.defaultParams,
    parameterSchema: metadata.parameterSchema,
    tags: metadata.tags,
    isPremium: metadata.premium,
    intensity: {
      min: 0,
      max: 1,
      default: 0.8,
      step: 0.01,
    },
    previewUrl,
    previewDuration: 3,
  };
}

/**
 * Generate thumbnail URL for effect
 */
function generateThumbnailUrl(effectId: string): string {
  // Thumbnails hosted on clypra-api repository
  return `https://raw.githubusercontent.com/AIEraDev/clypra-api/main/public/effect-thumbnails/${effectId}.jpg`;
}

/**
 * Get all effects in API format
 */
export function getAllEffectsForApi(): VideoEffectApiDefinition[] {
  return Object.values(EFFECTS_REGISTRY).map((metadata) => effectMetadataToApi(metadata));
}

/**
 * Get effects by category in API format
 */
export function getEffectsByCategoryForApi(category: EffectMetadata["category"]): VideoEffectApiDefinition[] {
  const effects = getEffectsByCategory(category);
  return effects.map((metadata) => effectMetadataToApi(metadata));
}

/**
 * Search effects in API format
 */
export function searchEffectsForApi(query: string): VideoEffectApiDefinition[] {
  const results = searchEffects(query);
  return results.map((metadata) => effectMetadataToApi(metadata));
}

/**
 * Get effect by ID in API format
 */
export function getEffectByIdForApi(id: string): VideoEffectApiDefinition | null {
  const metadata = getEffectMetadata(id as EffectRendererType);
  if (!metadata) return null;
  return effectMetadataToApi(metadata);
}

/**
 * Get effect categories summary
 */
export function getEffectCategoriesSummary(): Array<{
  id: string;
  name: string;
  count: number;
  description: string;
}> {
  const categories = new Map<string, { count: number; description: string }>();

  Object.values(EFFECTS_REGISTRY).forEach((effect) => {
    const cat = effect.category;
    if (!categories.has(cat)) {
      categories.set(cat, {
        count: 0,
        description: getCategoryDescription(cat),
      });
    }
    categories.get(cat)!.count++;
  });

  return Array.from(categories.entries()).map(([id, data]) => ({
    id,
    name: capitalizeCategory(id),
    count: data.count,
    description: data.description,
  }));
}

/**
 * Get category description
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    camera: "Camera movements and transformations",
    light: "Lighting effects and color adjustments",
    blur: "Blur and focus effects",
    style: "Stylistic effects and filters",
    distortion: "Geometric distortions",
    time: "Time-based effects",
    body: "Body tracking and segmentation effects",
  };
  return descriptions[category] || "";
}

/**
 * Capitalize category name
 */
function capitalizeCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Generate manifest for all effects
 */
export function generateEffectsManifest(): {
  version: string;
  totalCount: number;
  categories: Array<{ id: string; name: string; count: number; description: string }>;
  effects: VideoEffectApiDefinition[];
} {
  return {
    version: "1.0.0",
    totalCount: Object.keys(EFFECTS_REGISTRY).length,
    categories: getEffectCategoriesSummary(),
    effects: getAllEffectsForApi(),
  };
}
