/**
 * @clypra-studio/engine — Canvas 2D text effects, Lottie tooling, and animation engine.
 * @version 0.1.0
 * @packageDocumentation
 */

/** Package version */
export const VERSION = "0.1.0";

export * from "./types.js";
export * from "./validation.js";
export * from "./renderer.js";
export * from "./presets.js";
export * from "./fontLoader.js";
export * from "./engine/schema.js";
export * from "./engine/migrate.js";
export * from "./engine/evaluate.js";
export * from "./engine/animation.js";
export * from "./engine/textLayout.js";
export * from "./engine/recipes.js";
export * from "./engine/perCharFill.js";
export * from "./engine/lottieEditor.js";
export * from "./engine/lottieParser.js";
export * from "./engine/lottieInjector.js";
export * from "./engine/lottieTextAnimations.js";
export * from "./engine/lottieTextStyle.js";
export * from "./engine/lottieTemplatePresets.js";
export * from "./engine/lottieExport.js";
export * from "./engine/export.js";
export * from "./engine/lottieGoogleFonts.js";
export * from "./engine/animatableParams.js";
export * from "./engine/blend.js";
export * from "./engine/history.js";
export * from "./engine/mask.js";
export * from "./engine/timelineDefaults.js";
export * from "./engine/timelineMutations.js";
export * from "./engine/api.js";
export * from "./compositor/index.js";
// Platform capability detection and canvas utilities
export * from "./platform.js";
export * from "./canvas-utils.js";
// Procedural engines
export { InkBrushEngine } from "./engine/procedural/InkBrushEngine.js";

// Video & Body Effects (NEW)
export * from "./videoEffects";
export * from "./effects/index.js";
export * from "./bodyEffects";

// Transitions (NEW - separated from videoEffects for clarity)
export * from "./transitions";
export * from "./types/TransitionDefinition.js";

// Declarative Canvas Templates (NEW)
export * from "./templates/TemplateRenderer.js";
export * from "./templates/presets.js";
export * from "./templates/keyframes.js";

// Pipeline V2 (Media Processing Graph & Render Planner)
// Note: AssetKind is already exported from ./smartOverlays/index.js (overlayDocumentSchema).
// Exclude it here to resolve DTS ambiguity; the v2 AssetKind variant ("lut"|"model") is
// more extensive but not used in the smart-overlay runtime path.
export type { AssetHandle, ClipSegment, EffectInstance, TrackDefinition, ProjectManifestV2 } from "./v2/project/types.js";
export { ProjectHelper } from "./v2/project/types.js";
export * from "./v2/graph/types.js";
export * from "./v2/graph/NodeRegistry.js";
export type {
  ExecutionQuality,
  PlaybackMode,
  PlaybackDirection,
  ExecutionPolicy,
  Command as V2Command,
  CommandBuffer,
  RenderBackend,
} from "./v2/runtime/types.js";
export * from "./v2/runtime/NullBackend.js";
export * from "./v2/compiler/ProjectCompiler.js";
export * from "./v2/planner/FrameGraphBuilder.js";
export * from "./v2/validation/GraphValidator.js";
export * from "./v2/runtime/CommandBufferBuilder.js";
export { MPGFrameRenderer, type FrameSource } from "./v2/runtime/MPGFrameRenderer.js";
export * from "./v2/backends/index.js";

// Shared Preview/Compositor Utilities (NEW)
export * from "./renderer/sharedPixiRenderer.js";
export * from "./media/mediaLayout.js";
export * from "./media/mediaSpriteFactory.js";
export * from "./media/conform.js";
export * from "./media/sourceCapture.js";
export * from "./text/textBridge.js";
export * from "./stickers/stickerBridge.js";
export * from "./effects/body/bodyEffectFilters.js";
export * from "./effects/body/bodyEffectMask.js";
export * from "./overlays/index.js";
export * from "./smartOverlays/index.js";
