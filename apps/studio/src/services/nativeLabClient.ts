/**
 * nativeLabClient.ts — WASM-backed native rendering for Studio labs.
 *
 * Previously this module wrapped NativeLabClient (HTTP fetch to local daemon).
 * It now delegates entirely to @clypra-studio/native-render-wasm which runs
 * the same wgpu compositor compiled to WebAssembly — no daemon required.
 *
 * All exports preserve the same signatures so call sites are unchanged.
 */

import {
  probeNativeRenderer,
  renderFrame as wasmRenderFrame,
  isRendererReady,
  type NativeLabHandshake,
  type NativeLabFrameRequest,
  type NativeLabFrameResult,
} from "@clypra-studio/native-render-wasm";

// Re-export types so existing imports from this module keep working.
export type { NativeLabHandshake, NativeLabFrameRequest, NativeLabFrameResult };

/**
 * Probe the WASM renderer.
 * Replacement for: probeNativeLab(signal?)
 */
export async function probeNativeLab(
  signal?: AbortSignal,
): Promise<NativeLabHandshake> {
  return probeNativeRenderer(signal);
}

/**
 * Render a single frame in-browser via the WASM compositor.
 * Replacement for: getNativeLabClient().renderFrame(request)
 *
 * The returned NativeLabFrameResult is identical in shape to what the HTTP
 * client returned — callers that destructure { image, contentType, ... } are
 * unaffected.
 */
export async function renderFrame(
  request: NativeLabFrameRequest,
  signal?: AbortSignal,
): Promise<NativeLabFrameResult> {
  return wasmRenderFrame(request, signal);
}

/**
 * Whether the WASM GPU compositor has finished initialising.
 * Replaces the daemon connection-state checks in lab connection panels.
 */
export { isRendererReady };

/**
 * getNativeLabClient() — kept for backwards compatibility.
 *
 * Previously returned a NativeLabClient HTTP instance. Now returns a thin
 * object with the same method signatures backed by the WASM renderer.
 * Call sites that call .renderFrame() or .handshake() work unchanged.
 */
export function getNativeLabClient() {
  return {
    async renderFrame(
      request: NativeLabFrameRequest,
      signal?: AbortSignal,
    ): Promise<NativeLabFrameResult> {
      return wasmRenderFrame(request, signal);
    },
    async handshake(signal?: AbortSignal): Promise<NativeLabHandshake> {
      return probeNativeRenderer(signal);
    },
  };
}
