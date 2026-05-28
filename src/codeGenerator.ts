import { TextEffectConfig } from "./types";

// Helper to convert PascalCase to kebab-case
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

// Helper to sanitize class name to PascalCase
export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/[\s-_]+/g, "");
}

// Generate highly unique and descriptive name taking in all core effect attributes
export function getEnrichedEffectName(cfg: TextEffectConfig): string {
  // Extract words from the user's effectName, excluding generic words
  const rawWords = (cfg.effectName || "Custom Effect")
    .trim()
    .split(/[\s-_]+/)
    .filter(Boolean);
    
  const genericTerms = new Set(["custom", "effect", "my", "text", "sandbox", "engine", "definition", "design"]);
  let words = rawWords.filter(w => !genericTerms.has(w.toLowerCase()));
  
  if (words.length === 0) {
    words.push("Studio");
  }
  
  // Style words based on fill & pattern texture
  const styleWords: string[] = [];
  if (cfg.fillType === "pattern") {
    const pType = cfg.patternType || "chalk";
    if (pType === "marble") styleWords.push("Carrara", "Marble");
    else if (pType === "halftone") styleWords.push("Pop", "Halftone");
    else if (pType === "paper") styleWords.push("Organic", "Washi");
    else if (pType === "brushed") styleWords.push("Brushed", "Metal");
    else if (pType === "film") styleWords.push("Retro", "Grain");
    else if (pType === "chalk") styleWords.push("Chalk", "Dust");
    else if (pType === "noise") styleWords.push("Analog", "Noise");
    else if (pType === "grunge") styleWords.push("Grungy", "Slate");
    else if (pType === "carbon") styleWords.push("Tech", "Carbon");
    else if (pType === "stripes") styleWords.push("Diagonal", "Line");
  } else if (cfg.fillType === "linear" || cfg.fillType === "radial") {
    styleWords.push("Vivid", "Gradient");
  } else if (cfg.fillType === "solid") {
    styleWords.push("Classic", "Solid");
  }
  
  // Add some stylistic words if we need more depth
  if (cfg.bevelEnabled) styleWords.push("Bevel");
  if (cfg.shadowEnabled) styleWords.push("Glow");
  if (cfg.strokeEnabled && cfg.strokeWidth > 0) styleWords.push("Contour");
  
  // Merge lists without duplicates
  const wordSet = new Set<string>();
  // Push primary effect name words first
  words.forEach(w => wordSet.add(toPascalCase(w)));
  // Then style words
  styleWords.forEach(w => wordSet.add(w));
  
  let finalWords = Array.from(wordSet);
  
  // Ensure we have at least 3 words, otherwise expand with nice design descriptors
  const fallbacks = ["Aesthetic", "Modern", "Canvas", "Artistry", "Type"];
  let fallbackIdx = 0;
  while (finalWords.length < 3 && fallbackIdx < fallbacks.length) {
    const candidate = fallbacks[fallbackIdx++];
    if (!wordSet.has(candidate)) {
      finalWords.push(candidate);
    }
  }
  
  // Clamp length strictly to 3-5 words
  if (finalWords.length > 5) {
    finalWords = finalWords.slice(0, 5);
  } else if (finalWords.length < 3) {
    finalWords = finalWords.slice(0, 3);
  }
  
  // Join them as PascalCase for unique identifiers
  return finalWords.join("");
}

// Helper to get structured Clypra representation object
export function getEffectRepresentation(cfg: TextEffectConfig) {
  const effectId = toKebabCase(cfg.effectName) || "my-effect";
  const name = cfg.effectName || "My Effect";

  const isInk = cfg.customRenderer === "InkBrushEngine";
  const customRenderer = cfg.customRenderer;

  let category = "classic";
  if (isInk) {
    category = "grunge";
  } else if (customRenderer === "FireEngine") {
    category = "experimental";
  } else if (customRenderer === "IceEngine") {
    category = "experimental";
  } else if (customRenderer === "AuraEngine") {
    category = "experimental";
  }

  let description = `A custom Canvas 2D text effect named ${name} with ${cfg.fillType} fill.`;
  if (isInk) {
    description = `A highly optimized, procedural Grunge custom ink brush text effect named ${name}.`;
  } else if (customRenderer === "FireEngine") {
    description = `An advanced, procedural Fire text effect named ${name}.`;
  } else if (customRenderer === "IceEngine") {
    description = `A highly detailed, static/physically simulated frosted Ice text effect named ${name}.`;
  } else if (customRenderer === "AuraEngine") {
    description = `A dynamic electric plasma Aura particle text effect named ${name}.`;
  }

  return {
    id: effectId,
    name: name,
    category: category,
    customRenderer: customRenderer || undefined,
    description: description,
    tags: ["studio-export", "custom-canvas", cfg.fillType],
    font: {
      family: cfg.fontFamily,
      weight: cfg.fontWeight,
      style: cfg.fontStyle,
      letterSpacing: cfg.letterSpacing,
      lineHeight: cfg.lineHeight,
    },
    fills: cfg.fillType === "none" ? [] : [
      {
        type: cfg.fillType,
        color: cfg.fillColor,
        gradient: {
          angle: cfg.fillGradientAngle,
          stops: cfg.fillGradientStops,
        }
      }
    ],
    strokes: cfg.strokeEnabled ? [
      {
        color: cfg.strokeColor,
        width: cfg.strokeWidth,
        position: cfg.strokePosition,
        opacity: cfg.strokeOpacity,
        lineJoin: cfg.strokeLineJoin,
      }
    ] : [],
    shadows: cfg.shadowEnabled ? [
      {
        type: cfg.shadowType,
        color: cfg.shadowColor,
        blur: cfg.shadowBlur,
        offset: { x: cfg.shadowOffsetX, y: cfg.shadowOffsetY },
        opacity: cfg.shadowOpacity,
      }
    ] : [],
    glows: cfg.glowLayers.filter(g => g.enabled).map(g => ({
      color: g.color,
      blur: g.blur,
      opacity: g.opacity,
      type: g.type
    })),
    panel: cfg.panelEnabled ? {
      color: cfg.panelColor,
      opacity: cfg.panelOpacity,
      radius: cfg.panelRadius,
      padding: { x: cfg.panelPaddingX, y: cfg.panelPaddingY },
      stroke: cfg.panelStrokeEnabled ? {
        color: cfg.panelStrokeColor,
        width: cfg.panelStrokeWidth
      } : null
    } : null
  };
}

export function generateInkBrushEngineClass(cfg: TextEffectConfig): string {
  const className = toPascalCase(getEnrichedEffectName(cfg)) || "InkBrush";
  const engineName = `${className}Engine`;
  const configName = `${className}Config`;
  const escText = (cfg.text || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, '\\n');

  return `// @ts-nocheck
/**
 * Clypra Text Effect Code Output - Clypra Integration Engine Core
 * Auto-generated by Clypra Text Effect Studio on ${new Date().toISOString().split("T")[0]}
 * File: ${className}.ts
 * Special custom renderer: InkBrushEngine
 */

export interface ${configName} {
  width:           number;      // canvas width
  height:          number;      // canvas height
  text:            string;      // text to render
  fontSize:        number;      // default 96
  inkColor:        string;      // default "#FFFFFF"
  bristleDensity:  number;      // lines per px of letter height, default 0.8
  bristleSkipRate: number;      // 0–1, default 0.20
  dripRate:        number;      // 0–1, proportion of columns that drip, default 0.30
  dripMaxLength:   number;      // px, default 40
  grainDensity:    number;      // 0–1, default 0.15
  skewX:           number;      // italic skew, default -0.2
  fontFamily?:     string;
  fontWeight?:     number;
  fontStyle?:      "normal" | "italic";
  letterSpacing?:  number;
  lineHeight?:     number;
}

export class ${engineName} {
  private cfg: Required<${configName}>;
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

  constructor(config: ${configName}) {
    const defaults: Required<${configName}> = {
      width: ${cfg.canvasWidth || 800},
      height: ${cfg.canvasHeight || 200},
      text: "${escText}",
      fontSize: ${cfg.fontSize || 96},
      inkColor: "${cfg.inkColor || cfg.fillColor || "#FFFFFF"}",
      bristleDensity: ${cfg.bristleDensity ?? 0.8},
      bristleSkipRate: ${cfg.bristleSkipRate ?? 0.20},
      dripRate: ${cfg.dripRate ?? 0.30},
      dripMaxLength: ${cfg.dripMaxLength ?? 40},
      grainDensity: ${cfg.grainDensity ?? 0.15},
      skewX: ${cfg.skewX ?? -0.2},
      fontFamily: "${cfg.fontFamily || "Bebas Neue"}",
      fontWeight: ${cfg.fontWeight || 900},
      fontStyle: "${cfg.fontStyle || "italic"}",
      letterSpacing: ${cfg.letterSpacing ?? 2},
      lineHeight: ${cfg.lineHeight ?? 1.1}
    };

    this.cfg = {
      ...defaults,
      ...config
    };

    this.precomputeData();
  }

  private precomputeData(): void {
    const {
      width,
      height,
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      bristleDensity,
      bristleSkipRate,
      dripRate,
      dripMaxLength,
      grainDensity,
      skewX
    } = this.cfg;

    // Seeded Random Helper
    function seededRandom(seed: number): () => number {
      let s = seed;
      return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    }

    function textSeed(input: string): number {
      return input.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9301 % 49297;
    }

    const rand = seededRandom(textSeed(text));

    // Create offscreen canvas to map text pixel bounds
    let canvas;
    if (typeof document !== "undefined") {
      canvas = document.createElement("canvas");
    } else if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(width, height);
    } else {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Split lines
    const lines = text.split("\\n");
    const numLines = lines.length;
    const textBlockHeight = fontSize + (numLines - 1) * fontSize * lineHeight;

    let startX = width / 2;
    let align: CanvasTextAlign = "center";
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    const fontStr = fontStyle + " " + fontWeight + " " + fontSize + "px \\\"" + fontFamily + "\\\"";
    ctx.font = fontStr;

    if (letterSpacing !== 0) {
      ctx.letterSpacing = letterSpacing + "px";
    }

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;

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

  advanceSteps(steps: number): void {
    // No-op. Static effect.
  }

  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    ghostFrames?: ImageData[]
  ): void {
    const {
      width,
      height,
      text,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      letterSpacing,
      lineHeight,
      skewX,
      inkColor
    } = this.cfg;

    // Clear dynamic context canvas - No background color fills allowed
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;

    const lines = text.split("\\n");
    const numLines = lines.length;
    const textBlockHeight = fontSize + (numLines - 1) * fontSize * lineHeight;

    let startX = width / 2;
    let align: CanvasTextAlign = "center";
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    const fontStr = fontStyle + " " + fontWeight + " " + fontSize + "px \\\"" + fontFamily + "\\\"";
    ctx.font = fontStr;

    if (letterSpacing !== 0) {
      ctx.letterSpacing = letterSpacing + "px";
    }

    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;

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

    // Helper to extract rgb for transparency drips
    function hexToRgb(hex: string) {
      const shorthandRegex = /^#?([a-f\\d])([a-f\\d])([a-f\\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    }

    const inkRgb = hexToRgb(inkColor);

    // Phase C Paint drips
    ctx.save();
    this.drips.forEach(drip => {
      const grad = ctx.createLinearGradient(drip.x, drip.startY, drip.x, drip.startY + drip.length);
      grad.addColorStop(0, "rgba(" + inkRgb.r + ", " + inkRgb.g + ", " + inkRgb.b + ", " + drip.startOpacity + ")");
      grad.addColorStop(1, "rgba(" + inkRgb.r + ", " + inkRgb.g + ", " + inkRgb.b + ", 0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = drip.startWidth;

      ctx.beginPath();
      ctx.moveTo(drip.x, drip.startY);
      ctx.lineTo(drip.x, drip.startY + drip.length);
      ctx.stroke();

      if (drip.hasBlob) {
        ctx.fillStyle = "rgba(" + inkRgb.r + ", " + inkRgb.g + ", " + inkRgb.b + ", " + (drip.startOpacity * 0.5) + ")";
        ctx.beginPath();
        ctx.arc(drip.x, drip.startY + drip.length, drip.blobRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
`;
}

export function generateEngineClass(cfg: TextEffectConfig): string {
  if (cfg.customRenderer === "InkBrushEngine") {
    return generateInkBrushEngineClass(cfg);
  }

  const className = toPascalCase(getEnrichedEffectName(cfg)) || "MyEffect";
  const configName = `${className}Config`;
  const engineName = `${className}Engine`;
  const escText = (cfg.text || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, '\\n');

  // Stringify stops and glows properly
  const fillGradientStopsStr = JSON.stringify(cfg.fillGradientStops, null, 2)
    .replace(/\n/g, "\n    ");
  const glowLayersStr = JSON.stringify(cfg.glowLayers, null, 2)
    .replace(/\n/g, "\n    ");

  return `// @ts-nocheck
/**
 * Clypra Text Effect Code Output - Clypra Integration Engine Core
 * Auto-generated by Clypra Text Effect Studio on ${new Date().toISOString().split("T")[0]}
 * File: ${className}.ts
 */

const className = "${className}Engine";

export interface ${configName} {
  width: number;
  height: number;
  text: string;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  fillType?: "solid" | "linear" | "radial" | "pattern" | "none";
  fillColor?: string;
  fillGradientAngle?: number;
  patternType?: "chalk" | "noise" | "grunge" | "carbon" | "stripes" | "film" | "brushed" | "marble" | "halftone" | "paper";
  fillGradientStops?: Array<{ color: string; offset: number }>;
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  strokePosition?: "outside" | "center" | "inside";
  strokeOpacity?: number;
  strokeLineJoin?: "round" | "miter" | "bevel";
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowType?: "drop" | "inner";
  bevelEnabled?: boolean;
  bevelDepth?: number;
  bevelHighlight?: string;
  bevelShadow?: string;
  bevelDirection?: "bottom-right" | "bottom" | "right";
  bevelCoreColor?: string;
  bevelEdgeColor?: string;
  bevelEdgeWidth?: number;
  bevelBlur?: number;
  bevelBlurColor?: string;
  
  stackEnabled?: boolean;
  stackCount?: number;
  stackOffsetX?: number;
  stackOffsetY?: number;
  stackOpacityDecay?: number;
  stackColor1?: string;
  stackColor2?: string;
  stackColor3?: string;
  stackColor4?: string;
  panelEnabled?: boolean;
  panelColor?: string;
  panelOpacity?: number;
  panelRadius?: number;
  panelPaddingX?: number;
  panelPaddingY?: number;
  panelStrokeEnabled?: boolean;
  panelStrokeColor?: string;
  panelStrokeWidth?: number;
  textPosX?: "left" | "center" | "right";
  textPosY?: "top" | "middle" | "bottom";
  glowLayers?: Array<{
    enabled: boolean;
    color: string;
    blur: number;
    opacity: number;
    type: "outer" | "inner";
    strength?: number;
    spread?: number;
  }>;
}

export class ${engineName} {
  private cfg: Required<${configName}>;

  constructor(config: ${configName}) {
    // Merge provided configuration with static studio defaults
    const defaults: Required<${configName}> = {
      width: 800,
      height: 200,
      text: "${escText}",
      fontFamily: "${cfg.fontFamily}",
      fontWeight: ${cfg.fontWeight},
      fontStyle: "${cfg.fontStyle}",
      fontSize: ${cfg.fontSize},
      letterSpacing: ${cfg.letterSpacing},
      lineHeight: ${cfg.lineHeight},
      fillType: "${cfg.fillType}",
      fillColor: "${cfg.fillColor}",
      fillGradientAngle: ${cfg.fillGradientAngle},
      patternType: "${cfg.patternType || "chalk"}",
      fillGradientStops: ${fillGradientStopsStr},
      strokeEnabled: ${cfg.strokeEnabled},
      strokeColor: "${cfg.strokeColor}",
      strokeWidth: ${cfg.strokeWidth},
      strokePosition: "${cfg.strokePosition}",
      strokeOpacity: ${cfg.strokeOpacity},
      strokeLineJoin: "${cfg.strokeLineJoin}",
      shadowEnabled: ${cfg.shadowEnabled},
      shadowColor: "${cfg.shadowColor}",
      shadowBlur: ${cfg.shadowBlur},
      shadowOffsetX: ${cfg.shadowOffsetX},
      shadowOffsetY: ${cfg.shadowOffsetY},
      shadowOpacity: ${cfg.shadowOpacity},
      shadowType: "${cfg.shadowType}",
      bevelEnabled: ${cfg.bevelEnabled},
      bevelDepth: ${cfg.bevelDepth},
      bevelHighlight: "${cfg.bevelHighlight}",
      bevelShadow: "${cfg.bevelShadow}",
      bevelDirection: "${cfg.bevelDirection}",
      bevelCoreColor: "${cfg.bevelCoreColor || "#000000"}",
      bevelEdgeColor: "${cfg.bevelEdgeColor || "#2A2A38"}",
      bevelEdgeWidth: ${cfg.bevelEdgeWidth || 0},
      bevelBlur: ${cfg.bevelBlur || 0},
      bevelBlurColor: "${cfg.bevelBlurColor || "#000000"}",
      stackEnabled: ${cfg.stackEnabled || false},
      stackCount: ${cfg.stackCount || 3},
      stackOffsetX: ${cfg.stackOffsetX || 10},
      stackOffsetY: ${cfg.stackOffsetY || -10},
      stackOpacityDecay: ${cfg.stackOpacityDecay || 20},
      stackColor1: "${cfg.stackColor1 || "#FF7C00"}",
      stackColor2: "${cfg.stackColor2 || "#00FFDD"}",
      stackColor3: "${cfg.stackColor3 || "#FF00AA"}",
      stackColor4: "${cfg.stackColor4 || "#AA00FF"}",
      panelEnabled: ${cfg.panelEnabled},
      panelColor: "${cfg.panelColor}",
      panelOpacity: ${cfg.panelOpacity},
      panelRadius: ${cfg.panelRadius},
      panelPaddingX: ${cfg.panelPaddingX},
      panelPaddingY: ${cfg.panelPaddingY},
      panelStrokeEnabled: ${cfg.panelStrokeEnabled},
      panelStrokeColor: "${cfg.panelStrokeColor}",
      panelStrokeWidth: ${cfg.panelStrokeWidth},
      textPosX: "${cfg.textPosX}",
      textPosY: "${cfg.textPosY}",
      glowLayers: ${glowLayersStr}
    };

    this.cfg = {
      ...defaults,
      ...config
    };
  }

  // Satisfies standard Clypra text engine contract - For animated text effects, increments dynamic timelines
  advanceSteps(steps: number): void {
    // This effect is static and has a no-op implementation
  }

  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    ghostFrames?: ImageData[]
  ): void {
    const {
      width,
      height,
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
      textPosX,
      textPosY
    } = this.cfg;

    // Clear dynamic context canvas - Absolutely no color bleed background fills allowed
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;

    // Set text font properties
    const fontStr = fontStyle + " " + fontWeight + " " + fontSize + "px \\\"" + fontFamily + "\\\"";
    ctx.font = fontStr;
    ctx.lineJoin = strokeLineJoin;

    const lines = text.split("\\n");
    const numLines = lines.length;
    const textBlockHeight = fontSize + (numLines - 1) * fontSize * lineHeight;

    // Determine horizontal origins
    let startX = width / 2;
    let align: CanvasTextAlign = "center";
    if (textPosX === "left") {
      startX = panelEnabled ? panelPaddingX + 20 : 50;
      align = "left";
    } else if (textPosX === "right") {
      startX = width - (panelEnabled ? panelPaddingX + 20 : 50);
      align = "right";
    }
    ctx.textAlign = align;

    // Vertical alignment origins
    let startY = (height - textBlockHeight) / 2 + fontSize * 0.8;
    if (textPosY === "top") {
      startY = (panelEnabled ? panelPaddingY + 20 : 40) + fontSize * 0.8;
    } else if (textPosY === "bottom") {
      startY = height - (panelEnabled ? panelPaddingY + 20 : 40) - textBlockHeight + fontSize * 0.8;
    }

    // Dynamic measurements
    let maxLineWidth = 0;
    const lineWidths = lines.map((line) => {
      const originalSpacing = (ctx as any).letterSpacing || "normal";
      if (letterSpacing !== 0) {
        (ctx as any).letterSpacing = letterSpacing + "px";
      }
      const w = ctx.measureText(line).width;
      (ctx as any).letterSpacing = originalSpacing;
      return w;
    });
    maxLineWidth = Math.max(...lineWidths, 10);

    let xMin = startX;
    if (align === "center") {
      xMin = startX - maxLineWidth / 2;
    } else if (align === "right") {
      xMin = startX - maxLineWidth;
    }
    const xMax = xMin + maxLineWidth;
    const yMin = startY - fontSize * 0.8;
    const yMax = yMin + textBlockHeight;

    // Internal line drawer
    const renderLines = (
      mode: "fill" | "stroke",
      overrideStyle?: string | CanvasGradient,
      offsetX = 0,
      offsetY = 0
    ) => {
      const savedLetterSpacing = (ctx as any).letterSpacing || "normal";
      if (letterSpacing !== 0) {
        (ctx as any).letterSpacing = letterSpacing + "px";
      }

      if (overrideStyle) {
        if (mode === "fill") {
          ctx.fillStyle = overrideStyle;
        } else {
          ctx.strokeStyle = overrideStyle;
        }
      }

      lines.forEach((line, index) => {
        const py = startY + index * fontSize * lineHeight;
        if (mode === "fill") {
          ctx.fillText(line, startX + offsetX, py + offsetY);
        } else {
          ctx.strokeText(line, startX + offsetX, py + offsetY);
        }
      });

      (ctx as any).letterSpacing = savedLetterSpacing;
    };

    // Offscreen offset shadow renderer helper (keeps shadow crisp & avoids source text overlapping)
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
      
      const shiftX = 10000;
      ctx.shadowColor = sColor;
      ctx.shadowBlur = sBlur;
      ctx.shadowOffsetX = shiftX + sOffsetX;
      ctx.shadowOffsetY = sOffsetY;

      const savedLetterSpacing = (ctx as any).letterSpacing || "normal";
      if (letterSpacing !== 0) {
        (ctx as any).letterSpacing = letterSpacing + "px";
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
        const py = startY + index * fontSize * lineHeight;
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

    // 1. Background Panel (If active)
    if (panelEnabled) {
      ctx.save();
      ctx.globalAlpha = panelOpacity / 100;
      ctx.fillStyle = panelColor;
      
      const px = xMin - panelPaddingX;
      const py = yMin - panelPaddingY;
      const pw = (xMax - xMin) + 2 * panelPaddingX;
      const ph = textBlockHeight + 2 * panelPaddingY;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, panelRadius);
      ctx.fill();

      if (panelStrokeEnabled) {
        ctx.strokeStyle = panelStrokeColor;
        ctx.lineWidth = panelStrokeWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Glow Layers (Type: Outer)
    const glowLayers = this.cfg.glowLayers || [];
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

    // 3. Drop Shadow (Type: Drop)
    if (shadowEnabled && shadowType === "drop" && shadowOpacity > 0) {
      renderWithShadowTrick(
        "fill",
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        shadowOpacity
      );
    }

    // 4. Glitch RGB Splitting simulation (if applicable)
    const isGlitchEffect = "${className}".toLowerCase().includes("glitch") || text === "SYSTEM ERR";
    if (isGlitchEffect) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      renderLines("fill", "#00FFFF", -4, -2);
      renderLines("fill", "#FF00FF", 4, 2);
      ctx.restore();
    }

    // 5. Bevel 3D Layers
    if (bevelEnabled && bevelDepth > 0) {
      ctx.save();
      for (let i = bevelDepth; i > 0; i--) {
        let dx = 0;
        let dy = 0;
        if (bevelDirection === "bottom-right") {
          dx = i; dy = i;
        } else if (bevelDirection === "bottom") {
          dy = i;
        } else if (bevelDirection === "right") {
          dx = i;
        }
        const sliceColor = i === 1 ? bevelHighlight : bevelShadow;
        renderLines("fill", sliceColor, dx, dy);
      }
      ctx.restore();
    }

    // 5.5. Text Multi-Stack Layers
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
          ctx.lineWidth = strokePosition === "outside" ? strokeWidth * 2 : strokeWidth;
          ctx.globalAlpha = (strokeOpacity / 100) * layerOpacity;
          renderLines("stroke", layerColor, dx, dy);
          ctx.restore();
        }
        
        renderLines("fill", layerColor, dx, dy);
        ctx.restore();
      }
    }

    // 6. Stroke Center or Outside
    if (strokeEnabled && strokeWidth > 0 && strokePosition !== "inside") {
      ctx.save();
      ctx.globalAlpha = strokeOpacity / 100;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokePosition === "outside" ? strokeWidth * 2 : strokeWidth;
      renderLines("stroke");
      ctx.restore();
    }

    // 7. Base Fill Setup (Solid, gradients or textures)
    ctx.save();
    let computedFill: string | CanvasGradient | CanvasPattern = fillColor;

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
      computedFill = grad;
    } else if (fillType === "radial" && fillGradientStops.length >= 2) {
      const cx = (xMin + xMax) / 2;
      const cy = (yMin + yMax) / 2;
      const r = Math.max(xMax - xMin, yMax - yMin) / 1.5;
      
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      fillGradientStops.forEach((stop) => {
        grad.addColorStop(stop.offset / 100, stop.color);
      });
      computedFill = grad;
    } else if (fillType === "pattern") {
      const pType = patternType || "chalk";
      const patColor = fillColor || "#ffffff";
      
      let patCanvas: any = null;
      if (typeof document !== "undefined") {
        patCanvas = document.createElement("canvas");
      } else if (typeof OffscreenCanvas !== "undefined") {
        patCanvas = new OffscreenCanvas(128, 128);
      }
      
      if (patCanvas) {
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
        
        const patCtx = patCanvas.getContext("2d");
        if (patCtx) {
          const seedRandom = (initSeed: number) => {
            let currentSeed = initSeed;
            return () => {
              currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
              return currentSeed / 4294967296;
            };
          };
          const rand = seedRandom(42);
          
          if (pType === "chalk") {
            patCtx.fillStyle = "rgba(0,0,0,0)";
            patCtx.fillRect(0, 0, 120, 120);
            patCtx.fillStyle = patColor;
            for (let i = 0; i < 3500; i++) {
              const px = Math.floor(rand() * 120);
              const py = Math.floor(rand() * 120);
              patCtx.globalAlpha = 0.08 + rand() * 0.18;
              patCtx.fillRect(px, py, 1.2, 1.2);
            }
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
            for (let i = 0; i < 4500; i++) {
              const px = Math.floor(rand() * 96);
              const py = Math.floor(rand() * 96);
              patCtx.globalAlpha = 0.12 + rand() * 0.38;
              patCtx.fillRect(px, py, rand() > 0.85 ? 1.5 : 1, rand() > 0.85 ? 1.5 : 1);
            }
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
            patCtx.fillStyle = "#FFFFFF";
            patCtx.globalAlpha = 0.22;
            patCtx.fillRect(0, 0, 4, 1);
            patCtx.fillRect(4, 4, 4, 1);
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
            patCtx.moveTo(-4, 12);
            patCtx.lineTo(12, -4);
            patCtx.moveTo(0, 16);
            patCtx.lineTo(16, 0);
            patCtx.moveTo(4, 20);
            patCtx.lineTo(20, 4);
            patCtx.stroke();
          } else if (pType === "film") {
            patCtx.fillStyle = patColor;
            patCtx.globalAlpha = 0.94;
            patCtx.fillRect(0, 0, 128, 128);
            for (let i = 0; i < 4800; i++) {
              const px = Math.floor(rand() * 128);
              const py = Math.floor(rand() * 128);
              const isDark = rand() > 0.45;
              patCtx.fillStyle = isDark ? "#000000" : "#FFFFFF";
              patCtx.globalAlpha = isDark ? (0.13 + rand() * 0.22) : (0.15 + rand() * 0.28);
              patCtx.fillRect(px, py, rand() > 0.9 ? 1.5 : 1, rand() > 0.9 ? 1.5 : 1);
            }
            patCtx.strokeStyle = "rgba(255, 255, 255, 0.48)";
            for (let i = 0; i < 10; i++) {
              const sx = rand() * 128;
              const sy = rand() * 128;
              const len = 12 + rand() * 45;
              const angle = -Math.PI / 2 + (rand() - 0.5) * 0.18;
              patCtx.lineWidth = 0.35 + rand() * 0.55;
              patCtx.globalAlpha = 0.22 + rand() * 0.38;
              patCtx.beginPath();
              patCtx.moveTo(sx, sy);
              patCtx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
              patCtx.stroke();
            }
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
            patCtx.strokeStyle = "rgba(0, 0, 0, 0.48)";
            for (let i = 0; i < 4; i++) {
              const sx = rand() * 128;
              const sy = rand() * 128;
              patCtx.lineWidth = 0.55 + rand() * 0.65;
              patCtx.globalAlpha = 0.35 + rand() * 0.3;
              patCtx.beginPath();
              patCtx.moveTo(sx, sy);
              patCtx.quadraticCurveTo(
                sx + (rand() - 0.5) * 16,
                sy + (rand() - 0.5) * 16,
                sx + (rand() - 0.5) * 28,
                sy + (rand() - 0.5) * 28
              );
              patCtx.stroke();
            }
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
            patCtx.fillStyle = patColor;
            patCtx.fillRect(0, 0, 128, 128);
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
              patCtx.lineTo(x + len, y);
              patCtx.stroke();
              if (x + len > 128) {
                patCtx.beginPath();
                patCtx.moveTo(x - 128, y);
                patCtx.lineTo(x + len - 128, y);
                patCtx.stroke();
              }
            }
            for (let i = 0; i < 8; i++) {
              const x = rand() * 128;
              const w = 10 + rand() * 30;
              const isLight = rand() > 0.5;
              const grad = patCtx.createLinearGradient(x, 0, x + w, 0);
              const baseColor = isLight ? "255,255,255" : "0,0,0";
              const alpha = 0.01 + rand() * 0.04;
              grad.addColorStop(0, "rgba(" + baseColor + ", 0)");
              grad.addColorStop(0.5, "rgba(" + baseColor + ", " + alpha + ")");
              grad.addColorStop(1, "rgba(" + baseColor + ", 0)");
              patCtx.fillStyle = grad;
              patCtx.globalAlpha = 1;
              patCtx.fillRect(x, 0, w, 128);
              if (x + w > 128) {
                patCtx.fillRect(x - 128, 0, w, 128);
              }
            }
          } else if (pType === "marble") {
            patCtx.fillStyle = patColor;
            patCtx.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 8; i++) {
              const cx = rand() * 256;
              const cy = rand() * 256;
              const r = 40 + rand() * 70;
              const grad = patCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
              const isLight = rand() > 0.45;
              const alpha = 0.06 + rand() * 0.12;
              const cStr = isLight ? "255,255,255" : "0,0,0";
              grad.addColorStop(0, "rgba(" + cStr + ", " + alpha + ")");
              grad.addColorStop(0.5, "rgba(" + cStr + ", " + (alpha * 0.4) + ")");
              grad.addColorStop(1, "rgba(" + cStr + ", 0)");
              patCtx.fillStyle = grad;
              patCtx.globalAlpha = 1;
              patCtx.beginPath();
              patCtx.arc(cx, cy, r, 0, Math.PI * 2);
              patCtx.fill();
            }
            const drawMarbleVein = (color: string, width: number, opac: number) => {
              patCtx.strokeStyle = color;
              patCtx.lineWidth = width;
              patCtx.globalAlpha = opac;
              let px = rand() * 256;
              let py = 0;
              patCtx.beginPath();
              patCtx.moveTo(px, py);
              const steps = 18;
              for (let s = 1; s <= steps; s++) {
                const progress = s / steps;
                const targetY = progress * 256;
                const frequency = 4;
                const amp = 35;
                const noise = Math.sin(progress * Math.PI * frequency + rand() * 2) * amp;
                const targetX = (px + (rand() - 0.5) * 50 + noise + 256) % 256;
                patCtx.lineTo(targetX, targetY);
              }
              patCtx.stroke();
            };
            for (let i = 0; i < 4; i++) {
              drawMarbleVein("#000000", 1.2 + rand() * 1.5, 0.15 + rand() * 0.15);
            }
            for (let i = 0; i < 3; i++) {
              const isGold = rand() > 0.4;
              const vColor = isGold ? "#EAB308" : "#FFFFFF";
              drawMarbleVein(vColor, 0.7 + rand() * 0.8, 0.2 + rand() * 0.2);
            }
            for (let i = 0; i < 5; i++) {
              drawMarbleVein("#000000", 0.4, 0.08 + rand() * 0.06);
            }
          } else if (pType === "halftone") {
            patCtx.fillStyle = "rgba(0,0,0,0)";
            patCtx.fillRect(0, 0, 24, 24);
            const dotColor = fillColor || "#ffffff";
            patCtx.fillStyle = "#000000";
            patCtx.globalAlpha = 0.35;
            patCtx.beginPath();
            patCtx.arc(12, 12, 5.5, 0, Math.PI * 2);
            patCtx.arc(0, 0, 3.5, 0, Math.PI * 2);
            patCtx.arc(24, 0, 3.5, 0, Math.PI * 2);
            patCtx.arc(0, 24, 3.5, 0, Math.PI * 2);
            patCtx.arc(24, 24, 3.5, 0, Math.PI * 2);
            patCtx.fill();
            patCtx.fillStyle = dotColor;
            patCtx.globalAlpha = 0.95;
            patCtx.beginPath();
            patCtx.arc(11, 11, 5.0, 0, Math.PI * 2);
            patCtx.arc(0, 0, 3.0, 0, Math.PI * 2);
            patCtx.arc(24, 0, 3.0, 0, Math.PI * 2);
            patCtx.arc(0, 24, 3.0, 0, Math.PI * 2);
            patCtx.arc(24, 24, 3.0, 0, Math.PI * 2);
            patCtx.fill();
            patCtx.fillStyle = dotColor === "#FFFFFF" || dotColor === "#ffffff" ? "#7C6FFF" : "#FFFFFF";
            patCtx.globalAlpha = 0.55;
            patCtx.beginPath();
            patCtx.arc(12, 0, 1.5, 0, Math.PI * 2);
            patCtx.arc(12, 24, 1.5, 0, Math.PI * 2);
            patCtx.arc(0, 12, 1.5, 0, Math.PI * 2);
            patCtx.arc(24, 12, 1.5, 0, Math.PI * 2);
            patCtx.fill();
          } else if (pType === "paper") {
            patCtx.fillStyle = patColor;
            patCtx.fillRect(0, 0, 128, 128);
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
              patCtx.quadraticCurveTo(
                fx + Math.cos(fangle) * flen * 0.5 + (rand() - 0.5) * 4,
                fy + Math.sin(fangle) * flen * 0.5 + (rand() - 0.5) * 4,
                fx + Math.cos(fangle) * flen,
                fy + Math.sin(fangle) * flen
              );
              patCtx.stroke();
            }
            for (let i = 0; i < 5000; i++) {
              const gx = Math.floor(rand() * 128);
              const gy = Math.floor(rand() * 128);
              const isDark = rand() > 0.5;
              patCtx.fillStyle = isDark ? "#000000" : "#FFFFFF";
              patCtx.globalAlpha = isDark ? 0.04 : 0.06;
              patCtx.fillRect(gx, gy, 1, 1);
            }
            const points: [number, number][] = [];
            for (let i = 0; i < 6; i++) {
              points.push([rand() * 128, rand() * 128]);
            }
            points.push([0, 0], [128, 0], [128, 128], [0, 128]);
            for (let i = 0; i < 15; i++) {
              const p1 = points[Math.floor(rand() * points.length)];
              const p2 = points[Math.floor(rand() * points.length)];
              const p3 = points[Math.floor(rand() * points.length)];
              if (p1 !== p2 && p2 !== p3) {
                const grad = patCtx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
                const alpha = 0.01 + rand() * 0.06;
                const isDark = rand() > 0.5;
                const cStr = isDark ? "0,0,0" : "255,255,255";
                grad.addColorStop(0, "rgba(" + cStr + ", " + alpha + ")");
                grad.addColorStop(1, "rgba(" + cStr + ", 0)");
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
            for (let i = 0; i < 12; i++) {
              const sx = rand() * 128;
              const sy = rand() * 128;
              const ex = rand() * 128;
              const ey = rand() * 128;
              const dx = ex - sx;
              const dy = ey - sy;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) continue;
              const nx = -dy / len;
              const ny = dx / len;
              patCtx.strokeStyle = "#000000";
              patCtx.lineWidth = 0.5 + rand() * 1.2;
              patCtx.globalAlpha = 0.05 + rand() * 0.12;
              patCtx.beginPath();
              patCtx.moveTo(sx + nx * 0.8, sy + ny * 0.8);
              patCtx.lineTo(ex + nx * 0.8, ey + ny * 0.8);
              patCtx.stroke();
              patCtx.strokeStyle = "#000000";
              patCtx.lineWidth = 0.3 + rand() * 0.4;
              patCtx.globalAlpha = 0.08 + rand() * 0.15;
              patCtx.beginPath();
              patCtx.moveTo(sx, sy);
              patCtx.lineTo(ex, ey);
              patCtx.stroke();
              patCtx.strokeStyle = "#FFFFFF";
              patCtx.lineWidth = 0.6 + rand() * 1.5;
              patCtx.globalAlpha = 0.08 + rand() * 0.22;
              patCtx.beginPath();
              patCtx.moveTo(sx - nx * 0.8, sy - ny * 0.8);
              patCtx.lineTo(ex - nx * 0.8, ey - ny * 0.8);
              patCtx.stroke();
            }
          }
          
          const pat = ctx.createPattern(patCanvas as any, "repeat");
          if (pat) {
            computedFill = pat;
          }
        }
      }
    }

    if (fillType !== "none") {
      renderLines("fill", computedFill);
    }
    ctx.restore();

    // Inside stroke clipping composition fallback
    if (strokeEnabled && strokeWidth > 0 && strokePosition === "inside") {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * 2;
      ctx.globalAlpha = strokeOpacity / 100;
      renderLines("stroke");
      ctx.restore();
    }

    // 8. Glow and Shadow overlays on top (using source-atop composition)
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

    if (shadowEnabled && shadowType === "inner" && shadowOpacity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
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

    // 9. Extra scanline grid (Glitch only)
    if (isGlitchEffect) {
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
}

export const ${className}Definition = ${JSON.stringify(getEffectRepresentation(cfg), null, 2)} as any;

/**
 * ─── CENTRAL REGISTRY WIRING ──────────────────────────────────────────────────
 * Copy and paste the two lines below into your src/features/text-effects/registry.ts:
 *
 *   import { ${className}Engine, ${className}Definition } from "./effects/${className}";
 *   register(${className}Definition, ${className}Engine);
 * ──────────────────────────────────────────────────────────────────────────────
 */
`;
}

export function generateEffectDefinition(cfg: TextEffectConfig): string {
  const representation = getEffectRepresentation(cfg);

  return `/**
 * Clypra Text Effect Definition Output
 * Auto-generated by Clypra Text Effect Studio on ${new Date().toISOString().split("T")[0]}
 * Satisfies TextEffectDefinition interface structure
 */

export interface TextEffectDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  font: {
    family: string;
    weight: number;
    style: "normal" | "italic";
    letterSpacing: number;
    lineHeight: number;
  };
  fills: any[];
  strokes: any[];
  shadows: any[];
  glows?: any[];
  bevel?: any;
  panel?: any;
}

export const ${toPascalCase(getEnrichedEffectName(cfg)) || "MyEffect"}Definition: TextEffectDefinition = ${JSON.stringify(representation, null, 2)};
`;
}

export function stripTypesToJS(tsCode: string): string {
  let js = tsCode;

  // 1. Remove export interface or interface blocks completely
  js = js.replace(/export\s+interface\s+\w+\s*\{[\s\S]*?\n\}/gm, "");
  js = js.replace(/interface\s+\w+\s*\{[\s\S]*?\n\}/gm, "");

  // 2. Class fields: private cfg: Required<...>; -> cfg;
  js = js.replace(/private\s+(\w+)\s*:\s*Required<[A-Za-z0-9_<>]+>\s*;/gm, "$1;");
  js = js.replace(/private\s+(\w+)\s*:\s*.*?;/gm, "$1;");
  js = js.replace(/public\s+(\w+)\s*:\s*.*?;/gm, "$1;");

  // 3. Constructor typing
  js = js.replace(/constructor\s*\(\s*(\w+)\s*:\s*[A-Za-z0-9_<>|]+\s*\)/gm, "constructor($1)");

  // 4. advanceSteps signature
  js = js.replace(/advanceSteps\s*\(\s*(\w+)\s*:\s*\w+\s*\)\s*:\s*\w+\s*\{/gm, "advanceSteps($1) {");

  // 5. drawFrame params and return type
  js = js.replace(/drawFrame\s*\([\s\S]*?\)\s*:\s*void\s*\{/gm, "drawFrame(ctx, ghostFrames) {");

  // 6. Variables like 'let align: CanvasTextAlign = "center";' or 'const defaults: Required<MyConfig> = {'
  js = js.replace(/(const|let|var)\s+(\w+)\s*:\s*[A-Za-z0-9_<>\s|?:\(\{\}]+?\s*=/gm, "$1 $2 =");

  // 7. Internal helpers renderLines and renderWithShadowTrick
  js = js.replace(/const\s+renderLines\s*=\s*\(([\s\S]*?)\)\s*=>\s*\{/gm, "const renderLines = (mode, overrideStyle, offsetX = 0, offsetY = 0) => {");
  js = js.replace(/const\s+renderWithShadowTrick\s*=\s*\(([\s\S]*?)\)\s*=>\s*\{/gm, "const renderWithShadowTrick = (mode, sColor, sBlur, sOffsetX, sOffsetY, opacity, overrideStyle = '#000', spread = 0) => {");

  // 8. Type castings like (ctx as any) -> ctx
  js = js.replace(/\(ctx\s+as\s+any\)/gm, "ctx");
  js = js.replace(/\s+as\s+any\b/g, "");

  // Rename extension references or headers
  js = js.replace(/\.ts\b/g, ".js");
  js = js.replace(/TypeScript\s+Code\s+Output/gi, "JavaScript Code Output (Vanilla ES6)");

  // Clean up excessive empty lines
  js = js.trim().replace(/\n{3,}/g, "\n\n");

  return js;
}

export function generateHTMLFile(cfg: TextEffectConfig): string {
  const className = toPascalCase(getEnrichedEffectName(cfg)) || "MyEffect";
  const engineName = `${className}Engine`;
  
  // Clean TS class code to direct browser-runnable JS
  let rawJs = stripTypesToJS(generateEngineClass(cfg));
  rawJs = rawJs.replace(/export\s+class\s+(\w+)/g, "class $1");
  rawJs = rawJs.replace(/export\s+const\s+(\w+)/g, "const $1");

  const isSystemFont = [
    "Arial", "Arial Black", "Arial Rounded MT Bold", "Georgia", 
    "Times New Roman", "Courier New", "Impact", "Verdana", 
    "Trebuchet MS", "Palatino"
  ].includes(cfg.fontFamily);

  const fontImportUrl = isSystemFont 
    ? "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
    : `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=${cfg.fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;

  const definitionCode = generateEffectDefinition(cfg);
  const match = definitionCode.match(/TextEffectDefinition\s*=\s*(\{[\s\S]*?\});/);
  const definitionJson = match && match[1] ? match[1] : "{}";

  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.effectName || "Clypra Effect"} | Interactive Standalone Preview</title>
  
  <!-- Pre-empt and filter Tailwind CDN development warnings to keep the developer console pristine -->
  <script>
    (function() {
      const originalWarn = console.warn;
      console.warn = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) {
          return;
        }
        originalWarn.apply(console, args);
      };
    })();
  </script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    };
  </script>

  <!-- Google Fonts Support -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <style>
    @import url("${fontImportUrl}");

    /* Custom Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0D0D15;
    }
    ::-webkit-scrollbar-thumb {
      background: #252433;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3B3956;
    }

    /* Checkerboard BG */
    .checkerboard-bg {
      background-image: linear-gradient(45deg, #111116 25%, transparent 25%),
                        linear-gradient(-45deg, #111116 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #111116 75%),
                        linear-gradient(-45deg, transparent 75%, #111116 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      background-color: #08080C;
    }
  </style>
</head>
<body class="bg-[#08080C] text-[#D1D1E0] h-full flex flex-col font-sans antialiased overflow-hidden">

  <!-- Header -->
  <header class="border-b border-[#1A1A26] bg-[#0E0E14] px-6 py-3.5 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#7C6FFF] to-[#AA55FF] flex items-center justify-center shadow-lg shadow-[#7C6FFF]/20">
        <svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-tight">${cfg.effectName || "Clypra Effect"}</h1>
        <p class="text-[10px] text-[#66667F] font-mono uppercase tracking-wider">Clypra Design Sandbox</p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-[#7C6FFF]/10 border border-[#7C6FFF]/20 text-[#9E93FF]">
        <span class="h-1.5 w-1.5 rounded-full bg-[#7C6FFF] animate-pulse"></span>
        Interactive HTML Sandbox
      </span>
    </div>
  </header>

  <!-- Main Workspace -->
  <main class="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
    
    <!-- Left: Controls sidebar (width: 320px) -->
    <aside class="w-full lg:w-80 border-r border-[#1A1A26] bg-[#0E0E14] flex flex-col min-h-0 shrink-0">
      <div class="p-4 border-b border-[#1A1A26]/80">
        <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Sandbox Settings</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        
        <!-- Text Input -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-mono uppercase text-[#66667F]" for="text-input">Core Display Text</label>
          <textarea 
            id="text-input" 
            rows="3" 
            class="w-full bg-[#050508] border border-[#212130] hover:border-[#313148] focus:border-[#7C6FFF] text-white text-xs p-2.5 rounded-lg focus:outline-none transition-all font-sans"
            placeholder="Type your design here..."
          >${cfg.text}</textarea>
        </div>

        <!-- Typography Settings -->
        <div class="space-y-4">
          <h3 class="text-[10px] font-mono uppercase text-[#4D4D68] border-b border-[#1A1A26] pb-1">Typography Adjustments</h3>

          <!-- Font Size Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#8F8FA3]">Font Size</span>
              <span class="text-[#7C6FFF]" id="size-val">${cfg.fontSize}px</span>
            </div>
            <input 
              id="size-slider" 
              type="range" 
              min="20" 
              max="200" 
              value="${cfg.fontSize}" 
              class="w-full h-1 bg-[#1A1A26] rounded-lg appearance-none cursor-pointer accent-[#7C6FFF]"
            >
          </div>

          <!-- Letter Spacing Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#8F8FA3]">Letter Spacing</span>
              <span class="text-[#7C6FFF]" id="tracking-val">${cfg.letterSpacing}px</span>
            </div>
            <input 
              id="tracking-slider" 
              type="range" 
              min="-10" 
              max="50" 
              value="${cfg.letterSpacing}" 
              class="w-full h-1 bg-[#1A1A26] rounded-lg appearance-none cursor-pointer accent-[#7C6FFF]"
            >
          </div>

          <!-- Line Height Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#8F8FA3]">Line Spacing</span>
              <span class="text-[#7C6FFF]" id="leading-val">${cfg.lineHeight}</span>
            </div>
            <input 
              id="leading-slider" 
              type="range" 
              min="0.8" 
              max="2.5" 
              step="0.05" 
              value="${cfg.lineHeight}" 
              class="w-full h-1 bg-[#1A1A26] rounded-lg appearance-none cursor-pointer accent-[#7C6FFF]"
            >
          </div>
        </div>

        <!-- Display Canvas Options -->
        <div class="space-y-3">
          <h3 class="text-[10px] font-mono uppercase text-[#4D4D68] border-b border-[#1A1A26] pb-1">Canvas Controls</h3>

          <!-- Background presets -->
          <div class="space-y-1.5">
            <label class="block text-[10px] font-mono uppercase text-[#66667F]">Sandbox Backdrop</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="setBackdrop('checkerboard')" id="btn-bg-checkerboard" class="px-2.5 py-1.5 rounded-md bg-[#212130] text-xs font-semibold text-white border border-[#7C6FFF]/50 cursor-pointer text-center">Checkerboard</button>
              <button onclick="setBackdrop('charcoal')" id="btn-bg-charcoal" class="px-2.5 py-1.5 rounded-md bg-[#0D0D15] hover:bg-[#1A1A26] text-xs font-semibold text-gray-400 hover:text-white border border-[#1E1E2B] cursor-pointer text-center">Charcoal Noir</button>
              <button onclick="setBackdrop('slate')" id="btn-bg-slate" class="px-2.5 py-1.5 rounded-md bg-[#0D0D15] hover:bg-[#1A1A26] text-xs font-semibold text-gray-400 hover:text-white border border-[#1E1E2B] cursor-pointer text-center">Cozy Slate</button>
              <button onclick="setBackdrop('transparent')" id="btn-bg-transparent" class="px-2.5 py-1.5 rounded-md bg-[#0D0D15] hover:bg-[#1A1A26] text-xs font-semibold text-gray-400 hover:text-white border border-[#1E1E2B] cursor-pointer text-center">Transparent</button>
            </div>
          </div>
        </div>

        <!-- Export & Metadata Options -->
        <div class="space-y-3">
          <h3 class="text-[10px] font-mono uppercase text-[#4D4D68] border-b border-[#1A1A26] pb-1">Engine Metadata Definitions</h3>
          <div class="space-y-2">
            <button onclick="copyMetadataDef()" class="w-full py-2 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[10px] font-bold border border-[#2A2A38] hover:border-[#7C6FFF]/50 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
              <svg class="h-3.5 w-3.5 text-[#9E93FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Clypra Definition JSON
            </button>
            <div id="copy-success-indicator" class="text-[9px] font-mono text-green-400 text-center hidden animate-pulse bg-green-950/20 border border-green-500/20 rounded py-1">Copied definition JSON to clipboard! ✓</div>
          </div>
        </div>

      </div>

      <!-- Footer action export -->
      <div class="p-4 border-t border-[#1A1A26] bg-[#0A0A0E] space-y-2 shrink-0">
        <button 
          onclick="downloadSnapshot()" 
          class="w-full py-2 bg-[#7C6FFF] hover:bg-[#6C5FFF] active:bg-[#5C4FFF] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#7C6FFF]/15 transition-all text-center"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export PNG Snapshot
        </button>
      </div>
    </aside>

    <!-- Right: Central display stage -->
    <section class="flex-1 flex flex-col bg-[#050508] relative min-h-0 overflow-auto">
      
      <div class="absolute inset-0 flex items-center justify-center p-6">
        <!-- Live container sized properly -->
        <div id="canvas-wrapper" class="w-full max-w-4xl aspect-[16/5] bg-neutral-950 border border-[#212130] rounded-xl checkerboard-bg relative shadow-2xl overflow-hidden flex items-center justify-center">
          <canvas id="preview-canvas" width="800" height="250" class="max-w-full max-h-full"></canvas>
        </div>
      </div>

      <!-- Tech floating metrics bar -->
      <div class="absolute bottom-4 right-4 pointer-events-none select-none bg-[#0E0E14]/90 backdrop-blur border border-[#1D1D2C] px-3 py-1.5 rounded-lg shadow-lg">
        <div class="flex items-center gap-4 text-[10px] font-mono text-[#66667F]">
          <div>Canvas: <span class="text-white" id="canvas-dim">800x250</span></div>
          <div>Font Family: <span class="text-[#7C6FFF]">${cfg.fontFamily}</span></div>
          <div>FPS: <span class="text-green-400">Locked (60)</span></div>
        </div>
      </div>
    </section>

  </main>

  <!-- Sandbox Controller Core Engine -->
  <script>
    // Embedded stripped engine logic
    ${rawJs}

    // Interactive config state
    const currentConfig = {
      width: 800,
      height: 250,
      text: \`${cfg.text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
      fontFamily: "${cfg.fontFamily}",
      fontWeight: ${cfg.fontWeight},
      fontStyle: "${cfg.fontStyle}",
      fontSize: ${cfg.fontSize},
      letterSpacing: ${cfg.letterSpacing},
      lineHeight: ${cfg.lineHeight},
      fillType: "${cfg.fillType}",
      fillColor: "${cfg.fillColor}",
      fillGradientAngle: ${cfg.fillGradientAngle},
      patternType: "${cfg.patternType || "chalk"}",
      fillGradientStops: ${JSON.stringify(cfg.fillGradientStops)},
      strokeEnabled: ${cfg.strokeEnabled},
      strokeColor: "${cfg.strokeColor}",
      strokeWidth: ${cfg.strokeWidth},
      strokePosition: "${cfg.strokePosition}",
      strokeOpacity: ${cfg.strokeOpacity},
      strokeLineJoin: "${cfg.strokeLineJoin}",
      shadowEnabled: ${cfg.shadowEnabled},
      shadowColor: "${cfg.shadowColor}",
      shadowBlur: ${cfg.shadowBlur},
      shadowOffsetX: ${cfg.shadowOffsetX},
      shadowOffsetY: ${cfg.shadowOffsetY},
      shadowOpacity: ${cfg.shadowOpacity},
      shadowType: "${cfg.shadowType}",
      bevelEnabled: ${cfg.bevelEnabled},
      bevelDepth: ${cfg.bevelDepth},
      bevelHighlight: "${cfg.bevelHighlight}",
      bevelShadow: "${cfg.bevelShadow}",
      bevelDirection: "${cfg.bevelDirection}",
      bevelCoreColor: "${cfg.bevelCoreColor || "#000000"}",
      bevelEdgeColor: "${cfg.bevelEdgeColor || "#2A2A38"}",
      bevelEdgeWidth: ${cfg.bevelEdgeWidth || 0},
      bevelBlur: ${cfg.bevelBlur || 0},
      bevelBlurColor: "${cfg.bevelBlurColor || "#000000"}",
      stackEnabled: ${cfg.stackEnabled || false},
      stackCount: ${cfg.stackCount || 3},
      stackOffsetX: ${cfg.stackOffsetX || 10},
      stackOffsetY: ${cfg.stackOffsetY || -10},
      stackOpacityDecay: ${cfg.stackOpacityDecay || 20},
      stackColor1: "${cfg.stackColor1 || "#FF7C00"}",
      stackColor2: "${cfg.stackColor2 || "#00FFDD"}",
      stackColor3: "${cfg.stackColor3 || "#FF00AA"}",
      stackColor4: "${cfg.stackColor4 || "#AA00FF"}",
      panelEnabled: ${cfg.panelEnabled},
      panelColor: "${cfg.panelColor}",
      panelOpacity: ${cfg.panelOpacity},
      panelRadius: ${cfg.panelRadius},
      panelPaddingX: ${cfg.panelPaddingX},
      panelPaddingY: ${cfg.panelPaddingY},
      panelStrokeEnabled: ${cfg.panelStrokeEnabled},
      panelStrokeColor: "${cfg.panelStrokeColor}",
      panelStrokeWidth: ${cfg.panelStrokeWidth},
      textPosX: "${cfg.textPosX}",
      textPosY: "${cfg.textPosY}"
    };

    const metadataDefObj = ${definitionJson};

    function copyMetadataDef() {
      navigator.clipboard.writeText(JSON.stringify(metadataDefObj, null, 2)).then(() => {
        const indicator = document.getElementById("copy-success-indicator");
        indicator.classList.remove("hidden");
        setTimeout(() => {
          indicator.classList.add("hidden");
        }, 3000);
      });
    }

    const canvas = document.getElementById("preview-canvas");
    const ctx = canvas.getContext("2d");
    let activeEngine = null;

    // Redraw loop
    function updateDrawing() {
      if (!ctx) return;
      
      // Setup canvas resolutions (using 1:1 user space scale to ensure pixel-perfect shadows and glowing renders across all platform browsers)
      canvas.width = 800;
      canvas.height = 250;

      // Re-initialize engine
      const configWithFreshScale = {
        ...currentConfig,
        width: 800,
        height: 250
      };

      activeEngine = new ${engineName}(configWithFreshScale);
      activeEngine.drawFrame(ctx);
    }

    // Direct interface listeners binding
    const txtInput = document.getElementById("text-input");
    txtInput.addEventListener("input", (e) => {
      currentConfig.text = e.target.value;
      updateDrawing();
    });

    // Sliders
    const sizeSlider = document.getElementById("size-slider");
    const sizeVal = document.getElementById("size-val");
    sizeSlider.addEventListener("input", (e) => {
      currentConfig.fontSize = parseInt(e.target.value, 10);
      sizeVal.textContent = currentConfig.fontSize + "px";
      updateDrawing();
    });

    const trackingSlider = document.getElementById("tracking-slider");
    const trackingVal = document.getElementById("tracking-val");
    trackingSlider.addEventListener("input", (e) => {
      currentConfig.letterSpacing = parseInt(e.target.value, 10);
      trackingVal.textContent = currentConfig.letterSpacing + "px";
      updateDrawing();
    });

    const leadingSlider = document.getElementById("leading-slider");
    const leadingVal = document.getElementById("leading-val");
    leadingSlider.addEventListener("input", (e) => {
      currentConfig.lineHeight = parseFloat(e.target.value);
      leadingVal.textContent = currentConfig.lineHeight;
      updateDrawing();
    });

    // Backdrop controls
    function setBackdrop(mode) {
      const wrapper = document.getElementById("canvas-wrapper");
      wrapper.className = "w-full max-w-4xl aspect-[16/5] border border-[#212130] rounded-xl relative shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300";
      
      // Reset button styles
      ['checkerboard', 'charcoal', 'slate', 'transparent'].forEach((m) => {
        const btn = document.getElementById("btn-bg-" + m);
        if (btn) {
          btn.className = "px-2.5 py-1.5 rounded-md bg-[#0D0D15] hover:bg-[#1A1A26] text-xs font-semibold text-gray-400 hover:text-white border border-[#1E1E2B] cursor-pointer text-center";
        }
      });

      const selectedBtn = document.getElementById("btn-bg-" + mode);
      if (selectedBtn) {
        selectedBtn.className = "px-2.5 py-1.5 rounded-md bg-[#212130] text-xs font-semibold text-white border border-[#7C6FFF]/50 cursor-pointer text-center";
      }

      if (mode === "checkerboard") {
        wrapper.classList.add("checkerboard-bg");
      } else if (mode === "charcoal") {
        wrapper.style.backgroundColor = "#030305";
      } else if (mode === "slate") {
        wrapper.style.backgroundColor = "#1E1E28";
      } else if (mode === "transparent") {
        wrapper.style.backgroundColor = "transparent";
      }
    }

    // Snapshot download
    function downloadSnapshot() {
      // Create high quality non-DPR snapshot
      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = 800;
      captureCanvas.height = 250;
      const captureCtx = captureCanvas.getContext("2d");
      
      const configWithFreshScale = {
        ...currentConfig,
        width: 800,
        height: 250
      };

      const captureEngine = new ${engineName}(configWithFreshScale);
      captureEngine.drawFrame(captureCtx);

      const link = document.createElement("a");
      const cleanName = "${toKebabCase(cfg.effectName) || "my-effect"}";
      link.download = \`\${cleanName}-snapshot.png\`;
      link.href = captureCanvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Initial Trigger on fonts loading
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updateDrawing();
      }).catch((err) => {
        console.warn("Fonts loading deferred/restricted, using standard redraw:", err);
        updateDrawing();
      });
    } else {
      updateDrawing();
    }
    // Fallback trigger
    setTimeout(updateDrawing, 500);
  </script>
</body>
</html>`;
}

