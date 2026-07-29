import React from "react";
import type { EngineTelemetryStats } from "@clypra-studio/types";

export const StudioDiagnosticsOverlay: React.FC<{ stats: EngineTelemetryStats }> = ({ stats }) => {
  const isJanking = stats.uiFps < 120 || stats.gpuFrameTimeMs > 6.9;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        padding: "10px 14px",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        borderRadius: "8px",
        border: `1px solid ${isJanking ? "#EF4444" : "#10B981"}`,
        color: "#F8FAFC",
        fontFamily: "monospace",
        fontSize: "11px",
        zIndex: 9999,
        pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#94A3B8" }}>
        CLYPRA ENGINE TELEMETRY
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
        <span>UI Refresh Rate:</span>
        <span style={{ color: stats.uiFps < 120 ? "#EF4444" : "#34D399", textAlign: "right" }}>
          {stats.uiFps.toFixed(0)} FPS
        </span>

        <span>GPU Frame Pass:</span>
        <span style={{ color: stats.gpuFrameTimeMs > 6.9 ? "#FBBF24" : "#34D399", textAlign: "right" }}>
          {stats.gpuFrameTimeMs.toFixed(2)} ms
        </span>

        <span>Wasm Worker Latency:</span>
        <span style={{ textAlign: "right" }}>{stats.workerQueueLatencyMs.toFixed(1)} ms</span>

        <span>Uniform Buffer:</span>
        <span style={{ textAlign: "right" }}>{stats.activeUniformBytes} B</span>
      </div>
    </div>
  );
};
