import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  UploadCloud,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileJson,
  Image as ImageIcon,
  Code2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Check,
  Minus,
} from "lucide-react";
import { useR2Publish } from "../hooks/useR2Publish";
import { FILTER_CATEGORY_OPTIONS, type FilterCategoryId } from "../constants/filterCategories";
import type { GradingParams, FilterPreset } from "./effects/filter/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface PublishFilterModalProps {
  open: boolean;
  onClose: () => void;
  /** The currently active library preset (can be null when using manual sliders). */
  selectedFilter: {
    id: string;
    name: string;
    category?: string;
    description?: string;
  } | null;
  /**
   * Effective GPU grading parameters = preset.gradingParams merged with manual slider overrides.
   * These map directly to ColorAdjustmentsEffect GLSL uniforms.
   */
  gradingParams: GradingParams;
  /** PNG data-URL captured from the WebGL canvas. */
  thumbnailDataUrl?: string;
  /** When provided, the modal opens in Batch mode and shows this preset list for bulk upload. */
  allPresets?: FilterPreset[];
  /** Called after a successful upload so the parent can update logs / message. */
  onPublished?: (filterId: string, message: string) => void;
}

interface ValidationErrors {
  id?: string;
  name?: string;
  gradingParams?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** Strip zero-valued keys so the stored JSON stays compact. */
function pruneGradingParams(params: GradingParams): GradingParams {
  const pruned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== 0 && value !== null && value !== undefined) {
      pruned[key] = value;
    }
  }
  return pruned as GradingParams;
}

function buildDefaultId(baseId: string): string {
  return `graded-${baseId}-${Date.now().toString().slice(-4)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PublishFilterModal({
  open,
  onClose,
  selectedFilter,
  gradingParams,
  thumbnailDataUrl,
  allPresets,
  onPublished,
}: PublishFilterModalProps) {
  const { publishFilter } = useR2Publish();
  const isBatchMode = !!allPresets?.length;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [filterId, setFilterId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [category, setCategory] = useState<FilterCategoryId>("cinematic");
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState<"Light" | "Medium" | "Bold">("Medium");
  const [creatorName, setCreatorName] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  // ── Batch upload state ─────────────────────────────────────────────────────
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number; current: string }>({ done: 0, total: 0, current: "" });
  const [batchResults, setBatchResults] = useState<Array<{ id: string; name: string; ok: boolean; msg: string }>>([]);

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"metadata" | "preview" | "batch">("metadata");
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // ── Derived flags ──────────────────────────────────────────────────────────
  const isUploading = uploadStatus === "uploading";
  const isSuccess = uploadStatus === "success";
  const isError = uploadStatus === "error";

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const baseId = selectedFilter?.id ?? "custom";
      setFilterId(buildDefaultId(baseId));
      setFilterName(selectedFilter?.name ? `${selectedFilter.name} Grade` : "Custom Grade");
      const cat = (selectedFilter?.category as FilterCategoryId) ?? "cinematic";
      setCategory(FILTER_CATEGORY_OPTIONS.some((o) => o.id === cat) ? cat : "cinematic");
      setDescription(selectedFilter?.description ?? "A GPU color grading look from Filter Lab.");
      setIntensity("Medium");
      setCreatorName("");
      setValidationErrors({});
      setUploadStatus("idle");
      setUploadMessage("");
      // Start on batch tab when in batch mode, else metadata
      setActiveTab(isBatchMode ? "batch" : "metadata");
      setJsonExpanded(false);
      // Pre-select all presets in batch mode
      if (isBatchMode && allPresets) {
        setSelectedPresetIds(new Set(allPresets.map((p) => p.id)));
      }
      setBatchProgress({ done: 0, total: 0, current: "" });
      setBatchResults([]);
    }
  }, [open, selectedFilter, isBatchMode]);

  // ── Live gradingParams (pruned) ────────────────────────────────────────────
  const prunedParams = useMemo(() => pruneGradingParams(gradingParams), [gradingParams]);

  const hasNonZeroParams = Object.keys(prunedParams).length > 0;

  // ── R2 payload preview (live-computed from form) ───────────────────────────
  const r2Payload = useMemo(
    () => ({
      filter: {
        id: filterId || "<id>",
        name: filterName || "<name>",
        category,
        description,
        intensity,
        // gradingParams is the GPU path — no swatch
        gradingParams: prunedParams,
        published: false,
        ...(creatorName.trim() ? { creator: { name: creatorName.trim() } } : {}),
      },
      thumbnailDataUrl: thumbnailDataUrl ? "<base64 PNG — omitted for preview>" : null,
    }),
    [filterId, filterName, category, description, intensity, prunedParams, creatorName, thumbnailDataUrl],
  );

  // ── R2 paths preview ───────────────────────────────────────────────────────
  const r2Paths = useMemo(
    () => ({
      apiEndpoint: `POST /filters/upload`,
      indexFile: `filters/${category}/index.json`,
      thumbnail: thumbnailDataUrl ? `filters/${category}/${filterId || "<id>"}.png` : null,
      liveUrl: `https://clypra-worker-api.abdulkabirmusa.com/filters/${category}/${filterId || "<id>"}`,
    }),
    [category, filterId, thumbnailDataUrl],
  );

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!filterId.trim()) errors.id = "Filter ID is required";
    else if (!/^[a-z0-9-]+$/.test(filterId)) errors.id = "Must be kebab-case (lowercase, numbers, hyphens only)";
    if (!filterName.trim()) errors.name = "Filter name is required";
    if (!hasNonZeroParams)
      errors.gradingParams = "No grading params set — adjust at least one slider in the Filter Lab before publishing. An empty filter does nothing in the editor.";
    return errors;
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setUploadStatus("uploading");
    setUploadMessage("Uploading GPU filter to Cloudflare R2…");

    try {
      const result = await publishFilter({
        id: filterId,
        category,
        definition: {
          id: filterId,
          name: filterName,
          category,
          description,
          intensity,
          gradingParams: prunedParams,
          published: false,
          ...(creatorName.trim() ? { creator: { name: creatorName.trim() } } : {}),
        },
        thumbnailDataUrl,
      });
      setUploadStatus("success");
      setUploadMessage(result.message || "Filter uploaded successfully!");
      onPublished?.(filterId, result.message || "Filter uploaded successfully!");
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage(err instanceof Error ? err.message : "Upload failed. Check console for details.");
    }
  };

  // ── Batch Upload ────────────────────────────────────────────────────────────
  const handleBatchUpload = useCallback(async () => {
    if (!allPresets) return;
    const toUpload = allPresets.filter((p) => selectedPresetIds.has(p.id));
    if (!toUpload.length) return;

    setUploadStatus("uploading");
    setBatchProgress({ done: 0, total: toUpload.length, current: "" });
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (let i = 0; i < toUpload.length; i++) {
      const preset = toUpload[i];
      setBatchProgress({ done: i, total: toUpload.length, current: preset.name });

      const presetParams = pruneGradingParams((preset.gradingParams ?? {}) as GradingParams);
      const presetCategory = (preset.category as FilterCategoryId) ?? "cinematic";

      try {
        const result = await publishFilter({
          id: preset.id,
          category: presetCategory,
          definition: {
            id: preset.id,
            name: preset.name,
            category: presetCategory,
            description: preset.description ?? "",
            intensity: "Medium",
            gradingParams: presetParams,
            published: false,
          },
          // No canvas thumbnail for batch — R2 thumbnail can be added later
          thumbnailDataUrl: undefined,
        });
        results.push({ id: preset.id, name: preset.name, ok: true, msg: result.message ?? "OK" });
        onPublished?.(preset.id, result.message ?? "OK");
      } catch (err) {
        results.push({ id: preset.id, name: preset.name, ok: false, msg: err instanceof Error ? err.message : "Failed" });
      }

      setBatchResults([...results]);
    }

    setBatchProgress({ done: toUpload.length, total: toUpload.length, current: "" });
    const failed = results.filter((r) => !r.ok).length;
    setUploadStatus(failed === 0 ? "success" : "error");
    setUploadMessage(`${results.length - failed}/${results.length} presets uploaded successfully.`);
  }, [allPresets, selectedPresetIds, publishFilter, onPublished]);

  if (!open) return null;

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#0E0E12] shadow-2xl">

        {/* ── Header ── */}
        <div className="border-b border-[#2A2A38] bg-[#121219] p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-300">
                <UploadCloud size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">
                  {isBatchMode ? "Upload All Presets to R2" : "Publish GPU Filter to API"}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">
                  {isBatchMode
                    ? <><span className="text-indigo-300 font-semibold">{allPresets?.length} presets</span> — each published with its own <code className="text-indigo-300">gradingParams</code></>
                    : <>Stores <span className="text-teal-300 font-semibold">gradingParams</span> (GLSL uniforms) — not CSS swatch</>}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#2A2A38] bg-[#15151C] shrink-0">
          {!isBatchMode && (
            <button
              onClick={() => setActiveTab("metadata")}
              className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "metadata"
                  ? "text-teal-300 bg-[#121219] border-b-2 border-teal-500"
                  : "text-[#888899] hover:text-white"
              }`}
            >
              <FileJson size={13} /> Metadata
            </button>
          )}
          {!isBatchMode && (
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "preview"
                  ? "text-teal-300 bg-[#121219] border-b-2 border-teal-500"
                  : "text-[#888899] hover:text-white"
              }`}
            >
              <Sliders size={13} /> GPU Params &amp; Preview
            </button>
          )}
          {isBatchMode && (
            <button
              onClick={() => setActiveTab("batch")}
              className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "batch"
                  ? "text-indigo-300 bg-[#121219] border-b-2 border-indigo-500"
                  : "text-[#888899] hover:text-white"
              }`}
            >
              <Layers size={13} /> Batch Upload
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {activeTab === "batch" && allPresets ? (
            <div className="space-y-4">

              {/* Select / deselect all */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">
                  {selectedPresetIds.size} / {allPresets.length} presets selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPresetIds(new Set(allPresets.map((p) => p.id)))}
                    className="text-[10px] font-semibold text-indigo-300 hover:text-white transition-colors"
                  >Select all</button>
                  <span className="text-[#2A2A38]">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPresetIds(new Set())}
                    className="text-[10px] font-semibold text-[#888899] hover:text-white transition-colors"
                  >Deselect all</button>
                </div>
              </div>

              {/* Preset list */}
              <div className="rounded-xl border border-[#2A2A38] overflow-hidden divide-y divide-[#1A1A24]">
                {allPresets.map((preset) => {
                  const isSelected = selectedPresetIds.has(preset.id);
                  const paramCount = Object.keys(preset.gradingParams ?? {}).length;
                  const result = batchResults.find((r) => r.id === preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(preset.id)) next.delete(preset.id);
                          else next.add(preset.id);
                          return next;
                        });
                      }}
                      disabled={isUploading}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                        isSelected ? "bg-indigo-500/10" : "bg-[#0B0B10] hover:bg-[#141420]"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                        isSelected ? "border-indigo-500 bg-indigo-500" : "border-[#2A2A38]"
                      }`}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{preset.name}</p>
                        <p className="text-[10px] text-[#555566] truncate">{preset.id}</p>
                      </div>

                      {/* Category badge */}
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#1A1A24] text-[#888899] shrink-0">
                        {preset.category}
                      </span>

                      {/* Param count */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        paramCount > 0 ? "bg-indigo-500/15 text-indigo-300" : "bg-amber-900/30 text-amber-400"
                      }`}>
                        {paramCount} param{paramCount !== 1 ? "s" : ""}
                      </span>

                      {/* Upload result badge */}
                      {result && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          result.ok ? "bg-teal-500/15 text-teal-300" : "bg-red-900/30 text-red-400"
                        }`}>
                          {result.ok ? "✓" : "✗"}
                        </span>
                      )}
                      {/* In-progress indicator */}
                      {isUploading && batchProgress.current === preset.name && !result && (
                        <Loader2 size={12} className="animate-spin text-indigo-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress bar */}
              {isUploading && batchProgress.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[#888899]">
                    <span>Uploading <span className="text-white font-semibold">{batchProgress.current}</span></span>
                    <span>{batchProgress.done}/{batchProgress.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1A1A24] overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Done summary */}
              {!isUploading && batchResults.length > 0 && (
                <div className={`rounded-xl border p-3 ${
                  uploadStatus === "success" ? "border-teal-900/50 bg-teal-950/20" : "border-amber-900/50 bg-amber-950/20"
                }`}>
                  <p className={`text-xs font-bold mb-1 ${uploadStatus === "success" ? "text-teal-300" : "text-amber-300"}`}>
                    {uploadMessage}
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {batchResults.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-[10px]">
                        {r.ok
                          ? <Check size={10} className="text-teal-400 shrink-0" />
                          : <Minus size={10} className="text-red-400 shrink-0" />
                        }
                        <span className={r.ok ? "text-[#888899]" : "text-red-400"}>{r.name}</span>
                        {!r.ok && <span className="text-[#555566] truncate">{r.msg}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "metadata" ? (
            <>
              {/* Filter ID */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Filter ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={filterId}
                  onChange={(e) => {
                    setFilterId(sanitizeId(e.target.value));
                    if (validationErrors.id) setValidationErrors((p) => ({ ...p, id: undefined }));
                  }}
                  placeholder="cinematic-grade-warm-001"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.id && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.id}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-[#555566]">Used in R2 path: filters/{category}/{filterId || "…"}.json</p>
              </div>

              {/* Filter Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => {
                    setFilterName(e.target.value);
                    if (validationErrors.name) setValidationErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Warm Cinematic Grade"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
                {validationErrors.name && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-red-400">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FilterCategoryId)}
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                >
                  {FILTER_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} — {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A warm, desaturated cinematic grade with subtle vignette…"
                  rows={2}
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500 resize-none"
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Intensity Preset</label>
                <div className="flex gap-2">
                  {(["Light", "Medium", "Bold"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        intensity === lvl
                          ? "bg-teal-500/20 border-teal-500 text-teal-300"
                          : "border-[#2A2A38] text-[#888899] hover:border-[#3A3A48] hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-[#555566]">Default slider value: Light=60, Medium=75, Bold=85</p>
              </div>

              {/* Creator */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5">Creator Name (optional)</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500"
                />
              </div>
            </>
          ) : (
            /* ── GPU Params & Preview tab ── */
            <div className="space-y-4">

              {/* gradingParams readout */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <Sliders size={14} className="text-teal-300" />
                  <span>GPU Grading Params</span>
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${hasNonZeroParams ? "bg-teal-500/15 text-teal-300" : "bg-[#2A2A38] text-[#888899]"}`}>
                    {Object.keys(prunedParams).length} active uniform{Object.keys(prunedParams).length !== 1 ? "s" : ""}
                  </span>
                </h4>
                <p className="text-[10px] text-[#555566] mb-3">
                  These GLSL uniforms are what's stored in R2 and fed into <code className="text-teal-400">ColorAdjustmentsEffect</code> on playback.
                </p>
                {hasNonZeroParams ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {Object.entries(prunedParams).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2 rounded bg-[#09090D] border border-[#1A1A24] px-2.5 py-1.5">
                        <span className="font-mono text-[10px] text-[#888899]">{key}</span>
                        <span className="font-mono text-[10px] font-bold text-teal-300">
                          {typeof value === "number" ? value.toFixed(3) : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-300 mb-1.5">No grading parameters — filter will be invisible</p>
                        <p className="text-[10px] text-amber-400/80 leading-relaxed">
                          All sliders are at zero. This JSON will be stored in R2 with an empty{" "}
                          <code className="text-amber-300">gradingParams</code>, and the editor's{" "}
                          <code className="text-amber-300">ColorAdjustmentsEffect</code> will apply
                          all-zero GLSL uniforms — the filter will look identical to no filter at all.
                        </p>
                        <p className="mt-2 text-[10px] text-amber-300 font-semibold">
                          → Close this modal, adjust the grading sliders in Filter Lab, then re-open.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <ImageIcon size={14} className="text-amber-300" /> Thumbnail (PNG → R2)
                </h4>
                {thumbnailDataUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded overflow-hidden border border-[#2A2A38] bg-[#09090D]">
                      <img src={thumbnailDataUrl} alt="Filter thumbnail preview" className="w-full h-auto" />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[#09090D] border border-[#2A2A38] px-3 py-2">
                      <span className="text-[9px] font-bold uppercase text-[#888899] shrink-0">R2 path</span>
                      <code className="flex-1 truncate font-mono text-[10px] text-amber-300">{r2Paths.thumbnail}</code>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-[#2A2A38] bg-[#09090D]">
                    <p className="text-[10px] text-[#555566]">No canvas frame captured — play/pause the video first</p>
                  </div>
                )}
              </div>

              {/* R2 Paths */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <FileJson size={14} className="text-purple-300" /> R2 / API Destinations
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Endpoint", value: r2Paths.apiEndpoint, color: "text-orange-300" },
                    { label: "Index", value: r2Paths.indexFile, color: "text-teal-300" },
                    { label: "Live URL", value: r2Paths.liveUrl, color: "text-blue-300" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-start gap-2 rounded bg-[#09090D] border border-[#1A1A24] px-3 py-2">
                      <span className="text-[9px] font-bold uppercase text-[#888899] shrink-0 w-14">{label}</span>
                      <code className={`flex-1 break-all font-mono text-[10px] ${color}`}>{value}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Payload */}
              <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-4">
                <button
                  type="button"
                  onClick={() => setJsonExpanded((v) => !v)}
                  className="w-full flex items-center justify-between text-xs font-bold text-white mb-1 hover:text-teal-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Code2 size={14} className="text-teal-300" /> Full JSON Payload
                  </span>
                  {jsonExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <p className="text-[10px] text-[#555566] mb-3">Exact body POSTed to <code className="text-teal-400">/filters/upload</code></p>
                {jsonExpanded ? (
                  <pre className="overflow-x-auto rounded-lg border border-[#1A1A24] bg-[#09090D] p-3 font-mono text-[10px] text-teal-200 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(r2Payload, null, 2)}
                  </pre>
                ) : (
                  <button
                    type="button"
                    onClick={() => setJsonExpanded(true)}
                    className="w-full rounded-lg border border-dashed border-[#2A2A38] py-2 text-[10px] text-[#555566] hover:text-teal-300 hover:border-teal-500/30 transition-colors"
                  >
                    Click to expand payload JSON
                  </button>
                )}
              </div>

              {hasErrors && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-300 mb-2">Fix these before uploading</h4>
                      <ul className="space-y-1 text-[10px] text-red-400">
                        {Object.entries(validationErrors).map(([key, msg]) => (
                          <li key={key}>• {String(msg)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-[#2A2A38] bg-[#15151C] p-4 shrink-0 space-y-3">
          {uploadMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] ${
                isError
                  ? "border-red-900/40 bg-red-950/30 text-red-300"
                  : isSuccess
                    ? "border-teal-900/40 bg-teal-950/30 text-teal-300"
                    : "border-[#2A2A38] bg-[#0B0B10] text-[#9A9AAA]"
              }`}
            >
              {isError ? (
                <AlertTriangle size={14} className="shrink-0" />
              ) : isSuccess ? (
                <CheckCircle size={14} className="shrink-0" />
              ) : (
                <Loader2 size={14} className="shrink-0 animate-spin" />
              )}
              <span className="truncate">{uploadMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-lg border border-[#2A2A38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38] disabled:opacity-50"
            >
              {isSuccess ? "Close" : "Cancel"}
            </button>

            {isBatchMode ? (
              <button
                type="button"
                onClick={handleBatchUpload}
                disabled={isUploading || selectedPresetIds.size === 0}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading {batchProgress.done}/{batchProgress.total}…
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle size={14} />
                    Done
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    Upload {selectedPresetIds.size} Preset{selectedPresetIds.size !== 1 ? "s" : ""} to R2
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || isSuccess || !hasNonZeroParams}
                title={!hasNonZeroParams ? "Adjust at least one slider in Filter Lab before publishing" : undefined}
                className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-black hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading…
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle size={14} />
                    Published
                  </>
                ) : !hasNonZeroParams ? (
                  <>
                    <AlertTriangle size={14} />
                    No Params Set
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    Upload to R2
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
