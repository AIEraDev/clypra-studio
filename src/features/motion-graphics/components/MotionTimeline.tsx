import React, { useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
} from "lucide-react";
import type { MotionGraphicTemplate, MotionLayer } from "../types";
import { evaluatePhase } from "../renderer/motionCompositor";

interface MotionTimelineProps {
  template: MotionGraphicTemplate;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onTimeChange: (time: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSpeedChange: (speed: number) => void;
}

function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

export function MotionTimeline({
  template,
  currentTime,
  isPlaying,
  isLooping,
  playbackSpeed,
  selectedLayerId,
  onSelectLayer,
  onToggleLayerVisibility,
  onTimeChange,
  onTogglePlay,
  onToggleLoop,
  onSpeedChange,
}: MotionTimelineProps) {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const { introDuration, holdDuration, outroDuration } = template.phaseTiming;
  const totalDuration = introDuration + holdDuration + outroDuration;
  const phaseInfo = evaluatePhase(currentTime, template.phaseTiming);

  const introPct = (introDuration / totalDuration) * 100;
  const holdPct = (holdDuration / totalDuration) * 100;
  const outroPct = (outroDuration / totalDuration) * 100;
  const currentPct = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onTimeChange(ratio * totalDuration);
  };

  return (
    <div className="flex flex-col border-t border-[#1e1e2d] bg-[#0c0c12] text-white select-none">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a26]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTimeChange(0)}
            title="Reset to 00:00.00"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7c6fff] hover:bg-[#6b5eee] text-white shadow-lg shadow-[#7c6fff]/30 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleLoop}
            title={isLooping ? "Disable Looping" : "Enable Looping"}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? "text-teal-400 bg-teal-400/10" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Timecode Readout */}
          <div className="flex items-center font-mono text-sm tracking-wider px-2 py-0.5 rounded bg-[#151520] border border-white/5">
            <span className="text-white font-semibold">{formatTimecode(currentTime)}</span>
            <span className="text-gray-500 mx-1.5">/</span>
            <span className="text-gray-400">{formatTimecode(totalDuration)}</span>
          </div>
        </div>

        {/* Phase Region Breakdown Tag */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Intro: {introDuration.toFixed(2)}s
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Hold: {holdDuration.toFixed(2)}s
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Outro: {outroDuration.toFixed(2)}s
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackSpeed === spd
                  ? "bg-[#7c6fff] text-white font-semibold"
                  : "text-gray-400 hover:bg-white/10"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Phase Bar & Scrubber */}
      <div className="relative px-4 py-3">
        {/* Phase labels strip */}
        <div className="flex h-5 w-full rounded-t overflow-hidden text-[10px] font-semibold tracking-wider uppercase select-none">
          <div
            style={{ width: `${introPct}%` }}
            className="flex items-center justify-center bg-purple-900/40 text-purple-300 border-r border-purple-500/30"
          >
            ⚡ Entrance Intro
          </div>
          <div
            style={{ width: `${holdPct}%` }}
            className="flex items-center justify-center bg-emerald-900/40 text-emerald-300 border-r border-emerald-500/30"
          >
            ⚓ Hold State (Resting)
          </div>
          <div
            style={{ width: `${outroPct}%` }}
            className="flex items-center justify-center bg-rose-900/40 text-rose-300"
          >
            💨 Outro
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative h-6 w-full rounded-b bg-[#12121a] border border-[#222230] cursor-pointer"
        >
          {/* Phase colored backgrounds */}
          <div className="absolute inset-0 flex">
            <div style={{ width: `${introPct}%` }} className="bg-purple-500/15 border-r border-purple-500/20" />
            <div style={{ width: `${holdPct}%` }} className="bg-emerald-500/15 border-r border-emerald-500/20" />
            <div style={{ width: `${outroPct}%` }} className="bg-rose-500/15" />
          </div>

          {/* Played progress fill */}
          <div
            style={{ width: `${currentPct}%` }}
            className="absolute top-0 bottom-0 left-0 bg-white/10 pointer-events-none"
          />

          {/* Scrubber Playhead Handle */}
          <div
            style={{ left: `${currentPct}%` }}
            className="absolute top-0 bottom-0 -ml-1 w-2 bg-[#7c6fff] shadow-lg shadow-[#7c6fff]/50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-3 h-3 rounded-full bg-white shadow" />
          </div>
        </div>
      </div>

      {/* Layer Track Stack */}
      <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-1.5">
        {template.layers.map((layer) => {
          const isSelected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isSelected
                  ? "border-[#7c6fff] bg-[#7c6fff]/15 text-white"
                  : "border-[#1c1c28] bg-[#111118] text-gray-300 hover:border-[#2a2a3a]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLayerVisibility(layer.id);
                  }}
                  className={`p-1 rounded hover:bg-white/10 ${
                    layer.visible ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium">{layer.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                  {layer.type}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                {layer.phaseScope !== "all" && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {layer.phaseScope}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-gray-400 border border-white/5">
                  {layer.blendMode}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
