import React from "react";

interface CanvasPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  mediaUrl: string;
  isVideo: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  latency: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  showSplit: boolean;
  onSetShowSplit: (val: boolean) => void;
  splitPosition: number;
  onMouseDownSplit: (e: React.MouseEvent) => void;
  onLoadedMetadata: () => void;
  onVideoError: () => void;
  onTimeUpdate: () => void;
  onSetPlaying: (playing: boolean) => void;
  onSkipPrev: () => void;
  onSkipNext: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onProgressSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetAll: () => void;
  onExportFrame: () => void;
}

function formatTimecode(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const f = Math.floor((secs % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

function formatFrame(secs: number) {
  return Math.floor(secs * 60).toString().padStart(6, "0");
}

export function CanvasPreview({
  videoRef,
  canvasRef,
  containerRef,
  timelineRef,
  mediaUrl,
  isVideo,
  playing,
  currentTime,
  duration,
  fps,
  latency,
  cpuUsage,
  gpuUsage,
  memUsage,
  showSplit,
  onSetShowSplit,
  splitPosition,
  onMouseDownSplit,
  onLoadedMetadata,
  onVideoError,
  onTimeUpdate,
  onSetPlaying,
  onSkipPrev,
  onSkipNext,
  onRewind,
  onFastForward,
  onProgressSliderChange,
  onResetAll,
  onExportFrame,
}: CanvasPreviewProps) {
  return (
    <section className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Hidden video element for playback buffer */}
      {isVideo && mediaUrl && (
        <video
          ref={videoRef}
          src={mediaUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onError={onVideoError}
          style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
          preload="auto"
          loop
          muted
          playsInline
          crossOrigin="anonymous"
        />
      )}

      {/* Canvas preview space */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 bg-surface-container-lowest relative group border-b border-outline-variant">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#4d8eff 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
          }}
        />

        {mediaUrl ? (
          <div ref={containerRef} className="relative max-w-full max-h-[70vh] aspect-video bg-black rounded shadow-2xl border border-outline-variant overflow-hidden flex items-center justify-center select-none">
            {/* The main WebGL canvas */}
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

            {/* Split Comparison Slider Line overlay */}
            {showSplit && (
              <>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-ew-resize z-20 shadow-[0_0_10px_rgba(77,142,255,0.8)]"
                  style={{ left: `${splitPosition}%` }}
                  onMouseDown={onMouseDownSplit}
                >
                  {/* Handle button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface border border-outline-variant hover:border-primary flex items-center justify-center shadow-lg cursor-ew-resize transition-colors">
                    <span className="material-symbols-outlined text-[12px] text-primary">
                      unfold_more
                    </span>
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface/85 backdrop-blur text-[8px] font-mono-data border border-outline-variant/30 text-on-surface-variant z-10">
                  ORIGINAL
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-surface/85 backdrop-blur text-[8px] font-mono-data border border-outline-variant/30 text-primary z-10">
                  GRADED
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-6 border border-dashed border-outline-variant/50 rounded-xl bg-surface-container/30">
            <span className="material-symbols-outlined text-outline/40 text-[48px]" style={{ fontVariationSettings: "'wght' 200" }}>
              filter_b_and_w
            </span>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-on-surface">No media loaded</p>
              <p className="text-[10px] text-outline leading-normal">
                Load a video or image file from the Left Sidebar to start grading.
              </p>
            </div>
          </div>
        )}

        {/* Telemetry HUD overlays */}
        {mediaUrl && (
          <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur rounded border border-outline-variant/50 p-2 font-mono-data text-[8px] leading-relaxed text-secondary/80 pointer-events-none select-none z-10 w-[150px] shadow-lg">
            <div className="text-primary font-bold border-b border-outline-variant/20 pb-0.5 mb-1 uppercase tracking-wider">Telemetry HUD</div>
            <div className="flex justify-between"><span>FPS</span><span className="text-white font-bold">{fps}</span></div>
            <div className="flex justify-between"><span>LATENCY</span><span className="text-white font-bold">{latency}ms</span></div>
            <div className="flex justify-between"><span>CPU_EST</span><span className="text-white font-bold">{cpuUsage}%</span></div>
            <div className="flex justify-between"><span>GPU_EST</span><span className="text-white font-bold">{gpuUsage}%</span></div>
            <div className="flex justify-between"><span>MEM_HEAP</span><span className="text-white font-bold">{memUsage}</span></div>
          </div>
        )}
      </div>

      {/* Sequencer / playback controls */}
      <div className="bg-surface-container-lowest border-t border-outline-variant px-3 py-1 flex flex-col gap-1 z-30 select-none">
        {/* Timeline bar */}
        <div className="flex items-center gap-2">
          <div
            ref={timelineRef}
            className="flex-1 h-3 rounded bg-surface-container border border-outline-variant/50 relative cursor-pointer timeline-trough overflow-hidden"
          >
            {/* Playback progress bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-primary/20 border-r border-primary transition-all duration-75"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Slider control input */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.01"
              value={currentTime}
              onChange={onProgressSliderChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              disabled={!isVideo || !mediaUrl}
            />
          </div>
        </div>

        {/* Action Controls row */}
        <div className="flex justify-between items-center h-[26px]">
          {/* Time indicators */}
          <div className="flex items-center gap-2 text-outline font-mono-data text-[9px]">
            <span className="text-on-surface font-bold">{formatTimecode(currentTime)}</span>
            <span>/</span>
            <span>{formatTimecode(duration)}</span>
            <span className="text-outline-variant font-bold bg-surface-container px-1 py-0.5 rounded">
              FRM_{formatFrame(currentTime)}
            </span>
          </div>

          {/* Center Playback control buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSkipPrev}
              disabled={!isVideo || !mediaUrl}
              className="w-6 h-6 rounded flex items-center justify-center bg-surface-container border border-outline-variant hover:border-primary disabled:opacity-40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">skip_previous</span>
            </button>
            <button
              onClick={onRewind}
              disabled={!isVideo || !mediaUrl}
              className="w-6 h-6 rounded flex items-center justify-center bg-surface-container border border-outline-variant hover:border-primary disabled:opacity-40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">fast_rewind</span>
            </button>
            <button
              onClick={() => onSetPlaying(!playing)}
              disabled={!isVideo || !mediaUrl}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                playing
                  ? "bg-primary text-on-primary border-primary shadow-[0_0_8px_rgba(173,198,255,0.4)]"
                  : "bg-surface-container border-outline-variant hover:border-primary hover:text-white"
              } disabled:opacity-40`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {playing ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              onClick={onFastForward}
              disabled={!isVideo || !mediaUrl}
              className="w-6 h-6 rounded flex items-center justify-center bg-surface-container border border-outline-variant hover:border-primary disabled:opacity-40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">fast_forward</span>
            </button>
            <button
              onClick={onSkipNext}
              disabled={!isVideo || !mediaUrl}
              className="w-6 h-6 rounded flex items-center justify-center bg-surface-container border border-outline-variant hover:border-primary disabled:opacity-40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">skip_next</span>
            </button>
          </div>

          {/* Quick options buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSetShowSplit(!showSplit)}
              disabled={!mediaUrl}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                showSplit
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-surface-container border-outline-variant/65 text-on-surface-variant hover:text-white"
              } disabled:opacity-40`}
            >
              <span className="material-symbols-outlined text-[11px]">compare</span>
              SPLIT
            </button>
            <button
              onClick={onExportFrame}
              disabled={!mediaUrl}
              className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/65 hover:border-primary text-on-surface hover:text-white text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[11px]">download</span>
              SNAPSHOT
            </button>
            <button
              onClick={onResetAll}
              disabled={!mediaUrl}
              className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/65 hover:border-error text-outline hover:text-error text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[11px]">restart_alt</span>
              RESET
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
