import React from "react";
import {
  TextSplitAnimator,
  SplitMode,
  StaggerDirection,
  TemplateEasingFunction,
  BezierControlPoints,
} from "@clypra-studio/engine";
import { BezierCurveEditor } from "./BezierCurveEditor";
import { Split, Sparkles, Layers, Sliders, Move, RotateCw, Eye } from "lucide-react";

interface TextSplitAnimatorControlProps {
  animator?: TextSplitAnimator;
  onChange: (animator: TextSplitAnimator | undefined) => void;
}

const DEFAULT_ANIMATOR: TextSplitAnimator = {
  splitBy: "character",
  direction: "start-to-end",
  delayPerUnit: 0.04,
  overlap: 0.5,
  initialTransform: {
    x: 0,
    y: 30,
    scale: 0.8,
    rotateX: 30,
    opacity: 0,
    blur: 6,
  },
  easing: "cubic-bezier",
  bezier: { x1: 0.2, y1: 0.8, x2: 0.2, y2: 1.0 },
};

export const TextSplitAnimatorControl: React.FC<TextSplitAnimatorControlProps> = ({
  animator,
  onChange,
}) => {
  const isEnabled = !!animator;
  const current = animator || DEFAULT_ANIMATOR;

  const updateField = <K extends keyof TextSplitAnimator>(field: K, val: TextSplitAnimator[K]) => {
    onChange({
      ...current,
      [field]: val,
    });
  };

  const updateInitTransform = (field: string, val: number) => {
    onChange({
      ...current,
      initialTransform: {
        ...current.initialTransform,
        [field]: val,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Split className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-zinc-200">Kinetic Text Splitting</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              if (e.target.checked) {
                onChange(DEFAULT_ANIMATOR);
              } else {
                onChange(undefined);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {isEnabled && (
        <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/80">
          {/* Split Mode & Stagger Direction */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Split By</label>
              <select
                value={current.splitBy}
                onChange={(e) => updateField("splitBy", e.target.value as SplitMode)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="character">Character (Glyph)</option>
                <option value="word">Word</option>
                <option value="line">Line</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Stagger Direction</label>
              <select
                value={current.direction}
                onChange={(e) => updateField("direction", e.target.value as StaggerDirection)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="start-to-end">Start → End (Left to Right)</option>
                <option value="end-to-start">End → Start (Right to Left)</option>
                <option value="center-out">Center → Edges</option>
                <option value="edges-in">Edges → Center</option>
                <option value="random">Random Jitter</option>
              </select>
            </div>
          </div>

          {/* Timing: Delay Per Unit & Overlap */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Unit Delay</span>
                <span className="font-mono">{current.delayPerUnit}s</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={current.delayPerUnit}
                onChange={(e) => updateField("delayPerUnit", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-0.5">
                <span>Overlap</span>
                <span className="font-mono">{Math.round(current.overlap * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.05"
                value={current.overlap}
                onChange={(e) => updateField("overlap", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Initial Transform Controls */}
          <div className="flex flex-col gap-2 p-2 bg-zinc-950/80 rounded border border-zinc-800/60">
            <span className="font-medium text-zinc-300 text-[11px] flex items-center gap-1">
              <Move className="w-3 h-3 text-zinc-400" />
              Starting Transform Offsets
            </span>

            {/* Translate Y & Scale */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Translate Y</span>
                  <span className="font-mono">{current.initialTransform.y ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={current.initialTransform.y ?? 0}
                  onChange={(e) => updateInitTransform("y", parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none accent-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Scale</span>
                  <span className="font-mono">{current.initialTransform.scale ?? 1}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={current.initialTransform.scale ?? 1}
                  onChange={(e) => updateInitTransform("scale", parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none accent-purple-500"
                />
              </div>
            </div>

            {/* 3D Flip (RotateX) & Blur */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>3D Rotate X</span>
                  <span className="font-mono">{current.initialTransform.rotateX ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={current.initialTransform.rotateX ?? 0}
                  onChange={(e) => updateInitTransform("rotateX", parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none accent-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Blur</span>
                  <span className="font-mono">{current.initialTransform.blur ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={current.initialTransform.blur ?? 0}
                  onChange={(e) => updateInitTransform("blur", parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Bezier Easing */}
          <BezierCurveEditor
            bezier={current.bezier}
            onChange={(b) => updateField("bezier", b)}
            currentEasing={current.easing}
            onEasingChange={(e) => updateField("easing", e)}
          />
        </div>
      )}
    </div>
  );
};
