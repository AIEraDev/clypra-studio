import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Aperture,
  BarChart3,
  Download,
  Gauge,
  Link,
  MonitorPlay,
  Palette,
  Pause,
  Play,
  RefreshCcw,
  SlidersHorizontal,
  Upload,
  Wand2,
  Maximize2,
} from "lucide-react";
import { Container, Filter, Graphics, Sprite, Texture } from "pixi.js";
import { usePixiRenderer } from "../transition/hooks/usePixiRenderer";
import { CanvasPreview } from "./components/CanvasPreview";

type FitMode = "contain" | "cover" | "stretch";

interface VideoPreset {
  id: string;
  name: string;
  src: string;
  description: string;
  label: string;
}

interface LabSettings {
  exposure: number;
  contrast: number;
  saturation: number;
  hue: number;
  warmth: number;
  vignette: number;
  grain: number;
  blur: number;
  sharpen: number;
  scanlines: number;
  chromaShift: number;
  motionTrail: number;
  matteGuide: number;
  splitView: number;
}

interface EffectPreset {
  id: string;
  name: string;
  description: string;
  settings: LabSettings;
  colorState: ColorWheelState;
}

interface MetricState {
  fps: number;
  latencyMs: number;
  decodedFrames: number;
  droppedFrames: number;
  luma: string;
  resolution: string;
}

interface ColorWheelState {
  lift: [number, number, number];
  gamma: [number, number, number];
  gain: [number, number, number];
  sat: number;
  exposure: number;
}

interface ScopeState {
  rPath: string;
  gPath: string;
  bPath: string;
  lPath: string;
  waveformPoints: string;
  vectorscopePoints: Array<{ x: number; y: number; color: string }>;
  avgRgb: [number, number, number];
  status: "active" | "blocked" | "pending";
}

type ValidationEffectId = "video.spatial-ripple" | "body.matte-composite";
type ActiveValidationEffectId = ValidationEffectId | null;
type ActiveEffectPresetId = string | "custom" | null;

interface ValidationEffect {
  id: ValidationEffectId;
  name: string;
  category: "video" | "body";
  description: string;
}

interface ValidationProbe {
  id: ActiveValidationEffectId;
  structuralSamples: number;
  matteCoverage: number;
}

interface ValidationState extends ValidationProbe {
  status: "pass" | "warn" | "pending";
  message: string;
}

type GpuMode = "loading" | "active" | "fallback";

interface PixiSceneRefs {
  root: Container;
  videoSprite: Sprite;
  unfilteredSprite: Sprite;
  maskGraphics: Graphics;
  overlay: Graphics;
  filter: Filter;
  lastOverlayKey: string;
  lastRenderAt: number;
}

interface ColorWheelProps {
  label: string;
  value: [number, number, number];
  onChange: (nextValue: [number, number, number]) => void;
  size?: number;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ label, value, onChange, size = 140 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleX = (value[0] - value[2]) * (size / 2 - 10);
  const handleY = (value[1] - (value[0] + value[2]) / 2) * (size / 2 - 10);

  const updateVector = useCallback(
    (event: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const radius = size / 2;
      const cx = rect.left + radius;
      const cy = rect.top + radius;
      let dx = (event.clientX - cx) / radius;
      let dy = (event.clientY - cy) / radius;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        dx /= dist;
        dy /= dist;
      }

      const r = Math.max(-1, Math.min(1, dx * 0.5 + 0.5));
      const g = Math.max(-1, Math.min(1, -dy * 0.5 + 0.5));
      const b = Math.max(-1, Math.min(1, -dx * 0.5 + 0.5));
      onChange([Number(r.toFixed(2)), Number(g.toFixed(2)), Number(b.toFixed(2))]);
    },
    [onChange, size],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateVector(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) updateVector(event);
  };

  return (
    <div className="flex select-none flex-col items-center">
      <span className="mb-2 text-[11px] font-semibold uppercase text-slate-400">{label}</span>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        className="relative rounded-full border-2 border-slate-700 bg-slate-950 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]"
        style={{
          width: size,
          height: size,
          cursor: isDragging ? "grabbing" : "crosshair",
        }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: 4,
            background: "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
            opacity: 0.18,
          }}
        />
        <span className="pointer-events-none absolute left-2 right-2 top-1/2 h-px bg-slate-700" />
        <span className="pointer-events-none absolute bottom-2 top-2 left-1/2 w-px bg-slate-700" />
        <span
          className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
          style={{
            left: size / 2 + handleX - 6,
            top: size / 2 + handleY - 6,
          }}
        />
      </div>
      <span className="mt-1.5 font-mono text-[10px] text-slate-500">
        R:{value[0].toFixed(2)} G:{value[1].toFixed(2)} B:{value[2].toFixed(2)}
      </span>
    </div>
  );
};

const BASE_SETTINGS: LabSettings = {
  exposure: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  warmth: 0,
  vignette: 0,
  grain: 0,
  blur: 0,
  sharpen: 0,
  scanlines: 0,
  chromaShift: 0,
  motionTrail: 0,
  matteGuide: 0,
  splitView: 0,
};

const BASE_COLOR_STATE: ColorWheelState = {
  lift: [0, 0, 0],
  gamma: [1, 1, 1],
  gain: [1, 1, 1],
  sat: 1,
  exposure: 0,
};

const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "flower",
    name: "Macro Flower",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    description: "Organic motion, saturated color, fine detail.",
    label: "CC0 WebM",
  },
  {
    id: "flower-mp4",
    name: "Macro Flower MP4",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    description: "Same scene through an H.264-style playback path.",
    label: "MP4",
  },
  {
    id: "bbb",
    name: "Motion Trailer",
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    description: "Fast camera motion and illustrated edges.",
    label: "720p MP4",
  },
  {
    id: "blazes",
    name: "Human Action",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Real-world action footage for body-effect validation.",
    label: "Sample MP4",
  },
];

const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "baseline",
    name: "Baseline",
    description: "Unmodified source with live decode metrics.",
    settings: BASE_SETTINGS,
    colorState: BASE_COLOR_STATE,
  },
  {
    id: "grade",
    name: "Color Grade",
    description: "CDL lift/gamma/gain plus Rec.709 saturation and exposure.",
    settings: {
      ...BASE_SETTINGS,
      contrast: 108,
      warmth: 18,
      vignette: 18,
      splitView: 50,
    },
    colorState: {
      lift: [0.02, 0.01, -0.01],
      gamma: [1.02, 1, 0.96],
      gain: [1.08, 1.04, 0.98],
      sat: 1.18,
      exposure: 0.18,
    },
  },
  {
    id: "glitch",
    name: "Glitch Stress",
    description: "Channel offset, scanlines, grain, and hue rotation.",
    settings: {
      ...BASE_SETTINGS,
      contrast: 112,
      saturation: 150,
      hue: 24,
      grain: 18,
      scanlines: 26,
      chromaShift: 12,
      splitView: 50,
    },
    colorState: {
      lift: [0, 0, 0.03],
      gamma: [0.92, 1, 1.08],
      gain: [1.14, 0.96, 1.18],
      sat: 1.42,
      exposure: 0.04,
    },
  },
  {
    id: "soft-mask",
    name: "Matte Review",
    description: "Subject guide, defocus, and vignette overlay checks.",
    settings: {
      ...BASE_SETTINGS,
      exposure: 102,
      saturation: 112,
      blur: 1.5,
      vignette: 36,
      matteGuide: 72,
      splitView: 50,
    },
    colorState: {
      lift: [0.01, 0.01, 0.02],
      gamma: [1, 1.02, 1.04],
      gain: [1.02, 1.02, 1],
      sat: 1.08,
      exposure: 0.08,
    },
  },
  {
    id: "temporal",
    name: "Temporal Trail",
    description: "Motion persistence preset for playback stability testing.",
    settings: {
      ...BASE_SETTINGS,
      contrast: 108,
      saturation: 120,
      motionTrail: 55,
      chromaShift: 6,
      grain: 8,
    },
    colorState: {
      lift: [0, 0, 0],
      gamma: [1, 1, 1],
      gain: [1.03, 1.04, 1.06],
      sat: 1.12,
      exposure: 0,
    },
  },
];

const SLIDERS: Array<{
  key: keyof LabSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = [
  { key: "contrast", label: "Contrast", min: 40, max: 180, step: 1, unit: "%" },
  { key: "warmth", label: "Warmth", min: -60, max: 60, step: 1 },
  { key: "vignette", label: "Vignette", min: 0, max: 100, step: 1, unit: "%" },
  { key: "grain", label: "Grain", min: 0, max: 50, step: 1, unit: "%" },
  { key: "blur", label: "Defocus", min: 0, max: 8, step: 0.1, unit: "px" },
  { key: "scanlines", label: "Scanlines", min: 0, max: 60, step: 1, unit: "%" },
  { key: "chromaShift", label: "Chroma Shift", min: 0, max: 28, step: 1, unit: "px" },
  { key: "motionTrail", label: "Motion Trail", min: 0, max: 80, step: 1, unit: "%" },
  { key: "matteGuide", label: "Matte Guide", min: 0, max: 100, step: 1, unit: "%" },
  { key: "splitView", label: "A/B Split", min: 0, max: 100, step: 1, unit: "%" },
];

const emptyScopeState = (): ScopeState => ({
  rPath: "",
  gPath: "",
  bPath: "",
  lPath: "",
  waveformPoints: "",
  vectorscopePoints: [],
  avgRgb: [0, 0, 0],
  status: "pending",
});

const VALIDATION_EFFECTS: ValidationEffect[] = [
  {
    id: "video.spatial-ripple",
    name: "Spatial Ripple Warp",
    category: "video",
    description: "Geometric UV-style row displacement that remaps video pixels over time.",
  },
  {
    id: "body.matte-composite",
    name: "Body Matte Composite",
    category: "body",
    description: "Alpha matte composite: blurred background, preserved subject, visible matte edge.",
  },
];

const pendingValidationState = (id: ActiveValidationEffectId): ValidationState => ({
  id,
  structuralSamples: 0,
  matteCoverage: 0,
  status: "pending",
  message: id ? "Waiting for a decoded frame." : "No validation effect selected.",
});

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
};

const formatSetting = (value: number, unit = "") => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
};

const getObjectFitRect = (srcW: number, srcH: number, dstW: number, dstH: number, mode: FitMode) => {
  if (mode === "stretch") {
    return { x: 0, y: 0, width: dstW, height: dstH };
  }

  const scaleX = dstW / srcW;
  const scaleY = dstH / srcH;
  const scale = mode === "contain" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  const width = srcW * scale;
  const height = srcH * scale;

  return {
    x: (dstW - width) / 2,
    y: (dstH - height) / 2,
    width,
    height,
  };
};

const getVideoQuality = (video: HTMLVideoElement) => {
  const quality = "getVideoPlaybackQuality" in video
    ? video.getVideoPlaybackQuality()
    : null;

  return {
    decodedFrames: quality?.totalVideoFrames ?? 0,
    droppedFrames: quality?.droppedVideoFrames ?? 0,
  };
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const applyCdlToRegion = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colorState: ColorWheelState,
) => {
  const regionWidth = Math.max(1, Math.floor(width));
  const regionHeight = Math.max(1, Math.floor(height));
  const image = ctx.getImageData(Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), regionWidth, regionHeight);
  const data = image.data;
  const exposure = Math.pow(2, colorState.exposure);
  const lift = colorState.lift;
  const gamma = colorState.gamma.map((value) => Math.max(0.1, value)) as [number, number, number];
  const gain = colorState.gain;

  for (let i = 0; i < data.length; i += 4) {
    let r = (data[i] / 255) * exposure;
    let g = (data[i + 1] / 255) * exposure;
    let b = (data[i + 2] / 255) * exposure;

    r = clamp01((r + lift[0] * (1 - r)) * gain[0]);
    g = clamp01((g + lift[1] * (1 - g)) * gain[1]);
    b = clamp01((b + lift[2] * (1 - b)) * gain[2]);

    r = Math.pow(r, 1 / gamma[0]);
    g = Math.pow(g, 1 / gamma[1]);
    b = Math.pow(b, 1 / gamma[2]);

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = clamp01(luma + (r - luma) * colorState.sat);
    g = clamp01(luma + (g - luma) * colorState.sat);
    b = clamp01(luma + (b - luma) * colorState.sat);

    data[i] = Math.round(r * 255);
    data[i + 1] = Math.round(g * 255);
    data[i + 2] = Math.round(b * 255);
  }

  ctx.putImageData(image, Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)));
};

const buildHistogramPath = (bins: number[], width = 256, height = 72) => {
  const max = Math.max(1, ...bins);
  let path = `M 0 ${height}`;
  for (let i = 0; i < bins.length; i += 1) {
    const x = (i / (bins.length - 1)) * width;
    const y = height - (bins[i] / max) * height * 0.94;
    path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${path} L ${width} ${height} Z`;
};

const analyzeCanvasScopes = (sourceCanvas: HTMLCanvasElement, helperCanvas: HTMLCanvasElement): ScopeState => {
  const width = 160;
  const height = 90;
  helperCanvas.width = width;
  helperCanvas.height = height;

  const helperCtx = helperCanvas.getContext("2d");
  if (!helperCtx) return emptyScopeState();

  helperCtx.drawImage(sourceCanvas, 0, 0, width, height);
  const image = helperCtx.getImageData(0, 0, width, height);
  const data = image.data;
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const l = new Array(256).fill(0);
  const waveform = new Array(64).fill(0);
  const waveformCount = new Array(64).fill(0);
  const vectorscopePoints: ScopeState["vectorscopePoints"] = [];
  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const rv = data[index];
      const gv = data[index + 1];
      const bv = data[index + 2];
      const lv = Math.round(0.2126 * rv + 0.7152 * gv + 0.0722 * bv);
      const waveIndex = Math.min(63, Math.floor((x / width) * 64));

      r[rv] += 1;
      g[gv] += 1;
      b[bv] += 1;
      l[lv] += 1;
      waveform[waveIndex] += lv;
      waveformCount[waveIndex] += 1;
      rTotal += rv;
      gTotal += gv;
      bTotal += bv;
      count += 1;

      if (x % 12 === 0 && y % 10 === 0) {
        const cb = bv - lv;
        const cr = rv - lv;
        vectorscopePoints.push({
          x: 50 + cr * 0.22,
          y: 50 - cb * 0.22,
          color: `rgb(${rv}, ${gv}, ${bv})`,
        });
      }
    }
  }

  const waveformPoints = waveform
    .map((sum, index) => {
      const avg = sum / Math.max(1, waveformCount[index]);
      const x = (index / 63) * 100;
      const y = 100 - (avg / 255) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return {
    rPath: buildHistogramPath(r),
    gPath: buildHistogramPath(g),
    bPath: buildHistogramPath(b),
    lPath: buildHistogramPath(l),
    waveformPoints,
    vectorscopePoints,
    avgRgb: [
      Math.round(rTotal / Math.max(1, count)),
      Math.round(gTotal / Math.max(1, count)),
      Math.round(bTotal / Math.max(1, count)),
    ],
    status: "active",
  };
};

const drawHumanSilhouettePath = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
) => {
  ctx.beginPath();
  ctx.arc(cx, cy - 80 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.moveTo(cx - 6 * scale, cy - 56 * scale);
  ctx.lineTo(cx - 6 * scale, cy - 48 * scale);
  ctx.lineTo(cx + 6 * scale, cy - 48 * scale);
  ctx.lineTo(cx + 6 * scale, cy - 56 * scale);
  ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
  ctx.lineTo(cx + 45 * scale, cy - 48 * scale);
  ctx.lineTo(cx + 35 * scale, cy + 50 * scale);
  ctx.lineTo(cx - 35 * scale, cy + 50 * scale);
  ctx.closePath();
  ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
  ctx.lineTo(cx - 75 * scale, cy + 20 * scale);
  ctx.lineTo(cx - 65 * scale, cy + 80 * scale);
  ctx.lineTo(cx - 52 * scale, cy + 80 * scale);
  ctx.lineTo(cx - 60 * scale, cy + 25 * scale);
  ctx.lineTo(cx - 35 * scale, cy - 20 * scale);
  ctx.moveTo(cx + 45 * scale, cy - 48 * scale);
  ctx.lineTo(cx + 75 * scale, cy + 20 * scale);
  ctx.lineTo(cx + 65 * scale, cy + 80 * scale);
  ctx.lineTo(cx + 52 * scale, cy + 80 * scale);
  ctx.lineTo(cx + 60 * scale, cy + 25 * scale);
  ctx.lineTo(cx + 35 * scale, cy - 20 * scale);
  ctx.moveTo(cx - 30 * scale, cy + 50 * scale);
  ctx.lineTo(cx - 35 * scale, cy + 130 * scale);
  ctx.lineTo(cx - 40 * scale, cy + 220 * scale);
  ctx.lineTo(cx - 20 * scale, cy + 220 * scale);
  ctx.lineTo(cx - 18 * scale, cy + 130 * scale);
  ctx.lineTo(cx - 5 * scale, cy + 50 * scale);
  ctx.moveTo(cx + 30 * scale, cy + 50 * scale);
  ctx.lineTo(cx + 35 * scale, cy + 130 * scale);
  ctx.lineTo(cx + 40 * scale, cy + 220 * scale);
  ctx.lineTo(cx + 20 * scale, cy + 220 * scale);
  ctx.lineTo(cx + 18 * scale, cy + 130 * scale);
  ctx.lineTo(cx + 5 * scale, cy + 50 * scale);
};

const applySpatialRippleWarp = (
  ctx: CanvasRenderingContext2D,
  clipStart: number,
  width: number,
  height: number,
  time: number,
  bufferCanvas: HTMLCanvasElement,
): number => {
  const x = Math.max(0, Math.floor(clipStart));
  const regionWidth = Math.max(1, Math.floor(width - clipStart));
  const bufferCtx = bufferCanvas.getContext("2d");
  if (!bufferCtx) return 0;

  if (bufferCanvas.width !== regionWidth) bufferCanvas.width = regionWidth;
  if (bufferCanvas.height !== height) bufferCanvas.height = height;
  bufferCtx.clearRect(0, 0, regionWidth, height);
  bufferCtx.drawImage(ctx.canvas, x, 0, regionWidth, height, 0, 0, regionWidth, height);

  let displacedRows = 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, regionWidth, height);
  ctx.clip();
  ctx.drawImage(bufferCanvas, 0, 0, regionWidth, height, x, 0, regionWidth, height);

  const rowStep = 6;
  for (let y = 0; y < height; y += rowStep) {
    const normalizedY = y / height;
    const waveA = Math.sin(normalizedY * Math.PI * 8 + time * 3.2);
    const waveB = Math.sin(normalizedY * Math.PI * 3 - time * 1.8);
    const offset = Math.round((waveA * 14 + waveB * 7) * Math.sin(time * 0.7 + 1.2));
    if (Math.abs(offset) > 1) displacedRows += 1;
    ctx.drawImage(bufferCanvas, 0, y, regionWidth, rowStep + 1, x + offset, y, regionWidth, rowStep + 1);
  }

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 1;
  for (let y = 24; y < height; y += 64) {
    const offset = Math.sin((y / height) * Math.PI * 8 + time * 3.2) * 14;
    if (Math.abs(offset) > 4) {
      ctx.beginPath();
      ctx.moveTo(x + Math.max(0, offset), y);
      ctx.lineTo(x + regionWidth + Math.min(0, offset), y + offset * 0.18);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  return displacedRows;
};

const applyBodyMatteComposite = (
  ctx: CanvasRenderingContext2D,
  clipStart: number,
  width: number,
  height: number,
  time: number,
): number => {
  const visibleWidth = Math.max(1, width - clipStart);
  const cx = clipStart + visibleWidth * 0.5;
  const cy = height * 0.47;
  const scale = height / 720;
  const pulse = 1 + Math.sin(time * 4) * 0.025;
  const matteWidth = 150 * scale;
  const matteHeight = 360 * scale;
  const coverage = Math.round((matteWidth * matteHeight) / (width * height) * 1000) / 10;

  ctx.save();
  ctx.beginPath();
  ctx.rect(clipStart, 0, visibleWidth, height);
  drawHumanSilhouettePath(ctx, cx, cy, scale * pulse);
  ctx.clip("evenodd");
  ctx.filter = `blur(${Math.max(6, 10 * scale)}px) brightness(68%) saturate(70%)`;
  ctx.drawImage(ctx.canvas, clipStart, 0, visibleWidth, height, clipStart, 0, visibleWidth, height);
  ctx.filter = "none";
  ctx.restore();

  ctx.save();
  drawHumanSilhouettePath(ctx, cx, cy, scale * pulse);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect(clipStart, 0, visibleWidth, height);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  drawHumanSilhouettePath(ctx, cx, cy, scale * pulse);
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 18 * scale;
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = Math.max(2, 4 * scale);
  ctx.stroke();

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#22d3ee";
  drawHumanSilhouettePath(ctx, cx, cy, scale * pulse);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.setLineDash([10 * scale, 8 * scale]);
  ctx.strokeStyle = "rgba(248,250,252,0.62)";
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  drawHumanSilhouettePath(ctx, cx, cy, scale * pulse);
  ctx.stroke();
  ctx.restore();

  return coverage;
};

const validateEffectProbe = (probe: ValidationProbe): ValidationState => {
  if (!probe.id) {
    return {
      ...probe,
      status: "pending",
      message: "No validation effect selected.",
    };
  }

  if (probe.id === "video.spatial-ripple") {
    const passed = probe.structuralSamples >= 55;
    return {
      ...probe,
      status: passed ? "pass" : "warn",
      message: passed
        ? `PASS: ${probe.structuralSamples} displaced scan rows remapped.`
        : "Waiting for enough displacement to validate spatial warp.",
    };
  }

  const passed = probe.matteCoverage >= 5;
  return {
    ...probe,
    status: passed ? "pass" : "warn",
    message: passed
      ? `PASS: alpha matte composite covers ${probe.matteCoverage.toFixed(1)}% of frame.`
      : "Body matte coverage is below validation threshold.",
  };
};

const PIXI_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    return vec4(position * uInputSize.zw * 2.0 - 1.0, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.xy);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`;

const MASTER_GPU_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uMode;
  uniform float uExposure;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uHue;
  uniform float uWarmth;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uScanlines;
  uniform float uChromaShift;
  uniform float uBlur;
  uniform float uMatteGuide;

  const float PI = 3.14159265359;

  vec3 rgb2yiq(vec3 color) {
    return vec3(
      dot(color, vec3(0.299, 0.587, 0.114)),
      dot(color, vec3(0.596, -0.274, -0.322)),
      dot(color, vec3(0.211, -0.523, 0.312))
    );
  }

  vec3 yiq2rgb(vec3 color) {
    return vec3(
      dot(color, vec3(1.0, 0.956, 0.621)),
      dot(color, vec3(1.0, -0.272, -0.647)),
      dot(color, vec3(1.0, -1.106, 1.703))
    );
  }

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float ellipseMask(vec2 uv, vec2 center, vec2 radius) {
    vec2 p = (uv - center) / radius;
    return 1.0 - smoothstep(0.88, 1.02, dot(p, p));
  }

  float boxMask(vec2 uv, vec2 center, vec2 size) {
    vec2 q = abs(uv - center) - size;
    float outside = length(max(q, 0.0));
    float inside = min(max(q.x, q.y), 0.0);
    return 1.0 - smoothstep(0.0, 0.025, outside + inside);
  }

  float bodyMask(vec2 uv) {
    float pulse = 1.0 + sin(uTime * 4.0) * 0.018;
    float head = ellipseMask(uv, vec2(0.5, 0.28), vec2(0.055, 0.08) * pulse);
    float torso = ellipseMask(uv, vec2(0.5, 0.53), vec2(0.14, 0.24) * pulse);
    float leftArm = boxMask(uv, vec2(0.37, 0.55), vec2(0.045, 0.19) * pulse);
    float rightArm = boxMask(uv, vec2(0.63, 0.55), vec2(0.045, 0.19) * pulse);
    float leftLeg = boxMask(uv, vec2(0.45, 0.82), vec2(0.045, 0.20) * pulse);
    float rightLeg = boxMask(uv, vec2(0.55, 0.82), vec2(0.045, 0.20) * pulse);
    return clamp(max(max(max(head, torso), max(leftArm, rightArm)), max(leftLeg, rightLeg)), 0.0, 1.0);
  }

  vec4 sampleVideo(vec2 uv) {
    vec2 safeUv = clamp(uv, vec2(0.001), vec2(0.999));
    float shift = uChromaShift * 0.0014;
    if (shift <= 0.0001) {
      return texture(uMap, safeUv);
    }
    float r = texture(uMap, clamp(safeUv + vec2(shift, 0.0), vec2(0.001), vec2(0.999))).r;
    float g = texture(uMap, safeUv).g;
    float b = texture(uMap, clamp(safeUv - vec2(shift, 0.0), vec2(0.001), vec2(0.999))).b;
    return vec4(r, g, b, 1.0);
  }

  vec3 grade(vec3 color, vec2 uv) {
    color *= uExposure;
    color = (color - 0.5) * uContrast + 0.5;
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luma), color, uSaturation);

    float hue = uHue * PI / 180.0;
    vec3 yiq = rgb2yiq(color);
    float chroma = length(yiq.yz);
    float angle = atan(yiq.z, yiq.y) + hue;
    yiq.y = chroma * cos(angle);
    yiq.z = chroma * sin(angle);
    color = yiq2rgb(yiq);

    color += vec3(max(uWarmth, 0.0) * 0.08, max(uWarmth, 0.0) * 0.035, max(-uWarmth, 0.0) * 0.09);
    color -= vec3(max(-uWarmth, 0.0) * 0.02, max(-uWarmth, 0.0) * 0.012, max(uWarmth, 0.0) * 0.035);

    float dist = distance(uv, vec2(0.5));
    color *= 1.0 - smoothstep(0.28, 0.78, dist) * uVignette;

    float scan = step(0.5, fract(uv.y * 720.0 * 0.5));
    color *= 1.0 - scan * uScanlines * 0.28;

    float noise = rand(floor(uv * 1200.0) + floor(uTime * 24.0)) * 2.0 - 1.0;
    color += noise * uGrain * 0.12;

    return clamp(color, 0.0, 1.0);
  }

  void main(void) {
    vec2 uv = vTextureCoord;

    if (uMode > -0.5 && uMode < 0.5) {
      float waveA = sin(uv.y * 25.1327 + uTime * 3.2);
      float waveB = sin(uv.y * 9.4247 - uTime * 1.8);
      uv.x += (waveA * 0.018 + waveB * 0.009) * sin(uTime * 0.7 + 1.2);
    }

    vec4 base = sampleVideo(uv);

    if (uMode > 0.5) {
      float matte = bodyMask(vTextureCoord);
      float edge = smoothstep(0.18, 0.72, matte) - smoothstep(0.72, 1.0, matte);
      vec2 texel = vec2(0.0035 + uBlur * 0.0016);
      vec3 blur = vec3(0.0);
      blur += sampleVideo(uv + texel * vec2(-1.0, -1.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(0.0, -1.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(1.0, -1.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(-1.0, 0.0)).rgb;
      blur += sampleVideo(uv).rgb;
      blur += sampleVideo(uv + texel * vec2(1.0, 0.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(-1.0, 1.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(0.0, 1.0)).rgb;
      blur += sampleVideo(uv + texel * vec2(1.0, 1.0)).rgb;
      blur /= 9.0;
      vec3 background = blur * vec3(0.55, 0.65, 0.72);
      vec3 subject = mix(base.rgb, vec3(0.18, 0.9, 1.0), 0.10 + uMatteGuide * 0.10);
      base.rgb = mix(background, subject, matte);
      base.rgb = mix(base.rgb, vec3(0.22, 0.9, 1.0), clamp(edge * (0.72 + uMatteGuide), 0.0, 0.85));
    }

    vec3 color = grade(base.rgb, vTextureCoord);

    if (uMode > -0.5 && uMode < 0.5) {
      float line = smoothstep(0.975, 1.0, sin(vTextureCoord.y * 70.0 + uTime * 1.7) * 0.5 + 0.5);
      color = mix(color, vec3(0.25, 0.95, 1.0), line * 0.14);
    }

    finalColor = vec4(color, base.a);
  }
`;

const createMasterGpuFilter = () => Filter.from({
  gl: {
    vertex: PIXI_VERTEX_SHADER,
    fragment: MASTER_GPU_FRAGMENT_SHADER,
  },
  resources: {
    effectUniforms: {
      uTime: { value: 0, type: "f32" },
      uMode: { value: 0, type: "f32" },
      uExposure: { value: 1, type: "f32" },
      uContrast: { value: 1, type: "f32" },
      uSaturation: { value: 1, type: "f32" },
      uHue: { value: 0, type: "f32" },
      uWarmth: { value: 0, type: "f32" },
      uVignette: { value: 0, type: "f32" },
      uGrain: { value: 0, type: "f32" },
      uScanlines: { value: 0, type: "f32" },
      uChromaShift: { value: 0, type: "f32" },
      uBlur: { value: 0, type: "f32" },
      uMatteGuide: { value: 0, type: "f32" },
    },
  },
});

const updateMasterGpuUniforms = (
  filter: Filter,
  settings: LabSettings,
  colorState: ColorWheelState,
  activeValidationEffectId: ActiveValidationEffectId,
  time: number,
) => {
  const uniforms = (filter as any).resources?.effectUniforms?.uniforms;
  if (!uniforms) return;

  const hueBias = (colorState.gain[0] - colorState.gain[2] + colorState.lift[0] - colorState.lift[2]) * 18;
  uniforms.uTime = time;
  uniforms.uMode = activeValidationEffectId === "body.matte-composite" ? 1 : activeValidationEffectId === "video.spatial-ripple" ? 0 : -1;
  uniforms.uExposure = (settings.exposure / 100) * Math.pow(2, colorState.exposure);
  uniforms.uContrast = settings.contrast / 100;
  uniforms.uSaturation = (settings.saturation / 100) * colorState.sat;
  uniforms.uHue = settings.hue + settings.warmth * 0.25 + hueBias;
  uniforms.uWarmth = settings.warmth / 60;
  uniforms.uVignette = settings.vignette / 100;
  uniforms.uGrain = settings.grain / 50;
  uniforms.uScanlines = settings.scanlines / 60;
  uniforms.uChromaShift = settings.chromaShift;
  uniforms.uBlur = Math.max(settings.blur, activeValidationEffectId === "body.matte-composite" ? 3 : 0);
  uniforms.uMatteGuide = Math.max(settings.matteGuide / 100, activeValidationEffectId === "body.matte-composite" ? 0.55 : 0);
};

const drawGpuOverlay = (
  overlay: Graphics,
  width: number,
  height: number,
  splitX: number,
  settings: LabSettings,
  activeValidationEffectId: ActiveValidationEffectId,
  time: number,
) => {
  overlay.clear();

  if (settings.matteGuide > 0 || activeValidationEffectId === "body.matte-composite") {
    const alpha = Math.max(settings.matteGuide / 100, activeValidationEffectId === "body.matte-composite" ? 0.66 : 0);
    const cx = width * 0.5;
    const cy = height * 0.53;
    const pulse = 1 + Math.sin(time * 4) * 0.018;
    overlay.ellipse(cx, height * 0.28, width * 0.055 * pulse, height * 0.08 * pulse)
      .stroke({ color: 0x67e8f9, alpha, width: 3 });
    overlay.ellipse(cx, cy, width * 0.14 * pulse, height * 0.24 * pulse)
      .stroke({ color: 0x67e8f9, alpha, width: 3 });
    overlay.rect(cx - width * 0.175, height * 0.36, width * 0.35, height * 0.42)
      .stroke({ color: 0xe0f2fe, alpha: alpha * 0.42, width: 1 });
  }

  if (activeValidationEffectId === "video.spatial-ripple") {
    for (let y = 32; y < height; y += 68) {
      const offset = Math.sin((y / height) * Math.PI * 8 + time * 3.2) * 14;
      overlay.moveTo(splitX + Math.max(0, offset), y)
        .lineTo(width + Math.min(0, offset), y + offset * 0.18)
        .stroke({ color: 0x67e8f9, alpha: 0.17, width: 1 });
    }
  }
};

const updateSpriteFit = (sprite: Sprite, video: HTMLVideoElement, width: number, height: number, fitMode: FitMode) => {
  const srcW = video.videoWidth;
  const srcH = video.videoHeight;
  if (!srcW || !srcH) return;

  const rect = getObjectFitRect(srcW, srcH, width, height, fitMode);
  const scaleX = rect.width / srcW;
  const scaleY = rect.height / srcH;
  sprite.scale.set(scaleX, scaleY);
  sprite.position.set(rect.x, rect.y);
};

export const StudioMasterLabView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const isSplitDraggingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pixiSceneRef = useRef<PixiSceneRefs | null>(null);
  const customFileUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const fpsSamplesRef = useRef<number[]>([]);
  const gpuFrameCountRef = useRef(0);
  const gpuFpsWindowStartRef = useRef(performance.now());
  const lastFrameAtRef = useRef<number>(performance.now());
  const lastMetricAtRef = useRef<number>(0);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vfxBufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const validationProbeRef = useRef<ValidationProbe>({
    id: null,
    structuralSamples: 0,
    matteCoverage: 0,
  });

  const [sourceUrl, setSourceUrl] = useState(VIDEO_PRESETS[0].src);
  const [sourceName, setSourceName] = useState(VIDEO_PRESETS[0].name);
  const [sourceLabel, setSourceLabel] = useState(VIDEO_PRESETS[0].label);
  const [customUrl, setCustomUrl] = useState("");
  const [activeVideoPresetId, setActiveVideoPresetId] = useState(VIDEO_PRESETS[0].id);
  const [activeEffectPresetId, setActiveEffectPresetId] = useState<ActiveEffectPresetId>(EFFECT_PRESETS[0].id);
  const [settings, setSettings] = useState<LabSettings>(EFFECT_PRESETS[0].settings);
  const [colorState, setColorState] = useState<ColorWheelState>(EFFECT_PRESETS[0].colorState);
  const [scopeState, setScopeState] = useState<ScopeState>(() => emptyScopeState());
  const [activeValidationEffectId, setActiveValidationEffectId] = useState<ActiveValidationEffectId>(null);
  const [validationState, setValidationState] = useState<ValidationState>(() => pendingValidationState(null));
  const [gpuMode, setGpuMode] = useState<GpuMode>("loading");
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [showSplit, setShowSplit] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [logs, setLogs] = useState<string[]>([
    "[INIT] Studio Master video lab online.",
    "[SOURCE] Preset clip queued: Macro Flower.",
    "[PRESET] Color Grade loaded for live A/B testing.",
  ]);
  const [metrics, setMetrics] = useState<MetricState>({
    fps: 0,
    latencyMs: 0,
    decodedFrames: 0,
    droppedFrames: 0,
    luma: "pending",
    resolution: "1280x720",
  });

  const liveStateRef = useRef({
    activeValidationEffectId,
    colorState,
    fitMode,
    settings,
    status,
  });

  const activeEffectPreset = useMemo(
    () => EFFECT_PRESETS.find((preset) => preset.id === activeEffectPresetId) ?? null,
    [activeEffectPresetId],
  );

  const activeVideoPreset = useMemo(
    () => VIDEO_PRESETS.find((preset) => preset.id === activeVideoPresetId) ?? null,
    [activeVideoPresetId],
  );

  const activeValidationEffect = useMemo(
    () => VALIDATION_EFFECTS.find((effect) => effect.id === activeValidationEffectId) ?? null,
    [activeValidationEffectId],
  );

  useEffect(() => {
    liveStateRef.current = {
      activeValidationEffectId,
      colorState,
      fitMode,
      settings,
      status,
    };
  }, [activeValidationEffectId, colorState, fitMode, settings, status]);

  const addLog = useCallback((message: string) => {
    setLogs((previous) => {
      const next = [...previous, message];
      return next.length > 80 ? next.slice(next.length - 80) : next;
    });
  }, []);

  const pixiRendererRef = usePixiRenderer(
    canvasRef,
    1280,
    720,
    () => {
      setGpuMode("active");
      addLog("[GPU] Shared PixiRenderer WebGL compositor active for Studio Master preview.");
    },
    (error) => {
      setGpuMode("fallback");
      addLog(`[WARN] Shared PixiRenderer unavailable; using Canvas fallback (${error instanceof Error ? error.message : String(error)}).`);
    },
  );

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (customFileUrlRef.current) URL.revokeObjectURL(customFileUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number | null = null;

    const ensureScene = (): PixiSceneRefs | null => {
      const renderer = pixiRendererRef.current;
      if (!renderer || !renderer.isReady) return null;

      const app = renderer.getApp();
      const videoSprite = renderer.getVideoSprite();
      if (!app || !videoSprite) return null;

      if (pixiSceneRef.current) {
        pixiSceneRef.current.videoSprite = videoSprite;
        return pixiSceneRef.current;
      }

      const root = new Container();
      const unfilteredSprite = new Sprite();
      const maskGraphics = new Graphics();
      const overlay = new Graphics();
      const filter = createMasterGpuFilter();

      videoSprite.filters = [filter];
      videoSprite.mask = maskGraphics;

      root.addChild(unfilteredSprite);
      root.addChild(videoSprite);
      root.addChild(maskGraphics);
      root.addChild(overlay);
      app.stage.addChild(root);

      pixiSceneRef.current = {
        root,
        videoSprite,
        unfilteredSprite,
        maskGraphics,
        overlay,
        filter,
        lastOverlayKey: "",
        lastRenderAt: 0,
      };

      return pixiSceneRef.current;
    };

    const render = (now: number) => {
      const renderer = pixiRendererRef.current;
      const scene = ensureScene();
      const video = videoRef.current;

      if (!renderer || !renderer.isReady || !scene || !video) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const frameStart = performance.now();
      const current = liveStateRef.current;
      const hasDecodedFrame = current.status !== "error" && video.readyState >= 2;

      if (!hasDecodedFrame && now - scene.lastRenderAt < 250) {
        rafId = requestAnimationFrame(render);
        return;
      }

      scene.lastRenderAt = now;
      lastFrameAtRef.current = now;
      gpuFrameCountRef.current += 1;

      const width = canvas.width || 1280;
      const height = canvas.height || 720;
      const splitX = Math.floor((width * current.settings.splitView) / 100);

      renderer.setFitMode(current.fitMode === "contain" ? "fit" : current.fitMode === "cover" ? "crop" : "stretch");

      if (hasDecodedFrame) {
        renderer.setVideoSource(video);
        scene.videoSprite.texture?.source?.update();
        updateMasterGpuUniforms(scene.filter, current.settings, current.colorState, current.activeValidationEffectId, video.currentTime || 0);

        if (current.settings.splitView > 0) {
          if (scene.videoSprite.texture) {
            scene.unfilteredSprite.texture = scene.videoSprite.texture;
          }
          scene.unfilteredSprite.width = scene.videoSprite.width;
          scene.unfilteredSprite.height = scene.videoSprite.height;
          scene.unfilteredSprite.position.copyFrom(scene.videoSprite.position);
          scene.unfilteredSprite.visible = true;
          scene.videoSprite.mask = scene.maskGraphics;

          scene.maskGraphics.clear();
          const vw = scene.videoSprite.width || width;
          const vh = scene.videoSprite.height || height;
          const vx = scene.videoSprite.position.x || 0;
          const vy = scene.videoSprite.position.y || 0;
          const maskSplitX = vx + (current.settings.splitView / 100) * vw;
          scene.maskGraphics.rect(maskSplitX, vy, vw - (current.settings.splitView / 100) * vw, vh).fill({ color: 0xffffff, alpha: 1 });
        } else {
          scene.unfilteredSprite.visible = false;
          scene.videoSprite.mask = null;
          scene.maskGraphics.clear();
        }
      }

      const overlayKey = [
        splitX,
        current.settings.matteGuide,
        current.activeValidationEffectId ?? "none",
        Math.floor((video.currentTime || 0) * 12),
      ].join(":");
      if (overlayKey !== scene.lastOverlayKey) {
        scene.lastOverlayKey = overlayKey;
        drawGpuOverlay(scene.overlay, width, height, splitX, current.settings, current.activeValidationEffectId, video.currentTime || 0);
      }

      if (current.activeValidationEffectId === "video.spatial-ripple") {
        let displacedRows = 0;
        for (let y = 0; y < height; y += 6) {
          const normalizedY = y / height;
          const waveA = Math.sin(normalizedY * Math.PI * 8 + (video.currentTime || 0) * 3.2);
          const waveB = Math.sin(normalizedY * Math.PI * 3 - (video.currentTime || 0) * 1.8);
          const offset = Math.round((waveA * 14 + waveB * 7) * Math.sin((video.currentTime || 0) * 0.7 + 1.2));
          if (Math.abs(offset) > 1) displacedRows += 1;
        }
        validationProbeRef.current = {
          id: current.activeValidationEffectId,
          structuralSamples: displacedRows,
          matteCoverage: 0,
        };
      } else if (current.activeValidationEffectId === "body.matte-composite") {
        const matteWidth = 150 * (height / 720);
        const matteHeight = 360 * (height / 720);
        validationProbeRef.current = {
          id: current.activeValidationEffectId,
          structuralSamples: 0,
          matteCoverage: Math.round((matteWidth * matteHeight) / (width * height) * 1000) / 10,
        };
      } else {
        validationProbeRef.current = {
          id: null,
          structuralSamples: 0,
          matteCoverage: 0,
        };
      }

      renderer.render();

      if (now - lastMetricAtRef.current > 1000) {
        const averageFps = Math.round((gpuFrameCountRef.current * 1000) / Math.max(1, now - gpuFpsWindowStartRef.current));
        gpuFrameCountRef.current = 0;
        gpuFpsWindowStartRef.current = now;
        lastMetricAtRef.current = now;
        const quality = getVideoQuality(video);
        setValidationState(validateEffectProbe(validationProbeRef.current));
        setScopeState((previous) => previous.status === "active" ? previous : { ...previous, status: "active" });
        setMetrics({
          fps: averageFps,
          latencyMs: Math.round((performance.now() - frameStart) * 10) / 10,
          decodedFrames: quality.decodedFrames,
          droppedFrames: quality.droppedFrames,
          luma: "gpu",
          resolution: video.videoWidth && video.videoHeight ? `${video.videoWidth}x${video.videoHeight}` : "pending",
        });
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      const scene = pixiSceneRef.current;
      if (scene) {
        scene.videoSprite.mask = null;
        scene.videoSprite.filters = null;
        scene.filter.destroy();
        scene.root.removeChildren();
        scene.root.destroy({ children: true });
      }
      pixiSceneRef.current = null;
    };
  }, [pixiRendererRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus("loading");
    video.src = sourceUrl;
    video.load();

    const handleLoaded = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
      setStatus("ready");
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
      setMetrics((previous) => ({
        ...previous,
        resolution: video.videoWidth && video.videoHeight
          ? `${video.videoWidth}x${video.videoHeight}`
          : previous.resolution,
      }));
      addLog(`[SOURCE] Ready: ${sourceName} (${video.videoWidth || "?"}x${video.videoHeight || "?"}).`);
      if (isPlaying) {
        video.play().catch((error: unknown) => {
          setIsPlaying(false);
          addLog(`[WARN] Autoplay blocked: ${error instanceof Error ? error.message : String(error)}.`);
        });
      }
    };

    const handleError = () => {
      setStatus("error");
      setIsPlaying(false);
      addLog("[ERROR] Video source failed to load. Try another preset, URL, or local file.");
    };

    const handleTime = () => setCurrentTime(video.currentTime || 0);

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("error", handleError);
    video.addEventListener("timeupdate", handleTime);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("timeupdate", handleTime);
    };
  }, [addLog, sourceName, sourceUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && status !== "error") {
      video.play().catch((error: unknown) => {
        setIsPlaying(false);
        addLog(`[WARN] Playback failed: ${error instanceof Error ? error.message : String(error)}.`);
      });
    } else {
      video.pause();
    }
  }, [addLog, isPlaying, status]);

  const drawProcessedVideo = useCallback(
    (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number, clipStart = 0) => {
      const sourceWidth = video.videoWidth || width;
      const sourceHeight = video.videoHeight || height;
      const rect = getObjectFitRect(sourceWidth, sourceHeight, width, height, fitMode);

      ctx.save();
      ctx.beginPath();
      ctx.rect(clipStart, 0, width - clipStart, height);
      ctx.clip();

      const cdlBrightness = settings.exposure * Math.pow(2, colorState.exposure);
      const cdlSaturation = settings.saturation * colorState.sat;
      const hueBias = (colorState.gain[0] - colorState.gain[2] + colorState.lift[0] - colorState.lift[2]) * 18;

      ctx.filter = [
        `brightness(${cdlBrightness}%)`,
        `contrast(${settings.contrast}%)`,
        `saturate(${cdlSaturation}%)`,
        `hue-rotate(${settings.hue + settings.warmth * 0.25 + hueBias}deg)`,
        `blur(${settings.blur}px)`,
      ].join(" ");
      ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height);
      ctx.filter = "none";

      if (settings.chromaShift > 0) {
        const shift = settings.chromaShift;
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.18;
        ctx.filter = `hue-rotate(${settings.hue + 90}deg) saturate(180%)`;
        ctx.drawImage(video, rect.x + shift, rect.y, rect.width, rect.height);
        ctx.filter = `hue-rotate(${settings.hue - 120}deg) saturate(160%)`;
        ctx.drawImage(video, rect.x - shift, rect.y, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.filter = "none";
      }

      if (settings.warmth !== 0) {
        ctx.globalAlpha = Math.min(Math.abs(settings.warmth) / 120, 0.45);
        ctx.fillStyle = settings.warmth > 0 ? "#f59e0b" : "#38bdf8";
        ctx.fillRect(clipStart, 0, width - clipStart, height);
        ctx.globalAlpha = 1;
      }

      if (settings.vignette > 0) {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.18, width / 2, height / 2, width * 0.72);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(0,0,0,${settings.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(clipStart, 0, width - clipStart, height);
      }

      if (settings.matteGuide > 0) {
        const alpha = settings.matteGuide / 100;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.ellipse(width * 0.5, height * 0.47, width * 0.16, height * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = alpha * 0.18;
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.ellipse(width * 0.5, height * 0.47, width * 0.16, height * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (settings.scanlines > 0) {
        ctx.globalAlpha = settings.scanlines / 100;
        ctx.fillStyle = "#020617";
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(clipStart, y, width - clipStart, 1);
        }
        ctx.globalAlpha = 1;
      }

      if (settings.grain > 0) {
        const dots = Math.floor((width * height * settings.grain) / 24000);
        ctx.globalAlpha = Math.min(settings.grain / 100, 0.28);
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < dots; i += 1) {
          const x = clipStart + Math.random() * (width - clipStart);
          const y = Math.random() * height;
          ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1;
      }

      if (settings.sharpen > 0) {
        ctx.globalAlpha = settings.sharpen / 100;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 24) {
          ctx.beginPath();
          ctx.moveTo(clipStart, y + 0.5);
          ctx.lineTo(width, y + 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const probe: ValidationProbe = {
        id: activeValidationEffectId,
        structuralSamples: 0,
        matteCoverage: 0,
      };

      try {
        if (activeValidationEffectId === "video.spatial-ripple") {
          if (!vfxBufferCanvasRef.current) vfxBufferCanvasRef.current = document.createElement("canvas");
          probe.structuralSamples = applySpatialRippleWarp(ctx, clipStart, width, height, currentTime, vfxBufferCanvasRef.current);
        } else if (activeValidationEffectId === "body.matte-composite") {
          probe.matteCoverage = applyBodyMatteComposite(ctx, clipStart, width, height, currentTime);
        }
      } catch (_error) {
        probe.structuralSamples = 0;
        probe.matteCoverage = 0;
      }
      validationProbeRef.current = probe;

      ctx.restore();
    },
    [activeValidationEffectId, colorState, currentTime, fitMode, settings],
  );

  const drawFrame = useCallback(
    (now: number) => {
      if (gpuMode !== "fallback") return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !video) return;

      const width = canvas.width;
      const height = canvas.height;
      const frameStart = performance.now();
      const delta = now - lastFrameAtRef.current;
      lastFrameAtRef.current = now;
      fpsSamplesRef.current = [...fpsSamplesRef.current.slice(-29), 1000 / Math.max(delta, 1)];

      if (settings.motionTrail > 0) {
        ctx.globalAlpha = settings.motionTrail / 100;
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      } else {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, width, height);
      }

      if (video.readyState >= 2) {
        const splitX = Math.floor((width * settings.splitView) / 100);
        const sourceWidth = video.videoWidth || width;
        const sourceHeight = video.videoHeight || height;
        const rect = getObjectFitRect(sourceWidth, sourceHeight, width, height, fitMode);

        if (settings.splitView > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height);
          ctx.restore();
        }

        drawProcessedVideo(ctx, video, width, height, splitX);

        if (settings.splitView > 0) {
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(splitX - 1, 0, 2, height);
        }
      } else {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 18px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(status === "error" ? "Video source unavailable" : "Loading video source...", width / 2, height / 2);
        ctx.textAlign = "left";
      }

      if (now - lastMetricAtRef.current > 420) {
        lastMetricAtRef.current = now;
        const averageFps = fpsSamplesRef.current.reduce((sum, fps) => sum + fps, 0) / Math.max(fpsSamplesRef.current.length, 1);
        const quality = getVideoQuality(video);
        let luma = "protected";

        try {
          const sample = ctx.getImageData(width / 2, height / 2, 1, 1).data;
          luma = Math.round(0.2126 * sample[0] + 0.7152 * sample[1] + 0.0722 * sample[2]).toString();
          if (!scopeCanvasRef.current) scopeCanvasRef.current = document.createElement("canvas");
          setScopeState(analyzeCanvasScopes(canvas, scopeCanvasRef.current));
          setValidationState(validateEffectProbe(validationProbeRef.current));
        } catch (_error) {
          luma = "cors";
          setScopeState((previous) => ({ ...previous, status: "blocked" }));
          setValidationState({
            ...validationProbeRef.current,
            status: "warn",
            message: "Canvas pixels are protected; upload a local file to validate pixel effects.",
          });
        }

        setMetrics({
          fps: Math.round(averageFps),
          latencyMs: Math.round((performance.now() - frameStart) * 10) / 10,
          decodedFrames: quality.decodedFrames,
          droppedFrames: quality.droppedFrames,
          luma,
          resolution: video.videoWidth && video.videoHeight ? `${video.videoWidth}x${video.videoHeight}` : "pending",
        });
      }
    },
    [drawProcessedVideo, fitMode, gpuMode, settings.motionTrail, settings.splitView, status],
  );

  useEffect(() => {
    if (gpuMode !== "fallback") {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      drawFrame(now);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [drawFrame, gpuMode]);

  const loadVideoPreset = (preset: VideoPreset) => {
    setActiveVideoPresetId(preset.id);
    setSourceUrl(preset.src);
    setSourceName(preset.name);
    setSourceLabel(preset.label);
    setIsPlaying(true);
    addLog(`[SOURCE] Loading preset clip: ${preset.name}.`);
  };

  const applyEffectPreset = (preset: EffectPreset) => {
    if (activeEffectPresetId === preset.id) {
      setActiveEffectPresetId(null);
      setSettings(BASE_SETTINGS);
      setColorState(BASE_COLOR_STATE);
      addLog(`[PRESET] Deselected ${preset.name}; neutral color state restored.`);
      return;
    }

    setActiveEffectPresetId(preset.id);
    setSettings(preset.settings);
    setColorState(preset.colorState);
    addLog(`[PRESET] Applied ${preset.name}.`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (customFileUrlRef.current) URL.revokeObjectURL(customFileUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    customFileUrlRef.current = objectUrl;
    setActiveVideoPresetId("upload");
    setSourceUrl(objectUrl);
    setSourceName(file.name);
    setSourceLabel(`${(file.size / 1024 / 1024).toFixed(1)} MB`);
    setIsPlaying(true);
    addLog(`[SOURCE] Local video loaded: ${file.name}.`);
  };

  const handleLoadUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    setActiveVideoPresetId("url");
    setSourceUrl(trimmed);
    setSourceName("Custom URL");
    setSourceLabel("Remote");
    setIsPlaying(true);
    addLog("[SOURCE] Loading custom video URL.");
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration)) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const captureFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const anchor = document.createElement("a");
      anchor.href = canvas.toDataURL("image/png");
      anchor.download = `clypra-master-${Date.now()}.png`;
      anchor.click();
      addLog("[EXPORT] Captured processed frame as PNG.");
    } catch (_error) {
      addLog("[WARN] Frame capture blocked by remote video CORS. Use a local file or CORS-enabled URL.");
    }
  };

  const resetSettings = () => {
    setActiveEffectPresetId(null);
    setSettings(BASE_SETTINGS);
    setColorState(BASE_COLOR_STATE);
    addLog("[PRESET] Cleared color preset and reset to neutral.");
  };

  const updateSetting = (key: keyof LabSettings, value: number) => {
    setActiveEffectPresetId("custom");
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const updateColorState = (next: ColorWheelState) => {
    setActiveEffectPresetId("custom");
    setColorState(next);
  };

  const updateSplitFromPointer = useCallback((clientX: number) => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clampedPct = Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
    setActiveEffectPresetId("custom");
    setSettings((previous) => ({ ...previous, splitView: clampedPct }));
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isSplitDraggingRef.current) return;
      updateSplitFromPointer(event.clientX);
    };

    const handlePointerUp = () => {
      if (!isSplitDraggingRef.current) return;
      isSplitDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [updateSplitFromPointer]);

  const handleSplitPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    isSplitDraggingRef.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    updateSplitFromPointer(event.clientX);
  };

  const handleSplitPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isSplitDraggingRef.current) return;
    updateSplitFromPointer(event.clientX);
  };

  const handleSplitPointerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    setActiveEffectPresetId("custom");
    setSettings((previous) => {
      const nextValue = event.key === "Home"
        ? 0
        : event.key === "End"
          ? 100
          : event.key === "ArrowLeft"
            ? previous.splitView - step
            : previous.splitView + step;
      return { ...previous, splitView: Math.max(0, Math.min(100, nextValue)) };
    });
  };

  const selectValidationEffect = (effect: ValidationEffect) => {
    if (activeValidationEffectId === effect.id) {
      setActiveValidationEffectId(null);
      validationProbeRef.current = {
        id: null,
        structuralSamples: 0,
        matteCoverage: 0,
      };
      setValidationState(pendingValidationState(null));
      addLog(`[VALIDATE] Deselected ${effect.name}; VFX validation disabled.`);
      return;
    }

    setActiveValidationEffectId(effect.id);
    validationProbeRef.current = {
      id: effect.id,
      structuralSamples: 0,
      matteCoverage: 0,
    };
    setValidationState(pendingValidationState(effect.id));
    addLog(`[VALIDATE] Armed ${effect.category} effect: ${effect.name}.`);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#08111f] text-slate-100" style={{ fontFamily: "Inter, sans-serif" }}>
      <video
        ref={videoRef}
        className="hidden"
        muted
        loop
        playsInline
        crossOrigin="anonymous"
      />

      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#0b1424] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-cyan-500/14 text-cyan-300">
            <MonitorPlay size={19} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Studio Master Video Testing Lab</h1>
            <p className="text-[11px] text-slate-400">Live presets on real video sources</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-400" : status === "error" ? "bg-rose-400" : "bg-amber-400"}`} />
          <span className="uppercase tracking-wide">{status}</span>
          <span className={`rounded border px-2 py-1 font-mono uppercase ${
            gpuMode === "active"
              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
              : gpuMode === "fallback"
                ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                : "border-slate-700 bg-slate-900 text-slate-400"
          }`}>
            {gpuMode === "active" ? "pixi gpu" : gpuMode}
          </span>
          <span className="rounded border border-slate-700 px-2 py-1 font-mono text-slate-400">{sourceLabel}</span>
        </div>
      </header>

      <main className="grid h-[calc(100vh-3.5rem)] grid-cols-[290px_minmax(0,1fr)_430px] overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-[#0c1728]">
          <div className="border-b border-slate-800 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Aperture size={14} />
              Source Videos
            </div>
            <div className="space-y-2">
              {VIDEO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadVideoPreset(preset)}
                  className={`w-full rounded border p-2 text-left transition-colors ${
                    activeVideoPresetId === preset.id
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-slate-700 bg-slate-950/30 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase text-slate-300">{preset.label}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-800 p-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-slate-600 bg-slate-950/30 px-3 py-3 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-200">
              <Upload size={15} />
              Upload Video
              <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="mt-3 flex gap-2">
              <input
                value={customUrl}
                onChange={(event) => setCustomUrl(event.target.value)}
                placeholder="https://.../clip.mp4"
                className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-[11px] text-slate-100 outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleLoadUrl}
                className="flex h-8 w-8 items-center justify-center rounded bg-cyan-500 text-slate-950 hover:bg-cyan-300"
                aria-label="Load video URL"
                title="Load video URL"
              >
                <Link size={14} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Wand2 size={14} />
              Test Presets
            </div>
            <div className="space-y-2">
              {EFFECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyEffectPreset(preset)}
                  aria-pressed={activeEffectPresetId === preset.id}
                  title={activeEffectPresetId === preset.id ? `Deselect ${preset.name}` : `Apply ${preset.name}`}
                  className={`w-full rounded border p-2 text-left transition-colors ${
                    activeEffectPresetId === preset.id
                      ? "border-emerald-400/60 bg-emerald-400/10"
                      : "border-slate-700 bg-slate-950/30 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">{preset.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-800 pt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Validation Effects</div>
                <span className={`rounded px-2 py-1 font-mono text-[9px] uppercase ${validationState.status === "pass" ? "bg-emerald-400/10 text-emerald-200" : validationState.status === "warn" ? "bg-amber-400/10 text-amber-200" : "bg-slate-800 text-slate-400"}`}>
                  {validationState.status}
                </span>
              </div>
              <div className="space-y-2">
                {VALIDATION_EFFECTS.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => selectValidationEffect(effect)}
                    aria-pressed={activeValidationEffectId === effect.id}
                    title={activeValidationEffectId === effect.id ? `Deselect ${effect.name}` : `Apply ${effect.name}`}
                    className={`w-full rounded border p-2 text-left transition-colors ${
                      activeValidationEffectId === effect.id
                        ? effect.category === "body"
                          ? "border-fuchsia-400/60 bg-fuchsia-400/10"
                          : "border-cyan-400/60 bg-cyan-400/10"
                        : "border-slate-700 bg-slate-950/30 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100">{effect.name}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase text-slate-300">{effect.category}</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-slate-400">{effect.description}</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">{validationState.message}</p>
            </div>
          </div>
        </aside>

        <CanvasPreview
          containerRef={previewFrameRef}
          videoRef={videoRef}
          canvasRef={canvasRef}
          timelineRef={null}
          sourceUrl={sourceUrl}
          sourceName={sourceName}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          fitMode={fitMode}
          showSplit={showSplit}
          splitPosition={settings.splitView}
          metrics={metrics}
          validationState={validationState}
          activeValidationEffectName={activeValidationEffect?.name}
          activePresetName={activeEffectPreset?.name}
          status={status}
          onSetPlaying={setIsPlaying}
          onSeek={handleSeek}
          onSetFitMode={setFitMode}
          onSetShowSplit={(show) => {
            setShowSplit(show);
            setSettings((prev) => ({ ...prev, splitView: show ? (prev.splitView > 0 ? prev.splitView : 50) : 0 }));
          }}
          onMouseDownSplit={handleSplitPointerDown}
          onCaptureFrame={captureFrame}
          onResetSettings={resetSettings}
        />

        <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-[#0c1728]">
          <div className="border-b border-slate-800 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Palette size={14} />
                Color Testing
              </div>
              <button
                onClick={resetSettings}
                className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:border-slate-500"
              >
                Reset
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-400">{activeEffectPreset?.description ?? "Neutral manual state. Select a preset to apply a look, or adjust controls to create a custom setup."}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <section className="rounded border border-slate-800 bg-slate-950/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">Primary CDL Wheels</h2>
                  <p className="mt-0.5 text-[10px] text-slate-500">Lift, Gamma, Gain from the shared package UI</p>
                </div>
                <span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-[9px] text-cyan-200">Rec.709</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ColorWheel
                  label="Lift"
                  value={colorState.lift}
                  onChange={(value) => updateColorState({ ...colorState, lift: value })}
                  size={86}
                />
                <ColorWheel
                  label="Gamma"
                  value={colorState.gamma}
                  onChange={(value) => updateColorState({ ...colorState, gamma: value })}
                  size={86}
                />
                <ColorWheel
                  label="Gain"
                  value={colorState.gain}
                  onChange={(value) => updateColorState({ ...colorState, gain: value })}
                  size={86}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block rounded border border-slate-800 bg-slate-950/50 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-200">Saturation</span>
                    <span className="font-mono text-[10px] text-cyan-200">{colorState.sat.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.05}
                    value={colorState.sat}
                    onChange={(event) => updateColorState({ ...colorState, sat: Number(event.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </label>
                <label className="block rounded border border-slate-800 bg-slate-950/50 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-200">Exposure</span>
                    <span className="font-mono text-[10px] text-cyan-200">{colorState.exposure.toFixed(2)} EV</span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={0.05}
                    value={colorState.exposure}
                    onChange={(event) => updateColorState({ ...colorState, exposure: Number(event.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </label>
              </div>
            </section>

            <section className="mt-3 rounded border border-slate-800 bg-slate-950/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  <BarChart3 size={14} />
                  Scopes
                </div>
                <span className={`rounded px-2 py-1 font-mono text-[9px] ${scopeState.status === "active" ? "bg-emerald-400/10 text-emerald-200" : scopeState.status === "blocked" ? "bg-amber-400/10 text-amber-200" : "bg-slate-800 text-slate-400"}`}>
                  {scopeState.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-slate-800 bg-[#050b14] p-2">
                  <div className="mb-1 flex items-center justify-between text-[9px] uppercase text-slate-500">
                    <span>RGB Histogram</span>
                    <span>{scopeState.avgRgb.join("/")}</span>
                  </div>
                  <svg viewBox="0 0 256 72" className="h-20 w-full overflow-visible">
                    <path d={scopeState.rPath} fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="0.8" />
                    <path d={scopeState.gPath} fill="rgba(16,185,129,0.16)" stroke="#10b981" strokeWidth="0.8" />
                    <path d={scopeState.bPath} fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="0.8" />
                    <path d={scopeState.lPath} fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="1" strokeDasharray="3 3" />
                  </svg>
                </div>

                <div className="rounded border border-slate-800 bg-[#050b14] p-2">
                  <div className="mb-1 text-[9px] uppercase text-slate-500">Waveform</div>
                  <svg viewBox="0 0 100 100" className="h-20 w-full">
                    {[20, 40, 60, 80].map((line) => (
                      <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="rgba(148,163,184,0.16)" strokeWidth="0.5" />
                    ))}
                    <polyline points={scopeState.waveformPoints} fill="none" stroke="#67e8f9" strokeWidth="1.4" />
                  </svg>
                </div>

                <div className="col-span-2 rounded border border-slate-800 bg-[#050b14] p-2">
                  <div className="mb-1 text-[9px] uppercase text-slate-500">Vectorscope Sample</div>
                  <svg viewBox="0 0 100 100" className="h-24 w-full">
                    <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.7" />
                    <line x1="12" x2="88" y1="50" y2="50" stroke="rgba(148,163,184,0.14)" strokeWidth="0.7" />
                    <line x1="50" x2="50" y1="12" y2="88" stroke="rgba(148,163,184,0.14)" strokeWidth="0.7" />
                    {scopeState.vectorscopePoints.map((point, index) => (
                      <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r="1.2" fill={point.color} opacity="0.68" />
                    ))}
                  </svg>
                </div>
              </div>
            </section>

            <section className="mt-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <SlidersHorizontal size={14} />
                Secondary FX
              </div>
              <div className="space-y-3">
              {SLIDERS.map((slider) => (
                <label key={slider.key} className="block rounded border border-slate-800 bg-slate-950/30 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-200">{slider.label}</span>
                    <span className="font-mono text-[10px] text-cyan-200">{formatSetting(settings[slider.key], slider.unit)}</span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={settings[slider.key]}
                    onChange={(event) => updateSetting(slider.key, Number(event.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </label>
              ))}
              </div>
            </section>
          </div>

          <div className="border-t border-slate-800">
            <div className="grid grid-cols-2 border-b border-slate-800">
              <div className="border-r border-slate-800 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                  <Gauge size={12} />
                  Decode
                </div>
                <p className="font-mono text-xs text-slate-100">{metrics.decodedFrames} frames</p>
              </div>
              <div className="p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                  <Activity size={12} />
                  Drops
                </div>
                <p className="font-mono text-xs text-slate-100">{metrics.droppedFrames} frames</p>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto p-3 font-mono text-[10px] leading-4 text-slate-400">
              {logs.map((log, index) => (
                <div key={`${log}-${index}`}>{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
