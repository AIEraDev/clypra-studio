import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ColorControl } from "./ColorControl";
import { NumberControl } from "./NumberControl";

export interface ShadowValue {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
}

export interface AppearanceValue {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  shadow?: ShadowValue;
  backdropBlur?: number;
  opacity?: number;
}

interface AppearanceControlProps {
  value: AppearanceValue;
  onChange: (val: AppearanceValue) => void;
}

function ShadowEditor({ value, onChange }: { value: ShadowValue; onChange: (v: ShadowValue) => void }) {
  const set = <K extends keyof ShadowValue>(k: K, v: ShadowValue[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-col gap-2 pl-2 border-l border-white/[0.06] mt-1">
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "blur"] as const).map((k) => (
          <div key={k}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block">{k}</span>
            <input
              type="number"
              min={-100} max={100}
              value={value[k]}
              onChange={(e) => set(k, Number(e.target.value))}
              className="w-full bg-[#1C1C22] border border-white/[0.06] rounded-md px-2 py-1 font-mono text-[11px] text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        ))}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block">Color</span>
          <input
            type="color"
            value={value.color}
            onChange={(e) => set("color", e.target.value)}
            className="w-full h-8 rounded-md border border-white/[0.06] bg-[#1C1C22] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export function AppearanceControl({ value, onChange }: AppearanceControlProps) {
  const [showShadow, setShowShadow] = useState(!!value.shadow);
  const set = <K extends keyof AppearanceValue>(k: K, v: AppearanceValue[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="flex flex-col gap-3">
      {/* Fill */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fill</span>
        <ColorControl value={value.fillColor || "#1E1E28"} onChange={(v) => set("fillColor", v)} />
        <NumberControl label="Opacity" value={value.opacity ?? 100} onChange={(v) => set("opacity", v)} min={0} max={100} />
      </div>

      {/* Border */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Border</span>
        <div className="grid grid-cols-2 gap-2">
          <ColorControl value={value.strokeColor || "#2E2E3E"} onChange={(v) => set("strokeColor", v)} />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block">Width</span>
            <input
              type="number"
              min={0} max={20} step={0.5}
              value={value.strokeWidth ?? 0}
              onChange={(e) => set("strokeWidth", Number(e.target.value))}
              className="w-full bg-[#1C1C22] border border-white/[0.06] rounded-md px-2 py-1 font-mono text-[11px] text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <NumberControl label="Radius" value={value.borderRadius ?? 8} onChange={(v) => set("borderRadius", v)} min={0} max={120} />

      {/* Shadow */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Shadow</span>
          <button
            type="button"
            onClick={() => {
              if (showShadow) {
                setShowShadow(false);
                set("shadow", undefined);
              } else {
                setShowShadow(true);
                set("shadow", { x: 0, y: 8, blur: 24, color: "#000000" });
              }
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
              showShadow
                ? "border-violet-500/50 text-violet-300 bg-violet-500/10"
                : "border-white/[0.06] text-gray-500 hover:text-gray-300"
            }`}
          >
            {showShadow ? <Trash2 size={9} /> : <Plus size={9} />}
            {showShadow ? "Remove" : "Add"}
          </button>
        </div>
        {showShadow && value.shadow && (
          <ShadowEditor value={value.shadow} onChange={(v) => set("shadow", v)} />
        )}
      </div>

      {/* Backdrop Blur */}
      <NumberControl label="Backdrop Blur" value={value.backdropBlur ?? 0} onChange={(v) => set("backdropBlur", v)} min={0} max={60} />
    </div>
  );
}
