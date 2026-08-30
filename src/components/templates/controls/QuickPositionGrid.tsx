import React from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignTop,
  AlignBottom,
  Move,
} from "lucide-react";

export type GridPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface QuickPositionGridProps {
  x: number;
  y: number;
  width: number | "auto";
  height: number | "auto";
  canvasWidth: number;
  canvasHeight: number;
  isTextNode?: boolean;
  onUpdateBounds: (updates: {
    x?: number;
    y?: number;
    width?: number | "auto";
    height?: number | "auto";
  }) => void;
}

export const QuickPositionGrid: React.FC<QuickPositionGridProps> = ({
  x,
  y,
  width,
  height,
  canvasWidth,
  canvasHeight,
  isTextNode = false,
  onUpdateBounds,
}) => {
  // Margin for outer edges (safe title margin)
  const safeMarginX = Math.round(canvasWidth * 0.05); // 5% margin
  const safeMarginY = Math.round(canvasHeight * 0.08); // 8% margin

  const resolvedWidth = typeof width === "number" ? width : 400;
  const resolvedHeight = typeof height === "number" ? height : 120;

  const handleSnapToGrid = (position: GridPosition) => {
    let targetX = x;
    let targetY = y;

    switch (position) {
      case "top-left":
        targetX = safeMarginX;
        targetY = safeMarginY;
        break;
      case "top-center":
        targetX = Math.round((canvasWidth - resolvedWidth) / 2);
        targetY = safeMarginY;
        break;
      case "top-right":
        targetX = Math.round(canvasWidth - resolvedWidth - safeMarginX);
        targetY = safeMarginY;
        break;
      case "middle-left":
        targetX = safeMarginX;
        targetY = Math.round((canvasHeight - resolvedHeight) / 2);
        break;
      case "center":
        targetX = Math.round((canvasWidth - resolvedWidth) / 2);
        targetY = Math.round((canvasHeight - resolvedHeight) / 2);
        break;
      case "middle-right":
        targetX = Math.round(canvasWidth - resolvedWidth - safeMarginX);
        targetY = Math.round((canvasHeight - resolvedHeight) / 2);
        break;
      case "bottom-left":
        targetX = safeMarginX;
        targetY = Math.round(canvasHeight - resolvedHeight - safeMarginY);
        break;
      case "bottom-center":
        targetX = Math.round((canvasWidth - resolvedWidth) / 2);
        targetY = Math.round(canvasHeight - resolvedHeight - safeMarginY);
        break;
      case "bottom-right":
        targetX = Math.round(canvasWidth - resolvedWidth - safeMarginX);
        targetY = Math.round(canvasHeight - resolvedHeight - safeMarginY);
        break;
    }

    onUpdateBounds({ x: targetX, y: targetY });
  };

  const handleCenterHorizontal = () => {
    onUpdateBounds({ x: Math.round((canvasWidth - resolvedWidth) / 2) });
  };

  const handleCenterVertical = () => {
    onUpdateBounds({ y: Math.round((canvasHeight - resolvedHeight) / 2) });
  };

  return (
    <div className="space-y-3">
      {/* 3x3 Alignment Matrix & Quick Align Toolbar */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Move size={12} className="text-teal-400" />
            Quick Alignment & Snap
          </span>
        </label>

        <div className="flex gap-2.5 items-center">
          {/* 3x3 Matrix */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-[#2A2A38] bg-[#101017] shrink-0">
            {(
              [
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "center",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ] as GridPosition[]
            ).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => handleSnapToGrid(pos)}
                title={`Snap to ${pos.replace("-", " ")}`}
                className="w-5 h-5 rounded hover:bg-teal-500/20 hover:border-teal-500/50 border border-transparent flex items-center justify-center transition-all group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#555566] group-hover:bg-teal-400 group-hover:scale-125 transition-all" />
              </button>
            ))}
          </div>

          {/* Quick Center Buttons */}
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            <button
              type="button"
              onClick={handleCenterHorizontal}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-[#2A2A38] bg-[#14141E] hover:border-teal-500/40 hover:bg-[#1A1A28] text-xs font-semibold text-[#B0B0C0] hover:text-white transition-all"
              title="Center Horizontally on Canvas"
            >
              <AlignCenterHorizontal size={13} className="text-teal-400" />
              <span className="text-[10px]">Center X</span>
            </button>
            <button
              type="button"
              onClick={handleCenterVertical}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-[#2A2A38] bg-[#14141E] hover:border-teal-500/40 hover:bg-[#1A1A28] text-xs font-semibold text-[#B0B0C0] hover:text-white transition-all"
              title="Center Vertically on Canvas"
            >
              <AlignCenterVertical size={13} className="text-teal-400" />
              <span className="text-[10px]">Center Y</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateBounds({ x: safeMarginX })}
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-[#2A2A38] bg-[#14141E] hover:border-teal-500/40 hover:bg-[#1A1A28] text-[10px] text-[#9999AA] hover:text-white transition-all"
              title="Align to Left Safe Margin"
            >
              <AlignLeft size={11} />
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateBounds({
                  x: Math.round(canvasWidth - resolvedWidth - safeMarginX),
                })
              }
              className="flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-[#2A2A38] bg-[#14141E] hover:border-teal-500/40 hover:bg-[#1A1A28] text-[10px] text-[#9999AA] hover:text-white transition-all"
              title="Align to Right Safe Margin"
            >
              <AlignRight size={11} />
              <span>Right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Numeric Coordinates & Dimensions */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2A2A38]/40">
        <div>
          <label className="block text-[9px] text-[#888899] mb-0.5 font-semibold">
            X Position (px)
          </label>
          <input
            type="number"
            value={x}
            onChange={(e) =>
              onUpdateBounds({ x: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] text-[#888899] mb-0.5 font-semibold">
            Y Position (px)
          </label>
          <input
            type="number"
            value={y}
            onChange={(e) =>
              onUpdateBounds({ y: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[9px] text-[#888899] font-semibold">
              Width
            </label>
            {isTextNode && (
              <button
                type="button"
                onClick={() =>
                  onUpdateBounds({
                    width: width === "auto" ? 400 : "auto",
                  })
                }
                className={`text-[9px] px-1 rounded transition-colors ${
                  width === "auto"
                    ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                    : "text-[#666677] hover:text-white"
                }`}
              >
                Auto
              </button>
            )}
          </div>
          <input
            type={width === "auto" ? "text" : "number"}
            value={width === "auto" ? "auto (content)" : width ?? ""}
            disabled={width === "auto"}
            onChange={(e) =>
              onUpdateBounds({
                width: parseInt(e.target.value) || 50,
              })
            }
            className={`w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500 font-mono ${
              width === "auto"
                ? "opacity-60 cursor-not-allowed text-center font-semibold text-teal-300"
                : ""
            }`}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[9px] text-[#888899] font-semibold">
              Height
            </label>
            {isTextNode && (
              <button
                type="button"
                onClick={() =>
                  onUpdateBounds({
                    height: height === "auto" ? 100 : "auto",
                  })
                }
                className={`text-[9px] px-1 rounded transition-colors ${
                  height === "auto"
                    ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                    : "text-[#666677] hover:text-white"
                }`}
              >
                Auto
              </button>
            )}
          </div>
          <input
            type={height === "auto" ? "text" : "number"}
            value={height === "auto" ? "auto (content)" : height ?? ""}
            disabled={height === "auto"}
            onChange={(e) =>
              onUpdateBounds({
                height: parseInt(e.target.value) || 50,
              })
            }
            className={`w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500 font-mono ${
              height === "auto"
                ? "opacity-60 cursor-not-allowed text-center font-semibold text-teal-300"
                : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
};
