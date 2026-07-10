/**
 * Labs Navigation Panel
 *
 * Shows navigation buttons to the four effect labs (Video, Transition, Body, Filter).
 * Only visible to admin users.
 */

import React from "react";
import { Video, Zap, User, Palette, ExternalLink } from "lucide-react";

interface LabCard {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
}

const LABS: LabCard[] = [
  {
    id: "video-lab",
    name: "Video Lab",
    description: "Design and test single-input video effects with unified runtime",
    route: "/video-lab",
    icon: Video,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    id: "transition-lab",
    name: "Transition Lab",
    description: "Design and test dual-input transition effects with unified runtime",
    route: "/transition-lab",
    icon: Zap,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
  },
  {
    id: "body-lab",
    name: "Body Lab",
    description: "Design and test mask-based body effects with extensible feature providers",
    route: "/body-lab",
    icon: User,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #3b82f6)",
  },
  {
    id: "filter-lab",
    name: "Filter Lab",
    description: "Design and test color grading presets and looks with GPU rendering pipeline",
    route: "/filter-lab",
    icon: Palette,
    color: "#7c6fff",
    gradient: "linear-gradient(135deg, #7c6fff, #6366f1)",
  },
];

export function LabsPanel() {
  const handleNavigate = (route: string) => {
    window.location.href = route;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-(--studio-bg) p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Effect Labs</h1>
          <p className="text-sm text-(--studio-muted)">Four specialized editors built on the unified runtime architecture. Design, test, and publish production-quality effects.</p>
        </div>

        {/* Architecture Info */}
        <div
          className="rounded-lg border border-(--studio-border) bg-(--studio-panel) p-4"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))",
          }}
        >
          <h2 className="text-sm font-semibold text-white mb-2">Four Labs, One Runtime</h2>
          <p className="text-xs text-(--studio-muted) leading-relaxed">All labs share: graph compilation, render planning, GPU execution, performance monitoring, validation, and publishing pipeline. This architecture makes creating new effects "content work" rather than "architecture work".</p>
        </div>

        {/* Lab Cards */}
        <div className="grid gap-4">
          {LABS.map((lab) => {
            const Icon = lab.icon;
            return (
              <button
                key={lab.id}
                onClick={() => handleNavigate(lab.route)}
                className="group relative overflow-hidden rounded-lg border border-(--studio-border) bg-(--studio-panel) p-6 text-left transition-all hover:border-(--studio-accent) hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95))`,
                }}
              >
                {/* Hover gradient overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{
                    background: lab.gradient,
                  }}
                />

                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: lab.gradient,
                    }}
                  >
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{lab.name}</h3>
                      <ExternalLink size={14} className="text-(--studio-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-(--studio-muted) leading-relaxed">{lab.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="relative mt-4 flex flex-wrap gap-2">
                  {lab.id === "video-lab" && (
                    <>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Film Grain</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">VHS</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Bloom</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">+2 more</span>
                    </>
                  )}
                  {lab.id === "transition-lab" && (
                    <>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Cross Dissolve</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Push</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Zoom</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">+2 more</span>
                    </>
                  )}
                  {lab.id === "body-lab" && (
                    <>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Neon Outline</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Background Blur</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Spotlight</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">+2 more</span>
                    </>
                  )}
                  {lab.id === "filter-lab" && (
                    <>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Teal & Orange</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Cyberpunk</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">Luminance Histogram</span>
                      <span className="text-xs px-2 py-1 rounded bg-(--studio-control) text-(--studio-muted)">+2 more</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Documentation Link */}
        <div className="rounded-lg border border-(--studio-border) bg-(--studio-panel) p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Documentation</h3>
          <p className="text-xs text-(--studio-muted) mb-3">Learn more about the Studio Architecture and Implementation Roadmap.</p>
          <div className="flex gap-2">
            <a href="https://github.com/yourusername/clypra-studio/blob/main/docs/STUDIO_ARCHITECTURE.md" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded bg-(--studio-control) text-(--studio-accent) hover:bg-(--studio-hover) transition-colors">
              Architecture Guide
            </a>
            <a href="https://github.com/yourusername/clypra-studio/blob/main/docs/IMPLEMENTATION_ROADMAP.md" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded bg-(--studio-control) text-(--studio-accent) hover:bg-(--studio-hover) transition-colors">
              Roadmap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
