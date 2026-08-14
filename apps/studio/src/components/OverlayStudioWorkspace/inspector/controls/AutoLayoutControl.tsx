import React from "react";
import type {
  NodeLayoutRules,
  LayoutMode,
  AlignmentMode,
} from "@clypra-studio/engine";
import { ArrowRight, ArrowDown, LayoutGrid, Layers } from "lucide-react";

interface AutoLayoutControlProps {
  layout?: NodeLayoutRules;
  onChange: (layout: NodeLayoutRules) => void;
}

export function AutoLayoutControl({
  layout = {},
  onChange,
}: AutoLayoutControlProps) {
  const currentMode: LayoutMode = layout.mode || "none";
  const gapValue = typeof layout.gap === "number" ? layout.gap : typeof layout.gap === "object" && layout.gap !== null ? layout.gap.col : 0;
  const rawPadding = layout.padding;
  const padding = typeof rawPadding === "number"
    ? { top: rawPadding, right: rawPadding, bottom: rawPadding, left: rawPadding }
    : typeof rawPadding === "object" && rawPadding !== null
    ? {
        top: rawPadding.top ?? 0,
        right: rawPadding.right ?? 0,
        bottom: rawPadding.bottom ?? 0,
        left: rawPadding.left ?? 0,
      }
    : { top: 0, right: 0, bottom: 0, left: 0 };
  const alignItems = layout.alignItems || "start";
  const justifyContent = layout.justifyContent || "start";

  const setMode = (mode: LayoutMode) => {
    onChange({ ...layout, mode });
  };

  const setGap = (g: number) => {
    onChange({ ...layout, gap: g });
  };

  const setPaddingField = (field: keyof typeof padding, val: number) => {
    onChange({
      ...layout,
      padding: { ...padding, [field]: val },
    });
  };

  const setAlign = (alignItems: AlignmentMode) => {
    onChange({ ...layout, alignItems });
  };

  const setJustify = (justifyContent: AlignmentMode) => {
    onChange({ ...layout, justifyContent });
  };

  return (
    <div className="space-y-3 font-sans text-white">
      {/* Mode Selector */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
          Layout Direction
        </label>
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#151519] border border-white/6 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("none")}
            className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
              currentMode === "none"
                ? "bg-violet-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
            title="Absolute Positioning"
          >
            <Layers size={11} />
            <span>Off</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("flex-row")}
            className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
              currentMode === "flex-row"
                ? "bg-violet-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
            title="Horizontal Row"
          >
            <ArrowRight size={11} />
            <span>Row</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("flex-column")}
            className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
              currentMode === "flex-column"
                ? "bg-violet-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
            title="Vertical Column"
          >
            <ArrowDown size={11} />
            <span>Col</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-all ${
              currentMode === "grid"
                ? "bg-violet-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
            title="Grid Layout"
          >
            <LayoutGrid size={11} />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {currentMode === "grid" && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            Grid Columns
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={layout.gridColumns ?? 2}
            onChange={(e) =>
              onChange({
                ...layout,
                gridColumns: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono outline-none focus:border-violet-500"
          />
        </div>
      )}

      {currentMode !== "none" && (
        <>
          {/* Gap & Padding */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Gap (px)
              </label>
              <input
                type="number"
                min={0}
                value={gapValue}
                onChange={(e) => setGap(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Padding (T/R/B/L)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(["top", "right", "bottom", "left"] as const).map((side) => (
                  <input
                    key={side}
                    type="number"
                    min={0}
                    value={padding[side]}
                    onChange={(e) =>
                      setPaddingField(side, parseFloat(e.target.value) || 0)
                    }
                    placeholder={side[0].toUpperCase()}
                    className="w-full bg-[#1C1C22] border border-white/6 rounded px-1 py-1 text-[11px] text-white font-mono text-center outline-none focus:border-violet-500"
                    title={`Padding ${side}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alignment & Justification */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Align Items
              </label>
              <select
                value={alignItems}
                onChange={(e) => setAlign(e.target.value as AlignmentMode)}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none cursor-pointer"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Justify Content
              </label>
              <select
                value={justifyContent}
                onChange={(e) => setJustify(e.target.value as AlignmentMode)}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none cursor-pointer"
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Space Between</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
