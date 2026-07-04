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

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FrameGraphPlanner } from "@clypra-studio/runtime/planner";
import { PixiRenderer } from "@clypra-studio/runtime/pixi";
import { EffectGraphCompiler } from "@clypra-studio/runtime";
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
  /** Callback for live log messages */
  onLog?: (message: string) => void;
}

export function ResponsivePreviewCanvas({ effect, inputs, currentTime, renderWidth = 1920, renderHeight = 1080, responsive = true, fit = "contain", maxRenderScale = 1.0, playing = false, onPlayingChange, onTimeChange, onDisplaySizeChange, onLog }: ResponsivePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<PixiRenderer | null>(null);
  const compilerRef = useRef<EffectGraphCompiler | null>(null);
  const plannerRef = useRef<FrameGraphPlanner | null>(null);
  const animationFrameRef = useRef<number>();

  // Bug #2 fix: compiledGraph converted from useState to a ref-in-loopStateRef.
  // Previously useState caused a cascade: setting the graph → re-render → loopStateRef
  // sync effect fires → further effects re-run. Now the graph is written directly into
  // loopStateRef.current.activeGraph so the render loop picks it up with zero re-renders.
  // loopStateRef is declared here (before the compile effect) so the effect can write
  // into it on first mount without a temporal dead-zone issue.
  const loopStateRef = useRef({
    video: null as HTMLVideoElement | null,
    renderer: null as PixiRenderer | null,
    planner: null as FrameGraphPlanner | null,
    activeGraph: null as any,
    playing: false,
    fit: "contain" as "contain" | "cover" | "fill",
    onTimeChange: undefined as ((time: number) => void) | undefined,
  });

  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isRendererReady, setIsRendererReady] = useState(false);
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
    resourceCount: 0,
  });

  // Responsive canvas controller
  const { containerRef, displaySize, isReady } = useResponsiveCanvas({
    aspectRatio: renderWidth / renderHeight,
    fit,
    enabled: responsive,
    onDisplaySizeChange,
  });

  // Memoize log to avoid re-creating a new function reference on every render,
  // which would make it an unstable dep inside effects.
  const onLogRef = useRef(onLog);
  useEffect(() => { onLogRef.current = onLog; }, [onLog]);
  const log = useCallback((msg: string) => {
    console.log(msg);
    onLogRef.current?.(msg);
  }, []);


  // Create object URL from video file or support string URLs directly
  useEffect(() => {
    const videoSource = inputs?.video;
    if (videoSource instanceof File) {
      log(`🎬 [VideoLab] Step 1: New video file received -> ${videoSource.name} (${(videoSource.size / 1024 / 1024).toFixed(2)} MB)`);
      const url = URL.createObjectURL(videoSource);
      setVideoObjectUrl(url);
      setVideoLoaded(false);
      log(`🎬 [VideoLab] Step 2: Created preview Blob URL -> ${url}`);
      return () => {
        log(`🎬 [VideoLab] Cleaning up Blob URL -> ${url}`);
        URL.revokeObjectURL(url);
        setVideoObjectUrl(null);
      };
    } else if (typeof videoSource === "string") {
      log(`🎬 [VideoLab] Step 1: New video URL string received -> ${videoSource}`);
      setVideoObjectUrl(videoSource);
      setVideoLoaded(false);
    } else {
      setVideoObjectUrl(null);
      setVideoLoaded(false);
    }
  }, [inputs?.video]);

  // Fallback readyState inspector (catches fast-loading or cached videos)
  useEffect(() => {
    if (!videoObjectUrl || videoLoaded) return;

    const checkReady = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 1) {
        log(`🎬 [VideoLab] Step 3: Video element ready (readyState=${video.readyState}, ${video.videoWidth}x${video.videoHeight})`);
        setVideoLoaded(true);
      }
    };

    checkReady();
    const interval = setInterval(checkReady, 250);
    return () => clearInterval(interval);
  }, [videoObjectUrl, videoLoaded]);

  // Initialize Pixi renderer ONCE when canvas is ready
  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;
    const renderer = new PixiRenderer();

    const initRenderer = async () => {
      const scale = Math.min(maxRenderScale, 1.0);
      const actualRenderWidth = Math.round(renderWidth * scale);
      const actualRenderHeight = Math.round(renderHeight * scale);

      try {
        log(`🎨 [VideoLab] Initializing Pixi.js renderer (${actualRenderWidth}x${actualRenderHeight})...`);
        await renderer.initialize({
          canvas: canvasRef.current!,
          width: actualRenderWidth,
          height: actualRenderHeight,
          backgroundColor: 0x1a1a1a,
          resolution: 1,
          antialias: true,
        });

        if (!mounted) {
          renderer.dispose();
          return;
        }

        rendererRef.current = renderer;
        compilerRef.current = new EffectGraphCompiler();
        plannerRef.current = new FrameGraphPlanner({
          targetWidth: actualRenderWidth,
          targetHeight: actualRenderHeight,
        });

        setIsRendererReady(true);
        log("✓ [VideoLab] Pixi.js renderer initialized successfully.");
      } catch (error) {
        if (mounted) {
          log(`❌ [VideoLab] Failed to initialize renderer: ${error}`);
          setRuntimeStatus((prev) => ({ ...prev, error: String(error) }));
        }
      }
    };

    initRenderer();

    return () => {
      mounted = false;
      setIsRendererReady(false);
      log("[VideoLab] Disposing renderer");
      renderer.dispose();
      rendererRef.current = null;
      compilerRef.current = null;
      plannerRef.current = null;
    };
  }, [maxRenderScale]);

  // Handle render size changes without recreating WebGL context
  useEffect(() => {
    if (!isRendererReady || !rendererRef.current) return;

    const scale = Math.min(maxRenderScale, 1.0);
    const actualRenderWidth = Math.round(renderWidth * scale);
    const actualRenderHeight = Math.round(renderHeight * scale);

    log(`🎨 [VideoLab] Resizing renderer to ${actualRenderWidth}x${actualRenderHeight}`);
    rendererRef.current.resize(actualRenderWidth, actualRenderHeight);

    // Recreate planner with new target dimensions
    plannerRef.current = new FrameGraphPlanner({
      targetWidth: actualRenderWidth,
      targetHeight: actualRenderHeight,
    });
  }, [renderWidth, renderHeight, maxRenderScale, isRendererReady]);

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
      log("▶ [VideoLab] Playing video...");
      video.play().catch(console.error);
    } else {
      log("⏸ [VideoLab] Pausing video...");
      video.pause();
    }
  }, [playing, videoLoaded]);

  // Stable effect key to prevent re-compilation loops
  const effectKey = useMemo(() => JSON.stringify(effect || null), [effect]);

  // Pre-compile graph only when effect definition actually changes.
  // Bug #2 fix: write directly into loopStateRef.current.activeGraph instead of
  // calling setCompiledGraph() (state). The old approach triggered a re-render on
  // every isRendererReady transition, cascading through the loopStateRef sync effect.
  useEffect(() => {
    if (!isRendererReady || !compilerRef.current) {
      loopStateRef.current.activeGraph = null;
      return;
    }
    const effectDef = effect;
    if (effectDef && effectDef.nodes) {
      try {
        log(`⚡ [VideoLab] Compiling effect graph for: ${effectDef.id || effectDef.name}`);
        const graph = compilerRef.current.compile(effectDef, effectDef.parameters || {});
        loopStateRef.current.activeGraph = graph;
        setRuntimeStatus((prev) => ({ ...prev, compiled: true, error: undefined }));
        log(`✓ [VideoLab] Effect graph compiled successfully: ${graph.nodes.length} nodes`);
      } catch (error) {
        log(`❌ [VideoLab] Effect compilation failed: ${error}`);
        loopStateRef.current.activeGraph = null;
        setRuntimeStatus((prev) => ({ ...prev, compiled: false, error: String(error) }));
      }
    } else {
      log("⚡ [VideoLab] Compiling identity graph (no effect)");
      const graph = compilerRef.current.createIdentityGraph();
      loopStateRef.current.activeGraph = graph;
      setRuntimeStatus((prev) => ({ ...prev, compiled: true, error: undefined }));
    }
  }, [effectKey, isRendererReady]);

  // Keep loopStateRef in sync with latest values to prevent stale closures.
  // Note: activeGraph is written directly by the compile effect (above) — it is NOT
  // updated here to avoid triggering a re-render cascade (Bug #2 fix).
  useEffect(() => {
    loopStateRef.current.video = videoRef.current;
    loopStateRef.current.renderer = rendererRef.current;
    loopStateRef.current.planner = plannerRef.current;
    loopStateRef.current.playing = playing;
    loopStateRef.current.fit = fit;
    loopStateRef.current.onTimeChange = onTimeChange;
  }, [playing, fit, onTimeChange, isRendererReady, videoLoaded]);


  // Main render loop.
  // Bug #1 fix: when the loop is idle (no video/renderer/graph ready), throttle to
  // ~10 fps (100ms setTimeout) instead of busy-spinning at 60 fps with RAF. This
  // cuts idle CPU load by ~6x while keeping the warm-up poll responsive.
  useEffect(() => {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = performance.now();
    let lastRenderedTime = -1;
    let hasLoggedFirstFrame = false;
    let isLoopRunning = true;
    let idleTimeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined") {
      (window as any).__activeRenderLoopCount = ((window as any).__activeRenderLoopCount || 0) + 1;
      console.assert((window as any).__activeRenderLoopCount <= 1, `Multiple RAF loops detected: ${(window as any).__activeRenderLoopCount}`);
      console.debug(`[PreviewRenderer] RAF started. Total loops: ${(window as any).__activeRenderLoopCount}`);
    }

    const scheduleIdlePoll = () => {
      if (!isLoopRunning) return;
      // Throttle: retry in 100ms when not ready instead of every frame (~16ms)
      idleTimeoutId = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }, 100);
    };

    const renderFrame = () => {
      if (!isLoopRunning) return;

      const state = loopStateRef.current;
      const { video, renderer, planner, activeGraph, playing, fit, onTimeChange } = state;

      if (!video || video.readyState < 2 || !renderer || !planner || !activeGraph) {
        scheduleIdlePoll();
        return;
      }

      const currentVideoTime = video.currentTime;
      const timeDiff = Math.abs(currentVideoTime - lastRenderedTime);

      if (!playing && timeDiff < 0.016 && lastRenderedTime >= 0) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      try {
        const now = performance.now();

        // Step 2: Plan
        const compiledFrameGraph = planner.plan(activeGraph, Math.floor(currentVideoTime * 60), currentVideoTime * 1000);

        // Step 3: Upload video frame with fit mode scaling
        const persistentResources = compiledFrameGraph.resourceRequests.filter((r: any) => !r.transient).map((r: any) => r.id);
        renderer.uploadSourceImage(video, persistentResources, fit);

        // Step 4: Execute & Present (100% Synchronous GPU Draw)
        const result = renderer.render(compiledFrameGraph);
        renderer.present("output");

        if (!hasLoggedFirstFrame) {
          log("🎉 [VideoLab] First frame rendered and presented to WebGL canvas!");
          hasLoggedFirstFrame = true;
        }

        lastFrameTime = now;
        lastRenderedTime = currentVideoTime;

        // Update stats throttled to once per second
        frameCount++;
        if (now - fpsUpdateTime >= 1000) {
          setRenderStats({
            fps: Math.round((frameCount * 1000) / (now - fpsUpdateTime)),
            gpuTime: result.stats.totalGpuTime,
            cpuTime: result.stats.totalCpuTime,
            passCount: result.stats.passCount,
            resourceCount: result.stats.resourceCount,
          });
          setRuntimeStatus((prev) => ({ ...prev, planned: true, rendering: true }));
          frameCount = 0;
          fpsUpdateTime = now;
        }

        if (playing) {
          onTimeChange?.(currentVideoTime);
        }
      } catch (error) {
        log(`❌ [VideoLab] Render error: ${error}`);
        setRuntimeStatus((prev) => ({ ...prev, error: String(error), rendering: false }));
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      isLoopRunning = false;
      if (idleTimeoutId !== undefined) clearTimeout(idleTimeoutId);
      if (typeof window !== "undefined") {
        (window as any).__activeRenderLoopCount = Math.max(0, ((window as any).__activeRenderLoopCount || 0) - 1);
        console.debug(`[PreviewRenderer] RAF cancelled. Remaining loops: ${(window as any).__activeRenderLoopCount}`);
      }
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    log(`🎬 [VideoLab] HTMLVideoElement metadata loaded: ${video?.videoWidth || 0}x${video?.videoHeight || 0} @ ${video?.duration ? video.duration.toFixed(1) : 0}s`);
    setVideoLoaded(true);
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
        minHeight: "420px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Off-screen video element (always mounted to prevent React DOM insertion errors) */}
      <video
        ref={videoRef}
        src={videoObjectUrl || undefined}
        onLoadedData={handleVideoLoaded}
        onLoadedMetadata={handleVideoLoaded}
        onCanPlay={handleVideoLoaded}
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}
        preload="auto"
        playsInline
        muted
      />

      {/* Canvas with explicit render and display dimensions */}
      <canvas
        ref={canvasRef}
        width={renderWidth}
        height={renderHeight}
        onClick={handleCanvasClick}
        style={{
          width: displaySize.width > 0 ? `${displaySize.width}px` : "100%",
          height: displaySize.height > 0 ? `${displaySize.height}px` : "405px",
          maxHeight: "500px",
          cursor: "pointer",
          border: "1px solid #334155",
          borderRadius: "8px",
          background: "#1a1a1a",
          display: "block",
          objectFit: "contain",
        }}
      />

      {/* Runtime Inspector Overlay */}
      {videoLoaded && (
        <RuntimeInspector
          effectName={effect?.name || "Identity"}
          compiled={runtimeStatus.compiled}
          planned={runtimeStatus.planned}
          resourceCount={renderStats.resourceCount}
          passCount={renderStats.passCount}
          textureCount={renderStats.resourceCount}
          gpuTime={renderStats.gpuTime}
          fps={renderStats.fps}
          compact={false}
        />
      )}

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

