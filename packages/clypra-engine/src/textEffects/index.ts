/**
 * @clypra/engine/textEffects — Canvas 2D text effects subpath.
 */
export { evaluateScene } from "../engine/evaluate.js";
export { textEffectConfigToScene, sceneToConfig, _buildConfig, resolveFontFamilyName } from "../engine/migrate.js";
export { defaultConfig, builtInPresets } from "../presets.js";
export { renderTextEffectCore } from "../renderer.js";
export { FontLoader, getFontLoader, resetFontLoader, ensureFontsLoaded } from "../fontLoader.js";
export type { TextEffectConfig, TextEffectDefinition } from "../types.js";
export type { SceneDocument } from "../engine/schema.js";
export type { FontDescriptor, FontLoadResult } from "../fontLoader.js";
