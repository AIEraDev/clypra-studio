/**
 * Runtime Inspector Overlay
 *
 * Displays real-time runtime statistics during rendering.
 * This is NOT a DevTools panel - it's an overlay on the preview itself.
 *
 * Shows:
 * - Compilation status
 * - Planning status
 * - Resource allocation
 * - Pass execution
 * - GPU timing
 * - FPS
 */

import React from "react";

export interface RuntimeInspectorProps {
  /** Current effect or pass name */
  effectName: string;
  /** Compilation status */
  compiled: boolean;
  /** Planning status */
  planned: boolean;
  /** Number of resources allocated */
  resourceCount: number;
  /** Number of passes */
  passCount: number;
  /** Number of textures */
  textureCount: number;
  /** GPU execution time in ms */
  gpuTime: number;
  /** Current FPS */
  fps: number;
  /** Compact mode (smaller display) */
  compact?: boolean;
}

export function RuntimeInspector({ effectName, compiled, planned, resourceCount, passCount, textureCount, gpuTime, fps, compact = false }: RuntimeInspectorProps) {
  if (compact) {
    return (
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(51, 65, 85, 0.8)",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#e2e8f0",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span style={{ color: compiled ? "#10b981" : "#6b7280" }}>{compiled ? "✓" : "○"} C</span>
        <span style={{ color: planned ? "#10b981" : "#6b7280" }}>{planned ? "✓" : "○"} P</span>
        <span style={{ color: "#94a3b8" }}>
          {passCount}p {textureCount}t
        </span>
        <span style={{ color: gpuTime < 8 ? "#10b981" : gpuTime < 16 ? "#f59e0b" : "#ef4444" }}>{gpuTime.toFixed(2)}ms</span>
        <span style={{ color: fps >= 55 ? "#10b981" : fps >= 30 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{fps} FPS</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(51, 65, 85, 0.8)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#e2e8f0",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
        minWidth: "200px",
      }}
    >
      {/* Effect Name */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "10px",
          color: "#f1f5f9",
          borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
          paddingBottom: "8px",
        }}
      >
        {effectName}
      </div>

      {/* Pipeline Status */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>Compile</span>
          <span style={{ color: compiled ? "#10b981" : "#6b7280", fontWeight: 600 }}>{compiled ? "✓" : "○"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>Planner</span>
          <span style={{ color: planned ? "#10b981" : "#6b7280", fontWeight: 600 }}>{planned ? "✓" : "○"}</span>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(51, 65, 85, 0.5)",
            margin: "4px 0",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>Resources</span>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{resourceCount}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>Passes</span>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{passCount}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>Textures</span>
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{textureCount}</span>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(51, 65, 85, 0.5)",
            margin: "4px 0",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>GPU</span>
          <span
            style={{
              color: gpuTime < 8 ? "#10b981" : gpuTime < 16 ? "#f59e0b" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {gpuTime.toFixed(2)} ms
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>FPS</span>
          <span
            style={{
              color: fps >= 55 ? "#10b981" : fps >= 30 ? "#f59e0b" : "#ef4444",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {fps}
          </span>
        </div>
      </div>
    </div>
  );
}
