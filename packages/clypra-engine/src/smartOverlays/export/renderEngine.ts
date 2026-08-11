/**
 * Phase 4K — Offscreen Render Engine & Sequence Generator
 *
 * Renders evaluated frames to canvas/image buffers and generates discrete
 * frame sequences for video/image sequence export.
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import { pixiSceneProjection } from "../pixiSceneProjection.js";
import { evaluateExportFrame } from "./framePipeline.js";
import type {
  ExportConfig,
  ExportFrameDescriptor,
  ExportProgress,
  EvaluatedExportFrame,
} from "./exportTypes.js";

export class RenderEngine {
  /**
   * Evaluates and projects frame at time t onto PixiSceneProjection.
   * Returns evaluated export frame containing resolved bounds and EvaluatedSceneState.
   */
  public evaluateFrame(
    doc: OverlayDocument,
    time: number,
    config: Partial<ExportConfig> = {}
  ): EvaluatedExportFrame {
    const evaluated = evaluateExportFrame(doc, time, config);
    pixiSceneProjection.project(
      evaluated.resolvedDoc,
      time,
      config.contextData || {}
    );
    return evaluated;
  }

  /**
   * Render frame to an HTMLCanvasElement or 2D context.
   */
  public renderFrameToCanvas(
    doc: OverlayDocument,
    time: number,
    config: Partial<ExportConfig> = {},
    targetCanvas?: any
  ): ExportFrameDescriptor {
    const evaluated = this.evaluateFrame(doc, time, config);
    const width = evaluated.canvasWidth;
    const height = evaluated.canvasHeight;

    let dataUrl: string | undefined;

    if (targetCanvas && typeof targetCanvas.getContext === "function") {
      const ctx = targetCanvas.getContext("2d");
      if (ctx) {
        targetCanvas.width = width;
        targetCanvas.height = height;

        if (config.transparent) {
          ctx.clearRect(0, 0, width, height);
        } else {
          ctx.fillStyle = doc.canvas.backgroundColor || "#0E0E12";
          ctx.fillRect(0, 0, width, height);
        }

        if (typeof targetCanvas.toDataURL === "function") {
          dataUrl = targetCanvas.toDataURL("image/png");
        }
      }
    }

    return {
      frameIndex: evaluated.frameIndex,
      time,
      width,
      height,
      dataUrl,
    };
  }

  /**
   * Generates a complete frame sequence by stepping frame-by-frame from t=0 to t=duration.
   */
  public async renderFrameSequence(
    doc: OverlayDocument,
    config: Partial<ExportConfig> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportFrameDescriptor[]> {
    const fps = config.fps ?? 30;
    const duration = config.duration ?? doc.duration ?? 5;
    const totalFrames = Math.max(1, Math.ceil(duration * fps));
    const frameDescriptors: ExportFrameDescriptor[] = [];

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const time = frameIndex / fps;
      const descriptor = this.renderFrameToCanvas(doc, time, config);
      frameDescriptors.push(descriptor);

      if (onProgress) {
        const percent = Math.round(((frameIndex + 1) / totalFrames) * 100);
        onProgress({
          stage: "rendering",
          renderedFrames: frameIndex + 1,
          encodedFrames: 0,
          totalFrames,
          percent,
          currentTime: time,
        });
      }
    }

    return frameDescriptors;
  }
}

export const renderEngine = new RenderEngine();
