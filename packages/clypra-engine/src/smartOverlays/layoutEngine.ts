import type { OverlayDocument, SceneNode } from "./overlayDocumentSchema.js";
import { dataBindingEngine } from "./dataBindingEngine.js";
import { resolveDocumentForBreakpoint } from "./responsiveResolver.js";
import { MediaImageEngine } from "./mediaImageEngine.js";

let _measureCanvas: any = null;
let _measureCtx: any = null;

/**
 * Measure exact pixel width of text string across browser canvas / headless environments.
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string | number = "normal",
  fontFamily: string = "Inter, sans-serif",
  tabularNums = false
): number {
  if (!text) return 20;
  if (typeof document !== "undefined") {
    try {
      if (!_measureCanvas) {
        _measureCanvas = document.createElement("canvas");
        _measureCtx = _measureCanvas.getContext("2d");
      }
      if (_measureCtx) {
        _measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const measured = _measureCtx.measureText(text).width;
        if (measured > 0) {
          return Math.ceil(measured);
        }
      }
    } catch {}
  }
  // Fast headless heuristic fallback
  const charWidthRatio = tabularNums ? 0.60 : (fontWeight === "bold" || fontWeight === 700 || fontWeight === "700" ? 0.54 : 0.50);
  return Math.max(20, Math.ceil(text.length * fontSize * charWidthRatio));
}

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
      ...(doc.variables || []).reduce((acc, v) => ({ ...acc, [v.key]: v.defaultValue }), {}),
      ...contextData
    };

    const result: Record<string, ComputedNodeBounds> = {};

    // 1. Base Geometry Pass
    for (const node of doc.nodes) {
      this.computeNodeGeometry(node, doc, fullContext, result, 0, 0);
    }

    // 2. Spatial Anchor Pass (Target Node Pinning)
    for (const node of doc.nodes) {
      const anchor = (node as any).anchor;
      if (anchor && anchor.targetId && result[anchor.targetId]) {
        const targetBounds = result[anchor.targetId];
        const currentBounds = result[node.id] || { x: node.x, y: node.y, width: node.width, height: node.height };

        let targetPointX = targetBounds.x + targetBounds.width / 2;
        let targetPointY = targetBounds.y + targetBounds.height / 2;

        const targetSide = anchor.targetSide || "right";
        if (targetSide === "top") {
          targetPointY = targetBounds.y;
        } else if (targetSide === "right") {
          targetPointX = targetBounds.x + targetBounds.width;
        } else if (targetSide === "bottom") {
          targetPointY = targetBounds.y + targetBounds.height;
        } else if (targetSide === "left") {
          targetPointX = targetBounds.x;
        }

        const offsetX = anchor.offsetX ?? 16;
        const offsetY = anchor.offsetY ?? 0;

        const anchorSide = anchor.anchorSide || "left";
        let newX = targetPointX + offsetX;
        let newY = targetPointY + offsetY;

        if (anchorSide === "right") {
          newX -= currentBounds.width;
        } else if (anchorSide === "top") {
          newY -= currentBounds.height;
        } else if (anchorSide === "center") {
          newX -= currentBounds.width / 2;
          newY -= currentBounds.height / 2;
        }

        result[node.id] = {
          ...currentBounds,
          x: Math.round(newX),
          y: Math.round(newY),
        };
      }
    }

    // 3. Elastic Vector Line Pass (LineNode Endpoint Connection)
    for (const node of doc.nodes) {
      if (node.type === "line") {
        const lineNode = node as any;
        const startTarget = lineNode.startNodeId ? result[lineNode.startNodeId] : undefined;
        const endTarget = lineNode.endNodeId ? result[lineNode.endNodeId] : undefined;

        if (
          startTarget ||
          endTarget ||
          lineNode.startX !== undefined ||
          lineNode.endX !== undefined
        ) {
          const startX = startTarget ? startTarget.x + startTarget.width / 2 : (lineNode.startX ?? node.x);
          const startY = startTarget ? startTarget.y + startTarget.height / 2 : (lineNode.startY ?? node.y);
          const endX = endTarget ? endTarget.x + endTarget.width / 2 : (lineNode.endX ?? (node.x + node.width));
          const endY = endTarget ? endTarget.y + endTarget.height / 2 : (lineNode.endY ?? (node.y + node.height));

          const minX = Math.min(startX, endX);
          const minY = Math.min(startY, endY);
          const lineW = Math.max(1, Math.abs(endX - startX));
          const lineH = Math.max(1, Math.abs(endY - startY));

          result[node.id] = {
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.round(lineW),
            height: Math.round(lineH),
          };
        }
      }
    }

    // 4. Relational Connector Pass (ConnectorNode Dynamic Anchor Tracking)
    for (const node of doc.nodes) {
      if (node.type === "connector") {
        const conn = node as any;
        const fromTarget = conn.fromNodeId ? result[conn.fromNodeId] : undefined;
        const toTarget = conn.toNodeId ? result[conn.toNodeId] : undefined;

        const fromPt = fromTarget
          ? this.resolveAnchorPoint(fromTarget, conn.fromAnchor || conn.fromElement)
          : { x: node.x, y: node.y };

        const toPt = toTarget
          ? this.resolveAnchorPoint(toTarget, conn.toAnchor || conn.toElement)
          : { x: node.x + (node.width || 100), y: node.y + (node.height || 100) };

        const minX = Math.min(fromPt.x, toPt.x);
        const minY = Math.min(fromPt.y, toPt.y);
        const connW = Math.max(1, Math.abs(toPt.x - fromPt.x));
        const connH = Math.max(1, Math.abs(toPt.y - fromPt.y));

        result[node.id] = {
          x: Math.round(minX),
          y: Math.round(minY),
          width: Math.round(connW),
          height: Math.round(connH),
        };
      }
    }

    return { nodes: result };
  }

  /** Resolve anchor point coordinates on a target bounding box */
  public resolveAnchorPoint(
    target: ComputedNodeBounds,
    anchor?: "top" | "bottom" | "left" | "right" | "center" | { x: number; y: number } | string
  ): { x: number; y: number } {
    if (!anchor || anchor === "center" || anchor === "point" || anchor === "arc-mid" || anchor === "bar-top") {
      return { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    }
    if (anchor === "top") {
      return { x: target.x + target.width / 2, y: target.y };
    }
    if (anchor === "bottom") {
      return { x: target.x + target.width / 2, y: target.y + target.height };
    }
    if (anchor === "left") {
      return { x: target.x, y: target.y + target.height / 2 };
    }
    if (anchor === "right") {
      return { x: target.x + target.width, y: target.y + target.height / 2 };
    }
    if (typeof anchor === "object" && typeof anchor.x === "number" && typeof anchor.y === "number") {
      const u = anchor.x <= 1 ? anchor.x : 0.5;
      const v = anchor.y <= 1 ? anchor.y : 0.5;
      return { x: target.x + target.width * u, y: target.y + target.height * v };
    }
    return { x: target.x + target.width / 2, y: target.y + target.height / 2 };
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
    parentX = 0,
    parentY = 0,
    isAbsoluteSlot = false
  ): ComputedNodeBounds {
    // 1. Initial absolute coordinates
    let absX = isAbsoluteSlot ? parentX : parentX + node.x;
    let absY = isAbsoluteSlot ? parentY : parentY + node.y;
    let width = node.width;
    let height = node.height;

    // Line / Connector intrinsic thickness
    if (node.type === "line" || (node as any).shapeKind === "line") {
      const strokeW = (node as any).style?.strokeWidth ?? (node as any).strokeWidth;
      if (typeof strokeW === "number" && strokeW > 0) {
        height = Math.max(height, strokeW);
      }
    }

    // Root-level Fill mode (top-level node with no parent container fills doc.canvas)
    const effectiveWidthMode = node.layout?.constraints?.widthMode || (node as any).constraints?.widthMode || (node as any).widthMode;
    const effectiveHeightMode = node.layout?.constraints?.heightMode || (node as any).constraints?.heightMode || (node as any).heightMode;

    const isRootNode = doc.nodes.some((n) => n.id === node.id);
    if (isRootNode && parentX === 0 && parentY === 0) {
      if (effectiveWidthMode === "fill") {
        width = doc.canvas.width;
        absX = 0;
      }
      if (effectiveHeightMode === "fill") {
        height = doc.canvas.height;
        absY = 0;
      }
    }

    const containerW = parentX === 0 ? doc.canvas.width : 1280;
    const containerH = parentY === 0 ? doc.canvas.height : 720;

    // Canvas Anchor Pinning (Horizontal & Vertical Pinning relative to Canvas/Parent Container)
    if (!isAbsoluteSlot) {
      const horizontalPin = (node as any).constraints?.horizontal || node.layout?.constraints?.horizontal || "left";
      const verticalPin = (node as any).constraints?.vertical || node.layout?.constraints?.vertical || "top";

      // Horizontal Anchor Resolution
      if (horizontalPin === "center") {
        absX = parentX + (containerW - width) / 2;
      } else if (horizontalPin === "right") {
        absX = parentX + containerW - width;
      } else if (horizontalPin === "scale") {
        const scaleX = containerW / (doc.canvas.width || 1280);
        absX = Math.round(parentX + node.x * scaleX);
        if (node.layout?.constraints?.widthMode !== "fixed") {
          width = Math.round(node.width * scaleX);
        }
      }

      // Vertical Anchor Resolution
      if (verticalPin === "center") {
        absY = parentY + (containerH - height) / 2;
      } else if (verticalPin === "bottom") {
        absY = parentY + containerH - height;
      } else if (verticalPin === "scale") {
        const scaleY = containerH / (doc.canvas.height || 720);
        absY = Math.round(parentY + node.y * scaleY);
        if (node.layout?.constraints?.heightMode !== "fixed") {
          height = Math.round(node.height * scaleY);
        }
      }
    }

    // Static visibility toggle
    if (node.visible === false) {
      const bounds: ComputedNodeBounds = { x: absX, y: absY, width: 0, height: 0 };
      result[node.id] = bounds;
      return bounds;
    }

    // 2. Measure text intrinsic dimensions if primitive text or rich-text or metric
    if (node.type === "text" || node.type === "rich-text" || node.type === "metric") {
      let evaluatedText = "";
      if (node.type === "text") {
        evaluatedText = dataBindingEngine.evaluateString((node as any).text || "", context);
      } else if (node.type === "rich-text") {
        const spans = (node as any).spans || [];
        evaluatedText = spans.map((s: any) => dataBindingEngine.evaluateString(s.text || "", context)).join("");
      } else if (node.type === "metric") {
        const m = node as any;
        const p = m.prefix ? dataBindingEngine.evaluateString(m.prefix, context) : "";
        const v = m.value !== undefined ? String(dataBindingEngine.evaluateExpression(String(m.value), context) ?? "") : "";
        const s = m.suffix ? dataBindingEngine.evaluateString(m.suffix, context) : "";
        const l = m.label ? dataBindingEngine.evaluateString(m.label, context) : "";
        evaluatedText = `${p}${v}${s}${l ? " " + l : ""}`;
      }

      const baseFontSize = node.style?.fontSize || (node as any).fontSize || 24;
      const overflow = (node as any).overflow || node.style?.overflow || "wrap";
      const minFontSize = (node as any).minFontSize || node.style?.minFontSize || 12;
      const maxLines = (node as any).maxLines || node.style?.maxLines;
      const tabularNums = (node as any).tabularNums || node.style?.tabularNums;
      const lineHeightMultiplier = node.style?.lineHeight || 1.2;

      const strLen = String(evaluatedText).length;
      // Tabular numerals use fixed 0.60 advance width ratio, standard uses 0.55
      const charWidthRatio = tabularNums ? 0.60 : 0.55;

      let effectiveFontSize = baseFontSize;
      let rawWidth = strLen * effectiveFontSize * charWidthRatio;
      let intrinsicWidth = Math.max(40, Math.ceil(Math.round(rawWidth * 1000) / 1000));
      let singleLineHeight = Math.ceil(effectiveFontSize * lineHeightMultiplier);

      const widthMode = node.layout?.constraints?.widthMode || (node as any).widthMode;
      const heightMode = node.layout?.constraints?.heightMode || (node as any).heightMode;

      // Scale-down overflow policy when width is constrained
      if (overflow === "scale-down" && width > 0 && intrinsicWidth > width) {
        const scaleFactor = width / intrinsicWidth;
        effectiveFontSize = Math.max(minFontSize, Math.floor(baseFontSize * scaleFactor));
        rawWidth = strLen * effectiveFontSize * charWidthRatio;
        intrinsicWidth = Math.max(40, Math.ceil(Math.round(rawWidth * 1000) / 1000));
        singleLineHeight = Math.ceil(effectiveFontSize * lineHeightMultiplier);
      }

      if (widthMode === "hug") {
        width = intrinsicWidth;
      }

      // Height calculation with non-linear auto-wrapping height curve
      if (heightMode === "hug") {
        if (overflow === "wrap" && width > 0 && intrinsicWidth > width) {
          let calculatedLines = Math.max(1, Math.ceil(intrinsicWidth / width));
          if (maxLines && maxLines > 0) {
            calculatedLines = Math.min(calculatedLines, maxLines);
          }
          height = calculatedLines * singleLineHeight;
        } else {
          height = singleLineHeight;
        }
      }
    }

    // 2b. Measure media intrinsic & aspect ratio dimensions (Image, Avatar, Video, Lottie)
    if (node.type === "media" || node.type === "avatar" || node.type === "video" || node.type === "lottie") {
      const media = node as any;
      const widthMode = node.layout?.constraints?.widthMode || media.widthMode;
      const heightMode = node.layout?.constraints?.heightMode || media.heightMode;
      const aspectRatioLock = media.aspectRatioLock ?? node.layout?.constraints?.aspectRatioLock ?? true;

      const specW = widthMode === "hug" ? "auto" : (widthMode === "fill" ? (containerW || "100%") : (width > 0 ? width : "auto"));
      const specH = heightMode === "hug" ? "auto" : (heightMode === "fill" ? (containerH || "100%") : (height > 0 ? height : "auto"));

      const resolved = MediaImageEngine.resolveDimensions({
        specifiedWidth: aspectRatioLock && widthMode === "fixed" && heightMode !== "fixed" ? width : specW,
        specifiedHeight: aspectRatioLock && heightMode === "fixed" && widthMode !== "fixed" ? height : specH,
        intrinsicWidth: media.intrinsicWidth || media.width,
        intrinsicHeight: media.intrinsicHeight || media.height,
        containerWidth: containerW,
        containerHeight: containerH,
      });

      width = Math.round(resolved.width);
      height = Math.round(resolved.height);
    }

    // 2d. Intrinsic Measurement for Icon Nodes (size or 24 default)
    if (node.type === "icon") {
      const icon = node as any;
      const size = icon.size || (icon.width && icon.width > 0 ? icon.width : 24);
      const widthMode = node.layout?.constraints?.widthMode || (node as any).constraints?.widthMode;
      const heightMode = node.layout?.constraints?.heightMode || (node as any).constraints?.heightMode;

      if (widthMode !== "fixed" && (!width || width === 0 || widthMode === "hug")) {
        width = size;
      }
      if (heightMode !== "fixed" && (!height || height === 0 || heightMode === "hug")) {
        height = size;
      }
    }

    // 3. Process children layout if container has children
    const children = (node as any).children as SceneNode[] | undefined;
    const rawPadding = node.layout?.padding ?? (node.layout as any)?.rules?.padding;
    const normPadding = typeof rawPadding === "number"
      ? { top: rawPadding, right: rawPadding, bottom: rawPadding, left: rawPadding }
      : {
          top: rawPadding?.top ?? 0,
          right: rawPadding?.right ?? 0,
          bottom: rawPadding?.bottom ?? 0,
          left: rawPadding?.left ?? 0
        };

    // Filter out hidden children so layout stack gaps collapse
    const activeChildren = (children || []).filter((child) => {
      if (child.visible === false) {
        result[child.id] = { x: absX, y: absY, width: 0, height: 0 };
        return false;
      }
      if (typeof child.visible === "string") {
        const res = dataBindingEngine.evaluateExpression(child.visible, context);
        if (!res || res === "false" || res === "0") {
          result[child.id] = { x: absX, y: absY, width: 0, height: 0 };
          return false;
        }
      }
      return true;
    });

    if (activeChildren.length > 0) {
      const rawMode =
        node.layout?.mode ||
        (node.layout as any)?.direction ||
        ((node.layout as any)?.rules?.direction === "vertical"
          ? "flex-column"
          : (node.layout as any)?.rules?.direction === "horizontal"
          ? "flex-row"
          : (node.layout as any)?.rules?.direction) ||
        (node.type === "frame" ? "flex-column" : "none");

      const isRow = rawMode === "flex-row" || rawMode === "row" || rawMode === "row-reverse" || rawMode === "horizontal";
      const isColumn = rawMode === "flex-column" || rawMode === "column" || rawMode === "column-reverse" || rawMode === "vertical";
      const isRowReverse = rawMode === "row-reverse" || (node.layout as any)?.direction === "row-reverse";
      const isColReverse = rawMode === "column-reverse" || (node.layout as any)?.direction === "column-reverse";

      const rawGap = node.layout?.gap ?? (node.layout as any)?.rules?.gap ?? 0;
      const gapX = typeof rawGap === "object" ? ((rawGap as any).col ?? (rawGap as any).x ?? 0) : (rawGap || 0);
      const gapY = typeof rawGap === "object" ? ((rawGap as any).row ?? (rawGap as any).y ?? 0) : (rawGap || 0);
      const justify = (node.layout?.justifyContent || (node.layout as any)?.justify || "flex-start") as string;
      const align = (node.layout?.alignItems || (node.layout as any)?.align || "flex-start") as string;
      const isWrap = node.layout?.wrap === true || node.layout?.wrap === "wrap" || (node.layout as any)?.flexWrap === "wrap";

      if (isRow) {
        // Step 1: Measure pass
        const lines: { children: SceneNode[]; bounds: ComputedNodeBounds[] }[] = [];
        const maxAvailW = width > 0 ? (width - normPadding.left - normPadding.right) : Infinity;

        if (isWrap) {
          let currentLine: SceneNode[] = [];
          let currentLineBounds: ComputedNodeBounds[] = [];
          let currentLineWidth = 0;

          activeChildren.forEach((child) => {
            const b = this.computeNodeGeometry(child, doc, context, result, 0, 0);
            const neededW = currentLine.length === 0 ? b.width : (currentLineWidth + gapX + b.width);
            if (currentLine.length > 0 && neededW > maxAvailW) {
              lines.push({ children: currentLine, bounds: currentLineBounds });
              currentLine = [child];
              currentLineBounds = [b];
              currentLineWidth = b.width;
            } else {
              currentLine.push(child);
              currentLineBounds.push(b);
              currentLineWidth = neededW;
            }
          });
          if (currentLine.length > 0) {
            lines.push({ children: currentLine, bounds: currentLineBounds });
          }
        } else {
          const childBoundsList = activeChildren.map((child) => this.computeNodeGeometry(child, doc, context, result, 0, 0));
          lines.push({ children: activeChildren, bounds: childBoundsList });
        }

        // Step 2: Calculate Hug Dimensions
        let maxLineWidth = 0;
        let totalLinesHeight = 0;
        const lineMetrics = lines.map((line) => {
          const totalChildW = line.bounds.reduce((sum, b) => sum + b.width, 0);
          const lineW = totalChildW + Math.max(0, line.children.length - 1) * gapX;
          const lineH = Math.max(0, ...line.bounds.map((b) => b.height));
          maxLineWidth = Math.max(maxLineWidth, lineW);
          totalLinesHeight += lineH;
          return { totalChildW, lineW, lineH };
        });
        totalLinesHeight += Math.max(0, lines.length - 1) * gapY;

        const hugWidth = maxLineWidth + normPadding.left + normPadding.right;
        const hugHeight = totalLinesHeight + normPadding.top + normPadding.bottom;

        if (effectiveWidthMode === "hug") {
          width = activeChildren.length > 0 ? hugWidth : (node.width || 320);
        } else if (effectiveWidthMode !== "fill") {
          if (activeChildren.length > 0 && hugWidth > width) {
            width = hugWidth;
          }
        }

        if (effectiveHeightMode === "hug") {
          height = activeChildren.length > 0 ? hugHeight : (node.height || 240);
        } else if (effectiveHeightMode !== "fill") {
          if (activeChildren.length > 0 && hugHeight > height) {
            height = hugHeight;
          }
        }

        const containerContentW = Math.max(maxLineWidth, width - normPadding.left - normPadding.right);

        // Step 3: Placement Pass with Justify, Align & Fill Mode
        let lineStartY = absY + normPadding.top;

        lines.forEach((line, lineIdx) => {
          let lineChildren = isRowReverse ? [...line.children].reverse() : line.children;
          let lineBounds = isRowReverse ? [...line.bounds].reverse() : line.bounds;

          // Flex-Fill Distribution along Row
          const fillChildren = lineChildren.filter(c => {
            const wm = c.layout?.constraints?.widthMode || (c as any).widthMode;
            return wm === "fill";
          });

          if (fillChildren.length > 0 && effectiveWidthMode !== "hug" && containerContentW > 0) {
            const nonFillWidth = lineChildren.reduce((sum, c, idx) => {
              const wm = c.layout?.constraints?.widthMode || (c as any).widthMode;
              return wm === "fill" ? sum : sum + lineBounds[idx].width;
            }, 0);
            const totalGaps = Math.max(0, lineChildren.length - 1) * gapX;
            const remainingForFill = Math.max(0, containerContentW - nonFillWidth - totalGaps);
            const totalWeight = fillChildren.reduce((sum, c) => sum + ((c.layout as any)?.flexWeight || 1), 0);

            lineChildren.forEach((child, cIdx) => {
              const wm = child.layout?.constraints?.widthMode || (child as any).widthMode;
              if (wm === "fill") {
                const weight = (child.layout as any)?.flexWeight || 1;
                const allocatedW = Math.max(0, Math.floor(remainingForFill * (weight / totalWeight)));
                child.width = allocatedW;
                lineBounds[cIdx] = this.computeNodeGeometry(child, doc, context, result, 0, 0);
                lineBounds[cIdx].width = allocatedW;
              }
            });
          }

          const totalChildW = lineBounds.reduce((sum, b) => sum + b.width, 0);
          const currentLineW = totalChildW + Math.max(0, lineChildren.length - 1) * gapX;
          const currentLineH = Math.max(0, ...lineBounds.map((b) => b.height));
          const N = lineChildren.length;
          const remainingSpaceX = containerContentW - currentLineW;

          let startX = absX + normPadding.left;
          let itemGapX = gapX;

          if (justify === "center") {
            startX += Math.max(0, remainingSpaceX) / 2;
          } else if (justify === "flex-end" || justify === "end") {
            startX += Math.max(0, remainingSpaceX);
          } else if (justify === "space-between" && N > 1) {
            itemGapX = gapX + Math.max(0, remainingSpaceX) / (N - 1);
          } else if (justify === "space-around" && N > 0) {
            const spacing = Math.max(0, containerContentW - totalChildW) / N;
            startX += spacing / 2;
            itemGapX = spacing;
          } else if (justify === "space-evenly" && N > 0) {
            const spacing = Math.max(0, containerContentW - totalChildW) / (N + 1);
            startX += spacing;
            itemGapX = spacing;
          }

          let currentChildX = startX;
          lineChildren.forEach((child, cIdx) => {
            const b = lineBounds[cIdx];
            let childY = lineStartY;
            let childHeight = b.height;

            if (align === "center") {
              childY = lineStartY + (currentLineH - b.height) / 2;
            } else if (align === "flex-end" || align === "end") {
              childY = lineStartY + (currentLineH - b.height);
            } else if (align === "stretch") {
              const hm = child.layout?.constraints?.heightMode || (child as any).heightMode;
              if (hm !== "fixed") {
                childHeight = currentLineH;
              }
            }

            const placed = this.computeNodeGeometry(
              child,
              doc,
              context,
              result,
              Math.round(currentChildX),
              Math.round(childY),
              true
            );
            if (align === "stretch" && childHeight !== b.height) {
              placed.height = childHeight;
              result[child.id] = placed;
            }
            currentChildX += b.width + itemGapX;
          });

          lineStartY += currentLineH + gapY;
        });
      } else if (isColumn) {
        // Step 1: Measure pass
        let activeColChildren = isColReverse ? [...activeChildren].reverse() : activeChildren;
        let childBoundsList = activeColChildren.map((child) => this.computeNodeGeometry(child, doc, context, result, 0, 0));
        
        let totalChildH = childBoundsList.reduce((sum, b) => sum + b.height, 0);
        let maxChildW = Math.max(0, ...childBoundsList.map((b) => b.width));
        let totalContentH = totalChildH + Math.max(0, activeColChildren.length - 1) * gapY;

        const hugWidth = maxChildW + normPadding.left + normPadding.right;
        const hugHeight = totalContentH + normPadding.top + normPadding.bottom;

        if (effectiveWidthMode === "hug") {
          width = activeColChildren.length > 0 ? hugWidth : (node.width || 320);
        } else if (effectiveWidthMode !== "fill") {
          if (activeColChildren.length > 0 && hugWidth > width) {
            width = hugWidth;
          }
        }

        if (effectiveHeightMode === "hug") {
          height = activeColChildren.length > 0 ? hugHeight : (node.height || 240);
        } else if (effectiveHeightMode !== "fill") {
          if (activeColChildren.length > 0 && hugHeight > height) {
            height = hugHeight;
          }
        }

        const containerContentW = Math.max(maxChildW, width - normPadding.left - normPadding.right);
        const containerContentH = Math.max(totalContentH, height - normPadding.top - normPadding.bottom);

        // Flex-Fill Distribution along Column
        const fillColChildren = activeColChildren.filter(c => {
          const hm = c.layout?.constraints?.heightMode || (c as any).heightMode;
          return hm === "fill";
        });

        if (fillColChildren.length > 0 && effectiveHeightMode !== "hug" && containerContentH > 0) {
          const nonFillHeight = activeColChildren.reduce((sum, c, idx) => {
            const hm = c.layout?.constraints?.heightMode || (c as any).heightMode;
            return hm === "fill" ? sum : sum + childBoundsList[idx].height;
          }, 0);
          const totalGaps = Math.max(0, activeColChildren.length - 1) * gapY;
          const remainingForFill = Math.max(0, containerContentH - nonFillHeight - totalGaps);
          const totalWeight = fillColChildren.reduce((sum, c) => sum + ((c.layout as any)?.flexWeight || 1), 0);

          activeColChildren.forEach((child, cIdx) => {
            const hm = child.layout?.constraints?.heightMode || (child as any).heightMode;
            if (hm === "fill") {
              const weight = (child.layout as any)?.flexWeight || 1;
              const allocatedH = Math.max(0, Math.floor(remainingForFill * (weight / totalWeight)));
              child.height = allocatedH;
              childBoundsList[cIdx] = this.computeNodeGeometry(child, doc, context, result, 0, 0);
              childBoundsList[cIdx].height = allocatedH;
            }
          });

          totalChildH = childBoundsList.reduce((sum, b) => sum + b.height, 0);
          totalContentH = totalChildH + Math.max(0, activeColChildren.length - 1) * gapY;
        }

        // Step 2: Placement Pass with Justify (Y) & Align (X)
        const N = activeColChildren.length;
        const remainingSpaceY = containerContentH - totalContentH;

        let startY = absY + normPadding.top;
        let itemGapY = gapY;

        if (justify === "center") {
          startY += Math.max(0, remainingSpaceY) / 2;
        } else if (justify === "flex-end" || justify === "end") {
          startY += Math.max(0, remainingSpaceY);
        } else if (justify === "space-between" && N > 1) {
          itemGapY = gapY + Math.max(0, remainingSpaceY) / (N - 1);
        } else if (justify === "space-around" && N > 0) {
          const spacing = Math.max(0, containerContentH - totalChildH) / N;
          startY += spacing / 2;
          itemGapY = spacing;
        } else if (justify === "space-evenly" && N > 0) {
          const spacing = Math.max(0, containerContentH - totalChildH) / (N + 1);
          startY += spacing;
          itemGapY = spacing;
        }

        let currentChildY = startY;
        activeColChildren.forEach((child, cIdx) => {
          const b = childBoundsList[cIdx];
          let childX = absX + normPadding.left;
          let childWidth = b.width;

          if (align === "center") {
            childX = absX + normPadding.left + (containerContentW - b.width) / 2;
          } else if (align === "flex-end" || align === "end") {
            childX = absX + normPadding.left + (containerContentW - b.width);
          } else if (align === "stretch") {
            const wm = child.layout?.constraints?.widthMode || (child as any).widthMode;
            if (wm !== "fixed") {
              childWidth = containerContentW;
            }
          }

          const placed = this.computeNodeGeometry(
            child,
            doc,
            context,
            result,
            Math.round(childX),
            Math.round(currentChildY),
            true
          );
          if (align === "stretch" && childWidth !== b.width) {
            placed.width = childWidth;
            result[child.id] = placed;
          }
          currentChildY += b.height + itemGapY;
        });
      } else if (rawMode === "grid") {
        const columns = Math.max(1, node.layout?.gridColumns || 2);
        const availW = Math.max(10, width - normPadding.left - normPadding.right - (columns - 1) * gapX);
        const colWidth = Math.floor(availW / columns);

        let col = 0;
        let rowX = absX + normPadding.left;
        let rowY = absY + normPadding.top;
        let rowMaxH = 0;
        let totalGridMaxX = absX + normPadding.left;

        activeChildren.forEach((child) => {
          const childBounds = this.computeNodeGeometry(
            child,
            doc,
            context,
            result,
            rowX,
            rowY,
            true
          );

          rowMaxH = Math.max(rowMaxH, childBounds.height);
          totalGridMaxX = Math.max(totalGridMaxX, rowX + childBounds.width);

          col++;
          if (col >= columns) {
            col = 0;
            rowX = absX + normPadding.left;
            rowY += rowMaxH + gapY;
            rowMaxH = 0;
          } else {
            rowX += colWidth + gapX;
          }
        });

        const totalChildrenHeight = (rowMaxH > 0 ? rowY + rowMaxH : rowY - gapY) - absY + normPadding.bottom;
        const totalChildrenWidth = totalGridMaxX - absX + normPadding.right;

        if (effectiveWidthMode === "hug") width = totalChildrenWidth;
        if (effectiveHeightMode === "hug") height = totalChildrenHeight;
      } else {
        // Mode === "none"
        let maxRight = absX + normPadding.left;
        let maxBottom = absY + normPadding.top;

        activeChildren.forEach((child) => {
          const childBounds = this.computeNodeGeometry(child, doc, context, result, absX + normPadding.left, absY + normPadding.top);
          maxRight = Math.max(maxRight, childBounds.x + childBounds.width);
          maxBottom = Math.max(maxBottom, childBounds.y + childBounds.height);
        });

        if (effectiveWidthMode === "hug") {
          width = maxRight - absX + normPadding.right;
        }
        if (effectiveHeightMode === "hug") {
          height = maxBottom - absY + normPadding.bottom;
        }
      }
    }

    // 4. Process Repeater Nodes if node.type === "repeater"
    if (node.type === "repeater") {
      const repeater = node as any;
      const datasetPath = repeater.datasetBinding || "";
      const rawKey = datasetPath.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();
      const dataset = context[rawKey] || dataBindingEngine.evaluateExpression(datasetPath, context);
      const items = Array.isArray(dataset) ? dataset : [];
      const visibleItems = typeof repeater.maxItems === "number" && repeater.maxItems >= 0
        ? items.slice(0, repeater.maxItems)
        : items;

      const itemTemplate = repeater.itemTemplate;
      const gapX = typeof node.layout?.gap === "object" ? ((node.layout.gap as any).col ?? (node.layout.gap as any).x ?? 0) : (node.layout?.gap || 0);
      const gapY = typeof node.layout?.gap === "object" ? ((node.layout.gap as any).row ?? (node.layout.gap as any).y ?? 0) : (node.layout?.gap || 0);
      const direction = repeater.direction || "vertical";
      const gap = direction === "horizontal" ? gapX : gapY;

      if (itemTemplate) {
        let currentX = absX + normPadding.left;
        let currentY = absY + normPadding.top;
        let maxItemWidth = 0;
        let maxItemHeight = 0;

        const itemCtxKey = repeater.itemContextKey || "item";
        const indexCtxKey = repeater.indexContextKey || "index";

        visibleItems.forEach((item, index) => {
          const itemContext = {
            ...context,
            item,
            index,
            [itemCtxKey]: item,
            [indexCtxKey]: index,
          };

          const itemNode = JSON.parse(JSON.stringify(itemTemplate));
          const itemKey = repeater.keyField && item && item[repeater.keyField] !== undefined
            ? String(item[repeater.keyField])
            : `${index}`;
          const itemPrefix = `${node.id}-item-${itemKey}`;
          itemNode.id = itemPrefix;

          const prefixNested = (n: SceneNode) => {
            n.id = `${itemPrefix}-${n.id}`;
            if ("children" in n && Array.isArray((n as any).children)) {
              (n as any).children.forEach(prefixNested);
            }
          };
          if ("children" in itemNode && Array.isArray(itemNode.children)) {
            itemNode.children.forEach(prefixNested);
          }

          const itemBounds = this.computeNodeGeometry(
            itemNode,
            doc,
            itemContext,
            result,
            direction === "horizontal" ? currentX : absX + normPadding.left,
            direction === "vertical" ? currentY : absY + normPadding.top
          );

          if (direction === "horizontal") {
            currentX += itemBounds.width + gap;
            maxItemHeight = Math.max(maxItemHeight, itemBounds.height);
          } else {
            currentY += itemBounds.height + gap;
            maxItemWidth = Math.max(maxItemWidth, itemBounds.width);
          }
        });

        if (direction === "horizontal") {
          const totalWidth = visibleItems.length > 0 ? currentX - absX - gap + normPadding.right : normPadding.left + normPadding.right;
          const totalHeight = maxItemHeight + normPadding.top + normPadding.bottom;
          if (node.layout?.constraints?.widthMode === "hug") width = totalWidth;
          if (node.layout?.constraints?.heightMode === "hug") height = totalHeight;
        } else {
          const totalHeight = visibleItems.length > 0 ? currentY - absY - gap + normPadding.bottom : normPadding.top + normPadding.bottom;
          const totalWidth = maxItemWidth + normPadding.left + normPadding.right;
          if (node.layout?.constraints?.widthMode === "hug") width = totalWidth;
          if (node.layout?.constraints?.heightMode === "hug") height = totalHeight;
        }
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
