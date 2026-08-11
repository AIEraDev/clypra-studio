import type { OverlayDocument } from "../overlayDocumentSchema.js";

export interface TemplateManifest {
  kind: "smart-overlay-template";
  schemaVersion: "1.0";
  metadata: {
    id: string;
    name: string;
    category: string;
    tags: string[];
    thumbnailUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  document: OverlayDocument;
}

export function serializeTemplate(
  doc: OverlayDocument,
  meta: Omit<TemplateManifest["metadata"], "createdAt" | "updatedAt">
): TemplateManifest {
  const now = new Date().toISOString();
  return {
    kind: "smart-overlay-template",
    schemaVersion: "1.0",
    metadata: {
      ...meta,
      createdAt: now,
      updatedAt: now
    },
    document: JSON.parse(JSON.stringify(doc))
  };
}

export function deserializeTemplate(manifest: TemplateManifest): OverlayDocument {
  if (manifest.kind !== "smart-overlay-template") {
    throw new Error(`Invalid template manifest kind: ${(manifest as any).kind}`);
  }
  return JSON.parse(JSON.stringify(manifest.document));
}
