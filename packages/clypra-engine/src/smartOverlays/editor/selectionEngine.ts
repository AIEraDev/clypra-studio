import type { SceneNode, OverlayDocument, FrameNode } from "../overlayDocumentSchema.js";
import type { ComputedNodeBounds } from "../layoutEngine.js";

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: string;
}

export class SelectionEngine {
  private selectedIds: Set<string> = new Set();
  private focusedId: string | null = null;

  /**
   * Set single selected node.
   */
  public select(nodeId: string, doc?: OverlayDocument): void {
    if (doc) {
      const node = this.findNodeById(doc, nodeId);
      if (node && (node as any).locked) return; // Cannot select locked node directly
    }
    this.selectedIds = new Set([nodeId]);
    this.focusedId = nodeId;
  }

  /**
   * Replace selection with multiple node IDs.
   */
  public multiSelect(nodeIds: string[], doc?: OverlayDocument): void {
    const validIds = nodeIds.filter((id) => {
      if (!doc) return true;
      const node = this.findNodeById(doc, id);
      return !node || !(node as any).locked;
    });
    this.selectedIds = new Set(validIds);
    this.focusedId = validIds.length > 0 ? validIds[validIds.length - 1] : null;
  }

  /**
   * Toggle a node's selection state (Cmd/Ctrl + Click).
   */
  public toggleSelect(nodeId: string, doc?: OverlayDocument): void {
    if (doc) {
      const node = this.findNodeById(doc, nodeId);
      if (node && (node as any).locked) return;
    }

    if (this.selectedIds.has(nodeId)) {
      this.selectedIds.delete(nodeId);
      if (this.focusedId === nodeId) {
        const remaining = Array.from(this.selectedIds);
        this.focusedId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
      }
    } else {
      this.selectedIds.add(nodeId);
      this.focusedId = nodeId;
    }
  }

  /**
   * Select all unlocked nodes on the canvas.
   */
  public selectAll(doc: OverlayDocument): void {
    const unlockedIds: string[] = [];
    const traverse = (nodes: SceneNode[]) => {
      for (const node of nodes) {
        if (!(node as any).locked && node.visible !== false) {
          unlockedIds.push(node.id);
        }
      }
    };
    traverse(doc.nodes);
    this.multiSelect(unlockedIds, doc);
  }

  /**
   * Clear all active selections.
   */
  public clear(): void {
    this.selectedIds.clear();
    this.focusedId = null;
  }

  public getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  public getFocusedId(): string | null {
    return this.focusedId;
  }

  public isSelected(nodeId: string): boolean {
    return this.selectedIds.has(nodeId);
  }

  /**
   * Retrieve active selected SceneNodes from document.
   */
  public getSelectedNodes(doc: OverlayDocument): SceneNode[] {
    const result: SceneNode[] = [];
    for (const id of this.selectedIds) {
      const node = this.findNodeById(doc, id);
      if (node) result.push(node);
    }
    return result;
  }

  /**
   * Drill down into container child nodes (Double click interaction).
   */
  public drillDown(doc: OverlayDocument, containerId: string, clickPoint?: { x: number; y: number }): boolean {
    const container = this.findNodeById(doc, containerId) as FrameNode;
    if (!container || !Array.isArray(container.children) || container.children.length === 0) {
      return false;
    }

    // If click coordinates are provided, find intersecting child
    if (clickPoint) {
      for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i];
        if ((child as any).locked) continue;
        if (
          clickPoint.x >= child.x &&
          clickPoint.x <= child.x + child.width &&
          clickPoint.y >= child.y &&
          clickPoint.y <= child.y + child.height
        ) {
          this.select(child.id, doc);
          return true;
        }
      }
    }

    // Default to first unlocked child
    const firstUnlocked = container.children.find((c) => !(c as any).locked);
    if (firstUnlocked) {
      this.select(firstUnlocked.id, doc);
      return true;
    }

    return false;
  }

  /**
   * Select parent container of the currently selected child (Esc key or click outside).
   */
  public selectParent(doc: OverlayDocument, childId: string): boolean {
    const parent = this.findParentNode(doc, childId);
    if (parent) {
      this.select(parent.id, doc);
      return true;
    }
    return false;
  }

  /**
   * Generate breadcrumb hierarchy path from root document down to selected node.
   */
  public getBreadcrumbs(doc: OverlayDocument, targetId: string): BreadcrumbItem[] {
    const path: BreadcrumbItem[] = [];

    const findPath = (current: SceneNode, trail: BreadcrumbItem[]): boolean => {
      const currentTrail = [...trail, { id: current.id, name: current.name || current.id, type: current.type }];
      if (current.id === targetId) {
        path.push(...currentTrail);
        return true;
      }
      if ("children" in current && Array.isArray((current as any).children)) {
        for (const child of (current as any).children) {
          if (findPath(child, currentTrail)) return true;
        }
      }
      return false;
    };

    for (const rootNode of doc.nodes) {
      if (findPath(rootNode, [])) break;
    }

    return path;
  }

  /**
   * Calculate collective bounding box of all selected nodes.
   */
  public getSelectionBounds(
    doc: OverlayDocument,
    layoutBounds: Record<string, ComputedNodeBounds>
  ): ComputedNodeBounds | null {
    if (this.selectedIds.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const id of this.selectedIds) {
      const b = layoutBounds[id];
      if (b) {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
      }
    }

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  }

  // --- Helpers ---
  private findNodeById(doc: OverlayDocument, id: string): SceneNode | null {
    const search = (nodes: SceneNode[]): SceneNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if ("children" in node && Array.isArray((node as any).children)) {
          const found = search((node as any).children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(doc.nodes);
  }

  private findParentNode(doc: OverlayDocument, childId: string): SceneNode | null {
    const search = (parent: SceneNode): SceneNode | null => {
      if ("children" in parent && Array.isArray((parent as any).children)) {
        for (const child of (parent as any).children) {
          if (child.id === childId) return parent;
          const found = search(child);
          if (found) return found;
        }
      }
      return null;
    };

    for (const root of doc.nodes) {
      const found = search(root);
      if (found) return found;
    }
    return null;
  }
}

export const selectionEngine = new SelectionEngine();
