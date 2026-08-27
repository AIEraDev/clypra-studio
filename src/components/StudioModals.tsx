import React from "react";
import { HelpCircle, Loader2, Sparkles } from "lucide-react";

interface SavePresetModalProps {
  open: boolean;
  name: string;
  category: string;
  isGeneratingName: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onGenerateName: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function SavePresetModal({ open, name, category, isGeneratingName, onNameChange, onCategoryChange, onGenerateName, onCancel, onSave }: SavePresetModalProps) {
  if (!open) return null;

  return (
    <div id="save-preset-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[340px] rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-5 shadow-2xl select-none">
        <h3 className="mb-1.5 flex items-center gap-1.5 font-sans text-sm font-semibold tracking-wide text-white">
          <Sparkles size={14} className="text-[#7C6FFF]" />
          Save Visual Preset
        </h3>
        <p className="mb-4 font-sans text-xs leading-normal text-clypra-muted">Store this composition style in local presets for reuse in Templates.</p>

        <label className="mb-3 block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-clypra-muted">Preset name</span>
          <div className="flex gap-1.5">
            <input id="input-save-preset-name" type="text" placeholder="e.g. Acid Neon" value={name} onChange={(event) => onNameChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#2A2A38] bg-[#0E0E12] p-2 font-sans text-xs text-white focus:border-[#7C6FFF] focus:outline-none" />
            <button type="button" onClick={onGenerateName} disabled={isGeneratingName} className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 px-2.5 font-sans text-xs text-[#7C6FFF] transition-all hover:bg-[#7C6FFF]/20 disabled:cursor-not-allowed disabled:opacity-50">
              {isGeneratingName ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={11} />}
              <span className="text-[10px] font-semibold">AI</span>
            </button>
          </div>
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-clypra-muted">Category</span>
          <select id="select-save-preset-category" value={category} onChange={(event) => onCategoryChange(event.target.value)} className="w-full rounded-lg border border-[#2A2A38] bg-[#0E0E12] p-2 font-sans text-xs text-white focus:border-[#7C6FFF] focus:outline-none">
            <option value="Classic">Classic</option>
            <option value="Neon">Neon</option>
            <option value="Experimental">Experimental</option>
          </select>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button id="cancel-save-preset-btn" type="button" onClick={onCancel} className="rounded-lg border border-[#2A2A38] px-4 py-1.5 font-sans text-xs font-medium text-white hover:bg-[#2A2A38]">
            Cancel
          </button>
          <button id="confirm-save-preset-btn" type="button" onClick={onSave} disabled={!name.trim()} className="rounded-lg bg-[#7C6FFF] px-4 py-1.5 font-sans text-xs font-semibold text-white transition-all hover:bg-[#6859FF] disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface TutorialModalProps {
  open: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}

export function TutorialModal({ open, activeTab, onTabChange, onClose }: TutorialModalProps) {
  if (!open) return null;

  const tabs = ["typography", "color-fill", "stroke", "glow", "bevel", "shadow", "panel", "scanner"];

  return (
    <div id="tutorial-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[850px] flex-col overflow-hidden rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-6 shadow-2xl select-none">
        <div className="mb-4 flex shrink-0 items-center justify-between border-b border-[#2A2A38] pb-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle size={18} className="text-[#7C6FFF]" />
            <div>
              <h3 className="font-sans text-sm font-bold tracking-wide text-white">Text Effect Design Playbook</h3>
              <p className="mt-0.5 font-sans text-[11px] text-gray-400">Fast reference for the editor tools and workflow zones.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-sm font-bold text-gray-400 hover:bg-[#2A2A38] hover:text-white">
            x
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-5 overflow-hidden">
          <div className="flex w-[200px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-[#2A2A38]/70 pr-4">
            {tabs.map((tab) => (
              <button key={tab} type="button" onClick={() => onTabChange(tab)} className={`rounded-lg p-2.5 text-left font-sans text-xs transition-all ${activeTab === tab ? "bg-[#7C6FFF] text-white" : "text-gray-400 hover:bg-[#2A2A38] hover:text-white"}`}>
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto rounded-lg border border-[#2A2A38] bg-[#111116] p-5">
            <h4 className="mb-3 text-sm font-bold capitalize text-white">{activeTab.replace("-", " ")}</h4>
            <p className="text-sm leading-6 text-gray-300">Use the Studio navigation to choose a workflow, the canvas for live composition, the inspector for contextual editing, and the bottom dock for layers or keyframes. This guide stays intentionally compact so the editor itself remains the main learning surface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
