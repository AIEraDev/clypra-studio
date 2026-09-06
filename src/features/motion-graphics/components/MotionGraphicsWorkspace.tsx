import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Cpu,
  Monitor,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ClypraLogo } from "../../../components/ClypraLogo";
import type { MotionGraphicTemplate, MotionLayer } from "../types";
import { CLOUD_PUFFY_TEMPLATE, VIRAL_COMIC_TEMPLATE } from "../presets/motionPresets";
import { MotionViewport } from "./MotionViewport";
import { MotionTimeline } from "./MotionTimeline";
import { MotionInspector } from "./MotionInspector";
import { MotionPresetBrowser } from "./MotionPresetBrowser";
import { getNativeRenderClient } from "../../../services/nativeRenderClient";

export function MotionGraphicsWorkspace() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<MotionGraphicTemplate>(CLOUD_PUFFY_TEMPLATE);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(0.55);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("cloud-text-primary");
  const [gpuStatus, setGpuStatus] = useState<"idle" | "probing" | "ready" | "error">("idle");

  const lastFrameTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  const totalDuration =
    template.phaseTiming.introDuration +
    template.phaseTiming.holdDuration +
    template.phaseTiming.outroDuration;

  // Animation Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    lastFrameTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      setCurrentTime((prev) => {
        let next = prev + deltaSec * playbackSpeed;
        if (next >= totalDuration) {
          if (isLooping) {
            next = 0;
          } else {
            setIsPlaying(false);
            return totalDuration;
          }
        }
        return next;
      });

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, isLooping, playbackSpeed, totalDuration]);

  // Spacebar Play/Pause listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleUpdateTemplate = (updater: (prev: MotionGraphicTemplate) => MotionGraphicTemplate) => {
    setTemplate(updater);
  };

  const handleUpdateLayer = (layerId: string, updater: (layer: MotionLayer) => MotionLayer) => {
    setTemplate((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? updater(l) : l)),
    }));
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setTemplate((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l,
      ),
    }));
  };

  const handleTestNativeGpu = async () => {
    setGpuStatus("probing");
    toast.info("Testing connection to native WASM / wgpu compositor...");
    try {
      const client = getNativeRenderClient();
      const handshake = await client.handshake();
      setGpuStatus("ready");
      toast.success(
        `Native GPU Compositor Connected (WASM v${handshake.contractVersion})`,
      );
    } catch (err) {
      setGpuStatus("error");
      toast.error(`WASM GPU probe failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleExportFrame = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      toast.error("No canvas found to export");
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}-frame-${currentTime.toFixed(2)}s.png`;
    a.click();
    toast.success("Current motion frame downloaded as PNG");
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c1c28] bg-[#0d0d14] z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/studio"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Back to Studio Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <ClypraLogo className="h-5 w-auto" />

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Motion Graphics Studio
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
              Admin Lab
            </span>
          </div>
        </div>

        {/* Center Template Title */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#141420] border border-white/5 text-xs text-gray-300">
          <Sparkles className="w-3.5 h-3.5 text-[#7c6fff]" />
          <span className="font-semibold text-white">{template.name}</span>
          <span className="text-gray-500">|</span>
          <span className="font-mono text-gray-400">{template.category}</span>
        </div>

        {/* Right Actions: Native GPU Probe & Export */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestNativeGpu}
            title="Probe native WASM / wgpu pipeline"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              gpuStatus === "ready"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : gpuStatus === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-[#2a2a3a] bg-[#141420] text-gray-300 hover:bg-[#1a1a2a]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {gpuStatus === "probing"
                ? "Probing GPU..."
                : gpuStatus === "ready"
                ? "wgpu Ready"
                : "Test Native GPU"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportFrame}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7c6fff] hover:bg-[#6b5eee] text-white text-xs font-semibold shadow-md shadow-[#7c6fff]/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Frame</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Presets Browser */}
        <MotionPresetBrowser
          activeTemplateId={template.id}
          onSelectTemplate={(newTemplate) => {
            setTemplate(newTemplate);
            setCurrentTime(0);
            setIsPlaying(false);
          }}
        />

        {/* Center: Live Viewport */}
        <MotionViewport
          template={template}
          currentTime={currentTime}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Right: Inspector */}
        <MotionInspector
          template={template}
          selectedLayerId={selectedLayerId}
          onUpdateTemplate={handleUpdateTemplate}
          onUpdateLayer={handleUpdateLayer}
        />
      </div>

      {/* Bottom: Timeline with Phase Markers */}
      <MotionTimeline
        template={template}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isLooping={isLooping}
        playbackSpeed={playbackSpeed}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onToggleLayerVisibility={handleToggleLayerVisibility}
        onTimeChange={setCurrentTime}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onToggleLoop={() => setIsLooping((l) => !l)}
        onSpeedChange={setPlaybackSpeed}
      />
    </div>
  );
}
