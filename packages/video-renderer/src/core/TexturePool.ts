/**
 * @clypra/video-renderer — TexturePool
 *
 * Manages a pool of reusable RenderTextures
 * Reduces GPU memory allocations
 */

import * as PIXI from "pixi.js";

export interface TextureSpec {
  width: number;
  height: number;
  format?: string;
}

export class TexturePool {
  private pool: PIXI.RenderTexture[] = [];
  private maxSize: number;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Acquire a texture from the pool or create a new one
   */
  acquire(spec: TextureSpec): PIXI.RenderTexture {
    // Try to find a matching texture in the pool
    const index = this.pool.findIndex((tex) => tex.width === spec.width && tex.height === spec.height);

    if (index !== -1) {
      const texture = this.pool[index];
      this.pool.splice(index, 1);
      return texture;
    }

    // Create new texture
    return PIXI.RenderTexture.create({
      width: spec.width,
      height: spec.height,
    });
  }

  /**
   * Release a texture back to the pool
   */
  release(texture: PIXI.RenderTexture, spec: TextureSpec): void {
    if (this.pool.length >= this.maxSize) {
      // Pool is full, destroy the texture
      texture.destroy(true);
      return;
    }

    // Check if texture matches the spec
    if (texture.width === spec.width && texture.height === spec.height) {
      this.pool.push(texture);
    } else {
      texture.destroy(true);
    }
  }

  /**
   * Clear all textures in the pool
   */
  clear(): void {
    for (const texture of this.pool) {
      texture.destroy(true);
    }
    this.pool = [];
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.pool.length,
      maxSize: this.maxSize,
      memoryUsage: this.pool.reduce((sum, tex) => sum + tex.width * tex.height * 4, 0),
    };
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.clear();
  }
}
