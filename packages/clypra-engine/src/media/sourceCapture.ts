/**
 * Captures a video's real dimensions ONCE, as soon as they're known, and stores them
 * on the ClipConform record. Never called again for that clip unless the user re-imports
 * a different source file. This is the "stable reference" every professional NLE relies on.
 */
export function captureVideoSourceDimensions(
  videoEl: HTMLVideoElement,
  onCaptured: (width: number, height: number) => void,
): void {
  if (videoEl.readyState >= 1 && videoEl.videoWidth && videoEl.videoHeight) {
    onCaptured(videoEl.videoWidth, videoEl.videoHeight);
    return;
  }
  videoEl.addEventListener(
    'loadedmetadata',
    () => onCaptured(videoEl.videoWidth, videoEl.videoHeight),
    { once: true },
  );
}

export function captureImageSourceDimensions(imageEl: HTMLImageElement): { width: number; height: number } {
  // Images have immediate intrinsic dimensions — no async wait needed, unlike video
  return { width: imageEl.naturalWidth || imageEl.width, height: imageEl.naturalHeight || imageEl.height };
}
