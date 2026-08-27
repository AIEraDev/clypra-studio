import React, { useEffect, useRef, useState, useCallback } from "react";
import type { TextEffectConfig } from "@clypra-studio/engine";
import { computeFitZoom } from "@clypra-studio/engine";

export type ZoomMode = "fit" | "manual";

export interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: TextEffectConfig;
  bgMode: "checkerboard" | "black";
  zoom: number;
  zoomMode: ZoomMode;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: ZoomMode) => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  onEffectiveZoomChange?: (zoom: number) => void;
}

export function getPreviewRenderDimensions(
  canvasWidth: number = 800,
  canvasHeight: number = 200,
  effectiveZoom: number = 100,
): { renderW: number; renderH: number; renderScale: number } {
  const baseW = canvasWidth || 800;
  const baseH = canvasHeight || 200;
  const dpr =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;
  const zoomScale = Math.max(1, (effectiveZoom || 100) / 100);
  const maxDim = 5120;
  const maxScale = Math.max(1, maxDim / Math.max(baseW, baseH));
  const renderScale = Math.min(Math.max(zoomScale, dpr), maxScale);
  const renderW = Math.round(baseW * renderScale);
  const renderH = Math.round(baseH * renderScale);
  return { renderW, renderH, renderScale };
}

export function PreviewCanvas({
  canvasRef,
  config,
  bgMode,
  zoom,
  zoomMode,
  onZoomChange,
  onZoomModeChange,
  onBgModeChange,
  onEffectiveZoomChange,
}: PreviewCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(100);

  const updateFitZoom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setFitZoom(
      computeFitZoom(
        el.clientWidth,
        el.clientHeight,
        config.canvasWidth || 800,
        config.canvasHeight || 200,
      ),
    );
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

  useEffect(() => {
    onEffectiveZoomChange?.(effectiveZoom);
  }, [effectiveZoom, onEffectiveZoomChange]);

  const { renderW, renderH } = getPreviewRenderDimensions(
    config.canvasWidth,
    config.canvasHeight,
    effectiveZoom,
  );

  return (
    <section
      id="center-preview-viewport"
      className="flex flex-1 flex-col overflow-hidden relative min-w-0"
      style={{ background: "var(--studio-bg)" }}
    >
      {/* ── Canvas viewport ── */}
      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-6 relative composition-viewport"
      >
        {/* Subtle violet halo behind the canvas */}
        <div className="canvas-gpu-halo" />

        <div
          className="composition-stage flex items-center justify-center relative z-10"
          style={{
            width: (config.canvasWidth || 800) * (effectiveZoom / 100),
            height: (config.canvasHeight || 200) * (effectiveZoom / 100),
            flexShrink: 0,
          }}
        >
          <div
            id="preview-canvas-card"
            className={`relative shrink-0 overflow-hidden ${
              bgMode === "checkerboard" ? "checkerboard" : ""
            }`}
            style={{
              width: config.canvasWidth,
              height: config.canvasHeight,
              transform: `scale(${effectiveZoom / 100})`,
              transformOrigin: "center center",
              background: bgMode === "black" ? "#000" : undefined,
              borderRadius: 6,
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none composition-safe-area"
              aria-hidden
            />
            <canvas
              ref={canvasRef}
              id="clypra-preview-canvas"
              width={renderW}
              height={renderH}
              className="block w-full h-full select-none"
              style={{
                imageRendering: effectiveZoom > 100 ? "crisp-edges" : undefined,
              }}
            />
          </div>
        </div>

        {/* Brand badge — bottom-left */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md pointer-events-none"
          style={{
            background: "rgba(14,14,22,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--studio-border)",
          }}
        >
          <img src="/clypra.svg" alt="" className="w-3.5 h-3.5 opacity-70" />
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{ color: "var(--studio-text)" }}
          >
            Clypra <span style={{ color: "var(--studio-accent)" }}>Studio</span>
          </span>
        </div>
      </div>
    </section>
  );
}
