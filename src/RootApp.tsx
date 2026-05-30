import { useEffect } from "react";

import StudioApp from "./App";
import { WebShowcase } from "./components/screens/WebShowcase";

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
};

function isStudioRoute(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/studio/");
}

function upsertMeta(selector: string, attr: "content" | "href", value: string) {
  const element = document.head.querySelector(selector);
  if (element) {
    element.setAttribute(attr, value);
  }
}

export default function RootApp() {
  const studioRoute = isStudioRoute(window.location.pathname);
  const metadata = studioRoute ? ROUTE_METADATA.studio : ROUTE_METADATA.showcase;

  // Redirect /studio to /studio/design
  useEffect(() => {
    if (window.location.pathname === "/studio") {
      window.history.replaceState({}, "", "/studio/design");
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = studioRoute ? "hidden" : "auto";
    document.documentElement.style.overflow = studioRoute ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [studioRoute]);

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

  return studioRoute ? <StudioApp /> : <WebShowcase />;
}
