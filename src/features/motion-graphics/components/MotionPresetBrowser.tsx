import React, { useState } from "react";
import { Sparkles, Film, Check } from "lucide-react";
import type { MotionGraphicTemplate } from "../types";
import { MOTION_PRESETS } from "../presets/motionPresets";

interface MotionPresetBrowserProps {
  activeTemplateId: string;
  onSelectTemplate: (template: MotionGraphicTemplate) => void;
}

const CATEGORIES = ["All", "Comic", "VFX", "Trending", "Neon"] as const;

export function MotionPresetBrowser({
  activeTemplateId,
  onSelectTemplate,
}: MotionPresetBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredPresets =
    selectedCategory === "All"
      ? MOTION_PRESETS
      : MOTION_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="w-72 border-r border-[#1e1e2d] bg-[#0c0c12] text-white flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a26]">
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-4 h-4 text-[#7c6fff]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-200">
            Motion Templates
          </h2>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                selectedCategory === cat
                  ? "bg-[#7c6fff] text-white font-medium"
                  : "bg-[#181824] text-gray-400 hover:text-gray-200 hover:bg-[#202030]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredPresets.map((preset) => {
          const isActive = preset.id === activeTemplateId;
          const totalDur =
            preset.phaseTiming.introDuration +
            preset.phaseTiming.holdDuration +
            preset.phaseTiming.outroDuration;

          return (
            <div
              key={preset.id}
              onClick={() => onSelectTemplate(preset)}
              className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isActive
                  ? "border-[#7c6fff] bg-[#7c6fff]/10 ring-1 ring-[#7c6fff]/50"
                  : "border-[#1c1c28] bg-[#12121c] hover:border-[#2f2f45] hover:bg-[#161624]"
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="font-semibold text-xs text-white group-hover:text-[#7c6fff] transition-colors">
                  {preset.name}
                </span>
                {isActive && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7c6fff] text-white">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-400 leading-snug line-clamp-2 mb-2">
                {preset.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                  {preset.category}
                </span>
                <span>{totalDur.toFixed(1)}s total</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
