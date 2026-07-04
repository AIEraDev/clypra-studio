/**
 * Effect Parameter Editor
 *
 * Dynamic parameter controls based on selected effect type.
 * Each effect has different configurable parameters.
 */

import React from "react";
import type { EffectRendererType, EffectParameters } from "@clypra-studio/engine";

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

      case "shake":
        return (
          <>
            <ParameterSlider label="Intensity" value={parameters.intensity || 50} min={0} max={100} step={1} onChange={(v) => updateParam("intensity", v)} />
            <ParameterSlider label="Frequency (Hz)" value={parameters.frequency || 10} min={1} max={30} step={0.5} onChange={(v) => updateParam("frequency", v)} />
          </>
        );

      case "blur":
      case "motion_blur":
      case "radial_blur":
      case "zoom_blur":
        return <ParameterSlider label="Blur Amount (px)" value={parameters.blurAmount || 10} min={0} max={50} step={1} onChange={(v) => updateParam("blurAmount", v)} />;

      case "glitch":
        return (
          <>
            <ParameterSlider label="Glitch Intensity" value={parameters.glitchIntensity || 50} min={0} max={100} step={1} onChange={(v) => updateParam("glitchIntensity", v)} />
          </>
        );

      case "vhs":
        return (
          <>
            <ParameterSlider label="Scanline Count" value={parameters.scanlineCount || 100} min={20} max={200} step={10} onChange={(v) => updateParam("scanlineCount", v)} />
            <ParameterSlider label="Noise Amount" value={parameters.noiseAmount || 0.1} min={0} max={0.5} step={0.01} onChange={(v) => updateParam("noiseAmount", v)} />
            <ParameterSlider label="Color Offset" value={parameters.colorOffset || 5} min={0} max={20} step={1} onChange={(v) => updateParam("colorOffset", v)} />
          </>
        );

      case "rgb_split":
      case "chromatic_aberration":
        return (
          <>
            <ParameterSlider label="Split Distance" value={parameters.splitDistance || 10} min={0} max={50} step={1} onChange={(v) => updateParam("splitDistance", v)} />
            <ParameterSlider label="Angle (degrees)" value={parameters.angle || 0} min={0} max={360} step={1} onChange={(v) => updateParam("angle", v)} />
          </>
        );

      case "film_grain":
        return <ParameterSlider label="Grain Intensity" value={parameters.grainIntensity || 0.1} min={0} max={0.5} step={0.01} onChange={(v) => updateParam("grainIntensity", v)} />;

      case "pixelate":
        return <ParameterSlider label="Pixel Size" value={parameters.pixelSize || 10} min={2} max={50} step={1} onChange={(v) => updateParam("pixelSize", v)} />;

      case "zoom":
        return (
          <>
            <ParameterSlider label="Scale" value={parameters.scale || 0.2} min={-0.5} max={1} step={0.05} onChange={(v) => updateParam("scale", v)} />
            <ParameterSlider label="Center X" value={parameters.centerX || 0.5} min={0} max={1} step={0.01} onChange={(v) => updateParam("centerX", v)} />
            <ParameterSlider label="Center Y" value={parameters.centerY || 0.5} min={0} max={1} step={0.01} onChange={(v) => updateParam("centerY", v)} />
          </>
        );

      case "vignette":
        return <ParameterSlider label="Radius" value={parameters.radius || 0.7} min={0.1} max={1} step={0.05} onChange={(v) => updateParam("radius", v)} />;

      case "flash":
        return (
          <>
            <ParameterSlider label="Flash Intensity" value={parameters.flashIntensity || 1} min={0} max={1} step={0.05} onChange={(v) => updateParam("flashIntensity", v)} />
            <ColorPicker label="Flash Color" value={parameters.flashColor || "#ffffff"} onChange={(v) => updateParam("flashColor", v)} />
          </>
        );

      case "glow":
        return (
          <>
            <ParameterSlider label="Glow Amount" value={parameters.glowAmount || 10} min={0} max={50} step={1} onChange={(v) => updateParam("glowAmount", v)} />
            <ColorPicker label="Glow Color" value={parameters.glowColor || "#ffffff"} onChange={(v) => updateParam("glowColor", v)} />
          </>
        );

      case "scanlines":
        return <ParameterSlider label="Scanline Count" value={parameters.scanlineCount || 100} min={20} max={300} step={10} onChange={(v) => updateParam("scanlineCount", v)} />;

      case "strobe":
        return <ParameterSlider label="Frequency (Hz)" value={parameters.frequency || 10} min={1} max={30} step={0.5} onChange={(v) => updateParam("frequency", v)} />;

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
      <div className="color-row">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
        <span className="color-hex">{value}</span>
      </div>
    </div>
  );
}
