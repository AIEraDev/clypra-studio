/**
 * Transition Workspace
 * Test, preview, and publish transition effects to the API
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Upload, Play, Pause, RotateCcw, Search, Eye, EyeOff, Sliders, Download, Loader2, CheckCircle, AlertTriangle, Sparkles, Film, Image as ImageIcon, Video, X } from "lucide-react";
import { TRANSITION_PRESETS, TRANSITION_CATEGORIES, getTransitionsByCategory, searchTransitions, type TransitionPreset, type TransitionCategory } from "@clypra/engine/transitions";
import { renderTransition } from "./transitionRenderer";

// Use constants from engine
const PRESET_TRANSITIONS = TRANSITION_PRESETS;
import { generateTransitionPreview, generateThumbnail, downloadBlob, formatFileSize, type PreviewResult } from "./transitionPreviewGenerator";

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

// Sample media URLs for testing
const SAMPLE_CLIPS = {
  clipA: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
  clipB: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop",
};

function toKebabId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TransitionWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipARef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const clipBRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Media states
  const [clipAUrl, setClipAUrl] = useState<string>(SAMPLE_CLIPS.clipA);
  const [clipBUrl, setClipBUrl] = useState<string>(SAMPLE_CLIPS.clipB);
  const [isClipAVideo, setIsClipAVideo] = useState(false);
  const [isClipBVideo, setIsClipBVideo] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Transition states
  const [selectedTransition, setSelectedTransition] = useState<TransitionPreset | null>(PRESET_TRANSITIONS[0]);
  const [duration, setDuration] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loop, setLoop] = useState(true);

  // UI states
  const [leftTab, setLeftTab] = useState<"presets" | "ai">("presets");
  const [selectedCategory, setSelectedCategory] = useState<TransitionCategory>("fade");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSplitComparison, setShowSplitComparison] = useState(false);

  // Upload states
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Preview generation states
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const token = localStorage.getItem("clypra_auth_token");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(!!payload.isAdmin);
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  // Load initial sample images
  useEffect(() => {
    const loadImage = (url: string, isClipA: boolean) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (isClipA) {
          clipARef.current = img;
        } else {
          clipBRef.current = img;
        }
        // Check if both clips are loaded
        if (clipARef.current && clipBRef.current) {
          setMediaLoaded(true);
          renderCurrentFrame();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
      };
      img.src = url;
    };

    loadImage(clipAUrl, true);
    loadImage(clipBUrl, false);
  }, [clipAUrl, clipBUrl]);

  // Render current frame
  const renderCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const clipA = clipARef.current;
    const clipB = clipBRef.current;

    if (!canvas || !clipA || !clipB || !selectedTransition) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate progress (0-1)
    const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

    renderTransition(ctx, clipA, clipB, selectedTransition, progress, duration);
  }, [currentTime, duration, selectedTransition]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const startTime = performance.now();
    const initialTime = currentTime;

    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds
      let newTime = initialTime + elapsed;

      if (newTime >= duration) {
        if (loop) {
          newTime = 0;
        } else {
          newTime = duration;
          setIsPlaying(false);
          setCurrentTime(duration);
          renderCurrentFrame();
          return;
        }
      }

      setCurrentTime(newTime);
      renderCurrentFrame();

      if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, currentTime, duration, loop, renderCurrentFrame]);

  // Re-render when transition or duration changes
  useEffect(() => {
    if (mediaLoaded && !isPlaying) {
      renderCurrentFrame();
    }
  }, [selectedTransition, duration, mediaLoaded, isPlaying, renderCurrentFrame]);

  // Handle file upload for clip A
  const handleClipAUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setClipAUrl(url);

      if (file.type.startsWith("video/")) {
        setIsClipAVideo(true);
        const video = document.createElement("video");
        video.src = url;
        video.onloadedmetadata = () => {
          clipARef.current = video;
          if (clipBRef.current) {
            setMediaLoaded(true);
            renderCurrentFrame();
          }
        };
      } else {
        setIsClipAVideo(false);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          clipARef.current = img;
          if (clipBRef.current) {
            setMediaLoaded(true);
            renderCurrentFrame();
          }
        };
      }
    },
    [renderCurrentFrame],
  );

  // Handle file upload for clip B
  const handleClipBUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setClipBUrl(url);

      if (file.type.startsWith("video/")) {
        setIsClipBVideo(true);
        const video = document.createElement("video");
        video.src = url;
        video.onloadedmetadata = () => {
          clipBRef.current = video;
          if (clipARef.current) {
            setMediaLoaded(true);
            renderCurrentFrame();
          }
        };
      } else {
        setIsClipBVideo(false);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          clipBRef.current = img;
          if (clipARef.current) {
            setMediaLoaded(true);
            renderCurrentFrame();
          }
        };
      }
    },
    [renderCurrentFrame],
  );

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  // Handle seek
  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (!isPlaying) {
        renderCurrentFrame();
      }
    },
    [isPlaying, renderCurrentFrame],
  );

  // Handle transition selection
  const handleSelectTransition = useCallback((transition: TransitionPreset) => {
    setSelectedTransition(transition);
    setDuration(transition.defaultDuration);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // Filter transitions
  const filteredTransitions = useMemo(() => {
    if (searchQuery) {
      return searchTransitions(searchQuery);
    }
    return getTransitionsByCategory(selectedCategory);
  }, [selectedCategory, searchQuery]);

  // Handle upload
  const handleGeneratePreview = async () => {
    if (!selectedTransition || !clipARef.current || !clipBRef.current) {
      setUploadMessage("Please select a transition and ensure media is loaded");
      setUploadStatus("error");
      return;
    }

    setGeneratingPreview(true);
    setUploadMessage("");

    try {
      // Generate WebM preview
      const preview = await generateTransitionPreview(clipARef.current, clipBRef.current, selectedTransition, {
        width: 640,
        height: 360,
        fps: 30,
        duration: duration,
      });

      // Generate thumbnail
      const thumbnail = await generateThumbnail(clipARef.current, clipBRef.current, selectedTransition, 0.5, 640, 360);

      setPreviewResult(preview);
      setThumbnailDataUrl(thumbnail.dataUrl);
      setShowPreviewModal(true);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : "Failed to generate preview");
      console.error("Preview generation error:", error);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedTransition || !previewResult || !thumbnailDataUrl) {
      setUploadMessage("Please generate a preview first");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Publishing transition...");

    try {
      // Convert preview blob to base64
      const previewBase64 = await blobToBase64(previewResult.blob);

      const response = await fetch(`${API_BASE_URL}/transitions/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transition: {
            id: selectedTransition.id,
            name: selectedTransition.name,
            type: "transition",
            category: selectedTransition.category,
            description: selectedTransition.description,
            tags: selectedTransition.tags,
            defaultDuration: duration,
            defaultAlignment: selectedTransition.defaultAlignment,
            defaultEasing: selectedTransition.defaultEasing,
            renderer: selectedTransition.renderer,
            params: selectedTransition.params,
            published: false,
          },
          thumbnailDataUrl,
          previewDataUrl: previewBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadStatus("success");
      setUploadMessage(data.message || `Transition "${selectedTransition.name}" published successfully!`);
      setShowPreviewModal(false);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : "Failed to publish transition");
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDownloadPreview = () => {
    if (!previewResult || !selectedTransition) return;
    downloadBlob(previewResult.blob, `${selectedTransition.id}-preview.webm`);
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailDataUrl || !selectedTransition) return;
    const link = document.createElement("a");
    link.href = thumbnailDataUrl;
    link.download = `${selectedTransition.id}-thumbnail.png`;
    link.click();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0B0B10]">
      {/* Left Sidebar - Transition Library */}
      <div className="flex w-80 shrink-0 flex-col border-r border-[#1A1A24] bg-[#0F0F16]">
        {/* Header */}
        <div className="border-b border-[#1A1A24] p-4">
          <h2 className="text-lg font-bold text-white">Transition Library</h2>
          <p className="mt-1 text-xs text-[#9A9AAA]">Professional transition effects</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1A1A24]">
          <button onClick={() => setLeftTab("presets")} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${leftTab === "presets" ? "border-b-2 border-violet-500 text-white" : "text-[#9A9AAA] hover:text-white"}`}>
            Presets
          </button>
          <button onClick={() => setLeftTab("ai")} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${leftTab === "ai" ? "border-b-2 border-violet-500 text-white" : "text-[#9A9AAA] hover:text-white"}`}>
            AI Generate
          </button>
        </div>

        {/* Content */}
        {leftTab === "presets" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9AAA]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search transitions..." className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] py-2 pl-10 pr-3 text-sm text-white placeholder-[#9A9AAA] outline-none focus:border-violet-500" />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {TRANSITION_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCategory === cat ? "bg-violet-500 text-white" : "bg-[#1A1A24] text-[#9A9AAA] hover:bg-[#2A2A38] hover:text-white"}`}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Transition List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <div className="space-y-2">
                {filteredTransitions.map((transition) => (
                  <button key={transition.id} onClick={() => handleSelectTransition(transition)} className={`w-full rounded-lg border p-3 text-left transition-all ${selectedTransition?.id === transition.id ? "border-violet-500 bg-violet-500/10" : "border-[#2A2A38] bg-[#1A1A24] hover:border-violet-400/50 hover:bg-[#2A2A38]"}`}>
                    <div className="font-medium text-white">{transition.name}</div>
                    <div className="mt-1 text-xs text-[#9A9AAA]">{transition.description}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {transition.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-[#2A2A38] px-2 py-0.5 text-[10px] text-[#9A9AAA]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {leftTab === "ai" && (
          <div className="flex flex-1 flex-col p-4">
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI Generation</span>
              </div>
              <p className="mt-2 text-xs text-[#9A9AAA]">AI-powered transition generation coming soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* Center - Preview Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Preview Header */}
        <div className="border-b border-[#1A1A24] bg-[#0F0F16] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">{selectedTransition?.name || "Select a transition"}</h3>
              <p className="text-xs text-[#9A9AAA]">{selectedTransition?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSplitComparison(!showSplitComparison)} className="flex items-center gap-2 rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-3 py-2 text-xs text-white hover:border-violet-500/50 hover:bg-[#2A2A38]">
                {showSplitComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSplitComparison ? "Hide Split" : "Show Split"}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center bg-[#000000] p-8">
          <canvas ref={canvasRef} width={1920} height={1080} className="max-h-full max-w-full rounded-lg shadow-2xl" style={{ imageRendering: "auto" }} />

          {!mediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-500" />
                <p className="mt-2 text-sm text-[#9A9AAA]">Loading media...</p>
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="border-t border-[#1A1A24] bg-[#0F0F16] p-4">
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause} disabled={!mediaLoaded} className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>

            <button onClick={handleReset} disabled={!mediaLoaded} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A38] text-white hover:bg-[#1A1A24] disabled:opacity-50">
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <input type="range" min={0} max={duration} step={0.01} value={currentTime} onChange={(e) => handleSeek(parseFloat(e.target.value))} disabled={!mediaLoaded} className="w-full accent-violet-500" />
              <div className="mt-1 flex justify-between text-xs text-[#9A9AAA]">
                <span>{currentTime.toFixed(2)}s</span>
                <span>{duration.toFixed(2)}s</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} className="rounded" />
              Loop
            </label>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="border-t border-[#1A1A24] bg-[#0F0F16] p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-[#9A9AAA]">Clip A (Outgoing)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#2A2A38] bg-[#1A1A24] px-4 py-3 text-sm text-white hover:border-violet-500/50 hover:bg-[#2A2A38]">
                <Film className="h-4 w-4" />
                Upload Clip A
                <input type="file" accept="image/*,video/*" onChange={handleClipAUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#9A9AAA]">Clip B (Incoming)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#2A2A38] bg-[#1A1A24] px-4 py-3 text-sm text-white hover:border-violet-500/50 hover:bg-[#2A2A38]">
                <Film className="h-4 w-4" />
                Upload Clip B
                <input type="file" accept="image/*,video/*" onChange={handleClipBUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Parameters & Export */}
      <div className="flex w-80 shrink-0 flex-col border-l border-[#1A1A24] bg-[#0F0F16]">
        {/* Header */}
        <div className="border-b border-[#1A1A24] p-4">
          <div className="flex items-center gap-2 text-white">
            <Sliders className="h-4 w-4" />
            <h3 className="font-semibold">Parameters</h3>
          </div>
        </div>

        {/* Parameters */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Duration (seconds)</label>
              <input type="number" min={0.1} max={10} step={0.1} value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </div>

            {/* Easing */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Easing</label>
              <div className="rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-sm text-[#9A9AAA]">{selectedTransition?.defaultEasing || "linear"}</div>
            </div>

            {/* Alignment */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Alignment</label>
              <div className="rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-sm text-[#9A9AAA]">{selectedTransition?.defaultAlignment || "center"}</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="border-t border-[#1A1A24] p-4">
          <button onClick={handleGeneratePreview} disabled={!selectedTransition || !mediaLoaded || generatingPreview} className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 font-medium text-white hover:bg-violet-600 disabled:opacity-50">
            {generatingPreview ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Generate Preview
              </>
            )}
          </button>

          {previewResult && (
            <div className="mb-3 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Preview ready ({formatFileSize(previewResult.size)})</span>
              </div>
              <button onClick={() => setShowPreviewModal(true)} className="mt-2 text-xs text-green-400 hover:underline">
                View Preview
              </button>
            </div>
          )}

          {uploadMessage && (
            <div className={`mb-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${uploadStatus === "success" ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400"}`}>
              {uploadStatus === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>{uploadMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F0F16] border border-[#2A2A38] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1A1A24] bg-[#0F0F16] px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-white">Preview & Upload</h3>
                <p className="text-sm text-[#9A9AAA] mt-0.5">{selectedTransition?.name}</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#1A1A24] text-[#9A9AAA] hover:text-white hover:bg-[#2A2A38] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Video Preview */}
                <div className="col-span-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Video className="h-4 w-4 text-violet-400" />
                      Video Preview
                    </h4>
                    <div className="rounded-xl overflow-hidden bg-black border border-[#2A2A38] shadow-xl">
                      <video src={previewResult.dataUrl} controls loop autoPlay className="w-full aspect-video" />
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  {thumbnailDataUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-violet-400" />
                        Thumbnail
                      </h4>
                      <div className="rounded-xl overflow-hidden bg-black border border-[#2A2A38]">
                        <img src={thumbnailDataUrl} alt="Thumbnail" className="w-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Info & Actions */}
                <div className="space-y-4">
                  {/* File Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">File Information</h4>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-[#1A1A24] border border-[#2A2A38] p-3">
                        <div className="text-xs text-[#9A9AAA] mb-1">Video Size</div>
                        <div className="text-base text-white font-semibold">{formatFileSize(previewResult.size)}</div>
                      </div>
                      <div className="rounded-lg bg-[#1A1A24] border border-[#2A2A38] p-3">
                        <div className="text-xs text-[#9A9AAA] mb-1">Duration</div>
                        <div className="text-base text-white font-semibold">{previewResult.duration.toFixed(2)}s</div>
                      </div>
                      <div className="rounded-lg bg-[#1A1A24] border border-[#2A2A38] p-3">
                        <div className="text-xs text-[#9A9AAA] mb-1">Resolution</div>
                        <div className="text-base text-white font-semibold">640 × 360</div>
                      </div>
                      <div className="rounded-lg bg-[#1A1A24] border border-[#2A2A38] p-3">
                        <div className="text-xs text-[#9A9AAA] mb-1">Format</div>
                        <div className="text-base text-white font-semibold">WebM (VP8)</div>
                      </div>
                    </div>
                  </div>

                  {/* Download Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Download</h4>
                    <div className="space-y-2">
                      <button onClick={handleDownloadPreview} className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2A2A38] hover:border-violet-500/50 transition-all">
                        <Download className="h-4 w-4" />
                        Download Video
                      </button>
                      <button onClick={handleDownloadThumbnail} className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2A2A38] bg-[#1A1A24] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2A2A38] hover:border-violet-500/50 transition-all">
                        <Download className="h-4 w-4" />
                        Download Thumbnail
                      </button>
                    </div>
                  </div>

                  {/* Upload Action */}
                  <div className="pt-4 border-t border-[#1A1A24]">
                    <button onClick={handleUpload} disabled={uploadStatus === "uploading"} className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 font-semibold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20">
                      {uploadStatus === "uploading" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Publish to API
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
