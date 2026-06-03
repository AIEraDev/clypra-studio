/**
 * Canvas 2D utility helpers
 *
 * Cross-platform polyfills and small drawing helpers shared by the
 * renderer, rasterizer, and any other Canvas 2D consumers.
 */

import { supportsRoundRect } from "./platform";

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Draw a rounded rectangle path, compatible with all WebView targets.
 *
 * Uses the native ctx.roundRect() when available (Chrome 99+, Safari 15.4+,
 * WebView2 1.0.1108+). Falls back to manual quadraticCurveTo() on older
 * WKWebView / WebView2 builds.
 *
 * Callers must still call ctx.fill() / ctx.stroke() after this.
 *
 * @param ctx  - 2D rendering context
 * @param x    - top-left x
 * @param y    - top-left y
 * @param w    - width
 * @param h    - height
 * @param r    - corner radius (uniform, clamped to half the shorter side)
 */
export function drawRoundedRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));

  ctx.beginPath();

  if (supportsRoundRect()) {
    (ctx as CanvasRenderingContext2D).roundRect(x, y, w, h, radius);
  } else {
    // Manual polyfill using quadraticCurveTo — matches native roundRect path contract.
    // Caller is responsible for ctx.closePath() / ctx.fill() / ctx.stroke().
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
}

/**
 * Apply letterSpacing to a canvas context when the CSS property is
 * supported. Returns the previous value so callers can restore it.
 *
 * When letterSpacing is NOT supported by the current WebView, returns
 * the current value unchanged and applies no mutation.
 *
 * @param ctx    - 2D rendering context
 * @param value  - spacing in pixels (pass 0 to reset)
 * @returns      previous letterSpacing string ("0px" if unknown)
 */
export function applyLetterSpacing(ctx: Ctx2D, value: number): string {
  const prev: string = (ctx as any).letterSpacing ?? "0px";
  if (value !== 0) {
    (ctx as any).letterSpacing = `${value}px`;
  }
  return prev;
}

/**
 * Restore letterSpacing to a previously saved value.
 */
export function restoreLetterSpacing(ctx: Ctx2D, saved: string): void {
  (ctx as any).letterSpacing = saved;
}
