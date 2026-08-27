import React from "react";
import type { ControlProps } from "./PropertyControlRegistry";
import { SUPPORTED_FONT_FAMILIES } from "@/constants/fonts";

const FONTS = SUPPORTED_FONT_FAMILIES.map((fam) => ({ label: fam, value: fam }));

export function FontControl({ value, onChange, label }: ControlProps<string>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">
          {label}
        </span>
      )}
      <select
        value={value || "Inter"}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
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
