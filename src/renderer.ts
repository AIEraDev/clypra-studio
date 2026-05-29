import { TextEffectConfig, GradientStop, GlowLayer } from "./types";
import { computeTextLayout } from "./engine/textLayout";
import { drawPerCharText, shouldUsePerCharFill } from "./engine/perCharFill";

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type NodeCanvasFactory = (width: number, height: number) => HTMLCanvasElement;

function createCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const runtimeCanvasFactory = (globalThis as typeof globalThis & { __clypraCreateCanvas?: NodeCanvasFactory })
    .__clypraCreateCanvas;
  if (runtimeCanvasFactory) {
    return runtimeCanvasFactory(w, h);
  }
  try {
    // Keep the native canvas package out of Vite/esbuild browser prebundles.
    const nodeRequire = (0, eval)("require") as (id: string) => unknown;
    const nodeCanvas = nodeRequire("@napi-rs/canvas") as {
      createCanvas: (width: number, height: number) => HTMLCanvasElement;
    };
    return nodeCanvas.createCanvas(w, h);
  } catch {
    throw new Error("No canvas implementation found in this environment.");
  }
}

function getCanvas2DContext(canvas: HTMLCanvasElement | OffscreenCanvas): Canvas2DContext | null {
  return canvas.getContext("2d") as Canvas2DContext | null;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function textSeed(text: string): number {
  return text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9301 % 49297;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

function mixHexColor(colorA: string, colorB: string, ratio: number): string {
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
      canvasWidth: 800,
      canvasHeight: 200,
      textPosX: "center",
      textPosY: "middle",
      inkColor: "#FFFFFF",
      bristleDensity: 0.8,
      bristleSkipRate: 0.20,
      dripRate: 0.30,
      dripMaxLength: 40,
      grainDensity: 0.15,
      skewX: -0.2,
      fireColor: "#FF5500",
      fireIntensity: 5,
      fireFlameHeight: 80,
      fireEmberCount: 150,
      iceColor: "#AADDFF",
      iceThickness: 6,
      iceIcicleHeight: 25,
      iceFrostDensity: 0.6,
      iceSnowHeight: 10,
      auraColor: "#A855F7",
      auraGlowColor: "#6B21A8",
      auraIntensity: 6,
      auraReach: 35,
      auraParticleCount: 160,
      customRenderer: "InkBrushEngine"
    };

    this.cfg = {
      ...defaults,
      ...config
    } as Required<TextEffectConfig>;

    this.precomputeData();
  }

  private precomputeData() {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      bristleDensity,
      bristleSkipRate,
      dripRate,
      dripMaxLength,
      grainDensity,
      skewX
    } = this.cfg;

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
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

        const hasGap = rand() < 0.10;
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
              opacity: 0.2 + rand() * 0.3
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
          blobRadius
        });
      }
    }
  }

  advanceSteps(steps: number) {
    // No-op
  }

  drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      skewX,
      inkColor
    } = this.cfg;

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
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
    this.bristleLines.forEach(line => {
      ctx.globalAlpha = line.opacity;
      ctx.lineWidth = line.lineWidth;
      ctx.beginPath();
      ctx.moveTo(line.x0, line.y);
      ctx.lineTo(line.x1, line.y);
      ctx.stroke();
    });

    // Noise paper grain pass
    ctx.fillStyle = inkColor;
    this.grainDots.forEach(dot => {
      ctx.globalAlpha = dot.opacity;
      ctx.fillRect(dot.x, dot.y, 1, 1);
    });

    ctx.restore(); // Restores normal source-over composting and unskewed state

    const inkRgb = hexToRgb(inkColor);

    // Phase C Paint drips
    ctx.save();
    this.drips.forEach(drip => {
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

export class FireEngine {
  private cfg: Required<TextEffectConfig>;
  private contourPoints: Array<{ x: number; y: number; seed: number }> = [];
  private topEdgePoints: Array<{ x: number; y: number; seed: number }> = [];
  private embers: Array<{
    x: number;
    y: number;
    size: number;
    alpha: number;
    speedY: number;
    windOffset: number;
    color: string;
  }> = [];
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;

  constructor(config: Partial<TextEffectConfig>) {
    const defaults: Required<TextEffectConfig> = {
      text: "FIRE",
      effectName: "FireEngine",
      fontFamily: "Impact",
      fontWeight: 900,
      fontStyle: "normal",
      fontSize: 96,
      letterSpacing: 2,
      lineHeight: 1.1,
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
      canvasWidth: 800,
      canvasHeight: 200,
      textPosX: "center",
      textPosY: "middle",
      inkColor: "#FFFFFF",
      bristleDensity: 0.8,
      bristleSkipRate: 0.20,
      dripRate: 0.30,
      dripMaxLength: 40,
      grainDensity: 0.15,
      skewX: -0.2,
      fireColor: "#FF5500",
      fireIntensity: 5,
      fireFlameHeight: 80,
      fireEmberCount: 150,
      iceColor: "#AADDFF",
      iceThickness: 6,
      iceIcicleHeight: 25,
      iceFrostDensity: 0.6,
      iceSnowHeight: 10,
      auraColor: "#A855F7",
      auraGlowColor: "#6B21A8",
      auraIntensity: 6,
      auraReach: 35,
      auraParticleCount: 160,
      customRenderer: "FireEngine"
    };

    this.cfg = {
      ...defaults,
      ...config
    } as Required<TextEffectConfig>;

    this.precomputeData();
  }

  private precomputeData() {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      fireIntensity,
      fireEmberCount,
      skewX
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;
    const rand = seededRandom(textSeed(text) + 88);

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
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

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    const topYForX = new Array<number>(width).fill(-1);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (topYForX[x] === -1 || y < topYForX[x]) {
            topYForX[x] = y;
          }
        }
      }
    }

    if (minY >= maxY || minX >= maxX) {
      this.minX = width / 4;
      this.maxX = (3 * width) / 4;
      this.minY = height / 3;
      this.maxY = (2 * height) / 3;
      return;
    }

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;

    // Sample top edge points
    const topPointsTemp: Array<{ x: number; y: number }> = [];
    for (let x = minX; x <= maxX; x++) {
      const y = topYForX[x];
      if (y !== -1) {
        topPointsTemp.push({ x, y });
      }
    }

    const desiredTopCount = Math.max(12, Math.floor(fireIntensity * 8));
    const topStep = Math.max(1, Math.floor(topPointsTemp.length / desiredTopCount));
    for (let i = 0; i < topPointsTemp.length; i += topStep) {
      this.topEdgePoints.push({
        x: topPointsTemp[i].x,
        y: topPointsTemp[i].y,
        seed: rand()
      });
    }

    // Sample contour points (edges)
    const contoursTemp: Array<{ x: number; y: number }> = [];
    for (let y = minY; y <= maxY; y += 2) {
      for (let x = minX; x <= maxX; x += 2) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          let isEdge = false;
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
            isEdge = true;
          } else {
            const left = ((y * width + (x - 1)) * 4) + 3;
            const right = ((y * width + (x + 1)) * 4) + 3;
            const top = (((y - 1) * width + x) * 4) + 3;
            const bottom = (((y + 1) * width + x) * 4) + 3;
            if (pixels[left] <= 128 || pixels[right] <= 128 || pixels[top] <= 128 || pixels[bottom] <= 128) {
              isEdge = true;
            }
          }
          if (isEdge) {
            contoursTemp.push({ x, y });
          }
        }
      }
    }

    const desiredContourCount = Math.max(18, Math.floor(fireIntensity * 12));
    const contourStep = Math.max(1, Math.floor(contoursTemp.length / desiredContourCount));
    for (let i = 0; i < contoursTemp.length; i += contourStep) {
      this.contourPoints.push({
        x: contoursTemp[i].x,
        y: contoursTemp[i].y,
        seed: rand()
      });
    }

    // Generate embers
    const emberColors = ["#FF3300", "#FF6600", "#FFAA00", "#FFCC44", "#FFEE88"];
    const emberCount = fireEmberCount;
    for (let i = 0; i < emberCount; i++) {
      const x = minX - 40 + rand() * (maxX - minX + 80);
      const startYRand = rand();
      const y = minY - 30 + startYRand * (maxY - minY + 60) - rand() * 140;

      this.embers.push({
        x,
        y,
        size: 0.5 + rand() * 2.5,
        alpha: 0.15 + rand() * 0.75,
        speedY: 0.7 + rand() * 1.8,
        windOffset: -1.2 + rand() * 2.4,
        color: emberColors[Math.floor(rand() * emberColors.length)]
      });
    }
  }

  public drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      skewX,
      panelEnabled,
      panelColor,
      panelOpacity,
      panelRadius,
      panelPaddingX,
      panelPaddingY,
      panelStrokeEnabled,
      panelStrokeColor,
      panelStrokeWidth,
      fireFlameHeight
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;

    // 1. Panel Background drawing
    if (panelEnabled) {
      ctx.save();
      ctx.globalAlpha = panelOpacity / 100;
      ctx.fillStyle = panelColor;

      const scaleX_extra = 1.3;
      const scaleY_extra = 1.6;
      const px = this.minX - panelPaddingX * scaleX_extra;
      const py = this.minY - panelPaddingY * scaleY_extra;
      const pw = (this.maxX - this.minX) + 2 * panelPaddingX * scaleX_extra;
      const ph = (this.maxY - this.minY) + 2 * panelPaddingY * scaleY_extra;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, panelRadius);
      ctx.closePath();
      ctx.fill();

      if (panelStrokeEnabled) {
        ctx.strokeStyle = panelStrokeColor;
        ctx.lineWidth = panelStrokeWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Warm ambient backglow
    ctx.save();
    const cx = (this.minX + this.maxX) / 2;
    const cy = (this.minY + this.maxY) / 2;
    const bgGlow = ctx.createRadialGradient(
      cx, cy, 5,
      cx, cy, Math.max(120, (this.maxX - this.minX) * 0.7)
    );
    bgGlow.addColorStop(0, "rgba(220, 45, 0, 0.28)");
    bgGlow.addColorStop(0.5, "rgba(220, 25, 0, 0.08)");
    bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
    }

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;

    // 3. Draw Beautiful Underlying Back Flames (Wide support screen pass)
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const drawWispPath = (
      x: number,
      y: number,
      w: number,
      h: number,
      skew: number,
      randVal: number
    ) => {
      const cp1x = x - w / 2 + (-15 + randVal * 30);
      const cp1y = y - h * 0.3;
      const tipX = x + (-22 + randVal * 44) + skew * -15;
      const tipY = y - h;
      const cp2x = x + w / 2 + (-15 + randVal * 30);
      const cp2y = y - h * 0.3;

      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.bezierCurveTo(cp1x, cp1y, tipX - w / 5, tipY + h / 3, tipX, tipY);
      ctx.bezierCurveTo(tipX + w / 5, tipY + h / 3, cp2x, cp2y, x + w / 2, y);
      ctx.closePath();
    };

    // PASS A: BACK FLAMES (Crimson / Deep Red - Large and soft)
    this.topEdgePoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 777);
      const randVal = rand();
      const w = 18 + randVal * 15;
      const h = fireFlameHeight * (0.8 + randVal * 0.6);

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y - h);
      grad.addColorStop(0, "rgba(220, 20, 0, 0.30)");
      grad.addColorStop(0.4, "rgba(180, 10, 0, 0.12)");
      grad.addColorStop(1, "rgba(80, 0, 0, 0)");

      ctx.fillStyle = grad;
      drawWispPath(pt.x, pt.y, w, h, skewX, randVal);
      ctx.fill();
    });

    this.contourPoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 999);
      const randVal = rand();
      const w = 12 + randVal * 10;
      const h = fireFlameHeight * (0.5 + randVal * 0.5);

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y - h);
      grad.addColorStop(0, "rgba(200, 15, 0, 0.20)");
      grad.addColorStop(0.5, "rgba(150, 5, 0, 0.08)");
      grad.addColorStop(1, "rgba(60, 0, 0, 0)");

      ctx.fillStyle = grad;
      drawWispPath(pt.x, pt.y, w, h, skewX, randVal);
      ctx.fill();
    });

    // PASS B: MIDDLE MODULE FLAMES (Vibrant Orange & Gold)
    this.topEdgePoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 850);
      const randVal = rand();
      const w = 10 + randVal * 11;
      const h = fireFlameHeight * (0.6 + randVal * 0.4);

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y - h);
      grad.addColorStop(0, "rgba(255, 110, 0, 0.55)");
      grad.addColorStop(0.4, "rgba(255, 60, 0, 0.25)");
      grad.addColorStop(1, "rgba(180, 10, 0, 0)");

      ctx.fillStyle = grad;
      drawWispPath(pt.x, pt.y, w, h, skewX, randVal);
      ctx.fill();
    });

    this.contourPoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 111);
      const randVal = rand();
      const w = 8 + randVal * 8;
      const h = fireFlameHeight * (0.4 + randVal * 0.3);

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y - h);
      grad.addColorStop(0, "rgba(255, 90, 0, 0.40)");
      grad.addColorStop(0.5, "rgba(220, 40, 0, 0.15)");
      grad.addColorStop(1, "rgba(120, 0, 0, 0)");

      ctx.fillStyle = grad;
      drawWispPath(pt.x, pt.y, w, h, skewX, randVal);
      ctx.fill();
    });

    ctx.restore();

    // 4. Draw Core Text characters on top of backdrop flames, with volcanic molten gradient
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = fontStr;
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }

    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    const textGrad = ctx.createLinearGradient(0, this.minY, 0, this.maxY);
    textGrad.addColorStop(0, "#190400"); // charred charcoal black top
    textGrad.addColorStop(0.35, "#AC2200"); // deep lava red
    textGrad.addColorStop(0.65, "#FF6F00"); // radiant orange
    textGrad.addColorStop(0.85, "#FFAA00"); // golden orange
    textGrad.addColorStop(1.0, "#FFFFD0"); // bright hot yellow core

    ctx.fillStyle = textGrad;

    // Draw solid body with a heavy hot dark border
    ctx.strokeStyle = "#100200";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";

    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.strokeText(line, startX, py);
      ctx.fillText(line, startX, py);
    });

    ctx.restore();

    // 5. Foreground Flames Pass (Draw on top of letters to blend them beautifully into the flames!)
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // PASS C: FOREGROUND HOT CORES (Bright Yellow - Slices on top edge)
    this.topEdgePoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 350);
      const randVal = rand();
      const w = 6 + randVal * 5;
      const h = fireFlameHeight * (0.35 + randVal * 0.25);

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y - h);
      grad.addColorStop(0, "rgba(255, 235, 175, 0.85)");
      grad.addColorStop(0.4, "rgba(255, 160, 0, 0.40)");
      grad.addColorStop(1, "rgba(255, 40, 0, 0)");

      ctx.fillStyle = grad;
      drawWispPath(pt.x, pt.y, w, h, skewX, randVal);
      ctx.fill();
    });

    ctx.restore();

    // 6. Volumetric Glow & Heated Embers/Sparks particles
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    this.embers.forEach((ember) => {
      ctx.fillStyle = ember.color;
      ctx.globalAlpha = ember.alpha;

      // Draw wind-blown sparks as tiny linear motion strokes based on windOffset
      if (ember.size > 1.8) {
        ctx.strokeStyle = ember.color;
        ctx.lineWidth = ember.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(ember.x, ember.y);
        ctx.quadraticCurveTo(
          ember.x + ember.windOffset * 2,
          ember.y - 8,
          ember.x + ember.windOffset * 4,
          ember.y - 18
        );
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }
}

export class IceEngine {
  private cfg: Required<TextEffectConfig>;
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;
  private topEdgePoints: Array<{ x: number; y: number; seed: number }> = [];
  private bottomEdgePoints: Array<{ x: number; y: number; seed: number; weight: number }> = [];
  private frostCracks: Array<Array<{ x: number; y: number }>> = [];

  constructor(config: Partial<TextEffectConfig>) {
    const defaults: Required<TextEffectConfig> = {
      text: "ICE",
      effectName: "IceEngine",
      fontFamily: "Impact",
      fontWeight: 900,
      fontStyle: "normal",
      fontSize: 96,
      letterSpacing: 2,
      lineHeight: 1.1,
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
      canvasWidth: 800,
      canvasHeight: 200,
      textPosX: "center",
      textPosY: "middle",
      inkColor: "#FFFFFF",
      bristleDensity: 0.8,
      bristleSkipRate: 0.20,
      dripRate: 0.30,
      dripMaxLength: 40,
      grainDensity: 0.15,
      skewX: -0.2,
      fireColor: "#FF5500",
      fireIntensity: 5,
      fireFlameHeight: 80,
      fireEmberCount: 150,
      iceColor: "#AADDFF",
      iceThickness: 6,
      iceIcicleHeight: 25,
      iceFrostDensity: 0.6,
      iceSnowHeight: 10,
      auraColor: "#A855F7",
      auraGlowColor: "#6B21A8",
      auraIntensity: 6,
      auraReach: 35,
      auraParticleCount: 160,
      customRenderer: "IceEngine"
    };

    this.cfg = {
      ...defaults,
      ...config
    } as Required<TextEffectConfig>;

    this.precomputeData();
  }

  private precomputeData() {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      iceFrostDensity,
      skewX
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;
    const rand = seededRandom(textSeed(text) + 999);

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
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

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    const topYForX = new Array<number>(width).fill(-1);
    const bottomYForX = new Array<number>(width).fill(-1);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (topYForX[x] === -1 || y < topYForX[x]) {
            topYForX[x] = y;
          }
          if (y > bottomYForX[x]) {
            bottomYForX[x] = y;
          }
        }
      }
    }

    if (minY >= maxY || minX >= maxX) {
      this.minX = width / 4;
      this.maxX = (3 * width) / 4;
      this.minY = height / 3;
      this.maxY = (2 * height) / 3;
      return;
    }

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;

    // Sample top edge points for snow cap
    for (let x = minX; x <= maxX; x += 4) {
      const y = topYForX[x];
      if (y !== -1) {
        this.topEdgePoints.push({ x, y, seed: rand() });
      }
    }

    // Sample bottom edge points for icicles
    const icicleSpacing = Math.max(8, Math.floor(24 - (fontSize / 10)));
    for (let x = minX + 2; x <= maxX - 2; x += icicleSpacing) {
      const y = bottomYForX[x];
      if (y !== -1) {
        this.bottomEdgePoints.push({
          x,
          y,
          seed: rand(),
          weight: 0.3 + rand() * 0.7
        });
      }
    }

    // Pre-generate Frost Crack paths
    const cracksCount = Math.floor(12 + iceFrostDensity * 18);
    for (let i = 0; i < cracksCount; i++) {
      let sx = 0;
      let sy = 0;
      let found = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const testX = Math.floor(minX + rand() * (maxX - minX));
        const testY = Math.floor(minY + rand() * (maxY - minY));
        const idx = (testY * width + testX) * 4;
        if (pixels[idx + 3] > 128) {
          sx = testX;
          sy = testY;
          found = true;
          break;
        }
      }
      if (!found) {
        sx = minX + rand() * (maxX - minX);
        sy = minY + rand() * (maxY - minY);
      }

      const crackPath: Array<{ x: number; y: number }> = [{ x: sx, y: sy }];
      let cx = sx;
      let cy = sy;
      const steps = 3 + Math.floor(rand() * 4);
      let angle = rand() * Math.PI * 2;
      for (let s = 0; s < steps; s++) {
        const len = 6 + rand() * 12;
        angle += -1 + rand() * 2;
        cx += Math.cos(angle) * len;
        cy += Math.sin(angle) * len;
        crackPath.push({ x: cx, y: cy });
      }
      this.frostCracks.push(crackPath);
    }
  }

  public drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      skewX,
      panelEnabled,
      panelColor,
      panelOpacity,
      panelRadius,
      panelPaddingX,
      panelPaddingY,
      panelStrokeEnabled,
      panelStrokeColor,
      panelStrokeWidth,
      iceColor,
      iceThickness,
      iceIcicleHeight,
      iceSnowHeight
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;

    ctx.clearRect(0, 0, width, height);

    // 1. Panel Background drawing
    if (panelEnabled) {
      ctx.save();
      ctx.globalAlpha = panelOpacity / 100;
      ctx.fillStyle = panelColor;

      const scaleX_extra = 1.3;
      const scaleY_extra = 1.6;
      const px = this.minX - panelPaddingX * scaleX_extra;
      const py = this.minY - panelPaddingY * scaleY_extra;
      const pw = (this.maxX - this.minX) + 2 * panelPaddingX * scaleX_extra;
      const ph = (this.maxY - this.minY) + 2 * panelPaddingY * scaleY_extra;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, panelRadius);
      ctx.closePath();
      ctx.fill();

      if (panelStrokeEnabled) {
        ctx.strokeStyle = panelStrokeColor;
        ctx.lineWidth = panelStrokeWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Wide cold blue background misty halo
    ctx.save();
    const cx = (this.minX + this.maxX) / 2;
    const cy = (this.minY + this.maxY) / 2;
    const bgGlow = ctx.createRadialGradient(
      cx, cy, 10,
      cx, cy, Math.max(130, (this.maxX - this.minX) * 0.65)
    );
    bgGlow.addColorStop(0, "rgba(100, 200, 255, 0.22)");
    bgGlow.addColorStop(0.5, "rgba(50, 150, 255, 0.06)");
    bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Setup Text rendering parameters
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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
    }

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;

    // 3. Draw Heavy Deep Cold Inner & Under Glass Shadow
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = fontStr;
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    ctx.fillStyle = "rgba(4, 20, 45, 0.7)";
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.fillText(line, startX + 3, py + 4);
    });
    ctx.restore();

    // 4. Draw main characters with glowing icy gradient
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = fontStr;
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    const iceGrad = ctx.createLinearGradient(0, this.minY, 0, this.maxY);
    iceGrad.addColorStop(0.0, "#FFFFFF");
    iceGrad.addColorStop(0.15, "#E2F5FF");
    iceGrad.addColorStop(0.45, iceColor);
    iceGrad.addColorStop(0.8, "#3DAAFF");
    iceGrad.addColorStop(1.0, "#0064B3");

    ctx.fillStyle = iceGrad;

    ctx.shadowColor = "rgba(130, 215, 255, 0.75)";
    ctx.shadowBlur = 12;

    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.fillText(line, startX, py);
    });

    ctx.shadowBlur = 0;

    // 5. Draw Frost Cracks using Source-Atop masking method!
    ctx.globalCompositeOperation = "source-atop";

    this.frostCracks.forEach((crack) => {
      if (crack.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(crack[0].x, crack[0].y);
      for (let s = 1; s < crack.length; s++) {
        ctx.lineTo(crack[s].x, crack[s].y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.0;
      ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
      ctx.shadowBlur = 1.5;
      ctx.stroke();

      ctx.strokeStyle = "rgba(160, 225, 255, 0.4)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Glassy shine/shading passes
    const shineColor = "rgba(255, 255, 255, 0.45)";
    ctx.fillStyle = shineColor;
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeText(line, startX - 1, py - 1);

      ctx.strokeStyle = "rgba(0, 31, 64, 0.6)";
      ctx.lineWidth = 2.0;
      ctx.strokeText(line, startX + 1, py + 1);
    });

    ctx.restore();

    // 6. Draw realistic sharp icicles hanging down from letterbottoms
    ctx.save();
    this.bottomEdgePoints.forEach((pt) => {
      const rand = seededRandom(pt.seed * 200);
      const h = iceIcicleHeight * (0.45 + rand() * 0.65) * pt.weight;
      if (h < 3) return;

      const w = Math.max(2, Math.min(6, (iceThickness ?? 6) * (0.6 + rand() * 0.5)));

      const grad = ctx.createLinearGradient(pt.x, pt.y, pt.x, pt.y + h);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.2, "rgba(215, 243, 255, 0.85)");
      grad.addColorStop(0.7, "rgba(100, 190, 245, 0.55)");
      grad.addColorStop(1.0, "rgba(135, 215, 255, 0.05)");

      ctx.beginPath();
      ctx.moveTo(pt.x - w / 2, pt.y - 1);
      const c1x = pt.x - w * 0.2 + (-0.5 + rand() * 1);
      const c1y = pt.y + h * 0.35;
      const tipX = pt.x + (-0.8 + rand() * 1.6);
      const tipY = pt.y + h;
      const c2x = pt.x + w * 0.2 + (-0.5 + rand() * 1);
      const c2y = pt.y + h * 0.35;

      ctx.bezierCurveTo(c1x, c1y, tipX - w * 0.05, tipY, tipX, tipY);
      ctx.bezierCurveTo(tipX + w * 0.05, tipY, c2x, c2y, pt.x + w / 2, pt.y - 1);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      if (rand() > 0.65 && h > 15) {
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(tipX, tipY - 1, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    ctx.restore();

    // 7. Draw the thick white Snowy Mountain Caps sitting on top of the letters
    ctx.save();
    if (iceSnowHeight > 0) {
      this.topEdgePoints.forEach((pt) => {
        const rand = seededRandom(pt.seed * 432);
        const randVal = rand();
        const snowCapHeight = iceSnowHeight * (0.4 + randVal * 0.6);
        const w = 4 + randVal * 6;

        const snowGrad = ctx.createLinearGradient(pt.x, pt.y - snowCapHeight, pt.x, pt.y + 1);
        snowGrad.addColorStop(0, "#FFFFFF");
        snowGrad.addColorStop(0.7, "#EEF8FF");
        snowGrad.addColorStop(1.0, "#C7E5FF");

        ctx.fillStyle = snowGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, w, Math.PI, 0);
        ctx.fill();

        // Draw soft fluffy crown peaks
        ctx.beginPath();
        ctx.moveTo(pt.x - w, pt.y);
        ctx.quadraticCurveTo(pt.x, pt.y - snowCapHeight, pt.x + w, pt.y);
        ctx.closePath();
        ctx.fill();
      });
    }
    ctx.restore();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class AuraEngine {
  private cfg: Required<TextEffectConfig>;
  private minX = 0;
  private maxX = 0;
  private minY = 0;
  private maxY = 0;
  private contourPoints: Array<{ x: number; y: number; seed: number; nx: number; ny: number }> = [];
  private emberPoints: Array<{ x: number; y: number; seed: number; speed: number; size: number }> = [];

  constructor(config: Partial<TextEffectConfig>) {
    const defaults: Required<TextEffectConfig> = {
      text: "AURA",
      effectName: "AuraEngine",
      fontFamily: "Impact",
      fontWeight: 900,
      fontStyle: "normal",
      fontSize: 96,
      letterSpacing: 2,
      lineHeight: 1.1,
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
      canvasWidth: 800,
      canvasHeight: 200,
      textPosX: "center",
      textPosY: "middle",
      inkColor: "#FFFFFF",
      bristleDensity: 0.8,
      bristleSkipRate: 0.20,
      dripRate: 0.30,
      dripMaxLength: 40,
      grainDensity: 0.15,
      skewX: -0.2,
      fireColor: "#FF5500",
      fireIntensity: 5,
      fireFlameHeight: 80,
      fireEmberCount: 150,
      iceColor: "#AADDFF",
      iceThickness: 6,
      iceIcicleHeight: 25,
      iceFrostDensity: 0.6,
      iceSnowHeight: 10,
      auraColor: "#A855F7",
      auraGlowColor: "#6B21A8",
      auraIntensity: 6,
      auraReach: 35,
      auraParticleCount: 160,
      customRenderer: "AuraEngine"
    };

    this.cfg = {
      ...defaults,
      ...config
    } as Required<TextEffectConfig>;

    this.precomputeData();
  }

  private precomputeData() {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      skewX,
      auraParticleCount
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;
    const rand = seededRandom(textSeed(text) + 1234);

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
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

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    const tempContour: Array<{ x: number; y: number; seed: number; nx: number; ny: number }> = [];

    const step = 2;
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4;
        if (pixels[idx + 3] > 120) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          let isEdge = false;
          let emptyX = 0;
          let emptyY = 0;

          const nSteps = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of nSteps) {
            const nIdx = ((y + dy * step) * width + (x + dx * step)) * 4;
            if (pixels[nIdx + 3] <= 120) {
              isEdge = true;
              emptyX = dx;
              emptyY = dy;
              break;
            }
          }

          if (isEdge) {
            tempContour.push({
              x,
              y,
              seed: rand(),
              nx: emptyX,
              ny: emptyY
            });
          }
        }
      }
    }

    if (minY >= maxY || minX >= maxX) {
      this.minX = width / 4;
      this.maxX = (3 * width) / 4;
      this.minY = height / 3;
      this.maxY = (2 * height) / 3;
      return;
    }

    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;

    const sampleRate = Math.max(1, Math.floor(tempContour.length / 450));
    for (let i = 0; i < tempContour.length; i += sampleRate) {
      this.contourPoints.push(tempContour[i]);
    }

    const sparkCount = Math.floor(auraParticleCount * 0.8);
    for (let i = 0; i < sparkCount; i++) {
      const basePoint = tempContour[Math.floor(rand() * tempContour.length)] || { x: width / 2, y: height / 2 };
      this.emberPoints.push({
        x: basePoint.x + (-15 + rand() * 30),
        y: basePoint.y + (-15 + rand() * 30),
        seed: rand(),
        speed: 0.15 + rand() * 0.8,
        size: 0.8 + rand() * 1.8
      });
    }
  }

  public drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
      skewX,
      panelEnabled,
      panelColor,
      panelOpacity,
      panelRadius,
      panelPaddingX,
      panelPaddingY,
      panelStrokeEnabled,
      panelStrokeColor,
      panelStrokeWidth,
      auraColor,
      auraGlowColor,
      auraIntensity,
      auraReach
    } = this.cfg;

    const width = canvasWidth;
    const height = canvasHeight;

    ctx.clearRect(0, 0, width, height);

    if (panelEnabled) {
      ctx.save();
      ctx.globalAlpha = panelOpacity / 100;
      ctx.fillStyle = panelColor;

      const scaleX_extra = 1.3;
      const scaleY_extra = 1.6;
      const px = this.minX - panelPaddingX * scaleX_extra;
      const py = this.minY - panelPaddingY * scaleY_extra;
      const pw = (this.maxX - this.minX) + 2 * panelPaddingX * scaleX_extra;
      const ph = (this.maxY - this.minY) + 2 * panelPaddingY * scaleY_extra;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, panelRadius);
      ctx.closePath();
      ctx.fill();

      if (panelStrokeEnabled) {
        ctx.strokeStyle = panelStrokeColor;
        ctx.lineWidth = panelStrokeWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    const cx = (this.minX + this.maxX) / 2;
    const cy = (this.minY + this.maxY) / 2;
    const pulseRad = Math.max(140, (this.maxX - this.minX) * 0.7);

    const radialFog = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseRad);
    radialFog.addColorStop(0, hexToRgba(auraGlowColor, 0.4));
    radialFog.addColorStop(0.4, hexToRgba(auraColor, 0.15));
    radialFog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radialFog;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

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

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = 40 + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - 40 - textBlockHeight + fontSize * 0.8;
    }

    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;

    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = fontStr;
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    ctx.strokeStyle = auraColor;
    ctx.shadowColor = auraColor;
    ctx.lineWidth = 14;
    ctx.shadowBlur = 24;
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.strokeText(line, startX, py);
    });

    ctx.strokeStyle = auraGlowColor;
    ctx.shadowColor = auraGlowColor;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 12;
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.strokeText(line, startX, py);
    });

    ctx.restore();

    if (this.contourPoints.length > 0) {
      ctx.save();
      const intens = Math.min(10, Math.max(1, auraIntensity));
      
      this.contourPoints.forEach((pt) => {
        const rand = seededRandom(pt.seed * 876);
        const randVal = rand();
        
        if (randVal > (0.4 + intens * 0.05)) return;

        const wispReach = auraReach * (0.45 + randVal * 0.7);
        if (wispReach < 5) return;

        ctx.beginPath();
        let fx = pt.x;
        let fy = pt.y;
        ctx.moveTo(fx, fy);

        const steps = 5 + Math.floor(randVal * 6);
        let angle = Math.atan2(pt.ny, pt.nx);
        if (pt.nx === 0 && pt.ny === 0) {
          angle = rand() * Math.PI * 2;
        }

        angle += (-0.4 + rand() * 0.8);

        for (let s = 1; s <= steps; s++) {
          const segmentLen = (wispReach / steps);
          angle += Math.sin(s + rand() * 12) * 0.5 + (-0.25 + rand() * 0.5);
          fx += Math.cos(angle) * segmentLen;
          fy += Math.sin(angle) * segmentLen;
          ctx.lineTo(fx, fy);
        }

        ctx.strokeStyle = randVal > 0.6 ? auraColor : auraGlowColor;
        ctx.lineWidth = 0.5 + rand() * 1.5;
        ctx.globalAlpha = 0.15 + (intens / 10) * 0.25;

        ctx.shadowColor = auraColor;
        ctx.shadowBlur = 2;
        ctx.stroke();
      });

      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.font = fontStr;
    if (letterSpacing !== 0) {
      (ctx as any).letterSpacing = `${letterSpacing}px`;
    }
    if (skewX !== 0) {
      ctx.transform(1, 0, skewX, 1, 0, 0);
    }

    const textGrad = ctx.createLinearGradient(0, this.minY, 0, this.maxY);
    textGrad.addColorStop(0, "#FFFFFF");
    textGrad.addColorStop(0.3, "#FAF5FF");
    textGrad.addColorStop(0.65, hexToRgba(auraColor, 0.9));
    textGrad.addColorStop(1.0, hexToRgba(auraGlowColor, 0.95));

    ctx.fillStyle = textGrad;
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = 8;

    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.fillText(line, startX, py);
    });

    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = 0.85;
    lines.forEach((line, index) => {
      const py = startY + index * fontSize * lineHeight;
      ctx.strokeText(line, startX, py);
    });

    ctx.restore();

    if (this.emberPoints.length > 0) {
      ctx.save();
      this.emberPoints.forEach((ember) => {
        const driftY = -12;
        const driftX = Math.sin(ember.seed * 10) * 6;

        const ex = ember.x + driftX;
        const ey = ember.y + driftY;

        if (ex < 0 || ex > width || ey < 0 || ey > height) return;

        const grad = ctx.createRadialGradient(ex, ey, 0.1, ex, ey, ember.size * 2);
        grad.addColorStop(0, "#FFFFFF");
        grad.addColorStop(0.4, auraColor);
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, ey, ember.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }
}

export function renderTextEffectCore(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cfg: TextEffectConfig
): void {
    if (cfg.customRenderer === "InkBrushEngine") {
      const engine = new InkBrushEngine(cfg);
      engine.drawFrame(ctx);
      return;
    }

    if (cfg.customRenderer === "FireEngine") {
      const engine = new FireEngine(cfg);
      engine.drawFrame(ctx);
      return;
    }

    if (cfg.customRenderer === "IceEngine") {
      const engine = new IceEngine(cfg);
      engine.drawFrame(ctx);
      return;
    }

    if (cfg.customRenderer === "AuraEngine") {
      const engine = new AuraEngine(cfg);
      engine.drawFrame(ctx);
      return;
    }

    const {
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      fillType,
      fillColor,
      fillGradientAngle,
      fillGradientStops,
      patternType,
      strokeEnabled,
      strokeColor,
      strokeWidth,
      strokePosition,
      strokeOpacity,
      strokeLineJoin,
      strokeBlur,
      strokeType,
      strokeColorSecondary,
      strokeWidthSecondary,
      strokeFadeRange,
      glowLayers,
      shadowEnabled,
      shadowColor,
      shadowBlur,
      shadowOffsetX,
      shadowOffsetY,
      shadowOpacity,
      shadowType,
      bevelEnabled,
      bevelDepth,
      bevelHighlight,
      bevelShadow,
      bevelDirection,
      bevelCoreColor,
      bevelEdgeColor,
      bevelEdgeWidth,
      bevelBlur,
      bevelBlurColor,
      bevelPerspectiveEnabled,
      bevelVanishingPointX,
      bevelVanishingPointY,
      bevelFocalLength,
      stackEnabled,
      stackCount,
      stackOffsetX,
      stackOffsetY,
      stackOpacityDecay,
      stackColor1,
      stackColor2,
      stackColor3,
      stackColor4,
      panelEnabled,
      panelColor,
      panelOpacity,
      panelRadius,
      panelPaddingX,
      panelPaddingY,
      panelStrokeEnabled,
      panelStrokeColor,
      panelStrokeWidth,
      canvasWidth,
      canvasHeight,
      textPosX,
      textPosY,
    } = cfg;

    // 1. Initial configuration
    ctx.imageSmoothingEnabled = true;

    ctx.lineJoin = strokeLineJoin;

    const cWidth = canvasWidth || 800;
    const cHeight = canvasHeight || 200;

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

    const renderLines = (
      mode: "fill" | "stroke",
      overrideStyle?: string | CanvasGradient | CanvasPattern,
      offsetX = 0,
      offsetY = 0,
      options?: { perCharFill?: boolean }
    ) => {
      if (
        options?.perCharFill &&
        usePerCharFill &&
        mode === "fill" &&
        !overrideStyle
      ) {
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
    const renderWithShadowTrick = (
      mode: "fill" | "stroke",
      sColor: string,
      sBlur: number,
      sOffsetX: number,
      sOffsetY: number,
      opacity: number,
      overrideStyle = "#000",
      spread = 0
    ) => {
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
      const pw = (total_xMax - total_xMin) + 2 * panelPaddingX;
      const ph = (total_yMax - total_yMin) + 2 * panelPaddingY;

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
        ctx.roundRect(px, py, pw, ph, panelRadius);
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
          renderWithShadowTrick(
            "fill",
            layer.color,
            layer.blur,
            0,
            0,
            layer.opacity,
            "#000",
            layer.spread ?? 0
          );
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

          renderWithShadowTrick(
            "fill",
            shadowColor,
            shadowBlur,
            shadowOffsetX,
            shadowOffsetY,
            shadowOpacity
          );
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

          renderWithShadowTrick(
            "fill",
            shadowColor,
            shadowBlur,
            shadowOffsetX + dx,
            shadowOffsetY + dy,
            shadowOpacity
          );
        }
      } else {
        renderWithShadowTrick(
          "fill",
          shadowColor,
          shadowBlur,
          shadowOffsetX,
          shadowOffsetY,
          shadowOpacity
        );
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
    // 5. Bevel Stacked Copies (3D Bevel)
    // ──────────────────────────────────────────────────────────────────
    if (bevelEnabled && bevelDepth > 0) {
      if (bevelPerspectiveEnabled) {
        const vpx = cWidth / 2 + ((bevelVanishingPointX !== undefined ? bevelVanishingPointX : 40) / 100) * (cWidth / 2);
        const vpy = cHeight / 2 + ((bevelVanishingPointY !== undefined ? bevelVanishingPointY : 80) / 100) * (cHeight / 2);
        const fl = Math.max(100, bevelFocalLength !== undefined ? bevelFocalLength : 400);

        // 5a. Extrusion Blur / Soft 3D Glow (drawn underneath)
        if (bevelBlur && bevelBlur > 0) {
          ctx.save();
          ctx.filter = `blur(${bevelBlur}px)`;
          const blurColor = bevelBlurColor || bevelShadow || "#000000";
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            const z = i;
            const scale = fl / (fl + z);
            ctx.save();
            ctx.translate(vpx, vpy);
            ctx.scale(scale, scale);
            ctx.translate(-vpx, -vpy);
            renderLines("fill", blurColor);
            ctx.restore();
          }
          ctx.restore();
        }

        // 5b. Solid Extrusion Core & Edge Layering
        ctx.save();
        for (let i = bevelDepth; i > 0; i--) {
          const z = i;
          const scale = fl / (fl + z);
          const ratio = (bevelDepth - i) / Math.max(1, bevelDepth);
          
          let color = mixHexColor(bevelShadow, bevelCoreColor || bevelShadow, ratio);
          if (i === 1) {
            color = bevelHighlight;
          }

          ctx.save();
          ctx.translate(vpx, vpy);
          ctx.scale(scale, scale);
          ctx.translate(-vpx, -vpy);

          // Render filled body slicing
          renderLines("fill", color);

          // Render optional face border edge stroke per slicing
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
      } else {
        // 5a. Extrusion Blur / Soft 3D Glow (drawn underneath)
        if (bevelBlur && bevelBlur > 0) {
          ctx.save();
          ctx.filter = `blur(${bevelBlur}px)`;
          const blurColor = bevelBlurColor || bevelShadow || "#000000";
          
          // Draw step layers for soft ambient occlusion / glowing leak shape
          for (let i = bevelDepth; i > 0; i -= Math.max(1, Math.floor(bevelDepth / 4))) {
            let dx = 0;
            let dy = 0;
            if (bevelDirection === "bottom-right") {
              dx = i;
              dy = i;
            } else if (bevelDirection === "bottom") {
              dy = i;
            } else if (bevelDirection === "right") {
              dx = i;
            }
            renderLines("fill", blurColor, dx, dy);
          }
          ctx.restore();
        }

        // 5b. Solid Extrusion Core & Edge Layering
        ctx.save();
        for (let i = bevelDepth; i > 0; i--) {
          let dx = 0;
          let dy = 0;
          if (bevelDirection === "bottom-right") {
            dx = i;
            dy = i;
          } else if (bevelDirection === "bottom") {
            dy = i;
          } else if (bevelDirection === "right") {
            dx = i;
          }

          // Assign colors based on depths to sandwich-layer core vs highlights
          let color = bevelShadow;
          if (i === 1) {
            color = bevelHighlight;
          } else if (i < bevelDepth) {
            color = bevelCoreColor || bevelShadow;
          }

          // Render filled body slicing
          renderLines("fill", color, dx, dy);

          // Render optional face border edge stroke per slicing
          if (bevelEdgeWidth && bevelEdgeWidth > 0) {
            ctx.save();
            ctx.strokeStyle = bevelEdgeColor || "#000000";
            ctx.lineWidth = bevelEdgeWidth;
            ctx.lineJoin = strokeLineJoin || "round";
            renderLines("stroke", undefined, dx, dy);
            ctx.restore();
          }
        }
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
        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.strokeStyle = color;
        
        // Handle filter blur natively if supported
        if (blurAmount > 0) {
          ctx.filter = `blur(${blurAmount}px)`;
        }

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
      };

      // 2. Multi-layer stroke rendering according to type
      if (sType === "double") {
        // Outer border (secondary): drawn wider underneath
        const outerWidth = strokeWidth + sWidthSecondary;
        drawStrokeLayer(
          sColorSecondary,
          outerWidth,
          sBlur,
          strokeOpacity,
          strokePosition
        );
        
        // Inner border (primary): drawn sharper on top
        drawStrokeLayer(
          customStrokeStyle,
          strokeWidth,
          0, // inner remains crisp
          strokeOpacity,
          strokePosition
        );
      } else if (sType === "neon") {
        // Glowing outline style
        // Neon Backing Glow
        drawStrokeLayer(
          strokeColor,
          strokeWidth * 1.8,
          sBlur || 8, // fallback blur to look gorgeous
          strokeOpacity * 0.7,
          strokePosition
        );
        // Core Neon White center
        drawStrokeLayer(
          "#FFFFFF",
          strokeWidth * 0.5,
          0,
          95,
          strokePosition
        );
      } else {
        // Normal Single Stroke with customizable blur
        drawStrokeLayer(
          customStrokeStyle,
          strokeWidth,
          sBlur,
          strokeOpacity,
          strokePosition
        );
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
      const stackColors = [
        stackColor1 || "#FF7C00",
        stackColor2 || "#00FFDD",
        stackColor3 || "#FF00AA",
        stackColor4 || "#AA00FF",
      ];
      
      for (let s = cnt; s >= 1; s--) {
        ctx.save();
        const dx = s * offX;
        const dy = s * offY;
        
        const layerOpacity = Math.max(0.01, 1 - (s * decay));
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
            patCtx.lineTo(
              startX + Math.cos(angle) * len,
              startY + Math.sin(angle) * len
            );
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
          patCtx.globalAlpha = isDark ? (0.13 + rand() * 0.22) : (0.15 + rand() * 0.28);
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
          patCtx.quadraticCurveTo(
            sx + (rand() - 0.5) * 16,
            sy + (rand() - 0.5) * 16,
            sx + (rand() - 0.5) * 28,
            sy + (rand() - 0.5) * 28
          );
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
          patCtx.globalAlpha = isLight ? (0.04 + rand() * 0.12) : (0.03 + rand() * 0.08);
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
          patCtx.globalAlpha = isDark ? (0.03 + rand() * 0.08) : (0.05 + rand() * 0.12);
          patCtx.lineWidth = 0.4 + rand() * 0.7;
          
          patCtx.beginPath();
          patCtx.moveTo(fx, fy);
          // Slightly wavy pulp threads
          patCtx.quadraticCurveTo(
            fx + Math.cos(fangle) * flen * 0.5 + (rand() - 0.5) * 4,
            fy + Math.sin(fangle) * flen * 0.5 + (rand() - 0.5) * 4,
            fx + Math.cos(fangle) * flen,
            fy + Math.sin(fangle) * flen
          );
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

    const isInkStyle =
      cfg.effectName.toLowerCase().includes("ink") ||
      cfg.fontFamily.toLowerCase().includes("brush") ||
      cfg.effectName.toLowerCase().includes("grunge") ||
      cfg.effectName.toLowerCase().includes("scratch") ||
      cfg.fontFamily === "Permanent Marker";

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
          
          const topEdges: { x: number, y: number }[] = [];
          const bottomEdges: { x: number, y: number }[] = [];
          const boundaryEdges: { x: number, y: number }[] = [];
          const insidePixels: { x: number, y: number }[] = [];
          
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
            const w = 1.8 + rand() * 2.5;                // tapered width
            const slantOffset = h * 0.22;                // italic diagonal alignment
            
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
            const h = fontSize * (0.07 + rand() * 0.20);
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
              tCtx.globalAlpha = 0.20 + rand() * 0.40;
              
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
    // 8. Inner Glow & Inner Shadow
    // ──────────────────────────────────────────────────────────────────
    // Render Inner Glow Layers
    glowLayers.forEach((layer) => {
      if (layer.enabled && layer.type === "inner" && layer.opacity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        const renderCount = Math.max(1, Math.min(20, layer.strength ?? 1));
        for (let i = 0; i < renderCount; i++) {
          renderWithShadowTrick(
            "fill",
            layer.color,
            layer.blur,
            0,
            0,
            layer.opacity,
            "transparent",
            layer.spread ?? 0
          );
        }
        ctx.restore();
      }
    });

    // Render Inner Shadow
    if (shadowEnabled && shadowType === "inner" && shadowOpacity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      
      // Inverse mask inner shadow
      renderWithShadowTrick(
        "fill",
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        shadowOpacity,
        "transparent"
      );
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
  public static draw(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    cfg: TextEffectConfig,
    _time = 0
  ): void {
    renderTextEffectCore(ctx, cfg);
  }
}
