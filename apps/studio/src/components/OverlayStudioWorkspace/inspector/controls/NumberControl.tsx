import React from "react";
import type { ControlProps } from "./PropertyControlRegistry";

export function NumberControl({
  value,
  onChange,
  label,
  min = 0,
  max = 500,
  step = 1,
}: ControlProps<number>) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-violet-500 bg-white/10 h-1 rounded cursor-pointer"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-[#1C1C22] border border-white/6 rounded-md px-2 py-1 font-mono text-[11px] text-white text-right focus:border-violet-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
