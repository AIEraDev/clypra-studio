/**
 * Filter Workspace
 * Test, generate, and upload color grading filters to R2
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getR2Config } from "../../../services/r2Service";
import { useR2Publish } from "../../../hooks/useR2Publish";
import { ColorAdjustmentsEffect, GaussianBlurEffect, PixiRenderer, EffectGraph } from "@clypra/engine";
import { Sprite, Graphics } from "pixi.js";

// Subcomponents & types/constants
import { FilterPreset, INITIAL_MANUAL_ADJUSTMENTS } from "./types";
import { PRESET_FILTERS, parseCSSFilter } from "./FilterPresets";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { MediaViewport } from "./components/MediaViewport";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

export function FilterWorkspace() {
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // PixiJS references - using PixiRenderer from @clypra/engine
  const pixiRendererRef = useRef<PixiRenderer | null>(null);
  const unfilteredSpriteRef = useRef<Sprite | null>(null);
  const maskGraphicsRef = useRef<Graphics | null>(null);

  const { publishFilter } = useR2Publish();

  // Media States
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [isVideo, setIsVideo] = useState(false);
  const [mediaMetadata, setMediaMetadata] = useState<{ width: number; height: number; duration?: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Filter States
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset | null>(null);
  const [intensity, setIntensity] = useState(100);
  const [manualAdjustments, setManualAdjustments] = useState(INITIAL_MANUAL_ADJUSTMENTS);

  // Before/After comparison state
  const [showSplitComparison, setShowSplitComparison] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // AI Look Generator State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("cinematic");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");

  // Publish Form State
  const [creatorName, setCreatorName] = useState("");
  const [creatorSocialLink, setCreatorSocialLink] = useState("");
  const [publishApproved, setPublishApproved] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [showThumbnailLightbox, setShowThumbnailLightbox] = useState(false);
  const [previewFrameUrl, setPreviewFrameUrl] = useState<string | undefined>();

  // Histogram State
  const [histogramData, setHistogramData] = useState<{ r: number[]; g: number[]; b: number[]; l: number[] } | null>(null);
  const [histogramChannel, setHistogramChannel] = useState<"all" | "r" | "g" | "b" | "l">("all");

  const [expandedSections, setExpandedSections] = useState({
    light: true,
    color: true,
    effects: true,
  });

  const [leftTab, setLeftTab] = useState<"presets" | "ai">("presets");
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [rightTab, setRightTab] = useState<"adjust" | "histogram">("adjust");

  // Simple check for admin role from search params or localStorage
  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("role") === "admin" || localStorage.getItem("clypra_role") === "admin";
  }, []);

  // Filter presets based on search query and category tab selection
  const filteredPresets = useMemo(() => {
    return PRESET_FILTERS.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(presetSearch.toLowerCase()) || p.description.toLowerCase().includes(presetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [presetSearch, selectedCategory]);

  const handleMouseDown = useCallback(() => {
    setIsDraggingSplit(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(pct);
    },
    [isDraggingSplit],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(pct);
    },
    [isDraggingSplit],
  );

  // Keep comparison slider values in refs to avoid closure captures in PixiJS Ticker
  const showSplitRef = useRef(showSplitComparison);
  showSplitRef.current = showSplitComparison;
  const splitPositionRef = useRef(splitPosition);
  splitPositionRef.current = splitPosition;

  // Update PixiJS mask and texture dimensions/sources
  const updatePixiMaskAndTexture = useCallback(() => {
    const renderer = pixiRendererRef.current;
    const unfilteredSprite = unfilteredSpriteRef.current;
    const maskGraphics = maskGraphicsRef.current;
    if (!renderer || !renderer.isReady || !unfilteredSprite || !maskGraphics) return;

    const videoSprite = (renderer as any).videoSprite;
    if (!videoSprite) return;

    // 1. Sync dimensions & texture
    if (videoSprite.texture) {
      unfilteredSprite.texture = videoSprite.texture;
    }
    unfilteredSprite.width = videoSprite.width;
    unfilteredSprite.height = videoSprite.height;

    // 2. Update split mask graphics
    maskGraphics.clear();
    const w = videoSprite.width;
    const h = videoSprite.height;

    const showSplit = showSplitRef.current;
    const splitPos = splitPositionRef.current;

    if (showSplit) {
      const splitX = (splitPos / 100) * w;
      maskGraphics.rect(splitX, 0, w - splitX, h);
    } else {
      maskGraphics.rect(0, 0, w, h);
    }
    maskGraphics.fill({ color: 0xffffff });
  }, []);

  // Synchronize adjustments uniforms to the PixiRenderer immediately (imperative path)
  const syncAdjustmentsUniformsDirect = useCallback(
    (filter: typeof selectedFilter, inst: number, adjusts: typeof manualAdjustments) => {
      const renderer = pixiRendererRef.current;
      if (!renderer || !renderer.isReady) return;

      // Parse presets
      const presetAdjust = filter && filter.cssFilter ? parseCSSFilter(filter.cssFilter) : { brightness: 1.0, contrast: 1.0, saturation: 1.0, sepia: 0.0, grayscale: 0.0, hueRotate: 0.0, invert: 0.0 };

      const f = inst / 100;

      // Combine preset & manual
      const finalBrightness = 1.0 + (presetAdjust.brightness - 1.0) * f + adjusts.brightness / 100;
      const finalContrast = 1.0 + (presetAdjust.contrast - 1.0) * f + adjusts.contrast / 100;
      const finalSaturation = 1.0 + (presetAdjust.saturation - 1.0) * f + adjusts.saturation / 100;
      const finalSepia = presetAdjust.sepia * f + adjusts.sepia / 100;
      const finalGrayscale = presetAdjust.grayscale * f + adjusts.grayscale / 100;
      const finalHueRotate = presetAdjust.hueRotate * f + (adjusts.hueRotate * Math.PI) / 180;
      const finalInvert = presetAdjust.invert * f + adjusts.invert / 100;

      const finalParams = {
        exposure: adjusts.exposure / 100,
        brightness: finalBrightness - 1.0,
        contrast: finalContrast - 1.0,
        saturation: finalSaturation - 1.0,
        sepia: finalSepia,
        grayscale: finalGrayscale,
        hueRotate: finalHueRotate,
        vignette: adjusts.vignette / 100,
        invert: finalInvert,
        temperature: adjusts.temperature / 400,
        tint: adjusts.tint / 450,
      };

      // Update each parameter individually in the active node of PixiRenderer
      Object.entries(finalParams).forEach(([key, val]) => {
        renderer.updateParam("color-adjustments-node", key, val);
      });

      // Update blur parameter in the gaussian-blur-node
      renderer.updateParam("gaussian-blur-node", "blur", adjusts.blur);

      // Force render for static images (videos auto-render via ticker)
      if (!isVideo) {
        const app = (renderer as any).app;
        if (app) {
          app.renderer.render(app.stage);
        }
      }
    },
    [isVideo],
  );

  // Synchronize adjustments uniforms to the PixiRenderer
  const syncAdjustmentsUniforms = useCallback(() => {
    syncAdjustmentsUniformsDirect(selectedFilter, intensity, manualAdjustments);
  }, [selectedFilter, intensity, manualAdjustments, syncAdjustmentsUniformsDirect]);

  // Initialize PixiRenderer from @clypra/engine and apply the ColorAdjustmentsEffect
  useEffect(() => {
    const canvas = pixiCanvasRef.current;
    const video = videoRef.current;

    if (!canvas || !mediaMetadata) {
      return;
    }

    console.log("[FilterWorkspace] 🚀 Initializing PixiRenderer from @clypra/engine");
    let active = true;

    const initRenderer = async () => {
      try {
        const renderer = new PixiRenderer();
        await renderer.init(canvas, mediaMetadata.width, mediaMetadata.height);

        if (!active) {
          renderer.destroy();
          return;
        }

        pixiRendererRef.current = renderer;

        // Set source for the renderer
        if (isVideo && video) {
          renderer.setVideoSource(video);
        } else if (!isVideo && imageRef.current) {
          renderer.setImageSource(imageRef.current);
        }

        // Build the EffectGraph containing our ColorAdjustmentsEffect and GaussianBlurEffect
        const graph = new EffectGraph();
        graph.addNode({
          id: "color-adjustments-node",
          effect: ColorAdjustmentsEffect,
          params: {
            exposure: 0.0,
            brightness: 0.0,
            contrast: 0.0,
            saturation: 0.0,
            temperature: 0.0,
            tint: 0.0,
            sepia: 0.0,
            grayscale: 0.0,
            hueRotate: 0.0,
            vignette: 0.0,
            invert: 0.0,
          },
        });
        graph.addNode({
          id: "gaussian-blur-node",
          effect: GaussianBlurEffect,
          params: {
            blur: 0.0,
            quality: 4,
          },
        });
        const resolvedNodes = graph.resolve();
        renderer.applyNodes(resolvedNodes);

        // Set up the split compare unfiltered layer and mask
        const app = (renderer as any).app;
        const videoSprite = (renderer as any).videoSprite;
        if (app && videoSprite) {
          const unfilteredSprite = new Sprite();
          const maskGraphics = new Graphics();

          app.stage.addChildAt(unfilteredSprite, 0);
          app.stage.addChild(maskGraphics);

          videoSprite.mask = maskGraphics;

          unfilteredSpriteRef.current = unfilteredSprite;
          maskGraphicsRef.current = maskGraphics;

          // Add ticker listener to synchronize the split screen mask and textures
          const syncTicker = () => {
            if (active) {
              updatePixiMaskAndTexture();
            }
          };
          app.ticker.add(syncTicker);
        }

        // Sync initial uniforms
        syncAdjustmentsUniforms();
      } catch (error) {
        console.error("[FilterWorkspace] PixiRenderer initialization failed:", error);
      }
    };

    initRenderer();

    return () => {
      active = false;
      if (pixiRendererRef.current) {
        pixiRendererRef.current.destroy();
        pixiRendererRef.current = null;
      }
    };
  }, [mediaUrl, isVideo, mediaMetadata]);

  // Sync uniforms whenever selection, intensity, or manual settings change
  useEffect(() => {
    syncAdjustmentsUniforms();
  }, [syncAdjustmentsUniforms]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setIsVideo(false);

      const img = new Image();
      img.onload = () => {
        setMediaMetadata({ width: img.width, height: img.height });
        imageRef.current = img;

        if (pixiCanvasRef.current) {
          pixiCanvasRef.current.width = img.width;
          pixiCanvasRef.current.height = img.height;
        }

        if (pixiRendererRef.current) {
          pixiRendererRef.current.setImageSource(img);
        }

        // Draw the initial frame
        setTimeout(() => {
          updatePixiMaskAndTexture();
        }, 50);

        // Capture initial preview frame for presets
        try {
          const tempCanvas = document.createElement("canvas");
          const aspect = img.width / img.height;
          const targetHeight = Math.min(img.height, 1080);
          tempCanvas.height = targetHeight;
          tempCanvas.width = Math.round(targetHeight * (aspect || 1));
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            setPreviewFrameUrl(tempCanvas.toDataURL("image/jpeg", 0.9));
          }
        } catch (err) {
          console.error("Failed to capture initial image preview:", err);
        }
      };
      img.src = url;
    },
    [updatePixiMaskAndTexture],
  );

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setIsVideo(true);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleVideoMetadataLoaded = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setMediaMetadata({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    });
    if (pixiCanvasRef.current) {
      pixiCanvasRef.current.width = video.videoWidth;
      pixiCanvasRef.current.height = video.videoHeight;
    }
    video.currentTime = 0;
  }, []);

  const handleVideoSeeked = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      updatePixiMaskAndTexture();
    },
    [updatePixiMaskAndTexture],
  );

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setCurrentTime(video.currentTime);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      });
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

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

  // Active video playing/static loop for live histogram updates
  useEffect(() => {
    let active = true;
    let rafId: number;
    let lastHistogramTime = 0;

    const updateHistogram = () => {
      const pixiCanvas = pixiCanvasRef.current;
      if (!pixiCanvas) return;

      const now = Date.now();
      const skipHist = isPlaying && now - lastHistogramTime < 100; // max 10 FPS for histogram during video playback

      if (!skipHist) {
        calculateHistogram(pixiCanvas);
        lastHistogramTime = now;
      }

      if (isPlaying && active) {
        rafId = requestAnimationFrame(updateHistogram);
      }
    };

    if (isPlaying) {
      rafId = requestAnimationFrame(updateHistogram);
    } else {
      // Refresh histogram for static adjustments
      const timer = setTimeout(updateHistogram, 50);
      return () => clearTimeout(timer);
    }

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, isVideo, selectedFilter, intensity, manualAdjustments, mediaMetadata, calculateHistogram]);

  // Video playback loop (simply updates currentTime for slider)
  useEffect(() => {
    if (!isVideo || !videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
        rafId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isVideo, isPlaying]);

  // SVG representation helper for Histogram
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

  // Generate filter with AI
  const handleGenerateFilter = async () => {
    if (!aiPrompt.trim()) {
      setAiMessage("Please enter a filter description");
      setAiStatus("error");
      return;
    }

    setAiStatus("generating");
    setAiMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/filters/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: aiCategory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate filter: ${response.statusText}`);
      }

      const data = await response.json();

      const generatedFilter: FilterPreset = {
        id: data.id || `generated-${Date.now()}`,
        name: data.name || "Generated Filter",
        category: (aiCategory as any) || "modern",
        description: data.description || aiPrompt,
        cssFilter: data.cssFilter || "",
        intensity: data.intensity?.default || 100,
      };

      setSelectedFilter(generatedFilter);
      setIntensity(generatedFilter.intensity);
      setAiStatus("success");
      setAiMessage(`Generated: ${generatedFilter.name}`);
      syncAdjustmentsUniformsDirect(generatedFilter, generatedFilter.intensity, manualAdjustments);
    } catch (error) {
      setAiStatus("error");
      setAiMessage(error instanceof Error ? error.message : "Failed to generate filter");
    }
  };

  // Upload filter to R2
  const handleUploadFilter = async () => {
    if (!selectedFilter) {
      setUploadMessage("Please generate or select a filter first");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("");

    // Always generate a thumbnail from the WebGL canvas if it exists
    let thumbnailDataUrl: string | undefined;
    const canvas = pixiCanvasRef.current;
    if (canvas) {
      try {
        thumbnailDataUrl = canvas.toDataURL("image/png");
      } catch (e) {
        console.error("Failed to generate preview thumbnail:", e);
      }
    }

    const creatorInfo = creatorName.trim()
      ? {
          name: creatorName.trim(),
          socialLink: creatorSocialLink.trim() || undefined,
        }
      : undefined;

    // Use admin flag as direct auto-approval publish permission
    const publishApprovedStatus = isAdmin ? publishApproved : false;

    const r2Config = getR2Config();

    if (r2Config) {
      try {
        const result = await publishFilter({
          id: selectedFilter.id,
          category: selectedFilter.category,
          definition: {
            id: selectedFilter.id,
            name: selectedFilter.name,
            category: selectedFilter.category,
            description: selectedFilter.description || "",
            intensity: "Medium",
            swatch: selectedFilter.cssFilter,
            creator: creatorInfo,
            published: publishApprovedStatus,
          },
          thumbnailDataUrl,
        });

        setUploadStatus("success");
        setUploadMessage(result.message || `Filter "${selectedFilter.name}" published directly to R2 bucket!`);
      } catch (error) {
        setUploadStatus("error");
        setUploadMessage(error instanceof Error ? error.message : "Failed to publish filter to R2");
      }
      return;
    }

    // Fallback to worker-based API upload
    try {
      const response = await fetch(`${API_BASE_URL}/filters/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: {
            id: selectedFilter.id,
            name: selectedFilter.name,
            category: selectedFilter.category,
            description: selectedFilter.description,
            intensity: "Medium",
            swatch: selectedFilter.cssFilter,
            creator: creatorInfo,
            published: publishApprovedStatus,
          },
          thumbnailDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadStatus("success");
      setUploadMessage(data.message || "Filter uploaded successfully!");
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : "Failed to upload filter");
    }
  };

  // Export frame
  const exportFrame = useCallback(() => {
    const canvas = pixiCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graded-${selectedFilter?.id || "frame"}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [selectedFilter]);

  // Reset a single slider adjustment
  const handleResetSlider = useCallback(
    (key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS) => {
      setManualAdjustments((prev) => {
        const next = {
          ...prev,
          [key]: INITIAL_MANUAL_ADJUSTMENTS[key],
        };
        syncAdjustmentsUniformsDirect(selectedFilter, intensity, next);
        return next;
      });
    },
    [selectedFilter, intensity, syncAdjustmentsUniformsDirect],
  );

  // Update a slider adjustment
  const handleAdjustmentChange = useCallback(
    (key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS, val: number) => {
      setManualAdjustments((prev) => {
        const next = {
          ...prev,
          [key]: val,
        };
        syncAdjustmentsUniformsDirect(selectedFilter, intensity, next);
        return next;
      });
    },
    [selectedFilter, intensity, syncAdjustmentsUniformsDirect],
  );

  // Reset all adjustments
  const handleResetAll = useCallback(() => {
    setManualAdjustments(INITIAL_MANUAL_ADJUSTMENTS);
    setSelectedFilter(null);
    setIntensity(100);
    syncAdjustmentsUniformsDirect(null, 100, INITIAL_MANUAL_ADJUSTMENTS);
  }, [syncAdjustmentsUniformsDirect]);

  // Toggle sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Clean up object URLs to prevent leaks
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  return (
    <div className="flex h-full bg-[#07070A] text-[#F4F4F7] font-sans overflow-hidden select-none">
      <LeftSidebar leftTab={leftTab} setLeftTab={setLeftTab} presetSearch={presetSearch} setPresetSearch={setPresetSearch} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} intensity={intensity} setIntensity={setIntensity} previewFrameUrl={previewFrameUrl} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} aiCategory={aiCategory} setAiCategory={setAiCategory} aiStatus={aiStatus} aiMessage={aiMessage} filteredPresets={filteredPresets} handleGenerateFilter={handleGenerateFilter} handleVideoUpload={handleVideoUpload} handleImageUpload={handleImageUpload} mediaMetadata={mediaMetadata} isVideo={isVideo} syncAdjustmentsUniformsDirect={syncAdjustmentsUniformsDirect} manualAdjustments={manualAdjustments} />

      <MediaViewport mediaUrl={mediaUrl} isVideo={isVideo} mediaMetadata={mediaMetadata} isPlaying={isPlaying} currentTime={currentTime} showSplitComparison={showSplitComparison} setShowSplitComparison={setShowSplitComparison} splitPosition={splitPosition} selectedFilter={selectedFilter} intensity={intensity} pixiCanvasRef={pixiCanvasRef} containerRef={containerRef} videoRef={videoRef} handleVideoMetadataLoaded={handleVideoMetadataLoaded} handleVideoSeeked={handleVideoSeeked} handlePlayPause={handlePlayPause} handleSeek={handleSeek} handleResetAll={handleResetAll} exportFrame={exportFrame} handleImageUpload={handleImageUpload} handleVideoUpload={handleVideoUpload} handleMouseDown={handleMouseDown} handleTouchStart={handleMouseDown} />

      <RightSidebar rightTab={rightTab} setRightTab={setRightTab} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} intensity={intensity} setIntensity={setIntensity} manualAdjustments={manualAdjustments} setManualAdjustments={setManualAdjustments} syncAdjustmentsUniformsDirect={syncAdjustmentsUniformsDirect} toggleSection={toggleSection} expandedSections={expandedSections} handleResetSlider={handleResetSlider} handleAdjustmentChange={handleAdjustmentChange} histogramData={histogramData} histogramChannel={histogramChannel} setHistogramChannel={setHistogramChannel} histogramSVGData={histogramSVGData} previewFrameUrl={previewFrameUrl} setShowThumbnailLightbox={setShowThumbnailLightbox} creatorName={creatorName} setCreatorName={setCreatorName} creatorSocialLink={creatorSocialLink} setCreatorSocialLink={setCreatorSocialLink} isAdmin={isAdmin} publishApproved={publishApproved} setPublishApproved={setPublishApproved} uploadStatus={uploadStatus} uploadMessage={uploadMessage} handleUploadFilter={handleUploadFilter} />

      {showThumbnailLightbox && previewFrameUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-8 cursor-zoom-out" onClick={() => setShowThumbnailLightbox(false)}>
          <div className="relative max-w-4xl max-h-full rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0F] shadow-2xl flex flex-col cursor-default animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#22222F] flex justify-between items-center bg-[#0F0F15]/80">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Thumbnail Frame Preview</h4>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                  Graded Resolution: {mediaMetadata?.width || "Original"} x {mediaMetadata?.height || "Original"}
                </p>
              </div>
              <button onClick={() => setShowThumbnailLightbox(false)} className="text-gray-400 hover:text-white text-xs bg-[#1E1E2A] hover:bg-[#2A2A3A] px-2 py-1 rounded border border-[#2E2E3E] cursor-pointer transition-colors">
                Close
              </button>
            </div>
            {/* Graded Image */}
            <div className="p-4 flex items-center justify-center bg-[radial-gradient(circle_at_center,#1A1A24_0%,#0A0A0E_100%)] overflow-hidden">
              <img src={previewFrameUrl} alt="Grades Preview Frame" className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-2xl border border-[#1A1A26]" style={{ filter: selectedFilter?.cssFilter }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
