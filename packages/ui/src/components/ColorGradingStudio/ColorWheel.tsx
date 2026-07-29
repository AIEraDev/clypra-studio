import React, { useRef, useState, useCallback } from "react";

export interface ColorWheelProps {
  label: string;
  value: [number, number, number]; // [R, G, B] offset/scale
  onChange: (newValue: [number, number, number]) => void;
  size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  label,
  value,
  onChange,
  size = 140,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Map RGB offset to circle pointer offset [-1, 1]
  const handleX = (value[0] - value[2]) * (size / 2 - 10); // R - B
  const handleY = (value[1] - (value[0] + value[2]) / 2) * (size / 2 - 10);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateVector(e);
  };

  const updateVector = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const radius = size / 2;
      const cx = rect.left + radius;
      const cy = rect.top + radius;

      let dx = (e.clientX - cx) / radius;
      let dy = (e.clientY - cy) / radius;

      const dist = Math.hypot(dx, dy);
      if (dist > 1.0) {
        dx /= dist;
        dy /= dist;
      }

      // Convert dx, dy back to RGB offset multipliers
      const r = Math.max(-1, Math.min(1, dx * 0.5 + 0.5));
      const g = Math.max(-1, Math.min(1, -dy * 0.5 + 0.5));
      const b = Math.max(-1, Math.min(1, -dx * 0.5 + 0.5));

      onChange([parseFloat(r.toFixed(2)), parseFloat(g.toFixed(2)), parseFloat(b.toFixed(2))]);
    },
    [onChange, size]
  );

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) updateVector(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", marginBottom: "8px", textTransform: "uppercase" }}>
        {label}
      </span>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle, #1E293B 0%, #0F172A 70%, #020617 100%)",
          border: "2px solid #334155",
          position: "relative",
          cursor: isDragging ? "grabbing" : "crosshair",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        {/* HSL Spectrum Gradient Ring */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        {/* Center Crosshairs */}
        <line style={{ position: "absolute", top: size / 2, left: 10, right: 10, height: 1, background: "#334155" }} />

        {/* Interactive Pointer Handle */}
        <div
          style={{
            position: "absolute",
            top: size / 2 + handleY - 6,
            left: size / 2 + handleX - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#38BDF8",
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 8px rgba(56,189,248,0.8)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Numerical Readout */}
      <span style={{ marginTop: "6px", fontFamily: "monospace", fontSize: "10px", color: "#64748B" }}>
        R:{value[0].toFixed(2)} G:{value[1].toFixed(2)} B:{value[2].toFixed(2)}
      </span>
    </div>
  );
};
