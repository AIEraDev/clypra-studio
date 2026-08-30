import React, { useState, useRef, useEffect, useCallback } from "react";
import { BezierControlPoints, TemplateEasingFunction } from "@clypra-studio/engine";

interface BezierCurveEditorProps {
  bezier?: BezierControlPoints;
  onChange: (bezier: BezierControlPoints) => void;
  onEasingChange?: (easing: TemplateEasingFunction) => void;
  currentEasing?: TemplateEasingFunction;
}

const PRESET_BEZIERS: { label: string; bezier: BezierControlPoints; easing: TemplateEasingFunction }[] = [
  { label: "Standard", bezier: { x1: 0.4, y1: 0.0, x2: 0.2, y2: 1.0 }, easing: "ease" },
  { label: "Ease In", bezier: { x1: 0.42, y1: 0.0, x2: 1.0, y2: 1.0 }, easing: "ease-in" },
  { label: "Ease Out", bezier: { x1: 0.0, y1: 0.0, x2: 0.58, y2: 1.0 }, easing: "ease-out" },
  { label: "Ease In Out", bezier: { x1: 0.42, y1: 0.0, x2: 0.58, y2: 1.0 }, easing: "ease-in-out" },
  { label: "Overshoot", bezier: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1.0 }, easing: "cubic-bezier" },
  { label: "Snappy Pop", bezier: { x1: 0.16, y1: 1.08, x2: 0.38, y2: 0.98 }, easing: "cubic-bezier" },
  { label: "Linear", bezier: { x1: 0.0, y1: 0.0, x2: 1.0, y2: 1.0 }, easing: "linear" },
];

export const BezierCurveEditor: React.FC<BezierCurveEditorProps> = ({
  bezier = { x1: 0.4, y1: 0.0, x2: 0.2, y2: 1.0 },
  onChange,
  onEasingChange,
  currentEasing = "cubic-bezier",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<1 | 2 | null>(null);

  const width = 200;
  const height = 140;
  const padding = 20;
  const graphW = width - padding * 2;
  const graphH = height - padding * 2;

  // Coordinate transforms
  const toSvgX = (x: number) => padding + x * graphW;
  const toSvgY = (y: number) => padding + (1 - y) * graphH;

  const fromSvgX = (svgX: number) => Math.max(0, Math.min(1, (svgX - padding) / graphW));
  const fromSvgY = (svgY: number) => Math.max(-0.5, Math.min(1.5, 1 - (svgY - padding) / graphH));

  const p0 = { x: toSvgX(0), y: toSvgY(0) };
  const p1 = { x: toSvgX(bezier.x1), y: toSvgY(bezier.y1) };
  const p2 = { x: toSvgX(bezier.x2), y: toSvgY(bezier.y2) };
  const p3 = { x: toSvgX(1), y: toSvgY(1) };

  const pathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingPoint || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;

      const normX = Math.round(fromSvgX(svgX) * 100) / 100;
      const normY = Math.round(fromSvgY(svgY) * 100) / 100;

      if (draggingPoint === 1) {
        onChange({ ...bezier, x1: normX, y1: normY });
      } else {
        onChange({ ...bezier, x2: normX, y2: normY });
      }
      if (onEasingChange && currentEasing !== "cubic-bezier") {
        onEasingChange("cubic-bezier");
      }
    },
    [draggingPoint, bezier, onChange, onEasingChange, currentEasing]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingPoint(null);
  }, []);

  useEffect(() => {
    if (draggingPoint) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [draggingPoint, handlePointerMove, handlePointerUp]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-300">Bezier Curve & Tangents</span>
        <span className="text-zinc-500 font-mono text-[10px]">
          ({bezier.x1.toFixed(2)}, {bezier.y1.toFixed(2)}, {bezier.x2.toFixed(2)}, {bezier.y2.toFixed(2)})
        </span>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1">
        {PRESET_BEZIERS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onChange(preset.bezier);
              if (onEasingChange) onEasingChange(preset.easing);
            }}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              Math.abs(bezier.x1 - preset.bezier.x1) < 0.05 &&
              Math.abs(bezier.y1 - preset.bezier.y1) < 0.05 &&
              Math.abs(bezier.x2 - preset.bezier.x2) < 0.05 &&
              Math.abs(bezier.y2 - preset.bezier.y2) < 0.05
                ? "bg-indigo-600 text-white font-medium"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative flex justify-center bg-zinc-950 rounded border border-zinc-800/80 p-1 select-none">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="cursor-crosshair overflow-visible"
        >
          {/* Grid background */}
          <rect
            x={padding}
            y={padding}
            width={graphW}
            height={graphH}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 2"
          />
          {/* Diagonal reference line */}
          <line
            x1={p0.x}
            y1={p0.y}
            x2={p3.x}
            y2={p3.y}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="3 3"
          />

          {/* Handle Lines */}
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#6366f1" strokeWidth="1.5" />
          <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#ec4899" strokeWidth="1.5" />

          {/* Main Bezier Curve */}
          <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />

          {/* Endpoint markers */}
          <circle cx={p0.x} cy={p0.y} r="3" fill="#71717a" />
          <circle cx={p3.x} cy={p3.y} r="3" fill="#71717a" />

          {/* Control Point 1 Handle */}
          <circle
            cx={p1.x}
            cy={p1.y}
            r="6"
            fill="#6366f1"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
            onPointerDown={(e) => {
              e.preventDefault();
              setDraggingPoint(1);
            }}
          />

          {/* Control Point 2 Handle */}
          <circle
            cx={p2.x}
            cy={p2.y}
            r="6"
            fill="#ec4899"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
            onPointerDown={(e) => {
              e.preventDefault();
              setDraggingPoint(2);
            }}
          />
        </svg>
      </div>
    </div>
  );
};
