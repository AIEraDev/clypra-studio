import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  ArrowRight,
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light-theme");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light-theme");
      }
    }
  }, [theme]);

  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedWin, setCopiedWin] = useState(false);
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const copyToClipboard = (text: string, type: "mac" | "win" | "linux") => {
    navigator.clipboard.writeText(text);
    if (type === "mac") {
      setCopiedMac(true);
      setTimeout(() => setCopiedMac(false), 2000);
    } else if (type === "win") {
      setCopiedWin(true);
      setTimeout(() => setCopiedWin(false), 2000);
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
      className={`min-h-screen w-full overflow-x-clip font-sans transition-colors duration-500 relative selection:bg-amber-400 selection:text-black ${
        isDark ? "bg-[#0b0811] text-stone-100" : "bg-[#fbf9f6] text-stone-900"
      }`}
    >
      {/* ── Global CSS & Grain Overlay ──────────────────────────── */}
      <style>{`
        /* Prevent horizontal overflow on mobile viewports */
        html, body {
          overflow-x: hidden;
          overflow-x: clip;
          max-width: 100vw;
        }

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

        /* Smooth anchor link scrolling offset for sticky navbar */
        html {
          scroll-padding-top: 5.5rem;
        }

        /* Continuous animation for sticky version pill */
        @keyframes stickyVersionPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0), 0 0 8px rgba(245, 158, 11, 0.15);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25), 0 0 16px rgba(245, 158, 11, 0.4);
            transform: scale(1.03);
          }
        }
        .animate-sticky-version {
          animation: stickyVersionPulse 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* ── Fixed Sticky Top Navbar ─────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 pt-3 pb-2 pointer-events-none">
        <div className="max-w-6xl mx-auto px-6">
          <header
            className={`w-full rounded-full px-5 py-2.5 transition-all duration-300 flex items-center justify-between backdrop-blur-xl pointer-events-auto ${
              isDark
                ? "bg-[#181023]/90 border border-purple-500/20 text-stone-100 shadow-purple-950/40"
                : "bg-white/95 border border-stone-200/80 text-stone-900 shadow-stone-300/50"
            } ${isScrolled ? "shadow-2xl border-opacity-40" : "shadow-lg"}`}
          >
            {/* Brand Title Only */}
            <a href="#overview" className="flex items-center group py-0.5">
              <span
                className={`font-editorial text-xl font-bold tracking-tight transition-colors ${
                  isDark
                    ? "text-white group-hover:text-amber-300"
                    : "text-[#281030] group-hover:text-purple-700"
                }`}
              >
                Clypra
              </span>
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
              className={`rounded-full px-3.5 sm:px-5 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                isDark
                  ? "bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20"
                  : "bg-[#281030] hover:bg-black text-white shadow-stone-400/40"
              }`}
            >
              <span className="hidden sm:inline">Launch </span>
              <span>Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: HERO (Textured Editorial Section)
          Tilted cards bursting downwards across the section horizon!
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="overview"
        className={`relative overflow-x-clip texture-grain pt-24 md:pt-32 pb-32 md:pb-44 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#220d2a] text-white border-purple-900/30"
            : "bg-[#fbf9f6] text-stone-900 border-stone-200/80"
        }`}
      >
        {/* Subtle Ambient Vignette / Spotlight */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            isDark
              ? "bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.05),transparent_40%)]"
          }`}
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-8 md:pt-14">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              {/* Bold Editorial Heading */}
              <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06]">
                <span className={isDark ? "text-white" : "text-[#240e2b]"}>The native</span> <br />
                <span className={isDark ? "text-amber-300" : "text-purple-700"}>video editor.</span>
              </h1>

              {/* Editorial Copy */}
              <p
                className={`text-base sm:text-lg leading-relaxed max-w-xl font-normal ${
                  isDark ? "text-purple-100/80" : "text-stone-600"
                }`}
              >
                Build locally on a high-performance desktop NLE with a native Rust
                render surface, hardware-accelerated playback, and an integrated
                Web Studio for authoring shaders, transitions, and text effects.
              </p>

              {/* Hero Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Emerald Green Pill CTA */}
                <button
                  onClick={handleDownload}
                  disabled={releaseLoading || isDownloading || !downloadUrl}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3.5 text-sm flex items-center gap-2.5 shadow-xl shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {downloadStarted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Download Started!</span>
                    </>
                  ) : isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
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
                  className={`rounded-full px-6 py-3.5 text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] ${
                    isDark
                      ? "border border-white/20 bg-white/10 hover:bg-white/15 text-white backdrop-blur-sm"
                      : "border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 shadow-sm"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isDark ? "fill-white text-white" : "fill-stone-800 text-stone-800"}`} />
                  <span>Launch Web Studio</span>
                </Link>
              </div>

              {/* Architecture Quick Pills */}
              <div
                className={`flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono ${
                  isDark ? "text-purple-200/70" : "text-stone-500"
                }`}
              >
                <span
                  className={`font-semibold uppercase tracking-wider text-[10px] mr-1 ${
                    isDark ? "text-purple-300" : "text-purple-900"
                  }`}
                >
                  Target Architectures:
                </span>
                <a
                  href="#download"
                  className={`px-2.5 py-1 rounded-full border transition-colors ${
                    isDark
                      ? "bg-white/5 hover:bg-white/15 border-white/10 text-white"
                      : "bg-white hover:bg-stone-100 border-stone-200 text-stone-800 shadow-xs"
                  }`}
                >
                  macOS (Apple Silicon & Intel)
                </a>
                <a
                  href="#download"
                  className={`px-2.5 py-1 rounded-full border transition-colors ${
                    isDark
                      ? "bg-white/5 hover:bg-white/15 border-white/10 text-white"
                      : "bg-white hover:bg-stone-100 border-stone-200 text-stone-800 shadow-xs"
                  }`}
                >
                  Windows (x64 & ARM64)
                </a>
                <a
                  href="#download"
                  className={`px-2.5 py-1 rounded-full border transition-colors ${
                    isDark
                      ? "bg-white/5 hover:bg-white/15 border-white/10 text-white"
                      : "bg-white hover:bg-stone-100 border-stone-200 text-stone-800 shadow-xs"
                  }`}
                >
                  Linux (x64 & ARM64)
                </a>
              </div>
            </div>

            {/* Right Column: TILTED STACKED CARDS (Breaking Section Boundary!) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end px-3 sm:px-0">
              <div className="relative w-full max-w-[340px] sm:max-w-md lg:translate-y-24 z-20">
                {/* Back Card (Tilted) */}
                <div
                  className={`tilted-card absolute inset-0 -top-3 sm:-top-6 -right-2 sm:-right-6 rounded-2xl overflow-hidden border shadow-2xl rotate-2 sm:rotate-4 pointer-events-none ${
                    isDark
                      ? "border-white/20 bg-stone-900/90 opacity-85"
                      : "border-stone-200 bg-stone-100 opacity-90"
                  }`}
                >
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

                {/* Front Main Card with Corner Overflowing Version */}
                <div className="tilted-card relative -rotate-1 sm:-rotate-2">
                  {/* Corner Overflowing Version Badge */}
                  <div className="absolute -top-3 sm:-top-3.5 -right-1.5 sm:-right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-mono font-extrabold text-xs shadow-2xl border border-amber-300/90 rotate-3 sm:rotate-6 select-none pointer-events-none tracking-tight">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-900 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-950"></span>
                    </span>
                    <span>{release?.tag_name ?? "v1.5.8"}</span>
                  </div>

                  <div
                    className={`rounded-2xl overflow-hidden border ${
                      isDark
                        ? "border-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-[#12081a]"
                        : "border-stone-300/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] bg-white"
                    }`}
                  >
                    {/* Window Bar */}
                    <div
                      className={`px-4 py-2.5 flex items-center justify-between border-b ${
                        isDark ? "bg-[#1e0e29] border-white/10" : "bg-stone-100 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-medium ${
                          isDark ? "text-purple-200/80" : "text-stone-600"
                        }`}
                      >
                        clypra_preview_engine.rs
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                          isDark
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}
                      >
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
                          <span>VideoToolbox / D3D11VA / VAAPI</span>
                        </div>
                        <div className="bg-emerald-500/90 text-stone-950 font-bold px-2.5 py-1 rounded-full">
                          Sub-10ms Decode
                        </div>
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
          SECTION 2: WHAT WE DO & CORE ARCHITECTURE
          Upgraded to match Sections 3, 4, 5, 6, 7 editorial design standards!
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="architecture"
        className={`relative overflow-x-clip texture-grain py-28 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#130f1b] text-stone-200 border-purple-900/20"
            : "bg-[#faf7f2] text-stone-900 border-stone-300/70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-14">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}>
                WHAT WE DO &amp; CORE ARCHITECTURE
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Engineering creative software with native first principles.
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Modern video editing shouldn&apos;t be throttled by fragile web containers or bogged down with heavy telemetry. Clypra compiles directly to optimized native machine code on your device.
            </p>
          </div>

          {/* Featured Architecture Showcase (Tilted Hardware Preview + Systems Console) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Tilted Hardware Pipeline Preview */}
            <div className="lg:col-span-5 relative flex justify-center px-3 sm:px-0">
              <div className="relative w-full max-w-[340px] sm:max-w-md">
                {/* Background tilted card */}
                <div
                  className={`tilted-card absolute inset-0 -top-3 sm:-top-5 -left-2 sm:-left-4 rounded-2xl p-5 border shadow-xl rotate-1.5 sm:rotate-3 pointer-events-none ${
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
                  className={`tilted-card relative rounded-2xl overflow-hidden border shadow-2xl -rotate-1 sm:-rotate-2 ${
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
                    <span className={`font-semibold ${isDark ? "text-white" : "text-stone-900"}`}>
                      Deterministic Frame Accuracy
                    </span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Native
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Native Systems Specification Console */}
            <div className="lg:col-span-7">
              <div
                className={`p-6 sm:p-8 rounded-3xl border text-left flex flex-col justify-between transition-all ${
                  isDark
                    ? "bg-[#181024] border-white/10 shadow-xl shadow-black/40"
                    : "bg-white border-stone-200/90 shadow-lg shadow-stone-300/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10 mb-4">
                    <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-amber-400" : "text-purple-900"
                    }`}>
                      Direct GPU Surface Architecture
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      Zero Web Containers
                    </span>
                  </div>

                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Pure Rust core with hardware-anchored frame dispatch
                  </h3>
                  <p className={`text-xs leading-relaxed mb-5 ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Rather than hosting the timeline in an electron webview, Clypra&apos;s core rendering engine runs natively on CPU and GPU surfaces. Frames pass directly from hardware decoders into GPU textures without intermediate RAM buffering or CPU stalls.
                  </p>

                  {/* Technical Specification Matrix */}
                  <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                    isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 dark:text-stone-500">Timeline Evaluator</span>
                      <span className="font-semibold">Zero-IPC Rust Thread Pool</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 dark:text-stone-500">Scrubbing Latency</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">&lt; 10ms Deterministic</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 dark:text-stone-500">Audio Sync Clock</span>
                      <span className="font-semibold">CPAL Hardware Sample Anchoring</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 dark:text-stone-500">Memory Baseline</span>
                      <span className="font-semibold">&lt; 120MB Idle (vs 1.5GB+ Web)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Architecture Pillars in full-width 3-column grid matching Section 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pillar 01 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    01
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    Filesystem Direct
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Local File Processing
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Media files never leave your machine. No slow cloud uploads, no recurring storage fees, and zero cloud bandwidth bottlenecks when handling large 4K ProRes and RAW assets.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Storage</span>
                    <span className="font-semibold">Direct NVMe / SSD Stream</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Privacy</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% On-Device / Zero PII</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Throughput</span>
                    <span className="font-semibold">Native Disk Speed (Up to 7 GB/s)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 02 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    02
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    Hardware Surface
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    GPU Accelerated Pipeline
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Direct hardware VideoToolbox, D3D11VA, and VAAPI decoders stream uncompressed frames straight to GPU textures for seamless 60 FPS scrubbing without dropped frames.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Decoders</span>
                    <span className="font-semibold">VideoToolbox · D3D11VA · VAAPI</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Frame Budget</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sub-10ms @ 4K 60 FPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Surface</span>
                    <span className="font-semibold">Direct GPU Blit to Canvas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 03 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    03
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    Ecosystem Standard
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Open Standards &amp; Contracts
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Author shaders, transitions, and text effects in Studio against the exact same open WGSL and OTIO contracts consumed by the native desktop NLE.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Shader Specs</span>
                    <span className="font-semibold">WGSL Compute Passes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Interchange</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">OpenTimelineIO (.otio)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Interop</span>
                    <span className="font-semibold">100% Studio-to-Desktop Parity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: NATIVE DOWNLOADS & 6-ARCHITECTURE REPOSITORY
          Clean, authoritative systems release console
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="download"
        className={`relative overflow-x-clip texture-grain py-28 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#0c0714] text-stone-100 border-purple-900/20"
            : "bg-[#f5f2eb] text-stone-900 border-stone-300/70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}>
                NATIVE DESKTOP RELEASES
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Compiled for pure machine performance.
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Zero PII telemetry. Clypra compiles directly to native binaries across 6 hardware architectures with direct GPU decoder bindings.
            </p>
          </div>

          {/* Interactive Platform Console */}
          <div className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
            isDark
              ? "bg-[#140c1f] border-white/10 shadow-black/50"
              : "bg-white border-stone-200 shadow-stone-300/40"
          }`}>
            {/* Platform Selector Segmented Bar */}
            <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 ${
              isDark ? "bg-[#180f24] border-white/10" : "bg-stone-50 border-stone-200"
            }`}>
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/5 w-full sm:w-auto overflow-x-auto max-w-full">
                {(["mac", "win", "linux"] as const).map((osKey) => (
                  <button
                    key={osKey}
                    onClick={() => {
                      setUserOS(osKey);
                      setActiveTab(osKey);
                    }}
                    className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 flex-1 sm:flex-initial ${
                      userOS === osKey
                        ? isDark
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                          : "bg-[#281030] text-white shadow-md shadow-stone-400/30"
                        : isDark
                        ? "text-stone-400 hover:text-white"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {osKey === "mac" && <span> macOS</span>}
                    {osKey === "win" && <span>⊞ Windows</span>}
                    {osKey === "linux" && <span>🐧 Linux</span>}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono pr-2">
                <span className={`flex items-center gap-1.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Release: {release?.tag_name ?? "v1.5.8"}</span>
                </span>
                <span className="text-stone-400">·</span>
                <span className={isDark ? "text-stone-400" : "text-stone-500"}>MIT License</span>
              </div>
            </div>

            {/* Active Platform Feature Hero */}
            <div className="p-5 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-5 text-left">
                <div>
                  <h3 className={`font-editorial text-2xl sm:text-3xl font-bold ${
                    isDark ? "text-white" : "text-stone-950"
                  }`}>
                    {userOS === "mac" && "Clypra for macOS"}
                    {userOS === "win" && "Clypra for Windows"}
                    {userOS === "linux" && "Clypra for Linux"}
                  </h3>
                  <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    {userOS === "mac" &&
                      "Universal macOS bundle for Apple Silicon (M1/M2/M3/M4) and Intel x86_64 with hardware Metal VideoToolbox decoders."}
                    {userOS === "win" &&
                      "Native Windows installer for Intel/AMD x64 and Qualcomm Snapdragon ARM64 with Direct3D 11 Video Acceleration (D3D11VA)."}
                    {userOS === "linux" &&
                      "Standalone AppImage & tarball distributions for x86_64 and AArch64 with hardware VAAPI acceleration on Ubuntu, Debian, Arch, and Fedora."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <a
                    href={
                      userOS === "mac"
                        ? platformDownloads.mac.arm64.url
                        : userOS === "win"
                        ? platformDownloads.win.x64.url
                        : platformDownloads.linux.x64.url
                    }
                    className={`rounded-full px-7 py-3.5 text-sm font-bold flex items-center gap-2.5 transition-all shadow-lg hover:scale-[1.02] cursor-pointer ${
                      isDark
                        ? "bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-950/30"
                        : "bg-[#281030] hover:bg-black text-white shadow-stone-400/40"
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {userOS === "mac" && `Download macOS (.dmg)`}
                      {userOS === "win" && `Download Windows (.exe)`}
                      {userOS === "linux" && `Download Linux (.AppImage)`}
                    </span>
                  </a>

                  {/* Secondary Arch Link */}
                  {userOS === "mac" && (
                    <a
                      href={platformDownloads.mac.intel.url}
                      className={`text-xs font-mono underline underline-offset-4 hover:opacity-80 transition-opacity ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Looking for Intel x86_64 build? ({platformDownloads.mac.intel.size ?? "Ready"}) →
                    </a>
                  )}
                  {userOS === "win" && (
                    <a
                      href={platformDownloads.win.arm64.url}
                      className={`text-xs font-mono underline underline-offset-4 hover:opacity-80 transition-opacity ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Looking for Snapdragon ARM64 build? ({platformDownloads.win.arm64.size ?? "Ready"}) →
                    </a>
                  )}
                  {userOS === "linux" && (
                    <a
                      href={platformDownloads.linux.arm64.url}
                      className={`text-xs font-mono underline underline-offset-4 hover:opacity-80 transition-opacity ${
                        isDark ? "text-stone-400" : "text-stone-600"
                      }`}
                    >
                      Looking for ARM64 AArch64 package? ({platformDownloads.linux.arm64.size ?? "Ready"}) →
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Clean Command / Direct Package Spec */}
              <div className="lg:col-span-5">
                <div className={`p-5 rounded-2xl border text-left flex flex-col gap-3 font-mono text-xs ${
                  isDark ? "bg-[#191026] border-white/10" : "bg-stone-50 border-stone-200"
                }`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    {userOS === "mac" && "Terminal Install (Homebrew)"}
                    {userOS === "win" && "Windows Binary Specification"}
                    {userOS === "linux" && "Quickstart Command"}
                  </span>

                  {userOS === "mac" && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 dark:bg-black/40 border border-white/5">
                      <code className="text-amber-300 dark:text-amber-200 select-all text-xs">
                        brew install AIEraDev/tap/clypra
                      </code>
                      <button
                        onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")}
                        className="p-1 hover:text-amber-400 transition-colors ml-2 cursor-pointer"
                        title="Copy command"
                      >
                        {copiedMac ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
                      </button>
                    </div>
                  )}

                  {userOS === "win" && (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-1 border-b border-stone-200 dark:border-white/5">
                        <span className="text-stone-500">Package Type</span>
                        <span className="font-semibold">Signed InnoSetup Executable</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200 dark:border-white/5">
                        <span className="text-stone-500">Acceleration</span>
                        <span className="font-semibold">Direct3D 11 Video (D3D11VA)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-stone-500">Hardware Targets</span>
                        <span className="font-semibold">x86_64 · Snapdragon ARM64</span>
                      </div>
                    </div>
                  )}

                  {userOS === "linux" && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 dark:bg-black/40 border border-white/5">
                      <code className="text-emerald-300 select-all text-xs">
                        chmod +x Clypra*.AppImage
                      </code>
                      <button
                        onClick={() => copyToClipboard("chmod +x Clypra*.AppImage && ./Clypra*.AppImage", "linux")}
                        className="p-1 hover:text-emerald-400 transition-colors ml-2 cursor-pointer"
                        title="Copy command"
                      >
                        {copiedLinux ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Architecture Release Ledger Table */}
            <div className={`border-t ${isDark ? "border-white/10" : "border-stone-200"}`}>
              <div className="px-6 sm:px-8 py-4 flex items-center justify-between">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark ? "text-stone-300" : "text-stone-700"
                }`}>
                  Complete 6-Architecture Release Ledger
                </span>
                <a
                  href="https://github.com/AIEraDev/clypra/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                    isDark ? "text-amber-400" : "text-purple-700"
                  }`}
                >
                  <span>GitHub Checksums (SHA-256)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Minimalist Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-t border-b text-[10px] uppercase tracking-wider ${
                      isDark ? "border-white/5 bg-white/2 text-stone-400" : "border-stone-200 bg-stone-50 text-stone-500"
                    }`}>
                      <th className="py-2.5 px-6 sm:px-8 font-semibold">Target Architecture</th>
                      <th className="py-2.5 px-4 font-semibold">Platform</th>
                      <th className="py-2.5 px-4 font-semibold">Format</th>
                      <th className="py-2.5 px-4 font-semibold">Size</th>
                      <th className="py-2.5 px-6 sm:px-8 font-semibold text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-stone-100"}`}>
                    {[
                      { name: "macOS Apple Silicon (M1/M2/M3/M4)", platform: "macOS", format: ".dmg", size: platformDownloads.mac.arm64.size ?? "89.7 MB", url: platformDownloads.mac.arm64.url },
                      { name: "macOS Intel x86_64", platform: "macOS", format: ".dmg", size: platformDownloads.mac.intel.size ?? "Ready", url: platformDownloads.mac.intel.url },
                      { name: "Windows x64 (Intel & AMD)", platform: "Windows", format: ".exe", size: platformDownloads.win.x64.size ?? "102.9 MB", url: platformDownloads.win.x64.url },
                      { name: "Windows ARM64 (Snapdragon X)", platform: "Windows", format: ".exe", size: platformDownloads.win.arm64.size ?? "Ready", url: platformDownloads.win.arm64.url },
                      { name: "Linux x86_64", platform: "Linux", format: ".AppImage", size: platformDownloads.linux.x64.size ?? "202.2 MB", url: platformDownloads.linux.x64.url },
                      { name: "Linux ARM64 (AArch64)", platform: "Linux", format: ".AppImage", size: platformDownloads.linux.arm64.size ?? "92.4 MB", url: platformDownloads.linux.arm64.url },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          isDark ? "hover:bg-white/3" : "hover:bg-stone-50"
                        }`}
                      >
                        <td className="py-3 px-6 sm:px-8 font-semibold font-sans">{row.name}</td>
                        <td className={`py-3 px-4 ${isDark ? "text-stone-400" : "text-stone-500"}`}>{row.platform}</td>
                        <td className={`py-3 px-4 ${isDark ? "text-stone-400" : "text-stone-500"}`}>{row.format}</td>
                        <td className={`py-3 px-4 ${isDark ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>{row.size}</td>
                        <td className="py-3 px-6 sm:px-8 text-right">
                          <a
                            href={row.url}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              isDark
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200"
                            }`}
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: DEDICATED CREATIVE EFFECT LABS
          Clean editorial capability index for WebGPU & shader authoring
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="labs"
        className={`relative overflow-x-clip texture-grain py-28 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#100a1c] text-stone-100 border-purple-900/30"
            : "bg-[#f7f4ed] text-stone-900 border-stone-300/70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-14">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-purple-800"
              }`}>
                BROWSER-TO-DESKTOP SHADER ARCHITECTURE
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Dedicated Creative Laboratories
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Calibrate and validate real-time visual assets in isolated web environments. Every shader, transition, and neural mask compiles to the exact same contract bindings running on the native desktop engine.
            </p>
          </div>

          {/* 3-Part Editorial Capability Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lab 01 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    01
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    WebGPU Frame Shaders
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Video Effect Lab
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Live WGSL fragment passes with real-time parameter uniform buffers, 60 FPS deterministic frame stepping, and sub-millisecond memory footprint.
                  </p>
                </div>

                {/* Technical Specification Readout */}
                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Pipeline</span>
                    <span className="font-semibold">WGSL / WebGPU Compute</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Frame Budget</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">&lt; 1.2ms @ 4K</span>
                  </div>
                  <div className="pt-1 border-t border-stone-200/60 dark:border-white/5">
                    <span className="text-stone-400 dark:text-stone-500 block mb-1">Built-in Passes:</span>
                    <div className="text-xs font-sans font-medium text-stone-800 dark:text-stone-200">
                      Film Grain · VHS Glitch · Bloom · Chromatic Aberration · Gaussian Blur
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-200 dark:border-white/10 text-left">
                <Link
                  to="/studio/video-lab"
                  className={`inline-flex items-center gap-2 text-xs font-bold transition-all group ${
                    isDark ? "text-amber-400 hover:text-amber-300" : "text-purple-800 hover:text-purple-950"
                  }`}
                >
                  <span>Launch Video Shader Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Lab 02 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    02
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    Temporal Mixing
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Transition Lab
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Dual-input temporal mixers with custom cubic Bezier easing curves, directional velocity maps, and instant frame blending scrubbing.
                  </p>
                </div>

                {/* Technical Specification Readout */}
                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Sampling</span>
                    <span className="font-semibold">Dual-Texture BindGroups</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Interpolation</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Cubic Bezier / Linear</span>
                  </div>
                  <div className="pt-1 border-t border-stone-200/60 dark:border-white/5">
                    <span className="text-stone-400 dark:text-stone-500 block mb-1">Built-in Transitions:</span>
                    <div className="text-xs font-sans font-medium text-stone-800 dark:text-stone-200">
                      Cross Dissolve · Directional Push · Optical Wipe · Glitch Slice · Zoom Flare
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-200 dark:border-white/10 text-left">
                <Link
                  to="/studio/transition-lab"
                  className={`inline-flex items-center gap-2 text-xs font-bold transition-all group ${
                    isDark ? "text-amber-400 hover:text-amber-300" : "text-purple-800 hover:text-purple-950"
                  }`}
                >
                  <span>Launch Transition Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Lab 03 */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDark
                  ? "bg-[#181024] border-white/10 hover:border-purple-400/40 shadow-xl shadow-black/40"
                  : "bg-white border-stone-200/90 hover:border-stone-400 shadow-lg shadow-stone-300/30"
              }`}
            >
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-white/10">
                  <span className={`font-mono text-xl font-bold ${
                    isDark ? "text-amber-400" : "text-purple-900"
                  }`}>
                    03
                  </span>
                  <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? "text-stone-400" : "text-stone-500"
                  }`}>
                    Neural Segmentation
                  </span>
                </div>

                <div>
                  <h3 className={`font-editorial text-2xl font-bold tracking-tight mb-2 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    Body &amp; Neural Lab
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    Client-side inference workers for real-time person segmentation, depth-masked portrait bokeh, and dynamic neon silhouettes with zero cloud roundtrips.
                  </p>
                </div>

                {/* Technical Specification Readout */}
                <div className={`p-4 rounded-2xl border font-mono text-[11px] flex flex-col gap-2.5 ${
                  isDark ? "bg-black/25 border-white/5 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Inference</span>
                    <span className="font-semibold">Web Worker WASM Core</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 dark:text-stone-500">Privacy</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Local / Zero Cloud</span>
                  </div>
                  <div className="pt-1 border-t border-stone-200/60 dark:border-white/5">
                    <span className="text-stone-400 dark:text-stone-500 block mb-1">Built-in Modules:</span>
                    <div className="text-xs font-sans font-medium text-stone-800 dark:text-stone-200">
                      Neon Silhouette · Portrait Bokeh · Background Removal · Chroma Keyer
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-200 dark:border-white/10 text-left">
                <Link
                  to="/studio/body-lab"
                  className={`inline-flex items-center gap-2 text-xs font-bold transition-all group ${
                    isDark ? "text-amber-400 hover:text-amber-300" : "text-purple-800 hover:text-purple-950"
                  }`}
                >
                  <span>Launch Body Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Studio Ecosystem Footer Bar */}
          <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isDark ? "bg-[#140c1f] border-white/10 text-stone-300" : "bg-white border-stone-200 text-stone-700 shadow-sm"
          }`}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                <strong>Additional Laboratories:</strong> Typography Engine, Native Color Grading LUTs, Spatial Audio, and Motion Overlays.
              </span>
            </div>
            <Link
              to="/studio"
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40"
                  : "bg-[#281030] hover:bg-black text-white shadow-stone-400/30"
              }`}
            >
              <span>Open Studio Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5: INSTALLATION & SECURITY VERIFICATION
          Clean developer verification protocol (NO fake terminal traffic lights)
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="install"
        className={`relative overflow-x-clip texture-grain py-28 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#0b0713] text-stone-100 border-purple-900/20"
            : "bg-[#f3eee7] text-stone-900 border-stone-300/70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}>
                SYSTEM AUTHORIZATION &amp; CLEARANCE
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Clearance &amp; Verification Protocol
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Clypra is open-source software compiled transparently from audited Rust and TypeScript repositories. Because we reject telemetry and avoid corporate root keys, operating systems request explicit user confirmation on first launch.
            </p>
          </div>

          {/* Platform Selector */}
          <div className="flex justify-start w-full overflow-x-auto pb-1 max-w-full">
            <div className={`p-1 rounded-2xl border flex items-center gap-1.5 shrink-0 ${
              isDark ? "bg-[#140c1f] border-white/10" : "bg-stone-200/70 border-stone-300"
            }`}>
              {(["mac", "win", "linux"] as const).map((osKey) => (
                <button
                  key={osKey}
                  onClick={() => setActiveTab(osKey)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    activeTab === osKey
                      ? isDark
                        ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                        : "bg-[#281030] text-white shadow-md shadow-stone-400/30"
                      : isDark
                      ? "text-stone-400 hover:text-white"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {osKey === "mac" && (
                    <>
                      <span className="sm:hidden">macOS</span>
                      <span className="hidden sm:inline">macOS Gatekeeper</span>
                    </>
                  )}
                  {osKey === "win" && (
                    <>
                      <span className="sm:hidden">Windows</span>
                      <span className="hidden sm:inline">Windows SmartScreen</span>
                    </>
                  )}
                  {osKey === "linux" && (
                    <>
                      <span className="sm:hidden">Linux</span>
                      <span className="hidden sm:inline">Linux Permissions</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Clear Typographical Steps */}
            <div className="lg:col-span-6 flex flex-col gap-4 text-left">
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? "bg-[#140c1f] border-white/10" : "bg-white border-stone-200/90 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isDark ? "bg-amber-400/15 text-amber-300" : "bg-amber-100 text-amber-900"
                  }`}>
                    01
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-stone-950"}`}>
                    Mount Artifact
                  </h4>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-stone-300" : "text-stone-600"}`}>
                  {activeTab === "mac" &&
                    "Open the downloaded Clypra_aarch64.dmg or Clypra_x64.dmg and drag the Clypra.app bundle into /Applications."}
                  {activeTab === "win" &&
                    "Run the standalone Clypra-setup.exe installer directly from your downloads directory."}
                  {activeTab === "linux" &&
                    "Download Clypra_amd64.AppImage or Clypra_arm64.AppImage into your workspace or ~/.local/bin."}
                </p>
              </div>

              <div
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? "bg-[#140c1f] border-white/10" : "bg-white border-stone-200/90 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isDark ? "bg-purple-400/15 text-purple-300" : "bg-purple-100 text-purple-900"
                  }`}>
                    02
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-stone-950"}`}>
                    Clear Quarantine / Authorization
                  </h4>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-stone-300" : "text-stone-600"}`}>
                  {activeTab === "mac" &&
                    "If macOS Gatekeeper flags the app as unverified, right-click (Control-click) Clypra.app and choose 'Open'. Or run the xattr command opposite to permanently clear the quarantine bit."}
                  {activeTab === "win" &&
                    "When Windows Defender SmartScreen appears, click 'More info' followed by 'Run anyway'. This registers the Direct3D GPU decoder filters."}
                  {activeTab === "linux" &&
                    "Grant execution permissions via chmod +x or through your desktop file manager properties before launching."}
                </p>
              </div>

              <div
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? "bg-[#140c1f] border-white/10" : "bg-white border-stone-200/90 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-900"
                  }`}>
                    03
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-stone-950"}`}>
                    Hardware Decoder Verification
                  </h4>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-stone-300" : "text-stone-600"}`}>
                  On launch, Clypra immediately probes for hardware decoder capability: Metal on macOS, D3D11 on Windows, and VAAPI on Linux. Zero cloud login required.
                </p>
              </div>
            </div>

            {/* Right Column: Clean Developer Terminal Console (NO traffic lights) */}
            <div className="lg:col-span-6">
              <div className={`rounded-2xl border overflow-hidden text-left shadow-xl ${
                isDark
                  ? "bg-[#08050e] border-white/10 shadow-black/60"
                  : "bg-[#15111c] border-stone-800 text-stone-100 shadow-stone-400/40"
              }`}>
                {/* Console Bar */}
                <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>system-verification · {activeTab}</span>
                  </div>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-stone-500">
                    BASH / ZSH / POWERSHELL
                  </span>
                </div>

                {/* Console Code Body */}
                <div className="p-4 sm:p-6 font-mono text-xs flex flex-col gap-5">
                  {activeTab === "mac" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # Method A: Homebrew Tap (Installs &amp; bypasses Gatekeeper automatically)
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-amber-300 select-all overflow-x-auto">
                            brew install AIEraDev/tap/clypra
                          </code>
                          <button
                            onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedMac ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # Method B: Manually strip quarantine bit from .app bundle
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-amber-300 select-all overflow-x-auto">
                            xattr -cr /Applications/Clypra.app
                          </code>
                          <button
                            onClick={() => copyToClipboard("xattr -cr /Applications/Clypra.app", "mac")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedMac ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "win" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # PowerShell: Unblock downloaded installer before launch
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-cyan-300 select-all overflow-x-auto">
                            Unblock-File -Path .\Clypra_x64-setup.exe
                          </code>
                          <button
                            onClick={() => copyToClipboard("Unblock-File -Path .\\Clypra_x64-setup.exe", "win")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedWin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # Or execute installer directly
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-cyan-300 select-all overflow-x-auto">
                            .\Clypra_x64-setup.exe
                          </code>
                          <button
                            onClick={() => copyToClipboard(".\\Clypra_x64-setup.exe", "win")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedWin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "linux" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # Grant execution permissions and run standalone AppImage
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-emerald-300 select-all overflow-x-auto">
                            chmod +x Clypra*.AppImage &amp;&amp; ./Clypra*.AppImage
                          </code>
                          <button
                            onClick={() => copyToClipboard("chmod +x Clypra*.AppImage && ./Clypra*.AppImage", "linux")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedLinux ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] text-stone-400">
                          # Optional: Move to user path for global launcher integration
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                          <code className="text-emerald-300 select-all overflow-x-auto">
                            mv Clypra*.AppImage ~/.local/bin/clypra
                          </code>
                          <button
                            onClick={() => copyToClipboard("mv Clypra*.AppImage ~/.local/bin/clypra", "linux")}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedLinux ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Cryptographic verification footer */}
                  <div className="pt-3 border-t border-white/10 text-[11px] text-stone-400 leading-relaxed font-sans">
                    <strong>Cryptographic Guarantee:</strong> Every Clypra binary is compiled inside ephemeral GitHub Actions runners directly from commit hashes. SHA-256 digests are published alongside every release asset.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6: RECENT ACHIEVEMENTS & ENGINEERING DISPATCH
          Clean chronological release ledger (NO Jira cards with colored badges)
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="milestones"
        className={`relative texture-grain py-28 transition-colors duration-500 border-b ${
          isDark
            ? "bg-[#110a1b] text-stone-100 border-purple-900/20"
            : "bg-[#faf8f4] text-stone-900 border-stone-300/70"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-14">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}>
                ENGINEERING DISPATCH &amp; LEDGER
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Engineered in the open.
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Every commit, performance optimization, and pipeline refactor is documented with full technical transparency across our public git commit history.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Repository Velocity Metrics (Sticky while Section 6 is active) */}
            <div className="lg:col-span-4 text-left">
              <div className="lg:sticky lg:top-24">
                <div
                  className={`p-5 sm:p-6 rounded-3xl border ${
                    isDark ? "bg-[#181024] border-white/10" : "bg-white border-stone-200/90 shadow-sm"
                  }`}
                >
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                  isDark ? "text-stone-400" : "text-stone-500"
                }`}>
                  Release Velocity
                </span>
                <div className="mt-3 flex flex-col gap-4">
                  <div>
                    <div className={`text-4xl font-editorial font-bold ${
                      isDark ? "text-white" : "text-stone-950"
                    }`}>
                      {release?.tag_name ?? "v1.5.8"}
                    </div>
                    <div className={`text-xs ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                      Current Stable Production Tag
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${isDark ? "border-white/10" : "border-stone-100"}`}>
                    <div className="flex items-center justify-between text-xs font-mono py-1">
                      <span className={isDark ? "text-stone-400" : "text-stone-500"}>Architectures:</span>
                      <span className="font-bold">6 Native Targets</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono py-1">
                      <span className={isDark ? "text-stone-400" : "text-stone-500"}>License:</span>
                      <span className="font-bold">MIT Open Source</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono py-1">
                      <span className={isDark ? "text-stone-400" : "text-stone-500"}>Rust Core:</span>
                      <span className="font-bold">Zero-Copy GPU Surface</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200 dark:border-white/10">
                  <a
                    href="https://github.com/AIEraDev/clypra/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-xs font-bold transition-all group ${
                      isDark ? "text-amber-400 hover:text-amber-300" : "text-purple-800 hover:text-purple-950"
                    }`}
                  >
                    <span>Inspect GitHub Release History</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

            {/* Right Column: Chronological Engineering Dispatches (Ledger) */}
            <div className="lg:col-span-8 flex flex-col gap-4 text-left">
              {[
                {
                  version: "v1.5.8",
                  subsystem: "NLE TOOLS & REALTIME PLAYBACK",
                  title: "J/K/L Multi-Speed Shuttle, OpenTimelineIO & UNCH Sentinel",
                  date: "October 2026",
                  summary:
                    "Introduced professional multi-speed J/K/L transport (up to 16x) with audio drift compensation, bidirectional OpenTimelineIO (.otio) interchange, SMPTE 12M timecode parsing, and precision Slip/Slide/Roll trimming tools. Integrated 12-byte UNCH repeat frame sentinels and selective Arm 2b lookahead priming up to 647 FPS on Intel iGPUs.",
                },
                {
                  version: "v1.5.7",
                  subsystem: "TELEMETRY & ADAPTIVE BRIDGE",
                  title: "Pre-Request Telemetry Dispatch & Adaptive Readback Telemetry",
                  date: "September 2026",
                  summary:
                    "Resolved Windows readback telemetry span capture by recording dispatch metrics before request execution across cache hits and misses. Added OS-specific canvas readback caps (960px macOS / 480px Windows) and adaptive cadence FPS tracking for the embedded preview bridge.",
                },
                {
                  version: "v1.5.6",
                  subsystem: "EMBEDDED SURFACE & AUDIO SYNC",
                  title: "In-Canvas Preview Embedding & CPAL Hardware Clock Synchronization",
                  date: "September 2026",
                  summary:
                    "Embedded native preview directly inside the editor canvas to eliminate detached OS child windows across macOS, Windows, and Wayland. Eliminated -12ms audio/video drift with CPAL hardware anchoring and deferred filmstrip thumbnail generation during live playback.",
                },
                {
                  version: "v1.5.5",
                  subsystem: "REALTIME ENGINE V2",
                  title: "Realtime Playback Engine v2 & Offline Media Watchdog",
                  date: "September 2026",
                  summary:
                    "Delivered 10-phase native realtime engine with zero-IPC timeline evaluator, D3D12VA/VideoToolbox hardware decode, prioritized prefetch work planner, and render graph DAG. Introduced heartbeat watchdog for runtime offline asset detection and GPU texture cache eviction.",
                },
                {
                  version: "v1.5.4",
                  subsystem: "TIMELINE & PLAYBACK CONTROL",
                  title: "Playback Speed Ramps, Freeze Frames & Creative Project Generator",
                  date: "September 2026",
                  summary:
                    "Introduced variable speed mapping (0.1x–100x) with freeze-frame insertion, inspector Fit/Fill aspect controls, automated Microsoft Store MSIX packaging, and creative project naming with 6,160+ unique cinematic combinations.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-[#160f23] border-white/10 hover:border-purple-400/30"
                      : "bg-white border-stone-200/90 hover:border-stone-400 shadow-sm"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isDark ? "bg-amber-400/15 text-amber-300" : "bg-purple-100 text-purple-900"
                      }`}>
                        {item.version}
                      </span>
                      <span className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${
                        isDark ? "text-stone-400" : "text-stone-500"
                      }`}>
                        {item.subsystem}
                      </span>
                    </div>
                    <span className={`text-xs font-mono ${
                      isDark ? "text-stone-400" : "text-stone-500"
                    }`}>
                      {item.date}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-1.5 ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}>
                    {item.title}
                  </h3>

                  <p className={`text-xs leading-relaxed ${
                    isDark ? "text-stone-300" : "text-stone-600"
                  }`}>
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7: MEET THE CREATOR & SOCIAL ARCHIVE
          Direct editorial inspiration from Chess in Slums (media_1791060849486.png)
          Tilted physical photograph, thoughtful editorial quote, and clean inline links.
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="creator"
        className={`relative overflow-x-clip texture-grain py-28 transition-colors duration-500 ${
          isDark
            ? "bg-[#140d1f] text-stone-100"
            : "bg-[#f5f1ea] text-stone-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-14">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-300/60 dark:border-white/10">
            <div className="max-w-xl text-left">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}>
                THE CRAFT &amp; PHILOSOPHY
              </span>
              <h2
                className={`font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                  isDark ? "text-white" : "text-[#240e2b]"
                }`}
              >
                Meet the Creator
              </h2>
            </div>
            <p className={`text-xs sm:text-sm max-w-sm text-left leading-relaxed ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}>
              Clypra is designed and maintained by Abdul Kabir Musa—an independent software craftsman engineering high-performance creative tools.
            </p>
          </div>

          {/* Editorial Spread: Physical Tilted Photo & Authentic Manifesto */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Physical Tilted Photo with Border & Tape Aesthetic */}
            <div className="lg:col-span-5 flex justify-center px-2 sm:px-0 max-w-full">
              <div className="relative group max-w-full">
                {/* Physical Print Framing */}
                <div
                  className={`relative p-3 rounded-2xl border shadow-2xl transition-all duration-500 -rotate-1 sm:-rotate-2 group-hover:rotate-0 group-hover:scale-[1.02] max-w-full ${
                    isDark
                      ? "bg-[#1f152b] border-white/20 shadow-black/80"
                      : "bg-white border-stone-300/80 shadow-stone-400/50"
                  }`}
                >
                  {/* Subtle Top-Right Tape / Physical Stamp */}
                  <div className="absolute -top-2.5 sm:-top-3 -right-1 sm:-right-2 z-20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-sm bg-amber-400 text-stone-950 font-mono text-[9px] font-extrabold uppercase tracking-wider shadow-md rotate-3 sm:rotate-6">
                    LAGOS · ARCHITECT
                  </div>

                  <div className="relative w-56 h-64 sm:w-72 sm:h-80 rounded-xl overflow-hidden bg-black max-w-full">
                    <img
                      src="/founder.jpg"
                      alt="Abdul Kabir Musa - Creator of Clypra"
                      className="w-full h-full object-cover object-center filter saturate-105 contrast-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Physical Photo Caption */}
                  <div className="pt-3 pb-1 text-center font-mono">
                    <div className={`text-xs font-bold ${isDark ? "text-stone-200" : "text-stone-900"}`}>
                      Abdul Kabir Musa
                    </div>
                    <div className={`text-[10px] ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                      Founder &amp; Systems Architect
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative Storytelling & Clean Inline Links */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              {/* Large Editorial Headline */}
              <blockquote className={`font-editorial text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight ${
                isDark ? "text-stone-100" : "text-[#281030]"
              }`}>
                &ldquo;Creative tools should respect the machine and honor the person creating — fast, private, and subscription-free.&rdquo;
              </blockquote>

              {/* Story Narrative */}
              <div className={`flex flex-col gap-4 text-xs sm:text-sm leading-relaxed ${
                isDark ? "text-stone-300" : "text-stone-700"
              }`}>
                <p>
                  Clypra began out of frustration with modern video editors that have morphed into sluggish, subscription-gated web containers. As video creators, we were tired of tools that throttle 4K scrubbing, enforce cloud telemetry, and demand recurring fees for essential features.
                </p>
                <p>
                  I engineered Clypra from scratch to prove that a modern NLE can run with blistering speed on local silicon. By pairing Rust&apos;s memory safety and zero-copy decoders with WebGPU&apos;s shader flexibility and React&apos;s UI ergonomics, Clypra delivers instantaneous, tactile editing directly on your machine.
                </p>
              </div>

              {/* Clean Inline Social Archive (NO chunky button boxes!) */}
              <div className="pt-4 border-t border-stone-300/60 dark:border-white/10 flex flex-col gap-3">
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                  isDark ? "text-stone-400" : "text-stone-500"
                }`}>
                  Connect &amp; Collaborate
                </span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold">
                  <a
                    href="https://github.com/AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-amber-300" : "text-stone-800 hover:text-purple-700"
                    }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub (@AIEraDev)</span>
                  </a>

                  <a
                    href="https://x.com/AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-sky-400" : "text-stone-800 hover:text-sky-600"
                    }`}
                  >
                    <Twitter className="w-3.5 h-3.5 text-sky-400" />
                    <span>Twitter / X</span>
                  </a>

                  <a
                    href="https://abdulkabirmusa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-emerald-300" : "text-stone-800 hover:text-emerald-700"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Personal Site</span>
                  </a>

                  <a
                    href="https://www.youtube.com/@AIEraDev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-rose-400" : "text-stone-800 hover:text-rose-600"
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    <span>YouTube</span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/abdulkabirmusa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-blue-400" : "text-stone-800 hover:text-blue-600"
                    }`}
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="mailto:musaabdulkabeer19@gmail.com"
                    className={`inline-flex items-center gap-1.5 transition-colors ${
                      isDark ? "text-stone-200 hover:text-amber-300" : "text-stone-800 hover:text-amber-700"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Controls at Bottom Right: Version Pill & Scroll-to-Top Button ── */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-2.5 max-w-[calc(100vw-2rem)]">
        {/* Floating Version Badge with continuous animation */}
        <a
          href="https://github.com/AIEraDev/clypra/releases"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full font-mono text-xs font-bold transition-all duration-300 shadow-xl border backdrop-blur-md hover:scale-105 cursor-pointer ${
            isDark
              ? "bg-[#181023]/95 text-amber-300 border-amber-400/40 shadow-purple-950/60 hover:border-amber-300"
              : "bg-white/95 text-amber-950 border-amber-400/80 shadow-stone-400/40 hover:border-amber-500"
          } animate-sticky-version`}
          title={`Latest Clypra Release: ${release?.tag_name ?? "v1.5.8"}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>{release?.tag_name ?? "v1.5.8"}</span>
        </a>

        {/* Scroll-to-Top Floating Button */}
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FF5733] hover:bg-[#E04B2A] text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-orange-950/40 shrink-0"
          title="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      </div>

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
