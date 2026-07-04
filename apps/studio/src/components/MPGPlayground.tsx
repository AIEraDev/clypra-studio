/**
 * Media Processing Graph (MPG) Playground — full V2 filter design lab.
 * Design stacks from scratch, test live, publish to R2 for Clypra Editor.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  NodeRegistry,
  GraphValidator,
  ProjectCompiler,
  FrameGraphBuilder,
  PixiRenderBackend,
  MPGFrameRenderer,
  CommandBufferBuilder,
  type ProjectManifestV2,
  type MediaProcessingGraph,
  type FrameGraph,
  type ValidationResult,
} from "@clypra-studio/engine";
import { Layers, Sparkles, Image as ImageIcon, Upload, Settings2, GitBranch } from "lucide-react";
import { useR2Publish } from "../hooks/useR2Publish";
import { buildManifestFromStack } from "./mpg/buildManifest";
import { DEFAULT_TEST_IMAGES, EFFECT_PRESETS } from "./mpg/constants";
import { addStackNode, createStackNode, updateNodeParams } from "./mpg/stackUtils";
import type { LeftTab, RightTab, SourceMedia, StackNode, PublishFormState } from "./mpg/types";
import { EffectStackEditor } from "./mpg/components/EffectStackEditor";
import { NodeParamEditor } from "./mpg/components/NodeParamEditor";
import { SourceMediaPanel } from "./mpg/components/SourceMediaPanel";
import { GeneratePanel } from "./mpg/components/GeneratePanel";
import { PublishPanel } from "./mpg/components/PublishPanel";
import { createCustomSourceFromFile, loadSourceImage, ACCEPTED_IMAGE_TYPES } from "./mpg/sourceImage";

export const MPGPlayground: React.FC = () => {
  const [leftTab, setLeftTab] = useState<LeftTab>("stack");
  const [rightTab, setRightTab] = useState<RightTab>("params");
  const [sources, setSources] = useState<SourceMedia[]>(DEFAULT_TEST_IMAGES);
  const [selectedSourceId, setSelectedSourceId] = useState(DEFAULT_TEST_IMAGES[0].id);
  const [stack, setStack] = useState<StackNode[]>([createStackNode("Brightness", { brightness: 0.1 })]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [manifest, setManifest] = useState<ProjectManifestV2 | null>(null);
  const [compiledGraph, setCompiledGraph] = useState<MediaProcessingGraph | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [frameGraph, setFrameGraph] = useState<FrameGraph | null>(null);
  const [renderTime, setRenderTime] = useState(0);
  const isRenderingRef = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backendRef = useRef<PixiRenderBackend | null>(null);
  const backendInitializedRef = useRef(false);
  const registryRef = useRef(NodeRegistry.createDefault());
  const validatorRef = useRef(new GraphValidator(registryRef.current));
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const customUrlRef = useRef<string | null>(null);

  const { publishMpgStack } = useR2Publish();

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId) ?? sources[0],
    [sources, selectedSourceId],
  );

  const selectedNode = useMemo(
    () => stack.find((n) => n.id === selectedNodeId) ?? null,
    [stack, selectedNodeId],
  );

  useEffect(() => {
    if (!selectedSource) return;

    let cancelled = false;
    setImageLoaded(false);

    void (async () => {
      try {
        const img = await loadSourceImage(selectedSource.url);
        if (cancelled) return;
        sourceImageRef.current = img;
        setImageLoaded(true);
      } catch {
        if (!cancelled) setImageLoaded(false);
      }
    })();

    return () => {
      cancelled = true;
      setImageLoaded(false);
      sourceImageRef.current = null;
    };
  }, [selectedSource]);

  useEffect(() => {
    if (!selectedSource) return;
    setManifest(buildManifestFromStack(stack, selectedSource, viewportSize));
  }, [stack, selectedSource, viewportSize.w, viewportSize.h]);

  useEffect(() => {
    if (!manifest) return;
    try {
      const graph = ProjectCompiler.compile(manifest, registryRef.current);
      setCompiledGraph(graph);
      setValidationResult(validatorRef.current.validate(graph));
    } catch (error) {
      setCompiledGraph(null);
      setValidationResult({
        valid: false,
        errors: [{ type: "unknown_node_type", message: error instanceof Error ? error.message : String(error) }],
      });
    }
  }, [manifest]);

  useEffect(() => {
    if (!compiledGraph || !validationResult?.valid || !manifest) return;
    try {
      const fg = FrameGraphBuilder.build(
        compiledGraph,
        500,
        0,
        manifest.width,
        manifest.height,
        registryRef.current,
      );
      setFrameGraph(fg);
    } catch (error) {
      console.error("Frame graph building error:", error);
      setFrameGraph(null);
    }
  }, [compiledGraph, validationResult, manifest]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const backend = new PixiRenderBackend();
    backendRef.current = backend;
    let disposed = false;

    const syncSize = async () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      setViewportSize({ w, h });

      if (!backendRef.current || disposed) return;

      if (!backendInitializedRef.current) {
        await backend.init(canvas, w, h);
        if (disposed) return;
        backendInitializedRef.current = true;
        setBackendReady(true);
      } else {
        backend.resize(w, h);
      }
    };

    const ro = new ResizeObserver(() => void syncSize());
    ro.observe(container);
    void syncSize();

    return () => {
      disposed = true;
      ro.disconnect();
      backendInitializedRef.current = false;
      backend.destroy();
      backendRef.current = null;
      setBackendReady(false);
    };
  }, []);

  const renderFrame = useCallback(async () => {
    if (!frameGraph || !backendRef.current || !sourceImageRef.current || !imageLoaded || !backendReady || isRenderingRef.current) {
      return;
    }

    isRenderingRef.current = true;
    const startTime = performance.now();

    try {
      await MPGFrameRenderer.render(backendRef.current, frameGraph, sourceImageRef.current);
      void CommandBufferBuilder.fromFrameGraph(frameGraph);
      setRenderTime(performance.now() - startTime);
    } catch (error) {
      console.error("Render error:", error);
    } finally {
      isRenderingRef.current = false;
    }
  }, [frameGraph, imageLoaded, backendReady]);

  useEffect(() => {
    void renderFrame();
  }, [renderFrame]);

  const handleUploadSource = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|bmp|svg|heic|heif)$/i.test(file.name)) {
      return;
    }
    if (customUrlRef.current) {
      URL.revokeObjectURL(customUrlRef.current);
    }
    const { source, objectUrl } = createCustomSourceFromFile(file);
    customUrlRef.current = objectUrl;
    setSources((prev) => [...prev.filter((s) => !s.isCustom), source]);
    setSelectedSourceId(source.id);
    setLeftTab("source");
  }, []);

  useEffect(() => {
    return () => {
      if (customUrlRef.current) URL.revokeObjectURL(customUrlRef.current);
    };
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = EFFECT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const nodes = preset.effects.map((e) => createStackNode(e.type, e.params));
    setStack(nodes);
    setSelectedNodeId(nodes[0]?.id ?? null);
    setLeftTab("stack");
    setRightTab("params");
  }, []);

  const handlePublish = useCallback(
    async (form: PublishFormState, thumbnailDataUrl: string) => {
      const id = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await publishMpgStack({
        id,
        category: form.category,
        metadata: {
          name: form.name.trim(),
          description: form.description.trim(),
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          published: form.published,
          intensity: {
            min: 0,
            max: 100,
            default: form.intensityDefault,
            step: 1,
          },
          effectStack: stack.map(({ type, params }) => ({ type, params })),
        },
        thumbnailDataUrl,
      });
    },
    [publishMpgStack, stack],
  );

  const leftTabs: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
    { id: "stack", label: "Design", icon: <Layers size={14} /> },
    { id: "presets", label: "Presets", icon: <Sparkles size={14} /> },
    { id: "generate", label: "Generate", icon: <WandIcon /> },
    { id: "source", label: "Source", icon: <ImageIcon size={14} /> },
  ];

  return (
    <div className="flex h-screen bg-[#0E0E12] text-[#F3F4F6] overflow-hidden">
      {/* Left sidebar */}
      <div className="w-[340px] bg-[#14141A] border-r border-[#22222E] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#22222E]">
          <h1 className="text-lg font-bold text-white mb-0.5">MPG Playground</h1>
          <p className="text-[11px] text-gray-400">Design · Test · Publish V2 filters</p>
        </div>

        <div className="flex p-2 gap-1 border-b border-[#22222E]">
          {leftTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLeftTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                leftTab === tab.id ? "bg-[#7C6FFF]/15 text-[#7C6FFF]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {leftTab === "stack" && (
            <EffectStackEditor
              stack={stack}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onStackChange={setStack}
              onAddNode={(type) => {
                const next = addStackNode(stack, type);
                setStack(next);
                setSelectedNodeId(next[next.length - 1]?.id ?? null);
              }}
            />
          )}
          {leftTab === "presets" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Starter Presets</label>
              {EFFECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="w-full text-left px-4 py-3 rounded-lg border bg-[#1E1E24]/40 border-[#22222E] text-gray-300 hover:text-white hover:border-[#7C6FFF]/50 transition-all"
                >
                  <div className="text-sm font-medium">{preset.name}</div>
                  {preset.description && <div className="text-[10px] text-gray-500 mt-0.5">{preset.description}</div>}
                </button>
              ))}
            </div>
          )}
          {leftTab === "generate" && (
            <GeneratePanel
              onGenerated={(name, nodes) => {
                setStack(nodes);
                setSelectedNodeId(nodes[0]?.id ?? null);
                setLeftTab("stack");
                setRightTab("publish");
              }}
            />
          )}
          {leftTab === "source" && (
            <SourceMediaPanel
              sources={sources}
              selectedId={selectedSourceId}
              onSelect={setSelectedSourceId}
              onUpload={handleUploadSource}
            />
          )}
        </div>

        {/* Status footer */}
        <div className="p-4 border-t border-[#22222E] space-y-3">
          <label className="block">
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadSource(file);
                e.target.value = "";
              }}
            />
            <span className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-dashed border-[#33334A] text-xs text-gray-400 hover:text-white hover:border-[#7C6FFF]/50 cursor-pointer transition-colors">
              <Upload size={14} />
              Upload test image
            </span>
          </label>
          <div className="bg-[#1E1E24]/60 rounded-xl p-3 border border-[#22222E] space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${imageLoaded ? "bg-[#33CC99]" : "bg-[#FF3366]"}`} />
              <span>Image: {imageLoaded ? "Loaded" : "Loading…"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${backendReady ? "bg-[#33CC99]" : "bg-[#FF3366]"}`} />
              <span>Backend: {backendReady ? "Ready" : "Init…"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${validationResult?.valid ? "bg-[#33CC99]" : "bg-[#FF3366]"}`} />
              <span>{validationResult?.valid ? "Valid Graph" : "Invalid Graph"}</span>
            </div>
            <div className="text-gray-500 pt-1">
              {viewportSize.w}×{viewportSize.h} · {compiledGraph?.nodes.length ?? 0} nodes · {frameGraph?.passes.length ?? 0} passes · {renderTime.toFixed(2)} ms
            </div>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = "/studio")}
            className="w-full px-4 py-2 bg-[#22222E] hover:bg-[#2C2C3A] text-xs font-semibold uppercase text-white rounded-lg border border-[#3A3A4A]"
          >
            Exit to Studio
          </button>
        </div>
      </div>

      {/* Center preview */}
      <div className="flex-1 flex flex-col bg-[#09090D] min-w-0">
        <div
          className="flex-1 flex items-center justify-center p-8"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleUploadSource(file);
          }}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-[#14141A] rounded-2xl overflow-hidden border border-[#22222E] shadow-2xl group">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-gray-500 pointer-events-none">
                <span>Drop an image here or use Source → Upload</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right inspector */}
      <div className="w-[360px] bg-[#14141A] border-l border-[#22222E] flex flex-col shrink-0">
        <div className="flex border-b border-[#22222E]">
          {(
            [
              { id: "params" as RightTab, label: "Params", icon: <Settings2 size={14} /> },
              { id: "pipeline" as RightTab, label: "Pipeline", icon: <GitBranch size={14} /> },
              { id: "publish" as RightTab, label: "Publish", icon: <Upload size={14} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRightTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wide transition-all ${
                rightTab === tab.id ? "text-[#7C6FFF] border-b-2 border-[#7C6FFF]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {rightTab === "params" && (
            <NodeParamEditor
              node={selectedNode}
              onParamsChange={(nodeId, params) => setStack((s) => updateNodeParams(s, nodeId, params))}
            />
          )}
          {rightTab === "pipeline" && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-white mb-3">Render Pipeline</h2>
              {frameGraph?.passes.map((pass, idx) => (
                <div key={pass.id} className="bg-[#1E1E24]/60 rounded-lg p-3 border border-[#22222E] text-xs">
                  <div className="font-medium text-white">{idx + 1}. {pass.name}</div>
                  <div className="font-mono text-gray-500">{pass.shaderId}</div>
                </div>
              )) ?? <p className="text-sm text-gray-500">No passes yet</p>}
            </div>
          )}
          {rightTab === "publish" && (
            <PublishPanel
              stack={stack}
              canvasRef={canvasRef}
              validationValid={validationResult?.valid ?? false}
              onPublish={handlePublish}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function WandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5" />
    </svg>
  );
}
