import React, { useState, useRef, useCallback } from "react";
import type { KeyframePoint, TimelineViewport, HandleMode } from "@clypra-studio/types";
import { resolveHandleConstraints } from "@clypra-studio/runtime";
import { generateMultiKeyframeSVGPath } from "./timelineUtils";

export interface MultiKeyframeGraphEditorProps {
  keyframes: KeyframePoint[];
  onChange: (updatedKeyframes: KeyframePoint[]) => void;
  currentTime?: number;
  width?: number;
  height?: number;
}

export const MultiKeyframeGraphEditor: React.FC<MultiKeyframeGraphEditorProps> = ({
  keyframes,
  onChange,
  currentTime = 0,
  width = 800,
  height = 400,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [viewport, setViewport] = useState<TimelineViewport>({
    scrollX: 0,
    zoomX: 100,
    scrollY: 0,
    zoomY: 100,
  });

  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: "keyframe" | "handleIn" | "handleOut";
    id: string;
  } | null>(null);

  const toPx = useCallback(
    (t: number, v: number) => ({
      x: (t - viewport.scrollX) * viewport.zoomX,
      y: height / 2 - (v - viewport.scrollY) * viewport.zoomY,
    }),
    [viewport, height]
  );

  const toWorld = useCallback(
    (px: number, py: number) => ({
      time: Math.max(0, px / viewport.zoomX + viewport.scrollX),
      value: (height / 2 - py) / viewport.zoomY + viewport.scrollY,
    }),
    [viewport, height]
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    const newKf: KeyframePoint = {
      id: `kf_${Date.now()}`,
      time: parseFloat(world.time.toFixed(2)),
      value: parseFloat(world.value.toFixed(2)),
      easing: "cubic-bezier",
      handleMode: "aligned",
      handleOut: { dt: 0.3, dv: 0.0 },
      handleIn: { dt: -0.3, dv: 0.0 },
    };

    const updated = [...keyframes, newKf].sort((a, b) => a.time - b.time);
    onChange(updated);
    setSelectedKeyframeId(newKf.id);
  };

  const handlePointerDown =
    (type: "keyframe" | "handleIn" | "handleOut", id: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setActiveDrag({ type, id });
      setSelectedKeyframeId(id);
    };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);

    const updated = keyframes.map((kf) => {
      if (kf.id !== activeDrag.id) return kf;

      if (activeDrag.type === "handleOut" || activeDrag.type === "handleIn") {
        const targetOffset = {
          dt: activeDrag.type === "handleOut" ? world.time - kf.time : world.time - kf.time,
          dv: world.value - kf.value,
        };

        const resolved = resolveHandleConstraints(kf, activeDrag.type, targetOffset);

        return {
          ...kf,
          handleIn: resolved.handleIn,
          handleOut: resolved.handleOut,
        };
      }

      if (activeDrag.type === "keyframe") {
        return {
          ...kf,
          time: parseFloat(world.time.toFixed(2)),
          value: parseFloat(world.value.toFixed(2)),
        };
      }

      return kf;
    });

    onChange(updated);
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setViewport((v) => ({ ...v, zoomX: Math.max(20, v.zoomX * zoomFactor) }));
    } else {
      setViewport((v) => ({ ...v, scrollX: Math.max(0, v.scrollX + e.deltaX * 0.01) }));
    }
  };

  const updateHandleMode = (mode: HandleMode) => {
    if (!selectedKeyframeId) return;
    const updated = keyframes.map((kf) => (kf.id === selectedKeyframeId ? { ...kf, handleMode: mode } : kf));
    onChange(updated);
  };

  const selectedKf = keyframes.find((k) => k.id === selectedKeyframeId);
  const curvePath = generateMultiKeyframeSVGPath(keyframes, toPx);
  const playheadPx = toPx(currentTime, 0).x;

  return (
    <div style={{ background: "#090D16", borderRadius: "12px", padding: "16px", userSelect: "none" }}>
      {/* Header & Mode Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "#9CA3AF", fontSize: "12px" }}>
        <span>Double-click to add keyframe • Wheel to Pan • Ctrl+Wheel to Zoom</span>
        <span>{keyframes.length} Keyframes</span>
      </div>

      {selectedKf && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {(["aligned", "mirrored", "broken"] as HandleMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateHandleMode(mode)}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background: selectedKf.handleMode === mode ? "#2563EB" : "#374151",
                color: "#FFF",
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </button>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        onDoubleClick={handleDoubleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ background: "#111827", borderRadius: "8px", cursor: activeDrag ? "grabbing" : "crosshair" }}
      >
        {/* Horizontal Axis */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#374151" strokeDasharray="4 4" />

        {/* Multi-Segment Bézier Curve */}
        <path d={curvePath} fill="none" stroke="#3B82F6" strokeWidth="3" />

        {/* Keyframe Nodes & Handles */}
        {keyframes.map((kf) => {
          const pt = toPx(kf.time, kf.value);
          const isSelected = kf.id === selectedKeyframeId;

          const hOut = kf.handleOut ? toPx(kf.time + kf.handleOut.dt, kf.value + kf.handleOut.dv) : null;
          const hIn = kf.handleIn ? toPx(kf.time + kf.handleIn.dt, kf.value + kf.handleIn.dv) : null;

          return (
            <g key={kf.id}>
              {isSelected && hOut && (
                <>
                  <line x1={pt.x} y1={pt.y} x2={hOut.x} y2={hOut.y} stroke="#EC4899" strokeWidth="1.5" />
                  <circle
                    cx={hOut.x}
                    cy={hOut.y}
                    r={6}
                    fill="#EC4899"
                    onPointerDown={handlePointerDown("handleOut", kf.id)}
                    style={{ cursor: "grab" }}
                  />
                </>
              )}
              {isSelected && hIn && (
                <>
                  <line x1={pt.x} y1={pt.y} x2={hIn.x} y2={hIn.y} stroke="#10B981" strokeWidth="1.5" />
                  <circle
                    cx={hIn.x}
                    cy={hIn.y}
                    r={6}
                    fill="#10B981"
                    onPointerDown={handlePointerDown("handleIn", kf.id)}
                    style={{ cursor: "grab" }}
                  />
                </>
              )}

              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 8 : 6}
                fill={isSelected ? "#F59E0B" : "#60A5FA"}
                stroke="#FFFFFF"
                strokeWidth={2}
                onPointerDown={handlePointerDown("keyframe", kf.id)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}

        {/* Current Time Playhead Overlay */}
        <line x1={playheadPx} y1={0} x2={playheadPx} y2={height} stroke="#EF4444" strokeWidth="2" />
      </svg>
    </div>
  );
};
