import React from "react";
import { ResponsiveAnchorConfig, SpatialAnchorPoint } from "@clypra-studio/engine";
import { Anchor, LayoutGrid, Smartphone, Monitor, Square, Maximize2 } from "lucide-react";

interface ResponsiveAnchorControlProps {
  anchor?: ResponsiveAnchorConfig;
  onChange: (anchor: ResponsiveAnchorConfig | undefined) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5";
  onAspectRatioChange?: (ratio: "16:9" | "9:16" | "1:1" | "4:5") => void;
}

const ANCHOR_POINTS: { point: SpatialAnchorPoint; label: string; gridRow: number; gridCol: number }[] = [
  { point: "top-left", label: "Top Left", gridRow: 1, gridCol: 1 },
  { point: "top-center", label: "Top Center", gridRow: 1, gridCol: 2 },
  { point: "top-right", label: "Top Right", gridRow: 1, gridCol: 3 },
  { point: "middle-left", label: "Middle Left", gridRow: 2, gridCol: 1 },
  { point: "center", label: "Center", gridRow: 2, gridCol: 2 },
  { point: "middle-right", label: "Middle Right", gridRow: 2, gridCol: 3 },
  { point: "bottom-left", label: "Bottom Left", gridRow: 3, gridCol: 1 },
  { point: "bottom-center", label: "Bottom Center", gridRow: 3, gridCol: 2 },
  { point: "bottom-right", label: "Bottom Right", gridRow: 3, gridCol: 3 },
];

const DEFAULT_ANCHOR: ResponsiveAnchorConfig = {
  anchorPoint: "center",
  offsetPercentageX: 0,
  offsetPercentageY: 0,
  pixelOffsetX: 0,
  pixelOffsetY: 0,
  maxWidthPercentage: 90,
};

export const ResponsiveAnchorControl: React.FC<ResponsiveAnchorControlProps> = ({
  anchor,
  onChange,
  aspectRatio = "16:9",
  onAspectRatioChange,
}) => {
  const isEnabled = !!anchor;
  const current = anchor || DEFAULT_ANCHOR;

  const updateField = <K extends keyof ResponsiveAnchorConfig>(field: K, val: ResponsiveAnchorConfig[K]) => {
    onChange({
      ...current,
      [field]: val,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Anchor className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">Responsive Spatial Anchoring</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              if (e.target.checked) {
                onChange(DEFAULT_ANCHOR);
              } else {
                onChange(undefined);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/80">
          {/* 9-Point Grid Selector */}
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1.5">9-Point Spatial Anchor</span>
            <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              {ANCHOR_POINTS.map(({ point, label }) => {
                const isSelected = current.anchorPoint === point;
                return (
                  <button
                    key={point}
                    type="button"
                    title={label}
                    onClick={() => updateField("anchorPoint", point)}
                    className={`h-7 rounded transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105"
                        : "bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : "bg-zinc-500"}`} />
                  </button>
                );
              })}
            </div>
            <div className="text-center mt-1 text-[11px] font-medium text-emerald-400 capitalize">
              {current.anchorPoint.replace("-", " ")}
            </div>
          </div>

          {/* Offsets (Percentage & Pixel) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Offset X (%)</span>
                <span className="font-mono">{current.offsetPercentageX ?? 0}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={current.offsetPercentageX ?? 0}
                onChange={(e) => updateField("offsetPercentageX", parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Offset Y (%)</span>
                <span className="font-mono">{current.offsetPercentageY ?? 0}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={current.offsetPercentageY ?? 0}
                onChange={(e) => updateField("offsetPercentageY", parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Max Width % Constraint */}
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
              <span>Max Width Constraint</span>
              <span className="font-mono">{current.maxWidthPercentage ?? 90}% of Canvas</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={current.maxWidthPercentage ?? 90}
              onChange={(e) => updateField("maxWidthPercentage", parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Aspect Ratio Live Tester */}
          {onAspectRatioChange && (
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 block mb-1.5">Test Responsive Reflow</span>
              <div className="grid grid-cols-4 gap-1">
                {(["16:9", "9:16", "1:1", "4:5"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onAspectRatioChange(ratio)}
                    className={`py-1 rounded text-[10px] font-medium transition-colors flex flex-col items-center gap-0.5 ${
                      aspectRatio === ratio
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {ratio === "16:9" && <Monitor className="w-3 h-3" />}
                    {ratio === "9:16" && <Smartphone className="w-3 h-3" />}
                    {ratio === "1:1" && <Square className="w-3 h-3" />}
                    {ratio === "4:5" && <Maximize2 className="w-3 h-3" />}
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
