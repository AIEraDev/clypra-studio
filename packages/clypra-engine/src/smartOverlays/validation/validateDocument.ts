import type { OverlayDocument, SceneNode } from "../overlayDocumentSchema.js";
import { componentRegistry } from "../componentRegistry.js";

export interface ValidationDiagnostic {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeId?: string;
}

export class DocumentValidator {
  public validate(doc: OverlayDocument): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];

    if (!doc || !doc.id) {
      diagnostics.push({ severity: "error", code: "ERR_NO_DOC_ID", message: "OverlayDocument missing document ID." });
      return diagnostics;
    }

    // Validate variables
    const varKeys = new Set(doc.variables.map((v) => v.key));

    // Validate nodes recursively
    for (const node of doc.nodes) {
      this.validateNode(node, doc, varKeys, diagnostics);
    }

    return diagnostics;
  }

  private validateNode(node: SceneNode, doc: OverlayDocument, varKeys: Set<string>, diagnostics: ValidationDiagnostic[]): void {
    if (node.type === "component") {
      const def = componentRegistry.get(node.componentType);
      if (!def) {
        diagnostics.push({
          severity: "warning",
          code: "WARN_UNREGISTERED_COMPONENT",
          message: `Component type "${node.componentType}" is not registered in ComponentRegistry.`,
          nodeId: node.id
        });
      }
    }

    // Validate safe zone boundaries
    const absX = node.x < 100 ? (node.x / 100) * doc.canvas.width : node.x;
    const absY = node.y < 100 ? (node.y / 100) * doc.canvas.height : node.y;
    const absW = node.width <= 100 ? (node.width / 100) * doc.canvas.width : node.width;
    const absH = node.height <= 100 ? (node.height / 100) * doc.canvas.height : node.height;

    if (absX + absW > doc.canvas.width || absY + absH > doc.canvas.height) {
      diagnostics.push({
        severity: "warning",
        code: "WARN_OUT_OF_BOUNDS",
        message: `Node "${node.name || node.id}" extends outside canvas bounds.`,
        nodeId: node.id
      });
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.validateNode(child, doc, varKeys, diagnostics);
      }
    }
  }
}

export const documentValidator = new DocumentValidator();
