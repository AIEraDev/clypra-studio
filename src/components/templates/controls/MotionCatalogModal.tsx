import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  Film,
  Play,
  Clock,
  Activity,
  Waves,
  ArrowDownCircle,
  MoveHorizontal,
  Maximize2,
  Eye,
  Check,
  Layers,
  Wand2,
} from "lucide-react";
import type { LayerAnimation } from "@clypra-studio/engine";

export interface MotionCatalogPreset {
  id: string;
  name: string;
  category: "all" | "smooth" | "punchy" | "cinematic" | "kinetic";
  categoryLabel: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  badge: string;
  animation: LayerAnimation;
}

export const MOTION_CATALOG_PRESETS: MotionCatalogPreset[] = [
  {
    id: "smooth-rise",
    name: "Smooth Rise",
    category: "smooth",
    categoryLabel: "Clean & Smooth",
    description: "Upward slide-in with cubic ease-out, soft fade exit",
    icon: TrendingUp,
    accentColor: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/40",
    badge: "POPULAR",
    animation: {
      in: "slide-up",
      out: "fade",
      inDuration: 0.5,
      outDuration: 0.3,
      hold: "full",
    },
  },
  {
    id: "pop-scale",
    name: "Pop & Scale",
    category: "punchy",
    categoryLabel: "Punchy & Dynamic",
    description: "Bouncy elastic scale-pop in with rebound, smooth scale out",
    icon: Zap,
    accentColor: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40",
    badge: "HIGH ENERGY",
    animation: {
      in: "scale-pop",
      out: "scale-out",
      inDuration: 0.45,
      outDuration: 0.35,
      hold: "full",
    },
  },
  {
    id: "cinematic-reveal",
    name: "Cinematic Reveal",
    category: "cinematic",
    categoryLabel: "Cinematic & Atmospheric",
    description: "Dramatic letter track-in with Gaussian blur dissolve",
    icon: Film,
    accentColor: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/40",
    badge: "FILMIC",
    animation: {
      in: "track-in",
      out: "blur-out",
      inDuration: 0.6,
      outDuration: 0.4,
      hold: "full",
    },
  },
  {
    id: "dynamic-3d",
    name: "3D Flip & Tilt",
    category: "kinetic",
    categoryLabel: "Expressive & 3D",
    description: "3D tumble flip with perspective tilt into slide-down exit",
    icon: Sparkles,
    accentColor: "from-fuchsia-500/20 to-violet-500/20 text-fuchsia-400 border-fuchsia-500/40",
    badge: "3D MOTION",
    animation: {
      in: "3d-flip",
      out: "slide-down",
      inDuration: 0.5,
      outDuration: 0.35,
      hold: "full",
    },
  },
  {
    id: "typewriter",
    name: "Typewriter",
    category: "kinetic",
    categoryLabel: "Editorial & Narrative",
    description: "Mechanical character-by-character typewriter reveal",
    icon: Play,
    accentColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40",
    badge: "TEXT SPECIAL",
    animation: {
      in: "typewriter",
      out: "fade",
      inDuration: 0.8,
      outDuration: 0.3,
      hold: "full",
    },
  },
  {
    id: "glitch-impact",
    name: "Glitch Impact",
    category: "kinetic",
    categoryLabel: "Cyberpunk & Tech",
    description: "High-voltage glitch jitter with chromatic position pulse",
    icon: Activity,
    accentColor: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40",
    badge: "CYBERPUNK",
    animation: {
      in: "glitch",
      out: "fade",
      inDuration: 0.4,
      outDuration: 0.25,
      hold: "full",
    },
  },
  {
    id: "wave-harmonic",
    name: "Wave Harmonic",
    category: "smooth",
    categoryLabel: "Clean & Smooth",
    description: "Harmonic floating sine wave rise into solid hold",
    icon: Waves,
    accentColor: "from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/40",
    badge: "ORGANIC",
    animation: {
      in: "wave",
      out: "slide-up",
      inDuration: 0.6,
      outDuration: 0.35,
      hold: "full",
    },
  },
  {
    id: "bounce-drop",
    name: "Bounce Drop",
    category: "punchy",
    categoryLabel: "Punchy & Dynamic",
    description: "High-energy gravity drop from above with solid impact",
    icon: ArrowDownCircle,
    accentColor: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/40",
    badge: "GRAVITY",
    animation: {
      in: "slide-down",
      out: "scale-out",
      inDuration: 0.55,
      outDuration: 0.3,
      hold: "full",
    },
  },
  {
    id: "lateral-sweep",
    name: "Lateral Sweep",
    category: "smooth",
    categoryLabel: "Broadcast & Corporate",
    description: "Horizontal lower-third sweep across the canvas axis",
    icon: MoveHorizontal,
    accentColor: "from-indigo-500/20 to-sky-500/20 text-indigo-300 border-indigo-500/40",
    badge: "BROADCAST",
    animation: {
      in: "slide-left",
      out: "slide-right",
      inDuration: 0.45,
      outDuration: 0.35,
      hold: "full",
    },
  },
  {
    id: "zoom-punch",
    name: "Zoom Punch",
    category: "punchy",
    categoryLabel: "Punchy & Dynamic",
    description: "Rapid high-impact push-in snap with scale dissolution",
    icon: Maximize2,
    accentColor: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/40",
    badge: "SNAP IMPACT",
    animation: {
      in: "scale-in",
      out: "scale-out",
      inDuration: 0.35,
      outDuration: 0.25,
      hold: "full",
    },
  },
  {
    id: "soft-blur-focus",
    name: "Soft Blur Focus",
    category: "cinematic",
    categoryLabel: "Cinematic & Atmospheric",
    description: "Dreamy optical depth-of-field focus pull reveal",
    icon: Eye,
    accentColor: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/40",
    badge: "DREAMY",
    animation: {
      in: "blur-in",
      out: "blur-out",
      inDuration: 0.55,
      outDuration: 0.4,
      hold: "full",
    },
  },
  {
    id: "static",
    name: "Static (No Motion)",
    category: "smooth",
    categoryLabel: "Minimal & Static",
    description: "Immediate solid visibility without animation delay",
    icon: Clock,
    accentColor: "from-gray-500/20 to-slate-500/20 text-gray-400 border-gray-500/40",
    badge: "MINIMAL",
    animation: {
      in: "none",
      out: "none",
      inDuration: 0,
      outDuration: 0,
      hold: "full",
    },
  },
];

interface MotionCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAnimation: LayerAnimation;
  onApplyToLayer: (preset: MotionCatalogPreset) => void;
  onApplyToAllLayers?: (preset: MotionCatalogPreset) => void;
}

export const MotionCatalogModal: React.FC<MotionCatalogModalProps> = ({
  isOpen,
  onClose,
  currentAnimation,
  onApplyToLayer,
  onApplyToAllLayers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPresets = useMemo(() => {
    return MOTION_CATALOG_PRESETS.filter((preset) => {
      const matchesCategory =
        selectedCategory === "all" || preset.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "All Styles", count: MOTION_CATALOG_PRESETS.length },
    { id: "smooth", label: "Clean & Smooth", count: MOTION_CATALOG_PRESETS.filter((p) => p.category === "smooth").length },
    { id: "punchy", label: "Punchy & Dynamic", count: MOTION_CATALOG_PRESETS.filter((p) => p.category === "punchy").length },
    { id: "cinematic", label: "Cinematic & Filmic", count: MOTION_CATALOG_PRESETS.filter((p) => p.category === "cinematic").length },
    { id: "kinetic", label: "Kinetic & Cyberpunk", count: MOTION_CATALOG_PRESETS.filter((p) => p.category === "kinetic").length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[85vh] bg-[#101018] border border-[#2A2A3E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A38] bg-[#141420]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400">
              <Wand2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Motion Style Catalog
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  {MOTION_CATALOG_PRESETS.length} UNIQUE MOTIONS
                </span>
              </h2>
              <p className="text-xs text-[#888899]">
                Curated entrance & exit animation bundles for titles, badges, and lower-thirds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#888899] hover:text-white hover:bg-[#2A2A38] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-b border-[#2A2A38]/60 bg-[#12121B]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/25 font-bold"
                    : "bg-[#181824] text-[#9A9AAA] hover:text-white hover:bg-[#222232] border border-[#2A2A38]"
                }`}
              >
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-[#2A2A38] text-[#777788]"
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777788]" />
            <input
              type="text"
              placeholder="Search motion styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#09090E] border border-[#2A2A38] rounded-lg text-xs text-white placeholder-[#555566] outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777788] hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[380px]">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles size={32} className="text-[#3A3A4E] mb-2" />
              <p className="text-sm font-semibold text-white">No motion styles match your search</p>
              <p className="text-xs text-[#777788] mt-1">Try adjusting your keyword or selected category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPresets.map((preset) => {
                const Icon = preset.icon;
                const isActive =
                  currentAnimation.in === preset.animation.in &&
                  currentAnimation.out === preset.animation.out;

                return (
                  <div
                    key={preset.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all relative overflow-hidden group ${
                      isActive
                        ? "bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10"
                        : "bg-[#141420] border-[#252536] hover:border-[#3E3E56] hover:bg-[#181826]"
                    }`}
                  >
                    {/* Top Row: Icon + Name + Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${preset.accentColor} border`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1F1F30] border border-[#33334A] text-[#9A9AC0] font-mono uppercase tracking-wider">
                            {preset.badge}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white shadow-sm">
                              <Check size={10} /> ACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1 leading-snug">
                        {preset.name}
                      </h3>
                      <p className="text-[11px] text-[#9A9AB0] leading-relaxed mb-3">
                        {preset.description}
                      </p>
                    </div>

                    {/* Bottom Row: Sequence Info + Apply Actions */}
                    <div className="border-t border-[#252536] pt-3 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#777788]">
                        <span className="flex items-center gap-1">
                          <span className="text-purple-400 font-semibold">{preset.animation.in}</span>
                          <span>➔</span>
                          <span className="text-pink-400 font-semibold">{preset.animation.out}</span>
                        </span>
                        <span>
                          {preset.animation.inDuration}s in · {preset.animation.outDuration}s out
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onApplyToLayer(preset);
                            onClose();
                          }}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30"
                              : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20"
                          }`}
                        >
                          {isActive ? "Re-apply Layer" : "Apply to Layer"}
                        </button>

                        {onApplyToAllLayers && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyToAllLayers(preset);
                              onClose();
                            }}
                            title="Apply this motion style to all layers in the template"
                            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-[#1F1F30] hover:bg-[#2A2A40] border border-[#33334A] text-[#B0B0CC] hover:text-white transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Layers size={12} /> All
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#2A2A38] bg-[#141420] text-xs text-[#777788]">
          <span>Tip: Click &quot;All&quot; to synchronise entrance &amp; exit timing across your whole lower-third or title card.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222232] hover:bg-[#2E2E42] text-white font-semibold transition-colors"
          >
            Close Catalog
          </button>
        </div>
      </div>
    </div>
  );
};
