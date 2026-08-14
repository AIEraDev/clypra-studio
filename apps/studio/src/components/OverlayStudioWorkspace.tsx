import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Undo2,
  Redo2,
  Save,
  Monitor,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Play,
  Pause,
  Database,
  FlaskConical,
  Download,
  Video,
  X,
} from "lucide-react";
import {
  type SceneNode,
  type ViewportState,
  smartOverlayRegistry,
} from "@clypra-studio/engine";

import { useOverlayDocument } from "./OverlayStudioWorkspace/hooks/useOverlayDocument";
import { CanvasViewport } from "./OverlayStudioWorkspace/canvas/CanvasViewport";
import { InspectorPanel } from "./OverlayStudioWorkspace/inspector/InspectorPanel";
import { LayersPanel } from "./OverlayStudioWorkspace/layers/LayersPanel";
import { ComponentLibrary } from "./OverlayStudioWorkspace/components/ComponentLibrary";
import { TimelinePanel } from "./OverlayStudioWorkspace/timeline/TimelinePanel";
import { VariableManagerPanel } from "./OverlayStudioWorkspace/data/VariableManagerPanel";
import { DataPreviewPanel } from "./OverlayStudioWorkspace/data/DataPreviewPanel";
import { AssetLibraryPanel } from "./OverlayStudioWorkspace/assets/AssetLibraryPanel";
import { ToastNotification } from "./ToastNotification";
import { FontManagerPanel } from "./OverlayStudioWorkspace/assets/FontManagerPanel";
import { BreakpointBar } from "./OverlayStudioWorkspace/breakpoints/BreakpointBar";
import { ExportModal } from "./OverlayStudioWorkspace/export/ExportModal";
import type { ExportJobRecord } from "@clypra-studio/engine";

interface OverlayStudioWorkspaceProps {
  onExit?: () => void;
}

type LeftTab = "components" | "layers" | "variables" | "assets" | "fonts";

const LEFT_TABS: Array<{ id: LeftTab; label: string }> = [
  { id: "components", label: "Components" },
  { id: "layers", label: "Layers" },
  { id: "variables", label: "Variables" },
  { id: "assets", label: "Assets" },
  { id: "fonts", label: "Fonts" },
];

export function OverlayStudioWorkspace({
  onExit,
}: OverlayStudioWorkspaceProps = {}) {
  const {
    doc,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    loadDocument,
    newDocument,
    lastSavedTime,
  } = useOverlayDocument();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [leftTab, setLeftTab] = useState<LeftTab>("components");

  // Project title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(doc.title);
  const projectFileInputRef = useRef<HTMLInputElement | null>(null);

  // Ephemeral preview data — never persisted to document
  const [previewContext, setPreviewContext] = useState<Record<string, any>>({});
  const [showDataPreview, setShowDataPreview] = useState(false);

  // Background Reference Video context layer (ephemeral, design-time only, never saved to doc)
  const [referenceVideo, setReferenceVideo] = useState<HTMLVideoElement | null>(
    null,
  );
  const [referenceVideoMeta, setReferenceVideoMeta] = useState<{
    sourceWidth: number;
    sourceHeight: number;
    duration: number;
  } | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Active breakpoint — null = canonical / base layout
  const [activeBreakpointId, setActiveBreakpointId] = useState<string | null>(
    null,
  );

  // Phase 4L Export UI state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportJobRecord[]>([]);

  const findNodeDeep = (nodes: SceneNode[], id: string): SceneNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if ("children" in n && Array.isArray((n as any).children)) {
        const found = findNodeDeep((n as any).children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Derive primary selected node (first selected at any nesting depth)
  const selectedNode = selectedNodeIds[0]
    ? findNodeDeep(doc.nodes, selectedNodeIds[0])
    : null;

  // Prune invalid selectedNodeIds when document changes (e.g. on undo/redo/delete)
  useEffect(() => {
    const validNodeIds = new Set<string>();
    const collectIds = (nodes: SceneNode[]) => {
      for (const n of nodes) {
        validNodeIds.add(n.id);
        if ("children" in n && Array.isArray((n as any).children)) {
          collectIds((n as any).children);
        }
      }
    };
    collectIds(doc.nodes);
    setSelectedNodeIds((prev) => {
      const next = prev.filter((id) => validNodeIds.has(id));
      if (next.length !== prev.length) {
        return next;
      }
      return prev;
    });
  }, [doc]);

  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 55,
    panX: 0,
    panY: 0,
    canvasWidth: 1280,
    canvasHeight: 720,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Save Project (.clypra-overlay file download + local app cache)
  const handleSave = async () => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("clypra_overlay_workspace_doc", JSON.stringify(doc));
      }
      const artifact = {
        documentId: doc.id || `doc-${Date.now()}`,
        revision: doc.schemaVersion || 1,
        schemaVersion: "2.0",
        updatedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        author: "Clypra Studio",
        document: doc,
      };

      const jsonStr = JSON.stringify(artifact, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${
        doc.title.toLowerCase().replace(/\s+/g, "-") || "overlay-project"
      }.clypra-overlay`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNoticeMessage(`Saved "${fileName}" to disk & local cache!`);
      setTimeout(() => setNoticeMessage(null), 3000);
    } catch (err: any) {
      setNoticeMessage(`Save failed: ${err.message}`);
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  // Open Project (.clypra-overlay or .json file upload)
  const handleOpenProjectFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const targetDoc = parsed.document || parsed;
        if (!targetDoc || typeof targetDoc !== "object") {
          throw new Error("Invalid Clypra project file");
        }
        loadDocument(targetDoc);
        setNoticeMessage(`Loaded project: "${targetDoc.title || file.name}"`);
        setTimeout(() => setNoticeMessage(null), 3000);
      } catch (err: any) {
        setNoticeMessage(`Failed to open project: ${err.message}`);
        setTimeout(() => setNoticeMessage(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  // Import background reference video (captures width/height on loadedmetadata)
  const handleImportReferenceVideo = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      setReferenceVideoMeta({
        sourceWidth: video.videoWidth,
        sourceHeight: video.videoHeight,
        duration: video.duration,
      });
      setReferenceVideo(video);
    };
  };

  const handleSetZoom = useCallback((zoom: number) => {
    setViewport((prev) => (prev.zoom === zoom ? prev : { ...prev, zoom }));
  }, []);

  // Sync reference video playback state and playhead currentTime
  useEffect(() => {
    if (!referenceVideo) return;
    if (isPlaying) {
      referenceVideo.play().catch(() => {});
    } else {
      referenceVideo.pause();
    }
  }, [isPlaying, referenceVideo]);

  useEffect(() => {
    if (!referenceVideo || !referenceVideoMeta) return;
    const targetTime =
      referenceVideo.duration > 0
        ? currentTime % referenceVideo.duration
        : currentTime;
    if (Math.abs(referenceVideo.currentTime - targetTime) > 0.15) {
      referenceVideo.currentTime = targetTime;
    }
  }, [currentTime, referenceVideo, referenceVideoMeta]);

  // 60 FPS Playhead (completely outside React — only reads/writes refs)
  useEffect(() => {
    const loop = (timestamp: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      if (!isPlaying) return;
      const delta =
        lastTimeRef.current !== null
          ? (timestamp - lastTimeRef.current) / 1000
          : 0;
      lastTimeRef.current = timestamp;
      setCurrentTime((t) => {
        const next = t + delta * playbackSpeed;
        return next > doc.duration ? 0 : next;
      });
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, playbackSpeed, doc.duration]);

  // Global Keyboard Shortcuts (⌘Z, ⌘⇧Z, ⌘S, ⌘G, ⌘⇧G, ⌘A, Space, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const isCmd = e.metaKey || e.ctrlKey;

      if (isCmd && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (isCmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? canRedo && redo() : canUndo && undo();
      } else if (
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedNodeIds.length > 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        const deleteCmds: DocumentCommand[] = selectedNodeIds.map((id) => ({
          type: "DELETE_NODE",
          nodeId: id,
        }));
        if (deleteCmds.length === 1) {
          executeCommand(deleteCmds[0]);
        } else if (deleteCmds.length > 1) {
          executeCommand({ type: "BATCH_COMMANDS", commands: deleteCmds });
        }
        setSelectedNodeIds([]);
      } else if (isCmd && e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (selectedNode && selectedNode.type === "frame") {
          executeCommand({ type: "UNGROUP_NODES", frameId: selectedNode.id });
          setSelectedNodeIds([]);
        }
      } else if (isCmd && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (selectedNodeIds.length >= 1) {
          executeCommand({
            type: "GROUP_NODES",
            nodeIds: selectedNodeIds,
            frameName: "Group Frame",
          });
        }
      } else if (isCmd && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedNodeIds(doc.nodes.map((n) => n.id));
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    selectedNodeIds,
    selectedNode,
    doc.nodes,
    executeCommand,
  ]);

  const zoomIn = () =>
    setViewport((v) => ({ ...v, zoom: Math.min(v.zoom + 10, 200) }));
  const zoomOut = () =>
    setViewport((v) => ({ ...v, zoom: Math.max(v.zoom - 10, 25) }));
  const zoomFit = () => setViewport((v) => ({ ...v, zoom: 75 }));

  const LEFT_TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
    { id: "components", label: "Add", icon: null },
    { id: "layers", label: "Layers", icon: null },
    { id: "variables", label: "Data", icon: null },
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden font-sans text-white select-none"
      style={{ zIndex: 9999, background: "#0C0C10" }}
    >
      {/* Hidden File Input for Opening .clypra-overlay project files */}
      <input
        type="file"
        ref={projectFileInputRef}
        accept=".clypra-overlay,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleOpenProjectFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* ── TOP MENU BAR ─────────────────────────────────────────────── */}
      <header
        className="flex h-11 shrink-0 items-center justify-between border-b border-white/6 bg-[#111116] px-4 z-40"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}
      >
        {/* Left — Branding + Editable Project Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
              Clypra
            </span>
            <span className="text-gray-600">/</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  if (titleInput.trim() && titleInput !== doc.title) {
                    executeCommand({
                      type: "UPDATE_DOCUMENT_META",
                      patch: { title: titleInput.trim() },
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false);
                    if (titleInput.trim() && titleInput !== doc.title) {
                      executeCommand({
                        type: "UPDATE_DOCUMENT_META",
                        patch: { title: titleInput.trim() },
                      });
                    }
                  } else if (e.key === "Escape") {
                    setIsEditingTitle(false);
                    setTitleInput(doc.title);
                  }
                }}
                className="bg-[#1C1C24] border border-violet-500 rounded px-2 py-0.5 text-[13px] font-semibold text-white outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(doc.title);
                  setIsEditingTitle(true);
                }}
                title="Click to rename overlay project"
                className="text-[13px] font-semibold text-white hover:text-violet-300 hover:bg-white/[0.04] px-1.5 py-0.5 rounded transition-colors cursor-pointer text-left"
              >
                {doc.title}
              </button>
            )}
            <span className="rounded-md bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 font-mono">
              v2.0
            </span>
          </div>
        </div>

        {/* Center — Primary Tool Actions */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-[#0E0E13] p-1">
          {[
            {
              icon: <Undo2 size={13} />,
              action: undo,
              disabled: !canUndo,
              title: "Undo (⌘Z)",
            },
            {
              icon: <Redo2 size={13} />,
              action: redo,
              disabled: !canRedo,
              title: "Redo (⌘⇧Z)",
            },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={btn.action}
              disabled={btn.disabled}
              title={btn.title}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-25 transition-all cursor-pointer"
            >
              {btn.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"
          >
            <ZoomOut size={13} />
          </button>
          <span className="px-2 text-[11px] font-mono font-bold text-gray-300 w-12 text-center">
            {viewport.zoom}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={zoomFit}
            title="Fit to Screen"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"
          >
            <Maximize2 size={13} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            title="Play/Pause (Space)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {/* Data Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowDataPreview((v) => !v)}
            title="Data Preview — inject test variables"
            className={`flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showDataPreview
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
            }`}
          >
            <FlaskConical size={12} />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Right — Project Open, Save, Reference Video, Export & Exit */}
        <div className="flex items-center gap-2">
          {/* New Project */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Create a new smart overlay project? Unsaved changes will be cleared.",
                )
              ) {
                newDocument();
                setNoticeMessage("Created new blank overlay project");
                setTimeout(() => setNoticeMessage(null), 2500);
              }
            }}
            title="New blank project"
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <Sparkles size={12} /> New
          </button>

          {/* Open / Load Project */}
          <button
            type="button"
            onClick={() => projectFileInputRef.current?.click()}
            title="Open an existing .clypra-overlay or .json project file"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <Download size={12} className="rotate-180" /> Open
          </button>

          {/* Save Project */}
          <button
            type="button"
            onClick={handleSave}
            title="Save project (.clypra-overlay) & cache draft (⌘S)"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Save size={12} /> Save (⌘S)
          </button>

          {/* Reference Video Import */}
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImportReferenceVideo(e.target.files[0]);
              }
            }}
          />
          {referenceVideoMeta ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
              <Video size={12} />
              <span>
                Ref: {referenceVideoMeta.sourceWidth}×
                {referenceVideoMeta.sourceHeight}
              </span>
              <button
                type="button"
                onClick={() => {
                  setReferenceVideo(null);
                  setReferenceVideoMeta(null);
                }}
                title="Remove Reference Video"
                className="ml-1 text-cyan-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              title="Import background reference video clip to align overlays against moving footage"
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 transition-all cursor-pointer"
            >
              <Video size={12} /> Video
            </button>
          )}

          {/* Export Video Modal */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500/25 transition-all cursor-pointer shadow-md shadow-violet-500/10"
          >
            <Download size={12} /> Export Video
          </button>

          {/* Exit Studio */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <Monitor size={12} /> Exit
          </button>
        </div>
      </header>

      {/* ── BREAKPOINT BAR ───────────────────────────────────────────── */}
      <BreakpointBar
        doc={doc}
        activeBreakpointId={activeBreakpointId}
        onExecuteCommand={executeCommand}
        onSetActive={setActiveBreakpointId}
      />

      {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ───────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-white/[0.05] bg-[#0F0F14] overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-white/[0.05] shrink-0">
            {LEFT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeftTab(tab.id as LeftTab)}
                className={`flex-1 py-2.5 text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  leftTab === tab.id
                    ? "text-white border-b-2 border-violet-500 bg-violet-500/5"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}
              >
                {tab.id === "variables" ? (
                  <span className="flex items-center justify-center gap-1">
                    <Database size={10} />
                    {tab.label}
                    {doc.variables.length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 text-[9px] font-bold">
                        {doc.variables.length}
                      </span>
                    )}
                  </span>
                ) : (
                  tab.label
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {leftTab === "components" && (
              <div className="p-3">
                <ComponentLibrary
                  onExecuteCommand={executeCommand}
                  selectedNode={selectedNode}
                />
              </div>
            )}
            {leftTab === "layers" && (
              <LayersPanel
                doc={doc}
                selectedNodeIds={selectedNodeIds}
                onSelectNodeIds={setSelectedNodeIds}
                onExecuteCommand={executeCommand}
              />
            )}
            {leftTab === "variables" && (
              <VariableManagerPanel
                doc={doc}
                onExecuteCommand={executeCommand}
              />
            )}
            {leftTab === "assets" && (
              <AssetLibraryPanel doc={doc} onExecuteCommand={executeCommand} />
            )}
            {leftTab === "fonts" && (
              <FontManagerPanel
                doc={doc}
                selectedNodeId={selectedNode?.id}
                onExecuteCommand={executeCommand}
              />
            )}
          </div>
        </aside>

        {/* ── CENTER CANVAS + TIMELINE ──────────────────────────────── */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "#080810" }}
        >
          <CanvasViewport
            doc={doc}
            selectedNodeIds={selectedNodeIds}
            currentTime={currentTime}
            viewport={viewport}
            referenceVideo={referenceVideo}
            onSelectNodeIds={setSelectedNodeIds}
            onExecuteCommand={executeCommand}
            onSetZoom={handleSetZoom}
          />
          <TimelinePanel
            doc={doc}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onSeek={setCurrentTime}
            onSetSpeed={setPlaybackSpeed}
            onExecuteCommand={executeCommand}
          />
        </main>

        {/* ── RIGHT INSPECTOR + DATA PREVIEW ───────────────────────── */}
        <div className="flex">
          {/* Data Preview Panel — slides in when active */}
          {showDataPreview && (
            <div
              className="w-64 shrink-0 border-l border-white/[0.05] flex flex-col overflow-hidden"
              style={{ background: "#0F0F14" }}
            >
              <DataPreviewPanel
                doc={doc}
                onApplyPreview={setPreviewContext}
                onExecuteCommand={executeCommand}
              />
            </div>
          )}

          {/* Inspector */}
          <InspectorPanel
            selectedNode={selectedNode}
            doc={doc}
            currentTime={currentTime}
            previewContext={previewContext}
            onExecuteCommand={executeCommand}
            onSeekTime={setCurrentTime}
          />
        </div>
      </div>

      {/* Export Modal Dialog */}
      <ExportModal
        doc={doc}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onJobComplete={(record) =>
          setExportHistory((prev) => [record, ...prev])
        }
      />

      {/* Floating Toast Notification (react-hot-toast / sonner style) */}
      <ToastNotification
        message={noticeMessage}
        onClose={() => setNoticeMessage(null)}
      />
    </div>
  );
}
