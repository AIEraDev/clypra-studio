/**
 * @clypra/runtime — Pixi Filter Utilities
 *
 * Helper functions for creating and configuring Pixi filters.
 */

import * as PIXI from "pixi.js";
import { AdjustmentFilter } from "pixi-filters";

/**
 * Create a filter for a given shader ID
 */
export function createFilter(shaderId: string, uniforms: Record<string, any> = {}): PIXI.Filter {
  switch (shaderId) {
    case "identity":
      // Pure pass-through - no modifications
      return new AdjustmentFilter({
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        red: 1.0,
        green: 1.0,
        blue: 1.0,
      });

    case "brightness":
      return new AdjustmentFilter({ brightness: uniforms.brightness ?? 1.0 });

    case "contrast":
      return new AdjustmentFilter({ contrast: uniforms.contrast ?? 1.0 });

    case "saturation":
      return new AdjustmentFilter({ saturation: uniforms.saturation ?? 1.0 });

    case "gaussian-blur":
    case "gaussian-blur-h":
    case "gaussian-blur-v":
      return new PIXI.BlurFilter({
        strength: uniforms.strength ?? 8,
        quality: uniforms.quality ?? 4,
      });

    case "color-adjustments":
      return new AdjustmentFilter({
        brightness: uniforms.brightness ?? 1.0,
        contrast: uniforms.contrast ?? 1.0,
        saturation: uniforms.saturation ?? 1.0,
        red: uniforms.red ?? 1.0,
        green: uniforms.green ?? 1.0,
        blue: uniforms.blue ?? 1.0,
      });

    case "copy":
    case "blit":
      // No-op filter
      return new AdjustmentFilter({ brightness: 1, contrast: 1, saturation: 1 });

    default:
      // Default adjustment filter
      return new AdjustmentFilter({});
  }
}

/**
 * Update filter uniforms
 */
export function updateFilterUniforms(filter: PIXI.Filter, uniforms: Record<string, any>, shaderId?: string): void {
  if (filter instanceof AdjustmentFilter) {
    if (uniforms.brightness !== undefined) {
      filter.brightness = Number(uniforms.brightness);
    }
    if (uniforms.contrast !== undefined) {
      filter.contrast = Number(uniforms.contrast);
    }
    if (uniforms.saturation !== undefined) {
      filter.saturation = Number(uniforms.saturation);
    }
    if (uniforms.red !== undefined) {
      filter.red = Number(uniforms.red);
    }
    if (uniforms.green !== undefined) {
      filter.green = Number(uniforms.green);
    }
    if (uniforms.blue !== undefined) {
      filter.blue = Number(uniforms.blue);
    }
  } else if (filter instanceof PIXI.BlurFilter) {
    if (uniforms.strength !== undefined) {
      filter.strength = Number(uniforms.strength);
    }
    if (uniforms.quality !== undefined) {
      filter.quality = Number(uniforms.quality);
    }
  }
}

/**
 * Normalize color adjustment uniforms
 */
export function normalizeColorUniforms(uniforms: Record<string, any>): Record<string, number> {
  return {
    brightness: uniforms.brightness !== undefined ? 1.0 + Number(uniforms.brightness) : 1.0,
    contrast: uniforms.contrast !== undefined ? 1.0 + Number(uniforms.contrast) : 1.0,
    saturation: uniforms.saturation !== undefined ? 1.0 + Number(uniforms.saturation) : 1.0,
    red: uniforms.red ?? 1.0,
    green: uniforms.green ?? 1.0,
    blue: uniforms.blue ?? 1.0,
  };
}
