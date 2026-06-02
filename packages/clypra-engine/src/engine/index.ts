export * from "./schema";
export * from "./migrate";
export * from "./evaluate";
export * from "./animation";
export * from "./recipes";
export * from "./blend";
export * from "./mask";
export * from "./export";
export * from "./timelineDefaults";
export * from "./animatableParams";
export * from "./timelineMutations";
export * from "./perCharFill";
export * from "./history";
export * from "./textLayout";
// Lottie text animation presets
export { LOTTIE_ANIM_PRESETS, ENTRANCE_PRESETS, EXIT_PRESETS, LOOP_PRESETS, EMPHASIS_PRESETS, bakeAnimationIntoLayer, clearAnimationFromLayer, getAnimPreset } from "./lottieTextAnimations";
export type { LottieAnimPreset, AnimationCategory, AnimBuildOpts, AnimTrackDef, AnimKeyframe } from "./lottieTextAnimations";
// Lottie per-layer text style engine
export { hexToLottieColor, lottieColorToHex, buildLottieFontName, alignToLottieJ, lottieJToAlign, readStyleFromLottieLayer, applyStyleToLottieLayer, applyStyleToLottie, ensureFontInLottie, buildFontEntries, SUPPORTED_FONT_FAMILIES, FONT_WEIGHT_OPTIONS, DEFAULT_TEXT_STYLE } from "./lottieTextStyle";
export type { TextLayerStyle, TextAlign, FillType, GradientDir, LottieFontEntry } from "./lottieTextStyle";
// Lottie template presets
export { LOTTIE_TEMPLATE_PRESETS, TEMPLATE_CATEGORIES, getTemplatePreset, getTemplatesByCategory } from "./lottieTemplatePresets";
export type { LottieTemplatePreset, TemplatePresetCategory } from "./lottieTemplatePresets";
// Lottie export (dotLottie, JSON, GIF)
export { buildDotLottie, downloadDotLottie, downloadLottieJson, captureLottieFrames, encodeGif } from "./lottieExport";
export type { DotLottieManifest, GifExportOptions, GifFrame } from "./lottieExport";
// Lottie Google Fonts loader
export { scanLottieFonts, loadLottieFonts, waitForFontsReady, preloadGoogleFont, clearFontCache } from "./lottieGoogleFonts";
export type { LottieFontUsage } from "./lottieGoogleFonts";
// Lottie injector (text, style, color, batch)
export { injectText, injectTextStyle, injectGlobalTextStyle, injectColor, injectSolidColor, injectBatch, hexToLottieRgb } from "./lottieInjector";
export type { TextLayerConfig, TextCustomization, TextStyleOverride, BatchInjection } from "./lottieInjector";
