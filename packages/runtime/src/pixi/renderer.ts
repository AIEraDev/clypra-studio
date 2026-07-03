/**
 * @clypra/runtime — Pixi Renderer
 *
 * Main renderer that executes frame graphs using Pixi.js.
 */

import * as PIXI from "pixi.js";
import type { FrameGraph, RenderPass } from "../planner/types";
import type { RendererConfig, RenderResult, RenderStats } from "./types";
import type { RuntimeTelemetry } from "../telemetry/types";
import { NoOpTelemetry } from "../telemetry/types";
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
  private telemetry: RuntimeTelemetry;

  constructor(telemetry?: RuntimeTelemetry) {
    this.texturePool = new TexturePool(20);
    this.telemetry = telemetry || new NoOpTelemetry();
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

    const renderStart = performance.now();

    // Assertions: Validate frame graph before execution
    console.assert(frameGraph.passes.length > 0, "FrameGraph must have at least one pass");
    console.assert(frameGraph.resourceRequests.length > 0, "FrameGraph must have at least one resource");
    console.assert(
      frameGraph.resourceRequests.some((r) => r.id === "output"),
      'FrameGraph must have an "output" resource',
    );

    // Allocate resources
    for (const resource of frameGraph.resourceRequests) {
      if (!this.resources.has(resource.id)) {
        const allocStart = performance.now();
        this.allocateResource(resource.id, resource.width, resource.height);
        const allocDuration = performance.now() - allocStart;

        this.telemetry.resourceAllocated(resource.id, resource.width, resource.height, resource.transient);
      } else {
        this.telemetry.resourceReused(resource.id);
        this.telemetry.cacheHit(resource.id);
      }
    }

    // Assert: All resources must be allocated
    for (const resource of frameGraph.resourceRequests) {
      console.assert(this.resources.has(resource.id), `Resource "${resource.id}" must be allocated`);
    }

    // Execute passes
    let totalGpuTime = 0;
    for (const pass of frameGraph.passes) {
      // Assert: Output resource must exist
      console.assert(this.resources.has(pass.output), `Output resource "${pass.output}" must exist for pass "${pass.id}"`);

      this.telemetry.passStart(pass.name, pass.shaderId);
      const passStart = performance.now();

      await this.executePass(pass);

      const passTime = performance.now() - passStart;
      totalGpuTime += passTime;
      this.telemetry.passEnd(pass.name, passTime);
    }

    // Release transient resources
    for (const resource of frameGraph.resourceRequests) {
      if (resource.transient) {
        this.releaseResource(resource.id);
        this.telemetry.resourceReleased(resource.id);
      }
    }

    const totalCpuTime = performance.now() - renderStart - totalGpuTime;

    // Get output texture
    const outputTexture = this.resources.get("output");

    // Assert: Output must exist after rendering
    console.assert(outputTexture, "Output texture must exist after rendering");
    if (!outputTexture) {
      this.telemetry.error("renderer", "No output texture available after rendering");
      throw new Error("No output texture available after rendering");
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

    // NEW: Check for custom shader in pass
    if (pass.customShader) {
      // Compile custom GLSL shader
      console.log(`[PixiRenderer] Compiling custom shader for pass: ${pass.id}`);
      filter = this.compileCustomShader(pass.shaderId, pass.customShader, pass.uniforms || {}, target.width, target.height);
      disposeFilter = true; // Always dispose custom shaders
    } else if (this.filters.has(pass.shaderId)) {
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

    // Clean up filter if needed
    if (disposeFilter) {
      filter.destroy();
    }

    // Always destroy sprite to prevent memory leak
    sprite.destroy(false); // false = don't destroy texture
  }

  /**
   * Compile a custom GLSL shader into a PIXI.Filter (Pixi v8 API)
   */
  private compileCustomShader(shaderId: string, shaderCode: string, uniforms: Record<string, any>, width: number, height: number): PIXI.Filter {
    // Parse uniform definitions and create PIXI v8 uniform resources
    const pixiUniformResources: Record<string, any> = {};

    for (const [key, uniform] of Object.entries(uniforms)) {
      if (!uniform) continue;

      // Handle different uniform structures
      const value = uniform.value !== undefined ? uniform.value : uniform;

      if (typeof value === "string" && value.startsWith("@")) {
        // Skip unresolved references
        continue;
      }

      // Determine type string for Pixi v8
      let type: string;
      let finalValue: any;

      if (typeof value === "number") {
        type = "f32";
        finalValue = value;
      } else if (typeof value === "boolean") {
        type = "f32";
        finalValue = value ? 1.0 : 0.0;
      } else if (Array.isArray(value)) {
        if (value.length === 2) type = "vec2<f32>";
        else if (value.length === 3) type = "vec3<f32>";
        else if (value.length === 4) type = "vec4<f32>";
        else type = "f32";
        finalValue = value;
      } else if (typeof value === "object" && value !== null) {
        // Handle typed uniform definitions
        if (value.type === "float") {
          type = "f32";
          finalValue = typeof value.value === "number" ? value.value : 0.0;
        } else if (value.type === "vec2") {
          type = "vec2<f32>";
          finalValue = Array.isArray(value.value) ? value.value : [0, 0];
        } else if (value.type === "vec3") {
          type = "vec3<f32>";
          finalValue = Array.isArray(value.value) ? value.value : [0, 0, 0];
        } else if (value.type === "vec4") {
          type = "vec4<f32>";
          finalValue = Array.isArray(value.value) ? value.value : [0, 0, 0, 0];
        } else {
          continue;
        }
      } else {
        continue;
      }

      pixiUniformResources[key] = { value: finalValue, type };
    }

    // Add default resolution if not provided
    if (!pixiUniformResources.uResolution) {
      pixiUniformResources.uResolution = { value: [width, height], type: "vec2<f32>" };
    }

    // Convert GLSL 100 to GLSL 300 es if needed
    const glsl300Shader = this.convertToGLSL300(shaderCode);

    // Default vertex shader for Pixi v8 (standard fullscreen quad)
    const vertexShader = `
      in vec2 aPosition;
      out vec2 vTextureCoord;

      uniform vec4 uInputSize;
      uniform vec4 uOutputFrame;
      uniform vec4 uOutputTexture;

      vec4 filterVertexPosition(void) {
        vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
        position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
        position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
        return vec4(position, 0.0, 1.0);
      }

      vec2 filterTextureCoord(void) {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
      }

      void main(void) {
        gl_Position = filterVertexPosition();
        vTextureCoord = filterTextureCoord();
      }
    `;

    try {
      // Use Pixi v8 Filter.from() API
      const filter = PIXI.Filter.from({
        gl: {
          vertex: vertexShader,
          fragment: glsl300Shader,
        },
        resources: {
          customUniforms: pixiUniformResources,
        },
      });

      return filter;
    } catch (error) {
      console.error(`[PixiRenderer] Failed to compile shader ${shaderId}:`, error);
      // Fallback to identity filter
      return createFilter("identity", {});
    }
  }

  /**
   * Convert GLSL 100 shader code to GLSL 300 es
   */
  private convertToGLSL300(glslCode: string): string {
    let converted = glslCode;

    // Check if already GLSL 300 es
    if (converted.includes("#version 300 es") || converted.includes("in vec2 vTextureCoord")) {
      return converted;
    }

    // Add version directive if not present
    if (!converted.includes("#version")) {
      converted = "#version 300 es\n" + converted;
    }

    // Replace varying with in for fragment shader
    converted = converted.replace(/varying\s+/g, "in ");

    // Replace gl_FragColor with out variable
    if (converted.includes("gl_FragColor")) {
      // Add out declaration if not present
      if (!converted.includes("out vec4")) {
        const precisionIndex = converted.indexOf("precision");
        if (precisionIndex !== -1) {
          const nextLine = converted.indexOf("\n", precisionIndex) + 1;
          converted = converted.slice(0, nextLine) + "out vec4 fragColor;\n" + converted.slice(nextLine);
        } else {
          converted = converted.replace("#version 300 es\n", "#version 300 es\nout vec4 fragColor;\n");
        }
      }
      converted = converted.replace(/gl_FragColor/g, "fragColor");
    }

    // Replace texture2D with texture
    converted = converted.replace(/texture2D\s*\(/g, "texture(");

    // Replace textureCube with texture
    converted = converted.replace(/textureCube\s*\(/g, "texture(");

    // Replace vUv with vTextureCoord (Pixi v8 standard)
    converted = converted.replace(/\bvUv\b/g, "vTextureCoord");

    return converted;
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

    // Destroy sprite to prevent memory leak
    sprite.destroy(false);
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
      if (!texture || !(texture instanceof PIXI.RenderTexture)) {
        this.telemetry.warning("renderer", `Resource not found or not a RenderTexture: ${resourceId}`);
        continue;
      }

      const uploadStart = performance.now();

      // Check if dimensions match (1:1 mapping)
      const dimensionsMatch = texture.width === sourceTexture.width && texture.height === sourceTexture.height;

      const sprite = new PIXI.Sprite(sourceTexture);

      if (dimensionsMatch) {
        // 1:1 fill - no scaling needed, perfect match
        sprite.width = texture.width;
        sprite.height = texture.height;
      } else {
        // Cover-fit scaling - fill entire texture, may crop
        const fitScale = Math.max(texture.width / sourceTexture.width, texture.height / sourceTexture.height);
        sprite.scale.set(fitScale);
        sprite.position.set((texture.width - sourceTexture.width * fitScale) / 2, (texture.height - sourceTexture.height * fitScale) / 2);
      }

      this.app.renderer.render({ container: sprite, target: texture });

      // Destroy sprite to prevent memory leak
      sprite.destroy(false);

      const uploadDuration = performance.now() - uploadStart;
      this.telemetry.textureUploaded(resourceId, texture.width, texture.height, uploadDuration);
    }
  }

  /**
   * Present a resource to the canvas
   */
  present(resourceId: string): void {
    if (!this.app) return;

    this.telemetry.presentStart();
    const presentStart = performance.now();

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

    const presentDuration = performance.now() - presentStart;
    this.telemetry.presentEnd(presentDuration);

    // Note: Don't destroy sprite here as it's added to stage and will be cleaned up on next present()
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
