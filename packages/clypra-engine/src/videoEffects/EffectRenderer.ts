/**
 * Effect Renderer
 *
 * Applies behavior-driven effects to canvas contexts.
 * These are NOT video files - they are algorithmic transformations.
 */

import type { EffectRenderer as EffectRendererType, EffectParameters } from "./types";
import { getEffectRenderer } from "./effectsRegistry";

export class EffectRenderer {
  /**
   * Apply an effect to a canvas context
   *
   * @param ctx - Canvas 2D context
   * @param renderer - Effect type
   * @param params - Effect parameters
   * @param intensity - Effect intensity (0-1)
   * @param time - Current time for animated effects
   */
  static apply(ctx: CanvasRenderingContext2D, renderer: EffectRendererType, params: EffectParameters, intensity: number = 1, time: number = 0): void {
    const method = getEffectRenderer(renderer);
    if (method) {
      method.call(this, ctx, params, intensity, time);
    } else {
      console.warn(`Unknown effect renderer: ${renderer}`);
    }
  }
}
