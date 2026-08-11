import type { AssetRef, FontRef, OverlayDocument } from "../overlayDocumentSchema.js";
import { assetRegistry, type ResourceState } from "./assetRegistry.js";
import { fontRegistry } from "./fontRegistry.js";

// ---------------------------------------------------------------------------
// Resolved types
// ---------------------------------------------------------------------------

export interface ResolvedAsset {
  assetId: string;
  state: ResourceState;
  /** Ready-to-use URL — blob URL for local, original URI for remote */
  url?: string;
  /** Always-available placeholder — checkerboard data URI */
  fallbackUrl: string;
}

export interface ResolvedFont {
  family: string;
  /** Actual CSS font-family to apply — may be fallback */
  resolvedFamily: string;
  state: ResourceState;
}

// ---------------------------------------------------------------------------
// Checkerboard placeholder data URI (8×8, grey/white)
// ---------------------------------------------------------------------------

const CHECKERBOARD_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGklEQVR4nGP4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

// ---------------------------------------------------------------------------
// RuntimeAssetResolver
// ---------------------------------------------------------------------------

/**
 * Async-capable asset and font resolver that sits between the document
 * and the projection/export layer.
 *
 * Key contract:
 *   - resolve() is ALWAYS synchronous — never blocks, never throws
 *   - Missing assets return a deterministic placeholder — never crash the renderer
 *   - warmDocument() pre-fetches all assets declared in doc.assetManifest
 *   - The projection layer calls resolve() exclusively; it never fetches directly
 */
export class RuntimeAssetResolver {
  // ---------------------------------------------------------------------------
  // Synchronous resolution (hot path for projection)
  // ---------------------------------------------------------------------------

  /**
   * Synchronously resolves an asset.
   * Returns current cached state immediately — never blocks.
   * Safe to call 1000× per frame.
   */
  public resolve(assetId: string): ResolvedAsset {
    const entry = assetRegistry.get(assetId);

    if (!entry || entry.state === "missing" || entry.state === "error") {
      return {
        assetId,
        state: entry?.state ?? "missing",
        fallbackUrl: CHECKERBOARD_PLACEHOLDER,
      };
    }

    if (entry.state === "ready" && entry.resolvedUrl) {
      return {
        assetId,
        state: "ready",
        url: entry.resolvedUrl,
        fallbackUrl: CHECKERBOARD_PLACEHOLDER,
      };
    }

    // pending / loading — return placeholder without url
    return {
      assetId,
      state: entry.state,
      fallbackUrl: CHECKERBOARD_PLACEHOLDER,
    };
  }

  /**
   * Synchronously resolves a font variant.
   * Returns a CSS-ready `resolvedFamily` — never throws, never blocks.
   */
  public resolveFont(family: string, weight = 400, style: "normal" | "italic" = "normal"): ResolvedFont {
    const state = fontRegistry.getState(family, weight, style);
    const resolvedFamily = fontRegistry.getFallback(family, weight, style);
    return { family, resolvedFamily, state };
  }

  // ---------------------------------------------------------------------------
  // Asynchronous resolution (for pre-warming and loading flows)
  // ---------------------------------------------------------------------------

  /**
   * Asynchronously resolves an asset — waits for state to transition
   * to "ready" or "error". Initiates load if the asset is "pending".
   */
  public async resolveAsync(assetId: string): Promise<ResolvedAsset> {
    const entry = assetRegistry.get(assetId);
    if (!entry) {
      return { assetId, state: "missing", fallbackUrl: CHECKERBOARD_PLACEHOLDER };
    }

    if (entry.state === "ready") {
      return this.resolve(assetId);
    }

    if (entry.state === "pending") {
      await this.loadAsset(entry.ref);
    }

    return this.resolve(assetId);
  }

  /**
   * Asynchronously resolves a font — loads the @font-face if needed.
   */
  public async resolveFontAsync(ref: FontRef): Promise<ResolvedFont> {
    fontRegistry.register(ref);
    const state = fontRegistry.getState(ref.family, ref.weight, ref.style);
    if (state === "pending" || state === "missing") {
      await this.loadFont(ref);
    }
    return this.resolveFont(ref.family, ref.weight, ref.style);
  }

  /**
   * Pre-warm the resolver for all assets and fonts declared in a document's AssetManifest.
   * Fires all fetches concurrently. The projection layer does NOT need to await this —
   * it will get placeholders until assets transition to "ready".
   */
  public async warmDocument(doc: OverlayDocument): Promise<void> {
    const assetPromises: Promise<void>[] = [];

    // Register and start loading all assets in the manifest
    if (doc.assetManifest?.assets) {
      for (const ref of doc.assetManifest.assets) {
        const entry = assetRegistry.register(ref);
        if (entry.state === "pending") {
          assetPromises.push(this.loadAsset(ref));
        }
      }
    }

    // Register and start loading all font refs found in document nodes
    const fontRefs = this.collectFontRefs(doc);
    const fontPromises = fontRefs.map((ref) => this.loadFont(ref));

    await Promise.allSettled([...assetPromises, ...fontPromises]);
  }

  // ---------------------------------------------------------------------------
  // Private loaders
  // ---------------------------------------------------------------------------

  private async loadAsset(ref: AssetRef): Promise<void> {
    assetRegistry.markLoading(ref.assetId);

    try {
      if (ref.source === "remote" && ref.uri) {
        // Remote assets: verify the URL is reachable, use directly (no re-hosting)
        const res = await fetch(ref.uri, { method: "HEAD" });
        if (res.ok) {
          assetRegistry.markReady(ref.assetId, ref.uri);
        } else {
          assetRegistry.markError(ref.assetId, `HTTP ${res.status}`);
        }
      } else if (ref.source === "builtin" && ref.uri) {
        // Builtin assets: bundled URIs always ready
        assetRegistry.markReady(ref.assetId, ref.uri);
      } else {
        // Local assets require explicit markReady() call with blob URL
        // (invoked by the Studio file picker after reading the File object)
        // Here we just leave state as "loading" — Studio will call markReady
      }
    } catch (err) {
      assetRegistry.markError(ref.assetId, String(err));
    }
  }

  private async loadFont(ref: FontRef): Promise<void> {
    fontRegistry.register(ref);

    try {
      if (ref.source === "system") {
        // System fonts are always available — mark ready immediately
        fontRegistry.markReady(ref.family, ref.weight, ref.style);
        return;
      }

      if (ref.source === "builtin") {
        fontRegistry.markReady(ref.family, ref.weight, ref.style);
        return;
      }

      const url = ref.url ?? (ref.assetId ? assetRegistry.get(ref.assetId)?.resolvedUrl : undefined);
      if (!url) {
        fontRegistry.markError(ref.family, ref.weight, ref.style);
        return;
      }

      // Only load fonts in browser environments
      if (typeof document !== "undefined" && "FontFace" in globalThis) {
        const fontFace = new FontFace(ref.family, `url(${url})`, {
          weight: String(ref.weight),
          style: ref.style,
        });
        await fontFace.load();
        (document.fonts as any).add(fontFace);
        fontRegistry.markReady(ref.family, ref.weight, ref.style);
      } else {
        // Non-browser environment (tests) — mark ready directly
        fontRegistry.markReady(ref.family, ref.weight, ref.style);
      }
    } catch (err) {
      fontRegistry.markError(ref.family, ref.weight, ref.style);
    }
  }

  /**
   * Walk document nodes and collect all FontRef values.
   */
  private collectFontRefs(doc: OverlayDocument): FontRef[] {
    const refs: FontRef[] = [];
    const walk = (nodes: any[]): void => {
      for (const node of nodes) {
        if (node.style?.fontRef) {
          refs.push(node.style.fontRef as FontRef);
        }
        if (node.children) walk(node.children);
        if (node.itemTemplate) walk([node.itemTemplate]);
      }
    };
    walk(doc.nodes);
    return refs;
  }
}

/** Singleton runtime asset resolver */
export const runtimeAssetResolver = new RuntimeAssetResolver();
