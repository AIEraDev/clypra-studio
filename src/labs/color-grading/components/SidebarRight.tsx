import React from "react";
import { ColorAdjustments } from "../../../components/effects/filter/types";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

interface SidebarRightProps {
  activeTab: "inspector" | "histogram" | "telemetry";
  onSetActiveTab: (tab: "inspector" | "histogram" | "telemetry") => void;
  selectedFilter: any;
  onSelectFilter: (filter: any) => void;
  intensity: number;
  onIntensityChange: (val: number) => void;
  manualAdjustments: ColorAdjustments;
  onAdjustmentChange: (key: keyof ColorAdjustments, val: any) => void;
  onResetSlider: (key: keyof ColorAdjustments) => void;
  onResetAllAdjustments: () => void;
  histogramData: any;
  histogramChannel: "all" | "r" | "g" | "b" | "l";
  onSetHistogramChannel: (ch: "all" | "r" | "g" | "b" | "l") => void;
  histogramSVGData: any;
  fps: number;
  latency: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  isVideo: boolean;
  currentTime: number;
  duration: number;
  logs: string[];
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
  onDumpLog: () => void;
  onResetContext: () => void;
  onPublish: () => void;
  onPublishAllPresets: () => void;
  isPublishing: boolean;
  publishMessage: string;
}

export function SidebarRight({
  activeTab,
  onSetActiveTab,
  selectedFilter,
  onSelectFilter,
  intensity,
  onIntensityChange,
  manualAdjustments,
  onAdjustmentChange,
  onResetSlider,
  onResetAllAdjustments,
  histogramData,
  histogramChannel,
  onSetHistogramChannel,
  histogramSVGData,
  fps,
  latency,
  cpuUsage,
  gpuUsage,
  memUsage,
  isVideo,
  currentTime,
  duration,
  logs,
  terminalEndRef,
  onDumpLog,
  onResetContext,
  onPublish,
  onPublishAllPresets,
  isPublishing,
  publishMessage,
}: SidebarRightProps) {
  const presetParams = selectedFilter?.gradingParams;

  const isOverridden = (key: keyof ColorAdjustments) => {
    return key in manualAdjustments && manualAdjustments[key] !== undefined;
  };

  // Helper to extract current active value (manual adjustments, preset, or neutral default)
  function getEffectiveValue<T>(
    key: keyof ColorAdjustments,
    defaultValue: T,
    getter?: (obj: any) => T
  ): T {
    if (getter) {
      if (key in manualAdjustments && manualAdjustments[key] !== undefined) {
        const val = getter(manualAdjustments[key]);
        if (val !== undefined) return val;
      }
      if (presetParams && key in presetParams && presetParams[key] !== undefined) {
        const val = getter(presetParams[key]);
        if (val !== undefined) return val;
      }
      return defaultValue;
    }

    if (key in manualAdjustments && manualAdjustments[key] !== undefined) {
      return manualAdjustments[key] as unknown as T;
    }
    if (presetParams && key in presetParams && presetParams[key] !== undefined) {
      if (key === 'hue' && 'hueRotate' in presetParams) {
        return ((presetParams.hueRotate * 180) / Math.PI) as unknown as T;
      }
      if (key === 'invert' && typeof presetParams.invert === 'number') {
        return (presetParams.invert > 0.5) as unknown as T;
      }
      return presetParams[key] as unknown as T;
    }
    return defaultValue;
  }

  // Helper to render label styles based on override state
  const labelClass = (key: keyof ColorAdjustments) => {
    return isOverridden(key) ? "text-primary font-bold" : "text-outline/70";
  };

  // Helper to render slider class styles based on override state
  const sliderClass = (key: keyof ColorAdjustments) => {
    return `w-full h-1 rounded cursor-pointer ${
      isOverridden(key) ? "accent-primary bg-primary/20" : "accent-outline/40 bg-surface-container-highest"
    }`;
  };

  // Resolve values
  const exposureVal = getEffectiveValue("exposure", 0.0);
  const brightnessVal = getEffectiveValue("brightness", 0.0);
  const contrastVal = getEffectiveValue("contrast", 0.0);
  const saturationVal = getEffectiveValue("saturation", 0.0);
  const temperatureVal = getEffectiveValue("temperature", 0.0);
  const tintVal = getEffectiveValue("tint", 0.0);
  const sepiaVal = getEffectiveValue("sepia", 0.0);
  const grayscaleVal = getEffectiveValue("grayscale", 0.0);
  const hueVal = getEffectiveValue("hue", 0);
  const vignetteVal = getEffectiveValue("vignette", 0.0);
  const invertVal = getEffectiveValue("invert", false);
  const liftVal = getEffectiveValue("lift", 0.0);

  // Structured properties
  const vibranceAmount = getEffectiveValue("vibrance", 0.0, (v) => v.amount);
  const vibranceHue = getEffectiveValue("vibrance", "#E8B08C", (v) => v.protectedHue);
  const grainIntensity = getEffectiveValue("grain", 0.0, (g) => g.intensity);
  const grainSize = getEffectiveValue("grain", 1.0, (g) => g.size);
  const crossProcessAmount = getEffectiveValue("crossProcess", 0.0, (c) => c.amount);

  return (
    <aside className="flex flex-col h-full w-[300px] min-w-[300px] bg-surface-container-low border-l border-outline-variant p-1 gap-1 overflow-hidden select-none">
      {/* Tab Switcher */}
      <div className="flex bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30 shrink-0">
        {(["inspector", "histogram", "telemetry"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onSetActiveTab(tab)}
            className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer uppercase ${
              activeTab === tab
                ? "bg-surface-container-highest text-white shadow border border-outline-variant/50"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 space-y-2">
        {/* INSPECTOR TAB */}
        {activeTab === "inspector" && (
          <div className="space-y-2">
            {/* Active Preset Info */}
            {selectedFilter && (
              <div className="bg-surface-container border border-outline-variant p-2 rounded relative">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-bold text-white uppercase block">
                      Active: {selectedFilter.name}
                    </span>
                    <span className="text-[8px] font-mono-data text-outline">
                      CSS: {selectedFilter.cssFilter || "NONE"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectFilter(null);
                      onIntensityChange(100);
                    }}
                    className="text-[8px] font-bold text-error bg-error-container/20 border border-error-container px-1 py-0.5 rounded hover:bg-error-container/40 transition-colors cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-data text-outline">
                    <span>Preset Intensity</span>
                    <span>{intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Manual Color Sliders */}
            <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-2">
              <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30 flex justify-between items-center">
                <span>Color Grading Adjustments</span>
                {Object.keys(manualAdjustments).length > 0 && (
                  <button
                    onClick={onResetAllAdjustments}
                    className="text-error hover:text-white text-[8px] font-mono-data transition-colors cursor-pointer border border-error/50 px-1 py-0.5 rounded"
                  >
                    RESET ALL
                  </button>
                )}
              </h4>

              {/* BASIC ADJUSTMENTS */}
              <div className="space-y-2">
                <h5 className="text-[8px] font-bold text-outline uppercase pb-0.5 tracking-wider">Basic Adjustments</h5>

                {/* Exposure */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("exposure")}>
                      EXPOSURE {isOverridden("exposure") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("exposure") && onResetSlider("exposure")}
                      className={`transition-colors ${isOverridden("exposure") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {exposureVal > 0 ? "+" : ""}{exposureVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={exposureVal}
                    onChange={(e) => onAdjustmentChange("exposure", parseFloat(e.target.value))}
                    className={sliderClass("exposure")}
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("brightness")}>
                      BRIGHTNESS {isOverridden("brightness") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("brightness") && onResetSlider("brightness")}
                      className={`transition-colors ${isOverridden("brightness") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {brightnessVal > 0 ? "+" : ""}{brightnessVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={brightnessVal}
                    onChange={(e) => onAdjustmentChange("brightness", parseFloat(e.target.value))}
                    className={sliderClass("brightness")}
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("contrast")}>
                      CONTRAST {isOverridden("contrast") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("contrast") && onResetSlider("contrast")}
                      className={`transition-colors ${isOverridden("contrast") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {contrastVal > 0 ? "+" : ""}{contrastVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={contrastVal}
                    onChange={(e) => onAdjustmentChange("contrast", parseFloat(e.target.value))}
                    className={sliderClass("contrast")}
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("saturation")}>
                      SATURATION {isOverridden("saturation") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("saturation") && onResetSlider("saturation")}
                      className={`transition-colors ${isOverridden("saturation") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {saturationVal > 0 ? "+" : ""}{saturationVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={saturationVal}
                    onChange={(e) => onAdjustmentChange("saturation", parseFloat(e.target.value))}
                    className={sliderClass("saturation")}
                  />
                </div>
              </div>

              {/* COLOR & WHITE BALANCE */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <h5 className="text-[8px] font-bold text-outline uppercase pb-0.5 tracking-wider">Color & White Balance</h5>

                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("temperature")}>
                      TEMPERATURE {isOverridden("temperature") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("temperature") && onResetSlider("temperature")}
                      className={`transition-colors ${isOverridden("temperature") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {temperatureVal > 0 ? "+" : ""}{temperatureVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={temperatureVal}
                    onChange={(e) => onAdjustmentChange("temperature", parseFloat(e.target.value))}
                    className={sliderClass("temperature")}
                  />
                </div>

                {/* Tint */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("tint")}>
                      TINT {isOverridden("tint") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("tint") && onResetSlider("tint")}
                      className={`transition-colors ${isOverridden("tint") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {tintVal > 0 ? "+" : ""}{tintVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1.00"
                    max="1.00"
                    step="0.01"
                    value={tintVal}
                    onChange={(e) => onAdjustmentChange("tint", parseFloat(e.target.value))}
                    className={sliderClass("tint")}
                  />
                </div>

                {/* Sepia */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("sepia")}>
                      SEPIA MIX {isOverridden("sepia") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("sepia") && onResetSlider("sepia")}
                      className={`transition-colors ${isOverridden("sepia") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {sepiaVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="1.00"
                    step="0.01"
                    value={sepiaVal}
                    onChange={(e) => onAdjustmentChange("sepia", parseFloat(e.target.value))}
                    className={sliderClass("sepia")}
                  />
                </div>

                {/* Grayscale */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("grayscale")}>
                      GRAYSCALE MIX {isOverridden("grayscale") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("grayscale") && onResetSlider("grayscale")}
                      className={`transition-colors ${isOverridden("grayscale") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {grayscaleVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="1.00"
                    step="0.01"
                    value={grayscaleVal}
                    onChange={(e) => onAdjustmentChange("grayscale", parseFloat(e.target.value))}
                    className={sliderClass("grayscale")}
                  />
                </div>

                {/* Hue */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("hue")}>
                      HUE ROTATION {isOverridden("hue") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("hue") && onResetSlider("hue")}
                      className={`transition-colors ${isOverridden("hue") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {hueVal}°
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={hueVal}
                    onChange={(e) => onAdjustmentChange("hue", parseInt(e.target.value))}
                    className={sliderClass("hue")}
                  />
                </div>
              </div>

              {/* CREATIVE */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <h5 className="text-[8px] font-bold text-outline uppercase pb-0.5 tracking-wider">Creative</h5>

                {/* Vignette */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("vignette")}>
                      VIGNETTE SHADOW {isOverridden("vignette") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("vignette") && onResetSlider("vignette")}
                      className={`transition-colors ${isOverridden("vignette") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {vignetteVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="1.00"
                    step="0.01"
                    value={vignetteVal}
                    onChange={(e) => onAdjustmentChange("vignette", parseFloat(e.target.value))}
                    className={sliderClass("vignette")}
                  />
                </div>

                {/* Invert Checkbox */}
                <div className="flex items-center justify-between text-[9px] font-mono-data py-1 border-b border-transparent">
                  <span className={labelClass("invert")}>
                    INVERT PHASE {isOverridden("invert") ? "" : "(auto)"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={invertVal}
                      onChange={(e) => onAdjustmentChange("invert", e.target.checked)}
                      className="cursor-pointer accent-primary"
                    />
                    {isOverridden("invert") && (
                      <button
                        onClick={() => onResetSlider("invert")}
                        className="text-[8px] text-error hover:underline cursor-pointer"
                      >
                        RESET
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ADVANCED GRADING */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <h5 className="text-[8px] font-bold text-outline uppercase pb-0.5 tracking-wider">Advanced Grading</h5>

                {/* Lift */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("lift")}>
                      LIFT {isOverridden("lift") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("lift") && onResetSlider("lift")}
                      className={`transition-colors ${isOverridden("lift") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {liftVal > 0 ? "+" : ""}{liftVal.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-0.50"
                    max="0.50"
                    step="0.01"
                    value={liftVal}
                    onChange={(e) => onAdjustmentChange("lift", parseFloat(e.target.value))}
                    className={sliderClass("lift")}
                  />
                  <div className="text-[7px] text-outline/50 font-mono-data">– crushed · 0 · faded +</div>
                </div>

                {/* Vibrance (Structured) */}
                <div className="space-y-1.5 pt-1">
                  {/* Vibrance Amount */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono-data">
                      <span className={labelClass("vibrance")}>
                        VIBRANCE {isOverridden("vibrance") ? "" : "(auto)"}
                      </span>
                      <button
                        onDoubleClick={() => isOverridden("vibrance") && onResetSlider("vibrance")}
                        className={`transition-colors ${isOverridden("vibrance") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                      >
                        {vibranceAmount > 0 ? "+" : ""}{Math.round(vibranceAmount * 100)}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-1.00"
                      max="1.00"
                      step="0.01"
                      value={vibranceAmount}
                      onChange={(e) => {
                        const current = manualAdjustments.vibrance || {};
                        onAdjustmentChange("vibrance", {
                          ...current,
                          amount: parseFloat(e.target.value),
                        });
                      }}
                      className={sliderClass("vibrance")}
                    />
                  </div>

                  {/* Vibrance Protection Hue */}
                  <div className="flex items-center justify-between text-[9px] font-mono-data">
                    <span className="text-outline/70">SKIN PROTECTION HUE</span>
                    <div className="flex items-center gap-1.5">
                      <ClypraColorPicker
                        value={vibranceHue || "#ffffff"}
                        onChange={(newColor) => {
                          const current = manualAdjustments.vibrance || { amount: 0.0 };
                          onAdjustmentChange("vibrance", {
                            ...current,
                            protectedHue: newColor,
                          });
                        }}
                        onChangeComplete={(newColor) => {
                          const current = manualAdjustments.vibrance || { amount: 0.0 };
                          onAdjustmentChange("vibrance", {
                            ...current,
                            protectedHue: newColor,
                          });
                        }}
                        size="sm"
                        placement="left-start"
                        triggerClassName="clypra-swatch-trigger w-5 h-5 rounded border border-outline-variant/50 cursor-pointer"
                      />
                      <span className="text-[8px] font-mono-data uppercase text-outline/80">{vibranceHue}</span>
                    </div>
                  </div>
                </div>

                {/* Film Grain (Structured) */}
                <div className="space-y-2 pt-1">
                  {/* Grain Intensity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono-data">
                      <span className={labelClass("grain")}>
                        GRAIN INTENSITY {isOverridden("grain") ? "" : "(auto)"}
                      </span>
                      <button
                        onDoubleClick={() => isOverridden("grain") && onResetSlider("grain")}
                        className={`transition-colors ${isOverridden("grain") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                      >
                        {Math.round(grainIntensity * 100)}%
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0.00"
                      max="0.50"
                      step="0.01"
                      value={grainIntensity}
                      onChange={(e) => {
                        const current = manualAdjustments.grain || { size: 1.0 };
                        onAdjustmentChange("grain", {
                          ...current,
                          intensity: parseFloat(e.target.value),
                        });
                      }}
                      className={sliderClass("grain")}
                    />
                  </div>

                  {/* Grain Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono-data">
                      <span className="text-outline/70">GRAIN SIZE</span>
                      <span className="text-outline/80">{grainSize.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={grainSize}
                      onChange={(e) => {
                        const current = manualAdjustments.grain || { intensity: 0.0 };
                        onAdjustmentChange("grain", {
                          ...current,
                          size: parseFloat(e.target.value),
                        });
                      }}
                      className={sliderClass("grain")}
                    />
                  </div>
                </div>

                {/* Cross Process (Structured) */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className={labelClass("crossProcess")}>
                      CROSS PROCESS {isOverridden("crossProcess") ? "" : "(auto)"}
                    </span>
                    <button
                      onDoubleClick={() => isOverridden("crossProcess") && onResetSlider("crossProcess")}
                      className={`transition-colors ${isOverridden("crossProcess") ? "text-primary hover:text-white" : "text-outline/40 cursor-default"}`}
                    >
                      {Math.round(crossProcessAmount * 100)}%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="1.00"
                    step="0.01"
                    value={crossProcessAmount}
                    onChange={(e) => {
                      onAdjustmentChange("crossProcess", {
                        amount: parseFloat(e.target.value),
                      });
                    }}
                    className={sliderClass("crossProcess")}
                  />
                  <div className="text-[7px] text-outline/50 font-mono-data">Analog channel curve swap (R↔B)</div>
                </div>
              </div>

              {/* Preset Primitives Summaries */}
              {selectedFilter?.gradingParams && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded p-1.5 space-y-0.5 mt-1">
                  <div className="text-[7px] font-bold text-outline uppercase mb-0.5 tracking-widest">Preset Primitives</div>
                  {selectedFilter.gradingParams.splitTone && (
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.splitTone.shadowColor }} />
                      <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.splitTone.highlightColor }} />
                      <span className="text-[7px] font-mono-data text-outline/80">Split-tone</span>
                    </div>
                  )}
                  {selectedFilter.gradingParams.channelMix && (
                    <div className="flex gap-1 items-center">
                      <span className="material-symbols-outlined text-[9px] text-outline/80">tune</span>
                      <span className="text-[7px] font-mono-data text-outline/80">Channel-mix B&W</span>
                    </div>
                  )}
                  {selectedFilter.gradingParams.duotone && (
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.duotone.darkColor }} />
                      <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.duotone.lightColor }} />
                      <span className="text-[7px] font-mono-data text-outline/80">Duotone</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTOGRAM TAB */}
        {activeTab === "histogram" && (
          <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-2">
            <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30 flex justify-between items-center">
              <span>Luma & Color Histogram</span>
              <span className="text-secondary text-[8px] font-mono-data">Live rendering</span>
            </h4>

            {/* Channels Switcher */}
            <div className="flex bg-surface-container-lowest p-0.5 rounded border border-outline-variant/20">
              {(["all", "r", "g", "b", "l"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onSetHistogramChannel(ch)}
                  className={`flex-1 py-0.5 text-[8px] font-mono-data rounded transition-colors cursor-pointer uppercase ${
                    histogramChannel === ch
                      ? "bg-surface-container-highest text-white border border-outline-variant/30"
                      : "text-outline/70 hover:text-white"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Histogram Graphic Render area */}
            <div className="h-[120px] bg-black border border-outline-variant/50 rounded flex items-center justify-center p-1 relative">
              {histogramSVGData ? (
                <svg viewBox="0 0 256 100" className="w-full h-full preserve-aspect-ratio" style={{ opacity: 0.85 }}>
                  {histogramChannel === "all" ? (
                    <>
                      {/* Red channel */}
                      <path d={histogramSVGData.r} fill="rgba(239, 68, 68, 0.22)" stroke="#EF4444" strokeWidth="0.5" />
                      {/* Green channel */}
                      <path d={histogramSVGData.g} fill="rgba(16, 185, 129, 0.22)" stroke="#10B981" strokeWidth="0.5" />
                      {/* Blue channel */}
                      <path d={histogramSVGData.b} fill="rgba(59, 130, 246, 0.22)" stroke="#3B82F6" strokeWidth="0.5" />
                    </>
                  ) : (
                    <path
                      d={histogramSVGData[histogramChannel]}
                      fill={
                        histogramChannel === "r"
                          ? "rgba(239, 68, 68, 0.25)"
                          : histogramChannel === "g"
                          ? "rgba(16, 185, 129, 0.25)"
                          : histogramChannel === "b"
                          ? "rgba(59, 130, 246, 0.25)"
                          : "rgba(255, 255, 255, 0.25)"
                      }
                      stroke={
                        histogramChannel === "r"
                          ? "#EF4444"
                          : histogramChannel === "g"
                          ? "#10B981"
                          : histogramChannel === "b"
                          ? "#3B82F6"
                          : "#FFFFFF"
                      }
                      strokeWidth="0.5"
                    />
                  )}
                </svg>
              ) : (
                <div className="text-[8px] text-outline/50 font-mono-data">No histogram signal...</div>
              )}
            </div>

            <div className="text-[7px] text-outline/40 leading-normal font-mono-data text-center">
              0 (shadows) ─────────────────────────── 255 (highlights)
            </div>
          </div>
        )}

        {/* TELEMETRY TAB */}
        {activeTab === "telemetry" && (
          <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-2">
            <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30">
              Pipeline Benchmarks
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-surface-container-lowest p-1.5 border border-outline-variant/35 rounded text-center">
                <span className="text-[7px] text-outline uppercase block font-mono-data">Frame Rate</span>
                <span className="text-[14px] font-mono-data text-white font-bold">{fps} FPS</span>
              </div>
              <div className="bg-surface-container-lowest p-1.5 border border-outline-variant/35 rounded text-center">
                <span className="text-[7px] text-outline uppercase block font-mono-data">GPU Latency</span>
                <span className="text-[14px] font-mono-data text-white font-bold">{latency} ms</span>
              </div>
              <div className="bg-surface-container-lowest p-1.5 border border-outline-variant/35 rounded text-center">
                <span className="text-[7px] text-outline uppercase block font-mono-data">CPU Util</span>
                <span className="text-[14px] font-mono-data text-white font-bold">{cpuUsage}%</span>
              </div>
              <div className="bg-surface-container-lowest p-1.5 border border-outline-variant/35 rounded text-center">
                <span className="text-[7px] text-outline uppercase block font-mono-data">GPU Util</span>
                <span className="text-[14px] font-mono-data text-white font-bold">{gpuUsage}%</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-1.5 border border-outline-variant/35 rounded flex justify-between items-center px-2">
              <span className="text-[8px] text-outline font-mono-data">MEM_HEAP</span>
              <span className="text-[10px] text-white font-mono-data font-bold">{memUsage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Deploy / logs panel */}
      <div className="h-[140px] bg-surface-container-lowest border border-outline-variant rounded p-1 flex flex-col shrink-0 gap-1 overflow-hidden">
        {/* Terminal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-1 font-mono-data text-[8px] text-outline-variant shrink-0 select-none">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            CONSOLE STDOUT
          </span>
          <div className="flex gap-1">
            <button
              onClick={onDumpLog}
              className="px-1 hover:text-white bg-surface-container-highest border border-outline-variant/50 rounded hover:border-outline cursor-pointer"
            >
              DUMP
            </button>
            <button
              onClick={onResetContext}
              className="px-1 hover:text-white bg-surface-container-highest border border-outline-variant/50 rounded hover:border-outline cursor-pointer"
            >
              RST_CTX
            </button>
          </div>
        </div>

        {/* Terminal logs list */}
        <div className="flex-1 overflow-y-auto font-mono-data text-[7px] leading-relaxed text-secondary/95 space-y-0.5 select-text selection:bg-primary/30">
          {logs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap truncate">
              {log}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Action button */}
        <div className="flex gap-1.5 pt-1 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="flex-1 py-1 bg-primary text-white hover:bg-primary-hover font-bold rounded text-[9px] transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {isPublishing ? (
              <>
                <span className="animate-spin">⌛</span>
                <span>PUBLISHING...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[12px]">upload_file</span>
                <span>PUBLISH GRADE</span>
              </>
            )}
          </button>
          <button
            onClick={onPublishAllPresets}
            disabled={isPublishing}
            className="px-2 py-1 bg-surface-container-highest border border-outline-variant hover:border-primary text-on-surface hover:text-white font-bold rounded text-[9px] transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Publish all presets to R2 CDN"
          >
            SYNC_CDN
          </button>
        </div>

        {publishMessage && (
          <div className="text-[7px] text-primary leading-tight py-0.5 text-center truncate shrink-0">
            {publishMessage}
          </div>
        )}
      </div>
    </aside>
  );
}
