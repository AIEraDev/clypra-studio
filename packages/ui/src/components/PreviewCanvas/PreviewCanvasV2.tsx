/**
 * PreviewCanvas V2
 *
 * Complete V2 pipeline with snapshot-based observability:
 * Project → Compiler → Planner → RenderJob → Executor → Renderer → Snapshot
 */

import { useEffect, useRef, useState } from "react";
import { GraphBuilder } from "@clypra-studio/runtime/graph";
import { FrameGraphPlanner } from "@clypra-studio/runtime/planner";
import { Executor } from "@clypra-studio/runtime/executor";
import { PixiRenderer } from "@clypra-studio/runtime/pixi";
import type { RenderJob } from "@clypra-studio/runtime/job";
import type { RuntimeSnapshot, BackendInfo } from "@clypra-studio/runtime/state";
import { SnapshotObservatory } from "../RuntimeObservatory/SnapshotObservatory";
import "./PreviewCanvasV2.css";

export interface PreviewCanvasV2Props {
  /** Effect definition to render */
  effect: any;
  /** Media inputs for the effect */
  inputs: Record<string, any>;
  /** Current playback time in seconds */
  currentTime: number;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Playback state */
  playing?: boolean;
  /** Show Runtime Observatory */
  showObservatory?: boolean;
  /** Callback when playback state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Callback when time changes */
  onTimeChange?: (time: number) => void;
}

export function PreviewCanvasV2({ effect, inputs, currentTime, width = 1920, height = 1080, playing = false, showObservatory = true, onPlayingChange, onTimeChange }: PreviewCanvasV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const executorRef = useRef<Executor | null>(null);
  const builderRef = useRef<GraphBuilder | null>(null);
  const plannerRef = useRef<FrameGraphPlanner | null>(null);
  const animationFrameRef = useRef<number>();
  const frameCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width, height });
  const [pipelineReady, setPipelineReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Monitor container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        setContainerSize({ width: containerWidth, height: containerHeight });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Create object URL from video file
  useEffect(() => {
    const videoFile = inputs?.video;
    if (videoFile instanceof File) {
      const url = URL.createObjectURL(videoFile);
      setVideoObjectUrl(url);
      setVideoLoaded(false);
      return () => {
        URL.revokeObjectURL(url);
        setVideoObjectUrl(null);
      };
    } else {
      setVideoObjectUrl(null);
      setVideoLoaded(false);
    }
  }, [inputs?.video]);

  // Initialize V2 Pipeline: Executor + Renderer
  useEffect(() => {
    if (!canvasRef.current || !videoLoaded || canvasDimensions.width === 0 || canvasDimensions.height === 0) return;

    const initPipeline = async () => {
      try {
        // Clean up existing renderer if any
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null;
        }

        setPipelineReady(false);

        // Backend info for snapshots
        const backend: BackendInfo = {
          name: "PixiRenderer",
          api: "WebGL 2.0",
          shaderLanguage: "GLSL ES 3.0",
          featureLevel: "tier2",
          version: "1.0.0",
        };

        // Initialize Executor with snapshot capture
        const executor = new Executor({
          captureSnapshots: true,
          snapshotHistory: 60,
          enableResourcePooling: true,
          enableAliasing: true,
          backend,
        });

        // Initialize Renderer with dynamic dimensions
        const renderer = new PixiRenderer();
        await renderer.initialize({
          canvas: canvasRef.current!,
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          backgroundColor: 0x1a1a1a,
        });

        // Initialize Compiler + Planner with dynamic dimensions
        const builder = new GraphBuilder("preview-canvas");
        const planner = new FrameGraphPlanner({
          targetWidth: canvasDimensions.width,
          targetHeight: canvasDimensions.height,
        });

        executorRef.current = executor;
        rendererRef.current = renderer;
        builderRef.current = builder;
        plannerRef.current = planner;

        console.log("✓ V2 Pipeline initialized");
        console.log("  Executor: ready");
        console.log("  Renderer:", backend.name);
        console.log("  Canvas:", `${canvasDimensions.width}×${canvasDimensions.height}`);
        console.log("  Snapshots: enabled");

        setPipelineReady(true);
      } catch (err) {
        console.error("Failed to initialize pipeline:", err);
        setError(String(err));
      }
    };

    initPipeline();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      executorRef.current = null;
      builderRef.current = null;
      plannerRef.current = null;
    };
  }, [canvasDimensions.width, canvasDimensions.height, videoLoaded]);

  // Sync video element with currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;

    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoLoaded]);

  // Sync video playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;

    if (playing) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [playing, videoLoaded]);

  // Main render loop
  useEffect(() => {
    if (!pipelineReady || !videoLoaded || !rendererRef.current || !executorRef.current || !builderRef.current || !plannerRef.current) {
      console.log("Render loop not starting:", {
        pipelineReady,
        videoLoaded,
        renderer: !!rendererRef.current,
        executor: !!executorRef.current,
        builder: !!builderRef.current,
        planner: !!plannerRef.current,
      });
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.log("Render loop not starting: no video element");
      return;
    }

    console.log("Starting render loop...");

    const renderFrame = async () => {
      if (!video || !rendererRef.current || !executorRef.current || !builderRef.current || !plannerRef.current) {
        return;
      }

      try {
        // Step 1: Compile (Build Graph)
        const effectDef = effect || {
          id: "identity",
          type: "copy",
          parameters: {},
        };

        const graph = builderRef.current.build(
          {
            id: effectDef.id,
            type: effectDef.type,
            parameters: effectDef.parameters || {},
          },
          [{ id: "video", type: "video", source: "video-input" }],
        );

        // Step 2: Plan (Generate FrameGraph)
        const frameNumber = frameCounterRef.current;
        const frameGraph = plannerRef.current.plan(graph, frameNumber, video.currentTime * 1000);

        // Step 3: Convert to RenderJob (immutable)
        const job: RenderJob = {
          jobId: `job-${frameNumber}`,
          frame: frameNumber,
          timestamp: performance.now(),
          executionOrder: frameGraph.passes.map((p) => p.id),
          passes: frameGraph.passes.map((p) => ({
            id: p.id,
            name: p.name,
            shader: p.shaderId,
            inputs: p.inputs.map((id, idx) => ({
              logicalId: id,
              binding: idx,
              usage: "read" as const,
            })),
            outputs: [
              {
                logicalId: p.output,
                binding: 0,
                usage: "write" as const,
              },
            ],
            uniforms: p.uniforms,
            clearBeforeRender: p.clearBeforeRender ?? true,
            dependsOn: [],
          })),
          resources: frameGraph.resourceRequests.map((r) => ({
            logicalId: r.id,
            type: "texture" as const,
            width: r.width,
            height: r.height,
            format: "rgba8",
            persistent: !r.transient,
            transient: r.transient,
            aliasable: r.transient,
            usage: {
              read: true,
              write: true,
              upload: false,
              download: false,
            },
          })),
          policy: {
            parallelPasses: false,
            maxConcurrency: 1,
            resourcePooling: true,
            aggressiveAliasing: true,
            lazyAllocation: true,
            skipRedundantPasses: false,
            cacheShadersPrograms: true,
            validateBeforeExecution: true,
            assertionsEnabled: true,
          },
          dependencies: {
            nodes: [],
            edges: [],
          },
          metadata: {
            graphHash: `graph-${effectDef.id}`,
            projectHash: "preview-canvas",
            plannerVersion: "1.0.0",
            optimizations: [],
            warnings: [],
          },
        };

        // Step 4: Upload video frame to GPU (old API - needs to happen before execute)
        const persistentResources = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);
        rendererRef.current.uploadSourceImage(video, persistentResources);

        // Step 5: Execute via Executor → Renderer
        // NOTE: Current PixiRenderer doesn't implement new execute() interface yet
        // For now, we'll use old render() API and manually capture snapshot
        const result = await rendererRef.current.render(frameGraph);

        // Step 6: Present to canvas
        rendererRef.current.present("output");

        // Step 7: Get snapshot from executor
        const latestSnapshot = executorRef.current.getLatestSnapshot();
        if (latestSnapshot) {
          setSnapshot(latestSnapshot);
        }

        frameCounterRef.current++;

        // Update time if playing
        if (playing) {
          onTimeChange?.(video.currentTime);
        }

        setError(null);
      } catch (err) {
        console.error("Render error:", err);
        setError(String(err));
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    // Start render loop
    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pipelineReady, videoLoaded, effect, playing, canvasDimensions.width, canvasDimensions.height, onTimeChange]);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;

    // Get actual video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoAspectRatio = videoWidth / videoHeight;

    console.log(`Video dimensions: ${videoWidth}×${videoHeight}`);
    console.log(`Video aspect ratio: ${videoAspectRatio.toFixed(4)}`);

    // Calculate canvas dimensions to fit container while maintaining aspect ratio
    if (containerSize.width > 0 && containerSize.height > 0) {
      const availableWidth = containerSize.width - 24; // Account for padding
      const availableHeight = containerSize.height - 24;

      // Calculate which dimension is the limiting factor
      const widthScale = availableWidth / videoWidth;
      const heightScale = availableHeight / videoHeight;
      const scale = Math.min(widthScale, heightScale);

      const canvasWidth = Math.floor(videoWidth * scale);
      const canvasHeight = Math.floor(videoHeight * scale);

      console.log(`Container size: ${containerSize.width}×${containerSize.height}`);
      console.log(`Canvas dimensions: ${canvasWidth}×${canvasHeight}`);

      setCanvasDimensions({ width: canvasWidth, height: canvasHeight });
    } else {
      // Fallback to native dimensions if container size not yet available
      setCanvasDimensions({ width: videoWidth, height: videoHeight });
    }

    setVideoLoaded(true);

    if (onTimeChange) {
      onTimeChange(0);
    }
  };

  const handleCanvasClick = () => {
    if (onPlayingChange) {
      onPlayingChange(!playing);
    }
  };

  return (
    <div className="preview-canvas-v2" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Canvas Container */}
      <div
        ref={containerRef}
        style={{
          flex: "1 1 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: 0,
          minWidth: 0,
          padding: "12px",
        }}
      >
        {/* Hidden video element */}
        {videoObjectUrl && <video ref={videoRef} src={videoObjectUrl} onLoadedData={handleVideoLoaded} style={{ display: "none" }} preload="auto" playsInline muted />}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          onClick={handleCanvasClick}
          className="preview-canvas-v2__canvas"
          style={{
            cursor: "pointer",
            border: "1px solid #334155",
            borderRadius: "4px",
            background: "#1a1a1a",
            display: "block",
          }}
        />
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          fontSize: "14px",
          color: "#94a3b8",
          flexShrink: 0,
          flexGrow: 0,
          padding: "12px 20px",
          borderTop: "1px solid #1e293b",
          background: "#0a0f1a",
          minHeight: "52px",
        }}
      >
        <button
          onClick={() => onPlayingChange?.(!playing)}
          disabled={!videoLoaded}
          style={{
            padding: "6px 16px",
            background: !videoLoaded ? "#475569" : playing ? "#ef4444" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: videoLoaded ? "pointer" : "not-allowed",
            fontWeight: 500,
            opacity: videoLoaded ? 1 : 0.5,
          }}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>

        <span>
          Resolution: {canvasDimensions.width}×{canvasDimensions.height}
        </span>

        {snapshot && (
          <>
            <span>Frame: {snapshot.frame}</span>
            <span>FPS: {snapshot.performance.fps.toFixed(1)}</span>
            <span>Passes: {snapshot.graph.passCount}</span>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "12px 20px",
            background: "#7f1d1d",
            fontSize: "12px",
            color: "#fca5a5",
            flexShrink: 0,
            borderTop: "1px solid #991b1b",
          }}
        >
          <strong>Runtime Error:</strong> {error}
        </div>
      )}

      {/* Runtime Observatory */}
      {showObservatory && videoLoaded && snapshot && <SnapshotObservatory snapshot={snapshot} />}
    </div>
  );
}
