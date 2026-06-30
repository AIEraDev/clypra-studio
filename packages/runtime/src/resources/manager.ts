/**
 * @clypra/runtime — Resource Manager
 *
 * Manages allocation and deallocation of GPU resources.
 */

import type { ResourceDescriptor, ResourceStats, ResourceHandle } from "./types";
import { LRUCache } from "./cache";

/**
 * Resource Manager
 *
 * Manages GPU resource lifecycle with LRU caching.
 */
export class ResourceManager<T = any> {
  private resources = new Map<string, ResourceHandle<T>>();
  private cache: LRUCache<T>;
  private allocator: (descriptor: ResourceDescriptor) => T;
  private deallocator: (resource: T) => void;

  constructor(allocator: (descriptor: ResourceDescriptor) => T, deallocator: (resource: T) => void, cacheSize: number = 20) {
    this.allocator = allocator;
    this.deallocator = deallocator;
    this.cache = new LRUCache<T>(cacheSize);
  }

  /**
   * Allocate a resource
   */
  allocate(descriptor: ResourceDescriptor): T {
    // Check if already allocated
    if (this.resources.has(descriptor.id)) {
      const handle = this.resources.get(descriptor.id)!;
      handle.refCount++;
      handle.lastUsed = Date.now();
      return handle.resource;
    }

    // Try to get from cache
    const cacheKey = this.descriptorKey(descriptor);
    let resource = this.cache.get(cacheKey);

    if (!resource) {
      // Allocate new resource
      resource = this.allocator(descriptor);
    }

    // Create handle
    const handle: ResourceHandle<T> = {
      id: descriptor.id,
      resource,
      descriptor,
      refCount: 1,
      lastUsed: Date.now(),
    };

    this.resources.set(descriptor.id, handle);
    return resource;
  }

  /**
   * Release a resource
   */
  release(id: string): void {
    const handle = this.resources.get(id);
    if (!handle) return;

    handle.refCount--;

    if (handle.refCount <= 0) {
      // Remove from active resources
      this.resources.delete(id);

      // Add to cache if transient
      if (handle.descriptor.transient) {
        const cacheKey = this.descriptorKey(handle.descriptor);
        const size = this.calculateSize(handle.descriptor);
        this.cache.put(cacheKey, handle.resource, size);
      } else {
        // Deallocate non-transient resources
        this.deallocator(handle.resource);
      }
    }
  }

  /**
   * Get a resource
   */
  get(id: string): T | undefined {
    const handle = this.resources.get(id);
    if (handle) {
      handle.lastUsed = Date.now();
      return handle.resource;
    }
    return undefined;
  }

  /**
   * Check if resource exists
   */
  has(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * Generate cache key from descriptor
   */
  private descriptorKey(descriptor: ResourceDescriptor): string {
    return `${descriptor.type}:${descriptor.width}x${descriptor.height}:${descriptor.format}`;
  }

  /**
   * Calculate resource size (for cache management)
   */
  private calculateSize(descriptor: ResourceDescriptor): number {
    const bytesPerPixel = this.getBytesPerPixel(descriptor.format);
    return descriptor.width * descriptor.height * bytesPerPixel;
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
   * Get resource statistics
   */
  getStats(): ResourceStats {
    const cacheStats = this.cache.getStats();
    let totalMemory = 0;

    for (const handle of this.resources.values()) {
      totalMemory += this.calculateSize(handle.descriptor);
    }

    return {
      allocated: this.resources.size,
      available: cacheStats.capacity - cacheStats.size,
      totalMemory,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      evictions: cacheStats.evictions,
    };
  }

  /**
   * Clear all resources
   */
  clear(): void {
    // Deallocate all active resources
    for (const handle of this.resources.values()) {
      this.deallocator(handle.resource);
    }
    this.resources.clear();

    // Deallocate cached resources
    for (const resource of this.cache.values()) {
      this.deallocator(resource);
    }
    this.cache.clear();
  }

  /**
   * Dispose the manager
   */
  dispose(): void {
    this.clear();
  }
}
