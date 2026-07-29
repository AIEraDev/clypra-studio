import { useEffect, lazy, Suspense } from "react";

import StudioApp from "./App";
import { WebShowcase } from "./components/screens/WebShowcase";
import { EffectGraphSandbox } from "./components/EffectGraphSandbox";
import { MPGPlayground } from "./components/MPGPlayground";

const TemplateWorkspace = lazy(() => import("./components/TemplateWorkspace").then((m) => ({ default: m.TemplateWorkspace })));

// Labs
const VideoLabView = lazy(() => import("./labs/video").then((m) => ({ default: m.VideoLabView })));
const TransitionLabView = lazy(() => import("./labs/transition").then((m) => ({ default: m.TransitionLabView })));
const BodyLabView = lazy(() => import("./labs/body").then((m) => ({ default: m.BodyLabView })));
const FilterLabView = lazy(() => import("./labs/filter").then((m) => ({ default: m.FilterLabView })));
const ColorGradingLabView = lazy(() => import("./labs/color-grading").then((m) => ({ default: m.ColorGradingLabView })));
const StudioMasterLabView = lazy(() => import("./labs/studio-master").then((m) => ({ default: m.StudioMasterLabView })));

const ROUTE_METADATA = {
  showcase: {
    canonical: "https://clypra.abdulkabirmusa.com/",
    description: "A modern, high-performance video editor engineered using Tauri, React, and Rust, with a professional NLE timeline, hardware acceleration, visual asset pools, and AI-assisted Clypra Studio text effects.",
    title: "Clypra - A Premium Video Editor",
  },
  studio: {
    canonical: "https://clypra.abdulkabirmusa.com/studio",
    description: "Design, generate, preview, animate, and export high-performance Canvas 2D text effects with gradients, bevels, glow stacks, shadows, procedural engines, and Clypra editor-ready code.",
    title: "Clypra Studio - AI Text Effects & Creative Editor",
  },
  studioMaster: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/master",
    description: "Clypra Studio Master Harness - High-performance WebGPU rendering, Wasm SIMD audio spectrum baking, multi-segment keyframe curves, and 144Hz WebCodecs MP4 exporter.",
    title: "Clypra Studio Master Laboratory",
  },
  lottie: {
    canonical: "https://clypra.abdulkabirmusa.com/lottie",
    description: "Professional text animation editor and template creator. Design, customize, and publish templates with advanced layer controls, keyframe animation, and GitHub integration.",
    title: "Clypra Text Templates - Animation Template Editor",
  },
  effects: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/effects",
    description: "Sandbox for testing effect graphs and WebGL engine execution.",
    title: "Clypra Studio - Effect Graph Sandbox",
  },
  mpg: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/mpg",
    description: "MPG Filter Lab — design V2 effect stacks from scratch, test live, and publish to R2 for Clypra Editor.",
    title: "Clypra Studio - MPG Filter Lab",
  },
  videoLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/video-lab",
    description: "Video Effects Lab - Design, test, and publish single-input video effects with the unified runtime.",
    title: "Clypra Studio - Video Lab",
  },
  transitionLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/transition-lab",
    description: "Transition Lab - Design, test, and publish dual-input transition effects with the unified runtime.",
    title: "Clypra Studio - Transition Lab",
  },
  bodyLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/body-lab",
    description: "Body Lab - Design, test, and publish mask-based body effects with extensible feature providers.",
    title: "Clypra Studio - Body Lab",
  },
  filterLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/filter-lab",
    description: "Filter Lab - Design, test, and publish color grading presets and looks with GPU rendering pipeline.",
    title: "Clypra Studio - Filter Lab",
  },
  colorGrading: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/color-grading",
    description: "Color Grading Lab - Design, test, and publish direct GPU-based color grading manual adjustments using PixiJS.",
    title: "Clypra Studio - Color Grading Lab",
  },
};

function isStudioMasterRoute(pathname: string) {
  return pathname === "/studio/master" || pathname.startsWith("/studio/master") || pathname === "/studio-master" || pathname.startsWith("/studio-master");
}

function isStudioRoute(pathname: string) {
  return (pathname === "/studio" || pathname.startsWith("/studio")) && !isStudioMasterRoute(pathname);
}

function isLottieRoute(pathname: string) {
  return pathname === "/lottie" || pathname.startsWith("/lottie");
}

function isEffectsRoute(pathname: string) {
  return pathname === "/studio/effects" || pathname.startsWith("/studio/effects");
}

function isMPGRoute(pathname: string) {
  return pathname === "/studio/mpg" || pathname.startsWith("/studio/mpg");
}

function isVideoLabRoute(pathname: string) {
  return pathname === "/studio/video-lab" || pathname.startsWith("/studio/video-lab") || pathname === "/video-lab" || pathname.startsWith("/video-lab");
}

function isTransitionLabRoute(pathname: string) {
  return pathname === "/studio/transition-lab" || pathname.startsWith("/studio/transition-lab") || pathname === "/transition-lab" || pathname.startsWith("/transition-lab");
}

function isBodyLabRoute(pathname: string) {
  return pathname === "/studio/body-lab" || pathname.startsWith("/studio/body-lab") || pathname === "/body-lab" || pathname.startsWith("/body-lab");
}

function isFilterLabRoute(pathname: string) {
  return pathname === "/studio/filter-lab" || pathname.startsWith("/studio/filter-lab") || pathname === "/filter-lab" || pathname.startsWith("/filter-lab");
}

function isColorGradingRoute(pathname: string) {
  return pathname === "/studio/color-grading" || pathname.startsWith("/studio/color-grading");
}

function upsertMeta(selector: string, attr: "content" | "href", value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

function checkIsAdmin(): boolean {
  try {
    const token = localStorage.getItem("clypra_auth_token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !!payload.isAdmin;
  } catch (e) {
    return false;
  }
}

export default function RootApp() {
  const { pathname } = window.location;
  const effectsRoute = isEffectsRoute(pathname);
  const mpgRoute = isMPGRoute(pathname);
  const videoLabRoute = isVideoLabRoute(pathname);
  const transitionLabRoute = isTransitionLabRoute(pathname);
  const bodyLabRoute = isBodyLabRoute(pathname);
  const filterLabRoute = isFilterLabRoute(pathname);
  const colorGradingRoute = isColorGradingRoute(pathname);
  const studioRoute = !effectsRoute && !mpgRoute && !videoLabRoute && !transitionLabRoute && !bodyLabRoute && !filterLabRoute && !colorGradingRoute && isStudioRoute(pathname);
  const lottieRoute = isLottieRoute(pathname);
  const metadata = lottieRoute ? ROUTE_METADATA.lottie : mpgRoute ? ROUTE_METADATA.mpg : effectsRoute ? ROUTE_METADATA.effects : videoLabRoute ? ROUTE_METADATA.videoLab : transitionLabRoute ? ROUTE_METADATA.transitionLab : bodyLabRoute ? ROUTE_METADATA.bodyLab : filterLabRoute ? ROUTE_METADATA.filterLab : colorGradingRoute ? ROUTE_METADATA.colorGrading : studioRoute ? ROUTE_METADATA.studio : ROUTE_METADATA.showcase;

  // Clean URL handling: preserve exact canonical route paths without unwanted redirects
  useEffect(() => {
    // Keep clean canonical URLs
  }, []);

  // Set page scroll styles based on current route
  useEffect(() => {
    if (studioRoute || lottieRoute || mpgRoute || videoLabRoute || transitionLabRoute || bodyLabRoute || filterLabRoute || colorGradingRoute) {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.overflowX = "hidden";
      document.documentElement.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
      document.body.style.overflowX = "hidden";
      document.documentElement.style.overflowY = "auto";
      document.documentElement.style.overflowX = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.overflowX = "";
      document.body.style.overflowY = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.overflowX = "";
      document.documentElement.style.overflowY = "";
    };
  }, [studioRoute, lottieRoute, mpgRoute, videoLabRoute, transitionLabRoute, bodyLabRoute, filterLabRoute, colorGradingRoute]);

  useEffect(() => {
    document.title = metadata.title;
    upsertMeta('meta[name="title"]', "content", metadata.title);
    upsertMeta('meta[name="description"]', "content", metadata.description);
    upsertMeta('meta[property="og:title"]', "content", metadata.title);
    upsertMeta('meta[property="og:description"]', "content", metadata.description);
    upsertMeta('meta[property="og:url"]', "content", metadata.canonical);
    upsertMeta('meta[name="twitter:title"]', "content", metadata.title);
    upsertMeta('meta[name="twitter:description"]', "content", metadata.description);
    upsertMeta('meta[name="twitter:url"]', "content", metadata.canonical);
    upsertMeta('link[rel="canonical"]', "href", metadata.canonical);
  }, [metadata]);

  if (mpgRoute) {
    if (!checkIsAdmin()) {
      return (
        <div className="flex flex-col h-screen bg-[#0E0E12] items-center justify-center text-white" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="text-center space-y-4 max-w-sm px-6">
            <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
            <p className="text-sm text-gray-400 font-medium">You must be logged in as an administrator to access the MPG Filter Lab.</p>
            <button
              onClick={() => {
                window.location.href = "/studio";
              }}
              className="px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded text-sm font-semibold transition-colors"
            >
              Go to Studio
            </button>
          </div>
        </div>
      );
    }
    return <MPGPlayground />;
  }

  if (effectsRoute) {
    if (!checkIsAdmin()) {
      return (
        <div className="flex flex-col h-screen bg-[#0E0E12] items-center justify-center text-white" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="text-center space-y-4 max-w-sm px-6">
            <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
            <p className="text-sm text-gray-400 font-medium">You must be logged in as an administrator to access the Filter Lab.</p>
            <button
              onClick={() => {
                window.location.href = "/studio";
              }}
              className="px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded text-sm font-semibold transition-colors"
            >
              Go to Studio
            </button>
          </div>
        </div>
      );
    }
    return <EffectGraphSandbox />;
  }

  if (lottieRoute) {
    return (
      <div className="flex flex-col h-screen bg-[#0E0E12]" style={{ fontFamily: "Inter, sans-serif" }}>
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C6FFF] mx-auto mb-4" />
                <p className="text-sm text-gray-400">Loading Text Templates...</p>
              </div>
            </div>
          }
        >
          <TemplateWorkspace onBackToDesign={() => (window.location.href = "/studio")} />
        </Suspense>
      </div>
    );
  }

  // Lab Routes
  if (videoLabRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#020617] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Video Lab...</p>
            </div>
          </div>
        }
      >
        <VideoLabView />
      </Suspense>
    );
  }

  if (transitionLabRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#020617] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Transition Lab...</p>
            </div>
          </div>
        }
      >
        <TransitionLabView />
      </Suspense>
    );
  }

  if (bodyLabRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#020617] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Body Lab...</p>
            </div>
          </div>
        }
      >
        <BodyLabView />
      </Suspense>
    );
  }

  if (filterLabRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#020617] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c6fff] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Filter Lab...</p>
            </div>
          </div>
        }
      >
        <FilterLabView />
      </Suspense>
    );
  }

  if (colorGradingRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#020617] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c6fff] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Color Grading...</p>
            </div>
          </div>
        }
      >
        <ColorGradingLabView />
      </Suspense>
    );
  }

  if (isStudioMasterRoute(pathname)) {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen bg-[#090D16] items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4" />
              <p className="text-sm text-gray-400">Loading Studio Master Laboratory...</p>
            </div>
          </div>
        }
      >
        <StudioMasterLabView />
      </Suspense>
    );
  }

  return studioRoute ? <StudioApp /> : <WebShowcase />;
}
