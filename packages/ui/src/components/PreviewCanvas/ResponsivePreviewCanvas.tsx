/**
 * Native preview boundary used by the runtime observatory.
 *
 * Production preview ownership lives in the native compositor; this
 * observatory component remains a media/viewport probe without creating a
 * second rendering backend.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useResponsiveCanvas } from "./useResponsiveCanvas";
import "./PreviewCanvas.css";

export interface ResponsivePreviewCanvasProps {
  effect: any;
  inputs: Record<string, any>;
  currentTime: number;
  renderWidth?: number;
  renderHeight?: number;
  responsive?: boolean;
  fit?: "contain" | "cover" | "fill";
  maxRenderScale?: number;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onTimeChange?: (time: number) => void;
  onDisplaySizeChange?: (size: { width: number; height: number }) => void;
  onLog?: (message: string) => void;
}

export function ResponsivePreviewCanvas({
  inputs,
  currentTime,
  renderWidth = 1920,
  renderHeight = 1080,
  responsive = true,
  fit = "contain",
  playing = false,
  onTimeChange,
  onDisplaySizeChange,
  onLog,
}: ResponsivePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const onLogRef = useRef(onLog);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const { containerRef, displaySize } = useResponsiveCanvas({
    aspectRatio: renderWidth / renderHeight,
    fit,
    enabled: responsive,
    onDisplaySizeChange,
  });

  onLogRef.current = onLog;
  const log = useCallback((message: string) => onLogRef.current?.(message), []);

  useEffect(() => {
    const source = inputs?.video;
    if (source instanceof File) {
      const url = URL.createObjectURL(source);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoUrl(typeof source === "string" ? source : null);
  }, [inputs?.video]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    setVideoReady(false);
    video.load();
    const onLoaded = () => setVideoReady(true);
    video.addEventListener("loadeddata", onLoaded);
    return () => video.removeEventListener("loadeddata", onLoaded);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;
    if (Math.abs(video.currentTime - currentTime) > 0.05) video.currentTime = currentTime;
    if (playing) void video.play().catch((error) => log(`Native media playback unavailable: ${String(error)}`));
    else video.pause();
  }, [currentTime, playing, videoReady, log]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = Math.max(1, Math.round(renderWidth));
    canvas.height = Math.max(1, Math.round(renderHeight));
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      if (playing) animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [playing, renderHeight, renderWidth, videoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onTimeChange) return;
    const onTime = () => onTimeChange(video.currentTime);
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [onTimeChange]);

  return (
    <div ref={containerRef} className="preview-canvas-container">
      <video ref={videoRef} src={videoUrl ?? undefined} muted playsInline className="hidden" />
      <canvas
        ref={canvasRef}
        width={renderWidth}
        height={renderHeight}
        className="preview-canvas"
        style={{ width: displaySize.width, height: displaySize.height }}
        aria-label="Native preview readback"
      />
    </div>
  );
}
