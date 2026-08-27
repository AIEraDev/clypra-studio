import React from "react";
import { Type } from "lucide-react";
import { SUPPORTED_FONT_FAMILIES } from "../../../../constants";
import { ControlSectionCard } from "../common/ControlSectionCard";
import type { BaseControlSectionProps } from "../common/types";

export function FontSpecimenSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-font"
      title="2. Font Specimen"
      icon={<Type size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      {/* Font dropdown */}
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Typography Family
        </label>
        <select
          id="select-font-family"
          value={config.fontFamily}
          onChange={(e) => modifyConfig({ fontFamily: e.target.value })}
          className="w-full bg-[#0E0E12] border border-clypra-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] cursor-pointer"
        >
          {SUPPORTED_FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Weight segmented */}
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Font Weight
        </label>
        <div className="grid grid-cols-6 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg select-none">
          {[400, 500, 600, 700, 800, 900].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => modifyConfig({ fontWeight: w })}
              className={`py-1 text-[10px] rounded font-mono cursor-pointer transition-all ${
                config.fontWeight === w
                  ? "bg-[#7C6FFF] text-white font-semibold"
                  : "text-clypra-muted hover:text-white"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Font style */}
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
          Font Decoration Style
        </label>
        <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg select-none">
          {["normal", "italic"].map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => {
                const updates: any = { fontStyle: style };
                if (style === "italic") {
                  updates.skewX = -0.2;
                } else {
                  updates.skewX = 0;
                }
                modifyConfig(updates);
              }}
              className={`py-1 text-[10px] rounded font-mono capitalize cursor-pointer transition-all ${
                config.fontStyle === style
                  ? "bg-[#7C6FFF] text-white"
                  : "text-clypra-muted hover:text-white"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="flex items-center justify-between gap-3 mt-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Size
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="24"
            max="200"
            value={config.fontSize}
            onChange={(e) =>
              modifyConfig({ fontSize: parseInt(e.target.value) })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize py-1"
          />
        </div>
        <input
          type="number"
          min="24"
          max="200"
          value={config.fontSize}
          onChange={(e) =>
            modifyConfig({
              fontSize: Math.max(
                24,
                Math.min(200, parseInt(e.target.value) || 24),
              ),
            })
          }
          className="w-[50px] bg-[#0E0E12] border border-clypra-border rounded-lg p-1.5 text-center text-[10px] font-mono mt-3 focus:outline-none"
        />
      </div>

      {/* Letter Spacing */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Letter Spacing
          </label>
          <span className="text-[10px] font-mono text-white">
            {config.letterSpacing}px
          </span>
        </div>
        <input
          type="range"
          min="-10"
          max="30"
          value={config.letterSpacing}
          onChange={(e) =>
            modifyConfig({ letterSpacing: parseInt(e.target.value) })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>

      {/* Line Height */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] uppercase font-mono text-clypra-muted">
            Line Height Ratio
          </label>
          <span className="text-[10px] font-mono text-white">
            {config.lineHeight}x
          </span>
        </div>
        <input
          type="range"
          min="0.8"
          max="2.5"
          step="0.1"
          value={config.lineHeight}
          onChange={(e) =>
            modifyConfig({ lineHeight: parseFloat(e.target.value) })
          }
          className="w-full accent-[#7C6FFF] cursor-ew-resize"
        />
      </div>
    </ControlSectionCard>
  );
}
