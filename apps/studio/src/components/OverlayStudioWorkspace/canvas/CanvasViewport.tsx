import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  viewportTransform,
  snapEngine,
  resolveConform,
  hitTestTransformHandles,
  calculateResizeBounds,
  calculateRotationAngle,
  type OverlayDocument,
  type SceneNode,
  type ViewportState,
  type DocumentCommand,
  type AlignmentGuide
} from "@clypra-studio/engine";
import {
  AlignLeft, AlignCenter, AlignRight, AlignVerticalSpaceAround, AlignHorizontalSpaceAround,
  MoveHorizontal, MoveVertical, RotateCw, Layers, ArrowUp, ArrowDown
} from "lucide-react";
import { usePixiApp } from "../hooks/usePixiApp";
import { InsertPalette } from "./InsertPalette";

type HandleType = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "rot" | null;

interface CanvasViewportProps {
  doc: OverlayDocument;
  viewport: ViewportState;
  selectedNodeIds: string[];
  currentTime: number;
  referenceVideo: HTMLVideoElement | null;
  onSelectNodeIds: (ids: string[]) => void;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onSetZoom?: (zoom: number) => void;
}

export function CanvasViewport({
  doc,
  viewport,
  selectedNodeIds,
  currentTime,
  referenceVideo,
  onSelectNodeIds,
  onExecuteCommand,
  onSetZoom
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRefContainer = useRef<HTMLDivElement | null>(null);
  const [isInsertPaletteOpen, setIsInsertPaletteOpen] = useState(false);

  // Derive selected node objects
  const selectedNodes = doc.nodes.filter((n) => selectedNodeIds.includes(n.id));
  const selectedNode = selectedNodes[0] || null;

  // Video Conform Geometry (letterbox / pillarbox fit into canvas dimensions)
  const videoConform = referenceVideo
    ? resolveConform(
        {
          mode: "fit",
          sourceWidth: referenceVideo.videoWidth,
          sourceHeight: referenceVideo.videoHeight,
          userScale: 1,
          userOffsetX: 0,
          userOffsetY: 0
        },
        doc.canvas.width,
        doc.canvas.height
      )
    : null;

  // Sync background reference video element into container
  useEffect(() => {
    const container = videoRefContainer.current;
    if (!container || !referenceVideo) return;

    if (videoConform) {
      referenceVideo.style.position = "absolute";
      referenceVideo.style.left = `${videoConform.x}px`;
      referenceVideo.style.top = `${videoConform.y}px`;
      referenceVideo.style.width = `${videoConform.width}px`;
      referenceVideo.style.height = `${videoConform.height}px`;
      referenceVideo.style.objectFit = "cover";
    }

    container.appendChild(referenceVideo);
    return () => {
      if (container.contains(referenceVideo)) {
        container.removeChild(referenceVideo);
      }
    };
  }, [referenceVideo, videoConform?.x, videoConform?.y, videoConform?.width, videoConform?.height]);

  // Trackpad pinch / Ctrl+wheel zoom on viewport canvas container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 5 : -5;
        const nextZoom = Math.max(20, Math.min(300, viewport.zoom + delta));
        onSetZoom?.(nextZoom);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [viewport.zoom, onSetZoom]);

  const handleAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 64;
    const containerH = containerRef.current.clientHeight - 72;
    if (containerW > 0 && containerH > 0) {
      const fitScale = Math.min(containerW / doc.canvas.width, containerH / doc.canvas.height, 1.0);
      const fitZoom = Math.max(20, Math.floor(fitScale * 100));
      onSetZoom?.(fitZoom);
    }
  }, [doc.canvas.width, doc.canvas.height, onSetZoom]);

  // Auto-fit canvas on initial mount and whenever container dimensions change (responsive sidebar/window)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    handleAutoFit();

    const ro = new ResizeObserver(() => {
      handleAutoFit();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [handleAutoFit]);

  // Mount PixiApplication to canvas — 60 FPS loop runs completely outside React
  usePixiApp(canvasRef, doc, currentTime, selectedNode, !!referenceVideo);

  // Drag & Marquee & Handle States
  const dragModeRef = useRef<"move" | "resize" | "rotate" | "marquee" | null>(null);
  const activeHandleRef = useRef<HandleType>(null);

  const [marqueeBox, setMarqueeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [hoverCursor, setHoverCursor] = useState<string>("default");

  const getHandleCursor = (handle: HandleType): string => {
    switch (handle) {
      case "rot": return "grab";
      case "tl":
      case "br": return "nwse-resize";
      case "tr":
      case "bl": return "nesw-resize";
      case "t":
      case "b": return "ns-resize";
      case "l":
      case "r": return "ew-resize";
      default: return "default";
    }
  };

  // Drag Start Snapshot
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    nodeStarts: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
  } | null>(null);

  // Calculate selection bounding box
  let selMinX = Infinity, selMinY = Infinity, selMaxX = -Infinity, selMaxY = -Infinity;

  for (const n of selectedNodes) {
    if (n.x < selMinX) selMinX = n.x;
    if (n.y < selMinY) selMinY = n.y;
    if (n.x + n.width > selMaxX) selMaxX = n.x + n.width;
    if (n.y + n.height > selMaxY) selMaxY = n.y + n.height;
  }

  const selW = selMaxX - selMinX;
  const selH = selMaxY - selMinY;

  // Hit-test Handles (Corners, Edges, Rotation)
  const hitTestHandles = (docX: number, docY: number): HandleType => {
    if (selectedNodes.length === 0) return null;
    const scale = viewport.zoom / 100;
    const threshold = Math.max(16, 20 / scale);

    const rotX = selMinX + selW / 2;
    const rotY = selMinY - 24;
    if (Math.hypot(docX - rotX, docY - rotY) <= threshold) return "rot";

    if (Math.hypot(docX - selMinX, docY - selMinY) <= threshold) return "tl";
    if (Math.hypot(docX - (selMinX + selW), docY - selMinY) <= threshold) return "tr";
    if (Math.hypot(docX - selMinX, docY - (selMinY + selH)) <= threshold) return "bl";
    if (Math.hypot(docX - (selMinX + selW), docY - (selMinY + selH)) <= threshold) return "br";

    if (Math.abs(docY - selMinY) <= threshold && docX >= selMinX - threshold && docX <= selMinX + selW + threshold) return "t";
    if (Math.abs(docY - (selMinY + selH)) <= threshold && docX >= selMinX - threshold && docX <= selMinX + selW + threshold) return "b";
    if (Math.abs(docX - selMinX) <= threshold && docY >= selMinY - threshold && docY <= selMinY + selH + threshold) return "l";
    if (Math.abs(docX - (selMinX + selW)) <= threshold && docY >= selMinY - threshold && docY <= selMinY + selH + threshold) return "r";

    return null;
  };

  // Helper for computing interactive hit bounds for all node types (including floating annotations)
  const getNodeHitBounds = (n: SceneNode) => {
    let minX = n.x;
    let maxX = n.x + n.width;
    let minY = n.y;
    let maxY = n.y + n.height;

    if (n.type === "annotation") {
      const offX = (n as any).offsetX ?? 10;
      const offY = (n as any).offsetY ?? -20;
      minX = Math.min(n.x - 12, n.x + offX - 12);
      maxX = Math.max(n.x + n.width + 12, n.x + offX + 160);
      minY = Math.min(n.y - 12, n.y + offY - 20);
      maxY = Math.max(n.y + n.height + 12, n.y + 12);
    } else {
      const pad = 8;
      minX -= pad;
      maxX += pad;
      minY -= pad;
      maxY += pad;
    }

    return { minX, maxX, minY, maxY };
  };

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const docPt = {
      x: ((e.clientX - rect.left) / rect.width) * doc.canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * doc.canvas.height
    };

    // 1. Check Handle Hit
    const handle = hitTestHandles(docPt.x, docPt.y);
    if (handle) {
      activeHandleRef.current = handle;
      dragModeRef.current = handle === "rot" ? "rotate" : "resize";
      setHoverCursor(handle === "rot" ? "grabbing" : getHandleCursor(handle));
      dragStartRef.current = {
        startX: docPt.x,
        startY: docPt.y,
        nodeStarts: selectedNodes.map((n) => ({
          id: n.id, x: n.x, y: n.y, width: n.width, height: n.height, rotation: n.rotation || 0
        }))
      };
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2. Check Node Body Hit
    const hitNode = [...doc.nodes].reverse().find((n) => {
      const { minX, maxX, minY, maxY } = getNodeHitBounds(n);
      return docPt.x >= minX && docPt.x <= maxX && docPt.y >= minY && docPt.y <= maxY;
    });

    if (hitNode) {
      let nextIds: string[];
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        nextIds = selectedNodeIds.includes(hitNode.id)
          ? selectedNodeIds.filter((id) => id !== hitNode.id)
          : [...selectedNodeIds, hitNode.id];
      } else {
        nextIds = selectedNodeIds.includes(hitNode.id) ? selectedNodeIds : [hitNode.id];
      }
      onSelectNodeIds(nextIds);

      dragModeRef.current = "move";
      setHoverCursor("grabbing");
      const currentSelected = doc.nodes.filter((n) => nextIds.includes(n.id));
      dragStartRef.current = {
        startX: docPt.x,
        startY: docPt.y,
        nodeStarts: currentSelected.map((n) => ({
          id: n.id, x: n.x, y: n.y, width: n.width, height: n.height, rotation: n.rotation || 0
        }))
      };
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } else {
      if (!e.shiftKey) onSelectNodeIds([]);
      dragModeRef.current = "marquee";
      setHoverCursor("crosshair");
      dragStartRef.current = { startX: docPt.x, startY: docPt.y, nodeStarts: [] };
      setMarqueeBox({ x: docPt.x, y: docPt.y, width: 0, height: 0 });
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move Handler (Transient update — zero command emission during drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const docPt = {
      x: ((e.clientX - rect.left) / rect.width) * doc.canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * doc.canvas.height
    };

    if (!dragStartRef.current || !dragModeRef.current) {
      const handle = hitTestHandles(docPt.x, docPt.y);
      if (handle) {
        setHoverCursor(getHandleCursor(handle));
      } else {
        const hitNode = [...doc.nodes].reverse().find((n) => {
          const { minX, maxX, minY, maxY } = getNodeHitBounds(n);
          return docPt.x >= minX && docPt.x <= maxX && docPt.y >= minY && docPt.y <= maxY;
        });
        setHoverCursor(hitNode ? "grab" : (selectedNodeIds.length > 0 ? "default" : "crosshair"));
      }
      return;
    }

    const deltaX = docPt.x - dragStartRef.current.startX;
    const deltaY = docPt.y - dragStartRef.current.startY;

    if (dragModeRef.current === "move") {
      const primaryStart = dragStartRef.current.nodeStarts[0];
      if (!primaryStart || !selectedNode) return;

      const targetX = Math.round(primaryStart.x + deltaX);
      const targetY = Math.round(primaryStart.y + deltaY);

      const otherNodes = doc.nodes.filter((n) => !selectedNodeIds.includes(n.id));
      const snapResult = snapEngine.calculateSnap(
        { x: targetX, y: targetY, width: selectedNode.width, height: selectedNode.height },
        otherNodes,
        doc.canvas.width,
        doc.canvas.height
      );

      setActiveGuides(snapResult.guides);
      const snappedDeltaX = snapResult.x - primaryStart.x;
      const snappedDeltaY = snapResult.y - primaryStart.y;

      for (const ns of dragStartRef.current.nodeStarts) {
        const node = doc.nodes.find((n) => n.id === ns.id);
        if (node) {
          node.x = ns.x + snappedDeltaX;
          node.y = ns.y + snappedDeltaY;
        }
      }
    } else if (dragModeRef.current === "resize" && activeHandleRef.current && selectedNode) {
      const start = dragStartRef.current.nodeStarts[0];
      if (!start) return;

      let newX = start.x;
      let newY = start.y;
      let newW = start.width;
      let newH = start.height;

      const handle = activeHandleRef.current;

      if (handle.includes("r")) newW = Math.max(20, start.width + deltaX);
      if (handle.includes("b")) newH = Math.max(20, start.height + deltaY);
      if (handle.includes("l")) {
        const diff = Math.min(deltaX, start.width - 20);
        newX = start.x + diff;
        newW = start.width - diff;
      }
      if (handle.includes("t")) {
        const diff = Math.min(deltaY, start.height - 20);
        newY = start.y + diff;
        newH = start.height - diff;
      }

      // Shift -> lock aspect ratio
      if (e.shiftKey && start.width > 0 && start.height > 0) {
        const ratio = start.width / start.height;
        newH = Math.round(newW / ratio);
      }

      selectedNode.x = Math.round(newX);
      selectedNode.y = Math.round(newY);
      selectedNode.width = Math.round(newW);
      selectedNode.height = Math.round(newH);
    } else if (dragModeRef.current === "rotate" && selectedNode) {
      const start = dragStartRef.current.nodeStarts[0];
      if (!start) return;

      const centerX = selectedNode.x + selectedNode.width / 2;
      const centerY = selectedNode.y + selectedNode.height / 2;

      let angleRad = Math.atan2(docPt.y - centerY, docPt.x - centerX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);

      if (angleDeg < 0) angleDeg += 360;

      // Modifier semantics: no modifier = free rotation; Shift = 15° increment snap
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      }
      // Free rotation — no forced snap, user has full control

      selectedNode.rotation = angleDeg % 360;
    } else if (dragModeRef.current === "marquee") {
      const minX = Math.min(dragStartRef.current.startX, docPt.x);
      const minY = Math.min(dragStartRef.current.startY, docPt.y);
      const width = Math.abs(docPt.x - dragStartRef.current.startX);
      const height = Math.abs(docPt.y - dragStartRef.current.startY);

      setMarqueeBox({ x: minX, y: minY, width, height });

      const hitIds = doc.nodes
        .filter((n) => n.x >= minX && n.x + n.width <= minX + width && n.y >= minY && n.y + n.height <= minY + height)
        .map((n) => n.id);

      onSelectNodeIds(hitIds);
    }
  };

  // Pointer Up Handler (Commit exactly ONE atomic BATCH_COMMANDS transaction)
  const handlePointerUp = () => {
    if (dragStartRef.current && dragModeRef.current) {
      const mode = dragModeRef.current;
      setActiveGuides([]);

      if (mode === "move" || mode === "resize") {
        const updateCmds: DocumentCommand[] = [];

        for (const ns of dragStartRef.current.nodeStarts) {
          const node = doc.nodes.find((n) => n.id === ns.id);
          if (node) {
            const finalX = node.x;
            const finalY = node.y;
            const finalW = node.width;
            const finalH = node.height;

            // Reset node back to initial starting snapshot before executing transactional command
            // so commandExecutor reads true prevValue and produces valid inverseCommand for Undo!
            node.x = ns.x;
            node.y = ns.y;
            node.width = ns.width;
            node.height = ns.height;

            if (finalX !== ns.x) updateCmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: node.id, path: "x", value: finalX });
            if (finalY !== ns.y) updateCmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: node.id, path: "y", value: finalY });
            if (finalW !== ns.width) updateCmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: node.id, path: "width", value: finalW });
            if (finalH !== ns.height) updateCmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: node.id, path: "height", value: finalH });
          }
        }

        if (updateCmds.length > 0) {
          onExecuteCommand({ type: "BATCH_COMMANDS", commands: updateCmds });
        }
      } else if (mode === "rotate" && selectedNode && dragStartRef.current.nodeStarts[0]) {
        const startRot = dragStartRef.current.nodeStarts[0].rotation;
        const finalRot = selectedNode.rotation;
        if (finalRot !== startRot) {
          selectedNode.rotation = startRot;
          onExecuteCommand({
            type: "UPDATE_NODE_PROPERTY",
            nodeId: selectedNode.id,
            path: "rotation",
            value: finalRot
          });
        }
      }

      dragModeRef.current = null;
      activeHandleRef.current = null;
      dragStartRef.current = null;
      setMarqueeBox(null);
    }
  };

  // Alignment Helper Commands
  const alignSelected = (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (selectedNodes.length === 0) return;
    const cmds: DocumentCommand[] = [];
    const isSingle = selectedNodes.length === 1;

    if (alignment === "left") {
      const targetX = isSingle ? 0 : Math.min(...selectedNodes.map((n) => n.x));
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "x", value: targetX }));
    } else if (alignment === "center") {
      const centerX = isSingle ? doc.canvas.width / 2 : selMinX + selW / 2;
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "x", value: Math.round(centerX - n.width / 2) }));
    } else if (alignment === "right") {
      const targetX = isSingle ? doc.canvas.width : Math.max(...selectedNodes.map((n) => n.x + n.width));
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "x", value: Math.round(targetX - n.width) }));
    } else if (alignment === "top") {
      const targetY = isSingle ? 0 : Math.min(...selectedNodes.map((n) => n.y));
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "y", value: targetY }));
    } else if (alignment === "middle") {
      const centerY = isSingle ? doc.canvas.height / 2 : selMinY + selH / 2;
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "y", value: Math.round(centerY - n.height / 2) }));
    } else if (alignment === "bottom") {
      const targetY = isSingle ? doc.canvas.height : Math.max(...selectedNodes.map((n) => n.y + n.height));
      selectedNodes.forEach((n) => cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "y", value: Math.round(targetY - n.height) }));
    }

    if (cmds.length > 0) onExecuteCommand({ type: "BATCH_COMMANDS", commands: cmds });
  };

  // Distribution Helper Commands
  const distributeSelected = (axis: "horizontal" | "vertical") => {
    if (selectedNodes.length < 3) return;
    const cmds: DocumentCommand[] = [];

    if (axis === "horizontal") {
      const sorted = [...selectedNodes].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((acc, n) => acc + n.width, 0);
      const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
      const gap = (span - totalWidth) / (sorted.length - 1);

      let currentX = sorted[0].x;
      sorted.forEach((n) => {
        cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "x", value: Math.round(currentX) });
        currentX += n.width + gap;
      });
    } else if (axis === "vertical") {
      const sorted = [...selectedNodes].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((acc, n) => acc + n.height, 0);
      const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
      const gap = (span - totalHeight) / (sorted.length - 1);

      let currentY = sorted[0].y;
      sorted.forEach((n) => {
        cmds.push({ type: "UPDATE_NODE_PROPERTY", nodeId: n.id, path: "y", value: Math.round(currentY) });
        currentY += n.height + gap;
      });
    }

    if (cmds.length > 0) onExecuteCommand({ type: "BATCH_COMMANDS", commands: cmds });
  };

  const reorderSelected = (direction: "up" | "down") => {
    if (selectedNodeIds.length !== 1) return;
    const targetId = selectedNodeIds[0];
    const sourceIndex = doc.nodes.findIndex((n) => n.id === targetId);
    if (sourceIndex === -1) return;

    const destinationIndex = direction === "up"
      ? Math.min(doc.nodes.length - 1, sourceIndex + 1)
      : Math.max(0, sourceIndex - 1);

    if (destinationIndex !== sourceIndex) {
      onExecuteCommand({ type: "REORDER_NODES", sourceIndex, destinationIndex });
    }
  };

  // Keyboard Shortcuts (Nudge, Delete, Duplicate, Deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedNodeIds.length === 0) return;
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const deleteCmds: DocumentCommand[] = selectedNodeIds.map((id) => ({ type: "DELETE_NODE", nodeId: id }));
        onExecuteCommand({ type: "BATCH_COMMANDS", commands: deleteCmds });
        onSelectNodeIds([]);
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const cloneCmds: DocumentCommand[] = [];
        const newIds: string[] = [];

        for (const id of selectedNodeIds) {
          const original = doc.nodes.find((n) => n.id === id);
          if (original) {
            const cloneNode: SceneNode = JSON.parse(JSON.stringify(original));
            cloneNode.id = `node-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
            cloneNode.name = `${original.name || original.id} Copy`;
            cloneNode.x += 20;
            cloneNode.y += 20;
            cloneCmds.push({ type: "ADD_NODE", node: cloneNode });
            newIds.push(cloneNode.id);
          }
        }
        if (cloneCmds.length > 0) {
          onExecuteCommand({ type: "BATCH_COMMANDS", commands: cloneCmds });
          onSelectNodeIds(newIds);
        }
      }

      const step = e.shiftKey ? 10 : 1;
      let nudgeAxis: "x" | "y" | null = null;
      let nudgeDir = 0;

      if (e.key === "ArrowLeft") { nudgeAxis = "x"; nudgeDir = -step; }
      else if (e.key === "ArrowRight") { nudgeAxis = "x"; nudgeDir = step; }
      else if (e.key === "ArrowUp") { nudgeAxis = "y"; nudgeDir = -step; }
      else if (e.key === "ArrowDown") { nudgeAxis = "y"; nudgeDir = step; }
      else if (e.key === "Escape") { onSelectNodeIds([]); }

      if (nudgeAxis) {
        const nudgeCmds: DocumentCommand[] = selectedNodeIds.map((id) => {
          const target = doc.nodes.find((n) => n.id === id);
          const currentVal = target ? (target as any)[nudgeAxis!] : 0;
          return { type: "UPDATE_NODE_PROPERTY", nodeId: id, path: nudgeAxis!, value: currentVal + nudgeDir };
        });
        onExecuteCommand({ type: "BATCH_COMMANDS", commands: nudgeCmds });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, doc.nodes, onExecuteCommand, onSelectNodeIds]);

  const scale = viewport.zoom / 100;

  return (
    <div ref={containerRef} className="relative flex-1 flex flex-col overflow-hidden select-none">
      {/* Main Canvas Viewport Area */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden p-4"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #141420 0%, #080810 70%)",
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, #141420 0%, #080810 70%), radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 24px 24px"
        }}
      >
        {/* Floating Spatial Alignment & Distribution Toolbar */}
        {selectedNodes.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-1.5 z-50 shadow-2xl">
            <button type="button" onClick={() => alignSelected("left")} title="Align Left" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignLeft size={14} /></button>
            <button type="button" onClick={() => alignSelected("center")} title="Align Center" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignCenter size={14} /></button>
            <button type="button" onClick={() => alignSelected("right")} title="Align Right" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignRight size={14} /></button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button type="button" onClick={() => alignSelected("top")} title="Align Top" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignVerticalSpaceAround size={14} /></button>
            <button type="button" onClick={() => alignSelected("middle")} title="Align Middle" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignHorizontalSpaceAround size={14} /></button>
            <button type="button" onClick={() => alignSelected("bottom")} title="Align Bottom" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><AlignVerticalSpaceAround size={14} className="rotate-180" /></button>

            {selectedNodes.length === 1 && (
              <>
                <div className="w-px h-4 bg-white/10 mx-0.5" />
                <button type="button" onClick={() => reorderSelected("up")} title="Bring Forward" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => reorderSelected("down")} title="Send Backward" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><ArrowDown size={14} /></button>
              </>
            )}

            {selectedNodes.length >= 3 && (
              <>
                <div className="w-px h-4 bg-white/10 mx-0.5" />
                <button type="button" onClick={() => distributeSelected("horizontal")} title="Distribute Horizontally" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><MoveHorizontal size={14} /></button>
                <button type="button" onClick={() => distributeSelected("vertical")} title="Distribute Vertically" className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><MoveVertical size={14} /></button>
              </>
            )}
          </div>
        )}

        {/* Selected node info badge */}
        {selectedNodeIds.length > 0 && (
          <div className="absolute top-4 right-4 rounded-xl border border-violet-500/20 bg-violet-500/10 backdrop-blur-md px-3 py-2 font-mono text-[10px] text-violet-300 pointer-events-none select-none space-y-0.5 z-20">
            <p className="font-bold text-violet-200">
              {selectedNodeIds.length === 1 ? (selectedNode?.name || selectedNode?.id) : `${selectedNodeIds.length} Nodes Selected`}
            </p>
            {selectedNode && selectedNodeIds.length === 1 && (
              <p className="text-violet-400/70">
                x:{Math.round(selectedNode.x)} y:{Math.round(selectedNode.y)} &nbsp;
                {Math.round(selectedNode.width)}×{Math.round(selectedNode.height)}
                {selectedNode.rotation ? ` · ${selectedNode.rotation}°` : ""}
              </p>
            )}
          </div>
        )}

        {/* Sizing box — reserves exact scaled layout bounds in flexbox */}
        <div
          style={{
            width: Math.round(doc.canvas.width * scale),
            height: Math.round(doc.canvas.height * scale)
          }}
          className="relative flex items-center justify-center shrink-0 transition-all duration-150"
        >
          {/* Canvas wrapper — zoom via CSS scale, positioned at center */}
          <div
            style={{
              width: doc.canvas.width,
              height: doc.canvas.height,
              transform: `scale(${scale})`,
              transformOrigin: "center",
              willChange: "transform"
            }}
            className="relative shrink-0"
          >
            {/* Background reference video container — conformed underneath WebGL canvas */}
            {referenceVideo && (
              <div
                ref={videoRefContainer}
                className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0 bg-black/50"
              />
            )}

            {/* Outer glow ring when something is selected */}
            <div
              className="absolute -inset-0.5 rounded-2xl transition-all duration-300 pointer-events-none z-10"
              style={{
                boxShadow: selectedNodeIds.length > 0
                  ? "0 0 0 2px rgba(124,111,255,0.5), 0 0 60px rgba(124,111,255,0.15)"
                  : "0 0 0 1.5px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.8)"
              }}
            />

            {/* The actual WebGL canvas */}
            <canvas
              ref={canvasRef}
              width={doc.canvas.width}
              height={doc.canvas.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="block rounded-2xl overflow-hidden relative z-20"
              style={{
                width: doc.canvas.width,
                height: doc.canvas.height,
                cursor: hoverCursor
              }}
            />

            {/* Marquee Selection Box Overlay */}
            {marqueeBox && (
              <div
                className="absolute border border-violet-400 bg-violet-500/15 pointer-events-none z-40 rounded-sm"
                style={{
                  left: marqueeBox.x,
                  top: marqueeBox.y,
                  width: marqueeBox.width,
                  height: marqueeBox.height,
                  boxShadow: "0 0 12px rgba(124,111,255,0.4)"
                }}
              />
            )}

            {/* Smart Alignment Guides (DOM overlay — above PixiJS canvas) */}
            {activeGuides.map((guide, i) => (
              <div
                key={i}
                className="absolute pointer-events-none z-30"
                style={
                  guide.type === "vertical"
                    ? {
                        left: `${(guide.position / doc.canvas.width) * 100}%`,
                        top: 0, bottom: 0, width: "1px",
                        background: "linear-gradient(to bottom, transparent, #7C6FFF 20%, #7C6FFF 80%, transparent)",
                        boxShadow: "0 0 6px 1px rgba(124,111,255,0.6)"
                      }
                    : {
                        top: `${(guide.position / doc.canvas.height) * 100}%`,
                        left: 0, right: 0, height: "1px",
                        background: "linear-gradient(to right, transparent, #7C6FFF 20%, #7C6FFF 80%, transparent)",
                        boxShadow: "0 0 6px 1px rgba(124,111,255,0.6)"
                      }
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Middle Toolbar Bar (between Canvas & Timeline) */}
      <div className="h-10 border-t border-white/[0.08] bg-[#0A0A12] flex items-center justify-center gap-3 px-4 z-30 shrink-0 select-none">
        <select
          value={`${doc.canvas.width}x${doc.canvas.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split("x").map(Number);
            if (w && h) {
              onExecuteCommand({ type: "UPDATE_CANVAS_SIZE", width: w, height: h });
            }
          }}
          className="bg-transparent text-violet-300 font-bold font-mono text-[10px] outline-none cursor-pointer hover:text-violet-200 transition-colors"
        >
          <option value="1280x720" className="bg-[#0F0F14] text-white">16:9 (1280×720)</option>
          <option value="1080x1920" className="bg-[#0F0F14] text-white">9:16 (1080×1920)</option>
          <option value="1080x1080" className="bg-[#0F0F14] text-white">1:1 (1080×1080)</option>
          <option value="1080x1350" className="bg-[#0F0F14] text-white">4:5 (1080×1350)</option>
        </select>

        <span className="text-gray-600 font-mono text-xs">·</span>

        <div className="flex items-center gap-1 font-mono text-[10px] text-gray-300">
          <button
            type="button"
            onClick={() => onSetZoom?.(Math.max(20, viewport.zoom - 10))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer font-bold transition-colors"
            title="Zoom Out"
          >
            -
          </button>
          <span className="w-9 text-center font-bold text-gray-200">{viewport.zoom}%</span>
          <button
            type="button"
            onClick={() => onSetZoom?.(Math.min(300, viewport.zoom + 10))}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer font-bold transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleAutoFit}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[9px] font-bold cursor-pointer ml-1 transition-colors"
            title="Fit canvas to viewport"
          >
            Fit
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsInsertPaletteOpen(true)}
          className="ml-2 px-2.5 py-1 rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 text-[10px] font-bold border border-violet-500/40 cursor-pointer shadow-sm transition-all"
        >
          + Insert (Cmd+K)
        </button>
      </div>

      {/* Cmd+K Insert Palette Modal */}
      <InsertPalette
        isOpen={isInsertPaletteOpen}
        onClose={() => setIsInsertPaletteOpen(false)}
        onInsertNode={(node) => onExecuteCommand({ type: "ADD_NODE", node })}
      />
    </div>
  );
}
