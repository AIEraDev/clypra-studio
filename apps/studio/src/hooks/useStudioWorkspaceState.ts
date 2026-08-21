import { useCallback, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import { useLocation, useNavigate } from "react-router-dom";
import { isRailItem, railItemFromPathname, railItemPath, type RailItem } from "../app/studioRoutes";
import { studioUiStore, type StudioPanelTab } from "../state/studioUiStore";

export type { StudioPanelTab } from "../state/studioUiStore";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioWorkspaceState() {
  const location = useLocation();
  const navigate = useNavigate();
  const uiMode = useStore(studioUiStore, (state) => state.uiMode);
  const selectedLayerId = useStore(
    studioUiStore,
    (state) => state.selectedLayerId,
  );
  // Native Clypra Spec is the canonical export surface. Engine code remains
  // available as generated output, but is no longer a primary workspace tab.
  const activeTab = useStore(studioUiStore, (state) => state.activeTab);

  const setUiMode = useCallback(
    (nextMode: "basic" | "advanced") => {
      studioUiStore.setState((state) => ({ ...state, uiMode: nextMode }));
    },
    [],
  );
  const setSelectedLayerId = useCallback((layerId: string | null) => {
    studioUiStore.setState((state) => ({ ...state, selectedLayerId: layerId }));
  }, []);
  const setActiveTab = useCallback((tab: StudioPanelTab) => {
    studioUiStore.setState((state) => ({ ...state, activeTab: tab }));
  }, []);

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
