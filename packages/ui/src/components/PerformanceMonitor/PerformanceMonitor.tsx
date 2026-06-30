/**
 * PerformanceMonitor Component
 *
 * Shows real-time performance metrics: GPU/CPU time, FPS, pass breakdown.
 */

import React from "react";

export interface PerformanceMetrics {
  gpuTime: number; // ms
  cpuTime: number; // ms
  passCount: number;
  fps: number;
  memoryUsage: number; // bytes
  passTimes?: Array<{ passId: string; time: number }>;
}

export interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  targetFps?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ metrics, targetFps = 60 }) => {
  const targetFrameTime = 1000 / targetFps;
  const totalTime = metrics.gpuTime + metrics.cpuTime;
  const isOverBudget = totalTime > targetFrameTime;

  return (
    <div className="performance-monitor" style={{ padding: "16px", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "16px", fontWeight: "bold", fontSize: "14px" }}>Performance Monitor</div>

      {/* FPS Display */}
      <div
        style={{
          marginBottom: "16px",
          padding: "16px",
          backgroundColor: isOverBudget ? "#ffebee" : "#e8f5e9",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", fontWeight: "bold", color: isOverBudget ? "#c62828" : "#2e7d32" }}>{metrics.fps.toFixed(1)} FPS</div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
          Target: {targetFps} FPS ({targetFrameTime.toFixed(2)}ms)
        </div>
      </div>

      {/* Timing Breakdown */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Frame Time: {totalTime.toFixed(2)}ms</div>

        <MetricBar label="GPU" value={metrics.gpuTime} max={targetFrameTime} color="#2196f3" />
        <MetricBar label="CPU" value={metrics.cpuTime} max={targetFrameTime} color="#ff9800" />
      </div>

      {/* Pass Count */}
      <div style={{ marginBottom: "16px", fontSize: "12px" }}>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: "600" }}>Render Passes:</span> {metrics.passCount}
        </div>
        <div>
          <span style={{ fontWeight: "600" }}>Memory Usage:</span> {formatBytes(metrics.memoryUsage)}
        </div>
      </div>

      {/* Pass Time Breakdown */}
      {metrics.passTimes && metrics.passTimes.length > 0 && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Pass Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {metrics.passTimes.map((pass, index) => (
              <div
                key={pass.passId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "11px",
                  padding: "4px 8px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                <div style={{ width: "20px", fontWeight: "600", color: "#666" }}>{index + 1}</div>
                <div style={{ flex: 1, marginRight: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pass.passId}</div>
                <div style={{ fontWeight: "600", color: "#1976d2" }}>{pass.time.toFixed(2)}ms</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
        <span style={{ fontWeight: "600" }}>{label}</span>
        <span>{value.toFixed(2)}ms</span>
      </div>
      <div style={{ width: "100%", height: "8px", backgroundColor: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
