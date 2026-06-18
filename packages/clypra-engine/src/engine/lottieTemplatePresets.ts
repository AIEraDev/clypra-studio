/**
 * Built-in CapCut-style Lottie text template presets.
 * Each preset is a complete Lottie JSON composition ready to use.
 */

import { createBlankLottie, addTextLayer, addSolidLayer, addShapeLayer, addVectorShape, reindexLayers } from "./lottieEditor";
import { applyStyleToLottieLayer } from "./lottieTextStyle";
import { bakeAnimationIntoLayer, getAnimPreset } from "./lottieTextAnimations";

export type TemplatePresetCategory = "title" | "lower-third" | "caption" | "callout" | "social" | "outro";

export interface LottieTemplatePreset {
  id: string;
  name: string;
  category: TemplatePresetCategory;
  description: string;
  tags: string[];
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  /** Build and return the Lottie JSON for this preset */
  build: () => any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hex2lottie(hex: string): [number, number, number] {
  const c = hex.replace("#", "").padEnd(6, "0");
  return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
}

function applyTextDoc(
  layer: any,
  opts: {
    text: string;
    font: string;
    size: number;
    color: string;
    align?: number;
    tracking?: number;
    strokeColor?: string;
    strokeWidth?: number;
  },
): any {
  const clone = JSON.parse(JSON.stringify(layer));
  const applyDoc = (doc: any) => {
    doc.t = opts.text;
    doc.f = opts.font;
    doc.s = opts.size;
    doc.fc = hex2lottie(opts.color);
    doc.j = opts.align ?? 1;
    doc.tr = opts.tracking ?? 0;
    doc.lh = opts.size * 1.2;
    if (opts.strokeColor && opts.strokeWidth) {
      doc.sc = hex2lottie(opts.strokeColor);
      doc.sw = opts.strokeWidth;
    }
  };
  const td = clone.t?.d;
  if (!td) return clone;
  if (Array.isArray(td.k))
    td.k.forEach((kf: any) => {
      if (kf?.s) applyDoc(kf.s);
    });
  else if (td.k?.s) applyDoc(td.k.s);
  return clone;
}

function setLayerPos(layer: any, x: number, y: number): any {
  const clone = JSON.parse(JSON.stringify(layer));
  if (clone.ks?.p?.a === 0) clone.ks.p.k = [x, y, 0];
  return clone;
}

function setLayerOpacity(layer: any, op: number): any {
  const clone = JSON.parse(JSON.stringify(layer));
  if (clone.ks?.o?.a === 0) clone.ks.o.k = op;
  return clone;
}

function addRoundedRect(lottie: any, name: string, cx: number, cy: number, w: number, h: number, r: number, color: string): any {
  let clone = JSON.parse(JSON.stringify(lottie));
  const [cr, cg, cb] = hex2lottie(color);
  const shapeLayer = {
    ty: 4,
    nm: name,
    sr: 1,
    st: 0,
    ip: 0,
    op: clone.op,
    ind: 1,
    ks: {
      a: { a: 0, k: [0, 0, 0] },
      p: { a: 0, k: [cx, cy, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    },
    shapes: [
      {
        ty: "gr",
        nm: "Rect",
        it: [
          { ty: "rc", nm: "Path", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: r } },
          { ty: "fl", nm: "Fill", c: { a: 0, k: [cr, cg, cb, 1] }, o: { a: 0, k: 100 } },
          { ty: "tr", nm: "Tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
        ],
      },
    ],
  };
  clone.layers.push(shapeLayer);
  reindexLayers(clone);
  return clone;
}

// ─── Template Builders ───────────────────────────────────────────────────────

function buildCleanLowerThird(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addRoundedRect(l, "Bar BG", 480, 940, 800, 80, 8, "#1A1A2E");
  l = addTextLayer(l, "Name", "JOHN DOE");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "JOHN DOE", font: "Poppins-Bold", size: 48, color: "#FFFFFF", align: 0, tracking: 80 });
  l.layers[0] = setLayerPos(l.layers[0], 480, 940);
  l = addTextLayer(l, "Title", "Creative Director");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "Creative Director", font: "Poppins-Regular", size: 28, color: "#A0A0C0", align: 0 });
  l.layers[0] = setLayerPos(l.layers[0], 480, 975);
  // Entrance animations
  const nameIdx = l.layers.findIndex((x: any) => x.nm === "Name");
  const titleIdx = l.layers.findIndex((x: any) => x.nm === "Title");
  const slidePreset = getAnimPreset("slide-right");
  if (slidePreset && nameIdx >= 0) l = bakeAnimationIntoLayer(l, nameIdx, slidePreset, { startFrame: 5, endFrame: 25, totalFrames: 120, compW: 1920, compH: 1080 });
  if (slidePreset && titleIdx >= 0) l = bakeAnimationIntoLayer(l, titleIdx, slidePreset, { startFrame: 12, endFrame: 32, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildNeonTitle(): any {
  let l = createBlankLottie(1920, 1080, 30, 150);
  l = addSolidLayer(l, "BG", "#0A0A0F", 1920, 1080);
  l = addTextLayer(l, "Main Title", "NEON DREAMS");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "NEON DREAMS", font: "Montserrat-Black", size: 120, color: "#FF2D78", align: 1, tracking: 200, strokeColor: "#FF2D78", strokeWidth: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 540);
  l = addTextLayer(l, "Subtitle", "A VISUAL STORY");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "A VISUAL STORY", font: "Montserrat-Regular", size: 36, color: "#7C6FFF", align: 1, tracking: 400 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 640);
  const mainIdx = l.layers.findIndex((x: any) => x.nm === "Main Title");
  const subIdx = l.layers.findIndex((x: any) => x.nm === "Subtitle");
  const zoomPreset = getAnimPreset("zoom-in-bounce");
  const fadePreset = getAnimPreset("fade-in");
  if (zoomPreset && mainIdx >= 0) l = bakeAnimationIntoLayer(l, mainIdx, zoomPreset, { startFrame: 5, endFrame: 35, totalFrames: 150, compW: 1920, compH: 1080 });
  if (fadePreset && subIdx >= 0) l = bakeAnimationIntoLayer(l, subIdx, fadePreset, { startFrame: 25, endFrame: 45, totalFrames: 150, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildMinimalCaption(): any {
  let l = createBlankLottie(1920, 1080, 30, 90);
  l = addTextLayer(l, "Caption", "This is a caption text");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "This is a caption text", font: "Inter-Regular", size: 52, color: "#FFFFFF", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 900);
  const idx = l.layers.findIndex((x: any) => x.nm === "Caption");
  const preset = getAnimPreset("slide-up");
  if (preset && idx >= 0) l = bakeAnimationIntoLayer(l, idx, preset, { startFrame: 0, endFrame: 18, totalFrames: 90, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildBoldCallout(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addRoundedRect(l, "Pill BG", 960, 540, 700, 100, 50, "#FF5722");
  l = addTextLayer(l, "Callout", "BREAKING NEWS");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "BREAKING NEWS", font: "Oswald-Bold", size: 64, color: "#FFFFFF", align: 1, tracking: 150 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 540);
  const idx = l.layers.findIndex((x: any) => x.nm === "Callout");
  const preset = getAnimPreset("pop-in");
  if (preset && idx >= 0) l = bakeAnimationIntoLayer(l, idx, preset, { startFrame: 3, endFrame: 21, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildCinematicTitle(): any {
  let l = createBlankLottie(1920, 1080, 24, 144);
  l = addSolidLayer(l, "BG", "#000000", 1920, 1080);
  // Letterbox bars
  l = addRoundedRect(l, "Bar Top", 960, 60, 1920, 120, 0, "#000000");
  l = addRoundedRect(l, "Bar Bottom", 960, 1020, 1920, 120, 0, "#000000");
  l = addTextLayer(l, "Film Title", "THE LAST HORIZON");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "THE LAST HORIZON", font: "Playfair Display-Bold", size: 96, color: "#F5E6C8", align: 1, tracking: 300 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 520);
  l = addTextLayer(l, "Tagline", "Some stories are worth telling");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "Some stories are worth telling", font: "Playfair Display-Italic", size: 32, color: "#C8B89A", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 610);
  const titleIdx = l.layers.findIndex((x: any) => x.nm === "Film Title");
  const tagIdx = l.layers.findIndex((x: any) => x.nm === "Tagline");
  const fadePreset = getAnimPreset("fade-in");
  if (fadePreset && titleIdx >= 0) l = bakeAnimationIntoLayer(l, titleIdx, fadePreset, { startFrame: 12, endFrame: 48, totalFrames: 144, compW: 1920, compH: 1080 });
  if (fadePreset && tagIdx >= 0) l = bakeAnimationIntoLayer(l, tagIdx, fadePreset, { startFrame: 36, endFrame: 60, totalFrames: 144, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildSportsScore(): any {
  let l = createBlankLottie(1920, 1080, 30, 90);
  l = addRoundedRect(l, "Score BG", 960, 60, 500, 80, 4, "#CC0000");
  l = addTextLayer(l, "Team A", "TEAM A");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "TEAM A", font: "Oswald-Bold", size: 40, color: "#FFFFFF", align: 2, tracking: 100 });
  l.layers[0] = setLayerPos(l.layers[0], 820, 60);
  l = addTextLayer(l, "Score", "3 - 1");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "3 - 1", font: "Oswald-Bold", size: 48, color: "#FFD700", align: 1, tracking: 50 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 60);
  l = addTextLayer(l, "Team B", "TEAM B");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "TEAM B", font: "Oswald-Bold", size: 40, color: "#FFFFFF", align: 0, tracking: 100 });
  l.layers[0] = setLayerPos(l.layers[0], 1100, 60);
  const scoreIdx = l.layers.findIndex((x: any) => x.nm === "Score");
  const preset = getAnimPreset("zoom-in-bounce");
  if (preset && scoreIdx >= 0) l = bakeAnimationIntoLayer(l, scoreIdx, preset, { startFrame: 5, endFrame: 25, totalFrames: 90, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildSocialQuote(): any {
  let l = createBlankLottie(1080, 1080, 30, 120);
  l = addSolidLayer(l, "BG", "#1A1A2E", 1080, 1080);
  l = addRoundedRect(l, "Card", 540, 540, 900, 700, 24, "#16213E");
  l = addTextLayer(l, "Quote", '"Design is not just what it looks like. Design is how it works."');
  l.layers[0] = applyTextDoc(l.layers[0], { text: '"Design is not just what it looks like."', font: "Merriweather-Italic", size: 52, color: "#FFFFFF", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 540, 480);
  l = addTextLayer(l, "Author", "— Steve Jobs");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "— Steve Jobs", font: "Poppins-Regular", size: 32, color: "#7C6FFF", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 540, 620);
  const quoteIdx = l.layers.findIndex((x: any) => x.nm === "Quote");
  const authorIdx = l.layers.findIndex((x: any) => x.nm === "Author");
  const fadePreset = getAnimPreset("fade-in");
  const slidePreset = getAnimPreset("slide-up");
  if (fadePreset && quoteIdx >= 0) l = bakeAnimationIntoLayer(l, quoteIdx, fadePreset, { startFrame: 8, endFrame: 30, totalFrames: 120, compW: 1080, compH: 1080 });
  if (slidePreset && authorIdx >= 0) l = bakeAnimationIntoLayer(l, authorIdx, slidePreset, { startFrame: 25, endFrame: 45, totalFrames: 120, compW: 1080, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildKineticText(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addSolidLayer(l, "BG", "#0D0D0D", 1920, 1080);
  l = addTextLayer(l, "Word 1", "MAKE");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "MAKE", font: "Anton-Regular", size: 180, color: "#FFFFFF", align: 1, tracking: 50 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 400);
  l = addTextLayer(l, "Word 2", "IT");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "IT", font: "Anton-Regular", size: 180, color: "#FF2D78", align: 1, tracking: 50 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 580);
  l = addTextLayer(l, "Word 3", "COUNT");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "COUNT", font: "Anton-Regular", size: 180, color: "#FFFFFF", align: 1, tracking: 50 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 760);
  const w1 = l.layers.findIndex((x: any) => x.nm === "Word 1");
  const w2 = l.layers.findIndex((x: any) => x.nm === "Word 2");
  const w3 = l.layers.findIndex((x: any) => x.nm === "Word 3");
  const slideL = getAnimPreset("slide-left");
  const slideR = getAnimPreset("slide-right");
  const slideU = getAnimPreset("slide-up");
  if (slideR && w1 >= 0) l = bakeAnimationIntoLayer(l, w1, slideR, { startFrame: 0, endFrame: 20, totalFrames: 120, compW: 1920, compH: 1080 });
  if (slideL && w2 >= 0) l = bakeAnimationIntoLayer(l, w2, slideL, { startFrame: 10, endFrame: 30, totalFrames: 120, compW: 1920, compH: 1080 });
  if (slideU && w3 >= 0) l = bakeAnimationIntoLayer(l, w3, slideU, { startFrame: 20, endFrame: 40, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildGlitchTitle(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addSolidLayer(l, "BG", "#050505", 1920, 1080);
  l = addTextLayer(l, "Glitch Title", "SYSTEM ERROR");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "SYSTEM ERROR", font: "Courier New-Bold", size: 100, color: "#00FF41", align: 1, tracking: 200 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 540);
  l = addTextLayer(l, "Sub", "REBOOT REQUIRED");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "REBOOT REQUIRED", font: "Courier New-Regular", size: 36, color: "#FF0000", align: 1, tracking: 300 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 640);
  const mainIdx = l.layers.findIndex((x: any) => x.nm === "Glitch Title");
  const subIdx = l.layers.findIndex((x: any) => x.nm === "Sub");
  const glitchPreset = getAnimPreset("glitch-in");
  const fadePreset = getAnimPreset("fade-in");
  if (glitchPreset && mainIdx >= 0) l = bakeAnimationIntoLayer(l, mainIdx, glitchPreset, { startFrame: 5, endFrame: 25, totalFrames: 120, compW: 1920, compH: 1080 });
  if (fadePreset && subIdx >= 0) l = bakeAnimationIntoLayer(l, subIdx, fadePreset, { startFrame: 20, endFrame: 40, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildVerticalStory(): any {
  let l = createBlankLottie(1080, 1920, 30, 90);
  l = addSolidLayer(l, "BG", "#1A0533", 1080, 1920);
  l = addTextLayer(l, "Headline", "YOUR STORY");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "YOUR STORY", font: "Raleway-ExtraBold", size: 96, color: "#FFFFFF", align: 1, tracking: 200 });
  l.layers[0] = setLayerPos(l.layers[0], 540, 800);
  l = addTextLayer(l, "Body", "Swipe up to discover more");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "Swipe up to discover more", font: "Raleway-Regular", size: 40, color: "#D4AAFF", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 540, 920);
  const hIdx = l.layers.findIndex((x: any) => x.nm === "Headline");
  const bIdx = l.layers.findIndex((x: any) => x.nm === "Body");
  const zoomPreset = getAnimPreset("zoom-in");
  const fadePreset = getAnimPreset("fade-in");
  if (zoomPreset && hIdx >= 0) l = bakeAnimationIntoLayer(l, hIdx, zoomPreset, { startFrame: 5, endFrame: 25, totalFrames: 90, compW: 1080, compH: 1920 });
  if (fadePreset && bIdx >= 0) l = bakeAnimationIntoLayer(l, bIdx, fadePreset, { startFrame: 18, endFrame: 35, totalFrames: 90, compW: 1080, compH: 1920 });
  reindexLayers(l);
  return l;
}

function buildMinimalLowerThird(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addTextLayer(l, "Name", "JANE SMITH");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "JANE SMITH", font: "Inter-Bold", size: 52, color: "#FFFFFF", align: 0, tracking: 100 });
  l.layers[0] = setLayerPos(l.layers[0], 120, 920);
  l = addTextLayer(l, "Role", "Senior Product Designer");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "Senior Product Designer", font: "Inter-Regular", size: 30, color: "#AAAAAA", align: 0 });
  l.layers[0] = setLayerPos(l.layers[0], 120, 960);
  // Accent line shape
  l = addRoundedRect(l, "Accent Line", 60, 940, 6, 80, 3, "#7C6FFF");
  const nameIdx = l.layers.findIndex((x: any) => x.nm === "Name");
  const roleIdx = l.layers.findIndex((x: any) => x.nm === "Role");
  const slidePreset = getAnimPreset("slide-right");
  if (slidePreset && nameIdx >= 0) l = bakeAnimationIntoLayer(l, nameIdx, slidePreset, { startFrame: 5, endFrame: 22, totalFrames: 120, compW: 1920, compH: 1080 });
  if (slidePreset && roleIdx >= 0) l = bakeAnimationIntoLayer(l, roleIdx, slidePreset, { startFrame: 12, endFrame: 29, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildTypewriterCaption(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addTextLayer(l, "Caption", "Every frame tells a story...");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "Every frame tells a story...", font: "Courier New-Regular", size: 56, color: "#FFFFFF", align: 1 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 880);
  const idx = l.layers.findIndex((x: any) => x.nm === "Caption");
  const preset = getAnimPreset("typewriter");
  if (preset && idx >= 0) l = bakeAnimationIntoLayer(l, idx, preset, { startFrame: 5, endFrame: 60, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

function buildDropInTitle(): any {
  let l = createBlankLottie(1920, 1080, 30, 120);
  l = addSolidLayer(l, "BG", "#0F1923", 1920, 1080);
  l = addTextLayer(l, "Title", "IMPACT");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "IMPACT", font: "Bebas Neue-Regular", size: 200, color: "#FFFFFF", align: 1, tracking: 100 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 540);
  l = addTextLayer(l, "Sub", "MAKE YOUR MARK");
  l.layers[0] = applyTextDoc(l.layers[0], { text: "MAKE YOUR MARK", font: "Bebas Neue-Regular", size: 48, color: "#FF5722", align: 1, tracking: 400 });
  l.layers[0] = setLayerPos(l.layers[0], 960, 680);
  const titleIdx = l.layers.findIndex((x: any) => x.nm === "Title");
  const subIdx = l.layers.findIndex((x: any) => x.nm === "Sub");
  const dropPreset = getAnimPreset("drop-in");
  const fadePreset = getAnimPreset("fade-in");
  if (dropPreset && titleIdx >= 0) l = bakeAnimationIntoLayer(l, titleIdx, dropPreset, { startFrame: 5, endFrame: 35, totalFrames: 120, compW: 1920, compH: 1080 });
  if (fadePreset && subIdx >= 0) l = bakeAnimationIntoLayer(l, subIdx, fadePreset, { startFrame: 30, endFrame: 50, totalFrames: 120, compW: 1920, compH: 1080 });
  reindexLayers(l);
  return l;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export const LOTTIE_TEMPLATE_PRESETS: LottieTemplatePreset[] = [
  {
    id: "clean-lower-third",
    name: "Clean Lower Third",
    category: "lower-third",
    description: "Professional name + title lower third with slide-in animation",
    tags: ["lower-third", "name", "title", "professional", "broadcast"],
    aspectRatio: "16:9",
    build: buildCleanLowerThird,
  },
  {
    id: "minimal-lower-third",
    name: "Minimal Lower Third",
    category: "lower-third",
    description: "Clean minimal lower third with accent line",
    tags: ["lower-third", "minimal", "clean", "modern"],
    aspectRatio: "16:9",
    build: buildMinimalLowerThird,
  },
  {
    id: "neon-title",
    name: "Neon Title",
    category: "title",
    description: "Vibrant neon title card with zoom bounce entrance",
    tags: ["neon", "title", "glow", "vibrant", "music"],
    aspectRatio: "16:9",
    build: buildNeonTitle,
  },
  {
    id: "cinematic-title",
    name: "Cinematic Title",
    category: "title",
    description: "Film-style title with letterbox bars and elegant fade",
    tags: ["cinematic", "film", "elegant", "fade", "movie"],
    aspectRatio: "16:9",
    build: buildCinematicTitle,
  },
  {
    id: "minimal-caption",
    name: "Minimal Caption",
    category: "caption",
    description: "Simple caption text with slide-up entrance",
    tags: ["caption", "subtitle", "minimal", "clean"],
    aspectRatio: "16:9",
    build: buildMinimalCaption,
  },
  {
    id: "typewriter-caption",
    name: "Typewriter Caption",
    category: "caption",
    description: "Classic typewriter reveal animation",
    tags: ["typewriter", "caption", "retro", "reveal"],
    aspectRatio: "16:9",
    build: buildTypewriterCaption,
  },
  {
    id: "bold-callout",
    name: "Bold Callout",
    category: "callout",
    description: "Attention-grabbing pill callout with pop-in animation",
    tags: ["callout", "bold", "news", "alert", "pop"],
    aspectRatio: "16:9",
    build: buildBoldCallout,
  },
  {
    id: "sports-score",
    name: "Sports Score",
    category: "lower-third",
    description: "Live sports scoreboard overlay",
    tags: ["sports", "score", "broadcast", "live"],
    aspectRatio: "16:9",
    build: buildSportsScore,
  },
  {
    id: "social-quote",
    name: "Social Quote",
    category: "social",
    description: "Elegant quote card for social media",
    tags: ["quote", "social", "instagram", "card", "elegant"],
    aspectRatio: "1:1",
    build: buildSocialQuote,
  },
  {
    id: "kinetic-text",
    name: "Kinetic Text",
    category: "title",
    description: "High-energy kinetic typography with staggered slides",
    tags: ["kinetic", "bold", "energy", "motion", "typography"],
    aspectRatio: "16:9",
    build: buildKineticText,
  },
  {
    id: "glitch-title",
    name: "Glitch Title",
    category: "title",
    description: "Cyberpunk glitch effect title card",
    tags: ["glitch", "cyberpunk", "tech", "digital", "error"],
    aspectRatio: "16:9",
    build: buildGlitchTitle,
  },
  {
    id: "vertical-story",
    name: "Vertical Story",
    category: "social",
    description: "9:16 vertical story format with zoom entrance",
    tags: ["story", "vertical", "instagram", "tiktok", "reels"],
    aspectRatio: "9:16",
    build: buildVerticalStory,
  },
  {
    id: "drop-in-title",
    name: "Drop In Title",
    category: "title",
    description: "High-impact title with drop-in bounce animation",
    tags: ["bold", "impact", "drop", "bounce", "energetic"],
    aspectRatio: "16:9",
    build: buildDropInTitle,
  },
];

export function getTemplatePreset(id: string): LottieTemplatePreset | undefined {
  return LOTTIE_TEMPLATE_PRESETS.find((p) => p.id === id);
}

export function getTemplatesByCategory(category: TemplatePresetCategory): LottieTemplatePreset[] {
  return LOTTIE_TEMPLATE_PRESETS.filter((p) => p.category === category);
}

export const TEMPLATE_CATEGORIES: TemplatePresetCategory[] = ["title", "lower-third", "caption", "callout", "social", "outro"];
