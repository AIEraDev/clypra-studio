import { useEffect, useRef } from "react";
import { PixiRenderer } from "@clypra-studio/engine";

// One Application per canvas element, ever — keyed at module scope so it
// survives React Strict Mode's synchronous mount → cleanup → remount replay
// (the canvas DOM node itself is NOT recreated during that replay, only the
// effect callback re-runs — so this WeakMap correctly recognizes "same canvas").
const registry = new WeakMap<HTMLCanvasElement, { renderer: PixiRenderer; generation: number }>();

export function usePixiRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  onInit?: (renderer: PixiRenderer) => void,
  onError?: (err: any) => void,
) {
  const rendererRef = useRef<PixiRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let entry = registry.get(canvas);

    if (!entry) {
      // First claim on this canvas — create the ONE real Application
      const renderer = new PixiRenderer();
      entry = { renderer, generation: 1 };
      registry.set(canvas, entry);
      renderer.init(canvas, width, height)
        .then(() => {
          // Reset to 100% so the canvas scales to its CSS container
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          onInit?.(renderer);
        })
        .catch((err) => {
          onError?.(err);
        });
    } else {
      // Strict Mode's synchronous remount — reuse the existing instance.
      entry.generation++;
      if (entry.renderer.isReady) {
        onInit?.(entry.renderer);
      }
    }

    rendererRef.current = entry.renderer;
    const myGeneration = entry.generation;

    return () => {
      queueMicrotask(() => {
        const current = registry.get(canvas);
        if (current && current.generation === myGeneration) {
          registry.delete(canvas);
          current.renderer.destroy(); // real unmount
        }
      });
    };
  }, [canvasRef, width, height]);

  return rendererRef;
}
