import type { SceneNode, OverlayDocument } from "../../overlayDocumentSchema.js";

export interface AlignmentGuide {
  type: "horizontal" | "vertical";
  position: number; // px coordinate on canvas
}

/** Spatial snap result for canvas node positioning (x/y/alignment guides). */
export interface CanvasSnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
}

export class SnapEngine {
  /**
   * Calculate snapped position and active alignment guides for a moving node
   */
  public calculateSnap(
    movingNode: { x: number; y: number; width: number; height: number },
    otherNodes: SceneNode[],
    canvasWidth = 1280,
    canvasHeight = 720,
    threshold = 6
  ): CanvasSnapResult {
    let snappedX = movingNode.x;
    let snappedY = movingNode.y;
    const guides: AlignmentGuide[] = [];

    const nodeLeft = movingNode.x;
    const nodeCenter = movingNode.x + movingNode.width / 2;
    const nodeRight = movingNode.x + movingNode.width;

    const nodeTop = movingNode.y;
    const nodeMiddle = movingNode.y + movingNode.height / 2;
    const nodeBottom = movingNode.y + movingNode.height;

    // 1. Canvas Boundary & Safe Title Margin Snapping (5% safe area)
    const safeMarginX = Math.round(canvasWidth * 0.05);
    const safeMarginY = Math.round(canvasHeight * 0.05);
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    // Center X & Y
    if (Math.abs(nodeCenter - canvasCenterX) < threshold) {
      snappedX = canvasCenterX - movingNode.width / 2;
      guides.push({ type: "vertical", position: canvasCenterX });
    }
    if (Math.abs(nodeMiddle - canvasCenterY) < threshold) {
      snappedY = canvasCenterY - movingNode.height / 2;
      guides.push({ type: "horizontal", position: canvasCenterY });
    }

    // Canvas Edges & Safe Margins
    if (Math.abs(nodeLeft - safeMarginX) < threshold) {
      snappedX = safeMarginX;
      guides.push({ type: "vertical", position: safeMarginX });
    } else if (Math.abs(nodeRight - (canvasWidth - safeMarginX)) < threshold) {
      snappedX = canvasWidth - safeMarginX - movingNode.width;
      guides.push({ type: "vertical", position: canvasWidth - safeMarginX });
    }

    if (Math.abs(nodeTop - safeMarginY) < threshold) {
      snappedY = safeMarginY;
      guides.push({ type: "horizontal", position: safeMarginY });
    } else if (Math.abs(nodeBottom - (canvasHeight - safeMarginY)) < threshold) {
      snappedY = canvasHeight - safeMarginY - movingNode.height;
      guides.push({ type: "horizontal", position: canvasHeight - safeMarginY });
    }

    // 2. Alignment relative to other nodes on canvas
    for (const other of otherNodes) {
      const otherX = other.x;
      const otherY = other.y;
      const otherW = other.width;
      const otherH = other.height;

      const otherCenter = otherX + otherW / 2;
      const otherMiddle = otherY + otherH / 2;

      // Fast proximity test: skip nodes whose edges/centers are beyond snap threshold range on both axes
      const minXDist = Math.min(
        Math.abs(nodeLeft - otherX),
        Math.abs(nodeCenter - otherCenter),
        Math.abs(nodeRight - (otherX + otherW))
      );
      const minYDist = Math.min(
        Math.abs(nodeTop - otherY),
        Math.abs(nodeMiddle - otherMiddle),
        Math.abs(nodeBottom - (otherY + otherH))
      );

      if (minXDist >= threshold && minYDist >= threshold) {
        continue;
      }

      // X Alignments (Left, Center, Right)
      if (Math.abs(nodeLeft - otherX) < threshold) {
        snappedX = otherX;
        guides.push({ type: "vertical", position: otherX });
      } else if (Math.abs(nodeCenter - otherCenter) < threshold) {
        snappedX = otherCenter - movingNode.width / 2;
        guides.push({ type: "vertical", position: otherCenter });
      } else if (Math.abs(nodeRight - (otherX + otherW)) < threshold) {
        snappedX = otherX + otherW - movingNode.width;
        guides.push({ type: "vertical", position: otherX + otherW });
      }

      // Y Alignments (Top, Middle, Bottom)
      if (Math.abs(nodeTop - otherY) < threshold) {
        snappedY = otherY;
        guides.push({ type: "horizontal", position: otherY });
      } else if (Math.abs(nodeMiddle - otherMiddle) < threshold) {
        snappedY = otherMiddle - movingNode.height / 2;
        guides.push({ type: "horizontal", position: otherMiddle });
      } else if (Math.abs(nodeBottom - (otherY + otherH)) < threshold) {
        snappedY = otherY + otherH - movingNode.height;
        guides.push({ type: "horizontal", position: otherY + otherH });
      }
    }

    // 3. Equal Gap Spacing Detection (between pairs of other nodes)
    if (otherNodes.length >= 2) {
      const sortedX = [...otherNodes].sort((a, b) => a.x - b.x);
      for (let i = 0; i < sortedX.length - 1; i++) {
        const gap = sortedX[i + 1].x - (sortedX[i].x + sortedX[i].width);
        if (gap > 0) {
          const targetNextX = sortedX[i + 1].x + sortedX[i + 1].width + gap;
          if (Math.abs(nodeLeft - targetNextX) < threshold) {
            snappedX = targetNextX;
            guides.push({ type: "vertical", position: targetNextX });
          }
        }
      }
    }

    return { x: snappedX, y: snappedY, guides } satisfies CanvasSnapResult;
  }
}

export const snapEngine = new SnapEngine();
