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

// Keep this local bridge constant available even when TypeScript resolves the
// published declaration package instead of its source alias.
export const NATIVE_RENDER_CONTRACT_VERSION = 2;

let negotiatedContractVersion: number | null = null;

function isContractVersionError(error: unknown): boolean {
  return /contract version|invalid native core contract/i.test(
    error instanceof Error ? error.message : String(error),
  );
}

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
  const firstVersion = negotiatedContractVersion ?? request.contractVersion;
  const versions = firstVersion === 1 ? [1, 2] : [2, 1];
  let lastError: unknown;

  for (const contractVersion of versions) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const result = await wasmRenderFrame(
        { ...request, contractVersion },
        signal,
      );
      negotiatedContractVersion = contractVersion;
      return result;
    } catch (error) {
      lastError = error;
      if (!isContractVersionError(error) || contractVersion === versions[versions.length - 1]) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
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
      return renderFrame(request, signal);
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
