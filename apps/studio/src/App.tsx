import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  ChevronDown,
  LayoutGrid,
  MoreHorizontal,
  Download,
  Undo2,
  Redo2,
  Sparkles,
  HelpCircle,
  Video,
  User,
  Shield,
  Cpu,
  X,
} from "lucide-react";

import { TextEffectConfig, Preset } from "@clypra-studio/engine";
import { defaultConfig, builtInPresets } from "@clypra-studio/engine";
import { nativeAuroraPreset } from "./samples/nativeAurora";
import {
  generateEngineClass,
  generateEffectDefinition,
  toKebabCase,
  toPascalCase,
  stripTypesToJS,
  generateHTMLFile,
  getEnrichedEffectName,
} from "./codeGenerator";
import { GOOGLE_FONTS, GOOGLE_FONTS_LINK } from "./constants";
import { TimelinePanel } from "./components/TimelinePanel";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { AdminPurgeSettings } from "./components/settings/AdminPurgeSettings";
import { AdminTransitionsSettings } from "./components/settings/AdminTransitionsSettings";
import { LabsPanel } from "./components/LabsPanel";
import {
  textEffectConfigToScene,
  sceneToConfig,
  evaluateScene,
  blendConfigs,
  type SceneDocument,
  downloadPngSequenceZip,
  downloadSceneWebM,
  getWebMFrameCount,
  isWebMExportSupported,
  parseHistorySnapshot,
  snapshotScene,
  computeTextLayout,
} from "@clypra-studio/engine";
import { getPresetScene } from "@clypra-studio/engine";
import { COMPOSITION_PRESETS } from "@clypra-studio/engine";
import { useCollapsibleSections } from "./hooks/useCollapsibleSections";
import { useResponsiveMobileTab } from "./hooks/useResponsiveMobileTab";
import { useStudioWorkspaceState } from "./hooks/useStudioWorkspaceState";
import {
  generateEffectName,
  performDeepResearch,
} from "./services/geminiService";
import { getStudioApiBaseUrl } from "./services/apiConfig";
import { getNativeLabClient } from "./services/nativeLabClient";
import { TextEffectCatalogPanel } from "./components/TextEffectCatalogPanel";
import { CompositionToolbar } from "./components/CompositionToolbar";

const FontCompare = lazy(() =>
  import("./components/FontCompare").then((module) => ({
    default: module.FontCompare,
  })),
);
const InspectorPanel = lazy(() =>
  import("./components/InspectorPanel").then((module) => ({
    default: module.InspectorPanel,
  })),
);
const ExportLabPanel = lazy(() =>
  import("./components/ExportLabPanel").then((module) => ({
    default: module.ExportLabPanel,
  })),
);
import type { EffectApiCategory } from "./components/ExportLabPanel";
const SavePresetModal = lazy(() =>
  import("./components/StudioModals").then((module) => ({
    default: module.SavePresetModal,
  })),
);
const TutorialModal = lazy(() =>
  import("./components/StudioModals").then((module) => ({
    default: module.TutorialModal,
  })),
);
import { LoginModal } from "./components/LoginModal";

// Global Fetch Interceptor to automatically inject Authorization header and handle 401s
if (
  typeof window !== "undefined" &&
  !(window as any).__clypra_fetch_intercepted__
) {
  (window as any).__clypra_fetch_intercepted__ = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const token = localStorage.getItem("clypra_auth_token");
    let modifiedInit = init;

    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url || "";

    const isClypraApi =
      urlStr.includes("clypra-worker-api.abdulkabirmusa.com") ||
      urlStr.includes("localhost:8787") ||
      urlStr.includes("127.0.0.1:8787") ||
      urlStr.startsWith("/");

    if (token && isClypraApi) {
      modifiedInit = init ? { ...init } : {};
      const headers = new Headers(modifiedInit.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      modifiedInit.headers = headers;
    }

    const response = await originalFetch.call(this, input, modifiedInit);

    // If unauthorized (401), clear local session and dispatch event (except on login/register endpoints)
    if (
      response.status === 401 &&
      isClypraApi &&
      !urlStr.includes("/auth/login") &&
      !urlStr.includes("/auth/register")
    ) {
      localStorage.removeItem("clypra_auth_token");
      window.dispatchEvent(new CustomEvent("clypra-unauthorized"));
    }

    return response;
  };
}

const CREATOR_SESSION_KEY = "clypra_studio_creator_session";

// Admin Settings Tabs Component
function AdminSettingsTabs() {
  const [activeTab, setActiveTab] = useState<"cache" | "transitions">("cache");

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Header */}
      <div className="border-b border-(--studio-border) bg-(--studio-panel) px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("cache")}
            className={`relative px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "cache"
                ? "text-white"
                : "text-(--studio-muted) hover:text-white"
            }`}
          >
            Cache Control
            {activeTab === "cache" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--studio-accent)" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("transitions")}
            className={`relative px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === "transitions"
                ? "text-white"
                : "text-(--studio-muted) hover:text-white"
            }`}
          >
            Transitions
            {activeTab === "transitions" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--studio-accent)" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "cache" ? (
          <AdminPurgeSettings />
        ) : (
          <AdminTransitionsSettings />
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Primary state configuration
  const [config, setConfig] = useState<TextEffectConfig>(defaultConfig);
  const [scene, setScene] = useState<SceneDocument>(() =>
    textEffectConfigToScene(defaultConfig),
  );
  const {
    activeRailItem,
    activeTab,
    selectedLayerId,
    setActiveRailItem,
    setActiveTab,
    setSelectedLayerId,
    setUiMode,
    uiMode,
  } = useStudioWorkspaceState();
  // Text styling and layer authoring live exclusively in the right Inspector.
  // Export is opened from the composition toolbar, so there is no secondary
  // export tab competing with the library or Inspector.
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const skipConfigToScene = useRef(false);

  // Custom localStorage presets
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("classic-ink");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recency" | "name" | "category">(
    "recency",
  );
  const [effectApiCategory, setEffectApiCategory] =
    useState<EffectApiCategory>("3d");

  // Interaction workspace states
  const [engineFormat, setEngineFormat] = useState<
    "ts" | "js" | "txt" | "html"
  >("ts");
  const [definitionFormat, setDefinitionFormat] = useState<
    "ts" | "json" | "txt" | "html"
  >("ts");
  const [bgMode, setBgMode] = useState<"checkerboard" | "black">(
    "checkerboard",
  );
  const [zoom, setZoom] = useState<number>(100);
  const [effectiveZoom, setEffectiveZoom] = useState<number>(100);
  const [zoomMode, setZoomMode] = useState<"fit" | "manual">("fit");
  // The text-design workspace is intentionally native-daemon-only so the
  // preview cannot silently diverge from the editor's native composition path.
  const [nativePreviewState, setNativePreviewState] = useState<
    "idle" | "rendering" | "ready" | "error"
  >("idle");
  const [nativePreviewError, setNativePreviewError] = useState<string | null>(
    null,
  );

  const nativePreviewGeneration = useRef(0);
  const nativePreviewAbort = useRef<AbortController | null>(null);
  const [showFontCompare, setShowFontCompare] = useState<boolean>(false);

  // Deep Design Research & Blending Lab states
  const [researchTopic, setResearchTopic] = useState<string>("");
  const [researchStatus, setResearchStatus] = useState<
    "idle" | "researching" | "completed" | "failed"
  >("idle");
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchResult, setResearchResult] = useState<{
    themeName: string;
    historicalContext: string;
    visualRules: string[];
    paletteDeconstruction: string[];
    config: TextEffectConfig;
    extensionCode: string;
  } | null>(null);

  // Preset blend state variables
  const [blendAId, setBlendAId] = useState<string>("classic-ink");
  const [blendBId, setBlendBId] = useState<string>("neon-crimson");
  const [blendRatio, setBlendRatio] = useState<number>(0.5);

  // User Authentication states
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    createdAt: string;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(!!payload.isAdmin);
    } catch (e) {
      setIsAdmin(false);
    }
  }, [token]);

  // Authenticate user on mount if token exists
  useEffect(() => {
    const storedToken = localStorage.getItem("clypra_auth_token");
    if (storedToken) {
      setToken(storedToken);
      const API_BASE_URL = getStudioApiBaseUrl();
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Token expired");
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch((err) => {
          console.warn("Auth check failed:", err);
          localStorage.removeItem("clypra_auth_token");
          setToken(null);
        });
    }
  }, []);

  // Listen for unauthorized events to trigger login modal
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setShowLoginModal(true);
    };
    window.addEventListener("clypra-unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("clypra-unauthorized", handleUnauthorized);
  }, []);

  // Handle click outside of user dropdown to close it
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener("click", handleDocumentClick);
    }
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [showUserDropdown]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem("clypra_auth_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("clypra_auth_token");
    setToken(null);
    setUser(null);
    setShowUserDropdown(false);
  };

  // Feedbacks
  const [copiedCodeFeedback, setCopiedCodeFeedback] = useState<boolean>(false);
  const [copiedImageFeedback, setCopiedImageFeedback] =
    useState<boolean>(false);
  const [isExportingWebM, setIsExportingWebM] = useState(false);
  const [webmExportError, setWebmExportError] = useState<string | null>(null);
  const webmExportSupported = useMemo(() => isWebMExportSupported(), []);
  const [customPresetName, setCustomPresetName] = useState<string>("");
  const [customPresetCategory, setCustomPresetCategory] =
    useState<string>("Classic");
  const [showSavePresetModal, setShowSavePresetModal] =
    useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [tutorialActiveTab, setTutorialActiveTab] =
    useState<string>("typography");
  const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);

  // Active Mobile View Tab (Controls | Preview | Code)
  const { mobileActiveTab, setMobileActiveTab, isMobile, isTablet, isNarrow } =
    useResponsiveMobileTab();
  const [isCreatorSessionLoaded, setIsCreatorSessionLoaded] = useState(false);
  const [creatorSaveStatus, setCreatorSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const creatorSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo / Redo history stacks
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSavedStateString = useRef<string>(
    JSON.stringify(textEffectConfigToScene(defaultConfig)),
  );
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Target canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Collapsible control sections state
  const { collapsedSections, toggleSection } = useCollapsibleSections();

  // Load custom presets and restore the main creator workspace session
  useEffect(() => {
    // Inject combined google fonts stylesheet on mount to warm cache
    const warmLink = document.createElement("link");
    warmLink.rel = "stylesheet";
    warmLink.href = GOOGLE_FONTS_LINK;
    document.head.appendChild(warmLink);

    const saved = localStorage.getItem("clypra_custom_presets");
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Could not parse saved presets", e);
      }
    }

    const restoreDefaultPreset = () => {
      const nextCfg = {
        ...defaultConfig,
        text: "MY TEXT",
        effectName: "Custom Effect",
        customRenderer: undefined,
      };
      const nextScene = textEffectConfigToScene(nextCfg);
      skipConfigToScene.current = true;
      setConfig(nextCfg);
      setScene(nextScene);
      setActivePresetId("scratch");
      lastSavedStateString.current = JSON.stringify(nextScene);
    };

    const savedSession = localStorage.getItem(CREATOR_SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const restoredScene =
          session.scene ||
          textEffectConfigToScene(session.config || defaultConfig);
        const restoredConfig = session.config || sceneToConfig(restoredScene);

        skipConfigToScene.current = true;
        setConfig(restoredConfig);
        setScene(restoredScene);
        setActivePresetId(session.activePresetId || "scratch");
        lastSavedStateString.current = JSON.stringify(restoredScene);

        if (session.ui) {
          if (session.ui.uiMode) setUiMode(session.ui.uiMode);
          // The active rail is route-owned. Restoring it from the editor
          // session would overwrite direct URLs such as /studio/admin with
          // the last creative workspace, usually /studio/text-effects.
          // `/studio/text-effects` is the dedicated lab entry point, so it
          // must always open its native effect library rather than inheriting
          // a previously selected publish/export view.
          setActiveTab("definition");
          if (session.ui.selectedLayerId !== undefined)
            setSelectedLayerId(session.ui.selectedLayerId);
          if (session.ui.mobileActiveTab)
            setMobileActiveTab(session.ui.mobileActiveTab);
        }

        if (session.exportSettings) {
          if (session.exportSettings.engineFormat)
            setEngineFormat(session.exportSettings.engineFormat);
          if (session.exportSettings.definitionFormat)
            setDefinitionFormat(session.exportSettings.definitionFormat);
        }

        if (session.preview) {
          if (session.preview.bgMode) setBgMode(session.preview.bgMode);
          if (typeof session.preview.zoom === "number")
            setZoom(session.preview.zoom);
          if (session.preview.zoomMode) setZoomMode(session.preview.zoomMode);
        }

        if (session.blend) {
          if (session.blend.blendAId) setBlendAId(session.blend.blendAId);
          if (session.blend.blendBId) setBlendBId(session.blend.blendBId);
          if (typeof session.blend.blendRatio === "number")
            setBlendRatio(session.blend.blendRatio);
        }

        if (session.library) {
          if (session.library.selectedCategory)
            setSelectedCategory(session.library.selectedCategory);
          if (session.library.sortBy) setSortBy(session.library.sortBy);
          if (session.library.effectApiCategory)
            setEffectApiCategory(session.library.effectApiCategory);
        }

        setCreatorSaveStatus("saved");
      } catch (e) {
        console.error("Could not parse saved creator session", e);
        restoreDefaultPreset();
      }
    } else {
      const savedActive = localStorage.getItem("clypra_active_session_config");
      if (savedActive) {
        try {
          const parsed = JSON.parse(savedActive);
          const restoredScene = textEffectConfigToScene(parsed);
          skipConfigToScene.current = true;
          setConfig(parsed);
          setScene(restoredScene);
          lastSavedStateString.current = JSON.stringify(restoredScene);
          const savedPresetId = localStorage.getItem("clypra_active_preset_id");
          if (savedPresetId) setActivePresetId(savedPresetId);
          setCreatorSaveStatus("saved");
        } catch (e) {
          console.error("Could not parse saved active config", e);
          restoreDefaultPreset();
        }
      } else {
        restoreDefaultPreset();
      }
    }

    setIsCreatorSessionLoaded(true);
    return () => {
      document.head.removeChild(warmLink);
    };
  }, []);

  // Sync effect names and kebab IDs
  const activeEffectId = toKebabCase(getEnrichedEffectName(config));
  const timelinePanelMode = uiMode;

  // Unified, filtered, and sorted presets
  const getPresetRecency = (preset: Preset) => {
    if (preset.createdAt) return preset.createdAt;
    if (preset.isCustom) {
      if (preset.id.startsWith("custom-")) {
        const value = parseInt(preset.id.replace("custom-", ""), 10);
        if (!isNaN(value)) return value;
      }
      return 1600000000000; // default for older customs
    }
    // For built-ins, find its index in builtInPresets to retain natural order.
    const builtInIndex = builtInPresets.findIndex((p) => p.id === preset.id);
    return 1000000 - (builtInIndex !== -1 ? builtInIndex : 0);
  };

  const displayPresets = useMemo(() => {
    let items = [
      ...customPresets.map((p) => ({ ...p, isCustom: true })),
      ...builtInPresets,
    ];

    // Filter by Category
    if (selectedCategory !== "All") {
      if (selectedCategory === "Saved") {
        items = items.filter((p) => p.isCustom);
      } else {
        items = items.filter((p) => p.category === selectedCategory);
      }
    }

    // Sort
    if (sortBy === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "category") {
      items.sort((a, b) => {
        const catA = a.category || "Classic";
        const catB = b.category || "Classic";
        if (catA === catB) {
          return a.name.localeCompare(b.name);
        }
        return catA.localeCompare(catB);
      });
    } else {
      // Recency (Newest First)
      items.sort((a, b) => getPresetRecency(b) - getPresetRecency(a));
    }

    return items;
  }, [customPresets, builtInPresets, selectedCategory, sortBy]);

  // Register Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Check if user is typing in an input field or contentEditable element
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).contentEditable === "true");

      if (!isInput) {
        // Space -> toggle play from the central timeline.
        if (e.key === " ") {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
        // Ctrl/Cmd + Z -> Undo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) triggerRedo();
          else triggerUndo();
        }
        // Ctrl/Cmd + Y -> Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
          e.preventDefault();
          triggerRedo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
          e.preventDefault();
          setShowExportModal(true);
        }
        if (e.key.toLowerCase() === "t") {
          setActiveRailItem("text-effects");
        }
        if (e.key.toLowerCase() === "e") {
          setActiveRailItem("text-effects");
        }
        if (e.key.toLowerCase() === "v") {
          setActiveRailItem("video-effects");
        }
        if (e.key.toLowerCase() === "a") {
          setShowExportModal(true);
        }
      }

      // Ctrl + C on code block container to copy
      const isCodeFocused = activeEl?.closest("#right-code-panel");
      if (
        isCodeFocused &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "c"
      ) {
        e.preventDefault();
        copyCodeToClipboard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, activeTab, activeRailItem, scene]);

  // Push state to undo-history securely (debounced) — SceneDocument is source of truth
  const pushHistoryState = (newScene: SceneDocument) => {
    const newStateStr = JSON.stringify(newScene);
    if (newStateStr === lastSavedStateString.current) return;

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      undoStack.current = [
        ...undoStack.current,
        lastSavedStateString.current,
      ].slice(-20);
      redoStack.current = [];
      lastSavedStateString.current = newStateStr;
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(false);
    }, 300);
  };

  const forceSaveHistoryImmediately = (sourceScene: SceneDocument) => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    const sourceStr = JSON.stringify(sourceScene);
    if (sourceStr === lastSavedStateString.current) return;

    undoStack.current = [
      ...undoStack.current,
      lastSavedStateString.current,
    ].slice(-20);
    redoStack.current = [];
    lastSavedStateString.current = sourceStr;
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(false);
  };

  const triggerUndo = () => {
    if (undoStack.current.length === 0) return;
    const previousStateStr = undoStack.current.pop()!;
    redoStack.current.push(snapshotScene(scene));

    try {
      const { scene: prevScene, config: prevConfig } =
        parseHistorySnapshot(previousStateStr);
      skipConfigToScene.current = true;
      setScene(prevScene);
      setConfig(prevConfig);
      lastSavedStateString.current = previousStateStr;
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRedo = () => {
    if (redoStack.current.length === 0) return;
    const nextStateStr = redoStack.current.pop()!;
    undoStack.current.push(snapshotScene(scene));

    try {
      const { scene: nextScene, config: nextConfig } =
        parseHistorySnapshot(nextStateStr);
      skipConfigToScene.current = true;
      setScene(nextScene);
      setConfig(nextConfig);
      lastSavedStateString.current = nextStateStr;
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Safe configuration modification
  const modifyConfig = (
    updater:
      | Partial<TextEffectConfig>
      | ((p: TextEffectConfig) => TextEffectConfig),
  ) => {
    setConfig((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

      // Handle auto-generation fonts or effects outside the updater to comply with pure-function paradigms
      setTimeout(() => pushHistoryState(textEffectConfigToScene(next)), 0);
      return next;
    });
  };

  const modifyScene = (
    updater: SceneDocument | ((prev: SceneDocument) => SceneDocument),
  ) => {
    setScene((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      skipConfigToScene.current = true;
      const cfg = sceneToConfig({ ...next, legacyConfig: sceneToConfig(next) });
      setConfig(cfg);
      setTimeout(() => pushHistoryState(next), 0);
      return next;
    });
  };

  useEffect(() => {
    if (skipConfigToScene.current) {
      skipConfigToScene.current = false;
      return;
    }
    setScene(textEffectConfigToScene(config));
  }, [config]);

  // Keep the full creator workspace matching across refresh reloads
  useEffect(() => {
    if (!isCreatorSessionLoaded) return;

    setCreatorSaveStatus("saving");
    if (creatorSaveTimeoutRef.current) {
      clearTimeout(creatorSaveTimeoutRef.current);
    }

    creatorSaveTimeoutRef.current = setTimeout(() => {
      try {
        const sessionData = {
          version: 1,
          savedAt: new Date().toISOString(),
          config,
          scene,
          activePresetId,
          ui: {
            uiMode,
            activeRailItem,
            activeTab,
            selectedLayerId,
            mobileActiveTab,
          },
          exportSettings: {
            engineFormat,
            definitionFormat,
          },
          preview: {
            bgMode,
            zoom,
            zoomMode,
          },
          blend: {
            blendAId,
            blendBId,
            blendRatio,
          },
          library: {
            selectedCategory,
            sortBy,
            effectApiCategory,
          },
        };

        localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify(sessionData));
        localStorage.setItem(
          "clypra_active_session_config",
          JSON.stringify(config),
        );
        localStorage.setItem("clypra_active_preset_id", activePresetId);
        setCreatorSaveStatus("saved");
      } catch (e) {
        console.error("Failed to sync creator session to localStorage", e);
        setCreatorSaveStatus("idle");
      }
    }, 500);

    return () => {
      if (creatorSaveTimeoutRef.current) {
        clearTimeout(creatorSaveTimeoutRef.current);
      }
    };
  }, [
    isCreatorSessionLoaded,
    config,
    scene,
    activePresetId,
    uiMode,
    activeRailItem,
    activeTab,
    selectedLayerId,
    mobileActiveTab,
    engineFormat,
    definitionFormat,
    bgMode,
    zoom,
    zoomMode,
    blendAId,
    blendBId,
    blendRatio,
    selectedCategory,
    sortBy,
    effectApiCategory,
  ]);

  // Animation preview loop
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPreviewTime((t) => {
        const duration = scene.timeline.duration || 2;
        let next = t + dt;
        if (scene.timeline.loop) next = duration > 0 ? next % duration : next;
        else next = Math.min(next, duration);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, scene.timeline.duration, scene.timeline.loop]);

  // Render every text-design frame through the local native lab daemon.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    nativePreviewAbort.current?.abort();
    const controller = new AbortController();
    nativePreviewAbort.current = controller;
    const generation = ++nativePreviewGeneration.current;
    setNativePreviewState("rendering");
    setNativePreviewError(null);

    // Set canvas dimensions first
    canvas.width = config.canvasWidth || 800;
    canvas.height = config.canvasHeight || 200;

    const draw = async () => {
      if (controller.signal.aborted) return;
      const w = config.canvasWidth || 800;
      const h = config.canvasHeight || 200;

      // The browser engine remains the authoring/input boundary. The native
      // daemon owns the final composition and readback, exactly like the
      // editor's native frame service.
      let off: HTMLCanvasElement | OffscreenCanvas;
      if (typeof OffscreenCanvas !== "undefined") {
        off = new OffscreenCanvas(w, h);
      } else {
        off = document.createElement("canvas");
        off.width = w;
        off.height = h;
      }

      const offCtx = off.getContext("2d");
      if (!offCtx)
        throw new Error("Unable to create the text authoring raster context");

      // Force the authoring raster to expose unsupported browser filter paths
      // instead of masking a native capability gap.
      Object.defineProperty(offCtx, "filter", {
        get: () => "none",
        set: () => {},
        configurable: true,
      });

      offCtx.clearRect(0, 0, w, h);
      evaluateScene(
        scene,
        previewTime,
        offCtx as unknown as CanvasRenderingContext2D,
      );
      if (controller.signal.aborted) return;

      const pixels = offCtx.getImageData(0, 0, w, h);
      const result = await getNativeLabClient().renderFrame(
        {
          contractVersion: 1,
          requestId: `studio-text:${generation}`,
          frameTime: {
            frameIndex: Math.max(0, Math.round(previewTime * 60)),
            ticks: Math.max(0, Math.round(previewTime * 1_000_000)),
            timescale: 1_000_000,
          },
          project: {
            schemaVersion: 1,
            projectRevision: `studio-text:${generation}`,
            canvasWidth: w,
            canvasHeight: h,
            clearColor: [0, 0, 0, 0],
            videoLayers: [],
            rasterLayers: [
              {
                assetId: `studio-text:${generation}`,
                rgba: Array.from(pixels.data),
                width: w,
                height: h,
                x: 0,
                y: 0,
                rotation: 0,
                opacity: 1,
                zIndex: 0,
                blendMode: "normal",
                isText: true,
              },
            ],
            transition: null,
          },
          outputWidth: w,
          outputHeight: h,
          quality: "full",
          colorPolicy: {
            version: 1,
            workingSpace: "linear-rec709",
            outputFormat: "rgba8Srgb",
            toneMapHdrToSdr: true,
            displayProfile: "srgb-reference",
          },
          renderGraphVersion: 1,
        },
        controller.signal,
      );

      if (
        controller.signal.aborted ||
        generation !== nativePreviewGeneration.current
      )
        return;
      if (typeof createImageBitmap !== "function")
        throw new Error("createImageBitmap is unavailable");
      const bitmap = await createImageBitmap(result.image);
      if (
        controller.signal.aborted ||
        generation !== nativePreviewGeneration.current
      ) {
        bitmap.close();
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      setNativePreviewState("ready");
    };

    const reportError = (error: unknown) => {
      if (
        controller.signal.aborted ||
        generation !== nativePreviewGeneration.current
      )
        return;
      const message = error instanceof Error ? error.message : String(error);
      setNativePreviewState("error");
      setNativePreviewError(message);
      ctx.clearRect(
        0,
        0,
        config.canvasWidth || 800,
        config.canvasHeight || 200,
      );
      console.error("Native Studio text preview failed:", error);
    };

    if (GOOGLE_FONTS.includes(config.fontFamily)) {
      const family = config.fontFamily;
      const fontId = `gfont-${family.replace(/\s+/g, "-").toLowerCase()}`;

      // Inject the stylesheet if not already present
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${family.replace(
          /\s+/g,
          "+",
        )}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }

      // Wait for THIS specific font + weight to be ready, then draw.
      // document.fonts.load() polls the font until it's truly available,
      // fixing the race condition where fonts.ready resolved before the
      // newly injected stylesheet was parsed and the face downloaded.
      const fontSpec = `${config.fontWeight} ${config.fontSize}px "${family}"`;
      document.fonts
        .load(fontSpec)
        .then(() => draw().catch(reportError))
        .catch(reportError);
    } else {
      // System font — draw immediately, no loading needed
      void draw().catch(reportError);
    }
    return () => controller.abort();
  }, [config, scene, previewTime]);

  // Format code strings
  const engineCode = generateEngineClass(config);
  const definitionCode = generateEffectDefinition(config);

  const getCurrentCodeText = (): string => {
    if (activeTab === "engine") {
      if (engineFormat === "js") {
        return stripTypesToJS(engineCode);
      }
      if (engineFormat === "html") {
        return generateHTMLFile(config);
      }
      return engineCode;
    } else {
      if (definitionFormat === "json") {
        const match = definitionCode.match(
          /TextEffectDefinition\s*=\s*(\{[\s\S]*?\});/,
        );
        return match && match[1] ? match[1] : definitionCode;
      }
      if (definitionFormat === "html") {
        return generateHTMLFile(config);
      }
      return definitionCode;
    }
  };

  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // HLJS Synced Rendering
  useEffect(() => {
    let rawCode = getCurrentCodeText();
    let language = "typescript";

    if (activeTab === "engine") {
      if (engineFormat === "js") {
        language = "javascript";
      } else if (engineFormat === "html") {
        language = "xml"; // XML highlighting works perfectly with HTML standard structures
      } else {
        language = engineFormat === "txt" ? "plaintext" : "typescript";
      }
    } else {
      if (definitionFormat === "json") {
        language = "json";
      } else if (definitionFormat === "html") {
        language = "xml";
      } else {
        language = definitionFormat === "txt" ? "plaintext" : "typescript";
      }
    }

    const hljs = (window as any).hljs;
    if (hljs) {
      try {
        const highlighted = hljs.highlight(rawCode, { language }).value;
        setHighlightedCode(highlighted);
      } catch (err) {
        setHighlightedCode(rawCode);
      }
    } else {
      setHighlightedCode(rawCode);
    }
  }, [
    config,
    activeTab,
    engineCode,
    definitionCode,
    engineFormat,
    definitionFormat,
  ]);

  // Preset Applicator
  const handleApplyPreset = (preset: Preset) => {
    forceSaveHistoryImmediately(scene);
    const nextCfg = {
      ...preset.config,
      effectName: preset.config.effectName || preset.name,
    };
    const nextScene = getPresetScene({ ...preset, config: nextCfg });
    skipConfigToScene.current = true;
    setConfig(nextCfg);
    setScene(nextScene);
    setActivePresetId(preset.id);
    setPreviewTime(0);
  };

  // Start from Scratch (pushed history first)
  const handleStartFromScratch = () => {
    forceSaveHistoryImmediately(scene);
    const nextCfg = {
      ...defaultConfig,
      text: "MY TEXT",
      effectName: "Custom Effect",
      customRenderer: undefined,
    };
    const nextScene = textEffectConfigToScene(nextCfg);
    skipConfigToScene.current = true;
    setConfig(nextCfg);
    setScene(nextScene);
    setActivePresetId("scratch");
  };

  const handleResetCreatorSession = () => {
    if (
      !confirm(
        "Clear the autosaved creator session and start from a blank slate?",
      )
    )
      return;
    localStorage.removeItem(CREATOR_SESSION_KEY);
    localStorage.removeItem("clypra_active_session_config");
    localStorage.removeItem("clypra_active_preset_id");
    setCreatorSaveStatus("idle");
    handleStartFromScratch();
  };

  // Blend Presets logic (layer-aware)
  const handlePerformBlend = () => {
    const list = [...customPresets, ...builtInPresets];
    const presetA = list.find((p) => p.id === blendAId) || builtInPresets[0];
    const presetB = list.find((p) => p.id === blendBId) || builtInPresets[1];

    if (!presetA || !presetB) return;

    forceSaveHistoryImmediately(scene);

    const blended = blendConfigs(
      { ...presetA.config, text: config.text },
      { ...presetB.config, text: config.text },
      blendRatio,
    );
    blended.effectName = `Blend ${presetA.name.substring(
      0,
      8,
    )} × ${presetB.name.substring(0, 8)}`;
    const blendedScene = textEffectConfigToScene(blended);
    skipConfigToScene.current = true;
    setConfig(blended);
    setScene(blendedScene);
    setActivePresetId("blended");
  };

  // Deep Design Research Handler
  const handleExecuteDeepResearch = async () => {
    if (!researchTopic.trim()) return;
    setResearchStatus("researching");
    setResearchError(null);
    setResearchResult(null);
    setResearchLogs([
      "Constructing deep analytical research criteria...",
      "Connecting to Gemini Design Specialist...",
    ]);

    const timers = [
      setTimeout(
        () =>
          setResearchLogs((prev) => [
            ...prev,
            "Deconstructing visual history and key styling laws...",
          ]),
        800,
      ),
      setTimeout(
        () =>
          setResearchLogs((prev) => [
            ...prev,
            "Extracting professional hexagonal color palette offsets...",
          ]),
        1600,
      ),
      setTimeout(
        () =>
          setResearchLogs((prev) => [
            ...prev,
            "Synthesizing custom Canvas2D tool extension code snippet...",
          ]),
        2400,
      ),
    ];

    try {
      const resData = await performDeepResearch(researchTopic);

      timers.forEach(clearTimeout);

      setResearchResult({
        themeName: resData.themeName,
        historicalContext: resData.historicalContext,
        visualRules: resData.visualRules || [],
        paletteDeconstruction: resData.paletteDeconstruction || [],
        config: resData.config,
        extensionCode: resData.extensionCode || "",
      });
      setResearchStatus("completed");
      setResearchLogs((prev) => [
        ...prev,
        "Research completed successfully! Visual models mapped.",
      ]);
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setResearchError(
        err.message || "An unexpected error occurred during deep research.",
      );
      setResearchStatus("failed");
    }
  };

  const handleApplyResearchResult = () => {
    if (!researchResult) return;
    forceSaveHistoryImmediately(scene);
    const nextCfg = {
      ...researchResult.config,
      text: config.text,
      customRenderer: undefined,
    };
    const nextScene = textEffectConfigToScene(nextCfg);
    nextScene.extensionCode = researchResult.extensionCode || null;
    skipConfigToScene.current = true;
    setConfig(nextCfg);
    setScene(nextScene);
    setActivePresetId("blended");
  };

  // Custom Preset Saver
  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim()) return;

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: customPresetName.trim(),
      config: JSON.parse(JSON.stringify(config)),
      isCustom: true,
      category: customPresetCategory,
      createdAt: Date.now(),
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem("clypra_custom_presets", JSON.stringify(updated));
    setActivePresetId(newPreset.id);
    setCustomPresetName("");
    setCustomPresetCategory("Classic");
    setShowSavePresetModal(false);
  };

  // AI Name Generator for Saving Custom Presets
  const handleGenerateAiPresetName = async () => {
    setIsGeneratingName(true);
    try {
      const { name: suggestedName } = await generateEffectName(config);
      setCustomPresetName(suggestedName);
    } catch (err: any) {
      console.error("AI Naming error:", err);
      // Fallback
      const adjectives = [
        "Phantom",
        "Cyber",
        "Cosmic",
        "Glitch",
        "Solar",
        "Velvet",
        "Liquid",
        "Chroma",
        "Volcanic",
        "Sublime",
      ];
      const nouns = [
        "Glow",
        "Chrome",
        "Aura",
        "Nebula",
        "Vortex",
        "Slab",
        "Aspect",
        "Flux",
        "Shimmer",
        "Vibe",
      ];
      const rAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const rNoun = nouns[Math.floor(Math.random() * nouns.length)];
      setCustomPresetName(`${rAdj} ${rNoun}`);
    } finally {
      setIsGeneratingName(false);
    }
  };

  // AI Name Generator for Clypra Class Name (Direct Editor Field)
  const handleGenerateAiEffectName = async () => {
    setIsGeneratingName(true);
    try {
      const { name: suggestedName } = await generateEffectName(config);
      modifyConfig({ effectName: suggestedName });
    } catch (err: any) {
      console.error("AI Naming error:", err);
      const adjectives = [
        "Vesper",
        "Cyber",
        "Super",
        "Aether",
        "Cosmos",
        "Lumen",
        "Hydro",
        "Pyro",
        "Tox",
        "Magma",
      ];
      const nouns = [
        "Prism",
        "Edge",
        "Core",
        "Drift",
        "Strobe",
        "Glow",
        "Chrome",
        "Brim",
        "Lava",
        "Pulse",
      ];
      const rAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const rNoun = nouns[Math.floor(Math.random() * nouns.length)];
      modifyConfig({ effectName: `${rAdj}${rNoun}` });
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem("clypra_custom_presets", JSON.stringify(updated));
    if (activePresetId === id && updated.length > 0) {
      handleApplyPreset(updated[0]);
    } else if (updated.length === 0) {
      handleApplyPreset(builtInPresets[0]);
    }
  };

  // Copy code tab to clipboard
  const copyCodeToClipboard = async () => {
    const codeToCopy = getCurrentCodeText();
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedCodeFeedback(true);
      setTimeout(() => setCopiedCodeFeedback(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Download code as a localized file with Dual-Output Export feature
  const downloadCodeAsFile = () => {
    const pascalName =
      toPascalCase(getEnrichedEffectName(config)) || "MyEffect";

    // 1. Interactive standalone [EffectName]Sandbox.html
    const htmlContent = generateHTMLFile(config);
    const htmlBlob = new Blob([htmlContent], {
      type: "text/html;charset=utf-8",
    });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const htmlLink = document.createElement("a");
    htmlLink.href = htmlUrl;
    htmlLink.download = `${pascalName}Sandbox.html`;
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
    URL.revokeObjectURL(htmlUrl);

    // 2. Ready-to-drop-in native integration file [EffectName].ts
    const tsContent = generateEngineClass(config);
    const tsBlob = new Blob([tsContent], { type: "text/plain;charset=utf-8" });
    const tsUrl = URL.createObjectURL(tsBlob);
    const tsLink = document.createElement("a");
    tsLink.href = tsUrl;
    tsLink.download = `${pascalName}.ts`;
    document.body.appendChild(tsLink);
    tsLink.click();
    document.body.removeChild(tsLink);
    URL.revokeObjectURL(tsUrl);
  };

  const getCroppedCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 0) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixels) {
      return canvas;
    }

    // Add padding of 15px around the text effect
    const padding = 15;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext("2d");
    if (cropCtx) {
      cropCtx.drawImage(
        canvas,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );
      return cropCanvas;
    }
    return canvas;
  };

  // Copy Canvas Image to clipboard
  const copyImageToClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const targetCanvas = getCroppedCanvas(canvas);
      targetCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopiedImageFeedback(true);
        setTimeout(() => setCopiedImageFeedback(false), 2000);
      }, "image/png");
    } catch (err) {
      // Fallback
      console.warn("Direct blob copy not supported, click Download PNG", err);
    }
  };

  const getPreviewPngDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      const cropped = getCroppedCanvas(canvas);
      return cropped.toDataURL("image/png");
    } catch (e) {
      console.warn("Failed to crop canvas, using original", e);
      return canvas.toDataURL("image/png");
    }
  };

  const downloadPng = () => {
    const url = getPreviewPngDataUrl();
    if (!url) return;
    const link = document.createElement("a");
    link.download = `${activeEffectId}.png`;
    link.href = url;
    link.click();
  };

  const downloadPngSequence = () => {
    downloadPngSequenceZip(scene, `${activeEffectId}-sequence`, {
      fps: scene.timeline.fps,
      duration: scene.timeline.duration,
    });
  };

  const webmFrameCount = useMemo(
    () =>
      getWebMFrameCount(scene, {
        fps: scene.timeline.fps,
        duration: scene.timeline.duration,
      }),
    [scene.timeline.fps, scene.timeline.duration],
  );

  const downloadWebM = async () => {
    if (!webmExportSupported || isExportingWebM) return;
    setWebmExportError(null);
    setIsExportingWebM(true);
    try {
      await downloadSceneWebM(scene, `${activeEffectId}`, {
        fps: scene.timeline.fps,
        duration: scene.timeline.duration,
        width: config.canvasWidth,
        height: config.canvasHeight,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "WebM export failed";
      setWebmExportError(message);
      console.error("WebM export failed", err);
    } finally {
      setIsExportingWebM(false);
    }
  };

  const applyCompositionPreset = (presetId: string) => {
    const preset = COMPOSITION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    modifyConfig({
      canvasWidth: preset.width,
      canvasHeight: preset.height,
    });
  };

  const fitTextToComposition = () => {
    const probe = document.createElement("canvas");
    probe.width = config.canvasWidth || 800;
    probe.height = config.canvasHeight || 200;
    const ctx = probe.getContext("2d");
    if (!ctx) return;
    const layout = computeTextLayout(
      ctx,
      { ...config, autoFitText: true },
      {
        wrap: config.wrapText !== false,
        autoFit: true,
      },
    );
    modifyConfig({
      fontSize: layout.fontSize,
      autoFitText: true,
      wrapText: true,
    });
  };

  return (
    <div
      id="studio-workspace-wrapper"
      className="flex flex-col h-screen"
      style={{
        background: "var(--studio-bg)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header id="studio-header" className="studio-header">
        {/* Left: brand */}
        <div className="flex min-w-0 items-center">
          <a
            href="/studio"
            aria-label="Back to Clypra Studio hub"
            className="group flex shrink-0 items-center gap-2"
          >
            <img
              src="/clypra.svg"
              alt="Clypra"
              className="h-7 w-7 select-none transition-transform group-hover:scale-105"
            />
            <span className="hidden text-[13px] font-bold tracking-tight text-white sm:block">
              Clypra{" "}
              <span style={{ color: "var(--studio-accent)" }}>Studio</span>
            </span>
          </a>
        </div>

        {/* Centre: undo/redo */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 sm:flex">
          <button
            id="global-undo-btn"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            onClick={triggerUndo}
            disabled={!canUndo}
            className="studio-header-btn"
          >
            <Undo2 size={14} />
          </button>
          <button
            id="global-redo-btn"
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            onClick={triggerRedo}
            disabled={!canRedo}
            className="studio-header-btn"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Right: status, utilities, and account actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`autosave-pill hidden sm:inline-flex${
              creatorSaveStatus === "saving" ? " saving" : ""
            }`}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background:
                  creatorSaveStatus === "saving"
                    ? "#fbbf24"
                    : "var(--gpu-ready)",
                boxShadow:
                  creatorSaveStatus === "saving"
                    ? "none"
                    : "0 0 5px var(--gpu-ready)",
              }}
            />
            {creatorSaveStatus === "saving" ? "Saving…" : "Autosaved"}
          </span>

          {activeRailItem === "text-effects" && (
            <span
              className={`studio-gpu-pill hidden md:inline-flex ${
                nativePreviewState === "ready"
                  ? "ready"
                  : nativePreviewState === "error"
                  ? "error"
                  : "live"
              }`}
              title={
                nativePreviewError ?? "Clypra native lab daemon · Metal GPU"
              }
            >
              <Cpu size={9} style={{ flexShrink: 0 }} />
              {nativePreviewState === "ready"
                ? "GPU · Ready"
                : nativePreviewState === "error"
                ? "GPU · Error"
                : "GPU · Live"}
            </span>
          )}

          <div
            className="mx-1 hidden h-4 w-px shrink-0 sm:block"
            style={{ background: "var(--studio-border)" }}
          />
          <button
            id="open-tutorial-btn"
            onClick={() => setShowTutorialModal(true)}
            className="studio-header-btn"
            title="Help & Shortcuts"
          >
            <HelpCircle size={14} />
          </button>

          <div
            className="mx-1 h-4 w-px shrink-0"
            style={{ background: "var(--studio-border)" }}
          />

          {/* User auth */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 rounded-lg px-2.5 h-8 text-[11px] font-semibold text-white cursor-pointer transition-colors"
                style={{
                  background: "var(--studio-raised)",
                  border: "1px solid var(--studio-border)",
                }}
                title={`Logged in as ${user.username}`}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white uppercase shrink-0"
                  style={{ background: "var(--studio-accent)" }}
                >
                  {user.username.charAt(0)}
                </span>
                <span className="hidden sm:inline">{user.username}</span>
              </button>
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-1.5 w-40 rounded-lg p-1.5 shadow-xl z-50"
                  style={{
                    background: "var(--studio-raised)",
                    border: "1px solid var(--studio-border)",
                  }}
                >
                  <div
                    className="px-2 py-1.5 text-[9px] border-b mb-1 truncate"
                    style={{
                      color: "var(--studio-muted)",
                      borderColor: "var(--studio-border)",
                    }}
                  >
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left rounded px-2 py-1.5 text-xs cursor-pointer transition-colors"
                    style={{ color: "var(--gpu-error)" }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-[11px] font-semibold cursor-pointer transition-colors"
              style={{
                background: "var(--studio-active-soft)",
                border: "1px solid rgba(124,111,255,0.25)",
                color: "var(--studio-accent)",
              }}
              title="Sign In / Register"
            >
              <User size={13} />
              Sign In
            </button>
          )}

          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 text-[11px] font-semibold text-(--studio-muted) transition-colors hover:border-(--studio-accent) hover:text-white [&::-webkit-details-marker]:hidden">
              <MoreHorizontal size={15} />
              <span className="hidden md:inline">Navigate</span>
              <ChevronDown size={12} />
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border border-(--studio-border) bg-(--studio-raised) p-1.5 shadow-2xl">
              <p className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-(--studio-subtle)">
                Studio navigation
              </p>
              <a
                href="/studio"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)"
              >
                <LayoutGrid size={13} className="text-(--studio-accent)" />
                All labs
              </a>
              <a
                href="/lottie"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)"
              >
                <Video size={13} className="text-violet-300" />
                Text Templates
              </a>
              {isAdmin && (
                <a
                  href="/studio/admin"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white no-underline transition-colors hover:bg-(--studio-hover)"
                >
                  <Shield size={13} className="text-blue-300" />
                  Admin Console
                </a>
              )}
            </div>
          </details>
        </div>
      </header>

      {activeRailItem === "text-effects" && (
        <CompositionToolbar
          config={config}
          effectiveZoom={effectiveZoom}
          zoomMode={zoomMode}
          bgMode={bgMode}
          gpuState={nativePreviewState}
          gpuError={nativePreviewError}
          onZoomChange={setZoom}
          onZoomModeChange={setZoomMode}
          onBgModeChange={setBgMode}
          toolbarExtras={
            <button
              id="open-export-modal-btn"
              type="button"
              onClick={() => setShowExportModal(true)}
              className="canvas-toolbar-btn primary px-3"
            >
              <Download size={11} className="mr-1" /> Export
            </button>
          }
        />
      )}

      {/* Mobile tab bar */}
      {isNarrow && (
        <div
          id="mobile-views-tabbar"
          className="flex shrink-0 select-none border-b"
          style={{
            background: "var(--studio-panel)",
            borderColor: "var(--studio-border)",
          }}
        >
          {(["controls", "preview", "code"] as const).map((tab, i) => {
            const labels = ["Controls", "Preview", "Inspector"];
            const active = mobileActiveTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setMobileActiveTab(tab)}
                className="flex-1 py-2.5 text-center text-[11px] font-bold transition-all relative"
                style={{
                  color: active
                    ? "var(--studio-accent)"
                    : "var(--studio-muted)",
                }}
              >
                {labels[i]}
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

      {/* ────────────────────────────────────────────────────────────────── WORK WORKSPACE CANVAS ────────────────────────────────────────────────────────────────── */}
      <main
        id="primary-workspace-layout"
        className="flex flex-1 overflow-hidden"
      >
        {activeRailItem === "admin" ? (
          <div className="min-w-0 flex-1 overflow-y-auto bg-[#0B0B10]">
            {isAdmin ? (
              <AdminSettingsTabs />
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-(--studio-muted)">
                <div className="max-w-md space-y-3">
                  <Shield size={48} className="mx-auto text-red-500/50" />
                  <h3 className="text-sm font-semibold text-white">
                    Unauthorized Access
                  </h3>
                  <p className="text-xs text-(--studio-muted)">
                    Only logged-in administrators are allowed to access the
                    admin panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : activeRailItem === "labs" ? (
          <div className="min-w-0 flex-1 flex flex-col overflow-hidden bg-[#0B0B10]">
            {isAdmin ? (
              <LabsPanel />
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-(--studio-muted)">
                <div className="max-w-md space-y-3">
                  <Shield size={48} className="mx-auto text-red-500/50" />
                  <h3 className="text-sm font-semibold text-white">
                    Unauthorized Access
                  </h3>
                  <p className="text-xs text-(--studio-muted)">
                    Only logged-in administrators are allowed to access the
                    Labs.
                  </p>
                  <a
                    href="/studio/text-effects"
                    className="mt-4 inline-block no-underline px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded text-sm font-semibold transition-colors"
                  >
                    Go to Text Effects
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <aside
              id="left-controls-panel"
              className={`
              ${isNarrow && mobileActiveTab !== "controls" ? "hidden" : "flex"}
              ${isMobile ? "w-full" : isTablet ? "w-75" : "w-90"}
              flex-col border-r border-(--studio-border) bg-(--studio-shell) shrink-0 select-none
              ${
                activeRailItem === "text-effects"
                  ? "overflow-hidden"
                  : "overflow-y-auto"
              }
            `}
            >
              {activeRailItem === "text-effects" && (
                <>
                  {/* ── Compact GPU pipeline strip ── */}
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2 border-b shrink-0"
                    style={{
                      borderColor: "var(--studio-border)",
                      background: "var(--studio-panel)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex items-center justify-center rounded shrink-0"
                        style={{
                          width: 22,
                          height: 22,
                          background: "var(--studio-control)",
                          border: "1px solid var(--studio-border)",
                          color: "var(--studio-accent)",
                        }}
                      >
                        <Cpu size={12} />
                      </span>
                      <span className="text-[11px] font-semibold text-white truncate">
                        Native authoring pipeline
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`studio-gpu-pill ${
                          nativePreviewState === "ready"
                            ? "ready"
                            : nativePreviewState === "error"
                            ? "error"
                            : "live"
                        }`}
                      >
                        <span className="studio-gpu-pill-dot" />
                        {nativePreviewState === "ready"
                          ? "Ready"
                          : nativePreviewState === "error"
                          ? "Error"
                          : "Live"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(nativeAuroraPreset)}
                        className="canvas-toolbar-btn"
                        title="Load Native Aurora sample"
                      >
                        <Sparkles size={10} className="mr-1" />
                        Aurora
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-(--studio-border) px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-(--studio-muted)">
                    Native effect library
                  </div>
                </>
              )}

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
                    onSelectedCategoryChange={setSelectedCategory}
                    onSortByChange={setSortBy}
                    onApplyPreset={(presetToApply) => {
                      handleApplyPreset(presetToApply);
                    }}
                    onDeletePreset={handleDeletePreset}
                    onStartFromScratch={handleStartFromScratch}
                    onSavePreset={() => setShowSavePresetModal(true)}
                  />
                </div>
              )}
            </aside>

            {/* CENTER — CANVAS + TIMELINE
              Mobile/Tablet: shown only when mobileActiveTab === "preview"
              Desktop: always visible, fills remaining space */}
            <div
              className={`${
                isNarrow && mobileActiveTab !== "preview" ? "hidden" : "flex"
              } flex-1 flex-col min-w-0`}
            >
              <PreviewCanvas
                canvasRef={canvasRef}
                config={config}
                bgMode={bgMode}
                zoom={zoom}
                zoomMode={zoomMode}
                onZoomChange={setZoom}
                onZoomModeChange={setZoomMode}
                onBgModeChange={setBgMode}
                onEffectiveZoomChange={setEffectiveZoom}
              />

              {showFontCompare && (
                <Suspense fallback={null}>
                  <FontCompare
                    config={config}
                    onSelectFont={(font) => modifyConfig({ fontFamily: font })}
                    onClose={() => setShowFontCompare(false)}
                  />
                </Suspense>
              )}

              <TimelinePanel
                scene={scene}
                previewTime={previewTime}
                isPlaying={isPlaying}
                uiMode={timelinePanelMode}
                onPlayToggle={() => setIsPlaying((p) => !p)}
                onReset={() => setPreviewTime(0)}
                onTimeChange={setPreviewTime}
                onSceneChange={modifyScene}
              />
            </div>

            {/* RIGHT PANEL — INSPECTOR
              Mobile/Tablet: shown only when mobileActiveTab === "code", full-width on mobile
              Desktop: always visible, fixed 344px */}
            <Suspense
              fallback={
                <aside
                  className={`${
                    isNarrow && mobileActiveTab !== "code" ? "hidden" : "flex"
                  } ${
                    isMobile ? "w-full" : "w-86"
                  } shrink-0 border-l border-(--studio-border) bg-(--studio-panel) p-4 text-xs text-(--studio-muted) flex-col`}
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
                  onSelectLayer={setSelectedLayerId}
                  onConfigChange={modifyConfig}
                  onSceneChange={modifyScene}
                  onSavePreset={() => setShowSavePresetModal(true)}
                  onStartFromScratch={handleStartFromScratch}
                  onFitText={fitTextToComposition}
                  onOpenFontCompare={() => setShowFontCompare(true)}
                  activeEffectId={activeEffectId}
                  collapsedSections={collapsedSections}
                  isGeneratingName={isGeneratingName}
                  onToggleSection={toggleSection}
                  onGenerateEffectName={handleGenerateAiEffectName}
                  onApplyCompositionPreset={applyCompositionPreset}
                />
              </div>
            </Suspense>
          </>
        )}
      </main>

      <Suspense fallback={null}>
        <SavePresetModal
          open={showSavePresetModal}
          name={customPresetName}
          category={customPresetCategory}
          isGeneratingName={isGeneratingName}
          onNameChange={setCustomPresetName}
          onCategoryChange={setCustomPresetCategory}
          onGenerateName={handleGenerateAiPresetName}
          onCancel={() => {
            setCustomPresetName("");
            setShowSavePresetModal(false);
          }}
          onSave={handleSaveCustomPreset}
        />

        {showExportModal && (
          <div
            className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Export text effect"
            onMouseDown={() => setShowExportModal(false)}
          >
            <div
              className="flex max-h-[min(88vh,900px)] w-full max-w-190 flex-col overflow-hidden rounded-xl border border-(--studio-border) bg-(--studio-panel) shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-(--studio-border) px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--studio-subtle)">
                    Export
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-white">
                    Editor-ready effect package
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--studio-border) text-(--studio-muted) transition-colors hover:bg-(--studio-hover) hover:text-white"
                  aria-label="Close export dialog"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <ExportLabPanel
                  isMobile={false}
                  mobileActiveTab="code"
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  engineFormat={engineFormat}
                  onEngineFormatChange={setEngineFormat}
                  definitionFormat={definitionFormat}
                  onDefinitionFormatChange={setDefinitionFormat}
                  activeEffectId={activeEffectId}
                  config={config}
                  scene={scene}
                  highlightedCode={highlightedCode}
                  currentCodeText={getCurrentCodeText()}
                  copiedCodeFeedback={copiedCodeFeedback}
                  onCopyCode={copyCodeToClipboard}
                  onDownloadCode={downloadCodeAsFile}
                  researchTopic={researchTopic}
                  onResearchTopicChange={setResearchTopic}
                  researchStatus={researchStatus}
                  researchError={researchError}
                  researchLogs={researchLogs}
                  researchResult={researchResult}
                  onExecuteResearch={handleExecuteDeepResearch}
                  onApplyResearchResult={handleApplyResearchResult}
                  blendAId={blendAId}
                  blendBId={blendBId}
                  blendRatio={blendRatio}
                  onBlendAIdChange={setBlendAId}
                  onBlendBIdChange={setBlendBId}
                  onBlendRatioChange={setBlendRatio}
                  onPerformBlend={handlePerformBlend}
                  presets={[...customPresets, ...builtInPresets]}
                  onCaptureEffectThumbnail={getPreviewPngDataUrl}
                  effectApiCategory={effectApiCategory}
                  onEffectApiCategoryChange={setEffectApiCategory}
                />
              </div>
            </div>
          </div>
        )}

        <TutorialModal
          open={showTutorialModal}
          activeTab={tutorialActiveTab}
          onTabChange={setTutorialActiveTab}
          onClose={() => setShowTutorialModal(false)}
        />

        <LoginModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </Suspense>
    </div>
  );
}
