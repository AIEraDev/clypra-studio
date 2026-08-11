import React from 'react';
import { AlertTriangle, Edit3, List } from 'lucide-react';
import type { OverlayDocument, DocumentCommand } from '@clypra-studio/engine';

// ---------------------------------------------------------------------------
// Types — augment until engine exports these properly
// ---------------------------------------------------------------------------

export interface SceneNode {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

export interface RepeaterNode extends SceneNode {
  type: 'repeater';
  datasetBinding?: string;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  stagger?: number;       // stored in seconds
  previewItemCount?: number;
  itemTemplate?: SceneNode;
}

export interface RepeaterPanelProps {
  node: RepeaterNode;
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onSelectTemplateNode: (node: SceneNode) => void;
}

interface DocumentVariable {
  key: string;
  label: string;
  dataType: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
    {children}
  </span>
);

const baseInputCls =
  'bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-violet-500 outline-none w-full';

const SectionDivider: React.FC = () => (
  <div className="border-t border-white/[0.06] my-1" />
);

// ---------------------------------------------------------------------------
// RepeaterPanel
// ---------------------------------------------------------------------------

const RepeaterPanel: React.FC<RepeaterPanelProps> = ({
  node,
  doc,
  onExecuteCommand,
  onSelectTemplateNode,
}) => {
  const variables: DocumentVariable[] = (doc.variables as any) ?? [];
  const arrayVariables = variables.filter((v) => v.dataType === 'array');

  const patch = (field: string, val: any) => {
    onExecuteCommand({ type: 'UPDATE_NODE', nodeId: node.id, patch: { [field]: val } } as any);
  };

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden bg-[#0F0F14]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] shrink-0">
        <List size={13} className="text-violet-400" />
        <SectionLabel>Repeater</SectionLabel>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">

        {/* Dataset */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Dataset</SectionLabel>
          {arrayVariables.length === 0 ? (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-amber-300">
                No array variables found. Add an array variable to bind data.
              </span>
            </div>
          ) : (
            <select
              className={baseInputCls}
              value={node.datasetBinding ?? ''}
              onChange={(e) => patch('datasetBinding', e.target.value)}
            >
              <option value="">— None —</option>
              {arrayVariables.map((v) => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
          )}
        </section>

        <SectionDivider />

        {/* Layout */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Layout</SectionLabel>
          <div className="flex gap-0 rounded-lg overflow-hidden border border-white/[0.06] self-start">
            {(['vertical', 'horizontal'] as const).map((dir) => (
              <button
                key={dir}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-medium transition-colors capitalize ${
                  (node.direction ?? 'vertical') === dir
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#1C1C22] text-gray-400 hover:text-white'
                }`}
                onClick={() => patch('direction', dir)}
              >
                {dir}
              </button>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* Gap */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Gap</SectionLabel>
          <input
            className={baseInputCls}
            type="number"
            min={0}
            value={node.gap ?? 0}
            onChange={(e) => patch('gap', Number(e.target.value))}
            placeholder="0"
          />
        </section>

        <SectionDivider />

        {/* Stagger */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Stagger</SectionLabel>
          <div className="flex items-center gap-2">
            <input
              className={`${baseInputCls} flex-1`}
              type="number"
              min={0}
              step={50}
              value={Math.round((node.stagger ?? 0) * 1000)}
              onChange={(e) => patch('stagger', Number(e.target.value) / 1000)}
              placeholder="0"
            />
            <span className="text-[11px] text-gray-500 shrink-0">ms</span>
          </div>
        </section>

        <SectionDivider />

        {/* Preview Items */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Preview Items</SectionLabel>
          <input
            className={baseInputCls}
            type="number"
            min={1}
            max={20}
            value={node.previewItemCount ?? 3}
            onChange={(e) =>
              patch('previewItemCount', Math.min(20, Math.max(1, Number(e.target.value))))
            }
          />
        </section>

        <SectionDivider />

        {/* Item Template */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Item Template</SectionLabel>
          {node.itemTemplate ? (
            <div className="bg-[#151519] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[12px] text-gray-200 truncate">
                  {node.itemTemplate.name ?? 'Unnamed'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                  {node.itemTemplate.type}
                </span>
              </div>
              <button
                className="cursor-pointer flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 px-2 py-1 rounded hover:bg-violet-500/10 transition-colors shrink-0"
                onClick={() => onSelectTemplateNode(node.itemTemplate!)}
              >
                <Edit3 size={11} />
                Edit Template
              </button>
            </div>
          ) : (
            <div className="bg-[#151519] border border-dashed border-white/[0.06] rounded-xl p-4 text-center">
              <span className="text-[11px] text-gray-600">No item template defined.</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export { RepeaterPanel };
export default RepeaterPanel;

