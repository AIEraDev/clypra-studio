/**
 * Filter Workspace
 * Test, generate, and upload color grading filters to R2
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, Upload, Sparkles, Zap, Image as ImageIcon, Film, Loader2, Settings } from "lucide-react";

const FILTER_CATEGORIES = ["vintage", "modern", "cinematic", "bw", "color"];
const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

interface FilterPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  cssFilter: string;
  intensity: number;
}

export function FilterWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [isVideo, setIsVideo] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset | null>(null);
  const [intensity, setIntensity] = useState(75);
  const [mediaMetadata, setMediaMetadata] = useState<{ width: number; height: number; duration?: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // AI Generation
  const [aiPrompt, setAiPrompt] = useState("vintage film look with warm tones");
  const [aiCategory, setAiCategory] = useState<string>("vintage");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");

  // Upload
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setIsVideo(false);

    // Load image and render to canvas
    const img = new Image();
    img.onload = () => {
      setMediaMetadata({ width: img.width, height: img.height });
      imageRef.current = img;
      renderFilterOnImage(img);
    };
    img.src = url;
  }, []);

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setIsVideo(true);

    // Create video element to get metadata
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      setMediaMetadata({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
      videoRef.current = video;
    };
  }, []);

  // Render filter on image
  const renderFilterOnImage = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas || !img) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Clear and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(img, 0, 0);

      // Apply CSS filter if selected
      if (selectedFilter && selectedFilter.cssFilter) {
        const adjustedIntensity = intensity / selectedFilter.intensity;
        ctx.filter = interpolateFilter(selectedFilter.cssFilter, adjustedIntensity);
        ctx.drawImage(img, 0, 0);
      }
    },
    [selectedFilter, intensity],
  );

  // Render filter on video frame
  const renderFilterOnVideo = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply CSS filter if selected
      if (selectedFilter && selectedFilter.cssFilter) {
        const adjustedIntensity = intensity / selectedFilter.intensity;
        ctx.filter = interpolateFilter(selectedFilter.cssFilter, adjustedIntensity);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    },
    [selectedFilter, intensity],
  );

  // Interpolate filter strength
  const interpolateFilter = (filterStr: string, factor: number): string => {
    return filterStr.replace(/(\d+\.?\d*)(%|deg|px)?/g, (match, value, unit) => {
      const num = parseFloat(value);
      const adjusted = num * factor;
      return `${adjusted}${unit || ""}`;
    });
  };

  // Re-render when filter or intensity changes (for images)
  useEffect(() => {
    if (!isVideo && imageRef.current) {
      renderFilterOnImage(imageRef.current);
    }
  }, [isVideo, selectedFilter, intensity, renderFilterOnImage]);

  // Video playback animation loop
  useEffect(() => {
    if (!isVideo || !videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        renderFilterOnVideo(video);
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
  }, [isVideo, isPlaying, renderFilterOnVideo]);

  // Update canvas dimensions when metadata loads
  useEffect(() => {
    if (mediaMetadata && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = mediaMetadata.width;
      canvas.height = mediaMetadata.height;

      if (isVideo && videoRef.current) {
        renderFilterOnVideo(videoRef.current);
      } else if (!isVideo && imageRef.current) {
        renderFilterOnImage(imageRef.current);
      }
    }
  }, [mediaMetadata, isVideo, renderFilterOnVideo, renderFilterOnImage]);

  // Video controls
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        renderFilterOnVideo(videoRef.current);
      }
    },
    [isPlaying, renderFilterOnVideo],
  );

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
        category: aiCategory,
        description: data.description || aiPrompt,
        cssFilter: data.cssFilter || "",
        intensity: data.intensity?.default || 75,
      };

      setSelectedFilter(generatedFilter);
      setIntensity(generatedFilter.intensity);
      setAiStatus("success");
      setAiMessage(`Generated: ${generatedFilter.name}`);
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
          },
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFilter?.name || "filter"}-preview.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedFilter]);

  return (
    <div className="flex h-screen bg-[#0E0E12]">
      {/* Left Sidebar */}
      <div className="w-80 bg-[#1E1E26] border-r border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h1 className="text-lg font-bold text-white">Filter Lab</h1>
          <p className="text-xs text-gray-400 mt-1">Generate, test, and upload filters</p>
        </div>

        {/* Media Upload */}
        <div className="p-4 border-b border-[#2A2A38]">
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white text-sm rounded-lg cursor-pointer transition-colors">
            <Film size={18} />
            <span className="font-medium">Import Video</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <label className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A2A38] hover:bg-[#3A3A48] text-white text-sm rounded-lg cursor-pointer transition-colors">
            <ImageIcon size={18} />
            <span className="font-medium">Import Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          {mediaMetadata && (
            <div className="mt-3 p-2 bg-[#0E0E12] rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium">{isVideo ? "Video" : "Image"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution:</span>
                <span className="font-medium">
                  {mediaMetadata.width}x{mediaMetadata.height}
                </span>
              </div>
              {isVideo && mediaMetadata.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium">{mediaMetadata.duration.toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Generation */}
        <div className="p-4 border-b border-[#2A2A38] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-300">
            <Sparkles size={14} />
            <span>AI Filter Generation</span>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} className="w-full px-3 py-2 bg-[#0E0E12] border border-[#2A2A38] rounded text-sm text-white focus:border-[#7C6FFF] outline-none">
              {FILTER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter Description</label>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the filter look you want..." rows={3} className="w-full px-3 py-2 bg-[#0E0E12] border border-[#2A2A38] rounded text-sm text-white resize-none focus:border-[#7C6FFF] outline-none" />
          </div>

          <button onClick={handleGenerateFilter} disabled={aiStatus === "generating"} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {aiStatus === "generating" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Filter
              </>
            )}
          </button>

          {aiMessage && <div className={`p-2 rounded text-xs ${aiStatus === "error" ? "bg-red-500/10 text-red-300" : "bg-green-500/10 text-green-300"}`}>{aiMessage}</div>}
        </div>

        {/* Upload to R2 */}
        {selectedFilter && (
          <div className="p-4 border-b border-[#2A2A38] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
              <Zap size={14} />
              <span>Upload to R2</span>
            </div>

            <div className="p-3 bg-[#0E0E12] rounded space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Filter:</span>
                <span className="font-medium">{selectedFilter.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="font-medium">{selectedFilter.category}</span>
              </div>
            </div>

            <button onClick={handleUploadFilter} disabled={uploadStatus === "uploading"} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Upload to R2
                </>
              )}
            </button>

            {uploadMessage && <div className={`p-2 rounded text-xs ${uploadStatus === "error" ? "bg-red-500/10 text-red-300" : "bg-green-500/10 text-green-300"}`}>{uploadMessage}</div>}
          </div>
        )}
      </div>

      {/* Main Content - Preview */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center justify-center bg-gray-900 p-4" style={{ height: isVideo ? "calc(100vh - 120px)" : "100vh" }}>
          {mediaUrl ? (
            <div className="relative h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={mediaMetadata?.width || 1280}
                height={mediaMetadata?.height || 720}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
                className="rounded-lg shadow-2xl"
              />

              {selectedFilter && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur">
                  <div className="font-semibold">{selectedFilter.name}</div>
                  <div className="text-gray-300 text-xs">Intensity: {intensity}%</div>
                </div>
              )}

              <div className="absolute top-4 right-4">
                <button onClick={exportFrame} className="flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg text-sm backdrop-blur transition-colors">
                  <Download size={16} />
                  Export Frame
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Import a video or image to start</p>
              <p className="text-sm mt-2">Test filters in real-time and generate new ones with AI</p>
            </div>
          )}
        </div>

        {/* Video Controls */}
        {isVideo && mediaUrl && (
          <div className="bg-[#1E1E26] border-t border-[#2A2A38] p-4">
            <div className="flex items-center gap-4">
              <button onClick={handlePlayPause} className="px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded-lg text-sm font-medium transition-colors">
                {isPlaying ? "Pause" : "Play"}
              </button>

              <div className="flex-1">
                <input type="range" min="0" max={mediaMetadata?.duration || 0} step="0.1" value={currentTime} onChange={(e) => handleSeek(parseFloat(e.target.value))} className="w-full" />
              </div>

              <div className="text-sm text-gray-400 font-mono min-w-[100px] text-right">
                {currentTime.toFixed(1)}s / {mediaMetadata?.duration?.toFixed(1) || 0}s
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Controls */}
      <div className="w-72 bg-[#1E1E26] border-l border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h2 className="text-base font-semibold text-white">Filter Settings</h2>
        </div>

        {selectedFilter ? (
          <div className="p-4 space-y-6">
            {/* Filter Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Filter</h3>
              <div className="p-3 bg-[#0E0E12] rounded space-y-1 text-xs">
                <div className="font-semibold text-white">{selectedFilter.name}</div>
                <div className="text-gray-400">{selectedFilter.description}</div>
              </div>
            </div>

            {/* Intensity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Intensity</h3>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Strength</span>
                <span className="font-medium">{intensity}%</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} className="w-full" />
            </div>

            {/* CSS Filter Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">CSS Filter</h3>
              <div className="p-2 bg-[#0E0E12] rounded text-xs font-mono text-gray-300 break-all">{selectedFilter.cssFilter}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">Generate or select a filter to adjust settings</p>
          </div>
        )}
      </div>
    </div>
  );
}
