/**
 * Video Effect Lab — Package Integration & Modular Component Edition
 *
 * Coordinates states and render logic across the following subcomponents:
 *  - TopNavBar (top menu and fx stats)
 *  - SidebarLeft (media loading, scaling options, search and dynamic FX registry list)
 *  - CanvasPreview (live webgl/canvas renderer canvas, sequencer, timeline scrub, stats footer)
 *  - SidebarRight (parameters inspector, topological nodes tree, debug console terminal)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  initializeFontSystem,
  EffectEngine,
  EffectGraph,
  EffectRenderer,
  EFFECTS_REGISTRY,
  getEffectsByCategory,
  type EffectMetadata,
} from "@clypra-studio/engine";
import type { EffectParameters } from "@clypra-studio/engine";
import type { NativeLabFrameRequest } from "../../services/nativeLabClient";
import {
  createDefaultProviderManager,
  FeatureMapType,
  type FeatureProviderManager,
} from "@clypra-studio/feature-providers";
import { getNativeLabClient } from "../../services/nativeLabClient";

// ─── Component Imports ───────────────────────────────────────────────────────

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";
import { PublishVideoEffectModal } from "../../components/PublishVideoEffectModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const IDENTITY_EFFECT_ID = "__identity__";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  light: "Light",
  glitch: "Glitch",
  retro: "Retro",
  motion: "Motion",
  color: "Color",
  cinematic: "Cinematic",
  distortion: "Distortion",
  body: "Body",
  essentials: "Essentials",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawSMPTEBars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0c101a";
  ctx.fillRect(0, 0, w, h);
  const colors = [
    "#c0c0c0",
    "#ffff00",
    "#00ffff",
    "#00ff00",
    "#ff00ff",
    "#ff0000",
    "#0000ff",
  ];
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
  ctx.fillText(
    "SMPTE_TEST_PATTERN (SIGNAL PENDING)",
    w / 2,
    topH + (h - topH) / 2,
  );
}

/** Build a 2-node graph: source → effect */
function buildEffectGraph(
  effectId: string,
  params: EffectParameters,
): EffectGraph {
  const graph = new EffectGraph();
  graph.addNode({ id: "source", type: "source" });
  graph.addNode({ id: "effect", type: effectId, params });
  graph.addEdge("source", "effect");
  return graph;
}

type NativeColorGrade = Record<string, unknown>;

function numericParam(
  params: EffectParameters,
  key: string,
  fallback = 0,
): number {
  const value = Number(params[key]);
  return Number.isFinite(value) ? value : fallback;
}

function colorParam(
  value: unknown,
  fallback: [number, number, number],
): [number, number, number] {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return fallback;
  return [
    parseInt(match[1].slice(0, 2), 16) / 255,
    parseInt(match[1].slice(2, 4), 16) / 255,
    parseInt(match[1].slice(4, 6), 16) / 255,
  ];
}

/**
 * Maps the Studio effect registry into the shared native color/effect contract.
 * Returning null is deliberate: unsupported effects must use the existing
 * browser fallback rather than being mislabeled as native identity output.
 */
function nativeColorGradeForEffect(
  effectId: string,
  params: EffectParameters,
  time: number,
): NativeColorGrade | null {
  const id = effectId.toLowerCase();
  const grade: NativeColorGrade = {};

  if (id === IDENTITY_EFFECT_ID) return grade;

  if (id === "color-adjustments") {
    return {
      exposure: numericParam(params, "exposure"),
      brightness: numericParam(params, "brightness"),
      contrast: 1 + numericParam(params, "contrast"),
      saturation: 1 + numericParam(params, "saturation"),
      temperature: numericParam(params, "temperature"),
      tint: numericParam(params, "tint"),
      sepia: numericParam(params, "sepia"),
      grayscale: numericParam(params, "grayscale"),
      hueRotate: numericParam(params, "hueRotate"),
      vignette: numericParam(params, "vignette"),
      invert: numericParam(params, "invert"),
      blurStrength: numericParam(params, "blur") > 0 ? 1 : 0,
      blurRadius: numericParam(params, "blur"),
    };
  }

  if (id === "color-matrix" || id === "cinematic-lut") {
    const brightness = numericParam(params, "brightness", 1);
    const contrast = numericParam(params, "contrast", 1);
    const saturation = numericParam(params, "saturation", 1);
    return {
      brightness: brightness - 1,
      contrast,
      saturation,
      hueRotate:
        id === "color-matrix"
          ? (numericParam(params, "hue") * Math.PI) / 180
          : 0,
      lutIntensity: numericParam(params, "lutIntensity", 0.8),
    };
  }

  if (id === "hsl-adjustment") {
    return {
      brightness: numericParam(params, "lightness"),
      saturation: 1 + numericParam(params, "saturation"),
      hueRotate: (numericParam(params, "hue") * Math.PI) / 180,
    };
  }

  if (id === "grayscale") return { grayscale: 1 };
  if (id === "vignette")
    return { vignette: Math.max(0, 1 - numericParam(params, "radius", 0.7)) };
  if (id === "pixelate")
    return {
      pixelateSize: Math.max(
        numericParam(params, "sizeX", 10),
        numericParam(params, "sizeY", 10),
      ),
    };
  if (id === "gaussian-blur" || id === "kawase-blur") {
    return { blurStrength: 1, blurRadius: numericParam(params, "blur", 8) };
  }

  if (id === "film-grain") {
    return {
      grainIntensity: numericParam(params, "intensity", 0.25),
      grainSize: numericParam(params, "size", 2),
    };
  }
  if (id === "static-noise")
    return {
      grainIntensity: numericParam(params, "noise", 0.15),
      grainSize: 1,
    };
  if (id === "old-film") {
    return {
      sepia: numericParam(params, "sepia", 0.3),
      grainIntensity: numericParam(params, "noise", 0.15),
      grainSize: numericParam(params, "noiseSize", 1),
      vignette: numericParam(params, "vignetting", 0.3),
    };
  }
  if (id === "vhs" || id === "crt") {
    return {
      grainIntensity: numericParam(params, "noise", 0.1),
      grainSize: 1,
      scanlineCount: id === "vhs" ? 180 : 240,
      scanlineIntensity:
        id === "vhs"
          ? numericParam(params, "lineAlpha", 0.25)
          : numericParam(params, "lineContrast", 0.25),
      rgbSplitX: id === "vhs" ? numericParam(params, "hShift") * 1280 : 0,
      vignette: numericParam(params, "vignetting", 0.0),
    };
  }
  if (id === "rgb-split") {
    return {
      rgbSplitX:
        (numericParam(params, "redX", 4) - numericParam(params, "blueX", -4)) /
        2,
      rgbSplitY:
        (numericParam(params, "redY") - numericParam(params, "blueY")) / 2,
    };
  }
  if (id === "glitch-band" || id === "glitch_band") {
    return {
      glitchIntensity: Math.min(1, numericParam(params, "offset", 80) / 400),
      glitchTime: time,
      glitchSliceCount: numericParam(params, "slices", 15),
      glitchColorShift: Math.abs(
        numericParam(params, "redX", -3) - numericParam(params, "blueX", 3),
      ),
    };
  }

  if (id === "shockwave") {
    return {
      distortionType: 2,
      distortionStrength: numericParam(params, "amplitude", 30) / 100,
      distortionTime: time * numericParam(params, "speed", 1.5),
      distortionFrequency: Math.max(
        1,
        160 / Math.max(1, numericParam(params, "wavelength", 160)),
      ),
    };
  }
  if (id === "bulge-pinch" || id === "bulge_pinch") {
    return {
      distortionType: 3,
      distortionStrength: numericParam(params, "strength", 0.5),
      distortionTime: time * numericParam(params, "speed", 1.5),
      distortionFrequency: Math.max(
        1,
        600 / Math.max(1, numericParam(params, "radius", 200)),
      ),
    };
  }
  if (id === "twist") {
    return {
      distortionType: 4,
      distortionStrength: numericParam(params, "angle", 4) / 15,
      distortionTime: time * numericParam(params, "speed", 1),
      distortionFrequency: Math.max(
        1,
        800 / Math.max(1, numericParam(params, "radius", 300)),
      ),
    };
  }

  if (id === "fire") {
    const c1 = colorParam(params.fireColor1, [1, 0.27, 0]);
    const c2 = colorParam(params.fireColor2, [1, 0.65, 0]);
    const c3 = colorParam(params.fireColor3, [1, 0.84, 0]);
    return {
      fireParams: [
        numericParam(params, "fireHeight", 0.4),
        numericParam(params, "particleCount", 50),
        1,
        time,
      ],
      fireColor1: [...c1, 0],
      fireColor2: [...c2, 0],
      fireColor3: [...c3, 0],
    };
  }
  if (id === "particles" || id === "dust_particles") {
    const color = colorParam(
      params.particleColor,
      id === "particles" ? [1, 1, 1] : [0.88, 0.88, 0.88],
    );
    return {
      particleParams: [
        numericParam(params, "particleCount", 60),
        numericParam(params, "particleSize", 2),
        numericParam(params, "driftSpeed", 1),
        1,
      ],
      particleColor: [
        ...color,
        id === "particles" && params.fadeEffect === false ? 0 : 0.5,
      ],
      particleTime: time,
    };
  }

  if (id === "glow" || id === "neon-glow" || id === "body-segmentation-glow") {
    const color = colorParam(params.glowColor ?? params.color, [1, 1, 1]);
    return {
      glowColorR: color[0],
      glowColorG: color[1],
      glowColorB: color[2],
      glowStrength: numericParam(
        params,
        "glowAmount",
        numericParam(params, "outerStrength", 1),
      ),
      glowRadius: numericParam(
        params,
        "glowRadius",
        numericParam(params, "distance", 10),
      ),
    };
  }
  if (id === "light_leak" || id === "light-leak" || id === "light_leak_2") {
    const color = colorParam(params.color1 ?? params.color, [1, 0.4, 0.1]);
    return {
      lightLeakColorR: color[0],
      lightLeakColorG: color[1],
      lightLeakColorB: color[2],
      lightLeakStrength: numericParam(
        params,
        "alpha",
        numericParam(params, "gain", 0.6),
      ),
      lightLeakAngle: (numericParam(params, "angle", 30) * Math.PI) / 180,
      lightLeakTime: time * numericParam(params, "speed", 1),
    };
  }
  if (id === "flash") {
    const color = colorParam(params.flashColor, [1, 1, 1]);
    return {
      flashColorR: color[0],
      flashColorG: color[1],
      flashColorB: color[2],
      flashStrength: numericParam(params, "flashIntensity", 1),
    };
  }
  if (id === "flicker")
    return {
      flickerStrength: 0.25,
      strobeFrequency: 8,
      strobeTime: time,
      strobeStrength: 0.25,
    };

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VideoLabView() {
  // ── Font system ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      initializeFontSystem();
    } catch (e) {
      console.warn("Font system initialization bypassed or already run", e);
    }
  }, []);

  // ── Engine ref (stable, never recreated) ─────────────────────────────────
  const engineRef = useRef<EffectEngine>(new EffectEngine());

  // ── Feature provider manager (for body effects) ───────────────────────────
  const providerManagerRef = useRef<FeatureProviderManager | null>(null);
  const [bodyTrackingStatus, setBodyTrackingStatus] = useState<
    "idle" | "loading" | "active" | "error"
  >("idle");
  const bodyMaskRef = useRef<ImageData | null>(null);

  // ── Media state ───────────────────────────────────────────────────────────
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15.02);
  const [fitMode, setFitMode] = useState<"stretch" | "fit" | "crop">("fit");

  // ── Effect selection & params ─────────────────────────────────────────────
  const [selectedEffectId, setSelectedEffectId] =
    useState<string>(IDENTITY_EFFECT_ID);
  const [parameters, setParameters] = useState<EffectParameters>({});

  // ── Effect sidebar state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── UI tabs ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"inspector" | "nodes" | "stats">(
    "inspector",
  );

  // ── Telemetry (real frame timings) ────────────────────────────────────────
  const [latency, setLatency] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [gpuUsage, setGpuUsage] = useState(0);
  const [memUsage, setMemUsage] = useState("—");
  const [fps, setFps] = useState(0);
  const [nativeLabState, setNativeLabState] = useState<
    "probing" | "ready" | "fallback"
  >("probing");

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStateRef = useRef<"idle" | "requested" | "recording">("idle");
  const thumbnailCapturedRef = useRef<boolean>(false);
  const [redHeight, setRedHeight] = useState(60);
  const [greenHeight, setGreenHeight] = useState(85);
  const [blueHeight, setBlueHeight] = useState(40);

  // ── Logs ──────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<string[]>([
    "[INIT] Pipeline console starting...",
    "[OK] EffectEngine v1 initialized.",
    "[OK] EFFECTS_REGISTRY loaded — " +
      Object.keys(EFFECTS_REGISTRY).length +
      " effects.",
    "[INFO] Ready. Load media or select an effect.",
  ]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeSourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeRequestInFlightRef = useRef(false);
  const nativeLastFrameKeyRef = useRef("");
  const nativeFallbackLoggedRef = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // ── Logger ────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, []);

  // Probe once per lab mount. The browser renderer remains available for
  // unsupported effects or when the local native daemon is not running.
  useEffect(() => {
    let cancelled = false;
    getNativeLabClient()
      .handshake()
      .then((handshake) => {
        if (cancelled) return;
        if (handshake.gpu.available && handshake.gpu.state === "ready") {
          setNativeLabState("ready");
          addLog(
            `[NATIVE] GPU ready: ${
              handshake.gpu.adapterName ?? "unknown adapter"
            } (${handshake.gpu.backend ?? "unknown backend"})`,
          );
        } else {
          setNativeLabState("fallback");
          addLog(
            `[NATIVE] Unavailable: ${
              handshake.gpu.failureReason ?? "GPU adapter unavailable"
            }. Browser fallback enabled.`,
          );
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNativeLabState("fallback");
        addLog(
          `[NATIVE] Daemon unavailable: ${
            error instanceof Error ? error.message : String(error)
          }. Browser fallback enabled.`,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [addLog]);

  // ── Computed: all unique categories from the registry ─────────────────────
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(EFFECTS_REGISTRY).forEach((e) => cats.add(e.category));
    return ["all", ...Array.from(cats).sort()];
  }, []);

  // ── Computed: filtered effect list ───────────────────────────────────────
  const filteredEffects = useMemo<EffectMetadata[]>(() => {
    let effects: EffectMetadata[];
    if (activeCategory === "all") {
      effects = Object.values(EFFECTS_REGISTRY);
    } else {
      effects = getEffectsByCategory(activeCategory as any);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      effects = effects.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return effects;
  }, [activeCategory, searchQuery]);

  // ── Selected effect metadata ──────────────────────────────────────────────
  const selectedMeta = useMemo<EffectMetadata | null>(() => {
    if (selectedEffectId === IDENTITY_EFFECT_ID) return null;
    return EFFECTS_REGISTRY[selectedEffectId] ?? null;
  }, [selectedEffectId]);

  // ── Effect selection handler ──────────────────────────────────────────────
  const handleSelectEffect = useCallback(
    (effectId: string) => {
      setSelectedEffectId(effectId);

      if (effectId === IDENTITY_EFFECT_ID) {
        engineRef.current.unloadGraph();
        setParameters({});
        addLog("[EFFECT] Buffer set to IDENTITY (pass-through)");
        // Tear down body tracking if active
        if (providerManagerRef.current) {
          providerManagerRef.current.dispose();
          providerManagerRef.current = null;
          bodyMaskRef.current = null;
          setBodyTrackingStatus("idle");
        }
        return;
      }

      const meta = EFFECTS_REGISTRY[effectId];
      if (!meta) return;

      // Initialise params from defaults
      const defaultParams: EffectParameters = {};
      for (const [key, schema] of Object.entries(meta.parameterSchema)) {
        defaultParams[key] = schema.default;
      }
      setParameters(defaultParams);

      // Build and load the graph
      const graph = buildEffectGraph(effectId, defaultParams);
      engineRef.current.loadGraph(graph);

      addLog(
        `[EFFECT] Active: ${meta.name} (${meta.category}) — ${meta.description}`,
      );

      // Initialise body tracking if this is a body effect
      if (meta.category === "body") {
        setBodyTrackingStatus("loading");
        addLog("[BODY] Initializing body segmentation provider...");
        const manager = createDefaultProviderManager();
        providerManagerRef.current = manager;
        manager
          .activate("segmentation")
          .then(() => {
            setBodyTrackingStatus("active");
            addLog("[BODY] Segmentation provider ready.");
          })
          .catch((err: unknown) => {
            setBodyTrackingStatus("error");
            addLog(
              `[WARN] Body tracking failed: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          });
      } else {
        // Tear down body tracking when leaving body category
        if (providerManagerRef.current) {
          providerManagerRef.current.dispose();
          providerManagerRef.current = null;
          bodyMaskRef.current = null;
          setBodyTrackingStatus("idle");
        }
      }
    },
    [addLog],
  );

  // ── Parameter change handler ──────────────────────────────────────────────
  const handleParamChange = useCallback(
    (key: string, value: any) => {
      setParameters((prev) => {
        const next = { ...prev, [key]: value };
        // Rebuild the graph with updated params
        if (selectedEffectId !== IDENTITY_EFFECT_ID) {
          const graph = buildEffectGraph(selectedEffectId, next);
          engineRef.current.loadGraph(graph);
        }
        return next;
      });
    },
    [selectedEffectId],
  );

  // ── Media import ──────────────────────────────────────────────────────────
  const handleVideoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(
        `[IMPORT] Loading: ${file.name} (${(file.size / 1024 / 1024).toFixed(
          2,
        )} MB)`,
      );
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      nativeLastFrameKeyRef.current = "";
      setPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const newDur = videoRef.current.duration;
      setDuration(newDur);
      addLog(
        `[MEDIA] Source ready. ${videoRef.current.videoWidth}x${
          videoRef.current.videoHeight
        }, ${newDur.toFixed(2)}s`,
      );
    }
  };

  const handleVideoError = () => {
    addLog(
      "[WARN] Media buffer load failed. Defaulting to SMPTE test signals.",
    );
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // ── Playback controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch((err) => {
        addLog(`[WARN] Playback blocked: ${err.message}`);
        setPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [playing, addLog]);

  const handleSkipPrev = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };
  const handleSkipNext = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
    }
  };

  const handleStartPublish = () => {
    const video = videoRef.current;
    if (!video) {
      addLog("[WARN] Video element not initialized. Cannot publish.");
      return;
    }
    if (selectedEffectId === IDENTITY_EFFECT_ID) {
      addLog(
        "[WARN] Cannot publish the Identity (none) effect. Please select a video effect first.",
      );
      return;
    }

    addLog("[PUBLISH] Preparing canvas and video timeline for recording...");
    setPlaying(false);

    // Reset recording status
    thumbnailCapturedRef.current = false;
    recordedChunksRef.current = [];
    recordingStateRef.current = "requested";
    setIsRecording(true);

    // Seek to 0.7 seconds (0.3s before recording window starts at 1.0)
    video.currentTime = 0.7;
    setCurrentTime(0.7);

    // Start playing
    setPlaying(true);
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const t = Math.max(0, videoRef.current.currentTime - 2);
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };
  const handleFastForward = () => {
    if (videoRef.current) {
      const t = Math.min(duration, videoRef.current.currentTime + 2);
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  // ── Timeline scrubbing ────────────────────────────────────────────────────
  const handleTimelineScrub = useCallback(
    (clientX: number) => {
      if (!timelineRef.current || duration <= 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = pct * duration;
      setCurrentTime(newTime);
      if (videoRef.current) videoRef.current.currentTime = newTime;
    },
    [duration],
  );

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
        addLog(`[SEEK] Scrub complete: ${formatTimecode(currentTime)}`);
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
  }, [isScrubbing, handleTimelineScrub, currentTime, addLog]);

  // ── Jog Wheel Drag Handling ────────────────────────────────────────────────
  const handleJogWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const handleMouseMove = (mvEvent: MouseEvent) => {
      const delta = (mvEvent.clientX - startX) * 0.05;
      if (videoRef.current) {
        const target = Math.max(
          0,
          Math.min(duration, videoRef.current.currentTime + delta),
        );
        videoRef.current.currentTime = target;
        setCurrentTime(target);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Helper formatting for jogs
  function formatTimecode(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const f = Math.floor((secs % 1) * 60);
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f
      .toString()
      .padStart(2, "0")}`;
  }

  // ── Body mask update loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (bodyTrackingStatus !== "active" || !providerManagerRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    let frameId: number;
    const processFrame = async () => {
      try {
        if (video.readyState >= 2 && providerManagerRef.current) {
          const features = await providerManagerRef.current.process(video);
          const maskFeature = features.get(FeatureMapType.Mask);
          if (maskFeature) {
            const maskData = maskFeature.data as any;
            if (maskData?.texture instanceof HTMLCanvasElement) {
              const ctx = maskData.texture.getContext("2d");
              if (ctx) {
                bodyMaskRef.current = ctx.getImageData(
                  0,
                  0,
                  maskData.texture.width,
                  maskData.texture.height,
                );
              }
            }
          }
        }
      } catch {
        // Silently fail — body tracking is best-effort
      }
      frameId = requestAnimationFrame(processFrame);
    };

    frameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(frameId);
  }, [bodyTrackingStatus]);

  // ── Main render loop: native raster bridge first, browser fallback second ─
  useEffect(() => {
    let animId: number;
    let disposed = false;
    let statsTimer = performance.now();
    let frameCount = 0;
    let frameTimeAccum = 0;

    const drawSource = (
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement,
      width: number,
      height: number,
    ) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const videoRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;
      if (fitMode === "crop") {
        if (videoRatio > canvasRatio) {
          drawW = height * videoRatio;
          drawX = (width - drawW) / 2;
        } else {
          drawH = width / videoRatio;
          drawY = (height - drawH) / 2;
        }
      } else if (fitMode === "fit") {
        if (videoRatio > canvasRatio) {
          drawH = width / videoRatio;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * videoRatio;
          drawX = (width - drawW) / 2;
        }
      }
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
    };

    const updateTelemetry = (frameDelta: number) => {
      frameTimeAccum += frameDelta;
      frameCount++;
      const now = performance.now();
      if (now - statsTimer >= 500) {
        const avgLatency = frameTimeAccum / Math.max(1, frameCount);
        setLatency(parseFloat(avgLatency.toFixed(2)));
        setFps(Math.round(1000 / Math.max(1, avgLatency)));
        setCpuUsage(Math.min(99, Math.round(avgLatency * 2)));
        setGpuUsage(
          nativeLabState === "ready"
            ? Math.round(25 + Math.random() * 20)
            : Math.round(5 + Math.random() * 15),
        );
        const perfAny = performance as any;
        if (perfAny.memory) {
          const usedMB = (perfAny.memory.usedJSHeapSize / 1024 / 1024).toFixed(
            1,
          );
          const totalMB = (
            perfAny.memory.jsHeapSizeLimit /
            1024 /
            1024
          ).toFixed(0);
          setMemUsage(`${usedMB}MB/${totalMB}MB`);
        }
        if (playing) {
          setRedHeight(Math.round(30 + Math.random() * 60));
          setGreenHeight(Math.round(40 + Math.random() * 55));
          setBlueHeight(Math.round(20 + Math.random() * 70));
        }
        statsTimer = now;
        frameCount = 0;
        frameTimeAccum = 0;
      }
    };

    const capturePublishFrame = (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
    ) => {
      if (
        recordingStateRef.current === "requested" &&
        video.currentTime >= 1.0
      ) {
        const stream = canvas.captureStream(30);
        let options = { mimeType: "video/webm;codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType))
          options = { mimeType: "video/webm;codecs=vp8" };
        if (!MediaRecorder.isTypeSupported(options.mimeType))
          options = { mimeType: "video/webm" };
        try {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(stream, {
            mimeType: options.mimeType,
            videoBitsPerSecond: 1500000,
          });
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0)
              recordedChunksRef.current.push(event.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, {
              type: options.mimeType,
            });
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
          addLog(
            `[PUBLISH] MediaRecorder started recording ${
              nativeLabState === "ready" ? "native" : "browser"
            } canvas.`,
          );
        } catch (error: any) {
          recordingStateRef.current = "idle";
          setIsRecording(false);
          addLog(`[WARN] MediaRecorder start error: ${error.message}`);
        }
      }
      if (
        recordingStateRef.current === "recording" &&
        video.currentTime >= 2.5 &&
        !thumbnailCapturedRef.current
      ) {
        thumbnailCapturedRef.current = true;
        setThumbnailDataUrl(canvas.toDataURL("image/png"));
        addLog("[PUBLISH] Mid-effect thumbnail captured.");
      }
      if (
        recordingStateRef.current === "recording" &&
        video.currentTime >= 4.0
      ) {
        if (mediaRecorderRef.current?.state === "recording")
          mediaRecorderRef.current.stop();
        recordingStateRef.current = "idle";
      }
    };

    const renderNative = async (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      grade: NativeColorGrade,
      frameKey: string,
    ) => {
      const sourceCanvas =
        nativeSourceCanvasRef.current ?? document.createElement("canvas");
      nativeSourceCanvasRef.current = sourceCanvas;
      sourceCanvas.width = 640;
      sourceCanvas.height = 360;
      const sourceCtx = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sourceCtx)
        throw new Error("Unable to create native source raster context");
      drawSource(sourceCtx, video, sourceCanvas.width, sourceCanvas.height);
      const rgba = Array.from(
        sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
          .data,
      );
      const frameIndex = Math.max(0, Math.floor(video.currentTime * 60));
      const request: NativeLabFrameRequest = {
        contractVersion: 1,
        requestId: `studio-video-${Date.now()}-${frameIndex}`,
        frameTime: {
          frameIndex,
          ticks: Math.floor(video.currentTime * 1_000_000),
          timescale: 1_000_000,
        },
        project: {
          schemaVersion: 1,
          projectRevision: `video-lab-${frameKey}`,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          clearColor: [0, 0, 0, 1],
          videoLayers: [],
          rasterLayers: [
            {
              assetId: "studio-video-source",
              rgba,
              width: sourceCanvas.width,
              height: sourceCanvas.height,
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              blendMode: "normal",
              colorGrade: grade,
            },
          ],
          transition: null,
        },
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        quality: "full",
        colorPolicy: {
          version: 1,
          workingSpace: "linear-rec709",
          outputFormat: "rgba8Srgb",
          toneMapHdrToSdr: true,
          displayProfile: "srgb-reference",
        },
        renderGraphVersion: 1,
      };

      nativeRequestInFlightRef.current = true;
      const result = await getNativeLabClient().renderFrame(request);
      if (disposed) return;
      const bitmap = await createImageBitmap(result.image);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      nativeLastFrameKeyRef.current = frameKey;
      capturePublishFrame(video, canvas);
    };

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }
      const frameStart = performance.now();

      if (video && video.readyState >= 2) {
        const grade = nativeColorGradeForEffect(
          selectedEffectId,
          parameters,
          video.currentTime,
        );
        const frameKey = `${video.currentTime.toFixed(
          4,
        )}:${selectedEffectId}:${JSON.stringify(parameters)}:${fitMode}`;
        if (
          nativeLabState === "ready" &&
          grade &&
          !nativeRequestInFlightRef.current &&
          nativeLastFrameKeyRef.current !== frameKey
        ) {
          renderNative(video, canvas, ctx, grade, frameKey)
            .catch((error: unknown) => {
              nativeRequestInFlightRef.current = false;
              setNativeLabState("fallback");
              if (!nativeFallbackLoggedRef.current) {
                nativeFallbackLoggedRef.current = true;
                addLog(
                  `[NATIVE] Video frame rejected: ${
                    error instanceof Error ? error.message : String(error)
                  }. Browser fallback enabled.`,
                );
              }
            })
            .finally(() => {
              nativeRequestInFlightRef.current = false;
            });
        } else if (nativeLabState !== "ready" || !grade) {
          drawSource(ctx, video, canvas.width, canvas.height);
          if (selectedEffectId !== IDENTITY_EFFECT_ID) {
            const meta = EFFECTS_REGISTRY[selectedEffectId];
            if (meta)
              EffectRenderer.apply(
                ctx,
                selectedEffectId as any,
                parameters,
                1.0,
                currentTime,
                bodyMaskRef.current ?? undefined,
              );
          }
          capturePublishFrame(video, canvas);
        }
      } else {
        drawSMPTEBars(ctx, canvas.width, canvas.height);
      }

      updateTelemetry(performance.now() - frameStart);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
    };
  }, [
    selectedEffectId,
    fitMode,
    parameters,
    playing,
    currentTime,
    videoUrl,
    nativeLabState,
    addLog,
  ]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleResetContext = () => {
    handleSelectEffect(IDENTITY_EFFECT_ID);
    setSearchQuery("");
    setActiveCategory("all");
    addLog("[SYSTEM] Render context reset to factory identity standards.");
  };

  // ── Dump logs ─────────────────────────────────────────────────────────────
  const handleDumpLog = () => {
    const logsTxt = logs.join("\n");
    const blob = new Blob([logsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_lab_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("[OK] Diagnostics logs dumped.");
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
          grid-template-columns: 90px 1fr;
          font-size: 10px;
        }
        .property-grid > div {
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .effect-list::-webkit-scrollbar { width: 4px; }
        .effect-list::-webkit-scrollbar-track { background: transparent; }
        .effect-list::-webkit-scrollbar-thumb { background: #424754; border-radius: 2px; }
        .bg-inverse-surface { background-color: #dae2fd; }
        .bg-surface-tint { background-color: #adc6ff; }
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

      {/* Top Navigation */}
      <TopNavBar />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side Library Panel */}
        <SidebarLeft
          videoFile={videoFile}
          fitMode={fitMode}
          selectedEffectId={selectedEffectId}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onVideoImport={handleVideoImport}
          onSetFitMode={setFitMode}
          onSelectEffect={handleSelectEffect}
          onSearchQueryChange={setSearchQuery}
          onActiveCategoryChange={setActiveCategory}
          filteredEffects={filteredEffects}
          totalEffectsCount={Object.keys(EFFECTS_REGISTRY).length}
          availableCategories={availableCategories}
          categoryLabels={CATEGORY_LABELS}
          identityEffectId={IDENTITY_EFFECT_ID}
          onLoadModule={() =>
            addLog(`[MODULE] Dynamic module slots available.`)
          }
        />

        {/* Center Preview Display */}
        <CanvasPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          timelineRef={timelineRef}
          videoUrl={videoUrl}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          fps={fps}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          redHeight={redHeight}
          greenHeight={greenHeight}
          blueHeight={blueHeight}
          bodyTrackingStatus={bodyTrackingStatus}
          nativeLabState={nativeLabState}
          selectedEffectId={selectedEffectId}
          selectedMeta={selectedMeta}
          identityEffectId={IDENTITY_EFFECT_ID}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVideoError={handleVideoError}
          onSetPlaying={setPlaying}
          onSkipPrev={handleSkipPrev}
          onSkipNext={handleSkipNext}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onMouseDown={handleMouseDown}
          onJogWheelMouseDown={handleJogWheelMouseDown}
        />

        {/* Right Sidebar Inspector panel */}
        <SidebarRight
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          selectedEffectId={selectedEffectId}
          selectedMeta={selectedMeta}
          parameters={parameters}
          onParamChange={handleParamChange}
          latency={latency}
          fps={fps}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          bodyTrackingStatus={bodyTrackingStatus}
          duration={duration}
          currentTime={currentTime}
          fitMode={fitMode}
          logs={logs}
          onDumpLog={handleDumpLog}
          onResetContext={handleResetContext}
          identityEffectId={IDENTITY_EFFECT_ID}
          terminalEndRef={terminalEndRef}
          onPublish={handleStartPublish}
          isRecording={isRecording}
        />
      </main>

      <PublishVideoEffectModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        effectDef={
          selectedMeta
            ? {
                id: selectedEffectId,
                name: selectedMeta.name,
                category: selectedMeta.category,
                description: selectedMeta.description,
                params: Object.entries(
                  selectedMeta.parameterSchema as Record<string, any>,
                ).map(([k, s]) => ({
                  key: k,
                  value: parameters[k] ?? s.default,
                })),
                tags: selectedMeta.tags || [],
              }
            : null
        }
        thumbnailDataUrl={thumbnailDataUrl}
        previewDataUrl={previewDataUrl}
      />
    </div>
  );
}

export default VideoLabView;
