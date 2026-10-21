import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Upload,
  Save,
  Sparkles,
  Check,
  Share2,
  Shield,
  ListChecks,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  TextAnimationPreset,
  AnimationPhase,
} from "../../types/animation";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { getStudioApiBaseUrl } from "../../services/apiConfig";
import { getStoredAuthToken } from "../../services/authSession";
import { STARTER_ANIMATION_PRESETS } from "./data/starterPresets";
import { AnimationPresetBrowser } from "./components/AnimationPresetBrowser";
import { AnimationPreviewStage } from "./components/AnimationPreviewStage";
import { AnimationTimeline } from "./components/AnimationTimeline";
import { AnimationInspector } from "./components/AnimationInspector";
import { AnimationCatalogStatusModal } from "./components/AnimationCatalogStatusModal";
import {
  AnimationPublishModal,
  type PublishPayload,
} from "./components/AnimationPublishModal";
import { useAnimationR2Upload } from "../../hooks/useAnimationR2Upload";
import {
  captureAnimationThumbnail,
  captureAnimationVideo,
} from "./services/canvasCapture";

const STORAGE_KEY = "clypra_studio_animation_presets_v1";

function withoutLegacyDiamondFlag(
  preset: TextAnimationPreset,
): TextAnimationPreset {
  const { isPro: _removed, ...cleanPreset } = preset as TextAnimationPreset & {
    isPro?: unknown;
  };
  return cleanPreset;
}

function mergeStarterPresets(
  savedPresets: TextAnimationPreset[],
): TextAnimationPreset[] {
  const sanitizedPresets = savedPresets.map(withoutLegacyDiamondFlag);
  const savedById = new Map(
    sanitizedPresets.map((preset) => [preset.id, preset]),
  );
  const starterIds = new Set(
    STARTER_ANIMATION_PRESETS.map((preset) => preset.id),
  );

  // Preserve a creator's edits to existing presets while adding newly shipped
  // presets to an older browser draft. Custom presets stay at the end.
  return [
    ...STARTER_ANIMATION_PRESETS.map(
      (starter) => savedById.get(starter.id) ?? starter,
    ),
    ...sanitizedPresets.filter((preset) => !starterIds.has(preset.id)),
  ];
}

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Convert a browser File object to a base64 data URL.
 * Used to serialise binary uploads into the JSON body sent to the API.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export const AnimationLabWorkspace: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { uploadAnimationPreset } = useAnimationR2Upload();
  // Load custom drafts or initialize with starter presets
  const [presets, setPresets] = useState<TextAnimationPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0)
          return mergeStarterPresets(parsed);
      }
    } catch (_) {}
    return STARTER_ANIMATION_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>(
    presets[0]?.id ?? "anim-in-typewriter",
  );
  const [sampleText, setSampleText] = useState("ABC123");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // ── Canvas-capture state (FEAT-002) ──
  // Holds a ref to the stage's canvas container so we can drive captureAnimationThumbnail.
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [capturedThumbnail, setCapturedThumbnail] = useState<File | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const activePreset =
    presets.find((p) => p.id === activePresetId) ??
    presets[0] ??
    STARTER_ANIMATION_PRESETS[0];

  const duration = activePreset.defaultDuration || 0.6;

  // ── Animation Playhead Loop ──
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const step = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          // Auto-loop when duration exceeded
          if (next >= duration) {
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, duration]);

  // Persist to local storage on changes
  const handleUpdatePreset = (updated: TextAnimationPreset) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === updated.id ? { ...updated, updatedAt: Date.now() } : p,
      ),
    );
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      toast.success(`Saved "${activePreset.name}" to local drafts!`);
    } catch (err) {
      toast.error("Failed to save drafts to browser storage.");
    }
  };

  const handleNewPreset = (phase: AnimationPhase) => {
    const id = `anim-${phase}-custom-${Date.now().toString(36)}`;
    const newPreset: TextAnimationPreset = {
      id,
      name: `Custom ${phase.toUpperCase()} ${presets.length + 1}`,
      phase,
      category: "Basic",
      tags: ["custom", phase],
      defaultDuration: 0.5,
      minDuration: 0.1,
      maxDuration: 4.0,
      previewLoopDuration: 1.2,
      thumbnailUrl: "",
      version: 1,
      createdAt: Date.now(),
      tracks: [
        {
          property: "opacity",
          keyframes: [
            { progress: 0.0, value: phase === "out" ? 1 : 0 },
            { progress: 1.0, value: phase === "out" ? 0 : 1 },
          ],
        },
      ],
    };

    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(id);
    setCurrentTime(0);
    toast.info(`Created new ${phase.toUpperCase()} animation preset.`);
  };

  const handleDuplicatePreset = (target: TextAnimationPreset) => {
    const duplicated: TextAnimationPreset = {
      ...target,
      id: `${target.id}-copy-${Date.now().toString(36)}`,
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
    };
    setPresets((prev) => [duplicated, ...prev]);
    setActivePresetId(duplicated.id);
    toast.info(`Duplicated "${target.name}".`);
  };

  const handleDeletePreset = (id: string) => {
    if (presets.length <= 1) {
      toast.error("Cannot delete the only remaining preset.");
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) {
      const remaining = presets.filter((p) => p.id !== id);
      setActivePresetId(remaining[0]?.id ?? "");
    }
    toast.info("Preset deleted.");
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(activePreset, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${activePreset.id}.json`);
    dlAnchor.click();
    toast.success(`Exported ${activePreset.name} as JSON.`);
  };

  const publishPreset = async (
    preset: TextAnimationPreset,
  ): Promise<TextAnimationPreset | null> => {
    if (!isAdmin) {
      toast.error(
        "Admin access required. Only administrators can publish animation presets.",
      );
      return null;
    }

    if (!preset.name.trim()) {
      toast.error("Preset name cannot be empty.");
      return null;
    }
    if (preset.tracks.length === 0) {
      toast.error("Preset must have at least one animated property track.");
      return null;
    }

    const token = getStoredAuthToken();
    try {
      const response = await fetch(`${getStudioApiBaseUrl()}/text-animations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(preset),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.error || `Publication failed (${response.status})`,
        );
      }

      const publishedPreset = (result.preset ?? preset) as TextAnimationPreset;
      setPresets((current) => {
        const next = current.map((candidate) =>
          candidate.id === publishedPreset.id ? publishedPreset : candidate,
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      toast.success(
        `Published "${publishedPreset.name}" to the Animation API.`,
      );
      return publishedPreset;
    } catch (publishError) {
      toast.error(
        publishError instanceof Error
          ? publishError.message
          : "Unable to publish the animation preset.",
      );
      return null;
    }
  };

  const handlePublish = async () => {
    if (!isAdmin) {
      toast.error(
        "Admin access required. Only administrators can publish animation presets.",
      );
      return;
    }

    setIsCapturing(true);
    try {
      // Capture thumbnail (DOM → canvas → PNG) and video in parallel.
      // captureAnimationVideo returns null when MediaRecorder is unavailable —
      // the modal gracefully accepts null and lets the user upload manually.
      const [thumb, vid] = await Promise.all([
        stageContainerRef.current
          ? captureAnimationThumbnail(stageContainerRef.current)
          : Promise.resolve(null),
        captureAnimationVideo(activePreset, sampleText, duration),
      ]);
      setCapturedThumbnail(thumb);
      setCapturedVideo(vid);
    } catch {
      toast.error(
        "Failed to capture preview assets. You can still upload manually.",
      );
      setCapturedThumbnail(null);
      setCapturedVideo(null);
    } finally {
      setIsCapturing(false);
    }

    setIsPublishModalOpen(true);
  };

  const handlePublishConfirm = async (payload: PublishPayload) => {
    setIsPublishModalOpen(false);

    // ── 1. Convert browser File objects to base64 data URLs ───────────────
    // The API accepts base64 data URLs in the JSON body — consistent with the
    // text-effects and filters publish flows — so no separate multipart upload
    // is needed.
    const [thumbnailDataUrl, previewVideoDataUrl] = await Promise.all([
      fileToDataUrl(payload.thumbnailFile),
      fileToDataUrl(payload.videoFile),
    ]);

    // ── 2. Extract the video file extension from the file name ────────────
    const videoExtMatch = payload.videoFile.name.match(/\.(mp4|webm)$/i);
    const previewVideoExt =
      (videoExtMatch?.[1]?.toLowerCase() as "mp4" | "webm") ?? "mp4";

    // ── 3. Enrich the preset with the selected category ───────────────────
    const presetWithMeta: TextAnimationPreset = {
      ...payload.preset,
      category: payload.category,
      // thumbnailUrl and previewVideoUrl will be patched in by the API
      // after it writes the binaries to R2 and derives the public URLs.
    };

    // ── 4. Upload via hook: preset JSON + media binaries → API → R2 ───────
    try {
      const result = await uploadAnimationPreset({
        preset: presetWithMeta,
        thumbnailDataUrl,
        previewVideoDataUrl,
        previewVideoExt,
      });

      // Reflect the API-returned preset (with populated media URLs) in the
      // local preset list so the browser card updates without a full reload.
      if (result?.preset) {
        setPresets((current) => {
          const next = current.map((candidate) =>
            candidate.id === result.preset.id ? result.preset : candidate,
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      // Errors are surfaced as toasts by the hook; nothing more to do here.
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0B0B10]">
      {/* ── Sub-Header: Studio Actions ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">
            <Shield size={12} />
            <span>Admin Only</span>
          </span>
          <span className="text-xs text-[var(--studio-muted)]">
            Active: <strong className="text-white">{activePreset.name}</strong>{" "}
            ({activePreset.phase})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[var(--studio-accent)]"
          >
            <ListChecks size={13} />
            <span>API Catalog</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[var(--studio-accent)]"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-[var(--studio-accent)]"
          >
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={!isAdmin || isCapturing}
            title={
              !isAdmin
                ? "Administrator access required to publish presets"
                : undefined
            }
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-transform ${
              isAdmin && !isCapturing
                ? "bg-[var(--studio-accent)] text-black hover:scale-105"
                : "cursor-not-allowed bg-gray-800 text-gray-500"
            }`}
          >
            {isCapturing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Capturing…</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Publish Preset</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main 3-Pane Body ── */}
      <div className="flex min-h-0 flex-1">
        {/* Left Pane: Preset Browser */}
        <AnimationPresetBrowser
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={(id) => {
            setActivePresetId(id);
            setCurrentTime(0);
          }}
          onNewPreset={handleNewPreset}
          onDuplicatePreset={handleDuplicatePreset}
          onDeletePreset={handleDeletePreset}
        />

        {/* Center Pane: Preview Stage + Keyframe Timeline */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <AnimationPreviewStage
              preset={activePreset}
              sampleText={sampleText}
              onSampleTextChange={setSampleText}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentTime={currentTime}
              onSeek={(t) => setCurrentTime(t)}
              duration={duration}
              onStageMount={(el) => {
                stageContainerRef.current = el;
              }}
            />
          </div>

          <AnimationTimeline
            preset={activePreset}
            onUpdatePreset={handleUpdatePreset}
            progress={duration > 0 ? currentTime / duration : 0}
            onSeekProgress={(p) => setCurrentTime(p * duration)}
          />
        </div>

        {/* Right Pane: Property & Motion Inspector */}
        <AnimationInspector
          preset={activePreset}
          onUpdatePreset={handleUpdatePreset}
        />
      </div>
      <AnimationCatalogStatusModal
        isOpen={isCatalogOpen}
        localPresets={presets}
        canPublish={isAdmin}
        onPublishPreset={publishPreset}
        onClose={() => setIsCatalogOpen(false)}
      />
      {isPublishModalOpen && (
        <AnimationPublishModal
          preset={activePreset}
          onConfirm={handlePublishConfirm}
          onClose={() => {
            setIsPublishModalOpen(false);
            setCapturedThumbnail(null);
            setCapturedVideo(null);
          }}
          initialThumbnailFile={capturedThumbnail}
          initialVideoFile={capturedVideo}
        />
      )}
    </div>
  );
};
