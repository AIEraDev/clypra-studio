import type { OverlayDocument, SceneNode, FrameNode } from "../overlayDocumentSchema.js";

export type EditorCommandType =
  | "MOVE_NODES"
  | "RESIZE_NODE"
  | "UPDATE_STYLE"
  | "UPDATE_PROP"
  | "ADD_NODE"
  | "DELETE_NODES"
  | "DUPLICATE_NODES"
  | "BATCH";

export interface BaseEditorCommand {
  id?: string;
  type: EditorCommandType;
  description?: string;
  timestamp?: number;
}

export interface MoveNodesCommand extends BaseEditorCommand {
  type: "MOVE_NODES";
  moves: Array<{ nodeId: string; fromX: number; fromY: number; toX: number; toY: number }>;
}

export interface ResizeNodeCommand extends BaseEditorCommand {
  type: "RESIZE_NODE";
  nodeId: string;
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
}

export interface UpdateStyleCommand extends BaseEditorCommand {
  type: "UPDATE_STYLE";
  nodeId: string;
  property: string;
  previousValue: any;
  nextValue: any;
}

export interface UpdatePropCommand extends BaseEditorCommand {
  type: "UPDATE_PROP";
  nodeId: string;
  property: string;
  previousValue: any;
  nextValue: any;
}

export interface EditorAddNodeCommand extends BaseEditorCommand {
  type: "ADD_NODE";
  node: SceneNode;
  parentId?: string;
  index?: number;
}

export interface DeleteNodesCommand extends BaseEditorCommand {
  type: "DELETE_NODES";
  deletedNodes: Array<{ node: SceneNode; parentId?: string; index: number }>;
}

export interface DuplicateNodesCommand extends BaseEditorCommand {
  type: "DUPLICATE_NODES";
  sourceIds: string[];
  createdNodes: SceneNode[];
}

export interface BatchCommand extends BaseEditorCommand {
  type: "BATCH";
  commands: EditorCommand[];
}

export type EditorCommand =
  | MoveNodesCommand
  | ResizeNodeCommand
  | UpdateStyleCommand
  | UpdatePropCommand
  | EditorAddNodeCommand
  | DeleteNodesCommand
  | DuplicateNodesCommand
  | BatchCommand;

export interface EditorExecutionResult {
  nextDoc: OverlayDocument;
  inverseCommand: EditorCommand;
}

export class EditorCommandSystem {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private maxHistory = 100;
  private activeDragSession: { initialPositions: Map<string, { x: number; y: number }> } | null = null;

  /**
   * Execute a command against document, returning updated document and storing inverse in undo stack.
   */
  public execute(doc: OverlayDocument, command: EditorCommand): OverlayDocument {
    const { nextDoc, inverseCommand } = this.applyCommand(doc, command);

    this.undoStack.push(inverseCommand);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Reset redo stack on new action

    return nextDoc;
  }

  /**
   * Undo last executed command.
   */
  public undo(doc: OverlayDocument): OverlayDocument {
    if (this.undoStack.length === 0) return doc;

    const inverseCmd = this.undoStack.pop()!;
    const { nextDoc, inverseCommand: redoCmd } = this.applyCommand(doc, inverseCmd);

    this.redoStack.push(redoCmd);
    return nextDoc;
  }

  /**
   * Redo previously undone command.
   */
  public redo(doc: OverlayDocument): OverlayDocument {
    if (this.redoStack.length === 0) return doc;

    const redoCmd = this.redoStack.pop()!;
    const { nextDoc, inverseCommand: undoCmd } = this.applyCommand(doc, redoCmd);

    this.undoStack.push(undoCmd);
    return nextDoc;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.activeDragSession = null;
  }

  // --- Drag Session Batching ---
  public beginDragSession(nodes: SceneNode[]): void {
    const initialPositions = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      initialPositions.set(node.id, { x: node.x, y: node.y });
    }
    this.activeDragSession = { initialPositions };
  }

  public commitDragSession(doc: OverlayDocument, currentNodes: SceneNode[]): OverlayDocument {
    if (!this.activeDragSession) return doc;

    const moves: Array<{ nodeId: string; fromX: number; fromY: number; toX: number; toY: number }> = [];
    for (const node of currentNodes) {
      const init = this.activeDragSession.initialPositions.get(node.id);
      if (init && (init.x !== node.x || init.y !== node.y)) {
        moves.push({
          nodeId: node.id,
          fromX: init.x,
          fromY: init.y,
          toX: node.x,
          toY: node.y,
        });
      }
    }

    this.activeDragSession = null;
    if (moves.length === 0) return doc;

    const cmd: MoveNodesCommand = { type: "MOVE_NODES", moves };
    return this.execute(doc, cmd);
  }

  // --- Internal Command Application & Inversion ---
  public applyCommand(doc: OverlayDocument, command: EditorCommand): EditorExecutionResult {
    switch (command.type) {
      case "MOVE_NODES": {
        let updatedDoc = { ...doc, nodes: [...doc.nodes] };
        const inverseMoves: Array<{ nodeId: string; fromX: number; fromY: number; toX: number; toY: number }> = [];

        for (const m of command.moves) {
          updatedDoc = this.updateNodeInDoc(updatedDoc, m.nodeId, (node) => ({
            ...node,
            x: m.toX,
            y: m.toY,
          }));
          inverseMoves.push({
            nodeId: m.nodeId,
            fromX: m.toX,
            fromY: m.toY,
            toX: m.fromX,
            toY: m.fromY,
          });
        }

        return {
          nextDoc: updatedDoc,
          inverseCommand: { type: "MOVE_NODES", moves: inverseMoves },
        };
      }

      case "RESIZE_NODE": {
        const nextDoc = this.updateNodeInDoc(doc, command.nodeId, (node) => ({
          ...node,
          x: command.to.x,
          y: command.to.y,
          width: command.to.width,
          height: command.to.height,
        }));

        const inverseCommand: ResizeNodeCommand = {
          type: "RESIZE_NODE",
          nodeId: command.nodeId,
          from: command.to,
          to: command.from,
        };

        return { nextDoc, inverseCommand };
      }

      case "UPDATE_STYLE": {
        const nextDoc = this.updateNodeInDoc(doc, command.nodeId, (node) => ({
          ...node,
          style: {
            ...(node.style || {}),
            [command.property]: command.nextValue,
          },
        }));

        const inverseCommand: UpdateStyleCommand = {
          type: "UPDATE_STYLE",
          nodeId: command.nodeId,
          property: command.property,
          previousValue: command.nextValue,
          nextValue: command.previousValue,
        };

        return { nextDoc, inverseCommand };
      }

      case "UPDATE_PROP": {
        const nextDoc = this.updateNodeInDoc(doc, command.nodeId, (node) => ({
          ...node,
          [command.property]: command.nextValue,
        }));

        const inverseCommand: UpdatePropCommand = {
          type: "UPDATE_PROP",
          nodeId: command.nodeId,
          property: command.property,
          previousValue: command.nextValue,
          nextValue: command.previousValue,
        };

        return { nextDoc, inverseCommand };
      }

      case "ADD_NODE": {
        const nextDoc = this.insertNodeIntoDoc(doc, command.node, command.parentId, command.index);
        const inverseCommand: DeleteNodesCommand = {
          type: "DELETE_NODES",
          deletedNodes: [{ node: command.node, parentId: command.parentId, index: command.index ?? 0 }],
        };
        return { nextDoc, inverseCommand };
      }

      case "DELETE_NODES": {
        let nextDoc = doc;
        for (const item of command.deletedNodes) {
          nextDoc = this.removeNodeFromDoc(nextDoc, item.node.id);
        }

        const inverseCommands: EditorCommand[] = command.deletedNodes.map((item) => ({
          type: "ADD_NODE",
          node: item.node,
          parentId: item.parentId,
          index: item.index,
        }));

        return {
          nextDoc,
          inverseCommand: inverseCommands.length === 1 ? inverseCommands[0] : { type: "BATCH", commands: inverseCommands },
        };
      }

      case "DUPLICATE_NODES": {
        let nextDoc = doc;
        const deletedNodes: Array<{ node: SceneNode; parentId?: string; index: number }> = [];
        for (const created of command.createdNodes) {
          const insertIdx = nextDoc.nodes.length;
          nextDoc = this.insertNodeIntoDoc(nextDoc, created);
          deletedNodes.push({ node: created, index: insertIdx });
        }

        const inverseCommand: DeleteNodesCommand = {
          type: "DELETE_NODES",
          deletedNodes,
        };
        return { nextDoc, inverseCommand };
      }

      case "BATCH": {
        let currentDoc = doc;
        const inverseList: EditorCommand[] = [];

        for (const subCmd of command.commands) {
          const res = this.applyCommand(currentDoc, subCmd);
          currentDoc = res.nextDoc;
          inverseList.unshift(res.inverseCommand); // Inverses executed in reverse order
        }

        return {
          nextDoc: currentDoc,
          inverseCommand: { type: "BATCH", commands: inverseList },
        };
      }
    }
  }

  // --- Document Immutability Helpers ---
  private updateNodeInDoc(doc: OverlayDocument, nodeId: string, updater: (node: SceneNode) => SceneNode): OverlayDocument {
    const updateRecursive = (nodes: SceneNode[]): SceneNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return updater(node);
        }
        if ("children" in node && Array.isArray((node as any).children)) {
          return {
            ...node,
            children: updateRecursive((node as any).children),
          } as SceneNode;
        }
        return node;
      });
    };

    return {
      ...doc,
      nodes: updateRecursive(doc.nodes),
    };
  }

  private insertNodeIntoDoc(doc: OverlayDocument, node: SceneNode, parentId?: string, index?: number): OverlayDocument {
    if (!parentId) {
      const nodes = [...doc.nodes];
      if (index !== undefined && index >= 0 && index <= nodes.length) {
        nodes.splice(index, 0, node);
      } else {
        nodes.push(node);
      }
      return { ...doc, nodes };
    }

    return this.updateNodeInDoc(doc, parentId, (parent) => {
      const children = [...((parent as FrameNode).children || [])];
      if (index !== undefined && index >= 0 && index <= children.length) {
        children.splice(index, 0, node);
      } else {
        children.push(node);
      }
      return { ...parent, children } as SceneNode;
    });
  }

  private removeNodeFromDoc(doc: OverlayDocument, nodeId: string): OverlayDocument {
    const removeRecursive = (nodes: SceneNode[]): SceneNode[] => {
      return nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => {
          if ("children" in n && Array.isArray((n as any).children)) {
            return { ...n, children: removeRecursive((n as any).children) } as SceneNode;
          }
          return n;
        });
    };

    return {
      ...doc,
      nodes: removeRecursive(doc.nodes),
    };
  }
}

export const editorCommandSystem = new EditorCommandSystem();
