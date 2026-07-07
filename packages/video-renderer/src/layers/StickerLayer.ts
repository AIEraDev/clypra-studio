/**
 * @clypra/video-renderer — StickerLayer
 *
 * Lottie animation sticker layer (Lottie → Canvas2D → WebGL texture)
 */

import * as PIXI from "pixi.js";
import lottie from "lottie-web";
import { Layer, type LayerConfig } from "./Layer";

export interface StickerLayerConfig extends LayerConfig {
  type: "sticker";
  animationPath: string;
  animationData?: any;
  speed?: number;
  loop?: boolean;
}

export class StickerLayer extends Layer {
  public animationPath: string;
  public animationData?: any;
  public speed: number;
  public loop: boolean;

  private canvas: HTMLCanvasElement | null = null;
  private container: HTMLDivElement | null = null;
  private animation: any = null;
  private texture: PIXI.Texture | null = null;
  private currentFrame = 0;

  constructor(config: StickerLayerConfig) {
    super(config);
    this.animationPath = config.animationPath;
    this.animationData = config.animationData;
    this.speed = config.speed ?? 1.0;
    this.loop = config.loop ?? true;
  }

  createSprite(): PIXI.Sprite {
    // Create offscreen container for Lottie
    this.container = document.createElement("div");
    this.container.style.width = `${this.width}px`;
    this.container.style.height = `${this.height}px`;
    this.container.style.position = "absolute";
    this.container.style.left = "-9999px";
    this.container.style.top = "-9999px";
    document.body.appendChild(this.container);

    // Initialize Lottie animation
    this.animation = lottie.loadAnimation({
      container: this.container,
      renderer: "canvas",
      autoplay: false,
      loop: this.loop,
      animationData: this.animationData,
      path: this.animationData ? undefined : this.animationPath,
    });

    // Wait for animation to load
    this.animation.addEventListener("DOMLoaded", () => {
      this.canvas = this.container!.querySelector("canvas") as HTMLCanvasElement;

      if (this.canvas) {
        this.texture = PIXI.Texture.from(this.canvas);
      }
    });

    // Create sprite with empty texture initially
    const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);

    return sprite;
  }

  update(): void {
    if (!this.animation || !this.texture) return;

    // Update animation frame
    this.currentFrame += this.speed;

    const totalFrames = this.animation.totalFrames;
    if (this.loop) {
      this.currentFrame = this.currentFrame % totalFrames;
    } else {
      this.currentFrame = Math.min(this.currentFrame, totalFrames - 1);
    }

    this.animation.goToAndStop(Math.floor(this.currentFrame), true);

    // Update texture
    if (this.canvas) {
      this.texture.source.update();
    }
  }

  destroy(): void {
    if (this.animation) {
      try {
        this.animation.destroy();
      } catch (e) {
        // Safe destroy
      }
      this.animation = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    if (this.texture) {
      this.texture.destroy(true);
      this.texture = null;
    }

    this.canvas = null;
  }
}
