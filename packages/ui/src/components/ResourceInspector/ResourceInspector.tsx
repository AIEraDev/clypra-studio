/**
 * ResourceInspector Component
 *
 * Shows GPU resources: textures, uniforms, buffers, and memory usage.
 */

import React from "react";
import type { FrameGraph } from "@clypra/runtime/planner";

export interface ResourceInspectorProps {
  frameGraph: FrameGraph;
  memoryUsage?: number; // bytes
}

export const ResourceInspector: React.FC<ResourceInspectorProps> = ({ frameGraph, memoryUsage = 0 }) => {
  const textures = frameGraph.resourceRequests.filter((r) => r.type === "texture");
  const buffers = frameGraph.resourceRequests.filter((r) => r.type === "buffer");
  const transient = frameGraph.resourceRequests.filter((r) => r.transient);
  const permanent = frameGraph.resourceRequests.filter((r) => !r.transient);

  const totalMemory = frameGraph.resourceRequests.reduce((sum, resource) => {
    const bytesPerPixel = getBytesPerPixel(resource.format);
    return sum + resource.width * resource.height * bytesPerPixel;
  }, 0);

  return (
    <div className="resource-inspector" style={{ padding: "16px", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "16px", fontWeight: "bold", fontSize: "14px" }}>Resource Inspector</div>

      {/* Summary */}
      <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "6px" }}>
        <div style={{ fontSize: "12px", marginBottom: "4px" }}>
          <span style={{ fontWeight: "600" }}>Total Resources:</span> {frameGraph.resourceRequests.length}
        </div>
        <div style={{ fontSize: "12px", marginBottom: "4px" }}>
          <span style={{ fontWeight: "600" }}>Textures:</span> {textures.length} | <span style={{ fontWeight: "600" }}>Buffers:</span> {buffers.length}
        </div>
        <div style={{ fontSize: "12px", marginBottom: "4px" }}>
          <span style={{ fontWeight: "600" }}>Transient:</span> {transient.length} | <span style={{ fontWeight: "600" }}>Permanent:</span> {permanent.length}
        </div>
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#1976d2" }}>Memory: {formatBytes(totalMemory)}</div>
      </div>

      {/* Texture List */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Textures ({textures.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {textures.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} />
          ))}
        </div>
      </div>

      {/* Buffer List */}
      {buffers.length > 0 && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Buffers ({buffers.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {buffers.map((resource) => (
              <ResourceItem key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ResourceItemProps {
  resource: {
    id: string;
    type: "texture" | "buffer";
    width: number;
    height: number;
    format: string;
    transient: boolean;
  };
}

const ResourceItem: React.FC<ResourceItemProps> = ({ resource }) => {
  const bytesPerPixel = getBytesPerPixel(resource.format);
  const size = resource.width * resource.height * bytesPerPixel;

  return (
    <div
      style={{
        padding: "8px",
        backgroundColor: resource.transient ? "#fff9c4" : "#e3f2fd",
        border: "1px solid #e0e0e0",
        borderRadius: "4px",
        fontSize: "11px",
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
        {resource.id}
        {resource.transient && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#f57c00" }}>⏱ Transient</span>}
      </div>
      <div style={{ color: "#666" }}>
        {resource.width}×{resource.height} | {resource.format} | {formatBytes(size)}
      </div>
    </div>
  );
};

function getBytesPerPixel(format: string): number {
  switch (format) {
    case "rgba8":
      return 4;
    case "rgba16f":
      return 8;
    case "rgba32f":
      return 16;
    case "r8":
      return 1;
    case "depth24":
      return 3;
    default:
      return 4;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
