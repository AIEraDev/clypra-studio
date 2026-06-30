/**
 * @clypra/feature-providers — Chroma Key Provider
 *
 * Color-based masking (green screen, blue screen, etc.)
 */

import type { FeatureProvider, FeatureMap, FeatureMapType, VideoFrame, ProviderConfig } from "../types";

/**
 * Chroma Key Provider
 *
 * Extracts masks based on color keying (e.g., green screen removal)
 */
export class ChromaKeyProvider implements FeatureProvider {
  id = "chroma-key";
  name = "Chroma Key";
  outputs: FeatureMapType[] = ["mask" as FeatureMapType];

  config: ProviderConfig = {
    keyColor: {
      type: "color",
      default: "#00FF00",
      label: "Key Color",
    },
    threshold: {
      type: "number",
      min: 0,
      max: 1,
      default: 0.4,
      label: "Threshold",
    },
    smoothness: {
      type: "number",
      min: 0,
      max: 1,
      default: 0.2,
      label: "Edge Smoothness",
    },
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private keyColor = { r: 0, g: 255, b: 0 };
  private threshold = 0.4;
  private smoothness = 0.2;

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!this.ctx) {
      throw new Error("Failed to create canvas context");
    }
  }

  /**
   * Process a video frame
   */
  async process(frame: VideoFrame): Promise<FeatureMap[]> {
    if (!this.canvas || !this.ctx) {
      throw new Error("Provider not initialized");
    }

    // Get frame dimensions
    const width = frame instanceof HTMLVideoElement ? frame.videoWidth : frame.width;
    const height = frame instanceof HTMLVideoElement ? frame.videoHeight : frame.height;

    // Resize canvas if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // Draw frame to canvas
    this.ctx.drawImage(frame as any, 0, 0, width, height);

    // Get image data
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply chroma key
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate color distance
      const distance = this.colorDistance(r, g, b, this.keyColor.r, this.keyColor.g, this.keyColor.b);

      // Calculate alpha based on distance
      let alpha = 1.0;
      if (distance < this.threshold) {
        // Within threshold - transparent
        alpha = 0.0;
      } else if (distance < this.threshold + this.smoothness) {
        // Edge smoothing
        alpha = (distance - this.threshold) / this.smoothness;
      }

      // Set alpha channel (mask)
      data[i + 3] = Math.floor(alpha * 255);
    }

    // Put processed data back
    this.ctx.putImageData(imageData, 0, 0);

    return [
      {
        type: "mask" as FeatureMapType,
        data: {
          type: "mask",
          texture: this.canvas,
          isBinary: false,
          inverted: false,
        },
        metadata: {
          keyColor: this.keyColor,
          threshold: this.threshold,
          smoothness: this.smoothness,
        },
      },
    ];
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Record<string, any>): void {
    if (config.keyColor) {
      this.keyColor = this.hexToRgb(config.keyColor);
    }
    if (config.threshold !== undefined) {
      this.threshold = config.threshold;
    }
    if (config.smoothness !== undefined) {
      this.smoothness = config.smoothness;
    }
  }

  /**
   * Calculate color distance (Euclidean)
   */
  private colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    const dr = (r1 - r2) / 255;
    const dg = (g1 - g2) / 255;
    const db = (b1 - b2) / 255;
    return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 0 };
  }
}
