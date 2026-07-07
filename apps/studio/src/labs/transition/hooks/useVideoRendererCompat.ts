/**
 * useVideoRendererCompat Hook
 *
 * Compatibility layer that makes VideoRenderer API-compatible with PixiRenderer
 * for Transition Lab Console. This allows gradual migration.
 */

import { useEffect, useRef } from "react";
import { VideoRenderer } from "@clypra/video-renderer";
import type { PixiRenderer } from "@clypra-studio/engine";

// Registry to prevent duplicate renderers (handles React Strict Mode)
const registry = new WeakMap<HTMLCanvasElement, { renderer: VideoRenderer; generation: number }>();

/**
 * Compatibility wrapper that makes VideoRenderer look like PixiRenderer
 */
class VideoRendererCompat {
  private videoRenderer: VideoRenderer;

  constructor(videoRenderer: VideoRenderer) {
    this.videoRenderer = videoRenderer;
  }

  // Pass through VideoRenderer methods
  get isReady(): boolean {
    return this.videoRenderer.isReady;
  }

  setVideoSource(video: HTMLVideoElement): void {
    this.videoRenderer.setVideoSource(video);
  }

  setImageSource(image: HTMLImageElement | HTMLCanvasElement): void {
    this.videoRenderer.setImageSource(image);
  }

  setFitMode(mode: "stretch" | "fit" | "cover"): void {
    this.videoRenderer.setFitMode(mode);
  }

  render(): void {
    this.videoRenderer.render();
  }

  resize(width: number, height: number): void {
    this.videoRenderer.resize(width, height);
  }

  getApp(): any {
    return this.videoRenderer.getApp();
  }

  captureFrame(): ImageData | null {
    return this.videoRenderer.captureFrame();
  }

  destroy(): void {
    this.videoRenderer.destroy();
  }

  // Transition methods - delegate to underlying PixiJS app's containers
  mountTransition(_definition: any, _fromTexture: any, _toTexture: any, _params: any): void {
    // Get the transition container from VideoRenderer
    const containers = this.videoRenderer.getContainers();
    const app = this.videoRenderer.getApp();

    if (!containers.transition || !app) {
      console.warn("[VideoRendererCompat] Transition container not available");
      return;
    }

    // Note: This is a simplified version. For full transition support,
    // you'd need to integrate TransitionManager or keep using PixiRenderer
    // for transition-heavy features.
    console.warn("[VideoRendererCompat] mountTransition not fully implemented - use PixiRenderer for transitions");
  }

  updateTransitionProgress(_id: string, _progress: number, _params?: any): void {
    // Stub for compatibility
    console.warn("[VideoRendererCompat] updateTransitionProgress not fully implemented - use PixiRenderer for transitions");
  }

  unmountTransition(): void {
    // Stub for compatibility
    console.warn("[VideoRendererCompat] unmountTransition not fully implemented - use PixiRenderer for transitions");
  }

  getActiveTransitionId(): string | null {
    return null;
  }
}

export function useVideoRendererCompat(canvasRef: React.RefObject<HTMLCanvasElement | null>, width: number, height: number, onInit?: (renderer: PixiRenderer) => void, onError?: (err: unknown) => void) {
  const rendererRef = useRef<VideoRendererCompat | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let entry = registry.get(canvas);

    if (!entry) {
      // First time this canvas is used - create renderer
      const videoRenderer = new VideoRenderer({
        canvas,
        width,
        height,
        backgroundColor: 0x0e0e12,
        preserveDrawingBuffer: true,
      });

      entry = { renderer: videoRenderer, generation: 1 };
      registry.set(canvas, entry);

      void videoRenderer
        .initialize()
        .then(() => {
          // Reset canvas styles to allow CSS to control size
          canvas.style.width = "100%";
          canvas.style.height = "100%";

          // Wrap in compatibility layer
          const compat = new VideoRendererCompat(videoRenderer);
          rendererRef.current = compat;
          onInit?.(compat as unknown as PixiRenderer);
        })
        .catch((err: unknown) => {
          onError?.(err);
        });
    } else {
      // React Strict Mode remount - reuse existing renderer
      entry.generation++;
      if (entry.renderer.isReady) {
        const compat = new VideoRendererCompat(entry.renderer);
        rendererRef.current = compat;
        onInit?.(compat as unknown as PixiRenderer);
      }
    }

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
