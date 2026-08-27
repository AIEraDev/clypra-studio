import { useEffect } from "react";
import { Download, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import type { TextEffectConfig } from "@clypra-studio/engine";

export type CompositionZoomMode = "fit" | "manual";
export type CompositionGpuState = "idle" | "rendering" | "ready" | "error";

interface CompositionToolbarProps {
  config: TextEffectConfig;
  effectiveZoom: number;
  zoomMode: CompositionZoomMode;
  bgMode: "checkerboard" | "black";
  gpuState?: CompositionGpuState;
  gpuError?: string | null;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: CompositionZoomMode) => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  onExport: () => void;
}

function Divider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-(--studio-border)" />;
}

export function CompositionToolbar({
  config,
  effectiveZoom,
  zoomMode,
  bgMode,
  gpuState = "idle",
  gpuError,
  onZoomChange,
  onZoomModeChange,
  onBgModeChange,
  onExport,
}: CompositionToolbarProps) {
  useEffect(() => {
    if (!gpuError) return;
    toast.error("GPU error", {
      description: gpuError,
      id: "gpu-error",
      duration: 6000,
    });
  }, [gpuError]);

  return (
    <div className="studio-composition-toolbar">
      <div className="flex shrink-0 items-center gap-2 mr-1">
        <span className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
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
          <span className="text-[11px] font-semibold text-(--studio-text)">
            Composition
          </span>
        </span>
        <span className="rounded bg-(--studio-control) px-1.5 py-0.5 font-mono text-[10px] text-(--studio-muted)">
          {config.canvasWidth}×{config.canvasHeight}
        </span>
        <span className="font-mono text-[10px] text-(--studio-accent) opacity-70">
          {effectiveZoom}%{zoomMode === "fit" ? " fit" : ""}
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <div className="flex shrink-0 items-center rounded border border-(--studio-border) bg-(--studio-control) p-0.5">
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
        <span className="w-8 shrink-0 text-center font-mono text-[10px] text-(--studio-muted)">
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

        <div className="flex shrink-0 items-center rounded border border-(--studio-border) bg-(--studio-control) p-0.5">
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

        <button
          id="open-export-modal-btn"
          type="button"
          onClick={onExport}
          className="canvas-toolbar-btn primary px-3"
        >
          <Download size={11} className="mr-1" /> Export
        </button>
      </div>
    </div>
  );
}
