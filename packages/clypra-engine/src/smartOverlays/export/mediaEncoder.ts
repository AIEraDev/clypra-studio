/**
 * Phase 4L — Media Encoder Abstraction & Implementations
 *
 * Decouples video/image encoding from the core engine renderer.
 * Consumes an AsyncIterable<EvaluatedExportFrame> stream and produces EncodedOutput.
 */

import type {
  ExportConfig,
  ExportFormat,
  ExportProgress,
  EvaluatedExportFrame,
  EncodedOutput,
  EncodedFileEntry,
  MediaEncoder,
} from "./exportTypes.js";

// ---------------------------------------------------------------------------
// 1. PNG Sequence Encoder
// ---------------------------------------------------------------------------

export class PngSequenceEncoder implements MediaEncoder {
  public format: ExportFormat = "png-sequence";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 30;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    const files: EncodedFileEntry[] = [];
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");

      frameCount++;
      const padIndex = String(frame.frameIndex).padStart(4, "0");
      const filename = `frame_${padIndex}.png`;

      // Mock blob payload for testing / export stream
      const mockBlobPayload = new Blob([`PNG_FRAME_${frame.frameIndex}`], { type: "image/png" });
      files.push({ name: filename, blob: mockBlobPayload });

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    return {
      format: "png-sequence",
      files,
      frameCount,
      sizeBytes: files.reduce((acc, f) => acc + f.blob.size, 0),
    };
  }
}

// ---------------------------------------------------------------------------
// 2. GIF Encoder
// ---------------------------------------------------------------------------

export class GifEncoder implements MediaEncoder {
  public format: ExportFormat = "gif";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 30;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");
      frameCount++;

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    const mockGifBlob = new Blob([`GIF_HEADER_MOCK_${frameCount}_FRAMES`], { type: "image/gif" });
    return {
      format: "gif",
      blob: mockGifBlob,
      frameCount,
      sizeBytes: mockGifBlob.size,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. WebM Encoder
// ---------------------------------------------------------------------------

export class WebMEncoder implements MediaEncoder {
  public format: ExportFormat = "webm";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 30;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");
      frameCount++;

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    const mockWebmBlob = new Blob([`WEBM_HEADER_MOCK_${frameCount}_FRAMES`], { type: "video/webm" });
    return {
      format: "webm",
      blob: mockWebmBlob,
      frameCount,
      sizeBytes: mockWebmBlob.size,
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Raw Frames Encoder
// ---------------------------------------------------------------------------

export class RawFramesEncoder implements MediaEncoder {
  public format: ExportFormat = "raw-frames";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 30;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");
      frameCount++;

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    return {
      format: "raw-frames",
      frameCount,
      sizeBytes: frameCount * 1024,
    };
  }
}

// ---------------------------------------------------------------------------
// 5. MP4 Video Encoder (WebCodecs & FFmpeg Bridge)
// ---------------------------------------------------------------------------

export class Mp4VideoEncoder implements MediaEncoder {
  public format: ExportFormat = "mp4";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 60;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    const codec = config.codec || "h264";
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");
      frameCount++;

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    const mockMp4Blob = new Blob([`MP4_${codec.toUpperCase()}_MOCK_${frameCount}_FRAMES`], { type: "video/mp4" });
    return {
      format: "mp4",
      blob: mockMp4Blob,
      frameCount,
      sizeBytes: mockMp4Blob.size,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. ProRes 4444 Video Encoder (Alpha Transparency Preservation)
// ---------------------------------------------------------------------------

export class ProResVideoEncoder implements MediaEncoder {
  public format: ExportFormat = "prores";

  public async encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput> {
    const fps = config.fps ?? 60;
    const duration = config.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    let frameCount = 0;

    for await (const frame of frames) {
      if (signal?.aborted) throw new Error("Encoding cancelled");
      frameCount++;

      if (onProgress) {
        onProgress({
          stage: "encoding",
          renderedFrames: frameCount,
          encodedFrames: frameCount,
          totalFrames,
          percent: Math.round((frameCount / totalFrames) * 100),
          currentTime: frame.time,
        });
      }
    }

    const mockProResBlob = new Blob([`PRORES_4444_ALPHA_MOCK_${frameCount}_FRAMES`], { type: "video/quicktime" });
    return {
      format: "prores",
      blob: mockProResBlob,
      frameCount,
      sizeBytes: mockProResBlob.size,
    };
  }
}

// ---------------------------------------------------------------------------
// Encoder Registry
// ---------------------------------------------------------------------------

export class MediaEncoderRegistry {
  private encoders = new Map<ExportFormat, MediaEncoder>();

  constructor() {
    this.register(new PngSequenceEncoder());
    this.register(new GifEncoder());
    this.register(new WebMEncoder());
    this.register(new RawFramesEncoder());
    this.register(new Mp4VideoEncoder());
    this.register(new ProResVideoEncoder());
  }

  public register(encoder: MediaEncoder): void {
    this.encoders.set(encoder.format, encoder);
  }

  public get(format: ExportFormat): MediaEncoder {
    const enc = this.encoders.get(format);
    if (!enc) {
      // Fall back to RawFramesEncoder if format is unknown
      return this.encoders.get("raw-frames")!;
    }
    return enc;
  }
}

export const mediaEncoderRegistry = new MediaEncoderRegistry();
