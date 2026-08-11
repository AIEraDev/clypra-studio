export * from "./smartOverlayTypes.js";
export * from "./SmartOverlayRenderer.js";
export * from "./presets.js";
export * from "./scratchBuilder.js";
export * from "./smartOverlayRegistry.js";
export * from "./overlayDocumentSchema.js";
export * from "./componentRegistry.js";
export * from "./dataBindingEngine.js";
export * from "./animationRuntime.js";
export * from "./pixiSceneProjection.js";
export * from "./pixiSelectionOverlay.js";
export * from "./commands/commandTypes.js";
export * from "./commands/commandExecutor.js";
export * from "./commands/commandHistory.js";
export * from "./viewport/viewportTransform.js";
export * from "./validation/validateDocument.js";
export * from "./validation/animationDiagnostics.js";
export * from "./migrations/migrateDocument.js";
export * from "./migrations/serializeTemplate.js";
export * from "./propertyInterpolator.js";
export * from "./propertyAnimationRegistry.js";
export * from "./motionPresetRegistry.js";
export * from "./canvas/snapping/snapEngine.js";
export * from "./layoutEngine.js";

// Phase 4I — Asset & Font Management
export * from "./assets/assetRegistry.js";
export * from "./assets/fontRegistry.js";
export * from "./assets/runtimeAssetResolver.js";

// Phase 4J — Responsive Layout
export * from "./responsiveResolver.js";

// Phase 4K / 4L — Production Export & Rendering Pipeline
export * from "./export/exportTypes.js";
export * from "./export/exportValidator.js";
export * from "./export/framePipeline.js";
export * from "./export/renderEngine.js";
export * from "./export/streamingFramePipeline.js";
export * from "./export/mediaEncoder.js";
export * from "./export/exportJob.js";
