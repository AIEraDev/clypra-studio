/**
 * Phase 4K / 4M — Pre-Export Safety Validator
 *
 * Inspects an OverlayDocument and ExportConfig before rendering to flag
 * missing assets, missing fonts, syntax/expression errors, duration overflows,
 * invalid layout constraints, and CORS canvas taint risks.
 */

import type { OverlayDocument, SceneNode } from "../overlayDocumentSchema.js";
import { assetRegistry } from "../assets/assetRegistry.js";
import { fontRegistry } from "../assets/fontRegistry.js";
import type {
  ExportConfig,
  ExportValidationDiagnostic,
} from "./exportTypes.js";

export class ExportValidator {
  public validate(
    doc: OverlayDocument,
    config: Partial<ExportConfig> = {}
  ): ExportValidationDiagnostic[] {
    const diagnostics: ExportValidationDiagnostic[] = [];
    const clipDuration = config.duration ?? doc.duration ?? 5;
    const fps = config.fps ?? 30;

    // 1. Validate Canvas & Export Dimensions
    if (doc.canvas.width < 16 || doc.canvas.height < 16) {
      diagnostics.push({
        severity: "warning",
        code: "SUBPIXEL_DIMENSIONS",
        message: `Canvas dimensions (${doc.canvas.width}x${doc.canvas.height}) are unusually small.`,
      });
    }

    if (fps <= 0 || fps > 120) {
      diagnostics.push({
        severity: "error",
        code: "NON_STANDARD_FPS",
        message: `Export FPS (${fps}) is invalid. FPS must be between 1 and 120.`,
      });
    }

    // 2. Build Asset Manifest Set
    const manifestAssetIds = new Set(
      (doc.assetManifest?.assets || []).map((a) => a.assetId)
    );

    // 3. Walk Scene Nodes
    this.walkNodes(doc.nodes, doc, clipDuration, manifestAssetIds, diagnostics);

    return diagnostics;
  }

  private walkNodes(
    nodes: SceneNode[],
    doc: OverlayDocument,
    clipDuration: number,
    manifestAssetIds: Set<string>,
    diagnostics: ExportValidationDiagnostic[]
  ): void {
    for (const node of nodes) {
      this.validateNode(node, doc, clipDuration, manifestAssetIds, diagnostics);

      if ("children" in node && Array.isArray(node.children)) {
        this.walkNodes(node.children, doc, clipDuration, manifestAssetIds, diagnostics);
      }

      if (node.type === "repeater" && node.itemTemplate) {
        this.validateNode(node.itemTemplate, doc, clipDuration, manifestAssetIds, diagnostics);
        if ("children" in node.itemTemplate && Array.isArray((node.itemTemplate as any).children)) {
          this.walkNodes((node.itemTemplate as any).children, doc, clipDuration, manifestAssetIds, diagnostics);
        }
      }
    }
  }

  private validateNode(
    node: SceneNode,
    _doc: OverlayDocument,
    clipDuration: number,
    manifestAssetIds: Set<string>,
    diagnostics: ExportValidationDiagnostic[]
  ): void {
    // A. Asset Integrity & CORS Risk Check
    if (node.type === "media") {
      if (node.assetId) {
        const registered = assetRegistry.get(node.assetId);
        const isManifested = manifestAssetIds.has(node.assetId);
        if (!registered && !isManifested) {
          diagnostics.push({
            severity: "error",
            code: "MISSING_ASSET",
            nodeId: node.id,
            message: `Media node "${node.name}" (${node.id}) references missing assetId "${node.assetId}".`,
            details: { assetId: node.assetId },
          });
        } else if (registered?.ref.source === "remote" && registered.ref.uri?.startsWith("http")) {
          diagnostics.push({
            severity: "warning",
            code: "CORS_TAINT_WARNING",
            nodeId: node.id,
            message: `Media node "${node.name}" uses remote asset URI "${registered.ref.uri}". Ensure CORS headers permit canvas readback.`,
            details: { uri: registered.ref.uri },
          });
        }
      }
    }

    // B. Font Integrity Check
    const fontRef = node.style?.fontRef;
    if (fontRef) {
      const isFontResolved = fontRegistry.getState(fontRef.family, fontRef.weight ?? 400, fontRef.style ?? "normal") === "ready";
      if (!isFontResolved) {
        diagnostics.push({
          severity: "warning",
          code: "MISSING_FONT",
          nodeId: node.id,
          message: `Text node "${node.name}" (${node.id}) references font "${fontRef.family}" which is not loaded in FontRegistry. Operating system fallback will be used.`,
          details: { fontRef },
        });
      }
    }

    // C. Data Binding & Expression Syntax Check
    if (node.visibilityExpression) {
      const unwrapped = node.visibilityExpression.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
      try {
        // eslint-disable-next-line no-new-func
        new Function(`return (${unwrapped});`);
      } catch (err: any) {
        diagnostics.push({
          severity: "error",
          code: "INVALID_BINDING",
          nodeId: node.id,
          message: `Node "${node.name}" has invalid visibility expression "${node.visibilityExpression}": ${err.message}`,
        });
      }
    }

    if (node.bindings) {
      for (const rule of node.bindings) {
        const unwrapped = rule.expression.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
        try {
          // eslint-disable-next-line no-new-func
          new Function(`return (${unwrapped});`);
        } catch (err: any) {
          diagnostics.push({
            severity: "error",
            code: "INVALID_BINDING",
            nodeId: node.id,
            message: `Node "${node.name}" binding for "${rule.targetProperty}" has invalid expression "${rule.expression}": ${err.message}`,
          });
        }
      }
    }

    // D. Animation Duration Check
    if (node.animation) {
      const entrance = node.animation.entrance;
      if (entrance) {
        const totalEntranceTime = (entrance.delay || 0) + (entrance.duration || 0);
        if (totalEntranceTime > clipDuration) {
          diagnostics.push({
            severity: "warning",
            code: "DURATION_OVERFLOW",
            nodeId: node.id,
            message: `Node "${node.name}" entrance animation (${totalEntranceTime}s) exceeds export clip duration (${clipDuration}s).`,
          });
        }
      }

      const keyframes = node.animation.keyframeTracks || [];
      for (const track of keyframes) {
        for (const kf of track.keyframes) {
          if (kf.time > 1.0) {
            diagnostics.push({
              severity: "warning",
              code: "DURATION_OVERFLOW",
              nodeId: node.id,
              message: `Node "${node.name}" keyframe on property "${track.property}" at normalized time ${kf.time} extends past clip duration.`,
            });
          }
        }
      }
    }

    // E. Constraint Validation
    const c = node.layout?.constraints;
    if (c) {
      if (c.minWidth !== undefined && c.maxWidth !== undefined && c.minWidth > c.maxWidth) {
        diagnostics.push({
          severity: "error",
          code: "UNRESOLVED_CONSTRAINTS",
          nodeId: node.id,
          message: `Node "${node.name}" has minWidth (${c.minWidth}) greater than maxWidth (${c.maxWidth}).`,
        });
      }
      if (c.minHeight !== undefined && c.maxHeight !== undefined && c.minHeight > c.maxHeight) {
        diagnostics.push({
          severity: "error",
          code: "UNRESOLVED_CONSTRAINTS",
          nodeId: node.id,
          message: `Node "${node.name}" has minHeight (${c.minHeight}) greater than maxHeight (${c.maxHeight}).`,
        });
      }
    }

    if (isNaN(node.x) || isNaN(node.y) || isNaN(node.width) || isNaN(node.height)) {
      diagnostics.push({
        severity: "error",
        code: "UNRESOLVED_CONSTRAINTS",
        nodeId: node.id,
        message: `Node "${node.name}" has NaN in base geometry (x=${node.x}, y=${node.y}, w=${node.width}, h=${node.height}).`,
      });
    }
  }
}

export const exportValidator = new ExportValidator();
