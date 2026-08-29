import {
  compileTextTemplate,
  normalizeTextTemplateArtifact,
  renderEvaluatedSceneToCanvas,
  TemplateRenderer,
  type CompiledTextTemplate,
  type TextTemplateArtifact,
} from "@clypra-studio/engine";
import type { TextTemplate as TemplateDefinition } from "@clypra-studio/engine";
import { getNativeRenderClient, NATIVE_RENDER_CONTRACT_VERSION } from "./nativeRenderClient";

export interface TemplateCustomization {
  primaryText?: string;
  secondaryText?: string;
  accentText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  layerColors?: Record<string, string>;
}

export interface NativeTemplateFrame {
  image: Blob;
  compiled: CompiledTextTemplate;
}

let nativeHandshakePromise: ReturnType<ReturnType<typeof getNativeRenderClient>["handshake"]> | null = null;

function getNativeHandshake(signal?: AbortSignal) {
  if (!nativeHandshakePromise) {
    nativeHandshakePromise = getNativeRenderClient().handshake(signal).catch((error) => {
      // A transient WebGPU/device loss must be recoverable. Do not pin a
      // rejected promise for the lifetime of the Studio tab.
      nativeHandshakePromise = null;
      throw error;
    });
  }
  return nativeHandshakePromise;
}

/** Start WebGPU/WASM initialization while the editor shell is mounting. */
export function warmTextTemplateRenderer() {
  return getNativeHandshake();
}

const MAX_STATIC_FRAME_CACHE_ENTRIES = 12;
const staticFrameCache = new Map<string, Blob>();
const canonicalArtifactCache = new WeakMap<object, TextTemplateArtifact>();
const staticTemplateCache = new WeakMap<object, boolean>();
const rasterSurfaceCache = new Map<string, HTMLCanvasElement>();
let renderSequence = 0;
let lastTraceAt = 0;

function isVerboseTemplateTraceEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return globalThis.localStorage?.getItem("clypra:debug:text-template") === "1";
  } catch {
    return false;
  }
}

function traceTemplate(stage: string, details: Record<string, unknown> = {}, force = false): void {
  if (!import.meta.env.DEV) return;
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  // Playback can produce several renders per second. Keep normal tracing
  // bounded; errors and explicit debug mode are always emitted.
  let explicit = false;
  try {
    explicit = globalThis.localStorage?.getItem("clypra:debug:text-template") === "1";
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  if (!force && !explicit && now - lastTraceAt < 350) return;
  lastTraceAt = now;
  console.debug("[text-template]", stage, details);
}

function cacheSet(key: string, value: Blob): void {
  staticFrameCache.delete(key);
  staticFrameCache.set(key, value);
  while (staticFrameCache.size > MAX_STATIC_FRAME_CACHE_ENTRIES) {
    const oldest = staticFrameCache.keys().next().value;
    if (oldest === undefined) break;
    staticFrameCache.delete(oldest);
  }
}

function getRasterSurface(width: number, height: number): HTMLCanvasElement {
  const key = `${width}x${height}`;
  const cached = rasterSurfaceCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  rasterSurfaceCache.set(key, canvas);
  // Interactive preview normally uses one half-resolution surface and export
  // may use one full-resolution surface. Keep this bounded across a session.
  while (rasterSurfaceCache.size > 3) {
    const oldest = rasterSurfaceCache.keys().next().value;
    if (!oldest) break;
    rasterSurfaceCache.delete(oldest);
  }
  return canvas;
}

function stableValue(value: unknown): string {
  if (value instanceof Set) return JSON.stringify([...value].sort());
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableValue(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? String(value);
}

function hasAnimation(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasAnimation);
  const record = value as Record<string, unknown>;
  if (record.animation || record.keyframes || record.animationTracks) return true;
  return Object.values(record).some(hasAnimation);
}

function isStaticTemplate(artifact: TextTemplateArtifact, legacyTemplate?: TemplateDefinition): boolean {
  const cached = staticTemplateCache.get(artifact as object);
  if (cached !== undefined) return cached;
  const isStatic = !hasAnimation(artifact.document.nodes) &&
    !(legacyTemplate?.layers || []).some((layer) => hasAnimation(layer));
  staticTemplateCache.set(artifact as object, isStatic);
  return isStatic;
}

function getCachedArtifact(template: TemplateDefinition): TextTemplateArtifact {
  const cached = canonicalArtifactCache.get(template as object);
  if (cached) return cached;
  const artifact = normalizeTextTemplateArtifact(template);
  canonicalArtifactCache.set(template as object, artifact);
  return artifact;
}

export interface TextTemplateFrameOptions {
  artifact: TextTemplateArtifact;
  legacyTemplate?: TemplateDefinition;
  time: number;
  outputScale?: number;
  quality?: "full" | "half" | "quarter" | "proxy";
  controlValues?: Record<string, unknown>;
  customization?: TemplateCustomization;
  hiddenLayerIds?: ReadonlySet<string>;
}

export type TextTemplatePreviewSchedulerRequest = TextTemplateFrameOptions;
type TextTemplateFrameRenderer = (
  options: TextTemplatePreviewSchedulerRequest,
  signal?: AbortSignal,
) => Promise<NativeTemplateFrame>;

/**
 * Keeps interactive preview work bounded to one render at a time. A playhead
 * can advance much faster than the GPU/readback path; retaining every request
 * makes the browser queue stale full-resolution frames until the tab hangs.
 */
export class TextTemplatePreviewScheduler {
  private pending: TextTemplatePreviewSchedulerRequest | null = null;
  private frameHandle: number | null = null;
  private cancelScheduled: (() => void) | null = null;
  private inFlight: AbortController | null = null;
  private generation = 0;
  private disposed = false;

  constructor(
    private readonly onFrame: (frame: NativeTemplateFrame, isCurrent: () => boolean) => void | Promise<void>,
    private readonly onError?: (error: unknown) => void,
    private readonly render: TextTemplateFrameRenderer = renderTextTemplateFrame,
  ) {}

  request(options: TextTemplatePreviewSchedulerRequest): void {
    if (this.disposed) return;
    this.pending = options;
    this.generation += 1;
    traceTemplate("scheduler.request", {
      generation: this.generation,
      time: options.time,
      pendingWhileInFlight: Boolean(this.inFlight),
    });
    if (this.frameHandle === null) {
      const callback = () => {
        this.frameHandle = null;
        this.cancelScheduled = null;
        void this.flush();
      };
      if (typeof requestAnimationFrame === "function") {
        this.frameHandle = requestAnimationFrame(callback);
        this.cancelScheduled = () => cancelAnimationFrame(this.frameHandle!);
      } else {
        const timeoutHandle = globalThis.setTimeout(callback, 0);
        this.frameHandle = timeoutHandle as unknown as number;
        this.cancelScheduled = () => globalThis.clearTimeout(timeoutHandle);
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.pending = null;
    this.inFlight?.abort();
    this.cancelScheduled?.();
    this.cancelScheduled = null;
    this.frameHandle = null;
  }

  private async flush(): Promise<void> {
    if (this.disposed || this.inFlight || !this.pending) return;
    const request = this.pending;
    this.pending = null;
    const requestGeneration = this.generation;
    const controller = new AbortController();
    this.inFlight = controller;
    traceTemplate("scheduler.start", { generation: requestGeneration, time: request.time });
    try {
      const frame = await this.render(request, controller.signal);
      if (!this.disposed && !controller.signal.aborted && requestGeneration === this.generation) {
        traceTemplate("scheduler.frame-ready", { generation: requestGeneration, time: request.time });
        await this.onFrame(frame, () => !this.disposed && !controller.signal.aborted && requestGeneration === this.generation);
      }
    } catch (error) {
      if (!controller.signal.aborted && !this.disposed) {
        traceTemplate("scheduler.error", {
          generation: requestGeneration,
          currentGeneration: this.generation,
          message: error instanceof Error ? error.message : String(error),
        }, true);
        this.onError?.(error);
      }
    } finally {
      if (this.inFlight === controller) this.inFlight = null;
      if (!this.disposed && this.pending && this.frameHandle === null) {
        this.request(this.pending);
      }
    }
  }
}

function applyLegacyCustomization(renderer: any, template: TemplateDefinition, customization?: TemplateCustomization, hiddenLayerIds?: ReadonlySet<string>): void {
  for (const layer of template.layers || []) {
    if (hiddenLayerIds?.has(layer.id)) {
      renderer.updateLayer(layer.id, { opacity: 0 });
      continue;
    }
    if (layer.kind === "text") {
      const content = layer.role === "primary" ? customization?.primaryText : layer.role === "secondary" ? customization?.secondaryText : layer.role === "accent" ? customization?.accentText : undefined;
      const color = customization?.layerColors?.[layer.id] || (layer.role === "primary" ? customization?.primaryColor : layer.role === "secondary" ? customization?.secondaryColor : undefined);
      if (content !== undefined || color) renderer.updateLayer(layer.id, { ...(content !== undefined ? { content } : {}), ...(color ? { color } : {}) });
    } else if (layer.kind === "shape") {
      const color = customization?.layerColors?.[layer.id] || (layer.id === "primary-fill-layer" ? customization?.primaryColor : layer.id === "secondary-fill-layer" ? customization?.secondaryColor : undefined);
      if (color) renderer.updateLayer(layer.id, { fill: color });
    }
  }
}

function rasterizeCompiled(compiled: CompiledTextTemplate, canvas: HTMLCanvasElement, scale: number): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Unable to create template raster context");
  ctx.save();
  ctx.scale(scale, scale);
  renderEvaluatedSceneToCanvas(compiled.evaluatedScene, ctx);
  ctx.restore();
}

async function renderTextTemplateFrameExclusive(options: {
  artifact: TextTemplateArtifact;
  legacyTemplate?: TemplateDefinition;
  time: number;
  outputScale?: number;
  quality?: "full" | "half" | "quarter" | "proxy";
  controlValues?: Record<string, unknown>;
  customization?: TemplateCustomization;
  hiddenLayerIds?: ReadonlySet<string>;
}, signal?: AbortSignal): Promise<NativeTemplateFrame> {
  const renderStartedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const { artifact } = options;
  const renderId = ++renderSequence;
  traceTemplate("render.begin", {
    renderId,
    templateId: artifact.metadata.id,
    revisionId: artifact.revision.revisionId,
    time: options.time,
    outputScale: options.outputScale ?? 1,
    legacyLayers: options.legacyTemplate?.layers?.length ?? 0,
  });
  const compileStartedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const compiled = compileTextTemplate(artifact, { target: "studio", time: options.time, controlValues: options.controlValues });
  const compileTimeMs = typeof performance !== "undefined" ? performance.now() - compileStartedAt : null;
  const outputScale = Math.max(0.25, Math.min(1, options.outputScale ?? 1));
  const outputWidth = Math.max(1, Math.round(compiled.width * outputScale));
  const outputHeight = Math.max(1, Math.round(compiled.height * outputScale));
  const quality = options.quality || (outputScale < 1 ? "half" : "full");
  const isStatic = isStaticTemplate(artifact, options.legacyTemplate);
  const customizationKey = `${stableValue(options.controlValues || {})}:${stableValue(options.customization || {})}:${stableValue(options.hiddenLayerIds || new Set())}`;
  const staticKey = isStatic
    ? `${artifact.schemaVersion}:${artifact.revision.rendererVersion}:${artifact.revision.contentHash}:${stableValue(artifact.dependencies)}:${outputScale}:${quality}:${customizationKey}`
    : null;
  if (staticKey) {
    const cachedImage = staticFrameCache.get(staticKey);
    if (cachedImage) return { image: cachedImage, compiled };
  }
  const rasterStartedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const canvas = getRasterSurface(outputWidth, outputHeight);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create template raster context");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, outputWidth, outputHeight);
  if (options.legacyTemplate && (options.legacyTemplate.layers || []).length > 0) {
    const renderer = new TemplateRenderer(options.legacyTemplate as any);
    applyLegacyCustomization(renderer, options.legacyTemplate, options.customization, options.hiddenLayerIds);
    context.save();
    context.scale(outputScale, outputScale);
    renderer.drawFrame(context, compiled.time);
    context.restore();
  } else {
    rasterizeCompiled(compiled, canvas, outputScale);
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  // Scanning every pixel solely for diagnostics made every playback frame do
  // a second full CPU pass. Sample first; only perform the full diagnostic
  // scan when verbose tracing is enabled or the sample suggests a blank frame.
  const verboseTrace = isVerboseTemplateTraceEnabled();
  let alphaPixels: number | null = null;
  let sampledAlpha = 0;
  const sampleStride = Math.max(4, Math.floor(pixels.data.length / 256));
  for (let index = 3; index < pixels.data.length; index += sampleStride) {
    if (pixels.data[index] > 0) {
      sampledAlpha = 1;
      break;
    }
  }
  if (verboseTrace || sampledAlpha === 0) {
    alphaPixels = 0;
    for (let index = 3; index < pixels.data.length; index += 4) {
      if (pixels.data[index] > 0) alphaPixels += 1;
    }
  }
  traceTemplate("render.rasterized", {
    renderId,
    width: canvas.width,
    height: canvas.height,
    alphaPixels,
    sampledAlpha,
    layerCount: compiled.layers.length,
    diagnostics: compiled.diagnostics.length,
    compileTimeMs,
    rasterTimeMs: typeof performance !== "undefined" ? performance.now() - rasterStartedAt : null,
  }, alphaPixels === 0);
  const handshake = await getNativeHandshake(signal);
  traceTemplate("render.gpu", {
    renderId,
    state: handshake.gpu.state,
    available: handshake.gpu.available,
    adapter: handshake.gpu.adapterName,
    backend: handshake.gpu.backend,
    contractVersion: handshake.contractVersion,
  }, handshake.gpu.state !== "ready" || !handshake.gpu.available);
  if (signal?.aborted) throw new DOMException("Render cancelled", "AbortError");
  if (handshake.gpu.state !== "ready" || !handshake.gpu.available) {
    nativeHandshakePromise = null;
    throw new Error(handshake.gpu.failureReason || "Native GPU renderer is unavailable");
  }
  const nativeStartedAt = typeof performance !== "undefined" ? performance.now() : 0;
  const result = await getNativeRenderClient().renderFrame({
    contractVersion: NATIVE_RENDER_CONTRACT_VERSION,
    requestId: `text-template:${artifact.metadata.id}:${artifact.revision.revisionId}:${compiled.time.toFixed(4)}:${outputWidth}x${outputHeight}:${quality}:${customizationKey}`,
    frameTime: { frameIndex: Math.floor(compiled.time * compiled.fps), ticks: Math.floor(compiled.time * 1_000_000), timescale: 1_000_000 },
    project: { schemaVersion: 1, projectRevision: `${artifact.revision.contentHash}:${customizationKey}:${outputWidth}x${outputHeight}:${quality}`, canvasWidth: outputWidth, canvasHeight: outputHeight, clearColor: [0, 0, 0, 0], videoLayers: [], rasterLayers: [{ assetId: `template-raster:${artifact.revision.contentHash}:${customizationKey}:${compiled.time.toFixed(4)}:${outputWidth}x${outputHeight}`, rgba: Array.from(pixels.data), width: outputWidth, height: outputHeight, x: 0, y: 0, rotation: 0, opacity: 1, zIndex: 0, blendMode: "normal", isText: true }], transition: null },
    outputWidth,
    outputHeight,
    quality,
    colorPolicy: { version: 1, workingSpace: "linear-rec709", outputFormat: "rgba8Srgb", toneMapHdrToSdr: true, displayProfile: "srgb-reference" },
    renderGraphVersion: 1,
  }, signal);
  traceTemplate("render.native-complete", {
    renderId,
    requestId: result.requestId,
    contentType: result.contentType,
    outputWidth,
    outputHeight,
    nativeTimeMs: typeof performance !== "undefined" ? performance.now() - nativeStartedAt : null,
    totalTimeMs: typeof performance !== "undefined" ? performance.now() - renderStartedAt : null,
  });
  if (staticKey) cacheSet(staticKey, result.image);
  return { image: result.image, compiled };
}

// Thumbnail/export calls can overlap with playback. Serialize the reusable
// raster surface and mutable WASM renderer as one pipeline, while the preview
// scheduler still coalesces the playhead to its newest requested frame.
let templateRenderQueue: Promise<unknown> = Promise.resolve();

export function renderTextTemplateFrame(
  options: Parameters<typeof renderTextTemplateFrameExclusive>[0],
  signal?: AbortSignal,
): Promise<NativeTemplateFrame> {
  const run = templateRenderQueue.then(() => renderTextTemplateFrameExclusive(options, signal));
  templateRenderQueue = run.then(() => undefined, () => undefined);
  return run;
}

export function canonicalArtifactFromTemplate(template: TemplateDefinition): TextTemplateArtifact {
  return getCachedArtifact(template);
}
