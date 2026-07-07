/**
 * @clypra/video-renderer — Core VideoRenderer
 *
 * Professional PixiJS-based video rendering engine.
 * Single source of truth for Clypra Editor and Studio.
 *
 * Key features:
 * - Unified video/image rendering
 * - GPU-accelerated filters
 * - Media overlay composition (text, stickers)
 * - Transition engine
 * - Efficient memory management
 */

import * as PIXI from "pixi.js";
import type { Layer } from "../layers/Layer";
import { LayerManager } from "./LayerManager";
import { FilterManager } from "./FilterManager";
import { TransitionManager } from "./TransitionManager";
import { TexturePool } from "./TexturePool";

export interface VideoRendererConfig {
  /** Target canvas element */
  canvas: HTMLCanvasElement;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Background color (hex) */
  backgroundColor?: number;
  /** Pixel ratio for high-DPI displays */
  pixelRatio?: number;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Preserve drawing buffer for screenshots */
  preserveDrawingBuffer?: boolean;
}

export interface RenderStats {
  fps: number;
  frameTime: number;
  layerCount: number;
  textureMemory: number;
  gpuTime: number;
}

/**
 * VideoRenderer - Main rendering engine
 *
 * Manages PixiJS Application lifecycle and coordinates:
 * - Layer rendering (video, image, text, stickers)
 * - GPU filter chains
 * - Transitions
 * - Memory management
 */
export class VideoRenderer {
  private app: PIXI.Application | null = null;
  private initialized = false;
  private initializingPromise: Promise<void> | null = null;

  private config: VideoRendererConfig;

  // Core managers
  private layerManager: LayerManager | null = null;
  private filterManager: FilterManager | null = null;
  private transitionManager: TransitionManager | null = null;
  private texturePool: TexturePool | null = null;

  // Scene graph hierarchy
  private baseMediaContainer: PIXI.Container | null = null;
  private mainVideoSprite: PIXI.Sprite | null = null;
  private transitionContainer: PIXI.Container | null = null;
  private overlayContainer: PIXI.Container | null = null;

  // Active source tracking
  private activeSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null = null;
  private sourceTexture: PIXI.Texture | null = null;

  // Fit mode for source resizing
  private fitMode: "stretch" | "fit" | "cover" = "fit";

  // Performance tracking
  private stats: RenderStats = {
    fps: 0,
    frameTime: 0,
    layerCount: 0,
    textureMemory: 0,
    gpuTime: 0,
  };

  private lastFrameTime = 0;
  private frameCount = 0;

  constructor(config: VideoRendererConfig) {
    this.config = {
      backgroundColor: 0x000000,
      pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      antialias: true,
      preserveDrawingBuffer: true,
      ...config,
    };

    // Prevent multiple renderer instances
    if (typeof window !== "undefined") {
      (window as any).__videoRendererInstanceCount = ((window as any).__videoRendererInstanceCount || 0) + 1;
      console.assert((window as any).__videoRendererInstanceCount <= 1, `Multiple VideoRenderer instances detected: ${(window as any).__videoRendererInstanceCount}`);
      console.debug(`[VideoRenderer] Created. Total instances: ${(window as any).__videoRendererInstanceCount}`);
    }
  }

  /**
   * Initialize the renderer
   *
   * Atomic: concurrent calls are deduplicated via promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("[VideoRenderer] Already initialized");
      return;
    }

    // Guard against concurrent initialization
    if (this.initializingPromise) {
      console.warn("[VideoRenderer] Initialize called while already initializing - returning in-flight promise");
      return this.initializingPromise;
    }

    this.initializingPromise = this._doInitialize();
    try {
      await this.initializingPromise;
    } finally {
      this.initializingPromise = null;
    }
  }

  private async _doInitialize(): Promise<void> {
    const { canvas, width, height, backgroundColor, pixelRatio, antialias, preserveDrawingBuffer } = this.config;

    // Create PixiJS Application
    this.app = new PIXI.Application();

    // WebGL context loss/restore handlers
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      console.warn("[VideoRenderer] WebGL context lost - attempting recovery");
    });

    canvas.addEventListener("webglcontextrestored", () => {
      console.log("[VideoRenderer] WebGL context restored");
    });

    await this.app.init({
      canvas,
      width,
      height,
      backgroundColor,
      backgroundAlpha: backgroundColor === undefined ? 0 : 1,
      antialias,
      preference: "webgl",
      resolution: pixelRatio,
      autoDensity: true,
      preserveDrawingBuffer,
    });

    // Initialize core managers
    this.texturePool = new TexturePool(20);
    this.layerManager = new LayerManager(this.app);
    this.filterManager = new FilterManager();
    this.transitionManager = new TransitionManager(this.app);

    // Build scene graph hierarchy
    this._setupSceneGraph();

    // Start performance tracking
    this._startPerformanceTracking();

    this.initialized = true;
    console.debug("[VideoRenderer] Initialized successfully");
  }

  /**
   * Setup scene graph hierarchy
   *
   * Stage structure:
   * ├── baseMediaContainer (z-index: 0) — video/image base layers
   * ├── mainVideoSprite (z-index: 1) — primary video source
   * ├── transitionContainer (z-index: 2) — transition effects
   * └── overlayContainer (z-index: 3) — text/stickers/overlays
   */
  private _setupSceneGraph(): void {
    if (!this.app) return;

    // Base media container (lowest z-index)
    this.baseMediaContainer = new PIXI.Container();
    this.baseMediaContainer.sortableChildren = true;
    this.app.stage.addChildAt(this.baseMediaContainer, 0);

    // Main video sprite
    this.mainVideoSprite = new PIXI.Sprite();
    this.mainVideoSprite.width = this.config.width;
    this.mainVideoSprite.height = this.config.height;
    this.app.stage.addChild(this.mainVideoSprite);

    // Transition container
    this.transitionContainer = new PIXI.Container();
    this.transitionContainer.visible = false;
    this.app.stage.addChild(this.transitionContainer);

    // Overlay container (highest z-index)
    this.overlayContainer = new PIXI.Container();
    this.overlayContainer.sortableChildren = true;
    this.app.stage.addChild(this.overlayContainer);

    // Register containers with managers
    if (this.layerManager) {
      this.layerManager.setContainers({
        base: this.baseMediaContainer,
        overlay: this.overlayContainer,
      });
    }

    if (this.transitionManager) {
      this.transitionManager.setContainer(this.transitionContainer);
    }
  }

  /**
   * Set the active video source
   */
  setVideoSource(video: HTMLVideoElement): void {
    this._assertInitialized();

    if (this.activeSource === video) {
      this._resizeMainSprite();
      return;
    }

    this.activeSource = video;

    // Create or update texture
    if (this.sourceTexture) {
      this.sourceTexture.destroy(true);
    }

    const source = new PIXI.VideoSource({
      resource: video,
      autoPlay: false,
    });

    this.sourceTexture = new PIXI.Texture({ source });

    if (this.mainVideoSprite) {
      this.mainVideoSprite.texture = this.sourceTexture;
      this._resizeMainSprite();
    }

    console.debug(`[VideoRenderer] Set video source: ${video.videoWidth}x${video.videoHeight}`);
  }

  /**
   * Set the active image source
   */
  setImageSource(image: HTMLImageElement | HTMLCanvasElement): void {
    this._assertInitialized();

    if (this.activeSource === image) {
      this._resizeMainSprite();
      return;
    }

    this.activeSource = image;

    // Create or update texture
    if (this.sourceTexture) {
      this.sourceTexture.destroy(true);
    }

    this.sourceTexture = PIXI.Texture.from(image);

    if (this.mainVideoSprite) {
      this.mainVideoSprite.texture = this.sourceTexture;
      this._resizeMainSprite();
    }

    console.debug(`[VideoRenderer] Set image source: ${image.width}x${image.height}`);
  }

  /**
   * Set fit mode for source resizing
   */
  setFitMode(mode: "stretch" | "fit" | "cover"): void {
    if (this.fitMode === mode) return;
    this.fitMode = mode;
    this._resizeMainSprite();
  }

  /**
   * Resize main video sprite based on fit mode
   */
  private _resizeMainSprite(): void {
    if (!this.mainVideoSprite || !this.sourceTexture || !this.app) return;

    const canvasWidth = this.app.screen.width;
    const canvasHeight = this.app.screen.height;

    const { width: sourceWidth, height: sourceHeight } = this._getSourceDimensions();

    if (this.fitMode === "stretch") {
      this.mainVideoSprite.width = canvasWidth;
      this.mainVideoSprite.height = canvasHeight;
      this.mainVideoSprite.position.set(0, 0);
    } else {
      const scaleX = canvasWidth / sourceWidth;
      const scaleY = canvasHeight / sourceHeight;

      const scale = this.fitMode === "fit" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

      this.mainVideoSprite.width = sourceWidth * scale;
      this.mainVideoSprite.height = sourceHeight * scale;

      // Center the sprite
      this.mainVideoSprite.position.set((canvasWidth - this.mainVideoSprite.width) / 2, (canvasHeight - this.mainVideoSprite.height) / 2);
    }
  }

  /**
   * Get source dimensions from active source
   */
  private _getSourceDimensions(): { width: number; height: number } {
    if (!this.activeSource) {
      return { width: this.config.width, height: this.config.height };
    }

    const source = this.activeSource as any;

    // Video element
    if (source.videoWidth !== undefined && source.videoWidth > 0) {
      return { width: source.videoWidth, height: source.videoHeight };
    }

    // Image element
    if (source.naturalWidth !== undefined && source.naturalWidth > 0) {
      return { width: source.naturalWidth, height: source.naturalHeight };
    }

    // Canvas element
    if (source.width !== undefined && source.width > 0) {
      return { width: source.width, height: source.height };
    }

    // Fallback to texture dimensions
    if (this.sourceTexture) {
      return { width: this.sourceTexture.width, height: this.sourceTexture.height };
    }

    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Add a layer (video, image, text, sticker)
   */
  addLayer(layer: Layer): void {
    this._assertInitialized();
    this.layerManager?.addLayer(layer);
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): void {
    this._assertInitialized();
    this.layerManager?.removeLayer(layerId);
  }

  /**
   * Update a layer
   */
  updateLayer(layerId: string, updates: Partial<Layer>): void {
    this._assertInitialized();
    this.layerManager?.updateLayer(layerId, updates);
  }

  /**
   * Add a GPU filter to the main video sprite
   */
  addFilter(type: string, params: Record<string, any>): string {
    this._assertInitialized();

    if (!this.filterManager || !this.mainVideoSprite) {
      throw new Error("[VideoRenderer] Filter manager or main sprite not initialized");
    }

    const filterId = this.filterManager.addFilter(type, params);
    this._applyFilters();

    return filterId;
  }

  /**
   * Remove a filter
   */
  removeFilter(filterId: string): void {
    this._assertInitialized();
    this.filterManager?.removeFilter(filterId);
    this._applyFilters();
  }

  /**
   * Update filter parameters
   */
  updateFilter(filterId: string, params: Record<string, any>): void {
    this._assertInitialized();
    this.filterManager?.updateFilter(filterId, params);
  }

  /**
   * Apply current filter chain to main sprite
   */
  private _applyFilters(): void {
    if (!this.mainVideoSprite || !this.filterManager) return;

    const filters = this.filterManager.getFilters();
    this.mainVideoSprite.filters = filters.length > 0 ? filters : null;
  }

  /**
   * Render the current frame
   */
  render(): void {
    this._assertInitialized();

    const startTime = performance.now();

    // Update video texture if needed
    if (this.sourceTexture && this.activeSource instanceof HTMLVideoElement) {
      if (this.activeSource.readyState >= 2) {
        this.sourceTexture.source.update();
      }
    }

    // Update layers
    this.layerManager?.update();

    // Render stage
    if (this.app) {
      this.app.renderer.render(this.app.stage);
    }

    // Update performance stats
    const frameTime = performance.now() - startTime;
    this._updateStats(frameTime);
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this._assertInitialized();

    if (!this.app) return;

    this.config.width = width;
    this.config.height = height;

    this.app.renderer.resize(width, height);
    this._resizeMainSprite();

    console.debug(`[VideoRenderer] Resized to ${width}x${height}`);
  }

  /**
   * Capture current frame as ImageData
   */
  captureFrame(): ImageData | null {
    this._assertInitialized();

    if (!this.app) return null;

    const canvas = this.app.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Get performance statistics
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Get the PixiJS Application instance
   */
  getApp(): PIXI.Application | null {
    return this.app;
  }

  /**
   * Get containers for advanced use cases
   */
  getContainers() {
    return {
      base: this.baseMediaContainer,
      main: this.mainVideoSprite,
      transition: this.transitionContainer,
      overlay: this.overlayContainer,
    };
  }

  /**
   * Start performance tracking
   */
  private _startPerformanceTracking(): void {
    if (!this.app) return;

    this.app.ticker.add(() => {
      this.frameCount++;
      const now = performance.now();

      if (now - this.lastFrameTime >= 1000) {
        this.stats.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
    });
  }

  /**
   * Update performance statistics
   */
  private _updateStats(frameTime: number): void {
    this.stats.frameTime = frameTime;
    this.stats.layerCount = this.layerManager?.getLayerCount() || 0;
    this.stats.textureMemory = this._calculateTextureMemory();
    this.stats.gpuTime = frameTime;
  }

  /**
   * Calculate total texture memory usage
   */
  private _calculateTextureMemory(): number {
    if (!this.app) return 0;

    let memory = 0;
    const textures = (this.app.renderer as any).texture?.managedTextures || [];

    for (const texture of textures) {
      if (texture.width && texture.height) {
        memory += texture.width * texture.height * 4; // RGBA = 4 bytes per pixel
      }
    }

    return memory;
  }

  /**
   * Clean up and destroy the renderer
   */
  destroy(): void {
    if (!this.initialized) return;

    console.debug("[VideoRenderer] Destroying...");

    // Clean up managers
    this.layerManager?.destroy();
    this.filterManager?.destroy();
    this.transitionManager?.destroy();
    this.texturePool?.destroy();

    // Clean up textures
    if (this.sourceTexture) {
      this.sourceTexture.destroy(true);
      this.sourceTexture = null;
    }

    // Destroy PixiJS app
    if (this.app) {
      try {
        const gl = (this.app.renderer as any).gl as WebGLRenderingContext | undefined;
        this.app.destroy(true, { children: true, texture: true });
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (e) {
        console.warn("[VideoRenderer] Error destroying PixiJS application:", e);
      }
      this.app = null;
    }

    // Reset state
    this.baseMediaContainer = null;
    this.mainVideoSprite = null;
    this.transitionContainer = null;
    this.overlayContainer = null;
    this.activeSource = null;
    this.initialized = false;

    if (typeof window !== "undefined") {
      (window as any).__videoRendererInstanceCount = Math.max(0, ((window as any).__videoRendererInstanceCount || 1) - 1);
      console.debug(`[VideoRenderer] Destroyed. Remaining instances: ${(window as any).__videoRendererInstanceCount}`);
    }
  }

  /**
   * Assert that renderer is initialized
   */
  private _assertInitialized(): void {
    if (!this.initialized || !this.app) {
      throw new Error("[VideoRenderer] Renderer not initialized. Call initialize() first.");
    }
  }

  /**
   * Check if renderer is ready
   */
  get isReady(): boolean {
    return this.initialized && this.app !== null;
  }
}
