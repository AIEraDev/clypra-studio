/**
 * Effect Parameter Editor
 *
 * Dynamic parameter controls based on selected effect type.
 * Each effect has different configurable parameters.
 */

import React from "react";
import type { EffectRendererType, EffectParameters } from "@clypra-studio/engine";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

interface EffectParameterEditorProps {
  effectType: EffectRendererType | "custom";
  parameters: EffectParameters;
  onChange: (parameters: EffectParameters) => void;
  customParamsSchema?: Record<string, { type: string; label: string; value: any; min?: number; max?: number; step?: number }>;
}

export function EffectParameterEditor({ effectType, parameters, onChange, customParamsSchema }: EffectParameterEditorProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...parameters, [key]: value });
  };

  // Render controls based on effect type
  const renderControls = () => {
    switch (effectType) {
      case "custom" as any:
        if (customParamsSchema) {
          return (
            <>
              {Object.entries(customParamsSchema).map(([key, def]: [string, any]) => {
                if (def.type === "range") {
                  return (
                    <ParameterSlider
                      key={key}
                      label={def.label || key}
                      value={parameters[key] !== undefined ? (parameters[key] as number) : (def.value as number)}
                      min={def.min ?? 0}
                      max={def.max ?? 100}
                      step={def.step ?? 1}
                      onChange={(v) => updateParam(key, v)}
                    />
                  );
                } else if (def.type === "color") {
                  return (
                    <ColorPicker
                      key={key}
                      label={def.label || key}
                      value={(parameters[key] as string) || (def.value as string) || "#ffffff"}
                      onChange={(v) => updateParam(key, v)}
                    />
                  );
                } else if (def.type === "toggle") {
                  const val = parameters[key] !== undefined ? !!parameters[key] : !!def.value;
                  return (
                    <div key={key} className="param-row toggle-row">
                      <span className="param-label" style={{ marginBottom: 0 }}>{def.label || key}</span>
                      <button
                        type="button"
                        onClick={() => updateParam(key, !val)}
                        className={`toggle ${val ? "on" : ""}`}
                        aria-label={def.label || key}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </>
          );
        }
        return <div className="text-sm text-gray-500 italic">No adjustable parameters for this effect</div>;

      case "shockwave":
        return (
          <>
            <ParameterSlider label="Speed" value={parameters.speed ?? 1.5} min={0.1} max={5} step={0.1} onChange={(v) => updateParam("speed", v)} />
            <ParameterSlider label="Amplitude" value={parameters.amplitude ?? 30} min={1} max={100} step={1} onChange={(v) => updateParam("amplitude", v)} />
            <ParameterSlider label="Wavelength" value={parameters.wavelength ?? 160} min={10} max={300} step={5} onChange={(v) => updateParam("wavelength", v)} />
            <ParameterSlider label="Brightness" value={parameters.brightness ?? 1.0} min={0.5} max={2} step={0.05} onChange={(v) => updateParam("brightness", v)} />
            <ParameterSlider label="Max Radius" value={parameters.radius ?? 600} min={100} max={1000} step={10} onChange={(v) => updateParam("radius", v)} />
          </>
        );

      default:
        return <div className="text-sm text-gray-500 italic">No adjustable parameters for this effect</div>;
    }
  };

  return (
    <div className="space-y-4">
      {renderControls()}
    </div>
  );
}

// Helper Components

interface ParameterSliderProps {
  key?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function ParameterSlider({ label, value, min, max, step, onChange }: ParameterSliderProps) {
  return (
    <div className="param-row">
      <div className="param-label">
        <span>{label}</span>
        <span className="val">{value.toFixed(2)}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
      />
    </div>
  );
}

interface ColorPickerProps {
  key?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="param-row">
      <div className="param-label">{label}</div>
      <div className="color-row flex items-center gap-2">
        <ClypraColorPicker
          value={value}
          onChange={onChange}
          onChangeComplete={onChange}
          size="sm"
          placement="left-start"
          triggerClassName="clypra-swatch-trigger w-7 h-7 rounded-md border border-white/20 hover:border-white/40 shadow-sm transition-transform hover:scale-105 cursor-pointer"
        />
        <span className="color-hex font-mono text-[11px]">{value}</span>
      </div>
    </div>
  );
}
