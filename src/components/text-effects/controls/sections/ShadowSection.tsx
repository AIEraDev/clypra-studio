import React from "react";
import { Moon } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function ShadowSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-shadow"
      title="6. Back Shadow"
      icon={<Moon size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Enable Shadow
        </span>
        <input
          type="checkbox"
          checked={config.shadowEnabled}
          onChange={(e) => modifyConfig({ shadowEnabled: e.target.checked })}
          className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-clypra-border/50 pt-3 select-none">
        {/* Color */}
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Shadow Color
          </label>
          <ControlColorPicker
            value={
              config.shadowColor.startsWith("#")
                ? config.shadowColor
                : "#000000"
            }
            onChange={(val) =>
              modifyConfig({ shadowColor: val, shadowEnabled: true })
            }
          />
        </div>


        {/* Blur */}
        <div>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Shadow Blur
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.shadowBlur}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={config.shadowBlur}
            onChange={(e) =>
              modifyConfig({
                shadowBlur: parseInt(e.target.value),
                shadowEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Offsets */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">
                Offset X
              </span>
              <span className="text-[10px] font-mono text-white">
                {config.shadowOffsetX}px
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={config.shadowOffsetX}
              onChange={(e) =>
                modifyConfig({
                  shadowOffsetX: parseInt(e.target.value),
                  shadowEnabled: true,
                })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>

          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">
                Offset Y
              </span>
              <span className="text-[10px] font-mono text-white">
                {config.shadowOffsetY}px
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={config.shadowOffsetY}
              onChange={(e) =>
                modifyConfig({
                  shadowOffsetY: parseInt(e.target.value),
                  shadowEnabled: true,
                })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Shadow Opacity
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.shadowOpacity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.shadowOpacity}
            onChange={(e) =>
              modifyConfig({
                shadowOpacity: parseInt(e.target.value),
                shadowEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Drop / Inner Type */}
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Projection Model
          </label>
          <div className="grid grid-cols-2 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center font-semibold select-none">
            {["drop", "inner"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  modifyConfig({
                    shadowType: t as any,
                    shadowEnabled: true,
                  })
                }
                className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                  config.shadowType === t
                    ? "bg-[#7C6FFF] text-white"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {t} shadow
              </button>
            ))}
          </div>
        </div>
      </div>
    </ControlSectionCard>
  );
}
