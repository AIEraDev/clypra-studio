import React, { useState, useEffect } from "react";
import { X, UploadCloud, Loader2, AlertTriangle, CheckCircle, FileJson, Tag, FolderOpen, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { useVideoEffectR2Upload } from "../hooks/useVideoEffectR2Upload";

export type VideoEffectCategory =
  | "essentials"
  | "glitch"
  | "retro"
  | "light"
  | "motion"
  | "color"
  | "ai-generated";

const VIDEO_EFFECT_CATEGORIES: VideoEffectCategory[] = [
  "essentials",
  "glitch",
  "retro",
  "light",
  "motion",
  "color",
  "ai-generated",
];

interface ValidationErrors {
  id?: string;
  name?: string;
}

interface PublishVideoEffectModalProps {
  open: boolean;
  onClose: () => void;
  effectDef: {
    id: string;
    name: string;
    category: string;
    description: string;
    params: any[];
    tags: string[];
    [key: string]: any;
  } | null;
  thumbnailDataUrl?: string;
  previewDataUrl?: string;
}

export function PublishVideoEffectModal({
  open,
  onClose,
  effectDef,
  thumbnailDataUrl,
  previewDataUrl,
}: PublishVideoEffectModalProps) {
  const [activeTab, setActiveTab] = useState<"metadata" | "preview">("metadata");
  const [effectId, setEffectId] = useState("");
  const [effectName, setEffectName] = useState("");
  const [category, setCategory] = useState<VideoEffectCategory>("glitch");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAdmin, setIsAdmin] = useState(false);

  const { uploadVideoEffect, status, message, reset } = useVideoEffectR2Upload();

  const isUploading = status === "uploading";
  const isPublished = status === "success";
  const isFailed = status === "error";

  useEffect(() => {
    if (open) {
      const token = localStorage.getItem("clypra_auth_token");
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsAdmin(!!payload.isAdmin);
      } catch (e) {
        setIsAdmin(false);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && effectDef) {
      setEffectId(effectDef.id || "");
      setEffectName(effectDef.name || "");
      
      const catLower = (effectDef.category || "").toLowerCase() as VideoEffectCategory;
      if (VIDEO_EFFECT_CATEGORIES.includes(catLower)) {
        setCategory(catLower);
      } else {
        setCategory("glitch");
      }
      setDescription(effectDef.description || "");
      setTagsInput(effectDef.tags?.join(", ") || "");
      setIsPremium(false);
      
      if (reset) reset();
    }
  }, [open, effectDef]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!effectId.trim()) {
      errors.id = "Effect ID is required";
    } else if (!/^[a-z0-9-_]+$/.test(effectId)) {
      errors.id = "ID must be lowercase, alphanumeric, with hyphens or underscores only";
    }

    if (!effectName.trim()) {
      errors.name = "Effect name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const defaultParams = effectDef?.params
      ? Object.fromEntries(effectDef.params.map((p) => [p.key, p.value]))
      : {};

    const payload = {
      effect: {
        id: effectId.trim(),
        name: effectName.trim(),
        category: category,
        description: description.trim(),
        tags,
        isPremium,
        renderer: effectDef?.id || effectId.trim(),
        params: defaultParams,
        intensity: {
          min: 0,
          max: 100,
          default: 70,
          step: 1,
        },
        published: isAdmin,
      },
      thumbnailDataUrl,
      previewDataUrl,
    };

    await uploadVideoEffect(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <div>
              <h2 className="font-sans text-sm font-semibold tracking-wide text-white">
                Publish Video Effect to API
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Generate static asset URLs and make this effect discoverable in Clypra NLE.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container-highest text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        {isPublished && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-300">Upload Successful!</p>
              <p className="text-[10px] text-emerald-400/80 mt-1">
                {message || "The video effect has been packaged and uploaded to Cloudflare R2 successfully."}
                {!isAdmin && " Note: As a community creator, this effect will be visible after admin approval."}
              </p>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-300">Upload Failed</p>
              <p className="text-[10px] text-red-400/80 mt-1">
                {message || "An error occurred while uploading. Please check API connectivity."}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-low px-4">
          <button
            onClick={() => setActiveTab("metadata")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-sans text-xs font-medium transition-colors ${
              activeTab === "metadata"
                ? "border-accent text-accent"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Metadata
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-sans text-xs font-medium transition-colors ${
              activeTab === "preview"
                ? "border-accent text-accent"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Assets Review
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "metadata" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                    Effect ID (Kebab-case)
                  </label>
                  <input
                    type="text"
                    value={effectId}
                    onChange={(e) => setEffectId(e.target.value.toLowerCase())}
                    placeholder="e.g. neon-pulse"
                    disabled={isUploading || isPublished}
                    className={`w-full rounded-lg border bg-[#0E0E12] p-2.5 font-mono text-xs text-white focus:border-accent focus:outline-none ${
                      validationErrors.id ? "border-red-500" : "border-outline-variant"
                    }`}
                  />
                  {validationErrors.id && (
                    <p className="text-[10px] text-red-400 mt-1">{validationErrors.id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={effectName}
                    onChange={(e) => setEffectName(e.target.value)}
                    placeholder="e.g. Neon Pulse"
                    disabled={isUploading || isPublished}
                    className={`w-full rounded-lg border bg-[#0E0E12] p-2.5 font-sans text-xs text-white focus:border-accent focus:outline-none ${
                      validationErrors.name ? "border-red-500" : "border-outline-variant"
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-red-400 mt-1">{validationErrors.name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                    Category Whitelist
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VideoEffectCategory)}
                    disabled={isUploading || isPublished}
                    className="w-full rounded-lg border border-outline-variant bg-[#0E0E12] p-2.5 font-sans text-xs text-white focus:border-accent focus:outline-none"
                  >
                    {VIDEO_EFFECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      disabled={isUploading || isPublished}
                      className="w-4 h-4 rounded border-outline-variant bg-[#0E0E12] text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="text-xs font-medium text-white">Premium Tier Asset</span>
                      <p className="text-[9px] text-gray-400">Requires Clypra Pro subscription to render</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One sentence description explaining the visual outcome..."
                  disabled={isUploading || isPublished}
                  rows={2}
                  className="w-full rounded-lg border border-outline-variant bg-[#0E0E12] p-2.5 font-sans text-xs text-white focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                  Search Tags (Comma separated)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. glow, neon,CapCut, transition, creative"
                    disabled={isUploading || isPublished}
                    className="w-full rounded-lg border border-outline-variant bg-[#0E0E12] py-2.5 pl-9 pr-3 font-sans text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Thumbnail Preview */}
                <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[200px]">
                  <div className="bg-surface-container-medium px-3 py-1.5 border-b border-outline-variant flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Thumbnail Snapshot (.png)
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4 bg-[#0A0A0E]">
                    {thumbnailDataUrl ? (
                      <img
                        src={thumbnailDataUrl}
                        alt="Thumbnail"
                        className="max-w-full max-h-full object-contain rounded border border-outline-variant/50"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">No thumbnail captured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Loop Preview */}
                <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low flex flex-col h-[200px]">
                  <div className="bg-surface-container-medium px-3 py-1.5 border-b border-outline-variant flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-400 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      Preview Loop (.webm)
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4 bg-[#0A0A0E]">
                    {previewDataUrl ? (
                      <video
                        src={previewDataUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="max-w-full max-h-full object-contain rounded border border-outline-variant/50"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Video className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">No video loop captured</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* JSON Manifest Summary */}
              <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low flex flex-col">
                <div className="bg-surface-container-medium px-3 py-1.5 border-b border-outline-variant">
                  <span className="text-[10px] font-mono uppercase text-gray-400 flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Payload Manifest Structure
                  </span>
                </div>
                <div className="p-3 bg-[#0A0A0E] font-mono text-[9px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed max-h-[140px]">
                  {JSON.stringify(
                    {
                      id: effectId || "[pending]",
                      name: effectName || "[pending]",
                      category,
                      renderer: effectDef?.id || "[pending]",
                      paramsCount: effectDef?.params?.length || 0,
                      isPremium,
                      published: isAdmin,
                    },
                    null,
                    2,
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
            <div className="text-[10px] text-gray-500">
              {isAdmin ? (
                <span className="text-amber-400 font-semibold">★ Admin Mode (Auto-Approves Publish)</span>
              ) : (
                <span>Community Creator Mode (Requires Review)</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold text-white hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
              >
                Close
              </button>
              {isPublished ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isUploading || !thumbnailDataUrl || !previewDataUrl}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      Publish to API
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
