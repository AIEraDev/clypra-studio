import React from "react";
import type { DimensionMode } from "@clypra-studio/engine";
import { Scissors, Maximize2, Minimize2, BoxSelect } from "lucide-react";

export type HorizontalConstraint = "left" | "center" | "right" | "scale";
export type VerticalConstraint = "top" | "center" | "bottom" | "scale";

export interface ConstraintValue {
  horizontal?: HorizontalConstraint;
  vertical?: VerticalConstraint;
  widthMode?: DimensionMode;
  heightMode?: DimensionMode;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatioLock?: boolean;
}

interface ConstraintControlProps {
  value: ConstraintValue;
  clipContent?: boolean;
  onChange: (val: ConstraintValue) => void;
  onToggleClipContent?: (clip: boolean) => void;
}

const H_OPTIONS: { label: string; value: HorizontalConstraint }[] = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Scale", value: "scale" },
];

const V_OPTIONS: { label: string; value: VerticalConstraint }[] = [
  { label: "Top", value: "top" },
  { label: "Center", value: "center" },
  { label: "Bottom", value: "bottom" },
  { label: "Scale", value: "scale" },
];

const MODE_OPTIONS: {
  label: string;
  value: DimensionMode;
  description: string;
}[] = [
  {
    label: "Hug",
    value: "hug",
    description: "Auto-grows container with inner children (fit-content)",
  },
  {
    label: "Fill",
    value: "fill",
    description: "Expands container to fill parent boundary",
  },
  { label: "Fixed", value: "fixed", description: "Fixed pixel dimensions" },
];

function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T; description?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#151519] border border-white/6 rounded-lg">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.description}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border transition-all cursor-pointer text-center ${
                active
                  ? "bg-violet-600 border-violet-500 text-white shadow font-bold"
                  : "bg-transparent border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConstraintRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <div className="grid grid-cols-4 gap-1">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                active
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300 font-bold"
                  : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300 hover:border-white/10"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ConstraintControl({
  value,
  clipContent = false,
  onChange,
  onToggleClipContent,
}: ConstraintControlProps) {
  return (
    <div className="flex flex-col gap-3 font-sans text-white">
      {/* Width Sizing Mode (Hug / Fill / Fixed) */}
      <PillSelector
        label="Width Sizing Mode"
        options={MODE_OPTIONS}
        value={value.widthMode || "fixed"}
        onChange={(wMode) => onChange({ ...value, widthMode: wMode })}
      />

      {/* Height Sizing Mode (Hug / Fill / Fixed) */}
      <PillSelector
        label="Height Sizing Mode"
        options={MODE_OPTIONS}
        value={value.heightMode || "fixed"}
        onChange={(hMode) => onChange({ ...value, heightMode: hMode })}
      />

      {/* Clip Content Toggle */}
      {onToggleClipContent && (
        <div className="flex items-center justify-between p-2.5 bg-[#151519] border border-white/6 rounded-lg">
          <div className="flex items-center gap-2">
            <Scissors size={13} className="text-violet-400 opacity-80" />
            <div>
              <p className="text-[11px] font-bold text-gray-300">
                Clip Content
              </p>
              <p className="text-[9px] text-gray-500">
                Mask child elements to corner radius (overflow: hidden)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleClipContent(!clipContent)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              clipContent ? "bg-violet-600" : "bg-gray-700"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${
                clipContent ? "left-4.5" : "left-0.75"
              }`}
            />
          </button>
        </div>
      )}

      {/* Min/Max Clamping Inputs */}
      <div className="space-y-1.5 pt-1 border-t border-white/4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Min / Max Bounds Clamping
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase">
              Min Width (px)
            </span>
            <input
              type="number"
              placeholder="Auto"
              value={value.minWidth ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  minWidth:
                    e.target.value !== "" ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1 text-[11px] text-white font-mono text-center focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <span className="text-[9px] text-gray-500 font-bold uppercase">
              Max Width (px)
            </span>
            <input
              type="number"
              placeholder="Auto"
              value={value.maxWidth ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  maxWidth:
                    e.target.value !== "" ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1 text-[11px] text-white font-mono text-center focus:border-violet-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Canvas Pin Anchor Constraints */}
      <div className="space-y-2 pt-2 border-t border-white/4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Canvas Anchor Pinning
        </span>
        <ConstraintRow
          label="Horizontal"
          options={H_OPTIONS}
          value={value.horizontal || "left"}
          onChange={(v) => onChange({ ...value, horizontal: v })}
        />
        <ConstraintRow
          label="Vertical"
          options={V_OPTIONS}
          value={value.vertical || "top"}
          onChange={(v) => onChange({ ...value, vertical: v })}
        />
      </div>
    </div>
  );
}
