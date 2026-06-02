import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Grid2X2 } from "lucide-react";
import type { TextEffectConfig } from "../types";
import { computeFitZoom } from "../engine/textLayout";

type ZoomMode = "fit" | "manual";

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: TextEffectConfig;
  bgMode: "checkerboard" | "black";
  zoom: number;
  zoomMode: ZoomMode;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: ZoomMode) => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  toolbarExtras?: React.ReactNode;
}

export function PreviewCanvas({ canvasRef, config, bgMode, zoom, zoomMode, onZoomChange, onZoomModeChange, onBgModeChange, toolbarExtras }: PreviewCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(100);

  const updateFitZoom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = config.canvasWidth || 800;
    const h = config.canvasHeight || 200;
    setFitZoom(computeFitZoom(el.clientWidth, el.clientHeight, w, h));
  }, [config.canvasWidth, config.canvasHeight]);

  useEffect(() => {
    updateFitZoom();
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateFitZoom());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateFitZoom]);

  const effectiveZoom = zoomMode === "fit" ? fitZoom : zoom;

  return (
    <section id="center-preview-viewport" className="flex flex-1 flex-col bg-[#09090D] overflow-hidden relative border-r border-[#2A2A38] min-w-0">
      <div className="flex items-center justify-between border-b border-[#2A2A38] bg-[#15151C] px-4 py-2 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C6FFF] animate-pulse" />
            Composition
          </span>
          <span className="text-[10px] font-mono text-clypra-muted bg-[#2A2A38]/50 px-2 py-0.5 rounded border border-[#2A2A38]/20">
            {config.canvasWidth}×{config.canvasHeight}
          </span>
          <span className="text-[10px] font-mono text-[#7C6FFF]/80 hidden sm:inline">
            {effectiveZoom}%{zoomMode === "fit" ? " fit" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg">
            <button type="button" onClick={() => onZoomModeChange("fit")} className={`p-1 px-2 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all ${zoomMode === "fit" ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`} title="Fit composition to viewport">
              <Maximize2 size={12} /> Fit
            </button>
            <button type="button" onClick={() => onZoomModeChange("manual")} className={`p-1 px-2 rounded text-[10px] font-mono cursor-pointer transition-all ${zoomMode === "manual" ? "bg-[#7C6FFF] text-white" : "text-clypra-muted hover:text-white"}`}>
              Manual
            </button>
          </div>

          <div className="flex items-center gap-1 border-r border-[#2A2A38] pr-2">
            <button
              type="button"
              onClick={() => {
                onZoomModeChange("manual");
                onZoomChange(Math.max(25, effectiveZoom - 25));
              }}
              className="p-1 text-clypra-muted hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-mono text-clypra-muted w-9 text-center">{effectiveZoom}%</span>
            <button
              type="button"
              onClick={() => {
                onZoomModeChange("manual");
                onZoomChange(Math.min(200, effectiveZoom + 25));
              }}
              className="p-1 text-clypra-muted hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <div className="flex items-center bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded">
            <button type="button" onClick={() => onBgModeChange("checkerboard")} className={`p-1 px-2.5 rounded text-[10px] font-mono cursor-pointer ${bgMode === "checkerboard" ? "bg-[#1E1E26] text-[#7C6FFF]" : "text-clypra-muted hover:text-white"}`} title="Alpha checkerboard">
              Alpha
            </button>
            <button type="button" onClick={() => onBgModeChange("black")} className={`p-1 px-2.5 rounded text-[10px] font-mono cursor-pointer ${bgMode === "black" ? "bg-[#1E1E26] text-[#7C6FFF]" : "text-clypra-muted hover:text-white"}`}>
              Black
            </button>
          </div>

          {toolbarExtras}
        </div>
      </div>

      <div ref={viewportRef} className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 md:p-8 relative composition-viewport">
        <div
          className="composition-stage flex items-center justify-center"
          style={{
            width: (config.canvasWidth || 800) * (effectiveZoom / 100),
            height: (config.canvasHeight || 200) * (effectiveZoom / 100),
            flexShrink: 0,
          }}
        >
          <div
            id="preview-canvas-card"
            className={`rounded-lg border border-[#2A2A38] shadow-2xl relative shrink-0 overflow-hidden ${bgMode === "checkerboard" ? "checkerboard" : "bg-black"}`}
            style={{
              width: config.canvasWidth,
              height: config.canvasHeight,
              transform: `scale(${effectiveZoom / 100})`,
              transformOrigin: "center center",
            }}
          >
            <div className="absolute inset-0 pointer-events-none composition-safe-area" aria-hidden />
            <canvas ref={canvasRef} id="clypra-preview-canvas" width={config.canvasWidth} height={config.canvasHeight} className="block w-full h-full select-none" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#1E1E26]/90 backdrop-blur border border-[#2A2A38] px-2.5 py-1.5 rounded-md pointer-events-none">
          <img src="/clypra.svg" alt="" className="w-3.5 h-3.5 opacity-80" />
          <span className="text-[10px] font-semibold text-white tracking-wide">
            Clypra <span className="text-[#7C6FFF]">Studio</span>
          </span>
        </div>
      </div>
    </section>
  );
}
