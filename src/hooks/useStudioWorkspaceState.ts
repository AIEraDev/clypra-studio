import { useCallback, useEffect, useState } from "react";

import type { RailItem, WorkspaceMode } from "../components/StudioChrome";

export type StudioPanelTab = "engine" | "definition" | "lab";

// Parse workspace mode from URL
function getWorkspaceModeFromURL(): { mode: WorkspaceMode; isValid: boolean } {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);

  // /studio/design, /studio/animate, /studio/ai, /studio/export
  if (segments.length >= 2 && segments[0] === "studio") {
    const mode = segments[1];
    if (mode === "design" || mode === "animate" || mode === "ai" || mode === "export") {
      return { mode, isValid: true };
    }
    // Invalid mode found
    return { mode: "design", isValid: false };
  }

  return { mode: "design", isValid: true }; // default
}

export function useStudioWorkspaceState() {
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => {
    const { mode, isValid } = getWorkspaceModeFromURL();
    // Redirect invalid modes to /studio/design
    if (!isValid) {
      window.history.replaceState({}, "", "/studio/design");
    }
    return mode;
  });
  const [activeRailItem, setActiveRailItem] = useState<RailItem>("templates");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioPanelTab>("engine");

  // Sync URL with workspace mode on mount and browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const { mode, isValid } = getWorkspaceModeFromURL();

      // Redirect invalid modes
      if (!isValid) {
        window.history.replaceState({}, "", "/studio/design");
      }

      setWorkspaceMode(mode);

      // Update related states based on mode
      if (mode === "animate") {
        setUiMode("advanced");
        setActiveRailItem("layers");
      } else if (mode === "ai") {
        setActiveRailItem("ai");
        setActiveTab("lab");
      } else if (mode === "export") {
        setActiveTab("engine");
        setActiveRailItem("templates");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleWorkspaceModeChange = useCallback((mode: WorkspaceMode) => {
    setWorkspaceMode(mode);

    // Update URL without page reload
    const newPath = `/studio/${mode}`;
    window.history.pushState({ mode }, "", newPath);

    if (mode === "animate") {
      setUiMode("advanced");
      setActiveRailItem("layers");
      return;
    }

    if (mode === "ai") {
      setActiveRailItem("ai");
      setActiveTab("lab");
      return;
    }

    if (mode === "export") {
      setActiveTab("engine");
      setActiveRailItem("templates");
      return;
    }

    setActiveRailItem((current) => (current === "ai" ? "templates" : current));
  }, []);

  return {
    activeRailItem,
    activeTab,
    handleWorkspaceModeChange,
    selectedLayerId,
    setActiveRailItem,
    setActiveTab,
    setSelectedLayerId,
    setUiMode,
    uiMode,
    workspaceMode,
  };
}
