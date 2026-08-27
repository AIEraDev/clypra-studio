import React from "react";
import { Layout } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function BoundingPlateSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-panel"
      title="8. Bounding Plate"
      icon={<Layout size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Enable Bounding Plate
        </span>
        <input
          type="checkbox"
          checked={config.panelEnabled}
          onChange={(e) => modifyConfig({ panelEnabled: e.target.checked })}
          className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
        />
      </div>

      {config.panelEnabled && (
        <div className="flex flex-col gap-3.5 border-t border-clypra-border/50 pt-3 select-none">
          {/* Color */}
          <div>
            <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
              Plate Background Color
            </label>
            <ControlColorPicker
              value={config.panelColor}
              onChange={(val) => modifyConfig({ panelColor: val })}
            />
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[10px] uppercase font-mono text-clypra-muted">
                Plate Opacity
              </label>
              <span className="text-[10px] font-mono text-white">
                {config.panelOpacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.panelOpacity}
              onChange={(e) =>
                modifyConfig({ panelOpacity: parseInt(e.target.value) })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>

          {/* Radius */}
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[10px] uppercase font-mono text-clypra-muted">
                Corner Radius
              </label>
              <span className="text-[10px] font-mono text-white">
                {config.panelRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={config.panelRadius}
              onChange={(e) =>
                modifyConfig({ panelRadius: parseInt(e.target.value) })
              }
              className="w-full accent-[#7C6FFF] cursor-ew-resize"
            />
          </div>

          {/* Paddings */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] uppercase font-mono text-clypra-muted">
                  Padding Horiz
                </span>
                <span className="text-[10px] font-mono text-white">
                  {config.panelPaddingX}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={config.panelPaddingX}
                onChange={(e) =>
                  modifyConfig({
                    panelPaddingX: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] uppercase font-mono text-clypra-muted">
                  Padding Vert
                </span>
                <span className="text-[10px] font-mono text-white">
                  {config.panelPaddingY}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={config.panelPaddingY}
                onChange={(e) =>
                  modifyConfig({
                    panelPaddingY: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>
          </div>

          {/* Plate Stroke outline */}
          <div className="border-t border-clypra-border/50 pt-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-mono text-clypra-muted">
                Border stroke outline
              </span>
              <input
                type="checkbox"
                checked={config.panelStrokeEnabled}
                onChange={(e) =>
                  modifyConfig({ panelStrokeEnabled: e.target.checked })
                }
                className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
              />
            </div>

            {config.panelStrokeEnabled && (
              <div className="flex flex-col gap-3 bg-[#0E0E12] border border-clypra-border/80 rounded p-2.5">
                {/* color */}
                <div>
                  <label className="text-[8px] uppercase font-mono text-clypra-muted block mb-1">
                    Stroke Color
                  </label>
                  <ControlColorPicker
                    value={config.panelStrokeColor}
                    onChange={(val) =>
                      modifyConfig({ panelStrokeColor: val })
                    }
                  />
                </div>

                {/* width */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[8px] uppercase font-mono text-clypra-muted">
                      Border Width
                    </span>
                    <span className="text-[9px] font-mono text-white">
                      {config.panelStrokeWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={config.panelStrokeWidth}
                    onChange={(e) =>
                      modifyConfig({
                        panelStrokeWidth: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ControlSectionCard>
  );
}
