import type { SceneNode } from "../overlayDocumentSchema.js";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface ResizeOptions {
  lockAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export class TransformEngine {
  /**
   * Translate node coordinates by delta (dx, dy).
   */
  public static moveNode<T extends SceneNode>(node: T, dx: number, dy: number): T {
    return {
      ...node,
      x: Math.round(node.x + dx),
      y: Math.round(node.y + dy),
    };
  }

  /**
   * Keyboard directional nudge (1px step or 10px shift-step).
   */
  public static nudgeNode<T extends SceneNode>(
    node: T,
    direction: "up" | "down" | "left" | "right",
    amount = 1
  ): T {
    const dx = direction === "left" ? -amount : direction === "right" ? amount : 0;
    const dy = direction === "up" ? -amount : direction === "down" ? amount : 0;
    return this.moveNode(node, dx, dy);
  }

  /**
   * Resize a node from an 8-direction handle knob.
   */
  public static resizeNode<T extends SceneNode>(
    node: T,
    handle: ResizeHandle,
    dx: number,
    dy: number,
    options: ResizeOptions = {}
  ): T {
    const { lockAspectRatio = false, minWidth = 10, minHeight = 10 } = options;

    let newX = node.x;
    let newY = node.y;
    let newWidth = node.width;
    let newHeight = node.height;
    const initialAspect = node.width > 0 && node.height > 0 ? node.width / node.height : 1.0;

    switch (handle) {
      case "e":
        newWidth = Math.max(minWidth, node.width + dx);
        if (lockAspectRatio) newHeight = Math.max(minHeight, newWidth / initialAspect);
        break;

      case "w": {
        const potentialW = node.width - dx;
        if (potentialW >= minWidth) {
          newWidth = potentialW;
          newX = node.x + dx;
        } else {
          newWidth = minWidth;
          newX = node.x + (node.width - minWidth);
        }
        if (lockAspectRatio) newHeight = Math.max(minHeight, newWidth / initialAspect);
        break;
      }

      case "s":
        newHeight = Math.max(minHeight, node.height + dy);
        if (lockAspectRatio) newWidth = Math.max(minWidth, newHeight * initialAspect);
        break;

      case "n": {
        const potentialH = node.height - dy;
        if (potentialH >= minHeight) {
          newHeight = potentialH;
          newY = node.y + dy;
        } else {
          newHeight = minHeight;
          newY = node.y + (node.height - minHeight);
        }
        if (lockAspectRatio) newWidth = Math.max(minWidth, newHeight * initialAspect);
        break;
      }

      case "se":
        newWidth = Math.max(minWidth, node.width + dx);
        newHeight = Math.max(minHeight, node.height + dy);
        if (lockAspectRatio) {
          const scale = Math.max(newWidth / node.width, newHeight / node.height);
          newWidth = Math.max(minWidth, node.width * scale);
          newHeight = Math.max(minHeight, node.height * scale);
        }
        break;

      case "nw": {
        const potW = node.width - dx;
        const potH = node.height - dy;
        if (potW >= minWidth) {
          newWidth = potW;
          newX = node.x + dx;
        }
        if (potH >= minHeight) {
          newHeight = potH;
          newY = node.y + dy;
        }
        if (lockAspectRatio) {
          const scale = Math.max(newWidth / node.width, newHeight / node.height);
          newWidth = Math.max(minWidth, node.width * scale);
          newHeight = Math.max(minHeight, node.height * scale);
        }
        break;
      }

      case "ne": {
        newWidth = Math.max(minWidth, node.width + dx);
        const potH = node.height - dy;
        if (potH >= minHeight) {
          newHeight = potH;
          newY = node.y + dy;
        }
        if (lockAspectRatio) {
          newHeight = Math.max(minHeight, newWidth / initialAspect);
        }
        break;
      }

      case "sw": {
        const potW = node.width - dx;
        if (potW >= minWidth) {
          newWidth = potW;
          newX = node.x + dx;
        }
        newHeight = Math.max(minHeight, node.height + dy);
        if (lockAspectRatio) {
          newWidth = Math.max(minWidth, newHeight * initialAspect);
        }
        break;
      }
    }

    return {
      ...node,
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Align multiple nodes relative to each other or canvas boundaries.
   */
  public static alignNodes(
    nodes: SceneNode[],
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
    canvasBounds?: { width: number; height: number }
  ): SceneNode[] {
    if (nodes.length === 0) return [];

    let targetCoord = 0;
    if (canvasBounds) {
      switch (alignment) {
        case "left": targetCoord = 0; break;
        case "center": targetCoord = canvasBounds.width / 2; break;
        case "right": targetCoord = canvasBounds.width; break;
        case "top": targetCoord = 0; break;
        case "middle": targetCoord = canvasBounds.height / 2; break;
        case "bottom": targetCoord = canvasBounds.height; break;
      }
    } else {
      // Relative to selection bounds
      const minX = Math.min(...nodes.map((n) => n.x));
      const maxX = Math.max(...nodes.map((n) => n.x + n.width));
      const minY = Math.min(...nodes.map((n) => n.y));
      const maxY = Math.max(...nodes.map((n) => n.y + n.height));

      switch (alignment) {
        case "left": targetCoord = minX; break;
        case "center": targetCoord = minX + (maxX - minX) / 2; break;
        case "right": targetCoord = maxX; break;
        case "top": targetCoord = minY; break;
        case "middle": targetCoord = minY + (maxY - minY) / 2; break;
        case "bottom": targetCoord = maxY; break;
      }
    }

    return nodes.map((node) => {
      let updatedX = node.x;
      let updatedY = node.y;

      switch (alignment) {
        case "left":
          updatedX = targetCoord;
          break;
        case "center":
          updatedX = Math.round(targetCoord - node.width / 2);
          break;
        case "right":
          updatedX = Math.round(targetCoord - node.width);
          break;
        case "top":
          updatedY = targetCoord;
          break;
        case "middle":
          updatedY = Math.round(targetCoord - node.height / 2);
          break;
        case "bottom":
          updatedY = Math.round(targetCoord - node.height);
          break;
      }

      return { ...node, x: updatedX, y: updatedY };
    });
  }

  /**
   * Distribute multiple nodes evenly along horizontal or vertical axis.
   */
  public static distributeNodes(nodes: SceneNode[], axis: "horizontal" | "vertical"): SceneNode[] {
    if (nodes.length <= 2) return nodes;

    const sorted = [...nodes].sort((a, b) => (axis === "horizontal" ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (axis === "horizontal") {
      const totalSpan = last.x + last.width - first.x;
      const totalNodeWidths = sorted.reduce((sum, n) => sum + n.width, 0);
      const totalGapSpace = totalSpan - totalNodeWidths;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentX = first.x;
      return sorted.map((node, i) => {
        if (i === 0) {
          currentX += node.width + gap;
          return node;
        }
        const updated = { ...node, x: Math.round(currentX) };
        currentX += node.width + gap;
        return updated;
      });
    } else {
      const totalSpan = last.y + last.height - first.y;
      const totalNodeHeights = sorted.reduce((sum, n) => sum + n.height, 0);
      const totalGapSpace = totalSpan - totalNodeHeights;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentY = first.y;
      return sorted.map((node, i) => {
        if (i === 0) {
          currentY += node.height + gap;
          return node;
        }
        const updated = { ...node, y: Math.round(currentY) };
        currentY += node.height + gap;
        return updated;
      });
    }
  }
}
