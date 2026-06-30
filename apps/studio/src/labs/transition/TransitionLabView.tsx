/**
 * Transition Lab
 *
 * Specialized editor for dual-input temporal effects.
 * Tests transition rendering with progress control.
 *
 * Phase 4 Week 7: Transition Lab UI
 */

import React, { useState } from "react";
import { GraphInspector, PassInspector, ResourceInspector, PerformanceMonitor, PreviewCanvas, Timeline, PresetManager, ValidationPanel, type Preset, type ValidationIssue } from "@clypra/ui";
import { transitionEffects } from "@clypra/engine/effects/transitions";

export function TransitionLabView() {
  // State management
  const [selectedTransition, setSelectedTransition] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0.5); // 0.0 = Clip A, 1.0 = Clip B
  const [duration, setDuration] = useState(2.0); // Transition duration in seconds
  const [easing, setEasing] = useState("linear");
  const [clipAFile, setClipAFile] = useState<File | null>(null);
  const [clipBFile, setClipBFile] = useState<File | null>(null);
  const [activeDevTab, setActiveDevTab] = useState<"graph" | "passes" | "resources" | "performance">("graph");

  // Mock data
  const mockEffect = {
    id: "cross-dissolve",
    name: "Cross Dissolve",
    version: "1.0.0",
  };

  const mockValidationIssues: ValidationIssue[] = [];

  const mockPresets: Preset[] = [];

  const handleClipAImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setClipAFile(file);
  };

  const handleClipBImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setClipBFile(file);
  };

  const handleLoadPreset = (preset: Preset) => {
    setParameters(preset.parameters);
  };

  const handleSavePreset = (preset: Preset) => {
    console.log("Saving preset:", preset);
  };

  return (
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
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🔄 Transition Lab
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>Test and develop dual-input transitions</p>
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
          {/* Clip A Selector */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Clip A (Outgoing)</h3>
            <input
              type="file"
              accept="video/*"
              onChange={handleClipAImport}
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
            {clipAFile && <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>✓ {clipAFile.name}</div>}
          </div>

          {/* Clip B Selector */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Clip B (Incoming)</h3>
            <input
              type="file"
              accept="video/*"
              onChange={handleClipBImport}
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
            {clipBFile && <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>✓ {clipBFile.name}</div>}
          </div>

          {/* Transition Selector */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Transition Library</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {transitionEffects.map((transition) => (
                <button
                  key={transition.id}
                  onClick={() => {
                    setSelectedTransition(transition);
                    setParameters(
                      Object.entries(transition.schema.parameters).reduce(
                        (acc, [key, param]) => ({
                          ...acc,
                          [key]: param.default,
                        }),
                        {},
                      ),
                    );
                  }}
                  style={{
                    padding: "12px",
                    background: selectedTransition?.id === transition.id ? "#1e40af" : "#0f172a",
                    border: selectedTransition?.id === transition.id ? "2px solid #8b5cf6" : "1px solid #475569",
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
                    {transition.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{transition.description}</div>
                  <div
                    style={{
                      marginTop: "6px",
                      display: "flex",
                      gap: "4px",
                      flexWrap: "wrap",
                    }}
                  >
                    {transition.metadata.tags.slice(0, 3).map((tag) => (
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
              ))}
            </div>
          </div>

          {/* Duration Control */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Transition Duration</h3>
            <input type="range" min="0.5" max="5.0" step="0.1" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} style={{ width: "100%", marginBottom: "8px" }} />
            <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>{duration.toFixed(1)}s</div>
          </div>

          {/* Easing Selector */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Easing</h3>
            <select
              value={easing}
              onChange={(e) => setEasing(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                background: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "6px",
                color: "#f1f5f9",
                fontSize: "13px",
              }}
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In-Out</option>
              <option value="smoothstep">Smoothstep</option>
            </select>
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
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Parameters</h3>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {!selectedTransition ? (
                "Select a transition to edit parameters"
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Object.entries(selectedTransition.schema.parameters).map(([key, param]: [string, any]) => (
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
                            style={{ width: "100%", marginBottom: "4px" }}
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
                      {param.type === "string" && param.options && (
                        <select
                          value={parameters[key] ?? param.default}
                          onChange={(e) =>
                            setParameters({
                              ...parameters,
                              [key]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px",
                            background: "#0f172a",
                            border: "1px solid #475569",
                            borderRadius: "4px",
                            color: "#f1f5f9",
                            fontSize: "12px",
                          }}
                        >
                          {param.options.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
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
              selectedTransition
                ? {
                    id: selectedTransition.id,
                    name: selectedTransition.name,
                    version: selectedTransition.version,
                  }
                : mockEffect
            }
            parameters={parameters}
            presets={selectedTransition?.presets || mockPresets}
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
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Dual Preview would go here - for now, single canvas */}
          <PreviewCanvas effect={selectedTransition} inputs={{ clipA: clipAFile, clipB: clipBFile, progress }} currentTime={progress * duration} playing={false} onPlayingChange={() => {}} onTimeChange={() => {}} width={1920} height={1080} />

          {/* Progress Slider */}
          <div
            style={{
              padding: "16px",
              background: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                fontSize: "14px",
                color: "#94a3b8",
              }}
            >
              <span>Clip A</span>
              <span>{(progress * 100).toFixed(0)}%</span>
              <span>Clip B</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={progress} onChange={(e) => setProgress(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Drag to scrub through transition
            </div>
          </div>

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
                borderBottom: activeDevTab === tab ? "2px solid #8b5cf6" : "2px solid transparent",
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
                id: "transition-lab-graph",
                nodes: [],
                edges: [],
              }}
            />
          )}

          {activeDevTab === "passes" && (
            <PassInspector
              frameGraph={{
                passes: [],
              }}
            />
          )}

          {activeDevTab === "resources" && (
            <ResourceInspector
              manager={{
                stats: () => ({
                  allocated: 0,
                  freed: 0,
                  active: 0,
                }),
              }}
            />
          )}

          {activeDevTab === "performance" && (
            <PerformanceMonitor
              metrics={{
                gpuTime: 0,
                cpuTime: 0,
                fps: 60,
                passTimes: 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
