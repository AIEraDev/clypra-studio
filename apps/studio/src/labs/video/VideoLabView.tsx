/**
 * Video Effect Lab
 *
 * Foundation for validating that effects render correctly.
 * Tests the shared runtime infrastructure with single-input video effects.
 *
 * Phase 3 Week 5: Video Lab UI
 */

import React, { useState, lazy, Suspense } from "react";
import { GraphInspector, PassInspector, ResourceInspector, PerformanceMonitor, Timeline, PresetManager, ValidationPanel, type Preset, type ValidationIssue } from "@clypra-studio/ui";

// Lazy load heavy components
const ResponsivePreviewCanvas = lazy(() => import("@clypra-studio/ui").then((m) => ({ default: m.ResponsivePreviewCanvas })));
// Import all video effects from the engine - they're exported from videoEffects module
const videoEffectsPromise = import("@clypra-studio/engine/videoEffects").then((m) => Object.values(m).filter((v: any) => v?.id));

export function VideoLabView() {
  console.log("[VideoLabView] Component rendering...");

  const [videoEffects, setVideoEffects] = useState<any[]>([]);

  // Load effects asynchronously
  React.useEffect(() => {
    console.log("[VideoLabView] Loading effects...");
    videoEffectsPromise.then((effects) => {
      console.log("[VideoLabView] Effects loaded:", effects.length);
      setVideoEffects(effects);
    });
  }, []);
  // State management
  const [selectedEffect, setSelectedEffect] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10); // 10 seconds default
  const [playing, setPlaying] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeDevTab, setActiveDevTab] = useState<"graph" | "passes" | "resources" | "performance">("graph");

  // Mock data for development
  const mockEffect = {
    id: "film-grain",
    name: "Film Grain",
    version: "1.0.0",
  };

  const mockValidationIssues: ValidationIssue[] = [];

  const mockPresets: Preset[] = [
    {
      id: "preset-1",
      name: "Subtle Grain",
      description: "Light film grain for clean footage",
      effectId: "film-grain",
      parameters: { intensity: 0.3, size: 1.0 },
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["subtle", "clean"],
    },
  ];

  const handleVideoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[VideoLabView] File input changed");
    const file = e.target.files?.[0];
    console.log("[VideoLabView] Selected file:", file?.name, file?.size, "bytes");

    if (file) {
      setVideoFile(file);
      console.log("[VideoLabView] Video file state updated");

      // Extract video metadata and set duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        console.log("[VideoLabView] Video metadata loaded - duration:", video.duration);
        setDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleLoadPreset = (preset: Preset) => {
    setParameters(preset.parameters);
  };

  const handleSavePreset = (preset: Preset) => {
    console.log("Saving preset:", preset);
    // TODO: Persist to storage
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#020617",
          color: "#f1f5f9",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: "320px",
            background: "#0f172a",
            borderRight: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Lab Header */}
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #1e293b",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🎬 Video Effect Lab
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>Test and develop single-input video effects</p>
          </div>

          {/* Controls */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Video Importer */}
            <div
              style={{
                padding: "16px",
                background: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Video Input
              </h3>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoImport}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#0f172a",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              />
              {videoFile && <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>✓ {videoFile.name}</div>}
            </div>

            {/* Effect Selector */}
            <div
              style={{
                padding: "16px",
                background: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Effect Library
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {videoEffects.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        border: "2px solid #334155",
                        borderTop: "2px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 12px",
                      }}
                    />
                    Loading effects...
                  </div>
                ) : (
                  videoEffects.map((effect) => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        setSelectedEffect(effect);
                        setParameters(
                          Object.entries(effect.schema.parameters).reduce(
                            (acc, [key, param]) => ({
                              ...acc,
                              [key]: (param as any).default,
                            }),
                            {},
                          ),
                        );
                      }}
                      style={{
                        padding: "12px",
                        background: selectedEffect?.id === effect.id ? "#1e40af" : "#0f172a",
                        border: selectedEffect?.id === effect.id ? "2px solid #3b82f6" : "1px solid #475569",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#f1f5f9",
                          marginBottom: "4px",
                          fontSize: "13px",
                        }}
                      >
                        {effect.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>{effect.description}</div>
                      <div
                        style={{
                          marginTop: "6px",
                          display: "flex",
                          gap: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        {effect.metadata.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              background: "#334155",
                              color: "#94a3b8",
                              borderRadius: "3px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Parameter Editor */}
            <div
              style={{
                padding: "16px",
                background: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Parameters
              </h3>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {!selectedEffect ? (
                  "Select an effect to edit parameters"
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {Object.entries(selectedEffect.schema.parameters).map(([key, param]: [string, any]) => (
                      <div key={key}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#cbd5e1",
                            marginBottom: "6px",
                          }}
                        >
                          {param.label}
                        </label>
                        {param.type === "number" && (
                          <>
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={parameters[key] ?? param.default}
                              onChange={(e) =>
                                setParameters({
                                  ...parameters,
                                  [key]: parseFloat(e.target.value),
                                })
                              }
                              style={{
                                width: "100%",
                                marginBottom: "4px",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>{(parameters[key] ?? param.default).toFixed(param.step < 0.01 ? 3 : 2)}</span>
                              <span>{param.description}</span>
                            </div>
                          </>
                        )}
                        {param.type === "boolean" && (
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={parameters[key] ?? param.default}
                              onChange={(e) =>
                                setParameters({
                                  ...parameters,
                                  [key]: e.target.checked,
                                })
                              }
                            />
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{param.description}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preset Manager */}
            <PresetManager
              effect={
                selectedEffect
                  ? {
                      id: selectedEffect.id,
                      name: selectedEffect.name,
                      version: selectedEffect.version,
                    }
                  : mockEffect
              }
              parameters={parameters}
              presets={selectedEffect?.presets || mockPresets}
              onLoadPreset={handleLoadPreset}
              onSavePreset={handleSavePreset}
            />
          </div>
        </div>

        {/* Main Panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Preview Area */}
          <div
            style={{
              flex: 1,
              padding: "24px",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Suspense
              fallback={
                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1a1a1a",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        border: "3px solid #334155",
                        borderTop: "3px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 16px",
                      }}
                    />
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading Preview Canvas...</p>
                  </div>
                </div>
              }
            >
              <ResponsivePreviewCanvas effect={selectedEffect ? { ...selectedEffect, parameters } : null} inputs={{ video: videoFile }} currentTime={currentTime} playing={playing} onPlayingChange={setPlaying} onTimeChange={setCurrentTime} renderWidth={1920} renderHeight={1080} responsive={true} fit="contain" />
            </Suspense>

            <Timeline duration={duration} currentTime={currentTime} onSeek={setCurrentTime} frameRate={60} />

            <ValidationPanel issues={mockValidationIssues} />
          </div>
        </div>

        {/* Developer Panel */}
        <div
          style={{
            width: "400px",
            background: "#0f172a",
            borderLeft: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tab Bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1e293b",
              background: "#1e293b",
            }}
          >
            {(["graph", "passes", "resources", "performance"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDevTab(tab)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: activeDevTab === tab ? "#0f172a" : "transparent",
                  color: activeDevTab === tab ? "#f1f5f9" : "#64748b",
                  border: "none",
                  borderBottom: activeDevTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {activeDevTab === "graph" && (
              <GraphInspector
                graph={{
                  id: "video-lab-graph",
                  nodes: [],
                  edges: [],
                }}
              />
            )}

            {activeDevTab === "passes" && (
              <PassInspector
                frameGraph={{
                  frameNumber: 0,
                  timelineTimeMs: 0,
                  nodes: [],
                  edges: [],
                  passes: [],
                  resourceRequests: [],
                }}
              />
            )}

            {activeDevTab === "resources" && (
              <ResourceInspector
                frameGraph={{
                  frameNumber: 0,
                  timelineTimeMs: 0,
                  nodes: [],
                  edges: [],
                  passes: [],
                  resourceRequests: [],
                }}
                memoryUsage={0}
              />
            )}

            {activeDevTab === "performance" && (
              <PerformanceMonitor
                metrics={{
                  gpuTime: 0,
                  cpuTime: 0,
                  fps: 60,
                  passCount: 0,
                  memoryUsage: 0,
                  passTimes: [],
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
