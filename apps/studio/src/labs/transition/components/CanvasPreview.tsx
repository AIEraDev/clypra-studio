import React from "react";

interface CanvasPreviewProps {
  videoARef: React.RefObject<HTMLVideoElement | null>;
  videoBRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  clipAUrl: string;
  clipBUrl: string;
  playing: boolean;
  progress: number;
  duration: number;
  latency: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  redHeight: number;
  greenHeight: number;
  blueHeight: number;
  onSetPlaying: (playing: boolean) => void;
  onSkipStart: () => void;
  onSkipEnd: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onProgressSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadedMetadataA: () => void;
  onLoadedMetadataB: () => void;
  onClipAError: () => void;
  onClipBError: () => void;
}

function formatTimecode(p: number, duration: number) {
  const totalSecs = p * duration;
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  const f = Math.floor((totalSecs % 1) * 60);
  return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

function formatFrame(p: number, duration: number) {
  return Math.floor(p * duration * 60).toString().padStart(6, "0");
}

export function CanvasPreview({
  videoARef,
  videoBRef,
  canvasRef,
  timelineRef,
  clipAUrl,
  clipBUrl,
  playing,
  progress,
  duration,
  latency,
  cpuUsage,
  gpuUsage,
  memUsage,
  redHeight,
  greenHeight,
  blueHeight,
  onSetPlaying,
  onSkipStart,
  onSkipEnd,
  onRewind,
  onFastForward,
  onMouseDown,
  onProgressSliderChange,
  onLoadedMetadataA,
  onLoadedMetadataB,
  onClipAError,
  onClipBError,
}: CanvasPreviewProps) {
  return (
    <section className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Dual hidden video elements */}
      <video
        ref={videoARef}
        src={clipAUrl}
        onLoadedMetadata={onLoadedMetadataA}
        onError={onClipAError}
        style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
        loop
        playsInline
        crossOrigin="anonymous"
      />
      <video
        ref={videoBRef}
        src={clipBUrl}
        onLoadedMetadata={onLoadedMetadataB}
        onError={onClipBError}
        style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
        loop
        playsInline
        crossOrigin="anonymous"
      />

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 bg-surface-container-lowest relative group border-b border-outline-variant">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#4d8eff 0.5px, transparent 0.5px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative aspect-video h-[420px] border border-outline-variant bg-black shadow-inner flex items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />

          {/* Target Crosshair */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 flex items-center justify-center">
            <div className="w-8 h-px bg-white/20 absolute" />
            <div className="h-8 w-px bg-white/20 absolute" />
          </div>

          {/* Sequential Action Overlay */}
          <button
            onClick={() => onSetPlaying(!playing)}
            className={`z-10 absolute bg-black/40 hover:bg-black/60 text-primary border px-5 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm transition-all scale-90 ${
              playing ? "border-tertiary/40 text-tertiary" : "border-primary/40 text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {playing ? "pause" : "play_arrow"}
            </span>
            <span className="font-bold tracking-widest text-xs">
              {playing ? "HALT_SEQ" : "INIT_SEQ"}
            </span>
          </button>

          {/* Metadata Overlay */}
          <div className="absolute top-2 left-2 flex gap-2 font-mono-data text-[9px] bg-black/80 p-1.5 border border-white/10 backdrop-blur select-none">
            <div className="flex flex-col border-r border-white/20 pr-2">
              <span className="text-primary uppercase opacity-70">Mix_Ratio</span>
              <span className="text-white">
                {(progress * 100).toFixed(0)}% : {((1 - progress) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex flex-col border-r border-white/20 pr-2">
              <span className="text-primary uppercase opacity-70">Res</span>
              <span className="text-white">1280x720</span>
            </div>
            <div className="flex flex-col">
              <span className="text-primary uppercase opacity-70">Framerate</span>
              <span className="text-white">60.00 FPS</span>
            </div>
          </div>

          {/* Histogram */}
          <div className="absolute bottom-2 right-2 w-24 h-12 bg-black/60 border border-white/10 p-1 flex items-end gap-px select-none">
            <div
              className="bg-red-500/40 w-full"
              style={{ height: `${redHeight}%`, transition: "height 0.2s" }}
            />
            <div
              className="bg-green-500/40 w-full"
              style={{ height: `${greenHeight}%`, transition: "height 0.2s" }}
            />
            <div
              className="bg-blue-500/40 w-full"
              style={{ height: `${blueHeight}%`, transition: "height 0.2s" }}
            />
          </div>
        </div>
      </div>

      {/* Console Timeline */}
      <div className="bg-surface-container-high h-40 flex flex-col select-none">
        <div className="flex items-center px-3 py-1 border-b border-outline-variant bg-surface-container-highest/50 justify-between">
          <div className="flex gap-4 font-mono-data text-[10px]">
            <span className="text-primary font-bold">TC: {formatTimecode(progress, duration)}</span>
            <span className="text-on-surface-variant">FRM: {formatFrame(progress, duration)}</span>
            <span className="text-on-surface-variant">DUR: {duration.toFixed(2)}s</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">TRANSITION_SEQ</span>
            <span className="text-[9px] bg-secondary/20 text-secondary px-1 rounded">
              MIXER: ACTIVE
            </span>
          </div>
        </div>

        {/* Timeline track */}
        <div
          ref={timelineRef}
          onMouseDown={onMouseDown}
          className="flex-1 bg-surface-container-lowest relative timeline-trough border-b border-outline-variant overflow-hidden cursor-crosshair"
        >
          {/* Rule Indicator */}
          <div
            className="absolute top-0 bottom-0 left-[50%] w-px bg-primary z-10"
            style={{ left: `${progress * 100}%` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45 border border-white/20" />
          </div>

          {/* Transition overlap visualisation indicator */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/10 border-r border-primary/20"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Playback controls */}
        <div className="flex justify-between items-center px-4 py-1.5 bg-surface-container">
          <div className="flex gap-4 items-center">
            <button onClick={onSkipStart} className="text-on-surface-variant hover:text-primary p-0.5">
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
            <button onClick={onRewind} className="text-on-surface-variant hover:text-primary p-0.5">
              <span className="material-symbols-outlined">fast_rewind</span>
            </button>
            <button
              onClick={() => onSetPlaying(!playing)}
              className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center hover:bg-[#c8daff] transition-all"
            >
              <span className="material-symbols-outlined">{playing ? "pause" : "play_arrow"}</span>
            </button>
            <button onClick={onFastForward} className="text-on-surface-variant hover:text-primary p-0.5">
              <span className="material-symbols-outlined">fast_forward</span>
            </button>
            <button onClick={onSkipEnd} className="text-on-surface-variant hover:text-primary p-0.5">
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>
          <div className="flex items-center gap-2 font-mono-data text-[10px]">
            <span className="text-on-surface-variant opacity-50">JOG PROGRESS</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={onProgressSliderChange}
              className="w-24 accent-primary cursor-ew-resize"
            />
            <span className="text-primary font-bold">{(progress * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="h-6 bg-surface-container-lowest border-t border-outline-variant flex items-center px-2 justify-between text-[9px] font-mono-data select-none">
        <div className="flex gap-3">
          <span className="text-on-surface-variant uppercase">
            Log: <span className="text-secondary">Pipeline Active</span>
          </span>
          <span className="text-on-surface-variant uppercase">
            Latency: <span className="text-primary">{latency}ms</span>
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-outline">CPU: {cpuUsage}%</span>
          <span className="text-outline">GPU: {gpuUsage}%</span>
          <span className="text-outline">MEM: {memUsage}</span>
        </div>
      </div>
    </section>
  );
}
