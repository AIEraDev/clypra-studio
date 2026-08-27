import React from "react";
import { Monitor } from "lucide-react";
import { COMPOSITION_PRESETS } from "@clypra-studio/engine";
import { ControlSectionCard } from "../common/ControlSectionCard";
import type { BaseControlSectionProps } from "../common/types";

interface CanvasLayoutSectionProps extends BaseControlSectionProps {
  applyCompositionPreset: (presetId: string) => void;
  fitTextToComposition: () => void;
}

export function CanvasLayoutSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
  applyCompositionPreset,
  fitTextToComposition,
}: CanvasLayoutSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-canvas"
      title="9. Studio Canvas Layout"
      icon={<Monitor size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1.5">
          Composition size
        </label>
        <div className="grid grid-cols-3 gap-1">
          {COMPOSITION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.description}
              onClick={() => applyCompositionPreset(p.id)}
              className="py-1.5 px-1 text-[9px] font-mono rounded border border-clypra-border bg-[#0E0E12] text-clypra-muted hover:text-white hover:border-[#7C6FFF] cursor-pointer transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={config.wrapText !== false}
            onChange={(e) => modifyConfig({ wrapText: e.target.checked })}
            className="accent-[#7C6FFF]"
          />
          Wrap text to safe area
        </label>
        <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={!!config.autoFitText}
            onChange={(e) =>
              modifyConfig({ autoFitText: e.target.checked })
            }
            className="accent-[#7C6FFF]"
          />
          Auto-fit while editing
        </label>
        <button
          type="button"
          onClick={fitTextToComposition}
          className="w-full py-1.5 text-[10px] font-mono uppercase tracking-wide rounded-lg border border-[#7C6FFF]/40 bg-[#7C6FFF]/10 text-clypra-accent hover:bg-[#7C6FFF]/20 cursor-pointer transition-all"
        >
          Fit text to composition now
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">
            Width px
          </label>
          <input
            type="number"
            min="200"
            max="2400"
            value={config.canvasWidth}
            onChange={(e) =>
              modifyConfig({
                canvasWidth: Math.max(
                  200,
                  Math.min(2400, parseInt(e.target.value) || 800),
                ),
              })
            }
            className="w-full bg-[#0E0E12] border border-clypra-border rounded-lg p-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-0.5">
            Height px
          </label>
          <input
            type="number"
            min="100"
            max="1200"
            value={config.canvasHeight}
            onChange={(e) =>
              modifyConfig({
                canvasHeight: Math.max(
                  100,
                  Math.min(1200, parseInt(e.target.value) || 200),
                ),
              })
            }
            className="w-full bg-[#0E0E12] border border-clypra-border rounded-lg p-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]"
          />
        </div>
      </div>

      {/* Horizontal and vertical alignment segmented */}
      <div className="flex flex-col gap-2.5">
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Horizontal Anchor
          </label>
          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none font-semibold">
            {["left", "center", "right"].map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => modifyConfig({ textPosX: align as any })}
                className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                  config.textPosX === align
                    ? "bg-[#7C6FFF] text-white"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Vertical Anchor
          </label>
          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none font-semibold">
            {["top", "middle", "bottom"].map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => modifyConfig({ textPosY: align as any })}
                className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                  config.textPosY === align
                    ? "bg-[#7C6FFF] text-white"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ControlSectionCard>
  );
}
