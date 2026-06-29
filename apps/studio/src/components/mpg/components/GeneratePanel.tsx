import React, { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { PROMPT_SUGGESTIONS } from "../constants";
import { generateStackFromPrompt } from "../stackUtils";
import type { StackNode } from "../types";

interface GeneratePanelProps {
  onGenerated: (name: string, nodes: StackNode[]) => void;
}

export const GeneratePanel: React.FC<GeneratePanelProps> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setStatus("error");
      setMessage("Describe the look you want to create");
      return;
    }

    setStatus("generating");
    setMessage("");

    // Simulate brief processing for UX; generation is local/keyword-based
    await new Promise((r) => setTimeout(r, 400));

    try {
      const { name, nodes } = generateStackFromPrompt(prompt);
      onGenerated(name, nodes);
      setStatus("success");
      setMessage(`Generated "${name}" with ${nodes.length} node${nodes.length !== 1 ? "s" : ""}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Generation failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 size={16} className="text-[#7C6FFF]" />
        <h3 className="text-sm font-semibold text-white">Generate Stack</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Describe a visual look and we'll build a V2 effect stack you can refine and publish.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="Soft dreamy portrait with warm glow and light blur…"
        className="w-full px-3 py-2 rounded-lg bg-[#0F0F15] border border-[#33334A] text-sm text-white placeholder:text-gray-600 focus:border-[#7C6FFF] outline-none resize-none"
      />

      <div className="flex flex-wrap gap-1.5">
        {PROMPT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrompt(s)}
            className="px-2 py-1 rounded-md text-[10px] bg-[#1E1E24] border border-[#33334A] text-gray-400 hover:text-white hover:border-[#7C6FFF]/40 transition-colors"
          >
            {s.length > 28 ? `${s.slice(0, 25)}…` : s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={status === "generating"}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#7C6FFF] to-[#5B4FE0] hover:opacity-90 disabled:opacity-50 text-sm font-semibold text-white transition-opacity"
      >
        {status === "generating" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Effect Stack
          </>
        )}
      </button>

      {message && (
        <div className={`text-xs p-3 rounded-lg ${status === "success" ? "bg-[#33CC99]/10 text-[#33CC99]" : status === "error" ? "bg-[#FF3366]/10 text-[#FF3366]" : "text-gray-500"}`}>
          {message}
        </div>
      )}
    </div>
  );
};
