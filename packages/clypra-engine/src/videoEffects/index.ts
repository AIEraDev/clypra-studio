/**
 * Video Effects Module
 *
 * Exports effect renderers and types for video/body effects.
 * Shared between main app and Studio for consistent effect rendering.
 *
 * NOTE: Transitions have been moved to their own module @clypra/engine/transitions
 */

export { EffectRenderer } from "./EffectRenderer.js";
export { EffectGraph, type GraphDefinition } from "./EffectGraph.js";
export { EffectEngine } from "./EffectEngine.js";

// Export registry, utilities, and API integration
export * from "./effectsRegistry";
export * from "./utils";
export * from "./api";

// Re-export renderer functions for direct use
export * as CameraEffects from "./renderers/camera";
export * as LightEffects from "./renderers/light";

export type {
  // Effect types
  EffectCategory,
  EffectRenderer as EffectRendererType,
  EffectPreset,
  EffectParameters,

  // Overlay types
  OverlayAsset,

  // Filter types
  FilterAsset,

  // Applied effect types
  AppliedOverlay,
  AppliedEffect,

  // Shared types
  BlendMode,
  VideoEffectItem,
  VideoEffectCategory,
  VideoEffectManifest,
  VideoEffectState,
} from "./types";
