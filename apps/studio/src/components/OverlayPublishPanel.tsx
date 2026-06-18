import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Video, Sparkles, UploadCloud } from "lucide-react";
import type { OverlayPublishPayload } from "../types/publish";

const OVERLAY_CATEGORIES: OverlayPublishPayload["category"][] = ["fire", "light-leak", "particle", "weather", "glitch", "texture"];
const BLEND_MODES: OverlayPublishPayload["metadata"]["blendMode"][] = ["normal", "screen", "multiply", "overlay", "soft-light", "hard-light", "color-dodge", "color-burn", "lighten", "darken", "difference"];

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

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video duration"));
    };
    video.src = objectUrl;
  });
}

async function extractThumbnailFromVideo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration / 2, 1); // Seek to 1 second or midpoint
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to extract thumbnail"));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read thumbnail blob"));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.85,
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load video for thumbnail extraction"));
    };

    video.src = objectUrl;
  });
}

export function OverlayPublishPanel() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<OverlayPublishPayload["category"]>("fire");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [duration, setDuration] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [blendMode, setBlendMode] = useState<OverlayPublishPayload["metadata"]["blendMode"]>("screen");
  const [opacity, setOpacity] = useState("1.0");
  const [loopable, setLoopable] = useState(true);
  const [sourceProvider, setSourceProvider] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const validationMessage = useMemo(() => {
    if (!videoFile) return "Choose a video file.";
    if (!id.trim()) return "Asset ID is required.";
    if (!name.trim()) return "Display name is required.";
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) return "Duration must be greater than zero.";
    if (!Number.isFinite(Number(width)) || Number(width) <= 0) return "Width must be greater than zero.";
    if (!Number.isFinite(Number(height)) || Number(height) <= 0) return "Height must be greater than zero.";
    if (!Number.isFinite(Number(opacity)) || Number(opacity) < 0 || Number(opacity) > 1) return "Opacity must be between 0 and 1.";
    if (!sourceProvider.trim() || !sourceUrl.trim()) return "Source provider and source URL are required.";
    if (!/^https:\/\//i.test(sourceUrl.trim())) return "Source URL must use HTTPS.";

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return `Video file is too large (${(videoFile.size / 1024 / 1024).toFixed(2)}MB). Maximum is 100MB.`;
    }

    return null;
  }, [videoFile, id, name, duration, width, height, opacity, sourceProvider, sourceUrl]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!id) setId(toKebabId(value));
  };

  const handleVideoFileChange = async (file: File | null) => {
    setVideoFile(file);
    setAutoThumbnail(null);
    setThumbnailFile(null);

    if (!file) return;

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (!name) setName(baseName);
    if (!id) setId(toKebabId(baseName));

    try {
      const seconds = await readVideoDuration(file);
      if (seconds > 0 && !duration) {
        setDuration(String(Math.round(seconds * 100) / 100));
      }

      // Extract dimensions from video
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        if (!width) setWidth(String(video.videoWidth));
        if (!height) setHeight(String(video.videoHeight));
        URL.revokeObjectURL(objectUrl);
      };
      video.src = objectUrl;

      // Auto-extract thumbnail
      const thumb = await extractThumbnailFromVideo(file);
      setAutoThumbnail(thumb);
    } catch (error) {
      console.warn("Failed to read video metadata:", error);
      // Continue - user can enter manually
    }
  };

  const handlePublish = async () => {
    if (validationMessage || !videoFile) return;
    setStatus("publishing");
    setMessage(null);
    setPrUrl(null);

    try {
      const videoDataUrl = await fileToDataUrl(videoFile);
      const thumbnailDataUrl = thumbnailFile ? await fileToDataUrl(thumbnailFile) : autoThumbnail || undefined;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";

      const payload: OverlayPublishPayload = {
        id: id.trim(),
        name: name.trim(),
        category,
        description: description.trim(),
        tags,
        videoFile: {
          name: videoFile.name,
          dataUrl: videoDataUrl,
        },
        thumbnailDataUrl,
        metadata: {
          duration: Number(duration),
          width: Number(width),
          height: Number(height),
          fps: 30,
          loopable,
          blendMode,
        },
      };

      const response = await fetch(`${API_BASE_URL}/overlays/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setStatus("published");
      setMessage(result.message || "Overlay uploaded to R2 successfully!");
      setPrUrl(null);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Failed to publish overlay");
    }
  };

  return (
    <div className="border-b border-(--studio-border) p-3 space-y-3">
      <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-200">
          <Video size={14} />
          Animated Overlay Library
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-violet-100/70">Publish only video overlays you own or have a license to distribute. Approved files become available in Clypra for timeline compositing.</p>
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">Video File (WebM, MP4, MOV)</label>
      <input type="file" accept="video/webm,video/mp4,video/quicktime,.webm,.mp4,.mov" onChange={(event) => void handleVideoFileChange(event.target.files?.[0] || null)} className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white" />

      {videoFile && (
        <div className="text-[10px] text-(--studio-muted)">
          File size: {(videoFile.size / 1024 / 1024).toFixed(2)} MB {videoFile.size > 100 * 1024 * 1024 && <span className="text-red-400 ml-2">⚠️ Exceeds 100MB limit</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Name" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
        <input value={id} onChange={(event) => setId(toKebabId(event.target.value))} placeholder="asset-id" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] font-mono text-white outline-none focus:border-violet-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={category} onChange={(event) => setCategory(event.target.value as OverlayPublishPayload["category"])} className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500">
          {OVERLAY_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Duration seconds" inputMode="decimal" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input value={width} onChange={(event) => setWidth(event.target.value)} placeholder="Width px" inputMode="numeric" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
        <input value={height} onChange={(event) => setHeight(event.target.value)} placeholder="Height px" inputMode="numeric" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
      </div>

      <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" rows={2} className="w-full resize-none rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
      <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="tags, comma, separated" className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />

      <div className="grid grid-cols-2 gap-2">
        <select value={blendMode} onChange={(event) => setBlendMode(event.target.value as OverlayPublishPayload["metadata"]["blendMode"])} className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500">
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <input value={opacity} onChange={(event) => setOpacity(event.target.value)} placeholder="Opacity 0.0-1.0" inputMode="decimal" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
      </div>

      <label className="flex items-center gap-2 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white">
        <input type="checkbox" checked={loopable} onChange={(event) => setLoopable(event.target.checked)} />
        Loopable
      </label>

      <div className="grid grid-cols-2 gap-2">
        <input value={sourceProvider} onChange={(event) => setSourceProvider(event.target.value)} placeholder="Source provider" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
        <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://source.example/item" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">Thumbnail (Optional - auto-extracted if not provided)</label>
      {autoThumbnail && !thumbnailFile && <div className="text-[10px] text-green-400 mb-1">✓ Thumbnail auto-extracted from video</div>}
      <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)} className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white" />

      <textarea value={safetyNotes} onChange={(event) => setSafetyNotes(event.target.value)} placeholder="Review notes, copyright confirmation, source notes" rows={2} className="w-full resize-none rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-violet-500" />

      {validationMessage && (
        <div className="flex items-start gap-2 rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-200">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{validationMessage}</span>
        </div>
      )}

      {message && (
        <div className={`flex items-start gap-2 rounded border p-2 text-[10px] ${status === "failed" ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-violet-500/20 bg-violet-500/10 text-violet-200"}`}>
          {status === "failed" ? <AlertTriangle size={12} className="mt-0.5 shrink-0" /> : <CheckCircle size={12} className="mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {prUrl && (
        <a href={prUrl} target="_blank" rel="noreferrer" className="block rounded border border-(--studio-border) bg-(--studio-control) px-3 py-2 text-center text-[11px] font-semibold text-white hover:bg-(--studio-hover)">
          Open Pull Request
        </a>
      )}

      <button type="button" onClick={handlePublish} disabled={!!validationMessage || status === "publishing"} className="flex w-full items-center justify-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/15 px-3 py-2 text-[12px] font-semibold text-violet-200 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50">
        {status === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        Publish Overlay to API
      </button>
    </div>
  );
}
