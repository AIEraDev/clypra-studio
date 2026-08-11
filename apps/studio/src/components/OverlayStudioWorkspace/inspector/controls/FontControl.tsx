import React from "react";
import type { ControlProps } from "./PropertyControlRegistry";

const FONTS = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Outfit", value: "Outfit" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Fira Code", value: "Fira Code" },
  { label: "Space Mono", value: "Space Mono" },
  { label: "System Default", value: "system-ui" },
];

export function FontControl({ value, onChange, label }: ControlProps<string>) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">{label}</span>}
      <select
        value={value || "Inter"}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
        style={{ fontFamily: value || "Inter" }}
      >
        {FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
}
