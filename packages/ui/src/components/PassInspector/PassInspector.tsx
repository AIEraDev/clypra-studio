/**
 * PassInspector Component
 *
 * Shows render passes from the frame graph.
 * Displays execution order, shaders, uniforms, and textures.
 */

import React from "react";
import type { FrameGraph, RenderPass } from "@clypra-studio/runtime/planner";

export interface PassInspectorProps {
  frameGraph: FrameGraph;
  selectedPassId?: string;
  onPassSelect?: (passId: string) => void;
}

export const PassInspector: React.FC<PassInspectorProps> = ({ frameGraph, selectedPassId, onPassSelect }) => {
  return (
    <div className="pass-inspector" style={{ padding: "16px", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "16px", fontWeight: "bold", fontSize: "14px" }}>Pass Inspector</div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: "#666" }}>
          Frame: {frameGraph.frameNumber} | Time: {frameGraph.timelineTimeMs.toFixed(2)}ms
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>Total Passes: {frameGraph.passes.length}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {frameGraph.passes.map((pass, index) => (
          <PassCard key={pass.id} pass={pass} index={index} selected={pass.id === selectedPassId} onClick={() => onPassSelect?.(pass.id)} />
        ))}
      </div>
    </div>
  );
};

interface PassCardProps {
  pass: RenderPass;
  index: number;
  selected: boolean;
  onClick: () => void;
}

const PassCard: React.FC<PassCardProps> = ({ pass, index, selected, onClick }) => {
  const uniformCount = Object.keys(pass.uniforms).length;
  const inputCount = pass.inputs.length;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        backgroundColor: selected ? "#e8f5e9" : "#fafafa",
        border: selected ? "2px solid #4caf50" : "1px solid #e0e0e0",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "#2196f3",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: "bold",
            marginRight: "8px",
          }}
        >
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600" }}>{pass.name || pass.id}</div>
          <div style={{ fontSize: "10px", color: "#666" }}>Shader: {pass.shaderId}</div>
        </div>
      </div>

      {/* Resources */}
      <div style={{ marginBottom: "8px", paddingLeft: "32px" }}>
        <div style={{ fontSize: "11px", color: "#555" }}>
          <span style={{ fontWeight: "500" }}>Inputs:</span> {inputCount > 0 ? pass.inputs.join(", ") : "none"}
        </div>
        <div style={{ fontSize: "11px", color: "#555" }}>
          <span style={{ fontWeight: "500" }}>Output:</span> {pass.output}
        </div>
      </div>

      {/* Uniforms */}
      {uniformCount > 0 && (
        <div style={{ paddingLeft: "32px", fontSize: "10px", color: "#777" }}>
          <div style={{ fontWeight: "500", marginBottom: "4px" }}>Uniforms ({uniformCount}):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {Object.entries(pass.uniforms)
              .slice(0, 5)
              .map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    padding: "2px 6px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "3px",
                  }}
                >
                  {key}: {JSON.stringify(value)}
                </div>
              ))}
            {uniformCount > 5 && <div style={{ padding: "2px 6px", color: "#999" }}>+{uniformCount - 5} more</div>}
          </div>
        </div>
      )}

      {/* Flags */}
      <div style={{ paddingLeft: "32px", marginTop: "8px", fontSize: "10px" }}>
        {pass.clearBeforeRender && <span style={{ padding: "2px 6px", backgroundColor: "#fff3e0", color: "#e65100", borderRadius: "3px", marginRight: "4px" }}>Clear</span>}
        {pass.blendMode && <span style={{ padding: "2px 6px", backgroundColor: "#f3e5f5", color: "#6a1b9a", borderRadius: "3px" }}>Blend: {pass.blendMode}</span>}
      </div>
    </div>
  );
};
