import React from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { SceneDocument } from "../engine/schema";

interface TimelinePanelProps {
  scene: SceneDocument;
  previewTime: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  onTimeChange: (t: number) => void;
  onSceneChange: (scene: SceneDocument) => void;
}

export function TimelinePanel({
  scene,
  previewTime,
  isPlaying,
  onPlayToggle,
  onReset,
  onTimeChange,
  onSceneChange,
}: TimelinePanelProps) {
  const duration = scene.timeline.duration || 2;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-[#2A2A38] bg-[#15151C] shrink-0">
      <button
        type="button"
        onClick={onPlayToggle}
        className="p-1.5 rounded bg-[#7C6FFF] text-white hover:bg-[#6B5CE7] cursor-pointer"
        title={isPlaying ? "Pause" : "Play preview"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="p-1.5 rounded border border-[#2A2A38] text-gray-400 hover:text-white cursor-pointer"
        title="Reset time"
      >
        <RotateCcw size={14} />
      </button>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={Math.min(previewTime, duration)}
        onChange={(e) => onTimeChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-[#7C6FFF]"
      />
      <span className="text-[10px] font-mono text-gray-500 w-20 text-right">
        {previewTime.toFixed(2)}s / {duration}s
      </span>
      <label className="flex items-center gap-1 text-[10px] text-gray-500">
        <input
          type="checkbox"
          checked={scene.timeline.loop}
          onChange={(e) =>
            onSceneChange({
              ...scene,
              timeline: { ...scene.timeline, loop: e.target.checked },
            })
          }
          className="accent-[#7C6FFF]"
        />
        Loop
      </label>
    </div>
  );
}
