import React from "react";

export type HorizontalConstraint = "left" | "center" | "right" | "scale";
export type VerticalConstraint = "top" | "center" | "bottom" | "scale";

export interface ConstraintValue {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
}

interface ConstraintControlProps {
  value: ConstraintValue;
  onChange: (val: ConstraintValue) => void;
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
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
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
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-[#1C1C22] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/10"
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

export function ConstraintControl({ value, onChange }: ConstraintControlProps) {
  return (
    <div className="flex flex-col gap-3">
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
  );
}
