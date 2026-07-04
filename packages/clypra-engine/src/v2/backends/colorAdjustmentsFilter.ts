/**
 * V2 MPG — shared Color Adjustments filter factory (used by PixiRenderBackend).
 */

import type { Filter } from "pixi.js";
import { ColorAdjustmentsEffect } from "../../effects/light/ColorAdjustmentsEffect.js";

const spec = ColorAdjustmentsEffect.filterSpec!;

export function createColorAdjustmentsFilter(params: Record<string, unknown> = {}): Filter | Filter[] {
  return spec.create(params as any);
}

export function updateColorAdjustmentsFilter(filter: Filter, params: Record<string, unknown>): void {
  spec.updateUniforms(filter as any, params as any, 0);
}

/** Normalize partial uniforms into full ColorAdjustments param set */
export function normalizeColorAdjustmentsUniforms(uniforms: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return {
    exposure: uniforms.exposure ?? 0,
    brightness: uniforms.brightness ?? 0,
    contrast: uniforms.contrast ?? 0,
    saturation: uniforms.saturation ?? 0,
    temperature: uniforms.temperature ?? 0,
    tint: uniforms.tint ?? 0,
    sepia: uniforms.sepia ?? 0,
    grayscale: uniforms.grayscale ?? 0,
    hueRotate: uniforms.hueRotate ?? 0,
    vignette: uniforms.vignette ?? 0,
    invert: uniforms.invert ?? 0,
  };
}
