import React, { useRef, useEffect, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, Shield, Eye } from "lucide-react";
import type { MotionGraphicTemplate } from "../types";
import { renderMotionTemplate, evaluatePhase } from "../renderer/motionCompositor";

interface MotionViewportProps {
  template: MotionGraphicTemplate;
  currentTime: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function MotionViewport({
  template,
  currentTime,
  zoom,
  onZoomChange,
}: MotionViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showGuides, setShowGuides] = useState(true);

  const phaseInfo = evaluatePhase(currentTime, template.phaseTiming);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderMotionTemplate(
      ctx,
      template,
      currentTime,
      template.resolution.width,
      template.resolution.height,
    );
  }, [template, currentTime]);

  const phaseBadgeColor =
    phaseInfo.phase === "intro"
      ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
      : phaseInfo.phase === "hold"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : "bg-rose-500/20 text-rose-400 border-rose-500/40";

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0a0a0f] select-none"
    >
      {/* Background Studio Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1f1f2e 1px, transparent 1px), linear-gradient(to bottom, #1f1f2e 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Viewport Canvas Container */}
      <div
        className="relative transition-transform duration-75 shadow-2xl rounded border border-[#222230]"
        style={{
          width: `${(template.resolution.width * zoom) / 2}px`,
          height: `${(template.resolution.height * zoom) / 2}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={template.resolution.width}
          height={template.resolution.height}
          className="w-full h-full object-contain rounded bg-[#09090d]"
        />

        {/* Title Safe-Zone Guides */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Action Safe (90%) */}
            <div className="absolute inset-[5%] border border-dashed border-sky-500/30 rounded" />
            {/* Title Safe (80%) */}
            <div className="absolute inset-[10%] border border-dashed border-amber-500/30 rounded">
              <span className="absolute top-1 left-2 text-[10px] font-mono text-amber-500/50">
                TITLE SAFE (80%)
              </span>
            </div>
            {/* Center Crosshair */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
          </div>
        )}
      </div>

      {/* Floating HUD: Phase Status & Resolution */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${phaseBadgeColor}`}
        >
          <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
          Phase: {phaseInfo.phase} ({Math.round(phaseInfo.progress * 100)}%)
        </div>
        <div className="px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-xs font-mono text-gray-300 backdrop-blur-md">
          {template.resolution.width} × {template.resolution.height} @ {template.fps}fps
        </div>
      </div>

      {/* Floating Viewport Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 rounded-lg border border-white/10 bg-black/50 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setShowGuides(!showGuides)}
          title="Toggle Title Safe Guides"
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
            showGuides ? "text-amber-400" : "text-gray-400"
          }`}
        >
          <Shield className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/15 my-auto" />
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.2, zoom - 0.1))}
          title="Zoom Out"
          className="p-1.5 rounded text-gray-300 hover:bg-white/10 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-gray-400 px-1 min-w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
          title="Zoom In"
          className="p-1.5 rounded text-gray-300 hover:bg-white/10 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(0.6)}
          title="Reset Zoom"
          className="p-1.5 rounded text-gray-300 hover:bg-white/10 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
