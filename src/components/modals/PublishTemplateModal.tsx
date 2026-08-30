import React, { useState, useEffect } from "react";
import { getStudioApiBaseUrl } from "../../services/apiConfig";
import {
  X,
  UploadCloud,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileJson,
  Tag,
  Image as ImageIcon,
  ExternalLink,
  Video,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = getStudioApiBaseUrl();

export type TemplateCategory =
  | "lower-third"
  | "title-card"
  | "caption"
  | "callout"
  | "social"
  | "countdown";

const CATEGORIES: TemplateCategory[] = [
  "lower-third",
  "title-card",
  "caption",
  "callout",
  "social",
  "countdown",
];

const PLACEMENTS = ["lower-third", "center", "top", "full-frame"] as const;

interface ValidationErrors {
  id?: string;
  name?: string;
}

export interface PublishTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  category: TemplateCategory;
  description: string;
  tagsInput: string;
  creatorName: string;
  creatorLink: string;
  placement: (typeof PLACEMENTS)[number];
  thumbnailFrame: number;
  durationFrames: number;
  validationErrors: ValidationErrors;
  lottieData?: any;
  thumbnailDataUrl?: string;
  previewVideoUrl?: string;
  isGeneratingVideo?: boolean;
  width: number;
  height: number;
  onTemplateIdChange: (value: string) => void;
  onTemplateNameChange: (value: string) => void;
  onCategoryChange: (value: TemplateCategory) => void;
  onDescriptionChange: (value: string) => void;
  onTagsInputChange: (value: string) => void;
  onCreatorNameChange: (value: string) => void;
  onCreatorLinkChange: (value: string) => void;
  onPlacementChange: (value: (typeof PLACEMENTS)[number]) => void;
  onThumbnailFrameChange: (value: number) => void;
  onUseCurrentFrame: () => void;
  onPreviewThumbnail: () => void;
  onPublish: () => Promise<void>;
  publishStatus: "idle" | "publishing" | "submitted" | "published" | "failed";
  publishMessage: string | null;
  publishPrUrl: string | null;
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  isAdmin: boolean;
}

export function PublishTemplateModal({
  open,
  onClose,
  templateId,
  templateName,
  category,
  description,
  tagsInput,
  creatorName,
  creatorLink,
  placement,
  thumbnailFrame,
  durationFrames,
  validationErrors,
  lottieData,
  thumbnailDataUrl,
  previewVideoUrl,
  isGeneratingVideo,
  width,
  height,
  onTemplateIdChange,
  onTemplateNameChange,
  onCategoryChange,
  onDescriptionChange,
  onTagsInputChange,
  onCreatorNameChange,
  onCreatorLinkChange,
  onPlacementChange,
  onThumbnailFrameChange,
  onUseCurrentFrame,
  onPreviewThumbnail,
  onPublish,
  publishStatus,
  publishMessage,
  publishPrUrl,
  published,
  onPublishedChange,
  isAdmin,
}: PublishTemplateModalProps) {

  if (!open) return null;

  const hasErrors = Object.keys(validationErrors).length > 0;
  const isPublishing = publishStatus === "publishing";
  const isPublished = publishStatus === "published";
  const isSubmitted = publishStatus === "submitted";
  const isFailed = publishStatus === "failed";

  useEffect(() => {
    if (!publishMessage) return;
    if (isPublished || isSubmitted) toast.success(publishMessage, { id: "template-publish" });
    else if (isFailed) toast.error(publishMessage, { id: "template-publish" });
  }, [publishMessage, isPublished, isSubmitted, isFailed]);

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const handlePublish = async () => {
    if (hasErrors || isPublishing) return;
    await onPublish();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#121219] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-[#2A2A38] bg-[#181824] p-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-300">
                <UploadCloud size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">
                  Submit Text Template to API
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">
                  Review metadata and submit an immutable revision for approval.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          <>

              {/* Template ID */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Template ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => onTemplateIdChange(e.target.value)}
                  placeholder="neon-title-slam"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.id && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.id}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">
                  Unique kebab-case identifier (e.g., neon-title-slam)
                </p>
              </div>

              {/* Template Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Template Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => onTemplateNameChange(e.target.value)}
                  placeholder="Neon Title Slam"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.name && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">
                  Human-readable display name for the text template
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="A dynamic lower-third template with neon effects"
                  rows={3}
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500 resize-none"
                />
                <p className="mt-1.5 text-[10px] text-clypra-muted">
                  Brief description of what this template does
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => onTagsInputChange(e.target.value)}
                  placeholder="neon, title, lower-third"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                <p className="mt-1.5 text-[10px] text-clypra-muted">
                  Comma-separated tags for categorization
                </p>
              </div>

              {/* Creator Credits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                    Creator Name
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => onCreatorNameChange(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                  />
                  <p className="mt-1.5 text-[9px] text-clypra-muted">
                    Your display name for credits
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                    Creator Social Link
                  </label>
                  <input
                    type="text"
                    value={creatorLink}
                    onChange={(e) => onCreatorLinkChange(e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                  />
                  <p className="mt-1.5 text-[9px] text-clypra-muted">
                    Social/portfolio link for credit
                  </p>
                </div>
              </div>

              {/* Category & Placement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      onCategoryChange(e.target.value as TemplateCategory)
                    }
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                    Placement
                  </label>
                  <select
                    value={placement}
                    onChange={(e) =>
                      onPlacementChange(
                        e.target.value as (typeof PLACEMENTS)[number],
                      )
                    }
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Admin Moderation - Published toggle */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-[#2A2A38] bg-[#0E0E12] select-none">
                  <input
                    id="publish-checkbox"
                    type="checkbox"
                    checked={published}
                    onChange={(e) => onPublishedChange(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2A2A38] bg-[#09090D] text-teal-500 focus:ring-teal-500 cursor-pointer"
                  />
                  <label
                    htmlFor="publish-checkbox"
                    className="text-xs font-semibold text-white cursor-pointer"
                  >
                    Approve and Publish immediately (Make available in editor)
                  </label>
                </div>
              )}

              {/* Thumbnail Frame */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Thumbnail Frame <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, durationFrames - 1)}
                    value={thumbnailFrame}
                    onChange={(e) =>
                      onThumbnailFrameChange(
                        Math.max(
                          0,
                          Math.min(
                            durationFrames - 1,
                            parseInt(e.target.value, 10) || 0,
                          ),
                        ),
                      )
                    }
                    className="flex-1 rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={onUseCurrentFrame}
                    className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-[10px] font-bold text-teal-300 hover:bg-teal-500/15 whitespace-nowrap"
                  >
                    Use Current
                  </button>
                  <button
                    type="button"
                    onClick={onPreviewThumbnail}
                    className="rounded-lg border border-[#2A2A38] bg-[#15151C] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#2A2A38] whitespace-nowrap"
                  >
                    Preview
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-clypra-muted">
                  Frame {thumbnailFrame} of {durationFrames - 1} will be used
                  for the thumbnail preview
                </p>

                {/* Thumbnail & Video Preview Grid */}
                {(thumbnailDataUrl || previewVideoUrl || isGeneratingVideo) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {/* Thumbnail Preview */}
                    {thumbnailDataUrl && (
                      <div className="rounded-lg border border-[#2A2A38] bg-[#0B0B10] p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon size={12} className="text-amber-400" />
                            <span className="text-[10px] font-bold text-[#888899] uppercase">
                              Thumbnail Preview
                            </span>
                            <span className="text-[9px] text-clypra-muted ml-auto">
                              Ultra HD
                            </span>
                          </div>
                          <div className="relative aspect-video rounded overflow-hidden border border-[#2A2A38] checkerboard">
                            <img
                              src={thumbnailDataUrl}
                              alt="Thumbnail preview"
                              className="w-full h-full"
                              style={{
                                objectFit: "contain",
                                imageRendering: "-webkit-optimize-contrast",
                              }}
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-[9px] text-clypra-muted text-center">
                          High-resolution {width}×{height}px (4x supersampled)
                        </p>
                      </div>
                    )}

                    {/* Video Preview */}
                    {isGeneratingVideo ? (
                      <div className="rounded-lg border border-[#2A2A38] bg-[#0B0B10] p-3 flex flex-col items-center justify-center min-h-[140px] aspect-video">
                        <Loader2
                          className="animate-spin text-teal-400 mb-2"
                          size={20}
                        />
                        <p className="text-[10px] text-clypra-muted text-center">
                          Generating WebM preview video...
                        </p>
                      </div>
                    ) : (
                      previewVideoUrl && (
                        <div className="rounded-lg border border-[#2A2A38] bg-[#0B0B10] p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Video size={12} className="text-purple-400" />
                              <span className="text-[10px] font-bold text-[#888899] uppercase">
                                Video Preview
                              </span>
                              <span className="text-[9px] text-clypra-muted ml-auto">
                                WebM
                              </span>
                            </div>
                            <div className="relative aspect-video rounded overflow-hidden border border-[#2A2A38] checkerboard">
                              <video
                                src={previewVideoUrl}
                                controls
                                autoPlay
                                loop
                                muted
                                className="w-full h-full"
                                style={{ objectFit: "contain" }}
                              />
                            </div>
                          </div>
                          <p className="mt-2 text-[9px] text-clypra-muted text-center">
                            Full animation preview video
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
          </>
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A2A38] bg-[#15151C] p-4 shrink-0 space-y-3">
          {publishPrUrl && (
            <a
              href={publishPrUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/20 flex items-center gap-1"
            >
              {publishPrUrl.includes("pull") ? "Open PR" : "View JSON"}{" "}
              <ExternalLink size={10} />
            </a>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="rounded-lg border border-[#2A2A38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38] disabled:opacity-50"
            >
              {isPublished || isSubmitted ? "Close" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={hasErrors || isPublishing || isPublished || isSubmitted}
              className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-black hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Publishing...
                </>
              ) : isPublished ? (
                <>
                  <CheckCircle size={14} />
                  Published
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle size={14} />
                  Submitted for Approval
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Publish Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
