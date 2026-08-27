import React from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { FontControl } from "./FontControl";
import { NumberControl } from "./NumberControl";
import { ColorControl } from "./ColorControl";

export interface TypographyValue {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase" | "lowercase";
  overflow?: "wrap" | "ellipsis" | "clip" | "scale-down" | "marquee";
  minFontSize?: number;
  tabularNums?: boolean;
}

interface TypographyControlProps {
  value: TypographyValue;
  onChange: (val: TypographyValue) => void;
}

const WEIGHTS = [
  { label: "Thin (100)", value: "100" },
  { label: "Light (300)", value: "300" },
  { label: "Regular (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Black (900)", value: "900" },
];

const TRANSFORMS = [
  { label: "None", value: "none" },
  { label: "UPPERCASE", value: "uppercase" },
  { label: "lowercase", value: "lowercase" },
];

const OVERFLOWS = [
  { label: "Auto Wrap", value: "wrap" },
  { label: "Scale Down (Auto Fit)", value: "scale-down" },
  { label: "Ellipsis (...)", value: "ellipsis" },
  { label: "Clip", value: "clip" },
  { label: "Marquee (Ticker)", value: "marquee" },
];

export function TypographyControl({ value, onChange }: TypographyControlProps) {
  const set = <K extends keyof TypographyValue>(
    key: K,
    val: TypographyValue[K],
  ) => onChange({ ...value, [key]: val });

  return (
    <div className="flex flex-col gap-3">
      {/* Font Family */}
      <FontControl
        label="Font"
        value={value.fontFamily || "Inter"}
        onChange={(v) => set("fontFamily", v)}
      />

      {/* Size + Weight row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
            Size
          </span>
          <input
            type="number"
            min={6}
            max={400}
            value={value.fontSize || 20}
            onChange={(e) => set("fontSize", Number(e.target.value))}
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
            Weight
          </span>
          <select
            value={value.fontWeight || "400"}
            onChange={(e) => set("fontWeight", e.target.value)}
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
          >
            {WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Height + Letter Spacing */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
            Line Height
          </span>
          <input
            type="number"
            min={0.5}
            max={4}
            step={0.05}
            value={value.lineHeight ?? 1.2}
            onChange={(e) => set("lineHeight", Number(e.target.value))}
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
            Letter Spacing
          </span>
          <input
            type="number"
            min={-10}
            max={30}
            step={0.1}
            value={value.letterSpacing ?? 0}
            onChange={(e) => set("letterSpacing", Number(e.target.value))}
            className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Text Color */}
      <ColorControl
        label="Color"
        value={value.textColor || "#FFFFFF"}
        onChange={(v) => set("textColor", v)}
      />

      {/* Alignment */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Alignment
        </span>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => {
            const icons = {
              left: AlignLeft,
              center: AlignCenter,
              right: AlignRight,
            };
            const Icon = icons[align];
            const active = (value.textAlign || "left") === align;
            return (
              <button
                key={align}
                type="button"
                onClick={() => set("textAlign", align)}
                className={`flex-1 flex items-center justify-center p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-[#1C1C22] border-white/6 text-gray-500 hover:text-gray-300 hover:border-white/10"
                }`}
              >
                <Icon size={12} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Transform */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">
          Transform
        </span>
        <select
          value={value.textTransform || "none"}
          onChange={(e) => set("textTransform", e.target.value as any)}
          className="flex-1 bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
        >
          {TRANSFORMS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Overflow Policy */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">
          Overflow
        </span>
        <select
          value={value.overflow || "wrap"}
          onChange={(e) => set("overflow", e.target.value as any)}
          className="flex-1 bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 focus:outline-none cursor-pointer"
        >
          {OVERFLOWS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Min Font Size (for Scale Down) */}
      {value.overflow === "scale-down" && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 truncate">
            Min Size
          </span>
          <input
            type="number"
            min={6}
            max={value.fontSize || 400}
            value={value.minFontSize || 12}
            onChange={(e) => set("minFontSize", Number(e.target.value))}
            className="flex-1 bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono focus:border-violet-500 focus:outline-none"
          />
        </div>
      )}

      {/* Tabular Numerals Toggle */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Tabular Digits
        </span>
        <input
          type="checkbox"
          checked={value.tabularNums || false}
          onChange={(e) => set("tabularNums", e.target.checked)}
          className="w-4 h-4 rounded border-white/10 bg-[#1C1C22] text-violet-500 focus:ring-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
