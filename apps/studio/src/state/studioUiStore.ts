import { createStore } from "@tanstack/react-store";

export type StudioPanelTab = "engine" | "definition" | "lab";

export interface StudioUiState {
  activeTab: StudioPanelTab;
  selectedLayerId: string | null;
  uiMode: "basic" | "advanced";
}

export const studioUiStore = createStore<StudioUiState>({
  activeTab: "definition",
  selectedLayerId: null,
  uiMode: "basic",
});
