/**
 * Procedural engine utilities.
 *
 * createCanvas is re-exported from platform.ts — the single canonical
 * implementation. All other helpers are pure math / color utilities with
 * no platform dependency.
 */
import { TextEffectConfig } from "../../types";
export { createCanvas } from "../../platform";

export type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function getCanvas2DContext(canvas: HTMLCanvasElement | OffscreenCanvas): Canvas2DContext | null {
  return canvas.getContext("2d") as Canvas2DContext | null;
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function textSeed(text: string): number {
  return (text.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9301) % 49297;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export function mixHexColor(colorA: string, colorB: string, ratio: number): string {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * ratio);
  const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * ratio);
  const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * ratio);
  const toHex = (c: number) => {
    const s = Math.max(0, Math.min(255, c)).toString(16);
    return s.length === 1 ? "0" + s : s;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
