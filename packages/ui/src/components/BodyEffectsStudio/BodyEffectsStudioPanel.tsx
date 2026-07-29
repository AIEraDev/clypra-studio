import React from "react";
import type { BodyEffectState } from "@clypra-studio/types";

export interface BodyEffectsStudioPanelProps {
  state: BodyEffectState;
  onChange: (newState: BodyEffectState) => void;
}

export const BodyEffectsStudioPanel: React.FC<BodyEffectsStudioPanelProps> = ({ state, onChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", background: "#0F172A", padding: "20px", borderRadius: "12px", border: "1px solid #1E293B" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#F8FAFC", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          AI Body Segmentation & Mask Studio
        </h4>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", color: "#38BDF8" }}>
          <input
            type="checkbox"
            checked={state.maskEnabled}
            onChange={(e) => onChange({ ...state, maskEnabled: e.target.checked })}
          />
          Enable Body Isolation Mask
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Outline Glow Intensity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
            <span>Body Outline Glow</span>
            <span style={{ fontFamily: "monospace", color: "#38BDF8" }}>{state.outlineGlow.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={state.outlineGlow}
            onChange={(e) => onChange({ ...state, outlineGlow: parseFloat(e.target.value) })}
            style={{ accentColor: "#38BDF8" }}
          />
        </div>

        {/* Aura Color Spectrum Shift */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
            <span>Aura Spectrum Hue</span>
            <span style={{ fontFamily: "monospace", color: "#A855F7" }}>{state.auraHue}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={state.auraHue}
            onChange={(e) => onChange({ ...state, auraHue: parseInt(e.target.value, 10) })}
            style={{ accentColor: "#A855F7" }}
          />
        </div>

        {/* Background Depth Blur */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
            <span>Background Bokeh Blur</span>
            <span style={{ fontFamily: "monospace", color: "#10B981" }}>{state.bgBlur} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={state.bgBlur}
            onChange={(e) => onChange({ ...state, bgBlur: parseInt(e.target.value, 10) })}
            style={{ accentColor: "#10B981" }}
          />
        </div>
      </div>
    </div>
  );
};
