import React from "react";

interface SidebarRightProps {
  activeTab: "inspector" | "histogram" | "telemetry";
  onSetActiveTab: (tab: "inspector" | "histogram" | "telemetry") => void;
  selectedFilter: any;
  onSelectFilter: (filter: any) => void;
  intensity: number;
  onIntensityChange: (val: number) => void;
  manualAdjustments: any;
  onAdjustmentChange: (key: any, val: number) => void;
  onResetSlider: (key: any) => void;
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
                      CSS: {selectedFilter.cssFilter}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectFilter(null);
                      onIntensityChange(100);
                    }}
                    className="text-[8px] font-bold text-error bg-error-container/20 border border-error-container px-1 py-0.5 rounded hover:bg-error-container/40 transition-colors"
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
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded"
                  />
                </div>
              </div>
            )}

            {/* Manual Color Sliders */}
            <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-2">
              <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30 flex justify-between items-center">
                <span>Color Grading Adjustments</span>
                <span className="text-primary text-[8px] font-mono-data">Double-click val to reset</span>
              </h4>

              {/* Exposure */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">EXPOSURE</span>
                  <button
                    onDoubleClick={() => onResetSlider("exposure")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.exposure > 0 ? "+" : ""}
                    {manualAdjustments.exposure}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.exposure}
                  onChange={(e) => onAdjustmentChange("exposure", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">BRIGHTNESS</span>
                  <button
                    onDoubleClick={() => onResetSlider("brightness")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.brightness > 0 ? "+" : ""}
                    {manualAdjustments.brightness}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.brightness}
                  onChange={(e) => onAdjustmentChange("brightness", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">CONTRAST</span>
                  <button
                    onDoubleClick={() => onResetSlider("contrast")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.contrast > 0 ? "+" : ""}
                    {manualAdjustments.contrast}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.contrast}
                  onChange={(e) => onAdjustmentChange("contrast", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">SATURATION</span>
                  <button
                    onDoubleClick={() => onResetSlider("saturation")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.saturation > 0 ? "+" : ""}
                    {manualAdjustments.saturation}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.saturation}
                  onChange={(e) => onAdjustmentChange("saturation", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">TEMPERATURE</span>
                  <button
                    onDoubleClick={() => onResetSlider("temperature")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.temperature > 0 ? "+" : ""}
                    {manualAdjustments.temperature}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.temperature}
                  onChange={(e) => onAdjustmentChange("temperature", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Tint */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">TINT</span>
                  <button
                    onDoubleClick={() => onResetSlider("tint")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.tint > 0 ? "+" : ""}
                    {manualAdjustments.tint}%
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={manualAdjustments.tint}
                  onChange={(e) => onAdjustmentChange("tint", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Sepia */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">SEPIA MIX</span>
                  <button
                    onDoubleClick={() => onResetSlider("sepia")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.sepia}%
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={manualAdjustments.sepia}
                  onChange={(e) => onAdjustmentChange("sepia", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Grayscale */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">GRAYSCALE MIX</span>
                  <button
                    onDoubleClick={() => onResetSlider("grayscale")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.grayscale}%
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={manualAdjustments.grayscale}
                  onChange={(e) => onAdjustmentChange("grayscale", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Hue Rotate */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">HUE ROTATION</span>
                  <button
                    onDoubleClick={() => onResetSlider("hueRotate")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.hueRotate}°
                  </button>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={manualAdjustments.hueRotate}
                  onChange={(e) => onAdjustmentChange("hueRotate", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Vignette */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">VIGNETTE SHADOW</span>
                  <button
                    onDoubleClick={() => onResetSlider("vignette")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.vignette}%
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={manualAdjustments.vignette}
                  onChange={(e) => onAdjustmentChange("vignette", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">LENS BLUR (DEFOCUS)</span>
                  <button
                    onDoubleClick={() => onResetSlider("blur")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.blur}px
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={manualAdjustments.blur}
                  onChange={(e) => onAdjustmentChange("blur", parseFloat(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
              </div>

              {/* Invert */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono-data">
                  <span className="text-outline">INVERT PHASE</span>
                  <button
                    onDoubleClick={() => onResetSlider("invert")}
                    className="text-primary hover:text-white transition-colors"
                  >
                    {manualAdjustments.invert}%
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualAdjustments.invert}
                  onChange={(e) => onAdjustmentChange("invert", parseInt(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                />
               </div>

              {/* ── Advanced Grading Primitives ── */}
              <div className="pt-1 border-t border-outline-variant/30">
                <h5 className="text-[8px] font-bold text-outline uppercase pb-1 tracking-widest">Advanced Grading</h5>

                {/* Lift */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className="text-outline">LIFT</span>
                    <button
                      onDoubleClick={() => onResetSlider("lift" as any)}
                      className="text-primary hover:text-white transition-colors"
                    >
                      {((manualAdjustments as any).lift ?? 0) > 0 ? "+" : ""}
                      {((manualAdjustments as any).lift ?? 0)}%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={(manualAdjustments as any).lift ?? 0}
                    onChange={(e) => onAdjustmentChange("lift" as any, parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                  />
                  <div className="text-[7px] text-outline/60 font-mono-data">– crushed · 0 · faded +</div>
                </div>

                {/* Vibrance */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className="text-outline">VIBRANCE</span>
                    <button
                      onDoubleClick={() => onResetSlider("vibrance" as any)}
                      className="text-primary hover:text-white transition-colors"
                    >
                      {((manualAdjustments as any).vibrance ?? 0) > 0 ? "+" : ""}
                      {((manualAdjustments as any).vibrance ?? 0)}%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={(manualAdjustments as any).vibrance ?? 0}
                    onChange={(e) => onAdjustmentChange("vibrance" as any, parseInt(e.target.value))}
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                  />
                  <div className="text-[7px] text-outline/60 font-mono-data">Skin-tone protected · distinct from Saturation</div>
                </div>

                {/* Film Grain */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className="text-outline">GRAIN INTENSITY</span>
                    <button
                      onDoubleClick={() => onResetSlider("grainIntensity" as any)}
                      className="text-primary hover:text-white transition-colors"
                    >
                      {Math.round(((manualAdjustments as any).grainIntensity ?? 0) * 100)}%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={Math.round(((manualAdjustments as any).grainIntensity ?? 0) * 100)}
                    onChange={(e) => onAdjustmentChange("grainIntensity" as any, parseInt(e.target.value) / 100)}
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                  />
                </div>

                {/* Cross Process */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[9px] font-mono-data">
                    <span className="text-outline">CROSS PROCESS</span>
                    <button
                      onDoubleClick={() => onResetSlider("crossProcess" as any)}
                      className="text-primary hover:text-white transition-colors"
                    >
                      {Math.round(((manualAdjustments as any).crossProcess ?? 0) * 100)}%
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(((manualAdjustments as any).crossProcess ?? 0) * 100)}
                    onChange={(e) => onAdjustmentChange("crossProcess" as any, parseInt(e.target.value) / 100)}
                    className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                  />
                  <div className="text-[7px] text-outline/60 font-mono-data">Analog channel curve swap (R↔B)</div>
                </div>

                {/* Preset primitive summary — read-only badges */}
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
                        <span className="text-[7px] font-bold text-red-400">R{Math.round(selectedFilter.gradingParams.channelMix.r * 100)}</span>
                        <span className="text-[7px] font-bold text-green-400">G{Math.round(selectedFilter.gradingParams.channelMix.g * 100)}</span>
                        <span className="text-[7px] font-bold text-blue-400">B{Math.round(selectedFilter.gradingParams.channelMix.b * 100)}</span>
                        <span className="text-[7px] font-mono-data text-outline/80">B&amp;W channel mix</span>
                      </div>
                    )}
                    {selectedFilter.gradingParams.duotone && (
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.duotone.darkColor }} />
                        <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.duotone.lightColor }} />
                        <span className="text-[7px] font-mono-data text-outline/80">Duotone</span>
                      </div>
                    )}
                    {selectedFilter.gradingParams.halation && (
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 border border-outline-variant/40" style={{ background: selectedFilter.gradingParams.halation.color }} />
                        <span className="text-[7px] font-mono-data text-outline/80">Halation {Math.round(selectedFilter.gradingParams.halation.intensity * 100)}%</span>
                      </div>
                    )}
                    {selectedFilter.gradingParams.grain && (
                      <div className="text-[7px] font-mono-data text-outline/80">
                        Grain {Math.round(selectedFilter.gradingParams.grain.intensity * 100)}% · ×{selectedFilter.gradingParams.grain.size}
                      </div>
                    )}
                    {selectedFilter.gradingParams.vibrance && (
                      <div className="text-[7px] font-mono-data text-outline/80">
                        Vibrance {Math.round(selectedFilter.gradingParams.vibrance.amount * 100)}%
                      </div>
                    )}
                    {selectedFilter.gradingParams.crossProcess && (
                      <div className="text-[7px] font-mono-data text-outline/80">
                        Cross process {Math.round(selectedFilter.gradingParams.crossProcess.amount * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* HISTOGRAM TAB */}
        {activeTab === "histogram" && (
          <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-3">
            <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30 flex justify-between items-center">
              <span>Luminance & RGB Scopes</span>
            </h4>

            <div className="bg-black/95 rounded border border-outline-variant p-2 flex items-center justify-center relative shadow-inner h-[130px]">
              {histogramSVGData && histogramSVGData.maxVal > 1 ? (
                <div className="relative w-full h-full">
                  <svg className="w-full h-[110px]" viewBox="0 0 260 110" preserveAspectRatio="none">
                    <g className="mix-blend-screen opacity-85">
                      {/* Red Channel */}
                      {(histogramChannel === "all" || histogramChannel === "r") && (
                        <path d={histogramSVGData.rPath} fill="rgba(239, 68, 68, 0.15)" stroke="rgb(239, 68, 68)" strokeWidth="1" />
                      )}

                      {/* Green Channel */}
                      {(histogramChannel === "all" || histogramChannel === "g") && (
                        <path d={histogramSVGData.gPath} fill="rgba(34, 197, 94, 0.15)" stroke="rgb(34, 197, 94)" strokeWidth="1" />
                      )}

                      {/* Blue Channel */}
                      {(histogramChannel === "all" || histogramChannel === "b") && (
                        <path d={histogramSVGData.bPath} fill="rgba(59, 130, 246, 0.2)" stroke="rgb(59, 130, 246)" strokeWidth="1" />
                      )}

                      {/* Luminance Channel */}
                      {(histogramChannel === "all" || histogramChannel === "l") && (
                        <path d={histogramSVGData.lPath} fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" strokeDasharray="2,2" />
                      )}
                    </g>
                  </svg>
                  
                  {/* Axis labels */}
                  <div className="flex justify-between items-center text-[7px] font-mono-data text-outline/60 mt-1 select-none">
                    <span>SHADOWS (0)</span>
                    <span>MIDTONES</span>
                    <span>HIGHLIGHTS (255)</span>
                  </div>
                </div>
              ) : (
                <div className="text-[9px] font-mono-data text-outline/50 uppercase">No video signal parsed</div>
              )}
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-5 gap-0.5 bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
              {(["all", "r", "g", "b", "l"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onSetHistogramChannel(ch)}
                  className={`py-1 text-[8px] font-bold uppercase rounded transition-all cursor-pointer text-center ${
                    histogramChannel === ch ? "bg-surface-container-highest text-white" : "text-outline hover:text-white"
                  }`}
                >
                  {ch === "all" ? "RGB" : ch.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TELEMETRY TAB */}
        {activeTab === "telemetry" && (
          <div className="bg-surface-container border border-outline-variant p-2 rounded space-y-2">
            <h4 className="text-[10px] font-bold text-outline-variant uppercase pb-1 border-b border-outline-variant/30">
              Pipeline Diagnostics
            </h4>
            <div className="font-mono-data text-[9px] leading-relaxed text-secondary/90 space-y-1">
              <div><span className="text-outline">Engine:</span> Native Rust/wgpu</div>
              <div><span className="text-outline">Active Look:</span> {selectedFilter?.name ?? "CUSTOM (ADJUSTMENTS)"}</div>
              <div><span className="text-outline">Params Sync:</span> Dynamic (GPU Uniforms)</div>
              <div className="border-t border-outline-variant/10 my-1 pt-1" />
              <div><span className="text-outline">Frame Latency:</span> {latency}ms</div>
              <div><span className="text-outline">Average FPS:</span> {fps}</div>
              <div><span className="text-outline">CPU Load:</span> {cpuUsage}%</div>
              <div><span className="text-outline">GPU Load:</span> {gpuUsage}%</div>
              <div><span className="text-outline">Heap Size:</span> {memUsage}</div>
              <div className="border-t border-outline-variant/10 my-1 pt-1" />
              <div><span className="text-outline">Media Type:</span> {isVideo ? "Video (HTML5 Buffer)" : "Static Texture"}</div>
              <div><span className="text-outline">Duration:</span> {duration.toFixed(2)}s</div>
              <div><span className="text-outline">Play Clock:</span> {currentTime.toFixed(3)}s</div>
            </div>
          </div>
        )}

        {/* Stream Monitor Console */}
        <div className="flex-1 flex flex-col min-h-[140px] select-text">
          <h4 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-0.5">
            Stream_Monitor
          </h4>
          <div className="flex-1 bg-black p-2 font-mono-data text-[8px] text-secondary/80 border border-outline-variant leading-tight overflow-y-auto max-h-[160px] flex flex-col gap-0.5">
            {logs.map((logStr, i) => (
              <p
                key={i}
                className={
                  logStr.includes("[WARN]")
                    ? "text-tertiary"
                    : logStr.includes("[IMPORT]")
                      ? "text-primary font-bold"
                      : logStr.includes("[EFFECT]")
                        ? "text-[#4edea3] font-bold"
                        : logStr.includes("[OK]")
                          ? "text-secondary"
                          : ""
                }
              >
                {logStr}
              </p>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-1 border-t border-outline-variant bg-surface-container-low space-y-1 shrink-0">
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-black text-[10px] font-black uppercase rounded transition-colors text-center flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping shrink-0" />
              Deploying...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[12px]">cloud_upload</span>
              Deploy look to R2
            </>
          )}
        </button>

        <button
          onClick={onPublishAllPresets}
          disabled={isPublishing}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase rounded transition-colors text-center flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[12px]">dataset</span>
          Upload All Presets
        </button>

        {publishMessage && (
          <p className="text-[8px] font-mono-data text-[#4edea3] text-center bg-black/50 py-0.5 rounded px-1 truncate">
            {publishMessage}
          </p>
        )}

        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={onDumpLog}
            className="py-1 bg-surface-container-highest text-[10px] font-bold hover:bg-outline-variant hover:text-white uppercase rounded transition-colors text-center text-on-surface cursor-pointer"
          >
            Dump_Log
          </button>
          <button
            onClick={onResetContext}
            className="py-1 bg-surface-container-highest text-[10px] font-bold hover:bg-outline-variant hover:text-white uppercase rounded transition-colors text-center text-on-surface cursor-pointer"
          >
            Reset_Ctx
          </button>
        </div>
      </div>
    </aside>
  );
}
