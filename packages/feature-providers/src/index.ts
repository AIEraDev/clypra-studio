/**
 * @clypra/feature-providers
 *
 * Extensible feature providers for Body Effect Lab.
 *
 * Feature providers produce feature maps (masks, poses, depth, etc.)
 * that body effects consume. This architecture makes body effects
 * future-proof and infinitely extensible.
 */

// Core types
export * from "./types";

// Manager
export { FeatureProviderManager } from "./manager";

// Built-in providers
export { ChromaKeyProvider } from "./chroma-key";
export { SegmentationProvider } from "./segmentation";

/**
 * Create default provider manager with built-in providers
 */
import { FeatureProviderManager } from "./manager";
import { ChromaKeyProvider } from "./chroma-key";
import { SegmentationProvider } from "./segmentation";

export function createDefaultProviderManager(): FeatureProviderManager {
  const manager = new FeatureProviderManager();

  // Register built-in providers
  manager.register(new ChromaKeyProvider());
  manager.register(new SegmentationProvider());

  return manager;
}
