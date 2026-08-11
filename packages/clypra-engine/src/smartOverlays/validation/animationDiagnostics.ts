import type { OverlayDocument, SceneNode } from "../overlayDocumentSchema.js";

export type AnimationDiagnosticSeverity = "error" | "warning" | "info";

export interface AnimationDiagnostic {
  nodeId: string;
  nodeName: string;
  severity: AnimationDiagnosticSeverity;
  code: string;
  message: string;
}

export class AnimationValidator {
  public validate(doc: OverlayDocument): AnimationDiagnostic[] {
    const diagnostics: AnimationDiagnostic[] = [];
    const clipDuration = doc.duration || 5;
    const markerIds = new Set((doc.markers || []).map((m) => m.id));
    this.walkNodes(doc.nodes, clipDuration, markerIds, diagnostics);
    return diagnostics;
  }

  private walkNodes(
    nodes: SceneNode[],
    clipDuration: number,
    markerIds: Set<string>,
    diagnostics: AnimationDiagnostic[]
  ): void {
    for (const node of nodes) {
      this.validateNode(node, clipDuration, markerIds, diagnostics);
      const children = (node as any).children;
      if (Array.isArray(children)) {
        this.walkNodes(children, clipDuration, markerIds, diagnostics);
      }
    }
  }

  private validateNode(
    node: SceneNode,
    clipDuration: number,
    markerIds: Set<string>,
    diagnostics: AnimationDiagnostic[]
  ): void {
    const anim = (node as any).animation;
    const name = node.name || node.id;

    if (!anim) return;

    // 1. MISSING_MARKER_REF — start.type === 'marker' but markerId not in doc
    if (anim.start?.type === "marker") {
      const markerId = anim.start.markerId;
      if (!markerId || !markerIds.has(markerId)) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: name,
          severity: "error",
          code: "MISSING_MARKER_REF",
          message: `Animation start references marker "${markerId}" which does not exist in this document.`,
        });
      }
    }

    // 2. KEYFRAME_PAST_DURATION — any keyframe time > 1.0 (0-1 normalized)
    if (Array.isArray(anim.keyframeTracks)) {
      for (const track of anim.keyframeTracks) {
        for (const kf of track.keyframes || []) {
          if (kf.time > 1.0) {
            diagnostics.push({
              nodeId: node.id,
              nodeName: name,
              severity: "warning",
              code: "KEYFRAME_PAST_DURATION",
              message: `Keyframe on "${track.property}" at normalized time ${kf.time.toFixed(2)} exceeds clip duration (max 1.0).`,
            });
            break; // one warning per track is enough
          }
        }
      }
    }

    // 3. ANIMATION_PAST_DURATION — entrance extends past clip end
    if (anim.entrance) {
      const entranceEnd = (anim.entrance.delay || 0) + anim.entrance.duration;
      if (entranceEnd > clipDuration) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: name,
          severity: "warning",
          code: "ANIMATION_PAST_DURATION",
          message: `Entrance animation ends at ${entranceEnd.toFixed(2)}s but clip duration is ${clipDuration.toFixed(2)}s.`,
        });
      }
    }

    // 4. TYPEWRITER_NON_TEXT — typewriter on non-text node
    if (anim.semanticAnimation?.type === "typewriter" && node.type !== "text") {
      diagnostics.push({
        nodeId: node.id,
        nodeName: name,
        severity: "warning",
        code: "TYPEWRITER_NON_TEXT",
        message: `Typewriter animation requires a text node, but this node is type "${node.type}".`,
      });
    }

    // 5. COUNTUP_NON_NUMBER — count-up target is not parseable as a number
    if (anim.semanticAnimation?.type === "count-up") {
      const to = anim.semanticAnimation.to;
      if (typeof to !== "number" && isNaN(parseFloat(String(to)))) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: name,
          severity: "warning",
          code: "COUNTUP_NON_NUMBER",
          message: `Count-up animation target value "${to}" cannot be parsed as a number.`,
        });
      }
    }

    // 6. STAGGER_SCOPE_MISSING_CHILDREN — animationScope !== 'node' but no children
    if (anim.animationScope && anim.animationScope !== "node") {
      const children = (node as any).children;
      if (!Array.isArray(children) || children.length === 0) {
        diagnostics.push({
          nodeId: node.id,
          nodeName: name,
          severity: "warning",
          code: "STAGGER_SCOPE_MISSING_CHILDREN",
          message: `Animation scope is "${anim.animationScope}" but node has no children to stagger.`,
        });
      }
    }
  }
}

export const animationValidator = new AnimationValidator();
