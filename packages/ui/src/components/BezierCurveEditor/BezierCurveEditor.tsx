import React, { useState, useRef, useCallback } from "react";

export interface BezierCurveEditorProps {
  controlPoints: [number, number, number, number];
  onChange: (newControlPoints: [number, number, number, number]) => void;
  width?: number;
  height?: number;
  padding?: number;
}

export const BezierCurveEditor: React.FC<BezierCurveEditorProps> = ({
  controlPoints,
  onChange,
  width = 300,
  height = 300,
  padding = 40,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeHandle, setActiveHandle] = useState<"cp1" | "cp2" | null>(null);

  const [x1, y1, x2, y2] = controlPoints;

  // Printable Canvas Dimensions
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // --- Coordinate Mapping Helpers ---
  const toPixelX = useCallback(
    (nx: number) => padding + nx * drawWidth,
    [padding, drawWidth]
  );

  const toPixelY = useCallback(
    (ny: number) => padding + (1 - ny) * drawHeight, // Invert Y-axis for SVG
    [padding, drawHeight]
  );

  const toNormalizedX = useCallback(
    (px: number) => Math.min(Math.max((px - padding) / drawWidth, 0), 1),
    [padding, drawWidth]
  );

  const toNormalizedY = useCallback(
    (py: number) => Math.min(Math.max(1 - (py - padding) / drawHeight, -0.5), 1.5),
    [padding, drawHeight]
  );

  // --- Keyframe Anchor Positions (Fixed Start/End) ---
  const k0 = { x: toPixelX(0), y: toPixelY(0) };
  const k1 = { x: toPixelX(1), y: toPixelY(1) };

  // --- Control Handle Positions ---
  const h1 = { x: toPixelX(x1), y: toPixelY(y1) };
  const h2 = { x: toPixelX(x2), y: toPixelY(y2) };

  // --- Dragging Handlers ---
  const handlePointerDown = (handle: "cp1" | "cp2") => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;

    const normX = toNormalizedX(mousePx);
    const normY = toNormalizedY(mousePy);

    if (activeHandle === "cp1") {
      onChange([normX, normY, x2, y2]);
    } else if (activeHandle === "cp2") {
      onChange([x1, y1, normX, normY]);
    }
  };

  const handlePointerUp = () => {
    if (activeHandle) {
      setActiveHandle(null);
    }
  };

  // SVG Cubic Bezier Path String: M start_x,start_y C cp1_x,cp1_y cp2_x,cp2_y end_x,end_y
  const curvePathD = `M ${k0.x},${k0.y} C ${h1.x},${h1.y} ${h2.x},${h2.y} ${k1.x},${k1.y}`;

  return (
    <div
      style={{
        display: "inline-block",
        background: "#111827",
        padding: "16px",
        borderRadius: "12px",
        userSelect: "none",
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none", cursor: activeHandle ? "grabbing" : "default" }}
      >
        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#374151" strokeDasharray="4 4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeDasharray="4 4" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" />
        <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} stroke="#374151" />

        {/* Diagonal Linear Reference Line */}
        <line x1={k0.x} y1={k0.y} x2={k1.x} y2={k1.y} stroke="#1F2937" strokeWidth="2" />

        {/* Handle Connector Lines */}
        <line x1={k0.x} y1={k0.y} x2={h1.x} y2={h1.y} stroke="#3B82F6" strokeWidth="2" />
        <line x1={k1.x} y1={k1.y} x2={h2.x} y2={h2.y} stroke="#EC4899" strokeWidth="2" />

        {/* Main Cubic Bezier Curve */}
        <path d={curvePathD} fill="none" stroke="#60A5FA" strokeWidth="4" />

        {/* Start and End Keyframe Point Anchors */}
        <circle cx={k0.x} cy={k0.y} r={6} fill="#F97316" />
        <circle cx={k1.x} cy={k1.y} r={6} fill="#F97316" />

        {/* Interactive Handle 1 (CP1) */}
        <circle
          cx={h1.x}
          cy={h1.y}
          r={9}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          style={{ cursor: "grab" }}
          onPointerDown={handlePointerDown("cp1")}
        />

        {/* Interactive Handle 2 (CP2) */}
        <circle
          cx={h2.x}
          cy={h2.y}
          r={9}
          fill="#EC4899"
          stroke="#FFFFFF"
          strokeWidth={2}
          style={{ cursor: "grab" }}
          onPointerDown={handlePointerDown("cp2")}
        />
      </svg>

      {/* Numerical Curve Readout */}
      <div
        style={{
          marginTop: "12px",
          color: "#9CA3AF",
          fontSize: "12px",
          fontFamily: "monospace",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          cubic-bezier({x1.toFixed(2)}, {y1.toFixed(2)}, {x2.toFixed(2)}, {y2.toFixed(2)})
        </span>
      </div>
    </div>
  );
};
