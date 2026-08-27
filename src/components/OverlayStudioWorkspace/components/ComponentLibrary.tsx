import React, { useState } from "react";
import {
  Search,
  Plus,
  Sparkles,
  Layers,
  Box,
  Type,
  Square,
  Circle,
  Image,
  List,
  BarChart3,
  Gauge,
  Clock,
  Table,
  TrendingUp,
  ArrowUpRight,
  Minus,
  Video,
  Volume2,
  Film,
} from "lucide-react";
import {
  primitiveRegistry,
  componentRegistry,
  type DocumentCommand,
  type SceneNode,
} from "@clypra-studio/engine";

const VISUALIZATION_PRIMITIVES = [
  {
    type: "metric",
    name: "Metric / KPI",
    icon: <TrendingUp size={14} className="text-emerald-400" />,
  },
  {
    type: "gauge",
    name: "Gauge Meter",
    icon: <Gauge size={14} className="text-sky-400" />,
  },
  {
    type: "chart",
    name: "Animated Bar Chart",
    icon: <BarChart3 size={14} className="text-violet-400" />,
  },
  {
    type: "timeline",
    name: "Timeline Axis",
    icon: <Clock size={14} className="text-amber-400" />,
  },
  {
    type: "table",
    name: "Data Table",
    icon: <Table size={14} className="text-pink-400" />,
  },
];

const PRIMITIVE_TYPES = new Set([
  "text-primitive",
  "rect-primitive",
  "circle-primitive",
  "line-primitive",
  "image-primitive",
  "frame-primitive",
  "repeater-primitive",
  "icon-primitive",
  "connector-primitive",
  "video-primitive",
  "audio-primitive",
  "lottie-primitive",
]);

const PRIMITIVE_ICONS: Record<string, React.ReactNode> = {
  "text-primitive": <Type size={14} className="text-emerald-400" />,
  "rect-primitive": <Square size={14} className="text-amber-400" />,
  "circle-primitive": <Circle size={14} className="text-violet-400" />,
  "line-primitive": <Minus size={14} className="text-sky-400" />,
  "image-primitive": <Image size={14} className="text-pink-400" />,
  "frame-primitive": <Box size={14} className="text-indigo-400" />,
  "repeater-primitive": <List size={14} className="text-sky-400" />,
  "icon-primitive": <Sparkles size={14} className="text-yellow-400" />,
  "connector-primitive": <ArrowUpRight size={14} className="text-rose-400" />,
  "video-primitive": <Video size={14} className="text-cyan-400" />,
  "audio-primitive": <Volume2 size={14} className="text-orange-400" />,
  "lottie-primitive": <Film size={14} className="text-purple-400" />,
};

interface ComponentLibraryProps {
  onExecuteCommand: (cmd: DocumentCommand) => void;
  selectedNode?: SceneNode | null;
}

export function ComponentLibrary({ onExecuteCommand, selectedNode }: ComponentLibraryProps) {
  const [search, setSearch] = useState("");

  const allComponents = componentRegistry?.getAll() ?? [];
  const filtered = allComponents.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  const primitives = filtered.filter((c) => PRIMITIVE_TYPES.has(c.type));

  const centerNodeOnCanvas = <
    T extends { x: number; y: number; width?: number; height?: number },
  >(
    node: T,
  ): T => {
    const w = node.width || 400;
    const h = node.height || 300;
    // Auto-center node initially on canvas (1280x720 base resolution)
    node.x = Math.round((1280 - w) / 2);
    node.y = Math.round((720 - h) / 2);
    return node;
  };

  const isContainerSelected =
    selectedNode &&
    (selectedNode.type === "frame" ||
      selectedNode.type === "repeater" ||
      "children" in selectedNode);

  const handleInsert = (comp: (typeof allComponents)[number]) => {
    const defaultNode = comp.createDefaultNode();
    if (isContainerSelected && selectedNode) {
      const node = { ...defaultNode, x: 16, y: 16 };
      onExecuteCommand({ type: "ADD_NODE", node: node as SceneNode, parentId: selectedNode.id });
    } else {
      const node = centerNodeOnCanvas(defaultNode);
      onExecuteCommand({ type: "ADD_NODE", node: node as SceneNode });
    }
  };

  const handleInsertVisualization = (type: string) => {
    const defaultNode = primitiveRegistry.createDefaultNode(type as any);
    if (isContainerSelected && selectedNode) {
      const node = { ...defaultNode, x: 16, y: 16 };
      onExecuteCommand({ type: "ADD_NODE", node: node as SceneNode, parentId: selectedNode.id });
    } else {
      const node = centerNodeOnCanvas(defaultNode);
      onExecuteCommand({ type: "ADD_NODE", node: node as SceneNode });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search primitives & visualizations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1C1C22] border border-white/6 rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none transition-colors"
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
                <Plus
                  size={12}
                  className="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                />
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
                    {PRIMITIVE_ICONS[comp.type] || (
                      <Box size={14} className="text-gray-400" />
                    )}
                  </span>
                  <Plus
                    size={12}
                    className="text-gray-500 group-hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all"
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate w-full">
                  {comp.name
                    .replace(" Shape", "")
                    .replace(" Slot", "")
                    .replace(" Layer", "")
                    .replace(" Container", "")
                    .replace(" List", "")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-[11px] text-gray-600">
          No items match "{search}"
        </p>
      )}
    </div>
  );
}
