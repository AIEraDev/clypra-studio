/**
 * PreviewCanvas Component
 *
 * Hosts the Pixi renderer and executes effects through the V2 pipeline:
 * Video → Compiler → Planner → PixiRenderer → Canvas
 */

import { useEffect, useRef, useState } from "react";
import { GraphBuilder } from "@clypra/runtime/graph";
import { FrameGraphPlanner } from "@clypra/runtime/planner";
import { PixiRenderer } from "@clypra/runtime/pixi";
import { ValidationBackend } from "@clypra/runtime/validation";
import type { RuntimeTelemetry } from "@clypra/runtime/telemetry";
import { RuntimeInspector } from "../RuntimeInspector/RuntimeInspector";
import "./PreviewCanvas.css";

export interface PreviewCanvasProps {
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
  /** Show before/after comparison */
  showComparison?: boolean;
  /** Playback state */
  playing?: boolean;
  /** Callback when playback state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Callback when time changes */
  onTimeChange?: (time: number) => void;
}

export function PreviewCanvas({ effect, inputs, currentTime, width = 1920, height = 1080, showComparison = false, playing = false, onPlayingChange, onTimeChange }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const builderRef = useRef<GraphBuilder | null>(null);
  const plannerRef = useRef<FrameGraphPlanner | null>(null);
  const animationFrameRef = useRef<number>();

  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<{
    compiled: boolean;
    planned: boolean;
    rendering: boolean;
    error?: string;
  }>({ compiled: false, planned: false, rendering: false });
  const [renderStats, setRenderStats] = useState({
    fps: 0,
    gpuTime: 0,
    cpuTime: 0,
    passCount: 0,
  });

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

  // Initialize Pixi renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const initRenderer = async () => {
      try {
        const renderer = new PixiRenderer();
        await renderer.initialize({
          canvas: canvasRef.current!,
          width,
          height,
          backgroundColor: 0x1a1a1a,
        });

        rendererRef.current = renderer;
        builderRef.current = new GraphBuilder("video-lab-graph");
        plannerRef.current = new FrameGraphPlanner({
          targetWidth: width,
          targetHeight: height,
        });

        console.log("✓ Pixi Renderer initialized");

        // Remove Pixi's inline width/height styles to allow CSS to control sizing
        if (canvasRef.current) {
          canvasRef.current.style.removeProperty("width");
          canvasRef.current.style.removeProperty("height");
        }
      } catch (error) {
        console.error("Failed to initialize renderer:", error);
        setRuntimeStatus((prev) => ({ ...prev, error: String(error) }));
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [width, height]);

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
    if (!videoLoaded || !rendererRef.current || !builderRef.current || !plannerRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = performance.now();

    const renderFrame = async () => {
      if (!video || !rendererRef.current || !builderRef.current || !plannerRef.current) {
        return;
      }

      try {
        const now = performance.now();

        // Update FPS counter
        frameCount++;
        if (now - fpsUpdateTime >= 1000) {
          setRenderStats((prev) => ({
            ...prev,
            fps: Math.round((frameCount * 1000) / (now - fpsUpdateTime)),
          }));
          frameCount = 0;
          fpsUpdateTime = now;
        }

        // ALWAYS go through the full GPU pipeline
        // If no effect is selected, create a minimal identity graph
        const effectDef = effect || {
          id: "identity",
          type: "copy",
          parameters: {},
        };

        // Step 1: Compile (Build Graph)
        const graph = builderRef.current.build(
          {
            id: effectDef.id,
            type: effectDef.type,
            parameters: effectDef.parameters || {},
          },
          [{ id: "video", type: "video", source: "video-input" }],
        );

        setRuntimeStatus((prev) => ({ ...prev, compiled: true }));

        // Step 2: Plan (Generate FrameGraph)
        const frameGraph = plannerRef.current.plan(graph, Math.floor(video.currentTime * 60), video.currentTime * 1000);

        // Assert: Frame graph must be valid
        console.assert(frameGraph.passes.length > 0, "FrameGraph must have at least one pass");
        console.assert(frameGraph.resourceRequests.length > 0, "FrameGraph must have at least one resource");

        setRuntimeStatus((prev) => ({ ...prev, planned: true }));

        // Step 3: Upload video frame to GPU
        // Find non-transient resources (these are persistent input/output textures)
        const persistentResources = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);

        console.assert(persistentResources.length > 0, "Must have at least one persistent resource for video upload");

        rendererRef.current.uploadSourceImage(video, persistentResources);

        // Step 4: Execute (Render)
        setRuntimeStatus((prev) => ({ ...prev, rendering: true }));

        const result = await rendererRef.current.render(frameGraph);

        console.assert(result.outputTexture, "Render result must have output texture");

        // Step 5: Present to canvas
        rendererRef.current.present("output");

        // Update stats
        setRenderStats({
          fps: Math.round(1000 / (now - lastFrameTime)),
          gpuTime: result.stats.totalGpuTime,
          cpuTime: result.stats.totalCpuTime,
          passCount: result.stats.passCount,
        });

        lastFrameTime = now;

        // Update time if playing
        if (playing) {
          onTimeChange?.(video.currentTime);
        }
      } catch (error) {
        console.error("Render error:", error);
        setRuntimeStatus((prev) => ({ ...prev, error: String(error), rendering: false }));
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
  }, [videoLoaded, effect, playing, width, height, onTimeChange]);

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    const video = videoRef.current;
    if (video && onTimeChange) {
      onTimeChange(0);
    }
  };

  const handleCanvasClick = () => {
    if (onPlayingChange) {
      onPlayingChange(!playing);
    }
  };

  return (
    <div className="preview-canvas-container" style={{ position: "relative" }}>
      {/* Hidden video element for loading and playback */}
      {videoObjectUrl && <video ref={videoRef} src={videoObjectUrl} onLoadedData={handleVideoLoaded} style={{ display: "none" }} preload="auto" playsInline muted />}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="preview-canvas-responsive"
        style={{
          cursor: "pointer",
          border: "1px solid #334155",
          borderRadius: "8px",
          background: "#1a1a1a",
        }}
      />

      {/* Runtime Inspector Overlay */}
      {videoLoaded && <RuntimeInspector effectName={effect?.name || "Identity"} compiled={runtimeStatus.compiled} planned={runtimeStatus.planned} resourceCount={renderStats.passCount > 0 ? 2 : 0} passCount={renderStats.passCount} textureCount={renderStats.passCount > 0 ? 2 : 0} gpuTime={renderStats.gpuTime} fps={renderStats.fps} compact={false} />}

      <div
        style={{
          marginTop: "8px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          fontSize: "14px",
          color: "#94a3b8",
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
          Resolution: {width}×{height}
        </span>
      </div>

      {/* Error message */}
      {runtimeStatus.error && (
        <div style={{ marginTop: "8px", padding: "12px", background: "#7f1d1d", borderRadius: "6px", fontSize: "12px", color: "#fca5a5" }}>
          <strong>Runtime Error:</strong> {runtimeStatus.error}
        </div>
      )}
    </div>
  );
}
