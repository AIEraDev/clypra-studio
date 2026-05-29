import { useCallback, useState } from "react";

import type { RailItem, WorkspaceMode } from "../components/StudioChrome";

export type StudioPanelTab = "engine" | "definition" | "lab";

export function useStudioWorkspaceState() {
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("design");
  const [activeRailItem, setActiveRailItem] = useState<RailItem>("templates");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioPanelTab>("engine");

  const handleWorkspaceModeChange = useCallback((mode: WorkspaceMode) => {
    setWorkspaceMode(mode);

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
