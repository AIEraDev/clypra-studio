/**
 * Timeline Component
 *
 * Draggable playhead with frame-accurate scrubbing.
 * Supports keyboard shortcuts for navigation.
 */

import React, { useRef, useState, useEffect } from "react";

export interface TimelineProps {
  /** Total duration in seconds */
  duration: number;
  /** Current playback time in seconds */
  currentTime: number;
  /** Callback when user seeks to a new time */
  onSeek: (time: number) => void;
  /** Frame rate for frame-accurate navigation */
  frameRate?: number;
  /** Show frame numbers instead of timecodes */
  showFrames?: boolean;
  /** Height of the timeline in pixels */
  height?: number;
}

export function Timeline({ duration, currentTime, onSeek, frameRate = 60, showFrames = false, height = 80 }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const currentFrame = Math.round(currentTime * frameRate);
  const totalFrames = Math.round(duration * frameRate);

  // Format time as MM:SS:FF or frame number
  const formatTime = (time: number): string => {
    if (showFrames) {
      return `Frame ${Math.round(time * frameRate)}`;
    }

    const totalSeconds = Math.floor(time);
    const frames = Math.round((time - totalSeconds) * frameRate);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  // Convert mouse position to time
  const getTimeFromMouseEvent = (e: React.MouseEvent | MouseEvent): number => {
    if (!containerRef.current) return 0;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    return progress * duration;
  };

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const time = getTimeFromMouseEvent(e);
    onSeek(time);
  };

  // Handle mouse move for dragging and hover
  const handleMouseMove = (e: React.MouseEvent) => {
    const time = getTimeFromMouseEvent(e);
    setHoverTime(time);

    if (isDragging) {
      onSeek(time);
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  // Handle global mouse events while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const time = getTimeFromMouseEvent(e);
      onSeek(time);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, onSeek, duration]);

  // Keyboard shortcuts for frame navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const frameDuration = 1 / frameRate;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onSeek(Math.max(0, currentTime - frameDuration));
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + frameDuration));
          break;
        case "Home":
          e.preventDefault();
          onSeek(0);
          break;
        case "End":
          e.preventDefault();
          onSeek(duration);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, frameRate, onSeek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverProgress = hoverTime !== null && duration > 0 ? (hoverTime / duration) * 100 : null;

  return (
    <div
      style={{
        width: "100%",
        padding: "16px",
        background: "#0f172a",
        borderRadius: "8px",
        border: "1px solid #334155",
      }}
    >
      {/* Timeline header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          fontSize: "14px",
          color: "#94a3b8",
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          height: `${height}px`,
          background: "#1e293b",
          borderRadius: "6px",
          cursor: isDragging ? "grabbing" : "grab",
          overflow: "hidden",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress}%`,
            background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
            transition: isDragging ? "none" : "width 0.1s ease-out",
          }}
        />

        {/* Hover indicator */}
        {hoverProgress !== null && !isDragging && (
          <div
            style={{
              position: "absolute",
              left: `${hoverProgress}%`,
              top: 0,
              bottom: 0,
              width: "2px",
              background: "#f59e0b",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "4px 8px",
                background: "#f59e0b",
                color: "#000",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                marginBottom: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {hoverTime !== null && formatTime(hoverTime)}
            </div>
          </div>
        )}

        {/* Playhead */}
        <div
          style={{
            position: "absolute",
            left: `${progress}%`,
            top: 0,
            bottom: 0,
            width: "3px",
            background: "#ef4444",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {/* Playhead handle */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "16px",
              height: "16px",
              background: "#ef4444",
              border: "2px solid #fff",
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Frame markers */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "20px",
            display: "flex",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 11 }, (_, i) => i * 10).map((percent) => (
            <div
              key={percent}
              style={{
                position: "absolute",
                left: `${percent}%`,
                height: percent % 20 === 0 ? "12px" : "6px",
                width: "1px",
                background: "#475569",
              }}
            />
          ))}
        </div>
      </div>

      {/* Timeline footer */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: "#64748b",
          textAlign: "center",
        }}
      >
        {showFrames ? `Frame ${currentFrame} / ${totalFrames}` : `${frameRate} FPS • Use ← → arrows for frame navigation`}
      </div>
    </div>
  );
}
