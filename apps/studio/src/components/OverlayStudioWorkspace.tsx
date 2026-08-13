import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Undo2, Redo2, Save, Monitor, CheckCircle,
  ZoomIn, ZoomOut, Maximize2, Eye, Play, Pause, Database, FlaskConical, Download, Video, X
} from "lucide-react";
import {
  type SceneNode,
  type ViewportState,
  smartOverlayRegistry
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

export function OverlayStudioWorkspace({ onExit }: OverlayStudioWorkspaceProps = {}) {
  const { doc, executeCommand, undo, redo, canUndo, canRedo } = useOverlayDocument();
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [leftTab, setLeftTab] = useState<LeftTab>("components");

  // Ephemeral preview data — never persisted to document
  const [previewContext, setPreviewContext] = useState<Record<string, any>>({});
  const [showDataPreview, setShowDataPreview] = useState(false);

  // Background Reference Video context layer (ephemeral, design-time only, never saved to doc)
  const [referenceVideo, setReferenceVideo] = useState<HTMLVideoElement | null>(null);
  const [referenceVideoMeta, setReferenceVideoMeta] = useState<{ sourceWidth: number; sourceHeight: number; duration: number } | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Active breakpoint — null = canonical / base layout
  const [activeBreakpointId, setActiveBreakpointId] = useState<string | null>(null);

  // Phase 4L Export UI state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportJobRecord[]>([]);

  // Derive primary selected node (first selected)
  const selectedNode = doc.nodes.find((n) => selectedNodeIds.includes(n.id)) || null;

  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 55,
    panX: 0,
    panY: 0,
    canvasWidth: 1280,
    canvasHeight: 720
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Import background reference video (captures width/height on loadedmetadata)
  const handleImportReferenceVideo = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.loop = true;
    video.muted = true; // design reference only — no audio needed
    video.playsInline = true;

    video.onloadedmetadata = () => {
      setReferenceVideoMeta({
        sourceWidth: video.videoWidth,
        sourceHeight: video.videoHeight,
        duration: video.duration
      });
      setReferenceVideo(video);
      setNoticeMessage(`Reference video loaded: ${video.videoWidth}×${video.videoHeight}`);
      setTimeout(() => setNoticeMessage(null), 3000);
    };
  };

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
    const targetTime = referenceVideo.duration > 0 ? currentTime % referenceVideo.duration : currentTime;
    if (Math.abs(referenceVideo.currentTime - targetTime) > 0.15) {
      referenceVideo.currentTime = targetTime;
    }
  }, [currentTime, referenceVideo, referenceVideoMeta]);

  // 60 FPS Playhead (completely outside React — only reads/writes refs)
  useEffect(() => {
    const loop = (timestamp: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      if (!isPlaying) return;
      const delta = lastTimeRef.current !== null ? (timestamp - lastTimeRef.current) / 1000 : 0;
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      const isCmd = e.metaKey || e.ctrlKey;

      if (isCmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? (canRedo && redo()) : (canUndo && undo());
      } else if ((e.key === "Backspace" || e.key === "Delete") && selectedNodeIds.length > 0) {
        e.preventDefault();
        selectedNodeIds.forEach((id) => {
          executeCommand({ type: "DELETE_NODE", nodeId: id });
        });
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
          executeCommand({ type: "GROUP_NODES", nodeIds: selectedNodeIds, frameName: "Group Frame" });
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
  }, [undo, redo, canUndo, canRedo, selectedNodeIds, selectedNode, doc.nodes, executeCommand]);

  const handleExportDocument = () => {
    try {
      const artifact = {
        documentId: doc.id || `doc-${Date.now()}`,
        revision: doc.schemaVersion || 1,
        schemaVersion: "2.0",
        updatedAt: doc.updatedAt || new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        author: "Clypra Studio",
        document: doc,
      };

      const jsonStr = JSON.stringify(artifact, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${doc.title.toLowerCase().replace(/\s+/g, "-") || "overlay-document"}.clypra-overlay`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNoticeMessage(`Artifact published as ${fileName}`);
      setTimeout(() => setNoticeMessage(null), 2500);
    } catch (err: any) {
      setNoticeMessage(`Export document failed: ${err.message}`);
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    try {
      await smartOverlayRegistry.saveToLocalCache(doc as any);
      setNoticeMessage("Template saved to AppCache");
      setTimeout(() => setNoticeMessage(null), 2500);
    } catch (err: any) {
      setNoticeMessage(`Save failed: ${err.message}`);
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  const zoomIn = () => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom + 10, 200) }));
  const zoomOut = () => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom - 10, 25) }));
  const zoomFit = () => setViewport((v) => ({ ...v, zoom: 75 }));

  const LEFT_TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
    { id: "components", label: "Add", icon: null },
    { id: "layers", label: "Layers", icon: null },
    { id: "variables", label: "Data", icon: null },
  ];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans text-white select-none" style={{ zIndex: 9999, background: "#0C0C10" }}>

      {/* ── TOP MENU BAR ─────────────────────────────────────────────── */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#111116] px-4 z-40" style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
        {/* Left — Branding + Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Clypra</span>
            <span className="text-gray-600">/</span>
            <span className="text-[13px] font-semibold text-white">{doc.title}</span>
            <span className="rounded-md bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 font-mono">v2.0</span>
          </div>
        </div>

        {/* Center — Primary Tool Actions */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-[#0E0E13] p-1">
          {[
            { icon: <Undo2 size={13} />, action: undo, disabled: !canUndo, title: "Undo (⌘Z)" },
            { icon: <Redo2 size={13} />, action: redo, disabled: !canRedo, title: "Redo (⌘⇧Z)" },
          ].map((btn, i) => (
            <button key={i} type="button" onClick={btn.action} disabled={btn.disabled} title={btn.title}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-25 transition-all cursor-pointer">
              {btn.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button type="button" onClick={zoomOut} title="Zoom Out" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"><ZoomOut size={13} /></button>
          <span className="px-2 text-[11px] font-mono font-bold text-gray-300 w-12 text-center">{viewport.zoom}%</span>
          <button type="button" onClick={zoomIn} title="Zoom In" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"><ZoomIn size={13} /></button>
          <button type="button" onClick={zoomFit} title="Fit to Screen" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer"><Maximize2 size={13} /></button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button type="button" onClick={() => setIsPlaying((p) => !p)} title="Play/Pause (Space)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer">
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

        {/* Right — Reference Video, Save, Export & Exit */}
        <div className="flex items-center gap-2">
          {noticeMessage && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 animate-pulse">
              <CheckCircle size={12} /> {noticeMessage}
            </div>
          )}
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
              <span>Ref: {referenceVideoMeta.sourceWidth}×{referenceVideoMeta.sourceHeight}</span>
              <button
                type="button"
                onClick={() => { setReferenceVideo(null); setReferenceVideoMeta(null); }}
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
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 transition-all cursor-pointer"
            >
              <Video size={12} /> Import Video
            </button>
          )}
          <button type="button" onClick={handleExportDocument}
            title="Export full OverlayDocument schema (.clypra-overlay JSON)"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer">
            <Download size={12} /> .clypra-overlay
          </button>
          <button type="button" onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500/25 transition-all cursor-pointer shadow-md shadow-violet-500/10">
            <Download size={12} /> Export Video
          </button>
          <button type="button" onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer">
            <Save size={12} /> Save
          </button>
          <button type="button" onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer">
            <Monitor size={12} /> Exit Studio
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
              <button key={tab.id} type="button" onClick={() => setLeftTab(tab.id as LeftTab)}
                className={`flex-1 py-2.5 text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  leftTab === tab.id
                    ? "text-white border-b-2 border-violet-500 bg-violet-500/5"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}>
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
                ) : tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {leftTab === "components" && (
              <div className="p-3">
                <ComponentLibrary onExecuteCommand={executeCommand} />
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
              <AssetLibraryPanel
                doc={doc}
                onExecuteCommand={executeCommand}
              />
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
        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: "#080810" }}>
          <CanvasViewport
            doc={doc}
            selectedNode={selectedNode}
            selectedNodeIds={selectedNodeIds}
            currentTime={currentTime}
            viewport={viewport}
            referenceVideo={referenceVideo}
            referenceVideoMeta={referenceVideoMeta}
            onSelectNodeIds={setSelectedNodeIds}
            onExecuteCommand={executeCommand}
            onSetZoom={(zoom) => setViewport((prev) => ({ ...prev, zoom }))}
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
            <div className="w-64 shrink-0 border-l border-white/[0.05] flex flex-col overflow-hidden" style={{ background: "#0F0F14" }}>
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
        onJobComplete={(record) => setExportHistory((prev) => [record, ...prev])}
      />
    </div>
  );
}
