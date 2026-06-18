/**
 * Video Effect Workspace
 * Clean, optimized version for smooth playback
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { EffectRenderer, type EffectRendererType, type EffectParameters } from "@clypra/engine";
import { VideoPlayer, EffectParameterEditor } from "../common";
import { exportStaticImageWithEffect } from "./EffectVideoExporter";
import { Download, Upload, Info, Image as ImageIcon, Film } from "lucide-react";

export function VideoEffectWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [isImage, setIsImage] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<EffectRendererType | null>(null);
  const [intensity, setIntensity] = useState(0.8);
  const [parameters, setParameters] = useState<EffectParameters>({ intensity: 50, frequency: 10 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load effects from registry
  const [effectCategories, setEffectCategories] = useState<Record<string, EffectRendererType[]>>({});

  useEffect(() => {
    // Dynamically load effects from @clypra/engine
    const loadEffects = async () => {
      const { getEffectsByCategory } = await import("@clypra/engine");

      const categories: Record<string, EffectRendererType[]> = {};

      // Load Camera effects
      const cameraEffects = getEffectsByCategory("camera");
      if (cameraEffects && Array.isArray(cameraEffects) && cameraEffects.length > 0) {
        categories.Camera = cameraEffects.map((e: any) => e.id as EffectRendererType);
      }

      // Load Light effects
      const lightEffects = getEffectsByCategory("light");
      if (lightEffects && Array.isArray(lightEffects) && lightEffects.length > 0) {
        categories.Light = lightEffects.map((e: any) => e.id as EffectRendererType);
      }

      setEffectCategories(categories);
    };

    loadEffects();
  }, []);

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setImageUrl(undefined);
    setIsImage(false);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setVideoUrl(undefined);
    setIsImage(true);

    // Load image and render to canvas
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      setVideoMetadata({
        duration: 3, // Default duration for effect
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  }, []);

  // Render effect on canvas (optimized)
  const renderEffect = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Clear and draw video
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply effect if selected
      if (selectedEffect) {
        try {
          EffectRenderer.apply(ctx, selectedEffect, parameters, intensity, video.currentTime);
        } catch (error) {
          console.error("Effect error:", error);
        }
      }
    },
    [selectedEffect, parameters, intensity],
  );

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !videoElementRef.current) return;

    const video = videoElementRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        renderEffect(video);
        setCurrentTime(video.currentTime);
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, renderEffect]);

  // Animation loop for static images
  useEffect(() => {
    if (!isImage || !imageUrl || !selectedEffect) return;

    let rafId: number;
    let startTime = performance.now();

    const animateImage = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds
      const time = elapsed % 3; // Loop every 3 seconds

      setCurrentTime(time);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Load and draw image
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply effect
        try {
          EffectRenderer.apply(ctx, selectedEffect, parameters, intensity, time);
        } catch (error) {
          console.error("Effect error:", error);
        }
      };
      img.src = imageUrl;

      rafId = requestAnimationFrame(animateImage);
    };

    rafId = requestAnimationFrame(animateImage);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isImage, imageUrl, selectedEffect, parameters, intensity]);

  // Update canvas dimensions when metadata loads
  useEffect(() => {
    if (videoMetadata && canvasRef.current && videoElementRef.current) {
      const canvas = canvasRef.current;
      const video = videoElementRef.current;

      canvas.width = videoMetadata.width;
      canvas.height = videoMetadata.height;
      renderEffect(video);
    }
  }, [videoMetadata, renderEffect]);

  // Export frame
  const exportFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect || "video"}-frame-${currentTime.toFixed(2)}s.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedEffect, currentTime]);

  // Export video from static image
  const exportImageAsVideo = useCallback(async () => {
    if (!imageUrl || !selectedEffect) return;

    setIsExporting(true);

    try {
      // Fetch the image file
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      // Export as video (correct parameter order: file, effect, params, intensity, duration, fps)
      const videoBlob = await exportStaticImageWithEffect(file, selectedEffect as EffectRendererType, parameters, intensity, 3, 30);

      // Download
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect}-effect.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. See console for details.");
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, selectedEffect, parameters, intensity]);

  return (
    <div className="flex h-screen bg-[#0E0E12]">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#1E1E26] border-r border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h1 className="text-lg font-bold text-white">Video Effects</h1>
          <p className="text-xs text-gray-400 mt-1">Test effects in real-time</p>
        </div>

        {/* Video Upload */}
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

          {videoMetadata && (
            <div className="mt-3 p-2 bg-[#0E0E12] rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium">{isImage ? "Image" : "Video"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution:</span>
                <span className="font-medium">
                  {videoMetadata.width}x{videoMetadata.height}
                </span>
              </div>
              {!isImage && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium">{videoMetadata.duration.toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Effect Categories */}
        <div className="p-4 space-y-4">
          {Object.keys(effectCategories).length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">No effects loaded</p>
              <p className="text-xs mt-1">Effects will appear here</p>
            </div>
          ) : (
            Object.entries(effectCategories).map(([category, effects]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{category}</h3>
                <div className="space-y-1">
                  {effects.map((effect) => (
                    <button key={effect} onClick={() => setSelectedEffect(effect)} className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${selectedEffect === effect ? "bg-[#7C6FFF] text-white font-medium" : "text-gray-300 hover:bg-[#2A2A38]"}`}>
                      {effect.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Preview */}
        <div className="flex items-center justify-center bg-gray-900 p-4" style={{ height: "calc(100vh - 56px - 180px)" }}>
          {videoUrl || imageUrl ? (
            <div className="relative h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={videoMetadata?.width || 1280}
                height={videoMetadata?.height || 720}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
                className="rounded-lg shadow-2xl"
              />

              {selectedEffect && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur">
                  <div className="font-semibold">{selectedEffect.replace(/_/g, " ").toUpperCase()}</div>
                  <div className="text-gray-300 text-xs">Intensity: {(intensity * 100).toFixed(0)}%</div>
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={exportFrame} className="flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg text-sm backdrop-blur transition-colors">
                  <Download size={16} />
                  Export Frame
                </button>

                {isImage && selectedEffect && (
                  <button onClick={exportImageAsVideo} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm backdrop-blur transition-colors ${isExporting ? "bg-gray-700 cursor-not-allowed" : "bg-[#7C6FFF] hover:bg-[#6B5EEE]"} text-white`}>
                    <Film size={16} />
                    {isExporting ? "Exporting..." : "Export as Video"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Import a video or image to start</p>
              <p className="text-sm mt-2">Videos for preview • Images for effect export</p>
            </div>
          )}
        </div>

        {/* Video Player Controls */}
        {videoUrl && (
          <div className="border-t border-[#2A2A38] shrink-0">
            <VideoPlayer
              videoUrl={videoUrl}
              onTimeUpdate={(time) => {
                setCurrentTime(time);
                // Only render on time update when paused (for scrubbing)
                if (videoElementRef.current?.paused) {
                  renderEffect(videoElementRef.current);
                }
              }}
              onFrameReady={(video) => {
                videoElementRef.current = video;
                setIsPlaying(!video.paused);
                // Initial render when video loads
                if (video.paused) {
                  renderEffect(video);
                }
              }}
              onMetadataLoad={setVideoMetadata}
              className="bg-[#1E1E26]"
            />
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-72 bg-[#1E1E26] border-l border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h2 className="text-base font-semibold text-white">Effect Settings</h2>
        </div>

        {selectedEffect ? (
          <div className="p-4 space-y-6">
            {/* Intensity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Intensity</h3>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Master</span>
                <span className="font-medium">{(intensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="w-full" />
            </div>

            {/* Effect Parameters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Parameters</h3>
              <EffectParameterEditor effectType={selectedEffect} parameters={parameters} onChange={setParameters} />
            </div>

            {/* Tips */}
            <div className="p-3 bg-[#7C6FFF]/10 rounded-lg border border-[#7C6FFF]/20">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-[#7C6FFF] mt-0.5 shrink-0" />
                <div className="text-xs text-white min-w-0">
                  <p className="font-medium mb-1">Tips</p>
                  <ul className="space-y-0.5 text-gray-300">
                    <li>• Adjust intensity for different effects</li>
                    <li>• Scrub timeline to test at any moment</li>
                    <li>• Export frames for comparison</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">Select an effect to adjust parameters</p>
          </div>
        )}
      </div>
    </div>
  );
}
