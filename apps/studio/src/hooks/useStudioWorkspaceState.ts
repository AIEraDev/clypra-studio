import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isRailItem, railItemFromPathname, railItemPath, type RailItem } from "../app/studioRoutes";

export type StudioPanelTab = "engine" | "definition" | "lab";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioWorkspaceState() {
  const location = useLocation();
  const navigate = useNavigate();
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioPanelTab>("engine");

  const legacyQueryRailItem = useMemo(() => {
    const queryItem = new URLSearchParams(location.search).get("q");
    return isRailItem(queryItem) ? queryItem : null;
  }, [location.search]);

  const activeRailItem = useMemo(() => railItemFromPathname(location.pathname), [location.pathname]);

  // Normalize old /studio?q=... links through the router without a page reload.
  useEffect(() => {
    if (!legacyQueryRailItem) return;
    navigate(railItemPath(legacyQueryRailItem), { replace: true });
  }, [legacyQueryRailItem, navigate]);

  // Navigate through React Router so history, redirects, and route guards remain centralized.
  const setActiveRailItem = useCallback((item: RailItem) => {
    navigate(railItemPath(item));
  }, [navigate]);

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
