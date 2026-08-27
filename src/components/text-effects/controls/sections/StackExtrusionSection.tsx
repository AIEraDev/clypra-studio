import React from "react";
import { Layers } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function StackExtrusionSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-stack"
      title="7.5. Multi-Stack Layers"
      icon={<Layers size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Enable Stacking
        </span>
        <input
          type="checkbox"
          checked={config.stackEnabled || false}
          onChange={(e) => modifyConfig({ stackEnabled: e.target.checked })}
          className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
        />
      </div>

      {config.stackEnabled && (
        <div className="flex flex-col gap-3.5 border-t border-clypra-border/50 pt-3 select-none">
          {/* Stack Count */}
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[10px] uppercase font-mono text-clypra-muted">
                Stack Count
              </label>
              <span className="text-[10px] font-mono text-white">
                {config.stackCount || 3} layers
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={config.stackCount || 1}
              onChange={(e) =>
                modifyConfig({ stackCount: parseInt(e.target.value) })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>

          {/* Stack Offsets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[9px] uppercase font-mono text-clypra-muted">
                  Offset X
                </label>
                <span className="text-[9px] font-mono text-white">
                  {config.stackOffsetX === undefined
                    ? 10
                    : config.stackOffsetX}
                  px
                </span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                value={
                  config.stackOffsetX === undefined
                    ? 10
                    : config.stackOffsetX
                }
                onChange={(e) =>
                  modifyConfig({ stackOffsetX: parseInt(e.target.value) })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[9px] uppercase font-mono text-clypra-muted">
                  Offset Y
                </label>
                <span className="text-[9px] font-mono text-white">
                  {config.stackOffsetY === undefined
                    ? -10
                    : config.stackOffsetY}
                  px
                </span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                value={
                  config.stackOffsetY === undefined
                    ? -10
                    : config.stackOffsetY
                }
                onChange={(e) =>
                  modifyConfig({ stackOffsetY: parseInt(e.target.value) })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>
          </div>

          {/* Opacity Decay */}
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[10px] uppercase font-mono text-clypra-muted">
                Opacity Decay / Layer
              </label>
              <span className="text-[10px] font-mono text-white">
                {config.stackOpacityDecay === undefined
                  ? 20
                  : config.stackOpacityDecay}
                %
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={
                config.stackOpacityDecay === undefined
                  ? 20
                  : config.stackOpacityDecay
              }
              onChange={(e) =>
                modifyConfig({
                  stackOpacityDecay: parseInt(e.target.value),
                })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>

          {/* Stack Colors Repeat Palette */}
          <div className="border-t border-clypra-border/50 pt-3 mt-1 flex flex-col gap-2.5">
            <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider">
              Layer Repeat Colors
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Layer Color 1
                </label>
                <div className="flex items-center gap-1.5">
                  <ControlColorPicker
                    value={
                      (config.stackColor1 || "#FF7C00").startsWith("#")
                        ? config.stackColor1 || "#FF7C00"
                        : "#000000"
                    }
                    onChange={(val) => modifyConfig({ stackColor1: val })}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.stackColor1 || ""}
                    placeholder="#FF7C00"
                    onChange={(e) =>
                      modifyConfig({ stackColor1: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Layer Color 2
                </label>
                <div className="flex items-center gap-1.5">
                  <ControlColorPicker
                    value={
                      (config.stackColor2 || "#00FFDD").startsWith("#")
                        ? config.stackColor2 || "#00FFDD"
                        : "#000000"
                    }
                    onChange={(val) => modifyConfig({ stackColor2: val })}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.stackColor2 || ""}
                    placeholder="#00FFDD"
                    onChange={(e) =>
                      modifyConfig({ stackColor2: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Layer Color 3
                </label>
                <div className="flex items-center gap-1.5">
                  <ControlColorPicker
                    value={
                      (config.stackColor3 || "#FF00AA").startsWith("#")
                        ? config.stackColor3 || "#FF00AA"
                        : "#000000"
                    }
                    onChange={(val) => modifyConfig({ stackColor3: val })}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.stackColor3 || ""}
                    placeholder="#FF00AA"
                    onChange={(e) =>
                      modifyConfig({ stackColor3: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Layer Color 4
                </label>
                <div className="flex items-center gap-1.5">
                  <ControlColorPicker
                    value={
                      (config.stackColor4 || "#AA00FF").startsWith("#")
                        ? config.stackColor4 || "#AA00FF"
                        : "#000000"
                    }
                    onChange={(val) => modifyConfig({ stackColor4: val })}
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.stackColor4 || ""}
                    placeholder="#AA00FF"
                    onChange={(e) =>
                      modifyConfig({ stackColor4: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ControlSectionCard>
  );
}
