/**
 * @clypra/runtime — Pixi Backend Types
 */

import type { FrameGraph } from "../planner/types";
import type * as PIXI from "pixi.js";

/**
 * Render backend configuration
 */
export interface RendererConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  preserveDrawingBuffer?: boolean;
}

/**
 * Render result
 */
export interface RenderResult {
  outputTexture: PIXI.Texture;
  stats: RenderStats;
}

/**
 * Rendering statistics
 */
export interface RenderStats {
  passCount: number;
  totalGpuTime: number;
  totalCpuTime: number;
  resourceCount: number;
  textureMemory: number;
}

/**
 * Texture pool statistics
 */
export interface TexturePoolStats {
  allocated: number;
  available: number;
  totalMemory: number;
  hits: number;
  misses: number;
}

/**
 * Pixi-specific resource descriptor (simpler than full ResourceDescriptor)
 */
export interface PixiResourceDescriptor {
  width: number;
  height: number;
  format: "rgba8" | "rgba16f" | "rgba32f" | "r8" | "depth24";
}
