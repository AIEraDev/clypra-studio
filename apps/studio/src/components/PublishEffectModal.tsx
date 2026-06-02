import React, { useState } from "react";
import { X, UploadCloud, Loader2, AlertTriangle, CheckCircle, FileJson, Tag, FolderOpen, Image as ImageIcon, ExternalLink, Sparkles } from "lucide-react";
import { generateEffectName } from "../services/geminiService";
import type { TextEffectConfig } from "@clypra/engine";

export type EffectApiCategory = "3d" | "neon" | "metallic" | "glitch" | "retro" | "gradient" | "grunge" | "outline" | "shadow" | "elements" | "luxury";

const EFFECT_CATEGORIES: EffectApiCategory[] = ["3d", "neon", "metallic", "glitch", "retro", "gradient", "grunge", "outline", "shadow", "elements", "luxury"];

interface ValidationErrors {
  id?: string;
  name?: string;
}

interface PublishEffectModalProps {
  open: boolean;
  onClose: () => void;
  effectId: string;
  effectName: string;
  category: EffectApiCategory;
  description: string;
  tagsInput: string;
  validationErrors: ValidationErrors;
  config: TextEffectConfig;
  thumbnailDataUrl?: string;
  onEffectIdChange: (value: string) => void;
  onEffectNameChange: (value: string) => void;
  onCategoryChange: (value: EffectApiCategory) => void;
  onDescriptionChange: (value: string) => void;
  onTagsInputChange: (value: string) => void;
  onPublish: () => Promise<void>;
  publishStatus: "idle" | "publishing" | "published" | "failed";
  publishMessage: string | null;
  publishPrUrl: string | null;
}

export function PublishEffectModal({ open, onClose, effectId, effectName, category, description, tagsInput, validationErrors, config, thumbnailDataUrl, onEffectIdChange, onEffectNameChange, onCategoryChange, onDescriptionChange, onTagsInputChange, onPublish, publishStatus, publishMessage, publishPrUrl }: PublishEffectModalProps) {
  const [activeTab, setActiveTab] = useState<"metadata" | "preview">("metadata");
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!open) return null;

  const hasErrors = Object.keys(validationErrors).length > 0;
  const isPublishing = publishStatus === "publishing";
  const isPublished = publishStatus === "published";
  const isFailed = publishStatus === "failed";

  const handleGenerateName = async () => {
    setIsGeneratingName(true);
    setAiError(null);

    try {
      const generatedName = await generateEffectName(config);
      onEffectNameChange(generatedName);

      // Auto-generate ID from name
      const autoId = generatedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      onEffectIdChange(autoId);
    } catch (error) {
      console.error("Name generation error:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate name");
    } finally {
      setIsGeneratingName(false);
    }
  };

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
                <h3 className="text-sm font-bold text-white">Publish Text Effect to API</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">Review metadata and create a GitHub Pull Request with your effect</p>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={isPublishing} className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white disabled:opacity-50">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A38] bg-[#15151C] shrink-0">
          <button onClick={() => setActiveTab("metadata")} className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activeTab === "metadata" ? "text-teal-300 bg-[#121219] border-b-2 border-teal-500" : "text-[#888899] hover:text-white"}`}>
            <FileJson size={13} /> Metadata
          </button>
          <button onClick={() => setActiveTab("preview")} className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activeTab === "preview" ? "text-teal-300 bg-[#121219] border-b-2 border-teal-500" : "text-[#888899] hover:text-white"}`}>
            <CheckCircle size={13} /> Review
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {activeTab === "metadata" ? (
            <>
              {/* AI Generation Banner */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles size={14} className="text-purple-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-purple-200">AI-Powered Name</p>
                      <p className="text-[10px] text-purple-300/80">Generate creative effect name using Gemini</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleGenerateName} disabled={isGeneratingName || isPublishing} className="shrink-0 rounded-lg border border-purple-500/40 bg-purple-500/20 px-3 py-1.5 text-[10px] font-bold text-purple-200 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors">
                    {isGeneratingName ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        Generate
                      </>
                    )}
                  </button>
                </div>
                {aiError && (
                  <div className="mt-2 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}
              </div>

              {/* Effect ID */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Effect ID <span className="text-red-400">*</span>
                </label>
                <input type="text" value={effectId} onChange={(e) => onEffectIdChange(e.target.value)} placeholder="neon-glow-pulse" className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none placeholder:text-[#555566] focus:border-teal-500" />
                {validationErrors.id && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.id}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">Unique kebab-case identifier (e.g., neon-glow-pulse)</p>
              </div>

              {/* Effect Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Effect Name <span className="text-red-400">*</span>
                </label>
                <input type="text" value={effectName} onChange={(e) => onEffectNameChange(e.target.value)} placeholder="Neon Glow Pulse" className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500" />
                {validationErrors.name && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">Human-readable display name for the PR title</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="A vibrant neon text effect with pulsing glow layers" rows={3} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500 resize-none" />
                <p className="mt-1.5 text-[10px] text-clypra-muted">Brief description of the visual style and use case</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Tags</label>
                <input type="text" value={tagsInput} onChange={(e) => onTagsInputChange(e.target.value)} placeholder="neon, glow, vibrant, modern" className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500" />
                <p className="mt-1.5 text-[10px] text-clypra-muted">Comma-separated tags for categorization</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select value={category} onChange={(e) => onCategoryChange(e.target.value as EffectApiCategory)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500">
                  {EFFECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-clypra-muted">Primary visual style category</p>
              </div>

              {/* Thumbnail Preview */}
              {thumbnailDataUrl && (
                <div className="rounded-lg border border-[#2A2A38] bg-[#0B0B10] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-[#888899] uppercase">Effect Preview</span>
                  </div>
                  <div className="relative rounded overflow-hidden border border-[#2A2A38] bg-[#09090D]">
                    <img src={thumbnailDataUrl} alt="Effect preview" className="w-full h-auto" style={{ imageRendering: "-webkit-optimize-contrast" }} />
                  </div>
                  <p className="mt-2 text-[9px] text-clypra-muted text-center">This preview will be included in the PR</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Review Tab */}
              <div className="space-y-4">
                <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <FileJson size={14} className="text-teal-300" /> Effect Information
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-[#888899] w-24 shrink-0">ID:</span>
                      <span className="text-[10px] font-mono text-white">{effectId || <span className="text-red-400">Not set</span>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-[#888899] w-24 shrink-0">Name:</span>
                      <span className="text-[10px] text-white">{effectName || <span className="text-red-400">Not set</span>}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-[#888899] w-24 shrink-0">Description:</span>
                      <span className="text-[10px] text-[#CCCCD6]">{description || <span className="text-[#555566]">No description</span>}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <FolderOpen size={14} className="text-purple-300" /> Category
                  </h4>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5">
                    <Tag size={12} className="text-purple-300" />
                    <span className="text-[11px] font-semibold text-purple-200">{category}</span>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <Tag size={14} className="text-teal-300" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-lg border border-[#2A2A38] bg-[#15151C] px-2.5 py-1 text-[10px] font-medium text-[#CCCCD6]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {thumbnailDataUrl && (
                  <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <ImageIcon size={14} className="text-amber-300" /> Preview
                    </h4>
                    <div className="relative rounded overflow-hidden border border-[#2A2A38] bg-[#09090D]">
                      <img src={thumbnailDataUrl} alt="Effect preview" className="w-full h-auto" />
                    </div>
                  </div>
                )}

                {hasErrors && (
                  <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-red-300 mb-2">Validation Errors</h4>
                        <ul className="space-y-1 text-[10px] text-red-400">
                          {Object.entries(validationErrors).map(([key, message]) => (
                            <li key={key}>• {message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A2A38] bg-[#15151C] p-4 shrink-0 space-y-3">
          {publishMessage && (
            <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[10px] ${isFailed ? "border-red-900/40 bg-red-950/30 text-red-300" : isPublished ? "border-teal-900/40 bg-teal-950/30 text-teal-300" : "border-[#2A2A38] bg-[#0B0B10] text-[#9A9AAA]"}`}>
              <div className="flex items-center gap-2 min-w-0">
                {isFailed ? <AlertTriangle size={14} className="shrink-0" /> : isPublished ? <CheckCircle size={14} className="shrink-0" /> : <Loader2 size={14} className="shrink-0 animate-spin" />}
                <span className="truncate">{publishMessage}</span>
              </div>
              {publishPrUrl && (
                <a href={publishPrUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/20 flex items-center gap-1">
                  Open PR <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isPublishing} className="rounded-lg border border-[#2A2A38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38] disabled:opacity-50">
              {isPublished ? "Close" : "Cancel"}
            </button>
            <button type="button" onClick={handlePublish} disabled={hasErrors || isPublishing || isPublished} className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-black hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2">
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
              ) : (
                <>
                  <UploadCloud size={14} />
                  Create Pull Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
