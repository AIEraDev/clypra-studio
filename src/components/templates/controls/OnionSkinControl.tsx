import React from "react";
import { Ghost, Eye, Sliders } from "lucide-react";

export interface OnionSkinOptions {
  enabled: boolean;
  frameCount: number;
  frameDelta: number;
}

interface OnionSkinControlProps {
  options: OnionSkinOptions;
  onChange: (options: OnionSkinOptions) => void;
}

export const OnionSkinControl: React.FC<OnionSkinControlProps> = ({
  options,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs">
      <button
        type="button"
        onClick={() => onChange({ ...options, enabled: !options.enabled })}
        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
          options.enabled
            ? "bg-amber-600/80 text-white font-medium shadow-sm"
            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        }`}
        title="Toggle Onion Skinning (Ghost Frames Preview)"
      >
        <Ghost className="w-3.5 h-3.5" />
        <span className="text-[11px]">Ghosting</span>
      </button>

      {options.enabled && (
        <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">Frames:</span>
            <select
              value={options.frameCount}
              onChange={(e) => onChange({ ...options, frameCount: parseInt(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px] text-zinc-200"
            >
              <option value={1}>±1</option>
              <option value={2}>±2</option>
              <option value={3}>±3</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400">Delta:</span>
            <select
              value={options.frameDelta}
              onChange={(e) => onChange({ ...options, frameDelta: parseFloat(e.target.value) })}
              className="bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[10px] text-zinc-200"
            >
              <option value={0.033}>30ms (1f)</option>
              <option value={0.066}>66ms (2f)</option>
              <option value={0.1}>100ms (3f)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
