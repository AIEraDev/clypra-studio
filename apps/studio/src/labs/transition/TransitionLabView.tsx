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
import { initializeFontSystem, ALL_TRANSITIONS, transitionEffectsById } from "@clypra-studio/engine";
import { Texture } from "pixi.js";

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";
import { PublishTransitionModal } from "../../components/PublishTransitionModal";

import { usePixiRenderer } from "./hooks/usePixiRenderer";

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
      renderer: string;
      params?: Record<string, any>;
      easing?: string;
      duration?: { min: number; max: number; default: number; step?: number };
      thumbnail?: string;
      preview?: string;
      tags?: string[];
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

  const pixiRendererRef = usePixiRenderer(
    canvasRef,
    1280,
    720,
    () => addLog("[INIT] WebGL PixiRenderer successfully initialized."),
    (err) => addLog(`[WARN] WebGL initialization failed: ${err.message}`),
  );

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

  // Main Preview Render loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let statsTimer = performance.now();

    // Clear diagnostic log each time the render loop restarts (e.g. transition switch)
    diagRef.current = [];
    diagFrameRef.current = 0;

    /**
     * logDiagnostic — captures one snapshot of the render state.
     * Fires a console.group summary at phase boundaries (event != null).
     * Batches frame snapshots into the ref so they can be dumped on demand.
     */
    const logDiagnostic = (sec: number, phase: string, mixProgress: number, activeTransitionId: string | null, hasVideoA: boolean, hasVideoB: boolean, videoA: HTMLVideoElement | null, videoB: HTMLVideoElement | null, sourceAType: string, sourceBType: string, event?: string) => {
      if (!DIAG_ENABLED) return;
      const frame = diagFrameRef.current++;
      const snap = {
        frame,
        sec: parseFloat(sec.toFixed(4)),
        phase,
        mixProgress: parseFloat(mixProgress.toFixed(4)),
        activeTransitionId,
        hasVideoA,
        hasVideoB,
        videoAReadyState: videoA?.readyState ?? -1,
        videoBReadyState: videoB?.readyState ?? -1,
        videoACurrentTime: parseFloat((videoA?.currentTime ?? 0).toFixed(4)),
        videoBCurrentTime: parseFloat((videoB?.currentTime ?? 0).toFixed(4)),
        sourceAType,
        sourceBType,
        event,
      };
      diagRef.current.push(snap);

      // Always log phase-boundary events to console
      if (event) {
        console.group(`%c[TRANSITION DIAG] ${event}`, "color:#adc6ff;font-weight:bold;background:#060a14;padding:2px 6px;border-radius:3px");
        console.log("⏱  seq time   :", sec.toFixed(4), "s  |  frame:", frame);
        console.log("🎬 phase       :", phase, "|  mixProgress:", mixProgress.toFixed(4));
        console.log("📹 videoA      : readyState=", videoA?.readyState ?? "N/A", " currentTime=", videoA?.currentTime?.toFixed(4) ?? "N/A", " paused=", videoA?.paused);
        console.log("📹 videoB      : readyState=", videoB?.readyState ?? "N/A", " currentTime=", videoB?.currentTime?.toFixed(4) ?? "N/A", " paused=", videoB?.paused);
        console.log("🖼  sourceA     :", sourceAType);
        console.log("🖼  sourceB     :", sourceBType);
        console.groupEnd();

        // Mirror to in-app log panel
        addLog(`[DIAG:${frame}] ${event} | sec=${sec.toFixed(3)} phase=${phase} mix=${mixProgress.toFixed(3)} A.rs=${videoA?.readyState ?? "?"} B.rs=${videoB?.readyState ?? "?"} activeId=${activeTransitionId ?? "none"}`);
      }
    };

    const render = (time: number) => {
      const videoA = videoARef.current;
      const videoB = videoBRef.current;
      const canvas = canvasRef.current;
      const renderer = pixiRendererRef.current;

      if (!canvas || !renderer || !renderer.isReady) {
        animId = requestAnimationFrame(render);
        return;
      }

      renderer.setFitMode(fitMode);

      const startGpuTime = performance.now();
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const transitionStart = 5.0;
      const transitionEnd = transitionStart + duration;
      const totalDuration = transitionEnd + 5.0;

      let currentSec = sequenceTimeRef.current;

      if (playingRef.current && !isScrubbing) {
        // Master Clock synchronization: align timeline to video native audio/video clock
        if (currentSec < transitionEnd) {
          if (videoA && videoA.readyState >= 1) {
            const targetA = Math.min(currentSec, videoA.duration);
            if (Math.abs(videoA.currentTime - targetA) > 0.3) {
              videoA.currentTime = targetA;
            } else {
              currentSec = videoA.currentTime;
            }
          } else {
            currentSec += delta;
          }
        } else {
          if (videoB && videoB.readyState >= 1) {
            const targetB = Math.min(currentSec - 5.0, videoB.duration);
            if (Math.abs(videoB.currentTime - targetB) > 0.3) {
              videoB.currentTime = targetB;
            } else {
              const rawSec = 5.0 + videoB.currentTime;
              // ─────────────────────────────────────────────────────────────
              // ROOT-CAUSE FIX: videoB's native clock can lag a few ms behind
              // the last recorded sequenceTime. If sequenceTimeRef has already
              // crossed transitionEnd, clamp the computed value so the phase
              // logic never sees a backward drift back into the transition
              // window. Without this clamp, every frame after the boundary
              // oscillates between "transition" and "post", causing
              // mount → unmount → blank flash → mount → unmount → …
              // ─────────────────────────────────────────────────────────────
              currentSec = sequenceTimeRef.current >= transitionEnd ? Math.max(transitionEnd, rawSec) : rawSec;
            }
          } else {
            currentSec += delta;
          }
        }

        if (currentSec >= totalDuration) {
          currentSec = totalDuration;
          setPlaying(false);
        }

        sequenceTimeRef.current = currentSec;
        setProgress(currentSec / totalDuration);
      } else {
        currentSec = progress * totalDuration;
        sequenceTimeRef.current = currentSec;
      }

      // Transition progress mixProgress (goes from 0.0 to 1.0 during transition phase)
      let mixProgress = 0.0;
      if (currentSec >= transitionEnd) {
        mixProgress = 1.0;
      } else if (currentSec >= transitionStart) {
        mixProgress = (currentSec - transitionStart) / duration;
      }
      const easedP = getProgressVal(mixProgress);

      const playVideo = (v: HTMLVideoElement) => {
        if (v.paused) {
          v.play().catch(() => {});
        }
      };

      const pauseVideo = (v: HTMLVideoElement) => {
        if (!v.paused) {
          v.pause();
        }
      };

      if (playingRef.current && !isScrubbing) {
        if (currentSec < transitionStart) {
          if (videoA && videoA.readyState >= 1) {
            playVideo(videoA);
            const targetA = Math.min(currentSec, videoA.duration);
            if (Math.abs(videoA.currentTime - targetA) > 0.15) {
              videoA.currentTime = targetA;
            }
            videoA.volume = 1.0;
          }
          if (videoB && videoB.readyState >= 1) {
            pauseVideo(videoB);
            if (Math.abs(videoB.currentTime) > 0.1) {
              videoB.currentTime = 0;
            }
            videoB.volume = 0.0;
          }
        } else if (currentSec < transitionEnd) {
          if (videoA && videoA.readyState >= 1) {
            playVideo(videoA);
            const targetA = Math.min(currentSec, videoA.duration);
            if (Math.abs(videoA.currentTime - targetA) > 0.15) {
              videoA.currentTime = targetA;
            }
            videoA.volume = Math.max(0, Math.min(1, 1.0 - mixProgress));
          }
          if (videoB && videoB.readyState >= 1) {
            playVideo(videoB);
            const targetB = Math.min(currentSec - 5.0, videoB.duration);
            if (Math.abs(videoB.currentTime - targetB) > 0.15) {
              videoB.currentTime = targetB;
            }
            videoB.volume = Math.max(0, Math.min(1, mixProgress));
          }
        } else {
          if (videoA && videoA.readyState >= 1) {
            pauseVideo(videoA);
            videoA.volume = 0.0;
          }
          if (videoB && videoB.readyState >= 1) {
            playVideo(videoB);
            const targetB = Math.min(currentSec - 5.0, videoB.duration);
            if (Math.abs(videoB.currentTime - targetB) > 0.15) {
              videoB.currentTime = targetB;
            }
            videoB.volume = 1.0;
          }
        }
      } else {
        if (videoA && videoA.readyState >= 1) {
          pauseVideo(videoA);
          const targetA = Math.min(Math.min(currentSec, transitionEnd), videoA.duration);
          if (Math.abs(videoA.currentTime - targetA) > 0.05) {
            videoA.currentTime = isNaN(targetA) ? 0 : targetA;
          }
        }
        if (videoB && videoB.readyState >= 1) {
          pauseVideo(videoB);
          const targetB = Math.min(Math.max(0, currentSec - transitionStart), videoB.duration);
          if (Math.abs(videoB.currentTime - targetB) > 0.05) {
            videoB.currentTime = isNaN(targetB) ? 0 : targetB;
          }
        }
      }

      // Check video stream readiness
      // readyState >= 2 (HAVE_CURRENT_DATA) ensures a decoded frame is available
      // for GPU upload — readyState == 1 (HAVE_METADATA) only gives dimensions/duration,
      // not pixel data, which would render as a black frame on the canvas.
      const hasVideoA = !!(videoA && videoA.readyState >= 2);
      const hasVideoB = !!(videoB && videoB.readyState >= 2);

      // Select active texture sources (video if imported, fallback canvas placeholder otherwise)
      const sourceA = hasVideoA ? videoA : placeholderARef.current;
      const sourceB = hasVideoB ? videoB : placeholderBRef.current;

      const sourceAType = hasVideoA ? `video(rs=${videoA!.readyState},t=${videoA!.currentTime.toFixed(3)})` : "placeholder-canvas";
      const sourceBType = hasVideoB ? `video(rs=${videoB!.readyState},t=${videoB!.currentTime.toFixed(3)})` : "placeholder-canvas";

      // Log every 60 frames (~1 second) so we have ambient breadcrumbs without spam
      if (DIAG_ENABLED && diagFrameRef.current % 60 === 0) {
        logDiagnostic(currentSec, renderPhaseRef.current, mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType);
      }

      if (sourceA && sourceB) {
        const texA = Texture.from(sourceA);
        const texB = Texture.from(sourceB);

        // Signal PixiJS to upload the current frame to GPU
        texA.source.update();
        texB.source.update();

        if (currentSec >= transitionStart && currentSec < transitionEnd) {
          // ── TRANSITION PHASE ──────────────────────────────────────────────
          // Get the actual GPU TransitionDefinition from the engine registry
          const gpuTransition = transitionEffectsById[selectedTransition];
          if (gpuTransition) {
            if (renderPhaseRef.current !== "transition" || renderer.getActiveTransitionId() !== selectedTransition) {
              logDiagnostic(currentSec, "transition", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `ENTERING TRANSITION PHASE — mounting "${selectedTransition}" (prev phase: ${renderPhaseRef.current}, prevActiveId: ${renderer.getActiveTransitionId() ?? "none"})`);

              // Entering transition phase (or switching transition mid-flight):
              // Prime the video sprite with texB BEFORE mounting so it is never
              // textureless when unmountTransition() re-shows it later.
              if (hasVideoB) {
                renderer.setVideoSource(videoB!);
                logDiagnostic(currentSec, "transition", mixProgress, null, hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "PRE-PRIME: setVideoSource(videoB) called before mountTransition");
              } else if (placeholderBRef.current) {
                renderer.setImageSource(placeholderBRef.current);
                logDiagnostic(currentSec, "transition", mixProgress, null, hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "PRE-PRIME: setImageSource(placeholderB) called — videoB not ready (readyState=" + (videoB?.readyState ?? "N/A") + ")");
              } else {
                logDiagnostic(currentSec, "transition", mixProgress, null, hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "WARNING: Neither videoB nor placeholderB available for pre-prime!");
              }

              // Mount the GPU transition with the actual TransitionDefinition
              renderer.mountTransition(gpuTransition, texA, texB, parameters);
              renderPhaseRef.current = "transition";

              logDiagnostic(currentSec, "transition", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `mountTransition() complete — activeId is now: ${renderer.getActiveTransitionId() ?? "STILL NULL (mount failed?)"}`);
            }
            renderer.updateTransitionProgress(selectedTransition, easedP, parameters);
          } else {
            logDiagnostic(currentSec, "transition", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `WARNING: No GPU transition found for id="${selectedTransition}" — transition skipped!`);
          }
        } else if (currentSec < transitionStart) {
          // ── PRE-TRANSITION PHASE ──────────────────────────────────────────
          if (renderPhaseRef.current !== "pre") {
            logDiagnostic(currentSec, "pre", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `ENTERING PRE PHASE — unmounting (prev phase: ${renderPhaseRef.current}, activeId: ${renderer.getActiveTransitionId() ?? "none"})`);
            // Crossed back into pre phase — unmount any active transition
            if (renderer.getActiveTransitionId() !== null) {
              renderer.unmountTransition();
            }
            renderPhaseRef.current = "pre";
          }
          // Update source every frame so the sprite tracks the live video
          if (hasVideoA) {
            renderer.setVideoSource(videoA!);
          } else if (placeholderARef.current) {
            renderer.setImageSource(placeholderARef.current);
          } else {
            logDiagnostic(currentSec, "pre", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "WARNING: No sourceA available in pre phase!");
          }
        } else {
          // ── POST-TRANSITION PHASE ─────────────────────────────────────────
          if (renderPhaseRef.current !== "post") {
            logDiagnostic(currentSec, "post", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `ENTERING POST PHASE — unmounting (prev phase: ${renderPhaseRef.current}, activeId: ${renderer.getActiveTransitionId() ?? "none"})`);
            // Crossing the transitionEnd boundary: unmount the transition filter.
            // The video sprite was already primed with texB when we entered the
            // transition phase, so it will show the correct clip immediately.
            if (renderer.getActiveTransitionId() !== null) {
              renderer.unmountTransition();
              logDiagnostic(currentSec, "post", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, `unmountTransition() complete — activeId after unmount: ${renderer.getActiveTransitionId() ?? "null (OK)"}`);
            } else {
              logDiagnostic(currentSec, "post", mixProgress, null, hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "POST PHASE: No active transition to unmount — transition may have never mounted?");
            }
            renderPhaseRef.current = "post";
          }
          // Update source every frame so the sprite tracks the live video
          if (hasVideoB) {
            renderer.setVideoSource(videoB!);
          } else if (placeholderBRef.current) {
            renderer.setImageSource(placeholderBRef.current);
          } else {
            logDiagnostic(currentSec, "post", mixProgress, renderer.getActiveTransitionId(), hasVideoA, hasVideoB, videoA, videoB, sourceAType, sourceBType, "WARNING: No sourceB available in post phase!");
          }
        }
      }

      // Run PixiJS rendering pass
      renderer.render();

      // Hook for MediaRecorder and thumbnail capture
      const totalRecordDuration = Math.max(3.0, duration + 1.0);
      const startOffset = (totalRecordDuration - duration) / 2;
      const recordStartTime = 5.0 - startOffset;
      const recordEndTime = 5.0 + duration + startOffset;

      if (recordingStateRef.current === "requested" && currentSec >= recordStartTime) {
        const stream = canvas.captureStream(30);
        let options = { mimeType: "video/webm;codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm;codecs=vp8" };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }

        try {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(stream, {
            mimeType: options.mimeType,
            videoBitsPerSecond: 1500000,
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewDataUrl(reader.result as string);
              setShowPublishModal(true);
              setIsRecording(false);
              addLog("[PUBLISH] Video recording completed! Form is ready.");
            };
            reader.readAsDataURL(blob);
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          recordingStateRef.current = "recording";
          addLog("[PUBLISH] MediaRecorder started recording canvas.");
        } catch (e: any) {
          console.error("Failed to start MediaRecorder", e);
          recordingStateRef.current = "idle";
          setIsRecording(false);
          addLog(`[WARN] MediaRecorder start error: ${e.message}`);
        }
      }

      // Capture thumbnail frame at exactly 50% progress
      if (recordingStateRef.current === "recording" && mixProgress >= 0.5 && !thumbnailCapturedRef.current) {
        thumbnailCapturedRef.current = true;
        const thumbUrl = canvas.toDataURL("image/png");
        setThumbnailDataUrl(thumbUrl);
        addLog("[PUBLISH] Mid-transition thumbnail captured.");
      }

      // Stop recording once transition ends
      if (recordingStateRef.current === "recording" && currentSec >= recordEndTime) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        recordingStateRef.current = "idle";
      }

      const now = performance.now();
      const frameDelta = now - startGpuTime;

      if (now - statsTimer >= 500) {
        setLatency(parseFloat(frameDelta.toFixed(2)));
        setCpuUsage(Math.round(9 + Math.random() * 8));
        setGpuUsage(Math.round(20 + Math.random() * 15));
        if (playingRef.current) {
          setRedHeight(Math.round(20 + Math.random() * 70));
          setGreenHeight(Math.round(30 + Math.random() * 60));
          setBlueHeight(Math.round(40 + Math.random() * 50));
        }
        statsTimer = now;
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      if (videoARef.current) videoARef.current.pause();
      if (videoBRef.current) videoBRef.current.pause();
      // Reset phase tracking so the next loop starts fresh
      renderPhaseRef.current = "pre";
      // Dump full diagnostic snapshot to console on cleanup
      if (DIAG_ENABLED && diagRef.current.length > 0) {
        console.group("%c[TRANSITION DIAG] Full session snapshot (" + diagRef.current.length + " frames)", "color:#4edea3;font-weight:bold");
        console.table(diagRef.current.filter((s) => s.event != null));
        console.groupEnd();
      }
    };
  }, [selectedTransition, duration, parameters, isScrubbing, fitMode]);

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
