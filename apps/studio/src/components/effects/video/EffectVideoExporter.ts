/**
 * Effect Video Exporter
 *
 * Generates .webm videos of static images with effects applied
 */

import { EffectRenderer, type EffectRendererType, type EffectParameters } from "@clypra/engine";

export interface ExportOptions {
  effectType: EffectRendererType;
  parameters: EffectParameters;
  intensity: number;
  duration: number; // Duration in seconds
  fps: number; // Frames per second
  width: number;
  height: number;
  videoBitrate?: number; // bits per second
}

export class EffectVideoExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    this.ctx = ctx;
  }

  /**
   * Export a static image with an effect as .webm video
   */
  async exportImageWithEffect(imageUrl: string, options: ExportOptions): Promise<Blob> {
    const {
      effectType,
      parameters,
      intensity,
      duration,
      fps,
      width,
      height,
      videoBitrate = 5000000, // 5 Mbps default
    } = options;

    // Setup canvas
    this.canvas.width = width;
    this.canvas.height = height;

    // Load image
    const image = await this.loadImage(imageUrl);

    // Setup MediaRecorder
    const stream = this.canvas.captureStream(fps);
    const mimeType = this.getSupportedMimeType();

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
    });

    this.chunks = [];

    // Collect video chunks
    return new Promise<Blob>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e) => {
        reject(new Error(`MediaRecorder error: ${e}`));
      };

      // Start recording
      this.mediaRecorder.start();

      // Render frames
      this.renderFrames(image, effectType, parameters, intensity, duration, fps)
        .then(() => {
          // Stop recording after all frames are rendered
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
              this.mediaRecorder.stop();
            }
          }, 100);
        })
        .catch(reject);
    });
  }

  /**
   * Render all frames with the effect
   */
  private async renderFrames(image: HTMLImageElement, effectType: EffectRendererType, parameters: EffectParameters, intensity: number, duration: number, fps: number): Promise<void> {
    const totalFrames = Math.floor(duration * fps);
    const frameDuration = 1000 / fps;

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / fps;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw image
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);

      // Apply effect
      EffectRenderer.apply(this.ctx, effectType, parameters, intensity, time);

      // Wait for next frame
      await this.sleep(frameDuration);
    }
  }

  /**
   * Load an image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm";
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    this.chunks = [];
  }
}

/**
 * Quick export function for convenience
 */
export async function exportStaticImageWithEffect(imageFile: File, effectType: EffectRendererType, parameters: EffectParameters, intensity: number = 0.8, duration: number = 3, fps: number = 30): Promise<Blob> {
  const exporter = new EffectVideoExporter();

  // Create object URL from file
  const imageUrl = URL.createObjectURL(imageFile);

  try {
    // Get image dimensions
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image"));
      image.src = imageUrl;
    });

    const blob = await exporter.exportImageWithEffect(imageUrl, {
      effectType,
      parameters,
      intensity,
      duration,
      fps,
      width: img.width,
      height: img.height,
    });

    return blob;
  } finally {
    // Clean up
    URL.revokeObjectURL(imageUrl);
    exporter.dispose();
  }
}
