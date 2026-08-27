import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import {
  Check,
  CloudDownload,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Preset, TextEffectConfig } from "@clypra-studio/engine";
import { _buildConfig, defaultConfig } from "@clypra-studio/engine";
import { getStudioApiBaseUrl } from "../../services/apiConfig";
import { getStoredAuthToken } from "../../services/authSession";
import { studioQueryKeys } from "../../services/studioQueryKeys";
import {
  TEXT_EFFECT_CATEGORIES,
  TEXT_EFFECT_CATEGORY_OPTIONS,
} from "../../constants/textEffectCategories";

type CatalogSort = "recency" | "name" | "category";

interface RemoteEffectSummary {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  thumbnailUrl?: string;
  published?: boolean;
  creator?: string;
  createdAt?: number;
}

interface TextEffectCatalogPanelProps {
  localPresets: Preset[];
  activePresetId: string;
  selectedCategory: string;
  sortBy: CatalogSort;
  onSelectedCategoryChange: (category: string) => void;
  onSortByChange: (sort: CatalogSort) => void;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (id: string, event: MouseEvent) => void;
  onStartFromScratch: () => void;
  onSavePreset: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeSummaryPayload(
  payload: unknown,
  fallbackCategory?: string,
): RemoteEffectSummary[] {
  const candidates: unknown[] = [];

  if (Array.isArray(payload)) {
    candidates.push(...payload);
  } else if (isRecord(payload)) {
    // Support the array response used by clypra-api as well as common
    // envelope shapes from local R2 mirrors and older API deployments.
    for (const key of ["effects", "items", "data", "results"]) {
      const value = payload[key];
      if (Array.isArray(value)) candidates.push(...value);
    }
    if (candidates.length === 0) {
      for (const [category, value] of Object.entries(payload)) {
        if (Array.isArray(value)) {
          candidates.push(
            ...value.map((item) =>
              isRecord(item)
                ? { ...item, category: item.category ?? category }
                : item,
            ),
          );
        }
      }
    }
  }

  return candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string") return [];
    return [
      {
        ...candidate,
        id: candidate.id,
        name:
          typeof candidate.name === "string" ? candidate.name : candidate.id,
        category:
          typeof candidate.category === "string" &&
          candidate.category.length > 0
            ? candidate.category
            : (fallbackCategory ?? "uncategorized"),
      } as RemoteEffectSummary,
    ];
  });
}

async function fetchRemoteEffectCatalog({
  signal,
}: QueryFunctionContext): Promise<RemoteEffectSummary[]> {
  const token = getStoredAuthToken();
  const apiBase = getStudioApiBaseUrl();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const request = async (url: string) => {
    const response = await fetch(url, { signal, headers });
    // If an endpoint or category doesn't exist yet on remote or has no data, handle gracefully
    if (response.status === 400 || response.status === 404 || response.status === 204) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`Catalog request failed (${response.status})`);
    }
    return response.json() as Promise<unknown>;
  };

  let rootError: unknown;
  let payload: unknown;
  try {
    payload = await request(`${apiBase}/text-effects`);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    rootError = cause;
  }

  const summaries = normalizeSummaryPayload(payload);

  // If the root catalog already returned existing remote effects, we have the full catalog.
  // Otherwise, fallback to querying the supported categories from textEffectCategories.
  let categorySummaries: RemoteEffectSummary[] = [];
  if (summaries.length === 0) {
    const categoryPayloads = await Promise.all(
      TEXT_EFFECT_CATEGORIES.map(async (category) => {
        try {
          const categoryPayload = await request(
            `${apiBase}/text-effects/${category}`,
          );
          return normalizeSummaryPayload(categoryPayload, category);
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            throw cause;
          }
          // Some categories may not have data yet; return empty array gracefully
          return [];
        }
      }),
    );
    categorySummaries = categoryPayloads.flat();
  }

  // Deduplicate by effect ID, favoring any item with an assigned category over 'uncategorized'
  const byId = new Map<string, RemoteEffectSummary>();
  [...summaries, ...categorySummaries].forEach((effect) => {
    const existing = byId.get(effect.id);
    if (
      !existing ||
      (existing.category === "uncategorized" && effect.category !== "uncategorized")
    ) {
      byId.set(effect.id, effect);
    }
  });
  const mergedSummaries = Array.from(byId.values());

  if (mergedSummaries.length === 0 && rootError) {
    throw rootError;
  }
  return mergedSummaries;
}

function normalizeConfig(
  definition: unknown,
  summary: RemoteEffectSummary,
): TextEffectConfig | null {
  const root = isRecord(definition) ? definition : {};
  const nested = isRecord(root.config)
    ? root.config
    : isRecord(root.definition)
      ? root.definition
      : root;

  // API-published definitions use the canonical { font, fills, strokes,
  // glows, ... } contract. Convert that contract through the same native
  // migration used by the editor instead of approximating it in the Studio.
  if (isRecord(nested.font) && Array.isArray(nested.fills)) {
    const nativeConfig = _buildConfig(
      nested as never,
      typeof nested.text === "string" ? nested.text : defaultConfig.text,
      typeof nested.fontSize === "number"
        ? nested.fontSize
        : defaultConfig.fontSize,
      typeof nested.canvasWidth === "number"
        ? nested.canvasWidth
        : defaultConfig.canvasWidth,
      typeof nested.canvasHeight === "number"
        ? nested.canvasHeight
        : defaultConfig.canvasHeight,
    );
    return {
      ...defaultConfig,
      ...nativeConfig,
      effectName: summary.name,
      text: typeof nested.text === "string" ? nested.text : defaultConfig.text,
    } as TextEffectConfig;
  }

  // Published definitions are intentionally accepted in both historical
  // shapes: top-level config fields and { config: TextEffectConfig }.
  const candidate = {
    ...defaultConfig,
    ...nested,
    text: typeof nested.text === "string" ? nested.text : defaultConfig.text,
    effectName:
      typeof nested.effectName === "string" ? nested.effectName : summary.name,
    // Preserve the one native procedural engine currently supported by the
    // shared scene migration. Unknown legacy renderer names are intentionally
    // dropped instead of creating a false native-compatibility claim.
    customRenderer:
      nested.customRenderer === "InkBrushEngine" ? "InkBrushEngine" : undefined,
  } as TextEffectConfig;

  if (!candidate.fontFamily || !candidate.fillType || !candidate.glowLayers) {
    return null;
  }

  return candidate;
}

function remoteToPreset(
  summary: RemoteEffectSummary,
  definition: unknown,
): Preset | null {
  const config = normalizeConfig(definition, summary);
  if (!config) return null;

  return {
    id: summary.id,
    name: summary.name,
    category: summary.category,
    config,
    isCustom: true,
    createdAt: summary.createdAt,
  };
}

function PreviewTile({
  name,
  thumbnail,
  accent,
}: {
  name: string;
  thumbnail?: string;
  accent: string;
}) {
  return (
    <div
      className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-[#09090D]"
      style={{
        backgroundImage: thumbnail
          ? undefined
          : `linear-gradient(135deg, ${accent}20, #09090D 70%)`,
      }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="px-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/85">
          {name.slice(0, 16)}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
    </div>
  );
}

function CatalogCard({
  summary,
  active,
  loading,
  onLoad,
}: {
  summary: RemoteEffectSummary;
  active: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const accent = summary.category.toLowerCase().includes("neon")
    ? "#34d399"
    : "#7c6fff";
  return (
    <article
      onClick={onLoad}
      className={`group cursor-pointer rounded-xl border p-2 transition-colors ${
        active
          ? "border-(--studio-accent) bg-(--studio-active-soft)"
          : "border-(--studio-border) bg-(--studio-panel) hover:border-(--studio-accent)/50"
      }`}
    >
      <PreviewTile
        name={summary.name}
        thumbnail={summary.thumbnailUrl ?? summary.thumbnail}
        accent={accent}
      />
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-semibold text-white">
            {summary.name}
          </h3>
          <p className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-(--studio-muted)">
            {summary.category}
            {summary.published === false ? " · Review" : " · Published"}
          </p>
        </div>
        {active && (
          <Check size={13} className="mt-0.5 shrink-0 text-(--studio-accent)" />
        )}
      </div>
      {summary.description && (
        <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-(--studio-muted)">
          {summary.description}
        </p>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLoad();
        }}
        disabled={loading}
        className="mt-2 flex w-full cursor-pointer! items-center justify-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) py-1.5 text-[10px] font-bold text-white transition-colors hover:border-(--studio-accent) hover:text-(--studio-accent) disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <CloudDownload size={11} />
        )}
        {loading
          ? "Loading..."
          : active
            ? "Loaded in canvas"
            : "Load into canvas"}
      </button>
    </article>
  );
}

function LocalCard({
  preset,
  active,
  onLoad,
  onDelete,
}: {
  preset: Preset;
  active: boolean;
  onLoad: () => void;
  onDelete: (event: MouseEvent) => void;
}) {
  const accent = preset.config.fillColor || "#7c6fff";
  return (
    <article
      onClick={onLoad}
      className={`group cursor-pointer rounded-xl border p-2 transition-colors ${
        active
          ? "border-(--studio-accent) bg-(--studio-active-soft)"
          : "border-(--studio-border) bg-(--studio-panel) hover:border-(--studio-accent)/50"
      }`}
    >
      <PreviewTile name={preset.name} accent={accent} />
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-semibold text-white">
            {preset.name}
          </h3>
          <p className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-(--studio-muted)">
            {preset.category || "Classic"} · Local native starter
          </p>
        </div>
        {preset.isCustom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="rounded p-1 text-(--studio-muted) opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
            aria-label={`Delete ${preset.name}`}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLoad();
        }}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) py-1.5 text-[10px] font-bold text-white transition-colors hover:border-(--studio-accent) hover:text-(--studio-accent)"
      >
        {active ? <Check size={11} /> : <Sparkles size={11} />}
        {active ? "Loaded in canvas" : "Use native starter"}
      </button>
    </article>
  );
}

export function TextEffectCatalogPanel({
  localPresets,
  activePresetId,
  selectedCategory,
  sortBy,
  onSelectedCategoryChange,
  onSortByChange,
  onApplyPreset,
  onDeletePreset,
  onStartFromScratch,
  onSavePreset,
}: TextEffectCatalogPanelProps) {
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const catalogQuery = useQuery({
    queryKey: studioQueryKeys.textEffectsCatalog,
    queryFn: fetchRemoteEffectCatalog,
  });
  const remoteEffects = catalogQuery.data ?? [];
  const loading = catalogQuery.isPending || catalogQuery.isFetching;

  useEffect(() => {
    if (!catalogQuery.error) return;
    toast.error("Failed to load catalog", {
      description:
        catalogQuery.error instanceof Error
          ? catalogQuery.error.message
          : "Unable to load published effects",
      id: "catalog-load-error",
    });
  }, [catalogQuery.error]);

  const categories = useMemo(() => {
    const values = new Set<string>(["All", "Saved"]);
    remoteEffects.forEach((effect) => values.add(effect.category));
    localPresets.forEach(
      (preset) => preset.category && values.add(preset.category),
    );
    return Array.from(values);
  }, [localPresets, remoteEffects]);

  const filteredRemote = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = remoteEffects.filter((effect) => {
      if (selectedCategory === "Saved") return false;
      if (selectedCategory !== "All" && effect.category !== selectedCategory)
        return false;
      if (!normalizedQuery) return true;
      return [
        effect.name,
        effect.category,
        effect.description,
        ...(effect.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category")
        return (
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        );
      return (
        (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.name.localeCompare(b.name)
      );
    });
  }, [query, remoteEffects, selectedCategory, sortBy]);

  const filteredLocal = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return localPresets.filter((preset) => {
      if (selectedCategory === "Saved" && !preset.isCustom) return false;
      if (
        selectedCategory !== "All" &&
        selectedCategory !== "Saved" &&
        preset.category !== selectedCategory
      )
        return false;
      if (!normalizedQuery) return true;
      return `${preset.name} ${preset.category ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [localPresets, query, selectedCategory]);

  const handleLoadRemote = async (summary: RemoteEffectSummary) => {
    setLoadingId(summary.id);
    try {
      const token = getStoredAuthToken();
      const response = await fetch(
        `${getStudioApiBaseUrl()}/text-effects/${encodeURIComponent(
          summary.category,
        )}/${encodeURIComponent(summary.id)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!response.ok)
        throw new Error(`Unable to load ${summary.name} (${response.status})`);
      const definition = await response.json();
      const preset = remoteToPreset(summary, definition);
      if (!preset)
        throw new Error(
          "This effect does not contain a compatible native text definition.",
        );
      onApplyPreset(preset);
    } catch (cause) {
      toast.error("Failed to load effect", {
        description:
          cause instanceof Error
            ? cause.message
            : "Unable to load effect definition",
        id: "effect-load-error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-(--studio-border) bg-(--studio-panel) p-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[16px] font-bold uppercase">
            Native effect library
          </div>
          <button
            type="button"
            onClick={() => void catalogQuery.refetch()}
            className="rounded-lg cursor-pointer border border-(--studio-border) p-2 text-(--studio-muted) hover:border-(--studio-accent) hover:text-white"
            title="Refresh effect catalog"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-2">
          <Search size={13} className="shrink-0 text-(--studio-muted)" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search effects, styles, tags…"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-(--studio-subtle)"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-2">
            <select
              value={selectedCategory}
              onChange={(event) => onSelectedCategoryChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[10px] text-white outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {TEXT_EFFECT_CATEGORY_OPTIONS.find((o) => o.id === category)
                    ?.name ?? category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-2">
            <select
              value={sortBy}
              onChange={(event) =>
                onSortByChange(event.target.value as CatalogSort)
              }
              className="rounded-lg text-[10px] text-white outline-none"
            >
              <option value="recency">Recent</option>
              <option value="name">A–Z</option>
              <option value="category">Category</option>
            </select>
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-(--studio-muted)">
            <Database size={11} /> Published catalog
          </h4>
          <span className="text-[9px] text-(--studio-muted)">
            {loading ? "Syncing…" : `${filteredRemote.length} effects`}
          </span>
        </div>
        {filteredRemote.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredRemote.map((summary) => (
              <CatalogCard
                key={`${summary.category}:${summary.id}`}
                summary={summary}
                active={activePresetId === summary.id}
                loading={loadingId === summary.id}
                onLoad={() => void handleLoadRemote(summary)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-(--studio-border) p-4 text-center text-[10px] leading-4 text-(--studio-muted)">
            {loading
              ? "Loading published native definitions…"
              : "No published effects match this filter. Local native starters are below."}
          </div>
        )}

        <div className="mb-2 mt-5 flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--studio-muted)">
            Local native starters
          </h4>
          <span className="text-[9px] text-(--studio-muted)">
            {filteredLocal.length} starters
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filteredLocal.map((preset) => (
            <LocalCard
              key={preset.id}
              preset={preset}
              active={activePresetId === preset.id}
              onLoad={() => onApplyPreset(preset)}
              onDelete={(event) => onDeletePreset(preset.id, event)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
