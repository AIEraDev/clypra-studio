import React from "react";
import { Flame, Plus, Trash2 } from "lucide-react";
import { resizeCharFillColors } from "@clypra-studio/engine";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import { PerCharColorEditor } from "../../../PerCharColorEditor";
import type { BaseControlSectionProps } from "../common/types";

export function FillGradientSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-fill"
      title="3. Text Fill Color"
      icon={<Flame size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
      badge={<span className="text-[9px] bg-[#7C6FFF]/20 text-white font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>}
    >
      {/* Fill Radio Select */}
      <div>
        <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1.5 animate-pulse">
          Fill Rendering Mode
        </label>
        <div className="flex flex-wrap gap-1 select-none">
          {["solid", "linear", "radial", "pattern", "none"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                modifyConfig({
                  fillType: type as any,
                })
              }
              className={`flex-1 min-w-[55px] py-1 rounded text-[10px] font-mono cursor-pointer uppercase border transition-all ${
                config.fillType === type
                  ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold"
                  : "bg-[#0E0E12] border-clypra-border text-clypra-muted hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* SOLID */}
      {config.fillType === "solid" && (
        <div className="flex flex-col gap-2">
          <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-clypra-border">
            <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
              Color Palette
            </label>
            <ControlColorPicker
              value={
                config.fillColor.startsWith("#")
                  ? config.fillColor
                  : "#ffffff"
              }
              onChange={(fillColor) => {
                modifyConfig({
                  fillColor,
                  charFillColors: config.perCharFillEnabled
                    ? resizeCharFillColors(
                        config.text || "",
                        config.charFillColors,
                        fillColor,
                      )
                    : config.charFillColors,
                });
              }}
            />
          </div>
          <PerCharColorEditor config={config} onChange={modifyConfig} />
        </div>
      )}

      {/* GRADIENT (Linear & Radial) */}
      {(config.fillType === "linear" || config.fillType === "radial") && (
        <div className="p-3 rounded-lg bg-[#0E0E12] border border-clypra-border flex flex-col gap-3.5">
          {config.fillType === "linear" && (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] uppercase font-mono text-clypra-muted">
                  Radial / Angle
                </label>
                <span className="text-[10px] font-mono text-white">
                  {config.fillGradientAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={config.fillGradientAngle}
                onChange={(e) =>
                  modifyConfig({
                    fillGradientAngle: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#7C6FFF] cursor-ew-resize"
              />
            </div>
          )}

          {/* Stops list */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-clypra-border/60 pb-1">
              <span className="text-[10px] uppercase font-mono text-clypra-muted">
                Stops ({config.fillGradientStops.length})
              </span>
              {config.fillGradientStops.length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    modifyConfig((prev) => {
                      const offsets = prev.fillGradientStops.map(
                        (s) => s.offset,
                      );
                      const maxOffset = Math.max(...offsets, 0);
                      const newOffset = Math.min(100, maxOffset + 15);
                      return {
                        ...prev,
                        fillGradientStops: [
                          ...prev.fillGradientStops,
                          { color: "#ffffff", offset: newOffset },
                        ],
                      };
                    });
                  }}
                  className="text-[9px] font-mono text-clypra-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={10} /> Add Stop
                </button>
              )}
            </div>

            {config.fillGradientStops.map((stop, sidx) => (
              <div
                key={sidx}
                className="flex items-center gap-2 bg-[#15151C] p-2 rounded-md border border-clypra-border/50"
              >
                <ControlColorPicker
                  value={stop.color}
                  onChange={(val) => {
                    modifyConfig((prev) => {
                      const stops = [...prev.fillGradientStops];
                      stops[sidx] = { ...stops[sidx], color: val };
                      return { ...prev, fillGradientStops: stops };
                    });
                  }}
                  showInput={false}
                />

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.offset}
                  onChange={(e) => {
                    modifyConfig((prev) => {
                      const stops = [...prev.fillGradientStops];
                      stops[sidx] = {
                        ...stops[sidx],
                        offset: parseInt(e.target.value),
                      };
                      return { ...prev, fillGradientStops: stops };
                    });
                  }}
                  className="flex-1 accent-[#7C6FFF] cursor-ew-resize h-1"
                />

                <span className="text-[9px] font-mono text-clypra-muted w-[22px] text-right shrink-0">
                  {stop.offset}%
                </span>

                {config.fillGradientStops.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      modifyConfig((prev) => ({
                        ...prev,
                        fillGradientStops: prev.fillGradientStops.filter(
                          (_, i) => i !== sidx,
                        ),
                      }));
                    }}
                    className="p-0.5 text-clypra-muted hover:text-red-500 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PATTERN */}
      {config.fillType === "pattern" && (
        <div className="p-3 rounded-lg bg-[#0E0E12] border border-clypra-border flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
              Pattern Color Accent
            </label>
            <ControlColorPicker
              value={
                config.fillColor.startsWith("#")
                  ? config.fillColor
                  : "#ffffff"
              }
              onChange={(val) =>
                modifyConfig({
                  fillColor: val,
                })
              }
            />
          </div>


          <div>
            <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
              Canvas Texture Selection
            </label>
            <div className="grid grid-cols-2 gap-1 select-none">
              {[
                { key: "chalk", label: "Chalk Brush" },
                { key: "noise", label: "Sand Grain" },
                { key: "grunge", label: "Grunge Weathered" },
                { key: "carbon", label: "Carbon Grid" },
                { key: "stripes", label: "Stripes Hatch" },
                { key: "film", label: "Analog Film" },
                { key: "brushed", label: "Brushed Metal" },
                { key: "marble", label: "Stone Marble" },
                { key: "halftone", label: "Comics Halftone" },
                { key: "paper", label: "Craft Paper" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    modifyConfig({ patternType: item.key as any })
                  }
                  className={`py-1 rounded text-[9px] font-mono cursor-pointer uppercase border transition-all ${
                    (config.patternType || "chalk") === item.key
                      ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold"
                      : "bg-[#0E0E12] border-clypra-border text-clypra-muted hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NONE NOTE */}
      {config.fillType === "none" && (
        <div className="p-2.5 rounded-lg border border-dashed border-clypra-border bg-transparent text-center">
          <p className="text-xs text-clypra-muted font-sans">
            Hollow Core — No Fill layer active. Render relies entirely on Stroke
            settings below.
          </p>
        </div>
      )}
    </ControlSectionCard>
  );
}
