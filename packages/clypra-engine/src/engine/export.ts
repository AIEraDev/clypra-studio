import type { SceneDocument } from "./schema";
import { evaluateScene } from "./evaluate";

export interface PngSequenceOptions {
  fps?: number;
  duration?: number;
  width?: number;
  height?: number;
}

export interface PngSequenceFrame {
  index: number;
  time: number;
  dataUrl: string;
}

/** Render all frames in-memory (browser) */
export function renderPngSequence(doc: SceneDocument, options: PngSequenceOptions = {}): PngSequenceFrame[] {
  const fps = options.fps ?? doc.timeline.fps ?? 30;
  const duration = options.duration ?? doc.timeline.duration ?? 2;
  const width = options.width ?? doc.canvas.width ?? 800;
  const height = options.height ?? doc.canvas.height ?? 200;
  const frameCount = Math.max(1, Math.ceil(duration * fps));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const frames: PngSequenceFrame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const time = i / fps;
    ctx.clearRect(0, 0, width, height);
    evaluateScene(doc, time, ctx);
    frames.push({
      index: i,
      time,
      dataUrl: canvas.toDataURL("image/png"),
    });
  }
  return frames;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Build a minimal ZIP (store only, no compression) for PNG frames */
export function buildPngSequenceZip(frames: PngSequenceFrame[]): Blob {
  const files: { name: string; data: Uint8Array }[] = frames.map((f) => ({
    name: `frame-${String(f.index).padStart(4, "0")}.png`,
    data: dataUrlToUint8Array(f.dataUrl),
  }));

  const parts: BlobPart[] = [];
  let offset = 0;
  const central: Uint8Array[] = [];

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (data: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const pushU16 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff);
  };
  const pushU32 = (arr: number[], v: number) => {
    arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  };

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    const local: number[] = [];
    pushU32(local, 0x04034b50);
    pushU16(local, 20);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU16(local, 0);
    pushU32(local, crc);
    pushU32(local, data.length);
    pushU32(local, data.length);
    pushU16(local, nameBytes.length);
    pushU16(local, 0);
    local.push(...nameBytes);

    const localHeader = new Uint8Array(local);
    parts.push(localHeader);
    parts.push(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);

    const centralEntry: number[] = [];
    pushU32(centralEntry, 0x02014b50);
    pushU16(centralEntry, 20);
    pushU16(centralEntry, 20);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU32(centralEntry, crc);
    pushU32(centralEntry, data.length);
    pushU32(centralEntry, data.length);
    pushU16(centralEntry, nameBytes.length);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU16(centralEntry, 0);
    pushU32(centralEntry, 0);
    pushU32(centralEntry, offset);
    centralEntry.push(...nameBytes);
    central.push(new Uint8Array(centralEntry));

    offset += localHeader.length + data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralStart = offset;
  for (const c of central) parts.push(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);

  const end: number[] = [];
  pushU32(end, 0x06054b50);
  pushU16(end, 0);
  pushU16(end, 0);
  pushU16(end, files.length);
  pushU16(end, files.length);
  pushU32(end, centralSize);
  pushU32(end, centralStart);
  pushU16(end, 0);
  parts.push(new Uint8Array(end).buffer as ArrayBuffer);

  return new Blob(parts, { type: "application/zip" });
}

export function downloadPngSequenceZip(doc: SceneDocument, filename: string, options?: PngSequenceOptions): void {
  const frames = renderPngSequence(doc, options);
  if (frames.length === 0) return;
  const zip = buildPngSequenceZip(frames);
  const url = URL.createObjectURL(zip);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".zip") ? filename : `${filename}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}

export const WEBM_EXPORT_MAX_FRAMES = 900;

const WEBM_MIME_CANDIDATES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"] as const;

export interface WebMExportOptions extends PngSequenceOptions {
  videoBitsPerSecond?: number;
  /** Pace frame capture so clip duration matches timeline (recommended) */
  realtimePacing?: boolean;
}

export function getSupportedWebMMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return WEBM_MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

export function isWebMExportSupported(): boolean {
  return typeof document !== "undefined" && typeof MediaRecorder !== "undefined" && getSupportedWebMMimeType() !== null;
}

export function getWebMFrameCount(doc: SceneDocument, options: WebMExportOptions = {}): number {
  const fps = options.fps ?? doc.timeline.fps ?? 30;
  const duration = options.duration ?? doc.timeline.duration ?? 2;
  return Math.max(1, Math.ceil(duration * fps));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type CanvasCaptureTrack = MediaStreamTrack & { requestFrame?: () => void };

/**
 * Encode timeline frames to WebM via MediaRecorder + canvas.captureStream(0).
 * Browser-only; transparent backgrounds may flatten to black in the recording.
 */
export async function renderSceneWebM(doc: SceneDocument, options: WebMExportOptions = {}): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("WebM export requires a browser environment.");
  }

  const mimeType = getSupportedWebMMimeType();
  if (!mimeType) {
    throw new Error("WebM recording is not supported in this browser.");
  }

  const fps = options.fps ?? doc.timeline.fps ?? 30;
  const duration = options.duration ?? doc.timeline.duration ?? 2;
  const width = options.width ?? doc.canvas.width ?? 800;
  const height = options.height ?? doc.canvas.height ?? 200;
  const frameCount = getWebMFrameCount(doc, options);

  if (frameCount > WEBM_EXPORT_MAX_FRAMES) {
    throw new Error(`Too many frames (${frameCount}). Max ${WEBM_EXPORT_MAX_FRAMES}. Lower duration or FPS.`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas.");

  const stream = canvas.captureStream(0);
  const videoTrack = stream.getVideoTracks()[0] as CanvasCaptureTrack;

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.videoBitsPerSecond ?? 6_000_000,
  });

  const chunks: BlobPart[] = [];
  const frameIntervalMs = 1000 / fps;
  const pace = options.realtimePacing !== false;

  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = () => {
      reject(new Error("MediaRecorder failed during WebM export."));
    };
    recorder.onstop = () => {
      const baseMime = mimeType.split(";")[0] ?? "video/webm";
      resolve(new Blob(chunks, { type: baseMime }));
    };

    recorder.start();

    (async () => {
      try {
        for (let i = 0; i < frameCount; i++) {
          const time = i / fps;
          ctx.clearRect(0, 0, width, height);
          evaluateScene(doc, time, ctx);
          if (typeof videoTrack.requestFrame === "function") {
            videoTrack.requestFrame();
          }
          if (pace) await sleep(frameIntervalMs);
          else await new Promise<void>((r) => requestAnimationFrame(() => r()));
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

  return blob;
}

export async function downloadSceneWebM(doc: SceneDocument, filename: string, options?: WebMExportOptions): Promise<void> {
  const blob = await renderSceneWebM(doc, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".webm") ? filename : `${filename}.webm`;
  link.click();
  URL.revokeObjectURL(url);
}
