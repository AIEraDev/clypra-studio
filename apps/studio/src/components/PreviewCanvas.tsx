import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Cpu } from "lucide-react";
import type { TextEffectConfig } from "@clypra-studio/engine";
import { computeFitZoom } from "@clypra-studio/engine";

type ZoomMode = "fit" | "manual";
type GpuState = "idle" | "rendering" | "ready" | "error";

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: TextEffectConfig;
  bgMode: "checkerboard" | "black";
  zoom: number;
  zoomMode: ZoomMode;
  gpuState?: GpuState;
  gpuError?: string | null;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: ZoomMode) => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  toolbarExtras?: React.ReactNode;
}

function Divider() {
  return <div className="w-px h-4 bg-(--studio-border) mx-1 shrink-0" />;
}

export function PreviewCanvas({
  canvasRef,
  config,
  bgMode,
  zoom,
  zoomMode,
  gpuState = "idle",
  gpuError,
  onZoomChange,
  onZoomModeChange,
  onBgModeChange,
  toolbarExtras,
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

  const gpuPillClass =
    gpuState === "ready"
      ? "studio-gpu-pill ready"
      : gpuState === "rendering"
      ? "studio-gpu-pill live"
      : gpuState === "error"
      ? "studio-gpu-pill error"
      : "studio-gpu-pill live";

  const gpuLabel =
    gpuState === "ready"
      ? "GPU · Ready"
      : gpuState === "rendering"
      ? "GPU · Rendering"
      : gpuState === "error"
      ? "GPU · Error"
      : "Native Lab";

  return (
    <section
      id="center-preview-viewport"
      className="flex flex-1 flex-col overflow-hidden relative min-w-0"
      style={{ background: "var(--studio-bg)" }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-1 px-3 shrink-0 border-b"
        style={{
          height: 40,
          background: "var(--studio-shell)",
          borderColor: "var(--studio-border)",
          scrollbarWidth: "none",
          overflowX: "auto",
        }}
      >
        {/* Composition info */}
        <div className="flex items-center gap-2 shrink-0 mr-1">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  gpuState === "ready"
                    ? "var(--gpu-ready)"
                    : gpuState === "error"
                    ? "var(--gpu-error)"
                    : "var(--gpu-live)",
                boxShadow:
                  gpuState === "ready"
                    ? "0 0 5px var(--gpu-ready)"
                    : gpuState === "error"
                    ? "0 0 5px var(--gpu-error)"
                    : "0 0 5px var(--gpu-live)",
              }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--studio-text)" }}
            >
              Composition
            </span>
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              color: "var(--studio-muted)",
              background: "var(--studio-control)",
            }}
          >
            {config.canvasWidth}×{config.canvasHeight}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--studio-accent)", opacity: 0.7 }}
          >
            {effectiveZoom}%{zoomMode === "fit" ? " fit" : ""}
          </span>
        </div>

        <Divider />

        {/* Fit / Manual */}
        <div
          className="flex items-center rounded p-0.5 shrink-0"
          style={{
            background: "var(--studio-control)",
            border: "1px solid var(--studio-border)",
          }}
        >
          <button
            type="button"
            onClick={() => onZoomModeChange("fit")}
            className={`canvas-toolbar-btn${
              zoomMode === "fit" ? " active" : ""
            }`}
            style={{ gap: 4 }}
            title="Fit to viewport"
          >
            <Maximize2 size={10} />
            Fit
          </button>
          <button
            type="button"
            onClick={() => onZoomModeChange("manual")}
            className={`canvas-toolbar-btn${
              zoomMode === "manual" ? " active" : ""
            }`}
          >
            Manual
          </button>
        </div>

        {/* Zoom controls */}
        <button
          type="button"
          onClick={() => {
            onZoomModeChange("manual");
            onZoomChange(Math.max(25, effectiveZoom - 25));
          }}
          className="canvas-toolbar-btn"
          style={{ width: 26, padding: 0 }}
          title="Zoom out"
        >
          <ZoomOut size={12} />
        </button>
        <span
          className="text-[10px] font-mono text-center shrink-0"
          style={{ width: 32, color: "var(--studio-muted)" }}
        >
          {effectiveZoom}%
        </span>
        <button
          type="button"
          onClick={() => {
            onZoomModeChange("manual");
            onZoomChange(Math.min(400, effectiveZoom + 25));
          }}
          className="canvas-toolbar-btn"
          style={{ width: 26, padding: 0 }}
          title="Zoom in"
        >
          <ZoomIn size={12} />
        </button>

        <Divider />

        {/* Alpha / Black */}
        <div
          className="flex items-center rounded p-0.5 shrink-0"
          style={{
            background: "var(--studio-control)",
            border: "1px solid var(--studio-border)",
          }}
        >
          <button
            type="button"
            onClick={() => onBgModeChange("checkerboard")}
            className={`canvas-toolbar-btn${
              bgMode === "checkerboard" ? " active" : ""
            }`}
            title="Transparent checkerboard"
          >
            Alpha
          </button>
          <button
            type="button"
            onClick={() => onBgModeChange("black")}
            className={`canvas-toolbar-btn${
              bgMode === "black" ? " active" : ""
            }`}
          >
            Black
          </button>
        </div>

        <Divider />

        {/* GPU status pill */}
        <span
          className={gpuPillClass}
          title={gpuError ?? "Rendering via local Clypra native daemon"}
        >
          <span className="studio-gpu-pill-dot" />
          <Cpu size={9} style={{ flexShrink: 0 }} />
          {gpuLabel}
        </span>

        {gpuError && (
          <span
            className="max-w-[160px] truncate text-[10px] font-mono"
            style={{ color: "var(--gpu-error)" }}
            title={gpuError}
          >
            {gpuError}
          </span>
        )}

        <Divider />

        {/* Export actions */}
        <div className="flex items-center gap-1 shrink-0">{toolbarExtras}</div>
      </div>

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
              width={config.canvasWidth}
              height={config.canvasHeight}
              className="block w-full h-full select-none"
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
