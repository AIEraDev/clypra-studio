import {
  Sparkles,
  Play,
  Clock,
  Zap,
  Film,
  TrendingUp,
  Sliders,
  Wand2,
} from "lucide-react";
import type { LayerAnimation } from "@clypra-studio/engine";

export interface MotionStylePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  animation: LayerAnimation;
}

export const MOTION_STYLE_PRESETS: MotionStylePreset[] = [
  {
    id: "smooth-rise",
    name: "Smooth Rise",
    description: "Slide up into hold, fade out",
    icon: TrendingUp,
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
    description: "Bouncy scale pop in, scale out",
    icon: Zap,
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
    name: "Cinematic",
    description: "Track in with subtle blur fade",
    icon: Film,
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
    name: "3D Flip",
    description: "3D tumble flip in, slide down",
    icon: Sparkles,
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
    description: "Text typing effect",
    icon: Play,
    animation: {
      in: "typewriter",
      out: "fade",
      inDuration: 0.8,
      outDuration: 0.3,
      hold: "full",
    },
  },
  {
    id: "static",
    name: "Static",
    description: "No motion, 100% visible",
    icon: Clock,
    animation: {
      in: "none",
      out: "none",
      inDuration: 0,
      outDuration: 0,
      hold: "full",
    },
  },
];

interface LayerAnimationTimelineProps {
  animation: LayerAnimation;
  totalDuration?: number;
  onChange: (updatedAnimation: LayerAnimation) => void;
  onOpenCatalog?: () => void;
}

export const LayerAnimationTimeline: React.FC<LayerAnimationTimelineProps> = ({
  animation,
  totalDuration = 3.0,
  onChange,
  onOpenCatalog,
}) => {
  const inDuration = animation.inDuration ?? 0;
  const outDuration = animation.outDuration ?? 0;
  const holdDuration = Math.max(0, totalDuration - inDuration - outDuration);

  const inPercent = Math.max(0, Math.min(100, (inDuration / totalDuration) * 100));
  const outPercent = Math.max(0, Math.min(100, (outDuration / totalDuration) * 100));
  const holdPercent = Math.max(0, 100 - inPercent - outPercent);

  const handleApplyMotionPreset = (preset: MotionStylePreset) => {
    onChange({ ...preset.animation });
  };

  return (
    <div className="space-y-3">
      {/* 1-Click Motion Bundles */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#888899] flex items-center gap-1">
            <Sparkles size={12} className="text-purple-400" />
            Motion Style Bundles
          </label>
          {onOpenCatalog && (
            <button
              type="button"
              onClick={onOpenCatalog}
              className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
            >
              <Wand2 size={10} /> Browse 12+ Styles
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MOTION_STYLE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive =
              animation.in === preset.animation.in &&
              animation.out === preset.animation.out;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyMotionPreset(preset)}
                title={preset.description}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  isActive
                    ? "bg-purple-500/15 border-purple-500/60 text-purple-300 shadow-sm shadow-purple-500/20"
                    : "bg-[#15151F] border-[#2A2A38] hover:border-[#3E3E52] text-[#9A9AAA] hover:text-white"
                }`}
              >
                <Icon size={13} className="mb-1 text-purple-400" />
                <span className="text-[10px] font-semibold truncate w-full">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Motion Timeline Strip */}
      <div className="space-y-1.5 p-2.5 rounded-xl border border-[#2A2A38] bg-[#101018]">
        <div className="flex items-center justify-between text-[10px] text-[#888899] font-mono">
          <span className="flex items-center gap-1 text-teal-400 font-semibold">
            In: {inDuration.toFixed(2)}s
          </span>
          <span className="text-white font-semibold">
            Hold: {holdDuration.toFixed(2)}s
          </span>
          <span className="flex items-center gap-1 text-pink-400 font-semibold">
            Out: {outDuration.toFixed(2)}s
          </span>
        </div>

        {/* Proportional Timeline Bar */}
        <div className="h-3 w-full rounded-full bg-[#181824] flex overflow-hidden border border-[#2A2A38]">
          <div
            style={{ width: `${inPercent}%` }}
            className="bg-gradient-to-r from-teal-500 to-teal-400 h-full transition-all"
            title={`Entrance: ${inDuration}s`}
          />
          <div
            style={{ width: `${holdPercent}%` }}
            className="bg-purple-500/30 h-full flex items-center justify-center transition-all"
            title={`Hold: ${holdDuration.toFixed(2)}s`}
          />
          <div
            style={{ width: `${outPercent}%` }}
            className="bg-gradient-to-r from-pink-400 to-pink-500 h-full transition-all"
            title={`Exit: ${outDuration}s`}
          />
        </div>
      </div>

      {/* Granular Animation Controls */}
      <div className="space-y-2.5 pt-1">
        {/* Entrance Preset & Duration */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] text-[#888899] mb-0.5 font-semibold text-teal-400">
              Entrance Preset
            </label>
            <select
              value={animation.in || "none"}
              onChange={(e) =>
                onChange({
                  ...animation,
                  in: e.target.value,
                  inDuration: animation.inDuration || 0.5,
                })
              }
              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
            >
              <option value="none">none (immediate)</option>
              <option value="slide-up">slide-up</option>
              <option value="slide-down">slide-down</option>
              <option value="slide-left">slide-left</option>
              <option value="slide-right">slide-right</option>
              <option value="fade">fade</option>
              <option value="scale-in">scale-in</option>
              <option value="scale-pop">scale-pop (pop)</option>
              <option value="blur-in">blur-in</option>
              <option value="3d-flip">3d-flip (tumble)</option>
              <option value="track-in">track-in (expand)</option>
              <option value="wave">wave (sine)</option>
              <option value="glitch">glitch (cyber)</option>
              <option value="typewriter">typewriter</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[9px] text-[#888899] font-semibold">
                In Duration
              </label>
              <span className="text-[9px] font-mono text-teal-400">
                {inDuration.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(2.0, totalDuration)}
              step={0.05}
              value={inDuration}
              onChange={(e) =>
                onChange({
                  ...animation,
                  inDuration: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full accent-teal-400 cursor-pointer h-1.5 bg-[#1C1C2A] rounded-lg"
            />
          </div>
        </div>

        {/* Exit Preset & Duration */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] text-[#888899] mb-0.5 font-semibold text-pink-400">
              Exit Preset
            </label>
            <select
              value={animation.out || "none"}
              onChange={(e) =>
                onChange({
                  ...animation,
                  out: e.target.value,
                  outDuration: animation.outDuration || 0.3,
                })
              }
              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
            >
              <option value="none">none (hold until end)</option>
              <option value="fade">fade</option>
              <option value="slide-down">slide-down</option>
              <option value="slide-up">slide-up</option>
              <option value="slide-left">slide-left</option>
              <option value="slide-right">slide-right</option>
              <option value="scale-out">scale-out</option>
              <option value="blur-out">blur-out</option>
              <option value="3d-flip">3d-flip</option>
              <option value="wave">wave</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[9px] text-[#888899] font-semibold">
                Out Duration
              </label>
              <span className="text-[9px] font-mono text-pink-400">
                {outDuration.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(2.0, totalDuration)}
              step={0.05}
              value={outDuration}
              onChange={(e) =>
                onChange({
                  ...animation,
                  outDuration: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full accent-pink-400 cursor-pointer h-1.5 bg-[#1C1C2A] rounded-lg"
            />
          </div>
        </div>

        {/* Hold Timing Strategy */}
        <div>
          <label className="block text-[9px] text-[#888899] mb-0.5 font-semibold">
            Hold Timing Behavior
          </label>
          <select
            value={animation.hold || "full"}
            onChange={(e) =>
              onChange({
                ...animation,
                hold:
                  e.target.value === "full"
                    ? "full"
                    : parseFloat(e.target.value) || "full",
              })
            }
            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
          >
            <option value="full">Hold full timeline duration between transitions</option>
            <option value={1}>1.0 second hold</option>
            <option value={1.5}>1.5 seconds hold</option>
            <option value={2}>2.0 seconds hold</option>
          </select>
        </div>
      </div>
    </div>
  );
};
