/**
 * Media Processing Graph (MPG) Playground
 *
 * V2 Pipeline validation laboratory for testing:
 * - Graph compilation and validation
 * - Frame graph planning
 * - Pixi-based execution
 * - Resource management
 * - Real-time inspection
 *
 * Phase 1-3 Implementation:
 * - Static image support (PNG/JPG)
 * - NodeRegistry integration
 * - GraphValidator integration
 * - PixiRenderBackend implementation
 * - Live parameter hot-reload
 * - Pass visualization
 * - Performance metrics
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { NodeRegistry, GraphValidator, ProjectHelper, ProjectCompiler, FrameGraphBuilder, type ProjectManifestV2, type TrackDefinition, type MediaProcessingGraph, type FrameGraph, type ValidationResult } from "@clypra/engine";
import { PixiRenderBackend } from "./mpg/PixiRenderBackend";

// Sample test images
const TEST_IMAGES = [
  { id: "clypra-logo", name: "Clypra Logo", url: "/clypra.png" },
  { id: "founder", name: "Founder Photo", url: "/founder.jpg" },
  { id: "home-screen", name: "Home Screen", url: "/home-screen.png" },
];

interface EffectPreset {
  id: string;
  name: string;
  effects: Array<{ type: string; params: Record<string, any> }>;
}

const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "brightness-only",
    name: "Brightness",
    effects: [{ type: "Brightness", params: { brightness: 0.2 } }],
  },
  {
    id: "blur-only",
    name: "Gaussian Blur",
    effects: [{ type: "GaussianBlur", params: { blur: 12.0 } }],
  },
  {
    id: "bright-blur",
    name: "Brightness + Blur",
    effects: [
      { type: "Brightness", params: { brightness: 0.15 } },
      { type: "GaussianBlur", params: { blur: 10.0 } },
    ],
  },
  {
    id: "full-stack",
    name: "Full Effect Stack",
    effects: [
      { type: "Brightness", params: { brightness: 0.1 } },
      { type: "Contrast", params: { contrast: 0.15 } },
      { type: "GaussianBlur", params: { blur: 8.0 } },
    ],
  },
];

export const MPGPlayground: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState(TEST_IMAGES[0].id);
  const [selectedPreset, setSelectedPreset] = useState(EFFECT_PRESETS[0].id);
  const [manifest, setManifest] = useState<ProjectManifestV2 | null>(null);
  const [compiledGraph, setCompiledGraph] = useState<MediaProcessingGraph | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [frameGraph, setFrameGraph] = useState<FrameGraph | null>(null);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [isRendering, setIsRendering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backendRef = useRef<PixiRenderBackend | null>(null);
  const registryRef = useRef<NodeRegistry>(NodeRegistry.createDefault());
  const validatorRef = useRef<GraphValidator>(new GraphValidator(registryRef.current));
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Load source image
  useEffect(() => {
    const img = new Image();
    const imageData = TEST_IMAGES.find((i) => i.id === selectedImage);
    if (!imageData) return;

    img.crossOrigin = "anonymous";
    img.onload = () => {
      sourceImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load image:", imageData.url);
      setImageLoaded(false);
    };
    img.src = imageData.url;

    return () => {
      setImageLoaded(false);
    };
  }, [selectedImage]);

  // Build project manifest from selected preset
  useEffect(() => {
    const preset = EFFECT_PRESETS.find((p) => p.id === selectedPreset);
    if (!preset) return;

    const initialManifest = ProjectHelper.createEmpty("mpg-playground", "MPG Playground Project");

    const track: TrackDefinition = {
      id: "track-1",
      name: "Image Track",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: selectedImage,
          timelineStartMs: 0,
          timelineEndMs: 5000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: preset.effects.map((eff, idx) => ({
        id: `effect-${idx}`,
        type: eff.type,
        params: eff.params,
      })),
    };

    const updatedManifest = ProjectHelper.withTrack(initialManifest, track);
    setManifest(updatedManifest);
  }, [selectedImage, selectedPreset]);

  // Compile graph whenever manifest changes
  useEffect(() => {
    if (!manifest) return;

    try {
      const graph = ProjectCompiler.compile(manifest, registryRef.current);
      setCompiledGraph(graph);

      // Validate the compiled graph
      const result = validatorRef.current.validate(graph);
      setValidationResult(result);
    } catch (error) {
      console.error("Compilation error:", error);
      setCompiledGraph(null);
      setValidationResult({
        valid: false,
        errors: [
          {
            type: "unknown_node_type",
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      });
    }
  }, [manifest]);

  // Build frame graph when compiled graph is ready
  useEffect(() => {
    if (!compiledGraph || !validationResult?.valid) return;

    try {
      const fg = FrameGraphBuilder.build(compiledGraph, 500, 0, 1920, 1080);
      setFrameGraph(fg);
    } catch (error) {
      console.error("Frame graph building error:", error);
      setFrameGraph(null);
    }
  }, [compiledGraph, validationResult]);

  // Initialize Pixi backend
  useEffect(() => {
    if (!canvasRef.current) return;

    const backend = new PixiRenderBackend();
    backendRef.current = backend;

    backend
      .init(canvasRef.current)
      .then(() => {
        console.log("PixiRenderBackend initialized");
      })
      .catch((error) => {
        console.error("Backend initialization error:", error);
      });

    return () => {
      backend.destroy();
      backendRef.current = null;
    };
  }, []);

  // Render frame when everything is ready
  const renderFrame = useCallback(async () => {
    if (!frameGraph || !backendRef.current || !sourceImageRef.current || !imageLoaded || isRendering) {
      return;
    }

    setIsRendering(true);
    const startTime = performance.now();

    try {
      await backendRef.current.renderFrame(frameGraph, sourceImageRef.current);
      const duration = performance.now() - startTime;
      setRenderTime(duration);
    } catch (error) {
      console.error("Render error:", error);
    } finally {
      setIsRendering(false);
    }
  }, [frameGraph, imageLoaded, isRendering]);

  // Trigger render when dependencies change
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className="flex h-screen bg-[#0E0E12] text-[#F3F4F6] overflow-hidden">
      {/* Left Sidebar: Controls */}
      <div className="w-80 bg-[#14141A] border-r border-[#22222E] flex flex-col">
        <div className="p-6 border-b border-[#22222E]">
          <h1 className="text-xl font-bold text-white mb-1">MPG Playground</h1>
          <p className="text-xs text-gray-400">V2 Pipeline Validation Laboratory</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Asset Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Source Image</label>
            <div className="space-y-2">
              {TEST_IMAGES.map((img) => (
                <button key={img.id} onClick={() => setSelectedImage(img.id)} className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${selectedImage === img.id ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white" : "bg-[#1E1E24]/40 border-[#22222E] text-gray-400 hover:text-white hover:border-[#3A3A4A]"}`}>
                  {img.name}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Preset */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Effect Preset</label>
            <div className="space-y-2">
              {EFFECT_PRESETS.map((preset) => (
                <button key={preset.id} onClick={() => setSelectedPreset(preset.id)} className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${selectedPreset === preset.id ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white" : "bg-[#1E1E24]/40 border-[#22222E] text-gray-400 hover:text-white hover:border-[#3A3A4A]"}`}>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Status */}
          <div className="bg-[#1E1E24]/60 rounded-xl p-4 border border-[#22222E] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Validation</h3>
            {validationResult ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validationResult.valid ? "bg-[#33CC99]" : "bg-[#FF3366]"}`} />
                  <span className="text-sm font-medium text-white">{validationResult.valid ? "Valid Graph" : "Invalid Graph"}</span>
                </div>
                {!validationResult.valid && (
                  <div className="space-y-1">
                    {validationResult.errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-[#FF3366] bg-[#FF3366]/10 px-2 py-1 rounded">
                        {error.type}: {error.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No graph compiled</div>
            )}
          </div>

          {/* Metrics */}
          <div className="bg-[#1E1E24]/60 rounded-xl p-4 border border-[#22222E] space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Metrics</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-[#22222E]">
                <span className="text-gray-400">Nodes</span>
                <span className="font-semibold text-white">{compiledGraph?.nodes.length || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22222E]">
                <span className="text-gray-400">Edges</span>
                <span className="font-semibold text-white">{compiledGraph?.edges.length || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22222E]">
                <span className="text-gray-400">Passes</span>
                <span className="font-semibold text-white">{frameGraph?.passes.length || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22222E]">
                <span className="text-gray-400">Resources</span>
                <span className="font-semibold text-white">{frameGraph?.resourceRequests.length || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Render Time</span>
                <span className="font-semibold text-[#33CC99]">{renderTime.toFixed(2)} ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#22222E]">
          <button onClick={() => (window.location.href = "/studio")} className="w-full px-4 py-2 bg-[#22222E] hover:bg-[#2C2C3A] text-xs font-semibold uppercase tracking-wider text-white rounded-lg transition-colors border border-[#3A3A4A]">
            Exit to Studio
          </button>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col bg-[#09090D]">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-4xl aspect-video bg-[#14141A] rounded-2xl overflow-hidden border border-[#22222E] shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C6FFF]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Inspector */}
      <div className="w-96 bg-[#14141A] border-l border-[#22222E] overflow-y-auto">
        <div className="p-6 border-b border-[#22222E]">
          <h2 className="text-lg font-bold text-white">Inspector</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Graph Structure */}
          {compiledGraph && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Graph Structure</h3>
              <div className="space-y-2">
                {compiledGraph.nodes.map((node) => (
                  <div key={node.id} className="bg-[#1E1E24]/60 rounded-lg p-3 border border-[#22222E]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-gray-400 truncate">{node.id}</div>
                        <div className="text-sm font-semibold text-[#7C6FFF]">{node.type}</div>
                      </div>
                      <div className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${node.capabilities.temporal ? "bg-[#FF3366]/20 text-[#FF3366]" : "bg-[#33CC99]/20 text-[#33CC99]"}`}>{node.capabilities.temporal ? "Temporal" : "Spatial"}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <div className="text-gray-500">Inputs: {Object.keys(node.inputs).length}</div>
                      <div className="text-gray-500">Outputs: {Object.keys(node.outputs).length}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Passes */}
          {frameGraph && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Render Passes</h3>
              <div className="space-y-2">
                {frameGraph.passes.map((pass, idx) => (
                  <div key={pass.id} className="bg-[#1E1E24]/60 rounded-lg p-3 border border-[#22222E]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#7C6FFF]/20 text-[#7C6FFF] font-semibold text-xs flex items-center justify-center border border-[#7C6FFF]/40">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{pass.name}</div>
                        <div className="text-[10px] font-mono text-gray-500">{pass.shaderId}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 space-y-0.5">
                      <div>Inputs: {pass.inputs.length}</div>
                      <div>Output: {pass.output}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {frameGraph && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Resources</h3>
              <div className="space-y-1">
                {frameGraph.resourceRequests.map((res) => (
                  <div key={res.id} className="text-[10px] font-mono px-3 py-2 bg-[#1E1E24]/40 rounded border border-[#22222E] flex items-center justify-between">
                    <span className="text-gray-400 truncate flex-1">{res.id}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${res.transient ? "bg-[#FF3366]/20 text-[#FF3366]" : "bg-[#33CC99]/20 text-[#33CC99]"}`}>{res.transient ? "TEMP" : "PERS"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
