import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle, Download, Eye, Loader2, Sparkles, UploadCloud, Wand2 } from "lucide-react";
import { useGitHubPublish, type VideoEffectPresetPublishPayload } from "../hooks/useGitHubPublish";
import { generateVideoEffectPresetSuggestions, type VideoEffectPresetSuggestion } from "../services/geminiService";

const VIDEO_RENDERERS = ["glitch", "rgb_split", "chromatic_aberration", "pixelate", "scanlines", "film_grain", "vignette", "glow"];
const BODY_RENDERERS = ["body-segmentation-glow", "body_glow", "body_outline", "body_particles"];
const FIELD_INPUT_CLASS = "w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-violet-500";

type GeneratorRenderer = "mixed" | (typeof VIDEO_RENDERERS)[number];

function toKebabId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function defaultParamsFor(renderer: string): string {
  if (renderer === "body-segmentation-glow" || renderer === "body_glow") {
    return JSON.stringify({ glowColor: "#00ffff", glowIntensity: 0.8, glowRadius: 22, feather: 10 }, null, 2);
  }
  if (renderer === "glitch") {
    return JSON.stringify({ glitchIntensity: 24, rgbSplit: 6, sliceCount: 8, noiseAmount: 0.25 }, null, 2);
  }
  if (renderer === "pixelate") {
    return JSON.stringify({ pixelSize: 18 }, null, 2);
  }
  if (renderer === "vignette") {
    return JSON.stringify({ radius: 0.85 }, null, 2);
  }
  return JSON.stringify({}, null, 2);
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFrom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 999) * 10000;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function paramsForGeneratedRenderer(renderer: string, seed: number, index: number): Record<string, unknown> {
  const r = (offset: number) => randomFrom(seed, index * 17 + offset);
  if (renderer === "glitch") {
    return {
      glitchIntensity: Math.round(10 + r(1) * 42),
      rgbSplit: Math.round(2 + r(2) * 18),
      sliceCount: Math.round(3 + r(3) * 18),
      scanlineCount: Math.round(60 + r(4) * 240),
      noiseAmount: Number((0.08 + r(5) * 0.42).toFixed(2)),
    };
  }
  if (renderer === "rgb_split" || renderer === "chromatic_aberration") {
    return {
      rgbSplit: Math.round(3 + r(1) * 24),
      splitDistance: Math.round(3 + r(2) * 24),
    };
  }
  if (renderer === "pixelate") {
    return { pixelSize: Math.round(6 + r(1) * 42) };
  }
  if (renderer === "scanlines") {
    return { scanlineCount: Math.round(80 + r(1) * 300) };
  }
  if (renderer === "film_grain") {
    return { noiseAmount: Number((0.08 + r(1) * 0.46).toFixed(2)) };
  }
  if (renderer === "vignette") {
    return { radius: Number((0.48 + r(1) * 0.45).toFixed(2)) };
  }
  return {
    glowColor: ["#00ffff", "#ff3df2", "#7c6fff", "#ffcc33", "#36f59f"][Math.floor(r(1) * 5)],
    glowIntensity: Number((0.35 + r(2) * 0.85).toFixed(2)),
    glowRadius: Math.round(8 + r(3) * 34),
  };
}

function generateLocalPresets(renderer: GeneratorRenderer, count: number, prompt: string): VideoEffectPresetSuggestion[] {
  const seed = hashSeed(`${renderer}:${prompt}:${count}`);
  const renderers = renderer === "mixed" ? VIDEO_RENDERERS : [renderer];
  const moods = ["Cyber", "Analog", "Prism", "Neon", "Retro", "Signal", "Dream", "Pulse", "Chrome", "Static"];
  const nouns = ["Glitch", "Shift", "Bloom", "Damage", "Drift", "Surge", "Trace", "Burst", "Flicker", "Echo"];

  return Array.from({ length: count }, (_, index) => {
    const activeRenderer = renderers[index % renderers.length];
    const name = `${moods[Math.floor(randomFrom(seed, index + 1) * moods.length)]} ${nouns[Math.floor(randomFrom(seed, index + 2) * nouns.length)]}`;
    const id = `${toKebabId(name)}-${index + 1}`;
    return {
      id,
      name,
      description: `${name} preset generated for ${activeRenderer.replace(/_/g, " ")} rendering.`,
      renderer: activeRenderer,
      params: paramsForGeneratedRenderer(activeRenderer, seed, index),
      tags: ["video", "effect", activeRenderer.replace(/_/g, "-"), ...prompt.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 3)],
      defaultIntensity: Math.round(clamp(48 + randomFrom(seed, index + 3) * 42, 0, 100)),
      isPremium: false,
    };
  });
}

function applyPreviewEffect(ctx: CanvasRenderingContext2D, preset: VideoEffectPresetSuggestion, width: number, height: number, time: number): void {
  const intensity = clamp(preset.defaultIntensity / 100, 0, 1);
  const params = preset.params;

  if (preset.renderer === "pixelate") {
    const pixelSize = Math.max(2, Math.floor(Number(params.pixelSize ?? 18) * intensity));
    const w = Math.max(8, Math.floor(width / pixelSize));
    const h = Math.max(8, Math.floor(height / pixelSize));
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tempCtx = temp.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(ctx.canvas, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(temp, 0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    return;
  }

  if (preset.renderer === "rgb_split" || preset.renderer === "chromatic_aberration") {
    const shift = Number(params.rgbSplit ?? params.splitDistance ?? 8) * intensity;
    const temp = document.createElement("canvas");
    temp.width = width;
    temp.height = height;
    const tempCtx = temp.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.45;
    ctx.drawImage(temp, -shift, 0);
    ctx.drawImage(temp, shift, 0);
    ctx.restore();
  }

  if (preset.renderer === "glitch") {
    const amount = Math.max(1, Number(params.glitchIntensity ?? 24) * intensity);
    const slices = Math.max(1, Math.floor(Number(params.sliceCount ?? 8) * intensity));
    const seed = Math.floor(time * 24);
    for (let i = 0; i < slices; i++) {
      const y = Math.floor(randomFrom(seed, i * 13) * height);
      const sliceHeight = Math.max(1, Math.floor(4 + randomFrom(seed, i * 19) * 20));
      const offset = Math.floor((randomFrom(seed, i * 29) - 0.5) * amount * 2);
      const imageData = ctx.getImageData(0, y, width, Math.min(sliceHeight, height - y));
      ctx.putImageData(imageData, offset, y);
    }
    applyPreviewEffect(ctx, { ...preset, renderer: "rgb_split", params: { ...params, splitDistance: amount * 0.4 } }, width, height, time);
  }

  if (preset.renderer === "scanlines" || preset.renderer === "glitch") {
    const count = Math.max(20, Number(params.scanlineCount ?? 120));
    const spacing = height / count;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.12 + intensity * 0.22})`;
    for (let y = 0; y < height; y += spacing) {
      ctx.fillRect(0, y, width, Math.max(1, spacing * 0.36));
    }
    ctx.restore();
  }

  if (preset.renderer === "film_grain" || preset.renderer === "glitch") {
    const amount = Math.max(0, Number(params.noiseAmount ?? 0.18)) * intensity;
    const seed = Math.floor(time * 30);
    ctx.save();
    for (let i = 0; i < width * height * amount * 0.015; i++) {
      const x = randomFrom(seed, i) * width;
      const y = randomFrom(seed, i + 500) * height;
      const alpha = 0.08 + randomFrom(seed, i + 900) * 0.18;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  if (preset.renderer === "vignette") {
    const radius = clamp(Number(params.radius ?? 0.75), 0.2, 1.2);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(radius, `rgba(0,0,0,${0.1 * intensity})`);
    gradient.addColorStop(1, `rgba(0,0,0,${0.75 * intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  if (preset.renderer === "glow") {
    const color = String(params.glowColor ?? "#00ffff");
    const radius = Number(params.glowRadius ?? 18) * intensity;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = color;
    ctx.shadowBlur = radius;
    ctx.globalAlpha = clamp(Number(params.glowIntensity ?? 0.8) * intensity, 0, 1);
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
}

function GeneratedPresetLivePreview({ preset, sampleFile }: { preset?: VideoEffectPresetSuggestion; sampleFile: File | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "recording" | "failed">("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const isVideo = !!sampleFile?.type.startsWith("video/");

  useEffect(() => {
    if (!sampleFile) {
      setSourceUrl(null);
      return;
    }
    const url = URL.createObjectURL(sampleFile);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sampleFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    const drawFallback = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#111827");
      gradient.addColorStop(0.5, "#7c3aed");
      gradient.addColorStop(1, "#06b6d4");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(canvas.width * 0.24, canvas.height * 0.18, canvas.width * 0.52, canvas.height * 0.64);
    };

    const draw = () => {
      const source = isVideo ? videoRef.current : imageRef.current;
      const ready = isVideo ? !!(videoRef.current && videoRef.current.readyState >= 2) : !!(imageRef.current?.complete && imageRef.current.naturalWidth);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (source && ready) {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      } else {
        drawFallback();
      }

      if (preset) applyPreviewEffect(ctx, preset, canvas.width, canvas.height, performance.now() / 1000);
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isVideo, preset, sourceUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl || !isVideo) return;
    video.play().catch(() => undefined);
  }, [isVideo, sourceUrl]);

  const handleExportWebM = () => {
    const canvas = canvasRef.current;
    if (!canvas || !preset) return;
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      setExportStatus("failed");
      setExportMessage("This browser cannot export canvas previews as WebM.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    setExportStatus("recording");
    setExportMessage(null);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      setExportStatus("failed");
      setExportMessage("Failed to export preview WebM.");
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${preset.id || "effect-preview"}.webm`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportStatus("idle");
      setExportMessage(`Exported ${link.download}`);
    };

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 3500);
  };

  return (
    <div className="rounded-xl border border-[#2A2A38] bg-[#09090D] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">Live Preview</p>
          <p className="truncate text-xs text-white">{preset ? `${preset.name} · ${preset.renderer}` : "Select a generated preset"}</p>
        </div>
        <button type="button" onClick={handleExportWebM} disabled={!preset || exportStatus === "recording"} className="flex shrink-0 items-center gap-1 rounded border border-[#2A2A38] bg-[#11111A] px-2 py-1 text-[10px] font-bold text-[#DADAE4] hover:text-white disabled:opacity-50">
          {exportStatus === "recording" ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
          {exportStatus === "recording" ? "Exporting" : "Export WebM"}
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={360} className="aspect-video w-full rounded-lg bg-black" />
      {sourceUrl && isVideo && <video ref={videoRef} src={sourceUrl} muted loop playsInline className="hidden" />}
      {sourceUrl && !isVideo && <img ref={imageRef} src={sourceUrl} alt="" className="hidden" />}
      {!sampleFile && <p className="mt-2 text-[10px] text-[#888899]">Upload a sample video or image to preview on your own footage.</p>}
      {exportMessage && <p className={`mt-2 text-[10px] ${exportStatus === "failed" ? "text-red-300" : "text-emerald-300"}`}>{exportMessage}</p>}
    </div>
  );
}

function PresetMiniPreview({ preset }: { preset: VideoEffectPresetSuggestion }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const seed = hashSeed(`${preset.id}:${preset.renderer}`);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.45, "#7c3aed");
    gradient.addColorStop(1, "#06b6d4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(width * 0.22, height * 0.18, width * 0.56, height * 0.64);

    if (preset.renderer === "pixelate") {
      const size = Math.max(4, Math.min(18, Number(preset.params.pixelSize ?? 12) / 2));
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          ctx.fillStyle = `hsla(${Math.floor(randomFrom(seed, x + y) * 360)}, 80%, ${35 + randomFrom(seed, x * y + 1) * 35}%, 0.55)`;
          ctx.fillRect(x, y, size + 1, size + 1);
        }
      }
    }

    if (preset.renderer === "glitch" || preset.renderer === "rgb_split" || preset.renderer === "chromatic_aberration") {
      const shift = Math.max(2, Number(preset.params.rgbSplit ?? preset.params.splitDistance ?? 8));
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,0,80,0.5)";
      ctx.fillRect(width * 0.2 - shift, height * 0.18, width * 0.56, height * 0.64);
      ctx.fillStyle = "rgba(0,255,255,0.42)";
      ctx.fillRect(width * 0.2 + shift, height * 0.18, width * 0.56, height * 0.64);
      ctx.globalCompositeOperation = "source-over";
    }

    if (preset.renderer === "glitch") {
      const slices = Math.max(2, Math.min(14, Number(preset.params.sliceCount ?? 8)));
      for (let i = 0; i < slices; i++) {
        const y = Math.floor(randomFrom(seed, i) * height);
        const sliceHeight = 2 + Math.floor(randomFrom(seed, i + 33) * 7);
        const offset = Math.floor((randomFrom(seed, i + 71) - 0.5) * 22);
        const imageData = ctx.getImageData(0, y, width, Math.min(sliceHeight, height - y));
        ctx.putImageData(imageData, offset, y);
      }
    }

    if (preset.renderer === "scanlines" || preset.renderer === "glitch") {
      const spacing = preset.renderer === "scanlines" ? 3 : 5;
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      for (let y = 0; y < height; y += spacing) {
        ctx.fillRect(0, y, width, 1);
      }
    }

    if (preset.renderer === "film_grain") {
      const amount = Math.max(40, Math.floor(Number(preset.params.noiseAmount ?? 0.2) * 500));
      for (let i = 0; i < amount; i++) {
        const x = randomFrom(seed, i) * width;
        const y = randomFrom(seed, i + 1000) * height;
        ctx.fillStyle = `rgba(255,255,255,${0.12 + randomFrom(seed, i + 2000) * 0.24})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    if (preset.renderer === "vignette") {
      const vignette = ctx.createRadialGradient(width / 2, height / 2, 4, width / 2, height / 2, width * 0.58);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(Number(preset.params.radius ?? 0.75), "rgba(0,0,0,0.18)");
      vignette.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }

    if (preset.renderer === "glow") {
      ctx.shadowColor = String(preset.params.glowColor ?? "#00ffff");
      ctx.shadowBlur = Number(preset.params.glowRadius ?? 18);
      ctx.fillStyle = String(preset.params.glowColor ?? "#00ffff");
      ctx.fillRect(width * 0.27, height * 0.25, width * 0.46, height * 0.5);
      ctx.shadowBlur = 0;
    }
  }, [preset]);

  return <canvas ref={canvasRef} width={112} height={64} className="h-16 w-28 shrink-0 rounded-md border border-[#2A2A38] bg-black object-cover" />;
}

export function VideoEffectPublishPanel() {
  const { publishVideoEffectPreset, publishVideoEffectPresetBatch } = useGitHubPublish();
  const [kind, setKind] = useState<VideoEffectPresetPublishPayload["kind"]>("video");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [renderer, setRenderer] = useState("glitch");
  const [paramsJson, setParamsJson] = useState(defaultParamsFor("glitch"));
  const [tagsInput, setTagsInput] = useState("video, effect");
  const [isPremium, setIsPremium] = useState(false);
  const [defaultIntensity, setDefaultIntensity] = useState("70");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [generatorRenderer, setGeneratorRenderer] = useState<GeneratorRenderer>("mixed");
  const [generatorCount, setGeneratorCount] = useState("20");
  const [generatorPrompt, setGeneratorPrompt] = useState("viral short-form glitch, VHS, cyberpunk, creator-friendly");
  const [generatedPresets, setGeneratedPresets] = useState<VideoEffectPresetSuggestion[]>([]);
  const [selectedGeneratedIds, setSelectedGeneratedIds] = useState<Set<string>>(new Set());
  const [activePreviewPresetId, setActivePreviewPresetId] = useState<string | null>(null);
  const [generatorSampleFile, setGeneratorSampleFile] = useState<File | null>(null);
  const [generatorStatus, setGeneratorStatus] = useState<"idle" | "generating" | "publishing" | "published" | "failed">("idle");
  const [generatorMessage, setGeneratorMessage] = useState<string | null>(null);
  const [generatorPrUrl, setGeneratorPrUrl] = useState<string | null>(null);

  const renderers = kind === "body" ? BODY_RENDERERS : VIDEO_RENDERERS;
  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );
  const selectedGeneratedPresets = useMemo(() => generatedPresets.filter((preset) => selectedGeneratedIds.has(preset.id)), [generatedPresets, selectedGeneratedIds]);
  const activePreviewPreset = useMemo(() => generatedPresets.find((preset) => preset.id === activePreviewPresetId) || generatedPresets[0], [activePreviewPresetId, generatedPresets]);

  const paramsError = useMemo(() => {
    try {
      JSON.parse(paramsJson);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid JSON";
    }
  }, [paramsJson]);

  const validationMessage = useMemo(() => {
    if (!id.trim()) return "Effect ID is required.";
    if (!name.trim()) return "Display name is required.";
    if (!renderer.trim()) return "Renderer is required.";
    if (paramsError) return `Params JSON is invalid: ${paramsError}`;
    const intensity = Number(defaultIntensity);
    if (!Number.isFinite(intensity) || intensity < 0 || intensity > 100) return "Default intensity must be between 0 and 100.";
    if (previewUrl.trim() && !/^https:\/\//i.test(previewUrl.trim())) return "Preview URL must use HTTPS.";
    return null;
  }, [defaultIntensity, id, name, paramsError, previewUrl, renderer]);

  const handleKindChange = (nextKind: VideoEffectPresetPublishPayload["kind"]) => {
    setKind(nextKind);
    const nextRenderer = nextKind === "body" ? BODY_RENDERERS[0] : VIDEO_RENDERERS[0];
    setRenderer(nextRenderer);
    setParamsJson(defaultParamsFor(nextRenderer));
    setTagsInput(nextKind === "body" ? "body, tracked, effect" : "video, effect");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!id) setId(toKebabId(value));
  };

  const handleRendererChange = (value: string) => {
    setRenderer(value);
    setParamsJson(defaultParamsFor(value));
  };

  const replaceGeneratedPreset = (id: string, patch: Partial<VideoEffectPresetSuggestion>) => {
    setGeneratedPresets((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const toggleGeneratedPreset = (id: string) => {
    setSelectedGeneratedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateLocalPresets = () => {
    const count = Math.round(clamp(Number(generatorCount), 1, 30));
    const presets = generateLocalPresets(generatorRenderer, count, generatorPrompt);
    setGeneratedPresets(presets);
    setSelectedGeneratedIds(new Set(presets.map((preset) => preset.id)));
    setActivePreviewPresetId(presets[0]?.id || null);
    setGeneratorStatus("idle");
    setGeneratorMessage(`Generated ${presets.length} local preset variations.`);
    setGeneratorPrUrl(null);
  };

  const handleGenerateAiPresets = async () => {
    setGeneratorStatus("generating");
    setGeneratorMessage(null);
    setGeneratorPrUrl(null);

    try {
      const count = Math.round(clamp(Number(generatorCount), 1, 30));
      const presets = await generateVideoEffectPresetSuggestions({
        prompt: generatorPrompt,
        renderer: generatorRenderer,
        count,
      });
      setGeneratedPresets(presets);
      setSelectedGeneratedIds(new Set(presets.map((preset) => preset.id)));
      setActivePreviewPresetId(presets[0]?.id || null);
      setGeneratorStatus("idle");
      setGeneratorMessage(`AI generated ${presets.length} compatible preset variations.`);
    } catch (error) {
      setGeneratorStatus("failed");
      setGeneratorMessage(error instanceof Error ? error.message : "AI preset generation failed.");
    }
  };

  const handlePublishGeneratedPresets = async () => {
    if (!selectedGeneratedPresets.length) return;
    setGeneratorStatus("publishing");
    setGeneratorMessage(null);
    setGeneratorPrUrl(null);

    try {
      const result = await publishVideoEffectPresetBatch({
        kind: "video",
        presets: selectedGeneratedPresets.map((preset) => ({
          id: preset.id,
          metadata: {
            name: preset.name,
            description: preset.description,
            category: "video",
            renderer: preset.renderer,
            params: preset.params,
            tags: preset.tags,
            isPremium: preset.isPremium || false,
            intensity: {
              min: 0,
              max: 100,
              default: preset.defaultIntensity,
              step: 1,
            },
          },
        })),
      });
      setGeneratorStatus("published");
      setGeneratorMessage(`Published ${selectedGeneratedPresets.length} presets on ${result.branch}.`);
      setGeneratorPrUrl(result.prUrl);
    } catch (error) {
      setGeneratorStatus("failed");
      setGeneratorMessage(error instanceof Error ? error.message : "Failed to publish generated presets.");
    }
  };

  const handlePublish = async () => {
    if (validationMessage) return;
    setStatus("publishing");
    setMessage(null);
    setPrUrl(null);

    try {
      const thumbnailDataUrl = thumbnailFile ? await fileToDataUrl(thumbnailFile) : undefined;
      const previewDataUrl = previewFile ? await fileToDataUrl(previewFile) : undefined;
      const intensityDefault = Number(defaultIntensity);
      const result = await publishVideoEffectPreset({
        id: id.trim(),
        kind,
        thumbnailDataUrl,
        previewFile: previewFile && previewDataUrl ? { name: previewFile.name, dataUrl: previewDataUrl } : undefined,
        metadata: {
          name: name.trim(),
          description: description.trim(),
          category: kind,
          renderer: renderer.trim(),
          params: JSON.parse(paramsJson),
          tags,
          isPremium,
          previewUrl: previewUrl.trim() || undefined,
          intensity: {
            min: 0,
            max: 100,
            default: intensityDefault,
            step: 1,
          },
          requirements:
            kind === "body"
              ? {
                  bodySegmentation: true,
                  minConfidence: 0.7,
                }
              : undefined,
        },
      });

      setStatus("published");
      setMessage(`Created ${result.files.length} files on ${result.branch}`);
      setPrUrl(result.prUrl);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Failed to publish effect preset");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 text-sm text-white">
      <div className="mb-4 rounded-xl border border-[#2A2A38] bg-[#15151C] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300">
            <Sparkles size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold">Publish Video &amp; Body Effect</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9A9AAA]">Create renderer preset JSON for the API endpoints consumed by the desktop Effects tab.</p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold text-white">
              <Wand2 size={14} className="text-violet-300" />
              Preset Generator
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">Generate compatible procedural video-effect presets, review them, then publish selected presets in one PR.</p>
          </div>
          <span className="rounded border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-200">Bulk</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Renderer">
            <select value={generatorRenderer} onChange={(event) => setGeneratorRenderer(event.target.value as GeneratorRenderer)} className={FIELD_INPUT_CLASS}>
              <option value="mixed">mixed</option>
              {VIDEO_RENDERERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Count">
            <input value={generatorCount} onChange={(event) => setGeneratorCount(event.target.value)} type="number" min={1} max={30} className={FIELD_INPUT_CLASS} />
          </Field>
        </div>

        <Field label="Creative Direction">
          <textarea value={generatorPrompt} onChange={(event) => setGeneratorPrompt(event.target.value)} rows={3} placeholder="viral short-form glitch, VHS, cyberpunk" className={`${FIELD_INPUT_CLASS} mt-3 resize-none`} />
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={handleGenerateLocalPresets} className="flex items-center gap-2 rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-bold text-white hover:bg-[#181824]">
            <Sparkles size={14} />
            Generate Local
          </button>
          <button type="button" onClick={handleGenerateAiPresets} disabled={generatorStatus === "generating"} className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">
            {generatorStatus === "generating" ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            Generate with AI
          </button>
          <button type="button" onClick={() => setSelectedGeneratedIds(new Set(generatedPresets.map((preset) => preset.id)))} disabled={!generatedPresets.length} className="rounded-lg border border-[#2A2A38] px-3 py-2 text-xs font-bold text-[#DADAE4] hover:text-white disabled:opacity-40">
            Select All
          </button>
          <button type="button" onClick={() => setSelectedGeneratedIds(new Set())} disabled={!generatedPresets.length} className="rounded-lg border border-[#2A2A38] px-3 py-2 text-xs font-bold text-[#DADAE4] hover:text-white disabled:opacity-40">
            Clear
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <Field label="Preview Sample">
            <input type="file" accept="video/webm,video/mp4,video/quicktime,image/png,image/jpeg,image/webp,.webm,.mp4,.mov,.png,.jpg,.jpeg,.webp" onChange={(event) => setGeneratorSampleFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
            {generatorSampleFile && <p className="mt-1 text-[10px] text-[#888899]">{generatorSampleFile.name}</p>}
          </Field>
          <GeneratedPresetLivePreview preset={activePreviewPreset} sampleFile={generatorSampleFile} />
        </div>

        {generatedPresets.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">{selectedGeneratedPresets.length} of {generatedPresets.length} selected</p>
              <button type="button" onClick={handlePublishGeneratedPresets} disabled={!selectedGeneratedPresets.length || generatorStatus === "publishing"} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                {generatorStatus === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                Publish Selected
              </button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {generatedPresets.map((preset) => {
                const selected = selectedGeneratedIds.has(preset.id);
                return (
                  <div key={preset.id} className={`rounded-lg border p-3 ${selected ? "border-violet-500/45 bg-violet-500/10" : "border-[#2A2A38] bg-[#09090D]"}`}>
                    <div className="flex items-start gap-2">
                      <button type="button" onClick={() => toggleGeneratedPreset(preset.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-violet-400 bg-violet-500 text-white" : "border-[#3A3A48] text-transparent"}`}>
                        <Check size={12} />
                      </button>
                      <PresetMiniPreview preset={preset} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <input value={preset.name} onChange={(event) => replaceGeneratedPreset(preset.id, { name: event.target.value, id: toKebabId(event.target.value) })} className="w-full bg-transparent text-xs font-bold text-white outline-none" />
                          <button type="button" onClick={() => setActivePreviewPresetId(preset.id)} className={`flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold ${activePreviewPreset?.id === preset.id ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-[#2A2A38] text-[#9A9AAA] hover:text-white"}`}>
                            <Eye size={11} />
                            Preview
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#9A9AAA]">
                          <span className="font-mono">{preset.id}</span>
                          <span>{preset.renderer}</span>
                          <span>{preset.defaultIntensity}%</span>
                        </div>
                        <textarea value={JSON.stringify(preset.params, null, 2)} onChange={(event) => {
                          try {
                            replaceGeneratedPreset(preset.id, { params: JSON.parse(event.target.value) });
                          } catch {
                            // Keep editing local text invalid states out of generated data.
                          }
                        }} rows={4} className="mt-2 w-full resize-none rounded border border-[#2A2A38] bg-black/30 p-2 font-mono text-[10px] text-[#DADAE4] outline-none focus:border-violet-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {generatorMessage && (
          <div className={`mt-3 rounded-lg border p-3 text-xs ${generatorStatus === "failed" ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-green-500/25 bg-green-500/10 text-green-200"}`}>
            <p>{generatorMessage}</p>
            {generatorPrUrl && (
              <a href={generatorPrUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-violet-200 underline">
                Open pull request
              </a>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["video", "body"] as const).map((item) => (
            <button key={item} type="button" onClick={() => handleKindChange(item)} className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize transition-colors ${kind === item ? "border-violet-500 bg-violet-500/20 text-violet-100" : "border-[#2A2A38] bg-[#09090D] text-[#9A9AAA] hover:text-white"}`}>
              {item} effect
            </button>
          ))}
        </div>

        <Field label="Effect Name" required>
          <input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Cyber Body Glow" className={FIELD_INPUT_CLASS} />
        </Field>

        <Field label="Effect ID" required>
          <input value={id} onChange={(event) => setId(toKebabId(event.target.value))} placeholder="cyber-body-glow" className={`${FIELD_INPUT_CLASS} font-mono`} />
        </Field>

        <Field label="Renderer" required>
          <select value={renderer} onChange={(event) => handleRendererChange(event.target.value)} className={FIELD_INPUT_CLASS}>
            {renderers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Short description shown in the desktop effect browser" className={`${FIELD_INPUT_CLASS} resize-none`} />
        </Field>

        <Field label="Renderer Params JSON">
          <textarea value={paramsJson} onChange={(event) => setParamsJson(event.target.value)} rows={7} className={`${FIELD_INPUT_CLASS} resize-none font-mono`} />
          {paramsError && <p className="mt-1 text-[10px] text-red-400">{paramsError}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Default Intensity">
            <input value={defaultIntensity} onChange={(event) => setDefaultIntensity(event.target.value)} type="number" min={0} max={100} className={FIELD_INPUT_CLASS} />
          </Field>
          <Field label="Premium">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 text-xs text-[#DADAE4]">
              <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} />
              Premium effect
            </label>
          </Field>
        </div>

        <Field label="Tags">
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="body, glow, aura" className={FIELD_INPUT_CLASS} />
        </Field>

        <Field label="Preview Video">
          <input type="file" accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov" onChange={(event) => setPreviewFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
          {previewFile && <p className="mt-1 text-[10px] text-[#888899]">{previewFile.name}</p>}
        </Field>

        <Field label="Preview URL fallback">
          <input value={previewUrl} onChange={(event) => setPreviewUrl(event.target.value)} placeholder="Optional HTTPS URL if no local preview file is selected" className={FIELD_INPUT_CLASS} />
        </Field>

        <Field label="Thumbnail">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
        </Field>

        {validationMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{validationMessage}</span>
          </div>
        )}

        {message && (
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${status === "failed" ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-green-500/25 bg-green-500/10 text-green-200"}`}>
            {status === "failed" ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle size={14} className="mt-0.5 shrink-0" />}
            <div>
              <p>{message}</p>
              {prUrl && (
                <a href={prUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-violet-200 underline">
                  Open pull request
                </a>
              )}
            </div>
          </div>
        )}

        <button type="button" disabled={!!validationMessage || status === "publishing"} onClick={handlePublish} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
          {status === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {status === "publishing" ? "Publishing..." : "Publish via GitHub PR"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
