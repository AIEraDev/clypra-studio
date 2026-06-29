/**
 * @clypra/engine — Canvas 2D text effects, Lottie tooling, and animation engine.
 * @version 2.0.1
 */
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

// Declarative Canvas Templates (NEW)
export * from "./templates/TemplateRenderer.js";
export * from "./templates/presets.js";
export * from "./templates/keyframes.js";

// Pipeline V2 (Media Processing Graph & Render Planner)
export * from "./v2/project/types.js";
export * from "./v2/graph/types.js";
export * from "./v2/graph/NodeRegistry.js";
export * from "./v2/planner/types.js";
export * from "./v2/runtime/types.js";
export * from "./v2/runtime/NullBackend.js";
export * from "./v2/compiler/ProjectCompiler.js";
export * from "./v2/planner/FrameGraphBuilder.js";
export * from "./v2/validation/GraphValidator.js";
export * from "./v2/runtime/CommandBufferBuilder.js";
export { MPGFrameRenderer, type FrameSource } from "./v2/runtime/MPGFrameRenderer.js";
export * from "./v2/backends/index.js";
