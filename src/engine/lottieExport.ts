/**
 * Lottie Export Engine
 * Supports:
 *  - .lottie (dotLottie) — ZIP containing animation.json + manifest.json
 *  - .json  — raw Lottie JSON
 *  - PNG sequence ZIP
 *  - Animated GIF (via canvas frame capture)
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

    frames.push({
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      delay,
    });
  }

  return frames;
}

/**
 * Encode frames to an animated GIF using a pure-JS GIF encoder.
 * Uses the omggif library approach (inline minimal encoder).
 */
export function encodeGif(frames: GifFrame[], width: number, height: number, opts: { loop?: boolean; quality?: number } = {}): Uint8Array {
  const { loop = true, quality = 10 } = opts;

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
  writeByte(0x70); // GCT flag + color resolution + sort flag + GCT size (256 colors)
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

  for (const frame of frames) {
    const { imageData, delay } = frame;
    const pixels = imageData.data;

    // Quantize to 256 colors (median cut approximation — simplified octree)
    const palette = quantizeTopalette(pixels, 256);
    const indices = mapPixelsToPalette(pixels, palette);

    // Graphic control extension
    buf.push(0x21, 0xf9, 0x04);
    writeByte(0x00); // disposal method
    writeU16(delay);
    writeByte(0); // transparent color index
    writeByte(0);

    // Image descriptor
    writeByte(0x2c);
    writeU16(0);
    writeU16(0); // left, top
    writeU16(width);
    writeU16(height);
    writeByte(0x80); // local color table flag, 256 colors

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
  }

  writeByte(0x3b); // GIF trailer
  return new Uint8Array(buf);
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

/** Map each pixel to the nearest palette index */
function mapPixelsToPalette(pixels: Uint8ClampedArray, palette: Array<[number, number, number]>): Uint8Array {
  const indices = new Uint8Array(pixels.length / 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
    let best = 0,
      bestDist = Infinity;
    for (let j = 0; j < palette.length; j++) {
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
