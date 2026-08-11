import { Container, Graphics as PixiGraphics } from "pixi.js";
import type { SceneNode, OverlayDocument } from "./overlayDocumentSchema.js";

export class PixiSelectionOverlay {
  public overlayContainer: Container;
  private selectionGraphics: PixiGraphics;

  constructor() {
    this.overlayContainer = new Container();
    this.overlayContainer.label = "EditorSelectionOverlayLayer";
    this.selectionGraphics = new PixiGraphics();
    this.overlayContainer.addChild(this.selectionGraphics);
  }

  /**
   * Render selection bounding box, 8 resize handles, and rotation knob for single or multi-selected nodes
   */
  public renderSelection(selectedNode: SceneNode | null, doc: OverlayDocument, selectedNodes: SceneNode[] = []): Container {
    this.selectionGraphics.clear();

    const nodesToRender = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);
    if (nodesToRender.length === 0) return this.overlayContainer;

    // Calculate bounding box of selection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodesToRender) {
      const absX = node.x < 100 ? (node.x / 100) * doc.canvas.width : node.x;
      const absY = node.y < 100 ? (node.y / 100) * doc.canvas.height : node.y;
      const absW = node.width <= 100 ? (node.width / 100) * doc.canvas.width : node.width;
      const absH = node.height <= 100 ? (node.height / 100) * doc.canvas.height : node.height;

      if (absX < minX) minX = absX;
      if (absY < minY) minY = absY;
      if (absX + absW > maxX) maxX = absX + absW;
      if (absY + absH > maxY) maxY = absY + absH;
    }

    const absW = maxX - minX;
    const absH = maxY - minY;

    // 1. Draw Primary Bounding Box Line
    this.selectionGraphics.roundRect(minX - 4, minY - 4, absW + 8, absH + 8, 4);
    this.selectionGraphics.stroke({ color: 0x7c6fff, width: 2, alpha: 0.95 });

    // 2. Draw 8 Resize Handles (4 Corners + 4 Edge Midpoints)
    const handleSize = 8;
    const handles = [
      { x: minX - 4, y: minY - 4 },                 // tl
      { x: minX + absW / 2, y: minY - 4 },          // t
      { x: minX + absW + 4, y: minY - 4 },          // tr
      { x: minX + absW + 4, y: minY + absH / 2 },   // r
      { x: minX + absW + 4, y: minY + absH + 4 },   // br
      { x: minX + absW / 2, y: minY + absH + 4 },   // b
      { x: minX - 4, y: minY + absH + 4 },          // bl
      { x: minX - 4, y: minY + absH / 2 }           // l
    ];

    for (const h of handles) {
      this.selectionGraphics.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      this.selectionGraphics.fill({ color: 0xffffff });
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 1.5 });
    }

    // 3. Draw Top Rotation Handle Knob (for single selection)
    if (nodesToRender.length === 1) {
      const rotX = minX + absW / 2;
      const rotY = minY - 24;

      this.selectionGraphics.moveTo(rotX, minY - 4);
      this.selectionGraphics.lineTo(rotX, rotY);
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 1.5, alpha: 0.8 });

      this.selectionGraphics.circle(rotX, rotY, 5);
      this.selectionGraphics.fill({ color: 0x7c6fff });
    }

    return this.overlayContainer;
  }

  /**
   * Clear the selection overlay
   */
  public clearSelection(): void {
    this.selectionGraphics.clear();
  }
}

export const pixiSelectionOverlay = new PixiSelectionOverlay();
