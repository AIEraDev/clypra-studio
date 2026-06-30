/**
 * @clypra/runtime — LRU Cache
 *
 * Generic LRU cache for resource management.
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  lastUsed: number;
}

export interface CacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * Least Recently Used (LRU) Cache
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private capacity: number;
  private currentSize = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (entry) {
      // Update last used time
      entry.lastUsed = Date.now();
      this.hits++;
      return entry.value;
    }

    this.misses++;
    return undefined;
  }

  /**
   * Put a value into the cache
   */
  put(key: string, value: T, size: number = 1): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries if necessary
    while (this.currentSize + size > this.capacity && this.cache.size > 0) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, {
      key,
      value,
      size,
      lastUsed: Date.now(),
    });

    this.currentSize += size;
  }

  /**
   * Remove a value from the cache
   */
  remove(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    this.cache.delete(key);
    this.currentSize -= entry.size;
    return entry.value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.currentSize -= entry.size;
      this.evictions++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      size: this.currentSize,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values(): T[] {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}
