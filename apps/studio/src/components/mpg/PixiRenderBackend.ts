/**
 * Pixi Render Backend
 *
 * Implements RenderBackend interface using Pixi.js for rendering.
 * This is Phase 3 of the MPG Playground implementation.
 *
 * Architecture:
 * FrameGraph → Pass Planner → Pixi Filters → Framebuffer → Canvas
 *
 * Pixi doesn't know anything about graphs.
 * It simply executes passes.
 */

import type { RenderBackend, CommandBuffer } from "@clypra/engine";
import type { FrameGraph } from "@clypra/engine";
import * as PIXI from "pixi.js";
import { AdjustmentFilter } from "pixi-filters";

export class PixiRenderBackend implements RenderBackend {
  private app: PIXI.Application | null = null;
  private initialized = false;
  private resources = new Map<string, PIXI.Texture>();
  private filters = new Map<string, PIXI.Filter>();
  private canvasElement?: HTMLCanvasElement;

  /**
   * Initialize the Pixi application and attach to canvas
   */
  async init(canvasElement?: HTMLCanvasElement): Promise<void> {
    if (this.initialized) {
      throw new Error("PixiRenderBackend already initialized");
    }

    this.canvasElement = canvasElement;

    // Create Pixi application
    this.app = new PIXI.Application();

    await this.app.init({
      canvas: canvasElement,
      width: canvasElement?.width || 1920,
      height: canvasElement?.height || 1080,
      backgroundColor: 0x0e0e12,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.initialized = true;
  }

  /**
   * Allocate a texture resource
   */
  allocateResource(id: string, type: "texture" | "buffer", width: number, height: number, format: string): void {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }

    if (this.resources.has(id)) {
      throw new Error(`Resource "${id}" already allocated`);
    }

    // Create a render texture
    const texture = PIXI.RenderTexture.create({
      width,
      height,
    });

    this.resources.set(id, texture);
  }

  /**
   * Release a texture resource
   */
  releaseResource(id: string): void {
    if (!this.initialized) {
      throw new Error("PixiRenderBackend not initialized");
    }

    const texture = this.resources.get(id);
    if (!texture) {
      throw new Error(`Resource "${id}" not found for release`);
    }

    texture.destroy(true);
    this.resources.delete(id);
  }

  /**
   * Compile a shader/filter
   * In Pixi, we map shader IDs to filter instances
   */
  compileShader(shaderId: string, sourceGLSLOrWGSL: string): void {
    if (!this.initialized) {
      throw new Error("PixiRenderBackend not initialized");
    }

    // Map shader IDs to Pixi filters
    let filter: PIXI.Filter;

    switch (shaderId) {
      case "brightness":
        filter = new AdjustmentFilter({ brightness: 1.0 });
        break;
      case "contrast":
        filter = new AdjustmentFilter({ contrast: 1.0 });
        break;
      case "gaussian-blur-h":
      case "gaussian-blur-v":
        filter = new PIXI.BlurFilter({
          strength: 8,
          quality: 4,
        });
        break;
      case "copy":
      case "blit-source":
        // No-op filter, just passes through
        filter = new PIXI.Filter({
          glProgram: PIXI.GlProgram.from({
            vertex: `
              attribute vec2 aPosition;
              void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
              }
            `,
            fragment: `
              void main() {
                gl_FragColor = texture2D(uTexture, vTextureCoord);
              }
            `,
          }),
        });
        break;
      default:
        console.warn(`Unknown shader ID: ${shaderId}, using no-op filter`);
        filter = new PIXI.Filter({
          glProgram: PIXI.GlProgram.from({
            vertex: `
              attribute vec2 aPosition;
              void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
              }
            `,
            fragment: `
              void main() {
                gl_FragColor = texture2D(uTexture, vTextureCoord);
              }
            `,
          }),
        });
    }

    this.filters.set(shaderId, filter);
  }

  /**
   * Submit a command buffer for execution
   */
  async submit(commandBuffer: CommandBuffer): Promise<void> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }

    // Execute each pass sequentially
    for (const passEntry of commandBuffer.passes) {
      const { pass } = passEntry;

      // Get the filter for this pass
      const filter = this.filters.get(pass.shaderId);
      if (!filter) {
        throw new Error(`Filter not compiled for shader: ${pass.shaderId}`);
      }

      // Update filter uniforms
      if (filter instanceof AdjustmentFilter) {
        if (pass.uniforms.brightness !== undefined) {
          filter.brightness = 1.0 + pass.uniforms.brightness;
        }
        if (pass.uniforms.contrast !== undefined) {
          filter.contrast = 1.0 + pass.uniforms.contrast;
        }
      } else if (filter instanceof PIXI.BlurFilter) {
        if (pass.uniforms.uBlurStrength !== undefined) {
          filter.strength = pass.uniforms.uBlurStrength;
        }
      }

      // Get input and output textures
      const inputTexture = pass.inputs.length > 0 ? this.resources.get(pass.inputs[0]) : null;
      const outputTexture = this.resources.get(pass.output);

      if (!outputTexture) {
        throw new Error(`Output resource not found: ${pass.output}`);
      }

      // Apply filter to input and render to output
      if (inputTexture) {
        const sprite = new PIXI.Sprite(inputTexture);
        sprite.filters = [filter];

        this.app.renderer.render({
          container: sprite,
          target: outputTexture,
        });
      }
    }
  }

  /**
   * Read pixels from a resource
   */
  async readPixels(resourceId: string): Promise<Uint8Array> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }

    const texture = this.resources.get(resourceId);
    if (!texture) {
      throw new Error(`Resource "${resourceId}" not found for readPixels`);
    }

    // Extract pixels from texture
    const pixels = this.app.renderer.extract.pixels(texture);
    return new Uint8Array(pixels.pixels);
  }

  /**
   * Destroy the backend and release all resources
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }

    // Destroy all textures
    for (const texture of this.resources.values()) {
      texture.destroy(true);
    }
    this.resources.clear();

    // Destroy all filters
    for (const filter of this.filters.values()) {
      filter.destroy();
    }
    this.filters.clear();

    // Destroy Pixi app
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.initialized = false;
    this.canvasElement = undefined;
  }

  /**
   * High-level method to render a complete FrameGraph with a source image
   */
  async renderFrame(frameGraph: FrameGraph, sourceImage: HTMLImageElement): Promise<void> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }

    // Clear existing resources
    for (const id of this.resources.keys()) {
      this.releaseResource(id);
    }

    // Allocate all required resources
    for (const req of frameGraph.resourceRequests) {
      this.allocateResource(req.id, req.type, req.width, req.height, req.format);
    }

    // Compile all shaders
    const uniqueShaders = new Set(frameGraph.passes.map((p) => p.shaderId));
    for (const shaderId of uniqueShaders) {
      if (!this.filters.has(shaderId)) {
        this.compileShader(shaderId, `// Mock shader code for ${shaderId}`);
      }
    }

    // Load source image into the source texture
    const sourceTexture = PIXI.Texture.from(sourceImage);
    const sourceSprite = new PIXI.Sprite(sourceTexture);

    // Find the track source resource
    const trackSourceRes = frameGraph.resourceRequests.find((r) => r.id.includes("track-source"));
    if (trackSourceRes) {
      const trackTexture = this.resources.get(trackSourceRes.id);
      if (trackTexture) {
        this.app.renderer.render({
          container: sourceSprite,
          target: trackTexture,
        });
      }
    }

    // Execute each pass in sequence
    for (const pass of frameGraph.passes) {
      const filter = this.filters.get(pass.shaderId);
      if (!filter) continue;

      // Update filter parameters
      if (filter instanceof AdjustmentFilter) {
        if (pass.uniforms.brightness !== undefined) {
          filter.brightness = 1.0 + pass.uniforms.brightness;
        }
        if (pass.uniforms.contrast !== undefined) {
          filter.contrast = 1.0 + pass.uniforms.contrast;
        }
      } else if (filter instanceof PIXI.BlurFilter) {
        if (pass.uniforms.uBlurStrength !== undefined) {
          filter.strength = pass.uniforms.uBlurStrength;
        }
      }

      // Get input texture
      const inputId = pass.inputs[0];
      const inputTexture = inputId ? this.resources.get(inputId) : null;

      // Get output texture
      const outputTexture = this.resources.get(pass.output);

      if (inputTexture && outputTexture) {
        const sprite = new PIXI.Sprite(inputTexture);
        sprite.filters = [filter];

        this.app.renderer.render({
          container: sprite,
          target: outputTexture,
        });
      }
    }

    // Render final output to screen
    const finalTexture = this.resources.get("res-final-frame");
    if (finalTexture) {
      const finalSprite = new PIXI.Sprite(finalTexture);

      // Scale to fit canvas
      const canvas = this.canvasElement;
      if (canvas) {
        const scaleX = canvas.width / finalTexture.width;
        const scaleY = canvas.height / finalTexture.height;
        const scale = Math.min(scaleX, scaleY);

        finalSprite.scale.set(scale);
        finalSprite.position.set((canvas.width - finalTexture.width * scale) / 2, (canvas.height - finalTexture.height * scale) / 2);
      }

      // Clear and render to main canvas
      this.app.renderer.clear();
      this.app.renderer.render({
        container: finalSprite,
      });
    }
  }
}
