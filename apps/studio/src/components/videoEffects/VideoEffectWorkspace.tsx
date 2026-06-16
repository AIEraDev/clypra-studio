/**
 * Video Effect Workspace (Enhanced)
 *
 * Complete testing environment for video effects with:
 * - Video import and playback
 * - Effect selection and parameter tuning
 * - Real-time preview with comparison modes
 * - Export test renders
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { EffectRenderer, type EffectRendererType, type EffectParameters } from "@clypra/engine";
import { VideoPlayer } from "./VideoPlayer";
import { EffectParameterEditor } from "./EffectParameterEditor";
import { Download, Upload, Info, Maximize2 } from "lucide-react";

export function VideoEffectWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [selectedEffect, setSelectedEffect] = useState<EffectRendererType>("shake");
  const [intensity, setIntensity] = useState(0.8);
  const [parameters, setParameters] = useState<EffectParameters>({ intensity: 50, frequency: 10 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Categorized effects
  const effectCategories = {
    Camera: ["shake", "zoom", "pan", "rotate"] as EffectRendererType[],
    Blur: ["blur", "motion_blur", "radial_blur", "zoom_blur"] as EffectRendererType[],
    Style: ["vhs", "glitch", "rgb_split", "film_grain", "pixelate", "scanlines", "crt"] as EffectRendererType[],
    Light: ["flash", "flicker", "vignette", "glow", "light_leak"] as EffectRendererType[],
    Time: ["echo", "strobe"] as EffectRendererType[],
  };

  // Handle video file upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  }, []);

  // Render effect on canvas
  const renderEffect = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply effect
      try {
        EffectRenderer.apply(ctx, selectedEffect, parameters, intensity, currentTime);
      } catch (error) {
        console.error("Effect render error:", error);
      }
    },
    [selectedEffect, parameters, intensity, currentTime],
  );

  // Export current frame
  const exportFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect}-frame-${currentTime.toFixed(2)}s.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedEffect, currentTime]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Effect Selection */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Video Effects</h1>
          <p className="text-sm text-gray-600 mt-1">Test and preview effects in real-time</p>
        </div>

        {/* Video Upload */}
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
            <Upload size={20} />
            <span className="font-medium">Import Video</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          {videoMetadata && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{videoMetadata.duration.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolution:</span>
                <span className="font-medium">
                  {videoMetadata.width}x{videoMetadata.height}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Effect Categories */}
        <div className="p-4 space-y-4">
          {Object.entries(effectCategories).map(([category, effects]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h3>
              <div className="space-y-1">
                {effects.map((effect) => (
                  <button key={effect} onClick={() => setSelectedEffect(effect)} className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${selectedEffect === effect ? "bg-blue-100 text-blue-900 font-medium" : "text-gray-700 hover:bg-gray-100"}`}>
                    {effect.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Preview Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          {videoUrl ? (
            <div className="relative max-w-full max-h-full">
              <canvas ref={canvasRef} width={videoMetadata?.width || 1280} height={videoMetadata?.height || 720} className="max-w-full max-h-full rounded-lg shadow-2xl" />

              {/* Effect Info Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur">
                <div className="font-semibold">{selectedEffect.replace(/_/g, " ").toUpperCase()}</div>
                <div className="text-gray-300 text-xs">Intensity: {(intensity * 100).toFixed(0)}%</div>
              </div>

              {/* Export Button */}
              <button onClick={exportFrame} className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg text-sm backdrop-blur transition-colors">
                <Download size={16} />
                Export Frame
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Import a video to start testing effects</p>
              <p className="text-sm mt-2">Supported formats: MP4, WebM, MOV</p>
            </div>
          )}
        </div>

        {/* Video Player Controls */}
        {videoUrl && (
          <div className="border-t border-gray-200">
            <VideoPlayer videoUrl={videoUrl} onTimeUpdate={setCurrentTime} onFrameReady={renderEffect} onMetadataLoad={setVideoMetadata} className="bg-white" />
          </div>
        )}
      </div>

      {/* Right Panel - Parameters */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Effect Settings</h2>
        </div>

        <div className="p-4 space-y-6">
          {/* Intensity Control */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Intensity</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Master Intensity</span>
                <span className="text-sm font-medium text-gray-900">{(intensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
            </div>
          </div>

          {/* Effect-Specific Parameters */}
          <div>
            <EffectParameterEditor effectType={selectedEffect} parameters={parameters} onChange={setParameters} />
          </div>

          {/* Info Panel */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Testing Tips</p>
                <ul className="space-y-1 text-blue-800 text-xs">
                  <li>• Adjust intensity for subtle or dramatic effects</li>
                  <li>• Use timeline to test at different moments</li>
                  <li>• Export frames for quality comparison</li>
                  <li>• Try different parameter combinations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
