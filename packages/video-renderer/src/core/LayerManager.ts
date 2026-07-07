/**
 * @clypra/video-renderer — LayerManager
 *
 * Manages all media overlay layers (video, image, text, stickers)
 * Handles frame-based lifecycle and garbage collection
 */

import * as PIXI from "pixi.js";
import type { Layer } from "../layers/Layer";

const RELEASE_AFTER_INACTIVE_FRAMES = 180; // ~3 seconds at 60 FPS

export interface LayerRecord {
  layer: Layer;
  sprite: PIXI.Sprite | PIXI.Container;
  lastSeenFrame: number;
  active: boolean;
}

export class LayerManager {
  private app: PIXI.Application;
  private layers = new Map<string, LayerRecord>();
  private currentFrame = 0;

  private baseContainer: PIXI.Container | null = null;
  private overlayContainer: PIXI.Container | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  /**
   * Set containers for different layer types
   */
  setContainers(containers: { base?: PIXI.Container; overlay?: PIXI.Container }): void {
    if (containers.base) {
      this.baseContainer = containers.base;
    }
    if (containers.overlay) {
      this.overlayContainer = containers.overlay;
    }
  }

  /**
   * Add a layer
   */
  addLayer(layer: Layer): void {
    if (this.layers.has(layer.id)) {
      console.warn(`[LayerManager] Layer ${layer.id} already exists`);
      return;
    }

    const container = this._getContainerForLayer(layer);
    if (!container) {
      console.error(`[LayerManager] No container available for layer ${layer.id}`);
      return;
    }

    // Create sprite based on layer type
    const sprite = layer.createSprite();
    container.addChild(sprite);

    // Apply initial transform
    this._applyTransform(sprite, layer);

    const record: LayerRecord = {
      layer,
      sprite,
      lastSeenFrame: this.currentFrame,
      active: true,
    };

    this.layers.set(layer.id, record);
    console.debug(`[LayerManager] Added layer ${layer.id} (${layer.type})`);
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): void {
    const record = this.layers.get(layerId);
    if (!record) return;

    const container = record.sprite.parent;
    if (container) {
      container.removeChild(record.sprite);
    }

    record.sprite.destroy();
    record.layer.destroy?.();

    this.layers.delete(layerId);
    console.debug(`[LayerManager] Removed layer ${layerId}`);
  }

  /**
   * Update a layer's properties
   */
  updateLayer(layerId: string, updates: Partial<Layer>): void {
    const record = this.layers.get(layerId);
    if (!record) return;

    Object.assign(record.layer, updates);
    this._applyTransform(record.sprite, record.layer);
  }

  /**
   * Update all layers (called per frame)
   */
  update(): void {
    this.currentFrame++;

    for (const [layerId, record] of this.layers.entries()) {
      // Update layer content if it has an update method
      if (record.layer.update) {
        record.layer.update();
      }

      // Mark as seen this frame
      record.lastSeenFrame = this.currentFrame;
      record.sprite.visible = true;

      // Reapply transform (in case layer properties changed)
      this._applyTransform(record.sprite, record.layer);
    }

    // Garbage collection: remove inactive layers
    this._garbageCollect();
  }

  /**
   * Garbage collect inactive layers
   */
  private _garbageCollect(): void {
    const toRemove: string[] = [];

    for (const [layerId, record] of this.layers.entries()) {
      const framesInactive = this.currentFrame - record.lastSeenFrame;

      if (framesInactive > RELEASE_AFTER_INACTIVE_FRAMES) {
        toRemove.push(layerId);
      }
    }

    for (const layerId of toRemove) {
      console.debug(`[LayerManager] Garbage collecting inactive layer ${layerId}`);
      this.removeLayer(layerId);
    }
  }

  /**
   * Apply transform from layer to sprite
   */
  private _applyTransform(sprite: PIXI.Sprite | PIXI.Container, layer: Layer): void {
    sprite.position.set(layer.x, layer.y);
    sprite.width = layer.width;
    sprite.height = layer.height;
    sprite.rotation = (layer.rotation * Math.PI) / 180;
    sprite.alpha = layer.opacity;
    sprite.zIndex = layer.zIndex || 0;

    if ("anchor" in sprite && sprite.anchor) {
      sprite.anchor.set(0.5);
    }
  }

  /**
   * Get appropriate container for layer type
   */
  private _getContainerForLayer(layer: Layer): PIXI.Container | null {
    if (layer.type === "video" || layer.type === "image") {
      return this.baseContainer;
    }
    return this.overlayContainer;
  }

  /**
   * Get layer count
   */
  getLayerCount(): number {
    return this.layers.size;
  }

  /**
   * Get all layers
   */
  getLayers(): Layer[] {
    return Array.from(this.layers.values()).map((r) => r.layer);
  }

  /**
   * Clean up
   */
  destroy(): void {
    for (const layerId of this.layers.keys()) {
      this.removeLayer(layerId);
    }
    this.layers.clear();
  }
}
