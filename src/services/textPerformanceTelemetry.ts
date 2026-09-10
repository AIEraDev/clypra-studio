/**
 * @deprecated MARKED FOR DELETION
 *
 * This module was the clypra-studio equivalent of the desktop's
 * telemetryCollector batch sender. It called POST /telemetry/ingest/batch
 * on every 30 s rollup window, contributing to the 500+ rows/session problem.
 *
 * The endpoint now returns 410 Gone. All network I/O has been silenced below.
 *
 * TODO: once clypra-studio adopts the session-file ingest pattern
 * (POST /telemetry/ingest/session), delete this file entirely and replace
 * call sites of `recordStudioTextRender` with the studio equivalent of
 * perfLogService.enqueue().
 *
 * Call sites to update before deleting:
 *   - Search for `recordStudioTextRender` across clypra-studio/src
 */

// import { getStudioApiBaseUrl } from "./apiConfig";
// ↑ Intentionally commented out — the API base URL is no longer needed here.

type TextKind = "plain" | "effect" | "template";
type TextPhase =
  | "session-prewarm"
  | "text-prefetch"
  | "visible-playback"
  | "interactive-preview";

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

// In-memory accumulator kept so call sites that feed samples here continue
// to compile and run without errors. The flush path no longer sends to the API.
const samples: TextSample[] = [];
let windowStartMs = Date.now();

// flushPromise is kept as a no-op resolved promise so callers that await
// flushStudioTextTelemetry() do not hang.
let flushPromise: Promise<void> | null = null;

/**
 * Records a studio text render sample into the in-memory accumulator.
 * Accumulation still works; only the network send has been removed.
 *
 * @deprecated Will be replaced by the studio session-file ingest path.
 */
export function recordStudioTextRender(sample: TextSample): void {
  samples.push({
    ...sample,
    compileUs: Math.max(0, sample.compileUs),
    rasterUs: Math.max(0, sample.rasterUs),
    totalTimeUs: Math.max(0, sample.totalTimeUs),
  });

  // Window roll — drain the buffer but do NOT send to the API.
  if (Date.now() - windowStartMs >= (import.meta.env.DEV ? 5000 : 30000)) {
    void flushStudioTextTelemetry();
  }
}

/**
 * @deprecated MARKED FOR DELETION
 *
 * Previously POSTed accumulated text-render windows to
 * /performance/telemetry/ingest/batch. That endpoint now returns 410 Gone.
 *
 * The function is kept as a no-op so existing callers and the interval/
 * visibilitychange hooks below compile and run without throwing. It drains
 * the in-memory buffer to prevent unbounded growth, but sends nothing.
 */
export async function flushStudioTextTelemetry(): Promise<void> {
  if (flushPromise) return flushPromise;
  if (samples.length === 0) return Promise.resolve();

  // Drain the accumulator to prevent unbounded growth — but do not send.
  samples.splice(0, samples.length);
  windowStartMs = Date.now();

  // Return a resolved promise so awaiting callers are not blocked.
  flushPromise = Promise.resolve();
  flushPromise.finally(() => {
    flushPromise = null;
  });
  return flushPromise;
}

// Interval and visibilitychange hooks retained so the module loads cleanly.
// They now just drain the in-memory buffer — no network traffic.
if (typeof window !== "undefined") {
  window.setInterval(() => void flushStudioTextTelemetry(), 15000);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushStudioTextTelemetry();
  });
}
