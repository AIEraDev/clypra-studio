/**
 * Responsive PreviewCanvas Component
 *
 * A properly architected canvas component that separates:
 * - Render resolution (internal GPU quality)
 * - Display size (CSS layout dimensions)
 *
 * Features:
 * - Container-aware responsive sizing
 * - No horizontal overflow
 * - Aspect ratio preservation
 * - ResizeObserver lifecycle management
 * - Clean separation from Pixi implementation details
 */

import { useEffect, useRef, useState } from "react";
import { GraphBuilder } from "@clypra/runtime/graph";
import { FrameGraphPlanner } from "@clypra/runtime/planner";
import { PixiRenderer } from "@clypra/runtime/pixi";
import { RuntimeInspector } from "../RuntimeInspector/RuntimeInspector";
import { useResponsiveCanvas } from "./useResponsiveCanvas";
import "./PreviewCanvas.css";

export interface ResponsivePreviewCanvasProps {
  /** Effect definition to render */
  effect: any;
  /** Media inputs for the effect */
  inputs: Record<string, any>;
  /** Current playback time in seconds */
  currentTime: number;

  /** Render resolution - internal GPU quality (default: 1920×1080) */
  renderWidth?: number;
  renderHeight?: number;

  /** Responsive behavior (default: true) */
  responsive?: boolean;
  /** Fit mode (default: "contain") */
  fit?: "contain" | "cover" | "fill";
  /** Maximum render scale for HiDPI (default: 1.0) */
  maxRenderScale?: number;

  /** Playback state */
  playing?: boolean;
  /** Callback when playback state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Callback when time changes */
  onTimeChange?: (time: number) => void;
  /** Callback when display size changes */
  onDisplaySizeChange?: (size: { width: number; height: number }) => void;
}

export function ResponsivePreviewCanvas({ effect, inputs, currentTime, renderWidth = 1920, renderHeight = 1080, responsive = true, fit = "contain", maxRenderScale = 1.0, playing = false, onPlayingChange, onTimeChange, onDisplaySizeChange }: ResponsivePreviewCanvasProps) {
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

  // Responsive canvas controller
  const { containerRef, displaySize, isReady } = useResponsiveCanvas({
    aspectRatio: renderWidth / renderHeight,
    fit,
    enabled: responsive,
    onDisplaySizeChange,
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

  // Initialize Pixi renderer with proper sizing
  useEffect(() => {
    if (!canvasRef.current || !isReady) return;

    const initRenderer = async () => {
      try {
        // Calculate actual render resolution (considering maxRenderScale)
        const scale = Math.min(maxRenderScale, 1.0);
        const actualRenderWidth = Math.round(renderWidth * scale);
        const actualRenderHeight = Math.round(renderHeight * scale);

        const renderer = new PixiRenderer();
        await renderer.initialize({
          canvas: canvasRef.current!,
          width: actualRenderWidth,
          height: actualRenderHeight,
          backgroundColor: 0x1a1a1a,
          resolution: 1, // We manage resolution explicitly
          antialias: true,
        });

        rendererRef.current = renderer;
        builderRef.current = new GraphBuilder("preview-canvas");
        plannerRef.current = new FrameGraphPlanner({
          targetWidth: actualRenderWidth,
          targetHeight: actualRenderHeight,
        });

        console.log("✓ Responsive Pixi Renderer initialized");
        console.log(`  Render: ${actualRenderWidth}×${actualRenderHeight}`);
        console.log(`  Display: ${displaySize.width.toFixed(0)}×${displaySize.height.toFixed(0)}`);
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
  }, [renderWidth, renderHeight, maxRenderScale, isReady, displaySize]);

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

        // Create effect graph (or identity if none selected)
        const effectDef = effect || {
          id: "identity",
          type: "copy",
          parameters: {},
        };

        // Step 1: Compile
        const graph = builderRef.current.build(
          {
            id: effectDef.id,
            type: effectDef.type,
            parameters: effectDef.parameters || {},
          },
          [{ id: "video", type: "video", source: "video-input" }],
        );

        setRuntimeStatus((prev) => ({ ...prev, compiled: true }));

        // Step 2: Plan
        const frameGraph = plannerRef.current.plan(graph, Math.floor(video.currentTime * 60), video.currentTime * 1000);

        setRuntimeStatus((prev) => ({ ...prev, planned: true }));

        // Step 3: Upload video frame
        const persistentResources = frameGraph.resourceRequests.filter((r) => !r.transient).map((r) => r.id);
        rendererRef.current.uploadSourceImage(video, persistentResources);

        // Step 4: Execute
        setRuntimeStatus((prev) => ({ ...prev, rendering: true }));
        const result = await rendererRef.current.render(frameGraph);

        // Step 5: Present
        rendererRef.current.present("output");

        // Update stats
        setRenderStats({
          fps: Math.round(1000 / (now - lastFrameTime)),
          gpuTime: result.stats.totalGpuTime,
          cpuTime: result.stats.totalCpuTime,
          passCount: result.stats.passCount,
        });

        lastFrameTime = now;

        if (playing) {
          onTimeChange?.(video.currentTime);
        }
      } catch (error) {
        console.error("Render error:", error);
        setRuntimeStatus((prev) => ({ ...prev, error: String(error), rendering: false }));
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoLoaded, effect, playing, renderWidth, renderHeight, onTimeChange]);

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
    <div
      ref={containerRef}
      className="responsive-preview-canvas-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* Hidden video element */}
      {videoObjectUrl && <video ref={videoRef} src={videoObjectUrl} onLoadedData={handleVideoLoaded} style={{ display: "none" }} preload="auto" playsInline muted />}

      {/* Canvas with explicit render and display dimensions */}
      {isReady && displaySize.width > 0 && (
        <canvas
          ref={canvasRef}
          width={renderWidth}
          height={renderHeight}
          onClick={handleCanvasClick}
          style={{
            width: `${displaySize.width}px`,
            height: `${displaySize.height}px`,
            cursor: "pointer",
            border: "1px solid #334155",
            borderRadius: "8px",
            background: "#1a1a1a",
            display: "block",
          }}
        />
      )}

      {/* Runtime Inspector Overlay */}
      {videoLoaded && <RuntimeInspector effectName={effect?.name || "Identity"} compiled={runtimeStatus.compiled} planned={runtimeStatus.planned} resourceCount={renderStats.passCount > 0 ? 2 : 0} passCount={renderStats.passCount} textureCount={renderStats.passCount > 0 ? 2 : 0} gpuTime={renderStats.gpuTime} fps={renderStats.fps} compact={false} />}

      {/* Controls */}
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
          Render: {renderWidth}×{renderHeight}
        </span>

        {responsive && displaySize.width > 0 && (
          <span style={{ color: "#64748b" }}>
            Display: {Math.round(displaySize.width)}×{Math.round(displaySize.height)}
          </span>
        )}
      </div>

      {/* Error message */}
      {runtimeStatus.error && (
        <div style={{ marginTop: "8px", padding: "12px", background: "#7f1d1d", borderRadius: "6px", fontSize: "12px", color: "#fca5a5", maxWidth: displaySize.width || "100%" }}>
          <strong>Runtime Error:</strong> {runtimeStatus.error}
        </div>
      )}
    </div>
  );
}
