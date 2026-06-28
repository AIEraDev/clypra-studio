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
  category: "essentials" | "glitch" | "retro" | "light" | "motion" | "color" | "body" | "cinematic" | "distortion";
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
  thumbnailUrl?: string;
}

/**
 * Get effect preview URL
 */
export function getEffectPreviewUrl(effectId: string, category: string): string {
  return `https://raw.githubusercontent.com/AIEraDev/clypra-api/main/public/effect-previews/${category}/${effectId}.webm`;
}

/**
 * Convert effect metadata to API format with preview URL
 */
export function effectMetadataToApi(metadata: EffectMetadata): VideoEffectApiDefinition {
  const previewUrl = getEffectPreviewUrl(metadata.id, metadata.category);

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
    thumbnailUrl: generateThumbnailUrl(metadata.id),
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
    essentials: "Essential visual enhancements",
    glitch: "Digital glitches and VHS noise",
    retro: "Vintage film and nostalgic looks",
    light: "Lighting flares, glow, and leaks",
    motion: "Blur, camera movement, and speed",
    color: "Color corrections and grading",
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
