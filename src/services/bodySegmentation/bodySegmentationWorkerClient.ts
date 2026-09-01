import { bodyMaskCache } from "./maskCache";
import { getBodySegmentationConfig } from "./segmentationConfig";
import type {
  BodySegmentationOptions,
  BodySegmentationRequest,
  BodySegmentationResponse,
} from "@clypra-studio/engine";

const REQUEST_TIMEOUT_MS = 900;
const FRAME_PRECISION = 1 / 24;

let requestId = 1;
let worker: Worker | null = null;
const pending = new Map<
  number,
  { resolve: (value: ImageData | null) => void; timeout: number }
>();

function getWorker(): Worker | null {
  if (worker || typeof Worker === "undefined") return worker;

  try {
    worker = new Worker(
      new URL("./bodySegmentation.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event: MessageEvent<BodySegmentationResponse>) => {
      const response = event.data;
      const item = pending.get(response.requestId);
      if (!item) return; // Guard Clause
      window.clearTimeout(item.timeout);
      pending.delete(response.requestId);

      if (response.mask) {
        bodyMaskCache.set(response.cacheKey, response.mask);
        item.resolve(response.mask);
      } else {
        if (response.error) {
          console.warn(`[BodySegmentation] ${response.error}`);
        }
        item.resolve(null);
      }
    };
    worker.onerror = (event) => {
      console.warn("[BodySegmentation] Worker error:", event.message);
      flushPending();
      worker?.terminate();
      worker = null;
    };
  } catch (error) {
    console.warn("[BodySegmentation] Worker unavailable:", error);
    worker = null;
  }

  return worker;
}

function flushPending(): void {
  for (const item of pending.values()) {
    window.clearTimeout(item.timeout);
    item.resolve(null);
  }
  pending.clear();
}

export function makeBodyMaskCacheKey(options: BodySegmentationOptions): string {
  const frameTime =
    Math.round(options.time / FRAME_PRECISION) * FRAME_PRECISION;
  return [
    options.clipId || "composition",
    options.effectId,
    options.renderer,
    options.width,
    options.height,
    frameTime.toFixed(3),
    options.minConfidence ?? 0.7,
  ].join(":");
}

export async function segmentBodyMask(
  source: CanvasImageSource,
  options: BodySegmentationOptions,
): Promise<ImageData | null> {
  const cacheKey = makeBodyMaskCacheKey(options);
  const cached = bodyMaskCache.get(cacheKey);
  if (cached) return cached;

  const width = Math.max(1, Math.floor(options.width));
  const height = Math.max(1, Math.floor(options.height));
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d", { alpha: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) return null;

  try {
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return await requestWorkerMask(cacheKey, imageData, options);
  } catch (error) {
    console.warn("[BodySegmentation] Failed to read frame pixels:", error);
    return null;
  }
}

async function requestWorkerMask(
  cacheKey: string,
  imageData: ImageData,
  options: BodySegmentationOptions,
): Promise<ImageData | null> {
  const activeWorker = getWorker();
  if (!activeWorker) return Promise.resolve(null);

  const id = requestId++;
  const config = await getBodySegmentationConfig();
  const payload: BodySegmentationRequest = {
    requestId: id,
    cacheKey,
    imageData,
    runtime: config.runtime,
    modelUrl: config.modelUrl,
    runtimeScriptUrl: config.runtimeScriptUrl,
    wasmBaseUrl: config.wasmBaseUrl,
    minConfidence: options.minConfidence ?? config.minConfidence ?? 0.7,
  };
  const requestTimeoutMs = Math.max(
    250,
    config.requestTimeoutMs ?? REQUEST_TIMEOUT_MS,
  );

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, requestTimeoutMs);

    pending.set(id, { resolve, timeout });
    activeWorker.postMessage(payload);
  });
}
