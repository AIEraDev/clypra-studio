import { useEffect, lazy, Suspense } from "react";

import StudioApp from "./App";
import { WebShowcase } from "./components/screens/WebShowcase";

const TemplateWorkspace = lazy(() => import("./components/TemplateWorkspace").then((m) => ({ default: m.TemplateWorkspace })));

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
    description: "Professional Lottie animation editor and template creator. Design, customize, and publish Lottie templates with advanced layer controls, keyframe animation, and GitHub integration.",
    title: "Clypra Lottie Studio - Animation Template Editor",
  },
};

function isStudioRoute(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio");
}

function isLottieRoute(pathname: string) {
  return pathname === "/lottie" || pathname.startsWith("/lottie");
}

function upsertMeta(selector: string, attr: "content" | "href", value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

export default function RootApp() {
  const { pathname } = window.location;
  const studioRoute = isStudioRoute(pathname);
  const lottieRoute = isLottieRoute(pathname);
  const metadata = lottieRoute ? ROUTE_METADATA.lottie : studioRoute ? ROUTE_METADATA.studio : ROUTE_METADATA.showcase;

  // Normalise /studio/* → /studio (preserve ?q= param)
  useEffect(() => {
    const p = window.location.pathname;
    if (p.startsWith("/studio") && p !== "/studio") {
      window.history.replaceState({}, "", `/studio${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    const isApp = studioRoute || lottieRoute;
    document.body.style.overflow = isApp ? "hidden" : "auto";
    document.documentElement.style.overflow = isApp ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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

  if (lottieRoute) {
    return (
      <div className="flex flex-col h-screen bg-[#0E0E12]" style={{ fontFamily: "Inter, sans-serif" }}>
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C6FFF] mx-auto mb-4" />
                <p className="text-sm text-gray-400">Loading Lottie Studio...</p>
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
