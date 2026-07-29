import React, { useState } from "react";
import { BezierCurveEditor } from "./BezierCurveEditor";

const PRESETS: Record<string, [number, number, number, number]> = {
  Linear: [0.0, 0.0, 1.0, 1.0],
  EaseIn: [0.42, 0.0, 1.0, 1.0],
  EaseOut: [0.0, 0.0, 0.58, 1.0],
  EaseInOut: [0.42, 0.0, 0.58, 1.0],
  Overshoot: [0.34, 1.56, 0.64, 1.0],
};

export const KeyframePropertyInspector: React.FC = () => {
  const [controlPoints, setControlPoints] = useState<[number, number, number, number]>([0.42, 0.0, 0.58, 1.0]);

  return (
    <div style={{ padding: "24px", background: "#0F172A", color: "#FFF", borderRadius: "12px" }}>
      <h3 style={{ marginBottom: "16px", marginTop: 0 }}>Keyframe Easing Inspector</h3>

      {/* Preset Buttons */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {Object.entries(PRESETS).map(([name, cp]) => (
          <button
            key={name}
            onClick={() => setControlPoints(cp)}
            style={{
              padding: "6px 12px",
              background: "#1E293B",
              color: "#94A3B8",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* SVG Curve Editor */}
      <BezierCurveEditor
        controlPoints={controlPoints}
        onChange={setControlPoints}
        width={280}
        height={280}
      />
    </div>
  );
};
