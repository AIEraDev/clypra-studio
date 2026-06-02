import React, { useEffect, useState } from "react";
import { Download, ArrowRight, Sparkles, Shield, Terminal, Monitor, Layers, Play, CheckCircle2, Copy, Check, Smartphone } from "lucide-react";

export const WebShowcase: React.FC = () => {
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedLinux, setCopiedLinux] = useState(false);
  const [activeTab, setActiveTab] = useState<"mac" | "win" | "linux">("mac");

  // Mouse coordinate state to feed dynamic light highlights
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  return (
    <div className="w-full min-h-screen bg-[#030305] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#6c63ff]/30 selection:text-white overflow-x-hidden relative">
      {/* ── Mind-Blowing Background CSS & Animations ────────────── */}
      <style>{`
        /* Nebula drift animations */
        @keyframes nebula-purple {
          0%, 100% { transform: translate(-10%, -10%) scale(1) rotate(0deg); opacity: 0.25; }
          33% { transform: translate(15%, 10%) scale(1.2) rotate(120deg); opacity: 0.35; }
          66% { transform: translate(-5%, 25%) scale(0.9) rotate(240deg); opacity: 0.2; }
        }
        @keyframes nebula-blue {
          0%, 100% { transform: translate(10%, 10%) scale(1.1) rotate(0deg); opacity: 0.2; }
          50% { transform: translate(-15%, -15%) scale(0.85) rotate(-180deg); opacity: 0.3; }
        }
        @keyframes nebula-cyan {
          0%, 100% { transform: translate(5%, -20%) scale(0.9) rotate(0deg); opacity: 0.15; }
          40% { transform: translate(-10%, 15%) scale(1.1) rotate(90deg); opacity: 0.25; }
        }
        @keyframes nebula-emerald {
          0%, 100% { transform: translate(-15%, 5%) scale(1) rotate(0deg); opacity: 0.12; }
          50% { transform: translate(10%, -10%) scale(1.15) rotate(180deg); opacity: 0.22; }
        }

        /* Laser scanning beams */
        @keyframes laser-sweep-x {
          0% { left: -10%; opacity: 0; }
          10%, 90% { opacity: 0.4; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes laser-sweep-y {
          0% { top: -10%; opacity: 0; }
          15%, 85% { opacity: 0.35; }
          100% { top: 110%; opacity: 0; }
        }

        /* Floating particles */
        @keyframes star-float-slow {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-40px) translateX(20px); opacity: 0.7; }
        }
        @keyframes star-float-fast {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-60px) translateX(-30px); opacity: 0.9; }
        }

        /* Entrance and visual effects */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes text-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes mesh-drift {
          0% { background-position: 0% 0%; }
          100% { background-position: 60px 60px; }
        }

        .animate-nebula-p { animation: nebula-purple 35s infinite ease-in-out; }
        .animate-nebula-b { animation: nebula-blue 28s infinite ease-in-out; }
        .animate-nebula-c { animation: nebula-cyan 32s infinite ease-in-out; }
        .animate-nebula-e { animation: nebula-emerald 25s infinite ease-in-out; }
        
        .animate-laser-x { animation: laser-sweep-x 12s infinite linear; }
        .animate-laser-y { animation: laser-sweep-y 16s infinite linear; }
        
        .animate-star-s { animation: star-float-slow 8s infinite ease-in-out; }
        .animate-star-f { animation: star-float-fast 6s infinite ease-in-out; }

        .animate-fade-up {
          opacity: 0;
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .shimmer-bg {
          background-size: 200% auto;
          animation: text-shimmer 6s linear infinite;
        }

        /* Interactive Dot Matrix grid */
        .tech-grid {
          background-size: 50px 50px;
          background-image: 
            radial-gradient(circle, rgba(255, 255, 255, 0.02) 1.5px, transparent 1.5px);
          mask-image: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 20%, rgba(0, 0, 0, 0.1) 60%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 20%, rgba(0, 0, 0, 0.1) 60%, transparent 95%);
          animation: mesh-drift 40s linear infinite;
        }

        /* Grid lines under the dot matrix */
        .grid-lines {
          background-size: 100px 100px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.007) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.007) 1px, transparent 1px);
        }

        /* Glassmorphism styling */
        .glass-panel {
          background: rgba(10, 10, 14, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.035);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.02),
            0 0 1px rgba(255, 255, 255, 0.1),
            0 12px 40px rgba(0, 0, 0, 0.45);
        }

        /* Card custom neon glows */
        .mac-card:hover {
          border-color: rgba(108, 99, 255, 0.45);
          box-shadow: 
            0 0 35px rgba(108, 99, 255, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 15px rgba(108, 99, 255, 0.05);
        }
        .win-card:hover {
          border-color: rgba(6, 182, 212, 0.45);
          box-shadow: 
            0 0 35px rgba(6, 182, 212, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 15px rgba(6, 182, 212, 0.05);
        }
        .linux-card:hover {
          border-color: rgba(16, 185, 129, 0.45);
          box-shadow: 
            0 0 35px rgba(16, 185, 129, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 15px rgba(16, 185, 129, 0.05);
        }
      `}</style>

      {/* ── Mind-Blowing Background Layers ───────────────────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          // Set CSS custom properties for hover mask tracking
          ["--mouse-x" as any]: `${mousePos.x}%`,
          ["--mouse-y" as any]: `${mousePos.y}%`,
        }}
      >
        {/* Layer 1: Tech Grid Lines */}
        <div className="absolute inset-0 grid-lines opacity-80" />

        {/* Layer 2: Interactive Dot Grid following the cursor */}
        <div className="absolute inset-0 tech-grid" />

        {/* Layer 3: Massive Drifting Cosmic Nebulas */}
        <div
          className="absolute top-[-15%] left-[5%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.25] animate-nebula-p"
          style={{
            background: "radial-gradient(circle, rgba(108, 99, 255, 0.4) 0%, rgba(139, 92, 246, 0.1) 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-[25%] right-[-15%] w-[55vw] h-[55vw] rounded-full blur-[130px] opacity-[0.2] animate-nebula-b"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.08) 60%, transparent 100%)",
          }}
        />
        <div
          className="absolute bottom-[15%] left-[-15%] w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-[0.16] animate-nebula-e"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(108, 99, 255, 0.03) 65%, transparent 100%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.15] animate-nebula-c"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.03) 60%, transparent 100%)",
          }}
        />

        {/* Layer 4: Vertical and Horizontal Scanning Laser Beams */}
        <div className="absolute top-0 bottom-0 w-px bg-linear-to-b from-transparent via-[#6c63ff]/60 to-transparent animate-laser-x pointer-events-none shadow-[0_0_15px_rgba(108,99,255,0.8)]" />
        <div className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent animate-laser-y pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.8)]" />

        {/* Layer 5: Floating Micro-Star Particles */}
        <div className="absolute inset-0">
          <div className="absolute top-[12%] left-[8%] w-1.5 h-1.5 rounded-full bg-white animate-star-s" />
          <div className="absolute top-[28%] left-[85%] w-1 h-1 rounded-full bg-cyan-300 animate-star-f" style={{ animationDelay: "1s" }} />
          <div className="absolute top-[65%] left-[15%] w-2 h-2 rounded-full bg-indigo-300 animate-star-s" style={{ animationDelay: "2.5s" }} />
          <div className="absolute top-[45%] left-[62%] w-1 h-1 rounded-full bg-white animate-star-f" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-[82%] left-[78%] w-1.5 h-1.5 rounded-full bg-emerald-300 animate-star-s" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[90%] left-[22%] w-1 h-1 rounded-full bg-white animate-star-f" style={{ animationDelay: "1.8s" }} />
        </div>
      </div>

      {/* ── Navigation / Header ────────────────────────────────── */}
      <header className="relative z-10 w-full border-b border-white/3 backdrop-blur-md bg-[#030305]/40 top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[#6c63ff]/20 blur-md rounded-full group-hover:scale-125 transition-transform duration-500 animate-pulse"></div>
              <img src="/clypra.svg" alt="Clypra Logo" className="w-9 h-9 object-contain relative z-10 group-hover:rotate-6 transition-transform duration-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">Clypra</h1>
              <p className="text-[9px] text-[#666] font-mono tracking-widest uppercase">Premium Video Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="/studio" className="h-9 rounded-full border border-[#6c63ff]/30 bg-[#6c63ff]/15 px-4 text-xs font-semibold text-white flex items-center gap-2 hover:bg-[#6c63ff]/25 transition-all duration-300 shadow-[0_0_18px_rgba(108,99,255,0.16)]">
              <Sparkles className="w-3.5 h-3.5 text-[#a9a4ff]" />
              Open Studio
            </a>
            <a href="https://github.com/AIEraDev/clypra" target="_blank" rel="noopener noreferrer" className="text-xs text-[#a1a1aa] hover:text-white transition-all duration-300 flex items-center gap-1.5 font-medium relative group py-2">
              <span>GitHub Repository</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              <span className="absolute bottom-0 left-0 w-0 h-px bg-[#6c63ff] group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col gap-28">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <section className="text-center max-w-4xl mx-auto flex flex-col gap-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {/* Version Badge */}
          <div className="inline-flex self-center items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#6c63ff]/20 bg-[#6c63ff]/10 backdrop-blur-md shadow-[0_0_25px_rgba(108,99,255,0.12)]">
            <Sparkles className="w-3.5 h-3.5 text-[#8b84ff] animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider text-[#8b84ff] uppercase font-mono">v1.0.1 Stable Release</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.08] font-outfit text-white">
            A Premium
            <br />
            <span className="bg-linear-to-r from-[#6c63ff] via-[#8b84ff] to-[#a9a4ff] bg-clip-text text-transparent shimmer-bg">Video Editor.</span>
          </h2>

          {/* Subheading */}
          <p className="text-sm sm:text-base md:text-lg text-[#a1a1aa] leading-relaxed max-w-2xl mx-auto font-sans">Clypra is a modern, high-performance video editor engineered using Tauri, React, and Rust. Experience a professional desktop-class NLE timeline, hardware-accelerated rendering, and visual asset pools directly on your machine—with mobile versions coming soon.</p>

          {/* Quick Platform Badges */}
          <div className="flex justify-center gap-3 mt-4 text-[10px] text-[#666] font-mono">
            <span className="px-2.5 py-1 rounded bg-white/2 border border-white/4">macOS Universal</span>
            <span className="px-2.5 py-1 rounded bg-white/2 border border-white/4">Windows x64</span>
            <span className="px-2.5 py-1 rounded bg-white/2 border border-white/4">Linux AppImage</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-2">
            <a href="/studio" className="h-12 rounded-xl bg-[#6c63ff] px-6 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#7b73ff] shadow-[0_10px_35px_rgba(108,99,255,0.28)]">
              Launch Clypra Studio
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="https://github.com/AIEraDev/Clypra/releases/latest" target="_blank" rel="noopener noreferrer" className="h-12 rounded-xl border border-white/8 bg-white/3 px-6 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/[0.07]">
              Download Desktop
              <Download className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* ── Native Downloads Section ───────────────────────────── */}
        <section className="flex flex-col gap-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="text-center flex flex-col gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-outfit">Get Clypra Desktop</h3>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto leading-relaxed">Clypra compiles to optimized native executables for hardware acceleration, native file explorer integration, and robust multithreading.</p>
          </div>

          {/* Platform Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* macOS DMG Card */}
            <div className="glass-panel mac-card rounded-2xl p-7 flex flex-col gap-6 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#6c63ff]/5 rounded-bl-full filter blur-xl transition-all duration-500 group-hover:bg-[#6c63ff]/10" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <h4 className="font-bold text-white text-xl">macOS</h4>
                  <p className="text-[10px] text-[#8b84ff] font-mono tracking-wider uppercase mt-0.5">Universal DMG (.dmg)</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center text-white text-lg font-semibold group-hover:scale-110 transition-transform duration-300"></div>
              </div>

              <ul className="text-xs text-[#a1a1aa] flex flex-col gap-3 list-none p-0 my-2 grow">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#8b84ff] shrink-0 mt-0.5" />
                  <span>Supports both Apple Silicon & Intel processors natively.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#8b84ff] shrink-0 mt-0.5" />
                  <span>Bypasses Gatekeeper controls securely via Cask.</span>
                </li>
              </ul>

              <div className="mt-auto pt-5 border-t border-white/4 flex flex-col gap-3 z-10">
                <a href="https://github.com/AIEraDev/Clypra/releases/latest" target="_blank" rel="noopener noreferrer" className="w-full h-12 rounded-xl bg-[#6c63ff]/80 hover:bg-[#6c63ff] border border-[#8b84ff]/30 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_20px_rgba(108,99,255,0.25)] hover:shadow-[0_4px_25px_rgba(108,99,255,0.4)]">
                  <Download className="w-4 h-4" />
                  Download DMG
                </a>

                {/* Homebrew Box */}
                <div className="p-3 rounded-xl bg-[#09090b]/80 border border-white/3 flex flex-col gap-1.5 text-[11px] text-left transition-colors group-hover:border-white/6">
                  <span className="font-mono text-neutral-400 font-medium flex items-center justify-between">
                    <span>Or run brew command:</span>
                    <button onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")} className="text-[#8b84ff] hover:text-white transition-colors cursor-pointer">
                      {copiedMac ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                  <code className="text-[#8b84ff] font-mono select-all break-all bg-white/2 p-1.5 rounded border border-white/4 block text-[10px]">brew install AIEraDev/tap/clypra</code>
                </div>
              </div>
            </div>

            {/* Windows MSI Card */}
            <div className="glass-panel win-card rounded-2xl p-7 flex flex-col gap-6 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full filter blur-xl transition-all duration-500 group-hover:bg-cyan-500/10" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <h4 className="font-bold text-white text-xl">Windows</h4>
                  <p className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase mt-0.5">x64 MSI Installer (.msi)</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                  <Monitor className="w-5 h-5" />
                </div>
              </div>

              <ul className="text-xs text-[#a1a1aa] flex flex-col gap-3 list-none p-0 my-2 grow">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Hardware-accelerated rendering and video scaling.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Packaged with pre-compiled high performance libraries.</span>
                </li>
              </ul>

              <div className="mt-auto pt-5 border-t border-white/4 z-10">
                <a href="https://github.com/AIEraDev/clypra/releases/latest" target="_blank" rel="noopener noreferrer" className="w-full h-12 rounded-xl bg-white/3 hover:bg-white/[0.07] border border-white/6 hover:border-white/12 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(6,182,212,0.15)]">
                  <Download className="w-4 h-4" />
                  Download for Windows
                </a>
              </div>
            </div>

            {/* Linux AppImage Card */}
            <div className="glass-panel linux-card rounded-2xl p-7 flex flex-col gap-6 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full filter blur-xl transition-all duration-500 group-hover:bg-emerald-500/10" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <h4 className="font-bold text-white text-xl">Linux</h4>
                  <p className="text-[10px] text-emerald-400 font-mono tracking-wider uppercase mt-0.5">x64 AppImage (.AppImage)</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/3 border border-white/6 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <Terminal className="w-5 h-5" />
                </div>
              </div>

              <ul className="text-xs text-[#a1a1aa] flex flex-col gap-3 list-none p-0 my-2 grow">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Sandbox-compatible executable with no installation needed.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Lightweight distribution compatible with major distros.</span>
                </li>
              </ul>

              <div className="mt-auto pt-5 border-t border-white/4 z-10">
                <a href="https://github.com/AIEraDev/clypra/releases/latest" target="_blank" rel="noopener noreferrer" className="w-full h-12 rounded-xl bg-white/3 hover:bg-white/[0.07] border border-white/6 hover:border-white/12 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(16,185,129,0.15)]">
                  <Download className="w-4 h-4" />
                  Download for Linux
                </a>
              </div>
            </div>

            {/* Clypra Mobile Teaser Banner */}
            <div className="glass-panel rounded-2xl p-8 md:p-10 flex flex-col lg:flex-row gap-8 items-center justify-between transition-all duration-500 hover:border-[#6c63ff]/30 hover:shadow-[0_0_35px_rgba(108,99,255,0.1)] relative overflow-hidden group mt-4 col-span-1 md:col-span-3">
              {/* Glow effect */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#6c63ff]/5 rounded-full filter blur-3xl transition-all duration-500 group-hover:bg-[#6c63ff]/10" />
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-pink-500/3 rounded-full filter blur-3xl transition-all duration-500 group-hover:bg-pink-500/6" />

              <div className="flex flex-col gap-4 text-left max-w-2xl z-10">
                <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full border border-pink-500/20 bg-pink-500/10 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-wider text-pink-400 uppercase font-mono">Mobile Development</span>
                </div>

                <h4 className="font-extrabold text-white text-2xl md:text-3xl font-outfit">
                  Clypra Mobile <span className="bg-linear-to-r from-pink-400 to-[#8b84ff] bg-clip-text text-transparent shimmer-bg">Coming Soon</span>
                </h4>

                <p className="text-xs md:text-sm text-[#a1a1aa] leading-relaxed">We are actively bringing the desktop-class native performance of Clypra to your pocket. Built on the brand-new Tauri v2 mobile core, Clypra Mobile will deliver lightning-fast, GPU-accelerated video editing directly on iOS and Android with local-first project portability.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Tauri Mobile Core</span>
                      <span className="text-[10px] text-[#666]">Native Rust performance</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Touch-Optimized NLE</span>
                      <span className="text-[10px] text-[#666]">Intuitive gesture timeline</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Local Portability</span>
                      <span className="text-[10px] text-[#666]">Seamless edit handover</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full sm:w-auto lg:w-72 justify-center items-stretch z-10">
                {/* iOS coming soon */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/2 border border-white/4 relative group/item hover:bg-white/4 hover:border-white/8 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-white/3 border border-white/6 flex items-center justify-center text-white text-lg font-bold"></div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">iOS App Store</span>
                    <span className="text-[9px] text-[#666] font-mono tracking-wide uppercase mt-0.5">For iPhone and iPad</span>
                  </div>
                  <div className="absolute right-4 top-4 text-[8px] font-semibold text-[#8b84ff] bg-[#8b84ff]/10 border border-[#8b84ff]/20 px-1.5 py-0.5 rounded uppercase font-mono">Coming Soon</div>
                </div>

                {/* Android coming soon */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white/2 border border-white/4 relative group/item hover:bg-white/4 hover:border-white/8 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-white/3 border border-white/6 flex items-center justify-center text-[#8b84ff]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">Google Play Store</span>
                    <span className="text-[9px] text-[#666] font-mono tracking-wide uppercase mt-0.5">For Android Devices</span>
                  </div>
                  <div className="absolute right-4 top-4 text-[8px] font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded uppercase font-mono">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Detailed Installation Bypass Guidelines ──────────────── */}
        <section className="flex flex-col gap-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6c63ff]/10 flex items-center justify-center text-[#8b84ff]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-outfit">Installation Assistant</h4>
                <p className="text-xs text-[#a1a1aa]">How to bypass system Gatekeeper & SmartScreen security controls</p>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex bg-[#0c0c10] border border-white/3 p-1 rounded-xl">
              <button onClick={() => setActiveTab("mac")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === "mac" ? "bg-[#6c63ff] text-white" : "text-[#a1a1aa] hover:text-white"}`}>
                macOS
              </button>
              <button onClick={() => setActiveTab("win")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === "win" ? "bg-cyan-500/80 text-white" : "text-[#a1a1aa] hover:text-white"}`}>
                Windows
              </button>
              <button onClick={() => setActiveTab("linux")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === "linux" ? "bg-emerald-500/80 text-white" : "text-[#a1a1aa] hover:text-white"}`}>
                Linux
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Steps Left Panel */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div onClick={() => setActiveTab("mac")} className={`p-5 rounded-2xl transition-all duration-300 border cursor-pointer ${activeTab === "mac" ? "bg-[#6c63ff]/5 border-[#6c63ff]/20 text-white" : "bg-white/1 border-transparent opacity-65 hover:opacity-90"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono text-[#8b84ff]">01</span>
                  <h5 className="font-bold text-sm">macOS Gatekeeper Bypass</h5>
                </div>
                <p className="text-xs text-[#a1a1aa] leading-relaxed pl-9">Drag the downloaded DMG application to your Applications folder, Control-click (Right-click) the Clypra icon, and select **Open** to authorize developer execution.</p>
              </div>

              <div onClick={() => setActiveTab("win")} className={`p-5 rounded-2xl transition-all duration-300 border cursor-pointer ${activeTab === "win" ? "bg-cyan-500/5 border-cyan-500/20 text-white" : "bg-white/1 border-transparent opacity-65 hover:opacity-90"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono text-cyan-400">02</span>
                  <h5 className="font-bold text-sm">Windows SmartScreen</h5>
                </div>
                <p className="text-xs text-[#a1a1aa] leading-relaxed pl-9">Windows may warn that Clypra is unrecognized. Click **More Info** in the SmartScreen dialogue, and choose **Run Anyway** to execute.</p>
              </div>

              <div onClick={() => setActiveTab("linux")} className={`p-5 rounded-2xl transition-all duration-300 border cursor-pointer ${activeTab === "linux" ? "bg-emerald-500/5 border-emerald-500/20 text-white" : "bg-white/1 border-transparent opacity-65 hover:opacity-90"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono text-emerald-400">03</span>
                  <h5 className="font-bold text-sm">Linux Executable Rights</h5>
                </div>
                <p className="text-xs text-[#a1a1aa] leading-relaxed pl-9">Make the downloaded `.AppImage` file executable via permissions tab or terminal, then run immediately.</p>
              </div>
            </div>

            {/* Terminal Widget Right Panel */}
            <div className="lg:col-span-7">
              <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                {/* Header bar of window */}
                <div className="bg-[#0b0b0e] px-5 py-3.5 flex items-center justify-between border-b border-white/3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444] opacity-80" />
                    <div className="w-3 h-3 rounded-full bg-[#eab308] opacity-80" />
                    <div className="w-3 h-3 rounded-full bg-[#22c55e] opacity-80" />
                  </div>
                  <span className="text-[10px] font-mono text-[#666]">bash - installation_helper</span>
                  <div className="w-10" />
                </div>

                {/* Body of window depending on active tab */}
                <div className="p-6 font-mono text-xs text-left min-h-[220px] flex flex-col justify-between bg-[#060608]/90">
                  {activeTab === "mac" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-[#666] select-none">$ </span>
                        <span className="text-neutral-300"># Install Clypra globally via Homebrew Tap</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/1 p-3 rounded-lg border border-white/3">
                        <code className="text-[#8b84ff] select-all break-all">brew install AIEraDev/tap/clypra</code>
                        <button onClick={() => copyToClipboard("brew install AIEraDev/tap/clypra", "mac")} className="text-[#666] hover:text-white transition-colors p-1">
                          {copiedMac ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[#666] leading-relaxed text-[11px]">Homebrew automatically builds the architecture package for your CPU (ARM64 M1/M2/M3 or Intel x86_64) and verifies dependencies.</div>
                    </div>
                  )}

                  {activeTab === "win" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-[#666] select-none">&gt; </span>
                        <span className="text-neutral-300">rem Open PowerShell and install desktop package</span>
                      </div>
                      <div className="bg-white/1 p-4 rounded-lg border border-white/3 text-cyan-400 leading-relaxed text-[11px]">
                        Double click "clypra_1.0.1_x64_en-US.msi"
                        <br />
                        ↳ Click "More Info"
                        <br />↳ Click "Run Anyway" to bypass MS protection.
                      </div>
                      <div className="text-[#666] leading-relaxed text-[11px]">Windows binary installs full media codec filters and registers native window processes.</div>
                    </div>
                  )}

                  {activeTab === "linux" && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[#666] select-none">$ </span>
                        <span className="text-neutral-300"># Authorize application execution permissions</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/1 p-3 rounded-lg border border-white/3">
                        <code className="text-emerald-400 select-all break-all">chmod +x Clypra*.AppImage && ./Clypra*.AppImage</code>
                        <button onClick={() => copyToClipboard("chmod +x Clypra*.AppImage && ./Clypra*.AppImage", "linux")} className="text-[#666] hover:text-white transition-colors p-1">
                          {copiedLinux ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[#666] leading-relaxed text-[11px]">Or right-click AppImage → Properties → Permissions → Allow executing file as program.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key Editor Features ────────────────────────────────── */}
        <section className="flex flex-col gap-12 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="text-center flex flex-col gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-outfit">Core NLE Platform Architecture</h3>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-lg mx-auto">Clypra features premium architectural layers that rival industry-standard desktop non-linear editors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-panel rounded-2xl p-6 hover:border-white/8 transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#6c63ff]/2 rounded-bl-full filter blur-lg transition-all duration-500 group-hover:bg-[#6c63ff]/5" />
              <div className="w-12 h-12 rounded-xl bg-[#6c63ff]/10 flex items-center justify-center text-[#8b84ff] border border-[#6c63ff]/15 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Infinite Multi-Track Sequencing</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mt-2">Arrange and sequence video, audio, text, and visual overlays on layers with clean, responsive drag-and-drop clips and snap-to-edge alignment precision.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel rounded-2xl p-6 hover:border-white/8 transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/2 rounded-bl-full filter blur-lg transition-all duration-500 group-hover:bg-cyan-500/5" />
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/15 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">High-Performance Frame Renderer</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mt-2">A canvas-based, real-time render surface that accurately updates, scales, and renders visual clip layers using custom DPR scaling configurations.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel rounded-2xl p-6 hover:border-white/8 transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-bl-full filter blur-lg transition-all duration-500 group-hover:bg-emerald-500/5" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/15 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Preset-Driven FFmpeg Exporters</h4>
                <p className="text-xs text-[#a1a1aa] leading-relaxed mt-2">Redesigned premium video export flow featuring custom aspect presets (YouTube, TikTok, Instagram, Custom), project renaming, and animated SVG export progress circles.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-white/3 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666]">
          <div>© {new Date().getFullYear()} Clypra Contributors. Released under the MIT License.</div>
          <div className="flex items-center gap-6">
            <span>Built with Tauri, React & Rust</span>
            <a href="https://github.com/AIEraDev/clypra" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub Code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
