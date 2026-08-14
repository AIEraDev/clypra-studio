import { Container, Graphics as PixiGraphics } from "pixi.js";
import type { SceneNode, OverlayDocument } from "./overlayDocumentSchema.js";
import { layoutEngine } from "./layoutEngine.js";

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
    try {
      if (!this.selectionGraphics || this.selectionGraphics.destroyed) {
        this.selectionGraphics = new PixiGraphics();
        this.overlayContainer.removeChildren();
        this.overlayContainer.addChild(this.selectionGraphics);
      }
      this.selectionGraphics.clear();
    } catch {
      return this.overlayContainer;
    }

    const nodesToRender = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);
    if (nodesToRender.length === 0) return this.overlayContainer;

    // Calculate bounding box of selection (using layoutEngine for absolute bounds of nested nodes)
    const layout = layoutEngine.computeLayout(doc);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodesToRender) {
      const cb = layout.nodes[node.id];
      const absX = cb ? cb.x : node.x;
      const absY = cb ? cb.y : node.y;
      const absW = cb ? cb.width : node.width;
      const absH = cb ? cb.height : node.height;

      if (absX < minX) minX = absX;
      if (absY < minY) minY = absY;
      if (absX + absW > maxX) maxX = absX + absW;
      if (absY + absH > maxY) maxY = absY + absH;
    }

    const absW = maxX - minX;
    const absH = maxY - minY;

    const singleNode = nodesToRender.length === 1 ? nodesToRender[0] : null;
    const rotDeg = singleNode ? ((singleNode as any).rotation || (singleNode.style as any)?.rotation || 0) : 0;
    if (singleNode && rotDeg !== 0) {
      const cx = minX + absW / 2;
      const cy = minY + absH / 2;
      this.selectionGraphics.position.set(cx, cy);
      this.selectionGraphics.pivot.set(cx, cy);
      this.selectionGraphics.rotation = (rotDeg * Math.PI) / 180;
    } else {
      this.selectionGraphics.position.set(0, 0);
      this.selectionGraphics.pivot.set(0, 0);
      this.selectionGraphics.rotation = 0;
    }

    // 1. Draw Outer Glow Bounding Box Line
    this.selectionGraphics.roundRect(minX - 5, minY - 5, absW + 10, absH + 10, 6);
    this.selectionGraphics.stroke({ color: 0x7c6fff, width: 1, alpha: 0.35 });

    // 2. Draw Primary Bounding Box Line
    this.selectionGraphics.roundRect(minX - 3, minY - 3, absW + 6, absH + 6, 4);
    if (nodesToRender.length > 1) {
      this.selectionGraphics.stroke({ color: 0x8b5cf6, width: 2, alpha: 0.95 });
    } else {
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 2, alpha: 0.95 });
    }

    // 3. Draw Circular Resize Handle Knobs (4 Corners + 4 Edge Midpoints)
    const handleRadius = Math.min(5, Math.max(3.5, Math.min(absW, absH) * 0.2));
    const handles: { x: number; y: number }[] = [
      { x: minX - 3, y: minY - 3 },                 // tl
      { x: minX + absW / 2, y: minY - 3 },          // t
      { x: minX + absW + 3, y: minY - 3 },          // tr
      { x: minX + absW + 3, y: minY + absH / 2 },   // r
      { x: minX + absW + 3, y: minY + absH + 3 },   // br
      { x: minX + absW / 2, y: minY + absH + 3 },   // b
      { x: minX - 3, y: minY + absH + 3 },          // bl
      { x: minX - 3, y: minY + absH / 2 }           // l
    ];

    for (const h of handles) {
      // Dark halo backdrop for high contrast over any background
      this.selectionGraphics.circle(h.x, h.y, handleRadius + 1.5);
      this.selectionGraphics.fill({ color: 0x09090d, alpha: 0.6 });

      // Solid crisp white handle circle with violet accent border
      this.selectionGraphics.circle(h.x, h.y, handleRadius);
      this.selectionGraphics.fill({ color: 0xffffff });
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 2 });
    }

    // 4. Draw Top Rotation Handle Knob (for single selection)
    if (nodesToRender.length === 1) {
      const rotX = minX + absW / 2;
      const rotY = minY - 28;

      this.selectionGraphics.moveTo(rotX, minY - 3);
      this.selectionGraphics.lineTo(rotX, rotY);
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 1.5, alpha: 0.8 });

      this.selectionGraphics.circle(rotX, rotY, 7);
      this.selectionGraphics.fill({ color: 0x12121a });
      this.selectionGraphics.stroke({ color: 0x7c6fff, width: 2 });

      this.selectionGraphics.circle(rotX, rotY, 3);
      this.selectionGraphics.fill({ color: 0x7c6fff });
    }

    return this.overlayContainer;
  }

  /**
   * Clear the selection overlay
   */
  public clearSelection(): void {
    try {
      if (this.selectionGraphics && !this.selectionGraphics.destroyed) {
        this.selectionGraphics.clear();
      }
    } catch {
      // Safe fallback if context lost
    }
  }
}

export const pixiSelectionOverlay = new PixiSelectionOverlay();
