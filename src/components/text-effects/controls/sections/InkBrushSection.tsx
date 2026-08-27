import React from "react";
import { Brush } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function InkBrushSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-inkbrush"
      title="3. Ink Brush Engine"
      icon={<Brush size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
      badge={
        config.customRenderer === "InkBrushEngine" ? (
          <span className="text-[9px] bg-teal-500/20 text-teal-400 font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">
            Active
          </span>
        ) : undefined
      }
    >
      {/* Active Engine Toggle */}
      <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-clypra-border/50 flex-wrap gap-1">
        <div>
          <span className="text-[10px] uppercase font-mono text-clypra-accent font-bold block">
            Enable Ink Brush Engine
          </span>
          <span className="text-[8px] text-gray-500 font-mono block">
            When on, overrides standard fill modes
          </span>
        </div>
        <input
          type="checkbox"
          checked={config.customRenderer === "InkBrushEngine"}
          onChange={(e) =>
            modifyConfig({
              customRenderer: e.target.checked ? "InkBrushEngine" : undefined,
            })
          }
          className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
        />
      </div>

      {/* Ink Color */}
      <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-clypra-border">
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Ink Color
        </label>
        <div className="flex items-center gap-3">
          <ControlColorPicker
            value={config.inkColor || "#FFFFFF"}
            onChange={(val) =>
              modifyConfig({
                inkColor: val,
                fillColor: val,
                customRenderer: "InkBrushEngine",
              })
            }
            className="w-8 h-8"
          />
          <input
            type="text"
            value={config.inkColor || "#FFFFFF"}
            onChange={(e) =>
              modifyConfig({
                inkColor: e.target.value,
                fillColor: e.target.value,
                customRenderer: "InkBrushEngine",
              })
            }
            className="flex-1 bg-[#15151C] border border-clypra-border focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
          />
        </div>
      </div>

      {/* Bristle Density */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Bristle Density (Coverage)
          </label>
          <span className="text-[10px] font-mono text-white">
            {config.bristleDensity ?? 0.8}
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.05"
          value={config.bristleDensity ?? 0.8}
          onChange={(e) =>
            modifyConfig({
              bristleDensity: parseFloat(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Bristle Skip Rate */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Skip Rate (Dryness/Holes)
          </label>
          <span className="text-[10px] font-mono text-white">
            {Math.round((config.bristleSkipRate ?? 0.2) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={config.bristleSkipRate ?? 0.2}
          onChange={(e) =>
            modifyConfig({
              bristleSkipRate: parseFloat(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Drip Rate */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Drip Rate (Drip Probability)
          </label>
          <span className="text-[10px] font-mono text-white">
            {Math.round((config.dripRate ?? 0.3) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={config.dripRate ?? 0.3}
          onChange={(e) =>
            modifyConfig({
              dripRate: parseFloat(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Drip Max Length */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Drip Max Length
          </label>
          <span className="text-[10px] font-mono text-white">
            {config.dripMaxLength ?? 40}px
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="120"
          step="1"
          value={config.dripMaxLength ?? 40}
          onChange={(e) =>
            modifyConfig({
              dripMaxLength: parseInt(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Grain Density */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Grain Density (Paper Noise)
          </label>
          <span className="text-[10px] font-mono text-white">
            {Math.round((config.grainDensity ?? 0.15) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={config.grainDensity ?? 0.15}
          onChange={(e) =>
            modifyConfig({
              grainDensity: parseFloat(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Font Slant SkewX */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Font Slant (Skew X)
          </label>
          <span className="text-[10px] font-mono text-white">
            {config.skewX ?? -0.2}
          </span>
        </div>
        <input
          type="range"
          min="-1.0"
          max="1.0"
          step="0.05"
          value={config.skewX ?? -0.2}
          onChange={(e) =>
            modifyConfig({
              skewX: parseFloat(e.target.value),
              customRenderer: "InkBrushEngine",
            })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>
    </ControlSectionCard>
  );
}
