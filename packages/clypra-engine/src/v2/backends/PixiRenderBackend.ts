/**
 * @clypra/engine — Pipeline V2: Pixi Render Backend
 *
 * @deprecated Use @clypra/runtime/renderer instead
 * The runtime version (PixiRenderer) is more complete with better resource management.
 * This file will be removed in v3.0.0
 *
 * RenderBackend implementation using Pixi.js for GPU pass execution.
 */

import * as PIXI from "pixi.js";
import { AdjustmentFilter } from "pixi-filters";
import type { RenderBackend, CommandBuffer } from "../runtime/types";
import type { RenderPass } from "../planner/types";
import { createColorAdjustmentsFilter, updateColorAdjustmentsFilter, normalizeColorAdjustmentsUniforms } from "./colorAdjustmentsFilter.js";

export class PixiRenderBackend implements RenderBackend {
  private app: PIXI.Application | null = null;
  private initialized = false;
  private resources = new Map<string, PIXI.Texture>();
  private filters = new Map<string, PIXI.Filter>();
  private canvasElement?: HTMLCanvasElement;

  async init(canvasElement?: HTMLCanvasElement, width?: number, height?: number): Promise<void> {
    if (this.initialized) {
      throw new Error("PixiRenderBackend already initialized");
    }

    this.canvasElement = canvasElement;

    const logicalWidth = width ?? canvasElement?.clientWidth ?? canvasElement?.width ?? 1920;
    const logicalHeight = height ?? canvasElement?.clientHeight ?? canvasElement?.height ?? 1080;

    this.app = new PIXI.Application();
    await this.app.init({
      canvas: canvasElement,
      width: logicalWidth,
      height: logicalHeight,
      backgroundColor: 0x0e0e12,
      antialias: true,
      preference: "webgl",
      resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      autoDensity: true,
      preserveDrawingBuffer: true,
    });

    this.initialized = true;
  }

  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
  }

  get logicalWidth(): number {
    return this.app?.renderer.width ?? 0;
  }

  get logicalHeight(): number {
    return this.app?.renderer.height ?? 0;
  }

  allocateResource(id: string, _type: "texture" | "buffer", width: number, height: number, _format: string): void {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }
    if (this.resources.has(id)) {
      throw new Error(`Resource "${id}" already allocated`);
    }
    this.resources.set(id, PIXI.RenderTexture.create({ width, height }));
  }

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

  compileShader(shaderId: string, _sourceGLSLOrWGSL: string): void {
    if (!this.initialized) {
      throw new Error("PixiRenderBackend not initialized");
    }

    if (this.filters.has(shaderId)) return;

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
        filter = new PIXI.BlurFilter({ strength: 8, quality: 4 });
        break;
      case "copy":
      case "blit-source":
        filter = new AdjustmentFilter({ brightness: 1, contrast: 1, saturation: 1 });
        break;
      case "color-adjustments":
        // Per-pass instances are created in executePass; no shared cached filter.
        return;
      default:
        filter = new AdjustmentFilter({});
    }

    this.filters.set(shaderId, filter);
  }

  async submit(commandBuffer: CommandBuffer): Promise<void> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }

    for (const { pass } of commandBuffer.passes) {
      await this.executePass(pass);
    }
  }

  private async executePass(pass: RenderPass): Promise<void> {
    if (!this.app) return;

    const inputTexture = pass.inputs.length > 0 ? this.resources.get(pass.inputs[0]) : null;
    const outputTexture = this.resources.get(pass.output);
    if (!outputTexture) {
      throw new Error(`Output resource not found: ${pass.output}`);
    }

    if (pass.shaderId === "copy" || pass.shaderId === "blit-source") {
      if (inputTexture) {
        this.blitTexture(inputTexture, outputTexture as PIXI.RenderTexture);
      }
      return;
    }

    if (!inputTexture) return;

    const target = outputTexture as PIXI.RenderTexture;
    const sprite = new PIXI.Sprite(inputTexture);
    sprite.width = target.width;
    sprite.height = target.height;

    let filter: PIXI.Filter;
    let disposeFilter = false;

    if (pass.shaderId === "color-adjustments") {
      filter = createColorAdjustmentsFilter(normalizeColorAdjustmentsUniforms(pass.uniforms));
      disposeFilter = true;
    } else {
      if (!this.filters.has(pass.shaderId)) {
        this.compileShader(pass.shaderId, "");
      }
      filter = this.filters.get(pass.shaderId);
      if (!filter) {
        throw new Error(`Filter not compiled for shader: ${pass.shaderId}`);
      }
      this.applyUniforms(filter, pass.uniforms, pass.shaderId);
    }

    sprite.filters = [filter];
    this.app.renderer.render({ container: sprite, target, clear: true });
    sprite.filters = null;

    if (disposeFilter) {
      filter.destroy();
    }
  }

  private applyUniforms(filter: PIXI.Filter, uniforms: Readonly<Record<string, unknown>>, shaderId?: string): void {
    if (shaderId === "color-adjustments") {
      updateColorAdjustmentsFilter(filter, normalizeColorAdjustmentsUniforms(uniforms));
      return;
    }
    if (filter instanceof AdjustmentFilter) {
      if (uniforms.brightness !== undefined) {
        filter.brightness = 1.0 + Number(uniforms.brightness);
      }
      if (uniforms.contrast !== undefined) {
        filter.contrast = 1.0 + Number(uniforms.contrast);
      }
    } else if (filter instanceof PIXI.BlurFilter && uniforms.uBlurStrength !== undefined) {
      filter.strength = Number(uniforms.uBlurStrength);
    }
  }

  private blitTexture(source: PIXI.Texture, target: PIXI.RenderTexture): void {
    if (!this.app) return;
    const sprite = new PIXI.Sprite(source);
    this.app.renderer.render({ container: sprite, target });
  }

  /** Upload a source image into track/source render textures (contain-fit). */
  uploadSourceImage(sourceImage: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, resourceIds: readonly string[]): void {
    if (!this.app) return;

    const sourceTexture = PIXI.Texture.from(sourceImage);
    for (const resourceId of resourceIds) {
      const texture = this.resources.get(resourceId);
      if (!texture) continue;

      const blitSprite = new PIXI.Sprite(sourceTexture);
      const fitScale = Math.min(texture.width / sourceTexture.width, texture.height / sourceTexture.height);
      blitSprite.scale.set(fitScale);
      blitSprite.position.set((texture.width - sourceTexture.width * fitScale) / 2, (texture.height - sourceTexture.height * fitScale) / 2);
      this.app.renderer.render({ container: blitSprite, target: texture as PIXI.RenderTexture });
    }
  }

  /** Present a resource texture to the canvas screen. */
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

  getResource(id: string): PIXI.Texture | undefined {
    return this.resources.get(id);
  }

  async readPixels(resourceId: string): Promise<Uint8Array> {
    if (!this.initialized || !this.app) {
      throw new Error("PixiRenderBackend not initialized");
    }
    const texture = this.resources.get(resourceId);
    if (!texture) {
      throw new Error(`Resource "${resourceId}" not found for readPixels`);
    }
    const pixels = this.app.renderer.extract.pixels(texture);
    return new Uint8Array(pixels.pixels);
  }

  clearResources(): void {
    for (const id of [...this.resources.keys()]) {
      this.releaseResource(id);
    }
  }

  destroy(): void {
    if (!this.initialized) return;

    for (const texture of this.resources.values()) {
      texture.destroy(true);
    }
    this.resources.clear();

    for (const filter of this.filters.values()) {
      filter.destroy();
    }
    this.filters.clear();

    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.initialized = false;
    this.canvasElement = undefined;
  }
}
