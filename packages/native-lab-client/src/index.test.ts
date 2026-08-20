import { describe, expect, it, vi } from "vitest";
import { NativeLabClient, type NativeLabFrameRequest } from "./index";

const request: NativeLabFrameRequest = {
  contractVersion: 1,
  requestId: "lab-request-1",
  frameTime: { frameIndex: 4, ticks: 133_333, timescale: 1_000_000 },
  project: {
    schemaVersion: 1,
    projectRevision: "lab-project:1",
    canvasWidth: 320,
    canvasHeight: 180,
    clearColor: [0, 0, 0, 1],
    videoLayers: [],
  },
  outputWidth: 320,
  outputHeight: 180,
  quality: "quarter",
  colorPolicy: {
    version: 1,
    workingSpace: "linear-rec709",
    outputFormat: "rgba8Srgb",
    toneMapHdrToSdr: true,
    displayProfile: "srgb-reference",
  },
  renderGraphVersion: 1,
};

describe("NativeLabClient", () => {
  it("binds the browser fetch function to its global owner", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        protocolVersion: 1,
        contractVersion: 1,
        coreVersion: "test",
        renderGraphVersion: 1,
        colorPolicyVersion: 1,
        gpu: { state: "ready", available: true, adapterName: "Test GPU", backend: "test", failureReason: null },
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", function (this: typeof globalThis, ...args: Parameters<typeof fetch>) {
      expect(this).toBe(globalThis);
      return fetchMock(...args);
    } as typeof fetch);

    try {
      await expect(new NativeLabClient().handshake()).resolves.toMatchObject({
        gpu: { available: true },
      });
    } finally {
      vi.stubGlobal("fetch", originalFetch);
    }
  });

  it("sends versioned validation requests to the configured endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ valid: true, cacheKey: "native-v1-key" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new NativeLabClient({ endpoint: "http://localhost:8788/", fetcher });

    await expect(client.validate(request)).resolves.toEqual({
      valid: true,
      cacheKey: "native-v1-key",
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8788/v1/validate", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "X-Clypra-Native-Protocol": "1" }),
    }));
  });

  it("returns the native image and frame metrics without creating a renderer", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "x-clypra-request-id": "native-request-2",
          "x-clypra-frame-index": "8",
          "x-clypra-total-time-us": "1200",
          "x-clypra-cache-hit": "true",
        },
      }),
    );
    const client = new NativeLabClient({ fetcher });
    const result = await client.renderFrame({ ...request, requestId: "native-request-1" });

    expect(result.contentType).toBe("image/png");
    expect(result.requestId).toBe("native-request-2");
    expect(result.frameIndex).toBe(8);
    expect(result.metrics.totalTimeUs).toBe(1200);
    expect(result.metrics.cacheHit).toBe(true);
    expect(await result.image.arrayBuffer()).toEqual(new Uint8Array([1, 2, 3]).buffer);
  });

  it("preserves daemon diagnostics when a native render is rejected", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "native_gpu_unavailable", error: "No compatible GPU adapter" }), {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new NativeLabClient({ fetcher });

    await expect(client.renderFrame(request)).rejects.toThrow(
      "Native frame render failed (503 Service Unavailable): {\"code\":\"native_gpu_unavailable\",\"error\":\"No compatible GPU adapter\"}",
    );
  });
});
