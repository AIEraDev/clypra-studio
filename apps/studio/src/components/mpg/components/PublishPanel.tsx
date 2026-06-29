import React, { useState } from "react";
import { Loader2, Upload, Sparkles } from "lucide-react";
import type { PublishFormState, StackNode } from "../types";
import { FILTER_CATEGORIES } from "../constants";

interface PublishPanelProps {
  stack: StackNode[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  validationValid: boolean;
  onPublish: (form: PublishFormState, thumbnailDataUrl: string) => Promise<void>;
}

export const PublishPanel: React.FC<PublishPanelProps> = ({
  stack,
  canvasRef,
  validationValid,
  onPublish,
}) => {
  const [form, setForm] = useState<PublishFormState>({
    name: "",
    description: "",
    category: "portrait",
    tags: "",
    intensityDefault: 80,
    published: true,
  });
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const slug = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handlePublish = async () => {
    if (!form.name.trim()) {
      setStatus("error");
      setMessage("Effect name is required");
      return;
    }
    if (stack.length === 0) {
      setStatus("error");
      setMessage("Add at least one effect node before publishing");
      return;
    }
    if (!validationValid) {
      setStatus("error");
      setMessage("Fix graph validation errors before publishing");
      return;
    }

    let thumbnailDataUrl = "";
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      } catch {
        setStatus("error");
        setMessage("Could not capture preview thumbnail");
        return;
      }
    }

    setStatus("uploading");
    setMessage("");
    try {
      await onPublish(form, thumbnailDataUrl);
      setStatus("success");
      setMessage(`Published "${form.name}" to R2 for Clypra Editor`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Publish failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Upload size={16} className="text-[#7C6FFF]" />
        <h3 className="text-sm font-semibold text-white">Publish to R2</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Publish this V2 effect stack to R2 at <code className="text-[#7C6FFF]">filters/&#123;category&#125;</code>.
        Clypra Editor loads it from the Filters API.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Cinematic Soft Glow"
            className="w-full px-3 py-2 rounded-lg bg-[#0F0F15] border border-[#33334A] text-sm text-white placeholder:text-gray-600 focus:border-[#7C6FFF] outline-none"
          />
          {slug && <div className="text-[10px] text-gray-600 mt-1 font-mono">id: {slug}</div>}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Warm lifted look with soft blur"
            className="w-full px-3 py-2 rounded-lg bg-[#0F0F15] border border-[#33334A] text-sm text-white placeholder:text-gray-600 focus:border-[#7C6FFF] outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[#0F0F15] border border-[#33334A] text-sm text-white focus:border-[#7C6FFF] outline-none"
          >
            {FILTER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="cinematic, soft, portrait"
            className="w-full px-3 py-2 rounded-lg bg-[#0F0F15] border border-[#33334A] text-sm text-white placeholder:text-gray-600 focus:border-[#7C6FFF] outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">
            Default intensity ({form.intensityDefault}%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.intensityDefault}
            onChange={(e) => setForm((f) => ({ ...f, intensityDefault: parseInt(e.target.value, 10) }))}
            className="w-full accent-[#7C6FFF]"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="accent-[#7C6FFF]"
          />
          Mark as published (visible in editor)
        </label>
      </div>

      <div className="rounded-lg bg-[#1E1E24]/60 border border-[#22222E] p-3 text-xs space-y-1">
        <div className="flex items-center gap-1 text-gray-400">
          <Sparkles size={12} />
          Stack summary
        </div>
        {stack.map((n, i) => (
          <div key={n.id} className="text-gray-500 font-mono text-[10px]">
            {i + 1}. {n.type}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handlePublish()}
        disabled={status === "uploading" || stack.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#7C6FFF] hover:bg-[#6B5EEE] disabled:opacity-50 text-sm font-semibold text-white transition-colors"
      >
        {status === "uploading" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Publishing…
          </>
        ) : (
          <>
            <Upload size={16} />
            Publish to Clypra Editor
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
