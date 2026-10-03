import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  ArrowRight,
  Sparkles,
  Shield,
  Terminal,
  Monitor,
  Layers,
  Play,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  Github,
  Twitter,
  Globe,
  Linkedin,
  Youtube,
  Mail,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sun,
  Moon,
  ArrowUp,
  Cpu,
  Zap,
  Sliders,
  Code2,
} from "lucide-react";
import { ClypraLogo } from "../ClypraLogo";

// ── GitHub Release Types ──────────────────────────────────────────────────────
interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GithubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: GithubAsset[];
}

export interface ArchitectureDownload {
  label: string;
  arch: string;
  ext: string;
  url: string;
  size?: string;
  filename: string;
  isAvailable: boolean;
}

export interface PlatformDownloads {
  mac: {
    arm64: ArchitectureDownload;
    intel: ArchitectureDownload;
  };
  win: {
    x64: ArchitectureDownload;
    arm64: ArchitectureDownload;
  };
  linux: {
    x64: ArchitectureDownload;
    arm64: ArchitectureDownload;
  };
}

type OS = "mac" | "win" | "linux";

function detectOS(): OS {
  if (typeof window === "undefined") return "mac";
  const p = window.navigator.platform?.toLowerCase() || "";
  const ua = window.navigator.userAgent?.toLowerCase() || "";
  if (p.includes("win") || ua.includes("windows")) return "win";
  if (p.includes("linux") || ua.includes("linux")) return "linux";
  return "mac";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function getPlatformDownloads(release: GithubRelease | null): PlatformDownloads {
  const assets = release?.assets ?? [];
  const base = "https://github.com/AIEraDev/Clypra/releases/latest/download";

  // macOS Apple Silicon (arm64 / aarch64)
  const macArmAsset = assets.find(
    (a) => (a.name.includes("aarch64") || a.name.includes("arm64")) && a.name.endsWith(".dmg"),
  ) ?? assets.find((a) => a.name.endsWith(".dmg") && !a.name.includes("x64") && !a.name.includes("x86_64"));

  // macOS Intel (x64 / x86_64)
  const macIntelAsset = assets.find(
    (a) => (a.name.includes("x64") || a.name.includes("x86_64") || a.name.includes("intel")) && a.name.endsWith(".dmg"),
  );

  // Windows x64 (.exe / .msi)
  const winX64Asset = assets.find(
    (a) => (a.name.includes("x64") || a.name.includes("x86_64") || a.name.includes("amd64")) &&
      (a.name.endsWith("-setup.exe") || a.name.endsWith(".exe")),
  ) ?? assets.find((a) => a.name.endsWith(".msi") && (a.name.includes("x64") || a.name.includes("amd64")))
    ?? assets.find((a) => (a.name.endsWith("-setup.exe") || a.name.endsWith(".exe")) && !a.name.includes("arm64"));

  // Windows ARM64 (.exe)
  const winArmAsset = assets.find(
    (a) => (a.name.includes("arm64") || a.name.includes("aarch64")) &&
      (a.name.endsWith("-setup.exe") || a.name.endsWith(".exe")),
  );

  // Linux x64 (.tar.gz, .AppImage)
  const linuxX64Tar = assets.find(
    (a) => (a.name.includes("amd64") || a.name.includes("x86_64") || a.name.includes("x64")) && a.name.endsWith(".tar.gz"),
  );
  const linuxX64AppImage = assets.find(
    (a) => (a.name.includes("amd64") || a.name.includes("x86_64") || a.name.includes("x64")) && a.name.endsWith(".AppImage"),
  );
  const linuxX64Asset = linuxX64Tar ?? linuxX64AppImage ?? assets.find((a) => a.name.endsWith(".AppImage"));

  // Linux ARM64 (.tar.gz, .AppImage)
  const linuxArmTar = assets.find(
    (a) => (a.name.includes("arm64") || a.name.includes("aarch64")) && a.name.endsWith(".tar.gz"),
  );
  const linuxArmAppImage = assets.find(
    (a) => (a.name.includes("arm64") || a.name.includes("aarch64")) && a.name.endsWith(".AppImage"),
  );
  const linuxArmAsset = linuxArmTar ?? linuxArmAppImage;

  return {
    mac: {
      arm64: {
        label: "macOS Apple Silicon (.dmg)",
        arch: "Apple Silicon (M1/M2/M3/M4)",
        ext: ".dmg",
        url: macArmAsset?.browser_download_url ?? `${base}/Clypra_aarch64.dmg`,
        size: macArmAsset ? formatBytes(macArmAsset.size) : undefined,
        filename: macArmAsset?.name ?? "Clypra_aarch64.dmg",
        isAvailable: Boolean(macArmAsset) || !release,
      },
      intel: {
        label: "macOS Intel (.dmg)",
        arch: "Intel (x86_64)",
        ext: ".dmg",
        url: macIntelAsset?.browser_download_url ?? `${base}/Clypra_x64.dmg`,
        size: macIntelAsset ? formatBytes(macIntelAsset.size) : undefined,
        filename: macIntelAsset?.name ?? "Clypra_x64.dmg",
        isAvailable: Boolean(macIntelAsset) || !release,
      },
    },
    win: {
      x64: {
        label: "Windows x64 (.exe)",
        arch: "Intel / AMD (x64)",
        ext: ".exe",
        url: winX64Asset?.browser_download_url ?? `${base}/Clypra_x64-setup.exe`,
        size: winX64Asset ? formatBytes(winX64Asset.size) : undefined,
        filename: winX64Asset?.name ?? "Clypra_x64-setup.exe",
        isAvailable: Boolean(winX64Asset) || !release,
      },
      arm64: {
        label: "Windows ARM64 (.exe)",
        arch: "Snapdragon / ARM64",
        ext: ".exe",
        url: winArmAsset?.browser_download_url ?? `${base}/Clypra_arm64-setup.exe`,
        size: winArmAsset ? formatBytes(winArmAsset.size) : undefined,
        filename: winArmAsset?.name ?? "Clypra_arm64-setup.exe",
        isAvailable: Boolean(winArmAsset) || !release,
      },
    },
    linux: {
      x64: {
        label: "Linux x64 (.tar.gz)",
        arch: "x86_64 (.tar.gz / .AppImage)",
        ext: ".tar.gz",
        url: linuxX64Asset?.browser_download_url ?? `${base}/Clypra_amd64.AppImage`,
        size: linuxX64Asset ? formatBytes(linuxX64Asset.size) : undefined,
        filename: linuxX64Asset?.name ?? "Clypra_amd64.AppImage",
        isAvailable: Boolean(linuxX64Asset) || !release,
      },
      arm64: {
        label: "Linux ARM64 (.tar.gz)",
        arch: "AArch64 (.tar.gz / .AppImage)",
        ext: ".tar.gz",
        url: linuxArmAsset?.browser_download_url ?? `${base}/Clypra_arm64.AppImage`,
        size: linuxArmAsset ? formatBytes(linuxArmAsset.size) : undefined,
        filename: linuxArmAsset?.name ?? "Clypra_arm64.AppImage",
        isAvailable: Boolean(linuxArmAsset) || !release,
      },
    },
  };
}

function pickAsset(assets: GithubAsset[], os: OS): GithubAsset | undefined {
  if (os === "mac") {
    return (
      assets.find((a) => (a.name.includes("aarch64") || a.name.includes("arm64")) && a.name.endsWith(".dmg")) ??
      assets.find((a) => a.name.endsWith(".dmg")) ??
      assets.find((a) => a.name.endsWith(".app.tar.gz"))
    );
  }
  if (os === "win") {
    return (
      assets.find((a) => a.name.includes("x64") && a.name.endsWith("-setup.exe")) ??
      assets.find((a) => a.name.endsWith("-setup.exe")) ??
      assets.find((a) => a.name.endsWith(".msi") && !a.name.includes("setup"))
    );
  }
  return (
    assets.find((a) => (a.name.includes("amd64") || a.name.includes("x86_64")) && a.name.endsWith(".AppImage")) ??
    assets.find((a) => a.name.endsWith(".AppImage")) ??
    assets.find((a) => a.name.endsWith(".deb")) ??
    assets.find((a) => a.name.endsWith(".rpm"))
  );
}

export const WebShowcase: React.FC = () => {
  // Theme state: dark / light
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clypra_theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("clypra_theme", next);
    }
  };

  const isDark = theme === "dark";

  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedLinux, setCopiedLinux] = useState(false);
  const [activeTab, setActiveTab] = useState<"mac" | "win" | "linux">("mac");

  // Detect user's OS
  const [userOS, setUserOS] = useState<OS>("mac");

  // GitHub release state
  const [release, setRelease] = useState<GithubRelease | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadSize, setDownloadSize] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [isReleaseTableOpen, setIsReleaseTableOpen] = useState(true);

  // Platform downloads lookup
  const platformDownloads = useMemo(() => getPlatformDownloads(release), [release]);

  // Fetch latest release from GitHub API
  useEffect(() => {
    const os = detectOS();
    setUserOS(os);
    setActiveTab(os);

    fetch("https://api.github.com/repos/AIEraDev/Clypra/releases/latest", {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => r.json())
      .then((data: GithubRelease) => {
        setRelease(data);
        const asset = pickAsset(data.assets, os);
        if (asset) {
          setDownloadUrl(asset.browser_download_url);
          setDownloadSize(formatBytes(asset.size));
        } else {
          const base = "https://github.com/AIEraDev/Clypra/releases/latest/download";
          setDownloadUrl(
            os === "mac"
              ? `${base}/Clypra_aarch64.dmg`
              : os === "win"
              ? `${base}/Clypra_x64-setup.exe`
              : `${base}/Clypra_amd64.AppImage`,
          );
        }
      })
      .catch(() => {
        const base = "https://github.com/AIEraDev/Clypra/releases/latest/download";
        const fallbacks: Record<OS, string> = {
          mac: `${base}/Clypra_aarch64.dmg`,
          win: `${base}/Clypra_x64-setup.exe`,
          linux: `${base}/Clypra_amd64.AppImage`,
        };
        setDownloadUrl(fallbacks[os]);
      })
      .finally(() => setReleaseLoading(false));
  }, []);

  const handleDownload = () => {
    if (!downloadUrl) return;
    setIsDownloading(true);
    setTimeout(() => {
      window.location.href = downloadUrl;
      setIsDownloading(false);
      setDownloadStarted(true);
      setTimeout(() => setDownloadStarted(false), 8000);
    }, 600);
  };

  const copyToClipboard = (text: string, type: "mac" | "linux") => {
    navigator.clipboard.writeText(text);
    if (type === "mac") {
      setCopiedMac(true);
      setTimeout(() => setCopiedMac(false), 2000);
    } else {
      setCopiedLinux(true);
      setTimeout(() => setCopiedLinux(false), 2000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`min-h-screen w-full font-sans transition-colors duration-500 relative selection:bg-amber-400 selection:text-black ${
        isDark ? "bg-[#0b0811] text-stone-100" : "bg-[#fbf9f6] text-stone-900"
      }`}
    >
      {/* ── Global CSS & Grain Overlay ──────────────────────────── */}
      <style>{`
        /* Grain / Paper Noise Texture Overlay */
        .texture-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.055'/%3E%3C/svg%3E");
        }

        /* Editorial Display Heading Typography */
        .font-editorial {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.035em;
        }

        /* Smooth card transforms */
        .tilted-card {
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tilted-card:hover {
          transform: translateY(-8px) rotate(0deg) scale(1.02) !important;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? "#120d1a" : "#f1ede6"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? "#382346" : "#c4b5a5"};
          border-radius: 4px;
        }
      `}</style>

      {/* ── Floating Pill Navbar (Reference 2 Inspired) ─────────── */}
      <div className="sticky top-4 z-50 max-w-6xl mx-auto px-4">
        <header
          className={`w-full rounded-full px-5 py-3 transition-all duration-300 flex items-center justify-between shadow-2xl backdrop-blur-xl ${
            isDark
              ? "bg-[#181023]/85 border border-purple-500/20 text-stone-100 shadow-purple-950/40"
              : "bg-white/90 border border-stone-200/80 text-stone-900 shadow-stone-300/50"
          }`}
        >
          {/* Logo & Brand */}
          <a href="#overview" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center relative">
              <ClypraLogo size={32} className="relative z-10 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-lg font-bold tracking-tight">
                Clypra
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${
                  isDark
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-purple-100 text-purple-800 border border-purple-200"
                }`}
              >
                Studio
              </span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium">
            <a
              href="#overview"
              className={`transition-colors hover:text-emerald-500 ${
                isDark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Overview
            </a>
            <a
              href="#architecture"
              className={`transition-colors hover:text-emerald-500 ${
                isDark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              What We Do
            </a>
            <a
              href="#download"
              className={`transition-colors hover:text-emerald-500 ${
                isDark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Downloads
            </a>
            <a
              href="#labs"
              className={`transition-colors hover:text-emerald-500 ${
                isDark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Creative Labs
            </a>
            <a
              href="#creator"
              className={`transition-colors hover:text-emerald-500 ${
                isDark ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Creator
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark / Light Theme"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDark
                  ? "bg-white/10 hover:bg-white/15 text-amber-300 border border-white/10"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/AIEraDev/clypra"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200"
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            {/* Primary Pill Launch Button */}
            <Link
              to="/studio"
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                isDark
                  ? "bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20"
                  : "bg-[#281030] hover:bg-black text-white shadow-stone-400/40"
              }`}
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: HERO (Rich Aubergine/Plum Textured Section)
          Directly matches media_1791061115692.png with tilted cards
          bursting downwards across the section horizon!
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="overview"
        className={`relative overflow-visible texture-grain pt-8 pb-32 md:pb-44 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#220d2a] text-white border-purple-900/30"
            : "bg-[#3d1945] text-white border-[#4d2356]"
        }`}
      >
        {/* Subtle Ambient Vignette / Spotlight */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-8 md:pt-14">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              {/* Amber Pill Badge (Reference 1 & 2 inspired) */}
              <div className="inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase">
                  {release ? `${release.tag_name} Stable Release` : "Native Video Engine v1.3.0"}
                </span>
              </div>

              {/* Bold Editorial Heading */}
              <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06] text-white">
                The native <br />
                <span className="text-amber-300">video editor.</span>
              </h1>

              {/* Editorial Copy */}
              <p className="text-base sm:text-lg text-purple-100/80 leading-relaxed max-w-xl font-normal">
                Build locally on a high-performance desktop NLE with a native Rust
                render surface, hardware-accelerated playback, and an integrated
                Web Studio for authoring shaders, transitions, and text effects.
              </p>

              {/* Hero Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Emerald Green Pill CTA (From Reference 2) */}
                <button
                  onClick={handleDownload}
                  disabled={releaseLoading || isDownloading || !downloadUrl}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-7 py-3.5 text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {downloadStarted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-stone-950" />
                      <span>Download Started!</span>
                    </>
                  ) : isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Starting Download…</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base font-bold">→</span>
                      <span>
                        Download Clypra for{" "}
                        {userOS === "mac" ? "macOS" : userOS === "win" ? "Windows" : "Linux"}
                      </span>
                    </>
                  )}
                </button>

                {/* Secondary Pill Button */}
                <Link
                  to="/studio"
                  className="rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3.5 text-sm flex items-center gap-2 backdrop-blur-sm transition-all hover:scale-[1.02]"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Web Studio</span>
                </Link>
              </div>

              {/* Architecture Quick Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-purple-200/70">
                <span className="text-purple-300 font-semibold uppercase tracking-wider text-[10px] mr-1">
                  Target Architectures:
                </span>
                <a
                  href="#download"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
                >
                  macOS (Apple Silicon & Intel)
                </a>
                <a
                  href="#download"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
                >
                  Windows (x64 & ARM64)
                </a>
                <a
                  href="#download"
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-colors"
                >
                  Linux (x64 & ARM64)
                </a>
              </div>
            </div>

            {/* Right Column: TILTED STACKED CARDS (Breaking Section Boundary!) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:translate-y-24 z-20">
                {/* Back Card (Tilted 4deg) */}
                <div className="tilted-card absolute inset-0 -top-6 -right-6 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-stone-900/90 rotate-4 pointer-events-none opacity-85">
                  <img
                    src="/clypra-1200x630.png"
                    alt="Clypra Timeline Preview"
                    className="w-full h-full object-cover object-center filter saturate-120"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-mono text-amber-300 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span>Multi-Track Timeline Core</span>
                  </div>
                </div>

                {/* Front Main Card (Tilted -2.5deg) */}
                <div className="tilted-card relative rounded-2xl overflow-hidden border border-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-[#12081a] -rotate-2">
                  {/* Window Bar */}
                  <div className="bg-[#1e0e29] px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] font-mono text-purple-200/80 font-medium">
                      clypra_preview_engine.rs
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      60 FPS Native
                    </span>
                  </div>

                  {/* Editor Screen Preview */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-black">
                    <img
                      src="/home-screen.png"
                      alt="Clypra Native Desktop Interface"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Floating HUD chips */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white">
                      <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Metal / D3D11 / VAAPI</span>
                      </div>
                      <div className="bg-emerald-500/90 text-stone-950 font-bold px-2.5 py-1 rounded-full">
                        Zero Latency
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: WHAT WE DO / ARCHITECTURE BREAKDOWN
          Directly matches media_1791061115670.png!
          Tilted photo cards on the left, amber badge & deep plum heading on the right.
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="architecture"
        className={`relative overflow-hidden texture-grain pt-28 pb-24 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#130f1b] text-stone-200 border-purple-900/20"
            : "bg-[#faf7f2] text-stone-900 border-stone-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Tilted Visual Cards (As seen in Reference 1) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Background tilted card */}
                <div
                  className={`tilted-card absolute inset-0 -top-5 -left-4 rounded-2xl p-5 border shadow-xl rotate-3 pointer-events-none ${
                    isDark
                      ? "bg-[#1c1627] border-purple-500/20 text-stone-300"
                      : "bg-white border-stone-200 text-stone-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      Zero-Copy Decoder Pool
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                    Frames stream straight from OS decoders to GPU textures without intermediate RAM copies, ensuring smooth 4K scrubbing.
                  </p>
                </div>

                {/* Foreground tilted card */}
                <div
                  className={`tilted-card relative rounded-2xl overflow-hidden border shadow-2xl -rotate-2 ${
                    isDark
                      ? "bg-[#191224] border-purple-500/30 shadow-black/60"
                      : "bg-white border-stone-300 shadow-stone-300/80"
                  }`}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden">
                    <img
                      src="/clypra-1200x630.png"
                      alt="Clypra Architecture & Timeline"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="bg-amber-400 text-stone-950 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase font-mono tracking-wider">
                        Native Pipeline
                      </span>
                      <span className="text-white text-xs font-mono">Rust + Tauri v2 + WebGPU</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between text-xs">
                    <span className="font-semibold">Deterministic Frame Accuracy</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Native
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Headings & Core Philosophy */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              {/* Amber Pill Badge (Directly from Reference 1) */}
              <div>
                <span className="bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 font-bold px-3 py-1 rounded-full text-[11px] tracking-widest uppercase inline-block">
                  WHAT WE DO
                </span>
              </div>

              {/* Large Editorial Heading */}
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] ${
                  isDark ? "text-white" : "text-[#2e1435]"
                }`}
              >
                Engineering creative software with native first principles.
              </h2>

              {/* Editorial Lead Paragraph */}
              <p
                className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? "text-stone-300" : "text-stone-700"
                }`}
              >
                Modern video editing shouldn't be throttled by fragile web containers
                or bogged down with heavy background telemetry. Clypra compiles directly
                to optimized native machine code on your device, giving you instant
                timeline previews, reliable audio sync, and predictable export renders.
              </p>

              {/* 3 Architecture Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isDark
                      ? "bg-[#181223] border-purple-500/20 hover:border-purple-500/40"
                      : "bg-white border-stone-200 hover:border-stone-300 shadow-sm"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 mb-2">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs mb-1">Local Processing</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Media files never leave your filesystem. Zero cloud bandwidth bottleneck.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isDark
                      ? "bg-[#181223] border-purple-500/20 hover:border-purple-500/40"
                      : "bg-white border-stone-200 hover:border-stone-300 shadow-sm"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs mb-1">GPU Accelerated</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Sub-10ms frame dispatch with hardware VideoToolbox, D3D11, and VAAPI.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isDark
                      ? "bg-[#181223] border-purple-500/20 hover:border-purple-500/40"
                      : "bg-white border-stone-200 hover:border-stone-300 shadow-sm"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 mb-2">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs mb-1">Open Contracts</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    Design effects in Studio against the exact same API the native NLE consumes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: NATIVE DOWNLOADS & 6-ARCHITECTURE MATRIX
          Cool limestone / mist section with primary cards & 6 target matrix
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="download"
        className={`relative overflow-hidden texture-grain py-24 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#0d0a13] text-stone-100 border-purple-900/20"
            : "bg-[#f2efe9] text-stone-900 border-stone-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="self-center bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-bold px-3 py-1 rounded-full text-[11px] tracking-widest uppercase">
              MULTI-PLATFORM RELEASES
            </span>
            <h2
              className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-[#281030]"
              }`}
            >
              Get Clypra Desktop
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Clypra compiles standalone native executables for 6 target architectures.
              Choose your operating system below for instantaneous hardware acceleration.
            </p>
          </div>

          {/* 3 Main OS Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* macOS Card */}
            <div
              className={`rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300 border shadow-lg hover:-translate-y-1 relative group ${
                isDark
                  ? "bg-[#151020] border-purple-500/25 shadow-purple-950/20 hover:border-purple-400/40"
                  : "bg-white border-stone-200 shadow-stone-300/40 hover:border-stone-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-editorial text-xl font-bold">macOS</h3>
                  <p className="text-[10px] text-purple-500 dark:text-purple-400 font-mono tracking-wider uppercase mt-0.5">
                    Apple Silicon & Intel (.dmg)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg font-bold">
                  
                </div>
              </div>

              <ul className="text-xs flex flex-col gap-2.5 grow text-stone-500 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Universal DMG for M1/M2/M3/M4 & Intel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Hardware VideoToolbox Metal decoders</span>
                </li>
              </ul>

              <div className="mt-auto pt-4 border-t border-stone-200 dark:border-white/10 flex flex-col gap-3">
                <a
                  href={platformDownloads.mac.arm64.url}
                  className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download macOS DMG</span>
                </a>

                {/* Homebrew Tap box */}
                <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/40 border border-stone-200 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="truncate text-stone-600 dark:text-stone-300">
                    brew install AIEraDev/tap/clypra
                  </span>
                  <button
                    onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")}
                    className="p-1 hover:text-purple-500 transition-colors ml-2 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedMac ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Windows Card */}
            <div
              className={`rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300 border shadow-lg hover:-translate-y-1 relative group ${
                isDark
                  ? "bg-[#151020] border-cyan-500/25 shadow-cyan-950/20 hover:border-cyan-400/40"
                  : "bg-white border-stone-200 shadow-stone-300/40 hover:border-stone-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-editorial text-xl font-bold">Windows</h3>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono tracking-wider uppercase mt-0.5">
                    x64 & ARM64 Installer (.exe)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 font-bold">
                  <Monitor className="w-5 h-5" />
                </div>
              </div>

              <ul className="text-xs flex flex-col gap-2.5 grow text-stone-500 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>Full Direct3D 11 Video Acceleration (D3D11VA)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>Native Snapdragon ARM64 & Intel/AMD support</span>
                </li>
              </ul>

              <div className="mt-auto pt-4 border-t border-stone-200 dark:border-white/10 flex flex-col gap-3">
                <a
                  href={platformDownloads.win.x64.url}
                  className="w-full h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Windows Installer</span>
                </a>

                <div className="text-[10px] font-mono text-center text-stone-500 dark:text-stone-400">
                  {platformDownloads.win.x64.size ? `Size: ${platformDownloads.win.x64.size} · ` : ""}
                  x64 & ARM64 builds available
                </div>
              </div>
            </div>

            {/* Linux Card */}
            <div
              className={`rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300 border shadow-lg hover:-translate-y-1 relative group ${
                isDark
                  ? "bg-[#151020] border-emerald-500/25 shadow-emerald-950/20 hover:border-emerald-400/40"
                  : "bg-white border-stone-200 shadow-stone-300/40 hover:border-stone-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-editorial text-xl font-bold">Linux</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider uppercase mt-0.5">
                    x64 & ARM64 (.tar.gz / .AppImage)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
              </div>

              <ul className="text-xs flex flex-col gap-2.5 grow text-stone-500 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Portable AppImage & tarball distributions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hardware VAAPI acceleration on Ubuntu/Debian/Arch</span>
                </li>
              </ul>

              <div className="mt-auto pt-4 border-t border-stone-200 dark:border-white/10 flex flex-col gap-3">
                <a
                  href={platformDownloads.linux.x64.url}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Linux Package</span>
                </a>

                {/* Chmod Copy command */}
                <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/40 border border-stone-200 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="truncate text-stone-600 dark:text-stone-300">
                    chmod +x Clypra*.AppImage
                  </span>
                  <button
                    onClick={() => copyToClipboard("chmod +x Clypra*.AppImage && ./Clypra*.AppImage", "linux")}
                    className="p-1 hover:text-emerald-500 transition-colors ml-2 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedLinux ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6-Architecture Release Matrix Table ──────────────── */}
          <div
            className={`rounded-2xl border overflow-hidden transition-all ${
              isDark ? "bg-[#140e1f] border-purple-500/20" : "bg-white border-stone-200 shadow-sm"
            }`}
          >
            {/* Header toggle */}
            <button
              onClick={() => setIsReleaseTableOpen((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-editorial text-sm font-bold">
                  All Supported Target Architectures (6 Builds)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                  {release ? release.tag_name : "Latest Releases"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span>{isReleaseTableOpen ? "Collapse Matrix" : "View Matrix"}</span>
                {isReleaseTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isReleaseTableOpen && (
              <div className="p-6 pt-0 border-t border-stone-200 dark:border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                  {/* macOS Target Matrix */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
                       macOS
                    </span>
                    <div className="flex flex-col gap-2">
                      <a
                        href={platformDownloads.mac.arm64.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Apple Silicon</span>
                          <span className="text-[10px] text-stone-400 font-mono">M1 / M2 / M3 / M4 (.dmg)</span>
                        </div>
                        <span className="text-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.mac.arm64.size ?? "Ready"}
                        </span>
                      </a>
                      <a
                        href={platformDownloads.mac.intel.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Intel Processors</span>
                          <span className="text-[10px] text-stone-400 font-mono">x86_64 Mac (.dmg)</span>
                        </div>
                        <span className="text-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.mac.intel.size ?? "Ready"}
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Windows Target Matrix */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" /> Windows
                    </span>
                    <div className="flex flex-col gap-2">
                      <a
                        href={platformDownloads.win.x64.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Windows x64</span>
                          <span className="text-[10px] text-stone-400 font-mono">Intel / AMD 64-bit (.exe)</span>
                        </div>
                        <span className="text-cyan-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.win.x64.size ?? "Ready"}
                        </span>
                      </a>
                      <a
                        href={platformDownloads.win.arm64.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Windows ARM64</span>
                          <span className="text-[10px] text-stone-400 font-mono">Snapdragon X / ARM (.exe)</span>
                        </div>
                        <span className="text-cyan-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.win.arm64.size ?? "Ready"}
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Linux Target Matrix */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" /> Linux
                    </span>
                    <div className="flex flex-col gap-2">
                      <a
                        href={platformDownloads.linux.x64.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Linux x64</span>
                          <span className="text-[10px] text-stone-400 font-mono">x86_64 (.tar.gz / AppImage)</span>
                        </div>
                        <span className="text-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.linux.x64.size ?? "Ready"}
                        </span>
                      </a>
                      <a
                        href={platformDownloads.linux.arm64.url}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">Linux ARM64</span>
                          <span className="text-[10px] text-stone-400 font-mono">AArch64 (.tar.gz / AppImage)</span>
                        </div>
                        <span className="text-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {platformDownloads.linux.arm64.size ?? "Ready"}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
                  <span>Continuous delivery pipeline powered by GitHub Actions & Tauri code signers.</span>
                  <a
                    href="https://github.com/AIEraDev/clypra/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View GitHub Release Notes & Checksums</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: DEDICATED CREATIVE EFFECT LABS
          Pale lavender / royal velvet section showcasing Studio Labs
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="labs"
        className={`relative overflow-hidden texture-grain py-24 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#180f24] text-stone-100 border-purple-900/30"
            : "bg-[#f8f5fa] text-stone-900 border-stone-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="self-center bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/40 font-bold px-3 py-1 rounded-full text-[11px] tracking-widest uppercase">
              STUDIO PLATFORM
            </span>
            <h2
              className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-[#281030]"
              }`}
            >
              Dedicated Creative Labs
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Design, calibrate, and validate visual assets in focused browser environments.
              Every effect compiles to the same capability contracts used on the desktop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lab 1: Video Effect Lab */}
            <div
              className={`rounded-2xl p-6 flex flex-col gap-4 border transition-all hover:scale-[1.01] ${
                isDark
                  ? "bg-[#1f1430] border-purple-500/25 hover:border-purple-400/40"
                  : "bg-white border-stone-200 shadow-sm hover:border-purple-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-bold">Video Effect Lab</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Live WebGPU frame shaders with real-time parameter uniforms, frame stepping, and GPU memory profiling.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  Film Grain
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  VHS Glitch
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  Bloom
                </span>
              </div>
            </div>

            {/* Lab 2: Transition Lab */}
            <div
              className={`rounded-2xl p-6 flex flex-col gap-4 border transition-all hover:scale-[1.01] ${
                isDark
                  ? "bg-[#1f1430] border-blue-500/25 hover:border-blue-400/40"
                  : "bg-white border-stone-200 shadow-sm hover:border-blue-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-bold">Transition Lab</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Dual-input temporal mixers with easing curves, frame blending, and instant timeline scrubbing previews.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  Cross Dissolve
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  Directional Push
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  Wipe
                </span>
              </div>
            </div>

            {/* Lab 3: Body Effect Lab */}
            <div
              className={`rounded-2xl p-6 flex flex-col gap-4 border transition-all hover:scale-[1.01] ${
                isDark
                  ? "bg-[#1f1430] border-emerald-500/25 hover:border-emerald-400/40"
                  : "bg-white border-stone-200 shadow-sm hover:border-emerald-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-editorial text-lg font-bold">Body Effect Lab</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Interactive segmentation and pose tracking with real-time neon silhouettes, mask overlays, and depth blur.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                  Neon Silhouette
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                  Portrait Bokeh
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                  Keyer
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              to="/studio"
              className={`rounded-full px-7 py-3 text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30"
                  : "bg-[#281030] hover:bg-black text-white shadow-stone-400/30"
              }`}
            >
              <span>Explore All Studio Labs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5: INSTALLATION & SECURITY ASSISTANT
          Warm sand linen / dark terminal section
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="install"
        className={`relative overflow-hidden texture-grain py-24 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#0b0811] text-stone-100 border-purple-900/20"
            : "bg-[#f4efe8] text-stone-900 border-stone-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-300 dark:border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-500">
                SECURITY & GATEKEEPER
              </span>
              <h2
                className={`font-editorial text-2xl sm:text-4xl font-extrabold tracking-tight mt-1 ${
                  isDark ? "text-white" : "text-[#281030]"
                }`}
              >
                Installation Assistant
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                How to authorize Clypra through system security dialogs
              </p>
            </div>

            {/* Platform tab buttons */}
            <div className="flex rounded-xl p-1 bg-stone-200 dark:bg-white/5 border border-stone-300 dark:border-white/10 self-start md:self-auto">
              <button
                onClick={() => setActiveTab("mac")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "mac"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                macOS Gatekeeper
              </button>
              <button
                onClick={() => setActiveTab("win")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "win"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                Windows SmartScreen
              </button>
              <button
                onClick={() => setActiveTab("linux")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "linux"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                Linux Executable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Guide steps */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div
                className={`p-5 rounded-xl border transition-all ${
                  isDark ? "bg-[#140e1f] border-purple-500/20" : "bg-white border-stone-200 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase font-mono text-amber-500">
                  <span>Step 1: Download & Mount</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Open the downloaded artifact (.dmg, .exe, or .AppImage) directly from your downloads folder.
                </p>
              </div>

              <div
                className={`p-5 rounded-xl border transition-all ${
                  isDark ? "bg-[#140e1f] border-purple-500/20" : "bg-white border-stone-200 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase font-mono text-purple-500">
                  <span>Step 2: Security Verification</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {activeTab === "mac" &&
                    "Right-click (Control-click) Clypra.app in Applications and select 'Open' to authorize execution."}
                  {activeTab === "win" &&
                    "Click 'More Info' on Windows SmartScreen dialog, then choose 'Run Anyway'."}
                  {activeTab === "linux" &&
                    "Grant executable permissions via chmod or file properties before launching."}
                </p>
              </div>
            </div>

            {/* Terminal snippet box */}
            <div className="lg:col-span-7">
              <div className="rounded-xl overflow-hidden border border-stone-300 dark:border-white/10 shadow-xl bg-[#09070d] text-white">
                <div className="bg-[#150f1f] px-4 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    terminal · {activeTab}
                  </span>
                  <div className="w-10" />
                </div>

                <div className="p-5 font-mono text-xs text-left min-h-[160px] flex flex-col justify-between">
                  {activeTab === "mac" && (
                    <div className="flex flex-col gap-3">
                      <div className="text-stone-400"># Install globally via Homebrew</div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <code className="text-purple-300 select-all">
                          brew install AIEraDev/tap/clypra
                        </code>
                        <button
                          onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")}
                          className="hover:text-purple-300 cursor-pointer"
                        >
                          {copiedMac ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[11px] text-stone-400 leading-relaxed">
                        Bypasses Gatekeeper restrictions cleanly and configures PATH binaries.
                      </div>
                    </div>
                  )}

                  {activeTab === "win" && (
                    <div className="flex flex-col gap-3">
                      <div className="text-stone-400">&gt; Windows SmartScreen Bypass</div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-cyan-300 text-[11px] leading-relaxed">
                        1. Double-click Clypra installer (.exe)<br />
                        2. Click &quot;More info&quot; in the SmartScreen prompt<br />
                        3. Click &quot;Run anyway&quot;
                      </div>
                      <div className="text-[11px] text-stone-400 leading-relaxed">
                        Installs GPU decoding filters and registers desktop shortcuts.
                      </div>
                    </div>
                  )}

                  {activeTab === "linux" && (
                    <div className="flex flex-col gap-3">
                      <div className="text-stone-400"># Set executable bit and launch</div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <code className="text-emerald-300 select-all">
                          chmod +x Clypra*.AppImage &amp;&amp; ./Clypra*.AppImage
                        </code>
                        <button
                          onClick={() => copyToClipboard("chmod +x Clypra*.AppImage && ./Clypra*.AppImage", "linux")}
                          className="hover:text-emerald-300 cursor-pointer"
                        >
                          {copiedLinux ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[11px] text-stone-400 leading-relaxed">
                        Or right-click AppImage → Properties → Permissions → Allow executing file.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6: RECENT ACHIEVEMENTS & ENGINEERING MILESTONES
          Chalk white / deep night purple section with status tags
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="milestones"
        className={`relative overflow-hidden texture-grain py-24 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#110c18] text-stone-100 border-purple-900/20"
            : "bg-white text-stone-900 border-stone-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="self-center bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 font-bold px-3 py-1 rounded-full text-[11px] tracking-widest uppercase">
              ENGINEERING LOG
            </span>
            <h2
              className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-[#281030]"
              }`}
            >
              Recent Milestones
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Continuous performance improvements shipped across the Clypra ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Milestone 1 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  DEPLOYED
                </span>
                <span className="text-[10px] font-mono text-stone-400">CI/CD</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">Automated Multi-Arch Releases</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                6 automated build matrices compiling macOS (ARM/Intel), Windows (x64/ARM64), and Linux with code signing.
              </p>
            </div>

            {/* Milestone 2 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
                  OPTIMIZED
                </span>
                <span className="text-[10px] font-mono text-stone-400">RENDER PIPELINE</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">Export Dimension Precision</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Aspect-locked dimensions, deterministic frame stepper, and pixel-exact WebGL surface rasterization.
              </p>
            </div>

            {/* Milestone 3 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  PUBLISHED
                </span>
                <span className="text-[10px] font-mono text-stone-400">NPM REGISTRY</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">@clypra-studio/engine v1.8.0</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Modular packages with workspace dependencies published to registry for external custom effect authors.
              </p>
            </div>

            {/* Milestone 4 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                  INTEGRATED
                </span>
                <span className="text-[10px] font-mono text-stone-400">HARDWARE GPU</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">Zero-Copy Decoder Prewarming</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Pre-allocated frame pools with VideoToolbox &amp; D3D11VA yielding sub-10ms scrubbing response latency.
              </p>
            </div>

            {/* Milestone 5 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  ENHANCED
                </span>
                <span className="text-[10px] font-mono text-stone-400">DEV INFRA</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">Node 22 &amp; Vitest CI Automation</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Full test coverage for frontend components, Rust contracts, and WebGPU shaders across all PR branches.
              </p>
            </div>

            {/* Milestone 6 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? "bg-[#161021] border-purple-500/20" : "bg-stone-50 border-stone-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-600 dark:text-pink-300">
                  IN PROGRESS
                </span>
                <span className="text-[10px] font-mono text-stone-400">MOBILE ENGINE</span>
              </div>
              <h3 className="font-bold text-sm mb-1.5">Tauri v2 Mobile Core</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Porting Clypra GPU pipeline to iOS and Android with gesture-based touch editing and cross-device project handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7: MEET THE CREATOR & SOCIALS
          High-touch editorial profile showcase
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="creator"
        className={`relative overflow-hidden texture-grain py-24 transition-colors duration-500 ${
          isDark
            ? "bg-[#150f20] text-stone-100"
            : "bg-[#f6f2ec] text-stone-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="self-center bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/40 font-bold px-3 py-1 rounded-full text-[11px] tracking-widest uppercase">
              ARCHITECT & FOUNDER
            </span>
            <h2
              className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-[#281030]"
              }`}
            >
              Meet the Creator
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Behind Clypra&apos;s native engine design and creator-first ergonomics.
            </p>
          </div>

          <div
            className={`rounded-3xl p-8 md:p-12 border transition-all ${
              isDark
                ? "bg-[#1b1429] border-purple-500/25 shadow-2xl"
                : "bg-white border-stone-200 shadow-xl"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Creator Photo with tilted aesthetic */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-white/20 shadow-2xl -rotate-2 group">
                  <img
                    src="/founder.jpg"
                    alt="Abdul Kabir Musa - Clypra Creator"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Creator Bio & Social Links */}
              <div className="lg:col-span-8 flex flex-col gap-5 text-left">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-500">
                    Lead Architect
                  </span>
                  <h3 className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                    Abdul Kabir Musa
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Clypra began as an ambitious endeavor to build a premium, desktop-class
                  NLE video editor combining the native performance of Rust with the agility
                  of React and modern WebGPU. Driven by a passion for responsive creative software,
                  I engineered Clypra to break free from cloud latency and deliver immediate,
                  tactile editing feedback.
                </p>

                {/* Social Links Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <a
                    href="https://github.com/AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      <span className="font-semibold">GitHub</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>

                  <a
                    href="https://x.com/AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-sky-400" />
                      <span className="font-semibold">Twitter</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>

                  <a
                    href="https://abdulkabirmusa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">Website</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>

                  <a
                    href="https://www.youtube.com/@AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold">YouTube</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>

                  <a
                    href="https://www.linkedin.com/in/abdulkabirmusa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">LinkedIn</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>

                  <a
                    href="mailto:musaabdulkabeer19@gmail.com"
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 text-stone-200"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold">Email</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Action Button (Reference 1 Inspired) ────────── */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#FF5733] hover:bg-[#E04B2A] text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-orange-950/40"
        title="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* ── Editorial Footer ────────────────────────────────────── */}
      <footer
        className={`w-full py-10 border-t texture-grain transition-colors duration-500 ${
          isDark
            ? "bg-[#0b0811] text-stone-400 border-purple-900/20"
            : "bg-[#ece8e2] text-stone-600 border-stone-300"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <ClypraLogo size={20} />
            <span>
              &copy; {new Date().getFullYear()} Clypra Contributors. Released under the MIT License.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span>Built with Rust, Tauri, WebGPU &amp; React</span>
            <a
              href="https://github.com/AIEraDev/clypra"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 transition-colors font-semibold"
            >
              GitHub Code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
