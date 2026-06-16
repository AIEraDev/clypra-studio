/**
 * Video Effects Module
 *
 * Exports effect renderers, transition renderers, and types for video effects.
 * Shared between main app and Studio for consistent effect rendering.
 */

export { EffectRenderer } from "./EffectRenderer";
export { TransitionRenderer } from "./TransitionRenderer";

export type {
  // Effect types
  EffectCategory,
  EffectRenderer as EffectRendererType,
  EffectPreset,
  EffectParameters,

  // Transition types
  TransitionRenderer as TransitionRendererType,
  TransitionPreset,
  TransitionParameters,

  // Overlay types
  OverlayAsset,

  // Filter types
  FilterAsset,

  // Applied effect types
  AppliedOverlay,
  AppliedEffect,
  AppliedTransition,

  // Shared types
  BlendMode,
  EasingFunction,
  VideoEffectItem,
  VideoEffectCategory,
  VideoEffectManifest,
  VideoEffectState,
} from "./types";
