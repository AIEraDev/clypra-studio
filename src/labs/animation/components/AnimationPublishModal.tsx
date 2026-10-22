/**
 * AnimationPublishModal
 *
 * Collects the four required assets before publishing an animation preset:
 *   1. Short preview video  (mp4 / webm)
 *   2. Thumbnail image      (png / jpg / webp / gif)
 *   3. Category             (editable, pre-filled from preset)
 *   4. Preset data          (auto-filled, read-only summary)
 */

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Upload,
  Film,
  Image,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { TextAnimationPreset } from "../../../types/animation";

interface AnimationPublishModalProps {
  preset: TextAnimationPreset;
  onConfirm: (payload: PublishPayload) => void;
  onClose: () => void;
  /** Auto-captured thumbnail file from the stage canvas (may be null if capture failed). */
  initialThumbnailFile?: File | null;
  /** Auto-captured preview video file (may be null if MediaRecorder is unavailable). */
  initialVideoFile?: File | null;
  /** Whether the upload is in progress */
  isUploading?: boolean;
}

export interface PublishPayload {
  preset: TextAnimationPreset;
  videoFile: File;
  thumbnailFile: File;
  category: string;
}

const ACCEPTED_CATEGORIES = ["in", "out", "loop"];

export const AnimationPublishModal: React.FC<AnimationPublishModalProps> = ({
  preset,
  onConfirm,
  onClose,
  initialThumbnailFile,
  initialVideoFile,
  isUploading = false,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(
    initialVideoFile ?? null,
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(
    initialThumbnailFile ?? null,
  );
  const [category, setCategory] = useState(preset.phase?.toLowerCase() ?? "in");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  // Refs to track object URLs created by the manual file pickers so they can
  // be revoked before creating new ones and on unmount (FEAT-002).
  const prevVideoUrlRef = useRef<string | null>(null);
  const prevThumbUrlRef = useRef<string | null>(null);

  // Sync state when auto-captured files arrive or change (e.g. modal re-opened
  // after a new capture). Creates object URLs and cleans them up on next effect
  // run or unmount.
  useEffect(() => {
    let videoUrl: string | null = null;
    let thumbUrl: string | null = null;

    if (initialVideoFile) {
      videoUrl = URL.createObjectURL(initialVideoFile);
      setVideoFile(initialVideoFile);
      setVideoPreviewUrl(videoUrl);
    }
    if (initialThumbnailFile) {
      thumbUrl = URL.createObjectURL(initialThumbnailFile);
      setThumbnailFile(initialThumbnailFile);
      setThumbPreviewUrl(thumbUrl);
    }

    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [initialVideoFile, initialThumbnailFile]);

  // Revoke manual-picker URLs when the modal unmounts.
  useEffect(() => {
    return () => {
      if (prevVideoUrlRef.current) URL.revokeObjectURL(prevVideoUrlRef.current);
      if (prevThumbUrlRef.current) URL.revokeObjectURL(prevThumbUrlRef.current);
    };
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke the previous manually-picked URL before creating a new one.
    if (prevVideoUrlRef.current) {
      URL.revokeObjectURL(prevVideoUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    prevVideoUrlRef.current = url;
    setVideoFile(file);
    setVideoPreviewUrl(url);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke the previous manually-picked URL before creating a new one.
    if (prevThumbUrlRef.current) {
      URL.revokeObjectURL(prevThumbUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    prevThumbUrlRef.current = url;
    setThumbnailFile(file);
    setThumbPreviewUrl(url);
  };

  const canPublish =
    videoFile !== null && thumbnailFile !== null && category.trim() !== "";

  const handleConfirm = () => {
    if (!videoFile || !thumbnailFile) return;
    onConfirm({ preset, videoFile, thumbnailFile, category: category.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#111118] border border-[#2A2A38] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A38]">
          <div>
            <h2 className="text-sm font-bold text-white">Publish</h2>
            <p className="text-[11px] text-[#888899] mt-0.5">
              Complete all fields before publishing{" "}
              <span className="text-violet-300 font-semibold">
                "{preset.name}"
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#888899] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. Short Preview Video */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#888899]">
              <Film size={12} className="text-violet-400" />
              Short Preview Video <span className="text-red-400">*</span>
            </label>
            <div
              onClick={() => videoInputRef.current?.click()}
              className={`relative flex items-center gap-3 rounded-xl border-2 border-dashed p-3 cursor-pointer transition-colors ${
                videoFile
                  ? "border-violet-500/60 bg-violet-500/5"
                  : "border-[#2A2A38] hover:border-[#444458] bg-[#0E0E16]"
              }`}
            >
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-14 w-20 rounded-lg object-cover shrink-0 border border-[#2A2A38]"
                />
              ) : (
                <div className="h-14 w-20 rounded-lg bg-[#1A1A26] border border-[#2A2A38] flex items-center justify-center shrink-0">
                  <Upload size={16} className="text-[#555568]" />
                </div>
              )}
              <div className="min-w-0">
                {videoFile ? (
                  <>
                    <p className="text-xs font-semibold text-white truncate">
                      {videoFile.name}
                      {/* ✦ Auto badge for auto-generated preview files */}
                      {videoFile.name.startsWith("preview.") && (
                        <span className="text-[10px] font-semibold text-violet-300/70 ml-1">
                          ✦ Auto
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#888899]">
                      {(videoFile.size / 1024).toFixed(0)} KB · {videoFile.type}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-[#aaaacc]">
                      Click to upload
                    </p>
                    <p className="text-[11px] text-[#555568]">
                      mp4, webm — max 10 MB
                    </p>
                  </>
                )}
              </div>
              {videoFile && (
                <CheckCircle2
                  size={16}
                  className="ml-auto shrink-0 text-violet-400"
                />
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={handleVideoChange}
            />
          </div>

          {/* 2. Thumbnail */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#888899]">
              <Image size={12} className="text-teal-400" />
              Thumbnail Image <span className="text-red-400">*</span>
            </label>
            <div
              onClick={() => thumbInputRef.current?.click()}
              className={`relative flex items-center gap-3 rounded-xl border-2 border-dashed p-3 cursor-pointer transition-colors ${
                thumbnailFile
                  ? "border-teal-500/60 bg-teal-500/5"
                  : "border-[#2A2A38] hover:border-[#444458] bg-[#0E0E16]"
              }`}
            >
              {thumbPreviewUrl ? (
                <img
                  src={thumbPreviewUrl}
                  alt="thumbnail preview"
                  className="h-14 w-20 rounded-lg object-cover shrink-0 border border-[#2A2A38]"
                />
              ) : (
                <div className="h-14 w-20 rounded-lg bg-[#1A1A26] border border-[#2A2A38] flex items-center justify-center shrink-0">
                  <Upload size={16} className="text-[#555568]" />
                </div>
              )}
              <div className="min-w-0">
                {thumbnailFile ? (
                  <>
                    <p className="text-xs font-semibold text-white truncate">
                      {thumbnailFile.name}
                      {/* ✦ Auto badge for auto-generated thumbnail files */}
                      {thumbnailFile.name === "thumbnail.png" && (
                        <span className="text-[10px] font-semibold text-violet-300/70 ml-1">
                          ✦ Auto
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#888899]">
                      {(thumbnailFile.size / 1024).toFixed(0)} KB ·{" "}
                      {thumbnailFile.type}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-[#aaaacc]">
                      Click to upload
                    </p>
                    <p className="text-[11px] text-[#555568]">
                      png, jpg, webp, gif — max 2 MB
                    </p>
                  </>
                )}
              </div>
              {thumbnailFile && (
                <CheckCircle2
                  size={16}
                  className="ml-auto shrink-0 text-teal-400"
                />
              )}
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </div>

          {/* 3. Category */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#888899]">
              <Tag size={12} className="text-amber-400" />
              Category <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {ACCEPTED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer capitalize ${
                    category === cat
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/50"
                      : "bg-[#1A1A26] text-[#888899] border border-[#2A2A38] hover:border-[#444458] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Preset Data summary (read-only) */}
          <div className="rounded-xl bg-[#0E0E16] border border-[#2A2A38] p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#555568] mb-2">
              Preset Data
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <span className="text-[#666678]">ID</span>
              <span className="text-[#aaaacc] font-mono truncate">
                {preset.id}
              </span>
              <span className="text-[#666678]">Phase</span>
              <span className="text-[#aaaacc] capitalize">{preset.phase}</span>
              <span className="text-[#666678]">Tracks</span>
              <span className="text-[#aaaacc]">
                {(preset.tracks ?? []).length} track
                {(preset.tracks ?? []).length !== 1 ? "s" : ""}
              </span>
              <span className="text-[#666678]">Default duration</span>
              <span className="text-[#aaaacc]">{preset.defaultDuration}s</span>
            </div>
          </div>

          {/* Validation hint */}
          {!canPublish && (
            <div className="flex items-center gap-2 text-[11px] text-amber-400/80">
              <AlertCircle size={13} className="shrink-0" />
              <span>Video and thumbnail are required to publish.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2A2A38]">
          <button
            onClick={onClose}
            disabled={isUploading}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isUploading
                ? "text-[#555568] border border-[#2A2A38] cursor-not-allowed"
                : "text-[#888899] hover:text-white border border-[#2A2A38] hover:border-[#444458]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canPublish || isUploading}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              canPublish && !isUploading
                ? "bg-violet-600 hover:bg-violet-500 text-white hover:scale-105"
                : "bg-[#2A2A38] text-[#555568] cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Publishing…</span>
              </>
            ) : (
              <span>Publish</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
