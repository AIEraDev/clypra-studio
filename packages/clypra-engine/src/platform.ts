/**
 * Platform Capability Detection
 *
 * Single source of truth for Canvas 2D / WebGL feature detection
 * across WKWebView (macOS Tauri), WebView2 (Windows Tauri), and
 * standard browser environments.
 *
 * All results are cached after the first call. Never call DOM APIs
 * on every frame — detect once, branch always.
 *
 * Covers:
 *  - ctx.filter           (absent on WKWebView < Safari 18 / macOS Sequoia)
 *  - ctx.roundRect        (absent on older WebView2 and Safari < 15.4)
 *  - ctx.letterSpacing    (absent on older WebView2 and Safari < 16.1)
 *  - OffscreenCanvas      (absent on WKWebView < Safari 16.4)
 *  - WebGL2               (absent on very old WebView2 builds)
 */

// ─── Cache ────────────────────────────────────────────────────────────────────

let _ctxFilter: boolean | null = null;
let _roundRect: boolean | null = null;
let _letterSpacing: boolean | null = null;
let _offscreenCanvas: boolean | null = null;
let _webgl2: boolean | null = null;

function probe2d(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  try {
    return document.createElement("canvas").getContext("2d");
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true when CanvasRenderingContext2D.filter is supported and
 * actually applies (some WebViews accept the assignment silently but ignore it).
 *
 * Used to decide whether stroke-blur and glow effects should go through
 * the WebGLCompositor fallback path.
 */
export function supportsCtxFilter(): boolean {
  if (_ctxFilter !== null) return _ctxFilter;
  const ctx = probe2d();
  if (!ctx) {
    _ctxFilter = false;
    return false;
  }
  try {
    ctx.filter = "blur(4px)";
    // Accept only if the value round-trips with the blur keyword present.
    // Some WebViews accept the assign but leave filter as "none" or "".
    _ctxFilter = typeof ctx.filter === "string" && ctx.filter.includes("blur");
  } catch {
    _ctxFilter = false;
  }
  return _ctxFilter;
}

/**
 * Returns true when CanvasRenderingContext2D.roundRect() exists.
 *
 * Used to decide whether to fall back to the manual quadraticCurveTo
 * rounded-rect implementation in panel rendering.
 */
export function supportsRoundRect(): boolean {
  if (_roundRect !== null) return _roundRect;
  const ctx = probe2d();
  _roundRect = !!ctx && typeof (ctx as any).roundRect === "function";
  return _roundRect;
}

/**
 * Returns true when CanvasRenderingContext2D.letterSpacing is supported
 * as an assignable CSS property.
 *
 * When false, letter-spacing must be emulated by drawing characters
 * individually (or accepted as absent for fallback quality).
 */
export function supportsLetterSpacing(): boolean {
  if (_letterSpacing !== null) return _letterSpacing;
  const ctx = probe2d();
  if (!ctx) {
    _letterSpacing = false;
    return false;
  }
  try {
    (ctx as any).letterSpacing = "2px";
    _letterSpacing = typeof (ctx as any).letterSpacing === "string" && (ctx as any).letterSpacing === "2px";
  } catch {
    _letterSpacing = false;
  }
  return _letterSpacing;
}

/**
 * Returns true when OffscreenCanvas is available in this environment.
 *
 * When false, fall back to document.createElement('canvas') for
 * intermediate rendering and ensure cleanup of DOM nodes.
 */
export function supportsOffscreenCanvas(): boolean {
  if (_offscreenCanvas !== null) return _offscreenCanvas;
  _offscreenCanvas = typeof globalThis !== "undefined" && typeof (globalThis as any).OffscreenCanvas === "function";
  return _offscreenCanvas;
}

/**
 * Returns true when WebGL2 is available.
 *
 * When false, WebGLCompositor.isSupported will also be false.
 * Bloom/blur post-FX will be silently skipped.
 */
export function supportsWebGL2(): boolean {
  if (_webgl2 !== null) return _webgl2;
  if (typeof document === "undefined") {
    _webgl2 = false;
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    _webgl2 = !!canvas.getContext("webgl2");
  } catch {
    _webgl2 = false;
  }
  return _webgl2;
}

/**
 * Create a canvas of the given size using the best available API.
 *
 * Priority: OffscreenCanvas → document.createElement('canvas')
 *
 * In Node/Vitest environments with no DOM and no OffscreenCanvas, falls back
 * to the optional global __clypraCreateCanvas factory (set by test helpers or
 * the @napi-rs/canvas shim).
 */
type NodeCanvasFactory = (width: number, height: number) => HTMLCanvasElement;

export function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (supportsOffscreenCanvas()) {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  // Node / test environment
  const factory = (globalThis as typeof globalThis & { __clypraCreateCanvas?: NodeCanvasFactory }).__clypraCreateCanvas;
  if (factory) return factory(width, height);

  try {
    const nodeRequire = (0, eval)("require") as (id: string) => unknown;
    const nodeCanvas = nodeRequire("@napi-rs/canvas") as {
      createCanvas: (w: number, h: number) => HTMLCanvasElement;
    };
    return nodeCanvas.createCanvas(width, height);
  } catch {
    throw new Error("[clypra/engine] No canvas implementation available in this environment. " + "Set globalThis.__clypraCreateCanvas or install @napi-rs/canvas.");
  }
}

/**
 * Release a DOM canvas created via createCanvas() when OffscreenCanvas
 * was unavailable. No-op for OffscreenCanvas instances.
 *
 * Sets width/height to 0 to release the backing store immediately rather
 * than waiting for GC. Call this after extracting ImageBitmap/ImageData.
 */
export function releaseCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): void {
  if (canvas instanceof OffscreenCanvas) return; // GC handles OffscreenCanvas backing stores
  // Setting dimensions to 0 releases the GPU/memory backing store immediately.
  // The parentNode check was previously here but createCanvas never appends to the
  // DOM, so it was always a no-op. Direct width=0 is the correct release mechanism.
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Reset all cached capability flags (for testing only).
 */
export function _resetPlatformCache(): void {
  _ctxFilter = null;
  _roundRect = null;
  _letterSpacing = null;
  _offscreenCanvas = null;
  _webgl2 = null;
}

/**
 * Unified resource allocator and manager for OffscreenCanvas and DOM Canvas pools.
 * Prevents GC thrashing and backing store leaks across WKWebView and standard browsers.
 */
export class CanvasDevice {
  private static canvases: (HTMLCanvasElement | OffscreenCanvas)[] = [];
  private static maxPoolSize = 10;

  /**
   * Acquire a Canvas context from the pool or create a new one.
   * If a canvas is pulled from the pool, it is resized to the target dimensions.
   */
  static acquire(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (this.canvases.length > 0) {
      canvas = this.canvases.pop()!;
      // Only resize if necessary
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    } else {
      canvas = createCanvas(width, height);
    }
    return canvas;
  }

  /**
   * Release a canvas back to the pool, or free its resources immediately if pool is full.
   */
  static release(canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (this.canvases.length < this.maxPoolSize) {
      this.canvases.push(canvas);
    } else {
      releaseCanvas(canvas);
    }
  }

  /**
   * Disposes all pooled canvases to release GPU/memory backing stores.
   */
  static clearPool(): void {
    while (this.canvases.length > 0) {
      const c = this.canvases.pop()!;
      releaseCanvas(c);
    }
  }
}

