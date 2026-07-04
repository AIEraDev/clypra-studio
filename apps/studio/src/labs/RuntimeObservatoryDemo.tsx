/**
 * Runtime Observatory Demo
 *
 * Demonstrates the complete V2 pipeline with snapshot-based observability:
 * Project → Compiler → Planner → RenderJob → Executor → Renderer → Snapshot → Observatory
 */

import { useState } from "react";
import { ResponsivePreviewCanvas } from "@clypra-studio/ui";

const DEMO_EFFECTS = [
  { id: "identity", name: "Identity (Copy)", type: "copy", parameters: {} },
  { id: "brightness", name: "Brightness", type: "brightness", parameters: { brightness: 1.5 } },
  { id: "contrast", name: "Contrast", type: "contrast", parameters: { contrast: 1.3 } },
  { id: "saturation", name: "Saturation", type: "saturation", parameters: { saturation: 1.5 } },
  { id: "blur", name: "Blur", type: "blur", parameters: { radius: 10 } },
  { id: "bloom", name: "Bloom", type: "bloom", parameters: { threshold: 0.8, intensity: 1.5 } },
];

export function RuntimeObservatoryDemo() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedEffect, setSelectedEffect] = useState(DEMO_EFFECTS[0]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showObservatory, setShowObservatory] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setCurrentTime(0);
      setPlaying(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#020617",
        color: "#f1f5f9",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "16px 24px",
          background: "#0f1419",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#f1f5f9", marginBottom: "4px" }}>Runtime Observatory Demo</h1>
        <p style={{ color: "#64748b", fontSize: "13px" }}>V2 Pipeline: Project → Compiler → Planner → RenderJob → Executor → Renderer → Snapshot</p>
      </div>

      {/* 3-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 380px",
          gap: 0,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar - Controls */}
        <aside
          style={{
            background: "#0a0f1a",
            borderRight: "1px solid #1e293b",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Video Upload Section */}
          <div style={{ padding: "20px", borderBottom: "1px solid #1e293b" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1", marginBottom: "12px" }}>Video Source</h3>
            <label
              htmlFor="video-upload"
              style={{
                display: "block",
                padding: "40px 16px",
                background: "#1e293b",
                border: "2px dashed #334155",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#475569";
                e.currentTarget.style.background = "#334155";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.background = "#1e293b";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📹</div>
              <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>{videoFile ? "Change Video" : "Upload Video"}</div>
              <input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {videoFile && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#1e293b",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#64748b",
                  wordBreak: "break-word",
                }}
              >
                ✓ {videoFile.name}
              </div>
            )}
          </div>

          {/* Effect Selection */}
          <div style={{ padding: "20px", borderBottom: "1px solid #1e293b" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1", marginBottom: "12px" }}>Effect Capability</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {DEMO_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => setSelectedEffect(effect)}
                  style={{
                    padding: "10px 12px",
                    background: selectedEffect.id === effect.id ? "#3b82f6" : "#1e293b",
                    color: selectedEffect.id === effect.id ? "#ffffff" : "#94a3b8",
                    border: "1px solid",
                    borderColor: selectedEffect.id === effect.id ? "#3b82f6" : "#334155",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEffect.id !== effect.id) {
                      e.currentTarget.style.background = "#334155";
                      e.currentTarget.style.color = "#e2e8f0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEffect.id !== effect.id) {
                      e.currentTarget.style.background = "#1e293b";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  {effect.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Info */}
          <div style={{ padding: "20px", flex: 1 }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1", marginBottom: "12px" }}>Pipeline Stages</h3>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.8" }}>
              <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontWeight: 500 }}>1. Compiler</div>
                <div>Effect → MediaProcessingGraph</div>
              </div>
              <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontWeight: 500 }}>2. Planner</div>
                <div>Graph → FrameGraph</div>
              </div>
              <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontWeight: 500 }}>3. Job Builder</div>
                <div>FrameGraph → RenderJob</div>
              </div>
              <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontWeight: 500 }}>4. Executor</div>
                <div>Schedule + Resources</div>
              </div>
              <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontWeight: 500 }}>5. Renderer</div>
                <div>Draw passes to GPU</div>
              </div>
              <div style={{ paddingLeft: "8px", borderLeft: "2px solid #3b82f6" }}>
                <div style={{ color: "#3b82f6", fontWeight: 500 }}>6. Snapshot</div>
                <div>Capture runtime state</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Canvas */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#0f1419",
            overflow: "hidden",
            minWidth: 0, // Critical for flex child
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            {videoFile ? (
              <ResponsivePreviewCanvas effect={selectedEffect} inputs={{ video: videoFile }} currentTime={currentTime} renderWidth={1920} renderHeight={1080} playing={playing} onPlayingChange={setPlaying} onTimeChange={setCurrentTime} />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                }}
              >
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                  <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>🎬</div>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px" }}>No Video Loaded</h2>
                  <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6" }}>Upload a video file from the left sidebar to start testing the V2 rendering pipeline with real-time observability.</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Observatory */}
        <aside
          style={{
            background: "#0a0f1a",
            borderLeft: "1px solid #1e293b",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#cbd5e1" }}>Runtime Observatory</h3>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input type="checkbox" checked={showObservatory} onChange={(e) => setShowObservatory(e.target.checked)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Show</span>
              </label>
            </div>
          </div>

          {showObservatory && videoFile ? (
            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ padding: "16px", fontSize: "13px", color: "#64748b" }}>
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>Observatory Features</h4>
                  <ul style={{ lineHeight: "1.8", paddingLeft: "16px" }}>
                    <li>Pass dependency graph</li>
                    <li>Execution timeline</li>
                    <li>Resource lifetime tracking</li>
                    <li>Performance metrics</li>
                    <li>Backend information</li>
                    <li>Frame history (60 frames)</li>
                  </ul>
                </div>
                <div
                  style={{
                    padding: "12px",
                    background: "#1e293b",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  <strong style={{ color: "#94a3b8" }}>Note:</strong> Snapshot visualization coming soon. The observatory will display real-time pipeline metrics, pass execution order, resource allocation, and performance data.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <div style={{ textAlign: "center", maxWidth: "280px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.2 }}>📊</div>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>{!videoFile ? "Load a video to see observatory data" : "Enable observatory to view runtime metrics"}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
