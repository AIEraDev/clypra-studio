import React from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function GlowSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-glow"
      title="5. Outer / Inner Glows"
      icon={<Sparkles size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between hover:underline select-none">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Glow Specifiers ({config.glowLayers.length})
        </span>
        {config.glowLayers.length < 6 && (
          <button
            type="button"
            onClick={() => {
              modifyConfig((p) => ({
                ...p,
                glowLayers: [
                  ...p.glowLayers,
                  {
                    enabled: true,
                    color: "#FFE600",
                    blur: 30,
                    opacity: 90,
                    type: "outer",
                    strength: 3,
                    spread: 4,
                  },
                ],
              }));
            }}
            className="text-[9px] font-mono text-clypra-accent flex items-center gap-0.5 cursor-pointer"
          >
            <Plus size={10} /> Add Layer
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-1 select-none">
        {config.glowLayers.length === 0 && (
          <div className="p-2 border border-dashed border-clypra-border rounded-md text-center text-xs text-clypra-muted">
            No active glow channels configured.
          </div>
        )}

        {config.glowLayers.map((layer, lidx) => (
          <div
            key={lidx}
            className="bg-[#0E0E12] border border-clypra-border rounded-lg p-3 flex flex-col gap-2.5 relative"
          >
            <div className="flex items-center justify-between border-b border-clypra-border/60 pb-1.5 mb-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={(e) => {
                    modifyConfig((p) => {
                      const layers = [...p.glowLayers];
                      layers[lidx] = {
                        ...layers[lidx],
                        enabled: e.target.checked,
                      };
                      return { ...p, glowLayers: layers };
                    });
                  }}
                  className="accent-[#7C6FFF] cursor-pointer"
                />
                <span className="text-[10px] font-mono font-medium text-white">
                  Layer #{lidx + 1}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  modifyConfig((p) => ({
                    ...p,
                    glowLayers: p.glowLayers.filter((_, i) => i !== lidx),
                  }));
                }}
                className="p-0.5 text-clypra-muted hover:text-red-500 rounded cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {layer.enabled && (
              <div className="flex flex-col gap-2.5">
                {/* Color */}
                <div>
                  <label className="text-[9px] uppercase font-mono text-clypra-muted block mb-1">
                    Layer Color
                  </label>
                  <ControlColorPicker
                    value={layer.color}
                    onChange={(val) => {
                      modifyConfig((p) => {
                        const layers = [...p.glowLayers];
                        layers[lidx] = { ...layers[lidx], color: val };
                        return { ...p, glowLayers: layers };
                      });
                    }}
                  />
                </div>


                {/* Blur & Opacity */}
                <div className="grid grid-cols-2 gap-3.5 mt-1">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-clypra-muted">
                        Blur
                      </span>
                      <span className="text-[9px] font-mono text-white">
                        {layer.blur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={layer.blur}
                      onChange={(e) => {
                        modifyConfig((p) => {
                          const layers = [...p.glowLayers];
                          layers[lidx] = {
                            ...layers[lidx],
                            blur: parseInt(e.target.value),
                          };
                          return { ...p, glowLayers: layers };
                        });
                      }}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-clypra-muted">
                        Opacity
                      </span>
                      <span className="text-[9px] font-mono text-white">
                        {layer.opacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => {
                        modifyConfig((p) => {
                          const layers = [...p.glowLayers];
                          layers[lidx] = {
                            ...layers[lidx],
                            opacity: parseInt(e.target.value),
                          };
                          return { ...p, glowLayers: layers };
                        });
                      }}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                    />
                  </div>
                </div>

                {/* Inner / Outer Segmented */}
                <div className="grid grid-cols-2 gap-0.5 bg-[#15151C] border border-clypra-border/80 p-0.5 rounded-lg text-center mt-1">
                  {["outer", "inner"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        modifyConfig((p) => {
                          const layers = [...p.glowLayers];
                          layers[lidx] = {
                            ...layers[lidx],
                            type: t as any,
                          };
                          return { ...p, glowLayers: layers };
                        });
                      }}
                      className={`py-0.5 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                        layer.type === t
                          ? "bg-[#7C6FFF] text-white"
                          : "text-clypra-muted hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Strength & Spread Sliders */}
                <div className="grid grid-cols-2 gap-3.5 mt-1 border-t border-clypra-border/50 pt-2.5">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-clypra-muted">
                        Strength
                      </span>
                      <span className="text-[9px] font-mono text-white">
                        {layer.strength ?? 1}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={layer.strength ?? 1}
                      onChange={(e) => {
                        modifyConfig((p) => {
                          const layers = [...p.glowLayers];
                          layers[lidx] = {
                            ...layers[lidx],
                            strength: parseInt(e.target.value),
                          };
                          return { ...p, glowLayers: layers };
                        });
                      }}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-clypra-muted">
                        Spread
                      </span>
                      <span className="text-[9px] font-mono text-white">
                        {layer.spread ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={layer.spread ?? 0}
                      onChange={(e) => {
                        modifyConfig((p) => {
                          const layers = [...p.glowLayers];
                          layers[lidx] = {
                            ...layers[lidx],
                            spread: parseInt(e.target.value),
                          };
                          return { ...p, glowLayers: layers };
                        });
                      }}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ControlSectionCard>
  );
}
