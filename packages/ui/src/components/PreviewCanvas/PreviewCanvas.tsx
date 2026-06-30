/**
 * PreviewCanvas Component
 *
 * Renders effect with current parameters.
 * Supports pause/play/scrub and before/after comparison.
 */

import React, { useEffect, useRef, useState } from "react";

export interface PreviewCanvasProps {
  /** Effect definition to render */
  effect: any; // TODO: Type from @clypra/engine
  /** Media inputs for the effect */
  inputs: Record<string, any>;
  /** Current playback time in seconds */
  currentTime: number;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show before/after comparison */
  showComparison?: boolean;
  /** Playback state */
  playing?: boolean;
  /** Callback when playback state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Callback when time changes */
  onTimeChange?: (time: number) => void;
}

export function PreviewCanvas({ effect, inputs, currentTime, width = 1920, height = 1080, showComparison = false, playing = false, onPlayingChange, onTimeChange }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Handle playback animation
  useEffect(() => {
    if (!playing) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (onTimeChange && deltaTime > 0) {
        onTimeChange(currentTime + deltaTime);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playing, currentTime, onTimeChange]);

  // Render effect frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // TODO: Integrate with PixiRenderer from @clypra/runtime
    // For now, show placeholder
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#3b82f6";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Preview Canvas - ${effect?.name || "No Effect"}`, width / 2, height / 2 - 30);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px monospace";
    ctx.fillText(`Time: ${currentTime.toFixed(2)}s`, width / 2, height / 2 + 10);
    ctx.fillText(`Playing: ${playing}`, width / 2, height / 2 + 40);

    if (showComparison) {
      // Draw comparison split
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      ctx.fillStyle = "#f59e0b";
      ctx.font = "14px sans-serif";
      ctx.fillText("Before", width / 4, 30);
      ctx.fillText("After", (width * 3) / 4, 30);
    }
  }, [effect, inputs, currentTime, width, height, showComparison, playing]);

  const handleCanvasClick = () => {
    if (onPlayingChange) {
      onPlayingChange(!playing);
    }
  };

  return (
    <div className="preview-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          width: "100%",
          height: "auto",
          cursor: "pointer",
          border: "1px solid #334155",
          borderRadius: "8px",
        }}
      />
      <div
        style={{
          marginTop: "8px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          fontSize: "14px",
          color: "#94a3b8",
        }}
      >
        <button
          onClick={() => onPlayingChange?.(!playing)}
          style={{
            padding: "6px 16px",
            background: playing ? "#ef4444" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <label>
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(e) => {
              // Handle comparison toggle - prop would need to be passed
            }}
            style={{ marginRight: "6px" }}
          />
          Before/After
        </label>
        <span>
          Resolution: {width}×{height}
        </span>
      </div>
    </div>
  );
}
