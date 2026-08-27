import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { TextEffectConfig, Preset } from "@clypra-studio/engine";
import { defaultConfig, builtInPresets } from "@clypra-studio/engine";
import { GOOGLE_FONTS, GOOGLE_FONTS_LINK } from "./constants";
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
import { getNativeRenderClient } from "./services/nativeRenderClient";

import { PublishEffectModal } from "./components/PublishEffectModal";
import type { EffectApiCategory } from "./components/PublishEffectModal";
import { TEXT_EFFECT_CATEGORIES } from "./constants/textEffectCategories";
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
import { TextEffectsHeader } from "./components/text-effects/TextEffectsHeader";
import { TextEffectsWorkspace } from "./components/text-effects/TextEffectsWorkspace";
import { getPreviewRenderDimensions } from "./components/PreviewCanvas";
import {
  AUTH_TOKEN_KEY,
  getStoredAuthToken,
  getUserFromToken,
  isTokenExpired,
  refreshAuthSession,
} from "./services/authSession";

// Inject auth headers and renew an expired access token once before surfacing a logout.
if (
  typeof window !== "undefined" &&
  !(window as any).__clypra_fetch_intercepted__
) {
  (window as any).__clypra_fetch_intercepted__ = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const token = getStoredAuthToken();
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

    const response = await originalFetch(input, modifiedInit);
    const isAuthEndpoint = urlStr.includes("/auth/");
    const isAlreadyRetried =
      init?.headers && new Headers(init.headers).has("X-Clypra-Auth-Retried");

    if (
      response.status === 401 &&
      isClypraApi &&
      !isAuthEndpoint &&
      !isAlreadyRetried &&
      token
    ) {
      const outcome = await refreshAuthSession(originalFetch, token);
      if (outcome.ok) {
        const retryInit = init ? { ...init } : {};
        const retryHeaders = new Headers(retryInit.headers || {});
        retryHeaders.set("Authorization", `Bearer ${outcome.token}`);
        retryHeaders.set("X-Clypra-Auth-Retried", "1");
        retryInit.headers = retryHeaders;
        return originalFetch(input, retryInit);
      }

      const currentToken = getStoredAuthToken();
      if (
        ("definitive" in outcome && outcome.definitive) ||
        !currentToken ||
        isTokenExpired(currentToken)
      ) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.dispatchEvent(new CustomEvent("clypra-unauthorized"));
      }
    }

    return response;
  };
}

const CREATOR_SESSION_KEY = "clypra_studio_creator_session";

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
  const [effectApiCategory, setEffectApiCategory] = useState<EffectApiCategory>(
    TEXT_EFFECT_CATEGORIES[0],
  );

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
  // Fix 5: Reuse a single OffscreenCanvas instead of allocating a new one every frame.
  const offscreenRef = useRef<HTMLCanvasElement | OffscreenCanvas | null>(null);
  const offscreenSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // Fix 8: Track which "weight-family" font pairs have already finished loading
  //        so we skip redundant document.fonts.load() calls on every config change.
  const loadedFontsRef = useRef<Set<string>>(new Set());
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
    isAdmin?: boolean;
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

  // Probe native GPU WebAssembly compositor and log status to console
  useEffect(() => {
    let cancelled = false;
    getNativeRenderClient()
      .handshake()
      .then((handshake) => {
        if (cancelled) return;
        if (handshake.gpu.available && handshake.gpu.state === "ready") {
          console.log(
            `%c[Clypra GPU]%c Text Studio is fully powered by GPU (wgpu WebAssembly core)\n• Adapter: ${
              handshake.gpu.adapterName || "Default WebGPU Adapter"
            }\n• Backend: ${handshake.gpu.backend || "wgpu"}\n• Fallback: None (Native GPU only)`,
            "color: #10b981; font-weight: bold;",
            "color: #a78bfa; font-weight: 500;",
          );
        } else {
          console.warn(
            `[Clypra GPU] GPU initialization failed: ${
              handshake.gpu.failureReason || "unknown reason"
            }`,
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(
          "[Clypra GPU] Failed to initialize WebAssembly compositor:",
          err,
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Authenticate the session on mount without logging the user out for a transient
  // API/network failure. Only a confirmed expiry or refresh failure clears it.
  useEffect(() => {
    const storedToken = getStoredAuthToken();
    if (!storedToken) return;

    setToken(storedToken);
    const API_BASE_URL = getStudioApiBaseUrl();

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (res.ok) return res.json();
        const error = new Error(
          `Auth check failed with status ${res.status}`,
        ) as Error & {
          authCode?: string;
        };
        error.authCode = res.status === 401 ? "AUTH_EXPIRED" : "AUTH_TRANSIENT";
        throw error;
      })
      .then((data) => setUser(data.user))
      .catch((err: Error & { authCode?: string }) => {
        console.warn("Auth check failed:", err);
        if (err.authCode === "AUTH_EXPIRED" || isTokenExpired(storedToken)) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
        } else {
          const fallbackUser = getUserFromToken(storedToken);
          if (fallbackUser) setUser(fallbackUser);
        }
      });
  }, []);

  useEffect(() => {
    const handleAuthRefreshed = (event: Event) => {
      const nextToken = (event as CustomEvent<{ token: string }>).detail?.token;
      if (!nextToken) return;
      setToken(nextToken);
      const fallbackUser = getUserFromToken(nextToken);
      if (fallbackUser) setUser(fallbackUser);
    };
    window.addEventListener("clypra-auth-refreshed", handleAuthRefreshed);
    return () =>
      window.removeEventListener("clypra-auth-refreshed", handleAuthRefreshed);
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
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
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
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishThumbnail, setPublishThumbnail] = useState<string | null>(null);
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
  const activeEffectId = (config.effectName || "custom-effect")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
          handleOpenPublishModal();
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
          handleOpenPublishModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, activeRailItem, scene]);

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

  // Fix 9: Debounce the config → scene conversion so rapid changes (typing,
  // slider drags) don't run the potentially expensive textEffectConfigToScene()
  // call on every individual state update.
  useEffect(() => {
    if (skipConfigToScene.current) {
      skipConfigToScene.current = false;
      return;
    }
    const id = setTimeout(() => setScene(textEffectConfigToScene(config)), 50);
    return () => clearTimeout(id);
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
  // Perf fixes applied here:
  //   Fix 2 — rAF gate: collapses multiple rapid state changes to one render/frame.
  //   Fix 3 — Skip WASM when zoomed in (renderScale > 1): the result was never displayed.
  //   Fix 4 — Single evaluateScene: zoomed-in path draws once directly; WASM path draws once offscreen.
  //   Fix 5 — Reuse OffscreenCanvas: reallocated only when canvas dimensions change.
  //   Fix 6 — Object.defineProperty once: applied at OffscreenCanvas creation, not per render.
  //   Fix 8 — Font cache: skips document.fonts.load() once a font+weight has been confirmed ready.
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

    const { renderW, renderH, renderScale } = getPreviewRenderDimensions(
      config.canvasWidth,
      config.canvasHeight,
      effectiveZoom,
    );

    // Set canvas dimensions to match the high-resolution render target
    canvas.width = renderW;
    canvas.height = renderH;

    const w = config.canvasWidth || 800;
    const h = config.canvasHeight || 200;

    // Fix 5+6: Reuse a single OffscreenCanvas; reallocate and patch filter only
    // when the target dimensions change (not on every single render).
    if (
      !offscreenRef.current ||
      offscreenSizeRef.current.w !== w ||
      offscreenSizeRef.current.h !== h
    ) {
      const newOff =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(w, h)
          : Object.assign(document.createElement("canvas"), {
              width: w,
              height: h,
            });
      // Fix 6: Patch the filter property once so the authoring raster exposes
      // unsupported browser filter paths instead of masking a native capability gap.
      const newOffCtx = newOff.getContext("2d");
      if (newOffCtx) {
        Object.defineProperty(newOffCtx, "filter", {
          get: () => "none",
          set: () => {},
          configurable: true,
        });
      }
      offscreenRef.current = newOff;
      offscreenSizeRef.current = { w, h };
    }

    const reportError = (error: unknown) => {
      if (
        controller.signal.aborted ||
        generation !== nativePreviewGeneration.current
      )
        return;
      const message = error instanceof Error ? error.message : String(error);
      setNativePreviewState("error");
      setNativePreviewError(message);
      ctx.clearRect(0, 0, renderW, renderH);
      console.error("Native Studio text preview failed:", error);
    };

    // Fix 2: Gate with requestAnimationFrame so that multiple rapid state
    // changes (slider drag, typing burst) collapse to a single render per frame.
    const raf = requestAnimationFrame(() => {
      if (controller.signal.aborted) return;

      // Fix 3+4: When zoomed in (renderScale > 1) the WASM compositor result is
      // never drawn to the visible canvas (the old code only did so at renderScale <= 1).
      // Skip the entire WASM round-trip — no getImageData, no Array.from(pixels.data),
      // no WASM call. Render the scene directly at the correct scale instead.
      if (renderScale > 1) {
        ctx.clearRect(0, 0, renderW, renderH);
        ctx.save();
        ctx.scale(renderScale, renderScale);
        evaluateScene(scene, previewTime, ctx);
        ctx.restore();
        setNativePreviewState("ready");
        return;
      }

      // Normal path (renderScale <= 1): render to the persistent OffscreenCanvas
      // then send pixels through the WASM compositor for GPU post-processing.
      const off = offscreenRef.current!;
      const offCtx = off.getContext("2d") as CanvasRenderingContext2D | null;
      if (!offCtx) {
        reportError(
          new Error("Unable to create the text authoring raster context"),
        );
        return;
      }

      const draw = async () => {
        if (controller.signal.aborted) return;

        offCtx.clearRect(0, 0, w, h);
        // Fix 4: Single evaluateScene call — no longer called twice.
        evaluateScene(
          scene,
          previewTime,
          offCtx as unknown as CanvasRenderingContext2D,
        );
        if (controller.signal.aborted) return;

        const pixels = offCtx.getImageData(0, 0, w, h);
        const result = await getNativeRenderClient().renderFrame(
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
        ctx.clearRect(0, 0, renderW, renderH);
        ctx.drawImage(bitmap, 0, 0, renderW, renderH);
        bitmap.close();
        setNativePreviewState("ready");
      };

      // Fix 8: Skip document.fonts.load() when this font+weight combination is
      // already confirmed loaded — avoids an async microtask-level stall on every
      // config change (e.g. slider drag, text edit).
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

        const cacheKey = `${config.fontWeight}-${family}`;
        if (loadedFontsRef.current.has(cacheKey)) {
          // Font already loaded — draw immediately, no async wait.
          void draw().catch(reportError);
        } else {
          // Wait for this specific font + weight to be ready, then cache the result.
          const fontSpec = `${config.fontWeight} ${config.fontSize}px "${family}"`;
          document.fonts
            .load(fontSpec)
            .then(() => {
              loadedFontsRef.current.add(cacheKey);
              return draw();
            })
            .catch(reportError);
        }
      } else {
        // System font — draw immediately, no loading needed.
        void draw().catch(reportError);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      controller.abort();
    };
  }, [config, scene, previewTime, effectiveZoom]);

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

    // Add padding around the text effect proportional to canvas resolution
    const scaleRatio = w / (config.canvasWidth || 800);
    const padding = Math.round(15 * Math.max(1, scaleRatio));
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

  const handleOpenPublishModal = async () => {
    try {
      const thumbnail = await getPreviewPngDataUrl();
      setPublishThumbnail(thumbnail);
    } catch (error) {
      console.warn("Could not capture publish thumbnail:", error);
      setPublishThumbnail(null);
    }
    setShowPublishModal(true);
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
      className="flex h-screen flex-col"
      style={{
        background: "var(--studio-bg)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <TextEffectsHeader
        activeRailItem={activeRailItem}
        creatorSaveStatus={creatorSaveStatus}
        nativePreviewState={nativePreviewState}
        nativePreviewError={nativePreviewError}
        user={user}
        isAdmin={isAdmin}
        canUndo={canUndo}
        canRedo={canRedo}
        showUserDropdown={showUserDropdown}
        dropdownRef={dropdownRef}
        onUndo={triggerUndo}
        onRedo={triggerRedo}
        onOpenTutorial={() => setShowTutorialModal(true)}
        onToggleUserDropdown={() => setShowUserDropdown((open) => !open)}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <TextEffectsWorkspace
        activeRailItem={activeRailItem}
        isAdmin={isAdmin}
        isNarrow={isNarrow}
        isMobile={isMobile}
        isTablet={isTablet}
        mobileActiveTab={mobileActiveTab}
        config={config}
        scene={scene}
        canvasRef={canvasRef}
        effectiveZoom={effectiveZoom}
        zoom={zoom}
        zoomMode={zoomMode}
        bgMode={bgMode}
        nativePreviewState={nativePreviewState}
        nativePreviewError={nativePreviewError}
        displayPresets={displayPresets}
        activePresetId={activePresetId}
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        selectedLayerId={selectedLayerId}
        uiMode={timelinePanelMode}
        showFontCompare={showFontCompare}
        collapsedSections={collapsedSections}
        isGeneratingName={isGeneratingName}
        activeEffectId={activeEffectId}
        onMobileTabChange={setMobileActiveTab}
        onZoomChange={setZoom}
        onZoomModeChange={setZoomMode}
        onBgModeChange={setBgMode}
        onEffectiveZoomChange={setEffectiveZoom}
        onExport={handleOpenPublishModal}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
        onStartFromScratch={handleStartFromScratch}
        onSavePreset={() => setShowSavePresetModal(true)}
        onSelectedCategoryChange={setSelectedCategory}
        onSortByChange={setSortBy}
        onConfigChange={modifyConfig}
        onSceneChange={modifyScene}
        onSelectLayer={setSelectedLayerId}
        onPlayToggle={() => setIsPlaying((playing) => !playing)}
        onResetTimeline={() => setPreviewTime(0)}
        onTimeChange={setPreviewTime}
        previewTime={previewTime}
        isPlaying={isPlaying}
        onOpenFontCompare={() => setShowFontCompare(true)}
        onCloseFontCompare={() => setShowFontCompare(false)}
        onFitText={fitTextToComposition}
        onToggleSection={toggleSection}
        onGenerateEffectName={handleGenerateAiEffectName}
        onApplyCompositionPreset={applyCompositionPreset}
      />

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

        <PublishEffectModal
          open={showPublishModal}
          onClose={() => {
            setShowPublishModal(false);
            setPublishThumbnail(null);
          }}
          config={config}
          thumbnailDataUrl={publishThumbnail ?? undefined}
          category={effectApiCategory}
          onCategoryChange={setEffectApiCategory}
        />

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
