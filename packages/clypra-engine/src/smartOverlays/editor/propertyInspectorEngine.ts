import type { OverlayDocument, SceneNode, FrameNode, PrimitiveTextNode } from "../overlayDocumentSchema.js";
import { EditorCommandSystem, editorCommandSystem } from "./editorCommandSystem.js";

export class PropertyInspectorEngine {
  private commandSystem: EditorCommandSystem;

  constructor(commandSystem: EditorCommandSystem = editorCommandSystem) {
    this.commandSystem = commandSystem;
  }

  /**
   * Update Shape / Frame Fill Color.
   */
  public setFillColor(doc: OverlayDocument, nodeId: string, fillColor: string): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    const prev = node?.style?.fillColor || (node?.style as any)?.backgroundColor;
    return this.commandSystem.execute(doc, {
      type: "UPDATE_STYLE",
      nodeId,
      property: "fillColor",
      previousValue: prev,
      nextValue: fillColor,
    });
  }

  /**
   * Update Stroke (Border) styling.
   */
  public setStroke(doc: OverlayDocument, nodeId: string, strokeColor: string, strokeWidth = 1): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    const prevColor = node?.style?.strokeColor || node?.style?.borderColor;
    const prevWidth = node?.style?.strokeWidth || node?.style?.borderWidth;

    return this.commandSystem.execute(doc, {
      type: "BATCH",
      commands: [
        {
          type: "UPDATE_STYLE",
          nodeId,
          property: "strokeColor",
          previousValue: prevColor,
          nextValue: strokeColor,
        },
        {
          type: "UPDATE_STYLE",
          nodeId,
          property: "strokeWidth",
          previousValue: prevWidth,
          nextValue: strokeWidth,
        },
      ],
    });
  }

  /**
   * Update Corner Radius.
   */
  public setCornerRadius(doc: OverlayDocument, nodeId: string, borderRadius: number): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    const prev = node?.style?.borderRadius;
    return this.commandSystem.execute(doc, {
      type: "UPDATE_STYLE",
      nodeId,
      property: "borderRadius",
      previousValue: prev,
      nextValue: borderRadius,
    });
  }

  /**
   * Update Text Typography properties.
   */
  public setTypography(
    doc: OverlayDocument,
    nodeId: string,
    options: {
      text?: string;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      textAlign?: "left" | "center" | "right";
    }
  ): OverlayDocument {
    const node = this.findNode(doc, nodeId) as PrimitiveTextNode;
    const commands: any[] = [];

    if (options.text !== undefined && node) {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "text",
        previousValue: node.text,
        nextValue: options.text,
      });
    }

    if (options.fontSize !== undefined && node) {
      commands.push({
        type: "UPDATE_STYLE",
        nodeId,
        property: "fontSize",
        previousValue: node.style?.fontSize,
        nextValue: options.fontSize,
      });
    }

    if (options.fontWeight !== undefined && node) {
      commands.push({
        type: "UPDATE_STYLE",
        nodeId,
        property: "fontWeight",
        previousValue: (node.style as any)?.fontWeight,
        nextValue: options.fontWeight,
      });
    }

    if (options.color !== undefined && node) {
      commands.push({
        type: "UPDATE_STYLE",
        nodeId,
        property: "color",
        previousValue: node.style?.color,
        nextValue: options.color,
      });
    }

    if (options.textAlign !== undefined && node) {
      commands.push({
        type: "UPDATE_STYLE",
        nodeId,
        property: "textAlign",
        previousValue: node.style?.textAlign,
        nextValue: options.textAlign,
      });
    }

    if (commands.length === 0) return doc;
    if (commands.length === 1) return this.commandSystem.execute(doc, commands[0]);
    return this.commandSystem.execute(doc, { type: "BATCH", commands });
  }

  /**
   * Update Frame Spatial Layout properties.
   */
  public setFrameLayout(
    doc: OverlayDocument,
    nodeId: string,
    layout: {
      mode?: "flex-row" | "flex-column" | "none" | "grid";
      gap?: number | { col: number; row: number };
      padding?: number | { top: number; right: number; bottom: number; left: number };
      alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
      justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
      widthMode?: "fixed" | "hug" | "fill";
      heightMode?: "fixed" | "hug" | "fill";
    }
  ): OverlayDocument {
    const node = this.findNode(doc, nodeId) as FrameNode;
    if (!node) return doc;

    const prevLayout = node.layout || {};
    const nextLayout = {
      ...prevLayout,
      ...(layout.mode !== undefined ? { mode: layout.mode } : {}),
      ...(layout.gap !== undefined ? { gap: layout.gap } : {}),
      ...(layout.padding !== undefined ? { padding: layout.padding } : {}),
      ...(layout.alignItems !== undefined ? { alignItems: layout.alignItems } : {}),
      ...(layout.justifyContent !== undefined ? { justifyContent: layout.justifyContent } : {}),
      constraints: {
        ...(prevLayout.constraints || {}),
        ...(layout.widthMode !== undefined ? { widthMode: layout.widthMode } : {}),
        ...(layout.heightMode !== undefined ? { heightMode: layout.heightMode } : {}),
      },
    };

    return this.commandSystem.execute(doc, {
      type: "UPDATE_PROP",
      nodeId,
      property: "layout",
      previousValue: prevLayout,
      nextValue: nextLayout,
    });
  }

  /**
   * Update Media Sizing, ObjectFit & Asset reference.
   */
  public setMediaProps(
    doc: OverlayDocument,
    nodeId: string,
    props: {
      assetId?: string;
      objectFit?: "cover" | "contain" | "fill" | "none";
      aspectRatioLock?: boolean;
    }
  ): OverlayDocument {
    const node = this.findNode(doc, nodeId);
    const commands: any[] = [];

    if (props.assetId !== undefined && node) {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "assetId",
        previousValue: (node as any).assetId,
        nextValue: props.assetId,
      });
    }

    if (props.objectFit !== undefined && node) {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "objectFit",
        previousValue: (node as any).objectFit,
        nextValue: props.objectFit,
      });
    }

    if (props.aspectRatioLock !== undefined && node) {
      commands.push({
        type: "UPDATE_PROP",
        nodeId,
        property: "aspectRatioLock",
        previousValue: (node as any).aspectRatioLock,
        nextValue: props.aspectRatioLock,
      });
    }

    if (commands.length === 0) return doc;
    if (commands.length === 1) return this.commandSystem.execute(doc, commands[0]);
    return this.commandSystem.execute(doc, { type: "BATCH", commands });
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

export const propertyInspectorEngine = new PropertyInspectorEngine();
