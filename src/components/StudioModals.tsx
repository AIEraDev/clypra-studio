import React from "react";
import { Camera, HelpCircle, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { TextEffectConfig } from "../types";

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
    <div id="save-preset-overlay" className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[340px] rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-5 shadow-2xl">
        <h3 className="mb-1.5 flex items-center gap-1.5 font-sans text-sm font-semibold tracking-wide text-white">
          <Sparkles size={14} className="text-[#7C6FFF]" />
          Save Visual Preset
        </h3>
        <p className="mb-4 font-sans text-xs leading-normal text-[#666677]">Store this composition style in local presets for reuse in Templates.</p>

        <label className="mb-3 block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-[#666677]">Preset name</span>
          <div className="flex gap-1.5">
            <input id="input-save-preset-name" type="text" placeholder="e.g. Acid Neon" value={name} onChange={(event) => onNameChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#2A2A38] bg-[#0E0E12] p-2 font-sans text-xs text-white focus:border-[#7C6FFF] focus:outline-none" />
            <button type="button" onClick={onGenerateName} disabled={isGeneratingName} className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 px-2.5 font-sans text-xs text-[#7C6FFF] transition-all hover:bg-[#7C6FFF]/20 disabled:cursor-not-allowed disabled:opacity-50">
              {isGeneratingName ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={11} />}
              <span className="text-[10px] font-semibold">AI</span>
            </button>
          </div>
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-[#666677]">Category</span>
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

interface ImageScanModalProps {
  open: boolean;
  scanImage: string | null;
  scanStatus: "idle" | "reading" | "analyzing" | "completed" | "failed";
  scanError: string | null;
  scanResultConfig: TextEffectConfig | null;
  scanLogs: string[];
  onClose: () => void;
  onClearImage: () => void;
  onAnalyze: () => void;
  onApply: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageScanModal({ open, scanImage, scanStatus, scanError, scanResultConfig, scanLogs, onClose, onClearImage, onAnalyze, onApply, onDragOver, onDrop, onFileSelect }: ImageScanModalProps) {
  if (!open) return null;

  return (
    <div id="image-scan-overlay" className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-6 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A38] pb-3">
          <h3 className="flex items-center gap-1.5 font-sans text-sm font-semibold tracking-wide text-white">
            <Camera size={15} className="text-[#7C6FFF]" />
            AI Text Effect Scanner
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-xs font-bold text-gray-400 hover:bg-[#2A2A38] hover:text-white">
            x
          </button>
        </div>

        {!scanImage ? (
          <div id="image-scan-dropzone" onDragOver={onDragOver} onDrop={onDrop} onClick={() => document.getElementById("file-scanner-input")?.click()} className="group flex min-h-[170px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#2A2A38] bg-[#0E0E12] p-8 text-center transition-all hover:border-[#7C6FFF]">
            <input id="file-scanner-input" type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
            <UploadCloud size={28} className="text-gray-500 group-hover:text-[#7C6FFF]" />
            <span className="block text-xs font-medium text-white">Choose image, drop, or paste a reference</span>
            <span className="text-[10px] text-gray-500">PNG, JPG, WEBP supported</span>
          </div>
        ) : (
          <div className="relative flex justify-center rounded-xl border border-[#2A2A38] bg-[#0E0E12] p-3">
            <img src={scanImage} alt="Scan reference" className="max-h-[180px] rounded-lg object-contain" />
            {scanStatus === "idle" && (
              <button type="button" onClick={onClearImage} className="absolute right-2 top-2 rounded bg-black/80 px-2.5 py-1 text-[9px] font-bold uppercase text-gray-300 hover:text-red-300">
                Delete
              </button>
            )}
          </div>
        )}

        {scanStatus === "analyzing" && <StatusLog title="Processing Style Parameters" logs={scanLogs} tone="violet" />}
        {scanError && <ErrorBox label="Analysis Error" message={scanError} />}
        {scanStatus === "completed" && scanResultConfig && <ConfigSummary title="Deconstructed Attributes" config={scanResultConfig} />}

        <div className="flex shrink-0 items-center justify-between border-t border-[#2A2A38] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] px-4 py-1.5 font-sans text-xs font-semibold text-white hover:bg-[#2A2A38]">
            Close
          </button>
          {scanImage && scanStatus === "idle" && (
            <button id="trigger-ai-analyze-btn" type="button" onClick={onAnalyze} className="flex items-center gap-1.5 rounded-lg bg-[#7C6FFF] px-4 py-1.5 font-sans text-xs font-semibold text-white hover:bg-[#6859FF]">
              <Sparkles size={12} /> Scan Reference
            </button>
          )}
          {scanStatus === "completed" && (
            <button id="apply-scanned-config-btn" type="button" onClick={onApply} className="rounded-lg bg-green-600 px-4 py-1.5 font-sans text-xs font-bold text-white hover:bg-green-500">
              Apply Config
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PromptStyleModalProps {
  open: boolean;
  promptInput: string;
  promptStatus: "idle" | "generating" | "completed" | "failed";
  promptError: string | null;
  promptResultConfig: TextEffectConfig | null;
  promptLogs: string[];
  onPromptChange: (prompt: string) => void;
  onClose: () => void;
  onGenerate: () => void;
  onApply: () => void;
}

export function PromptStyleModal({ open, promptInput, promptStatus, promptError, promptResultConfig, promptLogs, onPromptChange, onClose, onGenerate, onApply }: PromptStyleModalProps) {
  if (!open) return null;

  return (
    <div id="prompt-style-overlay" className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-6 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A38] pb-3">
          <h3 className="flex items-center gap-1.5 font-sans text-sm font-semibold tracking-wide text-white">
            <Sparkles size={15} className="text-teal-400" />
            AI Prompt Style Generator
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-xs font-bold text-gray-400 hover:bg-[#2A2A38] hover:text-white">
            x
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">Describe visual theme</span>
          <textarea id="ai-style-prompt-input" rows={3} value={promptInput} onChange={(event) => onPromptChange(event.target.value)} placeholder="e.g. frozen crystal glass shadow..." className="w-full resize-none rounded-lg border border-[#2A2A38] bg-[#0E0E12] p-3 font-sans text-xs text-white placeholder-gray-600 focus:border-teal-400 focus:outline-none" />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {["molten copper lava", "retro 80s arcade grid", "mystic amethyst crystal", "cyberpunk neon glitch"].map((tag) => (
            <button key={tag} type="button" onClick={() => onPromptChange(tag)} className="rounded bg-[#2A2A38] px-2 py-1 font-mono text-[9.5px] text-teal-400 hover:text-white">
              #{tag}
            </button>
          ))}
        </div>

        {promptStatus === "generating" && <StatusLog title="Synthesizing Parameters" logs={promptLogs} tone="teal" />}
        {promptError && <ErrorBox label="Generation Error" message={promptError} />}
        {promptStatus === "completed" && promptResultConfig && <ConfigSummary title="Generated Attributes" config={promptResultConfig} />}

        <div className="flex shrink-0 items-center justify-between border-t border-[#2A2A38] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] px-4 py-1.5 font-sans text-xs font-semibold text-white hover:bg-[#2A2A38]">
            Close
          </button>
          {promptInput.trim() && promptStatus !== "generating" && promptStatus !== "completed" && (
            <button id="trigger-ai-prompt-btn" type="button" onClick={onGenerate} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 font-sans text-xs font-semibold text-white hover:bg-teal-500">
              <Sparkles size={12} /> Generate Style
            </button>
          )}
          {promptStatus === "completed" && (
            <button id="apply-prompt-config-btn" type="button" onClick={onApply} className="rounded-lg bg-teal-600 px-4 py-1.5 font-sans text-xs font-bold text-white hover:bg-teal-500">
              Apply Config
            </button>
          )}
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
    <div id="tutorial-overlay" className="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[850px] flex-col overflow-hidden rounded-xl border border-[#2A2A38] bg-[#1E1E26] p-6 shadow-2xl">
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
            <p className="text-sm leading-6 text-gray-300">Use the left rail to choose a workflow, the canvas for live composition, the inspector for contextual editing, and the bottom dock for layers or keyframes. This guide stays intentionally compact so the editor itself remains the main learning surface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLog({ title, logs, tone }: { title: string; logs: string[]; tone: "violet" | "teal" }) {
  const color = tone === "teal" ? "text-teal-400" : "text-[#7C6FFF]";
  return (
    <div className="flex max-h-[130px] shrink-0 flex-col gap-1 overflow-y-auto rounded-lg border border-[#2A2A38] bg-[#0A0A0E] p-3 font-mono text-[10px] leading-4 text-gray-400">
      <div className={`mb-1 flex items-center gap-2 font-sans font-bold ${color}`}>
        <Loader2 size={11} className="animate-spin" />
        <span>{title}</span>
      </div>
      {logs.map((log, index) => (
        <div key={`${log}-${index}`} className="flex gap-2">
          <span className="select-none font-semibold text-gray-600">[{index + 1}]</span>
          <span>{log}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ label, message }: { label: string; message: string }) {
  return (
    <div className="shrink-0 rounded-lg border border-red-900 bg-red-950/45 p-3 font-sans text-xs leading-normal text-red-400">
      <strong>{label}:</strong> {message}
    </div>
  );
}

function ConfigSummary({ title, config }: { title: string; config: TextEffectConfig }) {
  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-[#7C6FFF]/20 bg-[#121218] p-3 font-sans text-xs">
      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7C6FFF]">{title}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
        <div>
          Style: <span className="font-medium text-white">{config.effectName}</span>
        </div>
        <div>
          Font: <span className="font-medium text-white">{config.fontFamily}</span>
        </div>
        <div>
          Fill: <span className="font-medium text-white">{config.fillType}</span>
        </div>
        <div>
          Stroke: <span className="font-medium text-white">{config.strokeEnabled ? `${config.strokeWidth}px` : "None"}</span>
        </div>
        <div>
          Bevel: <span className="font-medium text-white">{config.bevelEnabled ? `${config.bevelDepth}px` : "None"}</span>
        </div>
        <div>
          Glows: <span className="font-medium text-white">{config.glowLayers?.filter((layer) => layer.enabled).length || 0}</span>
        </div>
      </div>
    </div>
  );
}
