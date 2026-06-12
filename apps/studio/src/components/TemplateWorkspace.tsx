import React, { useState, useEffect, useRef, useMemo } from "react";
import lottie from "lottie-web";
import JSZip from "jszip";
import { Download, Copy, Plus, Play, Pause, Loader2, HelpCircle, FolderPlus, ArrowLeft, Sparkles, Code, FileJson, UploadCloud, X, RefreshCw, AlertTriangle, CheckCircle, Info, Layers, Lock, Unlock, Eye, EyeOff, Trash2, Move, CornerDownRight, Maximize2, RotateCw, CircleDot, ToggleLeft, ToggleRight, Image as ImageIcon, ChevronUp, ChevronDown, Settings, KeyRound } from "lucide-react";

import { scanTextLayers, parseLottieJson, LottieFileInfo, ParsedTextLayer, getDefaultText } from "@clypra/engine";
import { injectText, injectColor, injectBatch, type TextLayerConfig, type TextCustomization, type TextStyleOverride } from "@clypra/engine";
import { useGitHubPublish } from "../hooks/useGitHubPublish";
import { GitHubConfigModal } from "./GitHubConfigModal";
import { PublishTemplateModal } from "./PublishTemplateModal";
import { GeminiKeyModal } from "./GeminiKeyModal";

import { createBlankLottie, addSolidLayer, addTextLayer, addShapeLayer, addVectorShape, updateStaticProperty, enableKeyframing, addOrUpdateKeyframe, deleteKeyframe, LottiePropertyPath, addImageLayer, updateTrackMatte } from "@clypra/engine";
import { LOTTIE_ANIM_PRESETS, ENTRANCE_PRESETS, EXIT_PRESETS, LOOP_PRESETS, EMPHASIS_PRESETS, bakeAnimationIntoLayer, clearAnimationFromLayer, type LottieAnimPreset, type AnimationCategory } from "@clypra/engine";
import { readStyleFromLottieLayer, applyStyleToLottie, hexToLottieColor, lottieColorToHex, buildLottieFontName, SUPPORTED_FONT_FAMILIES, FONT_WEIGHT_OPTIONS, buildFontEntries, ensureFontInLottie, type TextLayerStyle, DEFAULT_TEXT_STYLE } from "@clypra/engine";
import { LOTTIE_TEMPLATE_PRESETS, TEMPLATE_CATEGORIES, type LottieTemplatePreset, type TemplatePresetCategory } from "@clypra/engine";
import { downloadDotLottie, downloadLottieJson, captureLottieFrames, encodeGif } from "@clypra/engine";
import { loadLottieFonts, waitForFontsReady, preloadGoogleFont } from "@clypra/engine";

export interface TemplateWorkspaceProps {
  onBackToDesign: () => void;
}

export type TemplateCategory = "lower-third" | "title-card" | "callout" | "caption" | "outro" | "social" | "broadcast" | "sports" | "countdown" | "cinematic";

export interface TextLayer {
  layerName: string;
  defaultText: string;
  maxCharacters: number;
  role: "primary" | "secondary" | "accent";
}

const CATEGORIES: TemplateCategory[] = ["lower-third", "title-card", "callout", "caption", "outro", "social", "broadcast", "sports", "countdown", "cinematic"];

const PLACEMENTS = ["lower-third", "center", "top", "full-frame"] as const;

function kebabToCamel(str: string): string {
  let camel = str.replace(/-([a-z0-9])/g, (g) => g[1].toUpperCase());
  if (/^[0-9]/.test(camel)) {
    camel = "t" + camel;
  }
  return camel;
}

export function TemplateWorkspace({ onBackToDesign }: TemplateWorkspaceProps) {
  // Lottie JSON document state
  const [rawJson, setRawJson] = useState<any>(null);

  // Session persistence states
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Selected Layer indexing
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>("");
  const [replacingLayerIndex, setReplacingLayerIndex] = useState<number | null>(null);

  // Blank slate config inputs
  const [blankW, setBlankW] = useState(1920);
  const [blankH, setBlankH] = useState(1080);
  const [blankFps, setBlankFps] = useState(30);
  const [blankFrames, setBlankFrames] = useState(120);

  // Customization Form State
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("title-card");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [placement, setPlacement] = useState<(typeof PLACEMENTS)[number]>("center");

  // Lottie dimension/length defaults
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fps, setFps] = useState(30);
  const [durationFrames, setDurationFrames] = useState(120);
  const [thumbnailFrame, setThumbnailFrame] = useState(0);

  // Layer visual toggles
  const [lockedLayers, setLockedLayers] = useState<Set<number>>(new Set());
  const [hiddenLayers, setHiddenLayers] = useState<Set<number>>(new Set());

  // Mapped Layers state
  const [mappedLayers, setMappedLayers] = useState<TextLayer[]>([]);

  // Custom live testing texts (injected for previewing)
  const [customTexts, setCustomTexts] = useState<TextCustomization>({
    primary: "Primary Text",
    secondary: "Secondary Text",
    accent: "Accent Text",
  });

  // Custom layer color overrides
  const [colorOverrides, setColorOverrides] = useState<Array<{ layerName: string; color: string }>>([]);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showCheckerboard, setShowCheckerboard] = useState(true);

  // Exporter Tabs
  const [activeRightTab, setActiveRightTab] = useState<"meta" | "json">("meta");
  const [copiedCodeFeedback, setCopiedCodeFeedback] = useState(false);
  const [thumbnailSetFeedback, setThumbnailSetFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGithubConfig, setShowGithubConfig] = useState(false);
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishPrUrl, setPublishPrUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const { publishTemplate, getGithubConfig } = useGitHubPublish();

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  // Bounding box dragging state
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartLayerPos = useRef({ x: 0, y: 0 });

  // ── NEW: Animation & Style state ──────────────────────────────────────────
  const [leftPanelTab, setLeftPanelTab] = useState<"layers" | "templates" | "animations">("layers");
  const [animCategory, setAnimCategory] = useState<AnimationCategory>("entrance");
  const [templateCategory, setTemplateCategory] = useState<TemplatePresetCategory | "all">("all");
  const [textStyleDraft, setTextStyleDraft] = useState<TextLayerStyle | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"inspector" | "style" | "meta" | "json">("inspector");
  const [animSearchQuery, setAnimSearchQuery] = useState("");
  // Export state
  const [exportFormat, setExportFormat] = useState<"json" | "lottie" | "gif">("lottie");
  const [isExportingDotLottie, setIsExportingDotLottie] = useState(false);

  // Player Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const frameTextRef = useRef<HTMLSpanElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("clypra_lottie_studio_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.rawJson) {
          setRawJson(session.rawJson);
          setSelectedLayerIndex(session.selectedLayerIndex);
          setTemplateId(session.templateId || "");
          setTemplateName(session.templateName || "");
          setCategory(session.category || "title-card");
          setDescription(session.description || "");
          setTagsInput(session.tagsInput || "");
          setPlacement(session.placement || "center");
          setWidth(session.width ?? 1920);
          setHeight(session.height ?? 1080);
          setFps(session.fps ?? 30);
          setDurationFrames(session.durationFrames ?? 120);
          setThumbnailFrame(session.thumbnailFrame ?? 0);
          setLockedLayers(new Set(session.lockedLayers || []));
          setHiddenLayers(new Set(session.hiddenLayers || []));
          setMappedLayers(session.mappedLayers || []);
          setCustomTexts(
            session.customTexts || {
              primary: "Primary Text",
              secondary: "Secondary Text",
              accent: "Accent Text",
            },
          );
          setColorOverrides(session.colorOverrides || []);
          setSaveStatus("saved");
        }
      } catch (err) {
        console.error("Failed to load Lottie Studio session from localStorage", err);
      }
    }
    setIsSessionLoaded(true);
  }, []);

  // Continuous tracking and auto-saving to localStorage
  useEffect(() => {
    if (!isSessionLoaded || !rawJson) return;

    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      try {
        const sessionData = {
          rawJson,
          selectedLayerIndex,
          templateId,
          templateName,
          category,
          description,
          tagsInput,
          placement,
          width,
          height,
          fps,
          durationFrames,
          thumbnailFrame,
          lockedLayers: Array.from(lockedLayers),
          hiddenLayers: Array.from(hiddenLayers),
          mappedLayers,
          customTexts,
          colorOverrides,
        };
        localStorage.setItem("clypra_lottie_studio_session", JSON.stringify(sessionData));
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to save Lottie Studio session", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isSessionLoaded, rawJson, selectedLayerIndex, templateId, templateName, category, description, tagsInput, placement, width, height, fps, durationFrames, thumbnailFrame, lockedLayers, hiddenLayers, mappedLayers, customTexts, colorOverrides]);

  const handleResetSession = () => {
    if (!confirm("Are you sure you want to clear your current progress and reset the sandbox? All unsaved modifications will be permanently lost.")) {
      return;
    }

    // Clear localStorage
    localStorage.removeItem("clypra_lottie_studio_session");

    // Reset all states to default
    setRawJson(null);
    setSelectedLayerIndex(null);
    setEditingLayerIndex(null);
    setEditingLayerName("");
    setBlankW(1920);
    setBlankH(1080);
    setBlankFps(30);
    setBlankFrames(120);
    setTemplateId("");
    setTemplateName("");
    setCategory("title-card");
    setDescription("");
    setTagsInput("");
    setPlacement("center");
    setWidth(1920);
    setHeight(1080);
    setFps(30);
    setDurationFrames(120);
    setThumbnailFrame(0);
    setLockedLayers(new Set());
    setHiddenLayers(new Set());
    setMappedLayers([]);
    setCustomTexts({
      primary: "Primary Text",
      secondary: "Secondary Text",
      accent: "Accent Text",
    });
    setColorOverrides([]);
    setIsPlaying(false);
    setCurrentFrame(0);
    setPlaybackSpeed(1.0);
    setSaveStatus("idle");
  };

  // Setup loaded Lottie file parameters
  const handleLottieLoad = (jsonData: any) => {
    try {
      const parsed = parseLottieJson(jsonData);

      // Ensure standard Poppins fonts are registered in loaded composition
      if (!jsonData.fonts) {
        jsonData.fonts = { list: [] };
      }
      if (!Array.isArray(jsonData.fonts.list)) {
        jsonData.fonts.list = [];
      }
      const standardFonts = [
        { fName: "Poppins-Bold", fFamily: "Poppins", fWeight: "700", fStyle: "Bold", asName: "Poppins-Bold" },
        { fName: "Poppins-Regular", fFamily: "Poppins", fWeight: "400", fStyle: "Regular", asName: "Poppins-Regular" },
        { fName: "Poppins-Italic", fFamily: "Poppins", fWeight: "400", fStyle: "Italic", asName: "Poppins-Italic" },
        { fName: "Poppins-BoldItalic", fFamily: "Poppins", fWeight: "700", fStyle: "Bold Italic", asName: "Poppins-BoldItalic" },
        { fName: "Arial", fFamily: "Arial", fWeight: "400", fStyle: "Regular", asName: "Arial" },
        { fName: "Arial-Bold", fFamily: "Arial", fWeight: "700", fStyle: "Bold", asName: "Arial-Bold" },
        { fName: "Arial-Italic", fFamily: "Arial", fWeight: "400", fStyle: "Italic", asName: "Arial-Italic" },
        { fName: "Arial-BoldItalic", fFamily: "Arial", fWeight: "700", fStyle: "Bold Italic", asName: "Arial-BoldItalic" },
      ];
      standardFonts.forEach((sf) => {
        if (!jsonData.fonts.list.some((f: any) => f.fName === sf.fName)) {
          jsonData.fonts.list.push(sf);
        }
      });

      // Auto-load Google Fonts for all fonts used in this composition
      loadLottieFonts(jsonData);

      setRawJson(jsonData);

      // Auto-fill metadata form
      const baseName = jsonData.nm || "lottie-template";
      const cleanId = baseName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      setTemplateId(cleanId || "custom-lottie-template");
      setTemplateName(jsonData.nm || "Custom Lottie Template");
      setWidth(parsed.width);
      setHeight(parsed.height);
      setFps(parsed.fps);
      setDurationFrames(parsed.durationFrames);
      setThumbnailFrame(Math.round(parsed.durationFrames / 2));
      setSelectedLayerIndex(jsonData.layers && jsonData.layers.length > 0 ? 0 : null);

      // Auto map text layer roles initially
      const initialMappings: TextLayer[] = parsed.textLayers.map((layer, index) => {
        let role: "primary" | "secondary" | "accent" = "primary";
        if (index === 1) role = "secondary";
        else if (index > 1) role = "accent";

        return {
          layerName: layer.layerName,
          defaultText: layer.defaultText || `Text Layer ${index + 1}`,
          maxCharacters: 30,
          role,
        };
      });
      setMappedLayers(initialMappings);

      setCustomTexts({
        primary: initialMappings.find((m) => m.role === "primary")?.defaultText || "Primary Text",
        secondary: initialMappings.find((m) => m.role === "secondary")?.defaultText || "Secondary Text",
        accent: initialMappings.find((m) => m.role === "accent")?.defaultText || "Accent Text",
      });

      setColorOverrides([]);
      setLockedLayers(new Set());
      setHiddenLayers(new Set());
      setIsPlaying(true);
    } catch (err: any) {
      alert("Error parsing Lottie JSON: " + err.message);
    }
  };

  // Blank slate creator trigger
  const handleBuildBlankSlate = () => {
    const blankData = createBlankLottie(blankW, blankH, blankFps, blankFrames);
    handleLottieLoad(blankData);
  };

  // File Upload helpers
  const processJsonFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      alert("Please upload a valid Lottie JSON file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        handleLottieLoad(jsonData);
      } catch (err) {
        alert("Failed to parse JSON content.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processJsonFile(e.target.files[0]);
    }
  };

  // Inject customizations for live previews — single-pass via injectBatch
  const customizedLottie = useMemo(() => {
    if (!rawJson) return null;

    return injectBatch(rawJson, {
      textCustomization: { customization: customTexts, layers: mappedLayers },
      colorOverrides: colorOverrides.map((o) => ({ layerName: o.layerName, color: o.color })),
      hiddenLayers,
    });
  }, [rawJson, customTexts, mappedLayers, colorOverrides, hiddenLayers]);

  // Sync Lottie playback instance
  useEffect(() => {
    if (!playerContainerRef.current || !customizedLottie) return;

    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: playerContainerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: isPlaying,
        animationData: customizedLottie,
      });

      animRef.current.setSpeed(playbackSpeed);

      if (!isPlaying) {
        animRef.current.goToAndStop(currentFrame, true);
      }
    } catch (e) {
      console.error("Lottie render error:", e);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [customizedLottie]);

  // Synchronize mappedLayers with actual text layers inside rawJson
  useEffect(() => {
    if (!rawJson || !Array.isArray(rawJson.layers)) return;

    // Scan text layers from rawJson
    const actualTextLayers = rawJson.layers.filter((l: any) => l.ty === 5);

    // Build the next synchronized mappings
    const nextMappings: TextLayer[] = actualTextLayers.map((layer: any, idx: number) => {
      const defaultText = getDefaultText(layer);
      const originalName = layer.nm || "Text Layer";

      // Try to find an existing mapping by layerName
      let existing = mappedLayers.find((m) => m.layerName === originalName);

      // If not found, try to find by index position among text layers
      if (!existing) {
        const matchIdx = actualTextLayers.indexOf(layer);
        if (matchIdx !== -1 && mappedLayers[matchIdx]) {
          existing = mappedLayers[matchIdx];
        }
      }

      return {
        layerName: originalName,
        defaultText: defaultText || "TEXT",
        maxCharacters: existing?.maxCharacters ?? 30,
        role: existing?.role ?? (idx === 0 ? "primary" : idx === 1 ? "secondary" : "accent"),
      };
    });

    // Check if mappings are actually different to prevent infinite loops
    const areDifferent = JSON.stringify(mappedLayers) !== JSON.stringify(nextMappings);
    if (areDifferent) {
      setMappedLayers(nextMappings);
    }

    // Also synchronize customTexts testing state so the live preview immediately reflects custom edited texts!
    const nextCustomTexts = { ...customTexts };
    actualTextLayers.forEach((layer: any, idx: number) => {
      const defaultText = getDefaultText(layer);
      const originalName = layer.nm || "Text Layer";
      const existing = nextMappings.find((m) => m.layerName === originalName);
      const role = existing?.role ?? (idx === 0 ? "primary" : idx === 1 ? "secondary" : "accent");
      if (role === "primary" || role === "secondary" || role === "accent") {
        nextCustomTexts[role] = defaultText;
      }
    });

    const isCustomTextDifferent = JSON.stringify(customTexts) !== JSON.stringify(nextCustomTexts);
    if (isCustomTextDifferent) {
      setCustomTexts(nextCustomTexts);
    }
  }, [rawJson, mappedLayers, customTexts]);

  useEffect(() => {
    if (!animRef.current) return;
    animRef.current.setSpeed(playbackSpeed);
  }, [playbackSpeed]);

  useEffect(() => {
    if (!animRef.current) return;
    if (isPlaying) {
      animRef.current.play();
    } else {
      animRef.current.pause();
    }
  }, [isPlaying]);

  // Sync frame time smoothly in playback loops
  useEffect(() => {
    let frameId: number;
    const updateDOM = () => {
      if (animRef.current && scrubberRef.current && frameTextRef.current) {
        const current = Math.round(animRef.current.currentFrame);
        const total = Math.round(animRef.current.totalFrames) || 120;
        scrubberRef.current.value = String(current);
        frameTextRef.current.textContent = `Frame ${current} / ${total}`;
        setCurrentFrame(current);
      }
      if (isPlaying) {
        frameId = requestAnimationFrame(updateDOM);
      }
    };

    if (isPlaying) {
      frameId = requestAnimationFrame(updateDOM);
    } else {
      updateDOM();
    }

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, customizedLottie]);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value);
    setIsPlaying(false);
    setCurrentFrame(frame);
    if (animRef.current) {
      animRef.current.goToAndStop(frame, true);
    }
    if (frameTextRef.current) {
      frameTextRef.current.textContent = `Frame ${frame} / ${durationFrames}`;
    }
  };

  const triggerAddImage = () => {
    if (!rawJson) return;
    setReplacingLayerIndex(null);
    imageInputRef.current?.click();
  };

  const triggerReplaceImage = (idx: number) => {
    setReplacingLayerIndex(idx);
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rawJson || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth || 400;
        const h = img.naturalHeight || 400;

        if (replacingLayerIndex !== null) {
          // Replace existing image layer's asset
          const clone = JSON.parse(JSON.stringify(rawJson));
          const layer = clone.layers[replacingLayerIndex];
          if (layer && layer.ty === 2) {
            const assetId = layer.refId;
            if (Array.isArray(clone.assets)) {
              const assetIndex = clone.assets.findIndex((a: any) => a.id === assetId);
              if (assetIndex !== -1) {
                clone.assets[assetIndex] = {
                  ...clone.assets[assetIndex],
                  w,
                  h,
                  p: base64Data,
                };
              }
            }
          }
          setRawJson(clone);
          setReplacingLayerIndex(null);
        } else {
          // Add new image layer
          const result = addImageLayer(rawJson, file.name.split(".")[0] || "New Image", base64Data, w, h);
          setRawJson(result);
          setSelectedLayerIndex(0);
        }
        e.target.value = "";
      };
      img.src = base64Data;
    };
    reader.readAsDataURL(file);
  };

  // Mapped helper to insert new layers programmatically
  const triggerAddSolid = () => {
    if (!rawJson) return;
    const result = addSolidLayer(rawJson, "Solid Background", "#1a1a24", width, height);
    setRawJson(result);
    setSelectedLayerIndex(0); // Select the newly created layer
  };

  const triggerAddText = () => {
    if (!rawJson) return;
    const result = addTextLayer(rawJson, "New Text Layer", "EDIT ME");
    setRawJson(result);
    setSelectedLayerIndex(0);

    // Append to mapping list
    const newMap: TextLayer = {
      layerName: "New Text Layer",
      defaultText: "EDIT ME",
      maxCharacters: 30,
      role: "primary",
    };
    setMappedLayers([...mappedLayers, newMap]);
  };

  const triggerAddShape = () => {
    if (!rawJson) return;
    const result = addShapeLayer(rawJson, "Vector Shape Layer");
    setRawJson(result);
    setSelectedLayerIndex(0);
  };

  const triggerAddRectToShape = () => {
    if (selectedLayerIndex === null || !rawJson) return;
    const result = addVectorShape(rawJson, selectedLayerIndex, "rect", "#7c6fff");
    setRawJson(result);
  };

  const triggerAddEllipseToShape = () => {
    if (selectedLayerIndex === null || !rawJson) return;
    const result = addVectorShape(rawJson, selectedLayerIndex, "ellipse", "#a49bff");
    setRawJson(result);
  };

  const handleMoveLayer = (idx: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rawJson || !Array.isArray(rawJson.layers)) return;
    const clone = JSON.parse(JSON.stringify(rawJson));
    const layers = clone.layers;

    if (direction === "up" && idx > 0) {
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
      setSelectedLayerIndex(idx - 1);
    } else if (direction === "down" && idx < layers.length - 1) {
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
      setSelectedLayerIndex(idx + 1);
    }

    // re-index
    layers.forEach((l: any, i: number) => {
      l.ind = layers.length - i;
    });

    setRawJson(clone);
  };

  const triggerDeleteLayer = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rawJson) return;
    const clone = JSON.parse(JSON.stringify(rawJson));
    clone.layers.splice(idx, 1);

    // re-index
    clone.layers.forEach((l: any, i: number) => {
      l.ind = clone.layers.length - i;
    });

    setRawJson(clone);
    setSelectedLayerIndex(clone.layers.length > 0 ? 0 : null);
  };

  // Layer Locking and Hiding states
  const toggleLockLayer = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(lockedLayers);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setLockedLayers(next);
  };

  const toggleHideLayer = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(hiddenLayers);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setHiddenLayers(next);
  };

  const handleSaveLayerName = (idx: number) => {
    if (!rawJson) return;
    const nameToSave = editingLayerName.trim() || `Layer ${idx + 1}`;
    const clone = JSON.parse(JSON.stringify(rawJson));
    if (clone.layers[idx]) {
      clone.layers[idx].nm = nameToSave;
    }
    setRawJson(clone);
    setEditingLayerIndex(null);
  };

  // Keyframing State Getters
  const getSelectedLayer = () => {
    if (selectedLayerIndex === null || !rawJson || !rawJson.layers) return null;
    return rawJson.layers[selectedLayerIndex];
  };

  const getTrackInfo = (path: LottiePropertyPath) => {
    const layer = getSelectedLayer();
    if (!layer) return { isAnimated: false, value: 0 };

    // Navigate path
    const keys = path.split(".");
    let current = layer;
    for (const k of keys) {
      if (!current[k]) return { isAnimated: false, value: 0 };
      current = current[k];
    }

    if (current.a === 1) {
      // Animated: Look for value at current frame
      const keyframes = current.k || [];
      const match = keyframes.find((kf: any) => kf.t === currentFrame);
      if (match) {
        return { isAnimated: true, value: match.s, keyframes };
      }

      // Interpolate or find nearest keyframe
      const nearest = keyframes.reduce(
        (prev: any, curr: any) => {
          return Math.abs(curr.t - currentFrame) < Math.abs(prev.t - currentFrame) ? curr : prev;
        },
        keyframes[0] || { s: 0 },
      );

      return { isAnimated: true, value: nearest.s, keyframes };
    }

    // Static
    return { isAnimated: false, value: current.k };
  };

  // Keyframing operations mutations
  const handleToggleKeyframing = (path: LottiePropertyPath) => {
    if (selectedLayerIndex === null || !rawJson) return;
    const track = getTrackInfo(path);
    let result: any;
    if (track.isAnimated) {
      // Revert to static
      const staticVal = Array.isArray(track.value) ? [track.value[0], track.value[1], track.value[2]] : track.value;
      result = updateStaticProperty(rawJson, selectedLayerIndex, path, staticVal);
    } else {
      // Enable
      result = enableKeyframing(rawJson, selectedLayerIndex, path);
    }
    setRawJson(result);
  };

  const handlePropertyChange = (path: LottiePropertyPath, val: number | number[]) => {
    if (selectedLayerIndex === null || !rawJson) return;
    const track = getTrackInfo(path);
    let result: any;
    if (track.isAnimated) {
      // Update keyframe at current frame
      result = addOrUpdateKeyframe(rawJson, selectedLayerIndex, path, currentFrame, val, "easeInOut");
    } else {
      // Update static property
      result = updateStaticProperty(rawJson, selectedLayerIndex, path, val);
    }
    setRawJson(result);
  };

  const handleDeleteKeyframe = (path: LottiePropertyPath, frameNum: number) => {
    if (selectedLayerIndex === null || !rawJson) return;
    const result = deleteKeyframe(rawJson, selectedLayerIndex, path, frameNum);
    setRawJson(result);
  };

  // Dragging bounding handles on player canvas stage
  const selectedLayerTransform = useMemo(() => {
    const layer = getSelectedLayer();
    if (!layer || !layer.ks || !layer.ks.p) return null;

    const posTrack = getTrackInfo("ks.p");
    const scaleTrack = getTrackInfo("ks.s");

    const x = Array.isArray(posTrack.value) ? posTrack.value[0] : 0;
    const y = Array.isArray(posTrack.value) ? posTrack.value[1] : 0;

    const sx = Array.isArray(scaleTrack.value) ? scaleTrack.value[0] : 100;
    const sy = Array.isArray(scaleTrack.value) ? scaleTrack.value[1] : 100;

    return { x, y, sx, sy };
  }, [rawJson, selectedLayerIndex, currentFrame]);

  // Stage scaling conversions
  const scaleRatio = useMemo(() => {
    if (!rawJson) return 1;
    const compW = rawJson.w || 1920;
    // Bounding container default 640px wide aspect-video
    return 640 / compW;
  }, [rawJson]);

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (selectedLayerIndex === null || !selectedLayerTransform || lockedLayers.has(selectedLayerIndex)) return;
    setIsDraggingStage(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartLayerPos.current = { x: selectedLayerTransform.x, y: selectedLayerTransform.y };
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingStage || selectedLayerIndex === null || !selectedLayerTransform) return;
    const deltaX = (e.clientX - dragStartPos.current.x) / scaleRatio;
    const deltaY = (e.clientY - dragStartPos.current.y) / scaleRatio;

    const newX = Math.round(dragStartLayerPos.current.x + deltaX);
    const newY = Math.round(dragStartLayerPos.current.y + deltaY);

    handlePropertyChange("ks.p", [newX, newY, 0]);
  };

  const handleStageMouseUp = () => {
    setIsDraggingStage(false);
  };

  const handleUseCurrentFrameAsThumbnail = () => {
    const frame = Math.max(0, Math.min(durationFrames - 1, currentFrame));
    console.log("Setting thumbnail frame to:", frame, "from current frame:", currentFrame);
    setThumbnailFrame(frame);
    setThumbnailSetFeedback(true);
    setTimeout(() => setThumbnailSetFeedback(false), 2000);
    // Don't need to goToAndStop here since we're already on this frame
  };

  const handlePreviewThumbnailFrame = () => {
    const frame = Math.max(0, Math.min(durationFrames - 1, thumbnailFrame));
    console.log("Previewing thumbnail frame:", frame);
    setCurrentFrame(frame);
    setIsPlaying(false);
    if (animRef.current) {
      animRef.current.goToAndStop(frame, true);
    }
  };

  const handleSetThumbnailToFrame = (frame: number) => {
    const clampedFrame = Math.max(0, Math.min(durationFrames - 1, frame));
    console.log("Setting thumbnail to frame:", clampedFrame);
    setThumbnailFrame(clampedFrame);
    setThumbnailSetFeedback(true);
    setTimeout(() => setThumbnailSetFeedback(false), 2000);
  };

  // Form Validation & Errors
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!templateId.trim()) {
      errs.id = "Template ID is required.";
    } else if (!/^[a-z0-9-]+$/.test(templateId)) {
      errs.id = "Template ID must be kebab-case (alphanumeric and hyphens only).";
    } else if (!templateId.includes("-") || templateId.length < 6) {
      errs.id = "Template ID should be descriptive and unique, e.g. neon-title-slam.";
    }

    const normalizedName = templateName.trim().toLowerCase();
    if (!templateName.trim()) {
      errs.name = "Template name is required for a readable pull request title.";
    } else if (normalizedName === templateId || normalizedName === templateId.replace(/-/g, " ")) {
      errs.name = "Template name should be human-readable, not just the raw ID.";
    }

    // Check duplicate roles in mappings
    const rolesMapped = mappedLayers.map((l) => l.role);
    const duplicates = rolesMapped.filter((item, index) => rolesMapped.indexOf(item) !== index);
    if (duplicates.includes("primary")) {
      errs.mappings = "Duplicate Mappings: Multiple layers are mapped to the 'primary' role.";
    }
    if (duplicates.includes("secondary")) {
      errs.mappings = "Duplicate Mappings: Multiple layers are mapped to the 'secondary' role.";
    }
    if (duplicates.includes("accent")) {
      errs.mappings = "Duplicate Mappings: Multiple layers are mapped to the 'accent' role.";
    }

    return errs;
  }, [templateId, templateName, mappedLayers]);

  // Code Generation
  const tagsArray = useMemo(() => {
    return tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [tagsInput]);

  const generatedTemplateDefinition = useMemo(
    () => ({
      id: templateId,
      name: templateName || "Lottie Template",
      category,
      description: description || "A standard Lottie template.",
      tags: tagsArray,
      durationFrames,
      fps,
      width,
      height,
      textLayers: mappedLayers,
      defaultPlacement: placement,
      lottieFile: `./${templateId}.json`,
      thumbnailFrame,
      thumbnail: "",
    }),
    [templateId, templateName, category, description, tagsArray, durationFrames, fps, width, height, mappedLayers, placement, thumbnailFrame],
  );

  const generatedMetadata = useMemo(() => {
    const camelId = kebabToCamel(templateId || "my-template");
    const formattedLayers = JSON.stringify(mappedLayers, null, 4)
      .replace(/"role": "(\w+)"/g, 'role: "$1"')
      .replace(/"layerName":/g, "layerName:")
      .replace(/"defaultText":/g, "defaultText:")
      .replace(/"maxCharacters":/g, "maxCharacters:");

    return `import { TemplateDefinition } from "@clypra/engine";
import lottieData from "./${templateId || "template"}.json";

export const ${camelId}: TemplateDefinition = {
  id: "${templateId}",
  name: "${templateName || "Lottie Template"}",
  category: "${category}",
  description: "${description || "A standard Lottie template."}",
  tags: ${JSON.stringify(tagsArray)},
  durationFrames: ${durationFrames},
  fps: ${fps},
  width: ${width},
  height: ${height},
  textLayers: ${formattedLayers},
  defaultPlacement: "${placement}",
  lottieFile: "./${templateId}.json",
  lottieData,
  thumbnailFrame: ${thumbnailFrame}
};

export default ${camelId};
`;
  }, [templateId, templateName, category, description, tagsArray, durationFrames, fps, width, height, mappedLayers, placement, thumbnailFrame]);

  const captureTemplateThumbnail = async (): Promise<string> => {
    if (!rawJson) throw new Error("No Lottie JSON is loaded.");

    // Use 4x scale for ultra-high quality
    const scale = 4;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "-10000px";
    container.style.width = `${scaledWidth}px`;
    container.style.height = `${scaledHeight}px`;
    document.body.appendChild(container);

    const animation = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: customizedLottie || rawJson,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Timed out rendering Lottie thumbnail.")), 5000);
        animation.addEventListener("DOMLoaded", () => {
          window.clearTimeout(timeout);
          resolve();
        });
      });

      animation.goToAndStop(thumbnailFrame, true);
      // Wait multiple frames for complete rendering
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const svg = container.querySelector("svg");
      if (!svg) throw new Error("Lottie thumbnail SVG was not generated.");

      // Set explicit dimensions on SVG for better quality
      svg.setAttribute("width", String(scaledWidth));
      svg.setAttribute("height", String(scaledHeight));

      const serialized = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
      if (!ctx) throw new Error("Could not create thumbnail canvas.");

      // Disable smoothing for pixel-perfect rendering
      ctx.imageSmoothingEnabled = false;

      ctx.clearRect(0, 0, scaledWidth, scaledHeight);
      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
      URL.revokeObjectURL(url);

      // Return high quality PNG
      return canvas.toDataURL("image/png", 1.0);
    } finally {
      animation.destroy();
      container.remove();
    }
  };

  const handleOpenPublishModal = async () => {
    if (!getGithubConfig()) {
      setShowGithubConfig(true);
      return;
    }

    // Generate thumbnail preview
    try {
      const thumbnailUrl = await captureTemplateThumbnail();
      setThumbnailDataUrl(thumbnailUrl);
    } catch (error) {
      console.error("Failed to generate thumbnail preview:", error);
      setThumbnailDataUrl(null);
    }

    setShowPublishModal(true);
  };

  const handlePublishTemplate = async () => {
    if (Object.keys(validationErrors).length > 0) {
      setPublishStatus("failed");
      setPublishMessage("Fix validation errors before publishing.");
      return;
    }

    setPublishStatus("publishing");
    setPublishPrUrl(null);
    setPublishMessage("Creating publish branch, uploading files, and opening PR…");

    try {
      const thumbnailDataUrl = await captureTemplateThumbnail();
      const result = await publishTemplate({
        id: templateId,
        category,
        definition: generatedTemplateDefinition,
        lottieData: rawJson,
        thumbnailDataUrl,
      });
      setPublishStatus("published");
      setPublishPrUrl(result.prUrl);
      setPublishMessage(`PR ready: ${result.branch} · ${result.files.length} files`);
    } catch (error) {
      setPublishStatus("failed");
      setPublishPrUrl(null);
      setPublishMessage(error instanceof Error ? error.message : "Publish failed.");
    }
  };

  // ── NEW: dotLottie / JSON / GIF export ─────────────────────────────────────────
  const handleExportDotLottie = async () => {
    if (!rawJson) return;
    setIsExportingDotLottie(true);
    try {
      if (exportFormat === "lottie") {
        await downloadDotLottie(rawJson, templateId || "animation", templateId || "animation", {
          loop: true,
          autoplay: true,
          speed: 1,
        });
      } else if (exportFormat === "json") {
        downloadLottieJson(rawJson, templateId || "animation");
      } else if (exportFormat === "gif") {
        // Export as animated GIF
        const lottieData: any = rawJson;
        if (!lottieData) throw new Error("No Lottie data available");

        // Create a temporary container and canvas for GIF rendering
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "fixed";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "0";
        tempContainer.style.width = `${width}px`;
        tempContainer.style.height = `${height}px`;
        document.body.appendChild(tempContainer);

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;

        try {
          // Load animation in the temporary container
          const tempAnim = lottie.loadAnimation({
            container: tempContainer,
            renderer: "svg",
            loop: false,
            autoplay: false,
            animationData: lottieData,
          });

          // Wait for animation to load
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Capture frames from the Lottie animation
          const frames = await captureLottieFrames(tempAnim, tempCanvas, {
            fps: 15, // 15 FPS for reasonable file size
            duration: tempAnim.totalFrames / (tempAnim.frameRate || fps),
            width: tempCanvas.width,
            height: tempCanvas.height,
            quality: 10,
            loop: true,
          });

          // Clean up temporary animation
          tempAnim.destroy();

          // Encode frames to GIF
          const gifData = encodeGif(frames, tempCanvas.width, tempCanvas.height, {
            loop: true,
            quality: 10,
          });

          // Download the GIF
          const blob = new Blob([gifData], { type: "image/gif" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${templateId || "animation"}.gif`;
          a.click();
          URL.revokeObjectURL(url);
        } finally {
          // Clean up temporary container
          document.body.removeChild(tempContainer);
        }
      }
    } catch (e: any) {
      alert("Export failed: " + e.message);
      console.error("Export error:", e);
    } finally {
      setIsExportingDotLottie(false);
    }
  };

  // Export Bundle Downloader
  const handleExportBundle = async () => {
    if (Object.keys(validationErrors).length > 0) {
      alert("Please fix all validation errors before exporting.");
      return;
    }

    setIsExporting(true);
    try {
      const zip = new JSZip();

      // 1. Add [id].json
      zip.file(`${templateId}.json`, JSON.stringify(rawJson, null, 2));

      // 2. Add [id].meta.ts
      zip.file(`${templateId}.meta.ts`, generatedMetadata);

      // Generate Zip content
      const content = await zip.generateAsync({ type: "blob" });

      // Download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${templateId}-bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Success! exported ${templateId}-bundle.zip containing standard Lottie assets.`);
    } catch (e: any) {
      alert("Export failed: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMetadata);
      setCopiedCodeFeedback(true);
      setTimeout(() => setCopiedCodeFeedback(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // ── NEW: Animation preset application ────────────────────────────────────
  const handleApplyAnimPreset = (preset: LottieAnimPreset) => {
    if (selectedLayerIndex === null || !rawJson) return;
    const compW = rawJson.w || 1920;
    const compH = rawJson.h || 1080;
    const totalFrames = rawJson.op || 120;
    const duration = Math.round(preset.defaultDurationFrames);
    const result = bakeAnimationIntoLayer(rawJson, selectedLayerIndex, preset, {
      startFrame: 0,
      endFrame: duration,
      totalFrames,
      compW,
      compH,
    });
    setRawJson(result);
  };

  const handleClearLayerAnimation = () => {
    if (selectedLayerIndex === null || !rawJson) return;
    const result = clearAnimationFromLayer(rawJson, selectedLayerIndex);
    setRawJson(result);
  };

  // ── NEW: Text style application ───────────────────────────────────────────
  const handleLoadTextStyle = () => {
    if (selectedLayerIndex === null || !rawJson) return;
    const layer = rawJson.layers?.[selectedLayerIndex];
    if (!layer || layer.ty !== 5) return;
    setTextStyleDraft(readStyleFromLottieLayer(layer));
    setRightPanelTab("style");
  };

  const handleApplyTextStyle = (style: TextLayerStyle) => {
    if (selectedLayerIndex === null || !rawJson) return;
    // Ensure font is registered
    let updated = ensureFontInLottie(rawJson, {
      fName: style.fontName,
      fFamily: style.fontFamily,
      fWeight: String(style.fontWeight),
      fStyle: style.fontStyle === "italic" ? "Italic" : "Regular",
      asName: style.fontName,
      googleFont: true,
    });
    updated = applyStyleToLottie(updated, selectedLayerIndex, style);
    setRawJson(updated);
    setTextStyleDraft(style);
  };

  // ── NEW: Template preset application ─────────────────────────────────────
  const handleApplyTemplatePreset = (preset: LottieTemplatePreset) => {
    if (!confirm(`Apply template "${preset.name}"? This will replace your current composition.`)) return;
    const lottieData = preset.build();
    handleLottieLoad(lottieData);
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-[#08080c] select-none text-(--studio-text) overflow-hidden font-sans">
      {/* Upper Navigation Action Bar */}
      <div className="flex h-10 items-center justify-between border-b border-(--studio-border) bg-(--studio-shell) px-4 shrink-0">
        <button onClick={onBackToDesign} className="flex items-center gap-1.5 text-xs text-(--studio-muted) hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={14} /> Back to Creator Design
        </button>
        <div className="flex items-center gap-1">
          {rawJson && (
            <>
              {/* Reset Session Button */}
              <button onClick={handleResetSession} className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:border-red-500/35 px-2.5 py-1 rounded-md transition-all cursor-pointer uppercase tracking-wider" title="Wipe current sandbox session and start a fresh composition">
                <RefreshCw size={10} />
                Reset Sandbox
              </button>

              {/* Format toggle + export */}
              <div className="flex items-center rounded border border-(--studio-border) overflow-hidden shrink-0">
                <button onClick={() => setExportFormat("lottie")} className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${exportFormat === "lottie" ? "bg-(--studio-accent) text-white" : "bg-(--studio-control) text-(--studio-muted) hover:text-white"}`}>
                  .lottie
                </button>
                <button onClick={() => setExportFormat("json")} className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer border-l border-(--studio-border) ${exportFormat === "json" ? "bg-(--studio-accent) text-white" : "bg-(--studio-control) text-(--studio-muted) hover:text-white"}`}>
                  .json
                </button>
                <button onClick={() => setExportFormat("gif")} className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer border-l border-(--studio-border) ${exportFormat === "gif" ? "bg-(--studio-accent) text-white" : "bg-(--studio-control) text-(--studio-muted) hover:text-white"}`}>
                  .gif
                </button>
              </div>
              <button onClick={handleExportDotLottie} disabled={isExportingDotLottie} className="px-2.5 py-1 bg-(--studio-accent) hover:bg-[#6859FF] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50">
                {isExportingDotLottie ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export
              </button>

              <button onClick={handleExportBundle} disabled={isExporting || Object.keys(validationErrors).length > 0} className="px-2.5 py-1 border border-(--studio-border) bg-(--studio-control) hover:bg-(--studio-hover) text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50" title="Export full bundle (.json + .meta.ts)">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Bundle
              </button>

              <button onClick={() => setShowGeminiKeyModal(true)} className="px-2.5 py-1 border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/15 text-[#B9B2FF] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap" title="Gemini API Key">
                <KeyRound size={14} />
              </button>

              <button onClick={() => setShowGithubConfig(true)} className="px-2.5 py-1 border border-(--studio-border) bg-(--studio-control) hover:bg-(--studio-hover) text-white rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="GitHub Settings">
                <Settings size={14} />
              </button>

              <button onClick={handleOpenPublishModal} disabled={publishStatus === "publishing"} className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50">
                {publishStatus === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {!rawJson ? (
        /* Blank Composition Setup & Drag-and-drop */
        <div className="flex flex-1 items-center justify-center p-8 bg-[#0b0b0f] gap-8">
          {/* Left Uploader Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processJsonFile(e.dataTransfer.files[0]);
              }
            }}
            className={`flex flex-col items-center justify-center w-full max-w-sm h-80 border-2 border-dashed rounded-xl transition-all p-6 text-center cursor-pointer ${isDragging ? "border-(--studio-accent) bg-(--studio-active-oft)]" : "border-(--studio-border) bg-(--studio-panel) hover:border-gray-500"}`}
            onClick={() => document.getElementById("lottie-file-picker")?.click()}
          >
            <UploadCloud size={40} className="text-(--studio-accent) mb-4 animate-bounce" />
            <h3 className="text-sm font-semibold text-white mb-2">Import Raw Lottie JSON</h3>
            <p className="text-xs text-(--studio-muted) mb-4 max-w-xs">Drag and drop any standard Lottie `.json` file here, or click to browse files.</p>
            <span className="text-[11px] px-3 py-1.5 bg-(--studio-control) rounded border border-(--studio-border) text-white hover:bg-(--studio-hover)">Browse Files</span>
            <input type="file" id="lottie-file-picker" className="hidden" accept=".json" onChange={handleFileInputChange} />
          </div>

          {/* Right Slate Creator Card */}
          <div className="w-full max-w-sm h-80 rounded-xl border border-(--studio-border) bg-(--studio-panel) p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                <FolderPlus size={16} className="text-teal-400" />
                Create Blank Motion Slate
              </h3>
              <p className="text-xs text-(--studio-muted) mb-4">Configure layers and build keyframes entirely from scratch on a clean canvas.</p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Width</label>
                    <input type="number" value={blankW} onChange={(e) => setBlankW(parseInt(e.target.value) || 1920)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Height</label>
                    <input type="number" value={blankH} onChange={(e) => setBlankH(parseInt(e.target.value) || 1080)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">FPS</label>
                    <input type="number" value={blankFps} onChange={(e) => setBlankFps(parseInt(e.target.value) || 30)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Frames</label>
                    <input type="number" value={blankFrames} onChange={(e) => setBlankFrames(parseInt(e.target.value) || 120)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleBuildBlankSlate} className="w-full h-8 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
              Build New Motion Composition
            </button>
          </div>
        </div>
      ) : (
        /* Triple-Column Figma/AE Motion Workspace */
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* <div className="shrink-0 border-b border-(--studio-border) bg-[#05050a] p-2.5 space-y-2 select-none">
            {publishMessage ? (
              <div className={`flex items-center justify-between gap-2 rounded border px-2 py-1 font-mono text-[9px] ${publishStatus === "failed" ? "border-red-900/40 bg-red-950/30 text-red-300" : publishStatus === "published" ? "border-teal-900/40 bg-teal-950/30 text-teal-300" : "border-(--studio-border) bg-(--studio-control) text-(--studio-muted)"}`}>
                <span className="min-w-0 truncate">{publishMessage}</span>
                {publishPrUrl ? (
                  <a href={publishPrUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/20">
                    Open PR
                  </a>
                ) : null}
              </div>
            ) : null}
          </div> */}

          {/* Main Layout containing sidebars and stage */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* LEFT PANEL: Layer Stack & Vector Library */}
            <aside className="w-80 shrink-0 border-r border-(--studio-border) bg-(--studio-panel) flex flex-col overflow-y-auto select-none">
              {/* Left panel tab switcher */}
              <div className="flex border-b border-(--studio-border) bg-(--studio-control) shrink-0">
                {(["layers", "templates", "animations"] as const).map((tab) => (
                  <button key={tab} onClick={() => setLeftPanelTab(tab)} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${leftPanelTab === tab ? "text-(--studio-accent) bg-(--studio-panel) border-b-2 border-(--studio-accent)" : "text-(--studio-muted) hover:text-white"}`}>
                    {tab === "layers" ? "⬛ Layers" : tab === "templates" ? "🎬 Templates" : "✨ Animate"}
                  </button>
                ))}
              </div>

              {/* ── LAYERS TAB ── */}
              {leftPanelTab === "layers" && (
                <>
                  {/* Insert Library Controls */}
                  <div className="p-4 border-b border-(--studio-border-oft)] space-y-3 shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-(--studio-muted) flex items-center gap-1.5">
                      <Sparkles size={13} className="text-teal-400" /> Layer Library
                    </h3>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button onClick={triggerAddText} className="py-2 bg-(--studio-control) hover:bg-(--studio-hover) border border-(--studio-border) rounded text-[10px] font-semibold text-white cursor-pointer flex flex-col items-center gap-1" title="Add a customizable Vector Text Layer">
                        <span className="text-xs font-mono font-bold">A</span> Text
                      </button>
                      <button onClick={triggerAddShape} className="py-2 bg-(--studio-control) hover:bg-(--studio-hover) border border-(--studio-border) rounded text-[10px] font-semibold text-white cursor-pointer flex flex-col items-center gap-1" title="Add a Vector Shape Layer">
                        <span className="text-xs font-mono font-bold">▢</span> Shape
                      </button>
                      <button onClick={triggerAddSolid} className="py-2 bg-(--studio-control) hover:bg-(--studio-hover) border border-(--studio-border) rounded text-[10px] font-semibold text-white cursor-pointer flex flex-col items-center gap-1" title="Add a Solid color Background backdrop">
                        <span className="text-xs font-mono font-bold">■</span> Solid
                      </button>
                      <button onClick={triggerAddImage} className="py-2 bg-(--studio-control) hover:bg-(--studio-hover) border border-(--studio-border) rounded text-[10px] font-semibold text-white cursor-pointer flex flex-col items-center gap-1" title="Add a local Image Layer (Base64)">
                        <ImageIcon size={14} className="text-emerald-400" /> Image
                      </button>
                    </div>

                    {/* Selected shape layer details */}
                    {selectedLayerIndex !== null && getSelectedLayer()?.ty === 4 && (
                      <div className="p-2 border border-teal-500/25 bg-teal-500/5 rounded space-y-2">
                        <p className="text-[9px] uppercase tracking-wide text-teal-300 font-semibold">Vector Path Inserter</p>
                        <div className="flex gap-2">
                          <button onClick={triggerAddRectToShape} className="flex-1 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] rounded border border-teal-500/30 cursor-pointer font-semibold">
                            + Rectangle
                          </button>
                          <button onClick={triggerAddEllipseToShape} className="flex-1 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] rounded border border-teal-500/30 cursor-pointer font-semibold">
                            + Ellipse
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layer Stack Index panel */}
                  <div className="p-4 flex-1 flex flex-col overflow-hidden">
                    {/* Live text preview inputs */}
                    {mappedLayers.length > 0 && (
                      <div className="mb-3 p-2.5 rounded border border-(--studio-border) bg-(--studio-control) space-y-2 shrink-0">
                        <p className="text-[9px] font-bold text-(--studio-muted) uppercase tracking-wider">Live Text Preview</p>
                        {(["primary", "secondary", "accent"] as const)
                          .filter((role) => mappedLayers.some((l) => l.role === role))
                          .map((role) => (
                            <div key={role} className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${role === "primary" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : role === "secondary" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>{role}</span>
                              <input type="text" value={customTexts[role]} onChange={(e) => setCustomTexts((prev) => ({ ...prev, [role]: e.target.value }))} className="flex-1 h-6 bg-(--studio-shell) border border-(--studio-border) rounded px-2 text-[10px] text-white focus:outline-none focus:border-(--studio-accent)" placeholder={`${role} text...`} />
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-(--studio-muted) flex items-center gap-1.5">
                        <Layers size={13} className="text-purple-400" /> Layers Stack
                      </h3>
                      <span className="text-[10px] font-mono text-(--studio-muted)">({rawJson.layers ? rawJson.layers.length : 0})</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                      {!rawJson.layers || rawJson.layers.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-(--studio-border) bg-(--studio-control) rounded-md text-(--studio-muted) text-xs">Composition holds no layers. Add layers from library above.</div>
                      ) : (
                        rawJson.layers.map((layer: any, idx: number) => {
                          const isSelected = selectedLayerIndex === idx;
                          const isLocked = lockedLayers.has(idx);
                          const isHidden = hiddenLayers.has(idx);

                          // Helper to return layer type label
                          const getLayerTypeLabel = (ty: number) => {
                            if (ty === 1) return "SOLID";
                            if (ty === 2) return "IMAGE";
                            if (ty === 4) return "SHAPE";
                            if (ty === 5) return "TEXT";
                            return "LAYER";
                          };

                          return (
                            <div key={`${layer.nm}-${idx}`} onClick={() => setSelectedLayerIndex(idx)} className={`p-2.5 rounded border transition-all flex items-center justify-between gap-3 cursor-pointer ${isSelected ? "bg-(--studio-active-oft)] border-(--studio-accent) text-white" : "bg-(--studio-control) border-(--studio-border) hover:border-gray-500 text-(--studio-muted) hover:text-white"}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold shrink-0 ${layer.ty === 5 ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : layer.ty === 4 ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : layer.ty === 2 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-purple-500/20 text-purple-300 border border-purple-500/30"}`}>{getLayerTypeLabel(layer.ty)}</span>
                                {editingLayerIndex === idx ? (
                                  <input
                                    type="text"
                                    value={editingLayerName}
                                    onChange={(e) => setEditingLayerName(e.target.value)}
                                    onBlur={() => handleSaveLayerName(idx)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveLayerName(idx);
                                      } else if (e.key === "Escape") {
                                        setEditingLayerIndex(null);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] font-semibold bg-(--studio-control) border border-(--studio-accent) rounded px-1.5 py-0.5 text-white focus:outline-none focus:ring-1 focus:ring-(--studio-accent) w-32"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                                    <span
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingLayerIndex(idx);
                                        setEditingLayerName(layer.nm || "");
                                      }}
                                      className="text-xs font-semibold truncate select-none cursor-text"
                                      title="Double-click to rename layer"
                                    >
                                      {layer.nm || "Layer"}
                                    </span>
                                    {layer.tt && (
                                      <span className="text-[8px] px-1 py-0.5 bg-purple-500/35 text-purple-200 border border-purple-500/50 rounded font-bold tracking-wider shrink-0 uppercase" title={layer.tt === 1 ? "Alpha Matte (Clipped by layer above)" : "Alpha Inverted Matte"}>
                                        ✂️ Matte
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Move Up */}
                                <button onClick={(e) => handleMoveLayer(idx, "up", e)} disabled={idx === 0} className={`p-0.5 rounded cursor-pointer transition-colors ${idx === 0 ? "text-gray-700 cursor-not-allowed" : "hover:text-white text-(--studio-muted)"}`} title="Move Layer Up">
                                  <ChevronUp size={11} />
                                </button>

                                {/* Move Down */}
                                <button onClick={(e) => handleMoveLayer(idx, "down", e)} disabled={idx === rawJson.layers.length - 1} className={`p-0.5 rounded cursor-pointer transition-colors ${idx === rawJson.layers.length - 1 ? "text-gray-700 cursor-not-allowed" : "hover:text-white text-(--studio-muted)"}`} title="Move Layer Down">
                                  <ChevronDown size={11} />
                                </button>

                                {/* Hide */}
                                <button onClick={(e) => toggleHideLayer(idx, e)} className={`p-1 rounded cursor-pointer transition-colors ${isHidden ? "text-red-400" : "hover:text-white"}`}>
                                  {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>

                                {/* Lock */}
                                <button onClick={(e) => toggleLockLayer(idx, e)} className={`p-1 rounded cursor-pointer transition-colors ${isLocked ? "text-yellow-400" : "hover:text-white"}`}>
                                  {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                                </button>

                                {/* Delete */}
                                <button onClick={(e) => triggerDeleteLayer(idx, e)} className="p-1 text-red-500 hover:text-red-400 rounded cursor-pointer transition-colors">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── TEMPLATES TAB ── */}
              {leftPanelTab === "templates" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-(--studio-border-oft)] shrink-0">
                    <p className="text-[10px] text-(--studio-muted) mb-2">13 built-in CapCut-style templates. Click to apply.</p>
                    <div className="flex flex-wrap gap-1">
                      {(["all", ...TEMPLATE_CATEGORIES] as const).map((cat) => (
                        <button key={cat} onClick={() => setTemplateCategory(cat as any)} className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider cursor-pointer transition-colors ${templateCategory === cat ? "bg-(--studio-accent) border-(--studio-accent) text-white" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {LOTTIE_TEMPLATE_PRESETS.filter((p) => templateCategory === "all" || p.category === templateCategory).map((preset) => (
                      <div key={preset.id} className="p-3 rounded border border-(--studio-border) bg-(--studio-control) hover:border-(--studio-accent) transition-all cursor-pointer group" onClick={() => handleApplyTemplatePreset(preset)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-(--studio-accent) transition-colors truncate">{preset.name}</p>
                            <p className="text-[10px] text-(--studio-muted) mt-0.5 leading-relaxed">{preset.description}</p>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-(--studio-accent)/20 text-(--studio-accent) border border-(--studio-accent)/30 font-bold uppercase shrink-0">{preset.aspectRatio}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {preset.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-(--studio-muted) border border-white/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ANIMATIONS TAB ── */}
              {leftPanelTab === "animations" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-(--studio-border-oft)] shrink-0 space-y-2">
                    {selectedLayerIndex === null ? (
                      <p className="text-[10px] text-amber-400">⚠️ Select a layer first to apply animations.</p>
                    ) : (
                      <p className="text-[10px] text-(--studio-muted)">
                        Apply to: <span className="text-white font-bold">{rawJson?.layers?.[selectedLayerIndex]?.nm || "Layer"}</span>
                      </p>
                    )}
                    <input value={animSearchQuery} onChange={(e) => setAnimSearchQuery(e.target.value)} placeholder="Search animations..." className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-2.5 text-xs text-white focus:outline-none placeholder:text-(--studio-muted)" />
                    <div className="flex gap-1">
                      {(["entrance", "exit", "loop", "emphasis"] as AnimationCategory[]).map((cat) => (
                        <button key={cat} onClick={() => setAnimCategory(cat)} className={`flex-1 text-[9px] py-1 rounded border font-bold uppercase tracking-wider cursor-pointer transition-colors ${animCategory === cat ? "bg-(--studio-accent) border-(--studio-accent) text-white" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    {selectedLayerIndex !== null && (
                      <button onClick={handleClearLayerAnimation} className="w-full text-[10px] py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer font-bold transition-colors">
                        ✕ Clear All Animations
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
                    {LOTTIE_ANIM_PRESETS.filter((p) => p.category === animCategory)
                      .filter((p) => !animSearchQuery || p.name.toLowerCase().includes(animSearchQuery.toLowerCase()))
                      .map((preset) => (
                        <button key={preset.id} onClick={() => handleApplyAnimPreset(preset)} disabled={selectedLayerIndex === null} className="p-2.5 rounded border border-(--studio-border) bg-(--studio-control) hover:border-(--studio-accent) hover:bg-(--studio-active-oft)] transition-all cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed group">
                          <div className="text-lg mb-1">{preset.icon}</div>
                          <p className="text-[11px] font-bold text-white group-hover:text-(--studio-accent) transition-colors">{preset.name}</p>
                          <p className="text-[9px] text-(--studio-muted) mt-0.5 leading-tight">{preset.description}</p>
                          <p className="text-[8px] text-(--studio-muted) mt-1 font-mono">{preset.defaultDurationFrames}f</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </aside>

            {/* CENTER PANEL: Canvas interactive editor */}
            <main className="flex-1 flex flex-col bg-clypra-bg overflow-hidden relative">
              {/* Interactive Player Screen */}
              <div ref={stageRef} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onMouseLeave={handleStageMouseUp} className="flex-1 relative flex items-center justify-center p-3 min-h-0">
                {/* Thumbnail Set Toast Notification */}
                {thumbnailSetFeedback && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 border-2 border-green-600 shadow-2xl animate-bounce">
                    <CheckCircle size={16} className="text-white" />
                    <span className="text-sm font-bold text-white">Thumbnail set to frame {thumbnailFrame}!</span>
                  </div>
                )}

                <div className={`relative w-[640px] aspect-video border border-(--studio-border) rounded-lg shadow-2xl flex items-center justify-center overflow-hidden ${showCheckerboard ? "checkerboard" : "bg-[#0b0b0f]"}`}>
                  {/* Player DOM */}
                  <div ref={playerContainerRef} className="w-full h-full" />

                  {/* Thumbnail Frame Badge Indicator */}
                  {currentFrame === thumbnailFrame && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/90 border border-amber-600 shadow-lg z-20 animate-pulse">
                      <ImageIcon size={12} className="text-amber-950" />
                      <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider">Thumbnail Frame</span>
                    </div>
                  )}

                  {/* Stage SVG overlay for click-and-drag transform bounding handles */}
                  {selectedLayerTransform && (
                    <div
                      onMouseDown={handleStageMouseDown}
                      style={{
                        position: "absolute",
                        left: `${selectedLayerTransform.x * scaleRatio}px`,
                        top: `${selectedLayerTransform.y * scaleRatio}px`,
                        transform: "translate(-50%, -50%)",
                        cursor: lockedLayers.has(selectedLayerIndex!) ? "not-allowed" : "move",
                        pointerEvents: "auto",
                        zIndex: 30,
                      }}
                      className="group/handle flex items-center justify-center"
                    >
                      <div className="w-6 h-6 border-2 border-(--studio-accent) rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(124,111,255,0.8)] animate-pulse bg-(--studio-bg)/60">
                        <Move size={12} className="text-white" />
                      </div>
                    </div>
                  )}

                  {/* Canvas safe border frames */}
                  <div className="composition-safe-area" />
                </div>
              </div>

              {/* HUD Bar controls */}
              <div className="h-12 shrink-0 border-t border-b border-(--studio-border) bg-(--studio-panel) px-4 flex items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 rounded bg-(--studio-accent) hover:bg-[#6859FF] text-white flex items-center justify-center cursor-pointer transition-colors">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>

                  <div className="relative w-48">
                    <input ref={scrubberRef} type="range" min="0" max={durationFrames - 1} value={currentFrame} onChange={handleScrubberChange} className="w-full accent-(--studio-accent) h-1 rounded-lg bg-(--studio-control) appearance-none cursor-pointer" />
                    {/* Thumbnail frame indicator */}
                    <div
                      style={{ left: `${(thumbnailFrame / (durationFrames - 1)) * 100}%` }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.6)] cursor-pointer hover:scale-125 transition-transform z-10"
                      title={`Thumbnail frame: ${thumbnailFrame}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewThumbnailFrame();
                      }}
                    />
                  </div>

                  <span ref={frameTextRef} className="text-xs font-mono text-(--studio-muted)">
                    Frame {currentFrame} / {durationFrames}
                  </span>

                  <button onClick={handleUseCurrentFrameAsThumbnail} className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-colors flex items-center gap-1 ${thumbnailSetFeedback ? "border-green-500/50 bg-green-500/20 text-green-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"} cursor-pointer`} title="Set current frame as thumbnail">
                    <ImageIcon size={11} />
                    {thumbnailSetFeedback ? "✓ Thumbnail Set!" : "Set Thumbnail"}
                  </button>

                  {/* Save Status Badge */}
                  <div className="flex items-center gap-1.5 text-[10px] text-(--studio-muted) font-medium bg-[#13131a] border border-(--studio-border) px-2 py-0.5 rounded-md">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${saveStatus === "saving" ? "bg-amber-400 animate-pulse" : saveStatus === "saved" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-gray-500"}`} />
                    <span className="font-mono text-[9px] uppercase tracking-wider">{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Autosaved" : "Unsaved"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[0.5, 1.0, 2.0].map((s) => (
                      <button key={s} onClick={() => setPlaybackSpeed(s)} className={`text-[10px] font-mono font-semibold px-2 py-1 rounded border transition-colors cursor-pointer ${playbackSpeed === s ? "bg-(--studio-accent) border-(--studio-accent) text-white" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:bg-(--studio-hover)"}`}>
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setShowCheckerboard(!showCheckerboard)} className={`p-1.5 rounded border text-xs cursor-pointer transition-colors ${showCheckerboard ? "bg-teal-500/10 border-teal-500/30 text-teal-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                    Backdrop Grid
                  </button>
                </div>
              </div>
            </main>

            {/* RIGHT PANEL: Vector Properties Inspector */}
            <aside className="w-80 shrink-0 border-l border-(--studio-border) bg-(--studio-panel) flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-(--studio-border) bg-(--studio-control) shrink-0 select-none">
                <button onClick={() => setRightPanelTab("inspector")} className={`flex-1 py-2.5 text-center text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${rightPanelTab === "inspector" ? "text-(--studio-accent) bg-(--studio-panel) border-b-2 border-(--studio-accent)" : "text-(--studio-muted) hover:text-white"}`}>
                  <Settings size={11} /> Props
                </button>
                <button
                  onClick={() => {
                    handleLoadTextStyle();
                  }}
                  className={`flex-1 py-2.5 text-center text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${rightPanelTab === "style" ? "text-(--studio-accent) bg-(--studio-panel) border-b-2 border-(--studio-accent)" : "text-(--studio-muted) hover:text-white"}`}
                >
                  <span className="text-xs">Aa</span> Style
                </button>
                <button onClick={() => setRightPanelTab("meta")} className={`flex-1 py-2.5 text-center text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${rightPanelTab === "meta" ? "text-(--studio-accent) bg-(--studio-panel) border-b-2 border-(--studio-accent)" : "text-(--studio-muted) hover:text-white"}`}>
                  <Code size={11} /> Meta
                </button>
                <button onClick={() => setRightPanelTab("json")} className={`flex-1 py-2.5 text-center text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${rightPanelTab === "json" ? "text-(--studio-accent) bg-(--studio-panel) border-b-2 border-(--studio-accent)" : "text-(--studio-muted) hover:text-white"}`}>
                  <FileJson size={11} /> JSON
                </button>
              </div>

              {/* Inspector Content Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ── STYLE TAB ── */}
                {rightPanelTab === "style" &&
                  (() => {
                    const layer = selectedLayerIndex !== null ? rawJson?.layers?.[selectedLayerIndex] : null;
                    if (!layer || layer.ty !== 5) return <div className="text-center p-8 border border-(--studio-border) bg-(--studio-control) rounded text-(--studio-muted) text-xs">Select a text layer (TEXT) to edit its style.</div>;
                    const style = textStyleDraft || readStyleFromLottieLayer(layer);
                    const update = (patch: Partial<TextLayerStyle>) => {
                      const next = { ...style, ...patch };
                      setTextStyleDraft(next);
                      handleApplyTextStyle(next);
                    };
                    return (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Text Style Editor</h4>

                        {/* Font Family */}
                        <div className="space-y-1">
                          <label className="block text-[9px] text-(--studio-muted) uppercase">Font Family</label>
                          <select
                            value={style.fontFamily}
                            onChange={(e) => {
                              const fam = e.target.value;
                              preloadGoogleFont(fam, [400, 700, 800, 900]);
                              update({ fontFamily: fam, fontName: buildLottieFontName(fam, style.fontWeight, style.fontStyle) });
                            }}
                            className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            {SUPPORTED_FONT_FAMILIES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Weight + Style */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-(--studio-muted) uppercase">Weight</label>
                            <select
                              value={style.fontWeight}
                              onChange={(e) => {
                                const w = Number(e.target.value);
                                update({ fontWeight: w, fontName: buildLottieFontName(style.fontFamily, w, style.fontStyle) });
                              }}
                              className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              {FONT_WEIGHT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-(--studio-muted) uppercase">Style</label>
                            <select
                              value={style.fontStyle}
                              onChange={(e) => {
                                const s = e.target.value as "normal" | "italic";
                                update({ fontStyle: s, fontName: buildLottieFontName(style.fontFamily, style.fontWeight, s) });
                              }}
                              className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              <option value="normal">Normal</option>
                              <option value="italic">Italic</option>
                            </select>
                          </div>
                        </div>

                        {/* Size + Tracking */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[9px] text-(--studio-muted) uppercase">Size (px)</label>
                            <input type="number" value={style.fontSize} min={8} max={400} onChange={(e) => update({ fontSize: Number(e.target.value) || 72 })} className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] text-(--studio-muted) uppercase">Tracking</label>
                            <input type="number" value={style.tracking} min={-200} max={1000} onChange={(e) => update({ tracking: Number(e.target.value) })} className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none" />
                          </div>
                        </div>

                        {/* Alignment */}
                        <div className="space-y-1">
                          <label className="block text-[9px] text-(--studio-muted) uppercase">Alignment</label>
                          <div className="flex gap-1">
                            {(["left", "center", "right"] as const).map((a) => (
                              <button key={a} onClick={() => update({ align: a })} className={`flex-1 py-1.5 text-[10px] font-bold rounded border cursor-pointer transition-colors ${style.align === a ? "bg-(--studio-accent) border-(--studio-accent) text-white" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                                {a === "left" ? "⬅" : a === "center" ? "⬛" : "➡"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Fill Color */}
                        <div className="space-y-1">
                          <label className="block text-[9px] text-(--studio-muted) uppercase">Fill Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={style.fillColor} onChange={(e) => update({ fillColor: e.target.value })} className="w-10 h-8 rounded border border-(--studio-border) cursor-pointer bg-transparent" />
                            <input type="text" value={style.fillColor} onChange={(e) => update({ fillColor: e.target.value })} className="flex-1 h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none font-mono uppercase" />
                          </div>
                        </div>

                        {/* Stroke */}
                        <div className="space-y-2 pt-2 border-t border-(--studio-border-oft)]">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] text-(--studio-muted) uppercase font-bold">Stroke</label>
                            <button onClick={() => update({ strokeEnabled: !style.strokeEnabled })} className={`text-[9px] px-2 py-0.5 rounded border cursor-pointer font-bold transition-colors ${style.strokeEnabled ? "bg-teal-500/20 border-teal-500/40 text-teal-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted)"}`}>
                              {style.strokeEnabled ? "ON" : "OFF"}
                            </button>
                          </div>
                          {style.strokeEnabled && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1.5">
                                <input type="color" value={style.strokeColor} onChange={(e) => update({ strokeColor: e.target.value })} className="w-8 h-7 rounded border border-(--studio-border) cursor-pointer bg-transparent" />
                                <span className="text-[10px] font-mono text-(--studio-muted)">{style.strokeColor}</span>
                              </div>
                              <div className="space-y-0.5">
                                <label className="block text-[9px] text-(--studio-muted)">Width</label>
                                <input type="number" value={style.strokeWidth} min={0} max={40} onChange={(e) => update({ strokeWidth: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Shadow */}
                        <div className="space-y-2 pt-2 border-t border-(--studio-border-oft)]">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] text-(--studio-muted) uppercase font-bold">Shadow</label>
                            <button onClick={() => update({ shadowEnabled: !style.shadowEnabled })} className={`text-[9px] px-2 py-0.5 rounded border cursor-pointer font-bold transition-colors ${style.shadowEnabled ? "bg-teal-500/20 border-teal-500/40 text-teal-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted)"}`}>
                              {style.shadowEnabled ? "ON" : "OFF"}
                            </button>
                          </div>
                          {style.shadowEnabled && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input type="color" value={style.shadowColor} onChange={(e) => update({ shadowColor: e.target.value })} className="w-8 h-7 rounded border border-(--studio-border) cursor-pointer bg-transparent" />
                                <span className="text-[10px] font-mono text-(--studio-muted)">{style.shadowColor}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <div>
                                  <label className="block text-[9px] text-(--studio-muted)">Blur</label>
                                  <input type="number" value={style.shadowBlur} min={0} max={80} onChange={(e) => update({ shadowBlur: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-1.5 text-xs text-white focus:outline-none" />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-(--studio-muted)">X</label>
                                  <input type="number" value={style.shadowOffsetX} min={-80} max={80} onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-1.5 text-xs text-white focus:outline-none" />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-(--studio-muted)">Y</label>
                                  <input type="number" value={style.shadowOffsetY} min={-80} max={80} onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-1.5 text-xs text-white focus:outline-none" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Opacity + Scale */}
                        <div className="space-y-2 pt-2 border-t border-(--studio-border-oft)]">
                          <label className="block text-[9px] text-(--studio-muted) uppercase font-bold">Transform</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-(--studio-muted)">Opacity %</label>
                              <input type="number" value={style.opacity} min={0} max={100} onChange={(e) => update({ opacity: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-(--studio-muted)">Rotation °</label>
                              <input type="number" value={style.rotation} min={-360} max={360} onChange={(e) => update({ rotation: Number(e.target.value) })} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* ── INSPECTOR TAB ── */}
                {rightPanelTab === "inspector" &&
                  (selectedLayerIndex === null ? (
                    <div className="text-center p-8 border border-(--studio-border) bg-(--studio-control) rounded text-(--studio-muted) text-xs">Select a layer from the left stack to edit transforms &amp; keyframes.</div>
                  ) : (
                    <>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-(--studio-muted) pb-1.5 border-b border-(--studio-border-oft)]">Properties Inspector</h4>

                      {/* Layer Name field */}
                      <div className="space-y-1">
                        <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Layer Name</label>
                        <input
                          type="text"
                          value={getSelectedLayer()?.nm || ""}
                          onChange={(e) => {
                            if (!rawJson) return;
                            const clone = JSON.parse(JSON.stringify(rawJson));
                            if (clone.layers[selectedLayerIndex!]) {
                              clone.layers[selectedLayerIndex!].nm = e.target.value;
                            }
                            setRawJson(clone);
                          }}
                          className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2.5 text-xs text-white focus:outline-none focus:border-(--studio-accent) font-semibold"
                          placeholder="Layer Name"
                        />
                      </div>

                      {/* Standard Transforms block with Stopwatch toggles */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Layer Transforms</p>

                        {/* Position Track */}
                        {(() => {
                          const track = getTrackInfo("ks.p");
                          const posX = Array.isArray(track.value) ? track.value[0] : 0;
                          const posY = Array.isArray(track.value) ? track.value[1] : 0;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-(--studio-muted)">Position X / Y</span>
                                <button onClick={() => handleToggleKeyframing("ks.p")} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${track.isAnimated ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`} title="Toggle stopwatch keyframe tracking">
                                  {track.isAnimated ? "⏰ Active" : "⏱️ Static"}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="number" value={posX} onChange={(e) => handlePropertyChange("ks.p", [parseInt(e.target.value) || 0, posY, 0])} className="h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                                <input type="number" value={posY} onChange={(e) => handlePropertyChange("ks.p", [posX, parseInt(e.target.value) || 0, 0])} className="h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Scale Track */}
                        {(() => {
                          const track = getTrackInfo("ks.s");
                          const valX = Array.isArray(track.value) ? track.value[0] : 100;
                          const valY = Array.isArray(track.value) ? track.value[1] : 100;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-(--studio-muted)">Scale Width / Height %</span>
                                <button onClick={() => handleToggleKeyframing("ks.s")} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${track.isAnimated ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                                  {track.isAnimated ? "⏰ Active" : "⏱️ Static"}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="number" value={valX} onChange={(e) => handlePropertyChange("ks.s", [parseInt(e.target.value) || 100, valY, 100])} className="h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                                <input type="number" value={valY} onChange={(e) => handlePropertyChange("ks.s", [valX, parseInt(e.target.value) || 100, 100])} className="h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Rotation Track */}
                        {(() => {
                          const track = getTrackInfo("ks.r");
                          const rot = typeof track.value === "number" ? track.value : 0;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-(--studio-muted)">Rotation Angle (deg)</span>
                                <button onClick={() => handleToggleKeyframing("ks.r")} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${track.isAnimated ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                                  {track.isAnimated ? "⏰ Active" : "⏱️ Static"}
                                </button>
                              </div>
                              <input type="number" value={rot} onChange={(e) => handlePropertyChange("ks.r", parseInt(e.target.value) || 0)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                            </div>
                          );
                        })()}

                        {/* Opacity Track */}
                        {(() => {
                          const track = getTrackInfo("ks.o");
                          const opacity = typeof track.value === "number" ? track.value : 100;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-(--studio-muted)">Opacity %</span>
                                <button onClick={() => handleToggleKeyframing("ks.o")} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${track.isAnimated ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}>
                                  {track.isAnimated ? "⏰ Active" : "⏱️ Static"}
                                </button>
                              </div>
                              <input type="number" min="0" max="100" value={opacity} onChange={(e) => handlePropertyChange("ks.o", parseInt(e.target.value) || 100)} className="w-full h-7 bg-(--studio-control) border border-(--studio-border) rounded text-[11px] text-white px-2 focus:outline-none" />
                            </div>
                          );
                        })()}

                        {/* Masking (Track Matte) */}
                        {(() => {
                          const layer = getSelectedLayer();
                          const currentMatte = layer?.tt ?? 0; // 0 = None, 1 = Alpha Matte, 2 = Alpha Inverted Matte
                          return (
                            <div className="space-y-1 pt-1.5 border-t border-(--studio-border-oft)]">
                              <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Masking (Track Matte)</label>
                              <select
                                value={currentMatte}
                                onChange={(e) => {
                                  if (selectedLayerIndex === null || !rawJson) return;
                                  const matteVal = parseInt(e.target.value);
                                  const result = updateTrackMatte(rawJson, selectedLayerIndex, matteVal);
                                  setRawJson(result);
                                }}
                                className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none font-medium cursor-pointer"
                              >
                                <option value={0}>None (No clipping)</option>
                                <option value={1}>Alpha Matte (Use Layer Above as Mask)</option>
                                <option value={2}>Alpha Inverted Matte</option>
                              </select>
                              <p className="text-[9px] text-(--studio-muted) leading-relaxed mt-1">
                                Clipping uses the layer directly <span className="text-teal-400 font-bold">above</span> this layer in the stack as an alpha stencil.
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Contextual inspector fields based on layer type */}
                      {(() => {
                        const layer = getSelectedLayer();
                        if (!layer) return null;

                        if (layer.ty === 2) {
                          // Image Layer Controls
                          const assetId = layer.refId;
                          const asset = rawJson.assets?.find((a: any) => a.id === assetId);
                          const base64Src = asset?.p || "";
                          const nativeW = asset?.w || 100;
                          const nativeH = asset?.h || 100;

                          return (
                            <div className="space-y-4 pt-3 border-t border-(--studio-border-oft)]">
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">📷 Image Asset Inspector</p>

                              {/* Image Thumbnail Preview */}
                              {base64Src && (
                                <div className="flex flex-col items-center justify-center p-3 border border-(--studio-border) bg-(--studio-control) rounded-md">
                                  <img src={base64Src} alt="Preview" className="max-h-24 max-w-full rounded object-contain mb-2 bg-[#0b0b0f] shadow-inner" />
                                  <span className="text-[9px] font-mono text-(--studio-muted)">
                                    {nativeW} x {nativeH} px
                                  </span>
                                </div>
                              )}

                              {/* Replace Image Button */}
                              <button onClick={() => triggerReplaceImage(selectedLayerIndex!)} className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs rounded border border-emerald-500/35 hover:border-emerald-500/50 cursor-pointer font-bold flex items-center justify-center gap-1.5 transition-all">
                                <RefreshCw size={12} className="animate-spin-slow" />
                                Replace Image Payload
                              </button>

                              {/* Native Image Dimensions scaling */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Native Width</label>
                                  <input
                                    type="number"
                                    value={nativeW}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const targetAsset = clone.assets?.find((a: any) => a.id === assetId);
                                      if (targetAsset) {
                                        targetAsset.w = parseInt(e.target.value) || 100;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Native Height</label>
                                  <input
                                    type="number"
                                    value={nativeH}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const targetAsset = clone.assets?.find((a: any) => a.id === assetId);
                                      if (targetAsset) {
                                        targetAsset.h = parseInt(e.target.value) || 100;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (layer.ty === 5) {
                          // Text Layer Controls
                          const defaultTextVal = (layer.t?.d?.k?.[0]?.s?.t || "").replace(/\r/g, "\n");
                          const fontSizeVal = layer.t?.d?.k?.[0]?.s?.s ?? 64;
                          const fontFamilyVal = layer.t?.d?.k?.[0]?.s?.f || "Poppins-Bold";
                          const textColorVal = layer.t?.d?.k?.[0]?.s?.fc || [1, 1, 1];

                          const alignVal = layer.t?.d?.k?.[0]?.s?.j ?? 0;
                          const lineHeightVal = layer.t?.d?.k?.[0]?.s?.lh ?? 80;
                          const letterSpacingVal = layer.t?.d?.k?.[0]?.s?.ls ?? 0;

                          const strokeWidthVal = layer.t?.d?.k?.[0]?.s?.sw ?? 0;
                          const strokeColorVal = layer.t?.d?.k?.[0]?.s?.sc || [0, 0, 0];

                          const floatToHex = (rgb: any) => {
                            if (!Array.isArray(rgb)) return "#ffffff";
                            const r = Math.round(Math.max(0, Math.min(1, rgb[0] || 0)) * 255);
                            const g = Math.round(Math.max(0, Math.min(1, rgb[1] || 0)) * 255);
                            const b = Math.round(Math.max(0, Math.min(1, rgb[2] || 0)) * 255);
                            return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
                          };

                          const hexColor = floatToHex(textColorVal);
                          const strokeHexColor = floatToHex(strokeColorVal);

                          // Find the role mapping config
                          const currentMappingIndex = mappedLayers.findIndex((m) => m.layerName === layer.nm);
                          const currentMapping = currentMappingIndex !== -1 ? mappedLayers[currentMappingIndex] : null;

                          return (
                            <div className="space-y-4 pt-3 border-t border-(--studio-border-oft)]">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Typography Inspector</p>
                                <button
                                  onClick={() => {
                                    handleLoadTextStyle();
                                  }}
                                  className="text-[9px] px-2 py-0.5 rounded border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer font-bold transition-colors"
                                  title="Open full style editor for this layer"
                                >
                                  ✦ Style Editor
                                </button>
                              </div>

                              {/* Role Mapping */}
                              {currentMapping && (
                                <div className="p-2 rounded border border-(--studio-border) bg-(--studio-control) space-y-1.5">
                                  <p className="text-[9px] text-(--studio-muted) uppercase font-bold">Text Role Binding</p>
                                  <div className="flex gap-1">
                                    {(["primary", "secondary", "accent"] as const).map((role) => (
                                      <button
                                        key={role}
                                        onClick={() => {
                                          const next = [...mappedLayers];
                                          next[currentMappingIndex] = { ...next[currentMappingIndex], role };
                                          setMappedLayers(next);
                                        }}
                                        className={`flex-1 py-1 text-[9px] font-bold rounded border cursor-pointer transition-colors capitalize ${currentMapping.role === role ? "bg-indigo-500/30 border-indigo-500/50 text-indigo-200" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}
                                      >
                                        {role}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <label className="text-[9px] text-(--studio-muted) shrink-0">Max chars</label>
                                    <input
                                      type="number"
                                      value={currentMapping.maxCharacters}
                                      min={1}
                                      max={500}
                                      onChange={(e) => {
                                        const next = [...mappedLayers];
                                        next[currentMappingIndex] = { ...next[currentMappingIndex], maxCharacters: Number(e.target.value) || 30 };
                                        setMappedLayers(next);
                                      }}
                                      className="w-16 h-6 bg-(--studio-control) border border-(--studio-border) rounded px-1.5 text-[10px] text-white focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Text Content */}
                              <div className="space-y-1">
                                <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Text Content</label>
                                <textarea
                                  value={defaultTextVal}
                                  onChange={(e) => {
                                    if (!rawJson) return;
                                    const clone = JSON.parse(JSON.stringify(rawJson));
                                    const target = clone.layers[selectedLayerIndex!];
                                    if (target?.t?.d?.k?.[0]?.s) {
                                      target.t.d.k[0].s.t = e.target.value.replace(/\n/g, "\r");
                                    }
                                    setRawJson(clone);
                                  }}
                                  rows={2}
                                  className="w-full bg-(--studio-control) border border-(--studio-border) rounded p-2.5 text-xs text-white focus:outline-none resize-none font-medium"
                                  placeholder="Text content..."
                                />
                              </div>

                              {/* Font Family & Size */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Font Weight</label>
                                  <select
                                    value={fontFamilyVal}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const target = clone.layers[selectedLayerIndex!];
                                      if (target?.t?.d?.k?.[0]?.s) {
                                        target.t.d.k[0].s.f = e.target.value;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none font-medium cursor-pointer"
                                  >
                                    <option value="Poppins-Regular">Poppins Regular</option>
                                    <option value="Poppins-Bold">Poppins Bold</option>
                                    <option value="Poppins-Italic">Poppins Italic</option>
                                    <option value="Poppins-BoldItalic">Poppins Bold Italic</option>
                                    <option value="Arial">Arial Regular</option>
                                    <option value="Arial-Bold">Arial Bold</option>
                                    <option value="Arial-Italic">Arial Italic (Normal Italic)</option>
                                    <option value="Arial-BoldItalic">Arial Bold Italic</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Font Size</label>
                                  <input
                                    type="number"
                                    value={fontSizeVal}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const target = clone.layers[selectedLayerIndex!];
                                      if (target?.t?.d?.k?.[0]?.s) {
                                        target.t.d.k[0].s.s = parseInt(e.target.value) || 12;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Line Height & Letter Spacing */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Line Height</label>
                                  <input
                                    type="number"
                                    value={lineHeightVal}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const target = clone.layers[selectedLayerIndex!];
                                      if (target?.t?.d?.k?.[0]?.s) {
                                        target.t.d.k[0].s.lh = parseInt(e.target.value) || 12;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Letter Spacing</label>
                                  <input
                                    type="number"
                                    value={letterSpacingVal}
                                    onChange={(e) => {
                                      if (!rawJson) return;
                                      const clone = JSON.parse(JSON.stringify(rawJson));
                                      const target = clone.layers[selectedLayerIndex!];
                                      if (target?.t?.d?.k?.[0]?.s) {
                                        target.t.d.k[0].s.ls = parseInt(e.target.value) || 0;
                                      }
                                      setRawJson(clone);
                                    }}
                                    className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Text Alignment (Justification) */}
                              <div className="space-y-1">
                                <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Alignment</label>
                                <div className="grid grid-cols-4 gap-1">
                                  {[
                                    { label: "Left", val: 0 },
                                    { label: "Right", val: 1 },
                                    { label: "Center", val: 2 },
                                    { label: "Justify", val: 3 },
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      onClick={() => {
                                        if (!rawJson) return;
                                        const clone = JSON.parse(JSON.stringify(rawJson));
                                        const target = clone.layers[selectedLayerIndex!];
                                        if (target?.t?.d?.k?.[0]?.s) {
                                          target.t.d.k[0].s.j = opt.val;
                                        }
                                        setRawJson(clone);
                                      }}
                                      className={`py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${alignVal === opt.val ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-(--studio-control) border-(--studio-border) text-(--studio-muted) hover:text-white"}`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Text Color Fill */}
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] text-(--studio-muted) uppercase shrink-0">Text Color</label>
                                <input
                                  type="color"
                                  value={hexColor}
                                  onChange={(e) => {
                                    if (!rawJson) return;
                                    const clone = JSON.parse(JSON.stringify(rawJson));
                                    const target = clone.layers[selectedLayerIndex!];
                                    if (target?.t?.d?.k?.[0]?.s?.fc) {
                                      const cleanHex = e.target.value.startsWith("#") ? e.target.value.slice(1) : e.target.value;
                                      const r = parseInt(cleanHex.slice(0, 2), 16) / 255 || 0;
                                      const g = parseInt(cleanHex.slice(2, 4), 16) / 255 || 0;
                                      const b = parseInt(cleanHex.slice(4, 6), 16) / 255 || 0;
                                      target.t.d.k[0].s.fc = [r, g, b];
                                    }
                                    setRawJson(clone);
                                  }}
                                  className="w-8 h-8 rounded border border-(--studio-border) cursor-pointer bg-transparent"
                                />
                                <span className="text-[11px] font-mono text-(--studio-muted) uppercase">{hexColor}</span>
                              </div>

                              {/* Text Stroke Color & Width */}
                              <div className="p-2.5 rounded bg-(--studio-control) border border-(--studio-border-oft)] space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wide">Text Stroke</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Stroke Width</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="20"
                                      value={strokeWidthVal}
                                      onChange={(e) => {
                                        if (!rawJson) return;
                                        const clone = JSON.parse(JSON.stringify(rawJson));
                                        const target = clone.layers[selectedLayerIndex!];
                                        if (target?.t?.d?.k?.[0]?.s) {
                                          target.t.d.k[0].s.sw = parseInt(e.target.value) || 0;
                                        }
                                        setRawJson(clone);
                                      }}
                                      className="w-full h-8 bg-(--studio-panel) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Stroke Color</label>
                                    <div className="flex items-center gap-1.5 h-8">
                                      <input
                                        type="color"
                                        value={strokeHexColor}
                                        onChange={(e) => {
                                          if (!rawJson) return;
                                          const clone = JSON.parse(JSON.stringify(rawJson));
                                          const target = clone.layers[selectedLayerIndex!];
                                          if (target?.t?.d?.k?.[0]?.s) {
                                            const cleanHex = e.target.value.startsWith("#") ? e.target.value.slice(1) : e.target.value;
                                            const r = parseInt(cleanHex.slice(0, 2), 16) / 255 || 0;
                                            const g = parseInt(cleanHex.slice(2, 4), 16) / 255 || 0;
                                            const b = parseInt(cleanHex.slice(4, 6), 16) / 255 || 0;
                                            target.t.d.k[0].s.sc = [r, g, b];
                                          }
                                          setRawJson(clone);
                                        }}
                                        className="w-7 h-7 rounded border border-(--studio-border) cursor-pointer bg-transparent"
                                      />
                                      <span className="text-[10px] font-mono text-(--studio-muted) uppercase">{strokeHexColor}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Role Mapping Section */}
                              {currentMapping && (
                                <div className="p-2.5 rounded border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">🏷️ Clypra Editor Role Map</p>

                                  <div className="space-y-1">
                                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Editor Variable Role</label>
                                    <select
                                      value={currentMapping.role}
                                      onChange={(e) => {
                                        const next = [...mappedLayers];
                                        next[currentMappingIndex] = {
                                          ...next[currentMappingIndex],
                                          role: e.target.value as any,
                                        };
                                        setMappedLayers(next);
                                      }}
                                      className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none font-semibold cursor-pointer"
                                    >
                                      <option value="primary">Primary (Subscription/CTA)</option>
                                      <option value="secondary">Secondary (Channel/Logo)</option>
                                      <option value="accent">Accent (Info Text)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Max Characters Limit</label>
                                    <input
                                      type="number"
                                      value={currentMapping.maxCharacters}
                                      onChange={(e) => {
                                        const next = [...mappedLayers];
                                        next[currentMappingIndex] = {
                                          ...next[currentMappingIndex],
                                          maxCharacters: Math.max(1, parseInt(e.target.value) || 30),
                                        };
                                        setMappedLayers(next);
                                      }}
                                      className="w-full h-8 bg-(--studio-control) border border-(--studio-border) rounded px-2 text-xs text-white focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (layer.ty === 4) {
                          // Shape Layer Controls
                          // Recursive shape finder inside nested groups
                          const findEditableShapes = (shapesArray: any[]): any[] => {
                            const list: any[] = [];
                            if (!Array.isArray(shapesArray)) return list;

                            const traverse = (items: any[], parentName: string = "") => {
                              let pathItem: any = null;
                              let fillItem: any = null;

                              items.forEach((item) => {
                                if (!item) return;
                                if (item.ty === "rc" || item.ty === "el") {
                                  pathItem = item;
                                } else if (item.ty === "fl") {
                                  fillItem = item;
                                } else if (item.ty === "gr" && Array.isArray(item.it)) {
                                  traverse(item.it, item.nm || parentName);
                                }
                              });

                              if (pathItem) {
                                list.push({
                                  type: pathItem.ty === "rc" ? "rect" : "ellipse",
                                  name: pathItem.nm || parentName || (pathItem.ty === "rc" ? "Rectangle" : "Ellipse"),
                                  pathItem,
                                  fillItem,
                                });
                              }
                            };

                            traverse(shapesArray);
                            return list;
                          };

                          const editableShapes = findEditableShapes(layer.shapes || []);

                          if (editableShapes.length === 0) {
                            return (
                              <div className="space-y-3 pt-3 border-t border-(--studio-border-oft)]">
                                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Vector Shape Inspector</p>
                                <p className="text-[11px] text-(--studio-muted) italic">No vector shapes inside this layer. Use "+ Rectangle" or "+ Ellipse" in the Left Library to insert one.</p>
                              </div>
                            );
                          }

                          // Hex & RGB helpers
                          const floatToHex = (rgb: any) => {
                            if (!Array.isArray(rgb)) return "#ffffff";
                            const r = Math.round(Math.max(0, Math.min(1, rgb[0] || 0)) * 255);
                            const g = Math.round(Math.max(0, Math.min(1, rgb[1] || 0)) * 255);
                            const b = Math.round(Math.max(0, Math.min(1, rgb[2] || 0)) * 255);
                            return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
                          };

                          return (
                            <div className="space-y-4 pt-3 border-t border-(--studio-border-oft)]">
                              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Vector Shape Inspector</p>

                              {editableShapes.map((shape, sIdx) => {
                                const sizeK = shape.pathItem?.s?.k || [100, 100];
                                const widthVal = sizeK[0];
                                const heightVal = sizeK[1];
                                const roundnessVal = shape.pathItem?.r?.k ?? 0;
                                const colorVal = shape.fillItem?.c?.k || [1, 1, 1, 1];
                                const hexColor = floatToHex(colorVal);

                                return (
                                  <div key={sIdx} className="p-2.5 rounded bg-(--studio-control) border border-(--studio-border-oft)] space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-white uppercase tracking-wide">{shape.name}</span>
                                      <span className="text-[9px] font-mono text-(--studio-muted) uppercase">{shape.type === "rect" ? "RECTANGLE" : "ELLIPSE"}</span>
                                    </div>

                                    {/* Width & Height */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Width</label>
                                        <input
                                          type="number"
                                          value={widthVal}
                                          onChange={(e) => {
                                            if (!rawJson) return;
                                            const clone = JSON.parse(JSON.stringify(rawJson));
                                            const clLayer = clone.layers[selectedLayerIndex!];
                                            const clEditable = findEditableShapes(clLayer.shapes || []);
                                            if (clEditable[sIdx]?.pathItem?.s?.k) {
                                              clEditable[sIdx].pathItem.s.k[0] = parseInt(e.target.value) || 0;
                                            }
                                            setRawJson(clone);
                                          }}
                                          className="w-full h-7 bg-(--studio-panel) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Height</label>
                                        <input
                                          type="number"
                                          value={heightVal}
                                          onChange={(e) => {
                                            if (!rawJson) return;
                                            const clone = JSON.parse(JSON.stringify(rawJson));
                                            const clLayer = clone.layers[selectedLayerIndex!];
                                            const clEditable = findEditableShapes(clLayer.shapes || []);
                                            if (clEditable[sIdx]?.pathItem?.s?.k) {
                                              clEditable[sIdx].pathItem.s.k[1] = parseInt(e.target.value) || 0;
                                            }
                                            setRawJson(clone);
                                          }}
                                          className="w-full h-7 bg-(--studio-panel) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    {/* Corner Radius (Only for Rectangles) */}
                                    {shape.type === "rect" && (
                                      <div>
                                        <label className="block text-[9px] text-(--studio-muted) uppercase mb-0.5">Corner Radius (Roundness)</label>
                                        <input
                                          type="number"
                                          value={roundnessVal}
                                          onChange={(e) => {
                                            if (!rawJson) return;
                                            const clone = JSON.parse(JSON.stringify(rawJson));
                                            const clLayer = clone.layers[selectedLayerIndex!];
                                            const clEditable = findEditableShapes(clLayer.shapes || []);
                                            if (clEditable[sIdx]?.pathItem?.r) {
                                              clEditable[sIdx].pathItem.r.k = parseInt(e.target.value) || 0;
                                            }
                                            setRawJson(clone);
                                          }}
                                          className="w-full h-7 bg-(--studio-panel) border border-(--studio-border) rounded text-[11px] px-2 text-white focus:outline-none"
                                        />
                                      </div>
                                    )}

                                    {/* Color Fill picker */}
                                    {shape.fillItem && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <label className="text-[9px] text-(--studio-muted) uppercase shrink-0">Fill Color</label>
                                        <input
                                          type="color"
                                          value={hexColor}
                                          onChange={(e) => {
                                            if (!rawJson) return;
                                            const clone = JSON.parse(JSON.stringify(rawJson));
                                            const clLayer = clone.layers[selectedLayerIndex!];
                                            const clEditable = findEditableShapes(clLayer.shapes || []);
                                            if (clEditable[sIdx]?.fillItem?.c?.k) {
                                              const cleanHex = e.target.value.startsWith("#") ? e.target.value.slice(1) : e.target.value;
                                              const r = parseInt(cleanHex.slice(0, 2), 16) / 255 || 0;
                                              const g = parseInt(cleanHex.slice(2, 4), 16) / 255 || 0;
                                              const b = parseInt(cleanHex.slice(4, 6), 16) / 255 || 0;
                                              clEditable[sIdx].fillItem.c.k = [r, g, b, 1];
                                            }
                                            setRawJson(clone);
                                          }}
                                          className="w-8 h-8 rounded border border-(--studio-border) cursor-pointer bg-transparent"
                                        />
                                        <span className="text-[11px] font-mono text-(--studio-muted) uppercase">{hexColor}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        if (layer.ty === 1) {
                          // Solid Layer Controls
                          return (
                            <div className="space-y-3 pt-3 border-t border-(--studio-border-oft)]">
                              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Solid Backdrop Inspector</p>
                              <div className="flex items-center gap-2">
                                <label className="text-[9px] text-(--studio-muted) uppercase shrink-0">Color</label>
                                <input
                                  type="color"
                                  value={layer.sc || "#1e1e26"}
                                  onChange={(e) => {
                                    if (!rawJson) return;
                                    const clone = JSON.parse(JSON.stringify(rawJson));
                                    clone.layers[selectedLayerIndex!].sc = e.target.value;
                                    setRawJson(clone);
                                  }}
                                  className="w-8 h-8 rounded border border-(--studio-border) cursor-pointer bg-transparent"
                                />
                                <span className="text-xs font-mono text-(--studio-muted) uppercase">{layer.sc}</span>
                              </div>
                            </div>
                          );
                        }

                        // Shape layer — color override panel
                        if (layer.ty === 4) {
                          const existingOverride = colorOverrides.find((o) => o.layerName === layer.nm);
                          return (
                            <div className="space-y-3 pt-3 border-t border-(--studio-border-oft)]">
                              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Shape Color Override</p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={existingOverride?.color || "#7C6FFF"}
                                  onChange={(e) => {
                                    const color = e.target.value;
                                    setColorOverrides((prev) => {
                                      const next = prev.filter((o) => o.layerName !== layer.nm);
                                      return [...next, { layerName: layer.nm, color }];
                                    });
                                  }}
                                  className="w-8 h-8 rounded border border-(--studio-border) cursor-pointer bg-transparent"
                                />
                                <span className="text-[10px] font-mono text-(--studio-muted)">{existingOverride?.color || "No override"}</span>
                                {existingOverride && (
                                  <button onClick={() => setColorOverrides((prev) => prev.filter((o) => o.layerName !== layer.nm))} className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">
                                    Clear
                                  </button>
                                )}
                              </div>
                              <p className="text-[9px] text-(--studio-muted) leading-relaxed">Overrides all fill colors in this shape layer for live preview.</p>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </>
                  ))}
                {rightPanelTab === "meta" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-(--studio-muted)">[id].meta.ts</h4>
                      <button onClick={copyToClipboard} className="text-[10px] px-2 py-1 rounded border border-(--studio-border) bg-(--studio-control) hover:bg-(--studio-hover) text-white cursor-pointer flex items-center gap-1">
                        <Copy size={11} className={copiedCodeFeedback ? "text-green-400" : ""} />
                        {copiedCodeFeedback ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="text-[9px] font-mono text-(--studio-muted) bg-(--studio-control) border border-(--studio-border) rounded p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">{generatedMetadata}</pre>
                  </div>
                )}

                {/* ── JSON TAB ── */}
                {rightPanelTab === "json" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-(--studio-muted)">[id].json</h4>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
                            setCopiedCodeFeedback(true);
                            setTimeout(() => setCopiedCodeFeedback(false), 2000);
                          } catch {}
                        }}
                        className="text-[10px] px-2 py-1 rounded border border-(--studio-border) bg-(--studio-control) hover:bg-(--studio-hover) text-white cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={11} className={copiedCodeFeedback ? "text-green-400" : ""} />
                        {copiedCodeFeedback ? "Copied!" : "Copy JSON"}
                      </button>
                    </div>
                    <pre className="text-[9px] font-mono text-(--studio-muted) bg-(--studio-control) border border-(--studio-border) rounded p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                      {JSON.stringify(rawJson, null, 2).slice(0, 8000)}
                      {JSON.stringify(rawJson).length > 8000 ? "\n\n... (truncated)" : ""}
                    </pre>
                  </div>
                )}
              </div>
            </aside>
          </div>

          <GitHubConfigModal open={showGithubConfig} onClose={() => setShowGithubConfig(false)} />

          <GeminiKeyModal open={showGeminiKeyModal} onClose={() => setShowGeminiKeyModal(false)} />

          <PublishTemplateModal open={showPublishModal} onClose={() => setShowPublishModal(false)} templateId={templateId} templateName={templateName} category={category} description={description} tagsInput={tagsInput} placement={placement} thumbnailFrame={thumbnailFrame} durationFrames={durationFrames} validationErrors={validationErrors} lottieData={rawJson} thumbnailDataUrl={thumbnailDataUrl || undefined} width={width} height={height} onTemplateIdChange={setTemplateId} onTemplateNameChange={setTemplateName} onCategoryChange={setCategory} onDescriptionChange={setDescription} onTagsInputChange={setTagsInput} onPlacementChange={setPlacement} onThumbnailFrameChange={setThumbnailFrame} onUseCurrentFrame={handleUseCurrentFrameAsThumbnail} onPreviewThumbnail={handlePreviewThumbnailFrame} onPublish={handlePublishTemplate} publishStatus={publishStatus} publishMessage={publishMessage} publishPrUrl={publishPrUrl} />

          {/* BOTTOM PANEL: Keyframe Dope Sheet & Timeline */}
          <div className="h-44 shrink-0 border-t border-(--studio-border) bg-(--studio-shell) flex flex-col overflow-hidden select-none">
            {/* Timeline ticks header */}
            <div className="h-8 border-b border-(--studio-border-oft)] bg-(--studio-control) flex items-center shrink-0">
              <div className="w-48 border-r border-(--studio-border-oft)] px-3 text-[10px] font-bold text-(--studio-muted) uppercase shrink-0">Layer Anim Tracks</div>
              <div
                className="flex-1 relative h-full flex items-center"
                onContextMenu={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = clickX / rect.width;
                  const targetFrame = Math.max(0, Math.min(durationFrames - 1, Math.round(pct * durationFrames)));
                  handleSetThumbnailToFrame(targetFrame);

                  // Also jump to that frame
                  setIsPlaying(false);
                  setCurrentFrame(targetFrame);
                  if (animRef.current) {
                    animRef.current.goToAndStop(targetFrame, true);
                  }
                }}
                title="Right-click to set thumbnail frame"
              >
                {/* Horizontal Ticks */}
                {Array.from({ length: Math.ceil(durationFrames / 10) }).map((_, idx) => (
                  <span key={idx} style={{ left: `${(idx * 10 * 100) / durationFrames}%` }} className="absolute text-[8px] font-mono text-(--studio-muted) -translate-x-1/2">
                    {idx * 10}f
                  </span>
                ))}

                {/* Active Playhead cursor line indicator */}
                <div style={{ left: `${(currentFrame * 100) / durationFrames}%` }} className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 timeline-playhead" />

                {/* Thumbnail frame indicator */}
                <div style={{ left: `${(thumbnailFrame * 100) / durationFrames}%` }} className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-9 pointer-events-none" />
                <div
                  style={{ left: `${(thumbnailFrame * 100) / durationFrames}%` }}
                  className="absolute top-0 w-3 h-3 bg-amber-400 border-2 border-amber-600 rounded-full -translate-x-1/2 shadow-[0_0_8px_rgba(251,191,36,0.6)] cursor-pointer hover:scale-125 transition-transform z-10"
                  title={`Thumbnail frame: ${thumbnailFrame}. Click to preview, drag to adjust.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewThumbnailFrame();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startFrame = thumbnailFrame;
                    const timelineHeader = e.currentTarget.parentElement;
                    if (!timelineHeader) return;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = timelineHeader.getBoundingClientRect();
                      const deltaX = moveEvent.clientX - startX;
                      const deltaFrames = Math.round((deltaX / rect.width) * durationFrames);
                      const newFrame = Math.max(0, Math.min(durationFrames - 1, startFrame + deltaFrames));
                      handleSetThumbnailToFrame(newFrame);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  <ImageIcon size={8} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-900" />
                </div>
              </div>
            </div>

            {/* Tracks visual Lanes scroll port */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-clypra-bg">
              {selectedLayerIndex === null ? (
                <div className="text-center py-8 text-xs text-(--studio-muted)">Select a layer to visualize animatable transform tracks.</div>
              ) : (
                <div className="divide-y divide-(--studio-border-oft)]">
                  {(["ks.p", "ks.s", "ks.r", "ks.o"] as LottiePropertyPath[]).map((trackPath) => {
                    const track = getTrackInfo(trackPath);
                    const label = trackPath === "ks.p" ? "Position" : trackPath === "ks.s" ? "Scale" : trackPath === "ks.r" ? "Rotation" : "Opacity";

                    return (
                      <div key={trackPath} className="h-7 flex items-center">
                        {/* Track Name */}
                        <div className="w-48 border-r border-(--studio-border-oft)] px-3 text-[10px] font-semibold text-(--studio-muted) shrink-0 flex items-center justify-between">
                          <span className={track.isAnimated ? "text-purple-300 font-bold" : ""}>↳ {label}</span>
                          <span className="text-[9px] font-mono font-semibold text-white/50">{track.isAnimated ? "Animated" : "Static"}</span>
                        </div>

                        {/* Lane Timeline with Diamond keyframe markers */}
                        <div className="flex-1 h-full relative flex items-center bg-[#07070a]/40">
                          {track.isAnimated &&
                            Array.isArray(track.keyframes) &&
                            track.keyframes.map((kf: any) => {
                              const pct = (kf.t * 100) / durationFrames;
                              const isCurrent = kf.t === currentFrame;
                              return (
                                <div
                                  key={kf.t}
                                  onClick={() => {
                                    setIsPlaying(false);
                                    setCurrentFrame(kf.t);
                                    if (animRef.current) {
                                      animRef.current.goToAndStop(kf.t, true);
                                    }
                                  }}
                                  style={{ left: `${pct}%` }}
                                  className={`absolute w-2.5 h-2.5 rotate-45 border -translate-x-1/2 cursor-pointer transition-all hover:scale-125 flex items-center justify-center ${isCurrent ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-purple-500 border-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]"}`}
                                  title={`Keyframe at frame ${kf.t}. Double click to delete.`}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteKeyframe(trackPath, kf.t);
                                  }}
                                />
                              );
                            })}

                          {/* Quick Add keyframe node click trigger */}
                          <div
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const pct = clickX / rect.width;
                              const targetFrame = Math.max(0, Math.min(durationFrames - 1, Math.round(pct * durationFrames)));

                              setIsPlaying(false);
                              setCurrentFrame(targetFrame);
                              if (animRef.current) {
                                animRef.current.goToAndStop(targetFrame, true);
                              }

                              // Add keyframe at this frame
                              const currVal = Array.isArray(track.value) ? [track.value[0], track.value[1], track.value[2]] : track.value;
                              const result = addOrUpdateKeyframe(rawJson, selectedLayerIndex, trackPath, targetFrame, currVal, "easeInOut");
                              setRawJson(result);
                            }}
                            className="absolute inset-0 cursor-crosshair opacity-0 hover:opacity-10 transition-opacity bg-white/5"
                            title="Click to insert keyframe node at this frame point"
                          />

                          {/* Active Playhead Cursor line */}
                          <div style={{ left: `${(currentFrame * 100) / durationFrames}%` }} className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
    </div>
  );
}
