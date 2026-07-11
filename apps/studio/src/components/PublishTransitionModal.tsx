import React, { useState, useEffect, useMemo } from "react";
import { X, UploadCloud, Loader2, AlertTriangle, CheckCircle, FileJson, Tag, FolderOpen, Image as ImageIcon, Video, Sparkles, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { useTransitionR2Upload } from "../hooks/useTransitionR2Upload";

export type TransitionCategory = "geometric" | "optical-distortion" | "temporal" | "particle-dissolve" | "light-based" | "depth-based" | "physics-simulated";

const TRANSITION_CATEGORIES: TransitionCategory[] = ["geometric", "optical-distortion", "temporal", "particle-dissolve", "light-based", "depth-based", "physics-simulated"];

interface ValidationErrors {
  id?: string;
  name?: string;
}

interface PublishTransitionModalProps {
  open: boolean;
  onClose: () => void;
  transitionDef: {
    id: string;
    name: string;
    category: string;
    description: string;
    defaultDurationMs: number;
    params: any;
    tags: string[];
    [key: string]: any;
  } | null;
  thumbnailDataUrl?: string;
  previewDataUrl?: string;
}

export function PublishTransitionModal({ open, onClose, transitionDef, thumbnailDataUrl, previewDataUrl }: PublishTransitionModalProps) {
  const [activeTab, setActiveTab] = useState<"metadata" | "preview">("metadata");
  const [transitionId, setTransitionId] = useState("");
  const [transitionName, setTransitionName] = useState("");
  const [category, setCategory] = useState<TransitionCategory>("geometric");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [defaultDuration, setDefaultDuration] = useState(1.0);
  const [defaultEasing, setDefaultEasing] = useState("linear");
  const [isPremium, setIsPremium] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const { uploadTransition, status, message, reset } = useTransitionR2Upload();

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
    if (open && transitionDef) {
      setTransitionId(transitionDef.id || "");
      setTransitionName(transitionDef.name || "");
      if (TRANSITION_CATEGORIES.includes(transitionDef.category as TransitionCategory)) {
        setCategory(transitionDef.category as TransitionCategory);
      } else {
        setCategory("geometric");
      }
      setDescription(transitionDef.description || "");
      setTagsInput(transitionDef.tags?.join(", ") || "");
      setDefaultDuration((transitionDef.defaultDurationMs || 1000) / 1000);
      setDefaultEasing("linear");
      setIsPremium(false);
      setValidationErrors({});
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transitionDef]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Live R2 payload preview — mirrors exactly what uploadTransition sends
  const r2Payload = useMemo(
    () => ({
      transition: {
        id: transitionId || "<id>",
        name: transitionName || "<name>",
        category,
        description,
        renderer: transitionDef?.renderer || transitionDef?.id || "",
        params: transitionDef ? transitionDef.params : [],
        defaultDuration,
        defaultEasing,
        tags,
        isPremium,
      },
      thumbnailDataUrl: thumbnailDataUrl ? "<base64 PNG — omitted for preview>" : null,
      previewDataUrl: previewDataUrl ? "<base64 WebM — omitted for preview>" : null,
    }),
    [transitionId, transitionName, category, description, transitionDef, defaultDuration, defaultEasing, tags, isPremium, thumbnailDataUrl, previewDataUrl],
  );

  const r2Paths = useMemo(
    () => ({
      apiEndpoint: `/transitions/upload  →  POST`,
      indexFile: `transitions/${category}/index.json`,
      thumbnail: thumbnailDataUrl ? `transitions/${category}/${transitionId || "<id>"}.png` : null,
      preview: previewDataUrl ? `transitions/${category}/${transitionId || "<id>"}.webm` : null,
      liveUrl: `https://clypra-worker-api.abdulkabirmusa.com/transitions/${category}/${transitionId || "<id>"}`,
    }),
    [category, transitionId, thumbnailDataUrl, previewDataUrl],
  );

  const handlePublish = async () => {
    const errors: ValidationErrors = {};
    if (!transitionId.trim()) errors.id = "Transition ID is required";
    if (!transitionName.trim()) errors.name = "Transition name is required";
    if (!/^[a-z0-9-]+$/.test(transitionId)) {
      errors.id = "Transition ID must be kebab-case (lowercase, numbers, hyphens only)";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await uploadTransition({
        transition: {
          id: transitionId,
          name: transitionName,
          category,
          description,
          renderer: transitionDef ? transitionDef.id : "",
          params: transitionDef ? transitionDef.params : [],
          defaultDuration,
          defaultEasing,
          tags,
          isPremium,
          published: isAdmin, // Auto-publish if admin
        },
        thumbnailDataUrl: thumbnailDataUrl || "",
        previewDataUrl: previewDataUrl || "",
      });
    } catch (e) {
      console.error("Transition publish failed:", e);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#0E0E12] shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#2A2A38] bg-[#121219] p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-300">
                <UploadCloud size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Publish GPU Transition to API</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">Review metadata and upload directly to Cloudflare R2</p>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={isUploading} className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white disabled:opacity-50">
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
            <Video size={13} /> Previews
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {activeTab === "metadata" ? (
            <>
              {/* Transition ID */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Transition ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={transitionId}
                  onChange={(e) => {
                    setTransitionId(e.target.value);
                    if (validationErrors.id) {
                      setValidationErrors((prev) => ({ ...prev, id: undefined }));
                    }
                  }}
                  placeholder="shatter-burst"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.id && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.id}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">Unique kebab-case identifier (e.g., shatter-burst)</p>
              </div>

              {/* Transition Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Transition Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={transitionName}
                  onChange={(e) => {
                    setTransitionName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  placeholder="Shatter Burst"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.name && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-clypra-muted">Human-readable display name</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value as TransitionCategory)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500">
                  {TRANSITION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("-", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-clypra-muted">Primary visual category for index</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A physics-based shatter transition where the screen splits into 3D fragments." rows={3} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500 resize-none" />
                <p className="mt-1.5 text-[10px] text-clypra-muted">Brief description of the visual behavior</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Tags</label>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="shatter, slice, physics, creative" className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500" />
                <p className="mt-1.5 text-[10px] text-clypra-muted">Comma-separated search tags</p>
              </div>

              {/* Default Duration */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Default Duration (Seconds)</label>
                <input type="number" step="0.1" min="0.1" max="5.0" value={defaultDuration} onChange={(e) => setDefaultDuration(parseFloat(e.target.value) || 1.0)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500" />
                <p className="mt-1.5 text-[10px] text-clypra-muted">Initial duration when added to timeline</p>
              </div>

              {/* Easing */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Default Easing</label>
                <select value={defaultEasing} onChange={(e) => setDefaultEasing(e.target.value)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500">
                  <option value="linear">Linear</option>
                  <option value="ease-in">Ease In</option>
                  <option value="ease-out">Ease Out</option>
                  <option value="ease-in-out">Ease In Out</option>
                </select>
                <p className="mt-1.5 text-[10px] text-clypra-muted">The speed curve of the transition progress</p>
              </div>

              {/* Premium Toggle */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-[#2A2A38] bg-[#0E0E12] select-none">
                <input id="transition-premium-checkbox" type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-[#2A2A38] bg-[#09090D] text-teal-500 focus:ring-teal-500 cursor-pointer" />
                <label htmlFor="transition-premium-checkbox" className="text-xs font-semibold text-white cursor-pointer">
                  Mark as Premium (Requires subscription)
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Info summary */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <FileJson size={14} className="text-teal-300" /> Transition Info
                </h4>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="text-[10px] text-[#888899] w-24 shrink-0">ID:</span>
                    <span className="text-[10px] font-mono text-white">{transitionId || <span className="text-red-400">Not set</span>}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[10px] text-[#888899] w-24 shrink-0">Name:</span>
                    <span className="text-[10px] text-white">{transitionName || <span className="text-red-400">Not set</span>}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[10px] text-[#888899] w-24 shrink-0">Category:</span>
                    <span className="text-[10px] text-purple-300 font-semibold">{category}</span>
                  </div>
                  <div className="flex">
                    <span className="text-[10px] text-[#888899] w-24 shrink-0">Easing:</span>
                    <span className="text-[10px] text-white">{defaultEasing}</span>
                  </div>
                </div>
              </div>

              {/* R2 / API Destinations */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <FileJson size={14} className="text-purple-300" /> R2 / API Destinations
                </h4>
                <div className="space-y-2">
                  {([{ label: "Endpoint", value: r2Paths.apiEndpoint, color: "text-orange-300" }, { label: "Index file", value: r2Paths.indexFile, color: "text-teal-300" }, ...(r2Paths.thumbnail ? [{ label: "Thumbnail", value: r2Paths.thumbnail, color: "text-amber-300" }] : []), ...(r2Paths.preview ? [{ label: "Preview", value: r2Paths.preview, color: "text-blue-300" }] : []), { label: "Live URL", value: r2Paths.liveUrl, color: "text-blue-300" }] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
                    <div key={label} className="flex items-start gap-2 rounded bg-[#09090D] border border-[#1A1A24] px-3 py-2">
                      <span className="text-[9px] font-bold uppercase text-[#888899] shrink-0 w-16">{label}</span>
                      <code className={`flex-1 break-all font-mono text-[10px] ${color}`}>{value}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* WebM Video Preview */}
              {previewDataUrl && (
                <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <Video size={14} className="text-purple-300" /> Video Preview (WebM → R2)
                  </h4>
                  <div className="relative rounded overflow-hidden border border-[#2A2A38] bg-[#09090D]">
                    <video src={previewDataUrl} controls loop autoPlay muted className="w-full h-auto" />
                  </div>
                </div>
              )}

              {/* Thumbnail preview */}
              {thumbnailDataUrl && (
                <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <ImageIcon size={14} className="text-amber-300" /> Thumbnail Preview (PNG → R2)
                  </h4>
                  <div className="relative rounded overflow-hidden border border-[#2A2A38] bg-[#09090D]">
                    <img src={thumbnailDataUrl} alt="Thumbnail preview" className="w-full h-auto" />
                  </div>
                </div>
              )}

              {/* JSON Payload */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <button type="button" onClick={() => setJsonExpanded((v) => !v)} className="w-full flex items-center justify-between text-xs font-bold text-white mb-1 hover:text-teal-300 transition-colors">
                  <span className="flex items-center gap-2">
                    <Code2 size={14} className="text-teal-300" /> JSON Payload (POST /transitions/upload)
                  </span>
                  {jsonExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <p className="text-[10px] text-[#555566] mb-3">Exact body that will be sent to the API</p>
                {jsonExpanded && <pre className="overflow-x-auto rounded-lg border border-[#1A1A24] bg-[#09090D] p-3 font-mono text-[10px] text-teal-200 leading-relaxed whitespace-pre-wrap">{JSON.stringify(r2Payload, null, 2)}</pre>}
                {!jsonExpanded && (
                  <button type="button" onClick={() => setJsonExpanded(true)} className="w-full rounded-lg border border-dashed border-[#2A2A38] py-2 text-[10px] text-[#555566] hover:text-teal-300 hover:border-teal-500/30 transition-colors">
                    Click to expand payload JSON
                  </button>
                )}
              </div>

              {hasErrors && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-300 mb-2">Validation Errors</h4>
                      <ul className="space-y-1 text-[10px] text-red-400">
                        {Object.entries(validationErrors).map(([key, message]) => (
                          <li key={key}>• {String(message)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A2A38] bg-[#15151C] p-4 shrink-0 space-y-3">
          {message && (
            <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[10px] ${isFailed ? "border-red-900/40 bg-red-950/30 text-red-300" : isPublished ? "border-teal-900/40 bg-teal-950/30 text-teal-300" : "border-[#2A2A38] bg-[#0B0B10] text-[#9A9AAA]"}`}>
              <div className="flex items-center gap-2 min-w-0">
                {isFailed ? <AlertTriangle size={14} className="shrink-0" /> : isPublished ? <CheckCircle size={14} className="shrink-0" /> : <Loader2 size={14} className="shrink-0 animate-spin" />}
                <span className="truncate">{message}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isUploading} className="rounded-lg border border-[#2A2A38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38] disabled:opacity-50">
              {isPublished ? "Close" : "Cancel"}
            </button>
            <button type="button" onClick={handlePublish} disabled={hasErrors || isUploading || isPublished} className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-black hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : isPublished ? (
                <>
                  <CheckCircle size={14} />
                  Published
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Upload to R2
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
