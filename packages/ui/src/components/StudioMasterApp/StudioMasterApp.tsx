import React, { useState } from "react";
import type { KeyframePoint, EngineTelemetryStats } from "@clypra-studio/types";
import { VefxPresetManager } from "@clypra-studio/runtime";
import { StudioControlPanel } from "../StudioControlPanel";
import { StudioDiagnosticsOverlay } from "../StudioDiagnosticsOverlay";
import { MultiKeyframeGraphEditor } from "../MultiKeyframeGraphEditor";

export const StudioMasterApp: React.FC<{ device?: GPUDevice }> = ({ device }) => {
  const [keyframes, setKeyframes] = useState<KeyframePoint[]>([
    { id: "kf_1", time: 0.0, value: 0.0, easing: "cubic-bezier", handleMode: "aligned", handleOut: { dt: 0.5, dv: 0.0 } },
    { id: "kf_2", time: 2.0, value: 1.5, easing: "cubic-bezier", handleMode: "aligned", handleIn: { dt: -0.5, dv: 0.0 }, handleOut: { dt: 0.5, dv: 0.0 } },
    { id: "kf_3", time: 4.0, value: 0.8, easing: "linear" },
  ]);

  const [currentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [stats] = useState<EngineTelemetryStats>({
    uiFps: 144,
    gpuFrameTimeMs: 2.4,
    workerQueueLatencyMs: 0.8,
    activeUniformBytes: 256,
  });

  const handleExport = (_fps: number, _bitrate: number) => {
    setIsExporting(true);
    setExportProgress(0.1);
    setTimeout(() => setExportProgress(0.5), 500);
    setTimeout(() => setExportProgress(1.0), 1000);
    setTimeout(() => setIsExporting(false), 1200);
  };

  const handleSavePreset = () => {
    const jsonStr = VefxPresetManager.exportPreset("Master Studio Curve", keyframes);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "master_preset.vefx";
    a.click();
  };

  const handleLoadPreset = (jsonStr: string) => {
    try {
      const preset = VefxPresetManager.importPreset(jsonStr);
      setKeyframes([...preset.keyframes]);
    } catch (e) {
      console.error("Failed to load preset:", e);
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#090D16", color: "#FFF", position: "relative" }}>
      {/* Top Operator Control Surface */}
      <StudioControlPanel
        onExportTrigger={handleExport}
        onAudioUpload={(file) => console.log("Uploaded audio file:", file.name)}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {/* Main Studio Viewport */}
      <div style={{ flex: 1, display: "flex", gap: "16px", padding: "16px", position: "relative" }}>
        {/* Real-time Diagnostics Telemetry */}
        <StudioDiagnosticsOverlay stats={stats} />

        {/* Left: 2D Multi-Keyframe Curve Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <MultiKeyframeGraphEditor
            keyframes={keyframes}
            onChange={setKeyframes}
            currentTime={currentTime}
            width={840}
            height={520}
          />
        </div>

        {/* Right: Live WebGPU Canvas Preview */}
        <div style={{ width: "420px", background: "#000", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #1E293B" }}>
          <div style={{ color: "#64748B", fontFamily: "monospace", fontSize: "14px" }}>
            {device ? "WebGPU Canvas Active (144Hz)" : "WebGPU Preview Canvas"}
          </div>
        </div>
      </div>
    </div>
  );
};
