/**
 * Phase 4L — Streaming Frame Pipeline
 *
 * Async generator yielding single EvaluatedExportFrame descriptors step-by-step:
 *   t = frameIndex / fps
 *
 * Key Architectural Invariant:
 * The frame pipeline does not accumulate historical frames in application-level memory;
 * working memory is independent of frame count, excluding encoder/runtime/resource buffers.
 * Raw RGBA frame data is yielded one-by-one and discarded immediately by the consumer.
 * AbortSignal is checked on every step to support instant cancellation.
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import { evaluateExportFrame } from "./framePipeline.js";
import type { ExportConfig, EvaluatedExportFrame } from "./exportTypes.js";

/**
 * Custom error class thrown when export streaming is aborted mid-run.
 */
export class ExportAbortError extends Error {
  constructor(message = "Export execution was aborted by user request.") {
    super(message);
    this.name = "ExportAbortError";
  }
}

/**
 * Async generator yielding EvaluatedExportFrame one frame at a time.
 */
export async function* streamExportFrames(
  doc: OverlayDocument,
  config: Partial<ExportConfig> = {},
  signal?: AbortSignal
): AsyncGenerator<EvaluatedExportFrame, void, unknown> {
  const fps = config.fps ?? 30;
  const duration = config.duration ?? doc.duration ?? 5;
  const totalFrames = Math.max(1, Math.ceil(duration * fps));

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    if (signal?.aborted) {
      throw new ExportAbortError();
    }

    const time = frameIndex / fps;
    const evaluatedFrame = evaluateExportFrame(doc, time, config);

    yield evaluatedFrame;

    // Zero frame retention — evaluatedFrame reference goes out of scope on next iteration.
  }
}
