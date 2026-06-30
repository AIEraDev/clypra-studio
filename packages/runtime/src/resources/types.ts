/**
 * @clypra/runtime — Resource Types
 */

export interface ResourceDescriptor {
  id: string;
  type: "texture" | "buffer";
  width: number;
  height: number;
  format: "rgba8" | "rgba16f" | "rgba32f" | "r8" | "depth24";
  transient: boolean;
}

export interface ResourceStats {
  allocated: number;
  available: number;
  totalMemory: number;
  cacheHits: number;
  cacheMisses: number;
  evictions: number;
}

export interface ResourceHandle<T = any> {
  id: string;
  resource: T;
  descriptor: ResourceDescriptor;
  refCount: number;
  lastUsed: number;
}
