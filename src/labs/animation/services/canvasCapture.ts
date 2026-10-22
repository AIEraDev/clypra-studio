/**
 * Canvas Capture Service
 *
 * Provides two utilities for generating preview assets from the animation lab:
 *   - captureAnimationThumbnail: renders a snapshot of the live DOM stage to a PNG File.
 *   - captureAnimationVideo: renders animation frames onto an offscreen canvas and
 *     records them via MediaRecorder to produce a webm/mp4 File.
 *
 * Constraint: both functions are best-effort. captureAnimationVideo returns null when
 * the runtime environment does not support MediaRecorder or canvas.captureStream
 * (e.g. happy-dom, older Safari, server-side rendering).
 *
 * VFX limitation: procedural VFX effects (glitch, wave, chromatic, etc.) defined on
 * the TextAnimationPreset are NOT replicated in the canvas renderer. Only the
 * property tracks (opacity, translateX/Y, scale, rotation, blur, etc.) are applied.
 */

import type { TextAnimationPreset } from "../../../types/animation";
import { evaluatePresetTransform } from "./animationEvaluator";

// ── Thumbnail Capture ─────────────────────────────────────────────────────────

/**
 * Renders a PNG thumbnail of the animation preset at the midpoint of the
 * animation (progress = 0.5) using the same offscreen canvas renderer as
 * `captureAnimationVideo`.
 *
 * This approach avoids the SVG foreignObject → canvas path, which browsers
 * block due to cross-origin CSS tainting when the DOM contains external fonts
 * or CSS custom properties. Rendering directly to an offscreen canvas is
 * always permitted and produces a clean, untainted result.
 *
 * @param preset      - The TextAnimationPreset to render.
 * @param sampleText  - Text to display. Falls back to "ABC123" if empty.
 * @param duration    - Animation duration in seconds (used for context only;
 *                      the thumbnail is always captured at progress = 0.5).
 * @returns A PNG File named "thumbnail.png".
 */
export async function captureAnimationThumbnail(
  preset: TextAnimationPreset,
  sampleText: string,
  duration: number,
): Promise<File> {
  const W = 800;
  const H = 400;
  // Capture at the midpoint of the animation — typically the most visually
  // representative frame (e.g. characters partially transitioned in/out).
  const THUMB_PROGRESS = 0.5;

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Could not obtain 2D context for thumbnail canvas");

  const characters = Array.from(sampleText || "ABC123");
  const n = characters.length;

  // Dark background matching the preview stage.
  ctx.fillStyle = "#08080C";
  ctx.fillRect(0, 0, W, H);

  // Measure advances and evaluate per-character transforms at the midpoint.
  ctx.font = "bold 72px Inter, system-ui, sans-serif";
  const advances = characters.map((ch) => ctx.measureText(ch).width);
  const transforms = characters.map((_, i) =>
    evaluatePresetTransform(preset, THUMB_PROGRESS, i, n),
  );

  // Centre the text cluster horizontally.
  const totalWidth = advances.reduce(
    (sum, adv, i) => sum + adv + transforms[i].tracking,
    0,
  );
  let cursorX = (W - totalWidth) / 2;

  for (let i = 0; i < n; i++) {
    const ch = characters[i];
    const t = transforms[i];
    const adv = advances[i];

    ctx.save();
    ctx.translate(cursorX + t.translateX, H / 2 + t.translateY);
    ctx.scale(t.scaleX, t.scaleY);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, Math.min(1, t.opacity));
    if (t.blur > 0) {
      ctx.filter = `blur(${t.blur}px)`;
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 72px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 0, 0);
    ctx.restore();

    cursorX += adv + t.tracking;
  }

  // Export the offscreen canvas as a PNG Blob. The canvas is untainted so
  // toBlob() is always permitted.
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob returned null for thumbnail"));
    }, "image/png");
  });

  return new File([pngBlob], "thumbnail.png", { type: "image/png" });
}

// ── Video Capture ─────────────────────────────────────────────────────────────

/**
 * Renders an animation preset to a short video File using an offscreen canvas
 * and MediaRecorder.
 *
 * Best-effort: returns null when the runtime does not support MediaRecorder or
 * HTMLCanvasElement.captureStream (e.g. test environments, older Safari).
 *
 * VFX limitation: procedural VFX effects defined in TextAnimationPreset.procedural
 * are NOT rendered — only the animated property tracks (opacity, scale, translate,
 * rotation, blur) are applied.
 *
 * @param preset    - The TextAnimationPreset to render.
 * @param sampleText - Text string to render. Falls back to "ABC123" if empty.
 * @param duration  - Animation duration in seconds.
 * @param fps       - Frames per second (default: 30).
 * @returns A webm or mp4 File, or null when MediaRecorder is unavailable.
 */
export async function captureAnimationVideo(
  preset: TextAnimationPreset,
  sampleText: string,
  duration: number,
  fps = 30,
): Promise<File | null> {
  // Guard: MediaRecorder and captureStream must be available
  if (
    typeof MediaRecorder === "undefined" ||
    typeof (HTMLCanvasElement.prototype as unknown as Record<string, unknown>)
      .captureStream === "undefined"
  ) {
    return null;
  }

  const W = 800;
  const H = 400;

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const ctx = offscreen.getContext("2d")!;

  // Choose the best supported MIME type
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) return null;

  const stream = (
    offscreen as unknown as { captureStream: (fps: number) => MediaStream }
  ).captureStream(fps);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const totalFrames = Math.ceil(duration * fps);
  const characters = Array.from(sampleText || "ABC123");
  const n = characters.length;

  for (let f = 0; f < totalFrames; f++) {
    const progress = totalFrames > 1 ? f / (totalFrames - 1) : 0;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#08080C";
    ctx.fillRect(0, 0, W, H);

    // Measure total cluster width to centre the text
    ctx.font = "bold 72px Inter, system-ui, sans-serif";
    const advances: number[] = characters.map(
      (ch) => ctx.measureText(ch).width,
    );
    const transforms = characters.map((_, i) =>
      evaluatePresetTransform(preset, progress, i, n),
    );
    // Use tracking offsets from the first character's transform as a representative value
    // (tracking is per-character; each character's translateX already handles it)
    const totalWidth = advances.reduce((sum, adv, i) => {
      return sum + adv + transforms[i].tracking;
    }, 0);
    let startX = (W - totalWidth) / 2;

    let cursorX = startX;
    for (let i = 0; i < n; i++) {
      const ch = characters[i];
      const t = transforms[i];
      const adv = advances[i];

      ctx.save();
      ctx.translate(cursorX + t.translateX, H / 2 + t.translateY);
      ctx.scale(t.scaleX, t.scaleY);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.globalAlpha = t.opacity;
      if (t.blur > 0) {
        ctx.filter = `blur(${t.blur}px)`;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 72px Inter, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, 0, 0);
      ctx.restore();

      cursorX += adv + t.tracking;
    }

    // Pace frame rendering to match fps
    await new Promise<void>((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  await stopped;

  const videoBlob = new Blob(chunks, { type: mimeType });
  const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
  return new File([videoBlob], `preview.${ext}`, { type: mimeType });
}
