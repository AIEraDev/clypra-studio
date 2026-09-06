/**
 * motionCompositor.ts — High-performance phase-aware 2D compositor.
 * Handles the Intro-Hold-Outro lifecycle, keyframe interpolation, and multi-layer rendering.
 */

import type {
  MotionGraphicTemplate,
  MotionLayer,
  PhaseTiming,
  MotionPhase,
  EasingType,
  KeyframeTrack,
  TextLayerProps,
  VectorBurstLayerProps,
  LightningArcsLayerProps,
  FireStreaksLayerProps,
  StarsLayerProps,
  GlowAuraLayerProps,
} from "../types";
import {
  generateComicBurstPoints,
  drawComicBurst,
  generateLightningArc,
  drawLightning,
  drawFireSwoosh,
  drawStar,
} from "./proceduralVfx";

// ── Easing Functions ───────────────────────────────────────────────────────

export function evaluateEasing(t: number, easing: EasingType = "linear"): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case "linear":
      return clamped;
    case "easeIn":
      return clamped * clamped * clamped;
    case "easeOut":
      return 1 - Math.pow(1 - clamped, 3);
    case "easeInOut":
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case "easeOutBack": {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
    }
    case "easeInBack": {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * clamped * clamped * clamped - c1 * clamped * clamped;
    }
    case "spring": {
      return 1 - Math.exp(-6 * clamped) * Math.cos(10 * clamped);
    }
    default:
      return clamped;
  }
}

export function interpolateTrack(
  track: KeyframeTrack<number> | undefined,
  time: number,
  defaultValue = 0,
): number {
  if (!track || track.keyframes.length === 0) return defaultValue;
  const kfs = track.keyframes;
  if (time <= kfs[0]!.time) return kfs[0]!.value;
  if (time >= kfs[kfs.length - 1]!.time) return kfs[kfs.length - 1]!.value;

  for (let i = 0; i < kfs.length - 1; i++) {
    const kfA = kfs[i]!;
    const kfB = kfs[i + 1]!;
    if (time >= kfA.time && time <= kfB.time) {
      const segmentDuration = kfB.time - kfA.time;
      const t = segmentDuration > 0 ? (time - kfA.time) / segmentDuration : 1;
      const easedT = evaluateEasing(t, kfB.easing ?? "linear");
      return kfA.value + (kfB.value - kfA.value) * easedT;
    }
  }

  return defaultValue;
}

// ── Phase Evaluation ───────────────────────────────────────────────────────

export interface PhaseInfo {
  phase: MotionPhase;
  localTime: number;
  progress: number;
  totalDuration: number;
  introEnd: number;
  holdEnd: number;
}

export function evaluatePhase(time: number, timing: PhaseTiming): PhaseInfo {
  const introEnd = timing.introDuration;
  const holdEnd = introEnd + timing.holdDuration;
  const totalDuration = holdEnd + timing.outroDuration;

  const t = Math.max(0, Math.min(time, totalDuration));

  if (t < introEnd) {
    const progress = introEnd > 0 ? Math.max(0, Math.min(1, t / introEnd)) : 1;
    return { phase: "intro", localTime: t, progress, totalDuration, introEnd, holdEnd };
  }
  if (t < holdEnd) {
    const localTime = t - introEnd;
    const progress = timing.holdDuration > 0 ? Math.max(0, Math.min(1, localTime / timing.holdDuration)) : 1;
    return { phase: "hold", localTime, progress, totalDuration, introEnd, holdEnd };
  }

  const localTime = t - holdEnd;
  const progress = timing.outroDuration > 0 ? Math.max(0, Math.min(1, localTime / timing.outroDuration)) : 1;
  return { phase: "outro", localTime, progress, totalDuration, introEnd, holdEnd };
}

// ── Layer Rendering ────────────────────────────────────────────────────────

export interface RenderContext {
  width: number;
  height: number;
  time: number;
  phaseInfo: PhaseInfo;
  textBounds: { width: number; height: number };
}

interface ActiveGlyph {
  char: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  ghostOffset: number;
  width: number;
}

function applyGlyphTransform(
  ctx: CanvasRenderingContext2D,
  g: ActiveGlyph,
  offsetY: number = 0,
) {
  ctx.translate(g.x, g.y + offsetY);
  if (g.rotation !== 0) {
    ctx.rotate((g.rotation * Math.PI) / 180);
  }
  if (g.scale !== 1.0) {
    ctx.scale(g.scale, g.scale);
  }
  ctx.globalAlpha = (ctx.globalAlpha || 1.0) * g.opacity;
}

function renderTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayerProps, rc: RenderContext) {
  const { config } = layer;
  const text = config.text || "";
  if (!text) return;

  const fontFam = config.fontFamily || "Inter";
  ctx.font = `${config.fontStyle || "normal"} ${config.fontWeight || 800} ${config.fontSize}px ${fontFam}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.save();
  // Apply optional horizontal shear (italic slant) and condensation
  if (config.skewX) {
    ctx.transform(1, 0, config.skewX, 1, 0, 0);
  }
  if (config.condenseX) {
    ctx.scale(config.condenseX, 1.0);
  }

  // Calculate layout coordinates for all glyphs
  const chars = Array.from(text);
  const metrics = chars.map((c) => ctx.measureText(c).width);
  const tracking = config.tracking || 0;
  const totalWidth = metrics.reduce((sum, w) => sum + w, 0) + (chars.length - 1) * tracking;

  let currentX = -totalWidth / 2;
  const stagger = config.staggerDelay ?? 0.07;
  const dropDist = config.entranceDistance ?? 130;
  const waveSpeed = config.idleWaveSpeed ?? 3.2;
  const waveAmp = config.idleWaveAmplitude ?? 8;

  const glyphs: ActiveGlyph[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    const charW = metrics[i]!;
    const charCenterX = currentX + charW / 2;
    currentX += charW + tracking;

    let charY = 0;
    let charScale = 1.0;
    let charRotation = 0;
    let charOpacity = 1.0;
    let ghostOffset = 0;

    if (!config.perCharacter) {
      glyphs.push({
        char,
        x: charCenterX,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        ghostOffset: 0,
        width: charW,
      });
      continue;
    }

    if (rc.phaseInfo.phase === "intro") {
      const charStartTime = i * stagger;
      const charTime = rc.time - charStartTime;
      if (charTime <= 0) {
        continue;
      }
      const charProgress = Math.min(1, charTime / 0.35);
      const eased = evaluateEasing(charProgress, "easeOutBack");

      charY = -dropDist * (1 - Math.min(1.2, eased));
      charScale = 0.5 + 0.5 * Math.min(1.2, eased);
      charOpacity = Math.min(1, charProgress * 2.5);

      if (config.ghostTrail && charProgress > 0.08 && charProgress < 0.85) {
        ghostOffset = -dropDist * 0.35 * (1 - charProgress);
      }
    } else if (rc.phaseInfo.phase === "hold") {
      if (config.idleWave) {
        charY = Math.sin(rc.time * waveSpeed + i * 0.75) * waveAmp;
        charRotation = Math.sin(rc.time * waveSpeed * 0.7 + i * 0.5) * 1.5;
      }
    } else if (rc.phaseInfo.phase === "outro") {
      const p = rc.phaseInfo.progress;
      charScale = Math.max(0, 1 - p);
      charOpacity = Math.max(0, 1 - p);
    }

    if (charOpacity > 0.001) {
      glyphs.push({
        char,
        x: charCenterX,
        y: charY,
        scale: charScale,
        rotation: charRotation,
        opacity: charOpacity,
        ghostOffset,
        width: charW,
      });
    }
  }

  if (glyphs.length === 0) {
    ctx.restore();
    return;
  }

  // ── Global Multi-Pass Text Compositing ────────────────────────────────────

  // Pass 0: Atmospheric Cloud Glow / Aura
  if (config.cloudHalo) {
    ctx.save();
    ctx.shadowColor = config.cloudHaloColor || "rgba(255, 255, 255, 0.95)";
    ctx.shadowBlur = config.cloudHaloRadius || 55;
    ctx.strokeStyle = config.cloudHaloColor || "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = (config.strokeWidth || 44) + (config.cloudOuterStrokeWidth || 22) * 2 + 16;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.strokeText(g.char, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 0.5: Traditional Drop Shadow (only when explicitly configured)
  if (config.shadowBlur && config.shadowColor) {
    ctx.save();
    ctx.shadowColor = config.shadowColor;
    ctx.shadowBlur = config.shadowBlur;
    ctx.shadowOffsetY = config.shadowOffsetY || 4;
    ctx.fillStyle = config.shadowColor;
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.fillText(g.char, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 0.7: Outer Glow
  if (config.glowRadius && config.glowColor) {
    ctx.save();
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = config.glowRadius;
    ctx.strokeStyle = config.glowColor;
    ctx.lineWidth = (config.strokeWidth || 4) + 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.strokeText(g.char, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 1: Continuous Outer White Contour Border
  if (config.cloudOuterStrokeWidth && config.cloudOuterStrokeColor) {
    ctx.save();
    ctx.strokeStyle = config.cloudOuterStrokeColor;
    ctx.lineWidth = (config.strokeWidth || 44) + config.cloudOuterStrokeWidth * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.strokeText(g.char, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 1.5: Secondary Rim Outer Stroke
  if (config.outerStrokeWidth && config.outerStrokeColor) {
    ctx.save();
    ctx.strokeStyle = config.outerStrokeColor;
    ctx.lineWidth = (config.strokeWidth || 4) + config.outerStrokeWidth * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.strokeText(g.char, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 2: Chunky Solid Black Comic Card Backing
  if (config.strokeWidth > 0) {
    ctx.save();
    ctx.strokeStyle = config.strokeColor;
    ctx.lineWidth = config.strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const g of glyphs) {
      ctx.save();
      applyGlyphTransform(ctx, g);
      ctx.strokeText(g.char, 0, 0);

      // Solid black counter fill to eliminate unwanted white rings inside letters like O, D, 0
      if (config.fillCounters && (g.char === "O" || g.char === "D" || g.char === "0")) {
        ctx.fillStyle = config.strokeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, g.width * 0.28, config.fontSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Pass 3: Ghost Motion Echo Trails
  if (config.ghostTrail) {
    for (const g of glyphs) {
      if (g.ghostOffset !== 0) {
        ctx.save();
        applyGlyphTransform(ctx, g, g.ghostOffset);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillText(g.char, 0, 0);
        ctx.restore();
      }
    }
  }

  // Pass 4: 3D Puffy Marshmallow Letter Faces
  for (const g of glyphs) {
    ctx.save();
    applyGlyphTransform(ctx, g);

    if (config.puffyBevel) {
      // 3D puffy pillow gradient: top 62% pure white, bottom 38% soft cloud shading
      const grad = ctx.createLinearGradient(0, -config.fontSize * 0.45, 0, config.fontSize * 0.45);
      grad.addColorStop(0, config.fill || "#ffffff");
      grad.addColorStop(0.62, config.fill || "#ffffff");
      grad.addColorStop(1, config.puffyBevelColor || "#cbd2df");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.fill;
    }

    ctx.fillText(g.char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function renderVectorBurst(
  ctx: CanvasRenderingContext2D,
  layer: VectorBurstLayerProps,
  rc: RenderContext,
) {
  const { config } = layer;
  const radiusX = (rc.textBounds.width / 2 + config.paddingX) * (layer.transform.scaleX || 1);
  const radiusY = (rc.textBounds.height / 2 + config.paddingY) * (layer.transform.scaleY || 1);

  const burstPoints = generateComicBurstPoints(
    0,
    0,
    radiusX,
    radiusY,
    config.points,
    config.innerRadiusRatio,
    config.jitter,
    42,
  );

  drawComicBurst(
    ctx,
    burstPoints,
    config.fillColor,
    config.strokeColor,
    config.strokeWidth,
    config.glowColor,
    config.glowRadius,
  );
}

function renderLightningArcs(
  ctx: CanvasRenderingContext2D,
  layer: LightningArcsLayerProps,
  rc: RenderContext,
) {
  const { config } = layer;
  const t = rc.time;

  // Active sweep during intro, intermittent energy in hold
  const count = config.count || 4;
  for (let i = 0; i < count; i++) {
    const sweepOffset = (i / count) * Math.PI * 2;
    const sweepT = (t * config.speed + sweepOffset) % 1;

    // Sweeping across width
    const startX = -rc.width * 0.6 + sweepT * rc.width * 1.2;
    const startY = -rc.height * 0.2 + Math.sin(t * 8 + i) * 80;
    const endX = startX + 180 + Math.cos(t * 10 + i) * 60;
    const endY = startY + (i % 2 === 0 ? 90 : -90) + Math.sin(t * 12 + i) * 40;

    const seed = Math.floor(t * 24) * 100 + i * 17;
    const segments = generateLightningArc(
      { x: startX, y: startY },
      { x: endX, y: endY },
      4,
      config.roughness,
      config.branchChance,
      seed,
    );

    drawLightning(ctx, segments, config.color, config.coreColor, config.glowRadius);
  }
}

function renderFireStreaks(
  ctx: CanvasRenderingContext2D,
  layer: FireStreaksLayerProps,
  rc: RenderContext,
) {
  const { config } = layer;
  const t = rc.time;
  const count = config.count || 3;

  for (let i = 0; i < count; i++) {
    const angleRad = ((config.angle || -15) * Math.PI) / 180;
    const sweep = ((t * 2 + i * 0.3) % 1) * 2 - 1;

    const startX = -rc.width * 0.5 + sweep * rc.width * 0.8;
    const startY = Math.sin(t * 6 + i) * 60;
    const endX = startX + Math.cos(angleRad) * 240;
    const endY = startY + Math.sin(angleRad) * 120;

    const c1X = startX + 80;
    const c1Y = startY - 40;
    const c2X = endX - 80;
    const c2Y = endY + 40;

    const opacity = Math.sin(((t * 2 + i * 0.3) % 1) * Math.PI);
    drawFireSwoosh(
      ctx,
      startX,
      startY,
      endX,
      endY,
      c1X,
      c1Y,
      c2X,
      c2Y,
      config.primaryColor,
      config.secondaryColor,
      32,
      opacity * config.intensity,
    );
  }
}

function renderStars(
  ctx: CanvasRenderingContext2D,
  layer: StarsLayerProps,
  rc: RenderContext,
) {
  const { config } = layer;
  const t = rc.time;
  const count = config.count || 8;
  const spread = config.spreadRadius || 260;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 2 === 0 ? 0.3 : -0.2);
    const dist = spread * (0.8 + (i % 3) * 0.15);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * (dist * 0.55);

    const pulse = 0.8 + Math.sin(t * config.pulseSpeed + i) * 0.25;
    const size = config.maxSize * pulse;

    drawStar(ctx, x, y, size, size * 0.45, config.color, "#000000", 2);
  }
}

function renderGlowAura(
  ctx: CanvasRenderingContext2D,
  layer: GlowAuraLayerProps,
  rc: RenderContext,
) {
  const { config } = layer;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, config.radius);
  gradient.addColorStop(0, config.color);
  gradient.addColorStop(0.5, config.color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.globalAlpha = config.intensity;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, config.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Main Composite Function ────────────────────────────────────────────────

export function renderMotionTemplate(
  ctx: CanvasRenderingContext2D,
  template: MotionGraphicTemplate,
  time: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const phaseInfo = evaluatePhase(time, template.phaseTiming);

  // Clear canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  // Measure text layer first so dependent layers (comic burst) can size themselves
  const textLayer = template.layers.find((l) => l.type === "text") as TextLayerProps | undefined;
  let textBounds = { width: 400, height: 160 };

  if (textLayer) {
    ctx.font = `${textLayer.config.fontStyle || "normal"} ${textLayer.config.fontWeight || 800} ${textLayer.config.fontSize}px "${textLayer.config.fontFamily || "Inter"}", sans-serif`;
    const metrics = ctx.measureText(textLayer.config.text || "");
    textBounds = {
      width: Math.max(120, metrics.width),
      height: Math.max(60, textLayer.config.fontSize * 1.15),
    };
  }

  const renderContext: RenderContext = {
    width: viewportWidth,
    height: viewportHeight,
    time,
    phaseInfo,
    textBounds,
  };

  // Center coordinate space (0, 0 is center of canvas)
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  for (const layer of template.layers) {
    if (!layer.visible) continue;

    // Filter by phaseScope
    if (layer.phaseScope === "intro-only" && phaseInfo.phase !== "intro") continue;
    if (layer.phaseScope === "hold-only" && phaseInfo.phase !== "hold") continue;
    if (layer.phaseScope === "outro-only" && phaseInfo.phase !== "outro") continue;

    // Compute animated transforms via keyframe tracks or base transforms
    const posX = interpolateTrack(layer.tracks?.["transform.x"], time, layer.transform.x);
    const posY = interpolateTrack(layer.tracks?.["transform.y"], time, layer.transform.y);
    let scaleX = interpolateTrack(layer.tracks?.["transform.scaleX"], time, layer.transform.scaleX);
    let scaleY = interpolateTrack(layer.tracks?.["transform.scaleY"], time, layer.transform.scaleY);
    let rotation = interpolateTrack(layer.tracks?.["transform.rotation"], time, layer.transform.rotation);
    let opacity = interpolateTrack(layer.tracks?.["transform.opacity"], time, layer.transform.opacity);

    // Apply Phase Lifecycles:
    // If no explicit tracks exist, provide built-in entrance overshoot & exit
    if (!layer.tracks?.["transform.scaleX"] && phaseInfo.phase === "intro") {
      const introEased = evaluateEasing(phaseInfo.progress, "easeOutBack");
      scaleX *= introEased;
      scaleY *= introEased;
    } else if (phaseInfo.phase === "hold") {
      // Subtle idle breathing
      const idlePulse = 1.0 + Math.sin(phaseInfo.progress * Math.PI * 4) * 0.015;
      scaleX *= idlePulse;
      scaleY *= idlePulse;
    } else if (phaseInfo.phase === "outro") {
      const outroEased = 1 - evaluateEasing(phaseInfo.progress, "easeInBack");
      scaleX *= Math.max(0, outroEased);
      scaleY *= Math.max(0, outroEased);
      opacity *= Math.max(0, 1 - phaseInfo.progress);
    }

    if (opacity <= 0.001) continue;

    ctx.save();
    ctx.translate(centerX + posX, centerY + posY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.globalCompositeOperation = layer.blendMode || "source-over";

    switch (layer.type) {
      case "glow-aura":
        renderGlowAura(ctx, layer, renderContext);
        break;
      case "vector-burst":
        renderVectorBurst(ctx, layer, renderContext);
        break;
      case "stars":
        renderStars(ctx, layer, renderContext);
        break;
      case "fire-streaks":
        renderFireStreaks(ctx, layer, renderContext);
        break;
      case "lightning-arcs":
        renderLightningArcs(ctx, layer, renderContext);
        break;
      case "text":
        renderTextLayer(ctx, layer, renderContext);
        break;
    }

    ctx.restore();
  }

  ctx.restore();
}
