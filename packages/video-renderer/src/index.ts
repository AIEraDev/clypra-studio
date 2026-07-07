/**
 * @clypra/video-renderer
 *
 * Professional PixiJS-based video rendering engine
 * Single source of truth for Clypra Editor and Studio
 */

// Core exports
export { VideoRenderer } from "./core/VideoRenderer";
export type { VideoRendererConfig, RenderStats } from "./core/VideoRenderer";

// Layers
export { Layer } from "./layers/Layer";
export { VideoLayer } from "./layers/VideoLayer";
export { ImageLayer } from "./layers/ImageLayer";
export { TextLayer } from "./layers/TextLayer";
export { StickerLayer } from "./layers/StickerLayer";

export type { LayerConfig } from "./layers/Layer";
export type { VideoLayerConfig } from "./layers/VideoLayer";
export type { ImageLayerConfig } from "./layers/ImageLayer";
export type { TextLayerConfig } from "./layers/TextLayer";
export type { StickerLayerConfig } from "./layers/StickerLayer";

// Managers (for advanced usage)
export { LayerManager } from "./core/LayerManager";
export { FilterManager } from "./core/FilterManager";
export { TransitionManager } from "./core/TransitionManager";
export { TexturePool } from "./core/TexturePool";

export type { LayerRecord } from "./core/LayerManager";
export type { FilterRecord } from "./core/FilterManager";
export type { TransitionConfig, Transition } from "./core/TransitionManager";
export type { TextureSpec } from "./core/TexturePool";

// Shader constants (for custom filters)
export { STANDARD_VERTEX_SHADER } from "./core/shaders";
