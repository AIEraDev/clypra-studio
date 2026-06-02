import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Download, Copy, Undo2, Redo2, Sparkles, Grid2X2, Plus, Camera, Loader2, HelpCircle, Beaker, FolderPlus, Video, RefreshCw, KeyRound } from "lucide-react";

import { TextEffectConfig, Preset } from "./types";
import { defaultConfig, builtInPresets } from "./presets";
import { generateEngineClass, generateEffectDefinition, toKebabCase, toPascalCase, stripTypesToJS, generateHTMLFile, getEnrichedEffectName } from "./codeGenerator";
import { GOOGLE_FONTS, GOOGLE_FONTS_LINK } from "./constants";
import { LayerPanel } from "./components/LayerPanel";
import { TimelinePanel } from "./components/TimelinePanel";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { PresetChip } from "./components/PresetChip";
import { DrawerIntro, LeftRail, type RailItem } from "./components/StudioChrome";
import { textEffectConfigToScene, sceneToConfig, evaluateScene, blendConfigs, type SceneDocument, downloadPngSequenceZip, downloadSceneWebM, getWebMFrameCount, isWebMExportSupported, parseHistorySnapshot, snapshotScene, computeTextLayout } from "./engine";
import { getPresetScene } from "./engine/recipes";
import { COMPOSITION_PRESETS } from "./engine/textLayout";
import { useCollapsibleSections } from "./hooks/useCollapsibleSections";
import { useResponsiveMobileTab } from "./hooks/useResponsiveMobileTab";
import { useStudioWorkspaceState } from "./hooks/useStudioWorkspaceState";
import { analyzeStyleFromImage, generateStyleFromPrompt, generateEffectName, performDeepResearch } from "./services/geminiService";

const FontCompare = lazy(() => import("./components/FontCompare").then((module) => ({ default: module.FontCompare })));
const InspectorPanel = lazy(() => import("./components/InspectorPanel").then((module) => ({ default: module.InspectorPanel })));
const ExportLabPanel = lazy(() => import("./components/ExportLabPanel").then((module) => ({ default: module.ExportLabPanel })));
import type { EffectApiCategory } from "./components/ExportLabPanel";
const LegacyControlsPanel = lazy(() => import("./components/LegacyControlsPanel").then((module) => ({ default: module.LegacyControlsPanel })));
const SavePresetModal = lazy(() => import("./components/StudioModals").then((module) => ({ default: module.SavePresetModal })));
const ImageScanModal = lazy(() => import("./components/StudioModals").then((module) => ({ default: module.ImageScanModal })));
const PromptStyleModal = lazy(() => import("./components/StudioModals").then((module) => ({ default: module.PromptStyleModal })));
const TutorialModal = lazy(() => import("./components/StudioModals").then((module) => ({ default: module.TutorialModal })));
const GeminiKeyModal = lazy(() => import("./components/GeminiKeyModal").then((module) => ({ default: module.GeminiKeyModal })));

const CREATOR_SESSION_KEY = "clypra_studio_creator_session";

export default function App() {
  // Primary state configuration
  const [config, setConfig] = useState<TextEffectConfig>(defaultConfig);
  const [scene, setScene] = useState<SceneDocument>(() => textEffectConfigToScene(defaultConfig));
  const { activeRailItem, activeTab, selectedLayerId, setActiveRailItem, setActiveTab, setSelectedLayerId, setUiMode, uiMode } = useStudioWorkspaceState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const skipConfigToScene = useRef(false);

  // Custom localStorage presets
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("classic-ink");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recency" | "name" | "category">("recency");
  const [effectApiCategory, setEffectApiCategory] = useState<EffectApiCategory>("3d");

  // Interaction workspace states
  const [engineFormat, setEngineFormat] = useState<"ts" | "js" | "txt" | "html">("ts");
  const [definitionFormat, setDefinitionFormat] = useState<"ts" | "json" | "txt" | "html">("ts");
  const [bgMode, setBgMode] = useState<"checkerboard" | "black">("checkerboard");
  const [zoom, setZoom] = useState<number>(100);
  const [zoomMode, setZoomMode] = useState<"fit" | "manual">("fit");
  const [showFontCompare, setShowFontCompare] = useState<boolean>(false);

  // Deep Design Research & Blending Lab states
  const [researchTopic, setResearchTopic] = useState<string>("");
  const [researchStatus, setResearchStatus] = useState<"idle" | "researching" | "completed" | "failed">("idle");
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

  // Feedbacks
  const [copiedCodeFeedback, setCopiedCodeFeedback] = useState<boolean>(false);
  const [copiedImageFeedback, setCopiedImageFeedback] = useState<boolean>(false);
  const [isExportingWebM, setIsExportingWebM] = useState(false);
  const [webmExportError, setWebmExportError] = useState<string | null>(null);
  const webmExportSupported = useMemo(() => isWebMExportSupported(), []);
  const [customPresetName, setCustomPresetName] = useState<string>("");
  const [customPresetCategory, setCustomPresetCategory] = useState<string>("Classic");
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState<boolean>(false);
  const [tutorialActiveTab, setTutorialActiveTab] = useState<string>("typography");
  const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);

  // Modern AI image styling scanner states
  const [showImageScanModal, setShowImageScanModal] = useState<boolean>(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "reading" | "analyzing" | "completed" | "failed">("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResultConfig, setScanResultConfig] = useState<TextEffectConfig | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  // Modern AI Prompt-to-Style states
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>("");
  const [promptStatus, setPromptStatus] = useState<"idle" | "generating" | "completed" | "failed">("idle");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptResultConfig, setPromptResultConfig] = useState<TextEffectConfig | null>(null);
  const [promptLogs, setPromptLogs] = useState<string[]>([]);

  // Active Mobile View Tab (Controls | Preview | Code)
  const { mobileActiveTab, setMobileActiveTab, isMobile, isTablet, isNarrow } = useResponsiveMobileTab();
  const [isCreatorSessionLoaded, setIsCreatorSessionLoaded] = useState(false);
  const [creatorSaveStatus, setCreatorSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const creatorSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo / Redo history stacks
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSavedStateString = useRef<string>(JSON.stringify(textEffectConfigToScene(defaultConfig)));
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
        const restoredScene = session.scene || textEffectConfigToScene(session.config || defaultConfig);
        const restoredConfig = session.config || sceneToConfig(restoredScene);

        skipConfigToScene.current = true;
        setConfig(restoredConfig);
        setScene(restoredScene);
        setActivePresetId(session.activePresetId || "scratch");
        lastSavedStateString.current = JSON.stringify(restoredScene);

        if (session.ui) {
          if (session.ui.uiMode) setUiMode(session.ui.uiMode);
          if (session.ui.activeRailItem) setActiveRailItem(session.ui.activeRailItem);
          if (session.ui.activeTab) setActiveTab(session.ui.activeTab);
          if (session.ui.selectedLayerId !== undefined) setSelectedLayerId(session.ui.selectedLayerId);
          if (session.ui.mobileActiveTab) setMobileActiveTab(session.ui.mobileActiveTab);
        }

        if (session.exportSettings) {
          if (session.exportSettings.engineFormat) setEngineFormat(session.exportSettings.engineFormat);
          if (session.exportSettings.definitionFormat) setDefinitionFormat(session.exportSettings.definitionFormat);
        }

        if (session.preview) {
          if (session.preview.bgMode) setBgMode(session.preview.bgMode);
          if (typeof session.preview.zoom === "number") setZoom(session.preview.zoom);
          if (session.preview.zoomMode) setZoomMode(session.preview.zoomMode);
        }

        if (session.blend) {
          if (session.blend.blendAId) setBlendAId(session.blend.blendAId);
          if (session.blend.blendBId) setBlendBId(session.blend.blendBId);
          if (typeof session.blend.blendRatio === "number") setBlendRatio(session.blend.blendRatio);
        }

        if (session.library) {
          if (session.library.selectedCategory) setSelectedCategory(session.library.selectedCategory);
          if (session.library.sortBy) setSortBy(session.library.sortBy);
          if (session.library.effectApiCategory) setEffectApiCategory(session.library.effectApiCategory);
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
  const timelinePanelMode = activeRailItem === "layers" ? "advanced" : uiMode;

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
    let items = [...customPresets.map((p) => ({ ...p, isCustom: true })), ...builtInPresets];

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
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT");

      if (!isInput) {
        // Space -> toggle play when layers panel is active
        if (e.key === " ") {
          e.preventDefault();
          if (activeRailItem === "layers") {
            setIsPlaying((prev) => !prev);
          } else {
            setBgMode((prev) => (prev === "checkerboard" ? "black" : "checkerboard"));
          }
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
          setActiveRailItem("export");
        }
        if (e.key.toLowerCase() === "t") {
          setActiveRailItem("style");
        }
        if (e.key.toLowerCase() === "e") {
          setActiveRailItem("style");
        }
        if (e.key.toLowerCase() === "l") {
          setActiveRailItem("layers");
        }
        if (e.key.toLowerCase() === "a") {
          setActiveRailItem("export");
        }
      }

      // Ctrl + C on code block container to copy
      const isCodeFocused = activeEl?.closest("#right-code-panel");
      if (isCodeFocused && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
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
      undoStack.current = [...undoStack.current, lastSavedStateString.current].slice(-20);
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

    undoStack.current = [...undoStack.current, lastSavedStateString.current].slice(-20);
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
      const { scene: prevScene, config: prevConfig } = parseHistorySnapshot(previousStateStr);
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
      const { scene: nextScene, config: nextConfig } = parseHistorySnapshot(nextStateStr);
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
  const modifyConfig = (updater: Partial<TextEffectConfig> | ((p: TextEffectConfig) => TextEffectConfig)) => {
    setConfig((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

      // Handle auto-generation fonts or effects outside the updater to comply with pure-function paradigms
      setTimeout(() => pushHistoryState(textEffectConfigToScene(next)), 0);
      return next;
    });
  };

  const modifyScene = (updater: SceneDocument | ((prev: SceneDocument) => SceneDocument)) => {
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
        localStorage.setItem("clypra_active_session_config", JSON.stringify(config));
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
  }, [isCreatorSessionLoaded, config, scene, activePresetId, uiMode, activeRailItem, activeTab, selectedLayerId, mobileActiveTab, engineFormat, definitionFormat, bgMode, zoom, zoomMode, blendAId, blendBId, blendRatio, selectedCategory, sortBy, effectApiCategory]);

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

  // Trigger immediate Canvas Ref Redraws whenever parameters modify
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions first
    canvas.width = config.canvasWidth || 800;
    canvas.height = config.canvasHeight || 200;

    const draw = () => evaluateScene(scene, previewTime, ctx);

    if (GOOGLE_FONTS.includes(config.fontFamily)) {
      const family = config.fontFamily;
      const fontId = `gfont-${family.replace(/\s+/g, "-").toLowerCase()}`;

      // Inject the stylesheet if not already present
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }

      // Wait for THIS specific font + weight to be ready, then draw.
      // document.fonts.load() polls the font until it's truly available,
      // fixing the race condition where fonts.ready resolved before the
      // newly injected stylesheet was parsed and the face downloaded.
      const fontSpec = `${config.fontWeight} ${config.fontSize}px "${family}"`;
      document.fonts.load(fontSpec).then(draw).catch(draw);
    } else {
      // System font — draw immediately, no loading needed
      draw();
    }
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
        const match = definitionCode.match(/TextEffectDefinition\s*=\s*(\{[\s\S]*?\});/);
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
  }, [config, activeTab, engineCode, definitionCode, engineFormat, definitionFormat]);

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
    if (!confirm("Clear the autosaved creator session and start from a blank slate?")) return;
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

    const blended = blendConfigs({ ...presetA.config, text: config.text }, { ...presetB.config, text: config.text }, blendRatio);
    blended.effectName = `Blend ${presetA.name.substring(0, 8)} × ${presetB.name.substring(0, 8)}`;
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
    setResearchLogs(["Constructing deep analytical research criteria...", "Connecting to Gemini Design Specialist..."]);

    const timers = [setTimeout(() => setResearchLogs((prev) => [...prev, "Deconstructing visual history and key styling laws..."]), 800), setTimeout(() => setResearchLogs((prev) => [...prev, "Extracting professional hexagonal color palette offsets..."]), 1600), setTimeout(() => setResearchLogs((prev) => [...prev, "Synthesizing custom Canvas2D tool extension code snippet..."]), 2400)];

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
      setResearchLogs((prev) => [...prev, "Research completed successfully! Visual models mapped."]);
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setResearchError(err.message || "An unexpected error occurred during deep research.");
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
      const suggestedName = await generateEffectName(config);
      setCustomPresetName(suggestedName);
    } catch (err: any) {
      console.error("AI Naming error:", err);
      // Fallback
      const adjectives = ["Phantom", "Cyber", "Cosmic", "Glitch", "Solar", "Velvet", "Liquid", "Chroma", "Volcanic", "Sublime"];
      const nouns = ["Glow", "Chrome", "Aura", "Nebula", "Vortex", "Slab", "Aspect", "Flux", "Shimmer", "Vibe"];
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
      const suggestedName = await generateEffectName(config);
      modifyConfig({ effectName: suggestedName });
    } catch (err: any) {
      console.error("AI Naming error:", err);
      const adjectives = ["Vesper", "Cyber", "Super", "Aether", "Cosmos", "Lumen", "Hydro", "Pyro", "Tox", "Magma"];
      const nouns = ["Prism", "Edge", "Core", "Drift", "Strobe", "Glow", "Chrome", "Brim", "Lava", "Pulse"];
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

  // AI image style analyzer helper
  const handleAnalyzeStyle = async () => {
    if (!scanImage) return;
    setScanStatus("analyzing");
    setScanError(null);
    setScanResultConfig(null);
    setScanLogs(["Processing base64 canvas stream..."]);

    const appendLog = (msg: string) => {
      setScanLogs((prev) => [...prev, msg]);
    };

    const timer1 = setTimeout(() => appendLog("AI is analyzing image with Gemini model..."), 600);
    const timer2 = setTimeout(() => appendLog("Deconstructing font styling, letter family & stroke boundaries..."), 1500);
    const timer3 = setTimeout(() => appendLog("Evaluating pixel maps, primary colors and linear gradients..."), 2400);
    const timer4 = setTimeout(() => appendLog("Parsing shadow displacements, depths, panel properties and glow layers..."), 3300);

    try {
      const resultConfig = await analyzeStyleFromImage(scanImage);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      // Guarantee retention of user's core custom typed words and canvas dimensions
      const mergedConfig: TextEffectConfig = {
        ...config,
        ...resultConfig,
        text: config.text || "STUDIO EFFECT",
      };
      appendLog("AI deconstruction succeeded! Custom configuration mappings resolved.");
      setScanResultConfig(mergedConfig);
      setScanStatus("completed");
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setScanStatus("failed");
      setScanError(err.message || "Failed to process style deconstruction request.");
    }
  };

  const handleApplyAnalyzedConfig = () => {
    if (!scanResultConfig) return;
    forceSaveHistoryImmediately(scene);
    const nextScene = textEffectConfigToScene(scanResultConfig);
    skipConfigToScene.current = true;
    setConfig(scanResultConfig);
    setScene(nextScene);
    setShowImageScanModal(false);
  };

  // AI Prompt-to-Style Helper
  const handleGeneratePromptStyle = async () => {
    if (!promptInput.trim()) return;
    setPromptStatus("generating");
    setPromptError(null);
    setPromptResultConfig(null);
    setPromptLogs(["Initializing Prompt Engine..."]);

    const appendLog = (msg: string) => {
      setPromptLogs((prev) => [...prev, msg]);
    };

    const timer1 = setTimeout(() => appendLog("Sending visual styling seed to Gemini LLM..."), 500);
    const timer2 = setTimeout(() => appendLog("Synthesizing responsive font-weights and visual contrasts..."), 1200);
    const timer3 = setTimeout(() => appendLog("Designing custom multi-layer glows and canvas gradients..."), 2000);
    const timer4 = setTimeout(() => appendLog("Configuring optimal bevel displacements and shadows..."), 2850);

    try {
      const resultConfig = await generateStyleFromPrompt(promptInput);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      // Guarantee retention of user's core custom typed words and canvas dimensions
      const mergedConfig: TextEffectConfig = {
        ...config,
        ...resultConfig,
        text: config.text || "STUDIO EFFECT",
      };
      appendLog("AI generation succeeded! Visual configuration loaded successfully.");
      setPromptResultConfig(mergedConfig);
      setPromptStatus("completed");
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setPromptStatus("failed");
      setPromptError(err.message || "Failed to generate styling parameters.");
    }
  };

  const handleApplyPromptConfig = () => {
    if (!promptResultConfig) return;
    forceSaveHistoryImmediately(scene);
    const nextScene = textEffectConfigToScene(promptResultConfig);
    skipConfigToScene.current = true;
    setConfig(promptResultConfig);
    setScene(nextScene);
    setShowPromptModal(false);
  };

  // Drag-and-drop & clipboard processing helpers
  const processFileForScan = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setScanError("Please select a valid image file. Common form formats: PNG, JPG, WEBP.");
      return;
    }
    setScanStatus("reading");
    const reader = new FileReader();
    reader.onload = (event) => {
      setScanImage(event.target?.result as string);
      setScanStatus("idle");
      setScanError(null);
    };
    reader.onerror = () => {
      setScanError("Failed reading file stream from system storage.");
      setScanStatus("idle");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCustomDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFileForScan(files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFileForScan(files[0]);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!showImageScanModal) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            processFileForScan(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [showImageScanModal]);

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
    const pascalName = toPascalCase(getEnrichedEffectName(config)) || "MyEffect";

    // 1. Interactive standalone [EffectName]Sandbox.html
    const htmlContent = generateHTMLFile(config);
    const htmlBlob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
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

  // Copy Canvas Image to clipboard
  const copyImageToClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
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
    return canvas.toDataURL("image/png");
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
    modifyConfig({ fontSize: layout.fontSize, autoFitText: true, wrapText: true });
  };

  return (
    <div id="studio-workspace-wrapper" className="flex flex-col h-screen bg-[#0E0E12]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ──────────────────────────────────────────────────────────────────
      {/* TOP MENUBAR
          ────────────────────────────────────────────────────────────────── */}
      <header id="studio-header" className="flex h-14 items-center justify-between border-b border-(--studio-border) bg-(--studio-shell) px-4 select-none shrink-0 z-20">
        {/* Left: Brand Mark & Autosave Pill */}
        <div className="flex items-center gap-3">
          <a href="/" aria-label="Back to home" title="Back to Clypra home" className="flex items-center gap-2 group">
            <img src="/clypra.svg" alt="Clypra" className="w-8 h-8 select-none transition-transform group-hover:scale-105" />
            <span className="text-base font-bold text-white tracking-tight">Clypra Studio</span>
          </a>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[9px] text-emerald-400">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${creatorSaveStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"}`} />
            <span className="font-mono uppercase tracking-wider font-semibold">{creatorSaveStatus === "saving" ? "Saving..." : "Autosaved"}</span>
          </div>
        </div>

        {/* Right: Consolidated Visual Utilities */}
        <div className="flex items-center gap-3">
          {/* Undo/Redo Queue */}
          <div className="flex items-center gap-0.5 border-r border-(--studio-border) pr-2">
            <button id="global-undo-btn" aria-label="Undo" title="Undo parameter edit (Ctrl+Z)" onClick={triggerUndo} disabled={!canUndo} className={`p-1.5 rounded transition-all ${!canUndo ? "text-gray-700 hover:bg-transparent cursor-not-allowed" : "text-white hover:bg-(--studio-hover) hover:text-(--studio-accent) cursor-pointer"}`}>
              <Undo2 size={14} />
            </button>
            <button id="global-redo-btn" aria-label="Redo" title="Redo parameters (Ctrl+Y)" onClick={triggerRedo} disabled={!canRedo} className={`p-1.5 rounded transition-all ${!canRedo ? "text-gray-700 hover:bg-transparent cursor-not-allowed" : "text-white hover:bg-(--studio-hover) hover:text-(--studio-accent) cursor-pointer"}`}>
              <Redo2 size={14} />
            </button>
          </div>

          {/* Config & Help Utilities */}
          <button id="gemini-key-header-btn" onClick={() => setShowGeminiKeyModal(true)} className="p-1.5 hover:bg-(--studio-hover) rounded transition-all text-white cursor-pointer" title="Gemini API Key">
            <KeyRound size={14} />
          </button>

          <button id="open-tutorial-btn" onClick={() => setShowTutorialModal(true)} className="p-1.5 hover:bg-(--studio-hover) rounded transition-all text-white cursor-pointer" title="Help Guide & Shortcuts">
            <HelpCircle size={14} />
          </button>

          {/* Lottie Workspace Link */}
          <a href="/lottie" className="h-8 rounded border border-purple-500/20 bg-purple-500/10 px-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/15 flex items-center gap-1.5 cursor-pointer font-sans no-underline" title="Go to Lottie Studio">
            <Video size={13} />
            <span className="hidden md:inline">Lottie Studio</span>
          </a>
        </div>
      </header>

      {/* Mobile / Tablet viewport navigation tab-selector */}
      {isNarrow && (
        <div id="mobile-views-tabbar" className="flex border-b border-[#2A2A38] bg-[#1E1E26] text-xs font-semibold shrink-0 select-none">
          <button id="mobile-tab-controls" onClick={() => setMobileActiveTab("controls")} className={`flex-1 py-3 text-center transition-all ${mobileActiveTab === "controls" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-clypra-muted"}`}>
            1. Controls
          </button>
          <button id="mobile-tab-preview" onClick={() => setMobileActiveTab("preview")} className={`flex-1 py-3 text-center transition-all ${mobileActiveTab === "preview" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-clypra-muted"}`}>
            2. Preview
          </button>
          <button id="mobile-tab-code" onClick={() => setMobileActiveTab("code")} className={`flex-1 py-3 text-center transition-all ${mobileActiveTab === "code" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-clypra-muted"}`}>
            3. Export
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── WORK WORKSPACE CANVAS ────────────────────────────────────────────────────────────────── */}
      <main id="primary-workspace-layout" className="flex flex-1 overflow-hidden">
        <>
          {/* Left icon rail — hidden on mobile only, visible on tablet + desktop */}
          {!isMobile && <LeftRail activeItem={activeRailItem} onSelectItem={setActiveRailItem} />}

          {/* LEFT DRAWER — CREATION LIBRARY
              Mobile:  full-width, shown only when mobileActiveTab === "controls"
              Tablet:  fixed 300px, shown only when mobileActiveTab === "controls"
              Desktop: fixed 360px, always visible */}
          <aside
            id="left-controls-panel"
            data-rail={activeRailItem}
            className={`
              ${isNarrow && mobileActiveTab !== "controls" ? "hidden" : "flex"}
              ${isMobile ? "w-full" : isTablet ? "w-[300px]" : "w-[360px]"}
              flex-col border-r border-(--studio-border) bg-(--studio-shell) shrink-0 overflow-y-auto select-none
            `}
          >
            <DrawerIntro activeItem={activeRailItem} onOpenExport={() => setActiveRailItem("export")} />

            {activeRailItem === "templates" && (
              <div className="border-b border-(--studio-border) p-3 flex flex-col">
                <button id="start-scratch-header-btn" onClick={handleStartFromScratch} className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-[12px] font-semibold text-teal-300 hover:bg-teal-400/15" title="Reset active styles and start designing on a clean default canvas">
                  <FolderPlus size={14} /> Blank Slate
                </button>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-(--studio-muted)">Templates</span>
                  <button type="button" onClick={() => setShowSavePresetModal(true)} className="flex items-center gap-1 rounded border border-(--studio-border) px-2 py-1 text-[10px] font-semibold text-white hover:bg-(--studio-hover)">
                    <Plus size={11} />
                    Save
                  </button>
                </div>

                <div className="flex h-full flex-col gap-2 overflow-y-auto">
                  {displayPresets.slice(0, 20).map((preset) => (
                    <PresetChip
                      key={preset.id}
                      preset={preset}
                      activePresetId={activePresetId}
                      handleApplyPreset={(presetToApply) => {
                        handleApplyPreset(presetToApply);
                        setActiveRailItem("style");
                      }}
                      handleDeletePreset={handleDeletePreset}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeRailItem === "export" && (
              <div className="border-b border-(--studio-border) p-3 space-y-2">
                <button id="gemini-key-settings-btn" onClick={() => setShowGeminiKeyModal(true)} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 px-3 py-2 text-[12px] font-semibold text-[#B9B2FF] hover:bg-[#7C6FFF]/15">
                  <KeyRound size={14} /> Gemini API Key
                </button>
                <button
                  id="prompt-effect-btn"
                  onClick={() => {
                    setPromptInput("");
                    setPromptStatus("idle");
                    setPromptResultConfig(null);
                    setPromptError(null);
                    setPromptLogs([]);
                    setShowPromptModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-[12px] font-semibold text-teal-300 hover:bg-teal-500/15"
                >
                  <Sparkles size={14} /> Prompt Style
                </button>
                <button
                  id="scan-effect-btn"
                  onClick={() => {
                    setScanImage(null);
                    setScanStatus("idle");
                    setScanResultConfig(null);
                    setScanError(null);
                    setScanLogs([]);
                    setShowImageScanModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-(--studio-border) bg-(--studio-control) px-3 py-2 text-[12px] font-semibold text-white hover:bg-(--studio-hover)"
                >
                  <Camera size={14} /> Scan Image
                </button>
                <button type="button" onClick={() => setActiveTab("lab")} className="flex w-full items-center justify-center gap-2 rounded-md border border-(--studio-border) bg-(--studio-control) px-3 py-2 text-[12px] font-semibold text-white hover:bg-(--studio-hover)">
                  <Beaker size={14} /> Research & Blend
                </button>
              </div>
            )}

            {activeRailItem === "layers" && <LayerPanel scene={scene} onSceneChange={modifyScene} uiMode="advanced" selectedLayerId={selectedLayerId} onSelectLayer={setSelectedLayerId} />}

            {activeRailItem === "style" && <div className="border-b border-(--studio-border) px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-(--studio-muted)">Style Controls</div>}

            <Suspense fallback={<div className="p-4 text-xs text-(--studio-muted)">Loading controls...</div>}>
              <LegacyControlsPanel visible={activeRailItem === "style"} config={config} activeEffectId={activeEffectId} collapsedSections={collapsedSections} isGeneratingName={isGeneratingName} modifyConfig={modifyConfig} toggleSection={toggleSection} handleGenerateAiEffectName={handleGenerateAiEffectName} applyCompositionPreset={applyCompositionPreset} fitTextToComposition={fitTextToComposition} />
            </Suspense>
          </aside>

          {/* CENTER — CANVAS + TIMELINE
              Mobile/Tablet: shown only when mobileActiveTab === "preview"
              Desktop: always visible, fills remaining space */}
          <div className={`${isNarrow && mobileActiveTab !== "preview" ? "hidden" : "flex"} flex-1 flex-col min-w-0`}>
            <PreviewCanvas
              canvasRef={canvasRef}
              config={config}
              bgMode={bgMode}
              zoom={zoom}
              zoomMode={zoomMode}
              onZoomChange={setZoom}
              onZoomModeChange={setZoomMode}
              onBgModeChange={setBgMode}
              toolbarExtras={
                <>
                  <button id="copy-to-clipboard-image-btn" type="button" onClick={copyImageToClipboard} className="p-1.5 px-3 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[11px] font-medium border border-[#2A2A38] hover:border-[#7C6FFF] rounded flex items-center gap-1 transition-all cursor-pointer font-sans">
                    <Copy size={12} className={copiedImageFeedback ? "text-green-500" : "text-white"} />
                    {copiedImageFeedback ? "Copied" : "Copy"}
                  </button>
                  <button id="download-canvas-image-btn" type="button" onClick={downloadPng} className="p-1.5 px-3 bg-[#7C6FFF] hover:bg-[#6859FF] text-white text-[11px] font-medium rounded flex items-center gap-1 cursor-pointer font-sans">
                    <Download size={12} /> PNG
                  </button>
                  <button id="download-png-sequence-btn" type="button" onClick={downloadPngSequence} className="p-1.5 px-3 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[11px] font-medium rounded border border-[#2A2A38] hover:border-[#7C6FFF] flex items-center gap-1 cursor-pointer font-sans" title={`Export ${webmFrameCount} PNG frames as ZIP`}>
                    <Download size={12} /> Seq
                  </button>
                  {webmExportSupported && (
                    <button id="download-webm-btn" type="button" onClick={downloadWebM} disabled={isExportingWebM} className="p-1.5 px-3 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[11px] font-medium rounded border border-[#2A2A38] hover:border-[#7C6FFF] flex items-center gap-1 cursor-pointer font-sans disabled:opacity-50 disabled:cursor-wait" title={`Export ${webmFrameCount} frames as WebM (~${(scene.timeline.duration || 2).toFixed(1)}s)`}>
                      {isExportingWebM ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
                      {isExportingWebM ? "…" : "WebM"}
                    </button>
                  )}
                  {webmExportError && (
                    <span className="text-[10px] text-red-400 max-w-[140px] truncate" title={webmExportError}>
                      {webmExportError}
                    </span>
                  )}
                </>
              }
            />

            {showFontCompare && (
              <Suspense fallback={null}>
                <FontCompare config={config} onSelectFont={(font) => modifyConfig({ fontFamily: font })} onClose={() => setShowFontCompare(false)} />
              </Suspense>
            )}

            <TimelinePanel scene={scene} previewTime={previewTime} isPlaying={isPlaying} uiMode={timelinePanelMode} onPlayToggle={() => setIsPlaying((p) => !p)} onReset={() => setPreviewTime(0)} onTimeChange={setPreviewTime} onSceneChange={modifyScene} />
          </div>

          {/* RIGHT PANEL — INSPECTOR / EXPORT LAB
              Mobile/Tablet: shown only when mobileActiveTab === "code", full-width on mobile
              Desktop: always visible, fixed 344px */}
          <Suspense fallback={<aside className={`${isNarrow && mobileActiveTab !== "code" ? "hidden" : "flex"} ${isMobile ? "w-full" : "w-[344px]"} shrink-0 border-l border-(--studio-border) bg-(--studio-panel) p-4 text-xs text-(--studio-muted) flex-col`}>Loading panel...</aside>}>
            <div className={`${isNarrow && mobileActiveTab !== "code" ? "hidden" : "flex"} ${isMobile ? "w-full" : "w-[344px]"} shrink-0`}>{activeRailItem === "export" ? <ExportLabPanel isMobile={isMobile} mobileActiveTab={mobileActiveTab} activeTab={activeTab} onActiveTabChange={setActiveTab} engineFormat={engineFormat} onEngineFormatChange={setEngineFormat} definitionFormat={definitionFormat} onDefinitionFormatChange={setDefinitionFormat} activeEffectId={activeEffectId} config={config} scene={scene} highlightedCode={highlightedCode} currentCodeText={getCurrentCodeText()} copiedCodeFeedback={copiedCodeFeedback} onCopyCode={copyCodeToClipboard} onDownloadCode={downloadCodeAsFile} researchTopic={researchTopic} onResearchTopicChange={setResearchTopic} researchStatus={researchStatus} researchError={researchError} researchLogs={researchLogs} researchResult={researchResult} onExecuteResearch={handleExecuteDeepResearch} onApplyResearchResult={handleApplyResearchResult} blendAId={blendAId} blendBId={blendBId} blendRatio={blendRatio} onBlendAIdChange={setBlendAId} onBlendBIdChange={setBlendBId} onBlendRatioChange={setBlendRatio} onPerformBlend={handlePerformBlend} presets={[...customPresets, ...builtInPresets]} onCaptureEffectThumbnail={getPreviewPngDataUrl} effectApiCategory={effectApiCategory} onEffectApiCategoryChange={setEffectApiCategory} /> : <InspectorPanel config={config} scene={scene} selectedLayerId={selectedLayerId} onSelectLayer={setSelectedLayerId} onConfigChange={modifyConfig} onSceneChange={modifyScene} onSavePreset={() => setShowSavePresetModal(true)} onStartFromScratch={handleStartFromScratch} onFitText={fitTextToComposition} onOpenFontCompare={() => setShowFontCompare(true)} />}</div>
          </Suspense>
        </>
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

        <ImageScanModal
          open={showImageScanModal}
          scanImage={scanImage}
          scanStatus={scanStatus}
          scanError={scanError}
          scanResultConfig={scanResultConfig}
          scanLogs={scanLogs}
          onClose={() => {
            setScanImage(null);
            setScanStatus("idle");
            setScanResultConfig(null);
            setScanError(null);
            setShowImageScanModal(false);
          }}
          onClearImage={() => {
            setScanImage(null);
            setScanResultConfig(null);
            setScanError(null);
          }}
          onAnalyze={handleAnalyzeStyle}
          onApply={handleApplyAnalyzedConfig}
          onDragOver={handleDragOver}
          onDrop={handleCustomDrop}
          onFileSelect={handleFileSelectChange}
        />

        <PromptStyleModal
          open={showPromptModal}
          promptInput={promptInput}
          promptStatus={promptStatus}
          promptError={promptError}
          promptResultConfig={promptResultConfig}
          promptLogs={promptLogs}
          onPromptChange={setPromptInput}
          onClose={() => {
            setPromptInput("");
            setPromptStatus("idle");
            setPromptResultConfig(null);
            setPromptError(null);
            setShowPromptModal(false);
          }}
          onGenerate={handleGeneratePromptStyle}
          onApply={handleApplyPromptConfig}
        />

        <GeminiKeyModal open={showGeminiKeyModal} onClose={() => setShowGeminiKeyModal(false)} />

        <TutorialModal open={showTutorialModal} activeTab={tutorialActiveTab} onTabChange={setTutorialActiveTab} onClose={() => setShowTutorialModal(false)} />
      </Suspense>
    </div>
  );
}
