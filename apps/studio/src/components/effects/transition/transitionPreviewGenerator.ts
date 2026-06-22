/**
 * Transition Preview Generator
 * Generate WebM video previews for transitions
 */

import { renderTransition } from "./transitionRenderer";
import type { TransitionPreset } from "./transitionPresets";

export interface PreviewOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  bitrate?: number;
  codec?: string;
}

export interface PreviewResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  duration: number;
}

const DEFAULT_OPTIONS: Required<PreviewOptions> = {
  width: 640,
  height: 360,
  fps: 30,
  duration: 2.0,
  bitrate: 1000000, // 1 Mbps
  codec: "vp8", // or "vp9"
};

/**
 * Generate a WebM preview video for a transition
 */
export async function generateTransitionPreview(clipA: HTMLImageElement | HTMLVideoElement, clipB: HTMLImageElement | HTMLVideoElement, transition: TransitionPreset, options: PreviewOptions = {}): Promise<PreviewResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Use transition's default duration if not specified
  const duration = transition.defaultDuration || opts.duration;

  // Create offscreen canvas for rendering
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Check if MediaRecorder API is supported
  if (!("MediaRecorder" in window)) {
    throw new Error("MediaRecorder API is not supported in this browser");
  }

  // Check for WebM support
  const mimeType = `video/webm;codecs=${opts.codec}`;
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    throw new Error(`${mimeType} is not supported in this browser`);
  }

  // Create media stream from canvas
  const stream = canvas.captureStream(opts.fps);

  // Setup MediaRecorder
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: opts.bitrate,
  });

  const chunks: Blob[] = [];

  // Collect data chunks
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  // Return promise that resolves when recording is complete
  return new Promise<PreviewResult>((resolve, reject) => {
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      const dataUrl = await blobToDataURL(blob);

      resolve({
        blob,
        dataUrl,
        size: blob.size,
        duration,
      });
    };

    mediaRecorder.onerror = (event: Event) => {
      reject(new Error(`MediaRecorder error: ${event}`));
    };

    // Start recording
    mediaRecorder.start();

    // Render frames
    const frameCount = Math.ceil(duration * opts.fps);
    const frameDelay = 1000 / opts.fps;
    let frameIndex = 0;

    const renderFrame = () => {
      if (frameIndex >= frameCount) {
        mediaRecorder.stop();
        return;
      }

      const progress = frameIndex / frameCount;
      renderTransition(ctx, clipA, clipB, transition, progress, duration);

      frameIndex++;
      setTimeout(renderFrame, frameDelay);
    };

    renderFrame();
  });
}

/**
 * Generate a PNG thumbnail at a specific progress point
 */
export async function generateThumbnail(clipA: HTMLImageElement | HTMLVideoElement, clipB: HTMLImageElement | HTMLVideoElement, transition: TransitionPreset, progress: number = 0.5, width: number = 640, height: number = 360): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  renderTransition(ctx, clipA, clipB, transition, progress, transition.defaultDuration);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate thumbnail"));
          return;
        }

        const dataUrl = canvas.toDataURL("image/png");
        resolve({ dataUrl, blob });
      },
      "image/png",
      0.95,
    );
  });
}

/**
 * Convert Blob to Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load an image from a URL
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Load a video from a URL
 */
export function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
    video.src = url;
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
