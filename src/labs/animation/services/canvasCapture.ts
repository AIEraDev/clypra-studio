/**
 * Canvas Capture Service
 *
 * Provides two utilities for generating preview assets from the animation lab:
 *   - captureAnimationThumbnail: renders a 4K PNG snapshot at progress = 0.5.
 *   - captureAnimationVideo: renders animation frames onto a 4K offscreen canvas
 *     and records them via MediaRecorder at high bitrate.
 *
 * Resolution: 3840 × 2160 (4K UHD, 16:9).
 * Video bitrate: 40 Mbps (VP9) / 25 Mbps (VP8 / generic WebM) / 20 Mbps (MP4).
 * Frame rate: 60 fps.
 *
 * Constraint: both functions are best-effort. captureAnimationVideo returns null
 * when the runtime does not support MediaRecorder or canvas.captureStream
 * (e.g. happy-dom, older Safari, server-side rendering).
 *
 * VFX limitation: procedural VFX effects (glitch, wave, chromatic, etc.) defined
 * on the TextAnimationPreset are NOT replicated in the canvas renderer. Only the
 * property tracks (opacity, translateX/Y, scale, rotation, blur) are applied.
 */

import type { TextAnimationPreset } from "../../../types/animation";
import { evaluatePresetTransform } from "./animationEvaluator";

// ── Shared constants ──────────────────────────────────────────────────────────

/** Output canvas width — 4K UHD. */
const CANVAS_W = 3840;
/** Output canvas height — 4K UHD. */
const CANVAS_H = 2160;

/**
 * Font size scaled to 4K from the original 72px design at 800px wide:
 *   72 × (3840 / 800) = 345.6 → 346 px.
 */
const FONT_SIZE = 346;
const FONT = `bold ${FONT_SIZE}px Inter, system-ui, sans-serif`;
const BG_COLOR = "#08080C";

// ── Shared frame renderer ─────────────────────────────────────────────────────

/**
 * Draws one animation frame at `progress` (0–1) onto `ctx`.
 * Used by both thumbnail and video capture so output is pixel-identical.
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  characters: string[],
  preset: TextAnimationPreset,
  progress: number,
): void {
  const n = characters.length;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.font = FONT;
  const advances = characters.map((ch) => ctx.measureText(ch).width);
  const transforms = characters.map((_, i) =>
    evaluatePresetTransform(preset, progress, i, n),
  );

  const totalWidth = advances.reduce(
    (sum, adv, i) => sum + adv + transforms[i].tracking,
    0,
  );
  let cursorX = (CANVAS_W - totalWidth) / 2;

  for (let i = 0; i < n; i++) {
    const t = transforms[i];
    const adv = advances[i];

    ctx.save();
    ctx.translate(cursorX + t.translateX, CANVAS_H / 2 + t.translateY);
    ctx.scale(t.scaleX, t.scaleY);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, Math.min(1, t.opacity));
    if (t.blur > 0) ctx.filter = `blur(${t.blur}px)`;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = FONT;
    ctx.textBaseline = "middle";
    ctx.fillText(characters[i], 0, 0);
    ctx.restore();

    cursorX += adv + t.tracking;
  }
}

// ── Thumbnail Capture ─────────────────────────────────────────────────────────

/**
 * Renders a 4K PNG thumbnail (3840 × 2160) of the animation preset at the
 * midpoint of the animation (progress = 0.5).
 *
 * Rendering to an offscreen canvas avoids the SVG foreignObject taint issue
 * that would block toBlob() when the DOM has external fonts or CSS variables.
 *
 * @param preset      - The TextAnimationPreset to render.
 * @param sampleText  - Text to display. Falls back to "ABC123" if empty.
 * @param _duration   - Unused (thumbnail is always at progress = 0.5).
 * @returns A PNG File named "thumbnail.png".
 */
export async function captureAnimationThumbnail(
  preset: TextAnimationPreset,
  sampleText: string,
  _duration: number,
): Promise<File> {
  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_W;
  offscreen.height = CANVAS_H;
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Could not obtain 2D context for thumbnail canvas");

  drawFrame(ctx, Array.from(sampleText || "ABC123"), preset, 0.5);

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob returned null for thumbnail"));
      },
      "image/png",
    );
  });

  return new File([pngBlob], "thumbnail.png", { type: "image/png" });
}

// ── Video Capture ─────────────────────────────────────────────────────────────

/**
 * Codec candidates in preference order.
 * VP9 gives the best quality-per-bit at 4K and is well supported in Chrome/Edge.
 */
const VIDEO_CODEC_CANDIDATES: { mimeType: string; videoBitsPerSecond: number }[] =
  [
    { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 40_000_000 }, // 40 Mbps
    { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 25_000_000 }, // 25 Mbps
    { mimeType: "video/webm",            videoBitsPerSecond: 25_000_000 }, // generic WebM
    { mimeType: "video/mp4",             videoBitsPerSecond: 20_000_000 }, // H.264 fallback
  ];

/**
 * Renders an animation preset to a 4K video File using an offscreen canvas
 * and MediaRecorder.
 *
 * Resolution : 3840 × 2160 (4K UHD, 16:9)
 * Frame rate : 60 fps
 * Bitrate    : 40 Mbps VP9 / 25 Mbps VP8 / 20 Mbps MP4
 *
 * Best-effort: returns null when the runtime does not support MediaRecorder or
 * HTMLCanvasElement.captureStream (e.g. test environments, older Safari).
 *
 * @param preset     - The TextAnimationPreset to render.
 * @param sampleText - Text to render. Falls back to "ABC123" if empty.
 * @param duration   - Animation duration in seconds.
 * @param fps        - Frames per second (default: 60).
 * @returns A WebM or MP4 File, or null when MediaRecorder is unavailable.
 */
export async function captureAnimationVideo(
  preset: TextAnimationPreset,
  sampleText: string,
  duration: number,
  fps = 60,
): Promise<File | null> {
  if (typeof MediaRecorder === "undefined") {
    console.warn("[canvasCapture] MediaRecorder not supported — skipping video capture");
    return null;
  }

  if (
    typeof (HTMLCanvasElement.prototype as unknown as Record<string, unknown>)
      .captureStream === "undefined"
  ) {
    console.warn("[canvasCapture] captureStream not supported — skipping video capture");
    return null;
  }

  const chosen = VIDEO_CODEC_CANDIDATES.find(({ mimeType }) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
  if (!chosen) {
    console.warn(
      "[canvasCapture] No supported video codec found. Tested:",
      VIDEO_CODEC_CANDIDATES.map((c) => c.mimeType),
    );
    return null;
  }

  const { mimeType, videoBitsPerSecond } = chosen;
  console.log("[canvasCapture] Recording 4K preview:", {
    codec: mimeType,
    videoBitsPerSecond,
    fps,
    resolution: `${CANVAS_W}×${CANVAS_H}`,
    duration,
  });

  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_W;
  offscreen.height = CANVAS_H;
  const ctx = offscreen.getContext("2d")!;

  const stream = (
    offscreen as unknown as { captureStream: (fps: number) => MediaStream }
  ).captureStream(fps);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const totalFrames = Math.ceil(duration * fps);
  const characters = Array.from(sampleText || "ABC123");

  for (let f = 0; f < totalFrames; f++) {
    const progress = totalFrames > 1 ? f / (totalFrames - 1) : 0;
    drawFrame(ctx, characters, preset, progress);
    // Yield to the browser so captureStream grabs the rendered frame.
    await new Promise<void>((r) => setTimeout(r, 1000 / fps));
  }

  recorder.stop();
  await stopped;

  const videoBlob = new Blob(chunks, { type: mimeType });
  const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
  console.log("[canvasCapture] 4K capture complete:", {
    size: `${(videoBlob.size / 1_048_576).toFixed(2)} MB`,
    frames: totalFrames,
  });
  return new File([videoBlob], `preview.${ext}`, { type: mimeType });
}
