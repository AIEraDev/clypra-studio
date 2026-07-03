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
  id: number; // Unique identifier for this pooled texture
}

/**
 * Texture pool with LRU eviction
 */
export class TexturePool {
  private pool: Map<string, PooledTexture[]> = new Map(); // Changed to array per key
  private maxSize: number;
  private hits = 0;
  private misses = 0;
  private nextId = 0;

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Acquire a texture from the pool or create a new one
   */
  acquire(descriptor: PixiResourceDescriptor): PIXI.RenderTexture {
    const key = this.descriptorKey(descriptor);
    const pooledArray = this.pool.get(key);

    if (pooledArray && pooledArray.length > 0) {
      // Hit: Reuse existing texture from the pool
      const pooled = pooledArray.pop()!;
      if (pooledArray.length === 0) {
        this.pool.delete(key);
      }
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
    const totalPooled = this.getTotalPooledCount();
    if (totalPooled >= this.maxSize) {
      this.evictLRU();
    }

    // Get or create array for this key
    let pooledArray = this.pool.get(key);
    if (!pooledArray) {
      pooledArray = [];
      this.pool.set(key, pooledArray);
    }

    pooledArray.push({
      texture,
      descriptor,
      lastUsed: Date.now(),
      id: this.nextId++,
    });
  }

  /**
   * Get total count of pooled textures
   */
  private getTotalPooledCount(): number {
    let count = 0;
    for (const array of this.pool.values()) {
      count += array.length;
    }
    return count;
  }

  /**
   * Evict least recently used texture
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestIndex = -1;
    let oldestTime = Infinity;

    for (const [key, pooledArray] of this.pool.entries()) {
      for (let i = 0; i < pooledArray.length; i++) {
        const pooled = pooledArray[i];
        if (pooled.lastUsed < oldestTime) {
          oldestTime = pooled.lastUsed;
          oldestKey = key;
          oldestIndex = i;
        }
      }
    }

    if (oldestKey && oldestIndex >= 0) {
      const pooledArray = this.pool.get(oldestKey);
      if (pooledArray) {
        const pooled = pooledArray[oldestIndex];
        pooled.texture.destroy(true);
        pooledArray.splice(oldestIndex, 1);
        if (pooledArray.length === 0) {
          this.pool.delete(oldestKey);
        }
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
    let totalCount = 0;

    for (const pooledArray of this.pool.values()) {
      for (const pooled of pooledArray) {
        const bytesPerPixel = this.getBytesPerPixel(pooled.descriptor.format);
        totalMemory += pooled.descriptor.width * pooled.descriptor.height * bytesPerPixel;
        totalCount++;
      }
    }

    return {
      allocated: totalCount,
      available: this.maxSize - totalCount,
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
    for (const pooledArray of this.pool.values()) {
      for (const pooled of pooledArray) {
        pooled.texture.destroy(true);
      }
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
