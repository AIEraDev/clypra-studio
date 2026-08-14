import type { SceneNode } from "../overlayDocumentSchema.js";

export interface SmartAlignmentGuide {
  type: "horizontal" | "vertical";
  position: number; // coordinate on canvas (px)
  label?: string; // Optional label e.g. "Center", "Gap 16px"
  start?: number; // Visual span start
  end?: number; // Visual span end
}

export interface SmartSnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  guides: SmartAlignmentGuide[];
}

export class SmartGuideEngine {
  /**
   * Calculate snapped position and active visual guides for a moving node bounding box.
   */
  public static calculateSnap(
    moving: { x: number; y: number; width: number; height: number },
    otherNodes: SceneNode[],
    canvasWidth = 1920,
    canvasHeight = 1080,
    threshold = 6
  ): SmartSnapResult {
    let finalX = moving.x;
    let finalY = moving.y;
    let snappedX = false;
    let snappedY = false;
    const guides: SmartAlignmentGuide[] = [];

    const left = moving.x;
    const centerX = moving.x + moving.width / 2;
    const right = moving.x + moving.width;

    const top = moving.y;
    const centerY = moving.y + moving.height / 2;
    const bottom = moving.y + moving.height;

    // 1. Canvas Center Snapping
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    if (Math.abs(centerX - canvasCenterX) <= threshold) {
      finalX = Math.round(canvasCenterX - moving.width / 2);
      snappedX = true;
      guides.push({ type: "vertical", position: canvasCenterX, label: "Canvas Center X" });
    }

    if (Math.abs(centerY - canvasCenterY) <= threshold) {
      finalY = Math.round(canvasCenterY - moving.height / 2);
      snappedY = true;
      guides.push({ type: "horizontal", position: canvasCenterY, label: "Canvas Center Y" });
    }

    // 2. Safe Margins (5% broadcast safe title margin)
    const safeMarginX = Math.round(canvasWidth * 0.05);
    const safeMarginY = Math.round(canvasHeight * 0.05);

    if (!snappedX) {
      if (Math.abs(left - safeMarginX) <= threshold) {
        finalX = safeMarginX;
        snappedX = true;
        guides.push({ type: "vertical", position: safeMarginX, label: "Safe Margin Left" });
      } else if (Math.abs(right - (canvasWidth - safeMarginX)) <= threshold) {
        finalX = canvasWidth - safeMarginX - moving.width;
        snappedX = true;
        guides.push({ type: "vertical", position: canvasWidth - safeMarginX, label: "Safe Margin Right" });
      }
    }

    if (!snappedY) {
      if (Math.abs(top - safeMarginY) <= threshold) {
        finalY = safeMarginY;
        snappedY = true;
        guides.push({ type: "horizontal", position: safeMarginY, label: "Safe Margin Top" });
      } else if (Math.abs(bottom - (canvasHeight - safeMarginY)) <= threshold) {
        finalY = canvasHeight - safeMarginY - moving.height;
        snappedY = true;
        guides.push({ type: "horizontal", position: canvasHeight - safeMarginY, label: "Safe Margin Bottom" });
      }
    }

    // 3. Sibling Node Alignment Snapping
    for (const other of otherNodes) {
      const oLeft = other.x;
      const oCenterX = other.x + other.width / 2;
      const oRight = other.x + other.width;

      const oTop = other.y;
      const oCenterY = other.y + other.height / 2;
      const oBottom = other.y + other.height;

      // X Alignments
      if (!snappedX) {
        if (Math.abs(left - oLeft) <= threshold) {
          finalX = oLeft;
          snappedX = true;
          guides.push({ type: "vertical", position: oLeft, label: "Align Left" });
        } else if (Math.abs(centerX - oCenterX) <= threshold) {
          finalX = Math.round(oCenterX - moving.width / 2);
          snappedX = true;
          guides.push({ type: "vertical", position: oCenterX, label: "Align Center X" });
        } else if (Math.abs(right - oRight) <= threshold) {
          finalX = Math.round(oRight - moving.width);
          snappedX = true;
          guides.push({ type: "vertical", position: oRight, label: "Align Right" });
        } else if (Math.abs(left - oRight) <= threshold) {
          finalX = oRight;
          snappedX = true;
          guides.push({ type: "vertical", position: oRight, label: "Edge Flush Right" });
        } else if (Math.abs(right - oLeft) <= threshold) {
          finalX = Math.round(oLeft - moving.width);
          snappedX = true;
          guides.push({ type: "vertical", position: oLeft, label: "Edge Flush Left" });
        }
      }

      // Y Alignments
      if (!snappedY) {
        if (Math.abs(top - oTop) <= threshold) {
          finalY = oTop;
          snappedY = true;
          guides.push({ type: "horizontal", position: oTop, label: "Align Top" });
        } else if (Math.abs(centerY - oCenterY) <= threshold) {
          finalY = Math.round(oCenterY - moving.height / 2);
          snappedY = true;
          guides.push({ type: "horizontal", position: oCenterY, label: "Align Center Y" });
        } else if (Math.abs(bottom - oBottom) <= threshold) {
          finalY = Math.round(oBottom - moving.height);
          snappedY = true;
          guides.push({ type: "horizontal", position: oBottom, label: "Align Bottom" });
        } else if (Math.abs(top - oBottom) <= threshold) {
          finalY = oBottom;
          snappedY = true;
          guides.push({ type: "horizontal", position: oBottom, label: "Edge Flush Bottom" });
        } else if (Math.abs(bottom - oTop) <= threshold) {
          finalY = Math.round(oTop - moving.height);
          snappedY = true;
          guides.push({ type: "horizontal", position: oTop, label: "Edge Flush Top" });
        }
      }
    }

    return {
      x: finalX,
      y: finalY,
      snappedX,
      snappedY,
      guides,
    };
  }
}
