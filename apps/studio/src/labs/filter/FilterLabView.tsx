/**
 * Filter Lab Console — Standalone Module
 *
 * Coordinates states and render loops across:
 *  - TopNavBar
 *  - SidebarLeft (media loading, presets search, categories, and AI Look generator)
 *  - CanvasPreview (WebGL comparison rendering, split position, sequencer controls)
 *  - SidebarRight (adjustments inspector, histogram analysis, telemetry, and live stream monitor logs)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { initializeFontSystem, ColorAdjustmentsEffect, HalationEffect, GaussianBlurEffect, PixiRenderer, EffectGraph } from "@clypra-studio/engine";
import { Sprite, Graphics, Texture } from "pixi.js";
import { usePixiRenderer } from "./hooks/usePixiRenderer";

// Services, hooks and presets
import { FilterPreset, INITIAL_MANUAL_ADJUSTMENTS } from "../../components/effects/filter/types";
import { PublishFilterModal } from "../../components/PublishFilterModal";
import { PRESET_FILTERS, parseCSSFilter } from "../../components/effects/filter/FilterPresets";

/** Convert #RRGGBB hex string to normalized [r, g, b] tuple for GPU uniforms. */
function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#ffffff').replace('#', '').padEnd(6, '0');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 1 : r, isNaN(g) ? 1 : g, isNaN(b) ? 1 : b];
}

// Layout components
import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";

const IDENTITY_FILTER_ID = "__identity__";
const DEFAULT_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function FilterLabView() {
  // ── Initialization ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      initializeFontSystem();
    } catch (e) {
      console.warn("Font system initialization bypassed or already run", e);
    }
  }, []);


  // ── Media States ──────────────────────────────────────────────────────────
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>(DEFAULT_VIDEO_URL);
  const [isVideo, setIsVideo] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15.02);
  const [fitMode, setFitMode] = useState<"stretch" | "fit" | "crop">("fit");

  // ── Filter Selection & Adjustments ─────────────────────────────────────────
  const [selectedFilterId, setSelectedFilterId] = useState<string>(IDENTITY_FILTER_ID);
  const [intensity, setIntensity] = useState(100);
  const [manualAdjustments, setManualAdjustments] = useState(INITIAL_MANUAL_ADJUSTMENTS);

  // ── Split Compare Comparison ──────────────────────────────────────────────
  const [showSplit, setShowSplit] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [leftTab, setLeftTab] = useState<"presets" | "ai">("presets");
  const [rightTab, setRightTab] = useState<"inspector" | "histogram" | "telemetry">("inspector");

  // ── Search & Categories ───────────────────────────────────────────────────
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ── AI Looks generator ────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("cinematic");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");

  // ── Deployment / publishing ───────────────────────────────────────────────
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishThumbnailDataUrl, setPublishThumbnailDataUrl] = useState<string | undefined>(undefined);
  const [publishBatchMode, setPublishBatchMode] = useState(false);

  // ── Telemetry / HUD ────────────────────────────────────────────────────────
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(1.4);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [gpuUsage, setGpuUsage] = useState(25);
  const [memUsage, setMemUsage] = useState("45.2 MB / 4.0 GB");

  // ── Logs / Terminal ────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<string[]>([
    "[INIT] Filter grading pipeline active.",
    "[OK] PixiRenderer v2 WebGL engine active.",
    "[INFO] Ready. Load media or select presets."
  ]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
  }, []);

  // ── Histogram State ────────────────────────────────────────────────────────
  const [histogramData, setHistogramData] = useState<{ r: number[]; g: number[]; b: number[]; l: number[] } | null>(null);
  const [histogramChannel, setHistogramChannel] = useState<"all" | "r" | "g" | "b" | "l">("all");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // PixiJS references
  const unfilteredSpriteRef = useRef<Sprite | null>(null);
  const maskGraphicsRef = useRef<Graphics | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Track whether the halation node is currently in the graph
  const halationActiveRef = useRef(false);

  // Initialize PixiRenderer via custom hook
  const pixiRendererRef = usePixiRenderer(
    canvasRef,
    1280,
    720,
    useCallback((renderer) => {
      addLog("[INIT] WebGL PixiRenderer successfully initialized.");

      // Setup shader effect graph — color-adjustments + gaussian-blur (halation added conditionally)
      const graph = new EffectGraph();
      graph.addNode({
        id: "color-adjustments-node",
        effect: ColorAdjustmentsEffect,
        params: {
          exposure: 0.0,    brightness: 0.0,   contrast: 0.0,
          saturation: 0.0,  temperature: 0.0,  tint: 0.0,
          sepia: 0.0,       grayscale: 0.0,    hueRotate: 0.0,
          vignette: 0.0,    invert: 0.0,
          lift: 0.0,        grainIntensity: 0.0, grainSize: 1.0,
          useChannelMix: 0.0, useDuotone: 0.0,
          vibranceAmount: 0.0, crossProcessAmount: 0.0,
        },
      });
      graph.addNode({
        id: "gaussian-blur-node",
        effect: GaussianBlurEffect,
        params: { blur: 0.0, quality: 4 },
      });
      const resolvedNodes = graph.resolve();
      renderer.applyNodes(resolvedNodes);

      // Split screen double buffer sprite overlays
      const app = renderer.getApp();
      const videoSprite = renderer.getVideoSprite();
      if (app && videoSprite) {
        const unfilteredSprite = new Sprite();
        const maskGraphics = new Graphics();

        app.stage.addChildAt(unfilteredSprite, 0);
        app.stage.addChild(maskGraphics);

        videoSprite.mask = maskGraphics;

        unfilteredSpriteRef.current = unfilteredSprite;
        maskGraphicsRef.current = maskGraphics;
      }

      syncAdjustmentsUniformsDirect(selectedFilterRef.current, intensityRef.current, manualAdjustmentsRef.current);
    }, [addLog]),
    useCallback((err) => {
      addLog(`[WARN] PixiRenderer initialization failed: ${err instanceof Error ? err.message : String(err)}`);
    }, [addLog])
  );

  // Auto-scroll logs to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Keep references updated for the PixiJS Ticker loop
  const showSplitRef = useRef(showSplit);
  showSplitRef.current = showSplit;
  const splitPositionRef = useRef(splitPosition);
  splitPositionRef.current = splitPosition;

  const selectedFilter = useMemo(() => {
    if (selectedFilterId === IDENTITY_FILTER_ID) return null;
    return PRESET_FILTERS.find((p) => p.id === selectedFilterId) || null;
  }, [selectedFilterId]);

  const selectedFilterRef = useRef(selectedFilter);
  selectedFilterRef.current = selectedFilter;

  /**
   * Effective grading params sent to the publish modal:
   * = preset.gradingParams (base look) merged with manualAdjustments (user tweaks).
   * Manual values of 0 are treated as "no override" — they won't overwrite preset values.
   */
  const effectiveGradingParams = useMemo(() => {
    const base: Record<string, unknown> = { ...(selectedFilter?.gradingParams ?? {}) };
    // Apply manual slider overrides — only non-zero values override the base
    for (const [key, value] of Object.entries(manualAdjustments)) {
      if (value !== 0 && value !== null && value !== undefined) {
        base[key] = value;
      }
    }
    return base as typeof manualAdjustments;
  }, [selectedFilter, manualAdjustments]);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;
  const manualAdjustmentsRef = useRef(manualAdjustments);
  manualAdjustmentsRef.current = manualAdjustments;

  // Filter presets based on category and search
  const filteredPresets = useMemo(() => {
    return PRESET_FILTERS.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(presetSearch.toLowerCase()) || p.description.toLowerCase().includes(presetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [presetSearch, selectedCategory]);

  // ── PixiJS Mask & Texture Updates ──────────────────────────────────────────
  const updatePixiMaskAndTexture = useCallback(() => {
    const renderer = pixiRendererRef.current;
    const unfilteredSprite = unfilteredSpriteRef.current;
    const maskGraphics = maskGraphicsRef.current;
    if (!renderer || !renderer.isReady || !unfilteredSprite || !maskGraphics) return;

    const videoSprite = renderer.getVideoSprite();
    if (!videoSprite) return;

    if (videoSprite.texture) {
      unfilteredSprite.texture = videoSprite.texture;
    }
    unfilteredSprite.width = videoSprite.width;
    unfilteredSprite.height = videoSprite.height;
    unfilteredSprite.position.copyFrom(videoSprite.position);

    maskGraphics.clear();
    const w = videoSprite.width;
    const h = videoSprite.height;
    const x = videoSprite.position.x;
    const y = videoSprite.position.y;

    const currentShowSplit = showSplitRef.current;
    const currentSplitPos = splitPositionRef.current;

    if (currentShowSplit) {
      const splitX = x + (currentSplitPos / 100) * w;
      maskGraphics.rect(splitX, y, w - (currentSplitPos / 100) * w, h);
    } else {
      maskGraphics.rect(x, y, w, h);
    }
    maskGraphics.fill({ color: 0xffffff });
  }, []);

  // ── Sync Uniform Adjustments to GLSL shaders ──────────────────────────────
  const syncAdjustmentsUniformsDirect = useCallback(
    (filter: FilterPreset | null, inst: number, adjusts: typeof manualAdjustments) => {
      const renderer = pixiRendererRef.current;
      if (!renderer || !renderer.isReady) return;

      const f = inst / 100;

      // ── Build flat base from CSS fallback if no gradingParams ──────────────
      let base = {
        exposure: 0.0, brightness: 0.0, contrast: 0.0, saturation: 0.0,
        temperature: 0.0, tint: 0.0, sepia: 0.0, grayscale: 0.0,
        hueRotate: 0.0, invert: 0.0, vignette: 0.0,
        lift: 0.0,
        shadowTintR: 1.0, shadowTintG: 1.0, shadowTintB: 1.0,
        shadowTintStrength: 0.0, highlightTintR: 1.0, highlightTintG: 1.0,
        highlightTintB: 1.0, highlightTintStrength: 0.0, splitBalance: 0.5,
        grainIntensity: 0.0, grainSize: 1.0,
        channelMixR: 0.0, channelMixG: 0.0, channelMixB: 0.0, useChannelMix: 0.0,
        duotoneDarkR: 0.0, duotoneDarkG: 0.0, duotoneDarkB: 0.0,
        duotoneLightR: 1.0, duotoneLightG: 1.0, duotoneLightB: 1.0, useDuotone: 0.0,
        vibranceAmount: 0.0,
        vibranceProtectedHueR: 0.91, vibranceProtectedHueG: 0.69, vibranceProtectedHueB: 0.55,
        crossProcessAmount: 0.0,
        // halation params (forwarded to halation-node when active)
        halationR: 1.0, halationG: 0.53, halationB: 0.27,
        halationThreshold: 0.75, halationIntensity: 0.0,
      };

      let needsHalation = false;

      if (filter) {
        const gp = filter.gradingParams;
        if (gp) {
          // Scalar params — direct merge
          if (gp.exposure    != null) base.exposure    = gp.exposure    * f;
          if (gp.brightness  != null) base.brightness  = gp.brightness  * f;
          if (gp.contrast    != null) base.contrast    = gp.contrast    * f;
          if (gp.saturation  != null) base.saturation  = gp.saturation  * f;
          if (gp.temperature != null) base.temperature = gp.temperature * f;
          if (gp.tint        != null) base.tint        = gp.tint        * f;
          if (gp.sepia       != null) base.sepia       = gp.sepia       * f;
          if (gp.grayscale   != null) base.grayscale   = gp.grayscale   * f;
          if (gp.hueRotate   != null) base.hueRotate   = gp.hueRotate   * f;
          if (gp.vignette    != null) base.vignette    = gp.vignette    * f;
          if (gp.invert      != null) base.invert      = gp.invert      * f;
          if (gp.lift        != null) base.lift        = gp.lift        * f;

          // Split-toning
          if (gp.splitTone) {
            const st = gp.splitTone;
            const [sr, sg, sb] = hexToRgb(st.shadowColor);
            const [hr, hg, hb] = hexToRgb(st.highlightColor);
            base.shadowTintR          = sr; base.shadowTintG          = sg; base.shadowTintB          = sb;
            base.shadowTintStrength   = st.shadowStrength    * f;
            base.highlightTintR       = hr; base.highlightTintG       = hg; base.highlightTintB       = hb;
            base.highlightTintStrength = st.highlightStrength * f;
            base.splitBalance         = st.balance;
          }

          // Film grain
          if (gp.grain) {
            base.grainIntensity = gp.grain.intensity * f;
            base.grainSize      = gp.grain.size;
          }

          // Channel-mix B&W
          if (gp.channelMix) {
            base.channelMixR  = gp.channelMix.r;
            base.channelMixG  = gp.channelMix.g;
            base.channelMixB  = gp.channelMix.b;
            base.useChannelMix = 1.0;
          }

          // Duotone
          if (gp.duotone) {
            const [dr, dg, db] = hexToRgb(gp.duotone.darkColor);
            const [lr, lg, lb] = hexToRgb(gp.duotone.lightColor);
            base.duotoneDarkR  = dr; base.duotoneDarkG  = dg; base.duotoneDarkB  = db;
            base.duotoneLightR = lr; base.duotoneLightG = lg; base.duotoneLightB = lb;
            base.useDuotone    = 1.0;
          }

          // Vibrance
          if (gp.vibrance) {
            base.vibranceAmount = gp.vibrance.amount * f;
            if (gp.vibrance.protectedHue) {
              const [pr, pg, pb] = hexToRgb(gp.vibrance.protectedHue);
              base.vibranceProtectedHueR = pr;
              base.vibranceProtectedHueG = pg;
              base.vibranceProtectedHueB = pb;
            }
          }

          // Cross-process
          if (gp.crossProcess) {
            base.crossProcessAmount = gp.crossProcess.amount * f;
          }

          // Halation — needs Pass 2 filter
          if (gp.halation && gp.halation.intensity > 0) {
            needsHalation = true;
            const [hr, hg, hb] = hexToRgb(gp.halation.color);
            base.halationR         = hr;
            base.halationG         = hg;
            base.halationB         = hb;
            base.halationThreshold = gp.halation.threshold;
            base.halationIntensity = gp.halation.intensity * f;
          }
        } else if (filter.cssFilter) {
          // CSS fallback parse for presets without gradingParams
          const parsed      = parseCSSFilter(filter.cssFilter);
          base.brightness   = (parsed.brightness - 1.0) * f;
          base.contrast     = (parsed.contrast   - 1.0) * f;
          base.saturation   = (parsed.saturation - 1.0) * f;
          base.sepia        = parsed.sepia        * f;
          base.grayscale    = parsed.grayscale    * f;
          base.hueRotate    = parsed.hueRotate    * f;
          base.invert       = parsed.invert       * f;
        }
      }

      // ── Conditionally add/remove halation-node from graph ─────────────────
      if (needsHalation && !halationActiveRef.current) {
        try {
          renderer.addNode?.({
            id: "halation-node",
            effect: HalationEffect,
            params: {
              halationR: base.halationR, halationG: base.halationG, halationB: base.halationB,
              halationThreshold: base.halationThreshold, halationIntensity: base.halationIntensity,
            },
          });
          halationActiveRef.current = true;
          addLog("[EFFECT] Halation pass enabled.");
        } catch (_) { /* renderer may not support addNode — silently skip */ }
      } else if (!needsHalation && halationActiveRef.current) {
        try {
          renderer.removeNode?.("halation-node");
          halationActiveRef.current = false;
          addLog("[EFFECT] Halation pass removed.");
        } catch (_) { /* silently skip */ }
      } else if (needsHalation && halationActiveRef.current) {
        renderer.updateParams?.("halation-node", {
          halationR: base.halationR, halationG: base.halationG, halationB: base.halationB,
          halationThreshold: base.halationThreshold, halationIntensity: base.halationIntensity,
        });
      }

      // ── Merge manual adjustment overrides ─────────────────────────────────
      const colorParams = {
        ...base,
        exposure:    base.exposure    + adjusts.exposure    / 100,
        brightness:  base.brightness  + adjusts.brightness  / 100,
        contrast:    base.contrast    + adjusts.contrast    / 100,
        saturation:  base.saturation  + adjusts.saturation  / 100,
        temperature: base.temperature + adjusts.temperature / 400,
        tint:        base.tint        + adjusts.tint        / 450,
        sepia:       base.sepia       + adjusts.sepia       / 100,
        grayscale:   base.grayscale   + adjusts.grayscale   / 100,
        hueRotate:   base.hueRotate   + (adjusts.hueRotate * Math.PI) / 180,
        vignette:    base.vignette    + adjusts.vignette    / 100,
        invert:      base.invert      + adjusts.invert      / 100,
        lift:        base.lift        + (adjusts as any).lift        / 100,
        // Additive manual controls for new primitives
        vibranceAmount:    base.vibranceAmount    + ((adjusts as any).vibrance    || 0) / 100,
        grainIntensity:    base.grainIntensity    + ((adjusts as any).grainIntensity || 0),
        grainSize:         base.grainSize         || ((adjusts as any).grainSize    || 1),
        crossProcessAmount: base.crossProcessAmount + ((adjusts as any).crossProcess || 0) / 100,
      };

      renderer.updateParams("color-adjustments-node", colorParams);
      renderer.updateParams("gaussian-blur-node", { blur: adjusts.blur, quality: 4 });

      updatePixiMaskAndTexture();
      renderer.render();
    },
    [updatePixiMaskAndTexture, addLog]
  );

  // Force video elements to load when their source URLs change
  useEffect(() => {
    if (videoRef.current && isVideo) {
      videoRef.current.load();
      addLog("[MEDIA] Force loading new video source...");
    }
  }, [mediaUrl, isVideo, addLog]);

  // Main Preview Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const renderer = pixiRendererRef.current;
      if (!renderer || !renderer.isReady) {
        animId = requestAnimationFrame(render);
        return;
      }

      renderer.setFitMode(fitMode);

      if (isVideo) {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          renderer.setVideoSource(video);
        }
      } else {
        const img = imageRef.current;
        if (img) {
          renderer.setImageSource(img);
        }
      }

      updatePixiMaskAndTexture();
      renderer.render();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isVideo, fitMode, updatePixiMaskAndTexture]);

  // Live uniform sync when parameters update
  useEffect(() => {
    syncAdjustmentsUniformsDirect(selectedFilter, intensity, manualAdjustments);
  }, [selectedFilter, intensity, manualAdjustments, syncAdjustmentsUniformsDirect]);

  // Calculate live histogram data
  const calculateHistogram = useCallback((sourceCanvas: HTMLCanvasElement) => {
    const helper = document.createElement("canvas");
    const w = 120;
    const h = 80;
    helper.width = w;
    helper.height = h;

    const helperCtx = helper.getContext("2d");
    if (!helperCtx) return;

    helperCtx.drawImage(sourceCanvas, 0, 0, w, h);

    const imgData = helperCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    const lHist = new Array(256).fill(0);

    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      rHist[r]++;
      gHist[g]++;
      bHist[b]++;
      lHist[l]++;
    }

    setHistogramData({ r: rHist, g: gHist, b: bHist, l: lHist });
  }, []);

  // Update histogram loop
  useEffect(() => {
    let active = true;
    let rafId: number;
    let lastHistogramTime = 0;

    const updateLoop = () => {
      if (!active) return;
      const pixiCanvas = canvasRef.current;
      if (pixiCanvas && rightTab === "histogram") {
        const now = performance.now();
        const skipHist = playing && now - lastHistogramTime < 100; // Throttle to 10fps when playing
        if (!skipHist) {
          calculateHistogram(pixiCanvas);
          lastHistogramTime = now;
        }
      }
      rafId = requestAnimationFrame(updateLoop);
    };

    if (rightTab === "histogram") {
      rafId = requestAnimationFrame(updateLoop);
    }

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [rightTab, playing, calculateHistogram]);

  // Telemetry loop simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateStats = () => {
      setFps(playing ? Math.floor(58 + Math.random() * 3) : 0);
      setLatency(parseFloat((1.1 + Math.random() * 0.8).toFixed(2)));
      setCpuUsage(playing ? Math.floor(10 + Math.random() * 6) : 2);
      setGpuUsage(playing ? Math.floor(22 + Math.random() * 8) : 5);
      
      if (typeof window !== "undefined" && window.performance && (window.performance as any).memory) {
        const usage = ((window.performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        setMemUsage(`${usage} MB / 4.0 GB`);
      } else {
        setMemUsage(`${(40 + Math.random() * 10).toFixed(1)} MB / 4.0 GB`);
      }
      timer = setTimeout(updateStats, 1000);
    };
    updateStats();
    return () => clearTimeout(timer);
  }, [playing]);

  // ── Video sequencer playback controls ──────────────────────────────────────
  const handlePlayPause = useCallback((playState: boolean) => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (playState) {
      video.play().then(() => {
        setPlaying(true);
        addLog("[OK] Playback sequencer active.");
      }).catch((err) => {
        addLog(`[WARN] Playback blocked: ${err.message}`);
        setPlaying(false);
      });
    } else {
      video.pause();
      setPlaying(false);
      addLog("[OK] Playback sequencer paused.");
    }
  }, [isVideo, addLog]);

  useEffect(() => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (video) {
      if (playing) {
        video.play().catch(() => setPlaying(false));
      } else {
        video.pause();
      }
    }
  }, [playing, isVideo]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      addLog(`[IMPORT] Source metadata loaded. Size: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}. Duration: ${dur.toFixed(2)}s`);
    }
  };

  const handleSkipPrev = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      addLog("[SEEK] Set play clock to head (0.00)");
    }
  };

  const handleSkipNext = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
      addLog("[SEEK] Set play clock to tail");
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const t = Math.max(0, videoRef.current.currentTime - 2);
      videoRef.current.currentTime = t;
      setCurrentTime(t);
      addLog(`[SEEK] Rewind: ${t.toFixed(2)}s`);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      const t = Math.min(duration, videoRef.current.currentTime + 2);
      videoRef.current.currentTime = t;
      setCurrentTime(t);
      addLog(`[SEEK] Fast forward: ${t.toFixed(2)}s`);
    }
  };

  const handleProgressSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // ── Media File Import Handlers ─────────────────────────────────────────────
  const handleMediaImport = (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "image") => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Reading incoming file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      setMediaFile(file);
      setPlaying(false);
      setCurrentTime(0);

      const objectUrl = URL.createObjectURL(file);
      setMediaUrl(objectUrl);

      if (type === "video") {
        setIsVideo(true);
      } else {
        setIsVideo(false);
        setDuration(0);
        // Load static image element
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
          imageRef.current = img;
          addLog(`[IMPORT] Static image texture resolved: ${img.width}x${img.height}`);
        };
      }
    }
  };

  // ── Dragging Split Comparison Slider ───────────────────────────────────────
  const handleMouseDownSplit = useCallback(() => {
    setIsDraggingSplit(true);
  }, []);

  const handleMouseMoveSplit = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(pct);
    },
    [isDraggingSplit]
  );

  const handleMouseUpSplit = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener("mousemove", handleMouseMoveSplit);
      window.addEventListener("mouseup", handleMouseUpSplit);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveSplit);
      window.removeEventListener("mouseup", handleMouseUpSplit);
    };
  }, [isDraggingSplit, handleMouseMoveSplit, handleMouseUpSplit]);

  // ── Manual Parameter Adjustments Change ─────────────────────────────────────
  const handleAdjustmentChange = (key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS, val: number) => {
    setManualAdjustments((prev) => {
      const next = { ...prev, [key]: val };
      addLog(`[EFFECT] Adjusted ${key} to ${val}`);
      return next;
    });
  };

  const handleResetSlider = (key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS) => {
    setManualAdjustments((prev) => {
      const next = { ...prev, [key]: INITIAL_MANUAL_ADJUSTMENTS[key] };
      addLog(`[EFFECT] Reset ${key} to default`);
      return next;
    });
  };

  const handleResetAll = () => {
    setManualAdjustments(INITIAL_MANUAL_ADJUSTMENTS);
    setSelectedFilterId(IDENTITY_FILTER_ID);
    setIntensity(100);
    addLog("[OK] Reset all adjustments and presets to pass-through.");
  };

  // ── Export Frame Snapshot ──────────────────────────────────────────────────
  const handleExportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    addLog("[SNAPSHOT] Capturing WebGL canvas buffer...");
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graded-look-${selectedFilterId}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      addLog("[OK] Snapshot downloaded successfully.");
    }, "image/png");
  };

  // ── AI Looks Generation ────────────────────────────────────────────────────
  const handleGenerateFilter = async () => {
    if (!aiPrompt.trim()) return;

    setAiStatus("generating");
    setAiMessage("");
    addLog(`[AI] Dispatching prompt to generator model: "${aiPrompt}"...`);

    try {
      // Simulate API network call
      await new Promise((resolve) => setTimeout(resolve, 2200));

      // Mock random color grading look based on prompt
      const generatedId = `ai-${Date.now().toString().slice(-4)}`;
      const randomAdjustments = {
        exposure: Math.floor(-15 + Math.random() * 30),
        brightness: Math.floor(-10 + Math.random() * 20),
        contrast: Math.floor(10 + Math.random() * 25),
        saturation: Math.floor(-30 + Math.random() * 50),
        temperature: Math.floor(-40 + Math.random() * 80),
        tint: Math.floor(-20 + Math.random() * 40),
        sepia: Math.random() > 0.6 ? Math.floor(10 + Math.random() * 30) : 0,
        grayscale: 0,
        hueRotate: Math.floor(-20 + Math.random() * 40),
        vignette: Math.floor(15 + Math.random() * 40),
        invert: 0,
        blur: 0,
      };

      setManualAdjustments(randomAdjustments);
      setSelectedFilterId(IDENTITY_FILTER_ID); // Clear active library preset
      setIntensity(100);

      setAiStatus("success");
      setAiMessage(`AI synthesized look "${aiCategory.toUpperCase()}_GRADED" loaded into sliders.`);
      addLog(`[OK] AI look generated and loaded. Adjustments sync active.`);
    } catch (err) {
      setAiStatus("error");
      setAiMessage("Failed to synthesize look.");
      addLog("[WARN] AI synthesis request failed.");
    }
  };

  // ── Deployment to R2 Bucket ───────────────────────────────────────────────
  // Capture canvas thumbnail then open the publish modal for review before upload.
  const handleOpenPublishModal = () => {
    setPublishBatchMode(false);
    let thumbnailDataUrl: string | undefined;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        thumbnailDataUrl = canvas.toDataURL("image/png");
      } catch (e) {
        console.warn("Failed to capture canvas thumbnail:", e);
      }
    }
    setPublishThumbnailDataUrl(thumbnailDataUrl);
    addLog("[DEPLOY] Opening publish modal — review payload before upload.");
    setShowPublishModal(true);
  };

  const handleOpenPublishAllPresets = () => {
    setPublishBatchMode(true);
    setPublishThumbnailDataUrl(undefined);
    addLog("[DEPLOY] Opening batch publish modal — upload all presets to R2.");
    setShowPublishModal(true);
  };

  const handleFilterPublished = (filterId: string, message: string) => {
    setPublishMessage(message);
    addLog(`[OK] Filter published: ${filterId}`);
  };

  // ── Diagnostics Ctx reset ──────────────────────────────────────────────────
  const handleResetContext = () => {
    handleResetAll();
    setLogs([
      "[INIT] Reset context requested.",
      "[OK] Pipeline cleared.",
      "[INFO] Ready. Load media or select presets."
    ]);
  };

  const handleDumpLog = () => {
    console.group("%c[FILTER GRAD_DIAG LOG DUMP]", "color:#7C6FFF;font-weight:bold");
    logs.forEach((l) => console.log(l));
    console.groupEnd();
    addLog("[OK] Log history dumped to browser developer console.");
  };

  // Histogram SVG Paths computation helper
  const histogramSVGData = useMemo(() => {
    if (!histogramData) return { rPath: "", gPath: "", bPath: "", lPath: "", maxVal: 1 };

    const getPathData = (bins: number[]) => {
      const width = 260;
      const height = 110;
      let max = 1;
      for (let i = 0; i < 256; i++) {
        if (bins[i] > max) max = bins[i];
      }

      let points = `M 0 ${height} `;
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const y = height - (bins[i] / max) * height * 0.95;
        points += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      points += `L ${width} ${height} Z`;
      return points;
    };

    let maxVal = 1;
    const allBins = [...histogramData.r, ...histogramData.g, ...histogramData.b];
    for (let i = 0; i < allBins.length; i++) {
      if (allBins[i] > maxVal) maxVal = allBins[i];
    }

    return {
      rPath: getPathData(histogramData.r),
      gPath: getPathData(histogramData.g),
      bPath: getPathData(histogramData.b),
      lPath: getPathData(histogramData.l),
      maxVal,
    };
  }, [histogramData]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (mediaUrl && mediaUrl !== DEFAULT_VIDEO_URL) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  return (
    <div className="h-screen flex flex-col selection:bg-[#adc6ff] selection:text-[#002e6a]">
      {/* Dynamic tokens styles block injection */}
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

      {/* Main layout */}
      <main className="flex-1 flex overflow-hidden">
        <SidebarLeft
          mediaFile={mediaFile}
          isVideo={isVideo}
          fitMode={fitMode}
          onMediaImport={handleMediaImport}
          onSetFitMode={setFitMode}
          leftTab={leftTab}
          onSetLeftTab={setLeftTab}
          presetSearch={presetSearch}
          onPresetSearchChange={setPresetSearch}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          filteredPresets={filteredPresets}
          selectedFilterId={selectedFilterId}
          onSelectFilter={setSelectedFilterId}
          intensity={intensity}
          onIntensityChange={setIntensity}
          aiPrompt={aiPrompt}
          onAiPromptChange={setAiPrompt}
          aiCategory={aiCategory}
          onAiCategoryChange={setAiCategory}
          aiStatus={aiStatus}
          aiMessage={aiMessage}
          onGenerateFilter={handleGenerateFilter}
        />

        <CanvasPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          containerRef={containerRef}
          timelineRef={timelineRef}
          mediaUrl={mediaUrl}
          isVideo={isVideo}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          fps={fps}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          showSplit={showSplit}
          onSetShowSplit={setShowSplit}
          splitPosition={splitPosition}
          onMouseDownSplit={handleMouseDownSplit}
          onLoadedMetadata={handleLoadedMetadata}
          onVideoError={() => addLog("[WARN] Media decoder encountered an error.")}
          onTimeUpdate={handleTimeUpdate}
          onSetPlaying={handlePlayPause}
          onSkipPrev={handleSkipPrev}
          onSkipNext={handleSkipNext}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onProgressSliderChange={handleProgressSliderChange}
          onResetAll={handleResetAll}
          onExportFrame={handleExportFrame}
        />

        <SidebarRight
          activeTab={rightTab}
          onSetActiveTab={setRightTab}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilterId}
          intensity={intensity}
          onIntensityChange={setIntensity}
          manualAdjustments={manualAdjustments}
          onAdjustmentChange={handleAdjustmentChange}
          onResetSlider={handleResetSlider}
          histogramData={histogramData}
          histogramChannel={histogramChannel}
          onSetHistogramChannel={setHistogramChannel}
          histogramSVGData={histogramSVGData}
          fps={fps}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          isVideo={isVideo}
          currentTime={currentTime}
          duration={duration}
          logs={logs}
          terminalEndRef={terminalEndRef}
          onDumpLog={handleDumpLog}
          onResetContext={handleResetContext}
          onPublish={handleOpenPublishModal}
          onPublishAllPresets={handleOpenPublishAllPresets}
          isPublishing={isPublishing}
          publishMessage={publishMessage}
        />
      </main>

      {/* Publish Filter Modal — review metadata, thumbnail & R2 payload before upload */}
      <PublishFilterModal
        open={showPublishModal}
        onClose={() => { setShowPublishModal(false); setPublishBatchMode(false); }}
        selectedFilter={selectedFilter}
        gradingParams={effectiveGradingParams}
        allPresets={publishBatchMode ? PRESET_FILTERS : undefined}
        thumbnailDataUrl={publishThumbnailDataUrl}
        onPublished={handleFilterPublished}
      />
    </div>
  );
}

export default FilterLabView;
