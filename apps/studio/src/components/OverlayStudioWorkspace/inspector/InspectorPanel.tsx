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
  Layers, Move, Palette, Sliders, SlidersHorizontal, Layout, Type, Eye, Wand2, Database, ChevronDown, ChevronRight, Play
} from "lucide-react";
import { TypographyControl, type TypographyValue } from "./controls/TypographyControl";
import { AppearanceControl, type AppearanceValue } from "./controls/AppearanceControl";
import { ConstraintControl, type ConstraintValue } from "./controls/ConstraintControl";
import { LayoutControl, type LayoutValue } from "./controls/LayoutControl";
import { AutoLayoutControl } from "./controls/AutoLayoutControl";
import { ColorControl } from "./controls/ColorControl";
import { BindingEditor } from "./controls/BindingEditor";
import { ConditionalVisibilityControl } from "./controls/ConditionalVisibilityControl";
import { AnimationInspectorControl } from "./controls/AnimationInspectorControl";
import { RepeaterPanel } from "./RepeaterPanel";
import { PropertyRow } from "./PropertyRow";
import { ComponentHeaderBar } from "./ComponentHeaderBar";
import { AssetSelector } from "./controls/AssetSelector";
import { FontSelector } from "./controls/FontSelector";
import { ResourceDiagnosticsPanel } from "../assets/ResourceDiagnosticsPanel";

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

const LABEL_CLS = "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";
const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";

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
    <div className="border-b border-white/[0.04] last:border-0">
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
      className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col items-center justify-center gap-3 text-center px-6"
      style={{ backgroundColor: "#0F0F14" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at center, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.04) 100%)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <Layers size={24} className="text-violet-400 opacity-70" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">No Selection</p>
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

function TabBar({ active, onChange }: { active: ActiveTab; onChange: (t: ActiveTab) => void }) {
  return (
    <div className="flex border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
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
}: {
  selectedNode: SceneNode;
  doc: OverlayDocument;
  previewContext?: Record<string, any>;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}) {
  const isComponent = selectedNode.type === "component";
  const isText = selectedNode.type === "text";
  const isShape = selectedNode.type === "shape" || selectedNode.type === "frame";
  const compNode = isComponent ? (selectedNode as ComponentNode) : null;
  const compDef = compNode ? componentRegistry.get(compNode.componentType) : null;

  const execProp = (path: string, value: unknown) =>
    onExecuteCommand({ type: "UPDATE_NODE_PROPERTY", nodeId: selectedNode.id, path, value });

  const style: Record<string, any> = (selectedNode as any).style || {};
  const setStyle = (key: string, value: unknown) => execProp(`style.${key}`, value);

  return (
    <div>
      {/* Component Header Bar for Component Instance */}
      {isComponent && compNode && (
        <ComponentHeaderBar
          node={compNode}
          onExecuteCommand={onExecuteCommand}
          onEditTemplate={onSelectTemplateNode}
        />
      )}

      {/* Visibility Expression Section */}
      <Section title="Visibility" icon={<Eye size={12} />}>
        <ConditionalVisibilityControl
          value={selectedNode.visibilityExpression}
          doc={doc}
          previewContext={previewContext}
          onChange={(expr) => execProp("visibilityExpression", expr)}
        />
      </Section>

      {/* Component Schema Properties — Schema-Driven via PropertyRow */}
      {isComponent && compDef && compDef.schema.length > 0 && (
        <Section title="Component Properties" icon={<Sliders size={12} />}>
          <div className="space-y-2">
            {compDef.schema
              .filter((field) => field.editable !== false)
              .map((field) => {
                const currentValue = compNode!.props[field.key] ?? field.defaultValue;
                const binding = selectedNode.bindings?.find(
                  (b) => b.targetProperty === `props.${field.key}`
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
              <span className={LABEL_CLS}>{key === "x" ? "X" : key === "y" ? "Y" : key === "width" ? "Width" : "Height"}</span>
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
            value={Math.round(((selectedNode as any).opacity ?? 1) * 100)}
            onChange={(e) => execProp("opacity", Number(e.target.value) / 100)}
            className={INPUT_CLS + " font-mono text-center"}
          />
        </div>
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
        </Section>
      )}

      {/* Typography Section */}
      {(isText || isComponent) && (
        <Section title="Typography" icon={<Type size={12} />}>
          <FontSelector node={selectedNode} onExecuteCommand={onExecuteCommand} />
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
          <AssetSelector node={selectedNode as any} onExecuteCommand={onExecuteCommand} />
        </Section>
      )}

      {/* Appearance Section */}
      {(isShape || isComponent) && (
        <Section title="Appearance" icon={<Palette size={12} />}>
          <AppearanceControl
            value={{
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              strokeColor: style.strokeColor,
              strokeWidth: style.strokeWidth,
              borderRadius: style.borderRadius,
              shadow: style.shadow,
              backdropBlur: style.backdropBlur,
              opacity: style.opacity !== undefined ? Math.round(style.opacity * 100) : 100,
            }}
            onChange={(v: AppearanceValue) => {
              const mapped: Record<string, any> = { ...v };
              if (v.opacity !== undefined) mapped.opacity = v.opacity / 100;
              Object.entries(mapped).forEach(([key, val]) => {
                if (val !== undefined) setStyle(key, val);
              });
            }}
          />
        </Section>
      )}

      {/* Resource Diagnostics */}
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <ResourceDiagnosticsPanel doc={doc} onExecuteCommand={onExecuteCommand} />
      </div>
    </div>
  );
}

function LayoutTab({
  selectedNode,
  onExecuteCommand,
}: {
  selectedNode: SceneNode;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}) {
  const execProp = (path: string, value: unknown) =>
    onExecuteCommand({ type: "UPDATE_NODE_PROPERTY", nodeId: selectedNode.id, path, value });

  const layout: LayoutValue = (selectedNode as any).layout || {};
  const constraints: ConstraintValue = (selectedNode as any).constraints || {
    horizontal: "left",
    vertical: "top",
  };

  return (
    <div>
      <Section title="Auto Layout" icon={<Layout size={12} />} defaultOpen>
        <AutoLayoutControl
          layout={(selectedNode as any).layout}
          onChange={(newLayout) => {
            execProp("layout", newLayout);
          }}
        />
      </Section>

      <Section title="Sizing & Mode" icon={<Layout size={12} />}>
        <LayoutControl
          value={layout}
          onChange={(v) => {
            Object.entries(v).forEach(([key, val]) => {
              if (val !== undefined) execProp(`layout.${key}`, val);
            });
          }}
        />
      </Section>

      <Section title="Constraints" icon={<SlidersHorizontal size={12} />} defaultOpen>
        <ConstraintControl
          value={constraints}
          onChange={(v) => {
            execProp("constraints.horizontal", v.horizontal);
            execProp("constraints.vertical", v.vertical);
          }}
        />
      </Section>
    </div>
  );
}

function DataTab({
  doc,
  onExecuteCommand,
}: {
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}) {
  if (!doc.variables || doc.variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
        <Database size={20} className="text-gray-600" />
        <p className="text-[11px] text-gray-600 leading-relaxed max-w-[180px]">
          No document variables defined yet. Add variables in the Data tab on the left panel to bind data here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {doc.variables.map((v) => (
        <div
          key={v.key}
          className="bg-[#151519] border border-white/[0.06] rounded-xl overflow-hidden"
        >
          <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/[0.04]">
            <span className="font-mono text-[11px] font-bold text-violet-400">{`{{${v.key}}}`}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04]">
              {v.type}
            </span>
          </div>
          <div className="px-3 py-2.5">
            <label className={LABEL_CLS}>Default Value</label>
            <input
              type="text"
              value={typeof v.defaultValue === "object" ? JSON.stringify(v.defaultValue) : (v.defaultValue ?? "")}
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
        className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden font-sans"
        style={{ backgroundColor: "#0F0F14" }}
      >
        <div className="px-4 py-3 shrink-0 border-b border-white/[0.06]" style={{ backgroundColor: "#151519" }}>
          <p className="text-[12px] font-bold text-white truncate leading-tight">
            {selectedNode.name || selectedNode.id}
          </p>
          <span className="inline-block mt-1 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/25">
            repeater
          </span>
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
      className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden font-sans"
      style={{ backgroundColor: "#0F0F14" }}
    >
      {/* Header */}
      <div className="px-4 py-3 shrink-0 border-b border-white/[0.06]" style={{ backgroundColor: "#151519" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white truncate leading-tight">
              {selectedNode.name || selectedNode.id}
            </p>
            <p className="mt-0.5 text-[10px] font-mono text-gray-600 truncate">{selectedNode.id}</p>
          </div>
          <span
            className="shrink-0 mt-0.5 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
            style={{
              background: "rgba(124,58,237,0.15)",
              color: "#a78bfa",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
          >
            {isComponent && componentType ? componentType : selectedNode.type}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {activeTab === "style" && (
          <StyleTab
            selectedNode={selectedNode}
            doc={doc}
            previewContext={previewContext}
            onExecuteCommand={onExecuteCommand}
          />
        )}
        {activeTab === "layout" && (
          <LayoutTab selectedNode={selectedNode} onExecuteCommand={onExecuteCommand} />
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
          <DataTab doc={doc} onExecuteCommand={onExecuteCommand} />
        )}
      </div>
    </aside>
  );
}
