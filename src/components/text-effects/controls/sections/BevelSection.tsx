import React from "react";
import { Compass } from "lucide-react";
import { ControlSectionCard } from "../common/ControlSectionCard";
import { ControlColorPicker } from "../common/ControlColorPicker";
import type { BaseControlSectionProps } from "../common/types";

export function BevelSection({
  config,
  modifyConfig,
  isCollapsed,
  onToggle,
}: BaseControlSectionProps) {
  return (
    <ControlSectionCard
      id="section-card-bevel"
      title="7. 3D Extrusion Bevel"
      icon={<Compass size={14} className="text-clypra-accent" />}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono text-clypra-muted">
          Enable 3D Depth
        </span>
        <input
          type="checkbox"
          checked={config.bevelEnabled}
          onChange={(e) => modifyConfig({ bevelEnabled: e.target.checked })}
          className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-clypra-border/50 pt-3 select-none">
        {/* Depth */}
        <div>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              Extrusion Depth
            </label>
            <span className="text-[10px] font-mono text-white">
              {config.bevelDepth}px
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={config.bevelDepth}
            onChange={(e) =>
              modifyConfig({ bevelDepth: parseInt(e.target.value) })
            }
            className="w-full accent-[#7C6FFF] cursor-ew-resize"
          />
        </div>

        {/* Projection Mode */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase font-mono text-clypra-muted">
              3D Projection Type
            </label>
            <span className="text-[10px] uppercase font-bold text-clypra-accent">
              {config.bevelPerspectiveEnabled ? "Perspective" : "Parallel"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none font-semibold">
            <button
              type="button"
              onClick={() => modifyConfig({ bevelPerspectiveEnabled: false })}
              className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                !config.bevelPerspectiveEnabled
                  ? "bg-[#7C6FFF] text-white"
                  : "text-clypra-muted hover:text-[#888899]"
              }`}
            >
              Parallel (Isometric)
            </button>
            <button
              type="button"
              onClick={() => modifyConfig({ bevelPerspectiveEnabled: true })}
              className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                config.bevelPerspectiveEnabled
                  ? "bg-[#7C6FFF] text-white"
                  : "text-clypra-muted hover:text-[#888899]"
              }`}
            >
              Perspective (V.P.)
            </button>
          </div>
        </div>

        {/* Parallel / Perspective Controls */}
        {!config.bevelPerspectiveEnabled ? (
          /* Direction for Parallel type */
          <div>
            <label className="text-[10px] uppercase font-mono text-clypra-muted block mb-1">
              Depth Angle Direction
            </label>
            <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-clypra-border p-0.5 rounded-lg text-center select-none font-semibold">
              {["bottom-right", "bottom", "right"].map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() =>
                    modifyConfig({ bevelDirection: dir as any })
                  }
                  className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                    config.bevelDirection === dir
                      ? "bg-[#7C6FFF] text-white"
                      : "text-clypra-muted pr-0.5"
                  }`}
                >
                  {dir.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Sliders for Perspective type */
          <div className="flex flex-col gap-2.5 bg-[#0E0E12] border border-clypra-border/50 p-2.5 rounded-lg select-none">
            <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">
              Vanishing Point & Projection Settings
            </span>

            {/* Vanishing Point X */}
            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[8px] uppercase font-mono text-clypra-muted">
                  Vanishing Point X
                </label>
                <span className="text-[9px] font-mono text-white">
                  {config.bevelVanishingPointX !== undefined
                    ? config.bevelVanishingPointX
                    : 40}
                  %
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                value={
                  config.bevelVanishingPointX !== undefined
                    ? config.bevelVanishingPointX
                    : 40
                }
                onChange={(e) =>
                  modifyConfig({
                    bevelVanishingPointX: parseInt(e.target.value),
                  })
                }
                className="w-full accent-teal-400 cursor-ew-resize"
              />
            </div>

            {/* Vanishing Point Y */}
            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[8px] uppercase font-mono text-clypra-muted">
                  Vanishing Point Y
                </label>
                <span className="text-[9px] font-mono text-white">
                  {config.bevelVanishingPointY !== undefined
                    ? config.bevelVanishingPointY
                    : 80}
                  %
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                value={
                  config.bevelVanishingPointY !== undefined
                    ? config.bevelVanishingPointY
                    : 80
                }
                onChange={(e) =>
                  modifyConfig({
                    bevelVanishingPointY: parseInt(e.target.value),
                  })
                }
                className="w-full accent-teal-400 cursor-ew-resize"
              />
            </div>

            {/* Focal Length */}
            <div>
              <div className="flex justify-between mb-0.5">
                <label className="text-[8px] uppercase font-mono text-clypra-muted font-semibold">
                  Focal Tension (Scale Recess)
                </label>
                <span className="text-[9px] font-mono text-white">
                  {config.bevelFocalLength !== undefined
                    ? config.bevelFocalLength
                    : 400}
                  px
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1500"
                step="20"
                value={
                  config.bevelFocalLength !== undefined
                    ? config.bevelFocalLength
                    : 400
                }
                onChange={(e) =>
                  modifyConfig({
                    bevelFocalLength: parseInt(e.target.value),
                  })
                }
                className="w-full accent-teal-400 cursor-ew-resize"
              />
            </div>
          </div>
        )}

        {/* Colors */}
        <div className="flex flex-col gap-3 bg-[#0E0E12] border border-clypra-border p-3 rounded-lg">
          {/* 1. Highlight / Front Face */}
          <div>
            <label
              className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5"
              title="The topmost highlight layer of the 3D block"
            >
              Front Face Highlight
            </label>
            <div className="flex items-center gap-2">
              <ControlColorPicker
                value={
                  config.bevelHighlight.startsWith("#")
                    ? config.bevelHighlight
                    : "#ffffff"
                }
                onChange={(val) => modifyConfig({ bevelHighlight: val })}
                className="w-5 h-5"
              />
              <input
                type="text"
                value={config.bevelHighlight}
                onChange={(e) =>
                  modifyConfig({ bevelHighlight: e.target.value })
                }
                className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[10px] text-white font-mono"
              />
            </div>
          </div>

          {/* 2. Core Body Color */}
          <div>
            <label
              className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5"
              title="Main body filler color between front and back"
            >
              Core Extrusion Color
            </label>
            <div className="flex items-center gap-2">
              <ControlColorPicker
                value={
                  (config.bevelCoreColor || "#000000").startsWith("#")
                    ? config.bevelCoreColor || "#000000"
                    : "#000000"
                }
                onChange={(val) => modifyConfig({ bevelCoreColor: val })}
                className="w-5 h-5"
              />
              <input
                type="text"
                value={config.bevelCoreColor || ""}
                placeholder="e.g. #FF5500"
                onChange={(e) =>
                  modifyConfig({ bevelCoreColor: e.target.value })
                }
                className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700"
              />
            </div>
          </div>

          {/* 3. Deep Extrusion Anchor Shadow */}
          <div>
            <label
              className="text-[9px] uppercase font-mono text-clypra-muted block mb-0.5"
              title="The deepest back shadow of the 3D block"
            >
              Deep Anchor Shadow (Base)
            </label>
            <div className="flex items-center gap-2">
              <ControlColorPicker
                value={
                  config.bevelShadow.startsWith("#")
                    ? config.bevelShadow
                    : "#000000"
                }
                onChange={(val) => modifyConfig({ bevelShadow: val })}
                className="w-5 h-5"
              />
              <input
                type="text"
                value={config.bevelShadow}
                onChange={(e) =>
                  modifyConfig({ bevelShadow: e.target.value })
                }
                className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[10px] text-white font-mono"
              />
            </div>
          </div>

          {/* 4. Slice Edge Outline Stroke */}
          <div className="border-t border-clypra-border/50 pt-2.5 mt-1 space-y-2">
            <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider block">
              Slice Edge Outlines
            </label>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[8px] uppercase font-mono text-clypra-muted">
                    Edge Width
                  </label>
                  <span className="text-[9px] font-mono text-white">
                    {config.bevelEdgeWidth || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={config.bevelEdgeWidth || 0}
                  onChange={(e) =>
                    modifyConfig({
                      bevelEdgeWidth: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-teal-400 cursor-ew-resize"
                />
              </div>

              <div>
                <label className="text-[8px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Edge Color
                </label>
                <div className="flex items-center gap-2">
                  <ControlColorPicker
                    value={
                      (config.bevelEdgeColor || "#1e1e26").startsWith("#")
                        ? config.bevelEdgeColor || "#1e1e26"
                        : "#000000"
                    }
                    onChange={(val) =>
                      modifyConfig({ bevelEdgeColor: val })
                    }
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.bevelEdgeColor || ""}
                    placeholder="#2A2A38"
                    onChange={(e) =>
                      modifyConfig({ bevelEdgeColor: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Extrusion Ambient Blur Glow */}
          <div className="border-t border-clypra-border/50 pt-2.5 mt-1 space-y-2">
            <label className="text-[9px] uppercase font-mono text-clypra-accent font-bold tracking-wider block">
              Extrusion Blur (Ambient Glow)
            </label>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <label className="text-[8px] uppercase font-mono text-clypra-muted">
                    Blur Radius
                  </label>
                  <span className="text-[9px] font-mono text-white">
                    {config.bevelBlur || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={config.bevelBlur || 0}
                  onChange={(e) =>
                    modifyConfig({ bevelBlur: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#7C6FFF] cursor-ew-resize"
                />
              </div>

              <div>
                <label className="text-[8px] uppercase font-mono text-clypra-muted block mb-0.5">
                  Glow Color
                </label>
                <div className="flex items-center gap-2">
                  <ControlColorPicker
                    value={
                      (config.bevelBlurColor || "#000000").startsWith("#")
                        ? config.bevelBlurColor || "#000000"
                        : "#000000"
                    }
                    onChange={(val) =>
                      modifyConfig({ bevelBlurColor: val })
                    }
                    className="w-5 h-5"
                  />
                  <input
                    type="text"
                    value={config.bevelBlurColor || ""}
                    placeholder="#000000"
                    onChange={(e) =>
                      modifyConfig({ bevelBlurColor: e.target.value })
                    }
                    className="flex-1 bg-[#15151C] border border-clypra-border/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ControlSectionCard>
  );
}
