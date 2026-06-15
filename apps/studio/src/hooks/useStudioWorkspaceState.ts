import { useCallback, useEffect, useState } from "react";
import type { RailItem } from "../components/StudioChrome";

export type StudioPanelTab = "engine" | "definition" | "lab";

// ─── URL helpers ─────────────────────────────────────────────────────────────

const VALID_RAIL_ITEMS: RailItem[] = ["templates", "style", "layers", "audio", "stickers", "overlays", "effects", "export"];

function getRailItemFromQuery(): RailItem {
  const q = new URLSearchParams(window.location.search).get("q") as RailItem | null;
  if (q && VALID_RAIL_ITEMS.includes(q)) return q;
  return "templates";
}

function buildQueryUrl(item: RailItem): string {
  const url = new URL(window.location.href);
  url.pathname = "/studio";
  url.searchParams.set("q", item);
  return url.pathname + url.search;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioWorkspaceState() {
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");

  const [activeRailItem, setActiveRailItemState] = useState<RailItem>(() => getRailItemFromQuery());

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioPanelTab>("engine");

  // On mount: if ?q= is missing, write the default into the URL without a history entry
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("q")) {
      window.history.replaceState({ q: "templates" }, "", buildQueryUrl("templates"));
    }
  }, []);

  // Sync state when user navigates back/forward
  useEffect(() => {
    const handlePopState = () => {
      const item = getRailItemFromQuery();
      setActiveRailItemState(item);
      if (item === "layers") setUiMode("advanced");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Write ?q= to URL and update state
  const setActiveRailItem = useCallback((item: RailItem) => {
    setActiveRailItemState(item);
    if (item === "layers") setUiMode("advanced");
    window.history.pushState({ q: item }, "", buildQueryUrl(item));
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
