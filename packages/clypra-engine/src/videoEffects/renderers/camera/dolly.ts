/**
 * Dolly Effect
 * Essentially zoom with slight rotation
 */

import type { EffectParameters } from "../../types";
import { renderZoom } from "./zoom";

export function renderDolly(ctx: CanvasRenderingContext2D, params: EffectParameters, intensity: number, time: number): void {
  renderZoom(ctx, params, intensity, time);
}
