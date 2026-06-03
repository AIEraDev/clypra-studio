import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Monitor } from "lucide-react";
import type { TextEffectConfig } from "@clypra/engine";
import { computeFitZoom } from "@clypra/engine";

type ZoomMode = "fit" | "manual";
type PlatformMode = "standard" | "mac-tauri" | "windows-tauri";

const PLATFORM_LABELS: Record<PlatformMode, string> = {
  standard: "Standard",
  "mac-tauri": "Mac WK",
  "windows-tauri": "Win WV2",
};

interface PreviewCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: TextEffectConfig;
  bgMode: "checkerboard" | "black";
  zoom: number;
  zoomMode: ZoomMode;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: ZoomMode) => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  platformMode: PlatformMode;
  onPlatformModeChange: (mode: PlatformMode) => void;
  toolbarExtras?: React.ReactNode;
}

export function PreviewCanvas({ canvasRef, config, bgMode, zoom, zoomMode, onZoomChange, onZoomModeChange, onBgModeChange, platformMode, onPlatformModeChange, toolbarExtras }: PreviewCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(100);
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  const updateFitZoom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setFitZoom(computeFitZoom(el.clientWidth, el.clientHeight, config.canvasWidth || 800, config.canvasHeight || 200));
  }, [config.canvasWidth, config.canvasHeight]);

  useEffect(() => {
    updateFitZoom();
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateFitZoom());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateFitZoom]);

  // Close platform menu on outside click
  useEffect(() => {
    if (!showPlatformMenu) return;
    const close = () => setShowPlatformMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showPlatformMenu]);

  const effectiveZoom = zoomMode === "fit" ? fitZoom : zoom;

  return (
    <section id="center-preview-viewport" className="flex flex-1 flex-col bg-[#09090D] overflow-hidden relative border-r border-[#2A2A38] min-w-0">
      {/* ── Single-row toolbar ── */}
      <div className="flex items-center border-b border-[#2A2A38] bg-[#15151C] px-3 h-10 shrink-0 gap-0.5">
        {/* Left: composition info */}
        <div className="flex items-center gap-2 mr-3 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C6FFF] animate-pulse" />
            Composition
          </span>
          <span className="text-[10px] font-mono text-[#555566] bg-[#1C1C24] px-1.5 py-0.5 rounded">
            {config.canvasWidth}×{config.canvasHeight}
          </span>
          <span className="text-[10px] font-mono text-[#7C6FFF]/70">
            {effectiveZoom}%{zoomMode === "fit" ? " fit" : ""}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2A2A38] mx-1.5 shrink-0" />

        {/* Fit / Manual toggle */}
        <div className="flex items-center bg-[#0E0E12] border border-[#232330] rounded p-0.5 shrink-0">
          <button type="button" onClick={() => onZoomModeChange("fit")} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${zoomMode === "fit" ? "bg-[#7C6FFF] text-white" : "text-[#666680] hover:text-white"}`} title="Fit to viewport">
            <Maximize2 size={11} /> Fit
          </button>
          <button type="button" onClick={() => onZoomModeChange("manual")} className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${zoomMode === "manual" ? "bg-[#7C6FFF] text-white" : "text-[#666680] hover:text-white"}`}>
            Manual
          </button>
        </div>

        {/* Zoom - / % / + */}
        <button
          type="button"
          onClick={() => {
            onZoomModeChange("manual");
            onZoomChange(Math.max(25, effectiveZoom - 25));
          }}
          className="p-1 text-[#555566] hover:text-white cursor-pointer transition-colors shrink-0"
          title="Zoom out"
        >
          <ZoomOut size={13} />
        </button>
        <span className="text-[10px] font-mono text-[#555566] w-8 text-center shrink-0">{effectiveZoom}%</span>
        <button
          type="button"
          onClick={() => {
            onZoomModeChange("manual");
            onZoomChange(Math.min(200, effectiveZoom + 25));
          }}
          className="p-1 text-[#555566] hover:text-white cursor-pointer transition-colors shrink-0"
          title="Zoom in"
        >
          <ZoomIn size={13} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2A2A38] mx-1.5 shrink-0" />

        {/* Alpha / Black */}
        <div className="flex items-center bg-[#0E0E12] border border-[#232330] rounded p-0.5 shrink-0">
          <button type="button" onClick={() => onBgModeChange("checkerboard")} className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${bgMode === "checkerboard" ? "bg-[#1E1E2E] text-[#7C6FFF]" : "text-[#666680] hover:text-white"}`} title="Transparent checkerboard">
            Alpha
          </button>
          <button type="button" onClick={() => onBgModeChange("black")} className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${bgMode === "black" ? "bg-[#1E1E2E] text-[#7C6FFF]" : "text-[#666680] hover:text-white"}`}>
            Black
          </button>
        </div>

        {/* Platform picker — compact icon + dropdown */}
        <div className="relative shrink-0 ml-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlatformMenu((v) => !v);
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-all ${platformMode !== "standard" ? "border-[#7C6FFF]/40 bg-[#7C6FFF]/10 text-[#9B8FFF]" : "border-[#232330] bg-[#0E0E12] text-[#666680] hover:text-white"}`}
            title="Target platform rendering mode"
          >
            <Monitor size={11} />
            {PLATFORM_LABELS[platformMode]}
          </button>

          {showPlatformMenu && (
            <div className="absolute top-full left-0 mt-1 bg-[#18181F] border border-[#2A2A38] rounded-lg shadow-2xl z-50 py-1 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
              {(["standard", "mac-tauri", "windows-tauri"] as PlatformMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onPlatformModeChange(mode);
                    setShowPlatformMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] cursor-pointer transition-colors flex items-center justify-between ${platformMode === mode ? "text-[#7C6FFF] bg-[#7C6FFF]/10" : "text-[#888899] hover:text-white hover:bg-[#22222E]"}`}
                >
                  <span>{mode === "standard" ? "Standard Browser" : mode === "mac-tauri" ? "Mac WKWebView" : "Win WebView2"}</span>
                  {platformMode === mode && <span className="text-[#7C6FFF] text-[9px]">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2A2A38] mx-1.5 shrink-0" />

        {/* Toolbar extras (Copy, PNG, Seq, WebM) */}
        <div className="flex items-center gap-1 shrink-0">{toolbarExtras}</div>
      </div>

      {/* ── Canvas viewport ── */}
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

        {/* Brand badge */}
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
