import type { FontRef } from "../overlayDocumentSchema.js";
import type { ResourceState } from "./assetRegistry.js";

// ---------------------------------------------------------------------------
// Registered Font Entry
// ---------------------------------------------------------------------------

export interface RegisteredFont {
  ref: FontRef;
  state: ResourceState;
  /** CSS font-family value to use in fallback scenarios */
  fallbackFamily: string;
}

// ---------------------------------------------------------------------------
// FontRegistry
// ---------------------------------------------------------------------------

/**
 * Central font registry.
 *
 * Invariants:
 *   - A font reference can never crash resolution — getFallback() always returns a valid value
 *   - Weight/style variants are registered and resolved independently
 *   - Font state changes do NOT mutate the OverlayDocument
 *   - Missing font always falls back to "system-ui" or a registered substitute
 */
export class FontRegistry {
  private entries = new Map<string, RegisteredFont>();

  /** Compute a stable key for a font variant */
  private key(family: string, weight: number, style: "normal" | "italic"): string {
    return `${family.toLowerCase()}:${weight}:${style}`;
  }

  /**
   * Register a font reference. If the same variant is already registered,
   * updates state and metadata.
   */
  public register(ref: FontRef): RegisteredFont {
    const k = this.key(ref.family, ref.weight, ref.style);
    const existing = this.entries.get(k);
    if (existing) {
      existing.ref = { ...existing.ref, ...ref };
      return existing;
    }

    const entry: RegisteredFont = {
      ref,
      state: "pending",
      fallbackFamily: this.computeFallback(ref),
    };
    this.entries.set(k, entry);
    return entry;
  }

  /**
   * Mark a font variant as loaded and ready (CSS @font-face registered with browser).
   */
  public markReady(family: string, weight: number, style: "normal" | "italic"): void {
    const entry = this.entries.get(this.key(family, weight, style));
    if (entry) entry.state = "ready";
  }

  /**
   * Mark a font variant as errored.
   */
  public markError(family: string, weight: number, style: "normal" | "italic"): void {
    const entry = this.entries.get(this.key(family, weight, style));
    if (entry) entry.state = "error";
  }

  /**
   * Returns the current ResourceState for a font variant.
   * Returns "missing" if the font has never been registered.
   */
  public getState(family: string, weight: number, style: "normal" | "italic"): ResourceState {
    return this.entries.get(this.key(family, weight, style))?.state ?? "missing";
  }

  /**
   * Returns the CSS font-family to apply for a given font request.
   * If the font is ready, returns the requested family.
   * If missing/error, returns the safe fallback — NEVER throws.
   */
  public getFallback(family: string, weight = 400, style: "normal" | "italic" = "normal"): string {
    const entry = this.entries.get(this.key(family, weight, style));
    if (!entry || entry.state === "missing" || entry.state === "error") {
      return "system-ui, -apple-system, sans-serif";
    }
    if (entry.state === "ready") return family;
    // pending / loading — return fallback to avoid FOUT blocking render
    return entry.fallbackFamily;
  }

  /**
   * Returns all registered FontRef entries.
   */
  public list(): FontRef[] {
    return Array.from(this.entries.values()).map((e) => e.ref);
  }

  /**
   * Clears all font registrations. Use only for testing or session reset.
   */
  public clear(): void {
    this.entries.clear();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private computeFallback(ref: FontRef): string {
    // For system fonts — can use directly even before "ready"
    if (ref.source === "system") return ref.family;
    // For web fonts — generic sans-serif stack while loading
    return "system-ui, -apple-system, sans-serif";
  }
}

/** Singleton font registry for the current studio session */
export const fontRegistry = new FontRegistry();
