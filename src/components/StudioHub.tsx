import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowLeftRight,
  Beaker,
  Eye,
  FileCode,
  Film,
  Layers,
  Music2,
  Palette,
  Search,
  Shield,
  Sparkles,
  Sticker,
  Type,
  Video,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ClypraLogo } from "./ClypraLogo";
import { useIsAdmin } from "../hooks/useIsAdmin";

export type StudioDestination = {
  href: string;
  label: string;
  description: string;
  icon: typeof Type;
  accent: string;
  status?: string;
  adminOnly?: boolean;
};

export const standardDestinations: StudioDestination[] = [
  {
    href: "/studio/text-effects",
    label: "Text Effects Lab",
    description: "Design native text styles, animation layers, and editor-ready effects.",
    icon: Type,
    accent: "#7c6fff",
    status: "Native ready",
  },
  {
    href: "/studio/animation-lab",
    label: "Animation Lab",
    description: "Author, fine-tune, preview, and publish CapCut-parity text animations.",
    icon: Sparkles,
    accent: "#00E5FF",
    status: "CapCut Parity",
  },
  {
    href: "/studio/video-lab",
    label: "Video Effects Lab",
    description: "Build and publish single-input video effects on the native runtime.",
    icon: Video,
    accent: "#38bdf8",
  },
  {
    href: "/studio/transition-lab",
    label: "Transition Lab",
    description: "Author dual-input transitions with native preview and export contracts.",
    icon: ArrowLeftRight,
    accent: "#fb7185",
  },
  {
    href: "/studio/filter-lab",
    label: "Filter Lab",
    description: "Create reusable looks and color treatments for Clypra projects.",
    icon: Palette,
    accent: "#34d399",
  },
  {
    href: "/studio/color-grading",
    label: "Color Grading Lab",
    description: "Design native color adjustments and reusable grading looks.",
    icon: Palette,
    accent: "#2dd4bf",
  },
  {
    href: "/studio/audio",
    label: "Audio Library",
    description: "Manage sounds and publish audio assets used by the editor.",
    icon: Music2,
    accent: "#fbbf24",
  },
  {
    href: "/studio/overlays",
    label: "Overlay Workspace",
    description: "Compose native overlays, layers, and reusable visual components.",
    icon: Layers,
    accent: "#c084fc",
  },
  {
    href: "/studio/stickers",
    label: "Sticker Lab",
    description: "Prepare animated sticker assets with native validation and publishing.",
    icon: Sticker,
    accent: "#f472b6",
  },
  {
    href: "/studio/body-lab",
    label: "Body Lab",
    description: "Author mask-based body effects against the native feature contract.",
    icon: Activity,
    accent: "#fb7185",
  },
  {
    href: "/studio/effects",
    label: "Effect Graph Sandbox",
    description: "Inspect and validate effect graph execution on the native runtime.",
    icon: Beaker,
    accent: "#a78bfa",
  },
  {
    href: "/studio/text-template",
    label: "Text Templates",
    description: "Design reusable animated templates for the editor template library.",
    icon: FileCode,
    accent: "#818cf8",
  },
];

export const adminDestinations: StudioDestination[] = [
  {
    href: "/studio/motion-graphics",
    label: "Motion Graphics Studio",
    description: "Author multi-track motion graphics: intro-hold-outro phases, procedural VFX, and alpha compositing.",
    icon: Film,
    accent: "#f43f5e",
    status: "Admin Lab",
    adminOnly: true,
  },
  {
    href: "/studio/performance",
    label: "Performance Intelligence",
    description: "Analyze cross-OS latency matrices, GPU bottlenecks, and isolated edge cases in production.",
    icon: Activity,
    accent: "#38bdf8",
    status: "Live telemetry",
    adminOnly: true,
  },
  {
    href: "/studio/admin/performance/preview",
    label: "Program Preview Performance",
    description: "Compare live WebView readback and native preview-surface performance from real API telemetry.",
    icon: Eye,
    accent: "#34d399",
    status: "Live API comparison",
    adminOnly: true,
  },
  {
    href: "/studio/admin/performance/audio",
    label: "Audio Performance",
    description: "Analyze CPAL and Web Audio callback costs, buffer health, underruns, and clock drift.",
    icon: Music2,
    accent: "#fbbf24",
    status: "Live API comparison",
    adminOnly: true,
  },
  {
    href: "/studio/admin/performance/text",
    label: "Text Performance",
    description: "Compare normal text, Studio effects, and templates across their real rendering stages.",
    icon: Type,
    accent: "#a78bfa",
    status: "Live API comparison",
    adminOnly: true,
  },
  {
    href: "/studio/admin",
    label: "Admin Console",
    description: "Review submissions and manage Studio infrastructure as an administrator.",
    icon: Shield,
    accent: "#60a5fa",
    status: "Admin",
    adminOnly: true,
  },
];

export function DestinationCard({ destination }: { destination: StudioDestination }) {
  const Icon = destination.icon;
  return (
    <Link
      to={destination.href}
      className="group flex min-h-41 flex-col justify-between rounded-2xl border border-(--studio-border) bg-(--studio-panel) p-5 text-left transition-all hover:-translate-y-0.5 hover:border-(--studio-accent) hover:bg-(--studio-control)"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            color: destination.accent,
            borderColor: `${destination.accent}55`,
            background: `${destination.accent}14`,
          }}
        >
          <Icon size={19} />
        </span>
        {destination.status && (
          <span
            className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
              destination.adminOnly
                ? "border-sky-400/25 bg-sky-400/10 text-sky-300"
                : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            }`}
          >
            {destination.status}
          </span>
        )}
      </div>
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-white">
            {destination.label}
          </h2>
          <ArrowRight
            size={14}
            className="-translate-x-1 text-(--studio-muted) opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          />
        </div>
        <p className="max-w-sm text-[11px] leading-5 text-(--studio-muted)">
          {destination.description}
        </p>
      </div>
    </Link>
  );
}

export function StudioHub() {
  const isAdmin = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");

  const destinations: StudioDestination[] = useMemo(() => {
    return isAdmin
      ? [...standardDestinations, ...adminDestinations]
      : standardDestinations;
  }, [isAdmin]);

  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.status && d.status.toLowerCase().includes(q)),
    );
  }, [destinations, searchQuery]);

  return (
    <div
      className="h-[100dvh] min-h-screen overflow-y-auto overscroll-contain"
      style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}
    >
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link
          to="/"
          className="flex items-center gap-3"
          aria-label="Back to Clypra home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-(--studio-border) bg-(--studio-panel)">
            <ClypraLogo size={27} />
          </span>
          <span>
            <span className="block text-[17px] font-bold tracking-tight text-white">
              Clypra Studio
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-(--studio-muted)">
              Native creative workspace
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <div
              data-testid="admin-badge"
              className="flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-300"
            >
              <Shield size={12} />
              Admin Session
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
            Native pipeline online
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-10">
        <section className="relative overflow-hidden rounded-3xl border border-(--studio-border) bg-(--studio-panel) px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-(--studio-accent)/35 bg-(--studio-active-soft) px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-(--studio-accent)">
              <Beaker size={13} />
              Labs and authoring tools
            </div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              Build the capabilities your native editor consumes.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-(--studio-muted) sm:text-base">
              Every lab is a development surface for Clypra. Design, preview,
              validate, and publish assets against the same native contracts
              used by the editor.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--studio-muted)">
              Studio destinations
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Choose a workspace
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--studio-muted)"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter workspaces…"
                className="h-8 w-48 rounded-xl border border-(--studio-border) bg-(--studio-panel) pl-8 pr-7 text-xs text-white placeholder:text-(--studio-muted) transition-colors focus:border-(--studio-accent) focus:outline-none sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-(--studio-muted) hover:text-white"
                  aria-label="Clear filter"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="hidden text-[11px] text-(--studio-muted) sm:block">
              {filteredDestinations.length} available · shared native pipeline
            </span>
          </div>
        </div>

        <div className="mt-8" aria-label="Studio destinations">
          {filteredDestinations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--studio-border) bg-(--studio-panel)/50 py-12 text-center">
              <p className="text-sm font-semibold text-white">No workspaces found</p>
              <p className="mt-1 text-xs text-(--studio-muted)">
                No workspace matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs font-semibold text-(--studio-accent) hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredDestinations.map((destination) => (
                <DestinationCard
                  key={destination.href}
                  destination={destination}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
