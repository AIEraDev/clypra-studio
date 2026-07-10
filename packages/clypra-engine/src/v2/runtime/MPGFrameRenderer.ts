/**
 * @clypra-studio/engine — Pipeline V2: MPG Frame Renderer
 *
 * @deprecated Use @clypra/runtime/renderer instead
 * The runtime has a more complete Executor implementation.
 * This file will be removed in v3.0.0
 *
 * High-level helper: FrameGraph → allocate → upload source → CommandBuffer → RenderBackend.
 */

import type { FrameGraph } from "../planner/types";
import type { RenderBackend } from "../runtime/types";
import { CommandBufferBuilder } from "../runtime/CommandBufferBuilder";
import { PixiRenderBackend } from "../backends/PixiRenderBackend.js";

export type FrameSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas;

export class MPGFrameRenderer {
  /**
   * Render a complete frame graph to the backend canvas.
   */
  static async render(backend: RenderBackend, frameGraph: FrameGraph, source: FrameSource, options?: { outputResourceId?: string }): Promise<void> {
    const outputId = options?.outputResourceId ?? "res-final-frame";

    const width = frameGraph.resourceRequests[0]?.width ?? 1920;
    const height = frameGraph.resourceRequests[0]?.height ?? 1080;

    if (backend instanceof PixiRenderBackend) {
      backend.clearResources();
    }

    for (const req of frameGraph.resourceRequests) {
      backend.allocateResource(req.id, req.type, req.width, req.height, req.format);
    }

    const uniqueShaders = new Set(frameGraph.passes.map((p) => p.shaderId));
    for (const shaderId of uniqueShaders) {
      backend.compileShader(shaderId, `// ${shaderId}`);
    }

    if (backend instanceof PixiRenderBackend) {
      const sourceResourceIds = frameGraph.resourceRequests.filter((r) => r.id.includes("src-frame") || r.id.includes("track-source")).map((r) => r.id);
      backend.uploadSourceImage(source as HTMLImageElement, sourceResourceIds);
    }

    const commandBuffer = CommandBufferBuilder.fromFrameGraph(frameGraph);
    await backend.submit(commandBuffer);

    if (backend instanceof PixiRenderBackend) {
      backend.present(outputId);
    }
  }

  /**
   * Render into an offscreen canvas at the given resolution (export path).
   */
  static async renderToCanvas(frameGraph: FrameGraph, source: FrameSource, width: number, height: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    const backend = new PixiRenderBackend();
    await backend.init(canvas, width, height);

    try {
      const sizedGraph: FrameGraph = {
        ...frameGraph,
        resourceRequests: frameGraph.resourceRequests.map((r) => ({ ...r, width, height })),
      };
      await MPGFrameRenderer.render(backend, sizedGraph, source);
      return canvas;
    } finally {
      backend.destroy();
    }
  }
}
