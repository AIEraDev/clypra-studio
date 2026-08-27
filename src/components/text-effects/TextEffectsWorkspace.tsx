import { lazy, Suspense, type MouseEvent, type RefObject } from "react";
import type {
  Preset,
  SceneDocument,
  TextEffectConfig,
} from "@clypra-studio/engine";
import { Cpu, Shield, Sparkles } from "lucide-react";
import { CompositionToolbar } from "../CompositionToolbar";
import { LabsPanel } from "../LabsPanel";
import { PreviewCanvas } from "../PreviewCanvas";
import { TextEffectCatalogPanel } from "../TextEffectCatalogPanel";
import type { RailItem } from "../../app/studioRoutes";
import { AdminSettingsTabs } from "./AdminSettingsTabs";
import { nativeAuroraPreset } from "../../samples/nativeAurora";

const InspectorPanel = lazy(() =>
  import("../InspectorPanel").then((module) => ({
    default: module.InspectorPanel,
  })),
);
const FontCompare = lazy(() =>
  import("../FontCompare").then((module) => ({ default: module.FontCompare })),
);

type ConfigUpdater =
  | Partial<TextEffectConfig>
  | ((config: TextEffectConfig) => TextEffectConfig);
type SceneUpdater =
  | SceneDocument
  | ((previous: SceneDocument) => SceneDocument);
type MobileTab = "controls" | "preview" | "code";
type NativePreviewState = "idle" | "rendering" | "ready" | "error";

export interface TextEffectsWorkspaceProps {
  activeRailItem: RailItem;
  isAdmin: boolean;
  isNarrow: boolean;
  isMobile: boolean;
  isTablet: boolean;
  mobileActiveTab: MobileTab;
  config: TextEffectConfig;
  scene: SceneDocument;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  effectiveZoom: number;
  zoom: number;
  zoomMode: "fit" | "manual";
  bgMode: "checkerboard" | "black";
  nativePreviewState: NativePreviewState;
  nativePreviewError: string | null;
  displayPresets: Preset[];
  activePresetId: string;
  selectedCategory: string;
  sortBy: "recency" | "name" | "category";
  selectedLayerId: string | null;
  uiMode: "basic" | "advanced";
  showFontCompare: boolean;
  collapsedSections: Record<string, boolean>;
  isGeneratingName: boolean;
  activeEffectId: string;
  onMobileTabChange: (tab: MobileTab) => void;
  onZoomChange: (zoom: number) => void;
  onZoomModeChange: (mode: "fit" | "manual") => void;
  onBgModeChange: (mode: "checkerboard" | "black") => void;
  onExport: () => void;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (id: string, event: MouseEvent) => void;
  onStartFromScratch: () => void;
  onSavePreset: () => void;
  onSelectedCategoryChange: (category: string) => void;
  onSortByChange: (sort: "recency" | "name" | "category") => void;
  onConfigChange: (patch: ConfigUpdater) => void;
  onSceneChange: (scene: SceneUpdater) => void;
  onSelectLayer: (layerId: string | null) => void;
  onPlayToggle?: () => void;
  onResetTimeline?: () => void;
  onTimeChange?: (time: number) => void;
  previewTime?: number;
  isPlaying?: boolean;
  onOpenFontCompare: () => void;
  onCloseFontCompare: () => void;
  onEffectiveZoomChange: (zoom: number) => void;
  onFitText: () => void;
  onToggleSection: (section: string) => void;
  onGenerateEffectName: () => void;
  onApplyCompositionPreset: (presetId: string) => void;
}

export function TextEffectsWorkspace({
  activeRailItem,
  isAdmin,
  isNarrow,
  isMobile,
  isTablet,
  mobileActiveTab,
  config,
  scene,
  canvasRef,
  effectiveZoom,
  zoom,
  zoomMode,
  bgMode,
  nativePreviewState,
  nativePreviewError,
  displayPresets,
  activePresetId,
  selectedCategory,
  sortBy,
  selectedLayerId,
  uiMode,
  showFontCompare,
  collapsedSections,
  isGeneratingName,
  activeEffectId,
  onMobileTabChange,
  onZoomChange,
  onZoomModeChange,
  onBgModeChange,
  onExport,
  onApplyPreset,
  onDeletePreset,
  onStartFromScratch,
  onSavePreset,
  onSelectedCategoryChange,
  onSortByChange,
  onConfigChange,
  onSceneChange,
  onSelectLayer,
  onPlayToggle,
  onResetTimeline,
  onTimeChange,
  previewTime,
  isPlaying,
  onOpenFontCompare,
  onCloseFontCompare,
  onEffectiveZoomChange,
  onFitText,
  onToggleSection,
  onGenerateEffectName,
  onApplyCompositionPreset,
}: TextEffectsWorkspaceProps) {
  return (
    <>
      {activeRailItem === "text-effects" && (
        <CompositionToolbar
          config={config}
          effectiveZoom={effectiveZoom}
          zoomMode={zoomMode}
          bgMode={bgMode}
          gpuState={nativePreviewState}
          gpuError={nativePreviewError}
          onZoomChange={onZoomChange}
          onZoomModeChange={onZoomModeChange}
          onBgModeChange={onBgModeChange}
          onExport={onExport}
        />
      )}

      {isNarrow && (
        <div
          id="mobile-views-tabbar"
          className="flex shrink-0 select-none border-b"
          style={{
            background: "var(--studio-panel)",
            borderColor: "var(--studio-border)",
          }}
        >
          {(["controls", "preview", "code"] as const).map((tab, index) => {
            const labels = ["Controls", "Preview", "Inspector"];
            const active = mobileActiveTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onMobileTabChange(tab)}
                className="relative flex-1 py-2.5 text-center text-[11px] font-bold transition-all"
                style={{
                  color: active
                    ? "var(--studio-accent)"
                    : "var(--studio-muted)",
                }}
              >
                {labels[index]}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                    style={{ background: "var(--studio-accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <main
        id="primary-workspace-layout"
        className="flex flex-1 overflow-hidden"
      >
        {activeRailItem === "admin" ? (
          <div className="min-w-0 flex-1 overflow-y-auto bg-[#0B0B10]">
            {isAdmin ? (
              <AdminSettingsTabs />
            ) : (
              <AccessDenied message="Only logged-in administrators are allowed to access the admin panel." />
            )}
          </div>
        ) : activeRailItem === "labs" ? (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0B0B10]">
            {isAdmin ? (
              <LabsPanel />
            ) : (
              <AccessDenied
                message="Only logged-in administrators are allowed to access the Labs."
                showBackLink
              />
            )}
          </div>
        ) : (
          <>
            <aside
              id="left-controls-panel"
              className={`${
                isNarrow && mobileActiveTab !== "controls" ? "hidden" : "flex"
              } ${
                isMobile ? "w-full" : isTablet ? "w-75" : "w-90"
              } shrink-0 select-none flex-col border-r border-(--studio-border) bg-(--studio-shell) ${
                activeRailItem === "text-effects"
                  ? "overflow-hidden"
                  : "overflow-y-auto"
              }`}
            >
              {activeRailItem === "text-effects" && (
                <div
                  className="flex min-h-0 flex-1 flex-col border-b"
                  style={{ borderColor: "var(--studio-border)" }}
                >
                  <TextEffectCatalogPanel
                    localPresets={displayPresets}
                    activePresetId={activePresetId}
                    selectedCategory={selectedCategory}
                    sortBy={sortBy}
                    onSelectedCategoryChange={onSelectedCategoryChange}
                    onSortByChange={onSortByChange}
                    onApplyPreset={onApplyPreset}
                    onDeletePreset={onDeletePreset}
                    onStartFromScratch={onStartFromScratch}
                    onSavePreset={onSavePreset}
                  />
                </div>
              )}
            </aside>

            <div
              className={`${
                isNarrow && mobileActiveTab !== "preview" ? "hidden" : "flex"
              } min-w-0 flex-1 flex-col`}
            >
              <PreviewCanvas
                canvasRef={canvasRef}
                config={config}
                bgMode={bgMode}
                zoom={zoom}
                zoomMode={zoomMode}
                onZoomChange={onZoomChange}
                onZoomModeChange={onZoomModeChange}
                onBgModeChange={onBgModeChange}
                onEffectiveZoomChange={onEffectiveZoomChange}
              />
              {showFontCompare && (
                <Suspense fallback={null}>
                  <FontCompare
                    config={config}
                    onSelectFont={(font) =>
                      onConfigChange({ fontFamily: font })
                    }
                    onClose={onCloseFontCompare}
                  />
                </Suspense>
              )}
            </div>

            <Suspense
              fallback={
                <aside
                  className={`${
                    isNarrow && mobileActiveTab !== "code" ? "hidden" : "flex"
                  } ${
                    isMobile ? "w-full" : "w-86"
                  } shrink-0 flex-col border-l border-(--studio-border) bg-(--studio-panel) p-4 text-xs text-(--studio-muted)`}
                >
                  Loading panel...
                </aside>
              }
            >
              <div
                className={`${
                  isNarrow && mobileActiveTab !== "code" ? "hidden" : "flex"
                } ${isMobile ? "w-full" : "w-86"} shrink-0`}
              >
                <InspectorPanel
                  config={config}
                  scene={scene}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={onSelectLayer}
                  onConfigChange={onConfigChange}
                  onSceneChange={onSceneChange}
                  onSavePreset={onSavePreset}
                  onStartFromScratch={onStartFromScratch}
                  onFitText={onFitText}
                  onOpenFontCompare={onOpenFontCompare}
                  activeEffectId={activeEffectId}
                  collapsedSections={collapsedSections}
                  isGeneratingName={isGeneratingName}
                  onToggleSection={onToggleSection}
                  onGenerateEffectName={onGenerateEffectName}
                  onApplyCompositionPreset={onApplyCompositionPreset}
                />
              </div>
            </Suspense>
          </>
        )}
      </main>
    </>
  );
}

function AccessDenied({
  message,
  showBackLink = false,
}: {
  message: string;
  showBackLink?: boolean;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-(--studio-muted)">
      <div className="max-w-md space-y-3">
        <Shield size={48} className="mx-auto text-red-500/50" />
        <h3 className="text-sm font-semibold text-white">
          Unauthorized Access
        </h3>
        <p className="text-xs text-(--studio-muted)">{message}</p>
        {showBackLink && (
          <a
            href="/studio/text-effects"
            className="mt-4 inline-block rounded bg-[#7C6FFF] px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#6B5EEE]"
          >
            Go to Text Effects
          </a>
        )}
      </div>
    </div>
  );
}
