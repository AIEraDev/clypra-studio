/**
 * @clypra-studio/native-render-wasm
 *
 * In-browser WASM compositor for Clypra Studio labs.
 * Replaces the local HTTP daemon (NativeLabClient) so contributors can use
 * all Studio labs without installing or running any native binary.
 *
 * Drop-in replacement for nativeLabClient.ts — exposes renderFrame() and
 * probeNativeLab() with the same return shapes as the HTTP client.
 */

// In-browser WebAssembly compositor initialized via CDN URL.
import init, {
  create_renderer,
  type WasmRenderer,
} from "./generated/clypra_render_wasm.js";

export const DEFAULT_CLYPRA_WASM_URL =
  "https://clypra-worker-api.abdulkabirmusa.com/media/wasm/clypra_render_wasm_bg.wasm";

let configuredWasmUrl = DEFAULT_CLYPRA_WASM_URL;

/**
 * Optionally configure the remote or local WASM binary URL.
 */
export function configureWasmRenderer(options: { wasmUrl?: string }) {
  if (options.wasmUrl) {
    configuredWasmUrl = options.wasmUrl;
  }
}

// ── Types (mirrored from @clypra-studio/native-lab-client) ─────────────────
// Re-exported here so callers can stop importing from native-lab-client.

export interface NativeLabFrameTime {
  frameIndex: number;
  ticks: number;
  timescale: number;
}

export interface NativeLabVideoLayer {
  layerId: string;
  assetId: string;
  videoPath: string;
  sourceTime: NativeLabFrameTime;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  blendMode: string;
  colorGrade?: Record<string, unknown> | null;
  bodyEffect?: Record<string, unknown> | null;
}

export interface NativeLabRasterLayer {
  assetId: string;
  rgba?: number[] | null;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  blendMode: string;
  colorGrade?: Record<string, unknown> | null;
  isMask?: boolean;
  isText?: boolean;
}

export interface NativeLabProjectSnapshot {
  schemaVersion: number;
  projectRevision: string;
  canvasWidth: number;
  canvasHeight: number;
  clearColor: [number, number, number, number];
  videoLayers: NativeLabVideoLayer[];
  rasterLayers?: NativeLabRasterLayer[];
  transition?: Record<string, unknown> | null;
}

export interface NativeLabFrameRequest {
  contractVersion: number;
  requestId: string;
  frameTime: NativeLabFrameTime;
  project: NativeLabProjectSnapshot;
  outputWidth: number;
  outputHeight: number;
  quality: "full" | "half" | "quarter" | "proxy";
  colorPolicy: {
    version: number;
    workingSpace: string;
    outputFormat: "rgba8Srgb" | "rgba16Float";
    toneMapHdrToSdr: boolean;
    displayProfile: string;
  };
  renderGraphVersion: number;
}

export interface NativeLabFrameResult {
  image: Blob;
  contentType: string;
  requestId: string;
  frameIndex: number;
  metrics: {
    decodeTimeUs: number | null;
    composeTimeUs: number | null;
    readbackTimeUs: number | null;
    totalTimeUs: number | null;
    cacheHit: boolean | null;
  };
}

export interface NativeLabHandshake {
  protocolVersion: number;
  contractVersion: number;
  coreVersion: string;
  renderGraphVersion: number;
  colorPolicyVersion: number;
  gpu: {
    state: "initializing" | "ready" | "failed";
    available: boolean;
    adapterName: string | null;
    backend: string | null;
    failureReason: string | null;
  };
}

/**
 * Custom error class for Clypra WebAssembly runtime and initialization errors.
 */
export class ClypraWasmError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ClypraWasmError";
  }
}

// ── Renderer singleton ───────────────────────────────────────────────────────

let wasmInitialised = false;
let renderer: WasmRenderer | null = null;
let initPromise: Promise<WasmRenderer> | null = null;

async function getRenderer(): Promise<WasmRenderer> {
  if (renderer) return renderer;
  // Serialise concurrent calls — only one init() + create_renderer() runs.
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!wasmInitialised) {
        await init(configuredWasmUrl);
        wasmInitialised = true;
      }
      renderer = await create_renderer();
      return renderer;
    } catch (err) {
      // Reset state on failure so subsequent calls can retry
      wasmInitialised = false;
      renderer = null;
      throw new ClypraWasmError(
        `Failed to initialize Clypra WASM renderer from '${configuredWasmUrl}': ${
          err instanceof Error ? err.message : String(err)
        }`,
        err,
      );
    }
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Probe the WASM renderer and return a handshake-shaped object.
 * Drop-in replacement for `probeNativeLab()` in nativeLabClient.ts.
 */
export async function probeNativeRenderer(
  signal?: AbortSignal,
): Promise<NativeLabHandshake> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  try {
    const r = await getRenderer();
    const info = JSON.parse(r.adapter_info()) as {
      name?: string;
      backend?: string;
      deviceType?: string;
    };
    return {
      protocolVersion: 1,
      contractVersion: 1,
      coreVersion: "wasm-0.1.0",
      renderGraphVersion: 1,
      colorPolicyVersion: 1,
      gpu: {
        state: "ready",
        available: true,
        adapterName: info.name ?? null,
        backend: info.backend ?? null,
        failureReason: null,
      },
    };
  } catch (err) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return {
      protocolVersion: 1,
      contractVersion: 1,
      coreVersion: "wasm-0.1.0",
      renderGraphVersion: 1,
      colorPolicyVersion: 1,
      gpu: {
        state: "failed",
        available: false,
        adapterName: null,
        backend: null,
        failureReason:
          err instanceof Error ? err.message : `WASM initialization failed: ${String(err)}`,
      },
    };
  }
}

/**
 * Render a single frame in-browser using the WASM compositor.
 * Drop-in replacement for `getNativeLabClient().renderFrame()`.
 */
export async function renderFrame(
  request: NativeLabFrameRequest,
  signal?: AbortSignal,
): Promise<NativeLabFrameResult> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const r = await getRenderer();
  try {
    const pngBytes = await r.render_frame(JSON.stringify(request));
    return {
      image: new Blob([pngBytes], { type: "image/png" }),
      contentType: "image/png",
      requestId: request.requestId,
      frameIndex: request.frameTime.frameIndex,
      metrics: {
        decodeTimeUs: null,
        composeTimeUs: null,
        readbackTimeUs: null,
        totalTimeUs: null,
        cacheHit: null,
      },
    };
  } catch (err) {
    throw new ClypraWasmError(
      `Failed to render frame '${request.requestId}' at index ${request.frameTime.frameIndex}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      err,
    );
  }
}

/**
 * Whether the WASM renderer has been successfully initialised.
 * Useful for showing a "GPU ready" indicator in Studio UI.
 */
export function isRendererReady(): boolean {
  return renderer !== null;
}
