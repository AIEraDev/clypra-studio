/**
 * @clypra/runtime — Texture Pool
 *
 * LRU texture pooling for efficient resource management.
 */

import * as PIXI from "pixi.js";
import type { PixiResourceDescriptor, TexturePoolStats } from "./types";

interface PooledTexture {
  texture: PIXI.RenderTexture;
  descriptor: PixiResourceDescriptor;
  lastUsed: number;
}

/**
 * Texture pool with LRU eviction
 */
export class TexturePool {
  private pool: Map<string, PooledTexture> = new Map();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Acquire a texture from the pool or create a new one
   */
  acquire(descriptor: PixiResourceDescriptor): PIXI.RenderTexture {
    const key = this.descriptorKey(descriptor);
    const pooled = this.pool.get(key);

    if (pooled) {
      // Hit: Reuse existing texture
      this.pool.delete(key);
      this.hits++;
      return pooled.texture;
    }

    // Miss: Create new texture
    this.misses++;
    const texture = PIXI.RenderTexture.create({
      width: descriptor.width,
      height: descriptor.height,
    });

    return texture;
  }

  /**
   * Release a texture back to the pool
   */
  release(texture: PIXI.RenderTexture, descriptor: PixiResourceDescriptor): void {
    const key = this.descriptorKey(descriptor);

    // Check if pool is full
    if (this.pool.size >= this.maxSize) {
      this.evictLRU();
    }

    this.pool.set(key, {
      texture,
      descriptor,
      lastUsed: Date.now(),
    });
  }

  /**
   * Evict least recently used texture
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, pooled] of this.pool.entries()) {
      if (pooled.lastUsed < oldestTime) {
        oldestTime = pooled.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const pooled = this.pool.get(oldestKey);
      if (pooled) {
        pooled.texture.destroy(true);
        this.pool.delete(oldestKey);
      }
    }
  }

  /**
   * Generate key for descriptor
   */
  private descriptorKey(descriptor: PixiResourceDescriptor): string {
    return `${descriptor.width}x${descriptor.height}:${descriptor.format}`;
  }

  /**
   * Get pool statistics
   */
  getStats(): TexturePoolStats {
    let totalMemory = 0;

    for (const pooled of this.pool.values()) {
      const bytesPerPixel = this.getBytesPerPixel(pooled.descriptor.format);
      totalMemory += pooled.descriptor.width * pooled.descriptor.height * bytesPerPixel;
    }

    return {
      allocated: this.pool.size,
      available: this.maxSize - this.pool.size,
      totalMemory,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Get bytes per pixel for format
   */
  private getBytesPerPixel(format: string): number {
    switch (format) {
      case "rgba8":
        return 4;
      case "rgba16f":
        return 8;
      case "rgba32f":
        return 16;
      case "r8":
        return 1;
      case "depth24":
        return 3;
      default:
        return 4;
    }
  }

  /**
   * Clear the pool
   */
  clear(): void {
    for (const pooled of this.pool.values()) {
      pooled.texture.destroy(true);
    }
    this.pool.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Dispose the pool
   */
  dispose(): void {
    this.clear();
  }
}
