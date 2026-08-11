import type { OverlayDocument, SceneNode, AssetRef } from "../overlayDocumentSchema.js";
import type { SmartOverlayClip } from "../smartOverlayTypes.js";

export class DocumentMigrator {
  /**
   * Migrate any raw document or legacy clip to latest OverlayDocument v2.0
   */
  public migrate(rawInput: any): OverlayDocument {
    if (!rawInput) {
      return this.createDefaultDocument();
    }

    // Already v2.0 document — run upgrade pass to handle schema additions (e.g. 4I assetManifest)
    if (rawInput.version === "2.0" && Array.isArray(rawInput.nodes)) {
      return this.migrateV2Document(rawInput as OverlayDocument);
    }

    // Legacy clip migration
    if (rawInput.kind === "smart-overlay" && rawInput.overlayType) {
      return this.fromLegacyClip(rawInput as SmartOverlayClip);
    }

    return this.createDefaultDocument();
  }

  public fromLegacyClip(clip: SmartOverlayClip): OverlayDocument {
    const docId = clip.id || `doc-${Date.now().toString(36)}`;
    const category = clip.overlayType || "stat";

    return {
      id: docId,
      version: "2.0",
      title: `${category.toUpperCase()} Overlay Clip`,
      category,
      canvas: {
        width: 1280,
        height: 720,
        backgroundColor: clip.style?.cardBackgroundColor || "#12121A"
      },
      variables: [
        { key: "value", type: "string", defaultValue: (clip.content?.data as any)?.value || "+100%", label: "Value" },
        { key: "label", type: "string", defaultValue: (clip.content?.data as any)?.label || "Title", label: "Label" }
      ],
      nodes: [
        {
          id: `legacy-${docId}`,
          name: `${category} Component`,
          type: "component",
          componentType: category === "stat" ? "stat-card" : category === "quote" ? "quote-card" : "stat-card",
          x: 20,
          y: 20,
          width: 60,
          height: 60,
          props: { ...(clip.content?.data || {}) }
        }
      ],
      duration: clip.duration || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Phase 4I upgrade pass: promote PrimitiveMediaNode.src → assetId.
   * Builds assetManifest from any media nodes that still use the legacy src field.
   * This is idempotent — safe to run multiple times.
   */
  private migrateV2Document(doc: OverlayDocument): OverlayDocument {
    const manifest: AssetRef[] = doc.assetManifest?.assets ? [...doc.assetManifest.assets] : [];
    const knownIds = new Set(manifest.map((a) => a.assetId));

    const upgradeNodes = (nodes: SceneNode[]): SceneNode[] =>
      nodes.map((node) => {
        // Migrate legacy media node src → assetId
        if (node.type === "media" && (node as any).src && !(node as any).assetId) {
          const src = (node as any).src as string;
          // Generate a stable assetId from the src string
          const assetId = `asset-legacy-${btoa(src).replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;
          if (!knownIds.has(assetId)) {
            const ref: AssetRef = {
              assetId,
              kind: "image",
              source: src.startsWith("http") ? "remote" : "local",
              uri: src.startsWith("http") ? src : undefined,
            };
            manifest.push(ref);
            knownIds.add(assetId);
          }
          return { ...node, assetId } as SceneNode;
        }

        // Recurse into children
        if ("children" in node && Array.isArray(node.children)) {
          return { ...node, children: upgradeNodes(node.children) } as SceneNode;
        }

        return node;
      });

    return {
      ...doc,
      nodes: upgradeNodes(doc.nodes),
      assetManifest: manifest.length > 0 ? { assets: manifest } : doc.assetManifest,
    };
  }

  private createDefaultDocument(): OverlayDocument {
    return {
      id: `doc-${Date.now().toString(36)}`,
      version: "2.0",
      title: "Untitled Overlay",
      category: "stat",
      canvas: { width: 1280, height: 720, backgroundColor: "#12121A" },
      variables: [],
      nodes: [],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export const documentMigrator = new DocumentMigrator();
