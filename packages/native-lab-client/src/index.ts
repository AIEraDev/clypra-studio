export const NATIVE_LAB_PROTOCOL_VERSION = 1;

export type NativeLabGpuState = "initializing" | "ready" | "failed";

export interface NativeLabHandshake {
  protocolVersion: number;
  contractVersion: number;
  coreVersion: string;
  renderGraphVersion: number;
  colorPolicyVersion: number;
  gpu: {
    state: NativeLabGpuState;
    available: boolean;
    adapterName: string | null;
    backend: string | null;
    failureReason: string | null;
  };
}

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

export interface NativeLabValidationResult {
  valid: boolean;
  cacheKey?: string;
  error?: string;
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

export interface NativeLabClientOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
  protocolVersion?: number;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function headerNumber(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function headerBoolean(headers: Headers, name: string): boolean | null {
  const value = headers.get(name);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * Browser-safe client for the local native lab daemon.
 *
 * This package owns transport only. It never creates a canvas renderer or
 * reimplements native graph behavior.
 */
export class NativeLabClient {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;
  private readonly protocolVersion: number;

  constructor(options: NativeLabClientOptions = {}) {
    this.endpoint = normalizeEndpoint(options.endpoint ?? "http://127.0.0.1:8788");
    // Window.fetch is an IDL method and must be invoked with its owning
    // global as `this`. Keeping the bound function here prevents browser
    // clients from failing with "Illegal invocation" before the daemon sees
    // the request.
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.protocolVersion = options.protocolVersion ?? NATIVE_LAB_PROTOCOL_VERSION;
  }

  async handshake(signal?: AbortSignal): Promise<NativeLabHandshake> {
    const response = await this.fetcher(`${this.endpoint}/v1/handshake`, {
      headers: { Accept: "application/json" },
      signal,
    });
    return this.readJson(response, "native lab handshake");
  }

  async validate(
    request: NativeLabFrameRequest,
    signal?: AbortSignal,
  ): Promise<NativeLabValidationResult> {
    const response = await this.fetcher(`${this.endpoint}/v1/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Clypra-Native-Protocol": String(this.protocolVersion),
      },
      body: JSON.stringify(request),
      signal,
    });
    return this.readJson(response, "native frame validation");
  }

  async renderFrame(
    request: NativeLabFrameRequest,
    signal?: AbortSignal,
  ): Promise<NativeLabFrameResult> {
    const response = await this.fetcher(`${this.endpoint}/v1/render/frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "image/webp, image/png, application/octet-stream",
        "X-Clypra-Native-Protocol": String(this.protocolVersion),
      },
      body: JSON.stringify(request),
      signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Native frame render failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
    }
    return {
      image: await response.blob(),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      requestId: response.headers.get("x-clypra-request-id") ?? request.requestId,
      frameIndex: Number(response.headers.get("x-clypra-frame-index") ?? request.frameTime.frameIndex),
      metrics: {
        decodeTimeUs: headerNumber(response.headers, "x-clypra-decode-time-us"),
        composeTimeUs: headerNumber(response.headers, "x-clypra-compose-time-us"),
        readbackTimeUs: headerNumber(response.headers, "x-clypra-readback-time-us"),
        totalTimeUs: headerNumber(response.headers, "x-clypra-total-time-us"),
        cacheHit: headerBoolean(response.headers, "x-clypra-cache-hit"),
      },
    };
  }

  private async readJson<T>(response: Response, operation: string): Promise<T> {
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`${operation} failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
    }
    return response.json() as Promise<T>;
  }
}
