import {
  Activity,
  ArrowRight,
  Beaker,
  FileCode,
  Layers,
  Music2,
  Palette,
  Shield,
  Sticker,
  Type,
  Video,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ClypraLogo } from "./ClypraLogo";

type StudioDestination = {
  href: string;
  label: string;
  description: string;
  icon: typeof Type;
  accent: string;
  status?: string;
};

const destinations: StudioDestination[] = [
  {
    href: "/studio/text-effects",
    label: "Text Effects Lab",
    description:
      "Design native text styles, animation layers, and editor-ready effects.",
    icon: Type,
    accent: "#7c6fff",
    status: "Native ready",
  },
  {
    href: "/studio/video-lab",
    label: "Video Effects Lab",
    description:
      "Build and publish single-input video effects on the native runtime.",
    icon: Video,
    accent: "#38bdf8",
  },
  {
    href: "/studio/transition-lab",
    label: "Transition Lab",
    description:
      "Author dual-input transitions with native preview and export contracts.",
    icon: WandSparkles,
    accent: "#fb7185",
  },
  {
    href: "/studio/filter-lab",
    label: "Filter Lab",
    description:
      "Create reusable looks and color treatments for Clypra projects.",
    icon: Palette,
    accent: "#34d399",
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
    description:
      "Compose native overlays, layers, and reusable visual components.",
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
    href: "/studio/color-grading",
    label: "Color Grading Lab",
    description: "Design native color adjustments and reusable grading looks.",
    icon: Palette,
    accent: "#2dd4bf",
  },
  {
    href: "/studio/effects",
    label: "Effect Graph Sandbox",
    description: "Inspect and validate effect graph execution on the native runtime.",
    icon: Beaker,
    accent: "#a78bfa",
  },
  {
    href: "/lottie",
    label: "Text Templates",
    description: "Design reusable animated templates for the editor template library.",
    icon: FileCode,
    accent: "#818cf8",
  },
  {
    href: "/studio/admin",
    label: "Admin Console",
    description: "Review submissions and manage Studio infrastructure as an administrator.",
    icon: Shield,
    accent: "#60a5fa",
  },
];

function DestinationCard({ destination }: { destination: StudioDestination }) {
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
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
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
  return (
    <div
      className="min-h-screen overflow-y-auto"
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

        <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
          Native pipeline online
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

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--studio-muted)">
              Studio destinations
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Choose a workspace
            </h2>
          </div>
          <span className="hidden text-[11px] text-(--studio-muted) sm:block">
            One navigation hub · shared native pipeline
          </span>
        </div>

        <section
          className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Studio destinations"
        >
          {destinations.map((destination) => (
            <DestinationCard key={destination.href} destination={destination} />
          ))}
        </section>
      </main>
    </div>
  );
}
