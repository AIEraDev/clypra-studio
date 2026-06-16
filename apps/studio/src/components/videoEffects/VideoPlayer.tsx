/**
 * Video Player Component
 *
 * Reusable video player with playback controls, timeline, and frame extraction.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  onTimeUpdate?: (time: number) => void;
  onFrameReady?: (frame: HTMLVideoElement) => void;
  onMetadataLoad?: (metadata: { duration: number; width: number; height: number }) => void;
  className?: string;
}

export function VideoPlayer({ videoUrl, onTimeUpdate, onFrameReady, onMetadataLoad, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Handle video loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const metadata = {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    };

    setDuration(video.duration);
    onMetadataLoad?.(metadata);
  }, [onMetadataLoad]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);
    onFrameReady?.(video);
  }, [onTimeUpdate, onFrameReady]);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Seek to time
  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Skip forward/backward
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seekTo(newTime);
    },
    [currentTime, duration, seekTo],
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Change volume
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        video.muted = false;
      }
    },
    [isMuted],
  );

  // Change playback speed
  const handleSpeedChange = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Hidden video element */}
      <video ref={videoRef} src={videoUrl} className="hidden" onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} loop />

      {/* Controls */}
      <div className="bg-gray-800 text-white p-4 rounded-lg space-y-3">
        {/* Timeline */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.01"
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          {/* Skip Back */}
          <button onClick={() => skip(-5)} className="p-2 hover:bg-gray-700 rounded" title="Skip back 5s">
            <SkipBack size={20} />
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlay} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Skip Forward */}
          <button onClick={() => skip(5)} className="p-2 hover:bg-gray-700 rounded" title="Skip forward 5s">
            <SkipForward size={20} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 ml-4">
            <button onClick={toggleMute} className="p-2 hover:bg-gray-700 rounded">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
          </div>

          {/* Playback Speed */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-400">Speed:</span>
            <select value={playbackSpeed} onChange={(e) => handleSpeedChange(parseFloat(e.target.value))} className="bg-gray-700 text-white text-sm px-2 py-1 rounded">
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
