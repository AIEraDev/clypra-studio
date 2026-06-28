import React, { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";

interface AIEffectGeneratorProps {
  onGenerated: (effect: {
    id: string;
    name: string;
    description: string;
    backend: string;
    code?: string;
    glsl?: string;
    params: any;
  }) => void;
  onStateChange?: (isGenerating: boolean, step: string) => void;
}

export function AIEffectGenerator({ onGenerated, onStateChange }: AIEffectGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [backend, setBackend] = useState<"canvas2d" | "pixi">("canvas2d");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setLoadingStep("Calling Worker API...");
    onStateChange?.(true, "Calling Worker API...");

    const steps = [
      "Calling Worker API...",
      backend === "pixi" ? "LLM generating GLSL shader..." : "LLM generating EffectEngine class...",
      "Extracting param schema...",
      "Compiling effect...",
      "Mounting on canvas..."
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        const nextStep = steps[stepIndex];
        setLoadingStep(nextStep);
        onStateChange?.(true, nextStep);
      }
    }, 600);

    try {
      // Resolve API base URL dynamically
      const host = window.location.hostname;
      const base = (host === "localhost" || host === "127.0.0.1") 
        ? "http://localhost:8787" 
        : "https://clypra-worker-api.abdulkabirmusa.com";

      const token = localStorage.getItem("clypra_auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${base}/ai/v1/generate-effect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, backend }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error status ${res.status}`);
      }

      const data = await res.json();
      clearInterval(stepInterval);
      
      onGenerated({
        id: data.effectId,
        name: data.effectName,
        description: data.description || "Generated AI Effect",
        backend: data.backend || "canvas2d",
        code: data.code,
        glsl: data.glsl,
        params: data.params
      });
      setPrompt("");
      onStateChange?.(false, "");
    } catch (err) {
      clearInterval(stepInterval);
      console.error("AI Generation error:", err);
      alert(err instanceof Error ? err.message : "Failed to generate AI effect.");
      onStateChange?.(false, "");
    } finally {
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="generate-section">
      <div className="section-label">
        <Sparkles size={12} style={{ color: "var(--clypra-violet)" }} />
        <span>Generate effect</span>
      </div>

      <div className="flex gap-2 mb-3 bg-[#13131A] p-1 rounded-lg border border-[#252530] text-[11px] font-sans">
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => setBackend("canvas2d")}
          className={`flex-1 py-1 rounded transition-colors ${backend === "canvas2d" ? "bg-[#7C6FFF] text-white font-medium" : "text-gray-400 hover:text-white"}`}
        >
          Canvas 2D (CPU)
        </button>
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => setBackend("pixi")}
          className={`flex-1 py-1 rounded transition-colors ${backend === "pixi" ? "bg-[#7C6FFF] text-white font-medium" : "text-gray-400 hover:text-white"}`}
        >
          GPU PixiJS (GLSL)
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={backend === "pixi" ? "e.g. glowing neon purple highpass edge outlines..." : "e.g. neon purple sparks drifting upwards..."}
        className="prompt-area"
        disabled={isGenerating}
      />
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="generate-btn"
      >
        {isGenerating ? <div className="spinner" /> : <Send size={12} />}
        <span>{isGenerating ? "Generating..." : "Generate"}</span>
      </button>
    </div>
  );
}
