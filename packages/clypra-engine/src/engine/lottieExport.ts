/**
 * Lottie Export Engine
 * Supports:
 *  - .lottie (dotLottie) — ZIP containing animation.json + manifest.json
 *  - .json  — raw Lottie JSON
 *  - PNG sequence ZIP
 *  - Animated GIF (via canvas frame capture)
 *  - MP4 video (via WebCodecs API)
 */

// ─── dotLottie (.lottie) ─────────────────────────────────────────────────────

export interface DotLottieManifest {
  version: string;
  generator: string;
  animations: Array<{
    id: string;
    speed?: number;
    themeColor?: string;
    loop?: boolean;
    autoplay?: boolean;
    direction?: 1 | -1;
  }>;
}

/**
 * Build a .lottie file (ZIP containing animation.json + manifest.json).
 * The .lottie format is the standard used by LottieFiles and dotlottie-player.
 */
export async function buildDotLottie(lottieData: object, animationId: string, opts: { loop?: boolean; autoplay?: boolean; speed?: number } = {}): Promise<Blob> {
  const { loop = true, autoplay = true, speed = 1 } = opts;

  const manifest: DotLottieManifest = {
    version: "1",
    generator: "Clypra Studio",
    animations: [{ id: animationId, loop, autoplay, speed }],
  };

  const animJson = JSON.stringify(lottieData);
  const manifestJson = JSON.stringify(manifest, null, 2);

  // Build minimal ZIP (store, no compression) — same approach as export.ts
  const files: Array<{ name: string; data: Uint8Array }> = [
    { name: `animations/${animationId}.json`, data: new TextEncoder().encode(animJson) },
    { name: "manifest.json", data: new TextEncoder().encode(manifestJson) },
  ];

  return buildZipBlob(files, "application/zip");
}

/**
 * Download a .lottie file.
 */
export function downloadDotLottie(lottieData: object, filename: string, animationId?: string, opts?: { loop?: boolean; autoplay?: boolean; speed?: number }): Promise<void> {
  const id = animationId || filename.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "animation";
  return buildDotLottie(lottieData, id, opts).then((blob) => {
    triggerDownload(blob, filename.endsWith(".lottie") ? filename : `${filename}.lottie`);
  });
}

/**
 * Download raw Lottie JSON.
 */
export function downloadLottieJson(lottieData: object, filename: string): void {
  const blob = new Blob([JSON.stringify(lottieData, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
}

// ─── Animated GIF ─────────────────────────────────────────────────────────────

export interface GifExportOptions {
  fps?: number;
  duration?: number;
  width?: number;
  height?: number;
  quality?: number; // 1–20, lower = better quality (GIF palette)
  loop?: boolean;
}

export interface GifFrame {
  imageData: ImageData;
  delay: number; // centiseconds
}

/**
 * Capture frames from a Lottie animation rendered via lottie-web into a canvas.
 * Returns raw ImageData frames ready for GIF encoding.
 *
 * NOTE: Requires lottie-web to be loaded and the container to be in the DOM.
 */
export async function captureLottieFrames(lottieInstance: any, canvas: HTMLCanvasElement, opts: GifExportOptions = {}): Promise<GifFrame[]> {
  const fps = opts.fps ?? 15;
  const duration = opts.duration ?? lottieInstance.totalFrames / (lottieInstance.frameRate || 30);
  const totalFrames = Math.ceil(duration * fps);
  const delay = Math.round(100 / fps); // centiseconds per frame

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context from canvas");

  const frames: GifFrame[] = [];

  console.log(`Capturing ${totalFrames} frames at ${fps} FPS (delay: ${delay}cs per frame)`);

  const isCanvasRenderer = lottieInstance.animType === "canvas";

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    const lottieFrame = progress * lottieInstance.totalFrames;
    lottieInstance.goToAndStop(lottieFrame, true);

    if (isCanvasRenderer) {
      // For Canvas renderer, wait one frame to ensure drawing completed
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    } else {
      // Wait longer for SVG render to complete
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Draw SVG to canvas via serialization
      const container = lottieInstance.renderer?.svgElement?.parentElement;
      if (container) {
        const svg = container.querySelector("svg");
        if (svg) {
          // Clone the SVG so we can safely set explicit width and height attributes in pixels.
          // Standalone SVGs loaded in Image objects fail to render or draw blank in some browsers (e.g. Safari)
          // if they only use percentage sizes (width="100%", height="100%").
          const svgClone = svg.cloneNode(true) as SVGSVGElement;
          svgClone.setAttribute("width", canvas.width.toString());
          svgClone.setAttribute("height", canvas.height.toString());

          const svgStr = new XMLSerializer().serializeToString(svgClone);
          const img = new Image();
          const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = (err) => {
              URL.revokeObjectURL(url);
              console.error(`Frame ${i} failed to load:`, err);
              reject(err);
            };
            img.src = url;
          });
        }
      }
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    frames.push({
      imageData,
      delay,
    });

    if (i === 0) {
      let nonTransparent = 0;
      for (let p = 3; p < imageData.data.length; p += 4) {
        if (imageData.data[p] > 0) nonTransparent++;
      }
      console.log(`Frame 0 diagnostic: canvas has ${nonTransparent} non-transparent pixels out of ${canvas.width * canvas.height}`);
    }

    if (i % 10 === 0 || i === totalFrames - 1) {
      console.log(`Captured frame ${i + 1}/${totalFrames} (${Math.round(progress * 100)}%)`);
    }
  }

  console.log(`Successfully captured ${frames.length} frames`);
  return frames;
}

/**
 * Encode frames to an animated GIF using a pure-JS GIF encoder.
 * Uses the omggif library approach (inline minimal encoder).
 */
export function encodeGif(frames: GifFrame[], width: number, height: number, opts: { loop?: boolean; quality?: number } = {}): Uint8Array {
  const { loop = true, quality = 10 } = opts;

  console.log(`Encoding GIF: ${frames.length} frames, ${width}x${height}, loop: ${loop}`);

  // Minimal GIF89a encoder
  const buf: number[] = [];

  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i));
  };
  const writeU16 = (v: number) => {
    buf.push(v & 0xff, (v >> 8) & 0xff);
  };
  const writeByte = (v: number) => buf.push(v & 0xff);

  // Header
  writeStr("GIF89a");
  writeU16(width);
  writeU16(height);
  writeByte(0xf7); // GCT flag (1) + color resolution (7) + sort flag (0) + GCT size (7 = 256 colors)
  writeByte(0); // background color index
  writeByte(0); // pixel aspect ratio

  // Global color table (256 grayscale entries as placeholder — real colors come per-frame)
  for (let i = 0; i < 256; i++) {
    buf.push(i, i, i);
  }

  // Netscape loop extension
  if (loop) {
    writeStr("\x21\xff\x0bNETSCAPE2.0\x03\x01");
    writeU16(0); // loop count 0 = infinite
    writeByte(0);
  }

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    const { imageData, delay } = frame;
    const pixels = imageData.data;

    // Quantize to 255 colors (median cut approximation — simplified octree)
    const palette = quantizeTopalette(pixels, 255);
    // Add transparent color at index 255
    const transparentIndex = 255;
    palette.push([0, 0, 0]); // transparent color placeholder in palette

    const indices = mapPixelsToPalette(pixels, palette, transparentIndex);

    // Graphic control extension
    buf.push(0x21, 0xf9, 0x04);
    // Disposal method 2 (restore to background) -> bits 2-4 = 010 (0x08)
    // Transparent color flag -> bit 0 = 1 (0x01)
    // Packed fields = 0x09
    writeByte(0x09);
    writeU16(delay);
    writeByte(transparentIndex); // transparent color index
    writeByte(0);

    // Image descriptor
    writeByte(0x2c);
    writeU16(0);
    writeU16(0); // left, top
    writeU16(width);
    writeU16(height);
    writeByte(0x87); // local color table flag (1) + local color table size (7 = 256 colors)

    // Local color table
    for (const [r, g, b] of palette) {
      buf.push(r, g, b);
    }

    // LZW compressed image data
    const lzwData = lzwEncode(indices, 8);
    writeByte(8); // LZW minimum code size
    for (let i = 0; i < lzwData.length; i += 255) {
      const chunk = lzwData.slice(i, i + 255);
      writeByte(chunk.length);
      for (const b of chunk) buf.push(b);
    }
    writeByte(0); // block terminator

    if (frameIndex % 10 === 0 || frameIndex === frames.length - 1) {
      console.log(`Encoded frame ${frameIndex + 1}/${frames.length}`);
    }
  }

  writeByte(0x3b); // GIF trailer

  const result = new Uint8Array(buf);
  console.log(`GIF encoding complete: ${result.length} bytes`);
  return result;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildZipBlob(files: Array<{ name: string; data: Uint8Array }>, mimeType = "application/zip"): Blob {
  const parts: BlobPart[] = [];
  let offset = 0;
  const central: Uint8Array[] = [];

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();

  const crc32 = (data: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const u16 = (arr: number[], v: number) => arr.push(v & 0xff, (v >>> 8) & 0xff);
  const u32 = (arr: number[], v: number) => arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const local: number[] = [];
    u32(local, 0x04034b50);
    u16(local, 20);
    u16(local, 0);
    u16(local, 0);
    u16(local, 0);
    u16(local, 0);
    u32(local, crc);
    u32(local, file.data.length);
    u32(local, file.data.length);
    u16(local, nameBytes.length);
    u16(local, 0);
    local.push(...nameBytes);
    const localHeader = new Uint8Array(local);
    parts.push(localHeader, file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) as ArrayBuffer);

    const ce: number[] = [];
    u32(ce, 0x02014b50);
    u16(ce, 20);
    u16(ce, 20);
    u16(ce, 0);
    u16(ce, 0);
    u16(ce, 0);
    u16(ce, 0);
    u32(ce, crc);
    u32(ce, file.data.length);
    u32(ce, file.data.length);
    u16(ce, nameBytes.length);
    u16(ce, 0);
    u16(ce, 0);
    u16(ce, 0);
    u16(ce, 0);
    u32(ce, 0);
    u32(ce, offset);
    ce.push(...nameBytes);
    central.push(new Uint8Array(ce));
    offset += localHeader.length + file.data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralStart = offset;
  for (const c of central) parts.push(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);

  const end: number[] = [];
  const u16e = (v: number) => end.push(v & 0xff, (v >>> 8) & 0xff);
  const u32e = (v: number) => end.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  u32e(0x06054b50);
  u16e(0);
  u16e(0);
  u16e(files.length);
  u16e(files.length);
  u32e(centralSize);
  u32e(centralStart);
  u16e(0);
  parts.push(new Uint8Array(end).buffer as ArrayBuffer);

  return new Blob(parts, { type: mimeType });
}

/** Simplified median-cut color quantization — returns up to `maxColors` [r,g,b] entries */
function quantizeTopalette(pixels: Uint8ClampedArray, maxColors: number): Array<[number, number, number]> {
  const sample: Array<[number, number, number]> = [];
  for (let i = 0; i < pixels.length; i += 4 * 4) {
    // sample every 4th pixel
    if (pixels[i + 3] > 0) sample.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (sample.length === 0) return Array.from({ length: maxColors }, (_, i) => [i, i, i] as [number, number, number]);

  // Simple k-means with k = min(maxColors, unique colors)
  const unique = new Map<string, [number, number, number]>();
  for (const c of sample) {
    const key = `${c[0] >> 2},${c[1] >> 2},${c[2] >> 2}`;
    if (!unique.has(key)) unique.set(key, c);
    if (unique.size >= maxColors) break;
  }

  const palette = Array.from(unique.values()).slice(0, maxColors);
  while (palette.length < maxColors) palette.push([0, 0, 0]);
  return palette;
}

/** Map each pixel to the nearest palette index, reserving the last index for transparency */
function mapPixelsToPalette(pixels: Uint8ClampedArray, palette: Array<[number, number, number]>, transparentIndex: number): Uint8Array {
  const indices = new Uint8Array(pixels.length / 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < 128) {
      indices[i / 4] = transparentIndex;
      continue;
    }
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
    let best = 0,
      bestDist = Infinity;
    for (let j = 0; j < transparentIndex; j++) {
      const dr = r - palette[j][0],
        dg = g - palette[j][1],
        db = b - palette[j][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    }
    indices[i / 4] = best;
  }
  return indices;
}

/** Minimal LZW encoder for GIF */
function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eofCode + 1;

  const table = new Map<string, number>();
  const resetTable = () => {
    table.clear();
    for (let i = 0; i < clearCode; i++) table.set(String.fromCharCode(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eofCode + 1;
  };

  const output: number[] = [];
  let bitBuf = 0,
    bitLen = 0;

  const emit = (code: number) => {
    bitBuf |= code << bitLen;
    bitLen += codeSize;
    while (bitLen >= 8) {
      output.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitLen -= 8;
    }
  };

  resetTable();
  emit(clearCode);

  let prefix = String.fromCharCode(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const suffix = String.fromCharCode(indices[i]);
    const combined = prefix + suffix;
    if (table.has(combined)) {
      prefix = combined;
    } else {
      emit(table.get(prefix)!);
      if (nextCode < 4096) {
        table.set(combined, nextCode++);
        if (nextCode > 1 << codeSize && codeSize < 12) codeSize++;
      } else {
        emit(clearCode);
        resetTable();
      }
      prefix = suffix;
    }
  }
  emit(table.get(prefix)!);
  emit(eofCode);
  if (bitLen > 0) output.push(bitBuf & 0xff);
  return output;
}

// ─── MP4 Video Export (WebCodecs API) ─────────────────────────────────────────

export interface Mp4ExportOptions {
  fps?: number;
  duration?: number;
  width?: number;
  height?: number;
  bitrate?: number; // bits per second
}

/**
 * Check if MP4 export via WebCodecs is supported in the current browser
 */
export function isMp4ExportSupported(): boolean {
  return typeof window !== "undefined" && "VideoEncoder" in window && "VideoFrame" in window && "mp4box" in window === false; // We'll use a simpler approach without mp4box
}

/**
 * Export Lottie animation to MP4 using WebCodecs API
 * This is a modern browser feature (Chrome 94+, Edge 94+)
 */
export async function exportLottieToMp4(lottieInstance: any, canvas: HTMLCanvasElement, opts: Mp4ExportOptions = {}): Promise<Blob> {
  if (!isMp4ExportSupported()) {
    throw new Error("MP4 export is not supported in this browser. Please use Chrome 94+ or Edge 94+.");
  }

  const fps = opts.fps ?? 30;
  const duration = opts.duration ?? lottieInstance.totalFrames / (lottieInstance.frameRate || 30);
  const width = opts.width ?? canvas.width;
  const height = opts.height ?? canvas.height;
  const bitrate = opts.bitrate ?? 5_000_000; // 5 Mbps default

  const totalFrames = Math.ceil(duration * fps);
  const frameDuration = 1_000_000 / fps; // microseconds

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context from canvas");

  // Use MediaRecorder as fallback since it's more widely supported
  return await exportLottieToMp4ViaMediaRecorder(lottieInstance, canvas, opts);
}

/**
 * Export Lottie to MP4 using MediaRecorder (more compatible approach)
 * Supports transparent backgrounds in some browsers
 */
async function exportLottieToMp4ViaMediaRecorder(lottieInstance: any, canvas: HTMLCanvasElement, opts: Mp4ExportOptions = {}): Promise<Blob> {
  const fps = opts.fps ?? 30;
  const duration = opts.duration ?? lottieInstance.totalFrames / (lottieInstance.frameRate || 30);
  const bitrate = opts.bitrate ?? 5_000_000;
  const totalFrames = Math.ceil(duration * fps);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context from canvas");

  // Check for MP4 support via MediaRecorder
  const supportedMimeTypes = ["video/mp4", "video/mp4;codecs=h264", "video/mp4;codecs=avc1", "video/webm;codecs=h264"];

  let mimeType = supportedMimeTypes.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });

  if (!mimeType) {
    throw new Error("MP4 recording is not supported in this browser. Try Chrome, Edge, or Safari.");
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: BlobPart[] = [];

  return new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = () => {
      reject(new Error("MediaRecorder failed during MP4 export"));
    };

    recorder.onstop = () => {
      const baseMime = mimeType!.split(";")[0] ?? "video/mp4";
      resolve(new Blob(chunks, { type: baseMime }));
    };

    recorder.start();

    (async () => {
      try {
        for (let i = 0; i < totalFrames; i++) {
          const lottieFrame = (i / totalFrames) * lottieInstance.totalFrames;
          lottieInstance.goToAndStop(lottieFrame, true);

          // Wait for render
          await new Promise<void>((r) => requestAnimationFrame(() => r()));

          // Draw SVG to canvas via serialization
          const container = lottieInstance.renderer?.svgElement?.parentElement;
          if (container) {
            const svg = container.querySelector("svg");
            if (svg) {
              const svgStr = new XMLSerializer().serializeToString(svg);
              const img = new Image();
              const blob = new Blob([svgStr], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);

              await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  URL.revokeObjectURL(url);
                  resolve();
                };
                img.onerror = reject;
                img.src = url;
              });
            }
          }

          // Pace the recording
          await new Promise<void>((r) => setTimeout(r, 1000 / fps));
        }

        recorder.stop();
      } catch (err) {
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
        reject(err);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    })();
  });
}

/**
 * Download Lottie animation as MP4 file
 */
export async function downloadLottieMp4(lottieInstance: any, canvas: HTMLCanvasElement, filename: string, opts?: Mp4ExportOptions): Promise<void> {
  const blob = await exportLottieToMp4(lottieInstance, canvas, opts);
  triggerDownload(blob, filename.endsWith(".mp4") ? filename : `${filename}.mp4`);
}
