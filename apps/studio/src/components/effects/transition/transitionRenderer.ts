/**
 * Transition Renderer
 * Wrapper around @clypra/engine TransitionRenderer for studio workspace
 */

import { TransitionRenderer, type TransitionPreset } from "@clypra/engine/transitions";

/**
 * Main transition renderer wrapper for studio workspace
 * Uses @clypra/engine TransitionRenderer as single source of truth
 */
export function renderTransition(
  ctx: CanvasRenderingContext2D,
  clipA: HTMLVideoElement | HTMLImageElement,
  clipB: HTMLVideoElement | HTMLImageElement,
  transition: TransitionPreset,
  rawProgress: number, // 0-1
  duration: number,
): void {
  // Map transition preset to renderer type
  const rendererType = transition.renderer === "canvas" ? (transition as any).type || (transition as any).id : transition.renderer;

  // Use engine's TransitionRenderer with preset parameters
  TransitionRenderer.render(
    ctx,
    clipA as any,
    clipB as any,
    rendererType as any, // Type assertion since studio presets may have custom types
    transition.params || {},
    rawProgress,
  );
}
