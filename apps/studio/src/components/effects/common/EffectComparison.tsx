/**
 * Effect Comparison Component
 *
 * Side-by-side or split-screen comparison of original video vs effect applied.
 */

import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, SplitSquareHorizontal } from "lucide-react";

interface EffectComparisonProps {
  videoElement: HTMLVideoElement | null;
  renderOriginal: (ctx: CanvasRenderingContext2D) => void;
  renderEffect: (ctx: CanvasRenderingContext2D) => void;
  width: number;
  height: number;
}

type ViewMode = "side-by-side" | "split" | "toggle";

export function EffectComparison({ videoElement, renderOriginal, renderEffect, width, height }: EffectComparisonProps) {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [showOriginal, setShowOriginal] = useState(true);
  const [splitPosition, setSplitPosition] = useState(0.5); // 0-1

  // Render loop
  useEffect(() => {
    if (!videoElement) return;

    let animationId: number;

    const render = () => {
      if (viewMode === "side-by-side") {
        // Render both canvases
        const originalCtx = originalCanvasRef.current?.getContext("2d");
        const effectCtx = effectCanvasRef.current?.getContext("2d");

        if (originalCtx) {
          originalCtx.clearRect(0, 0, width, height);
          renderOriginal(originalCtx);
        }

        if (effectCtx) {
          effectCtx.clearRect(0, 0, width, height);
          renderEffect(effectCtx);
        }
      } else if (viewMode === "split") {
        // Render split view
        const splitCtx = splitCanvasRef.current?.getContext("2d");
        if (!splitCtx) return;

        splitCtx.clearRect(0, 0, width, height);

        // Save state
        splitCtx.save();

        // Render left side (original)
        splitCtx.beginPath();
        splitCtx.rect(0, 0, width * splitPosition, height);
        splitCtx.clip();
        renderOriginal(splitCtx);

        // Restore and render right side (effect)
        splitCtx.restore();
        splitCtx.save();
        splitCtx.beginPath();
        splitCtx.rect(width * splitPosition, 0, width * (1 - splitPosition), height);
        splitCtx.clip();
        renderEffect(splitCtx);

        splitCtx.restore();

        // Draw divider line
        splitCtx.strokeStyle = "#3b82f6";
        splitCtx.lineWidth = 3;
        splitCtx.beginPath();
        splitCtx.moveTo(width * splitPosition, 0);
        splitCtx.lineTo(width * splitPosition, height);
        splitCtx.stroke();
      } else if (viewMode === "toggle") {
        // Render single canvas based on toggle
        const canvas = splitCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        if (showOriginal) {
          renderOriginal(ctx);
        } else {
          renderEffect(ctx);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [videoElement, viewMode, showOriginal, splitPosition, renderOriginal, renderEffect, width, height]);

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
        <button onClick={() => setViewMode("side-by-side")} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === "side-by-side" ? "bg-white shadow" : "hover:bg-gray-200"}`}>
          <span className="text-sm">Side by Side</span>
        </button>
        <button onClick={() => setViewMode("split")} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === "split" ? "bg-white shadow" : "hover:bg-gray-200"}`}>
          <SplitSquareHorizontal size={16} />
          <span className="text-sm">Split View</span>
        </button>
        <button onClick={() => setViewMode("toggle")} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === "toggle" ? "bg-white shadow" : "hover:bg-gray-200"}`}>
          <Eye size={16} />
          <span className="text-sm">Toggle</span>
        </button>
      </div>

      {/* Canvas Display */}
      <div className="bg-black rounded-lg p-4">
        {viewMode === "side-by-side" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white text-sm mb-2">Original</div>
              <canvas ref={originalCanvasRef} width={width} height={height} className="w-full border border-gray-700 rounded" />
            </div>
            <div>
              <div className="text-white text-sm mb-2">With Effect</div>
              <canvas ref={effectCanvasRef} width={width} height={height} className="w-full border border-gray-700 rounded" />
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <div className="space-y-2">
            <div className="flex justify-between text-white text-sm">
              <span>Original ← | → With Effect</span>
              <span>
                {Math.round(splitPosition * 100)}% / {Math.round((1 - splitPosition) * 100)}%
              </span>
            </div>
            <canvas
              ref={splitCanvasRef}
              width={width}
              height={height}
              className="w-full border border-gray-700 rounded cursor-col-resize"
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  // Left mouse button pressed
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const newPosition = Math.max(0, Math.min(1, x / rect.width));
                  setSplitPosition(newPosition);
                }
              }}
            />
            <input type="range" min="0" max="1" step="0.01" value={splitPosition} onChange={(e) => setSplitPosition(parseFloat(e.target.value))} className="w-full" />
          </div>
        )}

        {viewMode === "toggle" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowOriginal(!showOriginal)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                {showOriginal ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="text-sm">{showOriginal ? "Showing Original" : "Showing Effect"}</span>
              </button>
              <span className="text-white text-sm">Press to toggle view</span>
            </div>
            <canvas ref={splitCanvasRef} width={width} height={height} className="w-full border border-gray-700 rounded cursor-pointer" onClick={() => setShowOriginal(!showOriginal)} />
          </div>
        )}
      </div>
    </div>
  );
}
