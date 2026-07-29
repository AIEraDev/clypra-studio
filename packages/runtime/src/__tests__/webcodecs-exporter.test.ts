import { describe, it, expect, vi } from "vitest";
import { WebCodecsMP4Exporter } from "../audio/webcodecs-mp4-exporter";
import type { ExportConfig } from "@clypra-studio/types";

describe("WebCodecsMP4Exporter — Headless MP4 Exporter", () => {
  it("should calculate exact frame timestamps in microseconds for 60fps export", () => {
    const mockDevice = {
      queue: { writeBuffer: vi.fn() },
    } as unknown as GPUDevice;

    const exporter = new WebCodecsMP4Exporter(
      mockDevice,
      {} as GPURenderPipeline,
      {} as GPUBuffer,
      {} as GPUBindGroup,
      1920,
      1080
    );

    const timestamps = exporter.calculateFrameTimestamps(60, 60);

    expect(timestamps).toHaveLength(60);
    expect(timestamps[0].frameIdx).toBe(0);
    expect(timestamps[0].timestampUs).toBe(0);
    expect(timestamps[1].frameIdx).toBe(1);
    expect(timestamps[1].timestampUs).toBe(16667); // 1,000,000 / 60
  });

  it("should process frames and write spectrum uniform data to WebGPU VRAM", async () => {
    const mockWriteBuffer = vi.fn();
    const mockDevice = {
      queue: { writeBuffer: mockWriteBuffer },
    } as unknown as GPUDevice;

    const exporter = new WebCodecsMP4Exporter(
      mockDevice,
      {} as GPURenderPipeline,
      {} as GPUBuffer,
      {} as GPUBindGroup,
      640,
      360
    );

    const config: ExportConfig = {
      width: 640,
      height: 360,
      fps: 30,
      bitrate: 5_000_000,
      durationSeconds: 1.0,
      bakedSpectrum: Array.from({ length: 30 }, (_, i) => ({
        frameIndex: i,
        timestamp: i / 30,
        bass: 0.5,
        mids: 0.3,
        treble: 0.1,
        rawBins: new Float32Array(256),
      })),
    };

    const progressCallback = vi.fn();
    const mp4Bytes = await exporter.exportMP4(config, progressCallback);

    expect(mp4Bytes).toBeDefined();
    expect(mockWriteBuffer).toHaveBeenCalledTimes(30);
    expect(progressCallback).toHaveBeenCalledWith(1.0);
  });
});
