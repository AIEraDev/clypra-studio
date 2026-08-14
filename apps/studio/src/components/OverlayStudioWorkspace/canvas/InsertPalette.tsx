import React, { useState, useEffect, useRef } from "react";
import {
  componentRegistry,
  type ComponentDefinition,
  type SceneNode,
} from "@clypra-studio/engine";
import {
  Search,
  Box,
  Type,
  Square,
  Image,
  List,
  Layers,
  Plus,
  Scissors,
  Link,
  Zap,
  Download,
  Trash2,
  Play,
} from "lucide-react";

export interface PaletteItem {
  id: string;
  kind: "component" | "action" | "template" | "command";
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
}

interface InsertPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertNode: (node: SceneNode) => void;
  onExecuteAction?: (actionId: string) => void;
}

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  typography: Type,
  layout: Square,
  media: Image,
  metrics: Box,
  social: Layers,
  code: Box,
  people: Box,
  process: List,
  comparison: Square,
  primitives: Square,
  actions: Zap,
  commands: Download,
  templates: SparklesIcon,
};

function SparklesIcon({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <Zap size={size} className={className} />;
}

export function InsertPalette({
  isOpen,
  onClose,
  onInsertNode,
  onExecuteAction,
}: InsertPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build unified item list across primitives, actions, and commands
  const components: PaletteItem[] = componentRegistry
    .getAll()
    .filter((comp) => comp.type.endsWith("-primitive"))
    .map((comp) => ({
      id: `comp-${comp.type}`,
      kind: "component",
      title: comp.name.replace(" Primitive", "").replace(" Layer", "").replace(" Shape", ""),
      category: "primitives",
      description: comp.description,
      icon: CATEGORY_ICONS[comp.category] || Box,
      onSelect: () => {
        onInsertNode(comp.createDefaultNode() as SceneNode);
      },
    }));

  const actions: PaletteItem[] = [
    {
      id: "action-detach",
      kind: "action",
      title: "Detach Component",
      category: "actions",
      description: "Convert selected component into editable plain scene frame",
      icon: Scissors,
      onSelect: () => onExecuteAction?.("DETACH_COMPONENT"),
    },
    {
      id: "action-group",
      kind: "action",
      title: "Group Selected Nodes (Cmd+G)",
      category: "actions",
      description: "Group selected nodes into a parent Frame container",
      icon: Layers,
      onSelect: () => onExecuteAction?.("GROUP_NODES"),
    },
    {
      id: "action-ungroup",
      kind: "action",
      title: "Ungroup Frame (Cmd+Shift+G)",
      category: "actions",
      description: "Unpack container frame and release child nodes to root",
      icon: Layers,
      onSelect: () => onExecuteAction?.("UNGROUP_NODES"),
    },
    {
      id: "action-add-var",
      kind: "action",
      title: "Add Document Variable",
      category: "actions",
      description: "Create a new dynamic data variable for binding",
      icon: Link,
      onSelect: () => onExecuteAction?.("ADD_VARIABLE"),
    },
  ];

  const commands: PaletteItem[] = [
    {
      id: "cmd-export-json",
      kind: "command",
      title: "Export Document JSON",
      category: "commands",
      description: "Download the current OverlayDocument schema file",
      icon: Download,
      onSelect: () => onExecuteAction?.("EXPORT_JSON"),
    },
    {
      id: "cmd-play-toggle",
      kind: "command",
      title: "Toggle Playback (Space)",
      category: "commands",
      description: "Play or pause real-time animation playback",
      icon: Play,
      onSelect: () => onExecuteAction?.("TOGGLE_PLAY"),
    },
  ];

  const allItems = [...components, ...actions, ...commands];

  const filtered = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? (prev + 1) % filtered.length : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0
            ? (prev - 1 + filtered.length) % filtered.length
            : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0F0F14] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden font-sans flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/6 bg-[#151519]">
          <Search size={16} className="text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search components, actions, commands… (Cmd+K)"
            className="w-full bg-transparent text-[13px] text-white placeholder-gray-500 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-gray-400 border border-white/[0.08]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-[12px]">
              No matching components or commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon || Box;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "bg-violet-600/20 border border-violet-500/40 text-white"
                      : "hover:bg-white/[0.04] text-gray-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-violet-500 text-white"
                          : "bg-white/[0.06] text-violet-400"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-gray-500 px-1 py-0.2 rounded bg-white/[0.04]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Plus
                    size={14}
                    className={isSelected ? "text-violet-400" : "text-gray-600"}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-white/4 bg-[#0A0A0E] text-[10px] text-gray-500 flex items-center justify-between">
          <span>
            Press <kbd className="font-mono text-gray-400">↑</kbd>{" "}
            <kbd className="font-mono text-gray-400">↓</kbd> to navigate
          </span>
          <span>
            Press <kbd className="font-mono text-gray-400">↵</kbd> to select
          </span>
        </div>
      </div>
    </div>
  );
}
