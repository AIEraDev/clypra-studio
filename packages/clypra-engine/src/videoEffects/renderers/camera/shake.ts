/**
 * Shake Effect
 */

import type { EffectParameters } from "../../types";

export function renderShake(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  const shakeIntensity = (params.intensity || 50) * intensity;
  const frequency = params.frequency || 10;

  const offsetX = Math.sin(time * frequency) * shakeIntensity;
  const offsetY = Math.cos(time * frequency * 1.3) * shakeIntensity;

  ctx.translate(offsetX, offsetY);
}
