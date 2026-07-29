import React, { useState } from "react";

export interface WGSLCodeInspectorProps {
  wgslCode: string;
}

export const WGSLCodeInspector: React.FC<WGSLCodeInspectorProps> = ({ wgslCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wgslCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#0B0F19", borderRadius: "12px", border: "1px solid #1E293B", overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "10px 16px", background: "#0F172A", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#38BDF8", fontFamily: "monospace", textTransform: "uppercase" }}>
          Compiled WGSL Single-Pass Shader
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: "4px 12px",
            background: copied ? "#10B981" : "#1E293B",
            color: "#FFF",
            border: "1px solid #334155",
            borderRadius: "4px",
            fontSize: "11px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {copied ? "Copied!" : "Copy WGSL Code"}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: "16px",
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#A7F3D0",
          background: "#050811",
          overflowY: "auto",
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        <code>{wgslCode}</code>
      </pre>
    </div>
  );
};
