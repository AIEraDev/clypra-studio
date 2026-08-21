# @clypra-studio/native-render-wasm

In-browser WebAssembly compositor for Clypra Studio — running the high-performance native `wgpu` render core directly in the browser.

## Features

- **Native `wgpu` in Browser**: Runs the same compositing, rasterization, and effect shaders compiled directly from Rust.
- **Zero Binary Bloat**: The npm package stays ultralight (~60 kB compressed). The 12 MB `.wasm` binary is streamed at runtime from Cloudflare R2 via `WebAssembly.instantiateStreaming`.
- **Full TypeScript Support**: Complete type definitions for frame requests, project snapshots, color grading, raster/video layers, and GPU handshakes.
- **Configurable CDN Endpoint**: Default global CDN distribution with support for local or self-hosted `.wasm` asset overrides.

## Installation

```bash
pnpm add @clypra-studio/native-render-wasm
# or
npm install @clypra-studio/native-render-wasm
```

## Quick Start

### 1. Probe the Renderer

Check if the WebAssembly and WebGPU/WebGL render backend is ready:

```typescript
import { probeNativeRenderer } from "@clypra-studio/native-render-wasm";

const handshake = await probeNativeRenderer();
console.log("Renderer ready:", handshake.gpu.state); // "ready"
console.log("GPU Adapter:", handshake.gpu.adapterName);
```

### 2. Render a Frame

Render a multi-layer project snapshot to an image `Blob`:

```typescript
import { renderFrame, type NativeLabFrameRequest } from "@clypra-studio/native-render-wasm";

const request: NativeLabFrameRequest = {
  contractVersion: 1,
  requestId: "frame-001",
  frameTime: {
    frameIndex: 0,
    ticks: 0,
    timescale: 60,
  },
  outputWidth: 1920,
  outputHeight: 1080,
  quality: "full",
  colorPolicy: {
    version: 1,
    workingSpace: "srgb",
    outputFormat: "rgba8Srgb",
    toneMapHdrToSdr: true,
    displayProfile: "srgb-reference",
  },
  renderGraphVersion: 1,
  project: {
    schemaVersion: 1,
    projectRevision: "rev-1",
    canvasWidth: 1920,
    canvasHeight: 1080,
    clearColor: [0, 0, 0, 1],
    videoLayers: [],
    rasterLayers: [
      {
        assetId: "overlay-1",
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        blendMode: "normal",
      },
    ],
  },
};

const result = await renderFrame(request);
console.log("Generated image blob:", result.image, result.contentType); // Blob { type: 'image/png' }
```

### 3. Custom WASM Endpoint (Optional)

By default, the renderer loads the official precompiled binary from Cloudflare R2:
`https://clypra-worker-api.abdulkabirmusa.com/media/wasm/clypra_render_wasm_bg.wasm`

To use a custom host or a locally hosted development build:

```typescript
import { configureWasmRenderer } from "@clypra-studio/native-render-wasm";

configureWasmRenderer({
  wasmUrl: "https://your-custom-cdn.com/wasm/clypra_render_wasm_bg.wasm",
});
```

## API Reference

### Functions

- `probeNativeRenderer(signal?: AbortSignal): Promise<NativeLabHandshake>`: Probes and initializes the WASM instance, returning adapter and GPU status.
- `renderFrame(request: NativeLabFrameRequest, signal?: AbortSignal): Promise<NativeLabFrameResult>`: Compiles and executes the render graph for a single frame, returning a PNG `Blob`.
- `isRendererReady(): boolean`: Synchronously checks if the WASM singleton is initialized.
- `configureWasmRenderer(options: { wasmUrl?: string }): void`: Configures the remote or local WASM binary URL.

### Classes & Errors

- `ClypraWasmError`: Extends standard `Error` with cause tracking (`error.cause`), thrown on network download failures, WebAssembly initialization issues, or shader render failures.

### Constants

- `DEFAULT_CLYPRA_WASM_URL`: The default Cloudflare R2 CDN URL for the compiled `.wasm` binary.

## License

MIT © [AIEraDev](https://github.com/AIEraDev)
