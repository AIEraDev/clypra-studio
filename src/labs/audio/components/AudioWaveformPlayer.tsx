import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Gauge,
  Music,
  Radio,
} from "lucide-react";

interface AudioWaveformPlayerProps {
  peaks: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isDecoding: boolean;
  trackTitle?: string;
  trackAuthor?: string;
  category?: string;
  onTogglePlay: () => void;
  onSeekPercent: (fraction: number) => void;
  onReset: () => void;
  onToggleLoop: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (rate: number) => void;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}`;
}

export function AudioWaveformPlayer({
  peaks,
  isPlaying,
  currentTime,
  duration,
  isLooping,
  playbackRate,
  volume,
  isMuted,
  isDecoding,
  trackTitle,
  trackAuthor,
  category,
  onTogglePlay,
  onSeekPercent,
  onReset,
  onToggleLoop,
  onSetVolume,
  onToggleMute,
  onSetPlaybackRate,
}: AudioWaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Global spacebar keyboard shortcut for play/pause when not in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const target = e.target as HTMLElement | null;
        const isInput =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        if (!isInput && duration > 0) {
          e.preventDefault();
          onTogglePlay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, duration]);

  // Render high-DPI waveform to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const progressFraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;
    const totalBars = peaks.length || 64;
    const barSpacing = 2.5;
    const barWidth = Math.max(1.5, (width - (totalBars - 1) * barSpacing) / totalBars);

    for (let i = 0; i < totalBars; i++) {
      const x = i * (barWidth + barSpacing);
      const peak = peaks[i] ?? 0.15;
      const barHeight = Math.max(4, peak * (height - 12));
      const y = (height - barHeight) / 2;

      const barFraction = (i + 0.5) / totalBars;
      const isPast = barFraction <= progressFraction;

      // Color selection based on playback progress
      if (isPast) {
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, "#2dd4bf"); // teal
        grad.addColorStop(1, "#06b6d4"); // cyan
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = "#252536";
      }

      // Draw bar with rounded corner fallback
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, barWidth, barHeight, 2);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }

    // Draw playhead vertical line
    if (duration > 0) {
      const playheadX = progressFraction * width;
      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead top marker
      ctx.fillStyle = "#2dd4bf";
      ctx.beginPath();
      ctx.arc(playheadX, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hover scrub line if mouse hovering
    if (hoverPercent !== null) {
      const hoverX = hoverPercent * width;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [peaks, currentTime, duration, hoverPercent]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeekPercent(fraction);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(fraction);
    if (isDragging) {
      onSeekPercent(fraction);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#262638] bg-linear-to-b from-[#14141F] to-[#0D0D14] p-5 shadow-2xl">
      {/* Background glow when playing */}
      {isPlaying && (
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl transition-opacity duration-700" />
      )}

      {/* Top bar: Track info & Live playback indicator */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
            {isPlaying ? (
              <Radio size={18} className="animate-pulse text-teal-400" />
            ) : (
              <Music size={18} className="text-teal-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {trackTitle || "Audio Workbench Preview"}
              </h2>
              {category && (
                <span className="rounded-md border border-[#303046] bg-[#1A1A28] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                  {category}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A8A9E]">
              {trackAuthor ? `by ${trackAuthor}` : "Click play or press Space to audition"}
            </p>
          </div>
        </div>

        {/* Real-time Timecode */}
        <div className="flex items-center gap-2 rounded-lg border border-[#262638] bg-[#090910] px-3 py-1.5 font-mono text-xs">
          <span className="font-bold text-teal-300">{formatTime(currentTime)}</span>
          <span className="text-[#55556E]">/</span>
          <span className="text-[#88889C]">{formatTime(duration)}</span>
          {isDecoding && (
            <span className="ml-1 text-[10px] text-teal-400 animate-pulse">
              (decoding...)
            </span>
          )}
        </div>
      </div>

      {/* Interactive Waveform Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverPercent(null)}
        className="group relative h-28 w-full cursor-pointer select-none rounded-xl border border-[#222234] bg-[#0A0A12] p-2 transition-colors hover:border-teal-500/40"
        title="Click or drag to scrub audio timeline"
      >
        <canvas ref={canvasRef} className="h-full w-full block" />

        {/* Hover timestamp tooltip */}
        {hoverPercent !== null && duration > 0 && (
          <div
            className="pointer-events-none absolute -top-3 z-20 -translate-x-1/2 rounded bg-teal-950/90 px-1.5 py-0.5 text-[10px] font-mono text-teal-200 shadow ring-1 ring-teal-500/40"
            style={{ left: `${hoverPercent * 100}%` }}
          >
            {formatTime(hoverPercent * duration)}
          </div>
        )}
      </div>

      {/* Playback Controls Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#1C1C2A] pt-4">
        {/* Left: Main Transport */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Main Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={duration <= 0}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 font-bold text-black shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all hover:scale-105 hover:bg-teal-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Reset / Rewind to start */}
          <button
            type="button"
            onClick={onReset}
            disabled={duration <= 0}
            title="Rewind to start"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#28283C] bg-[#12121D] text-gray-300 transition-colors hover:border-teal-500/40 hover:text-white disabled:opacity-40"
          >
            <RotateCcw size={14} />
          </button>

          {/* Loop audition toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            title={isLooping ? "Loop audition enabled" : "Enable loop audition"}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
              isLooping
                ? "border-teal-500/50 bg-teal-500/15 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                : "border-[#28283C] bg-[#12121D] text-[#7A7A8E] hover:text-gray-200"
            }`}
          >
            <Repeat size={13} className={isLooping ? "text-teal-400" : ""} />
            <span>Loop</span>
          </button>
        </div>

        {/* Right: Speed & Volume */}
        <div className="flex items-center gap-3">
          {/* Playback speed selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#28283C] bg-[#12121D] px-2 py-1 text-xs text-[#8A8A9E]">
            <Gauge size={13} className="text-gray-400" />
            <select
              value={playbackRate}
              onChange={(e) => onSetPlaybackRate(Number(e.target.value))}
              aria-label="Playback rate"
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              {speedOptions.map((rate) => (
                <option key={rate} value={rate} className="bg-[#12121D] text-white">
                  {rate}x
                </option>
              ))}
            </select>
          </div>

          {/* Volume slider & mute button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className="text-gray-400 transition-colors hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              className="h-1.5 w-18 cursor-pointer appearance-none rounded-lg bg-[#252536] accent-teal-400"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
