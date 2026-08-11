import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Play,
  FileVideo,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles,
  StopCircle,
} from "lucide-react";
import {
  exportValidator,
  ExportJob,
  EXPORT_PROFILE_PRESETS,
  type OverlayDocument,
  type ExportConfig,
  type ExportFormat,
  type ExportProfile,
  type ExportValidationDiagnostic,
  type ExportJobRecord,
} from "@clypra-studio/engine";

interface ExportModalProps {
  doc: OverlayDocument;
  isOpen: boolean;
  onClose: () => void;
  onJobComplete?: (record: ExportJobRecord) => void;
}

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; description: string; icon: React.ReactNode }> = [
  { id: "png-sequence", label: "PNG Sequence", description: "Alpha-transparent PNG frame sequence", icon: <Layers size={14} /> },
  { id: "webm", label: "WebM Video", description: "VP9/WebM video stream for web playback", icon: <FileVideo size={14} /> },
  { id: "gif", label: "Animated GIF", description: "Looped animated image for social shares", icon: <Film size={14} /> },
  { id: "raw-frames", label: "Raw RGBA Frames", description: "Uncompressed frame descriptors for pipeline inspection", icon: <ImageIcon size={14} /> },
];

const PROFILE_OPTIONS: Array<{ id: ExportProfile; label: string; dims?: { w: number; h: number } }> = [
  { id: "1080p-landscape", label: "1080p Landscape (16:9)", dims: { w: 1920, h: 1080 } },
  { id: "720p-landscape", label: "720p Landscape (16:9)", dims: { w: 1280, h: 720 } },
  { id: "1080p-portrait", label: "Mobile Portrait (9:16)", dims: { w: 1080, h: 1920 } },
  { id: "1080p-square", label: "Square (1:1)", dims: { w: 1080, h: 1080 } },
  { id: "4:5-portrait", label: "Social Portrait (4:5)", dims: { w: 1080, h: 1350 } },
  { id: "custom", label: "Custom Canvas Size" },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  doc,
  isOpen,
  onClose,
  onJobComplete,
}) => {
  const [format, setFormat] = useState<ExportFormat>("png-sequence");
  const [profile, setProfile] = useState<ExportProfile>("1080p-landscape");
  const [scale, setScale] = useState<number>(1.0);
  const [fps, setFps] = useState<number>(30);
  const [duration, setDuration] = useState<number>(doc.duration || 5);
  const [transparent, setTransparent] = useState<boolean>(true);
  const [activeJob, setActiveJob] = useState<ExportJob | null>(null);
  const [jobState, setJobState] = useState<ExportJobRecord | null>(null);

  // Sync duration with document
  useEffect(() => {
    setDuration(doc.duration || 5);
  }, [doc.duration]);

  // Derive export config
  const config: ExportConfig = useMemo(
    () => ({
      profile,
      scale,
      fps,
      duration,
      transparent,
      format,
      breakpointId: doc.breakpoints?.activeId ?? null,
    }),
    [profile, scale, fps, duration, transparent, format, doc.breakpoints?.activeId]
  );

  // Derive target canvas dimensions
  const dims = useMemo(() => {
    if (profile !== "custom" && EXPORT_PROFILE_PRESETS[profile]) {
      const p = EXPORT_PROFILE_PRESETS[profile];
      return { width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
    }
    return { width: Math.round(doc.canvas.width * scale), height: Math.round(doc.canvas.height * scale) };
  }, [profile, scale, doc.canvas.width, doc.canvas.height]);

  const totalFrames = Math.max(1, Math.ceil(duration * fps));

  // Run preflight validation
  const diagnostics: ExportValidationDiagnostic[] = useMemo(() => {
    if (!isOpen) return [];
    return exportValidator.validate(doc, config);
  }, [doc, config, isOpen]);

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const canExport = errors.length === 0 && (!activeJob || activeJob.status === "completed" || activeJob.status === "failed" || activeJob.status === "cancelled");

  // Subscribe to active job updates
  useEffect(() => {
    if (!activeJob) return;
    const unsubscribe = activeJob.subscribe((j) => {
      const record = j.toRecord();
      setJobState(record);
      if (j.status === "completed" && onJobComplete) {
        onJobComplete(record);
      }
    });
    return () => unsubscribe();
  }, [activeJob, onJobComplete]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (!canExport) return;
    const job = new ExportJob(doc, config);
    setActiveJob(job);
    try {
      await job.start();
    } catch (err) {
      // Error handled via jobState
    }
  };

  const handleCancelExport = () => {
    if (activeJob) {
      activeJob.cancel();
    }
  };

  const handleDownload = () => {
    if (!jobState?.output) return;
    const out = jobState.output;

    if (out.blob) {
      const url = URL.createObjectURL(out.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.${out.format === "webm" ? "webm" : out.format === "gif" ? "gif" : "bin"}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (out.files && out.files.length > 0) {
      const firstFile = out.files[0];
      const url = URL.createObjectURL(firstFile.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = firstFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#121217] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#17171F] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Production Export Engine</h2>
              <p className="text-[11px] text-gray-400 font-medium">Render & encode {doc.title} with canonical fidelity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Job Progress View */}
          {jobState && (jobState.status === "rendering" || jobState.status === "encoding" || jobState.status === "validating") && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                  </span>
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                    {jobState.status === "validating" ? "Validating Scene..." : jobState.status === "rendering" ? "Rendering Frames..." : "Encoding Output..."}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-violet-300">{jobState.progress.percent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-150"
                  style={{ width: `${jobState.progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>
                  Frame {jobState.progress.renderedFrames} / {jobState.progress.totalFrames} ({jobState.progress.currentTime.toFixed(2)}s)
                </span>
                <button
                  onClick={handleCancelExport}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 font-sans font-semibold transition-colors"
                >
                  <StopCircle size={12} /> Cancel Export
                </button>
              </div>
            </div>
          )}

          {/* Job Completed Banner */}
          {jobState && jobState.status === "completed" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Export Ready!</h4>
                  <p className="text-[11px] text-gray-400">{jobState.output?.frameCount} frames rendered successfully.</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Download size={14} /> Download Output
              </button>
            </div>
          )}

          {/* Format Selection Grid */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map((opt) => {
                const isSelected = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex items-start gap-3 rounded-xl p-3.5 border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-violet-500/60 bg-violet-500/10 text-white shadow-md shadow-violet-500/10"
                        : "border-white/5 bg-[#17171F] text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400"}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution & Settings Controls */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-[#17171F] p-4">
            {/* Resolution Profile */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Preset Resolution</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as ExportProfile)}
                className="w-full rounded-lg border border-white/10 bg-[#121217] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 font-medium"
              >
                {PROFILE_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} {p.dims ? `(${p.dims.w}×${p.dims.h})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Scale Multiplier */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Resolution Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#121217] px-3 py-2 text-xs text-white outline-none focus:border-violet-500 font-medium"
              >
                <option value={1.0}>1.0× (Standard {dims.width}×{dims.height})</option>
                <option value={1.5}>1.5× Super-Sampled ({Math.round(dims.width * 1.5)}×{Math.round(dims.height * 1.5)})</option>
                <option value={2.0}>2.0× Ultra HD ({dims.width * 2}×{dims.height * 2})</option>
              </select>
            </div>

            {/* FPS Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block mb-1.5">Frame Rate (FPS)</label>
              <div className="flex gap-2">
                {[24, 30, 60].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFps(f)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all border ${
                      fps === f ? "border-violet-500 bg-violet-500/20 text-violet-300" : "border-white/5 bg-[#121217] text-gray-400 hover:text-white"
                    }`}
                  >
                    {f} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Transparency Toggle */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="text-xs font-bold text-white block">Transparent Alpha</span>
                <span className="text-[10px] text-gray-400 block">Clear canvas background for overlay compositing</span>
              </div>
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black accent-violet-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Preflight Diagnostics Summary Card */}
          <div className="rounded-xl border border-white/5 bg-[#17171F] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Preflight Validation</span>
              {errors.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 size={12} /> Ready for Export
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                  <AlertCircle size={12} /> {errors.length} Preflight Error{errors.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {diagnostics.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {diagnostics.map((diag, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs border ${
                      diag.severity === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {diag.severity === "error" ? (
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                    ) : (
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    )}
                    <div className="flex-1 text-[11px] leading-tight">{diag.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400">
                All preflight checks passed: assets, fonts, expressions, and duration constraints are valid.
              </div>
            )}

            {/* Target Output Summary */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] font-mono text-gray-400">
              <span>Target: {dims.width}×{dims.height} @ {fps} FPS</span>
              <span>{totalFrames} Frames ({duration.toFixed(1)}s)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/5 bg-[#17171F] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartExport}
            disabled={!canExport}
            className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold transition-all shadow-lg ${
              canExport
                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-400 hover:to-indigo-500 shadow-violet-500/25 cursor-pointer"
                : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <Play size={14} fill="currentColor" /> Start Export
          </button>
        </div>
      </div>
    </div>
  );
};
