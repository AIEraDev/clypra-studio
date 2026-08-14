import React from "react";

export interface LayoutValue {
  display?: "absolute" | "flex";
  flexDirection?: "row" | "column";
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
}

interface LayoutControlProps {
  value: LayoutValue;
  onChange: (val: LayoutValue) => void;
}

const ALIGN_OPTIONS = [
  { label: "Start", value: "flex-start" },
  { label: "Center", value: "center" },
  { label: "End", value: "flex-end" },
  { label: "Stretch", value: "stretch" },
];

const JUSTIFY_OPTIONS = [
  { label: "Start", value: "flex-start" },
  { label: "Center", value: "center" },
  { label: "End", value: "flex-end" },
  { label: "Between", value: "space-between" },
  { label: "Around", value: "space-around" },
];

export function LayoutControl({ value, onChange }: LayoutControlProps) {
  const set = <K extends keyof LayoutValue>(k: K, v: LayoutValue[K]) =>
    onChange({ ...value, [k]: v });
  const isFlex = value.display === "flex";

  return (
    <div className="flex flex-col gap-3">
      {/* Display Mode */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
          Display
        </span>
        <div className="grid grid-cols-2 gap-1">
          {(["absolute", "flex"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set("display", d)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                (value.display || "absolute") === d
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300"
              }`}
            >
              {d === "absolute" ? "Absolute" : "Flex"}
            </button>
          ))}
        </div>
      </div>

      {isFlex && (
        <>
          {/* Direction */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              Direction
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(["row", "column"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("flexDirection", d)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                    (value.flexDirection || "row") === d
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Gap */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 w-10">
              Gap
            </span>
            <input
              type="number"
              min={0}
              max={200}
              value={value.gap ?? 0}
              onChange={(e) => set("gap", Number(e.target.value))}
              className="flex-1 bg-[#1C1C22] border border-white/6 rounded-md px-2 py-1 font-mono text-[11px] text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Align */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              Align Items
            </span>
            <div className="flex gap-1 flex-wrap">
              {ALIGN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("alignItems", opt.value as any)}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer min-w-[50px] ${
                    (value.alignItems || "flex-start") === opt.value
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Justify */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              Justify Content
            </span>
            <div className="flex gap-1 flex-wrap">
              {JUSTIFY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("justifyContent", opt.value as any)}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer min-w-[50px] ${
                    (value.justifyContent || "flex-start") === opt.value
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Padding */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
          Padding
        </span>
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              "paddingTop",
              "paddingRight",
              "paddingBottom",
              "paddingLeft",
            ] as const
          ).map((k, i) => (
            <div key={k}>
              <span className="text-[8px] text-gray-600 block text-center mb-0.5">
                {["T", "R", "B", "L"][i]}
              </span>
              <input
                type="number"
                min={0}
                max={200}
                value={value[k] ?? 0}
                onChange={(e) => set(k, Number(e.target.value))}
                className="w-full bg-[#1C1C22] border border-white/6 rounded-md px-1 py-1 font-mono text-[11px] text-white text-center focus:border-violet-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
