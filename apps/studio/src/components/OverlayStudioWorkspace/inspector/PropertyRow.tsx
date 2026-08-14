import React, { useState } from "react";
import type {
  PropertyDefinition,
  DataBindingRule,
} from "@clypra-studio/engine";
import { Link, Zap } from "lucide-react";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

interface PropertyRowProps {
  definition: PropertyDefinition;
  value: any;
  binding?: DataBindingRule;
  onChange: (val: any) => void;
  onBind: (expr: string) => void;
  isAnimatable?: boolean;
}

export function PropertyRow({
  definition,
  value,
  binding,
  onChange,
  onBind,
  isAnimatable,
}: PropertyRowProps) {
  const [showBinding, setShowBinding] = useState(Boolean(binding?.expression));
  const [expr, setExpr] = useState(binding?.expression || "");

  const handleBindingToggle = () => {
    if (showBinding) {
      setShowBinding(false);
      onBind("");
    } else {
      setShowBinding(true);
      const defaultExpr = `{{${definition.key}}}`;
      setExpr(defaultExpr);
      onBind(defaultExpr);
    }
  };

  const handleExprChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpr(val);
    onBind(val);
  };

  return (
    <div className="space-y-1 py-1">
      {/* Label bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            {definition.label || definition.key}
          </span>
          {isAnimatable && (
            <span title="Animatable property" className="text-violet-400">
              <Zap size={10} />
            </span>
          )}
        </div>

        {definition.bindable !== false && (
          <button
            type="button"
            onClick={handleBindingToggle}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showBinding || binding?.expression
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                : "bg-white/[0.04] text-gray-400 hover:text-white border border-white/6"
            }`}
            title={showBinding ? "Switch to static value" : "Bind to variable"}
          >
            <Link size={9} />
            <span>{"{{ }}"}</span>
          </button>
        )}
      </div>

      {/* Control / Binding Input */}
      {showBinding ? (
        <div className="flex items-center gap-1 bg-[#1C1C22] border border-violet-500/40 rounded-lg px-2 py-1">
          <span className="text-violet-400 font-mono text-[10px] font-bold">
            fx
          </span>
          <input
            type="text"
            value={expr}
            onChange={handleExprChange}
            placeholder={`{{${definition.key}}}`}
            className="w-full bg-transparent text-[11px] font-mono text-violet-200 outline-none"
          />
        </div>
      ) : (
        renderControl(definition, value, onChange)
      )}
    </div>
  );
}

function renderControl(
  def: PropertyDefinition,
  value: any,
  onChange: (val: any) => void,
): React.ReactNode {
  const currentVal = value ?? def.defaultValue ?? "";

  switch (def.type) {
    case "select":
      return (
        <select
          value={currentVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none cursor-pointer"
        >
          {(def.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "color":
      return (
        <div className="w-full">
          <ClypraColorPicker
            value={
              typeof currentVal === "string" && currentVal
                ? currentVal
                : "#8B5CF6"
            }
            onChange={(c) => onChange(c)}
            onChangeComplete={(c) => onChange(c)}
            format="hex"
            showAlpha={true}
            size="sm"
            triggerClassName="w-full justify-between h-8 bg-[#1C1C22] border-white/6 hover:border-white/15"
            popoverClassName="right-0 left-auto mt-1 z-[100]"
          />
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          value={currentVal}
          min={def.min}
          max={def.max}
          step={def.step || 1}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none"
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(currentVal)}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-violet-500 rounded cursor-pointer"
          />
          <span className="text-[12px] text-gray-300">
            {Boolean(currentVal) ? "Enabled" : "Disabled"}
          </span>
        </label>
      );

    case "text":
    case "asset":
    case "json":
    default:
      return (
        <input
          type="text"
          value={currentVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none"
        />
      );
  }
}
