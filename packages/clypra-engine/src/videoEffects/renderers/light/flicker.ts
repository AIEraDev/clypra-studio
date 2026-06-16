/**
 * Flicker Effect
 */

import type { EffectParameters } from "../../types";

export function renderFlicker(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const flickerAmount = Math.random() * intensity;
  ctx.globalAlpha = 1 - flickerAmount * 0.5;
}
