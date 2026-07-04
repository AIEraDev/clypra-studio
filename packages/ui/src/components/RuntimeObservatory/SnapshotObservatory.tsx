/**
 * Snapshot Observatory
 *
 * Pure rendering of RuntimeSnapshot.
 * No events. No subscriptions. No mutations.
 *
 * Think: React DevTools
 */

import { useMemo } from "react";
import type { RuntimeSnapshot } from "@clypra-studio/runtime/state";
import "./SnapshotObservatory.css";

export interface SnapshotObservatoryProps {
  snapshot: RuntimeSnapshot | null;
  className?: string;
}

export function SnapshotObservatory({ snapshot, className = "" }: SnapshotObservatoryProps) {
  if (!snapshot) {
    return (
      <div className={`snapshot-observatory ${className}`}>
        <div className="observatory-empty">No snapshot available</div>
      </div>
    );
  }

  return (
    <div className={`snapshot-observatory ${className}`}>
      {/* Header */}
      <ObservatoryHeader snapshot={snapshot} />

      {/* Pass Visualization */}
      <PassVisualization snapshot={snapshot} />

      {/* Execution Timeline */}
      <ExecutionTimeline snapshot={snapshot} />

      {/* Resource Lifetime */}
      <ResourceLifetime snapshot={snapshot} />

      {/* Performance Metrics */}
      <PerformanceMetrics snapshot={snapshot} />

      {/* Diagnostics */}
      {(snapshot.diagnostics.errors.length > 0 || snapshot.diagnostics.warnings.length > 0) && <Diagnostics snapshot={snapshot} />}
    </div>
  );
}

/**
 * Observatory Header
 */
function ObservatoryHeader({ snapshot }: { snapshot: RuntimeSnapshot }) {
  return (
    <div className="observatory-header">
      <h3>Runtime Observatory</h3>
      <div className="snapshot-info">
        <div className="frame-number">Frame {snapshot.frame}</div>
        <div className="backend-info">{snapshot.execution.backend.name}</div>
        <div className="status-badge" data-status={snapshot.execution.status}>
          {snapshot.execution.status}
        </div>
      </div>
    </div>
  );
}

/**
 * Pass Visualization
 *
 * Shows pass dependency graph with details.
 */
function PassVisualization({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { graph, execution } = snapshot;

  return (
    <div className="observatory-section">
      <h4>Pass Graph ({graph.passCount} passes)</h4>

      {/* Graph visualization */}
      <div className="pass-graph">
        {graph.dependencies.nodes.map((node) => {
          const passResult = execution.passResults.find((p) => p.id === node.id);
          const incoming = graph.dependencies.edges.filter((e) => e.to === node.id);
          const outgoing = graph.dependencies.edges.filter((e) => e.from === node.id);

          return (
            <div key={node.id} className="pass-node" data-type={node.type}>
              <div className="pass-node-header">
                <span className="pass-name">{node.name}</span>
                <span className="pass-shader">{node.shader}</span>
              </div>

              {passResult && (
                <div className="pass-details">
                  <div className="pass-timing">{passResult.duration.toFixed(2)}ms</div>
                  <div className="pass-stats">
                    <span title="Draw Calls">{passResult.drawCalls} draws</span>
                    <span title="Texture Binds">{passResult.textureBinds} binds</span>
                  </div>

                  {/* Inputs */}
                  {passResult.inputs.length > 0 && (
                    <div className="pass-resources">
                      <div className="resource-label">Inputs:</div>
                      {passResult.inputs.map((input, idx) => (
                        <div key={idx} className="resource-ref">
                          <span className="logical-id">{input.logicalId}</span>
                          <span className="physical-id">→ {input.physicalId}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outputs */}
                  {passResult.outputs.length > 0 && (
                    <div className="pass-resources">
                      <div className="resource-label">Outputs:</div>
                      {passResult.outputs.map((output, idx) => (
                        <div key={idx} className="resource-ref">
                          <span className="logical-id">{output.logicalId}</span>
                          <span className="physical-id">→ {output.physicalId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Connections */}
              {incoming.length > 0 && (
                <div className="pass-connections">
                  {incoming.map((edge, idx) => (
                    <div key={idx} className="connection-in" title={`From ${edge.from}`}>
                      ← {edge.resource}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Optimizations applied */}
      {graph.optimizations.length > 0 && (
        <div className="optimizations">
          <h5>Planner Optimizations</h5>
          {graph.optimizations.map((opt, idx) => (
            <div key={idx} className="optimization-item">
              <span className="opt-type">{opt.type}</span>
              <span className="opt-desc">{opt.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Execution Timeline
 *
 * Chrome DevTools-style visualization.
 */
function ExecutionTimeline({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { performance } = snapshot;
  const totalTime = performance.frameTime;

  // Calculate stage widths as percentages
  const stages = [
    { name: "Compile", time: performance.compile, color: "#3b82f6" },
    { name: "Plan", time: performance.plan, color: "#8b5cf6" },
    { name: "Schedule", time: performance.schedule, color: "#ec4899" },
    { name: "Render", time: performance.render, color: "#ef4444" },
    { name: "Present", time: performance.present, color: "#06b6d4" },
  ].filter((s) => s.time > 0);

  return (
    <div className="observatory-section">
      <h4>Execution Timeline</h4>

      <div className="timeline-bar">
        {stages.map((stage, idx) => {
          const width = (stage.time / totalTime) * 100;
          return (
            <div
              key={idx}
              className="timeline-stage"
              style={{
                width: `${width}%`,
                backgroundColor: stage.color,
              }}
              title={`${stage.name}: ${stage.time.toFixed(2)}ms`}
            >
              {width > 10 && <span className="stage-label">{stage.name}</span>}
            </div>
          );
        })}
      </div>

      <div className="timeline-summary">
        <span>Total: {totalTime.toFixed(2)}ms</span>
        <span>FPS: {performance.fps.toFixed(1)}</span>
        <span>GPU: {performance.gpuTime.toFixed(2)}ms</span>
        <span>CPU: {performance.cpuTime.toFixed(2)}ms</span>
      </div>
    </div>
  );
}

/**
 * Resource Lifetime
 *
 * Timeline showing when resources exist.
 */
function ResourceLifetime({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { resources } = snapshot;

  return (
    <div className="observatory-section">
      <h4>Resources ({resources.logical.length})</h4>

      <div className="resource-stats">
        <StatItem label="Allocated" value={resources.totalAllocated} />
        <StatItem label="Reused" value={resources.totalReused} color="#10b981" />
        <StatItem label="Released" value={resources.totalReleased} />
        <StatItem label="Peak Memory" value={formatBytes(resources.peakMemory)} />
      </div>

      <div className="resource-list">
        {resources.logical.map((resource) => (
          <div key={resource.id} className="resource-item">
            <div className="resource-header">
              <span className="resource-id">{resource.id}</span>
              <span className="resource-size">
                {resource.width}×{resource.height}
              </span>
              <span className={`resource-badge ${resource.transient ? "transient" : "persistent"}`}>{resource.transient ? "Transient" : "Persistent"}</span>
            </div>

            <div className="resource-mapping">
              <span className="logical">Logical: {resource.id}</span>
              <span className="arrow">→</span>
              <span className="physical">Physical: {resource.physicalId}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Aliasing information */}
      {resources.aliasing.length > 0 && (
        <div className="aliasing-info">
          <h5>Texture Aliasing</h5>
          {resources.aliasing.map((alias) => (
            <div key={alias.physicalId} className="alias-group">
              <div className="physical-texture">{alias.physicalId}</div>
              <div className="alias-mappings">
                {alias.aliases.map((mapping, idx) => (
                  <div key={idx} className="alias-mapping">
                    Frame {mapping.frame}: {mapping.logicalId} ({mapping.passName})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Performance Metrics
 */
function PerformanceMetrics({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { performance } = snapshot;

  return (
    <div className="observatory-section">
      <h4>Performance</h4>

      <div className="perf-grid">
        <div className="perf-panel">
          <h5>Frame Timing</h5>
          <StatItem label="Current" value={`${performance.frameTime.toFixed(2)}ms`} />
          <StatItem label="Average" value={`${performance.avgFrameTime.toFixed(2)}ms`} />
          <StatItem label="FPS" value={performance.fps.toFixed(1)} />
          <StatItem label="Avg FPS" value={performance.avgFps.toFixed(1)} />
        </div>

        <div className="perf-panel">
          <h5>GPU / CPU</h5>
          <StatItem label="GPU Time" value={`${performance.gpuTime.toFixed(2)}ms`} />
          <StatItem label="CPU Time" value={`${performance.cpuTime.toFixed(2)}ms`} />
          <StatItem label="Avg GPU" value={`${performance.avgGpuTime.toFixed(2)}ms`} />
          <StatItem label="Avg CPU" value={`${performance.avgCpuTime.toFixed(2)}ms`} />
        </div>

        <div className="perf-panel">
          <h5>Memory</h5>
          <StatItem label="Textures" value={formatBytes(performance.textureMemory)} />
          <StatItem label="Buffers" value={formatBytes(performance.bufferMemory)} />
          <StatItem label="Total" value={formatBytes(performance.totalMemory)} />
          <StatItem label="Peak" value={formatBytes(performance.peakMemory)} />
        </div>

        <div className="perf-panel">
          <h5>Cache</h5>
          <StatItem label="Texture Pool" value={`${performance.cache.texturePool.available}/${performance.cache.texturePool.size}`} />
          <StatItem label="Hit Rate" value={`${(performance.cache.texturePool.hitRate * 100).toFixed(1)}%`} color={performance.cache.texturePool.hitRate > 0.7 ? "#10b981" : "#ef4444"} />
          <StatItem label="Shader Cache" value={`${performance.cache.shaderCache.hits}/${performance.cache.shaderCache.hits + performance.cache.shaderCache.misses}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Diagnostics
 */
function Diagnostics({ snapshot }: { snapshot: RuntimeSnapshot }) {
  const { diagnostics } = snapshot;

  return (
    <div className="observatory-section">
      <h4>Diagnostics</h4>

      {diagnostics.errors.map((error, idx) => (
        <div key={idx} className="diagnostic-item error">
          <span className="diagnostic-subsystem">[{error.subsystem}]</span>
          <span className="diagnostic-message">{error.message}</span>
          <span className="diagnostic-time">{new Date(error.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}

      {diagnostics.warnings.map((warning, idx) => (
        <div key={idx} className="diagnostic-item warning">
          <span className="diagnostic-subsystem">[{warning.subsystem}]</span>
          <span className="diagnostic-message">{warning.message}</span>
          <span className="diagnostic-time">{new Date(warning.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Helper Components
 */
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

/**
 * Utilities
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
