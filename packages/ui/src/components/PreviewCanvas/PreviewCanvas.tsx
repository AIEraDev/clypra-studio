/**
 * PreviewCanvas Component
 *
 * Renders effect with current parameters.
 * Supports pause/play/scrub and before/after comparison.
 */

import React, { useEffect, useRef, useState } from "react";

export interface PreviewCanvasProps {
  /** Effect definition to render */
  effect: any; // TODO: Type from @clypra/engine
  /** Media inputs for the effect */
  inputs: Record<string, any>;
  /** Current playback time in seconds */
  currentTime: number;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show before/after comparison */
  showComparison?: boolean;
  /** Playback state */
  playing?: boolean;
  /** Callback when playback state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Callback when time changes */
  onTimeChange?: (time: number) => void;
}

export function PreviewCanvas({ effect, inputs, currentTime, width = 1920, height = 1080, showComparison = false, playing = false, onPlayingChange, onTimeChange }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Create object URL from video file
  useEffect(() => {
    const videoFile = inputs?.video;
    if (videoFile instanceof File) {
      const url = URL.createObjectURL(videoFile);
      setVideoObjectUrl(url);
      setVideoLoaded(false);
      return () => {
        URL.revokeObjectURL(url);
        setVideoObjectUrl(null);
      };
    } else {
      setVideoObjectUrl(null);
      setVideoLoaded(false);
    }
  }, [inputs?.video]);

  // Sync video element with currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;

    // Update video currentTime if it differs significantly
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoLoaded]);

  // Sync video playback with playing state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;

    if (playing) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [playing, videoLoaded]);

  // Handle playback animation
  useEffect(() => {
    if (!playing) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const video = videoRef.current;
      if (video && videoLoaded) {
        onTimeChange?.(video.currentTime);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playing, videoLoaded, onTimeChange]);

  // Render video frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      if (video && videoLoaded && video.readyState >= 2) {
        // Calculate aspect ratio fit
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > canvasAspect) {
          // Video is wider - fit width
          drawHeight = width / videoAspect;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Video is taller - fit height
          drawWidth = height * videoAspect;
          offsetX = (width - drawWidth) / 2;
        }

        // Draw video frame
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // TODO: Apply effect shaders here
        // Effect rendering will be integrated with @clypra/runtime PixiRenderer
        if (effect) {
          // For now, show effect info as overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(10, 10, 300, 80);

          ctx.fillStyle = "#3b82f6";
          ctx.font = "16px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(`Effect: ${effect.name}`, 20, 35);

          ctx.fillStyle = "#94a3b8";
          ctx.font = "12px monospace";
          ctx.fillText("⚠️  Effect rendering coming soon", 20, 60);
          ctx.fillText("Runtime integration in progress", 20, 78);
        }

        if (showComparison) {
          // Draw comparison split
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();

          ctx.fillStyle = "#f59e0b";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Before", width / 4, 30);
          ctx.fillText("After", (width * 3) / 4, 30);
        }
      } else {
        // Show placeholder
        ctx.fillStyle = "#3b82f6";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`Preview Canvas - ${effect?.name || "No Effect"}`, width / 2, height / 2 - 30);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px monospace";
        ctx.fillText(videoObjectUrl ? "Loading video..." : "Upload a video to preview", width / 2, height / 2 + 10);
        ctx.fillText(`Time: ${currentTime.toFixed(2)}s`, width / 2, height / 2 + 40);
      }
    };

    // Render immediately
    render();

    // Re-render on playing state or when video frame updates
    if (playing) {
      const interval = setInterval(render, 1000 / 60); // 60 FPS
      return () => clearInterval(interval);
    }
  }, [effect, videoObjectUrl, videoLoaded, currentTime, width, height, showComparison, playing]);

  const handleCanvasClick = () => {
    if (onPlayingChange) {
      onPlayingChange(!playing);
    }
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    const video = videoRef.current;
    if (video && onTimeChange) {
      onTimeChange(0); // Reset to start
    }
  };

  return (
    <div className="preview-canvas-container">
      {/* Hidden video element for loading and playback */}
      {videoObjectUrl && (
        <video
          ref={videoRef}
          src={videoObjectUrl}
          onLoadedData={handleVideoLoaded}
          onTimeUpdate={(e) => {
            if (playing) {
              const video = e.currentTarget;
              onTimeChange?.(video.currentTime);
            }
          }}
          style={{ display: "none" }}
          preload="auto"
        />
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          width: "100%",
          height: "auto",
          cursor: "pointer",
          border: "1px solid #334155",
          borderRadius: "8px",
          background: "#1a1a1a",
        }}
      />
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
        <label>
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(e) => {
              // Handle comparison toggle - prop would need to be passed
            }}
            style={{ marginRight: "6px" }}
          />
          Before/After
        </label>
        <span>
          Resolution: {width}×{height}
        </span>
      </div>
    </div>
  );
}
