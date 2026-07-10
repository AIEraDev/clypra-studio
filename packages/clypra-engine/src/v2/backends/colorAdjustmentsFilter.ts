/**
 * V2 MPG — shared Color Adjustments filter factory (used by PixiRenderBackend).
 */

import type { Filter } from "pixi.js";
import type { ParamValues } from "../../videoEffects/EffectDefinition.js";
import { ColorAdjustmentsEffect } from "../../effects/light/ColorAdjustmentsEffect.js";

const spec = ColorAdjustmentsEffect.filterSpec!;

export function createColorAdjustmentsFilter(params: Record<string, unknown> = {}): Filter | Filter[] {
  return spec.create(params as ParamValues);
}

export function updateColorAdjustmentsFilter(filter: Filter, params: Record<string, unknown>): void {
  spec.updateUniforms(filter, params as ParamValues, 0);
}

/** Normalize partial uniforms into full ColorAdjustments param set */
export function normalizeColorAdjustmentsUniforms(uniforms: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return {
    // ── Existing ────────────────────────────────────────────────────────────
    exposure:    uniforms.exposure    ?? 0,
    brightness:  uniforms.brightness  ?? 0,
    contrast:    uniforms.contrast    ?? 0,
    saturation:  uniforms.saturation  ?? 0,
    temperature: uniforms.temperature ?? 0,
    tint:        uniforms.tint        ?? 0,
    sepia:       uniforms.sepia       ?? 0,
    grayscale:   uniforms.grayscale   ?? 0,
    hueRotate:   uniforms.hueRotate   ?? 0,
    vignette:    uniforms.vignette    ?? 0,
    invert:      uniforms.invert      ?? 0,
    // ── NEW: Lift ────────────────────────────────────────────────────────────
    lift:                      uniforms.lift                      ?? 0,
    // ── NEW: Split-toning ────────────────────────────────────────────────────
    shadowTintR:               uniforms.shadowTintR               ?? 1.0,
    shadowTintG:               uniforms.shadowTintG               ?? 1.0,
    shadowTintB:               uniforms.shadowTintB               ?? 1.0,
    shadowTintStrength:        uniforms.shadowTintStrength        ?? 0,
    highlightTintR:            uniforms.highlightTintR            ?? 1.0,
    highlightTintG:            uniforms.highlightTintG            ?? 1.0,
    highlightTintB:            uniforms.highlightTintB            ?? 1.0,
    highlightTintStrength:     uniforms.highlightTintStrength     ?? 0,
    splitBalance:              uniforms.splitBalance              ?? 0.5,
    // ── NEW: Film grain ──────────────────────────────────────────────────────
    grainIntensity:            uniforms.grainIntensity            ?? 0,
    grainSize:                 uniforms.grainSize                 ?? 1.0,
    // ── NEW: Channel-mix B&W ─────────────────────────────────────────────────
    channelMixR:               uniforms.channelMixR               ?? 0,
    channelMixG:               uniforms.channelMixG               ?? 0,
    channelMixB:               uniforms.channelMixB               ?? 0,
    useChannelMix:             uniforms.useChannelMix             ?? 0,
    // ── NEW: Duotone ─────────────────────────────────────────────────────────
    duotoneDarkR:              uniforms.duotoneDarkR              ?? 0,
    duotoneDarkG:              uniforms.duotoneDarkG              ?? 0,
    duotoneDarkB:              uniforms.duotoneDarkB              ?? 0,
    duotoneLightR:             uniforms.duotoneLightR             ?? 1.0,
    duotoneLightG:             uniforms.duotoneLightG             ?? 1.0,
    duotoneLightB:             uniforms.duotoneLightB             ?? 1.0,
    useDuotone:                uniforms.useDuotone                ?? 0,
    // ── NEW: Vibrance ────────────────────────────────────────────────────────
    vibranceAmount:            uniforms.vibranceAmount            ?? 0,
    vibranceProtectedHueR:     uniforms.vibranceProtectedHueR     ?? 0.91,
    vibranceProtectedHueG:     uniforms.vibranceProtectedHueG     ?? 0.69,
    vibranceProtectedHueB:     uniforms.vibranceProtectedHueB     ?? 0.55,
    // ── NEW: Cross-process ───────────────────────────────────────────────────
    crossProcessAmount:        uniforms.crossProcessAmount        ?? 0,
  };
}

