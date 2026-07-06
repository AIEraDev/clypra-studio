import React from "react";
import { ALL_TRANSITIONS } from "@clypra-studio/engine/transitions";

interface SidebarRightProps {
  activeTab: "inspector" | "nodes" | "stats";
  selectedTransition: string;
  parameters: Record<string, any>;
  latency: number;
  cpuUsage: number;
  gpuUsage: number;
  memUsage: string;
  duration: number;
  progress: number;
  logs: string[];
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
  onSetActiveTab: (tab: "inspector" | "nodes" | "stats") => void;
  onParamChange: (key: string, value: any) => void;
  onDumpLog: () => void;
  onResetContext: () => void;
  onPublish: () => void;
  isRecording: boolean;
}

export function SidebarRight({
  activeTab,
  selectedTransition,
  parameters,
  latency,
  cpuUsage,
  gpuUsage,
  memUsage,
  duration,
  progress,
  logs,
  terminalEndRef,
  onSetActiveTab,
  onParamChange,
  onDumpLog,
  onResetContext,
  onPublish,
  isRecording,
}: SidebarRightProps) {
  const activeTransition = ALL_TRANSITIONS.find((t) => t.id === selectedTransition);

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
                {activeTransition ? activeTransition.name.toUpperCase() : selectedTransition.toUpperCase()}
              </h4>
              <div className="property-grid bg-surface-container border border-outline-variant rounded select-none">
                {activeTransition?.params.map((param) => {
                  const val = parameters[param.key] ?? param.value;
                  return (
                    <React.Fragment key={param.key}>
                      <div className="text-outline text-xs">{param.label}</div>
                      <div className="text-on-surface select-none">
                        {param.type === "select" && (
                          <select
                            value={val}
                            onChange={(e) => onParamChange(param.key, e.target.value)}
                            className="bg-black/80 border border-outline-variant rounded text-[10px] px-1 py-0.5 text-on-surface outline-none"
                          >
                            {param.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        {param.type === "range" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={param.min ?? 0}
                              max={param.max ?? 100}
                              step={param.step ?? 1}
                              value={val}
                              onChange={(e) => onParamChange(param.key, parseFloat(e.target.value))}
                              className="w-full accent-primary"
                            />
                            <span className="font-mono-data text-[10px]">
                              {val}
                            </span>
                          </div>
                        )}
                        {param.type === "color" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={val}
                              onChange={(e) => onParamChange(param.key, e.target.value)}
                              className="w-6 h-4 bg-transparent border-0 cursor-pointer"
                            />
                            <span className="font-mono-data text-[9px] uppercase">
                              {val}
                            </span>
                          </div>
                        )}
                        {param.type === "toggle" && (
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={(e) => onParamChange(param.key, e.target.checked)}
                            className="accent-primary"
                          />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                {(!activeTransition || activeTransition.params.length === 0) && (
                  <div className="col-span-2 text-center text-on-surface-variant p-2 text-[10px]">
                    No parameters configuration available
                  </div>
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
                <div className="text-tertiary">{latency}ms</div>
                <div className="text-outline">API</div>
                <div className="text-on-surface font-mono-data">WebGL_Mixer_2D</div>
                <div className="text-outline">Uptime</div>
                <div className="text-on-surface font-mono-data">00:05:12:04</div>
              </div>
            </div>
          </>
        )}

        {activeTab === "nodes" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[9.5px] leading-relaxed text-primary/80 overflow-y-auto">
            <p className="text-secondary">[NODE] Outgoing Source Channel 1</p>
            <p className="pl-2">└─ Node: buf_01_chan1 (RGBA_8888, size: 1280x720)</p>
            <p className="text-secondary mt-1">[NODE] Incoming Source Channel 2</p>
            <p className="pl-2">└─ Node: buf_02_chan2 (RGBA_8888, size: 1280x720)</p>
            <p className="text-primary font-bold mt-1">[NODE] Mix Compositor Pass</p>
            <p className="pl-2">└─ Mix: {selectedTransition.toUpperCase()}</p>
            {activeTransition?.params.map((p) => (
              <p key={p.key} className="pl-4 text-on-surface-variant text-[9px]">
                {p.key}: {String(parameters[p.key] ?? p.value)}
              </p>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="flex-1 p-2 bg-black border border-outline-variant font-mono-data text-[10px] leading-relaxed text-secondary/80 overflow-y-auto">
            <p className="text-primary font-bold">Mix Progress Performance</p>
            <p>───────────────</p>
            <p>Active Easing: {parameters.easing ?? "linear"}</p>
            <p>Transition Duration: {duration.toFixed(2)}s</p>
            <p>Mixer progress: {(progress * 100).toFixed(0)}%</p>
            <p>Average mix latency: {latency}ms</p>
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

      <div className="p-1 border-t border-outline-variant bg-surface-container-low space-y-1">
        <button
          onClick={onPublish}
          disabled={isRecording}
          className="w-full py-1.5 bg-teal-500 text-black text-[10px] font-black hover:bg-teal-400 disabled:opacity-50 uppercase rounded transition-colors text-center flex items-center justify-center gap-1.5"
        >
          {isRecording ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping shrink-0" />
              Recording...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[12px]">cloud_upload</span>
              Publish to API
            </>
          )}
        </button>
        <div className="grid grid-cols-2 gap-1">
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
      </div>
    </aside>
  );
}
