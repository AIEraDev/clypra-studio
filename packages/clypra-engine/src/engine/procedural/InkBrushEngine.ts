import { TextEffectConfig } from "../../types";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from "../schema";
import { createCanvas, getCanvas2DContext, seededRandom, textSeed, hexToRgb } from "./utils";

export class InkBrushEngine {
  private cfg: Required<TextEffectConfig>;
  private bristleLines: Array<{ y: number; x0: number; x1: number; opacity: number; lineWidth: number }> = [];
  private grainDots: Array<{ x: number; y: number; opacity: number }> = [];
  private drips: Array<{
    x: number;
    startY: number;
    length: number;
    startWidth: number;
    endWidth: number;
    startOpacity: number;
    hasBlob: boolean;
    blobRadius: number;
  }> = [];

  constructor(config: Partial<TextEffectConfig>) {
    const defaults: Required<TextEffectConfig> = {
      text: "INK",
      effectName: "InkBrush",
      fontFamily: "Bebas Neue",
      fontWeight: 900,
      fontStyle: "italic",
      fontSize: 96,
      letterSpacing: 2,
      lineHeight: 1.1,
      fireFlameHeight: 0,
      iceIcicleHeight: 0,
      iceSnowHeight: 0,
      auraReach: 0,
      wrapText: true,
      autoFitText: false,
      perCharFillEnabled: false,
      charFillColors: [],
      fillType: "solid",
      fillColor: "#FFFFFF",
      fillGradientAngle: 90,
      fillGradientStops: [],
      patternType: "chalk",
      strokeEnabled: false,
      strokeColor: "#000000",
      strokeWidth: 0,
      strokePosition: "outside",
      strokeOpacity: 100,
      strokeLineJoin: "round",
      strokeBlur: 0,
      strokeType: "single",
      strokeColorSecondary: "#FFFFFF",
      strokeWidthSecondary: 4,
      strokeFadeRange: 0,
      glowLayers: [],
      shadowEnabled: false,
      shadowColor: "#000000",
      shadowBlur: 10,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
      shadowOpacity: 80,
      shadowType: "drop",
      bevelEnabled: false,
      bevelDepth: 5,
      bevelHighlight: "#FFFFFF",
      bevelShadow: "#000000",
      bevelDirection: "bottom-right",
      bevelCoreColor: "#000000",
      bevelEdgeColor: "#2A2A38",
      bevelEdgeWidth: 0,
      bevelBlur: 0,
      bevelBlurColor: "#000000",
      bevelPerspectiveEnabled: false,
      bevelVanishingPointX: 40,
      bevelVanishingPointY: 80,
      bevelFocalLength: 400,
      stackEnabled: false,
      stackCount: 3,
      stackOffsetX: 10,
      stackOffsetY: -10,
      stackOpacityDecay: 20,
      stackColor1: "#FF7C00",
      stackColor2: "#00FFDD",
      stackColor3: "#FF00AA",
      stackColor4: "#AA00FF",
      panelEnabled: false,
      panelColor: "#1E1E26",
      panelOpacity: 80,
      panelRadius: 12,
      panelPaddingX: 40,
      panelPaddingY: 20,
      panelStrokeEnabled: false,
      panelStrokeColor: "#2A2A38",
      panelStrokeWidth: 2,
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
      textPosX: "center",
      textPosY: "middle",
      inkColor: "#FFFFFF",
      bristleDensity: 0.8,
      bristleSkipRate: 0.2,
      dripRate: 0.3,
      dripMaxLength: 40,
      grainDensity: 0.15,
      skewX: -0.2,
      customRenderer: "InkBrushEngine",
    };

    this.cfg = {
      ...defaults,
      ...config,
    } as Required<TextEffectConfig>;

    this.precomputeData();
  }

  private precomputeData() {
    const { text, fontFamily, fontWeight, fontStyle, fontSize, letterSpacing, lineHeight, canvasWidth, canvasHeight, textPosX, textPosY, bristleDensity, bristleSkipRate, dripRate, dripMaxLength, grainDensity, skewX } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;

    const rand = seededRandom(textSeed(text));

    let canvas = createCanvas(width, height);

    canvas.width = width;
    canvas.height = height;
    const ctx = getCanvas2DContext(canvas);
    if (!ctx) return;

    const lines = text.split("\n");
    const numLines = lines.length;
    const textBlockHeight = fontSize + (numLines - 1) * fontSize * lineHeight;

    let startX = width / 2;
    let align: CanvasTextAlign = "center";
    if (textPosX === "left") {
      startX = 50;
      align = "left";
    } else if (textPosX === "right") {
      startX = width - 50;
      align = "right";
    }
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.font = fontStr;

    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.85;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.85;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.85;
    }

    ctx.save();
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    ctx.fillStyle = "#FFFFFF";
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.fillText(line, startX, py);
    });
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    let minY = height;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minY >= maxY) return;

    // Generate bristle lines
    const step = Math.max(1, Math.min(3, 1 / bristleDensity));
    for (let y = minY; y <= maxY; y += step) {
      const segments: Array<{ xStart: number; xEnd: number }> = [];
      let inSegment = false;
      let xStart = 0;
      const targetY = Math.floor(y);

      for (let x = 0; x < width; x++) {
        const idx = (targetY * width + x) * 4;
        const isInside = pixels[idx + 3] > 128;
        if (isInside && !inSegment) {
          inSegment = true;
          xStart = x;
        } else if (!isInside && inSegment) {
          inSegment = false;
          segments.push({ xStart, xEnd: x - 1 });
        }
      }
      if (inSegment) {
        segments.push({ xStart, xEnd: width - 1 });
      }

      for (const seg of segments) {
        if (rand() < bristleSkipRate) continue;

        const segW = seg.xEnd - seg.xStart;
        const startLimit = seg.xStart + rand() * Math.min(15, segW * 0.2);
        const endLimit = seg.xEnd - rand() * Math.min(15, segW * 0.2);

        if (startLimit >= endLimit) continue;

        const opacity = 0.4 + rand() * 0.6;
        const lw = 0.5 + rand() * 1.5;

        const hasGap = rand() < 0.1;
        if (hasGap) {
          const gapPct = 0.3 + rand() * 0.4;
          const gapLen = 5 + rand() * 15;
          const midX = startLimit + (endLimit - startLimit) * gapPct;

          const p1Start = startLimit;
          const p1End = Math.max(startLimit, midX - gapLen / 2);
          const p2Start = Math.min(endLimit, midX + gapLen / 2);
          const p2End = endLimit;

          if (p1End > p1Start) {
            this.bristleLines.push({ y: targetY, x0: p1Start, x1: p1End, opacity, lineWidth: lw });
          }
          if (p2End > p2Start) {
            this.bristleLines.push({ y: targetY, x0: p2Start, x1: p2End, opacity, lineWidth: lw });
          }
        } else {
          this.bristleLines.push({ y: targetY, x0: startLimit, x1: endLimit, opacity, lineWidth: lw });
        }
      }
    }

    // Generate grain dots
    for (let y = minY; y <= maxY; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          if (rand() < grainDensity) {
            this.grainDots.push({
              x,
              y,
              opacity: 0.2 + rand() * 0.3,
            });
          }
        }
      }
    }

    // Identify bottom edge pixels for drip column mapping
    const bottomRowForCol = new Array(width).fill(-1);
    for (let x = 0; x < width; x++) {
      for (let y = height - 1; y >= 0; y--) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          bottomRowForCol[x] = y;
          break;
        }
      }
    }

    // Generate drips
    for (let x = 0; x < width; x++) {
      const sY = bottomRowForCol[x];
      if (sY === -1) continue;

      if (rand() < dripRate) {
        const length = 8 + rand() * (dripMaxLength - 8);
        const startWidth = 1 + rand() * 1;
        const endWidth = rand() < 0.5 ? startWidth : 0.5;
        const startOpacity = 0.6 + rand() * 0.3;
        const hasBlob = rand() < 0.6;
        const blobRadius = 1.5 + rand() * 1.5;

        this.drips.push({
          x,
          startY: sY,
          length,
          startWidth,
          endWidth,
          startOpacity,
          hasBlob,
          blobRadius,
        });
      }
    }
  }

  advanceSteps(steps: number) {
    // No-op
  }

  drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const { text, fontFamily, fontWeight, fontStyle, fontSize, letterSpacing, lineHeight, canvasWidth, canvasHeight, textPosX, textPosY, skewX, inkColor } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;

    const lines = text.split("\n");
    const numLines = lines.length;
    const textBlockHeight = fontSize + (numLines - 1) * fontSize * lineHeight;

    let startX = width / 2;
    let align: CanvasTextAlign = "center";
    if (textPosX === "left") {
      startX = 50;
      align = "left";
    } else if (textPosX === "right") {
      startX = width - 50;
      align = "right";
    }
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.font = fontStr;

    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.85;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.85;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.85;
    }

    ctx.save();
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    // Phase A Text clip mask draw
    ctx.fillStyle = inkColor;
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.fillText(line, startX, py);
    });
    ctx.restore();

    ctx.save();

    // Phase B Brush fill horizontal strokes clipped under source-in
    ctx.globalCompositeOperation = "source-in";

    ctx.strokeStyle = inkColor;
    this.bristleLines.forEach((line) => {
      ctx.globalAlpha = line.opacity;
      ctx.lineWidth = line.lineWidth;
      ctx.beginPath();
      ctx.moveTo(line.x0, line.y);
      ctx.lineTo(line.x1, line.y);
      ctx.stroke();
    });

    // Noise paper grain pass
    ctx.fillStyle = inkColor;
    this.grainDots.forEach((dot) => {
      ctx.globalAlpha = dot.opacity;
      ctx.fillRect(dot.x, dot.y, 1, 1);
    });

    ctx.restore(); // Restores normal source-over composting and unskewed state

    const inkRgb = hexToRgb(inkColor);

    // Phase C Paint drips
    ctx.save();
    this.drips.forEach((drip) => {
      const grad = ctx.createLinearGradient(drip.x, drip.startY, drip.x, drip.startY + drip.length);
      grad.addColorStop(0, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${drip.startOpacity})`);
      grad.addColorStop(1, `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = drip.startWidth;

      ctx.beginPath();
      ctx.moveTo(drip.x, drip.startY);
      ctx.lineTo(drip.x, drip.startY + drip.length);
      ctx.stroke();

      if (drip.hasBlob) {
        ctx.fillStyle = `rgba(${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}, ${drip.startOpacity * 0.5})`;
        ctx.beginPath();
        ctx.arc(drip.x, drip.startY + drip.length, drip.blobRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
