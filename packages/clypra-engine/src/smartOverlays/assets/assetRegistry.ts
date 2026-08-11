import type { AssetRef } from "../overlayDocumentSchema.js";

// ---------------------------------------------------------------------------
// Resource State
// ---------------------------------------------------------------------------

export type ResourceState = "pending" | "loading" | "ready" | "missing" | "error";

// ---------------------------------------------------------------------------
// Registered Asset Entry
// ---------------------------------------------------------------------------

export interface RegisteredAsset {
  ref: AssetRef;
  state: ResourceState;
  /** Number of document nodes currently referencing this asset */
  refCount: number;
  /** Final resolved URL — blob URL for local, original URI for remote */
  resolvedUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// AssetRegistry
// ---------------------------------------------------------------------------

/**
 * Central in-memory asset registry.
 *
 * Invariants:
 *   - Same assetId always returns the same RegisteredAsset object (identity-stable)
 *   - refCount tracks how many nodes reference the asset
 *   - Releasing the last reference transitions state to "missing" (no delete — allows re-registration)
 *   - Binary data is NEVER stored inside a registry entry
 */
export class AssetRegistry {
  private entries = new Map<string, RegisteredAsset>();

  /**
   * Register an asset reference. If already registered, increments refCount
   * and updates the ref metadata (source, uri, metadata may change).
   */
  public register(ref: AssetRef): RegisteredAsset {
    const existing = this.entries.get(ref.assetId);
    if (existing) {
      existing.ref = { ...existing.ref, ...ref };
      existing.refCount += 1;
      if (existing.state === "missing") {
        existing.state = "pending";
      }
      return existing;
    }

    const entry: RegisteredAsset = {
      ref,
      state: "pending",
      refCount: 1,
    };
    this.entries.set(ref.assetId, entry);
    return entry;
  }

  /**
   * Mark an asset as loaded and ready, storing its resolved URL.
   * Binary data must NOT be passed here — only a URL.
   */
  public markReady(assetId: string, resolvedUrl: string): void {
    const entry = this.entries.get(assetId);
    if (!entry) return;
    entry.state = "ready";
    entry.resolvedUrl = resolvedUrl;
    entry.error = undefined;
  }

  /**
   * Mark an asset as currently loading (e.g. fetch in flight).
   */
  public markLoading(assetId: string): void {
    const entry = this.entries.get(assetId);
    if (!entry) return;
    entry.state = "loading";
  }

  /**
   * Mark an asset as errored with a diagnostic message.
   */
  public markError(assetId: string, error: string): void {
    const entry = this.entries.get(assetId);
    if (!entry) return;
    entry.state = "error";
    entry.error = error;
    entry.resolvedUrl = undefined;
  }

  /**
   * Decrement refCount. If count reaches 0, transitions to "missing".
   * Does NOT delete the entry — allows re-registration without losing state identity.
   */
  public release(assetId: string): void {
    const entry = this.entries.get(assetId);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);
    if (entry.refCount === 0) {
      entry.state = "missing";
      entry.resolvedUrl = undefined;
    }
  }

  /**
   * Returns the RegisteredAsset entry, or undefined if not known.
   */
  public get(assetId: string): RegisteredAsset | undefined {
    return this.entries.get(assetId);
  }

  /**
   * Returns the current ResourceState for an assetId.
   * Returns "missing" if the asset has never been registered.
   */
  public getState(assetId: string): ResourceState {
    return this.entries.get(assetId)?.state ?? "missing";
  }

  /**
   * Returns all currently registered AssetRef entries.
   */
  public list(): AssetRef[] {
    return Array.from(this.entries.values()).map((e) => e.ref);
  }

  /**
   * Clears the entire registry. Use only for testing or full session reset.
   */
  public clear(): void {
    this.entries.clear();
  }

  /**
   * Returns the total number of registered assets (including missing/error states).
   */
  public size(): number {
    return this.entries.size;
  }
}

/** Singleton asset registry for the current studio session */
export const assetRegistry = new AssetRegistry();
