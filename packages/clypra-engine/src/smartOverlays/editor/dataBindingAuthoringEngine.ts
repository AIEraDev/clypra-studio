import type { OverlayDocument, SceneNode, DocumentVariable } from "../overlayDocumentSchema.js";
import { EditorCommandSystem, editorCommandSystem } from "./editorCommandSystem.js";

export interface BindingDefinition {
  targetProperty: string;
  expression: string;
}

export class DataBindingAuthoringEngine {
  private commandSystem: EditorCommandSystem;

  constructor(commandSystem: EditorCommandSystem = editorCommandSystem) {
    this.commandSystem = commandSystem;
  }

  /**
   * Bind a node property to a dynamic variable expression (e.g. "{{speaker.name}}").
   */
  public bindProperty(
    doc: OverlayDocument,
    nodeId: string,
    targetProperty: string,
    expression: string
  ): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    if (!node) return doc;

    const existingBindings: BindingDefinition[] = (node as any).bindings || [];
    const filtered = existingBindings.filter((b) => b.targetProperty !== targetProperty);
    const updatedBindings = [...filtered, { targetProperty, expression }];

    // If target is text/assetId direct prop, also set placeholder template expression
    const commands: any[] = [
      {
        type: "UPDATE_PROP",
        nodeId,
        property: "bindings",
        previousValue: (node as any).bindings,
        nextValue: updatedBindings,
      },
    ];

    if (targetProperty === "text" && node.type === "text") {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "text",
        previousValue: (node as any).text,
        nextValue: expression,
      });
    } else if (targetProperty === "assetId" && (node.type === "media" || (node as any).assetId !== undefined)) {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "assetId",
        previousValue: (node as any).assetId,
        nextValue: expression,
      });
    }

    if (commands.length === 1) return this.commandSystem.execute(doc, commands[0]);
    return this.commandSystem.execute(doc, { type: "BATCH", commands });
  }

  /**
   * Unbind a dynamic variable expression from a node property.
   */
  public unbindProperty(doc: OverlayDocument, nodeId: string, targetProperty: string): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    if (!node) return doc;

    const existingBindings: BindingDefinition[] = (node as any).bindings || [];
    const updatedBindings = existingBindings.filter((b) => b.targetProperty !== targetProperty);

    return this.commandSystem.execute(doc, {
      type: "UPDATE_PROP",
      nodeId,
      property: "bindings",
      previousValue: (node as any).bindings,
      nextValue: updatedBindings,
    });
  }

  /**
   * List all declared document variables and dataset fields.
   */
  public getAvailableVariables(doc: OverlayDocument): DocumentVariable[] {
    return doc.variables || [];
  }

  /**
   * Add a new document variable to the schema.
   */
  public addVariable(doc: OverlayDocument, variable: DocumentVariable): OverlayDocument {
    const existing = doc.variables || [];
    const nextVariables = [...existing.filter((v) => v.key !== variable.key), variable];

    // Document-level mutation
    return {
      ...doc,
      variables: nextVariables,
    };
  }

  private findNode(doc: OverlayDocument, id: string): SceneNode | null {
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
}

export const dataBindingAuthoringEngine = new DataBindingAuthoringEngine();
