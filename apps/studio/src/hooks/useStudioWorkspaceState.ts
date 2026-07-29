import { useCallback, useEffect, useState } from "react";
import type { RailItem } from "../components/StudioChrome";

export type StudioPanelTab = "engine" | "definition" | "lab";

// ─── Clean URL & Path Helpers ──────────────────────────────────────────────

const VALID_RAIL_ITEMS: RailItem[] = [
  "text-effects",
  "audio",
  "stickers",
  "overlays",
  "video-effects",
  "body-effects",
  "filters",
  "transitions",
  "admin",
  "labs",
];

function getRailItemFromLocation(): RailItem {
  const pathname = window.location.pathname;

  // 1. Match clean canonical path URLs (e.g. /studio/labs -> labs)
  if (pathname.startsWith("/studio/")) {
    const sub = pathname.replace(/^\/studio\//, "").split("/")[0] as RailItem;
    if (VALID_RAIL_ITEMS.includes(sub)) return sub;
  }

  // 2. Transform legacy query parameters (e.g. /studio?q=labs) into clean path URLs without page refresh
  const q = new URLSearchParams(window.location.search).get("q") as RailItem | null;
  if (q && VALID_RAIL_ITEMS.includes(q)) {
    const cleanUrl = q === "text-effects" ? "/studio" : `/studio/${q}`;
    window.history.replaceState({}, "", cleanUrl);
    return q;
  }

  return "text-effects";
}

function buildCleanUrl(item: RailItem): string {
  if (item === "text-effects") return "/studio";
  return `/studio/${item}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioWorkspaceState() {
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");

  const [activeRailItem, setActiveRailItemState] = useState<RailItem>(() => getRailItemFromLocation());

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioPanelTab>("engine");

  // Sync state when user navigates back/forward via browser history
  useEffect(() => {
    const handlePopState = () => {
      const item = getRailItemFromLocation();
      setActiveRailItemState(item);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Write clean canonical path URL (e.g. /studio/labs) and update state
  const setActiveRailItem = useCallback((item: RailItem) => {
    setActiveRailItemState(item);
    window.history.pushState({ railItem: item }, "", buildCleanUrl(item));
  }, []);

  return {
    activeRailItem,
    activeTab,
    selectedLayerId,
    setActiveRailItem,
    setActiveTab,
    setSelectedLayerId,
    setUiMode,
    uiMode,
  };
}
