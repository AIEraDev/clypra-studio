import React from "react";
import { EFFECTS_REGISTRY } from "@clypra-studio/engine";
import type { EffectMetadata, EffectParameters } from "@clypra-studio/engine";

type ParamSchema = {
  type: "number" | "string" | "boolean" | "color";
  label: string;
  min?: number;
  max?: number;
  default: any;
  step?: number;
};

interface ParamControlProps {
  paramKey: string;
  schema: ParamSchema;
  value: any;
  onChange: (key: string, val: any) => void;
}

function ParamControl({ paramKey, schema, value, onChange }: ParamControlProps) {
  const currentValue = value ?? schema.default;

  if (schema.type === "number") {
    return (
      <>
        <div className="text-outline">{schema.label}</div>
        <div className="text-on-surface flex items-center gap-2">
          <input
            type="range"
            min={schema.min ?? 0}
            max={schema.max ?? 1}
            step={schema.step ?? 0.01}
            value={currentValue}
            onChange={(e) => onChange(paramKey, parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="font-mono-data text-[10px] w-10 text-right shrink-0">
            {typeof currentValue === "number" ? currentValue.toFixed(2) : currentValue}
          </span>
        </div>
      </>
    );
  }

  if (schema.type === "boolean") {
    return (
      <>
        <div className="text-outline">{schema.label}</div>
        <div className="text-on-surface flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!currentValue}
            onChange={(e) => onChange(paramKey, e.target.checked)}
            className="accent-primary"
          />
          <span className="text-[10px] font-bold text-primary">
            {currentValue ? "TRUE" : "FALSE"}
          </span>
        </div>
      </>
    );
  }

  if (schema.type === "color") {
    return (
      <>
        <div className="text-outline">{schema.label}</div>
        <div className="text-on-surface flex items-center gap-2">
          <input
            type="color"
            value={currentValue || schema.default}
            onChange={(e) => onChange(paramKey, e.target.value)}
            className="w-8 h-5 rounded cursor-pointer bg-transparent border-0"
          />
          <span className="font-mono-data text-[10px]">{currentValue || schema.default}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-outline">{schema.label}</div>
      <div className="text-on-surface font-mono-data text-[10px]">{String(currentValue)}</div>
    </>
  );
}

interface SidebarRightProps {
  activeTab: "inspector" | "nodes" | "stats";
  onSetActiveTab: (tab: "inspector" | "nodes" | "stats") => void;
  selectedEffectId: string;
  selectedMeta: EffectMetadata | null;
  parameters: EffectParameters;
  onParamChange: (key: string, value: any) => void;
  latency: number;
  fps: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  bodyTrackingStatus: "idle" | "loading" | "active" | "error";
  duration: number;
  currentTime: number;
  fitMode: "stretch" | "fit" | "crop";
  logs: string[];
  onDumpLog: () => void;
  onResetContext: () => void;
  identityEffectId: string;
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
}

export function SidebarRight({
  activeTab,
  onSetActiveTab,
  selectedEffectId,
  selectedMeta,
  parameters,
  onParamChange,
  latency,
  fps,
  cpuUsage,
  gpuUsage,
  memUsage,
  bodyTrackingStatus,
  duration,
  currentTime,
  fitMode,
  logs,
  onDumpLog,
  onResetContext,
  identityEffectId,
  terminalEndRef,
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
        {/* Inspector Tab */}
        {activeTab === "inspector" && (
          <>
            <div>
              <h4 className="text-[10px] font-bold text-primary uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">tune</span>
                Selected:{" "}
                {selectedEffectId === identityEffectId
                  ? "IDENTITY"
                  : selectedMeta?.name ?? selectedEffectId}
              </h4>

              {selectedEffectId === identityEffectId ? (
                <div className="property-grid bg-surface-container border border-outline-variant rounded">
                  <div className="text-outline">Mode</div>
                  <div className="text-secondary font-bold">PASS_THROUGH</div>
                  <div className="text-outline">Input</div>
                  <div className="text-on-surface font-mono-data">buf_01_src</div>
                  <div className="text-outline">Opacity</div>
                  <div className="text-on-surface">1.00</div>
                  <div className="text-outline">Log</div>
                  <div className="text-on-surface">VERBOSE</div>
                </div>
              ) : selectedMeta ? (
                <>
                  {Object.keys(selectedMeta.parameterSchema).length > 0 ? (
                    <div className="property-grid bg-surface-container border border-outline-variant rounded">
                      {Object.entries(selectedMeta.parameterSchema).map(([key, schema]) => (
                        <ParamControl
                          key={key}
                          paramKey={key}
                          schema={schema as ParamSchema}
                          value={parameters[key]}
                          onChange={onParamChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="property-grid bg-surface-container border border-outline-variant rounded">
                      <div className="text-outline">Effect</div>
                      <div className="text-secondary font-bold">ACTIVE</div>
                      <div className="text-outline">Params</div>
                      <div className="text-on-surface-variant text-[9px]">None (auto)</div>
                    </div>
                  )}

                  {selectedMeta.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedMeta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] bg-primary/10 text-primary/70 px-1 py-0.5 rounded border border-primary/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedMeta.category === "body" && (
                    <div
                      className={`mt-1 p-1.5 rounded border text-[10px] font-mono-data ${
                        bodyTrackingStatus === "active"
                          ? "bg-secondary/5 border-secondary/30 text-secondary"
                          : bodyTrackingStatus === "loading"
                            ? "bg-primary/5 border-primary/30 text-primary"
                            : bodyTrackingStatus === "error"
                              ? "bg-error/5 border-error/30 text-error"
                              : "bg-surface-container border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      <p className="font-bold mb-0.5">Body Tracking</p>
                      <p className="text-[9px] opacity-80">
                        {bodyTrackingStatus === "active"
                          ? "Segmentation provider active. Mask data flowing."
                          : bodyTrackingStatus === "loading"
                            ? "Initializing ML model..."
                            : bodyTrackingStatus === "error"
                              ? "Provider failed — rendering without mask."
                              : "Idle"}
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-0.5">
                Pipeline_Context
              </h4>
              <div className="property-grid bg-black/40 border border-outline-variant/50">
                <div className="text-outline">Latency</div>
                <div className="text-tertiary">{latency}ms</div>
                <div className="text-outline">FPS</div>
                <div className="text-on-surface">{fps}</div>
                <div className="text-outline">API</div>
                <div className="text-on-surface">Canvas2D + EffectEngine</div>
                <div className="text-outline">Registry</div>
                <div className="text-secondary">{Object.keys(EFFECTS_REGISTRY).length} effects</div>
                <div className="text-outline">Category</div>
                <div className="text-on-surface">{selectedMeta?.category ?? "identity"}</div>
              </div>
            </div>
          </>
        )}

        {/* Nodes Tab */}
        {activeTab === "nodes" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[9.5px] leading-relaxed text-primary/80 overflow-y-auto">
            <p className="text-secondary">[NODE] Source nodes loaded.</p>
            <p className="pl-2">└─ buf_01_src (RGBA_8888, 1280×720)</p>
            <p className="text-secondary mt-1">[NODE] Effect pass compiled.</p>
            {selectedEffectId === identityEffectId ? (
              <p className="pl-2">└─ IDENTITY (pass-through, status: ACTIVE)</p>
            ) : (
              <>
                <p className="pl-2">└─ {selectedMeta?.name ?? selectedEffectId}</p>
                <p className="pl-4 text-on-surface-variant text-[9px]">
                  category: {selectedMeta?.category}
                </p>
                <p className="pl-4 text-on-surface-variant text-[9px]">
                  params: {Object.keys(parameters).length} keys
                </p>
                <p className="pl-4 text-on-surface-variant text-[9px]">
                  renderer: EffectRenderer.apply()
                </p>
              </>
            )}
            {bodyTrackingStatus === "active" && (
              <>
                <p className="text-secondary mt-1">[NODE] Feature providers active.</p>
                <p className="pl-2">└─ SegmentationProvider (mask → body effect)</p>
              </>
            )}
            <p className="text-secondary mt-1">[NODE] Output target.</p>
            <p className="pl-2">└─ display_target_0 (canvas ctx)</p>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[10px] leading-relaxed text-secondary/80 overflow-y-auto">
            <p className="text-primary font-bold">Real-Time Performance Metrics</p>
            <p>───────────────────────</p>
            <p>Engine: EffectEngine v1 (Canvas2D)</p>
            <p>Active Effect: {selectedMeta?.name ?? "IDENTITY"}</p>
            <p>Category: {selectedMeta?.category ?? "—"}</p>
            <p>Param Keys: {Object.keys(parameters).length}</p>
            <p>─</p>
            <p>Frame Latency: {latency}ms</p>
            <p>Effective FPS: {fps}</p>
            <p>CPU Load est.: {cpuUsage}%</p>
            <p>GPU Load est.: {gpuUsage}%</p>
            <p>JS Heap: {memUsage}</p>
            <p>─</p>
            <p>Body Tracking: {bodyTrackingStatus.toUpperCase()}</p>
            <p>Fit Mode: {fitMode.toUpperCase()}</p>
            <p>Video Duration: {duration.toFixed(2)}s</p>
            <p>Current Time: {currentTime.toFixed(3)}s</p>
          </div>
        )}

        {/* Stream Monitor Console */}
        <div className="flex-1 flex flex-col min-h-0 select-text">
          <h4 className="text-[10px] font-bold text-outline-variant uppercase mb-1 px-0.5">
            Stream_Monitor
          </h4>
          <div className="flex-1 bg-black p-2 font-mono-data text-[9px] text-secondary/80 border border-outline-variant leading-tight overflow-y-auto max-h-[150px] flex flex-col gap-0.5">
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
                        : logStr.includes("[BODY]")
                          ? "text-tertiary font-bold"
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
