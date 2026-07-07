/**
 * @clypra/video-renderer — TextLayer
 *
 * Text overlay layer (Canvas2D → WebGL texture)
 */

import * as PIXI from "pixi.js";
import { Layer, type LayerConfig } from "./Layer";

export interface TextLayerConfig extends LayerConfig {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  stroke?: { color: string; width: number };
  shadow?: { blur: number; offsetX: number; offsetY: number; color: string };
}

export class TextLayer extends Layer {
  public text: string;
  public fontSize: number;
  public fontFamily: string;
  public color: string;
  public fontWeight: string;
  public textAlign: "left" | "center" | "right";
  public stroke?: { color: string; width: number };
  public shadow?: { blur: number; offsetX: number; offsetY: number; color: string };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private texture: PIXI.Texture | null = null;
  private lastText = "";

  constructor(config: TextLayerConfig) {
    super(config);
    this.text = config.text;
    this.fontSize = config.fontSize;
    this.fontFamily = config.fontFamily || "Arial";
    this.color = config.color || "#ffffff";
    this.fontWeight = config.fontWeight || "normal";
    this.textAlign = config.textAlign || "center";
    this.stroke = config.stroke;
    this.shadow = config.shadow;
  }

  createSprite(): PIXI.Sprite {
    // Create offscreen canvas for text rendering
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.ceil(this.width);
    this.canvas.height = Math.ceil(this.height);
    this.ctx = this.canvas.getContext("2d")!;

    // Render initial text
    this._renderText();

    // Create texture from canvas
    this.texture = PIXI.Texture.from(this.canvas);
    const sprite = new PIXI.Sprite(this.texture);

    return sprite;
  }

  update(): void {
    // Re-render if text changed
    if (this.text !== this.lastText) {
      this._renderText();
      if (this.texture) {
        this.texture.source.update();
      }
      this.lastText = this.text;
    }
  }

  private _renderText(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up text rendering
    ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.color;
    ctx.textBaseline = "middle";

    // Apply shadow if specified
    if (this.shadow) {
      ctx.shadowColor = this.shadow.color;
      ctx.shadowBlur = this.shadow.blur;
      ctx.shadowOffsetX = this.shadow.offsetX;
      ctx.shadowOffsetY = this.shadow.offsetY;
    }

    // Calculate text position
    let x = width / 2;
    if (this.textAlign === "left") {
      x = 0;
      ctx.textAlign = "left";
    } else if (this.textAlign === "right") {
      x = width;
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "center";
    }

    const y = height / 2;

    // Draw stroke if specified
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color;
      ctx.lineWidth = this.stroke.width;
      ctx.strokeText(this.text, x, y);
    }

    // Draw text
    ctx.fillText(this.text, x, y);
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy(true);
      this.texture = null;
    }
    this.canvas = null;
    this.ctx = null;
  }
}
