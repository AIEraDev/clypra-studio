/**
 * @clypra/video-renderer — VideoLayer
 *
 * Video overlay layer
 */

import * as PIXI from "pixi.js";
import { Layer, type LayerConfig } from "./Layer";

export interface VideoLayerConfig extends LayerConfig {
  type: "video";
  video: HTMLVideoElement;
  filters?: PIXI.Filter[];
}

export class VideoLayer extends Layer {
  public video: HTMLVideoElement;
  public filters: PIXI.Filter[];
  private texture: PIXI.Texture | null = null;

  constructor(config: VideoLayerConfig) {
    super(config);
    this.video = config.video;
    this.filters = config.filters || [];
  }

  createSprite(): PIXI.Sprite {
    const source = new PIXI.VideoSource({
      resource: this.video,
      autoPlay: false,
    });

    this.texture = new PIXI.Texture({ source });
    const sprite = new PIXI.Sprite(this.texture);

    if (this.filters.length > 0) {
      sprite.filters = this.filters;
    }

    return sprite;
  }

  update(): void {
    // Update video texture
    if (this.texture && this.video.readyState >= 2) {
      this.texture.source.update();
    }
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy(true);
      this.texture = null;
    }
  }
}
