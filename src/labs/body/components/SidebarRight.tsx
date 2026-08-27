import React from "react";
import { ClypraColorPicker } from "@clypra/ui-color-picker";

interface SidebarRightProps {
  activeTab: "inspector" | "nodes" | "stats";
  selectedEffect: string;
  parameters: Record<string, any>;
  activeProvider: string;
  latency: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  logs: string[];
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
  onSetActiveTab: (tab: "inspector" | "nodes" | "stats") => void;
  onParamChange: (key: string, value: any) => void;
  onDumpLog: () => void;
  onResetContext: () => void;
}

export function SidebarRight({
  activeTab,
  selectedEffect,
  parameters,
  activeProvider,
  latency,
  cpuUsage,
  gpuUsage,
  memUsage,
  logs,
  terminalEndRef,
  onSetActiveTab,
  onParamChange,
  onDumpLog,
  onResetContext,
}: SidebarRightProps) {
  return (
    <aside className="flex flex-col h-full w-[280px] min-w-[280px] bg-surface-container-low border-l border-outline-variant overflow-hidden select-none">
      <div className="flex bg-surface-container-lowest border-b border-outline-variant">
        {(["inspector", "nodes", "stats"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onSetActiveTab(tab)}
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all ${
              activeTab === tab
                ? "text-primary border-b border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-3 flex flex-col min-h-0">
        {activeTab === "inspector" && (
          <>
            <div>
              <h4 className="text-[10px] font-bold text-primary uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">tune</span> SELECTED:{" "}
                {selectedEffect.toUpperCase()}
              </h4>
              <div className="property-grid bg-surface-container border border-outline-variant rounded select-none">
                {selectedEffect === "neon-outline" && (
                  <>
                    <div className="text-outline">Glow Color</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <ClypraColorPicker
                        value={parameters.color ?? "#00FFFF"}
                        onChange={(newColor) => onParamChange("color", newColor)}
                        onChangeComplete={(newColor) => onParamChange("color", newColor)}
                        size="sm"
                        placement="left-start"
                        triggerClassName="w-6 h-4 rounded border border-outline-variant/50 cursor-pointer"
                      />
                      <span className="font-mono-data text-[9px] uppercase">
                        {parameters.color ?? "#00FFFF"}
                      </span>
                    </div>

                    <div className="text-outline">Thickness</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={parameters.thickness ?? 4}
                        onChange={(e) => onParamChange("thickness", parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {parameters.thickness ?? 4}px
                      </span>
                    </div>

                    <div className="text-outline">Intensity</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="2.5"
                        step="0.1"
                        value={parameters.intensity ?? 1.0}
                        onChange={(e) => onParamChange("intensity", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.intensity ?? 1.0).toFixed(1)}
                      </span>
                    </div>
                  </>
                )}

                {selectedEffect === "background-blur" && (
                  <>
                    <div className="text-outline">Blur Amount</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={parameters.blurAmount ?? 20}
                        onChange={(e) => onParamChange("blurAmount", parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {parameters.blurAmount ?? 20}px
                      </span>
                    </div>

                    <div className="text-outline">Softness</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={parameters.edgeSoftness ?? 0.2}
                        onChange={(e) => onParamChange("edgeSoftness", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.edgeSoftness ?? 0.2).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {selectedEffect === "spotlight" && (
                  <>
                    <div className="text-outline">Darkness</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={parameters.darkness ?? 0.7}
                        onChange={(e) => onParamChange("darkness", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.darkness ?? 0.7).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-outline">Falloff</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={parameters.falloff ?? 1.0}
                        onChange={(e) => onParamChange("falloff", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.falloff ?? 1.0).toFixed(1)}
                      </span>
                    </div>

                    <div className="text-outline">Shadow Tint</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <ClypraColorPicker
                        value={parameters.tint ?? "#000000"}
                        onChange={(newColor) => onParamChange("tint", newColor)}
                        onChangeComplete={(newColor) => onParamChange("tint", newColor)}
                        size="sm"
                        placement="left-start"
                        triggerClassName="w-6 h-4 rounded border border-outline-variant/50 cursor-pointer"
                      />
                      <span className="font-mono-data text-[9px] uppercase">
                        {parameters.tint ?? "#000000"}
                      </span>
                    </div>
                  </>
                )}

                {selectedEffect === "particle-aura" && (
                  <>
                    <div className="text-outline">Count</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="150"
                        step="10"
                        value={parameters.particleCount ?? 50}
                        onChange={(e) => onParamChange("particleCount", parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {parameters.particleCount ?? 50}
                      </span>
                    </div>

                    <div className="text-outline">Color</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <ClypraColorPicker
                        value={parameters.particleColor ?? "#FFFFFF"}
                        onChange={(newColor) => onParamChange("particleColor", newColor)}
                        onChangeComplete={(newColor) => onParamChange("particleColor", newColor)}
                        size="sm"
                        placement="left-start"
                        triggerClassName="w-6 h-4 rounded border border-outline-variant/50 cursor-pointer"
                      />
                      <span className="font-mono-data text-[9px] uppercase">
                        {parameters.particleColor ?? "#FFFFFF"}
                      </span>
                    </div>

                    <div className="text-outline">Speed</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={parameters.speed ?? 0.5}
                        onChange={(e) => onParamChange("speed", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.speed ?? 0.5).toFixed(1)}
                      </span>
                    </div>
                  </>
                )}

                {selectedEffect === "color-isolation" && (
                  <>
                    <div className="text-outline">Luma Desat</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={parameters.desaturation ?? 1.0}
                        onChange={(e) => onParamChange("desaturation", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.desaturation ?? 1.0).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-outline">Color Boost</div>
                    <div className="text-on-surface flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={parameters.colorBoost ?? 0.0}
                        onChange={(e) => onParamChange("colorBoost", parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <span className="font-mono-data text-[10px]">
                        {(parameters.colorBoost ?? 0.0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pipeline Context */}
            <div>
              <h4 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-0.5">
                Pipeline_Context
              </h4>
              <div className="property-grid bg-black/40 border border-outline-variant/50">
                <div className="text-outline">Latency</div>
                <div className="text-tertiary">{(latency + 2.1).toFixed(1)}ms</div>
                <div className="text-outline">API</div>
                <div className="text-on-surface font-mono-data">WebGL_Feature_Map</div>
                <div className="text-outline">Uptime</div>
                <div className="text-on-surface font-mono-data">00:03:45:12</div>
              </div>
            </div>
          </>
        )}

        {activeTab === "nodes" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[9.5px] leading-relaxed text-primary/80 overflow-y-auto">
            <p className="text-secondary">[NODE] Input source nodes loaded.</p>
            <p className="pl-2">└─ Node: buf_01_src (RGBA_8888, size: 1280x720)</p>
            <p className="text-[#ffb786] font-bold">[NODE] Extensible Provider Node</p>
            <p className="pl-2">└─ Provider: {activeProvider}</p>
            <p className="text-secondary">[NODE] Segmentation Mask Compiler</p>
            <p className="pl-2">└─ Mask: BODY_MASK (active)</p>
            <p className="text-primary font-bold">[NODE] Effect pass node</p>
            <p className="pl-2">└─ Effect: {selectedEffect.toUpperCase()}</p>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[10px] leading-relaxed text-secondary/80 overflow-y-auto">
            <p className="text-primary font-bold">Body Segmentation Performance</p>
            <p>───────────────</p>
            <p>Segment Latency: {(latency + 2.1).toFixed(2)}ms</p>
            <p>Inference target: 30.00ms (max)</p>
            <p>Accuracy threshold: 98.4% (eased)</p>
          </div>
        )}

        {/* Stream Monitor */}
        <div className="flex-1 flex flex-col min-h-0 select-text">
          <h4 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-0.5">
            Stream_Monitor
          </h4>
          <div className="flex-1 bg-black p-2 font-mono-data text-[9px] text-secondary/80 border border-outline-variant leading-tight overflow-y-auto max-h-[140px] flex flex-col gap-0.5">
            {logs.map((logStr, i) => (
              <p
                key={i}
                className={
                  logStr.includes("[WARN]")
                    ? "text-tertiary"
                    : logStr.includes("[IMPORT]")
                      ? "text-primary font-bold"
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

      <div className="p-1 border-t border-outline-variant bg-surface-container-low grid grid-cols-2 gap-1">
        <button
          onClick={onDumpLog}
          className="py-1 bg-surface-container-highest text-[10px] font-bold hover:bg-outline-variant hover:text-white uppercase rounded transition-colors text-center text-on-surface"
        >
          Dump_Log
        </button>
        <button
          onClick={onResetContext}
          className="py-1 bg-surface-container-highest text-[10px] font-bold hover:bg-outline-variant hover:text-white uppercase rounded transition-colors text-center text-on-surface"
        >
          Reset_Ctx
        </button>
      </div>
    </aside>
  );
}
