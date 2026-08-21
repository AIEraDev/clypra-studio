/**
 * nativeRenderClient.ts — WASM-backed native rendering for Studio labs.
 *
 * Delegates entirely to @clypra-studio/native-render-wasm which runs the same
 * wgpu compositor compiled to WebAssembly and streamed via Cloudflare R2.
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
 */
export async function probeNativeLab(
  signal?: AbortSignal,
): Promise<NativeLabHandshake> {
  return probeNativeRenderer(signal);
}

/**
 * Render a single frame in-browser via the WASM compositor.
 */
export async function renderFrame(
  request: NativeLabFrameRequest,
  signal?: AbortSignal,
): Promise<NativeLabFrameResult> {
  return wasmRenderFrame(request, signal);
}

/**
 * Whether the WASM GPU compositor has finished initialising.
 */
export { isRendererReady };

/**
 * Returns a client object exposing renderFrame() and handshake() backed by
 * the in-browser WASM compositor.
 */
export function getNativeRenderClient() {
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

/**
 * Backwards compatibility alias for getNativeRenderClient().
 */
export const getNativeLabClient = getNativeRenderClient;
