import React, { useState } from "react";
import {
  fontRegistry,
  runtimeAssetResolver,
  type OverlayDocument,
  type DocumentCommand,
  type FontRef,
} from "@clypra-studio/engine";
import { Type, Plus, Globe, Monitor, Search } from "lucide-react";

interface FontManagerPanelProps {
  doc: OverlayDocument;
  selectedNodeId?: string | null;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

const SYSTEM_FONTS: FontRef[] = [
  { family: "Inter", source: "system", weight: 400, style: "normal" },
  { family: "Roboto", source: "system", weight: 400, style: "normal" },
  { family: "Outfit", source: "system", weight: 600, style: "normal" },
  { family: "Geist", source: "system", weight: 400, style: "normal" },
  { family: "Fira Code", source: "system", weight: 400, style: "normal" },
  { family: "Arial", source: "system", weight: 400, style: "normal" },
  { family: "Helvetica", source: "system", weight: 400, style: "normal" },
  { family: "Georgia", source: "system", weight: 400, style: "normal" },
];

const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";
const LABEL_CLS =
  "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";

export function FontManagerPanel({
  doc,
  selectedNodeId,
  onExecuteCommand,
}: FontManagerPanelProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [family, setFamily] = useState("");
  const [weight, setWeight] = useState(400);
  const [style, setStyle] = useState<"normal" | "italic">("normal");
  const [url, setUrl] = useState("");

  const registeredFonts = fontRegistry.list();
  const allFontsMap = new Map<string, FontRef>();
  for (const f of SYSTEM_FONTS)
    allFontsMap.set(`${f.family}:${f.weight}:${f.style}`, f);
  for (const f of registeredFonts)
    allFontsMap.set(`${f.family}:${f.weight}:${f.style}`, f);
  const allFonts = Array.from(allFontsMap.values());

  const filteredFonts = allFonts.filter((f) =>
    f.family.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddFont = (e: React.FormEvent) => {
    e.preventDefault();
    if (!family.trim()) return;

    const ref: FontRef = {
      family: family.trim(),
      source: url.trim() ? "remote" : "builtin",
      weight,
      style,
      url: url.trim() || undefined,
    };

    fontRegistry.register(ref);
    runtimeAssetResolver.resolveFontAsync(ref);

    setFamily("");
    setUrl("");
    setShowAddForm(false);
  };

  const handleApplyToSelectedNode = (ref: FontRef) => {
    if (!selectedNodeId) return;
    onExecuteCommand({
      type: "SET_FONT_REF",
      nodeId: selectedNodeId,
      fontRef: ref,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F14] overflow-hidden">
      {/* ── TOP ACTION BAR ───────────────────────────────────────────── */}
      <div className="p-3 border-b border-white/[0.05] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Type size={12} className="text-violet-400" />
            Font Manager
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus size={11} />
            Add Font
          </button>
        </div>

        {/* Add font form */}
        {showAddForm && (
          <form
            onSubmit={handleAddFont}
            className="p-2.5 bg-[#151519] border border-white/[0.08] rounded-xl flex flex-col gap-2 mt-1"
          >
            <div>
              <label className={LABEL_CLS}>Font Family Name</label>
              <input
                type="text"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder="e.g. Space Grotesk"
                className={INPUT_CLS}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>Weight</label>
                <select
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                  className={INPUT_CLS}
                >
                  <option value={300}>300 Light</option>
                  <option value={400}>400 Regular</option>
                  <option value={600}>600 SemiBold</option>
                  <option value={700}>700 Bold</option>
                  <option value={800}>800 ExtraBold</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className={INPUT_CLS}
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>
                Font CSS / WOFF2 URL (Optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=..."
                className={INPUT_CLS}
              />
            </div>
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-colors"
              >
                Register Font
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-2.5 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fonts…"
            className="w-full bg-[#151519] border border-white/6 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white focus:border-violet-500 outline-none placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* ── FONT CATALOG LIST ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredFonts.map((f) => {
          const state = fontRegistry.getState(f.family, f.weight, f.style);

          return (
            <div
              key={`${f.family}:${f.weight}:${f.style}`}
              className="group bg-[#151519] border border-white/6 hover:border-violet-500/30 rounded-xl p-3 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-white">
                    {f.family}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400">
                    {f.weight} {f.style !== "normal" && f.style}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      state === "ready" || f.source === "system"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : state === "loading"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {f.source === "system" ? (
                      <Monitor size={9} />
                    ) : (
                      <Globe size={9} />
                    )}
                    {f.source === "system" ? "System" : state}
                  </span>

                  {selectedNodeId && (
                    <button
                      type="button"
                      onClick={() => handleApplyToSelectedNode(f)}
                      className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>

              {/* Sample preview text */}
              <div
                className="text-[14px] text-gray-300 truncate pt-1 border-t border-white/4"
                style={{
                  fontFamily: f.family,
                  fontWeight: f.weight,
                  fontStyle: f.style,
                }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
