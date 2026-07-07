/**
 * useVideoRenderer Hook
 *
 * React hook for managing @clypra/video-renderer lifecycle.
 * Compatible with PixiRenderer API from @clypra-studio/engine.
 */

import { useEffect, useRef } from "react";
import { VideoRenderer } from "@clypra/video-renderer";
import type { PixiRenderer } from "@clypra-studio/engine";

// Registry to prevent duplicate renderers (handles React Strict Mode)
const registry = new WeakMap<HTMLCanvasElement, { renderer: VideoRenderer; generation: number }>();

/**
 * Compatibility wrapper that extends VideoRenderer with PixiRenderer methods
 */
class VideoRendererWithTransitions extends VideoRenderer {
  // Store transition-related state
  private activeTransitionId: string | null = null;

  // Add PixiRenderer-compatible transition methods
  mountTransition(definition: any, _fromTexture: any, _toTexture: any, _params: any): void {
    // For now, just track the active transition ID
    // Full transition support would require TransitionManager integration
    this.activeTransitionId = definition.id;
    console.log("[VideoRenderer] mountTransition:", definition.id);
  }

  updateTransitionProgress(id: string, progress: number, _params?: any): void {
    // Update transition progress
    console.log("[VideoRenderer] updateTransitionProgress:", id, progress);
  }

  unmountTransition(): void {
    // Clear active transition
    this.activeTransitionId = null;
    console.log("[VideoRenderer] unmountTransition");
  }

  getActiveTransitionId(): string | null {
    return this.activeTransitionId;
  }
}

export function useVideoRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>, width: number, height: number, onInit?: (renderer: PixiRenderer | VideoRenderer) => void, onError?: (err: unknown) => void) {
  const rendererRef = useRef<VideoRendererWithTransitions | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let entry = registry.get(canvas);

    if (!entry) {
      // First time this canvas is used - create renderer
      const renderer = new VideoRendererWithTransitions({
        canvas,
        width,
        height,
        backgroundColor: 0x0e0e12,
        preserveDrawingBuffer: true,
      });

      entry = { renderer, generation: 1 };
      registry.set(canvas, entry);

      void renderer
        .initialize()
        .then(() => {
          // Reset canvas styles to allow CSS to control size
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          onInit?.(renderer as unknown as PixiRenderer);
        })
        .catch((err: unknown) => {
          onError?.(err);
        });
    } else {
      // React Strict Mode remount - reuse existing renderer
      entry.generation++;
      if (entry.renderer.isReady) {
        onInit?.(entry.renderer as unknown as PixiRenderer);
      }
    }

    rendererRef.current = entry.renderer as VideoRendererWithTransitions;
    const myGeneration = entry.generation;

    return () => {
      // Defer cleanup to handle Strict Mode's phantom unmount
      queueMicrotask(() => {
        const current = registry.get(canvas);
        if (current && current.generation === myGeneration) {
          registry.delete(canvas);
          current.renderer.destroy();
        }
      });
    };
  }, [canvasRef, width, height, onInit, onError]);

  return rendererRef;
}
