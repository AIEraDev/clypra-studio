import { TextEffectConfig } from "./types";
import { computeTextLayout } from "./engine/textLayout";
import { drawPerCharText, shouldUsePerCharFill } from "./engine/perCharFill";
import { InkBrushEngine } from "./engine/procedural/InkBrushEngine";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "./engine/schema";
import { createCanvas } from "./platform";
import { drawRoundedRect } from "./canvas-utils";
import { seededRandom, textSeed, hexToRgb, mixHexColor } from "./engine/procedural/utils";

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function getCanvas2DContext(canvas: HTMLCanvasElement | OffscreenCanvas): Canvas2DContext | null {
  return canvas.getContext("2d") as Canvas2DContext | null;
}

function ctxSupportsFilter(ctx: any): boolean {
  try {
    const prev = ctx.filter;
    ctx.filter = "blur(4px)";
    const ok = typeof ctx.filter === "string" && ctx.filter.includes("blur");
    ctx.filter = prev;
    return ok;
  } catch {
    return false;
  }
}

export function renderTextEffectCore(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig): void {
  if (cfg.customRenderer === "InkBrushEngine") {
    const engine = new InkBrushEngine(cfg);
    engine.drawFrame(ctx);
    return;
  }

  const { text, fontFamily, fontWeight, fontStyle, fontSize, letterSpacing, lineHeight, fillType, fillColor, fillGradientAngle, fillGradientStops, patternType, strokeEnabled, strokeColor, strokeWidth, strokePosition, strokeOpacity, strokeLineJoin, strokeBlur, strokeType, strokeColorSecondary, strokeWidthSecondary, strokeFadeRange, glowLayers, shadowEnabled, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity, shadowType, bevelEnabled, bevelDepth, bevelHighlight, bevelShadow, bevelDirection, bevelCoreColor, bevelEdgeColor, bevelEdgeWidth, bevelBlur, bevelBlurColor, bevelPerspectiveEnabled, bevelVanishingPointX, bevelVanishingPointY, bevelFocalLength, stackEnabled, stackCount, stackOffsetX, stackOffsetY, stackOpacityDecay, stackColor1, stackColor2, stackColor3, stackColor4, panelEnabled, panelColor, panelOpacity, panelRadius, panelPaddingX, panelPaddingY, panelStrokeEnabled, panelStrokeColor, panelStrokeWidth, canvasWidth, canvasHeight, textPosX, textPosY } = cfg;

  // 1. Initial configuration
  ctx.imageSmoothingEnabled = true;

  ctx.lineJoin = strokeLineJoin;

  const cWidth = canvasWidth || DEFAULT_CANVAS_WIDTH;
  const cHeight = canvasHeight || DEFAULT_CANVAS_HEIGHT;

  const layout = computeTextLayout(ctx, cfg, {
    wrap: cfg.wrapText !== false,
    autoFit: !!cfg.autoFitText,
  });

  const lines = layout.lines;
  const numLines = lines.length;
  const effectiveFontSize = layout.fontSize;
  const lineAdvance = effectiveFontSize * lineHeight;
  const textBlockHeight = layout.bounds.textBlockHeight;
  let startX = layout.startX;
  let startY = layout.startY;
  const align = layout.align;
  const maxLineWidth = layout.bounds.maxLineWidth;
  const lineWidths = layout.lineWidths;

  const fontStr = `${fontStyle} ${fontWeight} ${effectiveFontSize}px "${fontFamily}"`;
  ctx.font = fontStr;
  ctx.textAlign = align;
  if (letterSpacing !== 0) {
    (ctx as any).letterSpacing = `${letterSpacing}px`;
  }

  let xMin = layout.bounds.xMin;
  let xMax = layout.bounds.xMax;
  let yMin = layout.bounds.yMin;
  let yMax = layout.bounds.yMax;

  // Calculate 3D extrusion offsets and shift coordinate system to center the entire block
  let shiftX_half = 0;
  let shiftY_half = 0;

  if (bevelEnabled && bevelDepth > 0) {
    if (bevelPerspectiveEnabled) {
      const vpx = cWidth / 2 + ((bevelVanishingPointX !== undefined ? bevelVanishingPointX : 40) / 100) * (cWidth / 2);
      const vpy = cHeight / 2 + ((bevelVanishingPointY !== undefined ? bevelVanishingPointY : 80) / 100) * (cHeight / 2);
      const fl = Math.max(100, bevelFocalLength !== undefined ? bevelFocalLength : 400);
      const scale = fl / (fl + bevelDepth);
      const shiftX_back = (vpx - startX) * (1 - scale);
      const shiftY_back = (vpy - startY) * (1 - scale);
      shiftX_half = shiftX_back / 2;
      shiftY_half = shiftY_back / 2;
    } else {
      let dx = 0;
      let dy = 0;
      if (bevelDirection === "bottom-right") {
        dx = bevelDepth;
        dy = bevelDepth;
      } else if (bevelDirection === "bottom") {
        dy = bevelDepth;
      } else if (bevelDirection === "right") {
        dx = bevelDepth;
      }
      shiftX_half = dx / 2;
      shiftY_half = dy / 2;
    }

    // Shift starting coordinates so the complete 3D box is centered visually
    startX -= shiftX_half;
    startY -= shiftY_half;
    xMin -= shiftX_half;
    xMax -= shiftX_half;
    yMin -= shiftY_half;
    yMax -= shiftY_half;
  }

  // Now calculate the exact joint bounding box bounds for the panel (around shifted values)
  let total_xMin = xMin;
  let total_xMax = xMax;
  let total_yMin = yMin;
  let total_yMax = yMax;

  if (bevelEnabled && bevelDepth > 0) {
    if (bevelPerspectiveEnabled) {
      const vpx = cWidth / 2 + ((bevelVanishingPointX !== undefined ? bevelVanishingPointX : 40) / 100) * (cWidth / 2);
      const vpy = cHeight / 2 + ((bevelVanishingPointY !== undefined ? bevelVanishingPointY : 80) / 100) * (cHeight / 2);
      const fl = Math.max(100, bevelFocalLength !== undefined ? bevelFocalLength : 400);
      const scale = fl / (fl + bevelDepth);

      const x_new_left = vpx + (xMin - vpx) * scale;
      const x_new_right = vpx + (xMax - vpx) * scale;
      const y_new_top = vpy + (yMin - vpy) * scale;
      const y_new_bottom = vpy + (yMax - vpy) * scale;

      total_xMin = Math.min(xMin, x_new_left, x_new_right);
      total_xMax = Math.max(xMax, x_new_left, x_new_right);
      total_yMin = Math.min(yMin, y_new_top, y_new_bottom);
      total_yMax = Math.max(yMax, y_new_top, y_new_bottom);
    } else {
      let dx = 0;
      let dy = 0;
      if (bevelDirection === "bottom-right") {
        dx = bevelDepth;
        dy = bevelDepth;
      } else if (bevelDirection === "bottom") {
        dy = bevelDepth;
      } else if (bevelDirection === "right") {
        dx = bevelDepth;
      }

      total_xMin = Math.min(xMin, xMin + dx);
      total_xMax = Math.max(xMax, xMax + dx);
      total_yMin = Math.min(yMin, yMin + dy);
      total_yMax = Math.max(yMax, yMax + dy);
    }
  }

  // Helper to apply letter spacing to individual lines during render
  const usePerCharFill = shouldUsePerCharFill(cfg);
  const perCharColors = cfg.charFillColors ?? [];

  const renderLines = (mode: "fill" | "stroke", overrideStyle?: string | CanvasGradient | CanvasPattern, offsetX = 0, offsetY = 0, options?: { perCharFill?: boolean }) => {
    if (options?.perCharFill && usePerCharFill && mode === "fill" && !overrideStyle) {
      drawPerCharText(ctx, {
        lines,
        startX,
        startY,
        lineAdvance,
        align,
        letterSpacing,
        charFillColors: perCharColors,
        defaultColor: fillColor,
        mode: "fill",
        offsetX,
        offsetY,
      });
      return;
    }

    const savedLetterSpacing = (ctx as any).letterSpacing || "normal";
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }

    if (overrideStyle) {
      if (mode === "fill") {
        ctx.fillStyle = overrideStyle;
      } else {
        ctx.strokeStyle = overrideStyle;
      }
    }

    lines.forEach((line, index) => {
      const py = startY + index * lineAdvance;
      if (mode === "fill") {
        ctx.fillText(line, startX + offsetX, py + offsetY);
      } else {
        ctx.strokeText(line, startX + offsetX, py + offsetY);
      }
    });

    (ctx as any).letterSpacing = savedLetterSpacing;
  };

  // Helper using offscreen shadow projection trick
  const renderWithShadowTrick = (mode: "fill" | "stroke", sColor: string, sBlur: number, sOffsetX: number, sOffsetY: number, opacity: number, overrideStyle = "#000", spread = 0) => {
    ctx.save();
    ctx.globalAlpha = opacity / 100;

    const shiftX = 10000; // Shift offscreen
    ctx.shadowColor = sColor;
    ctx.shadowBlur = sBlur;
    ctx.shadowOffsetX = shiftX + sOffsetX;
    ctx.shadowOffsetY = sOffsetY;

    // Draw text shifted, shadow gets projected back perfectly
    const savedLetterSpacing = (ctx as any).letterSpacing || "normal";
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }

    const prevStyle = mode === "fill" ? ctx.fillStyle : ctx.strokeStyle;
    if (mode === "fill") {
      ctx.fillStyle = overrideStyle;
    } else {
      ctx.strokeStyle = overrideStyle;
    }

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    if (spread > 0) {
      ctx.strokeStyle = overrideStyle;
      ctx.lineWidth = spread * 2;
      ctx.lineJoin = strokeLineJoin;
    }

    lines.forEach((line, index) => {
      const py = startY + index * lineAdvance;
      if (mode === "fill") {
        if (spread > 0) {
          ctx.strokeText(line, startX - shiftX, py);
        }
        ctx.fillText(line, startX - shiftX, py);
      } else {
        ctx.strokeText(line, startX - shiftX, py);
      }
    });

    (ctx as any).letterSpacing = savedLetterSpacing;
    if (mode === "fill") {
      ctx.fillStyle = prevStyle;
    } else {
      ctx.strokeStyle = prevStyle;
    }
    if (spread > 0) {
      ctx.strokeStyle = prevStrokeStyle;
      ctx.lineWidth = prevLineWidth;
    }

    ctx.restore();
  };

  // ──────────────────────────────────────────────────────────────────
  // 1. Background Panel
  // ──────────────────────────────────────────────────────────────────
  if (panelEnabled) {
    ctx.save();
    ctx.globalAlpha = panelOpacity / 100;
    ctx.fillStyle = panelColor;

    const px = total_xMin - panelPaddingX;
    const py = total_yMin - panelPaddingY;
    const pw = total_xMax - total_xMin + 2 * panelPaddingX;
    const ph = total_yMax - total_yMin + 2 * panelPaddingY;

    const cx = px + pw / 2;
    const cy = py + ph / 2;

    const isComicBurst = cfg.effectName.toLowerCase().includes("comic") || (cfg as any).panelStyle === "burst";

    ctx.beginPath();
    if (isComicBurst) {
      // Render a hand-drawn comic book styled jagged explosion
      const numPoints = 36;
      const rx = pw * 0.56;
      const ry = ph * 0.68;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Organic-looking jagged comic spikes
        const wave1 = Math.sin(angle * 8) * 0.12;
        const wave3 = Math.cos(angle * 14) * 0.05;
        const isSpikePeak = i % 2 === 0;
        const depthFactor = isSpikePeak ? 1.12 + wave1 + wave3 : 0.76 - wave3;

        const sx = cx + Math.cos(angle) * rx * depthFactor;
        const sy = cy + Math.sin(angle) * ry * depthFactor;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
    } else {
      drawRoundedRect(ctx, px, py, pw, ph, panelRadius);
    }
    ctx.closePath();
    ctx.fill();

    if (panelStrokeEnabled) {
      ctx.strokeStyle = panelStrokeColor;
      ctx.lineWidth = panelStrokeWidth;
      const prevLineJoin = ctx.lineJoin;
      if (isComicBurst) {
        ctx.lineJoin = "miter";
      }
      ctx.stroke();
      ctx.lineJoin = prevLineJoin;
    }
    ctx.restore();
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. Glow Layers (Type: Outer)
  // ──────────────────────────────────────────────────────────────────
  glowLayers.forEach((layer) => {
    if (layer.enabled && layer.type === "outer" && layer.opacity > 0) {
      const renderCount = Math.max(1, Math.min(20, layer.strength ?? 1));
      for (let i = 0; i < renderCount; i++) {
        renderWithShadowTrick("fill", layer.color, layer.blur, 0, 0, layer.opacity, "#000", layer.spread ?? 0);
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 3. Drop Shadow (Before fill, type "drop")
  // ──────────────────────────────────────────────────────────────────
  if (shadowEnabled && shadowType === "drop" && shadowOpacity > 0) {
    if (bevelEnabled && bevelDepth > 0) {
      if (bevelPerspectiveEnabled) {
        const vpx = cWidth / 2 + ((bevelVanishingPointX !== undefined ? bevelVanishingPointX : 40) / 100) * (cWidth / 2);
        const vpy = cHeight / 2 + ((bevelVanishingPointY !== undefined ? bevelVanishingPointY : 80) / 100) * (cHeight / 2);
        const fl = Math.max(100, bevelFocalLength !== undefined ? bevelFocalLength : 400);
        const scale = fl / (fl + bevelDepth);

        ctx.save();
        ctx.translate(vpx, vpy);
        ctx.scale(scale, scale);
        ctx.translate(-vpx, -vpy);

        renderWithShadowTrick("fill", shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity);
        ctx.restore();
      } else {
        let dx = 0;
        let dy = 0;
        if (bevelDirection === "bottom-right") {
          dx = bevelDepth;
          dy = bevelDepth;
        } else if (bevelDirection === "bottom") {
          dy = bevelDepth;
        } else if (bevelDirection === "right") {
          dx = bevelDepth;
        }

        renderWithShadowTrick("fill", shadowColor, shadowBlur, shadowOffsetX + dx, shadowOffsetY + dy, shadowOpacity);
      }
    } else {
      renderWithShadowTrick("fill", shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. Glitch Corrupt Preset custom RGB Split & Scanlines
  //    We explicitly handle this aesthetic if enabled
  // ──────────────────────────────────────────────────────────────────
  const isGlitch = cfg.effectName.toLowerCase().includes("glitch") || cfg.text === "SYSTEM ERR";
  if (isGlitch) {
    ctx.save();
    // Cyan split offset
    ctx.globalAlpha = 0.8;
    renderLines("fill", "#00FFFF", -4, -2);
    // Magenta split offset
    renderLines("fill", "#FF00FF", 4, 2);
    ctx.restore();
  }

  // ──────────────────────────────────────────────────────────────────
  // 5. Bevel Stacked Copies (3D Bevel) — Gradient-shaded depth faces
  // ──────────────────────────────────────────────────────────────────
  if (bevelEnabled && bevelDepth > 0) {
    // ── Shared helpers ─────────────────────────────────────────────
    const shadowRgb = hexToRgb(bevelShadow || "#1A0A00");
    const coreRgb = hexToRgb(bevelCoreColor || bevelShadow || "#3A1A00");
    const highlightRgb = hexToRgb(bevelHighlight || "#FFFFFF");

    /**
     * Interpolate across a 3-stop gradient:
     *   t=0   → bevelShadow     (deepest back slab)
     *   t=0.5 → bevelCoreColor  (mid-depth)
     *   t=1   → bevelHighlight  (closest to front face)
     * Uses ease-in-out curve for more realistic falloff.
     */
    const shadeForDepth = (t: number): string => {
      // ease-in-out
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      if (eased <= 0.5) {
        const u = eased * 2;
        const r = Math.round(shadowRgb.r + (coreRgb.r - shadowRgb.r) * u);
        const g = Math.round(shadowRgb.g + (coreRgb.g - shadowRgb.g) * u);
        const b = Math.round(shadowRgb.b + (coreRgb.b - shadowRgb.b) * u);
        return `rgb(${r},${g},${b})`;
      } else {
        const u = (eased - 0.5) * 2;
        const r = Math.round(coreRgb.r + (highlightRgb.r - coreRgb.r) * u);
        const g = Math.round(coreRgb.g + (highlightRgb.g - coreRgb.g) * u);
        const b = Math.round(coreRgb.b + (highlightRgb.b - coreRgb.b) * u);
        return `rgb(${r},${g},${b})`;
      }
    };

    if (bevelPerspectiveEnabled) {
      const vpx = cWidth / 2 + ((bevelVanishingPointX !== undefined ? bevelVanishingPointX : 40) / 100) * (cWidth / 2);
      const vpy = cHeight / 2 + ((bevelVanishingPointY !== undefined ? bevelVanishingPointY : 80) / 100) * (cHeight / 2);
      const fl = Math.max(100, bevelFocalLength !== undefined ? bevelFocalLength : 400);

      // 5a. Ambient occlusion / depth glow blur underneath
      if (bevelBlur && bevelBlur > 0) {
        const blurColor = bevelBlurColor || bevelShadow || "#000000";
        if (ctxSupportsFilter(ctx)) {
          ctx.save();
          ctx.filter = `blur(${bevelBlur}px)`;
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            const scale = fl / (fl + i);
            ctx.save();
            ctx.translate(vpx, vpy);
            ctx.scale(scale, scale);
            ctx.translate(-vpx, -vpy);
            renderLines("fill", blurColor);
            ctx.restore();
          }
          ctx.restore();
        } else {
          // Fallback: use shadow trick
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            const scale = fl / (fl + i);
            ctx.save();
            ctx.translate(vpx, vpy);
            ctx.scale(scale, scale);
            ctx.translate(-vpx, -vpy);
            renderWithShadowTrick("fill", blurColor, bevelBlur, 0, 0, 100);
            ctx.restore();
          }
        }
      }

      // 5b. Gradient-shaded extrusion slabs (back to front)
      ctx.save();
      for (let i = bevelDepth; i > 0; i--) {
        // t=0 at deepest slab, t→1 approaching front face
        const t = 1 - (i - 1) / Math.max(1, bevelDepth - 1);
        // Ambient occlusion: deep slabs are darkened further
        const aoFactor = 0.35 + 0.65 * (1 - (i - 1) / Math.max(1, bevelDepth));
        const baseColor = shadeForDepth(t);

        // Apply AO darkening by blending base color toward black
        const bRgb = hexToRgb(baseColor.startsWith("#") ? baseColor : "#000000");
        const baseRgbParsed = (() => {
          const m = baseColor.match(/rgb\((\d+),(\d+),(\d+)\)/);
          return m ? { r: +m[1], g: +m[2], b: +m[3] } : bRgb;
        })();
        const aoColor = `rgb(${Math.round(baseRgbParsed.r * aoFactor)},${Math.round(baseRgbParsed.g * aoFactor)},${Math.round(baseRgbParsed.b * aoFactor)})`;

        const scale = fl / (fl + i);
        ctx.save();
        ctx.translate(vpx, vpy);
        ctx.scale(scale, scale);
        ctx.translate(-vpx, -vpy);
        renderLines("fill", aoColor);

        if (bevelEdgeWidth && bevelEdgeWidth > 0) {
          ctx.save();
          ctx.strokeStyle = bevelEdgeColor || "#000000";
          ctx.lineWidth = bevelEdgeWidth;
          ctx.lineJoin = strokeLineJoin || "round";
          renderLines("stroke");
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();

      // 5c. Specular highlight stroke on front-face top edge
      if (bevelEdgeWidth && bevelEdgeWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = bevelHighlight;
        ctx.lineWidth = Math.max(0.5, (bevelEdgeWidth || 1) * 0.5);
        ctx.lineJoin = strokeLineJoin || "round";
        renderLines("stroke");
        ctx.restore();
      }
    } else {
      // ── Flat-direction extrusion (bottom-right / bottom / right) ──

      const getDirOffset = (i: number): { dx: number; dy: number } => {
        if (bevelDirection === "bottom-right") return { dx: i, dy: i };
        if (bevelDirection === "bottom") return { dx: 0, dy: i };
        if (bevelDirection === "right") return { dx: i, dy: 0 };
        return { dx: i, dy: i };
      };

      // 5a. Ambient occlusion blur
      if (bevelBlur && bevelBlur > 0) {
        const blurColor = bevelBlurColor || bevelShadow || "#000000";
        if (ctxSupportsFilter(ctx)) {
          ctx.save();
          ctx.filter = `blur(${bevelBlur}px)`;
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            const { dx, dy } = getDirOffset(i);
            renderLines("fill", blurColor, dx, dy);
          }
          ctx.restore();
        } else {
          // Fallback: use shadow trick
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            const { dx, dy } = getDirOffset(i);
            renderWithShadowTrick("fill", blurColor, bevelBlur, dx, dy, 100);
          }
        }
      }

      // 5b. Gradient-shaded extrusion slabs
      ctx.save();
      for (let i = bevelDepth; i > 0; i--) {
        const { dx, dy } = getDirOffset(i);

        // t=0 at deepest, t=1 at front
        const t = 1 - (i - 1) / Math.max(1, bevelDepth - 1);

        // AO darkening: corners/edges of deep slabs get extra shadow
        // For bottom-right, the diagonal slabs are darkest; side-facing
        // surfaces should be darker than the front face.
        const depthRatio = (i - 1) / Math.max(1, bevelDepth - 1); // 0=front, 1=back
        const aoFactor = 0.25 + 0.75 * (1 - depthRatio * 0.8);

        const baseColor = shadeForDepth(t);
        const baseRgbParsed = (() => {
          const m = baseColor.match(/rgb\((\d+),(\d+),(\d+)\)/);
          return m ? { r: +m[1], g: +m[2], b: +m[3] } : shadowRgb;
        })();
        const shadedColor = `rgb(${Math.round(baseRgbParsed.r * aoFactor)},${Math.round(baseRgbParsed.g * aoFactor)},${Math.round(baseRgbParsed.b * aoFactor)})`;

        renderLines("fill", shadedColor, dx, dy);

        if (bevelEdgeWidth && bevelEdgeWidth > 0) {
          ctx.save();
          // Edge gets progressively darker toward back
          ctx.globalAlpha = 0.4 + 0.6 * (1 - depthRatio);
          ctx.strokeStyle = bevelEdgeColor || "#000000";
          ctx.lineWidth = bevelEdgeWidth;
          ctx.lineJoin = strokeLineJoin || "round";
          renderLines("stroke", undefined, dx, dy);
          ctx.restore();
        }
      }
      ctx.restore();

      // 5c. Specular rim highlight on front-face edge (top-left catch light)
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = bevelHighlight;
      ctx.lineWidth = Math.max(0.5, bevelEdgeWidth || 1.5);
      ctx.lineJoin = "round";
      renderLines("stroke", bevelHighlight, 0, 0);
      ctx.restore();
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 6. Stroke (Under Fill if position inside/outside)
  // ──────────────────────────────────────────────────────────────────
  const applyStroke = () => {
    ctx.save();

    const sType = strokeType || "single";
    const sBlur = strokeBlur || 0;
    const sColorSecondary = strokeColorSecondary || "#FFFFFF";
    const sWidthSecondary = strokeWidthSecondary !== undefined ? strokeWidthSecondary : 4;
    const sFadeRange = strokeFadeRange || 0;

    // Line join alignment
    ctx.lineJoin = strokeLineJoin || "round";

    // 1. Resolve Stroke Style (Color or Gradient/Fade)
    let customStrokeStyle: string | CanvasGradient = strokeColor;
    if (sFadeRange > 0) {
      // Build beautiful vertical fade gradient
      const grad = ctx.createLinearGradient(0, yMin, 0, yMax);
      const rgb = hexToRgb(strokeColor);
      // Base stroke color at peak opacity, fading to 0
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${strokeOpacity / 100})`);
      const fadeLimit = Math.min(1.0, sFadeRange / 100);
      grad.addColorStop(fadeLimit, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      customStrokeStyle = grad;
    }

    const drawStrokeLayer = (color: string | CanvasGradient, width: number, blurAmount: number, opacity: number, position: string) => {
      if (blurAmount > 0 && ctxSupportsFilter(ctx)) {
        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.strokeStyle = color;
        ctx.filter = `blur(${blurAmount}px)`;

        if (position === "outside") {
          ctx.lineWidth = width * 2;
          renderLines("stroke");
        } else if (position === "center") {
          ctx.lineWidth = width;
          renderLines("stroke");
        } else if (position === "inside") {
          // Inside clipping using source-atop
          ctx.globalCompositeOperation = "source-atop";
          ctx.lineWidth = width * 2;
          renderLines("stroke");
        }
        ctx.restore();
      } else if (blurAmount > 0) {
        // Fallback: use shadow trick since ctx.filter is unsupported
        const colorStr = typeof color === "string" ? color : strokeColor;
        const spread = position === "center" ? width / 2 : width;
        if (position === "inside") {
          ctx.save();
          ctx.globalCompositeOperation = "source-atop";
          renderWithShadowTrick("stroke", colorStr, blurAmount, 0, 0, opacity, undefined, spread);
          ctx.restore();
        } else {
          renderWithShadowTrick("stroke", colorStr, blurAmount, 0, 0, opacity, undefined, spread);
        }
      } else {
        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.strokeStyle = color;

        if (position === "outside") {
          ctx.lineWidth = width * 2;
          renderLines("stroke");
        } else if (position === "center") {
          ctx.lineWidth = width;
          renderLines("stroke");
        } else if (position === "inside") {
          // Inside clipping using source-atop
          ctx.globalCompositeOperation = "source-atop";
          ctx.lineWidth = width * 2;
          renderLines("stroke");
        }
        ctx.restore();
      }
    };

    // 2. Multi-layer stroke rendering according to type
    if (sType === "double") {
      // Outer border (secondary): drawn wider underneath
      const outerWidth = strokeWidth + sWidthSecondary;
      drawStrokeLayer(sColorSecondary, outerWidth, sBlur, strokeOpacity, strokePosition);

      // Inner border (primary): drawn sharper on top
      drawStrokeLayer(
        customStrokeStyle,
        strokeWidth,
        0, // inner remains crisp
        strokeOpacity,
        strokePosition,
      );
    } else if (sType === "neon") {
      // Glowing outline style
      // Neon Backing Glow
      drawStrokeLayer(
        strokeColor,
        strokeWidth * 1.8,
        sBlur || 8, // fallback blur to look gorgeous
        strokeOpacity * 0.7,
        strokePosition,
      );
      // Core Neon White center
      drawStrokeLayer("#FFFFFF", strokeWidth * 0.5, 0, 95, strokePosition);
    } else {
      // Normal Single Stroke with customizable blur
      drawStrokeLayer(customStrokeStyle, strokeWidth, sBlur, strokeOpacity, strokePosition);
    }

    ctx.restore();
  };

  // ──────────────────────────────────────────────────────────────────
  // 6.5. Text Multi-Stack Layers
  // ──────────────────────────────────────────────────────────────────
  if (stackEnabled && (stackCount ?? 0) >= 1) {
    const cnt = stackCount ?? 3;
    const offX = stackOffsetX ?? 10;
    const offY = stackOffsetY ?? -10;
    const decay = (stackOpacityDecay ?? 20) / 100;
    const stackColors = [stackColor1 || "#FF7C00", stackColor2 || "#00FFDD", stackColor3 || "#FF00AA", stackColor4 || "#AA00FF"];

    for (let s = cnt; s >= 1; s--) {
      ctx.save();
      const dx = s * offX;
      const dy = s * offY;

      const layerOpacity = Math.max(0.01, 1 - s * decay);
      ctx.globalAlpha = layerOpacity;

      const layerColor = stackColors[(s - 1) % stackColors.length] || "#FFFFFF";

      if (strokeEnabled && strokeWidth > 0 && strokePosition !== "inside") {
        ctx.save();
        ctx.strokeStyle = layerColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = strokeLineJoin;
        ctx.globalAlpha = (strokeOpacity / 100) * layerOpacity;
        renderLines("stroke", layerColor, dx, dy);
        ctx.restore();
      }

      renderLines("fill", layerColor, dx, dy);
      ctx.restore();
    }
  }

  if (strokeEnabled && strokeWidth > 0 && strokePosition !== "inside") {
    applyStroke();
  }

  // ──────────────────────────────────────────────────────────────────
  // 7. Text Fill
  // ──────────────────────────────────────────────────────────────────
  ctx.save();
  let textFill: string | CanvasGradient | CanvasPattern = fillColor;

  if (fillType === "linear" && fillGradientStops.length >= 2) {
    const angleRad = (fillGradientAngle * Math.PI) / 180;
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const r = Math.max(xMax - xMin, yMax - yMin) / 2;

    const x0 = cx - Math.cos(angleRad) * r;
    const y0 = cy - Math.sin(angleRad) * r;
    const x1 = cx + Math.cos(angleRad) * r;
    const y1 = cy + Math.sin(angleRad) * r;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    fillGradientStops.forEach((stop) => {
      grad.addColorStop(stop.offset / 100, stop.color);
    });
    textFill = grad;
  } else if (fillType === "radial" && fillGradientStops.length >= 2) {
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const r = Math.max(xMax - xMin, yMax - yMin) / 1.5;

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    fillGradientStops.forEach((stop) => {
      grad.addColorStop(stop.offset / 100, stop.color);
    });
    textFill = grad;
  } else if (fillType === "pattern") {
    const pType = patternType || "chalk";
    const patColor = fillColor || "#ffffff";

    const patCanvas = createCanvas(128, 128);
    // Pick ideal canvas dimension per pattern style
    if (pType === "carbon") {
      patCanvas.width = 8;
      patCanvas.height = 8;
    } else if (pType === "stripes") {
      patCanvas.width = 16;
      patCanvas.height = 16;
    } else if (pType === "halftone") {
      patCanvas.width = 24;
      patCanvas.height = 24;
    } else if (pType === "noise") {
      patCanvas.width = 96;
      patCanvas.height = 96;
    } else if (pType === "film" || pType === "brushed" || pType === "paper") {
      patCanvas.width = 128;
      patCanvas.height = 128;
    } else if (pType === "marble") {
      patCanvas.width = 256;
      patCanvas.height = 256;
    } else {
      patCanvas.width = 120;
      patCanvas.height = 120;
    }

    const patCtx = getCanvas2DContext(patCanvas)!;

    // Fast stable linear congruential seeded random helper (prevents render flickering)
    const seedRandom = (initSeed: number) => {
      let currentSeed = initSeed;
      return () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        return currentSeed / 4294967296;
      };
    };
    const rand = seedRandom(42); // stable fixed seed

    if (pType === "chalk") {
      patCtx.fillStyle = "rgba(0,0,0,0)";
      patCtx.fillRect(0, 0, 120, 120);

      // 1. Base organic granular/stipple tooth layer
      patCtx.fillStyle = patColor;
      for (let i = 0; i < 3500; i++) {
        const px = Math.floor(rand() * 120);
        const py = Math.floor(rand() * 120);
        patCtx.globalAlpha = 0.08 + rand() * 0.18;
        patCtx.fillRect(px, py, 1.2, 1.2);
      }

      // 2. Beautiful hand-scribbled cross-hatch strokes in 4 orientations
      patCtx.strokeStyle = patColor;
      for (let s = 0; s < 4; s++) {
        const angle = (s * Math.PI) / 4 + (rand() - 0.5) * 0.15;
        patCtx.lineWidth = 0.5 + rand() * 0.9;

        for (let i = 0; i < 40; i++) {
          patCtx.globalAlpha = 0.05 + rand() * 0.16;
          patCtx.beginPath();

          const startX = rand() * 120;
          const startY = rand() * 120;
          const len = 15 + rand() * 30;

          patCtx.moveTo(startX, startY);
          patCtx.lineTo(startX + Math.cos(angle) * len, startY + Math.sin(angle) * len);
          patCtx.stroke();
        }
      }

      // 3. Round chalk dust/sponge overlays
      for (let i = 0; i < 220; i++) {
        const cx = rand() * 120;
        const cy = rand() * 120;
        const r = 1 + rand() * 3;
        patCtx.globalAlpha = 0.03 + rand() * 0.08;
        patCtx.fillStyle = patColor;
        patCtx.beginPath();
        patCtx.arc(cx, cy, r, 0, Math.PI * 2);
        patCtx.fill();
      }
    } else if (pType === "noise") {
      patCtx.fillStyle = "rgba(0,0,0,0)";
      patCtx.fillRect(0, 0, 96, 96);

      patCtx.fillStyle = patColor;
      // Fine micro grainy texture
      for (let i = 0; i < 4500; i++) {
        const px = Math.floor(rand() * 96);
        const py = Math.floor(rand() * 96);
        patCtx.globalAlpha = 0.12 + rand() * 0.38;
        patCtx.fillRect(px, py, rand() > 0.85 ? 1.5 : 1, rand() > 0.85 ? 1.5 : 1);
      }

      // Speckled paper pulp bits
      for (let i = 0; i < 150; i++) {
        const px = Math.floor(rand() * 96);
        const py = Math.floor(rand() * 96);
        const size = 1.6 + rand() * 1.5;
        patCtx.globalAlpha = 0.05 + rand() * 0.12;
        patCtx.fillRect(px, py, size, size);
      }
    } else if (pType === "grunge") {
      patCtx.fillStyle = "rgba(0,0,0,0)";
      patCtx.fillRect(0, 0, 128, 128);

      // 1. Organic distress paint eroded splotches
      patCtx.fillStyle = patColor;
      for (let i = 0; i < 60; i++) {
        const cx = rand() * 128;
        const cy = rand() * 128;
        const r = 3 + rand() * 18;
        patCtx.globalAlpha = 0.06 + rand() * 0.15;
        patCtx.beginPath();
        patCtx.arc(cx, cy, r, 0, Math.PI * 2);
        patCtx.fill();
      }

      // 2. Weathered cracks/scratch lines
      patCtx.strokeStyle = patColor;
      for (let i = 0; i < 22; i++) {
        const sx = rand() * 128;
        const sy = rand() * 128;
        const angle = (rand() * Math.PI) / 3 - Math.PI / 6;
        const len = 12 + rand() * 25;
        patCtx.lineWidth = 0.5 + rand() * 1.5;
        patCtx.globalAlpha = 0.15 + rand() * 0.25;

        patCtx.beginPath();
        patCtx.moveTo(sx, sy);
        patCtx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        patCtx.stroke();
      }

      // 3. Erosion speckles
      for (let i = 0; i < 1800; i++) {
        const px = Math.floor(rand() * 128);
        const py = Math.floor(rand() * 128);
        patCtx.globalAlpha = 0.08 + rand() * 0.22;
        patCtx.fillRect(px, py, 1.2, 1.2);
      }
    } else if (pType === "carbon") {
      patCtx.fillStyle = "rgba(0,0,0,0.15)";
      patCtx.fillRect(0, 0, 8, 8);

      patCtx.fillStyle = patColor;
      patCtx.globalAlpha = 0.65;
      patCtx.fillRect(0, 0, 4, 4);
      patCtx.fillRect(4, 4, 4, 4);

      // Weave highlights
      patCtx.fillStyle = "#FFFFFF";
      patCtx.globalAlpha = 0.22;
      patCtx.fillRect(0, 0, 4, 1);
      patCtx.fillRect(4, 4, 4, 1);

      // Weave shadows
      patCtx.fillStyle = "#000000";
      patCtx.globalAlpha = 0.35;
      patCtx.fillRect(0, 3, 4, 1);
      patCtx.fillRect(4, 7, 4, 1);
    } else if (pType === "stripes") {
      patCtx.fillStyle = "rgba(0,0,0,0)";
      patCtx.fillRect(0, 0, 16, 16);

      patCtx.strokeStyle = patColor;
      patCtx.lineWidth = 3.5;
      patCtx.globalAlpha = 0.65;

      patCtx.beginPath();
      // Infinite tileable slanted lines at 45deg
      patCtx.moveTo(-4, 12);
      patCtx.lineTo(12, -4);

      patCtx.moveTo(0, 16);
      patCtx.lineTo(16, 0);

      patCtx.moveTo(4, 20);
      patCtx.lineTo(20, 4);
      patCtx.stroke();
    } else if (pType === "film") {
      // Authentic cinematic weathered analog negative film texture
      patCtx.fillStyle = patColor;
      patCtx.globalAlpha = 0.94;
      patCtx.fillRect(0, 0, 128, 128);

      // 1. Silver-halide micro emulsion grain (salt & pepper stippling)
      for (let i = 0; i < 4800; i++) {
        const px = Math.floor(rand() * 128);
        const py = Math.floor(rand() * 128);
        const isDark = rand() > 0.45;
        patCtx.fillStyle = isDark ? "#000000" : "#FFFFFF";
        patCtx.globalAlpha = isDark ? 0.13 + rand() * 0.22 : 0.15 + rand() * 0.28;
        patCtx.fillRect(px, py, rand() > 0.9 ? 1.5 : 1, rand() > 0.9 ? 1.5 : 1);
      }

      // 2. High frequency hairline scratches (vertical lines from movie reels)
      patCtx.strokeStyle = "rgba(255, 255, 255, 0.48)";
      for (let i = 0; i < 10; i++) {
        const sx = rand() * 128;
        const sy = rand() * 128;
        const len = 12 + rand() * 45;
        const angle = -Math.PI / 2 + (rand() - 0.5) * 0.18; // mostly vertical vertical motion blur
        patCtx.lineWidth = 0.35 + rand() * 0.55;
        patCtx.globalAlpha = 0.22 + rand() * 0.38;

        patCtx.beginPath();
        patCtx.moveTo(sx, sy);
        patCtx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        patCtx.stroke();
      }

      // Add a few dark vertical emulsion scratches too
      patCtx.strokeStyle = "rgba(0, 0, 0, 0.32)";
      for (let i = 0; i < 5; i++) {
        const sx = rand() * 128;
        const sy = rand() * 128;
        const len = 15 + rand() * 50;
        const angle = -Math.PI / 2 + (rand() - 0.5) * 0.12;
        patCtx.lineWidth = 0.3 + rand() * 0.5;
        patCtx.globalAlpha = 0.18 + rand() * 0.25;

        patCtx.beginPath();
        patCtx.moveTo(sx, sy);
        patCtx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        patCtx.stroke();
      }

      // 3. Squiggly hair fibers & dust lint paths
      patCtx.strokeStyle = "rgba(0, 0, 0, 0.48)";
      for (let i = 0; i < 4; i++) {
        const sx = rand() * 128;
        const sy = rand() * 128;
        patCtx.lineWidth = 0.55 + rand() * 0.65;
        patCtx.globalAlpha = 0.35 + rand() * 0.3;

        patCtx.beginPath();
        patCtx.moveTo(sx, sy);
        // Curved organic fuzzy lint path
        patCtx.quadraticCurveTo(sx + (rand() - 0.5) * 16, sy + (rand() - 0.5) * 16, sx + (rand() - 0.5) * 28, sy + (rand() - 0.5) * 28);
        patCtx.stroke();
      }

      // 4. White light leaks/reflective silver specks
      patCtx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 30; i++) {
        const cx = rand() * 128;
        const cy = rand() * 128;
        const r = 0.75 + rand() * 2.4;
        patCtx.globalAlpha = 0.25 + rand() * 0.5;
        patCtx.beginPath();
        patCtx.arc(cx, cy, r, 0, Math.PI * 2);
        patCtx.fill();
      }

      // 5. Dark soot/ash/fungus dots
      patCtx.fillStyle = "#000000";
      for (let i = 0; i < 20; i++) {
        const cx = rand() * 128;
        const cy = rand() * 128;
        const r = 0.65 + rand() * 2.0;
        patCtx.globalAlpha = 0.2 + rand() * 0.4;
        patCtx.beginPath();
        patCtx.arc(cx, cy, r, 0, Math.PI * 2);
        patCtx.fill();
      }
    } else if (pType === "brushed") {
      // High fidelity directional brushed metal finish
      patCtx.fillStyle = patColor;
      patCtx.fillRect(0, 0, 128, 128);

      // Horizontal hairline scratches & light/dark strips
      for (let i = 0; i < 350; i++) {
        const y = rand() * 128;
        const x = rand() * 128;
        const len = 30 + rand() * 80;
        const thickness = 0.5 + rand() * 1.5;
        const isLight = rand() > 0.45;

        patCtx.strokeStyle = isLight ? "#FFFFFF" : "#000000";
        patCtx.globalAlpha = isLight ? 0.04 + rand() * 0.12 : 0.03 + rand() * 0.08;
        patCtx.lineWidth = thickness;

        patCtx.beginPath();
        patCtx.moveTo(x, y);
        patCtx.lineTo(x + len, y); // horizontal brush
        patCtx.stroke();

        // Wrap-around for seamless tiling repeat
        if (x + len > 128) {
          patCtx.beginPath();
          patCtx.moveTo(x - 128, y);
          patCtx.lineTo(x + len - 128, y);
          patCtx.stroke();
        }
      }

      // Add subtle larger vertical grain/shading bands to break flat monotony
      for (let i = 0; i < 8; i++) {
        const x = rand() * 128;
        const w = 10 + rand() * 30;
        const isLight = rand() > 0.5;
        const grad = patCtx.createLinearGradient(x, 0, x + w, 0);
        const baseColor = isLight ? "255,255,255" : "0,0,0";
        const alpha = 0.01 + rand() * 0.04;
        grad.addColorStop(0, `rgba(${baseColor}, 0)`);
        grad.addColorStop(0.5, `rgba(${baseColor}, ${alpha})`);
        grad.addColorStop(1, `rgba(${baseColor}, 0)`);

        patCtx.fillStyle = grad;
        patCtx.globalAlpha = 1;
        patCtx.fillRect(x, 0, w, 128);

        // Wrap-around vertically/horizontally
        if (x + w > 128) {
          patCtx.fillRect(x - 128, 0, w, 128);
        }
      }
    } else if (pType === "marble") {
      // High luxury swirling stone veins
      patCtx.fillStyle = patColor;
      patCtx.fillRect(0, 0, 256, 256);

      // Soft broad marble smoke cloud layer
      for (let i = 0; i < 8; i++) {
        const cx = rand() * 256;
        const cy = rand() * 256;
        const r = 40 + rand() * 70;
        const grad = patCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const isLight = rand() > 0.45;
        const alpha = 0.06 + rand() * 0.12;
        const cStr = isLight ? "255,255,255" : "0,0,0";
        grad.addColorStop(0, `rgba(${cStr}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${cStr}, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(${cStr}, 0)`);

        patCtx.fillStyle = grad;
        patCtx.globalAlpha = 1;
        patCtx.beginPath();
        patCtx.arc(cx, cy, r, 0, Math.PI * 2);
        patCtx.fill();
      }

      // Procedural organic fracture veins
      const drawMarbleVein = (color: string, width: number, opac: number) => {
        patCtx.strokeStyle = color;
        patCtx.lineWidth = width;
        patCtx.globalAlpha = opac;

        // We start on one side, randomly walk to another
        let px = rand() * 256;
        let py = 0;
        patCtx.beginPath();
        patCtx.moveTo(px, py);

        const steps = 18;
        for (let s = 1; s <= steps; s++) {
          const progress = s / steps;
          const targetY = progress * 256;
          // Add fractal noise shift to X
          const frequency = 4;
          const amp = 35;
          const noise = Math.sin(progress * Math.PI * frequency + rand() * 2) * amp;
          const targetX = (px + (rand() - 0.5) * 50 + noise + 256) % 256;

          patCtx.lineTo(targetX, targetY);
        }
        patCtx.stroke();
      };

      // Draw primary deep veins
      for (let i = 0; i < 4; i++) {
        drawMarbleVein("#000000", 1.2 + rand() * 1.5, 0.15 + rand() * 0.15);
      }
      // Draw secondary golden/light accent veins
      for (let i = 0; i < 3; i++) {
        const isGold = rand() > 0.4;
        const vColor = isGold ? "#EAB308" : "#FFFFFF"; // Gold or bright white
        drawMarbleVein(vColor, 0.7 + rand() * 0.8, 0.2 + rand() * 0.2);
      }
      // Draw micro thin hairline fractures
      for (let i = 0; i < 5; i++) {
        drawMarbleVein("#000000", 0.4, 0.08 + rand() * 0.06);
      }
    } else if (pType === "halftone") {
      // Pop-art comic screen dot halftone print
      patCtx.fillStyle = "rgba(0,0,0,0)";
      patCtx.fillRect(0, 0, 24, 24);

      // Draw a dark halftone shadow dot
      const dotColor = fillColor || "#ffffff";

      // Halftone dots grid (offset pattern)
      patCtx.fillStyle = "#000000";
      patCtx.globalAlpha = 0.35;
      // Background dark shadow offset dot
      patCtx.beginPath();
      patCtx.arc(12, 12, 5.5, 0, Math.PI * 2);
      patCtx.arc(0, 0, 3.5, 0, Math.PI * 2);
      patCtx.arc(24, 0, 3.5, 0, Math.PI * 2);
      patCtx.arc(0, 24, 3.5, 0, Math.PI * 2);
      patCtx.arc(24, 24, 3.5, 0, Math.PI * 2);
      patCtx.fill();

      // Main foreground overlay dots
      patCtx.fillStyle = dotColor;
      patCtx.globalAlpha = 0.95;
      patCtx.beginPath();
      patCtx.arc(11, 11, 5.0, 0, Math.PI * 2);
      patCtx.arc(0, 0, 3.0, 0, Math.PI * 2);
      patCtx.arc(24, 0, 3.0, 0, Math.PI * 2);
      patCtx.arc(0, 24, 3.0, 0, Math.PI * 2);
      patCtx.arc(24, 24, 3.0, 0, Math.PI * 2);
      patCtx.fill();

      // Pop-art miniature helper offset microdots
      patCtx.fillStyle = dotColor === "#FFFFFF" || dotColor === "#ffffff" ? "#7C6FFF" : "#FFFFFF";
      patCtx.globalAlpha = 0.55;
      patCtx.beginPath();
      patCtx.arc(12, 0, 1.5, 0, Math.PI * 2);
      patCtx.arc(12, 24, 1.5, 0, Math.PI * 2);
      patCtx.arc(0, 12, 1.5, 0, Math.PI * 2);
      patCtx.arc(24, 12, 1.5, 0, Math.PI * 2);
      patCtx.fill();
    } else if (pType === "paper") {
      // High luxury organic crumpled Japanese handmade washi / craft paper
      patCtx.fillStyle = patColor;
      patCtx.fillRect(0, 0, 128, 128);

      // 1. Organic handmade pulp fiber threads
      for (let i = 0; i < 350; i++) {
        const fx = rand() * 128;
        const fy = rand() * 128;
        const flen = 3 + rand() * 12;
        const fangle = rand() * Math.PI * 2;
        const isDark = rand() > 0.4;

        patCtx.strokeStyle = isDark ? "#000000" : "#FFFFFF";
        patCtx.globalAlpha = isDark ? 0.03 + rand() * 0.08 : 0.05 + rand() * 0.12;
        patCtx.lineWidth = 0.4 + rand() * 0.7;

        patCtx.beginPath();
        patCtx.moveTo(fx, fy);
        // Slightly wavy pulp threads
        patCtx.quadraticCurveTo(fx + Math.cos(fangle) * flen * 0.5 + (rand() - 0.5) * 4, fy + Math.sin(fangle) * flen * 0.5 + (rand() - 0.5) * 4, fx + Math.cos(fangle) * flen, fy + Math.sin(fangle) * flen);
        patCtx.stroke();
      }

      // 2. Fine paper mill grain tooth/pores
      for (let i = 0; i < 5000; i++) {
        const gx = Math.floor(rand() * 128);
        const gy = Math.floor(rand() * 128);
        const isDark = rand() > 0.5;
        patCtx.fillStyle = isDark ? "#000000" : "#FFFFFF";
        patCtx.globalAlpha = isDark ? 0.04 : 0.06;
        patCtx.fillRect(gx, gy, 1, 1);
      }

      // 3. Realistic 3D folded origami crease facets (gradient shading plates to represent folded planes)
      const points: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        points.push([rand() * 128, rand() * 128]);
      }
      // Add corners
      points.push([0, 0], [128, 0], [128, 128], [0, 128]);

      // Connect into triangular shadow faces
      for (let i = 0; i < 15; i++) {
        const p1 = points[Math.floor(rand() * points.length)];
        const p2 = points[Math.floor(rand() * points.length)];
        const p3 = points[Math.floor(rand() * points.length)];

        if (p1 !== p2 && p2 !== p3) {
          const grad = patCtx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
          const alpha = 0.01 + rand() * 0.06;
          const isDark = rand() > 0.5;
          const cStr = isDark ? "0,0,0" : "255,255,255";
          grad.addColorStop(0, `rgba(${cStr}, ${alpha})`);
          grad.addColorStop(1, `rgba(${cStr}, 0)`);

          patCtx.fillStyle = grad;
          patCtx.globalAlpha = 1;
          patCtx.beginPath();
          patCtx.moveTo(p1[0], p1[1]);
          patCtx.lineTo(p2[0], p2[1]);
          patCtx.lineTo(p3[0], p3[1]);
          patCtx.closePath();
          patCtx.fill();
        }
      }

      // 4. Sharp crumpled ridge/valley crease lines (dark side and light side)
      for (let i = 0; i < 12; i++) {
        const sx = rand() * 128;
        const sy = rand() * 128;
        const ex = rand() * 128;
        const ey = rand() * 128;
        const dx = ex - sx;
        const dy = ey - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;

        const nx = -dy / len; // normal vector
        const ny = dx / len;

        // Outer shadow line
        patCtx.strokeStyle = "#000000";
        patCtx.lineWidth = 0.5 + rand() * 1.2;
        patCtx.globalAlpha = 0.05 + rand() * 0.12;
        patCtx.beginPath();
        patCtx.moveTo(sx + nx * 0.8, sy + ny * 0.8);
        patCtx.lineTo(ex + nx * 0.8, ey + ny * 0.8);
        patCtx.stroke();

        // Core sharp shadow ridge
        patCtx.strokeStyle = "#000000";
        patCtx.lineWidth = 0.3 + rand() * 0.4;
        patCtx.globalAlpha = 0.08 + rand() * 0.15;
        patCtx.beginPath();
        patCtx.moveTo(sx, sy);
        patCtx.lineTo(ex, ey);
        patCtx.stroke();

        // Highlights on flipped opposite side
        patCtx.strokeStyle = "#FFFFFF";
        patCtx.lineWidth = 0.6 + rand() * 1.5;
        patCtx.globalAlpha = 0.08 + rand() * 0.22;
        patCtx.beginPath();
        patCtx.moveTo(sx - nx * 0.8, sy - ny * 0.8);
        patCtx.lineTo(ex - nx * 0.8, ey - ny * 0.8);
        patCtx.stroke();
      }
    }

    const pat = ctx.createPattern(patCanvas, "repeat");
    if (pat) {
      textFill = pat;
    }
  }

  // Seedable random helper to prevent rendering flicker
  const createSeededRand = (seed: number) => {
    let val = seed;
    return () => {
      val = (val * 9301 + 49297) % 233280;
      return val / 233280;
    };
  };

  const isInkStyle = cfg.effectName.toLowerCase().includes("ink") || cfg.fontFamily.toLowerCase().includes("brush") || cfg.effectName.toLowerCase().includes("grunge") || cfg.effectName.toLowerCase().includes("scratch") || cfg.fontFamily === "Permanent Marker";

  if (isInkStyle) {
    // 1. Create offscreen canvas for the ink layer to yield a perfect text shape scanning
    const tCanvas = createCanvas(cWidth, cHeight);
    tCanvas.width = cWidth;
    tCanvas.height = cHeight;
    const tCtx = getCanvas2DContext(tCanvas);

    if (tCtx) {
      tCtx.font = fontStr;
      tCtx.textAlign = align;
      tCtx.textBaseline = "alphabetic";

      const rand = createSeededRand(text.length * 171 + fontSize * 11 + (fillColor ? fillColor.length : 1));

      // Render base clean text in solid white
      tCtx.fillStyle = "#FFFFFF";
      const originalLSpacing = (tCtx as any).letterSpacing || "normal";
      if (letterSpacing !== 0) {
        (tCtx as any).letterSpacing = `${letterSpacing}px`;
      }

      lines.forEach((line, index) => {
        const py = startY + index * lineAdvance;
        tCtx.fillText(line, startX, py);
      });

      // 2. Scan bounding region of the text
      const mxMin = Math.max(0, Math.floor(xMin - 20));
      const mxMax = Math.min(cWidth - 1, Math.ceil(xMax + 20));
      const myMin = Math.max(0, Math.floor(yMin - 20));
      const myMax = Math.min(cHeight - 1, Math.ceil(yMax + 20));

      const scanW = mxMax - mxMin;
      const scanH = myMax - myMin;

      if (scanW > 0 && scanH > 0) {
        const imgData = tCtx.getImageData(mxMin, myMin, scanW, scanH);
        const data = imgData.data;

        const isFilled = (coordX: number, coordY: number) => {
          if (coordX < 0 || coordX >= scanW || coordY < 0 || coordY >= scanH) return false;
          const idx = (coordY * scanW + coordX) * 4;
          return data[idx + 3] > 70;
        };

        const topEdges: { x: number; y: number }[] = [];
        const bottomEdges: { x: number; y: number }[] = [];
        const boundaryEdges: { x: number; y: number }[] = [];
        const insidePixels: { x: number; y: number }[] = [];

        for (let y = 1; y < scanH - 1; y += 1) {
          for (let x = 1; x < scanW - 1; x += 1) {
            if (isFilled(x, y)) {
              const emptyLeft = !isFilled(x - 1, y);
              const emptyRight = !isFilled(x + 1, y);
              const emptyTop = !isFilled(x, y - 1);
              const emptyBottom = !isFilled(x, y + 1);

              if (emptyTop) {
                topEdges.push({ x: mxMin + x, y: myMin + y });
              } else if (emptyBottom) {
                bottomEdges.push({ x: mxMin + x, y: myMin + y });
              } else if (emptyLeft || emptyRight) {
                boundaryEdges.push({ x: mxMin + x, y: myMin + y });
              } else {
                if (rand() < 0.15) {
                  insidePixels.push({ x: mxMin + x, y: myMin + y });
                }
              }
            }
          }
        }

        tCtx.strokeStyle = "#FFFFFF";
        tCtx.fillStyle = "#FFFFFF";

        // A. Draw bold tapered bristles at Top Edges starting from lifted brush bristles
        const topSampleRate = 5;
        for (let i = 0; i < topEdges.length; i += topSampleRate) {
          const pt = topEdges[i];
          const h = fontSize * (0.06 + rand() * 0.16); // nice medium lengths
          const w = 1.8 + rand() * 2.5; // tapered width
          const slantOffset = h * 0.22; // italic diagonal alignment

          tCtx.beginPath();
          tCtx.moveTo(pt.x - w / 2, pt.y);
          tCtx.lineTo(pt.x + w / 2, pt.y);
          tCtx.lineTo(pt.x + slantOffset, pt.y - h);
          tCtx.closePath();
          tCtx.fill();
        }

        // B. Draw bold tapered bristles at Bottom Edges
        const bottomSampleRate = 5;
        for (let i = 0; i < bottomEdges.length; i += bottomSampleRate) {
          const pt = bottomEdges[i];
          const h = fontSize * (0.07 + rand() * 0.2);
          const w = 1.8 + rand() * 2.5;
          const slantOffset = -h * 0.22;

          tCtx.beginPath();
          tCtx.moveTo(pt.x - w / 2, pt.y);
          tCtx.lineTo(pt.x + w / 2, pt.y);
          tCtx.lineTo(pt.x + slantOffset, pt.y + h);
          tCtx.closePath();
          tCtx.fill();
        }

        // C. Draw micro jitter & rough edges on left/right boundary sides (rely on paper grain tooth)
        const boundarySampleRate = 3;
        for (let i = 0; i < boundaryEdges.length; i += boundarySampleRate) {
          const pt = boundaryEdges[i];
          const r = 0.5 + rand() * 1.5;
          tCtx.beginPath();
          tCtx.arc(pt.x + (rand() - 0.5) * 1.2, pt.y + (rand() - 0.5) * 1.2, r, 0, Math.PI * 2);
          tCtx.fill();
        }

        // D. Scatter fine sparse ink spray splatters
        const splatterCount = Math.floor(fontSize * 0.5);
        for (let s = 0; s < splatterCount; s++) {
          const pt = boundaryEdges[Math.floor(rand() * boundaryEdges.length)] || topEdges[Math.floor(rand() * topEdges.length)];
          if (pt) {
            const dist = 3 + rand() * (fontSize * 0.24);
            const angle = rand() * Math.PI * 2;
            const sx = pt.x + Math.cos(angle) * dist;
            const sy = pt.y + Math.sin(angle) * dist;

            const size = 0.4 + rand() * 1.6;
            tCtx.globalAlpha = 0.25 + rand() * 0.65;

            tCtx.beginPath();
            tCtx.arc(sx, sy, size, 0, Math.PI * 2);
            tCtx.fill();
            tCtx.globalAlpha = 1.0;
          }
        }

        // E. Slice very subtle, low-density inner dry brush stripper lines (grunge scratches)
        tCtx.save();
        tCtx.globalCompositeOperation = "destination-out";
        const scratchCount = Math.floor(fontSize * 0.42);
        for (let i = 0; i < scratchCount; i++) {
          const pt = insidePixels[Math.floor(rand() * insidePixels.length)];
          if (pt) {
            const len = fontSize * (0.06 + rand() * 0.14);
            const angle = -Math.PI / 4.2 + (rand() - 0.5) * 0.1;
            tCtx.lineWidth = 0.5 + rand() * 0.8;
            tCtx.globalAlpha = 0.2 + rand() * 0.4;

            tCtx.beginPath();
            tCtx.moveTo(pt.x - Math.cos(angle) * (len / 2), pt.y - Math.sin(angle) * (len / 2));
            tCtx.lineTo(pt.x + Math.cos(angle) * (len / 2), pt.y + Math.sin(angle) * (len / 2));
            tCtx.stroke();
          }
        }
        tCtx.restore();
      }

      (tCtx as any).letterSpacing = originalLSpacing;

      // Finalize canvas layers: Tint offscreen result to user textFill color & blend on screen
      ctx.save();
      const tintCanvas = createCanvas(cWidth, cHeight);
      tintCanvas.width = cWidth;
      tintCanvas.height = cHeight;
      const tintCtx = getCanvas2DContext(tintCanvas);
      if (tintCtx) {
        tintCtx.drawImage(tCanvas, 0, 0);
        tintCtx.globalCompositeOperation = "source-in";
        tintCtx.fillStyle = textFill;
        tintCtx.fillRect(0, 0, cWidth, cHeight);
        ctx.drawImage(tintCanvas, 0, 0);
      }
      ctx.restore();
    }
  } else {
    ctx.save();
    if (fillType !== "none") {
      if (usePerCharFill && fillType === "solid") {
        renderLines("fill", undefined, 0, 0, { perCharFill: true });
      } else {
        renderLines("fill", textFill);
      }
    }
    ctx.restore();
  }

  // Inside stroke
  if (strokeEnabled && strokeWidth > 0 && strokePosition === "inside") {
    applyStroke();
  }

  // ──────────────────────────────────────────────────────────────────
  // ── Inner Glow & Inner Shadow ──────────────────────────────────────────────
  // Uses source-atop compositing so effects only appear inside the text silhouette.
  // renderWithShadowTrick requires an opaque fill color to cast a visible shadow —
  // "transparent" produces no shadow because Canvas 2D modulates shadow alpha by
  // the source pixel alpha. "#000" is used as the opaque source; the actual glow
  // color is set via ctx.shadowColor inside renderWithShadowTrick.
  glowLayers.forEach((layer) => {
    if (layer.enabled && layer.type === "inner" && layer.opacity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      const renderCount = Math.max(1, Math.min(20, layer.strength ?? 1));
      for (let i = 0; i < renderCount; i++) {
        renderWithShadowTrick("fill", layer.color, layer.blur, 0, 0, layer.opacity, "#000000", layer.spread ?? 0);
      }
      ctx.restore();
    }
  });

  // Inner Shadow
  if (shadowEnabled && shadowType === "inner" && shadowOpacity > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    renderWithShadowTrick("fill", shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity, "#000000");
    ctx.restore();
  }

  // ──────────────────────────────────────────────────────────────────
  // 9. Glitch Overlay Scanner Lines
  // ──────────────────────────────────────────────────────────────────
  if (isGlitch) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1.5;
    for (let ly = yMin; ly < yMax; ly += 4) {
      ctx.beginPath();
      ctx.moveTo(xMin - 50, ly);
      ctx.lineTo(xMax + 50, ly);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class TextEffectRenderer {
  public static draw(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cfg: TextEffectConfig, _time = 0): void {
    renderTextEffectCore(ctx, cfg);
  }
}
