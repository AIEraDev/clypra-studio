/**
 * Transition Lab — Modular Component Edition
 *
 * Coordinates states and render loops across:
 *  - TopNavBar
 *  - SidebarLeft (outgoing clip A, incoming clip B, mix transitions library)
 *  - CanvasPreview (transition mixer canvas, sequencer timelines, progress sliders)
 *  - SidebarRight (parameters inspector, mix nodes compiler, debugger logs monitor)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeFontSystem, ALL_TRANSITIONS } from "@clypra-studio/engine";
import type { NativeLabFrameRequest } from "@clypra-studio/native-lab-client";

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";
import { PublishTransitionModal } from "../../components/PublishTransitionModal";

import { getNativeLabClient } from "../../services/nativeLabClient";

const DEFAULT_CLIP_A = "";
const DEFAULT_CLIP_B = "";

export function TransitionLabView() {
  // Initialization of Lottie web fonts
  useEffect(() => {
    try {
      initializeFontSystem();
    } catch (e) {
      console.warn("Font system initialization bypassed or already run", e);
    }
  }, []);

  // Check admin status
  useEffect(() => {
    try {
      const token = localStorage.getItem("clypra_auth_token");
      if (!token) {
        setIsAdmin(false);
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(!!payload.isAdmin);
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  // ── Preset-driven transition library (matches Filter Lab pattern) ──────────
  // Transitions are loaded from @clypra-studio/engine GPU implementations
  const [apiTransitions, setApiTransitions] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      description: string;
      defaultDurationMs: number;
      renderer: string;
      params: any;
      easing?: string;
      duration?: { min: number; max: number; default: number; step?: number };
      thumbnail?: string;
      preview?: string;
      tags: string[];
      isPremium?: boolean;
    }>
  >([]);

  useEffect(() => {
    // Initialize transitions from engine GPU implementations (not API)
    const formattedTransitions = ALL_TRANSITIONS.map((transition) => ({
      id: transition.id,
      name: transition.name,
      category: transition.category,
      description: transition.description,
      defaultDurationMs: transition.defaultDurationMs, // Keep original ms value for modal
      renderer: transition.id, // Use ID as renderer reference
      params: transition.params, // Pass ParamSchema array from GPU transition
      easing: "linear",
      duration: {
        min: 0.3,
        max: 5.0,
        default: transition.defaultDurationMs / 1000, // Convert ms to seconds
        step: 0.1,
      },
      tags: transition.tags,
      isPremium: false,
    }));
    setApiTransitions(formattedTransitions);
  }, []);

  // State Management
  const [clipAFile, setClipAFile] = useState<File | null>(null);
  const [clipBFile, setClipBFile] = useState<File | null>(null);
  const [clipAUrl, setClipAUrl] = useState<string>(DEFAULT_CLIP_A);
  const [clipBUrl, setClipBUrl] = useState<string>(DEFAULT_CLIP_B);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.0); // 0.0 = Clip A, 1.0 = Clip B
  const [selectedTransition, setSelectedTransition] = useState<string>("cross-dissolve");
  const [fitMode, setFitMode] = useState<"stretch" | "fit" | "crop">("fit");
  const [activeTab, setActiveTab] = useState<"inspector" | "nodes" | "stats">("inspector");

  // Parameters and duration are initialized empty and updated when the API list loads
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [duration, setDuration] = useState(2.0);

  const sequenceTimeRef = useRef(0.0);
  const playingRef = useRef(false);
  // Track which render phase we are in so mount/unmount only fires on boundary crossings
  const renderPhaseRef = useRef<"pre" | "transition" | "post">("pre");

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nativeLabState, setNativeLabState] = useState<"probing" | "ready" | "fallback">("probing");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStateRef = useRef<"idle" | "requested" | "recording">("idle");
  const thumbnailCapturedRef = useRef<boolean>(false);

  // ── Diagnostics ──────────────────────────────────────────────────────────
  // Flip this to false to silence all diagnostic output once you've finished debugging
  const DIAG_ENABLED = true;

  // Per-frame snapshot accumulator — kept outside React state to avoid re-renders
  const diagRef = useRef<
    {
      frame: number;
      sec: number;
      phase: string;
      mixProgress: number;
      activeTransitionId: string | null;
      hasVideoA: boolean;
      hasVideoB: boolean;
      videoAReadyState: number;
      videoBReadyState: number;
      videoACurrentTime: number;
      videoBCurrentTime: number;
      sourceAType: string;
      sourceBType: string;
      event?: string;
    }[]
  >([]);
  const diagFrameRef = useRef(0);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      const totalDuration = 5.0 + duration + 5.0;
      sequenceTimeRef.current = progress * totalDuration;
    }
  }, [progress, playing, duration]);

  const [logs, setLogs] = useState<string[]>(["[INIT] Transition console starting...", "[OK] Dual-channel video mixers ready.", "[INFO] Ready. Load outgoing/incoming clips or adjust parameters."]);

  const [latency, setLatency] = useState(0.02);
  const [cpuUsage, setCpuUsage] = useState(14);
  const [gpuUsage, setGpuUsage] = useState(38);
  const [memUsage, setMemUsage] = useState("1.4GB/16GB");

  const [redHeight, setRedHeight] = useState(45);
  const [greenHeight, setGreenHeight] = useState(70);
  const [blueHeight, setBlueHeight] = useState(65);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Persistent placeholder canvases to prevent blank rendering
  const placeholderARef = useRef<HTMLCanvasElement | null>(null);
  const placeholderBRef = useRef<HTMLCanvasElement | null>(null);
  const nativeRequestInFlightRef = useRef(false);
  const nativeLastFrameKeyRef = useRef("");
  const nativeFallbackLoggedRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }, []);

  // Expose a DevTools helper: call window.__clypraTransitionDiag() in the browser console
  // to get a live table of all diagnostic snapshots captured so far.
  useEffect(() => {
    (window as any).__clypraTransitionDiag = () => {
      const snaps = diagRef.current;
      if (!snaps || snaps.length === 0) {
        console.log("[DIAG] No snapshots yet — start playback first.");
        return;
      }
      console.group("%c[TRANSITION DIAG] Live snapshot dump (" + snaps.length + " entries)", "color:#4edea3;font-weight:bold");
      console.log("All frames (boundary events only):");
      console.table(snaps.filter((s) => s.event != null));
      console.log("Last 10 ambient frames:");
      console.table(snaps.filter((s) => !s.event).slice(-10));
      console.groupEnd();
    };
    return () => {
      delete (window as any).__clypraTransitionDiag;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNativeLabClient()
      .handshake()
      .then((handshake) => {
        if (cancelled) return;
        if (handshake.gpu.available && handshake.gpu.state === "ready") {
          setNativeLabState("ready");
          addLog(`[NATIVE] GPU ready: ${handshake.gpu.adapterName ?? "unknown adapter"} (${handshake.gpu.backend ?? "unknown backend"})`);
        } else {
          setNativeLabState("fallback");
          addLog(`[NATIVE] Unavailable: ${handshake.gpu.failureReason ?? "GPU adapter unavailable"}. Browser fallback enabled.`);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNativeLabState("fallback");
        addLog(`[NATIVE] Daemon unavailable: ${error instanceof Error ? error.message : String(error)}. Browser fallback enabled.`);
      });
    return () => { cancelled = true; };
  }, [addLog]);

  const handleClipAImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Outgoing Clip A loaded: ${file.name}`);
      setClipAFile(file);
      const objectUrl = URL.createObjectURL(file);
      setClipAUrl(objectUrl);
      setProgress(0);
      setPlaying(false);
    }
  };

  const handleClipBImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Incoming Clip B loaded: ${file.name}`);
      setClipBFile(file);
      const objectUrl = URL.createObjectURL(file);
      setClipBUrl(objectUrl);
      setProgress(0);
      setPlaying(false);
    }
  };

  const handleClipALoadedMetadata = () => {
    if (videoARef.current) {
      addLog(`[MEDIA] Outgoing Clip A ready: ${videoARef.current.videoWidth}x${videoARef.current.videoHeight}, ${videoARef.current.duration.toFixed(2)}s`);
    }
  };

  const handleClipBLoadedMetadata = () => {
    if (videoBRef.current) {
      addLog(`[MEDIA] Incoming Clip B ready: ${videoBRef.current.videoWidth}x${videoBRef.current.videoHeight}, ${videoBRef.current.duration.toFixed(2)}s`);
    }
  };

  const handleClipAError = () => {
    addLog(`[WARN] Outgoing Clip A load failed.`);
  };

  const handleClipBError = () => {
    addLog(`[WARN] Incoming Clip B load failed.`);
  };

  // Force video elements to load when their source URLs change
  useEffect(() => {
    if (videoARef.current) {
      videoARef.current.load();
    }
  }, [clipAUrl]);

  useEffect(() => {
    if (videoBRef.current) {
      videoBRef.current.load();
    }
  }, [clipBUrl]);

  const handleSetPlaying = (val: boolean) => {
    if (val && progress >= 1.0) {
      setProgress(0);
      sequenceTimeRef.current = 0.0;
      if (videoARef.current) {
        videoARef.current.currentTime = 0;
      }
      if (videoBRef.current) {
        videoBRef.current.currentTime = 0;
      }
    }
    setPlaying(val);
  };

  const handleRewind = () => {
    setProgress((prev) => Math.max(0, prev - 0.1));
    addLog("[SEEK] Step rewind -10% progress");
  };

  const handleFastForward = () => {
    setProgress((prev) => Math.min(1.0, prev + 0.1));
    addLog("[SEEK] Step forward +10% progress");
  };

  const handleParamChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectTransition = (id: string) => {
    setSelectedTransition(id);
    const trans = apiTransitions.find((t) => t.id === id);
    if (trans) {
      // API returns params as a flat Record<string,any> (not the engine's {key,value}[] array)
      setParameters(trans.params ?? {});
      const durationSec = trans.duration?.default ?? 2.0;
      setDuration(durationSec);
      addLog(`[SYSTEM] Selected transition: ${trans.name} (${Math.round(durationSec * 1000)}ms)`);
    }
  };

  const handleTimelineScrub = useCallback((clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setProgress(pct);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleTimelineScrub(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) handleTimelineScrub(e.clientX);
    };
    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
        addLog(`[SEEK] Seek progress set to: ${(progress * 100).toFixed(0)}%`);
      }
    };
    if (isScrubbing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, handleTimelineScrub, progress, addLog]);

  const getProgressVal = (p: number) => {
    const easingType = parameters.easing ?? "linear";
    if (easingType === "ease-in-out") {
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    }
    if (easingType === "ease-in") {
      return p * p;
    }
    if (easingType === "ease-out") {
      return 1 - (1 - p) * (1 - p);
    }
    return p;
  };

  const drawSMPTEBars = (ctx: CanvasRenderingContext2D, w: number, h: number, label: string) => {
    ctx.fillStyle = "#0c101a";
    ctx.fillRect(0, 0, w, h);
    const colors = ["#c0c0c0", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff"];
    const barW = w / 7;
    const topH = h * 0.7;
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(i * barW, 0, barW, topH);
    }
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, topH, w, h - topH);
    ctx.fillStyle = "#adc6ff";
    ctx.font = "bold 14px 'Geist', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, w / 2, topH + (h - topH) / 2);
  };

  // Draw placeholder canvas frames once on mount
  useEffect(() => {
    const canvasA = document.createElement("canvas");
    canvasA.width = 1280;
    canvasA.height = 720;
    const ctxA = canvasA.getContext("2d");
    if (ctxA) drawSMPTEBars(ctxA, 1280, 720, "CLIP A (OUTGOING)");
    placeholderARef.current = canvasA;

    const canvasB = document.createElement("canvas");
    canvasB.width = 1280;
    canvasB.height = 720;
    const ctxB = canvasB.getContext("2d");
    if (ctxB) drawSMPTEBars(ctxB, 1280, 720, "CLIP B (INCOMING)");
    placeholderBRef.current = canvasB;
  }, []);

  // Native-first dual-raster render loop. Video decode remains at the browser
  // boundary for this lab; composition and transition evaluation run in the
  // shared native GPU daemon.
  useEffect(() => {
    let animId: number;
    let disposed = false;
    let lastTime = performance.now();
    let statsTimer = performance.now();
    diagRef.current = [];
    diagFrameRef.current = 0;

    type Source = HTMLVideoElement | HTMLCanvasElement;
    const nativeTransitionType = (id: string): string | null => {
      const normalized = id.toLowerCase();
      if (normalized.includes("cross") || normalized.includes("dissolve") || normalized.includes("fade")) return "cross-dissolve";
      if (normalized.includes("wipe")) return "directional-wipe";
      if (normalized.includes("zoom")) return "zoom-blur";
      return null;
    };
    const drawSource = (ctx: CanvasRenderingContext2D, source: Source, width: number, height: number) => {
      const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
      if (!sourceWidth || !sourceHeight) return;
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;
      if (fitMode === "crop") {
        if (sourceRatio > targetRatio) { drawW = height * sourceRatio; drawX = (width - drawW) / 2; }
        else { drawH = width / sourceRatio; drawY = (height - drawH) / 2; }
      } else if (fitMode === "fit") {
        if (sourceRatio > targetRatio) { drawH = width / sourceRatio; drawY = (height - drawH) / 2; }
        else { drawW = height * sourceRatio; drawX = (width - drawW) / 2; }
      }
      ctx.drawImage(source, drawX, drawY, drawW, drawH);
    };
    const drawFallback = (ctx: CanvasRenderingContext2D, sourceA: Source, sourceB: Source, phase: "pre" | "transition" | "post", p: number, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      if (phase === "transition") {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        drawSource(ctx, sourceA, width, height);
        ctx.globalAlpha = p;
        drawSource(ctx, sourceB, width, height);
        ctx.restore();
      } else {
        drawSource(ctx, phase === "pre" ? sourceA : sourceB, width, height);
      }
    };
    const capturePublishFrame = (canvas: HTMLCanvasElement, currentSec: number, mixProgress: number, recordStartTime: number, recordEndTime: number) => {
      if (recordingStateRef.current === "requested" && currentSec >= recordStartTime) {
        const stream = canvas.captureStream(30);
        let options = { mimeType: "video/webm;codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: "video/webm;codecs=vp8" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: "video/webm" };
        try {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(stream, { mimeType: options.mimeType, videoBitsPerSecond: 1500000 });
          recorder.ondataavailable = (event) => { if (event.data?.size) recordedChunksRef.current.push(event.data); };
          recorder.onstop = () => {
            const reader = new FileReader();
            reader.onloadend = () => { setPreviewDataUrl(reader.result as string); setShowPublishModal(true); setIsRecording(false); addLog("[PUBLISH] Video recording completed! Form is ready."); };
            reader.readAsDataURL(new Blob(recordedChunksRef.current, { type: options.mimeType }));
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
          recordingStateRef.current = "recording";
          addLog(`[PUBLISH] MediaRecorder started recording ${nativeLabState === "ready" ? "native" : "browser"} transition canvas.`);
        } catch (error: any) {
          recordingStateRef.current = "idle";
          setIsRecording(false);
          addLog(`[WARN] MediaRecorder start error: ${error.message}`);
        }
      }
      if (recordingStateRef.current === "recording" && mixProgress >= 0.5 && !thumbnailCapturedRef.current) {
        thumbnailCapturedRef.current = true;
        setThumbnailDataUrl(canvas.toDataURL("image/png"));
        addLog("[PUBLISH] Mid-transition thumbnail captured.");
      }
      if (recordingStateRef.current === "recording" && currentSec >= recordEndTime) {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
        recordingStateRef.current = "idle";
      }
    };

    const renderNative = async (canvas: HTMLCanvasElement, sourceA: Source, sourceB: Source, phase: "pre" | "transition" | "post", mixProgress: number, easedP: number, frameKey: string, recordStartTime: number, recordEndTime: number, currentSec: number) => {
      const rasterA = document.createElement("canvas");
      const rasterB = document.createElement("canvas");
      rasterA.width = rasterB.width = 640;
      rasterA.height = rasterB.height = 360;
      const ctxA = rasterA.getContext("2d", { willReadFrequently: true });
      const ctxB = rasterB.getContext("2d", { willReadFrequently: true });
      if (!ctxA || !ctxB) throw new Error("Unable to create native transition raster contexts");
      ctxA.fillStyle = ctxB.fillStyle = "#000";
      ctxA.fillRect(0, 0, 640, 360);
      ctxB.fillRect(0, 0, 640, 360);
      drawSource(ctxA, sourceA, 640, 360);
      drawSource(ctxB, sourceB, 640, 360);
      const transitionType = nativeTransitionType(selectedTransition);
      const request: NativeLabFrameRequest = {
        contractVersion: 1,
        requestId: `studio-transition-${Date.now()}-${diagFrameRef.current}`,
        frameTime: { frameIndex: Math.floor(currentSec * 60), ticks: Math.floor(currentSec * 1_000_000), timescale: 1_000_000 },
        project: {
          schemaVersion: 1,
          projectRevision: `transition-lab-${frameKey}`,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          clearColor: [0, 0, 0, 1],
          videoLayers: [],
          rasterLayers: [
            { assetId: "clip-a", rgba: Array.from(ctxA.getImageData(0, 0, 640, 360).data), width: 640, height: 360, x: 0, y: 0, rotation: 0, opacity: 1, zIndex: 0, blendMode: "normal" },
            { assetId: "clip-b", rgba: Array.from(ctxB.getImageData(0, 0, 640, 360).data), width: 640, height: 360, x: 0, y: 0, rotation: 0, opacity: 1, zIndex: 1, blendMode: "normal" },
          ],
          transition: phase === "transition" && transitionType ? { outgoingLayer: "clip-a", incomingLayer: "clip-b", transitionType, progress: easedP, feather: Number(parameters.feather ?? 0.1), intensity: Number(parameters.intensity ?? 1), fadeColor: [0, 0, 0, 1] } : null,
        },
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        quality: "full",
        colorPolicy: { version: 1, workingSpace: "linear-rec709", outputFormat: "rgba8Srgb", toneMapHdrToSdr: true, displayProfile: "srgb-reference" },
        renderGraphVersion: 1,
      };
      nativeRequestInFlightRef.current = true;
      const result = await getNativeLabClient().renderFrame(request);
      if (disposed) return;
      const bitmap = await createImageBitmap(result.image);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Transition preview canvas context unavailable");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      nativeLastFrameKeyRef.current = frameKey;
      capturePublishFrame(canvas, currentSec, mixProgress, recordStartTime, recordEndTime);
    };

    const render = (time: number) => {
      const videoA = videoARef.current;
      const videoB = videoBRef.current;
      const canvas = canvasRef.current;
      if (!canvas) { animId = requestAnimationFrame(render); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animId = requestAnimationFrame(render); return; }
      const start = performance.now();
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      const transitionStart = 5.0;
      const transitionEnd = transitionStart + duration;
      const totalDuration = transitionEnd + 5.0;
      let currentSec = sequenceTimeRef.current;
      if (playingRef.current && !isScrubbing) {
        if (currentSec < transitionEnd && videoA?.readyState && videoA.readyState >= 1) currentSec = Math.abs(videoA.currentTime - currentSec) > 0.3 ? currentSec + delta : videoA.currentTime;
        else if (currentSec >= transitionEnd && videoB?.readyState && videoB.readyState >= 1) currentSec = Math.max(transitionEnd, 5.0 + videoB.currentTime);
        else currentSec += delta;
        if (currentSec >= totalDuration) { currentSec = totalDuration; setPlaying(false); }
        sequenceTimeRef.current = currentSec;
        setProgress(currentSec / totalDuration);
      } else {
        currentSec = sequenceTimeRef.current;
        sequenceTimeRef.current = currentSec;
      }
      const mixProgress = currentSec >= transitionEnd ? 1 : currentSec >= transitionStart ? Math.max(0, Math.min(1, (currentSec - transitionStart) / duration)) : 0;
      const easedP = getProgressVal(mixProgress);
      const phase: "pre" | "transition" | "post" = currentSec < transitionStart ? "pre" : currentSec < transitionEnd ? "transition" : "post";
      const syncVideo = (video: HTMLVideoElement | null, target: number, shouldPlay: boolean) => {
        if (!video || video.readyState < 1) return;
        if (shouldPlay && playingRef.current && video.paused) video.play().catch(() => {});
        if (!shouldPlay && !video.paused) video.pause();
        if (Math.abs(video.currentTime - target) > 0.15) video.currentTime = Math.max(0, target);
      };
      syncVideo(videoA, Math.min(currentSec, transitionEnd), phase !== "post");
      syncVideo(videoB, Math.max(0, currentSec - transitionStart), phase !== "pre");
      const hasVideoA = !!(videoA && videoA.readyState >= 2);
      const hasVideoB = !!(videoB && videoB.readyState >= 2);
      const sourceA = (hasVideoA ? videoA : placeholderARef.current) as Source | null;
      const sourceB = (hasVideoB ? videoB : placeholderBRef.current) as Source | null;
      if (sourceA && sourceB) {
        const transitionType = nativeTransitionType(selectedTransition);
        const frameKey = `${phase}:${currentSec.toFixed(4)}:${selectedTransition}:${JSON.stringify(parameters)}:${fitMode}`;
        if (nativeLabState === "ready" && !nativeRequestInFlightRef.current && nativeLastFrameKeyRef.current !== frameKey) {
          renderNative(canvas, sourceA, sourceB, phase, mixProgress, easedP, frameKey, 5.0 - (Math.max(3, duration + 1) - duration) / 2, 5.0 + duration + (Math.max(3, duration + 1) - duration) / 2, currentSec).catch((error: unknown) => {
            nativeRequestInFlightRef.current = false;
            setNativeLabState("fallback");
            if (!nativeFallbackLoggedRef.current) { nativeFallbackLoggedRef.current = true; addLog(`[NATIVE] Transition frame rejected: ${error instanceof Error ? error.message : String(error)}. Browser fallback enabled.`); }
          }).finally(() => { nativeRequestInFlightRef.current = false; });
        } else if (nativeLabState !== "ready" || !transitionType || phase !== "transition") {
          if (nativeLabState === "ready" && phase === "transition" && !transitionType && !nativeFallbackLoggedRef.current) { nativeFallbackLoggedRef.current = true; addLog(`[NATIVE] Transition '${selectedTransition}' is not implemented in the native contract yet. Using explicit Canvas2D fallback.`); }
          drawFallback(ctx, sourceA, sourceB, phase, easedP, canvas.width, canvas.height);
          capturePublishFrame(canvas, currentSec, mixProgress, 5.0 - (Math.max(3, duration + 1) - duration) / 2, 5.0 + duration + (Math.max(3, duration + 1) - duration) / 2);
        }
      } else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIPS A/B (SIGNAL PENDING)");
      const now = performance.now();
      if (now - statsTimer >= 500) {
        setLatency(parseFloat((now - start).toFixed(2)));
        setCpuUsage(Math.round(9 + Math.random() * 8));
        setGpuUsage(nativeLabState === "ready" ? Math.round(25 + Math.random() * 15) : Math.round(8 + Math.random() * 10));
        if (playingRef.current) { setRedHeight(Math.round(20 + Math.random() * 70)); setGreenHeight(Math.round(30 + Math.random() * 60)); setBlueHeight(Math.round(40 + Math.random() * 50)); }
        statsTimer = now;
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(animId); videoARef.current?.pause(); videoBRef.current?.pause(); renderPhaseRef.current = "pre"; };
  }, [selectedTransition, duration, parameters, isScrubbing, fitMode, nativeLabState, addLog]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleResetContext = () => {
    const id = "cross-dissolve";
    setSelectedTransition(id);
    const trans = apiTransitions.find((t) => t.id === id);
    if (trans) {
      setParameters(trans.params ?? {});
      setDuration(trans.duration?.default ?? 2.0);
    }
    setProgress(0.0);
    setPlaying(false);
    addLog("[SYSTEM] Sequencer buffer reset to factory defaults.");
  };

  const handleDumpLog = () => {
    const logsTxt = logs.join("\n");
    const blob = new Blob([logsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transition_lab_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartPublish = () => {
    if (!isAdmin) {
      addLog("[ERROR] Only admin users can publish transitions.");
      return;
    }
    addLog("[PUBLISH] Preparing canvas and timeline for recording...");
    setPlaying(false);

    // Reset recording status
    thumbnailCapturedRef.current = false;
    recordedChunksRef.current = [];
    recordingStateRef.current = "requested";
    setIsRecording(true);

    const totalRecordDuration = Math.max(3.0, duration + 1.0);
    const startOffset = (totalRecordDuration - duration) / 2;
    const seekTime = 5.0 - startOffset - 0.3;

    const totalDuration = 10.0 + duration;
    setProgress(seekTime / totalDuration);
    sequenceTimeRef.current = seekTime;

    // Start playing
    setPlaying(true);
  };

  return (
    <div className="h-screen flex flex-col selection:bg-[#adc6ff] selection:text-[#002e6a]">
      {/* Dynamic layout/tokens injection */}
      <style>{`
        body {
          background-color: #060a14;
          color: #dae2fd;
          overflow: hidden;
          font-family: 'Hanken Grotesk', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          vertical-align: middle;
          font-size: 18px;
        }
        .timeline-trough {
          background: linear-gradient(90deg, #111827 1px, transparent 1px);
          background-size: 10px 100%;
        }
        .property-grid {
          display: grid;
          grid-template-columns: 80px 1fr;
          font-size: 10px;
        }
        .property-grid > div {
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bg-inverse-surface { background-color: #dae2fd; }
        .bg-outline-variant { background-color: #424754; }
        .border-outline-variant { border-color: #424754; }
        .bg-primary-container { background-color: #4d8eff; }
        .bg-on-surface { background-color: #dae2fd; }
        .bg-primary { background-color: #adc6ff; }
        .bg-secondary-container { background-color: #00a572; }
        .bg-outline { background-color: #8c909f; }
        .bg-primary-fixed { background-color: #d8e2ff; }
        .bg-on-primary-container { background-color: #00285d; }
        .bg-background { background-color: #060a14; }
        .bg-surface-container-highest { background-color: #2d3449; }
        .bg-on-surface-variant { background-color: #c2c6d6; }
        .bg-surface-container-low { background-color: #0d1424; }
        .bg-surface { background-color: #0b1326; }
        .bg-surface-container-lowest { background-color: #03070f; }
        .bg-surface-variant { background-color: #2d3449; }
        .bg-surface-container-high { background-color: #1a2336; }
        .bg-surface-container { background-color: #111827; }
        .bg-surface-bright { background-color: #31394d; }
        .bg-surface-dim { background-color: #0b1326; }
        .bg-tertiary { background-color: #ffb786; }
        .bg-secondary { background-color: #4edea3; }
        .bg-on-primary { background-color: #002e6a; }
        .bg-on-secondary { background-color: #003824; }
        .bg-on-tertiary { background-color: #502400; }
        .bg-error { background-color: #ffb4ab; }
        .bg-error-container { background-color: #93000a; }
        .bg-tertiary-container { background-color: #df7412; }
      `}</style>

      {/* Header bar */}
      <TopNavBar />

      {/* Main Layout mixer workspace */}
      <main className="flex-1 flex overflow-hidden">
        <SidebarLeft clipAFile={clipAFile} clipBFile={clipBFile} selectedTransition={selectedTransition} fitMode={fitMode} onClipAImport={handleClipAImport} onClipBImport={handleClipBImport} onSelectTransition={handleSelectTransition} onSetFitMode={setFitMode} transitions={apiTransitions} />

        <CanvasPreview
          videoARef={videoARef}
          videoBRef={videoBRef}
          canvasRef={canvasRef}
          timelineRef={timelineRef}
          clipAUrl={clipAUrl}
          clipBUrl={clipBUrl}
          playing={playing}
          progress={progress}
          duration={duration + 10.0}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          redHeight={redHeight}
          greenHeight={greenHeight}
          blueHeight={blueHeight}
          nativeLabState={nativeLabState}
          onSetPlaying={handleSetPlaying}
          onSkipStart={() => {
            setProgress(0);
            addLog("[SEEK] Set timeline to head (0.0)");
          }}
          onSkipEnd={() => {
            setProgress(1.0);
            addLog("[SEEK] Set timeline to tail (1.0)");
          }}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onMouseDown={handleMouseDown}
          onProgressSliderChange={(e) => setProgress(parseFloat(e.target.value))}
          onLoadedMetadataA={handleClipALoadedMetadata}
          onLoadedMetadataB={handleClipBLoadedMetadata}
          onClipAError={handleClipAError}
          onClipBError={handleClipBError}
        />

        <SidebarRight activeTab={activeTab} selectedTransition={selectedTransition} parameters={parameters} latency={latency} cpuUsage={cpuUsage} gpuUsage={gpuUsage} memUsage={memUsage} duration={duration} progress={progress} logs={logs} terminalEndRef={terminalEndRef} onSetActiveTab={setActiveTab} onParamChange={handleParamChange} onDumpLog={handleDumpLog} onResetContext={handleResetContext} onPublish={handleStartPublish} isRecording={isRecording} isAdmin={isAdmin} />
      </main>

      <PublishTransitionModal open={showPublishModal} onClose={() => setShowPublishModal(false)} transitionDef={apiTransitions.find((t) => t.id === selectedTransition) || null} thumbnailDataUrl={thumbnailDataUrl} previewDataUrl={previewDataUrl} />
    </div>
  );
}

export default TransitionLabView;
