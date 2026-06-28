import { useEffect, lazy, Suspense } from "react";

import StudioApp from "./App";
import { WebShowcase } from "./components/screens/WebShowcase";
import { EffectGraphSandbox } from "./components/EffectGraphSandbox";

const TemplateWorkspace = lazy(() => import("./components/TemplateWorkspace").then((m) => ({ default: m.TemplateWorkspace })));
const AdminEffectsPanel = lazy(() => import("./components/effects/video/AdminEffectsPanel").then((m) => ({ default: m.AdminEffectsPanel })));

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
  adminEffects: {
    canonical: "https://clypra.abdulkabirmusa.com/admin/effects",
    description: "Moderator portal for reviewing generated AI effects.",
    title: "AI Effects Moderator Portal",
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

function isAdminEffectsRoute(pathname: string) {
  return pathname === "/admin/effects" || pathname.startsWith("/admin/effects");
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
  const adminEffectsRoute = isAdminEffectsRoute(pathname);
  const studioRoute = !effectsRoute && !adminEffectsRoute && isStudioRoute(pathname);
  const lottieRoute = isLottieRoute(pathname);
  const metadata = lottieRoute 
    ? ROUTE_METADATA.lottie 
    : effectsRoute 
      ? ROUTE_METADATA.effects 
      : adminEffectsRoute
        ? ROUTE_METADATA.adminEffects
        : studioRoute 
          ? ROUTE_METADATA.studio 
          : ROUTE_METADATA.showcase;

  // Normalise /studio/* → /studio (preserve ?q= param) unless it's effects sandbox
  useEffect(() => {
    const p = window.location.pathname;
    if (p.startsWith("/studio") && p !== "/studio" && p !== "/studio/effects") {
      window.history.replaceState({}, "", `/studio${window.location.search}`);
    }
  }, []);

  // Set page scroll styles based on current route
  useEffect(() => {
    if (studioRoute || lottieRoute) {
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
  }, [studioRoute, lottieRoute]);

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

  if (effectsRoute) {
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
              onClick={() => { window.location.href = "/studio"; }} 
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

  return studioRoute ? <StudioApp /> : <WebShowcase />;
}
