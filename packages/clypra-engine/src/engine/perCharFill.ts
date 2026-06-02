import type { TextEffectConfig } from "../types";

/** Visible glyph count (newlines excluded). */
export function countTextGlyphs(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "\n") n++;
  }
  return n;
}

export function resizeCharFillColors(
  text: string,
  colors: string[] | undefined,
  fallback: string
): string[] {
  const n = countTextGlyphs(text);
  const next = colors ? [...colors] : [];
  while (next.length < n) next.push(fallback);
  return next.slice(0, n);
}

export function setCharFillColor(
  colors: string[],
  glyphIndex: number,
  color: string
): string[] {
  const next = [...colors];
  if (glyphIndex >= 0 && glyphIndex < next.length) next[glyphIndex] = color;
  return next;
}

export function applyFillColorToAll(colors: string[], color: string): string[] {
  return colors.map(() => color);
}

/** Simple hue sweep for quick previews */
export function rainbowCharFillColors(text: string): string[] {
  const n = countTextGlyphs(text);
  return Array.from({ length: n }, (_, i) => {
    const hue = (i / Math.max(1, n - 1)) * 300;
    return `hsl(${hue}, 85%, 58%)`;
  });
}

export interface DrawPerCharTextOptions {
  lines: string[];
  startX: number;
  startY: number;
  lineAdvance: number;
  align: CanvasTextAlign;
  letterSpacing: number;
  charFillColors: string[];
  defaultColor: string;
  mode: "fill" | "stroke";
  offsetX?: number;
  offsetY?: number;
}

function measureLineWidth(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  line: string,
  letterSpacing: number
): number {
  if (!line) return 0;
  let w = 0;
  for (let i = 0; i < line.length; i++) {
    w += ctx.measureText(line[i]).width;
    if (i < line.length - 1) w += letterSpacing;
  }
  return w;
}

/**
 * Draw text one glyph at a time with per-index fill/stroke colors.
 * Letter spacing is applied manually (canvas letterSpacing reset to 0).
 */
export function drawPerCharText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  opts: DrawPerCharTextOptions
): void {
  const {
    lines,
    startX,
    startY,
    lineAdvance,
    align,
    letterSpacing,
    charFillColors,
    defaultColor,
    mode,
    offsetX = 0,
    offsetY = 0,
  } = opts;

  ctx.save();
  const prevSpacing = (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";

  let glyphIndex = 0;

  lines.forEach((line, lineIndex) => {
    const py = startY + lineIndex * lineAdvance;
    const lineWidth = measureLineWidth(ctx, line, letterSpacing);
    let x = startX;
    if (align === "center") x = startX - lineWidth / 2;
    else if (align === "right") x = startX - lineWidth;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const color = charFillColors[glyphIndex] ?? defaultColor;
      if (mode === "fill") ctx.fillStyle = color;
      else ctx.strokeStyle = color;

      const drawX = x + offsetX;
      const drawY = py + offsetY;
      if (mode === "fill") ctx.fillText(ch, drawX, drawY);
      else ctx.strokeText(ch, drawX, drawY);

      x += ctx.measureText(ch).width + letterSpacing;
      glyphIndex++;
    }
  });

  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = prevSpacing ?? "0px";
  ctx.restore();
}

export function shouldUsePerCharFill(cfg: TextEffectConfig): boolean {
  return (
    !!cfg.perCharFillEnabled &&
    cfg.fillType === "solid" &&
    !cfg.customRenderer &&
    (cfg.charFillColors?.length ?? 0) > 0
  );
}
