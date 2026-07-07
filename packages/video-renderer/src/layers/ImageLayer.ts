/**
 * @clypra/video-renderer — ImageLayer
 *
 * Image overlay layer
 */

import * as PIXI from "pixi.js";
import { Layer, type LayerConfig } from "./Layer";

export interface ImageLayerConfig extends LayerConfig {
  type: "image";
  image: HTMLImageElement | HTMLCanvasElement;
  filters?: PIXI.Filter[];
}

export class ImageLayer extends Layer {
  public image: HTMLImageElement | HTMLCanvasElement;
  public filters: PIXI.Filter[];
  private texture: PIXI.Texture | null = null;

  constructor(config: ImageLayerConfig) {
    super(config);
    this.image = config.image;
    this.filters = config.filters || [];
  }

  createSprite(): PIXI.Sprite {
    this.texture = PIXI.Texture.from(this.image);
    const sprite = new PIXI.Sprite(this.texture);

    if (this.filters.length > 0) {
      sprite.filters = this.filters;
    }

    return sprite;
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy(true);
      this.texture = null;
    }
  }
}
