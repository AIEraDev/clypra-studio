import { getStudioApiBaseUrl } from "./apiConfig";

type TextKind = "plain" | "effect" | "template";
type TextPhase = "session-prewarm" | "text-prefetch" | "visible-playback" | "interactive-preview";

export interface TextSample {
  kind: TextKind;
  phase: TextPhase;
  compileUs: number;
  rasterUs: number;
  readbackUs?: number;
  transferUs?: number;
  paintUs?: number;
  totalTimeUs: number;
  outputPixels: number;
  cacheHit: boolean;
}

const sessionId = `studio-text-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const samples: TextSample[] = [];
let windowStartMs = Date.now();
let flushPromise: Promise<void> | null = null;

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.round((sorted.length - 1) * fraction))] ?? 0;
}

function hardware() {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    osFamily: /Mac/i.test(nav?.platform || "") ? "macos" : /Win/i.test(nav?.platform || "") ? "windows" : /Linux/i.test(nav?.platform || "") ? "linux" : "web",
    osVersion: "studio",
    cpuArch: "wasm32",
    cpuCores: nav?.hardwareConcurrency || 1,
    systemMemoryMb: 0,
    gpuVendor: "unknown",
    gpuModel: "studio-preview",
    graphicsBackend: "webgpu",
    displayDpr: globalThis.devicePixelRatio || 1,
  };
}

export function recordStudioTextRender(sample: TextSample): void {
  samples.push({ ...sample, compileUs: Math.max(0, sample.compileUs), rasterUs: Math.max(0, sample.rasterUs), totalTimeUs: Math.max(0, sample.totalTimeUs) });
  if (Date.now() - windowStartMs >= (import.meta.env.DEV ? 5000 : 30000)) void flushStudioTextTelemetry();
}

export async function flushStudioTextTelemetry(): Promise<void> {
  if (flushPromise || samples.length === 0) return flushPromise || Promise.resolve();
  const batch = samples.splice(0, samples.length);
  const start = windowStartMs;
  windowStartMs = Date.now();
  const groups = new Map<string, TextSample[]>();
  for (const sample of batch) {
    const key = `${sample.kind}::${sample.phase}`;
    groups.set(key, [...(groups.get(key) || []), sample]);
  }
  const events = [...groups.entries()].map(([key, group]) => {
    const [kind, phase] = key.split("::") as [TextKind, TextPhase];
    const total = group.map((sample) => sample.totalTimeUs);
    const compile = group.map((sample) => sample.compileUs);
    const raster = group.map((sample) => sample.rasterUs);
    const readback = group.map((sample) => sample.readbackUs || 0);
    const transfer = group.map((sample) => sample.transferUs || 0);
    const paint = group.map((sample) => sample.paintUs || 0);
    const cacheHits = group.filter((sample) => sample.cacheHit).length;
    const renderPercentiles = { p50: percentile(total, 0.5), p95: percentile(total, 0.95), p99: percentile(total, 0.99) };
    return {
      eventId: `evt_text_studio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      measurementId: `text:${sessionId}:${kind}:studio-preview:${phase}:${start}`,
      measurementSource: "session-rollup",
      sampleKind: "window-rollup",
      subsystem: "text",
      sessionId,
      appVersion: import.meta.env.VITE_APP_VERSION || "studio",
      appBuildNumber: import.meta.env.MODE || "prod",
      appEnvironment: import.meta.env.DEV ? "beta" : "production",
      device: hardware(),
      video: { container: "mp4", codec: "h264", width: 1920, height: 1080, resolutionBucket: "1080p", nominalFps: 60, pacingMode: "cfr", bitDepth: 8, colorSpace: "srgb", hdrFormat: "none", bitrateKbps: 0 },
      workload: { mode: "frame-step", durationMs: Math.max(1, Date.now() - start), targetFps: 60, renderedFps: 60, totalFrames: group.length, droppedFrames: 0, droppedFramesRatio: 0, staleFrames: 0, cancelledFrames: 0, peakRamMb: 0, cacheHitRatio: cacheHits / Math.max(1, group.length), stageTimings: { totalTimeUs: renderPercentiles.p95 }, renderPercentiles, isSessionRollup: true },
      textMetrics: {
        kind, rendererPath: "studio-preview", phase, runtimeEnvironment: import.meta.env.DEV ? "development" : "production",
        windowDurationMs: Math.max(1, Date.now() - start), renderCount: group.length, cacheHits, cacheMisses: group.length - cacheHits,
        cacheHitRatio: cacheHits / Math.max(1, group.length), layerCount: group.length, outputPixels: group.reduce((sum, sample) => sum + sample.outputPixels, 0),
        renderPercentiles, stagePercentiles: { compileUs: { p50: percentile(compile, 0.5), p95: percentile(compile, 0.95), p99: percentile(compile, 0.99) }, rasterUs: { p50: percentile(raster, 0.5), p95: percentile(raster, 0.95), p99: percentile(raster, 0.99) }, readbackUs: { p50: percentile(readback, 0.5), p95: percentile(readback, 0.95), p99: percentile(readback, 0.99) }, transferUs: { p50: percentile(transfer, 0.5), p95: percentile(transfer, 0.95), p99: percentile(transfer, 0.99) }, paintUs: { p50: percentile(paint, 0.5), p95: percentile(paint, 0.95), p99: percentile(paint, 0.99) }, totalTimeUs: renderPercentiles },
      },
      timestampMs: Date.now(),
    };
  });
  flushPromise = fetch(`${getStudioApiBaseUrl()}/performance/telemetry/ingest/batch`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ batchId: `batch_text_studio_${Date.now()}`, sentAtMs: Date.now(), client: "clypra-studio", events }) }).then(() => undefined).catch(() => undefined).finally(() => { flushPromise = null; });
  return flushPromise;
}

if (typeof window !== "undefined") {
  window.setInterval(() => void flushStudioTextTelemetry(), 15000);
  window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flushStudioTextTelemetry(); });
}
