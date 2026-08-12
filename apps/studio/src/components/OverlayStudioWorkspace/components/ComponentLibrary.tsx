import React, { useState } from "react";
import { Search, Plus, Sparkles, Layers, Box, Type, Square, Circle, Image, List, BarChart3, Gauge, Clock, MessageSquare, ArrowUpRight } from "lucide-react";
import { primitiveRegistry, componentRegistry, type DocumentCommand } from "@clypra-studio/engine";

const VISUALIZATION_PRIMITIVES = [
  { type: "chart", name: "Animated Bar Chart", icon: <BarChart3 size={14} className="text-emerald-400" /> },
  { type: "gauge", name: "Gauge Meter", icon: <Gauge size={14} className="text-sky-400" /> },
  { type: "timeline", name: "Timeline Axis", icon: <Clock size={14} className="text-amber-400" /> },
  { type: "annotation", name: "Geometry Annotation", icon: <MessageSquare size={14} className="text-violet-400" /> },
  { type: "connector", name: "Connector Arrow", icon: <ArrowUpRight size={14} className="text-pink-400" /> },
];

const PRIMITIVE_TYPES = new Set([
  "text-primitive",
  "rect-primitive",
  "circle-primitive",
  "line-primitive",
  "image-primitive",
  "frame-primitive",
  "repeater-primitive"
]);

const PRIMITIVE_ICONS: Record<string, React.ReactNode> = {
  "text-primitive": <Type size={14} className="text-emerald-400" />,
  "rect-primitive": <Square size={14} className="text-amber-400" />,
  "circle-primitive": <Circle size={14} className="text-violet-400" />,
  "line-primitive": <Square size={14} className="text-sky-400" />,
  "image-primitive": <Image size={14} className="text-pink-400" />,
  "frame-primitive": <Box size={14} className="text-indigo-400" />,
  "repeater-primitive": <List size={14} className="text-sky-400" />,
};

interface ComponentLibraryProps {
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function ComponentLibrary({ onExecuteCommand }: ComponentLibraryProps) {
  const [search, setSearch] = useState("");

  const allComponents = componentRegistry?.getAll() ?? [];
  const filtered = allComponents.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const primitives = filtered.filter((c) => PRIMITIVE_TYPES.has(c.type));
  const templates = filtered.filter((c) => !PRIMITIVE_TYPES.has(c.type));

  const centerNodeOnCanvas = <T extends { x: number; y: number; width?: number; height?: number }>(node: T): T => {
    const w = node.width || 400;
    const h = node.height || 300;
    // Auto-center node initially on canvas (1280x720 base resolution)
    node.x = Math.round((1280 - w) / 2);
    node.y = Math.round((720 - h) / 2);
    return node;
  };

  const handleInsert = (comp: (typeof allComponents)[number]) => {
    const node = centerNodeOnCanvas(comp.createDefaultNode());
    onExecuteCommand({ type: "ADD_NODE", node });
  };

  const handleInsertVisualization = (type: string) => {
    const node = centerNodeOnCanvas(primitiveRegistry.createDefaultNode(type as any));
    onExecuteCommand({ type: "ADD_NODE", node });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search primitives & templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1C1C22] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Visualizations Section */}
      <div>
        <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <BarChart3 size={11} className="text-emerald-400" />
          <span>Visualizations</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {VISUALIZATION_PRIMITIVES.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleInsertVisualization(item.type)}
              className="group flex flex-col items-start gap-1 p-2 rounded-lg bg-[#15151A] hover:bg-emerald-500/10 border border-white/[0.05] hover:border-emerald-500/30 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between w-full">
                <span className="p-1 rounded bg-white/[0.04]">{item.icon}</span>
                <Plus size={12} className="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate w-full">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Primitives Section */}
      {primitives.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Layers size={11} className="text-violet-400" />
            <span>Primitives</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {primitives.map((comp) => (
              <button
                key={comp.type}
                type="button"
                onClick={() => handleInsert(comp)}
                className="group flex flex-col items-start gap-1 p-2 rounded-lg bg-[#15151A] hover:bg-violet-500/10 border border-white/[0.05] hover:border-violet-500/30 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="p-1 rounded bg-white/[0.04]">
                    {PRIMITIVE_ICONS[comp.type] || <Box size={14} className="text-gray-400" />}
                  </span>
                  <Plus size={12} className="text-gray-500 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate w-full">
                  {comp.name.replace(" Shape", "").replace(" Slot", "").replace(" Layer", "").replace(" Container", "").replace(" List", "")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-1 mt-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Sparkles size={11} className="text-indigo-400" />
            <span>Templates</span>
          </div>

          <div className="flex flex-col gap-1">
            {templates.map((comp) => (
              <button
                key={comp.type}
                type="button"
                onClick={() => handleInsert(comp)}
                className="group flex items-center gap-2.5 rounded-lg p-2 bg-[#15151A] hover:bg-indigo-500/10 border border-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer text-left"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400 font-bold text-xs">
                  {comp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate">{comp.name}</p>
                  <p className="text-[9px] text-gray-500 truncate mt-0.5">{comp.description}</p>
                </div>
                <Plus size={13} className="shrink-0 text-gray-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-[11px] text-gray-600">No items match "{search}"</p>
      )}
    </div>
  );
}
