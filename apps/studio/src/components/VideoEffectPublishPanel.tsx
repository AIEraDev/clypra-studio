import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Download, Loader2, Sparkles, UploadCloud, Wand2 } from "lucide-react";
import { useGitHubPublish, type VideoEffectPresetPublishPayload } from "../hooks/useGitHubPublish";
import { generateVideoOrBodyEffectPresetSuggestion, type VideoEffectPresetSuggestion } from "../services/geminiService";

const VIDEO_RENDERERS = ["glitch", "rgb_split", "chromatic_aberration", "pixelate", "scanlines", "film_grain", "vignette", "glow"];
const BODY_RENDERERS = ["body-segmentation-glow", "body_glow", "body_outline", "body_particles"];
const FIELD_INPUT_CLASS = "w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-violet-500";

type EffectKind = "video" | "body";
type ExportedPreviewFile = { name: string; dataUrl: string };

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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
      ctx.fillStyle = `rgba(255,255,255,${0.08 + randomFrom(seed, i + 900) * 0.18})`;
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

  if (preset.renderer.startsWith("body")) {
    const centerX = width / 2;
    const centerY = height * 0.52;
    const bodyWidth = width * 0.26;
    const bodyHeight = height * 0.52;
    const glowColor = String(params.glowColor ?? params.outlineColor ?? params.particleColor ?? "#00ffff");
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
    if (preset.renderer === "body_outline") {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = Math.max(2, Number(params.outlineWidth ?? 8) * intensity);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = Number(params.feather ?? 10);
      ctx.stroke();
    } else if (preset.renderer === "body_particles") {
      const seed = hashSeed(preset.id);
      ctx.fillStyle = glowColor;
      for (let i = 0; i < Math.min(120, Number(params.particleCount ?? 80)); i++) {
        const angle = randomFrom(seed, i) * Math.PI * 2;
        const radius = 0.75 + randomFrom(seed, i + 100) * 0.45;
        const drift = Math.sin(time + i) * Number(params.drift ?? 8);
        const x = centerX + Math.cos(angle) * bodyWidth * radius + drift;
        const y = centerY + Math.sin(angle) * bodyHeight * radius;
        ctx.globalAlpha = 0.25 + intensity * 0.55;
        ctx.beginPath();
        ctx.arc(x, y, Number(params.particleSize ?? 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 12 * intensity;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = Number(params.glowRadius ?? 24) * intensity;
      ctx.globalAlpha = clamp(Number(params.glowIntensity ?? 0.9) * intensity, 0, 1);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function GeneratedPresetLivePreview({ preset, sampleFile, onPreviewExported }: { preset?: VideoEffectPresetSuggestion; sampleFile: File | null; onPreviewExported: (file: ExportedPreviewFile) => void }) {
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
      if (source && ready) ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      else drawFallback();

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
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: "video/webm" });
      const fileName = `${preset.id || "effect-preview"}.webm`;
      const dataUrl = await blobToDataUrl(blob);
      onPreviewExported({ name: fileName, dataUrl });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportStatus("idle");
      setExportMessage(`Exported and attached ${fileName}`);
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">Test Result</p>
          <p className="truncate text-xs text-white">{preset ? `${preset.name} · ${preset.renderer}` : "Generate an effect first"}</p>
        </div>
        <button type="button" onClick={handleExportWebM} disabled={!preset || exportStatus === "recording"} className="flex shrink-0 items-center gap-1 rounded border border-[#2A2A38] bg-[#11111A] px-2 py-1 text-[10px] font-bold text-[#DADAE4] hover:text-white disabled:opacity-50">
          {exportStatus === "recording" ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
          {exportStatus === "recording" ? "Exporting" : "Export WebM"}
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={360} className="aspect-video w-full rounded-lg bg-black" />
      {sourceUrl && isVideo && <video ref={videoRef} src={sourceUrl} muted loop playsInline className="hidden" />}
      {sourceUrl && !isVideo && <img ref={imageRef} src={sourceUrl} alt="" className="hidden" />}
      {!sampleFile && <p className="mt-2 text-[10px] text-[#888899]">Upload a sample clip or image to test the generated effect before publishing.</p>}
      {exportMessage && <p className={`mt-2 text-[10px] ${exportStatus === "failed" ? "text-red-300" : "text-emerald-300"}`}>{exportMessage}</p>}
    </div>
  );
}

export function VideoEffectPublishPanel({ variant = "drawer" }: { variant?: "drawer" | "workspace" }) {
  const { publishVideoEffectPreset } = useGitHubPublish();
  const isWorkspace = variant === "workspace";
  const [kind, setKind] = useState<EffectKind>("video");
  const [rendererChoice, setRendererChoice] = useState("auto");
  const [prompt, setPrompt] = useState("VHS cyber glitch for viral short-form edits");
  const [generatedPreset, setGeneratedPreset] = useState<VideoEffectPresetSuggestion | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [exportedPreviewFile, setExportedPreviewFile] = useState<ExportedPreviewFile | null>(null);
  const [manualPreviewFile, setManualPreviewFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "publishing" | "published" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const renderers = kind === "body" ? BODY_RENDERERS : VIDEO_RENDERERS;
  const paramsJson = useMemo(() => JSON.stringify(generatedPreset?.params || {}, null, 2), [generatedPreset]);
  const generatedTags = generatedPreset?.tags.join(", ") || "";
  const canPublish = !!generatedPreset && status !== "generating" && status !== "publishing";

  const handleKindChange = (nextKind: EffectKind) => {
    setKind(nextKind);
    setRendererChoice("auto");
    setGeneratedPreset(null);
    setExportedPreviewFile(null);
    setMessage(null);
    setPrUrl(null);
  };

  const handleGenerate = async () => {
    setStatus("generating");
    setMessage(null);
    setPrUrl(null);
    setExportedPreviewFile(null);

    try {
      const preset = await generateVideoOrBodyEffectPresetSuggestion({
        kind,
        prompt,
        renderer: rendererChoice,
      });
      setGeneratedPreset(preset);
      setStatus("idle");
      setMessage(`Generated ${preset.name}. Test it on sample media before publishing.`);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "AI effect generation failed.");
    }
  };

  const handlePublish = async () => {
    if (!generatedPreset) return;
    setStatus("publishing");
    setMessage(null);
    setPrUrl(null);

    try {
      const thumbnailDataUrl = thumbnailFile ? await fileToDataUrl(thumbnailFile) : undefined;
      const manualPreviewDataUrl = manualPreviewFile ? await fileToDataUrl(manualPreviewFile) : undefined;
      const result = await publishVideoEffectPreset({
        id: generatedPreset.id,
        kind,
        thumbnailDataUrl,
        previewFile: exportedPreviewFile || (manualPreviewFile && manualPreviewDataUrl ? { name: manualPreviewFile.name, dataUrl: manualPreviewDataUrl } : undefined),
        metadata: {
          name: generatedPreset.name,
          description: generatedPreset.description,
          category: kind,
          renderer: generatedPreset.renderer,
          params: generatedPreset.params,
          tags: generatedPreset.tags,
          isPremium: generatedPreset.isPremium || false,
          previewUrl: previewUrl.trim() || undefined,
          intensity: {
            min: 0,
            max: 100,
            default: generatedPreset.defaultIntensity,
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
      setMessage(`Created ${result.files.length} files on ${result.branch}.`);
      setPrUrl(result.prUrl);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Failed to publish effect preset.");
    }
  };

  return (
    <div className={`h-full overflow-y-auto text-sm text-white ${isWorkspace ? "p-6" : "p-4"}`}>
      <div className={`${isWorkspace ? "mb-5 border-b border-[#20202A] pb-5" : "mb-4 rounded-xl border border-[#2A2A38] bg-[#15151C] p-4"}`}>
        <div className="flex items-start gap-3">
          <span className={`${isWorkspace ? "h-11 w-11" : "h-9 w-9"} flex shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300`}>
            <Sparkles size={isWorkspace ? 20 : 16} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Effects Lab</p>
            <h3 className={`${isWorkspace ? "text-xl" : "text-sm"} font-bold`}>Generate one effect, test it, then publish</h3>
            <p className={`${isWorkspace ? "max-w-3xl text-sm" : "text-xs"} mt-1 leading-relaxed text-[#9A9AAA]`}>Describe the effect you want. AI creates one compatible video/body preset, Studio previews it on your sample media, then publishes it with optional preview and thumbnail assets.</p>
          </div>
        </div>
      </div>

      <div className={isWorkspace ? "grid grid-cols-[360px_minmax(0,1fr)_390px] items-start gap-5 max-[1260px]:grid-cols-[340px_minmax(0,1fr)] max-[920px]:grid-cols-1" : "space-y-4"}>
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
          <StepHeader step="1" title="Generate with AI" description="Choose video or body, then describe the visual result." />

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["video", "body"] as const).map((item) => (
              <button key={item} type="button" onClick={() => handleKindChange(item)} className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize transition-colors ${kind === item ? "border-violet-500 bg-violet-500/20 text-violet-100" : "border-[#2A2A38] bg-[#09090D] text-[#9A9AAA] hover:text-white"}`}>
                {item} effect
              </button>
            ))}
          </div>

          <div className="mt-4">
            <Field label="Renderer">
              <select value={rendererChoice} onChange={(event) => setRendererChoice(event.target.value)} className={FIELD_INPUT_CLASS}>
                <option value="auto">AI chooses best renderer</option>
                {renderers.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Effect Description">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={6} placeholder="Example: glowing neon outline around a dancer with electric particles" className={`${FIELD_INPUT_CLASS} resize-none`} />
            </Field>
          </div>

          <button type="button" onClick={handleGenerate} disabled={!prompt.trim() || status === "generating"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">
            {status === "generating" ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {generatedPreset ? "Regenerate Effect" : "Generate Effect"}
          </button>

          {generatedPreset && (
            <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Generated</p>
              <p className="mt-1 text-sm font-bold text-white">{generatedPreset.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">{generatedPreset.description}</p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
          <StepHeader step="2" title="Test before publishing" description="Upload any local clip or image. Nothing is uploaded until you publish." />
          <div className="mt-4">
            <Field label="Sample Media">
              <input type="file" accept="video/webm,video/mp4,video/quicktime,image/png,image/jpeg,image/webp,.webm,.mp4,.mov,.png,.jpg,.jpeg,.webp" onChange={(event) => setSampleFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
              {sampleFile && <p className="mt-1 text-[10px] text-[#888899]">{sampleFile.name}</p>}
            </Field>
          </div>
          <div className="mt-4">
            <GeneratedPresetLivePreview preset={generatedPreset || undefined} sampleFile={sampleFile} onPreviewExported={setExportedPreviewFile} />
          </div>
          <div className="mt-4 rounded-lg border border-[#2A2A38] bg-[#09090D] p-3 text-xs text-[#9A9AAA]">
            <p className="font-bold text-white">First-time flow</p>
            <p className="mt-1">Generate an effect, upload a short test clip, inspect the result, then click Export WebM to attach a marketplace preview automatically.</p>
          </div>
        </section>

        <section className={`${isWorkspace ? "sticky top-0 max-h-[calc(100vh-140px)] overflow-y-auto max-[1260px]:col-span-2 max-[920px]:col-span-1" : ""} rounded-xl border border-[#2A2A38] bg-[#101018] p-4`}>
          <StepHeader step="3" title="Review and publish" description="Generated metadata is editable after publishing through the PR." />

          <div className="mt-4 space-y-4">
            <Field label="Effect Name">
              <input value={generatedPreset?.name || ""} readOnly placeholder="Generated by AI" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Effect ID">
              <input value={generatedPreset?.id || ""} readOnly placeholder="generated-effect-id" className={`${FIELD_INPUT_CLASS} font-mono`} />
            </Field>
            <Field label="Renderer">
              <input value={generatedPreset?.renderer || ""} readOnly placeholder="Generated renderer" className={`${FIELD_INPUT_CLASS} font-mono`} />
            </Field>
            <Field label="Params JSON">
              <textarea value={paramsJson} readOnly rows={7} className={`${FIELD_INPUT_CLASS} resize-none font-mono`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Intensity">
                <input value={generatedPreset?.defaultIntensity ?? ""} readOnly className={FIELD_INPUT_CLASS} />
              </Field>
              <Field label="Premium">
                <input value={generatedPreset?.isPremium ? "Yes" : "No"} readOnly className={FIELD_INPUT_CLASS} />
              </Field>
            </div>
            <Field label="Tags">
              <input value={generatedTags} readOnly placeholder="Generated tags" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Preview Video">
              <input type="file" accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov" onChange={(event) => {
                setManualPreviewFile(event.target.files?.[0] || null);
                setExportedPreviewFile(null);
              }} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
              {exportedPreviewFile && <p className="mt-1 text-[10px] text-emerald-300">Attached exported preview: {exportedPreviewFile.name}</p>}
              {manualPreviewFile && <p className="mt-1 text-[10px] text-[#888899]">{manualPreviewFile.name}</p>}
            </Field>
            <Field label="Preview URL fallback">
              <input value={previewUrl} onChange={(event) => setPreviewUrl(event.target.value)} placeholder="Optional HTTPS URL if no preview file is selected" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Thumbnail">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-100" />
              {thumbnailFile && <p className="mt-1 text-[10px] text-[#888899]">{thumbnailFile.name}</p>}
            </Field>
          </div>

          {message && (
            <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs ${status === "failed" ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-green-500/25 bg-green-500/10 text-green-200"}`}>
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

          <button type="button" disabled={!canPublish} onClick={handlePublish} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {status === "publishing" ? "Publishing..." : "Publish Effect"}
          </button>
        </section>
      </div>
    </div>
  );
}

function StepHeader({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-xs font-black text-white">{step}</span>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">{description}</p>
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
