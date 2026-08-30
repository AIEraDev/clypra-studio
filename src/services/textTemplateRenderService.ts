import {
  compileTextTemplate,
  normalizeTextTemplateArtifact,
  renderTextTemplateToCanvas,
  type CompiledTextTemplate,
  type TextTemplateArtifact,
} from "@clypra-studio/engine";
import type { TextTemplate as TemplateDefinition } from "@clypra-studio/engine";
import { getNativeRenderClient, isRendererReady, NATIVE_RENDER_CONTRACT_VERSION } from "./nativeRenderClient";

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
  // Interactive preview uses dynamic raster surfaces based on zoom & DPR.
  // Keep cache bounded across a session.
  while (rasterSurfaceCache.size > 6) {
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
  if (record.keyframes && Array.isArray(record.keyframes) && record.keyframes.length > 0) return true;
  if (record.animationTracks && Array.isArray(record.animationTracks) && record.animationTracks.length > 0) return true;
  if (record.animation && typeof record.animation === "object") {
    const anim = record.animation as Record<string, unknown>;
    const hasIn = anim.in && anim.in !== "none" && Number(anim.inDuration ?? 0) > 0;
    const hasOut = anim.out && anim.out !== "none" && Number(anim.outDuration ?? 0) > 0;
    if (hasIn || hasOut) return true;
  }
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

export interface OnionSkinFrameOptions {
  enabled: boolean;
  frameCount: number;
  frameDelta: number;
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
  onionSkin?: OnionSkinFrameOptions;
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
        await this.onFrame(frame, () => !this.disposed && !controller.signal.aborted);
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

function controlValuesFromCustomization(artifact: TextTemplateArtifact, customization?: TemplateCustomization): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const textNodes = artifact.document.nodes.filter((node: any) => node.type === "text") as any[];
  for (const control of artifact.controls) {
    const node = artifact.document.nodes.find((candidate: any) => candidate.id === control.target.nodeId) as any;
    const role = node?.role || "";
    const index = textNodes.findIndex((candidate) => candidate.id === control.target.nodeId);
    if (control.type === "text") {
      values[control.id] = (role === "primary" || index === 0 ? customization?.primaryText : role === "secondary" || index === 1 ? customization?.secondaryText : customization?.accentText) ?? control.defaultValue;
    } else if (control.type === "color") {
      values[control.id] = customization?.layerColors?.[control.target.nodeId] ?? (role === "secondary" ? customization?.secondaryColor : customization?.primaryColor) ?? control.defaultValue;
    }
  }
  return values;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export raster canvas to blob"));
    }, "image/png");
  });
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
  onionSkin?: OnionSkinFrameOptions;
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
  const outputScale = Math.max(0.25, Math.min(4, options.outputScale ?? 1));
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
  const renderArtifact = options.hiddenLayerIds?.size
    ? {
        ...artifact,
        document: {
          ...artifact.document,
          nodes: artifact.document.nodes.map((node) =>
            options.hiddenLayerIds?.has(node.id) ? { ...node, visible: false } : node,
          ),
        },
      }
    : artifact;
  const controlValues = {
    ...controlValuesFromCustomization(renderArtifact, options.customization),
    ...(options.controlValues || {}),
  };
  const renderAtTime = (time: number) => renderTextTemplateToCanvas(context, {
    artifact: renderArtifact,
    context: { environment: "studio", time, width: outputWidth, height: outputHeight, controlValues },
  });
  if (options.onionSkin?.enabled) {
    const count = Math.max(1, Math.min(8, options.onionSkin.frameCount));
    for (let index = count; index >= 1; index -= 1) {
      context.save();
      context.globalAlpha = Math.min(0.35, 0.35 / index);
      renderAtTime(compiled.time - index * options.onionSkin.frameDelta);
      context.restore();
    }
  }
  const finalRender = renderAtTime(compiled.time);

  const blob = await canvasToBlob(canvas);
  traceTemplate("render.rasterized", {
    renderId,
    width: canvas.width,
    height: canvas.height,
    layerCount: compiled.layers.length,
    diagnostics: compiled.diagnostics.length,
    compileTimeMs,
    rasterTimeMs: typeof performance !== "undefined" ? performance.now() - rasterStartedAt : null,
    totalTimeMs: typeof performance !== "undefined" ? performance.now() - renderStartedAt : null,
  });

  if (staticKey) cacheSet(staticKey, blob);
  return { image: blob, compiled: finalRender.compiledTemplate ?? compiled };
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

/**
 * Immediate interactive path for Studio playback. It intentionally avoids a
 * PNG encode/decode round trip; visual semantics still come exclusively from
 * the package renderer used by export and editor playback.
 */
export function renderTextTemplatePreviewToCanvas(
  canvas: HTMLCanvasElement,
  options: Pick<TextTemplateFrameOptions, "artifact" | "time" | "controlValues" | "customization" | "hiddenLayerIds">,
): CompiledTextTemplate {
  const { artifact } = options;
  const renderArtifact = options.hiddenLayerIds?.size
    ? {
        ...artifact,
        document: {
          ...artifact.document,
          nodes: artifact.document.nodes.map((node) =>
            options.hiddenLayerIds?.has(node.id) ? { ...node, visible: false } : node,
          ),
        },
      }
    : artifact;
  const width = Math.max(1, canvas.width || renderArtifact.document.canvas.width);
  const height = Math.max(1, canvas.height || renderArtifact.document.canvas.height);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create template preview context");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  const controlValues = {
    ...controlValuesFromCustomization(renderArtifact, options.customization),
    ...(options.controlValues || {}),
  };
  const result = renderTextTemplateToCanvas(context, {
    artifact: renderArtifact,
    context: { environment: "studio", time: options.time, width, height, controlValues },
  });
  return result.compiledTemplate ?? compileTextTemplate(renderArtifact, {
    target: "studio",
    time: options.time,
    controlValues,
  });
}
