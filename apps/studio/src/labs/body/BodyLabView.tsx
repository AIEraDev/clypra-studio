/**
 * Body Effect Lab
 *
 * Future-proof effects that consume feature maps from extensible providers.
 * Tests the feature provider architecture with mask-based effects.
 *
 * Phase 5 Week 8: Body Lab UI + Feature Provider Architecture
 */

import React, { useState, useEffect } from "react";
import { GraphInspector, PassInspector, ResourceInspector, PerformanceMonitor, PreviewCanvas, Timeline, PresetManager, ValidationPanel, type Preset, type ValidationIssue } from "@clypra/ui";
import { createDefaultProviderManager, type FeatureProvider, type FeatureMap, FeatureMapType } from "@clypra/feature-providers";
import { bodyEffects } from "@clypra/engine/effects/body";

export function BodyLabView() {
  // State management
  const [selectedEffect, setSelectedEffect] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10); // 10 seconds default
  const [playing, setPlaying] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeDevTab, setActiveDevTab] = useState<"graph" | "passes" | "resources" | "performance">("graph");

  // Feature provider state
  const [providerManager] = useState(() => createDefaultProviderManager());
  const [availableProviders, setAvailableProviders] = useState<FeatureProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [featureMaps, setFeatureMaps] = useState<Map<FeatureMapType, FeatureMap>>(new Map());
  const [showFeatureMap, setShowFeatureMap] = useState(false);
  const [providerConfig, setProviderConfig] = useState<Record<string, any>>({});

  // Mock body effects (will be implemented in Week 9)
  const bodyEffectsData = bodyEffects.map((effect) => ({
    ...effect,
    version: "1.0.0",
    schema: {
      parameters: getEffectParameters(effect.id),
    },
    metadata: {
      category: effect.category,
      tags: [effect.category, "mask", "body"],
    },
  }));

  function getEffectParameters(effectId: string): Record<string, any> {
    switch (effectId) {
      case "neon-outline":
        return {
          color: {
            type: "color",
            default: "#00FFFF",
            label: "Outline Color",
            description: "Color of the neon glow",
          },
          thickness: {
            type: "number",
            min: 1,
            max: 20,
            step: 1,
            default: 4,
            label: "Thickness",
            description: "Width of the outline",
          },
          intensity: {
            type: "number",
            min: 0,
            max: 2,
            step: 0.1,
            default: 1.0,
            label: "Glow Intensity",
            description: "Brightness of the glow effect",
          },
          softness: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 0.5,
            label: "Glow Softness",
            description: "How soft/blurred the glow appears",
          },
        };
      case "background-blur":
        return {
          blurAmount: {
            type: "number",
            min: 0,
            max: 50,
            step: 1,
            default: 20,
            label: "Blur Amount",
            description: "Strength of background blur",
          },
          edgeSoftness: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 0.2,
            label: "Edge Softness",
            description: "Softness of the mask edge",
          },
        };
      case "spotlight":
        return {
          intensity: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 0.7,
            label: "Darkness",
            description: "How dark the background becomes",
          },
          falloff: {
            type: "number",
            min: 0,
            max: 2,
            step: 0.1,
            default: 1.0,
            label: "Falloff",
            description: "Speed of light falloff",
          },
          tint: {
            type: "color",
            default: "#000000",
            label: "Shadow Tint",
            description: "Color tint for darkened areas",
          },
          warmth: {
            type: "number",
            min: -0.5,
            max: 0.5,
            step: 0.05,
            default: 0.0,
            label: "Light Warmth",
            description: "Warm or cool light temperature",
          },
        };
      case "particle-aura":
        return {
          particleCount: {
            type: "number",
            min: 10,
            max: 200,
            step: 10,
            default: 50,
            label: "Particle Count",
            description: "Number of particles",
          },
          particleSize: {
            type: "number",
            min: 1,
            max: 10,
            step: 0.5,
            default: 3,
            label: "Particle Size",
            description: "Size of each particle",
          },
          speed: {
            type: "number",
            min: 0,
            max: 2,
            step: 0.1,
            default: 0.5,
            label: "Animation Speed",
            description: "Speed of particle movement",
          },
          color: {
            type: "color",
            default: "#FFFFFF",
            label: "Particle Color",
            description: "Color of the particles",
          },
          spread: {
            type: "number",
            min: 0,
            max: 50,
            step: 1,
            default: 10,
            label: "Spread Distance",
            description: "How far particles drift",
          },
          glow: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 0.3,
            label: "Glow Amount",
            description: "Soft glow around particles",
          },
        };
      case "color-isolation":
        return {
          desaturation: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 1.0,
            label: "Desaturation",
            description: "Amount to desaturate background",
          },
          edgeBlend: {
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            default: 0.3,
            label: "Edge Blend",
            description: "Smoothness of color transition",
          },
          colorBoost: {
            type: "number",
            min: 0,
            max: 0.5,
            step: 0.05,
            default: 0.0,
            label: "Subject Color Boost",
            description: "Increase saturation of subject",
          },
        };
      default:
        return {};
    }
  }

  const mockValidationIssues: ValidationIssue[] = [];

  const mockPresets: Preset[] = [
    {
      id: "preset-1",
      name: "Cyan Glow",
      description: "Bright cyan neon outline",
      effectId: "neon-outline",
      parameters: { color: "#00FFFF", thickness: 5, intensity: 1.5 },
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ["neon", "cyan"],
    },
  ];

  // Initialize providers on mount
  useEffect(() => {
    const providers = providerManager.getAllProviders();
    setAvailableProviders(providers);

    // Auto-activate first provider
    if (providers.length > 0) {
      handleActivateProvider(providers[0].id);
    }

    return () => {
      providerManager.dispose();
    };
  }, []);

  const handleVideoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleActivateProvider = async (providerId: string) => {
    try {
      // Deactivate previous provider
      if (activeProvider) {
        providerManager.deactivate(activeProvider);
      }

      // Activate new provider
      await providerManager.activate(providerId);
      setActiveProvider(providerId);

      // Reset config to provider defaults
      const provider = providerManager.getProvider(providerId);
      if (provider?.config) {
        const defaultConfig: Record<string, any> = {};
        for (const [key, configValue] of Object.entries(provider.config)) {
          defaultConfig[key] = configValue.default;
        }
        setProviderConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Failed to activate provider:", error);
    }
  };

  const handleProviderConfigChange = (key: string, value: any) => {
    const newConfig = { ...providerConfig, [key]: value };
    setProviderConfig(newConfig);

    // Update provider
    const provider = providerManager.getProvider(activeProvider!);
    if (provider?.updateConfig) {
      provider.updateConfig(newConfig);
    }
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
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🎭 Body Effect Lab
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>Test mask-based effects with extensible feature providers</p>
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
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Video Input</h3>
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

          {/* Feature Provider Selector */}
          <div
            style={{
              padding: "16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Feature Provider</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {availableProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleActivateProvider(provider.id)}
                  style={{
                    padding: "12px",
                    background: activeProvider === provider.id ? "#065f46" : "#0f172a",
                    border: activeProvider === provider.id ? "2px solid #10b981" : "1px solid #475569",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: "4px", fontSize: "13px" }}>{provider.name}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>Outputs: {provider.outputs.join(", ")}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Configuration */}
          {activeProvider && providerManager.getProvider(activeProvider)?.config && (
            <div
              style={{
                padding: "16px",
                background: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Provider Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(providerManager.getProvider(activeProvider)!.config!).map(([key, configValue]: [string, any]) => (
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
                      {configValue.label}
                    </label>
                    {configValue.type === "number" && (
                      <>
                        <input type="range" min={configValue.min} max={configValue.max} step={(configValue.max - configValue.min) / 100} value={providerConfig[key] ?? configValue.default} onChange={(e) => handleProviderConfigChange(key, parseFloat(e.target.value))} style={{ width: "100%", marginBottom: "4px" }} />
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{(providerConfig[key] ?? configValue.default).toFixed(2)}</div>
                      </>
                    )}
                    {configValue.type === "color" && (
                      <input
                        type="color"
                        value={providerConfig[key] ?? configValue.default}
                        onChange={(e) => handleProviderConfigChange(key, e.target.value)}
                        style={{
                          width: "100%",
                          height: "32px",
                          border: "1px solid #475569",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    )}
                    {configValue.type === "select" && (
                      <select
                        value={providerConfig[key] ?? configValue.default}
                        onChange={(e) => handleProviderConfigChange(key, e.target.value)}
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
                        {configValue.options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Map Visualization Toggle */}
          <div
            style={{
              padding: "12px 16px",
              background: "#1e293b",
              borderRadius: "8px",
              border: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Show Feature Map</span>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={showFeatureMap} onChange={(e) => setShowFeatureMap(e.target.checked)} />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>{showFeatureMap ? "Visible" : "Hidden"}</span>
            </label>
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
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Effect Library</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {bodyEffectsData.map((effect) => {
                const canUse = effect.requiredFeatures.every((feature) => activeProvider && providerManager.getProvider(activeProvider)?.outputs.includes(feature as FeatureMapType));

                return (
                  <button
                    key={effect.id}
                    onClick={() => {
                      setSelectedEffect(effect);
                      setParameters(
                        Object.entries(effect.schema.parameters).reduce(
                          (acc, [key, param]) => ({
                            ...acc,
                            [key]: param.default,
                          }),
                          {},
                        ),
                      );
                    }}
                    disabled={!canUse}
                    style={{
                      padding: "12px",
                      background: selectedEffect?.id === effect.id ? "#065f46" : !canUse ? "#1e293b" : "#0f172a",
                      border: selectedEffect?.id === effect.id ? "2px solid #10b981" : "1px solid #475569",
                      borderRadius: "6px",
                      cursor: canUse ? "pointer" : "not-allowed",
                      textAlign: "left",
                      opacity: canUse ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: "4px", fontSize: "13px" }}>{effect.name}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{effect.description}</div>
                    <div style={{ marginTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
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
                    {!canUse && <div style={{ marginTop: "6px", fontSize: "11px", color: "#ef4444" }}>⚠️ Requires: {effect.requiredFeatures.join(", ")}</div>}
                  </button>
                );
              })}
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
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600 }}>Effect Parameters</h3>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              {!selectedEffect ? (
                "Select an effect to edit parameters"
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                            style={{ width: "100%", marginBottom: "4px" }}
                          />
                          <div style={{ fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                            <span>{(parameters[key] ?? param.default).toFixed(param.step < 0.01 ? 3 : param.step < 0.1 ? 2 : 1)}</span>
                            <span>{param.description}</span>
                          </div>
                        </>
                      )}
                      {param.type === "color" && (
                        <input
                          type="color"
                          value={parameters[key] ?? param.default}
                          onChange={(e) =>
                            setParameters({
                              ...parameters,
                              [key]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            height: "32px",
                            border: "1px solid #475569",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        />
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
                : { id: "neon-outline", name: "Neon Outline", version: "1.0.0" }
            }
            parameters={parameters}
            presets={mockPresets}
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
          {/* Feature Map Visualization (if enabled) */}
          {showFeatureMap && (
            <div
              style={{
                padding: "16px",
                background: "#0f172a",
                borderRadius: "8px",
                border: "1px solid #334155",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#10b981" }}>Feature Map Preview</h3>
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: "6px",
                  aspectRatio: "16/9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                {activeProvider ? `${providerManager.getProvider(activeProvider)?.name} output will appear here` : "No active provider"}
              </div>
            </div>
          )}

          {/* Effect Preview */}
          <PreviewCanvas effect={selectedEffect} inputs={{ video: videoFile }} currentTime={currentTime} playing={playing} onPlayingChange={setPlaying} onTimeChange={setCurrentTime} width={1920} height={1080} />

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
                borderBottom: activeDevTab === tab ? "2px solid #10b981" : "2px solid transparent",
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
                id: "body-lab-graph",
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
