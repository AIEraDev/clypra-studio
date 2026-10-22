import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { getStudioApiBaseUrl } from "../../../services/apiConfig";
import type { TextAnimationPreset } from "../../../types/animation";

interface AnimationCatalogStatusModalProps {
  isOpen: boolean;
  localPresets: TextAnimationPreset[];
  canPublish: boolean;
  onPublishPreset: (
    preset: TextAnimationPreset,
  ) => Promise<TextAnimationPreset | null>;
  onClose: () => void;
}

type CatalogLoadState = "idle" | "loading" | "ready" | "error";

/**
 * Compares the working catalog with the authoritative API catalog. Presence in
 * the API means the preset is published; local-only presets remain drafts.
 */
export const AnimationCatalogStatusModal: React.FC<
  AnimationCatalogStatusModalProps
> = ({ isOpen, localPresets, canPublish, onPublishPreset, onClose }) => {
  const [apiPresets, setApiPresets] = useState<TextAnimationPreset[]>([]);
  const [state, setState] = useState<CatalogLoadState>("idle");
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const response = await fetch(
        `${getStudioApiBaseUrl()}/text-animations/catalog`,
        {
          headers: { Accept: "application/json" },
          credentials: "include",
        },
      );
      if (!response.ok)
        throw new Error(`Catalog request failed (${response.status})`);

      const data: unknown = await response.json();
      if (!Array.isArray(data))
        throw new Error("The API returned an invalid animation catalog.");
      setApiPresets(data as TextAnimationPreset[]);
      setState("ready");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the API catalog.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (isOpen && state === "idle") void loadCatalog();
  }, [isOpen, loadCatalog, state]);

  const entries = useMemo(() => {
    const apiById = new Map(apiPresets.map((preset) => [preset.id, preset]));
    const localIds = new Set(localPresets.map((preset) => preset.id));
    const localEntries = localPresets.map((preset) => ({
      preset: apiById.get(preset.id) ?? preset,
      published: apiById.has(preset.id),
      source: "local" as const,
    }));
    const apiOnlyEntries = apiPresets
      .filter((preset) => !localIds.has(preset.id))
      .map((preset) => ({ preset, published: true, source: "api" as const }));

    return [...localEntries, ...apiOnlyEntries].sort((a, b) => {
      if (a.published !== b.published) return a.published ? -1 : 1;
      return a.preset.name.localeCompare(b.preset.name);
    });
  }, [apiPresets, localPresets]);

  if (!isOpen) return null;

  const publishedCount = entries.filter((entry) => entry.published).length;
  const draftCount = entries.length - publishedCount;

  const publishPreset = async (preset: TextAnimationPreset) => {
    setPublishingId(preset.id);
    setError("");
    const publishedPreset = await onPublishPreset(preset);
    if (publishedPreset) {
      setApiPresets((current) => [
        ...current.filter((candidate) => candidate.id !== publishedPreset.id),
        publishedPreset,
      ]);
      setState("ready");
    }
    setPublishingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="animation-catalog-title"
    >
      <div className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--studio-border)] bg-[var(--studio-panel)] shadow-2xl">
        <header className="flex items-start justify-between border-b border-[var(--studio-border)] px-5 py-4">
          <div>
            <h2
              id="animation-catalog-title"
              className="flex items-center gap-2 text-sm font-bold text-white"
            >
              <Cloud size={16} className="text-[var(--studio-accent)]" />
              Animation API catalog
            </h2>
            <p className="mt-1 text-xs text-[var(--studio-muted)]">
              API entries are published. Local-only presets are not published
              yet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--studio-muted)] hover:bg-white/10 hover:text-white"
            title="Close catalog"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-[var(--studio-border)] px-5 py-3 text-xs">
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-300">
            {publishedCount} published
          </span>
          <span className="rounded-full bg-amber-500/10 px-2 py-1 font-semibold text-amber-200">
            {draftCount} not published
          </span>
          <button
            onClick={() => void loadCatalog()}
            disabled={state === "loading"}
            className="ml-auto flex items-center gap-1 rounded border border-[var(--studio-border)] px-2 py-1 text-[var(--studio-muted)] hover:border-[var(--studio-accent)] hover:text-white disabled:opacity-50"
          >
            {state === "loading" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Refresh
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-3">
          {state === "loading" && entries.length === 0 ? (
            <div className="flex h-32 items-center justify-center gap-2 text-xs text-[var(--studio-muted)]">
              <Loader2 size={15} className="animate-spin" /> Loading API
              catalog…
            </div>
          ) : state === "error" ? (
            <div className="m-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
              {error} Local drafts are shown as not published until the catalog
              can be loaded.
            </div>
          ) : null}

          <div className="space-y-1.5">
            {entries.map(({ preset, published, source }) => (
              <div
                key={preset.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--studio-border)] bg-[var(--studio-control)] px-3 py-2"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${published ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}
                >
                  {published ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-current" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">
                    {preset.name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--studio-muted)]">
                    {preset.phase.toUpperCase()} · {preset.category}
                    {source === "api" ? " · API only" : ""}
                  </div>
                </div>
                {published ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                    Published
                  </span>
                ) : (
                  <button
                    onClick={() => void publishPreset(preset)}
                    disabled={!canPublish || publishingId === preset.id}
                    title={
                      canPublish
                        ? `Publish ${preset.name} to the animation API`
                        : "Administrator access is required to publish"
                    }
                    className="flex items-center gap-1 rounded-md bg-[var(--studio-accent)] px-2 py-1 text-[10px] font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-amber-500/15 disabled:text-amber-200"
                  >
                    {publishingId === preset.id ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Upload size={11} />
                    )}
                    {canPublish ? "Publish" : "Not published"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
