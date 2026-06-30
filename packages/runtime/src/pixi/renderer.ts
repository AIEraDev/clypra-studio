/**
 * @clypra/runtime — Pixi Renderer
 *
 * Main renderer that executes frame graphs using Pixi.js.
 */

import * as PIXI from "pixi.js";
import type { FrameGraph, RenderPass } from "../planner/types";
import type { RendererConfig, RenderResult, RenderStats } from "./types";
import { TexturePool } from "./texture-pool";
import { createFilter, updateFilterUniforms } from "./filters";

/**
 * Pixi.js Renderer
 *
 * Executes frame graphs and manages GPU resources.
 */
export class PixiRenderer {
  private app: PIXI.Application | null = null;
  private initialized = false;
  private texturePool: TexturePool;
  private resources = new Map<string, PIXI.Texture>();
  private filters = new Map<string, PIXI.Filter>();
  private canvasElement?: HTMLCanvasElement;

  constructor() {
    this.texturePool = new TexturePool(20);
  }

  /**
   * Initialize the renderer
   */
  async initialize(config: RendererConfig = {}): Promise<void> {
    if (this.initialized) {
      throw new Error("PixiRenderer already initialized");
    }

    this.canvasElement = config.canvas;

    const width = config.width ?? config.canvas?.clientWidth ?? 1920;
    const height = config.height ?? config.canvas?.clientHeight ?? 1080;

    this.app = new PIXI.Application();
    await this.app.init({
      canvas: config.canvas,
      width,
      height,
      backgroundColor: config.backgroundColor ?? 0x0e0e12,
      antialias: config.antialias ?? true,
      preference: "webgl",
      resolution: config.resolution ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1),
      autoDensity: true,
      preserveDrawingBuffer: config.preserveDrawingBuffer ?? true,
    });

    this.initialized = true;
  }

  /**
   * Render a frame graph
   */
  async render(frameGraph: FrameGraph): Promise<RenderResult> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderer not initialized");
    }

    const startTime = performance.now();

    // Allocate resources
    for (const resource of frameGraph.resourceRequests) {
      if (!this.resources.has(resource.id)) {
        this.allocateResource(resource.id, resource.width, resource.height);
      }
    }

    // Execute passes
    let totalGpuTime = 0;
    for (const pass of frameGraph.passes) {
      const passStart = performance.now();
      await this.executePass(pass);
      totalGpuTime += performance.now() - passStart;
    }

    // Release transient resources
    for (const resource of frameGraph.resourceRequests) {
      if (resource.transient) {
        this.releaseResource(resource.id);
      }
    }

    const totalCpuTime = performance.now() - startTime - totalGpuTime;

    // Get output texture
    const outputTexture = this.resources.get("output") || this.resources.values().next().value;

    if (!outputTexture) {
      throw new Error("No output texture available");
    }

    const stats: RenderStats = {
      passCount: frameGraph.passes.length,
      totalGpuTime,
      totalCpuTime,
      resourceCount: this.resources.size,
      textureMemory: this.calculateTextureMemory(),
    };

    return {
      outputTexture,
      stats,
    };
  }

  /**
   * Execute a single render pass
   */
  private async executePass(pass: RenderPass): Promise<void> {
    if (!this.app) return;

    // Get input and output textures
    const inputTexture = pass.inputs.length > 0 ? this.resources.get(pass.inputs[0]) : null;
    const outputTexture = this.resources.get(pass.output);

    if (!outputTexture) {
      throw new Error(`Output resource not found: ${pass.output}`);
    }

    // Handle copy/blit passes
    if (pass.shaderId === "copy" || pass.shaderId === "blit" || pass.shaderId === "blit-source") {
      if (inputTexture) {
        this.blitTexture(inputTexture, outputTexture as PIXI.RenderTexture, pass.clearBeforeRender);
      }
      return;
    }

    if (!inputTexture) {
      console.warn(`No input texture for pass: ${pass.id}`);
      return;
    }

    // Create sprite with input texture
    const target = outputTexture as PIXI.RenderTexture;
    const sprite = new PIXI.Sprite(inputTexture);
    sprite.width = target.width;
    sprite.height = target.height;

    // Get or create filter
    let filter: PIXI.Filter;
    let disposeFilter = false;

    if (this.filters.has(pass.shaderId)) {
      filter = this.filters.get(pass.shaderId)!;
      updateFilterUniforms(filter, pass.uniforms, pass.shaderId);
    } else {
      filter = createFilter(pass.shaderId, pass.uniforms);

      // Cache simple filters
      if (["brightness", "contrast", "saturation", "copy", "blit"].includes(pass.shaderId)) {
        this.filters.set(pass.shaderId, filter);
      } else {
        disposeFilter = true;
      }
    }

    // Apply filter and render
    sprite.filters = [filter];
    this.app.renderer.render({
      container: sprite,
      target,
      clear: pass.clearBeforeRender ?? true,
    });
    sprite.filters = null;

    // Clean up if needed
    if (disposeFilter) {
      filter.destroy();
    }
  }

  /**
   * Blit texture to another
   */
  private blitTexture(source: PIXI.Texture, target: PIXI.RenderTexture, clear: boolean = true): void {
    if (!this.app) return;

    const sprite = new PIXI.Sprite(source);
    sprite.width = target.width;
    sprite.height = target.height;

    this.app.renderer.render({
      container: sprite,
      target,
      clear,
    });
  }

  /**
   * Allocate a texture resource
   */
  private allocateResource(id: string, width: number, height: number): void {
    if (this.resources.has(id)) {
      throw new Error(`Resource "${id}" already allocated`);
    }

    const texture = PIXI.RenderTexture.create({ width, height });
    this.resources.set(id, texture);
  }

  /**
   * Release a texture resource
   */
  private releaseResource(id: string): void {
    const texture = this.resources.get(id);
    if (!texture) return;

    // Return to pool if it's a render texture
    if (texture instanceof PIXI.RenderTexture) {
      this.texturePool.release(texture, {
        width: texture.width,
        height: texture.height,
        format: "rgba8",
      });
    }

    this.resources.delete(id);
  }

  /**
   * Upload source image to resources
   */
  uploadSourceImage(sourceImage: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, resourceIds: readonly string[]): void {
    if (!this.app) return;

    const sourceTexture = PIXI.Texture.from(sourceImage);

    for (const resourceId of resourceIds) {
      const texture = this.resources.get(resourceId);
      if (!texture || !(texture instanceof PIXI.RenderTexture)) continue;

      // Contain-fit scaling
      const fitScale = Math.min(texture.width / sourceTexture.width, texture.height / sourceTexture.height);

      const sprite = new PIXI.Sprite(sourceTexture);
      sprite.scale.set(fitScale);
      sprite.position.set((texture.width - sourceTexture.width * fitScale) / 2, (texture.height - sourceTexture.height * fitScale) / 2);

      this.app.renderer.render({ container: sprite, target: texture });
    }
  }

  /**
   * Present a resource to the canvas
   */
  present(resourceId: string): void {
    if (!this.app) return;

    const texture = this.resources.get(resourceId);
    if (!texture) return;

    const screenW = this.app.renderer.screen.width;
    const screenH = this.app.renderer.screen.height;
    const scale = Math.min(screenW / texture.width, screenH / texture.height);

    const sprite = new PIXI.Sprite(texture);
    sprite.scale.set(scale);
    sprite.position.set((screenW - texture.width * scale) / 2, (screenH - texture.height * scale) / 2);

    this.app.stage.removeChildren();
    this.app.stage.addChild(sprite);
    this.app.renderer.render(this.app.stage);
  }

  /**
   * Read pixels from a resource
   */
  async readPixels(resourceId: string): Promise<Uint8Array> {
    if (!this.app) {
      throw new Error("PixiRenderer not initialized");
    }

    const texture = this.resources.get(resourceId);
    if (!texture) {
      throw new Error(`Resource "${resourceId}" not found`);
    }

    const pixels = this.app.renderer.extract.pixels(texture);
    return new Uint8Array(pixels.pixels);
  }

  /**
   * Get a resource texture
   */
  getResource(id: string): PIXI.Texture | undefined {
    return this.resources.get(id);
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
  }

  /**
   * Get logical dimensions
   */
  get width(): number {
    return this.app?.renderer.width ?? 0;
  }

  get height(): number {
    return this.app?.renderer.height ?? 0;
  }

  /**
   * Calculate total texture memory
   */
  private calculateTextureMemory(): number {
    let total = 0;
    for (const texture of this.resources.values()) {
      total += texture.width * texture.height * 4; // RGBA8
    }
    return total;
  }

  /**
   * Clear all resources
   */
  clearResources(): void {
    for (const id of [...this.resources.keys()]) {
      this.releaseResource(id);
    }
  }

  /**
   * Get texture pool stats
   */
  getPoolStats() {
    return this.texturePool.getStats();
  }

  /**
   * Dispose the renderer
   */
  dispose(): void {
    if (!this.initialized) return;

    // Clear resources
    for (const texture of this.resources.values()) {
      if (texture instanceof PIXI.RenderTexture) {
        texture.destroy(true);
      }
    }
    this.resources.clear();

    // Clear filters
    for (const filter of this.filters.values()) {
      filter.destroy();
    }
    this.filters.clear();

    // Clear texture pool
    this.texturePool.dispose();

    // Destroy app
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.initialized = false;
    this.canvasElement = undefined;
  }
}
