/**
 * Manifest Export Modal
 *
 * Exports authored body effects from Clypra Studio into canonical BodyEffectManifest JSON
 * ready for direct contribution to clypra-api.
 */

import React, { useState, useMemo } from "react";
import { X, Copy, Check, Download, Code, Sparkles, Layers, ShieldCheck, CloudUpload, Loader2 } from "lucide-react";
import type {
  BodyEffectManifest,
  CompositingPrimitive,
  LayerZOrder,
  CaptureAssetType,
  MaskCategory,
} from "@clypra-studio/types";
import { toast } from "sonner";

export interface ManifestExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEffect: string;
  parameters: Record<string, any>;
}

export function ManifestExportModal({
  isOpen,
  onClose,
  selectedEffect,
  parameters,
}: ManifestExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Form states initialized from active effect
  const [id, setId] = useState(() => selectedEffect.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
  const [name, setName] = useState(() =>
    selectedEffect
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
  const [category, setCategory] = useState<string>("Trending");
  const [description, setDescription] = useState(
    "High-performance body segmentation effect authored in Clypra Studio"
  );
  const [primitive, setPrimitive] = useState<CompositingPrimitive>("AlphaCutout");
  const [layerZOrder, setLayerZOrder] = useState<LayerZOrder>("behind-subject");
  const [captureType, setCaptureType] = useState<CaptureAssetType>("silhouette_mask");
  const [blendMode, setBlendMode] = useState<"normal" | "screen" | "multiply" | "overlay" | "add">("normal");

  // Generate canonical manifest object
  const manifest: BodyEffectManifest = useMemo(() => {
    // Generate parameter schema dynamically from current parameters
    const parameterSchema: Record<string, any> = {};
    const defaultParams: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(parameters)) {
      defaultParams[key] = val;
      if (typeof val === "number") {
        parameterSchema[key] = {
          type: "float",
          default: val,
          min: 0,
          max: typeof val === "number" && val > 10 ? val * 2 : 10,
          step: 0.1,
          description: `Controls ${key}`,
        };
      } else if (typeof val === "string" && val.startsWith("#")) {
        parameterSchema[key] = {
          type: "color",
          default: val,
          description: `${key} color code`,
        };
      } else if (typeof val === "boolean") {
        parameterSchema[key] = {
          type: "boolean",
          default: val,
          description: `Toggle ${key}`,
        };
      }
    }

    return {
      id,
      name,
      version: "1.0.0",
      category: category as any,
      description,
      requirements: {
        minEngineVersion: captureType === "hybrid_body" ? "1.5.0" : "1.0.0",
        captureType,
        maskCategory: "person" as MaskCategory,
      },
      compositing: {
        primitive,
        layerZOrder,
        blendMode,
      },
      parameterSchema,
      defaultParams,
      tags: [category.toLowerCase(), primitive.toLowerCase(), layerZOrder],
    };
  }, [id, name, category, description, primitive, layerZOrder, captureType, blendMode, parameters]);

  const jsonString = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("Manifest JSON copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id || "body-effect"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${id}.json`);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const bundlePayload = {
        bundleId: id,
        version: manifest.version || "1.0.0",
        manifest,
        assets: [],
      };
      const apiBase = (import.meta as any).env?.VITE_API_URL || "https://clypra-worker-api.abdulkabirmusa.com";
      const res = await fetch(`${apiBase}/body-effects/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundlePayload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      toast.success(`Published to Catalog! Bundle hash: ${data.hash?.slice(0, 12)}...`);
    } catch (err: any) {
      toast.error(`Publishing failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface">
              Export Body Effect Manifest
            </h2>
            <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-surface-container text-primary border border-outline-variant">
              v1.0.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split View (Settings on Left, JSON Preview on Right) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column: Form Controls */}
          <div className="w-1/2 p-4 overflow-y-auto border-r border-outline-variant flex flex-col gap-3 scrollbar-thin">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Effect ID (Slug)
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Trending">Trending</option>
                  <option value="Aura">Aura</option>
                  <option value="Wings">Wings</option>
                  <option value="Motion">Motion</option>
                  <option value="Energy">Energy</option>
                  <option value="Fun">Fun</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Primitive
                </label>
                <select
                  value={primitive}
                  onChange={(e) => setPrimitive(e.target.value as CompositingPrimitive)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                >
                  <option value="AlphaCutout">AlphaCutout</option>
                  <option value="MaskedGlow">MaskedGlow</option>
                  <option value="MaskedStroke">MaskedStroke</option>
                  <option value="MaskedDualBlur">MaskedDualBlur</option>
                  <option value="SkeletalSpriteAnchor">SkeletalSpriteAnchor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Layer Z-Order
                </label>
                <select
                  value={layerZOrder}
                  onChange={(e) => setLayerZOrder(e.target.value as LayerZOrder)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="behind-subject">behind-subject</option>
                  <option value="in-front">in-front</option>
                  <option value="isolate-only">isolate-only</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Capture Type
                </label>
                <select
                  value={captureType}
                  onChange={(e) => setCaptureType(e.target.value as CaptureAssetType)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                >
                  <option value="silhouette_mask">silhouette_mask</option>
                  <option value="skeletal_pose">skeletal_pose</option>
                  <option value="hybrid_body">hybrid_body</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Blend Mode
                </label>
                <select
                  value={blendMode}
                  onChange={(e) => setBlendMode(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="normal">normal</option>
                  <option value="screen">screen</option>
                  <option value="multiply">multiply</option>
                  <option value="add">add</option>
                  <option value="overlay">overlay</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 flex items-start gap-2 text-[11px] text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-on-surface">Universal Manifest Compliant</span>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                  Output matches the universal schema used by Clypra Desktop, Clypra Studio, and Clypra API.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Code Preview */}
          <div className="w-1/2 bg-black/90 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/60 text-[10px] font-mono text-white/60">
              <div className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-primary" />
                <span>{id || "manifest"}.json</span>
              </div>
              <span>{new Blob([jsonString]).size} bytes</span>
            </div>
            <pre className="flex-1 p-3 overflow-auto font-mono text-[11px] text-cyan-300/90 leading-relaxed scrollbar-thin">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-outline-variant bg-surface-container-low shrink-0">
          <span className="text-[10px] text-on-surface-variant font-mono">
            Ready to paste into clypra-api/data/body-effects/index.json
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-secondary" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Publish to R2 / Catalog</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
