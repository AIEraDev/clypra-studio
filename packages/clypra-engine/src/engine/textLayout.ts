import type { TextEffectConfig } from "../types";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_FONT_SIZE } from "./schema";

export interface TextLayoutBounds {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  maxLineWidth: number;
  textBlockHeight: number;
}

export interface TextLayoutResult {
  lines: string[];
  fontSize: number;
  startX: number;
  startY: number;
  align: CanvasTextAlign;
  lineWidths: number[];
  bounds: TextLayoutBounds;
  safeRect: { x: number; y: number; width: number; height: number };
}

export interface CompositionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  description?: string;
}

export const COMPOSITION_PRESETS: CompositionPreset[] = [
  { id: "banner", label: "Banner", width: 800, height: 200, description: "Lower third / title bar" },
  { id: "youtube", label: "16:9", width: 1280, height: 720, description: "HD thumbnail" },
  { id: "square", label: "1:1", width: 1080, height: 1080, description: "Social square" },
  { id: "story", label: "9:16", width: 1080, height: 1920, description: "Vertical story" },
  { id: "wide", label: "2:1", width: 1200, height: 600, description: "Wide hero" },
  { id: "poster", label: "3:4", width: 900, height: 1200, description: "Poster" },
];

function measureLine(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, line: string, letterSpacing: number): number {
  const prev = (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing;
  if (letterSpacing !== 0) {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpacing}px`;
  }
  const w = ctx.measureText(line || " ").width;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = prev ?? "0px";
  return w;
}

function getSafeRect(cfg: TextEffectConfig): { x: number; y: number; width: number; height: number } {
  const w = cfg.canvasWidth || DEFAULT_CANVAS_WIDTH;
  const h = cfg.canvasHeight || DEFAULT_CANVAS_HEIGHT;
  const marginX = cfg.panelEnabled ? (cfg.panelPaddingX ?? 40) + 16 : Math.min(48, w * 0.06);
  const marginY = cfg.panelEnabled ? (cfg.panelPaddingY ?? 20) + 16 : Math.min(40, h * 0.1);
  return {
    x: marginX,
    y: marginY,
    width: Math.max(40, w - marginX * 2),
    height: Math.max(24, h - marginY * 2),
  };
}

/** Soft-wrap paragraphs to fit safe width character-by-character */
export function wrapTextToWidth(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, maxWidth: number, letterSpacing: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para === "") {
      lines.push("");
      continue;
    }
    
    let current = "";
    for (let i = 0; i < para.length; i++) {
      const char = para[i];
      const tryLine = current + char;
      if (measureLine(ctx, tryLine, letterSpacing) <= maxWidth) {
        current = tryLine;
      } else {
        if (current) {
          lines.push(current);
        }
        current = char;
      }
    }
    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

function layoutWithFontSize(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig, fontSize: number, lines: string[]): TextLayoutResult {
  const cWidth = cfg.canvasWidth || DEFAULT_CANVAS_WIDTH;
  const cHeight = cfg.canvasHeight || DEFAULT_CANVAS_HEIGHT;
  const safe = getSafeRect(cfg);
  const lineHeight = cfg.lineHeight ?? 1.2;
  const letterSpacing = cfg.letterSpacing ?? 0;

  const fontStr = `${cfg.fontStyle} ${cfg.fontWeight} ${fontSize}px "${cfg.fontFamily}"`;
  ctx.font = fontStr;

  const lineWidths = lines.map((line) => measureLine(ctx, line, letterSpacing));
  const maxLineWidth = Math.max(...lineWidths, 1);
  // Standard advance-based block height: every line occupies fontSize * lineHeight,
  // except the last which only needs fontSize (no trailing advance below the baseline).
  // This matches the per-line `py = startY + index * lineAdvance` drawing loop.
  const textBlockHeight = lines.length === 1 ? fontSize : (lines.length - 1) * fontSize * lineHeight + fontSize;

  let align: CanvasTextAlign = "center";
  let startX = cWidth / 2;

  if (cfg.textPosX === "left") {
    align = "left";
    startX = safe.x;
  } else if (cfg.textPosX === "right") {
    align = "right";
    startX = safe.x + safe.width;
  } else {
    startX = safe.x + safe.width / 2;
  }

  let startY = safe.y + (safe.height - textBlockHeight) / 2 + fontSize * 0.85;
  if (cfg.textPosY === "top") {
    startY = safe.y + fontSize * 0.85;
  } else if (cfg.textPosY === "bottom") {
    startY = safe.y + safe.height - textBlockHeight + fontSize * 0.85;
  }

  let xMin = startX;
  if (align === "center") xMin = startX - maxLineWidth / 2;
  else if (align === "right") xMin = startX - maxLineWidth;

  const yMin = startY - fontSize * 0.85;
  const yMax = startY + (lines.length - 1) * fontSize * lineHeight + fontSize * 0.15;

  return {
    lines,
    fontSize,
    startX,
    startY,
    align,
    lineWidths,
    bounds: {
      xMin,
      yMin,
      xMax: xMin + maxLineWidth,
      yMax,
      maxLineWidth,
      textBlockHeight,
    },
    safeRect: safe,
  };
}

export function measureTextFits(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig, fontSize: number, lines: string[]): boolean {
  const safe = getSafeRect(cfg);
  const lineHeight = cfg.lineHeight ?? 1.2;
  const layout = layoutWithFontSize(ctx, cfg, fontSize, lines);
  return layout.bounds.maxLineWidth <= safe.width + 1 && layout.bounds.textBlockHeight <= safe.height + 1;
}

export function computeAutoFitFontSize(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig, wrappedLines: string[]): number {
  const max = Math.min(cfg.fontSize || DEFAULT_FONT_SIZE, 200);
  let lo = 12;
  let hi = max;
  let best = 12;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (measureTextFits(ctx, cfg, mid, wrappedLines)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/**
 * Layout text for a composition: safe margins, optional wrap + auto-fit.
 */
export function computeTextLayout(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig, options?: { wrap?: boolean; autoFit?: boolean }): TextLayoutResult {
  const safe = getSafeRect(cfg);
  const wrap = options?.wrap ?? true;
  const autoFit = options?.autoFit ?? !!(cfg as TextEffectConfig & { autoFitText?: boolean }).autoFitText;

  let lines = cfg.text.split("\n");
  if (wrap) {
    lines = wrapTextToWidth(ctx, cfg.text, safe.width, cfg.letterSpacing ?? 0);
  }

  let fontSize = cfg.fontSize;
  if (autoFit) {
    fontSize = computeAutoFitFontSize(ctx, cfg, lines);
  }

  return layoutWithFontSize(ctx, cfg, fontSize, lines);
}

/** Preview zoom: fit composition inside viewport */
export function computeFitZoom(viewportWidth: number, viewportHeight: number, compositionWidth: number, compositionHeight: number, padding = 48): number {
  if (viewportWidth <= 0 || viewportHeight <= 0) return 100;
  const availW = viewportWidth - padding;
  const availH = viewportHeight - padding;
  const scale = Math.min(availW / compositionWidth, availH / compositionHeight);
  return Math.max(25, Math.min(200, Math.floor(scale * 100)));
}
