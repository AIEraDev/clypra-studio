import React from "react";
import type { ControlProps } from "./PropertyControlRegistry";

export function ColorControl({ value, onChange, label }: ControlProps<string>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">
          {label}
        </span>
      )}
      <div className="flex-1 flex items-center gap-1.5 bg-[#1C1C22] border border-white/6 rounded-lg px-2 py-1">
        <input
          type="color"
          value={value || "#FFFFFF"}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent font-mono text-[11px] text-white focus:outline-none uppercase"
        />
      </div>
    </div>
  );
}
