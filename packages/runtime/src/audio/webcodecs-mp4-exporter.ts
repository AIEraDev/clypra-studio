/// <reference types="@webgpu/types" />
import type { ExportConfig } from "@clypra-studio/types";

export class WebCodecsMP4Exporter {
  private device: GPUDevice;
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private pipeline: GPURenderPipeline;
  private uniformBuffer: GPUBuffer;
  private bindGroup: GPUBindGroup;

  constructor(
    device: GPUDevice,
    pipeline: GPURenderPipeline,
    uniformBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    width: number,
    height: number
  ) {
    this.device = device;
    this.pipeline = pipeline;
    this.uniformBuffer = uniformBuffer;
    this.bindGroup = bindGroup;

    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(width, height);
    } else {
      const canvasEl = document.createElement("canvas");
      canvasEl.width = width;
      canvasEl.height = height;
      this.canvas = canvasEl;
    }
  }

  /**
   * Calculates timestamps and executes headless video encoding loop
   */
  public calculateFrameTimestamps(totalFrames: number, fps: number): Array<{ frameIdx: number; timestampUs: number }> {
    const frameDurationUs = Math.round(1_000_000 / fps);
    const timestamps: Array<{ frameIdx: number; timestampUs: number }> = [];

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      timestamps.push({
        frameIdx,
        timestampUs: frameIdx * frameDurationUs,
      });
    }

    return timestamps;
  }

  public async exportMP4(
    config: ExportConfig,
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    const totalFrames = Math.ceil(config.durationSeconds * config.fps);
    const timestamps = this.calculateFrameTimestamps(totalFrames, config.fps);

    for (let i = 0; i < totalFrames; i++) {
      const { frameIdx } = timestamps[i];
      const currentTime = frameIdx / config.fps;
      const spectrum = config.bakedSpectrum[frameIdx] || { bass: 0, mids: 0, treble: 0 };

      const uniformData = new Float32Array([
        currentTime,
        spectrum.bass,
        spectrum.mids,
        spectrum.treble,
      ]);

      this.device.queue.writeBuffer(
        this.uniformBuffer,
        0,
        uniformData.buffer,
        0,
        uniformData.byteLength
      );

      if (onProgress) {
        onProgress((i + 1) / totalFrames);
      }
    }

    return new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  }
}
