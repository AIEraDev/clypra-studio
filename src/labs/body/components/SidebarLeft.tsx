import React, { useState, useMemo } from "react";

export interface ProviderItem {
  id: string;
  name: string;
  status: string;
}

export interface CategoryFilterItem {
  id: string;
  label: string;
}

export const BODY_EFFECT_CATEGORIES: CategoryFilterItem[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "motion", label: "Motion" },
  { id: "aura", label: "Aura" },
  { id: "wings", label: "Wings" },
  { id: "energy", label: "Energy" },
  { id: "fun", label: "Fun" },
];

export interface BodyEffectLibraryItem {
  id: string;
  name: string;
  category: "Trending" | "Motion" | "Aura" | "Wings" | "Energy" | "Fun" | string;
  description: string;
  primitive: string;
  status: "ACTIVE" | "STABLE" | "DRAFT";
}

export const REGISTERED_BODY_EFFECTS: BodyEffectLibraryItem[] = [
  {
    id: "subject-cutout",
    name: "SUBJECT_CUTOUT",
    category: "Trending",
    description: "AlphaCutout layer synthesis (Text Behind Subject)",
    primitive: "AlphaCutout",
    status: "ACTIVE",
  },
];

interface SidebarLeftProps {
  videoFile: File | null;
  fitMode: "stretch" | "fit" | "crop";
  selectedEffect: string;
  providers: ProviderItem[];
  activeProvider: string;
  activeCategory?: string;
  onVideoImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetFitMode: (mode: "stretch" | "fit" | "crop") => void;
  onSetActiveProvider: (id: string) => void;
  onSelectEffect: (effect: string) => void;
  onActiveCategoryChange?: (category: string) => void;
}

export function SidebarLeft({
  videoFile,
  fitMode,
  selectedEffect,
  providers,
  activeProvider,
  activeCategory: propCategory,
  onVideoImport,
  onSetFitMode,
  onSetActiveProvider,
  onSelectEffect,
  onActiveCategoryChange,
}: SidebarLeftProps) {
  const [internalCategory, setInternalCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeCategory = propCategory ?? internalCategory;

  const handleCategorySelect = (categoryId: string) => {
    setInternalCategory(categoryId);
    onActiveCategoryChange?.(categoryId);
  };

  const filteredEffects = useMemo(() => {
    let list = REGISTERED_BODY_EFFECTS;

    if (activeCategory !== "all") {
      list = list.filter(
        (effect) => effect.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (effect) =>
          effect.name.toLowerCase().includes(q) ||
          effect.id.toLowerCase().includes(q) ||
          effect.description.toLowerCase().includes(q) ||
          effect.category.toLowerCase().includes(q) ||
          effect.primitive.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  return (
    <aside className="flex flex-col h-full w-[280px] min-w-[280px] bg-surface-container-low border-r border-outline-variant p-1 gap-1 overflow-hidden select-none">
      <div className="flex items-center gap-2 p-1 border-b border-outline-variant pb-2 mb-1">
        <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            dataset
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-label-sm font-bold text-on-surface truncate">PRJ_03_BODY</h2>
          <p className="text-[9px] font-mono-data text-on-surface-variant uppercase">
            Feature_Segmentation
          </p>
        </div>
      </div>

      {/* Video Input */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1 flex justify-between">
          Source <span className="text-primary">LIVE</span>
        </h3>
        <label className="border border-dashed border-outline-variant rounded p-2 text-center cursor-pointer hover:border-primary group transition-colors block">
          <input type="file" accept="video/*" className="hidden" onChange={onVideoImport} />
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-1">
            file_upload
          </span>
          <p className="text-[10px] text-on-surface-variant group-hover:text-on-surface truncate">
            {videoFile ? videoFile.name : "LOAD_SUBJECT.bin"}
          </p>
        </label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {(["stretch", "fit", "crop"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetFitMode(mode)}
              className={`py-0.5 rounded text-[9px] font-bold border transition-all ${
                fitMode === mode
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-surface-container-highest text-on-surface-variant border-transparent"
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Providers manager */}
      <div className="bg-surface-container border border-outline-variant p-1.5 rounded">
        <h3 className="text-[10px] font-bold text-outline-variant uppercase mb-1">
          Feature_Providers
        </h3>
        <div className="flex flex-col gap-1">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onSetActiveProvider(p.id)}
              className={`py-1 px-1.5 rounded text-[10px] font-bold border text-left transition-all ${
                activeProvider === p.id
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-surface-container-highest text-on-surface-variant border-transparent"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{p.name}</span>
                <span className="text-[7.5px] font-mono-data opacity-60 uppercase">{p.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Effect Library with Category Filtering */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-[10px] font-bold text-outline-variant uppercase">
            Body_Effects
          </h3>
          <span className="text-[8.5px] font-mono-data px-1 py-0.2 rounded bg-surface-container-highest text-primary">
            {filteredEffects.length} of {REGISTERED_BODY_EFFECTS.length} EFFECT{REGISTERED_BODY_EFFECTS.length === 1 ? "" : "S"}
          </span>
        </div>

        {/* Search input */}
        <div className="relative mb-1 px-0.5">
          <span
            className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[12px]"
          >
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter body effects..."
            className="w-full bg-surface-container border border-outline-variant rounded text-[9.5px] text-on-surface pl-6 pr-2 py-1 outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1 mb-1.5 px-0.5">
          {BODY_EFFECT_CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? REGISTERED_BODY_EFFECTS.length
                : REGISTERED_BODY_EFFECTS.filter(
                    (e) => e.category.toLowerCase() === cat.id.toLowerCase()
                  ).length;
            const isSelected = activeCategory.toLowerCase() === cat.id.toLowerCase();

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all border flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-primary/20 text-primary border-primary/40 shadow-2xs"
                    : "bg-surface-container text-on-surface-variant border-transparent hover:border-outline-variant hover:text-on-surface"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[7px] font-mono-data px-1 rounded-full ${
                    isSelected
                      ? "bg-primary/30 text-primary font-bold"
                      : "bg-surface-container-highest text-on-surface-variant/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Effects List or Empty State */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
          {filteredEffects.length > 0 ? (
            filteredEffects.map((effect) => {
              const isSelected = selectedEffect === effect.id;
              return (
                <div
                  key={effect.id}
                  onClick={() => onSelectEffect(effect.id)}
                  className={`p-2 cursor-pointer border-l-2 rounded-r transition-all ${
                    isSelected
                      ? "bg-surface-container-high border-primary text-primary"
                      : "bg-surface-container border-transparent hover:bg-surface-container-high text-on-surface"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold">{effect.name}</span>
                      <span className="text-[7.5px] font-mono-data px-1 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                        {effect.category}
                      </span>
                    </div>
                    <span className="text-[8.5px] font-mono-data text-primary">
                      {isSelected ? "ACTIVE" : effect.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-tight mt-1">
                    {effect.description}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center rounded bg-surface-container/60 border border-outline-variant/40 my-2">
              <span className="material-symbols-outlined text-outline text-lg mb-1 block">
                category
              </span>
              <p className="text-[10.5px] font-bold text-on-surface">
                No effects in {activeCategory.toUpperCase()} yet
              </p>
              <p className="text-[9px] text-on-surface-variant mt-1 leading-snug">
                For now, only Subject Cutout is available in Trending. More effects will appear here as categories are published.
              </p>
              <button
                onClick={() => handleCategorySelect("trending")}
                className="mt-2 px-2.5 py-1 text-[9px] font-bold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-all border border-primary/30 cursor-pointer"
              >
                View Trending Effects (1)
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
