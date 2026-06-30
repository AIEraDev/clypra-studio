/**
 * Runtime Observatory
 *
 * Comprehensive runtime inspection and debugging panel.
 * Shows real-time telemetry from all subsystems.
 */

import { useEffect, useState } from "react";
import type { FrameTelemetry, TelemetryCollector } from "@clypra/runtime/telemetry";

export interface RuntimeObservatoryProps {
  telemetry: TelemetryCollector;
  className?: string;
}

export function RuntimeObservatory({ telemetry, className = "" }: RuntimeObservatoryProps) {
  const [frame, setFrame] = useState<FrameTelemetry | null>(null);
  const [avgMetrics, setAvgMetrics] = useState({
    avgCompile: 0,
    avgPlan: 0,
    avgRender: 0,
    avgTotal: 0,
    fps: 0,
  });

  useEffect(() => {
    // Poll telemetry every frame
    const interval = setInterval(() => {
      const latest = telemetry.getLatestFrame();
      if (latest) {
        setFrame(latest);
        setAvgMetrics(telemetry.getAverageMetrics(60));
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [telemetry]);

  if (!frame) {
    return (
      <div className={`runtime-observatory ${className}`}>
        <div className="observatory-empty">Waiting for frame data...</div>
      </div>
    );
  }

  return (
    <div className={`runtime-observatory ${className}`}>
      {/* Frame Header */}
      <div className="observatory-header">
        <h3>Runtime Observatory</h3>
        <div className="frame-number">Frame {frame.frameNumber}</div>
      </div>

      {/* Timing Panel */}
      <div className="observatory-section">
        <h4>Frame Timings</h4>
        <div className="timing-grid">
          <TimingBar label="Compile" value={frame.compile} color="#3b82f6" />
          <TimingBar label="Plan" value={frame.plan} color="#8b5cf6" />
          <TimingBar label="Validate" value={frame.validate} color="#10b981" />
          <TimingBar label="Upload" value={frame.upload} color="#f59e0b" />
          <TimingBar label="Render" value={frame.render} color="#ef4444" />
          <TimingBar label="Present" value={frame.present} color="#06b6d4" />
        </div>
        <div className="timing-total">
          <strong>Total:</strong> {frame.total.toFixed(2)}ms
          <span className="fps-counter">{avgMetrics.fps.toFixed(1)} FPS</span>
        </div>
      </div>

      {/* Pass Execution */}
      <div className="observatory-section">
        <h4>Pass Execution ({frame.passCount})</h4>
        <div className="pass-list">
          {frame.passes.map((pass, idx) => (
            <div key={idx} className="pass-item">
              <div className="pass-name">{pass.name}</div>
              <div className="pass-shader">{pass.shaderId}</div>
              <div className="pass-time">{pass.duration.toFixed(2)}ms</div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Management */}
      <div className="observatory-section">
        <h4>Resources ({frame.resourceCount})</h4>
        <div className="resource-stats">
          <StatItem label="Allocated" value={frame.allocations} />
          <StatItem label="Released" value={frame.releases} />
          <StatItem label="Reused" value={frame.reuses} />
          <StatItem label="Transient" value={frame.transientCount} />
          <StatItem label="Persistent" value={frame.persistentCount} />
        </div>
        <div className="resource-list">
          {frame.resources.map((resource, idx) => (
            <div key={idx} className="resource-item">
              <div className="resource-id">{resource.id}</div>
              <div className="resource-size">
                {resource.width}x{resource.height}
              </div>
              <div className={`resource-type ${resource.transient ? "transient" : "persistent"}`}>{resource.transient ? "T" : "P"}</div>
              {resource.reused && <div className="resource-badge">REUSED</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Cache Performance */}
      <div className="observatory-section">
        <h4>Cache</h4>
        <div className="cache-stats">
          <StatItem label="Hits" value={frame.cacheHits} color="#10b981" />
          <StatItem label="Misses" value={frame.cacheMisses} color="#ef4444" />
          <StatItem label="Hit Rate" value={frame.cacheHits + frame.cacheMisses > 0 ? `${((frame.cacheHits / (frame.cacheHits + frame.cacheMisses)) * 100).toFixed(1)}%` : "N/A"} />
        </div>
      </div>

      {/* Errors & Warnings */}
      {(frame.errors.length > 0 || frame.warnings.length > 0) && (
        <div className="observatory-section">
          <h4>Issues</h4>
          {frame.errors.map((error, idx) => (
            <div key={idx} className="issue-item error">
              <strong>[{error.subsystem}]</strong> {error.message}
            </div>
          ))}
          {frame.warnings.map((warning, idx) => (
            <div key={idx} className="issue-item warning">
              <strong>[{warning.subsystem}]</strong> {warning.message}
            </div>
          ))}
        </div>
      )}

      {/* Average Metrics */}
      <div className="observatory-section observatory-footer">
        <h4>60-Frame Average</h4>
        <div className="avg-metrics">
          <StatItem label="Compile" value={`${avgMetrics.avgCompile.toFixed(2)}ms`} />
          <StatItem label="Plan" value={`${avgMetrics.avgPlan.toFixed(2)}ms`} />
          <StatItem label="Render" value={`${avgMetrics.avgRender.toFixed(2)}ms`} />
          <StatItem label="Total" value={`${avgMetrics.avgTotal.toFixed(2)}ms`} />
        </div>
      </div>
    </div>
  );
}

// Helper Components

function TimingBar({ label, value, color }: { label: string; value: number; color: string }) {
  const maxTime = 16.67; // 60 FPS budget
  const percentage = Math.min((value / maxTime) * 100, 100);

  return (
    <div className="timing-bar-container">
      <div className="timing-label">{label}</div>
      <div className="timing-bar-track">
        <div className="timing-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
      <div className="timing-value">{value.toFixed(2)}ms</div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
