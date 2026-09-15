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
                <div className="text-outline">Cutout Text</div>
                <div className="text-on-surface">
                  <input
                    type="text"
                    value={parameters.cutoutText ?? "CLYPRA"}
                    onChange={(e) => onParamChange("cutoutText", e.target.value)}
                    className="w-full bg-surface-container-highest border border-outline-variant/60 rounded px-1.5 py-0.5 text-[10px] text-on-surface focus:outline-none focus:border-primary font-bold tracking-wider"
                    placeholder="e.g. CLYPRA"
                  />
                </div>

                <div className="text-outline">Text Color</div>
                <div className="text-on-surface flex items-center gap-2">
                  <ClypraColorPicker
                    value={parameters.textColor ?? "#FFFFFF"}
                    onChange={(newColor) => onParamChange("textColor", newColor)}
                    onChangeComplete={(newColor) => onParamChange("textColor", newColor)}
                    size="sm"
                    placement="left-start"
                    triggerClassName="clypra-swatch-trigger w-6 h-5 rounded border border-outline-variant/50 cursor-pointer"
                  />
                  <span className="font-mono-data text-[9px] uppercase">
                    {parameters.textColor ?? "#FFFFFF"}
                  </span>
                </div>

                <div className="text-outline">Text Size</div>
                <div className="text-on-surface flex items-center gap-2">
                  <input
                    type="range"
                    min="40"
                    max="220"
                    step="5"
                    value={parameters.textSize ?? 120}
                    onChange={(e) => onParamChange("textSize", parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-mono-data text-[10px]">
                    {parameters.textSize ?? 120}px
                  </span>
                </div>

                <div className="text-outline">Position Y</div>
                <div className="text-on-surface flex items-center gap-2">
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="5"
                    value={parameters.textOffsetY ?? 0}
                    onChange={(e) => onParamChange("textOffsetY", parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-mono-data text-[10px]">
                    {parameters.textOffsetY ?? 0}px
                  </span>
                </div>

                <div className="text-outline">Edge Feather</div>
                <div className="text-on-surface flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parameters.feather ?? 4}
                    onChange={(e) => onParamChange("feather", parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-mono-data text-[10px]">
                    {parameters.feather ?? 4}px
                  </span>
                </div>

                <div className="text-outline">Choke Amount</div>
                <div className="text-on-surface flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.choke ?? 0.2}
                    onChange={(e) => onParamChange("choke", parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-mono-data text-[10px]">
                    {(parameters.choke ?? 0.2).toFixed(2)}
                  </span>
                </div>
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
