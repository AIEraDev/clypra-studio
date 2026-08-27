import React, { useState } from "react";
import {
  componentRegistry,
  type SceneNode,
  type ComponentNode,
  type RepeaterNode,
  type OverlayDocument,
  type DocumentCommand,
} from "@clypra-studio/engine";
import {
  Layers,
  Move,
  Palette,
  Sliders,
  SlidersHorizontal,
  Layout,
  Type,
  Eye,
  EyeOff,
  Wand2,
  Database,
  ChevronDown,
  ChevronRight,
  Play,
  BarChart3,
  Link2,
  Trash2,
} from "lucide-react";
import { AnchorControl } from "./controls/AnchorControl";
import { VisualizationControl } from "./controls/VisualizationControl";
import {
  TypographyControl,
  type TypographyValue,
} from "./controls/TypographyControl";
import {
  AppearanceControl,
  type AppearanceValue,
} from "./controls/AppearanceControl";
import {
  ConstraintControl,
  type ConstraintValue,
} from "./controls/ConstraintControl";
import { LayoutControl, type LayoutValue } from "./controls/LayoutControl";
import { AutoLayoutControl } from "./controls/AutoLayoutControl";
import { ColorControl } from "./controls/ColorControl";
import { BindingEditor } from "./controls/BindingEditor";
import { AnimationInspectorControl } from "./controls/AnimationInspectorControl";
import { RepeaterPanel } from "./RepeaterPanel";
import { PropertyRow } from "./PropertyRow";
import { ComponentHeaderBar } from "./ComponentHeaderBar";
import { AssetSelector } from "./controls/AssetSelector";
import { FontSelector } from "./controls/FontSelector";
import { ResourceDiagnosticsPanel } from "../assets/ResourceDiagnosticsPanel";
import { PerCharColorEditor } from "../../PerCharColorEditor";

interface InspectorPanelProps {
  selectedNode: SceneNode | null;
  doc: OverlayDocument;
  currentTime?: number;
  previewContext?: Record<string, any>;
  onExecuteCommand: (command: DocumentCommand) => void;
  onSelectTemplateNode?: (node: SceneNode) => void;
  onSeekTime?: (time: number) => void;
}

type ActiveTab = "style" | "layout" | "motion" | "data";

const LABEL_CLS =
  "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";
const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
      >
        <span className="text-violet-400 opacity-70">{icon}</span>
        <span className="flex-1 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        {open ? (
          <ChevronDown size={11} className="text-gray-600" />
        ) : (
          <ChevronRight size={11} className="text-gray-600" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <aside
      className="w-[280px] shrink-0 border-l border-white/6 flex flex-col items-center justify-center gap-3 text-center px-6"
      style={{ backgroundColor: "#0F0F14" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.04) 100%)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <Layers size={24} className="text-violet-400 opacity-70" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
          No Selection
        </p>
        <p className="mt-1.5 text-[11px] text-gray-600 leading-relaxed max-w-[180px]">
          Click a component or node on the canvas to inspect its properties.
        </p>
      </div>
    </aside>
  );
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "style", label: "Style" },
  { id: "layout", label: "Layout" },
  { id: "motion", label: "Motion" },
  { id: "data", label: "Data" },
];

function TabBar({
  active,
  onChange,
}: {
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
}) {
  return (
    <div
      className="flex border-b shrink-0"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors select-none ${
              isActive ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-violet-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function StyleTab({
  selectedNode,
  doc,
  previewContext,
  onExecuteCommand,
  onSelectTemplateNode,
}: {
  selectedNode: SceneNode;
  doc: OverlayDocument;
  previewContext?: Record<string, any>;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onSelectTemplateNode?: (node: SceneNode) => void;
}) {
  const isComponent = selectedNode.type === "component";
  const isText = selectedNode.type === "text";
  const isShape =
    (selectedNode.type as string) === "shape" ||
    (selectedNode.type as string) === "frame" ||
    selectedNode.type === "line" ||
    selectedNode.type === "connector" ||
    selectedNode.type === "icon" ||
    (selectedNode.type as string) === "circle" ||
    (selectedNode.type as string) === "rectangle" ||
    selectedNode.type === "repeater";
  const compNode = isComponent ? (selectedNode as ComponentNode) : null;
  const compDef = compNode
    ? componentRegistry.get(compNode.componentType)
    : null;

  const execProp = (path: string, value: unknown) =>
    onExecuteCommand({
      type: "UPDATE_NODE_PROPERTY",
      nodeId: selectedNode.id,
      path,
      value,
    });

  const style: Record<string, any> = (selectedNode as any).style || {};
  const setStyle = (key: string, value: unknown) =>
    execProp(`style.${key}`, value);

  return (
    <div>
      {/* Component Header Bar for Component Instance */}
      {isComponent && compNode && (
        <ComponentHeaderBar
          node={compNode}
          onExecuteCommand={onExecuteCommand}
          onEditTemplate={
            onSelectTemplateNode
              ? (nodeId) => {
                  const n = doc.nodes.find((x) => x.id === nodeId);
                  if (n) onSelectTemplateNode(n);
                }
              : undefined
          }
        />
      )}

      {/* Visibility Toggle Section */}
      <Section title="Visibility" icon={<Eye size={12} />}>
        <div className="flex items-center justify-between py-1 px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-(--studio-fg)">
            {selectedNode.visible !== false ? (
              <Eye size={14} className="text-emerald-400" />
            ) : (
              <EyeOff size={14} className="text-gray-500" />
            )}
            <span>{selectedNode.visible !== false ? "Visible" : "Hidden"}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              execProp("visible", selectedNode.visible === false ? true : false)
            }
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              selectedNode.visible !== false ? "bg-purple-600" : "bg-gray-700"
            }`}
            title={
              selectedNode.visible !== false
                ? "Hide node on canvas"
                : "Show node on canvas"
            }
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                selectedNode.visible !== false
                  ? "translate-x-4"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Section>

      {/* Visualization Inspector */}
      {["chart", "gauge", "timeline", "annotation", "connector"].includes(
        selectedNode.type,
      ) && (
        <Section title="Visualization" icon={<BarChart3 size={12} />}>
          <VisualizationControl
            node={selectedNode}
            onExecuteCommand={onExecuteCommand}
          />
        </Section>
      )}

      {/* Component Schema Properties — Schema-Driven via PropertyRow */}
      {isComponent && compDef && compDef.schema.length > 0 && (
        <Section title="Component Properties" icon={<Sliders size={12} />}>
          <div className="space-y-2">
            {compDef.schema
              .filter((field) => field.editable !== false)
              .map((field) => {
                const currentValue =
                  compNode!.props[field.key] ?? field.defaultValue;
                const binding = selectedNode.bindings?.find(
                  (b) => b.targetProperty === `props.${field.key}`,
                );

                return (
                  <PropertyRow
                    key={field.key}
                    definition={field}
                    value={currentValue}
                    binding={binding}
                    isAnimatable={field.animatable}
                    onChange={(val) => execProp(`props.${field.key}`, val)}
                    onBind={(expr) =>
                      onExecuteCommand({
                        type: "SET_BINDING",
                        nodeId: selectedNode.id,
                        targetProperty: `props.${field.key}`,
                        expression: expr,
                      })
                    }
                  />
                );
              })}
          </div>
        </Section>
      )}

      {/* Transform & Position */}
      <Section title="Transform" icon={<Move size={12} />}>
        <div className="grid grid-cols-2 gap-2">
          {(["x", "y", "width", "height"] as const).map((key) => (
            <div key={key}>
              <span className={LABEL_CLS}>
                {key === "x"
                  ? "X"
                  : key === "y"
                  ? "Y"
                  : key === "width"
                  ? "Width"
                  : "Height"}
              </span>
              <input
                type="number"
                value={(selectedNode as any)[key] ?? 0}
                onChange={(e) => execProp(key, Number(e.target.value))}
                className={INPUT_CLS + " font-mono text-center"}
              />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <span className={LABEL_CLS}>Rotation (°)</span>
          <input
            type="number"
            min={-360}
            max={360}
            value={(selectedNode as any).rotation ?? 0}
            onChange={(e) => execProp("rotation", Number(e.target.value))}
            className={INPUT_CLS + " font-mono text-center"}
          />
        </div>
        <div className="mt-2">
          <span className={LABEL_CLS}>Opacity (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={(() => {
              const raw =
                (selectedNode as any).opacity ??
                selectedNode.style?.opacity ??
                1;
              return Math.round(raw > 1 ? raw : raw * 100);
            })()}
            onChange={(e) => {
              const val = Number(e.target.value) / 100;
              execProp("opacity", val);
              execProp("style.opacity", val);
            }}
            className={INPUT_CLS + " font-mono text-center"}
          />
        </div>
      </Section>

      {/* Spatial Anchoring */}
      <Section title="Spatial Anchoring" icon={<Link2 size={12} />}>
        <AnchorControl
          node={selectedNode}
          nodes={doc.nodes}
          onChange={(anchor) => execProp("anchor", anchor)}
        />
      </Section>

      {/* Text node content binding */}
      {isText && (
        <Section title="Text Content" icon={<Type size={12} />}>
          <BindingEditor
            fieldKey="text"
            value={(selectedNode as any).text || ""}
            doc={doc}
            previewContext={previewContext}
            staticInput={
              <input
                type="text"
                value={(selectedNode as any).text || ""}
                onChange={(e) => execProp("text", e.target.value)}
                placeholder="Text content..."
                className={INPUT_CLS}
              />
            }
            onChange={(val) => execProp("text", val)}
          />
          <div className="mt-2.5">
            <PerCharColorEditor
              config={{
                text: (selectedNode as any).text || "",
                fillColor: style.textColor || style.fillColor || "#ffffff",
                charFillColors: style.charFillColors || [],
                perCharFillEnabled: style.perCharFillEnabled || false,
              }}
              onChange={(patch) => {
                Object.entries(patch).forEach(([k, v]) => {
                  setStyle(k, v);
                });
              }}
            />
          </div>
        </Section>
      )}

      {/* Typography Section */}
      {(isText || isComponent) && (
        <Section title="Typography" icon={<Type size={12} />}>
          <FontSelector
            node={selectedNode}
            onExecuteCommand={onExecuteCommand}
          />
          <div className="mt-2.5">
            <TypographyControl
              value={{
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: style.lineHeight,
                letterSpacing: style.letterSpacing,
                textColor: style.textColor,
                textAlign: style.textAlign,
                textTransform: style.textTransform,
                overflow: style.overflow || (selectedNode as any).overflow,
                minFontSize: style.minFontSize || (selectedNode as any).minFontSize,
                tabularNums: style.tabularNums || (selectedNode as any).tabularNums,
              }}
              onChange={(v: TypographyValue) => {
                Object.entries(v).forEach(([key, val]) => {
                  if (val !== undefined) setStyle(key, val);
                });
              }}
            />
          </div>
        </Section>
      )}

      {/* Media Asset Section */}
      {selectedNode.type === "media" && (
        <Section title="Media Asset" icon={<Palette size={12} />}>
          <AssetSelector
            node={selectedNode as any}
            onExecuteCommand={onExecuteCommand}
          />
        </Section>
      )}

      {/* Appearance Section */}
      {(isShape || isComponent) && (
        <Section title="Appearance" icon={<Palette size={12} />}>
          <AppearanceControl
            value={{
              fillColor:
                style.fillColor ||
                (selectedNode as any).fillColor ||
                (selectedNode as any).strokeColor ||
                "#3B82F6",
              fillOpacity:
                style.fillOpacity !== undefined
                  ? style.fillOpacity
                  : (selectedNode as any).fillOpacity,
              strokeColor:
                style.strokeColor ||
                (selectedNode as any).strokeColor ||
                style.fillColor ||
                "#3B82F6",
              strokeWidth:
                style.strokeWidth !== undefined
                  ? style.strokeWidth
                  : (selectedNode as any).strokeWidth !== undefined
                  ? (selectedNode as any).strokeWidth
                  : 2,
              borderRadius:
                style.borderRadius !== undefined
                  ? style.borderRadius
                  : (selectedNode as any).borderRadius,
              shadow: style.shadow || (selectedNode as any).shadow,
              backdropBlur:
                style.backdropBlur || (selectedNode as any).backdropBlur,
              opacity:
                style.opacity !== undefined
                  ? Math.round(style.opacity * 100)
                  : (selectedNode as any).opacity !== undefined
                  ? Math.round((selectedNode as any).opacity * 100)
                  : 100,
            }}
            onChange={(v: AppearanceValue) => {
              const mapped: Record<string, any> = { ...v };
              if (v.opacity !== undefined) mapped.opacity = v.opacity / 100;
              Object.entries(mapped).forEach(([key, val]) => {
                if (val !== undefined) {
                  setStyle(key, val);
                  if (
                    key === "fillColor" ||
                    key === "strokeColor" ||
                    key === "strokeWidth" ||
                    key === "borderRadius"
                  ) {
                    execProp(key, val);
                    if (
                      key === "strokeWidth" &&
                      (selectedNode.type === "line" ||
                        (selectedNode as any).shapeKind === "line")
                    ) {
                      execProp("height", val);
                    }
                  }
                }
              });
            }}
          />
        </Section>
      )}

      {/* Resource Diagnostics */}
      <div className="px-2 py-1 border-t border-white/4">
        <ResourceDiagnosticsPanel
          doc={doc}
          onExecuteCommand={onExecuteCommand}
        />
      </div>
    </div>
  );
}

function LayoutTab({
  selectedNode,
  doc,
  onExecuteCommand,
}: {
  selectedNode: SceneNode;
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}) {
  const execProp = (path: string, value: unknown) =>
    onExecuteCommand({
      type: "UPDATE_NODE_PROPERTY",
      nodeId: selectedNode.id,
      path,
      value,
    });

  const nodeLayout = (selectedNode as any).layout || {};
  const nodeConstraints = nodeLayout.constraints || {};
  const legacyConstraints = (selectedNode as any).constraints || {};
  const clipContent = Boolean((selectedNode as any).clipContent);

  const constraintVal: ConstraintValue = {
    horizontal: legacyConstraints.horizontal || nodeConstraints.horizontal || "center",
    vertical: legacyConstraints.vertical || nodeConstraints.vertical || "center",
    widthMode: nodeConstraints.widthMode || "fixed",
    heightMode: nodeConstraints.heightMode || "fixed",
    minWidth: nodeConstraints.minWidth,
    maxWidth: nodeConstraints.maxWidth,
    minHeight: nodeConstraints.minHeight,
    maxHeight: nodeConstraints.maxHeight,
    aspectRatioLock: nodeConstraints.aspectRatioLock,
  };

  return (
    <div>
      <Section
        title="Auto Layout & Direction"
        icon={<Layout size={12} />}
        defaultOpen
      >
        <AutoLayoutControl
          layout={nodeLayout}
          onChange={(newLayout) => {
            execProp("layout", newLayout);
          }}
        />
      </Section>

      <Section
        title="Sizing, Constraints & Clipping"
        icon={<SlidersHorizontal size={12} />}
        defaultOpen
      >
        <ConstraintControl
          value={constraintVal}
          clipContent={clipContent}
          onToggleClipContent={(clip) => execProp("clipContent", clip)}
          onChange={(v) => {
            const canvasW = doc?.canvas?.width || 1280;
            const canvasH = doc?.canvas?.height || 720;

            if (v.horizontal !== undefined) {
              execProp("constraints.horizontal", v.horizontal);
              if (v.horizontal === "left") {
                execProp("x", 0);
              } else if (v.horizontal === "center") {
                execProp("x", Math.round((canvasW - selectedNode.width) / 2));
              } else if (v.horizontal === "right") {
                execProp("x", Math.round(canvasW - selectedNode.width));
              }
            }
            if (v.vertical !== undefined) {
              execProp("constraints.vertical", v.vertical);
              if (v.vertical === "top") {
                execProp("y", 0);
              } else if (v.vertical === "center") {
                execProp("y", Math.round((canvasH - selectedNode.height) / 2));
              } else if (v.vertical === "bottom") {
                execProp("y", Math.round(canvasH - selectedNode.height));
              }
            }

            if (v.widthMode !== undefined) {
              execProp("constraints.widthMode", v.widthMode);
              execProp("widthMode", v.widthMode);
              if (v.widthMode === "fill") {
                execProp("width", canvasW);
                execProp("x", 0);
              } else if (v.widthMode === "hug") {
                const newW = Math.min(selectedNode.width, 240);
                execProp("width", newW);
                execProp("x", Math.round((canvasW - newW) / 2));
              } else if (v.widthMode === "fixed" && selectedNode.width !== 640) {
                const newW = 640;
                execProp("width", newW);
                execProp("x", Math.round((canvasW - newW) / 2));
              }
            }
            if (v.heightMode !== undefined) {
              execProp("constraints.heightMode", v.heightMode);
              execProp("heightMode", v.heightMode);
              if (v.heightMode === "fill") {
                execProp("height", canvasH);
                execProp("y", 0);
              } else if (v.heightMode === "hug") {
                const newH = Math.min(selectedNode.height, 120);
                execProp("height", newH);
                execProp("y", Math.round((canvasH - newH) / 2));
              } else if (v.heightMode === "fixed" && selectedNode.height !== 360) {
                const newH = 360;
                execProp("height", newH);
                execProp("y", Math.round((canvasH - newH) / 2));
              }
            }

            const updatedLayoutConstraints = {
              ...(nodeLayout.constraints || {}),
              ...(v.horizontal !== undefined ? { horizontal: v.horizontal } : {}),
              ...(v.vertical !== undefined ? { vertical: v.vertical } : {}),
              ...(v.widthMode !== undefined ? { widthMode: v.widthMode } : {}),
              ...(v.heightMode !== undefined
                ? { heightMode: v.heightMode }
                : {}),
              minWidth: v.minWidth,
              maxWidth: v.maxWidth,
              minHeight: v.minHeight,
              maxHeight: v.maxHeight,
              aspectRatioLock: v.aspectRatioLock,
            };
            execProp("layout.constraints", updatedLayoutConstraints);
          }}
        />
      </Section>
    </div>
  );
}

function DataTab({
  selectedNode,
  doc,
  previewContext,
  onExecuteCommand,
}: {
  selectedNode: SceneNode;
  doc: OverlayDocument;
  previewContext?: Record<string, any>;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}) {
  const execProp = (path: string, value: unknown) =>
    onExecuteCommand({
      type: "UPDATE_NODE_PROPERTY",
      nodeId: selectedNode.id,
      path,
      value,
    });

  return (
    <div className="space-y-3 font-sans">
      {/* Document Variables Section */}
      <Section
        title="Document Variables"
        icon={<Database size={12} />}
        defaultOpen
      >
        {!doc.variables || doc.variables.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Database size={18} className="text-gray-600" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              No document variables defined yet. Add variables in the Data tab
              on the left panel.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {doc.variables.map((v) => (
              <div
                key={v.key}
                className="bg-[#151519] border border-white/6 rounded-xl overflow-hidden"
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/4">
                  <span className="font-mono text-[11px] font-bold text-violet-400">{`{{${v.key}}}`}</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/4">
                    {v.type}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <label className={LABEL_CLS}>Default Value</label>
                  <input
                    type="text"
                    value={
                      typeof v.defaultValue === "object"
                        ? JSON.stringify(v.defaultValue)
                        : v.defaultValue ?? ""
                    }
                    onChange={(e) => {
                      const newVal = e.target.value;
                      onExecuteCommand({
                        type: "UPDATE_VARIABLE",
                        key: v.key,
                        patch: { defaultValue: newVal },
                      });
                    }}
                    placeholder="Enter default value…"
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

export function InspectorPanel({
  selectedNode,
  doc,
  currentTime = 0,
  previewContext,
  onExecuteCommand,
  onSelectTemplateNode,
  onSeekTime = () => {},
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("style");

  if (!selectedNode) return <EmptyState />;

  // Special full-panel rendering for RepeaterNode
  if (selectedNode.type === "repeater") {
    return (
      <aside
        className="w-[280px] shrink-0 border-l border-white/6 flex flex-col overflow-hidden font-sans"
        style={{ backgroundColor: "#0F0F14" }}
      >
        <div
          className="px-4 py-3 shrink-0 border-b border-white/6 flex items-start justify-between gap-2"
          style={{ backgroundColor: "#151519" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">
              {selectedNode.name || selectedNode.id}
            </p>
            <span className="inline-block mt-1 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/25">
              repeater
            </span>
          </div>
          <button
            type="button"
            onClick={() => onExecuteCommand({ type: "DELETE_NODE", nodeId: selectedNode.id })}
            title="Delete repeater (Del / Backspace)"
            className="p-1.5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <RepeaterPanel
            node={selectedNode as RepeaterNode}
            doc={doc}
            onExecuteCommand={onExecuteCommand}
            onSelectTemplateNode={onSelectTemplateNode || (() => {})}
          />
        </div>
      </aside>
    );
  }

  const isComponent = selectedNode.type === "component";
  const compNode = isComponent ? (selectedNode as ComponentNode) : null;
  const componentType = compNode?.componentType ?? null;

  return (
    <aside
      className="w-[280px] shrink-0 border-l border-white/6 flex flex-col overflow-hidden font-sans"
      style={{ backgroundColor: "#0F0F14" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 shrink-0 border-b border-white/6"
        style={{ backgroundColor: "#151519" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-white truncate leading-tight">
              {selectedNode.name || selectedNode.id}
            </p>
            <p className="mt-0.5 text-[10px] font-mono text-gray-600 truncate">
              {selectedNode.id}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              {isComponent && componentType ? componentType : selectedNode.type}
            </span>
            <button
              type="button"
              onClick={() => onExecuteCommand({ type: "DELETE_NODE", nodeId: selectedNode.id })}
              title="Delete element (Del / Backspace)"
              className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        {activeTab === "style" && (
          <StyleTab
            selectedNode={selectedNode}
            doc={doc}
            previewContext={previewContext}
            onExecuteCommand={onExecuteCommand}
            onSelectTemplateNode={onSelectTemplateNode}
          />
        )}
        {activeTab === "layout" && (
          <LayoutTab
            selectedNode={selectedNode}
            doc={doc}
            onExecuteCommand={onExecuteCommand}
          />
        )}
        {activeTab === "motion" && (
          <div className="p-4">
            <AnimationInspectorControl
              selectedNode={selectedNode}
              doc={doc}
              currentTime={currentTime}
              onExecuteCommand={onExecuteCommand}
              onSeekTime={onSeekTime}
            />
          </div>
        )}
        {activeTab === "data" && (
          <DataTab
            selectedNode={selectedNode}
            doc={doc}
            previewContext={previewContext}
            onExecuteCommand={onExecuteCommand}
          />
        )}
      </div>
    </aside>
  );
}
