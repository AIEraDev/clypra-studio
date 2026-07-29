import React from "react";
import type { ColorWheelState } from "@clypra-studio/types";
import { ColorWheel } from "./ColorWheel";

export interface ColorGradingStudioPanelProps {
  state: ColorWheelState;
  onChange: (newState: ColorWheelState) => void;
}

export const ColorGradingStudioPanel: React.FC<ColorGradingStudioPanelProps> = ({ state, onChange }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#0F172A", padding: "20px", borderRadius: "12px", border: "1px solid #1E293B" }}>
      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#F8FAFC", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Primary Color Wheels (CDL)
      </h4>

      {/* 3 Color Wheels (Lift, Gamma, Gain) */}
      <div style={{ display: "flex", justifyContent: "space-around", gap: "16px" }}>
        <ColorWheel
          label="Lift (Shadows)"
          value={state.lift}
          onChange={(newVal) => onChange({ ...state, lift: newVal })}
        />
        <ColorWheel
          label="Gamma (Midtones)"
          value={state.gamma}
          onChange={(newVal) => onChange({ ...state, gamma: newVal })}
        />
        <ColorWheel
          label="Gain (Highlights)"
          value={state.gain}
          onChange={(newVal) => onChange({ ...state, gain: newVal })}
        />
      </div>

      {/* Saturation and Exposure Sliders */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
            <span>Rec.709 Saturation</span>
            <span style={{ fontFamily: "monospace", color: "#38BDF8" }}>{state.sat.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="3.0"
            step="0.05"
            value={state.sat}
            onChange={(e) => onChange({ ...state, sat: parseFloat(e.target.value) })}
            style={{ accentColor: "#38BDF8" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94A3B8" }}>
            <span>Exposure Offset</span>
            <span style={{ fontFamily: "monospace", color: "#EC4899" }}>{state.exposure.toFixed(2)} EV</span>
          </div>
          <input
            type="range"
            min="-3.0"
            max="3.0"
            step="0.1"
            value={state.exposure}
            onChange={(e) => onChange({ ...state, exposure: parseFloat(e.target.value) })}
            style={{ accentColor: "#EC4899" }}
          />
        </div>
      </div>
    </div>
  );
};
