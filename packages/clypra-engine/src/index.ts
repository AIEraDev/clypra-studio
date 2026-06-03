/**
 * @clypra/engine — Canvas 2D text effects, Lottie tooling, and animation engine.
 * @version 1.0.0
 */
export * from "./types.js";
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
export * from "./compositor/index.js";
// Platform capability detection and canvas utilities
export * from "./platform.js";
export * from "./canvas-utils.js";
// Procedural engines
export { InkBrushEngine } from "./engine/procedural/InkBrushEngine.js";
