import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Maximize2,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  SkipBack,
  SkipForward,
  Split,
} from "lucide-react";

export type FitMode = "contain" | "cover" | "stretch";

export interface MetricState {
  fps: number;
  latencyMs: number;
  decodedFrames: number;
  droppedFrames: number;
  luma: string;
  resolution: string;
}

export interface ValidationState {
  status: "pass" | "warn" | "pending";
  message: string;
}

interface CanvasPreviewProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  timelineRef: React.RefObject<HTMLInputElement | null>;
  sourceUrl: string;
  sourceName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fitMode: FitMode;
  showSplit: boolean;
  splitPosition: number;
  metrics: MetricState;
  validationState: ValidationState;
  activeValidationEffectName?: string;
  activePresetName?: string;
  status: "loading" | "ready" | "error";
  onSetPlaying: (playing: boolean) => void;
  onSeek: (time: number) => void;
  onSetFitMode: (mode: FitMode) => void;
  onSetShowSplit: (show: boolean) => void;
  onMouseDownSplit: (e: React.MouseEvent | React.PointerEvent) => void;
  onCaptureFrame: () => void;
  onResetSettings: () => void;
}

function formatTimecode(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "00:00:00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const f = Math.floor((secs % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

function formatFrame(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "000000";
  return Math.floor(secs * 60).toString().padStart(6, "0");
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  containerRef,
  videoRef,
  canvasRef,
  timelineRef,
  sourceUrl,
  sourceName,
  isPlaying,
  currentTime,
  duration,
  fitMode,
  showSplit,
  splitPosition,
  metrics,
  validationState,
  activeValidationEffectName,
  activePresetName,
  status,
  onSetPlaying,
  onSeek,
  onSetFitMode,
  onSetShowSplit,
  onMouseDownSplit,
  onCaptureFrame,
  onResetSettings,
}) => {
  return (
    <section className="flex-1 flex flex-col bg-[#070d18] relative overflow-hidden select-none">
      {/* Hidden video element for decoding pipeline */}
      <video
        ref={videoRef}
        src={sourceUrl}
        className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
        preload="auto"
        loop
        muted
        playsInline
        crossOrigin="anonymous"
      />

      {/* Main Canvas preview viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative group border-b border-slate-800/80 bg-slate-950/60">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#38bdf8 0.7px, transparent 0.7px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div ref={containerRef} className="relative w-full max-w-full max-h-[68vh] aspect-video bg-black rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Main WebGL / 2D Canvas */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full block object-contain"
          />

          {/* Status Loading / Error Overlay */}
          {status !== "ready" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-30 text-slate-300">
              <Activity className="animate-spin text-cyan-400" size={24} />
              <span className="text-xs font-mono font-medium">
                {status === "error" ? "Video source unavailable" : "Initializing video stream..."}
              </span>
            </div>
          )}

          {/* Top-Left Badges */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
            <span className="rounded bg-black/80 backdrop-blur-md px-2 py-1 font-mono text-[10px] font-semibold text-cyan-400 border border-slate-800 shadow">
              FPS {metrics.fps}
            </span>
            <span className="rounded bg-black/80 backdrop-blur-md px-2 py-1 font-mono text-[10px] text-slate-300 border border-slate-800 shadow">
              {metrics.resolution}
            </span>
            {activeValidationEffectName && (
              <span className="rounded bg-black/80 backdrop-blur-md px-2 py-1 font-mono text-[10px] font-medium text-cyan-300 border border-cyan-900/50 shadow">
                {activeValidationEffectName}
              </span>
            )}
          </div>

          {/* A/B Split Comparison Slider Overlay */}
          {showSplit && (
            <>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize z-20 shadow-[0_0_12px_rgba(56,189,248,0.9)]"
                style={{ left: `${splitPosition}%` }}
                onPointerDown={onMouseDownSplit}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border border-cyan-400 flex items-center justify-center shadow-xl cursor-ew-resize text-cyan-300 text-[10px] font-bold">
                  ::
                </div>
              </div>
              <div className="pointer-events-none absolute top-3 left-3 px-2 py-0.5 rounded bg-black/85 backdrop-blur text-[9px] font-mono font-bold text-slate-300 border border-slate-800 z-10">
                SOURCE
              </div>
              <div className="pointer-events-none absolute top-3 right-3 px-2 py-0.5 rounded bg-black/85 backdrop-blur text-[9px] font-mono font-bold text-cyan-400 border border-cyan-900/50 z-10">
                PROCESSED
              </div>
            </>
          )}

          {/* Telemetry HUD Overlay */}
          <div className="pointer-events-none absolute bottom-3 right-3 bg-black/85 backdrop-blur-md rounded-lg border border-slate-800 p-2.5 font-mono text-[9px] text-slate-400 z-10 w-[160px] shadow-2xl">
            <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Telemetry HUD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="flex justify-between"><span>LATENCY</span><span className="text-slate-100 font-bold">{metrics.latencyMs}ms</span></div>
            <div className="flex justify-between"><span>DECODED</span><span className="text-slate-100 font-bold">{metrics.decodedFrames}</span></div>
            <div className="flex justify-between"><span>DROPPED</span><span className="text-slate-100 font-bold">{metrics.droppedFrames}</span></div>
            <div className="flex justify-between items-center mt-0.5 pt-0.5 border-t border-slate-800/60">
              <span>VALIDATION</span>
              <span className={`font-bold flex items-center gap-1 ${validationState.status === "pass" ? "text-emerald-400" : "text-amber-400"}`}>
                {validationState.status === "pass" ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                {validationState.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Scrubber & Action Controls Bar */}
      <div className="bg-[#0a1220] border-t border-slate-800 px-4 py-2.5 flex flex-col gap-2 z-20">
        {/* Timeline Range Scrubber */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 h-3 rounded bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer">
            <div
              className="absolute left-0 top-0 bottom-0 bg-cyan-500/25 border-r border-cyan-400 transition-all duration-75"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <input
              ref={timelineRef}
              type="range"
              min={0}
              max={duration || 100}
              step={0.01}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              aria-label="Seek timeline"
            />
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex justify-between items-center h-8">
          {/* Timecode & Frame Counters */}
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="text-slate-100 font-bold">{formatTimecode(currentTime)}</span>
            <span>/</span>
            <span>{formatTimecode(duration)}</span>
            <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-semibold">
              FRM_{formatFrame(currentTime)}
            </span>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSeek(0)}
              className="w-7 h-7 rounded flex items-center justify-center bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-colors"
              title="Restart (00:00)"
              aria-label="Restart"
            >
              <SkipBack size={13} />
            </button>
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="w-7 h-7 rounded flex items-center justify-center bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-colors"
              title="Rewind 5s"
              aria-label="Rewind 5s"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={() => onSetPlaying(!isPlaying)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.5)] hover:bg-cyan-300"
                  : "bg-slate-900 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400"
              }`}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="w-7 h-7 rounded flex items-center justify-center bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-colors"
              title="Fast Forward 5s"
              aria-label="Fast forward 5s"
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Quick Option Toolbar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSetShowSplit(!showSplit)}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                showSplit
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
              title="Toggle A/B Split Comparison"
            >
              <Split size={12} />
              SPLIT
            </button>
            <button
              onClick={() => onSetFitMode(fitMode === "contain" ? "cover" : "contain")}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-[10px] font-bold transition-colors flex items-center gap-1"
              title={`Fit Mode: ${fitMode === "contain" ? "Fit (Uncropped)" : "Cover (Fill)"}`}
            >
              <Maximize2 size={12} className="text-cyan-400" />
              {fitMode === "contain" ? "FIT" : "COVER"}
            </button>
            <button
              onClick={onCaptureFrame}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-[10px] font-bold transition-colors flex items-center gap-1"
              title="Export Snapshot Frame"
            >
              <Download size={12} />
              SNAPSHOT
            </button>
            <button
              onClick={onResetSettings}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-red-500/80 text-slate-400 hover:text-red-400 text-[10px] font-bold transition-colors flex items-center gap-1"
              title="Reset Video Settings"
            >
              <RefreshCcw size={12} />
              RESET
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
