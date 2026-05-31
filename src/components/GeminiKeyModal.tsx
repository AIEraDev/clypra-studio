import React, { useEffect, useState } from "react";
import { ExternalLink, KeyRound, Trash2, X } from "lucide-react";
import { clearGeminiApiKey, getGeminiApiKey, saveGeminiApiKey } from "../hooks/useGeminiApiKey";

interface GeminiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function GeminiKeyModal({ open, onClose }: GeminiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (!open) return;
    setApiKey(getGeminiApiKey());
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    saveGeminiApiKey(apiKey);
    onClose();
  };

  const handleClear = () => {
    clearGeminiApiKey();
    setApiKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#121219] shadow-2xl">
        <div className="border-b border-[#2A2A38] bg-[#181824] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-300">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Gemini API Key</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">
                  Used for AI naming, prompt generation, image style scanning, and research. Stored locally in this browser.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
            API Key
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="AIza..."
              className="mt-1 w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs normal-case text-white outline-none placeholder:text-[#555566] focus:border-teal-400"
            />
          </label>

          <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-3 text-[10px] leading-relaxed text-[#8F8FA0]">
            <div className="mb-2 font-bold uppercase tracking-wider text-[#CCCCD6]">How to get a key</div>
            <ol className="list-decimal space-y-1.5 pl-4">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-300 hover:underline">Google AI Studio API keys <ExternalLink size={10} /></a>.</li>
              <li>Create or copy a Gemini API key.</li>
              <li>Paste it here, then save.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[10px] leading-relaxed text-amber-100/80">
            Browser storage is convenient, not equivalent to a backend secret vault. The key is sent only to Clypra Studio AI endpoints and then to Gemini for each request.
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-[#2A2A38] bg-[#15151C] p-4">
          <button type="button" onClick={handleClear} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15">
            <Trash2 size={12} /> Clear
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38]">Cancel</button>
            <button type="button" onClick={handleSave} disabled={!apiKey.trim()} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50">Save Key</button>
          </div>
        </div>
      </div>
    </div>
  );
}
