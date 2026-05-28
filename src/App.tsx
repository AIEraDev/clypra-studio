import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Settings, 
  Download, 
  Copy, 
  Undo2, 
  Redo2, 
  Type, 
  Sparkles, 
  Grid2X2, 
  Layers, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Monitor, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Flame,
  Snowflake,
  Moon,
  Compass,
  Layout,
  Brush,
  Droplets,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ArrowUpDown,
  Camera,
  UploadCloud,
  Loader2,
  HelpCircle,
  Beaker,
  FolderPlus,
  FileCode
} from "lucide-react";

import { TextEffectConfig, Preset, GradientStop, GlowLayer } from "./types";
import { defaultConfig, builtInPresets } from "./presets";
import { TextEffectRenderer } from "./renderer";
import { generateEngineClass, generateEffectDefinition, toKebabCase, toPascalCase, stripTypesToJS, generateHTMLFile, getEnrichedEffectName } from "./codeGenerator";
import { SYSTEM_FONTS, GOOGLE_FONTS, GOOGLE_FONTS_LINK } from "./constants";
import { FontCompare } from "./components/FontCompare";
import { LayerPanel } from "./components/LayerPanel";
import { TimelinePanel } from "./components/TimelinePanel";
import {
  textEffectConfigToScene,
  sceneToConfig,
  evaluateScene,
  blendConfigs,
  type SceneDocument,
} from "./engine";
import { getPresetScene } from "./engine/recipes";

export default function App() {
  // Primary state configuration
  const [config, setConfig] = useState<TextEffectConfig>(defaultConfig);
  const [scene, setScene] = useState<SceneDocument>(() => textEffectConfigToScene(defaultConfig));
  const [uiMode, setUiMode] = useState<"basic" | "advanced">("basic");
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const skipConfigToScene = useRef(false);
  
  // Custom localStorage presets
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("classic-ink");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recency" | "name" | "category">("recency");

  // Interaction workspace states
  const [activeTab, setActiveTab ] = useState<"engine" | "definition" | "lab">("engine");
  const [engineFormat, setEngineFormat] = useState<"ts" | "js" | "txt" | "html">("ts");
  const [definitionFormat, setDefinitionFormat] = useState<"ts" | "json" | "txt" | "html">("ts");
  const [bgMode, setBgMode] = useState<"checkerboard" | "black">("checkerboard");
  const [zoom, setZoom] = useState<number>(100); // 50 | 75 | 100 | Fit (represented numerically)
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
  const [customPresetName, setCustomPresetName] = useState<string>("");
  const [customPresetCategory, setCustomPresetCategory] = useState<string>("Classic");
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
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
  const [mobileActiveTab, setMobileActiveTab] = useState<"controls" | "preview" | "code">("preview");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1000);

  // Undo / Redo history stacks
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSavedStateString = useRef<string>(JSON.stringify(defaultConfig));
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Target canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Collapsible control sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    text: false,
    font: false,
    inkBrush: false,
    fireEngine: true,
    iceEngine: true,
    auraEngine: true,
    fill: false,
    stroke: false,
    glow: false,
    shadow: false,
    bevel: false,
    stack: true,
    panel: false,
    canvas: false,
  });

  // Load custom presets and setup responsive bounds
  useEffect(() => {
    // Inject combined google fonts stylesheet on mount to warm cache
    const warmLink = document.createElement("link");
    warmLink.rel = "stylesheet";
    warmLink.href = GOOGLE_FONTS_LINK;
    document.head.appendChild(warmLink);

    // Read custom presets
    const saved = localStorage.getItem("clypra_custom_presets");
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Could not parse saved presets", e);
      }
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };
    window.addEventListener("resize", handleResize);

    // Initial load: Restore previous active session config or fallback to built-in classic-ink
    const savedActive = localStorage.getItem("clypra_active_session_config");
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        setConfig(parsed);
        const savedPresetId = localStorage.getItem("clypra_active_preset_id");
        if (savedPresetId) {
          setActivePresetId(savedPresetId);
        }
      } catch (e) {
        console.error("Could not parse saved active config", e);
        handleApplyPreset(builtInPresets[0]);
      }
    } else {
      handleApplyPreset(builtInPresets[0]);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sync effect names and kebab IDs
  const activeEffectId = toKebabCase(getEnrichedEffectName(config));

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
    const builtInIndex = builtInPresets.findIndex(p => p.id === preset.id);
    return 1000000 - (builtInIndex !== -1 ? builtInIndex : 0);
  };

  const displayPresets = useMemo(() => {
    let items = [
      ...customPresets.map(p => ({ ...p, isCustom: true })), 
      ...builtInPresets
    ];

    // Filter by Category
    if (selectedCategory !== "All") {
      if (selectedCategory === "Saved") {
        items = items.filter(p => p.isCustom);
      } else {
        items = items.filter(p => p.category === selectedCategory);
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
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.tagName === "SELECT"
      );

      if (!isInput) {
        // Space -> Toggle background checkerboard
        if (e.key === " ") {
          e.preventDefault();
          setBgMode((prev) => (prev === "checkerboard" ? "black" : "checkerboard"));
        }
        // Ctrl/Cmd + Z -> Undo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          triggerUndo();
        }
        // Ctrl/Cmd + Y -> Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
          e.preventDefault();
          triggerRedo();
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
  }, [config, activeTab]);

  // Push state to undo-history securely (debounced to group rapid slider drag edits)
  const pushHistoryState = (newState: TextEffectConfig) => {
    const newStateStr = JSON.stringify(newState);
    if (newStateStr === lastSavedStateString.current) return;

    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    // Capture previous stable state into undo stack
    historyTimeoutRef.current = setTimeout(() => {
      undoStack.current = [...undoStack.current, lastSavedStateString.current].slice(-20);
      redoStack.current = []; // Wipe redo stack
      lastSavedStateString.current = newStateStr;
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(false);
    }, 300); // 300ms debounce
  };

  const forceSaveHistoryImmediately = (sourceState: TextEffectConfig) => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    const sourceStr = JSON.stringify(sourceState);
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
    redoStack.current.push(JSON.stringify(config));
    
    try {
      const parsed = JSON.parse(previousStateStr);
      setConfig(parsed);
      setScene(textEffectConfigToScene(parsed));
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
    undoStack.current.push(JSON.stringify(config));

    try {
      const parsed = JSON.parse(nextStateStr);
      setConfig(parsed);
      setScene(textEffectConfigToScene(parsed));
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
      setTimeout(() => pushHistoryState(next), 0);
      return next;
    });
  };

  const modifyScene = (updater: SceneDocument | ((prev: SceneDocument) => SceneDocument)) => {
    setScene((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      skipConfigToScene.current = true;
      const cfg = sceneToConfig({ ...next, legacyConfig: sceneToConfig(next) });
      setConfig(cfg);
      setTimeout(() => pushHistoryState(cfg), 0);
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

  // Keep state matching across refresh reloads
  useEffect(() => {
    try {
      localStorage.setItem("clypra_active_session_config", JSON.stringify(config));
      localStorage.setItem("clypra_active_preset_id", activePresetId);
    } catch (e) {
      console.error("Failed to sync working session to localStorage", e);
    }
  }, [config, activePresetId]);

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

    // Dynamically inject Google Fonts if selected
    if (GOOGLE_FONTS.includes(config.fontFamily)) {
      const fontId = `gfont-${config.fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(/\s+/g, "+")}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Set size
    canvas.width = config.canvasWidth || 800;
    canvas.height = config.canvasHeight || 200;

    const draw = () => evaluateScene(scene, previewTime, ctx);

    // Redraw after ensuring fonts layout is calculated
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw);
    } else {
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
        return (match && match[1]) ? match[1] : definitionCode;
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
    forceSaveHistoryImmediately(config);
    const nextCfg = {
      ...preset.config,
      effectName: preset.config.effectName || preset.name,
    };
    setConfig(nextCfg);
    setScene(getPresetScene(preset));
    setActivePresetId(preset.id);
    setPreviewTime(0);
  };

  // Start from Scratch (pushed history first)
  const handleStartFromScratch = () => {
    forceSaveHistoryImmediately(config);
    setConfig({
      ...defaultConfig,
      text: "MY TEXT",
      effectName: "Custom Effect",
      customRenderer: undefined, // Clear any special renderer so they start editing basic text
    });
    setActivePresetId("scratch");
  };

  // Blend Presets logic (layer-aware)
  const handlePerformBlend = () => {
    const list = [...customPresets, ...builtInPresets];
    const presetA = list.find((p) => p.id === blendAId) || builtInPresets[0];
    const presetB = list.find((p) => p.id === blendBId) || builtInPresets[1];

    if (!presetA || !presetB) return;

    forceSaveHistoryImmediately(config);

    const blended = blendConfigs(
      { ...presetA.config, text: config.text },
      { ...presetB.config, text: config.text },
      blendRatio
    );
    blended.effectName = `Blend ${presetA.name.substring(0, 8)} × ${presetB.name.substring(0, 8)}`;
    setConfig(blended);
    setScene(textEffectConfigToScene(blended));
    setActivePresetId("blended");
  };

  // Deep Design Research Handler
  const handleExecuteDeepResearch = async () => {
    if (!researchTopic.trim()) return;
    setResearchStatus("researching");
    setResearchError(null);
    setResearchResult(null);
    setResearchLogs(["Constructing deep analytical research criteria...", "Connecting server-side Gemini Design Specialist..."]);

    const timers = [
      setTimeout(() => setResearchLogs((prev) => [...prev, "Deconstructing visual history and key styling laws..."]), 800),
      setTimeout(() => setResearchLogs((prev) => [...prev, "Extracting professional hexagonal color palette offsets..."]), 1600),
      setTimeout(() => setResearchLogs((prev) => [...prev, "Synthesizing custom Canvas2D tool extension code snippet..."]), 2400),
    ];

    try {
      const response = await fetch("/api/deep-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic: researchTopic })
      });

      timers.forEach(clearTimeout);

      if (!response.ok) {
        throw new Error("Gemini design research server returned an error.");
      }

      const resData = await response.json();
      if (resData.success) {
        setResearchResult({
          themeName: resData.themeName,
          historicalContext: resData.historicalContext,
          visualRules: resData.visualRules || [],
          paletteDeconstruction: resData.paletteDeconstruction || [],
          config: resData.config,
          extensionCode: resData.extensionCode || ""
        });
        setResearchStatus("completed");
        setResearchLogs((prev) => [...prev, "Research completed successfully! Visual models mapped."]);
      } else {
        throw new Error("Unable to parse structured typography data.");
      }
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setResearchError(err.message || "An unexpected error occurred during deep research.");
      setResearchStatus("failed");
    }
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
      createdAt: Date.now()
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
      const response = await fetch("/api/generate-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) {
        throw new Error("Failed to contact Gemini API");
      }
      const data = await response.json();
      if (data.success && data.suggestedName) {
        setCustomPresetName(data.suggestedName);
      }
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
      const response = await fetch("/api/generate-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) {
        throw new Error("Failed to contact Gemini API");
      }
      const data = await response.json();
      if (data.success && data.suggestedName) {
        modifyConfig({ effectName: data.suggestedName });
      }
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

    const timer1 = setTimeout(() => appendLog("AI is sending image payload to server-side Gemini model..."), 600);
    const timer2 = setTimeout(() => appendLog("Deconstructing font styling, letter family & stroke boundaries..."), 1500);
    const timer3 = setTimeout(() => appendLog("Evaluating pixel maps, primary colors and linear gradients..."), 2400);
    const timer4 = setTimeout(() => appendLog("Parsing shadow displacements, depths, panel properties and glow layers..."), 3300);

    try {
      const response = await fetch("/api/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: scanImage }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned code ${response.status}: ${errorText || "Unknown response defect."}`);
      }

      const data = await response.json();
      if (data.success && data.config) {
        // Guarantee retention of user's core custom typed words and canvas dimensions
        const mergedConfig: TextEffectConfig = {
          ...config,
          ...data.config,
          text: config.text || "STUDIO EFFECT",
        };
        appendLog("AI deconstruction succeeded! Custom configuration mappings resolved.");
        setScanResultConfig(mergedConfig);
        setScanStatus("completed");
      } else {
        throw new Error(data.error || "Analysis format did not match expected structure.");
      }
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
    forceSaveHistoryImmediately(config);
    setConfig(scanResultConfig);
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
      const response = await fetch("/api/generate-prompt-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned code ${response.status}: ${errorText || "Unknown response defect."}`);
      }

      const data = await response.json();
      if (data.success && data.config) {
        // Guarantee retention of user's core custom typed words and canvas dimensions
        const mergedConfig: TextEffectConfig = {
          ...config,
          ...data.config,
          text: config.text || "STUDIO EFFECT",
        };
        appendLog("AI generation succeeded! Visual configuration loaded successfully.");
        setPromptResultConfig(mergedConfig);
        setPromptStatus("completed");
      } else {
        throw new Error(data.error || "Generation format did not match expected structure.");
      }
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
    forceSaveHistoryImmediately(config);
    setConfig(promptResultConfig);
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

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${activeEffectId}.png`;
    link.href = url;
    link.click();
  };

  // Header toggling layout section
  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

interface PresetChipProps {
  preset: Preset;
  activePresetId: string;
  handleApplyPreset: (preset: Preset) => void;
  handleDeletePreset: (id: string, e: React.MouseEvent) => void;
}

const PresetChip: React.FC<PresetChipProps> = ({
  preset,
  activePresetId,
  handleApplyPreset,
  handleDeletePreset
}) => {
  const canvasRefMini = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRefMini.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 30;

    // Scaled duplicate for mini preview chip
    const miniCfg: TextEffectConfig = {
      ...preset.config,
      text: preset.config.text.substring(0, 5) || "TEXT",
      fontSize: 14,
      letterSpacing: 0,
      strokeWidth: Math.max(0.5, preset.config.strokeWidth * 0.15),
      bevelDepth: preset.config.bevelDepth * 0.15,
      canvasWidth: 80,
      canvasHeight: 30,
      textPosX: "center",
      textPosY: "middle",
      panelPaddingX: preset.config.panelPaddingX * 0.1,
      panelPaddingY: preset.config.panelPaddingY * 0.1,
      panelRadius: preset.config.panelRadius * 0.15,
      panelStrokeWidth: Math.max(0.5, preset.config.panelStrokeWidth * 0.15),
      shadowBlur: preset.config.shadowBlur * 0.15,
      shadowOffsetX: preset.config.shadowOffsetX * 0.15,
      shadowOffsetY: preset.config.shadowOffsetY * 0.15,
    };

    // Force tiny outer glow draw if any
    miniCfg.glowLayers = preset.config.glowLayers.map(l => ({
      ...l,
      blur: Math.min(l.blur * 0.15, 8)
    }));

    // Render
    TextEffectRenderer.draw(ctx, miniCfg);
  }, [preset]);

  const isActive = activePresetId === preset.id;

  return (
    <div
      id={`preset-chip-${preset.id}`}
      onClick={() => handleApplyPreset(preset)}
      className={`relative flex items-center justify-between gap-2.5 p-1.5 px-3 rounded-lg border cursor-pointer select-none transition-all duration-150 shrink-0 group ${
        isActive 
          ? "bg-[#1E1E26] border-[#7C6FFF] shadow-[0_0_10px_rgba(124,111,255,0.15)]" 
          : "bg-[#15151C]/60 border-[#2A2A38] hover:border-[#7C6FFF]/50 hover:bg-[#1C1C24]"
      }`}
    >
      <span className="text-[11px] font-medium text-white truncate max-w-[85px] font-sans">
        {preset.name}
      </span>
      <canvas
        ref={canvasRefMini}
        className="w-[80px] h-[30px] rounded bg-[#09090D] border border-gray-900 shadow-inner"
      />
      {preset.isCustom && (
        <button
          id={`delete-preset-${preset.id}`}
          title="Delete custom preset"
          onClick={(e) => handleDeletePreset(preset.id, e)}
          className="absolute -top-1.5 -right-1.5 opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 bg-red-650 hover:bg-red-700 text-white rounded-full transition-opacity duration-150 z-20 cursor-pointer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

  return (
    <div id="studio-workspace-wrapper" className="flex flex-col h-screen bg-[#0E0E12]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ──────────────────────────────────────────────────────────────────
          TOP MENUBAR
          ────────────────────────────────────────────────────────────────── */}
      <header id="studio-header" className="flex items-center justify-between border-b border-[#2A2A38] bg-[#15151C] px-5 py-3 select-none shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#7C6FFF] to-[#A094FF] flex items-center justify-center text-white font-bold select-none shadow-[0_0_12px_rgba(124,111,255,0.3)]">
            C
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide font-sans leading-tight">
              Clypra Text Effect Studio
            </h1>
            <p className="text-[10px] font-mono text-[#666677] uppercase tracking-wider">
              Tauri Canvas Renderer Workbench v1.2
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Global Undo / Redo */}
          <div className="flex items-center gap-1 border-r border-[#2A2A38] pr-3 mr-1">
            <button
              id="global-undo-btn"
              title="Undo parameter edit (Ctrl+Z)"
              onClick={triggerUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                !canUndo 
                  ? "text-gray-700 hover:bg-transparent cursor-not-allowed" 
                  : "text-white hover:bg-[#2A2A38] hover:text-[#7C6FFF]"
              }`}
            >
              <Undo2 size={15} />
            </button>
            <button
              id="global-redo-btn"
              title="Redo parameters (Ctrl+Y)"
              onClick={triggerRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                !canRedo 
                  ? "text-gray-700 hover:bg-transparent cursor-not-allowed" 
                  : "text-white hover:bg-[#2A2A38] hover:text-[#7C6FFF]"
              }`}
            >
              <Redo2 size={15} />
            </button>
          </div>

          <button
            id="open-tutorial-btn"
            onClick={() => setShowTutorialModal(true)}
            className="p-1 px-3 text-xs bg-[#1E1E26] hover:bg-[#2A2A38] text-gray-200 border border-[#2A2A38] hover:border-[#7C6FFF] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <HelpCircle size={13} className="text-[#7C6FFF]" /> Guide & Tutorial
          </button>

          <div className="flex items-center rounded-lg border border-[#2A2A38] overflow-hidden text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setUiMode("basic")}
              className={`px-2.5 py-1 cursor-pointer ${uiMode === "basic" ? "bg-[#7C6FFF] text-white" : "bg-[#1E1E26] text-gray-400"}`}
            >
              Basic
            </button>
            <button
              type="button"
              onClick={() => setUiMode("advanced")}
              className={`px-2.5 py-1 cursor-pointer ${uiMode === "advanced" ? "bg-[#7C6FFF] text-white" : "bg-[#1E1E26] text-gray-400"}`}
            >
              Advanced
            </button>
          </div>

          <button
            id="font-compare-launcher-btn"
            onClick={() => setShowFontCompare(!showFontCompare)}
            className="p-1 px-3 text-xs bg-[#1E1E26] hover:bg-[#2A2A38] text-white border border-[#2A2A38] hover:border-[#7C6FFF] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <Grid2X2 size={13} /> Grid Compare
          </button>

          <button
            id="start-scratch-header-btn"
            onClick={handleStartFromScratch}
            className="p-1 px-3.5 text-xs bg-[#1E1E26] hover:bg-[#2A2A38] text-gray-300 border border-[#2A2A38] hover:border-teal-400 font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans hover:text-teal-400 hover:shadow-[0_0_10px_rgba(45,212,191,0.15)]"
            title="Reset active styles and start designing on a clean default whiteboard canvas"
          >
            <FolderPlus size={13} className="text-teal-400" /> Start From Scratch
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
            className="p-1 px-3.5 text-xs bg-[#1E1E26] hover:bg-[#2A2A38] text-[#7C6FFF] border border-[#7C6FFF]/30 hover:border-[#7C6FFF]/80 font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans hover:shadow-[0_0_10px_rgba(124,111,255,0.15)]"
          >
            <Camera size={13} /> AI Scan Effect
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
            className="p-1 px-3.5 text-xs bg-[#1E1E26] hover:bg-[#2A2A38] text-teal-400 border border-teal-500/30 hover:border-teal-500/80 font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans hover:shadow-[0_0_10px_rgba(45,212,191,0.15)]"
          >
            <Sparkles size={13} /> AI Prompt Style
          </button>

          <button
            id="register-preset-modal-btn"
            onClick={() => setShowSavePresetModal(true)}
            className="p-1 px-3.5 text-xs bg-[#7C6FFF] hover:bg-[#6859FF] text-white font-medium rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer font-sans hover:shadow-[0_0_10px_rgba(124,111,255,0.3)]"
          >
            <Plus size={14} /> Save Preset
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────
          PRESETS CAROUSEL BAR
          ────────────────────────────────────────────────────────────────── */}
      <div id="presets-carousel-container" className="flex flex-col gap-2 bg-[#0E0E12] border-b border-[#2A2A38] py-2.5 px-5 select-none shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] uppercase font-mono text-[#666677] tracking-wider mr-2 shrink-0">
              <Sparkles size={11} className="text-[#7C6FFF]" />
              <span>Style Categories:</span>
            </div>
            
            <div className="flex items-center gap-1 bg-[#15151C] border border-[#2A2A38] p-0.5 rounded-lg mr-2 select-none">
              {["All", "Classic", "Neon", "Experimental", "Saved"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-[10.5px] uppercase font-semibold tracking-wider font-sans transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#7C6FFF] text-white shadow-[0_2px_8px_rgba(124,111,255,0.2)]"
                      : "text-[#666677] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Toggle Selector */}
            <div className="flex items-center gap-1.5 bg-[#15151C] border border-[#2A2A38] p-1 px-2.5 rounded-lg select-none">
              <ArrowUpDown size={11} className="text-[#7C6FFF]" />
              <span className="text-[10.5px] uppercase font-sans text-gray-400 font-semibold tracking-wider">Sort By:</span>
              <select
                id="preset-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white text-[10.5px] font-semibold tracking-wider font-sans focus:outline-none cursor-pointer border-none p-0 outline-none pr-1"
                style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none" }}
              >
                <option value="recency" className="bg-[#15151C] text-white">Recency</option>
                <option value="name" className="bg-[#15151C] text-white">Name</option>
                <option value="category" className="bg-[#15151C] text-white">Category</option>
              </select>
            </div>
          </div>
          
          <span className="text-[10px] font-mono text-[#666677] shrink-0">
            {displayPresets.length} Composition{displayPresets.length !== 1 ? "s" : ""} Available
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto py-1 group scrollbar-none scroll-smooth">
          {/* Start From Scratch / Clean Canvas card */}
          <div
            id="preset-chip-scratch-card"
            onClick={handleStartFromScratch}
            className={`relative flex items-center justify-between gap-2.5 p-1.5 px-3 rounded-lg border cursor-pointer select-none transition-all duration-150 shrink-0 group ${
              activePresetId === "scratch"
                ? "bg-[#1E1E26] border-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.15)]"
                : "bg-[#15151C]/60 border-dashed border-gray-700/60 hover:border-teal-400/50 hover:bg-[#1E1E26]"
            }`}
            title="Starts completely from scratch without loading preset names"
          >
            <div className="flex items-center gap-2">
              <div className="w-[18px] h-[18px] bg-[#09090D] rounded border border-gray-800 flex items-center justify-center">
                <FileCode size={11} className={activePresetId === "scratch" ? "text-teal-400" : "text-gray-400 group-hover:text-teal-400"} />
              </div>
              <span className={`text-[11px] font-bold font-sans transition-colors ${activePresetId === "scratch" ? "text-teal-400" : "text-gray-400 group-hover:text-white"}`}>
                [ Blank Slate ]
              </span>
            </div>
            <div className={`w-[80px] h-[30px] rounded bg-[#09090D] border ${activePresetId === "scratch" ? "border-teal-400/20" : "border-gray-900 border-dashed"} flex items-center justify-center`}>
              <span className="text-[10px] font-mono text-gray-500 font-semibold group-hover:text-gray-450">SCRATCH</span>
            </div>
          </div>
          {displayPresets.length === 0 ? (
            <div className="text-[11px] text-[#666677] font-sans py-2 italic flex items-center gap-2">
              <span>No custom presets stored under this group category yet. Customize parameters and save!</span>
            </div>
          ) : (
            <>
              {displayPresets.map((preset) => (
                <PresetChip 
                  key={preset.id} 
                  preset={preset} 
                  activePresetId={activePresetId}
                  handleApplyPreset={handleApplyPreset}
                  handleDeletePreset={handleDeletePreset}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Mobile viewport navigation tab-selector */}
      {isMobile && (
        <div id="mobile-views-tabbar" className="flex border-b border-[#2A2A38] bg-[#1E1E26] text-xs font-semibold shrink-0 select-none">
          <button
            id="mobile-tab-controls"
            onClick={() => setMobileActiveTab("controls")}
            className={`flex-1 py-3 text-center transition-all ${
              mobileActiveTab === "controls" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-[#666677]"
            }`}
          >
            1. Controls Parameter
          </button>
          <button
            id="mobile-tab-preview"
            onClick={() => setMobileActiveTab("preview")}
            className={`flex-1 py-3 text-center transition-all ${
              mobileActiveTab === "preview" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-[#666677]"
            }`}
          >
            2. Live Output Preview
          </button>
          <button
            id="mobile-tab-code"
            onClick={() => setMobileActiveTab("code")}
            className={`flex-1 py-3 text-center transition-all ${
              mobileActiveTab === "code" ? "text-[#7C6FFF] bg-[#0E0E12] border-b-2 border-[#7C6FFF]" : "text-[#666677]"
            }`}
          >
            3. Export Clypra Code
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          WORK WORKSPACE CANVAS
          ────────────────────────────────────────────────────────────────── */}
      <main id="primary-workspace-layout" className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — CONTROLS (320px) */}
        <aside
          id="left-controls-panel"
          className={`${
            isMobile && mobileActiveTab !== "controls" ? "hidden" : "flex"
          } w-full md:w-[320px] flex-col border-r border-[#2A2A38] bg-[#15151C] shrink-0 overflow-y-auto select-none`}
        >
          <LayerPanel scene={scene} onSceneChange={modifyScene} uiMode={uiMode} />
          <div className="p-4 flex flex-col gap-4">
            
            {/* ──────────────────────────────────────────────────────
                Section 1 — Text
                ────────────────────────────────────────────────────── */}
            <div id="section-card-text" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("text")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">1. Text Configuration</span>
                </div>
                {collapsedSections.text ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>
              
              {!collapsedSections.text && (
                <div className="p-3.5 flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Preview Label Text</label>
                    <textarea
                      id="input-text-val"
                      rows={2}
                      value={config.text}
                      onChange={(e) => modifyConfig({ text: e.target.value })}
                      className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] resize-none font-sans"
                      placeholder="Insert preview label..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Clypra Class Name</label>
                    <div className="flex gap-1.5">
                      <input
                        id="input-effect-name"
                        type="text"
                        value={config.effectName}
                        onChange={(e) => modifyConfig({ effectName: e.target.value })}
                        className="flex-1 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] font-sans min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAiEffectName}
                        disabled={isGeneratingName}
                        className="px-2.5 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/20 active:bg-[#7C6FFF]/30 border border-[#7C6FFF]/30 rounded-lg text-[#7C6FFF] font-sans text-xs flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        title="Generate Class Name with Gemini AI"
                      >
                        {isGeneratingName ? (
                          <Loader2 size={13} className="animate-spin text-[#7C6FFF]" />
                        ) : (
                          <>
                            <Sparkles size={11} />
                            <span className="text-[10px] font-semibold">AI Name</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-0.5">Effect Registration ID</label>
                    <span className="text-[10px] font-mono text-gray-500 bg-[#0E0E12] px-2 py-1 rounded block border border-dashed border-[#2A2A38] truncate select-all">
                      {activeEffectId}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 2 — Font
                ────────────────────────────────────────────────────── */}
            <div id="section-card-font" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("font")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">2. Font Specimen</span>
                </div>
                {collapsedSections.font ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.font && (
                <div className="p-3.5 flex flex-col gap-3">
                  {/* Font dropdown */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Typography Family</label>
                    <select
                      id="select-font-family"
                      value={config.fontFamily}
                      onChange={(e) => modifyConfig({ fontFamily: e.target.value })}
                      className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] cursor-pointer"
                    >
                      <optgroup label="System Fonts">
                        {SYSTEM_FONTS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Google Web Fonts">
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Weight segmented */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Font Weight</label>
                    <div className="grid grid-cols-6 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg select-none">
                      {[400, 500, 600, 700, 800, 900].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => modifyConfig({ fontWeight: w })}
                          className={`py-1 text-[10px] rounded font-mono cursor-pointer transition-all ${
                            config.fontWeight === w ? "bg-[#7C6FFF] text-white font-semibold" : "text-[#666677] hover:text-white"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font style */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Font Decoration Style</label>
                    <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg select-none">
                      {["normal", "italic"].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            const updates: any = { fontStyle: style };
                            if (style === "italic") {
                              updates.skewX = -0.2;
                            } else {
                              updates.skewX = 0;
                            }
                            modifyConfig(updates);
                          }}
                          className={`py-1 text-[10px] rounded font-mono capitalize cursor-pointer transition-all ${
                            config.fontStyle === style ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* font size */}
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Size</label>
                        <span className="text-[10px] font-mono text-white">{config.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="200"
                        value={config.fontSize}
                        onChange={(e) => modifyConfig({ fontSize: parseInt(e.target.value) })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize py-1"
                      />
                    </div>
                    <input
                      type="number"
                      min="24"
                      max="200"
                      value={config.fontSize}
                      onChange={(e) => modifyConfig({ fontSize: Math.max(24, Math.min(200, parseInt(e.target.value) || 24)) })}
                      className="w-[50px] bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 text-center text-[10px] font-mono mt-3 focus:outline-none"
                    />
                  </div>

                  {/* spacing */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Letter Spacing</label>
                      <span className="text-[10px] font-mono text-white">{config.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="30"
                      value={config.letterSpacing}
                      onChange={(e) => modifyConfig({ letterSpacing: parseInt(e.target.value) })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* line height */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Line Height Ratio</label>
                      <span className="text-[10px] font-mono text-white">{config.lineHeight}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.1"
                      value={config.lineHeight}
                      onChange={(e) => modifyConfig({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 3 — Ink Brush Engine (Custom procedural controls)
                ────────────────────────────────────────────────────── */}
            <div id="section-card-inkbrush" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
              <div
                onClick={() => toggleSection("inkBrush")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Brush size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">3. Ink Brush Engine</span>
                  {config.customRenderer === "InkBrushEngine" && (
                    <span className="text-[9px] bg-teal-500/20 text-teal-400 font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Active</span>
                  )}
                </div>
                {collapsedSections.inkBrush ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.inkBrush && (
                <div className="p-3.5 flex flex-col gap-4">
                  {/* Active Engine Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-[#2A2A38]/50 flex-wrap gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#7C6FFF] font-bold block">Enable Ink Brush Engine</span>
                      <span className="text-[8px] text-gray-500 font-mono block">When on, overrides standard fill modes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.customRenderer === "InkBrushEngine"}
                      onChange={(e) => modifyConfig({ customRenderer: e.target.checked ? "InkBrushEngine" : undefined })}
                      className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Ink Color */}
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Ink Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.inkColor || "#FFFFFF"}
                        onChange={(e) => modifyConfig({ inkColor: e.target.value, fillColor: e.target.value, customRenderer: "InkBrushEngine" })}
                        className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.inkColor || "#FFFFFF"}
                        onChange={(e) => modifyConfig({ inkColor: e.target.value, fillColor: e.target.value, customRenderer: "InkBrushEngine" })}
                        className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bristle Density */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Bristle Density (Coverage)</label>
                      <span className="text-[10px] font-mono text-white">{config.bristleDensity ?? 0.8}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.05"
                      value={config.bristleDensity ?? 0.8}
                      onChange={(e) => modifyConfig({ bristleDensity: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Bristle Skip Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Skip Rate (Dryness/Holes)</label>
                      <span className="text-[10px] font-mono text-white">{Math.round((config.bristleSkipRate ?? 0.20) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.bristleSkipRate ?? 0.20}
                      onChange={(e) => modifyConfig({ bristleSkipRate: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Drip Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Drip Rate (Drip Probability)</label>
                      <span className="text-[10px] font-mono text-white">{Math.round((config.dripRate ?? 0.30) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.dripRate ?? 0.30}
                      onChange={(e) => modifyConfig({ dripRate: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Drip Max Length */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Drip Max Length</label>
                      <span className="text-[10px] font-mono text-white">{config.dripMaxLength ?? 40}px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="1"
                      value={config.dripMaxLength ?? 40}
                      onChange={(e) => modifyConfig({ dripMaxLength: parseInt(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Grain Density */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Grain Density (Paper Noise)</label>
                      <span className="text-[10px] font-mono text-white">{Math.round((config.grainDensity ?? 0.15) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={config.grainDensity ?? 0.15}
                      onChange={(e) => modifyConfig({ grainDensity: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Font Slant SkewX */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Font Slant (Skew X)</label>
                      <span className="text-[10px] font-mono text-white">{config.skewX ?? -0.2}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.0"
                      max="1.0"
                      step="0.05"
                      value={config.skewX ?? -0.2}
                      onChange={(e) => modifyConfig({ skewX: parseFloat(e.target.value), customRenderer: "InkBrushEngine" })}
                      className="w-full accent-[#7C6FFF] cursor-ew-resize"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section — Fire Engine (Custom procedural controls)
                ────────────────────────────────────────────────────── */}
            <div id="section-card-fireengine" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
              <div
                onClick={() => toggleSection("fireEngine")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-[#FF5500]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">Fire Engine</span>
                  {config.customRenderer === "FireEngine" && (
                    <span className="text-[9px] bg-[#FF5500]/20 text-[#FF8833] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Active</span>
                  )}
                </div>
                {collapsedSections.fireEngine ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.fireEngine && (
                <div className="p-3.5 flex flex-col gap-4">
                  {/* Active Engine Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-[#2A2A38]/50 flex-wrap gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#FF5500] font-bold block">Enable Fire Engine</span>
                      <span className="text-[8px] text-gray-500 font-mono block">When on, overrides standard rendering with dynamic realistic fire</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.customRenderer === "FireEngine"}
                      onChange={(e) => modifyConfig({ customRenderer: e.target.checked ? "FireEngine" : undefined })}
                      className="accent-[#FF5500] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Flame Color */}
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Flame Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.fireColor || "#FF5500"}
                        onChange={(e) => modifyConfig({ fireColor: e.target.value, customRenderer: "FireEngine" })}
                        className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.fireColor || "#FF5500"}
                        onChange={(e) => modifyConfig({ fireColor: e.target.value, customRenderer: "FireEngine" })}
                        className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#FF5500] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Fire Intensity */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Fire Intensity (Density)</label>
                      <span className="text-[10px] font-mono text-white">{config.fireIntensity ?? 5}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="0.5"
                      value={config.fireIntensity ?? 5}
                      onChange={(e) => modifyConfig({ fireIntensity: parseFloat(e.target.value), customRenderer: "FireEngine" })}
                      className="w-full accent-[#FF5500] cursor-ew-resize"
                    />
                  </div>

                  {/* Flame Height */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Flame Height</label>
                      <span className="text-[10px] font-mono text-white">{config.fireFlameHeight ?? 80}px</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="200"
                      step="5"
                      value={config.fireFlameHeight ?? 80}
                      onChange={(e) => modifyConfig({ fireFlameHeight: parseInt(e.target.value), customRenderer: "FireEngine" })}
                      className="w-full accent-[#FF5500] cursor-ew-resize"
                    />
                  </div>

                  {/* Ember Count */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Ember count (Sparks)</label>
                      <span className="text-[10px] font-mono text-white">{config.fireEmberCount ?? 150}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      step="10"
                      value={config.fireEmberCount ?? 150}
                      onChange={(e) => modifyConfig({ fireEmberCount: parseInt(e.target.value), customRenderer: "FireEngine" })}
                      className="w-full accent-[#FF5500] cursor-ew-resize"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section — Ice Engine (Custom procedural controls)
                ────────────────────────────────────────────────────── */}
            <div id="section-card-iceengine" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
              <div
                onClick={() => toggleSection("iceEngine")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Snowflake size={14} className="text-[#88DDFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">Ice Engine</span>
                  {config.customRenderer === "IceEngine" && (
                    <span className="text-[9px] bg-[#88DDFF]/20 text-[#AADFFF] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Active</span>
                  )}
                </div>
                {collapsedSections.iceEngine ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.iceEngine && (
                <div className="p-3.5 flex flex-col gap-4">
                  {/* Active Engine Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-[#2A2A38]/50 flex-wrap gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#88DDFF] font-bold block">Enable Ice Engine</span>
                      <span className="text-[8px] text-gray-500 font-mono block">When on, overrides standard rendering with dynamic realistic ice</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.customRenderer === "IceEngine"}
                      onChange={(e) => modifyConfig({ customRenderer: e.target.checked ? "IceEngine" : undefined })}
                      className="accent-[#88DDFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Ice Color */}
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Ice Tint Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.iceColor || "#AADDFF"}
                        onChange={(e) => modifyConfig({ iceColor: e.target.value, customRenderer: "IceEngine" })}
                        className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.iceColor || "#AADDFF"}
                        onChange={(e) => modifyConfig({ iceColor: e.target.value, customRenderer: "IceEngine" })}
                        className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#88DDFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Ice Thickness */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Ice Outer Thickness</label>
                      <span className="text-[10px] font-mono text-white">{config.iceThickness ?? 6}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={config.iceThickness ?? 6}
                      onChange={(e) => modifyConfig({ iceThickness: parseFloat(e.target.value), customRenderer: "IceEngine" })}
                      className="w-full accent-[#88DDFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Icicle Height */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Hanging Icicle Max Height</label>
                      <span className="text-[10px] font-mono text-white">{config.iceIcicleHeight ?? 25}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="1"
                      value={config.iceIcicleHeight ?? 25}
                      onChange={(e) => modifyConfig({ iceIcicleHeight: parseInt(e.target.value), customRenderer: "IceEngine" })}
                      className="w-full accent-[#88DDFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Frost Crack Density */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Frost Crack Segment Density</label>
                      <span className="text-[10px] font-mono text-white">{Math.round((config.iceFrostDensity ?? 0.6) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.iceFrostDensity ?? 0.6}
                      onChange={(e) => modifyConfig({ iceFrostDensity: parseFloat(e.target.value), customRenderer: "IceEngine" })}
                      className="w-full accent-[#88DDFF] cursor-ew-resize"
                    />
                  </div>

                  {/* Snow Pile Height */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Top Snow Cap Height</label>
                      <span className="text-[10px] font-mono text-white">{config.iceSnowHeight ?? 10}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={config.iceSnowHeight ?? 10}
                      onChange={(e) => modifyConfig({ iceSnowHeight: parseInt(e.target.value), customRenderer: "IceEngine" })}
                      className="w-full accent-[#88DDFF] cursor-ew-resize"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section — Aura Engine (Custom procedural controls)
                ────────────────────────────────────────────────────── */}
            <div id="section-card-auraengine" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
              <div
                onClick={() => toggleSection("auraEngine")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#C084FC]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">Aura Engine</span>
                  {config.customRenderer === "AuraEngine" && (
                    <span className="text-[9px] bg-[#C084FC]/20 text-[#D8B4FE] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">Active</span>
                  )}
                </div>
                {collapsedSections.auraEngine ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.auraEngine && (
                <div className="p-3.5 flex flex-col gap-4">
                  {/* Active Engine Toggle */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#0E0E12] border border-[#2A2A38]/50 flex-wrap gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#C084FC] font-bold block">Enable Aura Engine</span>
                      <span className="text-[8px] text-gray-500 font-mono block">When on, overrides standard rendering with electric plasma auras</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.customRenderer === "AuraEngine"}
                      onChange={(e) => modifyConfig({ customRenderer: e.target.checked ? "AuraEngine" : undefined })}
                      className="accent-[#C084FC] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Aura Color */}
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Aura Wisp Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.auraColor || "#C084FC"}
                        onChange={(e) => modifyConfig({ auraColor: e.target.value, customRenderer: "AuraEngine" })}
                        className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.auraColor || "#C084FC"}
                        onChange={(e) => modifyConfig({ auraColor: e.target.value, customRenderer: "AuraEngine" })}
                        className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#C084FC] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Aura Glow Color */}
                  <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Aura Ambient Glow Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.auraGlowColor || "#581C87"}
                        onChange={(e) => modifyConfig({ auraGlowColor: e.target.value, customRenderer: "AuraEngine" })}
                        className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.auraGlowColor || "#581C87"}
                        onChange={(e) => modifyConfig({ auraGlowColor: e.target.value, customRenderer: "AuraEngine" })}
                        className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#C084FC] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Aura Intensity */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Aura Filament Density (Intensity)</label>
                      <span className="text-[10px] font-mono text-white">{config.auraIntensity ?? 6}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="0.5"
                      value={config.auraIntensity ?? 6}
                      onChange={(e) => modifyConfig({ auraIntensity: parseFloat(e.target.value), customRenderer: "AuraEngine" })}
                      className="w-full accent-[#C084FC] cursor-ew-resize"
                    />
                  </div>

                  {/* Aura Reach */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Outer Reach Spread</label>
                      <span className="text-[10px] font-mono text-white">{config.auraReach ?? 35}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="2"
                      value={config.auraReach ?? 35}
                      onChange={(e) => modifyConfig({ auraReach: parseInt(e.target.value), customRenderer: "AuraEngine" })}
                      className="w-full accent-[#C084FC] cursor-ew-resize"
                    />
                  </div>

                  {/* Aura Particle Count */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] uppercase font-mono text-[#666677]">Energetic Spark Count</label>
                      <span className="text-[10px] font-mono text-white">{config.auraParticleCount ?? 160}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      step="10"
                      value={config.auraParticleCount ?? 160}
                      onChange={(e) => modifyConfig({ auraParticleCount: parseInt(e.target.value), customRenderer: "AuraEngine" })}
                      className="w-full accent-[#C084FC] cursor-ew-resize"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 3 — Fill
                ────────────────────────────────────────────────────── */}
            <div id="section-card-fill" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden mb-3">
              <div
                onClick={() => toggleSection("fill")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">3. Text Fill Color</span>
                  {!config.customRenderer && (
                    <span className="text-[9px] bg-[#7C6FFF]/20 text-white font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>
                  )}
                </div>
                {collapsedSections.fill ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.fill && (
                <div className="p-3.5 flex flex-col gap-3">
                  {/* Fill Radio Select */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1.5 animate-pulse">Fill Rendering Mode</label>
                    <div className="flex flex-wrap gap-1 select-none">
                      {["solid", "linear", "radial", "pattern", "none"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => modifyConfig({ fillType: type as any, customRenderer: undefined })}
                          className={`flex-1 min-w-[55px] py-1 rounded text-[10px] font-mono cursor-pointer uppercase border transition-all ${
                            config.fillType === type 
                              ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold" 
                              : "bg-[#0E0E12] border-[#2A2A38] text-[#666677] hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SOLID */}
                  {config.fillType === "solid" && (
                    <div className="p-2.5 rounded-lg bg-[#0E0E12] border border-[#2A2A38]">
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Color Palette</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.fillColor.startsWith("#") ? config.fillColor : "#ffffff"}
                          onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })}
                          className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                        />
                        <input
                          type="text"
                          value={config.fillColor}
                          onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })}
                          className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* GRADIENT (Linear & Radial) */}
                  {(config.fillType === "linear" || config.fillType === "radial") && (
                    <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#2A2A38] flex flex-col gap-3.5">
                      
                      {config.fillType === "linear" && (
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] uppercase font-mono text-[#666677]">Radial / Angle</label>
                            <span className="text-[10px] font-mono text-white">{config.fillGradientAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={config.fillGradientAngle}
                            onChange={(e) => modifyConfig({ fillGradientAngle: parseInt(e.target.value) })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>
                      )}

                      {/* Stops list */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between border-b border-[#2A2A38]/60 pb-1">
                          <span className="text-[10px] uppercase font-mono text-[#666677]">Stops ({config.fillGradientStops.length})</span>
                          {config.fillGradientStops.length < 6 && (
                            <button
                              type="button"
                              onClick={() => {
                                modifyConfig((prev) => {
                                  const offsets = prev.fillGradientStops.map((s) => s.offset);
                                  const maxOffset = Math.max(...offsets, 0);
                                  const newOffset = Math.min(100, maxOffset + 15);
                                  return {
                                    ...prev,
                                    fillGradientStops: [
                                      ...prev.fillGradientStops,
                                      { color: "#ffffff", offset: newOffset }
                                    ]
                                  };
                                });
                              }}
                              className="text-[9px] font-mono text-[#7C6FFF] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus size={10} /> Add Stop
                            </button>
                          )}
                        </div>

                        {config.fillGradientStops.map((stop, sidx) => (
                          <div key={sidx} className="flex items-center gap-2 bg-[#15151C] p-2 rounded-md border border-[#2A2A38]/50">
                            <input
                              type="color"
                              value={stop.color}
                              onChange={(e) => {
                                modifyConfig((prev) => {
                                  const stops = [...prev.fillGradientStops];
                                  stops[sidx] = { ...stops[sidx], color: e.target.value };
                                  return { ...prev, fillGradientStops: stops };
                                });
                              }}
                              className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                            />
                            
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stop.offset}
                              onChange={(e) => {
                                modifyConfig((prev) => {
                                  const stops = [...prev.fillGradientStops];
                                  stops[sidx] = { ...stops[sidx], offset: parseInt(e.target.value) };
                                  return { ...prev, fillGradientStops: stops };
                                });
                              }}
                              className="flex-1 accent-[#7C6FFF] cursor-ew-resize h-1"
                            />
                            
                            <span className="text-[9px] font-mono text-[#666677] w-[22px] text-right shrink-0">
                              {stop.offset}%
                            </span>

                            {config.fillGradientStops.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  modifyConfig((prev) => ({
                                    ...prev,
                                    fillGradientStops: prev.fillGradientStops.filter((_, i) => i !== sidx)
                                  }));
                                }}
                                className="p-0.5 text-[#666677] hover:text-red-500 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PATTERN */}
                  {config.fillType === "pattern" && (
                    <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#2A2A38] flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Pattern Color Accent</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.fillColor.startsWith("#") ? config.fillColor : "#ffffff"}
                            onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })}
                            className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={config.fillColor}
                            onChange={(e) => modifyConfig({ fillColor: e.target.value, customRenderer: undefined })}
                            className="flex-1 bg-[#15151C] border border-[#2A2A38] focus:border-[#7C6FFF] rounded p-1.5 text-xs text-white font-mono mt-0.5 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Canvas Texture Selection</label>
                        <div className="grid grid-cols-2 gap-1 select-none">
                          {[
                            { key: "chalk", label: "Chalk Brush" },
                            { key: "noise", label: "Sand Grain" },
                            { key: "grunge", label: "Grunge Weathered" },
                            { key: "carbon", label: "Carbon Grid" },
                            { key: "stripes", label: "Stripes Hatch" },
                            { key: "film", label: "Analog Film" },
                            { key: "brushed", label: "Brushed Metal" },
                            { key: "marble", label: "Stone Marble" },
                            { key: "halftone", label: "Comics Halftone" },
                            { key: "paper", label: "Craft Paper" }
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => modifyConfig({ patternType: item.key as any })}
                              className={`py-1 rounded text-[9px] font-mono cursor-pointer uppercase border transition-all ${
                                (config.patternType || "chalk") === item.key 
                                  ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white font-semibold" 
                                  : "bg-[#0E0E12] border-[#2A2A38] text-[#666677] hover:text-white"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NONE NOTE */}
                  {config.fillType === "none" && (
                    <div className="p-2.5 rounded-lg border border-dashed border-[#2A2A38] bg-transparent text-center">
                      <p className="text-xs text-[#666677] font-sans">
                        Hollow Core — No Fill layer active. Render relies entirely on Stroke settings below.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 4 — Stroke
                ────────────────────────────────────────────────────── */}
            <div id="section-card-stroke" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("stroke")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">4. Stroke Border</span>
                </div>
                {collapsedSections.stroke ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.stroke && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  {/* Enable */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Enable stroke outline</span>
                    <input
                      type="checkbox"
                      checked={config.strokeEnabled}
                      onChange={(e) => modifyConfig({ strokeEnabled: e.target.checked })}
                      className="accent-[#7C6FFF] w-4 h-4 rounded border-[#2A2A38] cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#2A2A38]/60 pt-3 select-none">
                    {/* Color */}
                    <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                      <input
                        type="color"
                        value={config.strokeColor.startsWith("#") ? config.strokeColor : "#7c6fff"}
                        onChange={(e) => modifyConfig({ strokeColor: e.target.value, strokeEnabled: true })}
                        className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.strokeColor}
                        onChange={(e) => modifyConfig({ strokeColor: e.target.value, strokeEnabled: true })}
                        className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Width */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Stroke Width</label>
                        <span className="text-[10px] font-mono text-white">{config.strokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={config.strokeWidth}
                        onChange={(e) => modifyConfig({ strokeWidth: parseInt(e.target.value), strokeEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Rendering Alignment</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                        {["outside", "center", "inside"].map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => modifyConfig({ strokePosition: pos as any, strokeEnabled: true })}
                            className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                              config.strokePosition === pos ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Opacity Level</label>
                        <span className="text-[10px] font-mono text-white">{config.strokeOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.strokeOpacity}
                        onChange={(e) => modifyConfig({ strokeOpacity: parseInt(e.target.value), strokeEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Line join */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Line Joins Edge</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                        {["round", "miter", "bevel"].map((join) => (
                          <button
                            key={join}
                            type="button"
                            onClick={() => modifyConfig({ strokeLineJoin: join as any, strokeEnabled: true })}
                            className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                              config.strokeLineJoin === join ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {join}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stroke Model Type Selector */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Stroke Model Type</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none">
                        {[
                          { key: "single", label: "Single" },
                          { key: "double", label: "Double" },
                          { key: "neon", label: "Neon Glow" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => modifyConfig({ strokeType: item.key as any, strokeEnabled: true })}
                            className={`py-1 text-[9px] rounded font-mono uppercase cursor-pointer transition-all ${
                              (config.strokeType || "single") === item.key 
                                ? "bg-[#7C6FFF] text-white font-semibold" 
                                : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stroke Blur Radius */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Stroke Blur Radius</label>
                        <span className="text-[10px] font-mono text-white">{(config.strokeBlur || 0)}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={config.strokeBlur || 0}
                        onChange={(e) => modifyConfig({ strokeBlur: parseInt(e.target.value), strokeEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Stroke Vertical Fade */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Vertical Fade Out</label>
                        <span className="text-[10px] font-mono text-white">{(config.strokeFadeRange || 0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.strokeFadeRange || 0}
                        onChange={(e) => modifyConfig({ strokeFadeRange: parseInt(e.target.value), strokeEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Double Stroke Settings */}
                    {config.strokeType === "double" && (
                      <div className="flex flex-col gap-3.5 bg-[#15151C] border border-[#2A2A38]/50 rounded-lg p-3 mt-1 animation-fade-in text-left">
                        <div className="text-[9px] uppercase font-mono tracking-wider text-[#7C6FFF] font-bold">
                          Double Stroke Outline Config
                        </div>
                        {/* Secondary Color Selector */}
                        <div>
                          <label className="text-[9px] uppercase font-mono text-[#666677] block mb-1">Outer Secondary Color</label>
                          <div className="flex items-center gap-2 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5">
                            <input
                              type="color"
                              value={(config.strokeColorSecondary || "#FFFFFF").startsWith("#") ? config.strokeColorSecondary : "#ffffff"}
                              onChange={(e) => modifyConfig({ strokeColorSecondary: e.target.value, strokeEnabled: true })}
                              className="w-6 h-6 bg-transparent border-none cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={config.strokeColorSecondary || "#FFFFFF"}
                              onChange={(e) => modifyConfig({ strokeColorSecondary: e.target.value, strokeEnabled: true })}
                              className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Secondary Width Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[9px] uppercase font-mono text-[#666677]">Outer Expansion Width</label>
                            <span className="text-[10px] font-mono text-white">+{config.strokeWidthSecondary !== undefined ? config.strokeWidthSecondary : 4}px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            value={config.strokeWidthSecondary !== undefined ? config.strokeWidthSecondary : 4}
                            onChange={(e) => modifyConfig({ strokeWidthSecondary: parseInt(e.target.value), strokeEnabled: true })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 5 — Glow Layers
                ────────────────────────────────────────────────────── */}
            <div id="section-card-glow" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("glow")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">5. Outer / Inner Glows</span>
                </div>
                {collapsedSections.glow ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.glow && (
                <div className="p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between hover:underline select-none">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Glow Specifiers ({config.glowLayers.length})</span>
                    {config.glowLayers.length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          modifyConfig((p) => ({
                            ...p,
                            glowLayers: [
                              ...p.glowLayers,
                              { enabled: true, color: "#FFE600", blur: 30, opacity: 90, type: "outer", strength: 3, spread: 4 }
                            ]
                          }));
                        }}
                        className="text-[9px] font-mono text-[#7C6FFF] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={10} /> Add Layer
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-1 select-none">
                    {config.glowLayers.length === 0 && (
                      <div className="p-2 border border-dashed border-[#2A2A38] rounded-md text-center text-xs text-[#666677]">
                        No active glow channels configured.
                      </div>
                    )}

                    {config.glowLayers.map((layer, lidx) => (
                      <div key={lidx} className="bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-3 flex flex-col gap-2.5 relative">
                        <div className="flex items-center justify-between border-b border-[#2A2A38]/60 pb-1.5 mb-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={layer.enabled}
                              onChange={(e) => {
                                modifyConfig((p) => {
                                  const layers = [...p.glowLayers];
                                  layers[lidx] = { ...layers[lidx], enabled: e.target.checked };
                                  return { ...p, glowLayers: layers };
                                });
                              }}
                              className="accent-[#7C6FFF] cursor-pointer"
                            />
                            <span className="text-[10px] font-mono font-medium text-white">Layer #{lidx + 1}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              modifyConfig((p) => ({
                                ...p,
                                glowLayers: p.glowLayers.filter((_, i) => i !== lidx)
                              }));
                            }}
                            className="p-0.5 text-[#666677] hover:text-red-500 rounded cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {layer.enabled && (
                          <div className="flex flex-col gap-2.5">
                            {/* Color */}
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={layer.color.startsWith("#") ? layer.color : "#7c6fff"}
                                onChange={(e) => {
                                  modifyConfig((p) => {
                                    const layers = [...p.glowLayers];
                                    layers[lidx] = { ...layers[lidx], color: e.target.value };
                                    return { ...p, glowLayers: layers };
                                  });
                                }}
                                className="w-6 h-6 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={layer.color}
                                onChange={(e) => {
                                  modifyConfig((p) => {
                                    const layers = [...p.glowLayers];
                                    layers[lidx] = { ...layers[lidx], color: e.target.value };
                                    return { ...p, glowLayers: layers };
                                  });
                                }}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38] p-1 text-[10px] text-white font-mono rounded"
                              />
                            </div>

                            {/* Blur & Opacity */}
                            <div className="grid grid-cols-2 gap-3.5 mt-1">
                              <div>
                                <div className="flex justify-between mb-0.5">
                                  <span className="text-[9px] font-mono text-[#666677]">Blur</span>
                                  <span className="text-[9px] font-mono text-white">{layer.blur}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="150"
                                  value={layer.blur}
                                  onChange={(e) => {
                                    modifyConfig((p) => {
                                      const layers = [...p.glowLayers];
                                      layers[lidx] = { ...layers[lidx], blur: parseInt(e.target.value) };
                                      return { ...p, glowLayers: layers };
                                    });
                                  }}
                                  className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between mb-0.5">
                                  <span className="text-[9px] font-mono text-[#666677]">Opacity</span>
                                  <span className="text-[9px] font-mono text-white">{layer.opacity}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={layer.opacity}
                                  onChange={(e) => {
                                    modifyConfig((p) => {
                                      const layers = [...p.glowLayers];
                                      layers[lidx] = { ...layers[lidx], opacity: parseInt(e.target.value) };
                                      return { ...p, glowLayers: layers };
                                    });
                                  }}
                                  className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                                />
                              </div>
                            </div>

                            {/* Inner / Outer Segmented */}
                            <div className="grid grid-cols-2 gap-0.5 bg-[#15151C] border border-[#2A2A38]/80 p-0.5 rounded-lg text-center mt-1">
                              {["outer", "inner"].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    modifyConfig((p) => {
                                      const layers = [...p.glowLayers];
                                      layers[lidx] = { ...layers[lidx], type: t as any };
                                      return { ...p, glowLayers: layers };
                                    });
                                  }}
                                  className={`py-0.5 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                                    layer.type === t ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>

                            {/* Strength & Spread Sliders */}
                            <div className="grid grid-cols-2 gap-3.5 mt-1 border-t border-[#2A2A38]/50 pt-2.5">
                              <div>
                                <div className="flex justify-between mb-0.5">
                                  <span className="text-[9px] font-mono text-[#666677]">Strength</span>
                                  <span className="text-[9px] font-mono text-white">{layer.strength ?? 1}x</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="20"
                                  step="1"
                                  value={layer.strength ?? 1}
                                  onChange={(e) => {
                                    modifyConfig((p) => {
                                      const layers = [...p.glowLayers];
                                      layers[lidx] = { ...layers[lidx], strength: parseInt(e.target.value) };
                                      return { ...p, glowLayers: layers };
                                    });
                                  }}
                                  className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between mb-0.5">
                                  <span className="text-[9px] font-mono text-[#666677]">Spread</span>
                                  <span className="text-[9px] font-mono text-white">{layer.spread ?? 0}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="50"
                                  step="1"
                                  value={layer.spread ?? 0}
                                  onChange={(e) => {
                                    modifyConfig((p) => {
                                      const layers = [...p.glowLayers];
                                      layers[lidx] = { ...layers[lidx], spread: parseInt(e.target.value) };
                                      return { ...p, glowLayers: layers };
                                    });
                                  }}
                                  className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 6 — Shadow
                ────────────────────────────────────────────────────── */}
            <div id="section-card-shadow" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("shadow")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Moon size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">6. Back Shadow</span>
                </div>
                {collapsedSections.shadow ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.shadow && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Enable Shadow</span>
                    <input
                      type="checkbox"
                      checked={config.shadowEnabled}
                      onChange={(e) => modifyConfig({ shadowEnabled: e.target.checked })}
                      className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#2A2A38]/50 pt-3 select-none">
                    {/* Color */}
                    <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                      <input
                        type="color"
                        value={config.shadowColor.startsWith("#") ? config.shadowColor : "#000000"}
                        onChange={(e) => modifyConfig({ shadowColor: e.target.value, shadowEnabled: true })}
                        className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.shadowColor}
                        onChange={(e) => modifyConfig({ shadowColor: e.target.value, shadowEnabled: true })}
                        className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Shadow Blur</label>
                        <span className="text-[10px] font-mono text-white">{config.shadowBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={config.shadowBlur}
                        onChange={(e) => modifyConfig({ shadowBlur: parseInt(e.target.value), shadowEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Offsets */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] uppercase font-mono text-[#666677]">Offset X</span>
                          <span className="text-[10px] font-mono text-white">{config.shadowOffsetX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={config.shadowOffsetX}
                          onChange={(e) => modifyConfig({ shadowOffsetX: parseInt(e.target.value), shadowEnabled: true })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] uppercase font-mono text-[#666677]">Offset Y</span>
                          <span className="text-[10px] font-mono text-white">{config.shadowOffsetY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={config.shadowOffsetY}
                          onChange={(e) => modifyConfig({ shadowOffsetY: parseInt(e.target.value), shadowEnabled: true })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <label className="text-[10px] uppercase font-mono text-[#666677]">Shadow Opacity</label>
                        <span className="text-[10px] font-mono text-white">{config.shadowOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.shadowOpacity}
                        onChange={(e) => modifyConfig({ shadowOpacity: parseInt(e.target.value), shadowEnabled: true })}
                        className="w-full accent-[#7C6FFF] cursor-ew-resize"
                      />
                    </div>

                    {/* Drop / Inner Type */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Projection Model</label>
                      <div className="grid grid-cols-2 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center font-semibold select-none">
                        {["drop", "inner"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => modifyConfig({ shadowType: t as any, shadowEnabled: true })}
                            className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                              config.shadowType === t ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {t} shadow
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 7 — 3D Bevel
                ────────────────────────────────────────────────────── */}
            <div id="section-card-bevel" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("bevel")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">7. 3D Extrusion Bevel</span>
                </div>
                {collapsedSections.bevel ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.bevel && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Enable 3D Depth</span>
                    <input
                      type="checkbox"
                      checked={config.bevelEnabled}
                      onChange={(e) => modifyConfig({ bevelEnabled: e.target.checked })}
                      className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                    <div className="flex flex-col gap-3 border-t border-[#2A2A38]/50 pt-3 select-none">
                      {/* Depth */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">Extrusion Depth</label>
                          <span className="text-[10px] font-mono text-white">{config.bevelDepth}px</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="60"
                          value={config.bevelDepth}
                          onChange={(e) => modifyConfig({ bevelDepth: parseInt(e.target.value) })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      {/* Projection Mode */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">3D Projection Type</label>
                          <span className="text-[10px] uppercase font-bold text-[#7C6FFF]">{config.bevelPerspectiveEnabled ? "Perspective" : "Parallel"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                          <button
                            type="button"
                            onClick={() => modifyConfig({ bevelPerspectiveEnabled: false })}
                            className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                              !config.bevelPerspectiveEnabled ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-[#888899]"
                            }`}
                          >
                            Parallel (Isometric)
                          </button>
                          <button
                            type="button"
                            onClick={() => modifyConfig({ bevelPerspectiveEnabled: true })}
                            className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                              config.bevelPerspectiveEnabled ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-[#888899]"
                            }`}
                          >
                            Perspective (V.P.)
                          </button>
                        </div>
                      </div>

                      {/* Parallel / Perspective Controls */}
                      {!config.bevelPerspectiveEnabled ? (
                        /* Direction for Parallel type */
                        <div>
                          <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Depth Angle Direction</label>
                          <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                            {["bottom-right", "bottom", "right"].map((dir) => (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => modifyConfig({ bevelDirection: dir as any })}
                                className={`py-1 text-[8px] rounded uppercase font-mono cursor-pointer transition-all ${
                                  config.bevelDirection === dir ? "bg-[#7C6FFF] text-white" : "text-[#666677] pr-0.5"
                                }`}
                              >
                                {dir.replace("-", " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Sliders for Perspective type */
                        <div className="flex flex-col gap-2.5 bg-[#0E0E12] border border-[#2A2A38]/50 p-2.5 rounded-lg select-none">
                          <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Vanishing Point & Projection Settings</span>
                          
                          {/* Vanishing Point X */}
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <label className="text-[8px] uppercase font-mono text-[#666677]">Vanishing Point X</label>
                              <span className="text-[9px] font-mono text-white">{(config.bevelVanishingPointX !== undefined ? config.bevelVanishingPointX : 40)}%</span>
                            </div>
                            <input
                              type="range"
                              min="-200"
                              max="200"
                              value={config.bevelVanishingPointX !== undefined ? config.bevelVanishingPointX : 40}
                              onChange={(e) => modifyConfig({ bevelVanishingPointX: parseInt(e.target.value) })}
                              className="w-full accent-teal-400 cursor-ew-resize"
                            />
                          </div>

                          {/* Vanishing Point Y */}
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <label className="text-[8px] uppercase font-mono text-[#666677]">Vanishing Point Y</label>
                              <span className="text-[9px] font-mono text-white">{(config.bevelVanishingPointY !== undefined ? config.bevelVanishingPointY : 80)}%</span>
                            </div>
                            <input
                              type="range"
                              min="-200"
                              max="200"
                              value={config.bevelVanishingPointY !== undefined ? config.bevelVanishingPointY : 80}
                              onChange={(e) => modifyConfig({ bevelVanishingPointY: parseInt(e.target.value) })}
                              className="w-full accent-teal-400 cursor-ew-resize"
                            />
                          </div>

                          {/* Focal Length */}
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <label className="text-[8px] uppercase font-mono text-[#666677] font-semibold">Focal Tension (Scale Recess)</label>
                              <span className="text-[9px] font-mono text-white">{config.bevelFocalLength !== undefined ? config.bevelFocalLength : 400}px</span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="1500"
                              step="20"
                              value={config.bevelFocalLength !== undefined ? config.bevelFocalLength : 400}
                              onChange={(e) => modifyConfig({ bevelFocalLength: parseInt(e.target.value) })}
                              className="w-full accent-teal-400 cursor-ew-resize"
                            />
                          </div>
                        </div>
                      )}

                      {/* Colors */}
                      <div className="flex flex-col gap-3 bg-[#0E0E12] border border-[#2A2A38] p-3 rounded-lg">
                        {/* 1. Highlight / Front Face */}
                        <div>
                          <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5" title="The topmost highlight layer of the 3D block">Front Face Highlight</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.bevelHighlight.startsWith("#") ? config.bevelHighlight : "#ffffff"}
                              onChange={(e) => modifyConfig({ bevelHighlight: e.target.value })}
                              className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={config.bevelHighlight}
                              onChange={(e) => modifyConfig({ bevelHighlight: e.target.value })}
                              className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* 2. Core Body Color */}
                        <div>
                          <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5" title="Main body filler color between front and back">Core Extrusion Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(config.bevelCoreColor || "#000000").startsWith("#") ? (config.bevelCoreColor || "#000000") : "#000000"}
                              onChange={(e) => modifyConfig({ bevelCoreColor: e.target.value })}
                              className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={config.bevelCoreColor || ""}
                              placeholder="e.g. #FF5500"
                              onChange={(e) => modifyConfig({ bevelCoreColor: e.target.value })}
                              className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700"
                            />
                          </div>
                        </div>

                        {/* 3. Deep Extrusion Anchor Shadow */}
                        <div>
                          <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5" title="The deepest back shadow of the 3D block">Deep Anchor Shadow (Base)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config.bevelShadow.startsWith("#") ? config.bevelShadow : "#000000"}
                              onChange={(e) => modifyConfig({ bevelShadow: e.target.value })}
                              className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                            />
                            <input
                              type="text"
                              value={config.bevelShadow}
                              onChange={(e) => modifyConfig({ bevelShadow: e.target.value })}
                              className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* 4. Slice Edge Outline Stroke */}
                        <div className="border-t border-[#2A2A38]/50 pt-2.5 mt-1 space-y-2">
                          <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider block">Slice Edge Outlines</label>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <div className="flex justify-between mb-0.5">
                                <label className="text-[8px] uppercase font-mono text-[#666677]">Edge Width</label>
                                <span className="text-[9px] font-mono text-white">{config.bevelEdgeWidth || 0}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={config.bevelEdgeWidth || 0}
                                onChange={(e) => modifyConfig({ bevelEdgeWidth: parseFloat(e.target.value) })}
                                className="w-full accent-teal-400 cursor-ew-resize"
                              />
                            </div>

                            <div>
                              <label className="text-[8px] uppercase font-mono text-[#666677] block mb-0.5">Edge Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={(config.bevelEdgeColor || "#1e1e26").startsWith("#") ? (config.bevelEdgeColor || "#1e1e26") : "#000000"}
                                  onChange={(e) => modifyConfig({ bevelEdgeColor: e.target.value })}
                                  className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={config.bevelEdgeColor || ""}
                                  placeholder="#2A2A38"
                                  onChange={(e) => modifyConfig({ bevelEdgeColor: e.target.value })}
                                  className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 5. Extrusion Ambient Blur Glow */}
                        <div className="border-t border-[#2A2A38]/50 pt-2.5 mt-1 space-y-2">
                          <label className="text-[9px] uppercase font-mono text-[#7C6FFF] font-bold tracking-wider block">Extrusion Blur (Ambient Glow)</label>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <div className="flex justify-between mb-0.5">
                                <label className="text-[8px] uppercase font-mono text-[#666677]">Blur Radius</label>
                                <span className="text-[9px] font-mono text-white">{config.bevelBlur || 0}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="30"
                                value={config.bevelBlur || 0}
                                onChange={(e) => modifyConfig({ bevelBlur: parseInt(e.target.value) })}
                                className="w-full accent-[#7C6FFF] cursor-ew-resize"
                              />
                            </div>

                            <div>
                              <label className="text-[8px] uppercase font-mono text-[#666677] block mb-0.5">Glow Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={(config.bevelBlurColor || "#000000").startsWith("#") ? (config.bevelBlurColor || "#000000") : "#000000"}
                                  onChange={(e) => modifyConfig({ bevelBlurColor: e.target.value })}
                                  className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={config.bevelBlurColor || ""}
                                  placeholder="#000000"
                                  onChange={(e) => modifyConfig({ bevelBlurColor: e.target.value })}
                                  className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[10px] text-white font-mono placeholder-gray-700 w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 7.5 — Custom Text Multi-Stack Extrusion
                ────────────────────────────────────────────────────── */}
            <div id="section-card-stack" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("stack")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">7.5. Multi-Stack Layers</span>
                </div>
                {collapsedSections.stack ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.stack && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Enable Stacking</span>
                    <input
                      type="checkbox"
                      checked={config.stackEnabled || false}
                      onChange={(e) => modifyConfig({ stackEnabled: e.target.checked })}
                      className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {(config.stackEnabled) && (
                    <div className="flex flex-col gap-3.5 border-t border-[#2A2A38]/50 pt-3 select-none">
                      {/* Stack Count */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">Stack Count</label>
                          <span className="text-[10px] font-mono text-white">{config.stackCount || 3} layers</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="6"
                          value={config.stackCount || 1}
                          onChange={(e) => modifyConfig({ stackCount: parseInt(e.target.value) })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      {/* Stack Offsets */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between mb-0.5">
                            <label className="text-[9px] uppercase font-mono text-[#666677]">Offset X</label>
                            <span className="text-[9px] font-mono text-white">{(config.stackOffsetX === undefined) ? 10 : config.stackOffsetX}px</span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            value={(config.stackOffsetX === undefined) ? 10 : config.stackOffsetX}
                            onChange={(e) => modifyConfig({ stackOffsetX: parseInt(e.target.value) })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <label className="text-[9px] uppercase font-mono text-[#666677]">Offset Y</label>
                            <span className="text-[9px] font-mono text-white">{(config.stackOffsetY === undefined) ? -10 : config.stackOffsetY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            value={(config.stackOffsetY === undefined) ? -10 : config.stackOffsetY}
                            onChange={(e) => modifyConfig({ stackOffsetY: parseInt(e.target.value) })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>
                      </div>

                      {/* Opacity Decay */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">Opacity Decay / Layer</label>
                          <span className="text-[10px] font-mono text-white">{(config.stackOpacityDecay === undefined) ? 20 : config.stackOpacityDecay}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          value={(config.stackOpacityDecay === undefined) ? 20 : config.stackOpacityDecay}
                          onChange={(e) => modifyConfig({ stackOpacityDecay: parseInt(e.target.value) })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      {/* Stack Colors Repeat Palette */}
                      <div className="border-t border-[#2A2A38]/50 pt-3 mt-1 flex flex-col gap-2.5">
                        <label className="text-[9px] uppercase font-mono text-teal-400 font-bold tracking-wider">Layer Repeat Colors</label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5">Layer Color 1</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={(config.stackColor1 || "#FF7C00").startsWith("#") ? (config.stackColor1 || "#FF7C00") : "#000000"}
                                onChange={(e) => modifyConfig({ stackColor1: e.target.value })}
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={config.stackColor1 || ""}
                                placeholder="#FF7C00"
                                onChange={(e) => modifyConfig({ stackColor1: e.target.value })}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5">Layer Color 2</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={(config.stackColor2 || "#00FFDD").startsWith("#") ? (config.stackColor2 || "#00FFDD") : "#000000"}
                                onChange={(e) => modifyConfig({ stackColor2: e.target.value })}
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={config.stackColor2 || ""}
                                placeholder="#00FFDD"
                                onChange={(e) => modifyConfig({ stackColor2: e.target.value })}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5">Layer Color 3</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={(config.stackColor3 || "#FF00AA").startsWith("#") ? (config.stackColor3 || "#FF00AA") : "#000000"}
                                onChange={(e) => modifyConfig({ stackColor3: e.target.value })}
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={config.stackColor3 || ""}
                                placeholder="#FF00AA"
                                onChange={(e) => modifyConfig({ stackColor3: e.target.value })}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-mono text-[#666677] block mb-0.5">Layer Color 4</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={(config.stackColor4 || "#AA00FF").startsWith("#") ? (config.stackColor4 || "#AA00FF") : "#000000"}
                                onChange={(e) => modifyConfig({ stackColor4: e.target.value })}
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={config.stackColor4 || ""}
                                placeholder="#AA00FF"
                                onChange={(e) => modifyConfig({ stackColor4: e.target.value })}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38]/80 rounded p-1 text-[9px] text-white font-mono placeholder-gray-700 w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 8 — Background Panel
                ────────────────────────────────────────────────────── */}
            <div id="section-card-panel" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("panel")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layout size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">8. Bounding Plate</span>
                </div>
                {collapsedSections.panel ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.panel && (
                <div className="p-3.5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#666677]">Enable Bounding Plate</span>
                    <input
                      type="checkbox"
                      checked={config.panelEnabled}
                      onChange={(e) => modifyConfig({ panelEnabled: e.target.checked })}
                      className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {config.panelEnabled && (
                    <div className="flex flex-col gap-3.5 border-t border-[#2A2A38]/50 pt-3 select-none">
                      {/* Color */}
                      <div className="flex items-center gap-3 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2">
                        <input
                          type="color"
                          value={config.panelColor.startsWith("#") ? config.panelColor : "#1e1e26"}
                          onChange={(e) => modifyConfig({ panelColor: e.target.value })}
                          className="w-7 h-7 bg-transparent border-none cursor-pointer p-0 shrink-0"
                        />
                        <input
                          type="text"
                          value={config.panelColor}
                          onChange={(e) => modifyConfig({ panelColor: e.target.value })}
                          className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      {/* Opacity */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">Plate Opacity</label>
                          <span className="text-[10px] font-mono text-white">{config.panelOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.panelOpacity}
                          onChange={(e) => modifyConfig({ panelOpacity: parseInt(e.target.value) })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      {/* Radius */}
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <label className="text-[10px] uppercase font-mono text-[#666677]">Corner Radius</label>
                          <span className="text-[10px] font-mono text-white">{config.panelRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          value={config.panelRadius}
                          onChange={(e) => modifyConfig({ panelRadius: parseInt(e.target.value) })}
                          className="w-full accent-[#7C6FFF] cursor-ew-resize"
                        />
                      </div>

                      {/* Paddings */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[10px] uppercase font-mono text-[#666677]">Padding Horiz</span>
                            <span className="text-[10px] font-mono text-white">{config.panelPaddingX}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={config.panelPaddingX}
                            onChange={(e) => modifyConfig({ panelPaddingX: parseInt(e.target.value) })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[10px] uppercase font-mono text-[#666677]">Padding Vert</span>
                            <span className="text-[10px] font-mono text-white">{config.panelPaddingY}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={config.panelPaddingY}
                            onChange={(e) => modifyConfig({ panelPaddingY: parseInt(e.target.value) })}
                            className="w-full accent-[#7C6FFF] cursor-ew-resize"
                          />
                        </div>
                      </div>

                      {/* Plate Stroke outline */}
                      <div className="border-t border-[#2A2A38]/50 pt-3.5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-mono text-[#666677]">Border stroke outline</span>
                          <input
                            type="checkbox"
                            checked={config.panelStrokeEnabled}
                            onChange={(e) => modifyConfig({ panelStrokeEnabled: e.target.checked })}
                            className="accent-[#7C6FFF] w-4 h-4 cursor-pointer"
                          />
                        </div>

                        {config.panelStrokeEnabled && (
                          <div className="flex flex-col gap-3 bg-[#0E0E12] border border-[#2A2A38]/80 rounded p-2.5">
                            {/* color */}
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={config.panelStrokeColor.startsWith("#") ? config.panelStrokeColor : "#2a2a38"}
                                onChange={(e) => modifyConfig({ panelStrokeColor: e.target.value })}
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={config.panelStrokeColor}
                                onChange={(e) => modifyConfig({ panelStrokeColor: e.target.value })}
                                className="flex-1 bg-[#15151C] border border-[#2A2A38]/50 p-1 text-[10px] text-white font-mono rounded"
                              />
                            </div>
                            
                            {/* width */}
                            <div>
                              <div className="flex justify-between mb-0.5">
                                <span className="text-[8px] uppercase font-mono text-[#666677]">Border Width</span>
                                <span className="text-[9px] font-mono text-white">{config.panelStrokeWidth}px</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={config.panelStrokeWidth}
                                onChange={(e) => modifyConfig({ panelStrokeWidth: parseInt(e.target.value) })}
                                className="w-full accent-[#7C6FFF] cursor-ew-resize h-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ──────────────────────────────────────────────────────
                Section 9 — Canvas
                ────────────────────────────────────────────────────── */}
            <div id="section-card-canvas" className="rounded-lg bg-[#1E1E26] border border-[#2A2A38] overflow-hidden">
              <div
                onClick={() => toggleSection("canvas")}
                className="flex items-center justify-between p-3 px-3.5 bg-[#252530]/50 border-b border-[#2A2A38] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-[#7C6FFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-white font-sans">9. Studio Canvas Layout</span>
                </div>
                {collapsedSections.canvas ? <ChevronDown size={14} className="text-[#666677]" /> : <ChevronUp size={14} className="text-[#666677]" />}
              </div>

              {!collapsedSections.canvas && (
                <div className="p-3.5 flex flex-col gap-3.5 select-none animate-fade-in">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-0.5">Width px</label>
                      <input
                        type="number"
                        min="200"
                        max="2400"
                        value={config.canvasWidth}
                        onChange={(e) => modifyConfig({ canvasWidth: Math.max(200, Math.min(2400, parseInt(e.target.value) || 800)) })}
                        className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 p text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-0.5">Height px</label>
                      <input
                        type="number"
                        min="100"
                        max="1200"
                        value={config.canvasHeight}
                        onChange={(e) => modifyConfig({ canvasHeight: Math.max(100, Math.min(1200, parseInt(e.target.value) || 200)) })}
                        className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#7C6FFF]"
                      />
                    </div>
                  </div>

                  {/* Horizontal and vertical alignment segmented */}
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Horizontal Anchor</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                        {["left", "center", "right"].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => modifyConfig({ textPosX: align as any })}
                            className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                              config.textPosX === align ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Vertical Anchor</label>
                      <div className="grid grid-cols-3 gap-0.5 bg-[#0E0E12] border border-[#2A2A38] p-0.5 rounded-lg text-center select-none font-semibold">
                        {["top", "middle", "bottom"].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => modifyConfig({ textPosY: align as any })}
                            className={`py-1 text-[9px] uppercase font-mono rounded cursor-pointer transition-all ${
                              config.textPosY === align ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* CENTER PANEL — PREVIEW (Fills remaining) */}
        <section
          id="center-preview-viewport"
          className={`${
            isMobile && mobileActiveTab !== "preview" ? "hidden" : "flex"
          } flex-1 flex-col bg-[#09090D] overflow-hidden relative border-r border-[#2A2A38]`}
        >
          {/* Viewport Toolbar */}
          <div className="flex items-center justify-between border-b border-[#2A2A38] bg-[#15151C] px-4 py-2 bg-gradient-to-r from-[#15151C] to-[#111115] select-none z-10 shrink-0">
            {/* Left toolbar items */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide font-sans flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C6FFF] animate-pulse"></span>
                Canvas Work Area
              </span>
              <span className="text-[10px] font-mono text-[#666677] bg-[#2A2A38]/50 px-2 py-0.5 rounded border border-[#2A2A38]/20 truncate max-w-[120px] md:max-w-none">
                {config.canvasWidth}×{config.canvasHeight} px
              </span>
            </div>

            {/* Quick interactive utility actions */}
            <div className="flex items-center gap-2">
              {/* Checkerboard toggle */}
              <div className="flex items-center bg-[#0E0E12] border border-[#2A2A38]/85 p-0.5 rounded">
                <button
                  id="toggle-bg-checker"
                  onClick={() => setBgMode("checkerboard")}
                  className={`p-1 px-2.5 rounded text-[10px] font-mono hover:text-white transition-all cursor-pointer ${
                    bgMode === "checkerboard" ? "bg-[#1E1E26] text-[#7C6FFF] font-semibold" : "text-[#666677]"
                  }`}
                  title="Evaluation Checkerboard"
                >
                  Alpha
                </button>
                <button
                  id="toggle-bg-black"
                  onClick={() => setBgMode("black")}
                  className={`p-1 px-2.5 rounded text-[10px] font-mono hover:text-white transition-all cursor-pointer ${
                    bgMode === "black" ? "bg-[#1E1E26] text-[#7C6FFF] font-semibold" : "text-[#666677]"
                  }`}
                  title="Evaluate in black to test faint glows"
                >
                  Black
                </button>
              </div>

              {/* Zoom sliders */}
              <div className="flex items-center gap-1 border-r border-[#2A2A38] pr-2 mr-1">
                <button
                  id="zoom-out-btn"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-1 text-[#666677] hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[10px] font-mono text-[#666677] text-center w-[30px]">{zoom}%</span>
                <button
                  id="zoom-in-btn"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 text-[#666677] hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Download & Copy */}
              <button
                id="copy-to-clipboard-image-btn"
                onClick={copyImageToClipboard}
                className="p-1.5 px-3 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[11px] font-medium border border-[#2A2A38] hover:border-[#7C6FFF] rounded flex items-center gap-1 transition-all cursor-pointer font-sans"
              >
                <Copy size={12} className={copiedImageFeedback ? "text-green-500" : "text-white"} /> 
                {copiedImageFeedback ? "Copied ✓" : "Copy PNG"}
              </button>

              <button
                id="download-canvas-image-btn"
                onClick={downloadPng}
                className="p-1.5 px-3.5 bg-[#7C6FFF] hover:bg-[#6859FF] text-white text-[11px] font-medium rounded shadow transition-all flex items-center gap-1 cursor-pointer font-sans hover:shadow-[0_0_10px_rgba(124,111,255,0.25)]"
              >
                <Download size={12} /> Get PNG
              </button>
            </div>
          </div>

          {/* Active Canvas Frame viewport wrapper */}
          <div className="flex-1 flex overflow-auto items-center justify-center p-6 relative">
            <div
              id="preview-canvas-card"
              className={`rounded-lg p-0.5 border border-[#2A2A38] shadow-2xl transition-all duration-150 relative ${
                bgMode === "checkerboard" ? "checkerboard" : "bg-[#000000]"
              }`}
              style={{
                width: `${config.canvasWidth}px`,
                height: `${config.canvasHeight}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center center"
              }}
            >
              <canvas
                ref={canvasRef}
                id="clypra-preview-canvas"
                className="block w-full h-full select-none"
              />
            </div>

            {/* Effect name Badge indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#1E1E26]/85 backdrop-blur border border-[#2A2A38] p-1.5 px-3 rounded-md select-none">
              <Type size={12} className="text-[#7C6FFF]" />
              <span className="text-[10px] font-mono font-medium text-white">
                Class Name: <span className="text-[#7C6FFF] font-bold">{toPascalCase(getEnrichedEffectName(config)) || "MyEffect"}Engine</span>
              </span>
            </div>
          </div>

          {/* Font Comparison Matrix Panel Drawer */}
          {showFontCompare && (
            <FontCompare
              config={config}
              onSelectFont={(font) => {
                modifyConfig({ fontFamily: font });
              }}
              onClose={() => setShowFontCompare(false)}
            />
          )}

          <TimelinePanel
            scene={scene}
            previewTime={previewTime}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying((p) => !p)}
            onReset={() => setPreviewTime(0)}
            onTimeChange={setPreviewTime}
            onSceneChange={modifyScene}
          />
        </section>

        {/* RIGHT PANEL — EXPORT CODE (360px) */}
        <section
          id="right-code-panel"
          className={`${
            isMobile && mobileActiveTab !== "code" ? "hidden" : "flex"
          } w-full md:w-[360px] flex-col border-l border-[#2A2A38] bg-[#15151C] shrink-0 overflow-hidden relative`}
        >
          {/* Header Tabbed controls */}
          <div className="flex items-center justify-between border-b border-[#2A2A38] bg-[#1E1E26] select-none shrink-0 z-10 p-1">
            <div className="flex bg-[#0D0D11] border border-[#2A2A38]/60 p-0.5 rounded-lg w-full">
              <button
                id="code-tab-engine-class"
                onClick={() => setActiveTab("engine")}
                className={`flex-1 py-1.5 text-center text-[10px] font-semibold tracking-wide uppercase rounded font-sans transition-all cursor-pointer ${
                  activeTab === "engine" ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                }`}
              >
                Engine Code
              </button>
              <button
                id="code-tab-effect-definition"
                onClick={() => setActiveTab("definition")}
                className={`flex-1 py-1.5 text-center text-[10px] font-semibold tracking-wide uppercase rounded font-sans transition-all cursor-pointer ${
                  activeTab === "definition" ? "bg-[#7C6FFF] text-white" : "text-[#666677] hover:text-white"
                }`}
              >
                Clypra Spec
              </button>
              <button
                id="code-tab-lab"
                onClick={() => setActiveTab("lab")}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold tracking-wide uppercase rounded font-sans transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "lab" ? "bg-teal-500 text-black font-extrabold shadow-[0_0_10px_rgba(45,212,191,0.2)]" : "text-teal-400 hover:text-teal-300"
                }`}
              >
                <Beaker size={10} /> Lab & Extend
              </button>
            </div>
          </div>

          {activeTab === "lab" ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#111116] text-[#A0A0B0] font-sans">
              {/* Header Info */}
              <div className="p-4 border-b border-[#2A2A38] bg-[#16161F]">
                <h4 className="text-[11px] font-bold text-white tracking-wider flex items-center gap-1.5 uppercase font-sans">
                  <Beaker size={13} className="text-teal-400 animate-pulse" /> Typographic Research & Extend Lab
                </h4>
                <p className="text-[10px] text-[#666677] mt-1 font-sans leading-normal">
                  Deconstruct design history, analyze complex visual movements, automatically populate configurations, and copy unreleased raw Canvas extensions.
                </p>
              </div>

              {/* Lab Scroll Content */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Section 1: AI Deep Research */}
                <div className="bg-[#181824] border border-[#2A2A38] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#7C6FFF] font-bold tracking-wider flex items-center gap-1.5">
                      <Sparkles size={11} className="text-teal-400" /> Deep Co-Pilot Researcher
                    </span>
                    <span className="text-[9px] font-mono text-gray-500">Gemini-3.5-Flash</span>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-normal">
                    Query any historical or conceptual era (e.g., "Swiss-International Minimalist Grid", "Neo-Memphis Neon Pastel", "Raw Brutalist Grindcore"):
                  </p>

                  <div className="flex gap-2">
                    <input
                      id="lab-research-topic-input"
                      type="text"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="e.g. Acid Neon Glow, Bauhaus Mono"
                      disabled={researchStatus === "researching"}
                      className="flex-1 bg-[#09090D] border border-gray-800 focus:border-teal-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-gray-700 disabled:opacity-50 font-sans"
                    />
                    <button
                      id="lab-research-submit-btn"
                      onClick={handleExecuteDeepResearch}
                      disabled={researchStatus === "researching" || !researchTopic.trim()}
                      className="p-1 px-3 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {researchStatus === "researching" ? "Running..." : "Query"}
                    </button>
                  </div>

                  {/* Research Logs */}
                  {researchStatus === "researching" && (
                    <div className="p-3 bg-[#09090D] border border-dashed border-gray-800 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Loader2 size={11} className="text-teal-400 animate-spin" />
                        <span className="text-[10px] font-mono text-teal-400 font-bold uppercase">Synthesizing...</span>
                      </div>
                      <div className="space-y-1 pl-4">
                        {researchLogs.map((log, i) => (
                          <div key={i} className="text-[9px] font-mono text-gray-500 leading-snug">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Research Error */}
                  {researchStatus === "failed" && (
                    <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-350 text-[10px] rounded-lg font-mono">
                      Query Error: {researchError}
                    </div>
                  )}

                  {/* Research Result Block */}
                  {researchStatus === "completed" && researchResult && (
                    <div className="space-y-3.5 mt-2 animate-scale-up">
                      <div className="p-3 bg-[#09090D]/80 border border-teal-500/20 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">
                            {researchResult.themeName}
                          </h5>
                          <button
                            onClick={() => {
                              forceSaveHistoryImmediately(config);
                              setConfig({
                                ...researchResult.config,
                                text: config.text,
                                customRenderer: researchResult.extensionCode ? {
                                  name: researchResult.themeName,
                                  code: researchResult.extensionCode
                                } : undefined
                              });
                              setActivePresetId("blended");
                            }}
                            className="text-[9px] bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/30 hover:border-teal-500 text-teal-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
                            title="Load the researched style payload"
                          >
                            Apply Style Spec
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-300 italic leading-relaxed font-sans">
                          "{researchResult.historicalContext}"
                        </p>
                      </div>

                      {/* Visual Rules */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-[#666677] tracking-wider block font-semibold">Decentered Visual Constraints</span>
                        <div className="space-y-1.5 pl-1">
                          {researchResult.visualRules.map((rule, idx) => (
                            <div key={idx} className="text-[10px] flex items-start gap-1.5 text-gray-300 font-sans leading-relaxed">
                              <span className="text-teal-400 shrink-0 select-none">●</span>
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette Deconstruction */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-[#666677] tracking-wider block font-semibold">Mood Tint Offsets</span>
                        <div className="grid grid-cols-1 gap-1">
                          {researchResult.paletteDeconstruction.map((colorMeaning, idx) => (
                            <div key={idx} className="text-[9px] p-1.5 bg-[#09090D]/50 border border-gray-800/60 rounded font-mono text-gray-400 leading-normal">
                              {colorMeaning}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Experimental Extendability Tools Renderer Code */}
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono uppercase text-[#7C6FFF] tracking-wider flex items-center gap-1 font-semibold">
                            <FileCode size={11} className="text-teal-400" /> Canvas Extender Routine
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(researchResult.extensionCode);
                              alert("Canvas context drawing code copied!");
                            }}
                            className="text-[9px] text-[#6cb0ff] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <Copy size={9} /> Copy Code
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-400 font-sans leading-relaxed">
                          Plug this rendering routine into your canvas drawing cycle to produce procedural grid systems, particles, or scans:
                        </p>
                        <pre className="p-2 bg-[#08080C] border border-gray-800 rounded-lg max-h-[140px] overflow-auto text-[9px] font-mono text-teal-300 select-all leading-relaxed whitespace-pre scrollbar-none">
                          {researchResult.extensionCode}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Preset Blend Panel */}
                <div className="bg-[#181824] border border-[#2A2A38] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono uppercase text-[#7C6FFF] font-bold tracking-wider flex items-center gap-1.5">
                    <ArrowUpDown size={11} className="text-teal-400" /> Style Blender Lab
                  </span>

                  <p className="text-[10px] text-gray-400 leading-normal">
                    Blend two compositional styles mathematically to form a completely new custom design preset.
                  </p>

                  <div className="space-y-2.5">
                    {/* Select Preset A */}
                    <div>
                      <label className="text-[9px] font-mono uppercase text-gray-500 block mb-1">COMPOSITION SPECIMEN A</label>
                      <select
                        id="blend-select-a"
                        value={blendAId}
                        onChange={(e) => setBlendAId(e.target.value)}
                        className="w-full bg-[#09090D] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400 font-medium cursor-pointer"
                      >
                        {[...customPresets, ...builtInPresets].map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#111116]">
                            {p.isCustom ? "★ " : ""}{p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Preset B */}
                    <div>
                      <label className="text-[9px] font-mono uppercase text-gray-500 block mb-1">COMPOSITION SPECIMEN B</label>
                      <select
                        id="blend-select-b"
                        value={blendBId}
                        onChange={(e) => setBlendBId(e.target.value)}
                        className="w-full bg-[#09090D] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400 font-medium cursor-pointer"
                      >
                        {[...customPresets, ...builtInPresets].map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#111116]">
                            {p.isCustom ? "★ " : ""}{p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Blender Factor slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center select-none text-[9px] font-mono">
                        <span className="text-gray-500">Blend Balance ({Math.round(blendRatio * 100)}%)</span>
                        <div className="flex gap-2">
                          <span className={blendRatio < 0.45 ? "text-teal-400 font-bold" : "text-gray-600"}>A</span>
                          <span className={blendRatio >= 0.45 && blendRatio <= 0.55 ? "text-[#7C6FFF] font-bold" : "text-gray-600"}>Ideal</span>
                          <span className={blendRatio > 0.55 ? "text-teal-400 font-bold" : "text-gray-600"}>B</span>
                        </div>
                      </div>
                      <input
                        id="blend-factor-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={blendRatio}
                        onChange={(e) => setBlendRatio(parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#09090D] rounded-lg appearance-none cursor-pointer accent-teal-400"
                      />
                    </div>

                    {/* Blend Action button */}
                    <button
                      id="perform-blend-action-btn"
                      onClick={handlePerformBlend}
                      className="w-full py-2 px-3 bg-[#7C6FFF] hover:bg-[#6c5eff] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all scale-feedbacks cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-lg shadow-[#7C6FFF]/15 hover:shadow-[#7C6FFF]/35"
                    >
                      <Beaker size={12} /> Render Composite Blend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Code Header Actions */}
              <div className="flex flex-col border-b border-[#2A2A38] bg-[#111116] select-none shrink-0 border-t border-[#1E1E26]/50">
                {/* Upper Virtual Filename header indicator */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#2A2A38]/40 bg-[#16161F]">
                  <span className="text-[9px] font-mono uppercase text-[#666677] tracking-wider">
                    Virtual Export Target
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-300">
                    {activeTab === "engine" 
                      ? (engineFormat === "html" 
                        ? `${activeEffectId}-sandbox.html` 
                        : `${activeEffectId}-engine.${engineFormat}`)
                      : (definitionFormat === "html" 
                        ? `${activeEffectId}-sandbox.html` 
                        : `${activeEffectId}-definition.${definitionFormat}`)
                    }
                  </span>
                </div>

                {/* Lower buttons & format dropdown bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 bg-[#111116]">
                  {/* Format select dropdown */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase text-[#555566] shrink-0">Format:</span>
                    {activeTab === "engine" ? (
                      <select
                        id="engine-format-dropdown"
                        value={engineFormat}
                        onChange={(e) => setEngineFormat(e.target.value as any)}
                        className="bg-[#0A0A0E] border border-[#2A2A38] hover:border-[#7C6FFF]/50 text-white text-[11px] font-sans rounded px-2 py-1.5 focus:outline-none focus:border-[#7C6FFF] cursor-pointer flex-1 min-w-0 transition-all font-medium"
                      >
                        <option value="ts">TypeScript (.ts)</option>
                        <option value="js">JavaScript (.js)</option>
                        <option value="html">Interactive Sandbox (.html)</option>
                        <option value="txt">Text Only (.txt)</option>
                      </select>
                    ) : (
                      <select
                        id="definition-format-dropdown"
                        value={definitionFormat}
                        onChange={(e) => setDefinitionFormat(e.target.value as any)}
                        className="bg-[#0A0A0E] border border-[#2A2A38] hover:border-[#7C6FFF]/50 text-white text-[11px] font-sans rounded px-2 py-1.5 focus:outline-none focus:border-[#7C6FFF] cursor-pointer flex-1 min-w-0 transition-all font-medium"
                      >
                        <option value="ts">TypeScript (.ts)</option>
                        <option value="json">Raw JSON (.json)</option>
                        <option value="html">Interactive Sandbox (.html)</option>
                        <option value="txt">Text Only (.txt)</option>
                      </select>
                    )}
                  </div>

                  {/* Action standard buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <button
                      id="copy-code-cloner-btn"
                      onClick={copyCodeToClipboard}
                      className="p-1 px-3 bg-[#1E1E26] hover:bg-[#2A2A38] text-white text-[10px] font-semibold border border-[#2A2A38] hover:border-[#7C6FFF] rounded transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                      title="Copy current code to clipboard"
                    >
                      <Copy size={11} className={copiedCodeFeedback ? "text-green-500" : "text-white"} />
                      {copiedCodeFeedback ? "Copied" : "Copy"}
                    </button>

                    <button
                      id="download-code-btn"
                      onClick={downloadCodeAsFile}
                      className="p-1 px-3 bg-[#7C6FFF]/25 hover:bg-[#7C6FFF]/35 active:bg-[#7C6FFF]/55 text-white text-[10px] font-bold border border-[#7C6FFF]/45 hover:border-[#7C6FFF] rounded transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-lg shadow-[#7C6FFF]/10"
                      title="Download code as localized file"
                    >
                      <Download size={11} className="text-[#a89fff]" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Syntax Highlight Frame block scrollable */}
              <div id="hljs-code-scroller" className="flex-1 overflow-auto bg-[#09090D] p-4 font-mono flex">
                {/* Live line numbering counts gutter */}
                <div className="flex select-none flex-col text-right text-[#313142] font-mono pr-2.5 border-r border-[#1E1E26] mr-2.5 font-semibold text-[10px] leading-5 w-[18px]">
                  {getCurrentCodeText().split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code markup rendering container */}
                <pre className="overflow-x-auto flex-1 text-xs select-text leading-5 font-mono whitespace-pre text-gray-300">
                  <code
                    className="language-typescript block bg-transparent"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              </div>

              {/* Bottom branding or tips line */}
              <div className="border-t border-[#2A2A38] bg-[#15151C] p-3 text-[10px] text-[#666677] text-center font-sans select-none shrink-0 leading-normal">
                To export, copy the block above and save it inside your Clypra directory under{" "}
                <span className="text-gray-400 font-mono">/features/text-effects/</span>
              </div>
            </>
          )}
        </section>
      </main>

      {/* ──────────────────────────────────────────────────────────────────
          DIALOG MODALS
          ────────────────────────────────────────────────────────────────── */}
      {showSavePresetModal && (
        <div id="save-preset-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center select-none z-50">
          <div className="bg-[#1E1E26] border border-[#2A2A38] w-[340px] rounded-xl p-5 shadow-2xl animate-scale-up">
            <h3 className="text-sm font-semibold text-white tracking-wide font-sans mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#7C6FFF]" />
              Save Visual Specimen Preset
            </h3>
            <p className="text-xs text-[#666677] font-sans mb-4 leading-normal">
              Register this composition style into local presets storage. Custom presets appear in the top carousel.
            </p>

            <div className="mb-3">
              <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Named Identifier</label>
              <div className="flex gap-1.5">
                <input
                  id="input-save-preset-name"
                  type="text"
                  placeholder="e.g. Acid Neon, Bronze Metal"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  className="flex-1 bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] font-sans min-w-0"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiPresetName}
                  disabled={isGeneratingName}
                  className="px-2.5 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/20 active:bg-[#7C6FFF]/30 border border-[#7C6FFF]/30 rounded-lg text-[#7C6FFF] font-sans text-xs flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Generate descriptive name with AI"
                >
                  {isGeneratingName ? (
                    <Loader2 size={13} className="animate-spin text-[#7C6FFF]" />
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span className="text-[10px] font-semibold">AI Name</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] uppercase font-mono text-[#666677] block mb-1">Category Group</label>
              <select
                id="select-save-preset-category"
                value={customPresetCategory}
                onChange={(e) => setCustomPresetCategory(e.target.value)}
                className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#7C6FFF] select-none font-sans"
              >
                <option value="Classic">Classic</option>
                <option value="Neon">Neon</option>
                <option value="Experimental">Experimental</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                id="cancel-save-preset-btn"
                onClick={() => {
                  setCustomPresetName("");
                  setShowSavePresetModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[#2A2A38] hover:bg-[#2A2A38] text-white cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                id="confirm-save-preset-btn"
                onClick={handleSaveCustomPreset}
                disabled={!customPresetName.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer font-sans transition-all ${
                  customPresetName.trim() 
                    ? "bg-[#7C6FFF] hover:bg-[#6859FF] shadow-lg shadow-[#7C6FFF]/20" 
                    : "bg-gray-800 text-gray-600 border border-gray-750 cursor-not-allowed"
                }`}
              >
                Save Specimen
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageScanModal && (
        <div id="image-scan-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center select-none z-50 p-4">
          <div className="bg-[#1E1E26] border border-[#2A2A38] w-full max-w-[480px] rounded-xl p-6 shadow-2xl animate-scale-up text-left max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2A2A38] pb-3 shrink-0">
              <h3 className="text-sm font-semibold text-white tracking-wide font-sans flex items-center gap-1.5">
                <Camera size={15} className="text-[#7C6FFF]" />
                AI Text Effect Scanner
              </h3>
              <button
                id="close-image-scan-btn-top"
                onClick={() => setShowImageScanModal(false)}
                className="text-gray-400 hover:text-white transition-all text-xs border border-transparent p-1 rounded hover:bg-[#2A2A38] cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 font-sans leading-normal">
              Upload, drop, or paste a reference image. Gemini AI analyzes colors, gradient stops, glowing shadows, text depth, and background layers, translating them into configuration parameters.
            </p>

            {/* Drop zone / selector / preview container */}
            <div className="flex-1 min-h-[160px] flex flex-col justify-center">
              {!scanImage ? (
                <div
                  id="image-scan-dropzone"
                  onDragOver={handleDragOver}
                  onDrop={handleCustomDrop}
                  onClick={() => document.getElementById("file-scanner-input")?.click()}
                  className="border-2 border-dashed border-[#2A2A38] hover:border-[#7C6FFF] rounded-xl p-8 bg-[#0E0E12] hover:bg-[#121218] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-center relative select-none group"
                >
                  <input
                    id="file-scanner-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelectChange}
                    className="hidden"
                  />
                  <UploadCloud size={28} className="text-gray-550 group-hover:text-[#7C6FFF] transition-all" />
                  <div>
                    <span className="text-xs text-white font-medium block">Choose image file or drag here</span>
                    <span className="text-[10px] text-gray-500 block mt-1">Or simply <span className="text-[#7C6FFF] font-semibold">Paste (Ctrl+V)</span> copy of an image</span>
                  </div>
                </div>
              ) : (
                <div className="relative border border-[#2A2A38] rounded-xl overflow-hidden bg-[#0E0E12] flex flex-col items-center justify-center p-3 select-none">
                  <img
                    src={scanImage}
                    alt="Scan Reference"
                    referrerPolicy="no-referrer"
                    className="max-h-[160px] object-contain rounded-lg shadow-md"
                  />
                  {scanStatus === "idle" && (
                    <button
                      id="remove-scan-image-btn"
                      onClick={() => {
                        setScanImage(null);
                        setScanResultConfig(null);
                        setScanError(null);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 px-2.5 bg-black/80 hover:bg-red-950 hover:text-red-400 text-gray-400 rounded-md text-[9px] uppercase font-sans font-bold border border-white/10 cursor-pointer transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Simulated Analysis logs terminal */}
            {scanStatus === "analyzing" && (
              <div className="bg-[#0A0A0E] border border-[#2A2A38] rounded-lg p-3 font-mono text-[10px] leading-4 text-gray-400 max-h-[130px] overflow-y-auto flex flex-col gap-1 shrink-0">
                <div className="flex items-center gap-2 text-[#7C6FFF] font-bold mb-1 font-sans">
                  <Loader2 size={11} className="animate-spin text-[#7C6FFF]" />
                  <span>Processing Style Parameters ...</span>
                </div>
                {scanLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-gray-600 select-none font-semibold">[{idx + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error messaging border */}
            {scanError && (
              <div className="border border-red-900 bg-red-950/45 text-red-450 p-3 rounded-lg text-xs leading-normal shrink-0 font-sans">
                <strong>Analysis Error:</strong> {scanError}
              </div>
            )}

            {/* Completed Output specs review */}
            {scanStatus === "completed" && scanResultConfig && (
              <div className="bg-[#121218] border border-[#7C6FFF]/20 rounded-lg p-3 shrink-0 flex flex-col gap-2 font-sans text-xs">
                <div className="text-[10px] uppercase font-mono text-[#7C6FFF] font-bold tracking-wider">Deconstructed Attributes:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                  <div>Estimated ID: <span className="text-white font-medium">{scanResultConfig.effectName}</span></div>
                  <div>Typography: <span className="text-white font-medium">{scanResultConfig.fontFamily}</span></div>
                  <div>Fill Method: <span className="text-white font-medium">{scanResultConfig.fillType} ({scanResultConfig.fillGradientAngle}°)</span></div>
                  <div>Outline: <span className="text-white font-medium">{scanResultConfig.strokeEnabled ? `${scanResultConfig.strokeWidth}px border` : "None"}</span></div>
                  <div>Bevel: <span className="text-white font-medium">{scanResultConfig.bevelEnabled ? `Depth ${scanResultConfig.bevelDepth}px` : "None"}</span></div>
                  <div>Glows: <span className="text-white font-medium">{scanResultConfig.glowLayers?.filter(l => l.enabled).length || 0} Layers</span></div>
                </div>
                <div className="text-[10px] text-[#666677] italic mt-1 leading-normal">
                  Config values loaded. Applied config retains your currently entered wording.
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between border-t border-[#2A2A38] pt-4 select-none shrink-0">
              <button
                id="cancel-scanner-modal-btn"
                onClick={() => {
                  setScanImage(null);
                  setScanStatus("idle");
                  setScanResultConfig(null);
                  setScanError(null);
                  setShowImageScanModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-[#2A2A38] hover:bg-[#2A2A38] text-white cursor-pointer font-sans transition-all"
              >
                Close
              </button>

              <div className="flex gap-2">
                {scanImage && scanStatus === "idle" && (
                  <button
                    id="trigger-ai-analyze-btn"
                    onClick={handleAnalyzeStyle}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7C6FFF] hover:bg-[#6859FF] shadow-lg shadow-[#7C6FFF]/20 cursor-pointer font-sans transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Scan Reference
                  </button>
                )}

                {scanStatus === "completed" && (
                  <button
                    id="apply-scanned-config-btn"
                    onClick={handleApplyAnalyzedConfig}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20 cursor-pointer font-sans transition-all"
                  >
                    Apply Config & Preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div id="prompt-style-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center select-none z-50 p-4">
          <div className="bg-[#1E1E26] border border-[#2A2A38] w-full max-w-[480px] rounded-xl p-6 shadow-2xl animate-scale-up text-left max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2A2A38] pb-3 shrink-0">
              <h3 className="text-sm font-semibold text-white tracking-wide font-sans flex items-center gap-1.5">
                <Sparkles size={15} className="text-teal-400" />
                AI Prompt Style Generator
              </h3>
              <button
                id="close-prompt-modal-btn-top"
                onClick={() => setShowPromptModal(false)}
                className="text-gray-400 hover:text-white transition-all text-xs border border-transparent p-1 rounded hover:bg-[#2A2A38] cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 font-sans leading-normal">
              Type any visual style concept (e.g., "retro cyber neon purple", "molten liquid gold", "frozen crystal glass shadow"), and Gemini will instantly build the custom parameters to match perfectly.
            </p>

            {/* Prompt input section */}
            <div className="flex flex-col gap-2">
              <label htmlFor="ai-style-prompt-input" className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400">Describe visual theme:</label>
              <textarea
                id="ai-style-prompt-input"
                rows={3}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="e.g. frozen ice block with cool cyan outer glowing shadow and sharp white crystal outline..."
                className="w-full bg-[#0E0E12] border border-[#2A2A38] hover:border-teal-500/50 focus:border-teal-400 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-all resize-none font-sans"
              />
              
              {/* Quick Prompt Ideas Tags */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] text-gray-500 mr-1 self-center">Try:</span>
                {[
                  "molten copper lava",
                  "retro 80s arcade grid",
                  "mystic amethyst crystal",
                  "cyberpunk neon glitch",
                  "minimalist swiss mono"
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPromptInput(tag)}
                    className="p-1 px-2 rounded bg-[#2A2A38] hover:bg-[#343446] border border-transparent text-[9.5px] font-mono text-teal-400 cursor-pointer transition-all hover:text-white"
                    style={{ cursor: "pointer" }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated results / processing status */}
            {promptStatus === "generating" && (
              <div className="bg-[#0A0A0E] border border-[#2A2A38] rounded-lg p-3 font-mono text-[10px] leading-4 text-gray-400 max-h-[130px] overflow-y-auto flex flex-col gap-1 shrink-0">
                <div className="flex items-center gap-2 text-teal-400 font-bold mb-1 font-sans">
                  <Loader2 size={11} className="animate-spin text-teal-400" />
                  <span>Synthesizing Parameters ...</span>
                </div>
                {promptLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-gray-600 select-none font-semibold">[{idx + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {promptError && (
              <div className="border border-red-900 bg-red-950/45 text-red-400 p-3 rounded-lg text-xs leading-normal shrink-0 font-sans">
                <strong>Generation Error:</strong> {promptError}
              </div>
            )}

            {promptStatus === "completed" && promptResultConfig && (
              <div className="bg-[#121218] border border-teal-500/20 rounded-lg p-3 shrink-0 flex flex-col gap-2 font-sans text-xs">
                <div className="text-[10px] uppercase font-mono text-teal-400 font-bold tracking-wider">Generated Attributes:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400">
                  <div>Model Presumed: <span className="text-white font-medium">{promptResultConfig.effectName}</span></div>
                  <div>Typography: <span className="text-white font-medium">{promptResultConfig.fontFamily}</span></div>
                  <div>Fill Style: <span className="text-white font-medium">{promptResultConfig.fillType} ({promptResultConfig.fillColor})</span></div>
                  <div>Outline: <span className="text-white font-medium">{promptResultConfig.strokeEnabled ? `${promptResultConfig.strokeWidth}px` : "None"}</span></div>
                  <div>3D Bevel: <span className="text-white font-medium">{promptResultConfig.bevelEnabled ? `Depth ${promptResultConfig.bevelDepth}px` : "None"}</span></div>
                  <div>Glow Slots: <span className="text-white font-medium">{promptResultConfig.glowLayers?.filter(l => l.enabled).length || 0} Layers</span></div>
                </div>
                <div className="text-[10px] text-teal-500/60 italic mt-1 leading-normal">
                  Parameters generated successfully. Ready to build to the canvas!
                </div>
              </div>
            )}

            {/* Bottom buttons */}
            <div className="flex items-center justify-between border-t border-[#2A2A38] pt-4 select-none shrink-0">
              <button
                id="cancel-prompt-modal-btn"
                onClick={() => {
                  setPromptInput("");
                  setPromptStatus("idle");
                  setPromptResultConfig(null);
                  setPromptError(null);
                  setShowPromptModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-[#2A2A38] hover:bg-[#2A2A38] text-white cursor-pointer font-sans transition-all"
              >
                Close
              </button>

              <div className="flex gap-2">
                {promptInput.trim() && promptStatus !== "generating" && promptStatus !== "completed" && (
                  <button
                    id="trigger-ai-prompt-btn"
                    onClick={handleGeneratePromptStyle}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-900/20 cursor-pointer font-sans transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Generate Style
                  </button>
                )}

                {promptStatus === "completed" && (
                  <button
                    id="apply-prompt-config-btn"
                    onClick={handleApplyPromptConfig}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-900/20 cursor-pointer font-sans transition-all"
                  >
                    Apply Config & Preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTutorialModal && (
        <div id="tutorial-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center select-none z-50 p-4 animate-fade-in">
          <div className="bg-[#1E1E26] border border-[#2A2A38] w-full max-w-[850px] rounded-xl p-6 shadow-2xl animate-scale-up text-left max-h-[90vh] overflow-hidden flex flex-col gap-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2A2A38] pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <HelpCircle size={18} className="text-[#7C6FFF]" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide font-sans">
                    Text Effect Design & Compositing Playbook
                  </h3>
                  <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                    Deconstruct the exact mechanics of every engine tool and how they impact final typographical outcomes
                  </p>
                </div>
              </div>
              <button
                id="close-tutorial-btn-top"
                onClick={() => setShowTutorialModal(false)}
                className="text-gray-400 hover:text-white transition-all text-sm border border-transparent p-1 px-2 rounded hover:bg-[#2A2A38] cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Layout Split: Left Tabs & Right Rich Educational Workspace Content */}
            <div className="flex-1 overflow-hidden flex gap-5 min-h-0">
              {/* Sidebar Tabs */}
              <div className="w-[200px] border-r border-[#2A2A38]/70 pr-4 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
                {[
                  { id: "typography", label: "Aa Typography", desc: "Sizing, balance & weight" },
                  { id: "color-fill", label: "🎨 Color Fills", desc: "Linear vs Radial Gradient" },
                  { id: "stroke", label: "✏️ Outline Stroke", desc: "Boundary curves & joins" },
                  { id: "glow", label: "🔮 Glowing Auras", desc: "Active luminous overlays" },
                  { id: "bevel", label: "📐 3D Bevels", desc: "Frontal depth extrusion" },
                  { id: "shadow", label: "👥 Drop Shadows", desc: "Ground offsets & blur" },
                  { id: "panel", label: "🎛️ Guard Panels", desc: "Backing badge bounds" },
                  { id: "scanner", label: "🤖 AI Image Scanner", desc: "Deconstruct key layers" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTutorialActiveTab(tab.id)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer font-sans ${
                      tutorialActiveTab === tab.id
                        ? "bg-[#7C6FFF]/15 border-l-2 border-[#7C6FFF] text-white"
                        : "text-gray-400 hover:text-white hover:bg-[#15151C]"
                    }`}
                  >
                    <div className="text-[12px] font-semibold tracking-wide">{tab.label}</div>
                    <div className="text-[9.5px] text-gray-400 mt-0.5 font-medium leading-none">{tab.desc}</div>
                  </button>
                ))}
              </div>

              {/* Rich Content Scroll Area */}
              <div className="flex-1 overflow-y-auto pr-2 select-text font-sans flex flex-col gap-4 text-xs">
                {tutorialActiveTab === "typography" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5 font-sans">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 01</span>
                        Typography & Structure Layouts
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        The starting structure determines the visual weight and focal energy of your composition. Sizing, tracking, and family shapes must align with the intended message theme.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">How Each Parameter Affects The Outcome:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Font Family (fontFamily)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Determines the primary stylistic silhouette. Heavy blocky styles (e.g., <span className="text-white font-semibold">Impact</span> or <span className="text-white font-semibold">Arial Black</span>) provide maximum surface area for complex gradients and rich multilayer textures. Editorial fonts (e.g., <span className="text-white font-semibold">Georgia</span>) feel academic or historical. Modern tech fonts (e.g., <span className="text-white font-semibold">Space Grotesk</span>) emphasize technical edge.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Font Weight (fontWeight)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Controls relative visual thickness (from <span className="font-semibold text-white">400</span> to <span className="font-semibold text-white">900</span>). High stroke thickness increases the ratio of fill-to-background, crucial for seeing linear gradients clearly and preventing outline stroke overlap.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Letter Spacing / Tracking (letterSpacing)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Defines letter expansion bounds (from <span className="font-semibold text-white">-5</span> to <span className="font-semibold text-white">+20px</span>). Wide layouts feel premium, luxurious, and spacious (perfect for sleek minimalist headers). Tight, overlapping trackings build high-density visual block text (ideal for thick poster decals).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#7C6FFF]/5 border border-[#7C6FFF]/15 rounded-xl p-3.5 flex flex-col gap-1.5">
                      <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">💡 Stylist Blueprint Tip:</div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        If using heavy inner glows or thick inside strokes, always choose ultra-bold weights (800+) to preserve readability; otherwise, the internal fills will be obscured.
                      </p>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "color-fill" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 02</span>
                        Color Fill & Complex Gradient Mapping
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        The fill gives life to the text body. Canvas supports uniform solid fills, multi-stop linear directions, and radial focus centers.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Choosing Your Fill Strategy:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Solid Fills</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Best for striking retro cyberpunk or clean flat cards. High-purity white, deep pitch-blacks, or vibrant solid neon greens provide reliable contrast and readability.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Linear Gradients</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Maps colors along an angle (0° to 360°). Vertical gradients (90° or 270°) replicate classic chrome reflections with highlight peaks at the top. Diagonals (135° or 45°) deliver organic, dynamic sunset hues that lead the eyes across the wording.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Radial Gradients</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Emanates from the exact absolute center outward. This builds a spherical lens effect, making the visual focus pop off the page, creating simulated backlighting or glowing spherical hot spots.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#7C6FFF]/5 border border-[#7C6FFF]/15 rounded-xl p-3.5 flex flex-col gap-1.5">
                      <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">💡 Chrome & Metal Formula:</div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        Combine minimum 3 gradient stops: dark gray at 0%, bright silver or white at 50%, and slate dark ash at 100% with a sharp bevel shadow to instantly invoke a 3D brushed-metal look!
                      </p>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "stroke" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 03</span>
                        Boundary Strokes & Joins
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        Strokes define structural outlines and separate the letters cleanly from multi-layer glows, drop shadows, and complex ambient backdrops.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Understanding Stroke Types & Parameters:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Stroke Position (strokePosition)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            <strong className="text-white">Outside</strong> (recommended) projects the outline outwards, keeping the text fill pristine and fully readable. <strong className="text-white">Center</strong> splits the stroke right on the character border. <strong className="text-white">Inside</strong> forces the boundary inwards, producing elegant stencil or inline cutout borders.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Stroke Line Join (strokeLineJoin)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            <strong className="text-white">Round</strong> delivers smooth, cartoonish, or friendly, bubbling rounded edges. <strong className="text-white">Miter</strong> makes corners razor-sharp (perfect for retro cyber decals). <strong className="text-white">Bevel</strong> cuts flat corners, producing an industrial mechanical edge.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Stroke Width & Opacity</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Ranges from <span className="font-semibold text-white">0</span> to <span className="font-semibold text-white">20px</span>. Combined with lower opacities, thick borders soften, creating misty ambient outer shrouds before the main glowing layer starts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "glow" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 04</span>
                        Glowing Auras & Multi-Level Neons
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        Up to three stacking layers of high-precision rendering glows are supported. Separating colors and blurs builds realistic light dispersion effects on standard retro surfaces.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Constructing Neon Auras:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">The Multi-Blur Stacking Method</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Use <strong className="text-white">Glow 1</strong> with low blur (<span className="text-white">2px - 8px</span>) and high opacity (<span className="text-white">90%</span>) to establish a super hot white light core. Next, configure <strong className="text-white">Glow 2</strong> with mid-blur (<span className="text-white">15px - 35px</span>) using the primary neon color (cyan/pink). Finally, use <strong className="text-white">Glow 3</strong> with large blur (<span className="text-white">60px - 100px</span>) with low opacity to cast ambient background backlight. This produces a photorealistic glass neon gas tube look!
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Inner Glow vs Outer Glow</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Outer glows project light outward for illumination. Inner glows shade the character margins inward, mimicking 3D jelly textures, round tubes, or glass-like transparency bounds.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "bevel" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 05</span>
                        Bevel & 3D Extrusion
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        The 3D Bevel system simulates spatial extrusion. It duplicates and draws stacked vector-slopes behind the text facing chosen offset directions, paired with upper highlights and lower shading.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">How Extrusion Works:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Bevel Depth (bevelDepth)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Defines absolute thickness bounds (from <span className="font-semibold text-white">0</span> to <span className="font-semibold text-white">15px</span>). High levels create severe blocky structural depth resembling brick carvings or solid carved stone signs.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Highlight vs Shading Shadows</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Highlights (usually light grays, gold tints or white) color the upper/left bevel parts, indicating where sunlight hits. Shading shadows (dark tones or pure black) color the bottom/right slopes, casting realistic ambient darkness underneath.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Direction Vector (bevelDirection)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Allows choosing between <strong className="text-white">bottom-right</strong>, <strong className="text-white">bottom</strong>, or <strong className="text-white">right</strong>. Choosing the right vector guides how the text lines up with overall canvas themes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "shadow" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 06</span>
                        Shadow Anchors & Backdrops
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        Shadows anchor text against backgrounds, establishing visual depth. They separate the letter strokes from the panel background or canvas colors.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Defining Visual Anchors:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Offsets (shadowOffsetX, shadowOffsetY)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Determines light source position. Positive Y with zero X places light source directly overhead, casting shadows straight downwards. Large offsets (e.g. 15px) suggest dramatic distance between text and background.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Shadow Blur (shadowBlur)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Low blur creates sharp, retro cartoonish sticker outlines. High blur values (35px+) soften the shadow to simulate diffuse overhead ambient lighting, producing clean modern card layouts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "panel" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">STEP 07</span>
                        Panel Backing & Framing Elements
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        Panels act as framing graphics underneath the text, establishing custom chips, headers, buttons or badge styles.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Key Parameters explained:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Paddings (panelPaddingX, panelPaddingY)</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Builds defensive padding around the text. Generous horizontal padding keeps text framed perfectly like a modern button decal, whereas tight vertical values yield crisp minimalist bars.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <code className="text-[#7C6FFF] font-mono font-bold text-[11px]">Corner Radius (panelRadius) & Stroke Width</code>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            Curving corners (up to <span className="font-semibold text-white">45px</span>) provides soft, friendly contours. Outlines add boundary borders to coordinate panels with modern desktop visual patterns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {tutorialActiveTab === "scanner" && (
                  <>
                    <div className="bg-[#15151C]/80 border border-[#2A2A38] rounded-xl p-4 flex flex-col gap-3">
                      <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span className="text-xs bg-[#7C6FFF]/20 text-[#7C6FFF] p-1 px-2 rounded font-mono">PLAYLIST</span>
                        AI Image Styling Scanner
                      </h4>
                      <p className="text-gray-300 leading-relaxed text-[11.5px]">
                        The integrated AI assistant uses deep vision parsing to map colors, styling layers, gradients and glows back to configurations.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#7C6FFF]">Interactive Tips for AI Scanner:</span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <h5 className="text-[11px] font-bold text-[#7C6FFF] font-sans">1. Capture High Quality Frames</h5>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            For best deconstruction fidelity, try uploading images with high-contrast text and uniform transparent or dark backgrounds so Gemini can parse strokes and glow offsets accurately.
                          </p>
                        </div>

                        <div className="bg-[#101014] border border-[#2A2A38]/50 p-3 rounded-lg flex flex-col gap-1 hover:border-[#7C6FFF]/30 transition-colors">
                          <h5 className="text-[11px] font-bold text-[#7C6FFF] font-sans">2. Paste Directly (Ctrl + V)</h5>
                          <p className="text-gray-300 text-[11px] leading-relaxed">
                            The modal captures clipboard inputs automatically. Simply take a screenshot of any web text styling, click `AI Scan Effect`, type `Ctrl+V`, and Gemini will automatically process the image!
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between border-t border-[#2A2A38] pt-4 select-none shrink-0 mt-4">
              <span className="text-[10px] text-gray-500 font-mono">
                Select tabs to explore parameter dynamics
              </span>
              <button
                id="close-tutorial-modal-btn"
                onClick={() => setShowTutorialModal(false)}
                className="px-5 py-1.5 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF] text-[#7C6FFF] hover:text-white border border-[#7C6FFF]/30 hover:border-[#7C6FFF] rounded-lg text-xs font-semibold cursor-pointer transition-all font-sans"
              >
                Close Playbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
