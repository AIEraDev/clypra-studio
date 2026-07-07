/**
 * @clypra/video-renderer — Layer Base
 *
 * Abstract base class for all media layers
 */

import * as PIXI from "pixi.js";

export interface LayerConfig {
  id: string;
  type: "video" | "image" | "text" | "sticker";
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
}

export abstract class Layer {
  public id: string;
  public type: "video" | "image" | "text" | "sticker";
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public opacity: number;
  public rotation: number;
  public zIndex: number;

  constructor(config: LayerConfig) {
    this.id = config.id;
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.opacity = config.opacity ?? 1.0;
    this.rotation = config.rotation ?? 0;
    this.zIndex = config.zIndex ?? 0;
  }

  /**
   * Create the PixiJS sprite for this layer
   */
  abstract createSprite(): PIXI.Sprite | PIXI.Container;

  /**
   * Update layer (called per frame)
   */
  update?(): void;

  /**
   * Destroy layer resources
   */
  destroy?(): void;
}
