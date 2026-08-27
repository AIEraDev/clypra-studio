import React from "react";
import type { ControlProps } from "./PropertyControlRegistry";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

export function ColorControl({ value, onChange, label, disabled = false }: ControlProps<string>) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate select-none">
          {label}
        </span>
      )}
      <div className="flex-1 min-w-0 flex justify-end">
        <ClypraColorPicker
          value={value || "#FFFFFF"}
          onChange={onChange}
          onChangeComplete={onChange}
          format="hex"
          showAlpha={true}
          size="sm"
          disabled={disabled}
          showHarmonies={true}
          presetColors={[
            "#8B5CF6",
            "#6366F1",
            "#3B82F6",
            "#06B6D4",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#EC4899",
            "#FFFFFF",
            "#18181B",
            "#000000",
          ]}
          triggerClassName="w-full justify-between h-7.5 bg-[#1C1C22] border-white/6 hover:border-white/15"
          placement="bottom-end"
        />
      </div>
    </div>
  );
}
