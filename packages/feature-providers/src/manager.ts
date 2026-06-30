/**
 * @clypra/feature-providers — Provider Manager
 *
 * Manages feature provider lifecycle and orchestrates feature map generation.
 */

import type { FeatureProvider, IFeatureProviderManager, FeatureMapType, FeatureMap, VideoFrame } from "./types";

/**
 * Feature Provider Manager Implementation
 */
export class FeatureProviderManager implements IFeatureProviderManager {
  private providers: Map<string, FeatureProvider> = new Map();
  private activeProviders: Set<string> = new Set();

  /**
   * Register a provider
   */
  register(provider: FeatureProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider ${provider.id} is already registered. Replacing.`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Activate a provider (initialize it)
   */
  async activate(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    if (this.activeProviders.has(providerId)) {
      console.warn(`Provider ${providerId} is already active`);
      return;
    }

    await provider.initialize();
    this.activeProviders.add(providerId);
  }

  /**
   * Deactivate a provider
   */
  deactivate(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`Provider ${providerId} not found`);
      return;
    }

    if (!this.activeProviders.has(providerId)) {
      console.warn(`Provider ${providerId} is not active`);
      return;
    }

    provider.dispose();
    this.activeProviders.delete(providerId);
  }

  /**
   * Process frame with all active providers
   */
  async process(frame: VideoFrame): Promise<Map<FeatureMapType, FeatureMap>> {
    const results = new Map<FeatureMapType, FeatureMap>();

    for (const providerId of this.activeProviders) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        const maps = await provider.process(frame);

        // Store feature maps by type
        for (const map of maps) {
          // If multiple providers produce the same type, last one wins
          // In the future, we could have a priority system or merging strategy
          results.set(map.type, map);
        }
      } catch (error) {
        console.error(`Error processing with provider ${providerId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get providers that can produce a specific feature type
   */
  getProvidersForFeature(featureType: FeatureMapType): FeatureProvider[] {
    const providers: FeatureProvider[] = [];

    for (const provider of this.providers.values()) {
      if (provider.outputs.includes(featureType)) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): FeatureProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get active providers
   */
  getActiveProviders(): FeatureProvider[] {
    return Array.from(this.activeProviders)
      .map((id) => this.providers.get(id))
      .filter((p): p is FeatureProvider => p !== undefined);
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): FeatureProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Check if a provider is active
   */
  isActive(providerId: string): boolean {
    return this.activeProviders.has(providerId);
  }

  /**
   * Dispose all providers
   */
  dispose(): void {
    for (const providerId of this.activeProviders) {
      const provider = this.providers.get(providerId);
      if (provider) {
        provider.dispose();
      }
    }
    this.activeProviders.clear();
    this.providers.clear();
  }
}
