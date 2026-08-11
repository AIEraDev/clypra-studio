import type { OverlayDocument, SceneNode } from "../overlayDocumentSchema.js";
import type { DocumentCommand } from "./commandTypes.js";

export interface CommandExecutionResult {
  nextDocument: OverlayDocument;
  inverseCommand: DocumentCommand;
}

export class CommandExecutor {
  /**
   * Execute a command on an OverlayDocument and return the new document + inverse command for undo
   */
  public execute(doc: OverlayDocument, command: DocumentCommand): CommandExecutionResult {
    const docCopy = JSON.parse(JSON.stringify(doc)) as OverlayDocument;

    switch (command.type) {
      case "SET_DOCUMENT": {
        return {
          nextDocument: command.doc,
          inverseCommand: { type: "SET_DOCUMENT", doc }
        };
      }

      case "ADD_NODE": {
        if (command.parentId) {
          const parentNode = this.findNode(docCopy.nodes, command.parentId);
          if (parentNode && "children" in parentNode && Array.isArray(parentNode.children)) {
            parentNode.children.push(command.node);
          } else {
            docCopy.nodes.push(command.node);
          }
        } else {
          docCopy.nodes.push(command.node);
        }
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "DELETE_NODE", nodeId: command.node.id }
        };
      }

      case "DELETE_NODE": {
        const deletedNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!deletedNode) return { nextDocument: docCopy, inverseCommand: command };

        docCopy.nodes = this.removeNode(docCopy.nodes, command.nodeId);

        return {
          nextDocument: docCopy,
          inverseCommand: { type: "ADD_NODE", node: deletedNode }
        };
      }

      case "UPDATE_NODE_PROPERTY": {
        const targetNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!targetNode) return { nextDocument: docCopy, inverseCommand: command };

        const prevVal = this.getNestedProperty(targetNode, command.path);
        this.setNestedProperty(targetNode, command.path, command.value);

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "UPDATE_NODE_PROPERTY",
            nodeId: command.nodeId,
            path: command.path,
            value: prevVal,
            previousValue: command.value
          }
        };
      }

      case "UPDATE_NODE_STYLE": {
        const targetNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!targetNode) return { nextDocument: docCopy, inverseCommand: command };

        if (!targetNode.style) targetNode.style = {};
        const prevStyle = (targetNode.style as any)[command.stylePath];
        (targetNode.style as any)[command.stylePath] = command.value;

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "UPDATE_NODE_STYLE",
            nodeId: command.nodeId,
            stylePath: command.stylePath,
            value: prevStyle,
            previousValue: command.value
          }
        };
      }

      case "REORDER_NODES": {
        const { sourceIndex, destinationIndex } = command;
        if (sourceIndex >= 0 && sourceIndex < docCopy.nodes.length && destinationIndex >= 0 && destinationIndex < docCopy.nodes.length) {
          const [moved] = docCopy.nodes.splice(sourceIndex, 1);
          docCopy.nodes.splice(destinationIndex, 0, moved);
        }
        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "REORDER_NODES",
            sourceIndex: destinationIndex,
            destinationIndex: sourceIndex
          }
        };
      }

      case "ADD_VARIABLE": {
        const newVar = {
          key: command.key,
          type: command.dataType,
          defaultValue: command.defaultValue,
          label: command.label || command.key
        };
        docCopy.variables.push(newVar);
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "REMOVE_VARIABLE", key: command.key, previousVariable: newVar }
        };
      }

      case "REMOVE_VARIABLE": {
        const existing = docCopy.variables.find((v) => v.key === command.key);
        docCopy.variables = docCopy.variables.filter((v) => v.key !== command.key);
        return {
          nextDocument: docCopy,
          inverseCommand: existing
            ? {
                type: "ADD_VARIABLE",
                key: existing.key,
                dataType: existing.type,
                defaultValue: existing.defaultValue,
                label: existing.label
              }
            : { type: "REMOVE_VARIABLE", key: command.key }
        };
      }

      case "UPDATE_VARIABLE": {
        const varIdx = docCopy.variables.findIndex((v) => v.key === command.key);
        if (varIdx === -1) return { nextDocument: docCopy, inverseCommand: command };

        const prev = { ...docCopy.variables[varIdx] };
        docCopy.variables[varIdx] = { ...prev, ...command.patch };

        // Build inverse patch from previous values of the patched keys
        const inversePatch: Record<string, any> = {};
        for (const k of Object.keys(command.patch)) {
          inversePatch[k] = (prev as any)[k];
        }

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "UPDATE_VARIABLE",
            key: command.key,
            patch: inversePatch,
            previousPatch: command.patch
          }
        };
      }

      case "ADD_DATA_PREVIEW_SET": {
        if (!docCopy.dataPreviewSets) docCopy.dataPreviewSets = [];
        docCopy.dataPreviewSets.push(command.set);
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "REMOVE_DATA_PREVIEW_SET", id: command.set.id, previousSet: command.set }
        };
      }

      case "UPDATE_DATA_PREVIEW_SET": {
        if (!docCopy.dataPreviewSets) return { nextDocument: docCopy, inverseCommand: command };
        const setIdx = docCopy.dataPreviewSets.findIndex((s) => s.id === command.id);
        if (setIdx === -1) return { nextDocument: docCopy, inverseCommand: command };

        const prevSet = { ...docCopy.dataPreviewSets[setIdx] };
        docCopy.dataPreviewSets[setIdx] = { ...prevSet, ...command.patch };

        const inversePatch: Record<string, any> = {};
        for (const k of Object.keys(command.patch)) {
          inversePatch[k] = (prevSet as any)[k];
        }

        return {
          nextDocument: docCopy,
          inverseCommand: { type: "UPDATE_DATA_PREVIEW_SET", id: command.id, patch: inversePatch, previousPatch: command.patch }
        };
      }

      case "REMOVE_DATA_PREVIEW_SET": {
        const prevSet = (docCopy.dataPreviewSets || []).find((s) => s.id === command.id);
        docCopy.dataPreviewSets = (docCopy.dataPreviewSets || []).filter((s) => s.id !== command.id);
        return {
          nextDocument: docCopy,
          inverseCommand: prevSet
            ? { type: "ADD_DATA_PREVIEW_SET", set: prevSet }
            : { type: "REMOVE_DATA_PREVIEW_SET", id: command.id }
        };
      }

      case "ADD_TIMELINE_MARKER": {
        if (!docCopy.markers) docCopy.markers = [];
        docCopy.markers.push(command.marker);
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "REMOVE_TIMELINE_MARKER", markerId: command.marker.id, previousMarker: command.marker }
        };
      }

      case "UPDATE_TIMELINE_MARKER": {
        if (!docCopy.markers) return { nextDocument: docCopy, inverseCommand: command };
        const idx = docCopy.markers.findIndex((m) => m.id === command.markerId);
        if (idx === -1) return { nextDocument: docCopy, inverseCommand: command };

        const prevMarker = { ...docCopy.markers[idx] };
        docCopy.markers[idx] = { ...prevMarker, ...command.patch };

        const inversePatch: Record<string, any> = {};
        for (const k of Object.keys(command.patch)) {
          inversePatch[k] = (prevMarker as any)[k];
        }

        return {
          nextDocument: docCopy,
          inverseCommand: { type: "UPDATE_TIMELINE_MARKER", markerId: command.markerId, patch: inversePatch, previousPatch: command.patch }
        };
      }

      case "REMOVE_TIMELINE_MARKER": {
        const prevMarker = (docCopy.markers || []).find((m) => m.id === command.markerId);
        docCopy.markers = (docCopy.markers || []).filter((m) => m.id !== command.markerId);
        return {
          nextDocument: docCopy,
          inverseCommand: prevMarker
            ? { type: "ADD_TIMELINE_MARKER", marker: prevMarker }
            : { type: "REMOVE_TIMELINE_MARKER", markerId: command.markerId }
        };
      }

      case "UPDATE_KEYFRAME_TRACKS": {
        const targetNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!targetNode) return { nextDocument: docCopy, inverseCommand: command };

        if (!targetNode.animation) targetNode.animation = {};
        const prevTracks = targetNode.animation.keyframeTracks || [];
        targetNode.animation.keyframeTracks = command.tracks;

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "UPDATE_KEYFRAME_TRACKS",
            nodeId: command.nodeId,
            tracks: prevTracks,
            previousTracks: command.tracks
          }
        };
      }

      case "UPDATE_ANIMATION": {

        const targetNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!targetNode) return { nextDocument: docCopy, inverseCommand: command };

        const prevAnim = targetNode.animation;
        targetNode.animation = command.animation;

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "UPDATE_ANIMATION",
            nodeId: command.nodeId,
            animation: prevAnim,
            previousAnimation: command.animation
          }
        };
      }

      case "GROUP_NODES": {
        const targetIds = new Set(command.nodeIds);
        const targetNodes = docCopy.nodes.filter((n) => targetIds.has(n.id));
        if (targetNodes.length === 0) return { nextDocument: docCopy, inverseCommand: command };

        // Bounding box of targets
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of targetNodes) {
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x + n.width > maxX) maxX = n.x + n.width;
          if (n.y + n.height > maxY) maxY = n.y + n.height;
        }

        const frameId = `frame-${Date.now().toString(36)}`;
        const frameNode: SceneNode = {
          id: frameId,
          name: command.frameName || "Group Frame",
          type: "frame",
          x: minX,
          y: minY,
          width: Math.max(20, maxX - minX),
          height: Math.max(20, maxY - minY),
          children: targetNodes.map((n) => ({
            ...n,
            x: n.x - minX,
            y: n.y - minY
          }))
        } as any;

        // Replace first target node with frameNode, filter out remaining targets
        let inserted = false;
        const nextNodes: SceneNode[] = [];
        for (const node of docCopy.nodes) {
          if (targetIds.has(node.id)) {
            if (!inserted) {
              nextNodes.push(frameNode);
              inserted = true;
            }
          } else {
            nextNodes.push(node);
          }
        }
        docCopy.nodes = nextNodes;

        return {
          nextDocument: docCopy,
          inverseCommand: { type: "UNGROUP_NODES", frameId }
        };
      }

      case "UNGROUP_NODES": {
        const frameNode = this.findNode(docCopy.nodes, command.frameId);
        if (!frameNode || frameNode.type !== "frame" || !("children" in frameNode) || !Array.isArray(frameNode.children)) {
          return { nextDocument: docCopy, inverseCommand: command };
        }

        const children = frameNode.children.map((c) => ({
          ...c,
          x: c.x + frameNode.x,
          y: c.y + frameNode.y
        }));

        // Replace frameNode with its children
        const nextNodes: SceneNode[] = [];
        for (const node of docCopy.nodes) {
          if (node.id === command.frameId) {
            nextNodes.push(...children);
          } else {
            nextNodes.push(node);
          }
        }
        docCopy.nodes = nextNodes;

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "GROUP_NODES",
            nodeIds: children.map((c) => c.id),
            frameName: frameNode.name
          }
        };
      }

      case "BATCH_COMMANDS": {
        let currentDoc = docCopy;
        const inverseCommands: DocumentCommand[] = [];

        for (const cmd of command.commands) {
          const res = this.execute(currentDoc, cmd);
          currentDoc = res.nextDocument;
          inverseCommands.push(res.inverseCommand);
        }

        return {
          nextDocument: currentDoc,
          inverseCommand: {
            type: "BATCH_COMMANDS",
            commands: inverseCommands.reverse()
          }
        };
      }

      case "DETACH_COMPONENT": {
        const compNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!compNode || compNode.type !== "component") {
          return { nextDocument: docCopy, inverseCommand: command };
        }
        // Convert ComponentNode → FrameNode preserving position and style
        const { componentType, props, variant, ...rest } = compNode as any;
        const frameNode: SceneNode = {
          ...rest,
          type: "frame" as const,
          name: `${compNode.name} (Detached)`,
          children: (compNode as any).children || [],
        };
        docCopy.nodes = docCopy.nodes.map((n) => n.id === command.nodeId ? frameNode : n);
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "ADD_NODE", node: compNode }
        };
      }

      case "UPDATE_CANVAS_SIZE": {
        const prev = { w: docCopy.canvas.width, h: docCopy.canvas.height };
        docCopy.canvas = { ...docCopy.canvas, width: command.width, height: command.height };
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "UPDATE_CANVAS_SIZE", width: prev.w, height: prev.h, previousWidth: command.width, previousHeight: command.height }
        };
      }

      case "SET_BINDING": {
        const bindingNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!bindingNode) return { nextDocument: docCopy, inverseCommand: command };
        if (!bindingNode.bindings) (bindingNode as any).bindings = [];
        const existingIdx = bindingNode.bindings!.findIndex((b) => b.targetProperty === command.targetProperty);
        const prevExpr = existingIdx >= 0 ? bindingNode.bindings![existingIdx].expression : "";
        if (!command.expression) {
          // Clear binding
          (bindingNode as any).bindings = bindingNode.bindings!.filter((b) => b.targetProperty !== command.targetProperty);
        } else if (existingIdx >= 0) {
          bindingNode.bindings![existingIdx].expression = command.expression;
        } else {
          bindingNode.bindings!.push({ targetProperty: command.targetProperty, expression: command.expression });
        }
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "SET_BINDING", nodeId: command.nodeId, targetProperty: command.targetProperty, expression: prevExpr }
        };
      }

      case "REGISTER_ASSET": {
        if (!docCopy.assetManifest) docCopy.assetManifest = { assets: [] };
        const existingIdx = docCopy.assetManifest.assets.findIndex((a) => a.assetId === command.asset.assetId);
        if (existingIdx >= 0) {
          docCopy.assetManifest.assets[existingIdx] = command.asset;
        } else {
          docCopy.assetManifest.assets.push(command.asset);
        }
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "REMOVE_ASSET", assetId: command.asset.assetId, previousAsset: command.asset }
        };
      }

      case "REMOVE_ASSET": {
        if (!docCopy.assetManifest) return { nextDocument: docCopy, inverseCommand: command };
        const removed = docCopy.assetManifest.assets.find((a) => a.assetId === command.assetId);
        docCopy.assetManifest.assets = docCopy.assetManifest.assets.filter((a) => a.assetId !== command.assetId);
        return {
          nextDocument: docCopy,
          inverseCommand: removed
            ? { type: "REGISTER_ASSET", asset: removed }
            : command
        };
      }

      case "SET_ASSET_REF": {
        const mediaNode = this.findNode(docCopy.nodes, command.nodeId) as any;
        if (!mediaNode || mediaNode.type !== "media") return { nextDocument: docCopy, inverseCommand: command };
        const prevAssetId = mediaNode.assetId;
        mediaNode.assetId = command.assetId;
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "SET_ASSET_REF", nodeId: command.nodeId, assetId: prevAssetId ?? "", previousAssetId: command.assetId }
        };
      }

      case "SET_FONT_REF": {
        const fontNode = this.findNode(docCopy.nodes, command.nodeId) as any;
        if (!fontNode) return { nextDocument: docCopy, inverseCommand: command };
        if (!fontNode.style) fontNode.style = {};
        const prevFontRef = fontNode.style.fontRef;
        fontNode.style.fontRef = command.fontRef;
        return {
          nextDocument: docCopy,
          inverseCommand: prevFontRef
            ? { type: "SET_FONT_REF", nodeId: command.nodeId, fontRef: prevFontRef, previousFontRef: command.fontRef }
            : { type: "SET_FONT_REF", nodeId: command.nodeId, fontRef: command.fontRef }
        };
      }

      // -------------------------------------------------------------------
      // Phase 4J — Responsive Layout Commands
      // -------------------------------------------------------------------

      case "ADD_BREAKPOINT": {
        if (!docCopy.breakpoints) {
          docCopy.breakpoints = { activeId: null, breakpoints: [] };
        }
        const alreadyExists = docCopy.breakpoints.breakpoints.some(
          (b) => b.id === command.breakpoint.id
        );
        if (!alreadyExists) {
          docCopy.breakpoints.breakpoints.push(command.breakpoint);
        }
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "REMOVE_BREAKPOINT", breakpointId: command.breakpoint.id, previousBreakpoint: command.breakpoint }
        };
      }

      case "REMOVE_BREAKPOINT": {
        const bp = docCopy.breakpoints?.breakpoints.find((b) => b.id === command.breakpointId);
        if (!bp) return { nextDocument: docCopy, inverseCommand: command };

        // Remove from registry
        docCopy.breakpoints!.breakpoints = docCopy.breakpoints!.breakpoints.filter(
          (b) => b.id !== command.breakpointId
        );

        // If this was the active breakpoint, reset to base
        if (docCopy.breakpoints!.activeId === command.breakpointId) {
          docCopy.breakpoints!.activeId = null;
        }

        // Purge all node.responsive[breakpointId] entries
        this.purgeBreakpointOverrides(docCopy.nodes, command.breakpointId);

        return {
          nextDocument: docCopy,
          inverseCommand: { type: "ADD_BREAKPOINT", breakpoint: bp }
        };
      }

      case "SET_ACTIVE_BREAKPOINT": {
        if (!docCopy.breakpoints) {
          docCopy.breakpoints = { activeId: null, breakpoints: [] };
        }
        const prevId = docCopy.breakpoints.activeId;
        docCopy.breakpoints.activeId = command.breakpointId;
        return {
          nextDocument: docCopy,
          inverseCommand: { type: "SET_ACTIVE_BREAKPOINT", breakpointId: prevId, previousBreakpointId: command.breakpointId }
        };
      }

      case "SET_RESPONSIVE_OVERRIDE": {
        const overrideNode = this.findNode(docCopy.nodes, command.nodeId);
        if (!overrideNode) return { nextDocument: docCopy, inverseCommand: command };

        if (!overrideNode.responsive) overrideNode.responsive = {};
        const prevPatch = overrideNode.responsive[command.breakpointId] ?? null;

        if (command.patch === null) {
          // Clear the entire override for this breakpoint
          delete overrideNode.responsive[command.breakpointId];
        } else {
          // Merge sparse patch into existing override
          overrideNode.responsive[command.breakpointId] = {
            ...(overrideNode.responsive[command.breakpointId] ?? {}),
            ...command.patch
          };
        }

        return {
          nextDocument: docCopy,
          inverseCommand: {
            type: "SET_RESPONSIVE_OVERRIDE",
            nodeId: command.nodeId,
            breakpointId: command.breakpointId,
            patch: prevPatch,
            previousPatch: command.patch
          }
        };
      }

      default:
        return { nextDocument: docCopy, inverseCommand: command };
    }
  }

  private findNode(nodes: SceneNode[], id: string): SceneNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if ("children" in node && Array.isArray(node.children)) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeNode(nodes: SceneNode[], id: string): SceneNode[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => {
        if ("children" in n && Array.isArray(n.children)) {
          return { ...n, children: this.removeNode(n.children, id) };
        }
        return n;
      });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  private setNestedProperty(obj: any, path: string, val: any): void {
    const parts = path.split(".");
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = val;
  }

  /**
   * Recursively remove node.responsive[breakpointId] from all nodes.
   * Called by REMOVE_BREAKPOINT to prevent orphan override data.
   */
  private purgeBreakpointOverrides(nodes: SceneNode[], breakpointId: string): void {
    for (const node of nodes) {
      if (node.responsive?.[breakpointId]) {
        delete node.responsive[breakpointId];
      }
      if ("children" in node && Array.isArray(node.children)) {
        this.purgeBreakpointOverrides(node.children, breakpointId);
      }
      // Also purge repeater itemTemplate
      if (node.type === "repeater" && node.itemTemplate) {
        const template = node.itemTemplate;
        if (template.responsive?.[breakpointId]) {
          delete template.responsive[breakpointId];
        }
      }
    }
  }
}

export const commandExecutor = new CommandExecutor();
