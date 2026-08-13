import type { OverlayDocument, SceneNode } from "./overlayDocumentSchema.js";
import { dataBindingEngine } from "./dataBindingEngine.js";
import { resolveDocumentForBreakpoint } from "./responsiveResolver.js";

export interface ComputedNodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutComputedState {
  nodes: Record<string, ComputedNodeBounds>;
}

export class LayoutEngine {
  /**
   * Deterministically compute auto-layout geometry (fixed / hug / fill)
   * for an OverlayDocument before animation & rendering passes.
   */
  public computeLayout(
    doc: OverlayDocument,
    contextData: Record<string, any> = {}
  ): LayoutComputedState {
    const fullContext = {
      ...doc.variables.reduce((acc, v) => ({ ...acc, [v.key]: v.defaultValue }), {}),
      ...contextData
    };

    const result: Record<string, ComputedNodeBounds> = {};

    for (const node of doc.nodes) {
      this.computeNodeGeometry(node, doc, fullContext, result, 0, 0);
    }

    return { nodes: result };
  }

  /**
   * Compute layout for a specific breakpoint.
   * Resolves the document for the breakpoint first (canvas + node overrides),
   * then runs the standard layout pipeline on the resolved document.
   *
   * When breakpointId is null, behaves identically to computeLayout.
   */
  public computeLayoutForBreakpoint(
    doc: OverlayDocument,
    breakpointId: string | null,
    contextData: Record<string, any> = {}
  ): LayoutComputedState {
    const resolvedDoc = resolveDocumentForBreakpoint(doc, breakpointId);
    return this.computeLayout(resolvedDoc, contextData);
  }

  private computeNodeGeometry(
    node: SceneNode,
    doc: OverlayDocument,
    context: Record<string, any>,
    result: Record<string, ComputedNodeBounds>,
    parentX: number,
    parentY: number
  ): ComputedNodeBounds {
    // 1. Initial absolute coordinates
    let absX = parentX + node.x;
    let absY = parentY + node.y;
    let width = node.width;
    let height = node.height;

    // 2. Measure text intrinsic dimensions if primitive text or rich-text or metric
    if (node.type === "text" || node.type === "rich-text" || node.type === "metric") {
      let rawText = "";
      if (node.type === "text") {
        rawText = (node as any).text || "";
      } else if (node.type === "rich-text") {
        const spans = (node as any).spans || [];
        rawText = spans.map((s: any) => s.text).join("");
      } else if (node.type === "metric") {
        const m = node as any;
        rawText = `${m.prefix || ""}${m.value ?? ""}${m.suffix || ""} ${m.label || ""}`;
      }

      const textVal = dataBindingEngine.evaluateExpression(rawText, context);
      const fontSize = node.style?.fontSize || 24;
      const strLen = String(textVal ?? "").length;

      // Intrinsic width calculation (proportional font average 0.55 char width ratio)
      const intrinsicWidth = Math.max(40, Math.ceil(strLen * fontSize * 0.55));
      const intrinsicHeight = Math.ceil(fontSize * (node.style?.lineHeight || 1.2));

      const widthMode = node.layout?.constraints?.widthMode;
      const heightMode = node.layout?.constraints?.heightMode;

      if (widthMode === "hug") width = intrinsicWidth;
      if (heightMode === "hug") height = intrinsicHeight;
    }

    // 3. Process children layout if container has children
    const children = (node as any).children as SceneNode[] | undefined;
    if (Array.isArray(children) && children.length > 0) {
      const mode = node.layout?.mode || "none";
      const gap = node.layout?.gap || 0;
      const padding = node.layout?.padding || { top: 0, right: 0, bottom: 0, left: 0 };

      if (mode === "flex-row") {
        let currentX = absX + padding.left;
        let maxChildHeight = 0;

        children.forEach((child) => {
          const childBounds = this.computeNodeGeometry(
            child,
            doc,
            context,
            result,
            currentX,
            absY + padding.top
          );
          currentX += childBounds.width + gap;
          maxChildHeight = Math.max(maxChildHeight, childBounds.height);
        });

        const totalChildrenWidth = currentX - absX - gap + padding.right;
        const totalChildrenHeight = maxChildHeight + padding.top + padding.bottom;

        if (node.layout?.constraints?.widthMode === "hug") width = totalChildrenWidth;
        if (node.layout?.constraints?.heightMode === "hug") height = totalChildrenHeight;
      } else if (mode === "flex-column") {
        let currentY = absY + padding.top;
        let maxChildWidth = 0;

        children.forEach((child) => {
          const childBounds = this.computeNodeGeometry(
            child,
            doc,
            context,
            result,
            absX + padding.left,
            currentY
          );
          currentY += childBounds.height + gap;
          maxChildWidth = Math.max(maxChildWidth, childBounds.width);
        });

        const totalChildrenHeight = currentY - absY - gap + padding.bottom;
        const totalChildrenWidth = maxChildWidth + padding.left + padding.right;

        if (node.layout?.constraints?.widthMode === "hug") width = totalChildrenWidth;
        if (node.layout?.constraints?.heightMode === "hug") height = totalChildrenHeight;
      } else {
        // Mode === "none" or "grid"
        children.forEach((child) => {
          this.computeNodeGeometry(child, doc, context, result, absX, absY);
        });
      }
    }

    const clamped = this.applyDimensionConstraints(width, height, node);
    const bounds: ComputedNodeBounds = { x: absX, y: absY, width: clamped.width, height: clamped.height };
    result[node.id] = bounds;
    return bounds;
  }

  /** Apply min/max clamping and aspectRatioLock to resolved dimensions. */
  private applyDimensionConstraints(
    width: number,
    height: number,
    node: SceneNode
  ): { width: number; height: number } {
    const c = node.layout?.constraints;
    if (!c) return { width, height };

    let w = width;
    let h = height;

    if (c.minWidth !== undefined) w = Math.max(w, c.minWidth);
    if (c.maxWidth !== undefined) w = Math.min(w, c.maxWidth);
    if (c.minHeight !== undefined) h = Math.max(h, c.minHeight);
    if (c.maxHeight !== undefined) h = Math.min(h, c.maxHeight);

    // aspectRatioLock: derive height from clamped width using stored aspectRatio
    if (c.aspectRatioLock && c.aspectRatio && c.aspectRatio > 0) {
      h = w / c.aspectRatio;
    }

    return { width: w, height: h };
  }
}

export const layoutEngine = new LayoutEngine();
