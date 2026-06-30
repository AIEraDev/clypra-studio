import { useEffect, lazy, Suspense } from "react";

import StudioApp from "./App";
import { WebShowcase } from "./components/screens/WebShowcase";
import { EffectGraphSandbox } from "./components/EffectGraphSandbox";
import { MPGPlayground } from "./components/MPGPlayground";

const TemplateWorkspace = lazy(() => import("./components/TemplateWorkspace").then((m) => ({ default: m.TemplateWorkspace })));
const AdminEffectsPanel = lazy(() => import("./components/effects/video/AdminEffectsPanel").then((m) => ({ default: m.AdminEffectsPanel })));

// Labs
const VideoLabView = lazy(() => import("./labs/video").then((m) => ({ default: m.VideoLabView })));
const TransitionLabView = lazy(() => import("./labs/transition").then((m) => ({ default: m.TransitionLabView })));
const BodyLabView = lazy(() => import("./labs/body").then((m) => ({ default: m.BodyLabView })));

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
  adminEffects: {
    canonical: "https://clypra.abdulkabirmusa.com/admin/effects",
    description: "Moderator portal for reviewing generated AI effects.",
    title: "AI Effects Moderator Portal",
  },
  videoLab: {
    canonical: "https://clypra.abdulkabirmusa.com/video-lab",
    description: "Video Effects Lab - Design, test, and publish single-input video effects with the unified runtime.",
    title: "Clypra Studio - Video Lab",
  },
  transitionLab: {
    canonical: "https://clypra.abdulkabirmusa.com/transition-lab",
    description: "Transition Lab - Design, test, and publish dual-input transition effects with the unified runtime.",
    title: "Clypra Studio - Transition Lab",
  },
  bodyLab: {
    canonical: "https://clypra.abdulkabirmusa.com/body-lab",
    description: "Body Lab - Design, test, and publish mask-based body effects with extensible feature providers.",
    title: "Clypra Studio - Body Lab",
  },
};

function isStudioRoute(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio");
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

function isAdminEffectsRoute(pathname: string) {
  return pathname === "/admin/effects" || pathname.startsWith("/admin/effects");
}

function isVideoLabRoute(pathname: string) {
  return pathname === "/video-lab" || pathname.startsWith("/video-lab");
}

function isTransitionLabRoute(pathname: string) {
  return pathname === "/transition-lab" || pathname.startsWith("/transition-lab");
}

function isBodyLabRoute(pathname: string) {
  return pathname === "/body-lab" || pathname.startsWith("/body-lab");
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
  const adminEffectsRoute = isAdminEffectsRoute(pathname);
  const videoLabRoute = isVideoLabRoute(pathname);
  const transitionLabRoute = isTransitionLabRoute(pathname);
  const bodyLabRoute = isBodyLabRoute(pathname);
  const studioRoute = !effectsRoute && !mpgRoute && !adminEffectsRoute && !videoLabRoute && !transitionLabRoute && !bodyLabRoute && isStudioRoute(pathname);
  const lottieRoute = isLottieRoute(pathname);
  const metadata = lottieRoute ? ROUTE_METADATA.lottie : mpgRoute ? ROUTE_METADATA.mpg : effectsRoute ? ROUTE_METADATA.effects : adminEffectsRoute ? ROUTE_METADATA.adminEffects : videoLabRoute ? ROUTE_METADATA.videoLab : transitionLabRoute ? ROUTE_METADATA.transitionLab : bodyLabRoute ? ROUTE_METADATA.bodyLab : studioRoute ? ROUTE_METADATA.studio : ROUTE_METADATA.showcase;

  // Normalise /studio/* → /studio (preserve ?q= param) unless it's effects sandbox or mpg playground
  useEffect(() => {
    const p = window.location.pathname;
    if (p.startsWith("/studio") && p !== "/studio" && p !== "/studio/effects" && p !== "/studio/mpg") {
      window.history.replaceState({}, "", `/studio${window.location.search}`);
    }
  }, []);

  // Set page scroll styles based on current route
  useEffect(() => {
    if (studioRoute || lottieRoute || mpgRoute || videoLabRoute || transitionLabRoute || bodyLabRoute) {
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
  }, [studioRoute, lottieRoute, mpgRoute, videoLabRoute, transitionLabRoute, bodyLabRoute]);

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

  if (adminEffectsRoute) {
    if (!checkIsAdmin()) {
      return (
        <div className="flex flex-col h-screen bg-[#0E0E12] items-center justify-center text-white" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="text-center space-y-4 max-w-sm px-6">
            <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
            <p className="text-sm text-gray-400 font-medium">You must be logged in as an administrator to access this area.</p>
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
    return (
      <Suspense fallback={<div className="text-white p-6">Loading Portal...</div>}>
        <AdminEffectsPanel />
      </Suspense>
    );
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

  return studioRoute ? <StudioApp /> : <WebShowcase />;
}
