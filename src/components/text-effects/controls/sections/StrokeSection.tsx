import React from "react";
import { Layers } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function StrokeSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-stroke"
      title="4. Stroke Border"
      icon={<Layers size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      {/* Enable */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Enable stroke outline
        </span>
        <input
          type="checkbox"
          checked={config.strokeEnabled}
          onChange={(e) => modifyConfig({ strokeEnabled: e.target.checked })}
          className="accent-[#7C6FFF] w-4 h-4 rounded border-clypra-border cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-clypra-border/60 pt-3 select-none">
        {/* Color */}
        <div className="flex items-center gap-3 bg-[#0E0E12] border border-clypra-border rounded-lg p-2">
          <ControlColorPicker
            value={
              config.strokeColor.startsWith("#")
                ? config.strokeColor
                : "#7c6fff"
            }
            onChange={(val) =>
              modifyConfig({ strokeColor: val, strokeEnabled: true })
            }
            className="w-7 h-7"
          />
          <input
            type="text"
            value={config.strokeColor}
            onChange={(e) =>
              modifyConfig({
                strokeColor: e.target.value,
                strokeEnabled: true,
              })
            }
            className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
          />
        </div>

        {/* Width */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Stroke Width
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.strokeWidth}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={config.strokeWidth}
            onChange={(e) =>
              modifyConfig({
                strokeWidth: parseInt(e.target.value),
                strokeEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Position */}
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Rendering Alignment
          </label>
          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none">
            {["outside", "center", "inside"].map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() =>
                  modifyConfig({
                    strokePosition: pos as any,
                    strokeEnabled: true,
                  })
                }
                className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                  config.strokePosition === pos
                    ? "bg-[#7C6FFF] text-white"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Opacity Level
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.strokeOpacity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.strokeOpacity}
            onChange={(e) =>
              modifyConfig({
                strokeOpacity: parseInt(e.target.value),
                strokeEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Line join */}
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Line Joins Edge
          </label>
          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none">
            {["round", "miter", "bevel"].map((join) => (
              <button
                key={join}
                type="button"
                onClick={() =>
                  modifyConfig({
                    strokeLineJoin: join as any,
                    strokeEnabled: true,
                  })
                }
                className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                  config.strokeLineJoin === join
                    ? "bg-[#7C6FFF] text-white"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {join}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Model Type Selector */}
        <div>
          <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
            Stroke Model Type
          </label>
          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none">
            {[
              { key: "single", label: "Single" },
              { key: "double", label: "Double" },
              { key: "neon", label: "Neon Glow" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  modifyConfig({
                    strokeType: item.key as any,
                    strokeEnabled: true,
                  })
                }
                className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                  (config.strokeType || "single") === item.key
                    ? "bg-[#7C6FFF] text-white font-semibold"
                    : "text-clypra-muted hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Blur Radius */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Stroke Blur Radius
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.strokeBlur || 0}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={config.strokeBlur || 0}
            onChange={(e) =>
              modifyConfig({
                strokeBlur: parseInt(e.target.value),
                strokeEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Stroke Vertical Fade */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Vertical Fade Out
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.strokeFadeRange || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.strokeFadeRange || 0}
            onChange={(e) =>
              modifyConfig({
                strokeFadeRange: parseInt(e.target.value),
                strokeEnabled: true,
              })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Double Stroke Settings */}
        {config.strokeType === "double" && (
          <div className="flex flex-col gap-3.5 bg-[#15151C] border border-clypra-border/50 rounded-lg p-3 mt-1 animation-fade-in text-left">
            <div className="text-[9px] uppercase font-mono tracking-wider text-clypra-accent font-bold">
              Double Stroke Outline Config
            </div>
            {/* Secondary Color Selector */}
            <div>
              <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-1">
                Outer Secondary Color
              </label>
              <div className="flex items-center gap-2 bg-[#0E0E12] border border-clypra-border rounded-lg p-1.5">
                <ControlColorPicker
                  value={
                    (config.strokeColorSecondary || "#FFFFFF").startsWith("#")
                      ? config.strokeColorSecondary
                      : "#ffffff"
                  }
                  onChange={(val) =>
                    modifyConfig({
                      strokeColorSecondary: val,
                      strokeEnabled: true,
                    })
                  }
                  className="w-6 h-6"
                />
                <input
                  type="text"
                  value={config.strokeColorSecondary || "#FFFFFF"}
                  onChange={(e) =>
                    modifyConfig({
                      strokeColorSecondary: e.target.value,
                      strokeEnabled: true,
                    })
                  }
                  className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Secondary Width Slider */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[9px] uppercase font-mono text-clypra-muted">
                  Outer Expansion Width
                </label>
                <span className="text-[10px] font-mono text-white">
                  +
                  {config.strokeWidthSecondary !== undefined
                    ? config.strokeWidthSecondary
                    : 4}
                  px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={
                  config.strokeWidthSecondary !== undefined
                    ? config.strokeWidthSecondary
                    : 4
                }
                onChange={(e) =>
                  modifyConfig({
                    strokeWidthSecondary: parseInt(e.target.value),
                    strokeEnabled: true,
                  })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>
          </div>
        )}
      </div>
    </ControlSectionCard>
  );
}
