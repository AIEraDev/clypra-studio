import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Download,
  Copy,
  Plus,
  Play,
  Pause,
  Loader2,
  FolderPlus,
  ArrowLeft,
  Sparkles,
  FileJson,
  UploadCloud,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  CopyPlus,
  Move,
  Settings,
  Image as ImageIcon,
  Sparkle,
  Clock,
  Split,
  Anchor,
  Variable,
  Ghost,
  LayoutGrid,
  Columns,
  Rows,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Monitor,
  ChevronRight,
  CornerDownRight,
  Type,
  Square,
  Box,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { ClypraColorPicker } from "@clypra/ui-color-picker";
import { SUPPORTED_FONT_FAMILIES } from "@/constants/fonts";

import {
  BUILTIN_CANVAS_TEMPLATES,
  TemplateCategory,
  TextTemplate,
  TemplateLayer,
  TemplateTextLayer,
  TemplateShapeLayer,
  TemplateImageLayer,
  TemplateContainerLayer,
  LayerAnimation,
  AnimationPreset,
  AnimatableValue,
  TemplateKeyframe,
  TemplateEasingFunction,
  BezierControlPoints,
  SpringParams,
  TextSplitAnimator,
  ResponsiveAnchorConfig,
  TemplateVariableDefinition,
  addKeyframe,
  removeTemplateKeyframe,
  isKeyframed,
  evaluateAnimatable,
  getSupportedWebMMimeType,
} from "@clypra-studio/engine";
import { PublishTemplateModal } from "../PublishTemplateModal";
import { getStudioApiBaseUrl } from "../../services/apiConfig";
import { ClypraLogo } from "../ClypraLogo";
import { Link } from "react-router-dom";
import {
  canonicalArtifactFromTemplate,
  renderTextTemplatePreviewToCanvas,
  renderTextTemplateFrame,
  TextTemplatePreviewScheduler,
  warmTextTemplateRenderer,
} from "../../services/textTemplateRenderService";
import { getNativeRenderClient } from "../../services/nativeRenderClient";
import { saveTextTemplateDraft } from "../../services/textTemplateDraftStore";
import { BezierCurveEditor } from "./controls/BezierCurveEditor";
import { TextSplitAnimatorControl } from "./controls/TextSplitAnimatorControl";
import { ResponsiveAnchorControl } from "./controls/ResponsiveAnchorControl";
import { TemplateVariableManager } from "./controls/TemplateVariableManager";
import {
  OnionSkinControl,
  OnionSkinOptions,
} from "./controls/OnionSkinControl";
import {
  QuickInsertToolbar,
  QuickInsertType,
  BoxStylePresetPicker,
  BoxStylePreset,
  QuickPositionGrid,
  LayerAnimationTimeline,
  MotionCatalogModal,
  MotionCatalogPreset,
} from "./controls";

export interface TemplateWorkspaceProps {
  onBackToDesign: () => void;
}

const CATEGORIES: TemplateCategory[] = [
  "lower-third",
  "title-card",
  "caption",
  "callout",
  "social",
  "countdown",
  "kinetic-type",
  "cta",
  "credits",
  "quotes",
  "sports",
  "gaming",
  "news",
  "minimal",
];
const PLACEMENTS = ["lower-third", "center", "top", "full-frame"] as const;

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCanonicalTemplatePayload(template: TextTemplate): TextTemplate {
  const layers = (template.layers || []).map((layer, index) => ({
    ...layer,
    id: layer.id || `${layer.kind}-${index + 1}`,
  }));
  const dependencies = layers
    .filter((layer: any) => layer.kind === "text" && layer.styleRef)
    .map((layer: any) => layer.styleRef)
    .filter(
      (ref: any, index: number, all: any[]) =>
        all.findIndex(
          (item) =>
            item.effectId === ref.effectId &&
            item.revisionId === ref.revisionId,
        ) === index,
    );
  return {
    ...template,
    schemaVersion: 2,
    fps: Number((template as any).fps ?? 30),
    dependencies,
    layers,
  } as TextTemplate;
}

export function TemplateWorkspace({ onBackToDesign }: TemplateWorkspaceProps) {
  // Template State
  const [template, setTemplate] = useState<TextTemplate | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [colorOverrides, setColorOverrides] = useState<Map<string, string>>(
    new Map(),
  );

  // Playback / Timeline clock
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewState, setPreviewState] = useState<
    "idle" | "rendering" | "ready" | "error"
  >("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [thumbnailFrame, setThumbnailFrame] = useState(0);

  // New template configurations
  const [newTemplateId, setNewTemplateId] = useState("my-custom-template");
  const [newLabel, setNewLabel] = useState("My Custom Template");
  const [newCategory, setNewCategory] =
    useState<TemplateCategory>("lower-third");
  const [newW, setNewW] = useState(1920);
  const [newH, setNewH] = useState(1080);
  const [newDuration, setNewDuration] = useState(3.0);

  // Workspace visual layers settings
  const [lockedLayers, setLockedLayers] = useState<Set<string>>(new Set());

  // Keyframe Editor State
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showKeyframeEditor, setShowKeyframeEditor] = useState(false);

  // Preview Video State
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Publishing States
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showMotionCatalog, setShowMotionCatalog] = useState(false);
  const [publishStatus, setPublishStatus] = useState<
    "idle" | "publishing" | "submitted" | "published" | "failed"
  >("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishPrUrl, setPublishPrUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [publishVideoDataUrl, setPublishVideoDataUrl] = useState<string | null>(
    null,
  );
  const [isGeneratingPublishVideo, setIsGeneratingPublishVideo] =
    useState(false);
  const [publishDescription, setPublishDescription] = useState(() => {
    try {
      const saved = localStorage.getItem("clypra_publish_metadata_draft");
      if (saved) return JSON.parse(saved).description || "";
    } catch {}
    return "";
  });
  const [publishTagsInput, setPublishTagsInput] = useState(() => {
    try {
      const saved = localStorage.getItem("clypra_publish_metadata_draft");
      if (saved) return JSON.parse(saved).tagsInput || "";
    } catch {}
    return "";
  });
  const [publishPlacement, setPublishPlacement] = useState<
    (typeof PLACEMENTS)[number]
  >(() => {
    try {
      const saved = localStorage.getItem("clypra_publish_metadata_draft");
      if (saved && saved.placement) return JSON.parse(saved).placement;
    } catch {}
    return "center";
  });
  const [publishCreatorName, setPublishCreatorName] = useState(() => {
    try {
      const saved = localStorage.getItem("clypra_publish_metadata_draft");
      if (saved) return JSON.parse(saved).creatorName || "";
    } catch {}
    return "";
  });
  const [publishCreatorLink, setPublishCreatorLink] = useState(() => {
    try {
      const saved = localStorage.getItem("clypra_publish_metadata_draft");
      if (saved) return JSON.parse(saved).creatorLink || "";
    } catch {}
    return "";
  });

  // Persist publish metadata to LocalStorage until successfully published
  useEffect(() => {
    try {
      const draft = {
        description: publishDescription,
        tagsInput: publishTagsInput,
        placement: publishPlacement,
        creatorName: publishCreatorName,
        creatorLink: publishCreatorLink,
      };
      if (
        publishDescription ||
        publishTagsInput ||
        publishCreatorName ||
        publishCreatorLink
      ) {
        localStorage.setItem(
          "clypra_publish_metadata_draft",
          JSON.stringify(draft),
        );
      }
    } catch (e) {
      console.warn("Failed to persist publish metadata draft", e);
    }
  }, [
    publishDescription,
    publishTagsInput,
    publishPlacement,
    publishCreatorName,
    publishCreatorLink,
  ]);

  // Responsive Aspect Ratio & Onion Skinning
  const [aspectRatio, setAspectRatio] = useState<
    "16:9" | "9:16" | "1:1" | "4:5"
  >("16:9");
  const [onionSkinOptions, setOnionSkinOptions] = useState<OnionSkinOptions>({
    enabled: false,
    frameCount: 2,
    frameDelta: 0.066,
  });
  const [variableTestValues, setVariableTestValues] = useState<
    Record<string, any>
  >({});

  // Auto-save notification
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Zoom & Pan state for the canvas viewport
  const [zoom, setZoom] = useState(100); // percentage: 25–400
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [previewQuality, setPreviewQuality] = useState<
    "auto" | "full" | "half" | "quarter"
  >("auto");
  const zoomRef = useRef(100);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const previewQualityRef = useRef<"auto" | "full" | "half" | "quarter">(
    "auto",
  );
  const panStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // ── Professional Undo / Redo History Engine ───────────────────────────────
  const [historyPast, setHistoryPast] = useState<TextTemplate[]>([]);
  const [historyFuture, setHistoryFuture] = useState<TextTemplate[]>([]);
  const historyPastRef = useRef<TextTemplate[]>([]);
  const historyFutureRef = useRef<TextTemplate[]>([]);
  const isUndoingOrRedoingRef = useRef(false);
  const lastHistorySerializedRef = useRef<string>("");

  useEffect(() => {
    historyPastRef.current = historyPast;
  }, [historyPast]);
  useEffect(() => {
    historyFutureRef.current = historyFuture;
  }, [historyFuture]);

  // Snapshot helper: captures the current template before a mutation
  const pushHistorySnapshot = (prevTemplate: TextTemplate | null) => {
    if (!prevTemplate || isUndoingOrRedoingRef.current) return;
    try {
      const serialized = JSON.stringify(prevTemplate);
      if (serialized === lastHistorySerializedRef.current) return;
      lastHistorySerializedRef.current = serialized;
      const clone = JSON.parse(serialized) as TextTemplate;
      setHistoryPast((prev) => [...prev.slice(-49), clone]);
      setHistoryFuture([]);
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    if (historyPastRef.current.length === 0 || !templateRef.current) return;
    const past = [...historyPastRef.current];
    const previousSnapshot = past.pop()!;
    const currentSnapshot = JSON.parse(
      JSON.stringify(templateRef.current),
    ) as TextTemplate;

    isUndoingOrRedoingRef.current = true;
    lastHistorySerializedRef.current = JSON.stringify(previousSnapshot);
    setHistoryPast(past);
    setHistoryFuture((prev) => [currentSnapshot, ...prev]);
    setTemplate(previousSnapshot);
    templateRef.current = previousSnapshot;
    toast.info("Undo", { id: "undo-action", duration: 900 });
    setTimeout(() => {
      isUndoingOrRedoingRef.current = false;
    }, 60);
  };

  const handleRedo = () => {
    if (historyFutureRef.current.length === 0 || !templateRef.current) return;
    const future = [...historyFutureRef.current];
    const nextSnapshot = future.shift()!;
    const currentSnapshot = JSON.parse(
      JSON.stringify(templateRef.current),
    ) as TextTemplate;

    isUndoingOrRedoingRef.current = true;
    lastHistorySerializedRef.current = JSON.stringify(nextSnapshot);
    setHistoryFuture(future);
    setHistoryPast((prev) => [...prev.slice(-49), currentSnapshot]);
    setTemplate(nextSnapshot);
    templateRef.current = nextSnapshot;
    toast.info("Redo", { id: "redo-action", duration: 900 });
    setTimeout(() => {
      isUndoingOrRedoingRef.current = false;
    }, 60);
  };

  // Global Keyboard Shortcuts for Undo (Cmd/Ctrl + Z) and Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (isInput) return;
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        if (isInput) return;
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fire a subtle toast when the workspace auto-saves so the header
  // doesn't need to hold a persistent "Auto-saved" indicator.
  useEffect(() => {
    if (saveStatus === "saved") {
      toast.success("Auto-saved", { id: "template-autosave", duration: 1500 });
    }
  }, [saveStatus]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);
  const playbackSpeedRef = useRef(playbackSpeed);
  const templateRef = useRef(template);
  const previewSchedulerRef = useRef<TextTemplatePreviewScheduler | null>(null);
  const lastTimelineUiUpdateRef = useRef(0);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const dragStartRef = useRef<{
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  const colorOverridesRef = useRef(colorOverrides);
  useEffect(() => {
    colorOverridesRef.current = colorOverrides;
  }, [colorOverrides]);

  const onionSkinOptionsRef = useRef(onionSkinOptions);
  useEffect(() => {
    onionSkinOptionsRef.current = onionSkinOptions;
  }, [onionSkinOptions]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Keep zoom/pan refs in sync
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);
  useEffect(() => {
    previewQualityRef.current = previewQuality;
  }, [previewQuality]);

  // Clamp and apply zoom helper
  const applyZoom = (nextZoom: number, originX = 0, originY = 0) => {
    const clamped = Math.round(Math.max(25, Math.min(400, nextZoom)));
    const ratio = clamped / zoomRef.current;
    // Keep the point under the cursor fixed during pinch/wheel zoom
    setPanOffset((prev) => ({
      x: originX + (prev.x - originX) * ratio,
      y: originY + (prev.y - originY) * ratio,
    }));
    setZoom(clamped);
    zoomRef.current = clamped;
  };

  const resetZoomAndPan = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Fit template to viewport
  const fitToViewport = () => {
    if (!viewportRef.current || !template) return;
    const vw = viewportRef.current.clientWidth - 64; // padding
    const vh = viewportRef.current.clientHeight - 64;
    const scaleX = (vw / template.canvasWidth) * 100;
    const scaleY = (vh / template.canvasHeight) * 100;
    const fit = Math.floor(Math.min(scaleX, scaleY, 400));
    setZoom(Math.max(25, fit));
    setPanOffset({ x: 0, y: 0 });
    zoomRef.current = Math.max(25, fit);
  };

  // Wheel zoom + spacebar pan
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const originX = e.clientX - rect.left - rect.width / 2;
      const originY = e.clientY - rect.top - rect.height / 2;
      const delta = e.deltaY < 0 ? 10 : -10;
      applyZoom(zoomRef.current + delta, originX, originY);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !isPanningRef.current &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsPanning(true);
        isPanningRef.current = true;
        viewport.style.cursor = "grab";
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
        isPanningRef.current = false;
        panStartRef.current = null;
        viewport.style.cursor = "";
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      e.preventDefault();
      viewport.style.cursor = "grabbing";
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: panOffsetRef.current.x,
        panY: panOffsetRef.current.y,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      const next = {
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      };
      setPanOffset(next);
      panOffsetRef.current = next;
    };

    const onMouseUp = () => {
      if (panStartRef.current) {
        panStartRef.current = null;
        if (isPanningRef.current) viewport.style.cursor = "grab";
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    viewport.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      viewport.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // Saved templates management
  const [savedTemplates, setSavedTemplates] = useState<
    Array<{ id: string; name: string; savedAt: number }>
  >([]);
  const [showSavedTemplates, setShowSavedTemplates] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  // Admin API template loading states
  const [isAdmin, setIsAdmin] = useState(false);
  const [apiTemplates, setApiTemplates] = useState<any[]>([]);
  const [apiTemplatesLoading, setApiTemplatesLoading] = useState(false);
  const [loadTab, setLoadTab] = useState<"presets" | "local" | "api">("presets");
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>("all");
  const [isLoadingApiTemplate, setIsLoadingApiTemplate] = useState(false);
  const [publishingApiTemplateId, setPublishingApiTemplateId] = useState<
    string | null
  >(null);
  const [publishApproved, setPublishApproved] = useState(true); // admin publish checkbox

  const [nativeGpuState, setNativeGpuState] = useState<
    "probing" | "ready" | "live" | "error"
  >("probing");
  const [nativeGpuInfo, setNativeGpuInfo] = useState<{
    adapterName?: string;
    backend?: string;
    failureReason?: string;
  } | null>(null);

  // Probe native GPU WebAssembly/WebGPU compositor
  useEffect(() => {
    let cancelled = false;
    getNativeRenderClient()
      .handshake()
      .then((handshake) => {
        if (cancelled) return;
        if (handshake.gpu.available && handshake.gpu.state === "ready") {
          setNativeGpuState("ready");
          setNativeGpuInfo({
            adapterName: handshake.gpu.adapterName || "WebGPU Adapter",
            backend: handshake.gpu.backend || "wgpu",
          });
        } else {
          setNativeGpuState("live");
          setNativeGpuInfo({
            adapterName: handshake.gpu.adapterName,
            backend: handshake.gpu.backend,
            failureReason: handshake.gpu.failureReason,
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setNativeGpuState("live");
        setNativeGpuInfo({ failureReason: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Parse JWT token to check if user is admin
  useEffect(() => {
    const token = localStorage.getItem("clypra_auth_token");
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
  }, [showSavedTemplates, showPublishModal]);

  useEffect(() => {
    if (showSavedTemplates && isAdmin) {
      setLoadTab("local");
      fetchApiTemplates();
    }
  }, [showSavedTemplates, isAdmin]);

  const fetchApiTemplates = async () => {
    setApiTemplatesLoading(true);
    try {
      const response = await fetch(`${getStudioApiBaseUrl()}/text-templates`);
      if (!response.ok) throw new Error("Failed to fetch API templates index");
      const data = await response.json();
      setApiTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch templates from API", err);
    } finally {
      setApiTemplatesLoading(false);
    }
  };

  const handlePublishApiTemplateDirectly = async (
    category: string,
    id: string,
  ) => {
    if (
      !confirm(
        "Are you sure you want to approve and publish this template immediately?",
      )
    ) {
      return;
    }
    setPublishingApiTemplateId(id);
    try {
      const response = await fetch(
        `${getStudioApiBaseUrl()}/text-templates/${category}/${id}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("clypra_auth_token") || ""}`,
            "X-Clypra-Client": "studio-text-template",
          },
        },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.message || err.error || "Failed to publish template",
        );
      }
      await fetchApiTemplates();
      alert("Template published successfully!");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Publishing failed");
    } finally {
      setPublishingApiTemplateId(null);
    }
  };

  const handleLoadApiTemplate = async (category: string, id: string) => {
    setIsLoadingApiTemplate(true);
    try {
      const response = await fetch(
        `${getStudioApiBaseUrl()}/text-templates/${category}/${id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch template from API");
      const lottieData = await response.json();

      setTemplate(lottieData);
      setSelectedLayerId(lottieData.layers?.[0]?.id || null);

      setColorOverrides(new Map());
      setThumbnailFrame(0);
      const maxIn = Math.max(
        ...(lottieData.layers || []).map(
          (l: any) => l.animation?.inDuration || 0,
        ),
        0,
      );
      setCurrentTime(
        maxIn > 0 ? Math.min(maxIn + 0.1, (lottieData.duration || 3) / 2) : 0,
      );
      setIsPlaying(false);
      setSaveStatus("saved");
      setShowSavedTemplates(false);
    } catch (err) {
      console.error("Failed to load template from API", err);
      alert("Failed to load template from API!");
    } finally {
      setIsLoadingApiTemplate(false);
    }
  };

  // Load template session from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("clypra_canvas_studio_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setTemplate(parsed.template);
          setSelectedLayerId(parsed.selectedLayerId);
          if (parsed.colorOverrides) {
            setColorOverrides(new Map(Object.entries(parsed.colorOverrides)));
          }
          setThumbnailFrame(parsed.thumbnailFrame || 0);
          const maxIn = Math.max(
            ...(parsed.template?.layers || []).map(
              (l: any) => l.animation?.inDuration || 0,
            ),
            0,
          );
          setCurrentTime(
            maxIn > 0
              ? Math.min(maxIn + 0.1, (parsed.template?.duration || 3) / 2)
              : 0,
          );
          setSaveStatus("saved");
        }
      } catch (err) {
        console.error("Failed to load template session", err);
      }
    }

    // Load saved templates list
    loadSavedTemplatesList();
  }, []);

  const loadSavedTemplatesList = () => {
    try {
      const saved = localStorage.getItem("clypra_saved_templates_list");
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load saved templates list", err);
    }
  };

  // Auto-save template state to localstorage
  useEffect(() => {
    if (!template) return;
    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      try {
        const data = {
          template,
          selectedLayerId,
          colorOverrides: Object.fromEntries(colorOverrides),
          thumbnailFrame,
        };
        localStorage.setItem(
          "clypra_canvas_studio_session",
          JSON.stringify(data),
        );
        void saveTextTemplateDraft({
          id: template.id,
          name: template.label || template.id,
          artifact: canonicalArtifactFromTemplate(template),
          controlValues: { colors: Object.fromEntries(colorOverrides) },
          thumbnailFrame,
        }).catch((error) =>
          console.warn("Failed to persist canonical template draft", error),
        );
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to save session", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [template, selectedLayerId, colorOverrides, thumbnailFrame]);

  useEffect(() => {
    // Match Text Effects Lab startup: initialize the long-lived GPU/WASM
    // renderer while the workspace mounts so the first visible frame does not
    // pay the adapter, pipeline, and shader initialization cost.
    void warmTextTemplateRenderer().catch((error) => {
      if (import.meta.env.DEV) {
        console.debug("[text-template] warmup.error", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, []);

  // Keep one bounded render pipeline for interactive preview. The scheduler
  // coalesces playhead updates while the native render is in flight, so a
  // slow WASM frame can finish and the latest frame can follow it.
  useEffect(() => {
    const scheduler = new TextTemplatePreviewScheduler(
      async ({ image }, isCurrent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const bitmap = await createImageBitmap(image);
        if (!isCurrent()) {
          bitmap.close();
          return;
        }
        if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          setPreviewState("ready");
          setPreviewError(null);
        }
        bitmap.close();
      },
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        setPreviewState("error");
        setPreviewError(message);
        console.warn("Native text-template preview unavailable", error);
      },
    );
    previewSchedulerRef.current = scheduler;
    return () => {
      scheduler.dispose();
      if (previewSchedulerRef.current === scheduler)
        previewSchedulerRef.current = null;
    };
  }, []);

  const requestPreviewFrame = (time: number, isDirectPlayback = false) => {
    const activeTemplate = templateRef.current;
    if (!activeTemplate || !canvasRef.current || !previewSchedulerRef.current)
      return;

    if (isDirectPlayback) {
      const artifact = canonicalArtifactFromTemplate(activeTemplate);
      renderTextTemplatePreviewToCanvas(canvasRef.current, {
        artifact,
        time,
        customization: {
          layerColors: Object.fromEntries(colorOverridesRef.current),
        },
      });
      return;
    }

    let previewTime = time;
    if (
      !isPlayingRef.current &&
      !isDirectPlayback &&
      time === 0 &&
      activeTemplate.layers?.length
    ) {
      const maxInDuration = activeTemplate.layers.reduce((max, layer) => {
        const dur = Number(layer.animation?.inDuration ?? 0);
        const preset = layer.animation?.in ?? "none";
        return preset !== "none" ? Math.max(max, dur) : max;
      }, 0);
      if (maxInDuration > 0) {
        previewTime = Math.min(
          maxInDuration + 0.05,
          activeTemplate.duration * 0.5,
        );
      }
    }

    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;
    const zoomFraction = zoomRef.current / 100;
    const q = previewQualityRef.current;

    let scale = 1.0;
    if (isPlayingRef.current || isDirectPlayback) {
      // 1.0 native crisp resolution during playback — smooth 60fps with zero blur!
      scale = 1.0;
    } else {
      if (q === "quarter") {
        scale = 0.5;
      } else if (q === "half") {
        scale = 1.0;
      } else {
        // "auto" / "sharp": scale with zoom level and retina DPR up to 4.0x (8K vector crispness)
        scale = Math.min(4.0, Math.max(1.0, zoomFraction * dpr));
      }
    }

    previewSchedulerRef.current.request({
      artifact: canonicalArtifactFromTemplate(activeTemplate),
      legacyTemplate: activeTemplate,
      time: previewTime,
      outputScale: scale,
      quality: "full",
      customization: {
        layerColors: Object.fromEntries(colorOverridesRef.current),
      },
      onionSkin: onionSkinOptionsRef.current.enabled
        ? {
            enabled: true,
            frameCount: onionSkinOptionsRef.current.frameCount,
            frameDelta: onionSkinOptionsRef.current.frameDelta,
          }
        : undefined,
    });
  };

  // Re-render static preview on scrub / template change / zoom / quality changes
  // — but NOT during live playback (the RAF tick handles that path)
  useEffect(() => {
    if (!template || !canvasRef.current) return;
    if (!isPlaying) {
      setPreviewState("rendering");
      setPreviewError(null);
      requestPreviewFrame(currentTime, false);
    }
  }, [
    template,
    currentTime,
    colorOverrides,
    isPlaying,
    onionSkinOptions,
    zoom,
    previewQuality,
  ]);

  // RequestAnimationFrame tick for playing previews
  const tick = (timestamp: number) => {
    const activeTemplate = templateRef.current;
    if (previousTimeRef.current !== null && activeTemplate) {
      const elapsed = (timestamp - previousTimeRef.current) / 1000;
      const nextTime =
        currentTimeRef.current + elapsed * playbackSpeedRef.current;
      let shouldPublishTimelineState =
        timestamp - lastTimelineUiUpdateRef.current >= 1000 / 30;
      if (nextTime >= activeTemplate.duration) {
        currentTimeRef.current = 0;
        shouldPublishTimelineState = true;
      } else {
        currentTimeRef.current = nextTime;
      }

      // Live real-time frame dispatch directly to the scheduler
      requestPreviewFrame(currentTimeRef.current, true);

      // The RAF clock remains smooth, but the large editor tree does not need
      // a React render for every display refresh. This keeps playback work
      // bounded while the preview scheduler handles the latest frame.
      if (shouldPublishTimelineState) {
        lastTimelineUiUpdateRef.current = timestamp;
        setCurrentTime(currentTimeRef.current);
      }
    }
    previousTimeRef.current = timestamp;
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = null;
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  // Save current template to library
  const handleSaveTemplate = () => {
    if (!template) return;

    const name = prompt(
      "Enter a name for this template:",
      template.label || template.id,
    );
    if (!name) return;

    const savedId = `saved_${Date.now()}`;
    const savedTemplate = {
      template,
      selectedLayerId,
      colorOverrides: Object.fromEntries(colorOverrides),
      thumbnailFrame,
    };

    // Save template data
    localStorage.setItem(
      `clypra_saved_template_${savedId}`,
      JSON.stringify(savedTemplate),
    );

    // Update saved templates list
    const newList = [
      ...savedTemplates,
      {
        id: savedId,
        name,
        savedAt: Date.now(),
      },
    ];
    setSavedTemplates(newList);
    localStorage.setItem(
      "clypra_saved_templates_list",
      JSON.stringify(newList),
    );

    alert(`Template "${name}" saved successfully!`);
  };

  // Load a saved template
  const handleLoadTemplate = (savedId: string) => {
    try {
      const saved = localStorage.getItem(`clypra_saved_template_${savedId}`);
      if (!saved) {
        alert("Template not found!");
        return;
      }

      const parsed = JSON.parse(saved);
      setTemplate(parsed.template);
      setSelectedLayerId(parsed.selectedLayerId);
      if (parsed.colorOverrides) {
        setColorOverrides(new Map(Object.entries(parsed.colorOverrides)));
      }
      setThumbnailFrame(parsed.thumbnailFrame || 0);
      const maxIn = Math.max(
        ...(parsed.template?.layers || []).map(
          (l: any) => l.animation?.inDuration || 0,
        ),
        0,
      );
      setCurrentTime(
        maxIn > 0
          ? Math.min(maxIn + 0.1, (parsed.template?.duration || 3) / 2)
          : 0,
      );
      setIsPlaying(false);
      setSaveStatus("saved");
      setShowSavedTemplates(false);
    } catch (err) {
      console.error("Failed to load template", err);
      alert("Failed to load template!");
    }
  };

  // Delete a saved template
  const handleDeleteSavedTemplate = (savedId: string) => {
    if (!confirm("Are you sure you want to delete this saved template?"))
      return;

    localStorage.removeItem(`clypra_saved_template_${savedId}`);
    const newList = savedTemplates.filter((t) => t.id !== savedId);
    setSavedTemplates(newList);
    localStorage.setItem(
      "clypra_saved_templates_list",
      JSON.stringify(newList),
    );
  };

  // Start a new template (saves current to session)
  const handleNewTemplate = () => {
    if (
      template &&
      !confirm(
        "Start a new template? Your current work is auto-saved and can be resumed later.",
      )
    ) {
      return;
    }

    setTemplate(null);
    setSelectedLayerId(null);
    setColorOverrides(new Map());
    setIsPlaying(false);
    setCurrentTime(0);
    setSaveStatus("idle");
  };

  // Reset/Clear workspace sandbox
  const handleResetSession = () => {
    if (
      !confirm(
        "Are you sure you want to clear your current progress and reset the sandbox? All unsaved modifications will be permanently lost.",
      )
    ) {
      return;
    }
    localStorage.removeItem("clypra_canvas_studio_session");
    setTemplate(null);
    setSelectedLayerId(null);
    setColorOverrides(new Map());
    setIsPlaying(false);
    setCurrentTime(0);
    setSaveStatus("idle");
  };

  // Preset Selection Trigger
  const handleSelectPreset = (preset: TextTemplate, openPublish = false) => {
    const clone = JSON.parse(JSON.stringify(preset)) as TextTemplate;
    setTemplate(clone);
    setSelectedLayerId(clone.layers[0]?.id || null);
    const maxIn = Math.max(
      ...(clone.layers || []).map((l) => l.animation?.inDuration || 0),
      0,
    );
    setCurrentTime(
      maxIn > 0 ? Math.min(maxIn + 0.1, (clone.duration || 3) / 2) : 0,
    );
    setShowSavedTemplates(false);
    if (openPublish) {
      setTimeout(() => {
        handleOpenPublish();
      }, 150);
    }
  };

  // Create Blank Template Action
  const handleCreateBlank = () => {
    const blank: TextTemplate = {
      id: newTemplateId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-"),
      label: newLabel.trim() || "My Custom Template",
      category: newCategory,
      duration: newDuration,
      canvasWidth: newW,
      canvasHeight: newH,
      layers: [],
    };
    setTemplate(blank);
    setSelectedLayerId(null);
    setCurrentTime(0);
  };

  // Quick insert handler supporting text, text-box, lower-third, pill, shape, image
  const handleQuickInsert = (type: QuickInsertType) => {
    if (!template) return;
    const id = `layer-${Date.now().toString(36)}`;
    const centerX = template.canvasWidth / 2;
    const centerY = template.canvasHeight / 2;

    const baseAnimation: LayerAnimation = {
      in: "none",
      out: "none",
      inDuration: 0,
      outDuration: 0,
      hold: "full",
    };

    let newLayers: TemplateLayer[] = [];

    switch (type) {
      case "title-card": {
        const titleId = `title-${Date.now().toString(36)}`;
        const subId = `sub-${(Date.now() + 1).toString(36)}`;
        const lineId = `line-${(Date.now() + 2).toString(36)}`;
        newLayers = [
          {
            kind: "text",
            id: titleId,
            content: "CINEMATIC TITLE",
            fontFamily: "Outfit",
            fontSize: 96,
            fontWeight: 800,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 500),
            y: Math.round(centerY - 75),
            width: 1000,
            height: "auto",
            role: "primary",
            animation: {
              in: "slide-down",
              out: "fade",
              inDuration: 0.6,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "shape",
            id: lineId,
            shape: "rect",
            fill: "#6366f1",
            x: Math.round(centerX - 80),
            y: Math.round(centerY + 35),
            width: 160,
            height: 4,
            animation: {
              in: "scale-in",
              out: "fade",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: subId,
            content: "A Visual Masterpiece",
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 400,
            color: "#cbd5e1",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 400),
            y: Math.round(centerY + 55),
            width: 800,
            height: "auto",
            role: "secondary",
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.8,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "lower-third": {
        const posX = Math.round(template.canvasWidth * 0.06);
        const posY = Math.round(template.canvasHeight * 0.78);
        const nameId = `name-${Date.now().toString(36)}`;
        const roleId = `role-${(Date.now() + 1).toString(36)}`;
        const barId = `bar-${(Date.now() + 2).toString(36)}`;
        newLayers = [
          {
            kind: "shape",
            id: barId,
            shape: "rect",
            fill: "rgba(9, 9, 15, 0.94)",
            stroke: { color: "#2dd4bf", width: 2 },
            x: posX,
            y: posY,
            width: 520,
            height: 100,
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: nameId,
            content: "SPEAKER NAME",
            fontFamily: "Inter",
            fontSize: 42,
            fontWeight: 700,
            color: "#ffffff",
            align: "left",
            verticalAlign: "middle",
            x: posX + 24,
            y: posY + 14,
            width: "auto",
            height: "auto",
            role: "primary",
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: roleId,
            content: "Product Designer & Director",
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 400,
            color: "#2dd4bf",
            align: "left",
            verticalAlign: "middle",
            x: posX + 24,
            y: posY + 60,
            width: "auto",
            height: "auto",
            role: "secondary",
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.6,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "caption": {
        const capY = Math.round(template.canvasHeight * 0.84);
        newLayers = [
          {
            kind: "text",
            id,
            content: "Accurate styled caption for spoken dialogue.",
            fontFamily: "Inter",
            fontSize: 38,
            fontWeight: 600,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 450),
            y: capY,
            width: 900,
            height: "auto",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backgroundOpacity: 0.85,
            paddingTop: 12,
            paddingRight: 28,
            paddingBottom: 12,
            paddingLeft: 28,
            backgroundRadius: 8,
            role: "primary",
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.2,
              outDuration: 0.2,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "callout": {
        const headerId = `head-${Date.now().toString(36)}`;
        const detailId = `det-${(Date.now() + 1).toString(36)}`;
        const dotId = `dot-${(Date.now() + 2).toString(36)}`;
        newLayers = [
          {
            kind: "shape",
            id: dotId,
            shape: "circle",
            fill: "#38bdf8",
            x: Math.round(centerX - 240),
            y: Math.round(centerY - 20),
            width: 16,
            height: 16,
            animation: {
              in: "scale-pop",
              out: "scale-out",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: headerId,
            content: "KEY FEATURE",
            fontFamily: "Inter",
            fontSize: 34,
            fontWeight: 700,
            color: "#38bdf8",
            align: "left",
            verticalAlign: "middle",
            x: Math.round(centerX - 210),
            y: Math.round(centerY - 32),
            width: "auto",
            height: "auto",
            role: "primary",
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: detailId,
            content: "Next-generation real-time compositing",
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 400,
            color: "#e2e8f0",
            align: "left",
            verticalAlign: "middle",
            x: Math.round(centerX - 210),
            y: Math.round(centerY + 8),
            width: "auto",
            height: "auto",
            role: "secondary",
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.6,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "social": {
        const promptId = `prompt-${Date.now().toString(36)}`;
        const handleId = `handle-${(Date.now() + 1).toString(36)}`;
        newLayers = [
          {
            kind: "text",
            id: promptId,
            content: "FOLLOW FOR UPDATES",
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 600,
            color: "#93c5fd",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 200),
            y: Math.round(centerY - 45),
            width: 400,
            height: "auto",
            role: "secondary",
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: handleId,
            content: "@clypra_official",
            fontFamily: "Outfit",
            fontSize: 40,
            fontWeight: 800,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 200),
            y: Math.round(centerY - 5),
            width: 400,
            height: "auto",
            backgroundColor: "#1877f2",
            backgroundOpacity: 0.95,
            paddingTop: 10,
            paddingRight: 32,
            paddingBottom: 10,
            paddingLeft: 32,
            backgroundRadius: 999,
            role: "primary",
            animation: {
              in: "scale-pop",
              out: "scale-out",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "countdown": {
        const countId = `count-${Date.now().toString(36)}`;
        const labelId = `lbl-${(Date.now() + 1).toString(36)}`;
        newLayers = [
          {
            kind: "text",
            id: countId,
            content: "10",
            fontFamily: "Outfit",
            fontSize: 120,
            fontWeight: 900,
            color: "#f59e0b",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 150),
            y: Math.round(centerY - 80),
            width: 300,
            height: "auto",
            role: "primary",
            animation: {
              in: "scale-pop",
              out: "scale-out",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: labelId,
            content: "SECONDS REMAINING",
            fontFamily: "Inter",
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 200),
            y: Math.round(centerY + 55),
            width: 400,
            height: "auto",
            role: "secondary",
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.6,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "quote": {
        const quoteId = `quote-${Date.now().toString(36)}`;
        const authorId = `auth-${(Date.now() + 1).toString(36)}`;
        newLayers = [
          {
            kind: "text",
            id: quoteId,
            content: "“Design is not just what it looks like and feels like. Design is how it works.”",
            fontFamily: "Playfair Display",
            fontSize: 44,
            fontWeight: 400,
            fontStyle: "italic",
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 480),
            y: Math.round(centerY - 65),
            width: 960,
            height: "auto",
            role: "primary",
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.8,
              outDuration: 0.4,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: authorId,
            content: "— STEVE JOBS",
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 600,
            color: "#94a3b8",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 300),
            y: Math.round(centerY + 65),
            width: 600,
            height: "auto",
            role: "secondary",
            animation: {
              in: "slide-up",
              out: "fade",
              inDuration: 0.6,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "news": {
        const badgeId = `badge-${Date.now().toString(36)}`;
        const headId = `newshead-${(Date.now() + 1).toString(36)}`;
        const posX = Math.round(template.canvasWidth * 0.05);
        const posY = Math.round(template.canvasHeight * 0.78);
        newLayers = [
          {
            kind: "text",
            id: badgeId,
            content: "BREAKING NEWS",
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 800,
            color: "#ffffff",
            align: "left",
            verticalAlign: "middle",
            x: posX,
            y: posY,
            width: "auto",
            height: "auto",
            backgroundColor: "#dc2626",
            backgroundOpacity: 0.95,
            paddingTop: 8,
            paddingRight: 20,
            paddingBottom: 8,
            paddingLeft: 20,
            backgroundRadius: 4,
            role: "accent",
            animation: {
              in: "scale-pop",
              out: "fade",
              inDuration: 0.3,
              outDuration: 0.2,
              hold: "full",
            },
          },
          {
            kind: "text",
            id: headId,
            content: "MAJOR DISCOVERY ANNOUNCED LIVE ON STAGE",
            fontFamily: "Inter",
            fontSize: 48,
            fontWeight: 800,
            color: "#ffffff",
            align: "left",
            verticalAlign: "middle",
            x: posX,
            y: posY + 45,
            width: "auto",
            height: "auto",
            backgroundColor: "rgba(10, 10, 16, 0.95)",
            backgroundOpacity: 0.95,
            paddingTop: 12,
            paddingRight: 32,
            paddingBottom: 12,
            paddingLeft: 32,
            backgroundRadius: 4,
            backgroundBorderColor: "#dc2626",
            backgroundBorderWidth: 2,
            role: "primary",
            animation: {
              in: "slide-right",
              out: "fade",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "text": {
        const width = 800;
        newLayers = [
          {
            kind: "text",
            id,
            content: "HEADLINE TITLE",
            fontFamily: "Outfit",
            fontSize: 84,
            fontWeight: 800,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: centerX - width / 2,
            y: centerY - 50,
            width,
            height: "auto",
            animation: baseAnimation,
          },
        ];
        break;
      }
      case "text-box": {
        newLayers = [
          {
            kind: "text",
            id,
            content: "Featured Badge",
            fontFamily: "Inter",
            fontSize: 38,
            fontWeight: 600,
            color: "#ffffff",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 180),
            y: Math.round(centerY - 40),
            width: "auto",
            height: "auto",
            backgroundColor: "#12121c",
            backgroundOpacity: 0.88,
            paddingTop: 14,
            paddingRight: 28,
            paddingBottom: 14,
            paddingLeft: 28,
            backgroundRadius: 12,
            backgroundBorderColor: "#2A2A3E",
            backgroundBorderWidth: 1,
            animation: {
              in: "slide-up",
              out: "fade",
              inDuration: 0.5,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "pill": {
        newLayers = [
          {
            kind: "text",
            id,
            content: "STATUS TAG",
            fontFamily: "Inter",
            fontSize: 26,
            fontWeight: 700,
            color: "#2dd4bf",
            align: "center",
            verticalAlign: "middle",
            x: Math.round(centerX - 110),
            y: Math.round(centerY - 25),
            width: "auto",
            height: "auto",
            backgroundColor: "#052e2b",
            backgroundOpacity: 0.92,
            paddingTop: 8,
            paddingRight: 22,
            paddingBottom: 8,
            paddingLeft: 22,
            backgroundRadius: 999,
            backgroundBorderColor: "#14b8a6",
            backgroundBorderWidth: 1,
            animation: {
              in: "scale-pop",
              out: "scale-out",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
      case "shape": {
        const width = 400;
        const height = 200;
        newLayers = [
          {
            kind: "shape",
            id,
            shape: "rect",
            fill: "#7c6fff",
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
            animation: baseAnimation,
          },
        ];
        break;
      }
      case "image": {
        const width = 400;
        const height = 300;
        newLayers = [
          {
            kind: "image",
            id,
            url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
            animation: baseAnimation,
          },
        ];
        break;
      }
      case "container": {
        newLayers = [
          {
            kind: "container",
            id,
            name: "Flex Container",
            layout: {
              type: "flex",
              direction: "column",
              gap: 16,
              alignItems: "start",
              justifyContent: "start",
              paddingTop: 20,
              paddingRight: 24,
              paddingBottom: 20,
              paddingLeft: 24,
            },
            x: Math.round(centerX - 300),
            y: Math.round(centerY - 150),
            width: "auto",
            height: "auto",
            backgroundColor: "#0d0d15",
            backgroundOpacity: 0.92,
            backgroundRadius: 14,
            backgroundBorderColor: "#6366f1",
            backgroundBorderWidth: 1.5,
            animation: {
              in: "fade",
              out: "fade",
              inDuration: 0.4,
              outDuration: 0.3,
              hold: "full",
            },
          },
        ];
        break;
      }
    }

    if (newLayers.length === 0) return;

    pushHistorySnapshot(template);
    setTemplate({
      ...template,
      layers: [...template.layers, ...newLayers],
    });
    setSelectedLayerId(newLayers[0].id);
    toast.success(`Added ${type.replace("-", " ")} layer`, { duration: 1200 });
  };

  // Add layer handler fallback
  const handleAddLayer = (kind: "text" | "shape" | "image") => {
    handleQuickInsert(
      kind === "text" ? "text" : kind === "shape" ? "shape" : "image",
    );
  };

  // Duplicate layer
  const handleDuplicateLayer = (layerId: string) => {
    if (!template) return;
    const target = template.layers.find((l) => l.id === layerId);
    if (!target) return;
    const clone = JSON.parse(JSON.stringify(target)) as TemplateLayer;
    const newId = `layer-${Date.now().toString(36)}`;
    clone.id = newId;
    if (typeof clone.x === "number") clone.x += 24;
    if (typeof clone.y === "number") clone.y += 24;
    if (clone.kind === "text") clone.content = `${clone.content} (Copy)`;

    pushHistorySnapshot(template);
    setTemplate({
      ...template,
      layers: [...template.layers, clone],
    });
    setSelectedLayerId(newId);
    toast.success("Layer duplicated", { duration: 1200 });
  };

  // Apply 1-click Box Style Preset
  const handleApplyBoxPreset = (preset: BoxStylePreset) => {
    if (!selectedLayerId) return;
    if (!preset.panel) {
      handleUpdateMultipleLayerProperties({
        backgroundColor: "",
        backgroundOpacity: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        backgroundRadius: 0,
        backgroundBorderWidth: 0,
        backgroundBorderColor: "",
      });
      toast.success("Box background removed", { duration: 1000 });
      return;
    }
    handleUpdateMultipleLayerProperties({
      backgroundColor: preset.panel.backgroundColor,
      backgroundOpacity: preset.panel.backgroundOpacity,
      paddingTop: preset.panel.paddingTop,
      paddingRight: preset.panel.paddingRight,
      paddingBottom: preset.panel.paddingBottom,
      paddingLeft: preset.panel.paddingLeft,
      backgroundRadius: preset.panel.borderRadius,
      backgroundBorderColor: preset.panel.backgroundBorderColor || "",
      backgroundBorderWidth: preset.panel.backgroundBorderWidth || 0,
      width: "auto",
      height: "auto",
    });
    toast.success(`Applied ${preset.name} box style`, { duration: 1000 });
  };

  // Remove Layer
  const handleDeleteLayer = (id: string) => {
    if (!template) return;
    pushHistorySnapshot(template);
    setTemplate({
      ...template,
      layers: template.layers.filter((l) => l.id !== id),
    });
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Layer Visibility/Lock toggles
  const toggleVisibility = (id: string) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      pushHistorySnapshot(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === id
            ? { ...l, visible: l.visible === false ? true : false }
            : l,
        ),
      };
    });
  };

  const toggleLock = (id: string) => {
    const updated = new Set(lockedLayers);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setLockedLayers(updated);
  };

  // Reorder layers (step up/down, top/bottom)
  const handleMoveLayerStack = (
    idx: number,
    action: "up" | "down" | "top" | "bottom",
  ) => {
    if (!template) return;
    const layers = [...template.layers];
    const layer = layers[idx];
    if (!layer) return;

    if (action === "top" && idx < layers.length - 1) {
      layers.splice(idx, 1);
      layers.push(layer);
      toast.success("Brought to front", { duration: 800 });
    } else if (action === "bottom" && idx > 0) {
      layers.splice(idx, 1);
      layers.unshift(layer);
      toast.success("Sent to back", { duration: 800 });
    } else if (action === "up" && idx < layers.length - 1) {
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
    } else if (action === "down" && idx > 0) {
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
    }
    pushHistorySnapshot(template);
    setTemplate({ ...template, layers });
  };

  // Legacy reorder layers (bottom to top list reordering)
  const handleMoveLayer = (idx: number, dir: "up" | "down") => {
    handleMoveLayerStack(idx, dir);
  };

  // Update selected layer property
  const handleUpdateLayerProperty = (property: string, value: any) => {
    if (!selectedLayerId) return;
    setTemplate((prev) => {
      if (!prev) return prev;
      pushHistorySnapshot(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) => {
          if (l.id !== selectedLayerId) return l;
          if (property.includes(".")) {
            const [parent, child] = property.split(".");
            return {
              ...l,
              [parent]: {
                ...(l as any)[parent],
                [child]: value,
              },
            };
          }
          return {
            ...l,
            [property]: value,
          };
        }),
      };
    });
  };

  // Apply multiple flat property updates in a single setTemplate call to avoid
  // stale-closure overwrites when setting several fields at once (e.g. padding sides).
  const handleUpdateMultipleLayerProperties = (
    updates: Record<string, any>,
  ) => {
    if (!selectedLayerId) return;
    setTemplate((prev) => {
      if (!prev) return prev;
      pushHistorySnapshot(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) => {
          if (l.id !== selectedLayerId) return l;
          return { ...l, ...updates };
        }),
      };
    });
  };

  // Apply a motion catalog preset animation to ALL layers in the template
  const handleApplyMotionToAllLayers = (preset: MotionCatalogPreset) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      pushHistorySnapshot(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) => ({
          ...l,
          animation: { ...preset.animation },
        })),
      };
    });
    toast.success(`"${preset.name}" applied to all layers`, {
      id: "motion-all",
      duration: 2000,
    });
  };

  // Apply a motion catalog preset animation to the selected layer only
  const handleApplyMotionToLayer = (preset: MotionCatalogPreset) => {
    handleUpdateMultipleLayerProperties({ animation: { ...preset.animation } });
    toast.success(`"${preset.name}" applied to layer`, {
      id: "motion-layer",
      duration: 1800,
    });
  };

  // --- Container assignment ---

  // Assign a layer to a container (or remove from container when containerId is null)
  const handleMoveLayerToContainer = (
    layerId: string,
    containerId: string | null,
  ) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      pushHistorySnapshot(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) =>
          l.id === layerId ? { ...l, parentId: containerId ?? undefined } : l,
        ),
      };
    });
    if (containerId) {
      const containerName = template?.layers.find(
        (l) => l.id === containerId && l.kind === "container",
      ) as any;
      toast.success(
        `Layer moved into "${containerName?.name || "container"}"`,
        { id: "layer-move", duration: 1800 },
      );
    } else {
      toast.success("Layer ejected from container", {
        id: "layer-eject",
        duration: 1500,
      });
    }
  };

  // Drag-to-container state
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [dropTargetContainerId, setDropTargetContainerId] = useState<
    string | null
  >(null);
  const [collapsedContainers, setCollapsedContainers] = useState<Set<string>>(
    new Set(),
  );

  const toggleContainerCollapse = (containerId: string) => {
    setCollapsedContainers((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) next.delete(containerId);
      else next.add(containerId);
      return next;
    });
  };

  // Get keyframes for a property
  const getPropertyKeyframes = (
    property: string,
  ): TemplateKeyframe<any>[] | null => {
    if (!selectedLayer) return null;
    const value = (selectedLayer as any)[property];
    if (isKeyframed(value)) {
      return value.keyframes;
    }
    return null;
  };

  // Add keyframe at current time
  const handleAddKeyframe = (
    property: string,
    easing: TemplateEasingFunction = "ease-in-out",
  ) => {
    if (!template || !selectedLayerId || !selectedLayer) return;

    const currentValue = (selectedLayer as any)[property];
    const defaultVal =
      property === "opacity" || property === "backgroundOpacity" ? 1 : 0;
    const initialOrCurrent = isKeyframed(currentValue)
      ? evaluateAnimatable(currentValue, currentTime, template.duration)
      : (currentValue ?? defaultVal);

    const newKeyframedValue = addKeyframe(
      currentValue,
      currentTime,
      initialOrCurrent,
      easing,
    );

    handleUpdateLayerProperty(property, newKeyframedValue);
  };

  // Remove keyframe at specific time
  const handleRemoveKeyframe = (property: string, time: number) => {
    if (!template || !selectedLayerId || !selectedLayer) return;

    const currentValue = (selectedLayer as any)[property];
    if (!isKeyframed(currentValue)) return;

    try {
      const newValue = removeTemplateKeyframe(currentValue, time);
      handleUpdateLayerProperty(property, newValue);
    } catch (e) {
      console.error("Cannot remove keyframe:", e);
    }
  };

  // Update keyframe value
  const handleUpdateKeyframe = (
    property: string,
    time: number,
    newValue: any,
    easing?: TemplateEasingFunction,
  ) => {
    if (!template || !selectedLayerId || !selectedLayer) return;

    const currentValue = (selectedLayer as any)[property];
    if (!isKeyframed(currentValue)) return;

    const keyframes = currentValue.keyframes.map(
      (kf: TemplateKeyframe<any>) => {
        if (Math.abs(kf.time - time) < 0.01) {
          return { ...kf, value: newValue, easing: easing ?? kf.easing };
        }
        return kf;
      },
    );

    handleUpdateLayerProperty(property, { keyframes });
  };

  const handleUpdateKeyframeBezier = (
    property: string,
    time: number,
    bezier: BezierControlPoints,
  ) => {
    if (!template || !selectedLayerId || !selectedLayer) return;
    const currentValue = (selectedLayer as any)[property];
    if (!isKeyframed(currentValue)) return;
    const keyframes = currentValue.keyframes.map(
      (kf: TemplateKeyframe<any>) => {
        if (Math.abs(kf.time - time) < 0.01) {
          return {
            ...kf,
            easing: "cubic-bezier" as TemplateEasingFunction,
            bezier,
          };
        }
        return kf;
      },
    );
    handleUpdateLayerProperty(property, { keyframes });
  };

  const handleAspectRatioChange = (ratio: "16:9" | "9:16" | "1:1" | "4:5") => {
    setAspectRatio(ratio);
    const dimensions = {
      "16:9": { width: 1920, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
      "1:1": { width: 1080, height: 1080 },
      "4:5": { width: 1080, height: 1350 },
    }[ratio];

    setTemplate((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        canvasWidth: dimensions.width,
        canvasHeight: dimensions.height,
        aspectRatio: ratio,
      };
    });
  };

  const handleInsertVariableToken = (varToken: string) => {
    if (!selectedLayer || selectedLayer.kind !== "text") {
      toast.info("Select a text layer first to insert variable");
      return;
    }
    const currentContent = (selectedLayer as TemplateTextLayer).content || "";
    handleUpdateLayerProperty(
      "content",
      `${currentContent} ${varToken}`.trim(),
    );
    toast.success(`Inserted ${varToken}`);
  };

  interface CropRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  }

  const getCanvasCropRect = (
    canvas: HTMLCanvasElement,
    padding = 15,
  ): CropRect | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

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

    if (!hasPixels) return null;

    // Add padding
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Export static high-res thumbnail frame
  const captureThumbnail = async (crop = true): Promise<string> => {
    if (!template) return "";
    const offscreen = document.createElement("canvas");
    offscreen.width = template.canvasWidth;
    offscreen.height = template.canvasHeight;
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return "";

    const artifact = canonicalArtifactFromTemplate(template);
    const frame = await renderTextTemplateFrame({
      artifact,
      legacyTemplate: template,
      time: thumbnailFrame / artifact.timing.fps,
      customization: {
        layerColors: Object.fromEntries(colorOverrides),
      },
    });
    const bitmap = await createImageBitmap(frame.image);
    oCtx.drawImage(bitmap, 0, 0, offscreen.width, offscreen.height);
    bitmap.close();

    if (crop) {
      // Crop the exact native-composited pixels that will be delivered to the
      // editor/export path. This prevents thumbnails from using a second,
      // legacy-only geometry implementation.
      const rect = getCanvasCropRect(offscreen);
      if (rect) {
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = rect.width;
        croppedCanvas.height = rect.height;
        const croppedCtx = croppedCanvas.getContext("2d");
        if (croppedCtx) {
          croppedCtx.drawImage(
            offscreen,
            rect.minX,
            rect.minY,
            rect.width,
            rect.height,
            0,
            0,
            rect.width,
            rect.height,
          );
          return croppedCanvas.toDataURL("image/png");
        }
      }
    }

    return offscreen.toDataURL("image/png");
  };

  // Generate preview video with proper frame timing
  const generatePreviewVideo = async (): Promise<string> => {
    if (!template) return "";

    const artifact = canonicalArtifactFromTemplate(template);
    const fps = artifact.timing.fps;
    const totalFrames = Math.ceil(artifact.timing.duration * fps);

    // Render the middle frame through the same native pipeline used by the
    // interactive preview to determine the crop rectangle.
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = template.canvasWidth;
    renderCanvas.height = template.canvasHeight;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) return "";

    const midFrame = await renderTextTemplateFrame({
      artifact,
      legacyTemplate: template,
      time: artifact.timing.duration / 2,
      customization: {
        layerColors: Object.fromEntries(colorOverrides),
      },
    });
    const midBitmap = await createImageBitmap(midFrame.image);
    renderCtx.drawImage(
      midBitmap,
      0,
      0,
      renderCanvas.width,
      renderCanvas.height,
    );
    midBitmap.close();
    const cropRect = getCanvasCropRect(renderCanvas);

    // Create the recording canvas (cropped to cropRect if found, otherwise full size)
    const canvas = document.createElement("canvas");
    const width = cropRect ? cropRect.width : template.canvasWidth;
    const height = cropRect ? cropRect.height : template.canvasHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Check requestFrame support
    const tempStream = canvas.captureStream(0);
    const tempTrack = tempStream.getVideoTracks()[0] as any;
    const hasRequestFrame =
      tempTrack && typeof tempTrack.requestFrame === "function";
    tempStream.getTracks().forEach((t) => t.stop());

    // Create MediaRecorder stream
    const stream = canvas.captureStream(hasRequestFrame ? 0 : fps);
    const videoTrack = stream.getVideoTracks()[0] as any;
    const chunks: Blob[] = [];

    const mimeType = getSupportedWebMMimeType() || "video/webm";
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const baseMime = mimeType.split(";")[0] ?? "video/webm";
        const blob = new Blob(chunks, { type: baseMime });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();

      let currentFrame = 0;
      const startTime = performance.now();

      const tick = async () => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const now = performance.now();
        const expectedTime = startTime + (currentFrame * 1000) / fps;

        if (now >= expectedTime) {
          // Use precise timing based on frame number to avoid drift
          const time = currentFrame / fps;

          const frame = await renderTextTemplateFrame({
            artifact,
            legacyTemplate: template,
            time,
            customization: {
              layerColors: Object.fromEntries(colorOverrides),
            },
          });
          const bitmap = await createImageBitmap(frame.image);
          renderCtx.clearRect(
            0,
            0,
            template.canvasWidth,
            template.canvasHeight,
          );
          renderCtx.drawImage(
            bitmap,
            0,
            0,
            template.canvasWidth,
            template.canvasHeight,
          );
          bitmap.close();

          // Copy cropped region to recording canvas
          ctx.clearRect(0, 0, width, height);
          if (cropRect) {
            ctx.drawImage(
              renderCanvas,
              cropRect.minX,
              cropRect.minY,
              cropRect.width,
              cropRect.height,
              0,
              0,
              cropRect.width,
              cropRect.height,
            );
          } else {
            ctx.drawImage(renderCanvas, 0, 0);
          }

          if (
            hasRequestFrame &&
            typeof videoTrack.requestFrame === "function"
          ) {
            videoTrack.requestFrame();
          }

          currentFrame++;
        }

        if (currentFrame < totalFrames) {
          requestAnimationFrame(() => {
            void tick();
          });
        } else {
          mediaRecorder.stop();
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      requestAnimationFrame(() => {
        void tick();
      });
    });
  };

  const handleOpenPublish = async () => {
    if (!template) return;
    try {
      setPublishDescription(
        template.description || `Canvas-based template: ${template.label}`,
      );
      setPublishTagsInput(template.tags?.join(", ") || template.category || "");
      setPublishPlacement("center");
      setPublishVideoDataUrl(null);
      setPublishCreatorName(template.creatorName || "");
      setPublishCreatorLink(template.creatorLink || "");

      const url = await captureThumbnail();
      setThumbnailDataUrl(url);
      setShowPublishModal(true);

      // Asynchronously record and generate preview video in the background
      setIsGeneratingPublishVideo(true);
      generatePreviewVideo()
        .then((videoUrl) => {
          setPublishVideoDataUrl(videoUrl);
          setIsGeneratingPublishVideo(false);
        })
        .catch((err) => {
          console.error("Failed to generate background preview video", err);
          setIsGeneratingPublishVideo(false);
        });
    } catch (e) {
      console.error("Failed to generate preview thumbnail", e);
    }
  };

  // Automatically regenerate thumbnail preview when thumbnailFrame changes while modal is open
  useEffect(() => {
    if (showPublishModal && template) {
      captureThumbnail()
        .then((url) => {
          setThumbnailDataUrl(url);
        })
        .catch((err) => {
          console.error("Failed to auto-update thumbnail preview", err);
        });
    }
  }, [thumbnailFrame, showPublishModal]);

  const handleGeneratePreview = async () => {
    if (!template || isGeneratingPreview) return;

    setIsGeneratingPreview(true);
    try {
      const videoDataUrl = await generatePreviewVideo();

      // Convert data URL to blob URL for video playback
      const response = await fetch(videoDataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Revoke previous URL if exists
      if (previewVideoUrl) {
        URL.revokeObjectURL(previewVideoUrl);
      }

      setPreviewVideoUrl(blobUrl);
    } catch (e) {
      console.error("Failed to generate preview video", e);
      alert("Failed to generate preview video. Check console for details.");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handlePublish = async () => {
    if (!template) return;
    setPublishStatus("publishing");
    setPublishPrUrl(null);
    setPublishMessage("Preparing preview and files…");

    try {
      // Use cached thumbnail or generate
      const thumbnailUrl = thumbnailDataUrl || (await captureThumbnail());

      // Use pre-recorded video or record now
      let videoUrl = publishVideoDataUrl;
      if (!videoUrl) {
        setPublishMessage("Recording preview animation…");
        videoUrl = await generatePreviewVideo();
      }

      setPublishMessage("Uploading files to clypra-api…");

      const token = localStorage.getItem("clypra_auth_token");
      if (!token)
        throw new Error("Your session has expired. Please sign in again.");
      const legacyPayload = {
        ...buildCanonicalTemplatePayload(template),
        description: publishDescription,
        tags: publishTagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        creatorName: publishCreatorName,
        creatorLink: publishCreatorLink,
      };
      const artifact = canonicalArtifactFromTemplate(legacyPayload as any);
      artifact.metadata = {
        ...artifact.metadata,
        description: publishDescription,
        tags: publishTagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        creatorName: publishCreatorName,
        creatorLink: publishCreatorLink,
      };
      const idempotencyKey = `template-submit:${template.id}:${Date.now()}`;
      const response = await fetch(
        `${getStudioApiBaseUrl()}/text-templates/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Clypra-Client": "studio-text-template",
          },
          body: JSON.stringify({
            artifact,
            thumbnailDataUrl: thumbnailUrl,
            previewDataUrl: videoUrl,
            idempotencyKey,
          }),
        },
      );

      if (!response.ok) {
        let errorMsg = `Upload failed (${response.status} ${response.statusText})`;
        try {
          const rawText = await response.text();
          try {
            const errorData = JSON.parse(rawText);
            errorMsg = errorData.message || errorData.error || errorMsg;
          } catch {
            if (response.status === 404) {
              errorMsg =
                "API endpoint /text-templates/submissions is not deployed on the remote worker yet. Please deploy clypra-api via wrangler deploy.";
            } else if (
              rawText &&
              rawText.trim().length > 0 &&
              rawText.length < 200
            ) {
              errorMsg = `Server error (${response.status}): ${rawText.trim()}`;
            }
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      let finalStatus: "submitted" | "published" =
        result.status === "pending-review" ? "submitted" : "published";
      if (isAdmin && publishApproved && result.template?.revisionId) {
        const approvalResponse = await fetch(
          `${getStudioApiBaseUrl()}/text-templates/${encodeURIComponent(template.category)}/${encodeURIComponent(template.id)}/revisions/${encodeURIComponent(result.template.revisionId)}/approve`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Clypra-Client": "studio-text-template",
            },
          },
        );
        if (!approvalResponse.ok)
          throw new Error("Revision submitted, but admin approval failed");
        finalStatus = "published";
      }
      setPublishStatus(finalStatus);
      const templateUrl = `${getStudioApiBaseUrl()}/text-templates/${encodeURIComponent(
        template.category,
      )}/${encodeURIComponent(template.id)}`;
      setPublishPrUrl(templateUrl);
      setPublishMessage(
        `${result.message || (result.status === "pending-review" ? "Template submitted for approval" : "Template submitted successfully")}`,
      );

      // Clean persisted drafts upon successful submission/publishing
      try {
        localStorage.removeItem("clypra_publish_metadata_draft");
        localStorage.removeItem("clypra_canvas_studio_session");
      } catch {}
      setPublishDescription("");
      setPublishTagsInput("");
      setPublishCreatorName("");
      setPublishCreatorLink("");
      setThumbnailDataUrl(null);
      setPublishVideoDataUrl(null);
      toast.success(
        finalStatus === "published"
          ? "Template published live and draft cleaned!"
          : "Template submitted for review and draft cleaned!",
      );
    } catch (error) {
      setPublishStatus("failed");
      setPublishMessage(
        error instanceof Error ? error.message : "Publishing failed",
      );
    }
  };

  const handleExportJson = () => {
    if (!template) return;
    try {
      const jsonStr = JSON.stringify(template, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${template.id || "template"}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Template JSON exported successfully!");
    } catch (e) {
      console.error("Failed to export JSON", e);
      toast.error("Failed to export template JSON");
    }
  };

  const handleDownloadThumbnail = async () => {
    if (!template) return;
    try {
      const url = await captureThumbnail(true);
      if (!url) return;
      const link = document.createElement("a");
      link.download = `${template.id || "template"}-thumbnail.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error("Failed to download thumbnail", e);
      alert("Failed to download thumbnail.");
    }
  };

  // Active layer properties
  const selectedLayer = template?.layers.find(
    (l) => l.id === selectedLayerId,
  ) as any;
  const templateFps = Number((template as any)?.fps ?? 30);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#09090D] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-[#2A2A38] bg-[#121219] px-6 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDesign}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A38] hover:bg-[#2A2A38] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <Link
            to="/studio"
            aria-label="Back to Clypra Studio"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A38] hover:bg-[#2A2A38] transition-colors"
          >
            <ClypraLogo size={23} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">
              Template Studio
            </h1>
          </div>
          {template && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#2A2A38] bg-[#1A1A26] text-teal-300">
              {template.category}
            </span>
          )}
          {/* Native GPU Indicator Badge matching Text Effects */}
          <span
            className={`studio-gpu-pill hidden sm:inline-flex ${
              nativeGpuState === "ready"
                ? "ready"
                : nativeGpuState === "error"
                  ? "error"
                  : "live"
            }`}
            title={
              nativeGpuInfo?.adapterName
                ? `Clypra Native Engine · ${nativeGpuInfo.adapterName} (${nativeGpuInfo.backend || "WebGPU"})`
                : "Clypra Native GPU Compositor Active"
            }
          >
            <span className="studio-gpu-pill-dot" />
            {nativeGpuState === "ready"
              ? "GPU · Ready"
              : nativeGpuState === "error"
                ? "GPU · Fallback"
                : "GPU · Live"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="text-[11px] text-[#888899] flex items-center gap-1.5 font-medium">
              <Loader2 size={12} className="animate-spin text-teal-400" />{" "}
              Auto-saving...
            </span>
          )}

          {/* Professional Undo / Redo controls */}
          <div className="flex items-center bg-[#181824] border border-[#2A2A38] rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              title={`Undo (⌘Z / Ctrl+Z)${historyPast.length > 0 ? ` · ${historyPast.length} available` : ""}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#888899] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Undo2 size={13} />
              <span className="text-[10px] font-medium hidden sm:inline">
                Undo
              </span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              title={`Redo (⌘⇧Z / Ctrl+Y)${historyFuture.length > 0 ? ` · ${historyFuture.length} available` : ""}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#888899] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Redo2 size={13} />
              <span className="text-[10px] font-medium hidden sm:inline">
                Redo
              </span>
            </button>
          </div>

          {template && (
            <>
              {/* File dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFileMenu((v) => !v)}
                  className="rounded-lg border border-[#2A2A38] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#2A2A38] transition-all flex items-center gap-1.5"
                >
                  <Copy size={13} /> File{" "}
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${showFileMenu ? "rotate-180" : ""}`}
                  />
                </button>
                {showFileMenu && (
                  <>
                    {/* click-outside overlay */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFileMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[180px] rounded-xl border border-[#2A2A38] bg-[#121219] shadow-2xl overflow-hidden py-1">
                      <button
                        onClick={() => {
                          handleSaveTemplate();
                          setShowFileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#CCCCD6] hover:bg-[#2A2A38] hover:text-white transition-colors"
                      >
                        <Copy size={13} className="shrink-0" /> Save Template
                      </button>
                      <button
                        onClick={() => {
                          handleExportJson();
                          setShowFileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#CCCCD6] hover:bg-[#2A2A38] hover:text-white transition-colors"
                      >
                        <FileJson
                          size={13}
                          className="text-teal-400 shrink-0"
                        />{" "}
                        Export JSON
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadThumbnail();
                          setShowFileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#CCCCD6] hover:bg-[#2A2A38] hover:text-white transition-colors"
                      >
                        <Download size={13} className="shrink-0" /> Download PNG
                      </button>
                      <div className="my-1 border-t border-[#2A2A38]" />
                      <button
                        onClick={() => {
                          setShowSavedTemplates(true);
                          setShowFileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#CCCCD6] hover:bg-[#2A2A38] hover:text-white transition-colors"
                      >
                        <FolderPlus size={13} className="shrink-0" /> Load (
                        {savedTemplates.length})
                      </button>
                      <button
                        onClick={() => {
                          handleNewTemplate();
                          setShowFileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#CCCCD6] hover:bg-[#2A2A38] hover:text-white transition-colors"
                      >
                        <Plus size={13} className="shrink-0" /> New Template
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setLoadTab("presets");
                  setShowSavedTemplates(true);
                }}
                className="rounded-lg border border-teal-500/40 hover:bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-400 flex items-center gap-1.5 transition-colors"
                title="Browse & publish builtin presets"
              >
                <Sparkles size={14} /> Presets ({BUILTIN_CANVAS_TEMPLATES.length})
              </button>

              <button
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview}
                className="rounded-lg border border-purple-500 hover:bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPreview ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Play size={14} /> Preview Video
                  </>
                )}
              </button>
              <button
                onClick={handleOpenPublish}
                className="rounded-lg bg-teal-500 hover:bg-teal-400 px-4 py-1.5 text-xs font-bold text-black shadow-lg shadow-teal-500/10 flex items-center gap-1.5 transition-colors"
              >
                <UploadCloud size={14} /> Publish Template
              </button>
            </>
          )}
        </div>
      </header>

      {/* Templates & Presets Library Modal */}
      {showSavedTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-teal-400" />
                Templates & Presets Library
              </h3>
              <button
                onClick={() => setShowSavedTemplates(false)}
                className="rounded-lg p-1.5 hover:bg-[#2A2A38] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b border-[#2A2A38] bg-[#15151C] mb-4 rounded-t-lg overflow-hidden shrink-0">
              <button
                onClick={() => setLoadTab("presets")}
                className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  loadTab === "presets"
                    ? "text-teal-300 bg-[#0E0E14] border-b-2 border-teal-500"
                    : "text-[#888899] hover:text-white"
                }`}
              >
                <Sparkles size={13} />
                Builtin Presets ({BUILTIN_CANVAS_TEMPLATES.length})
              </button>
              <button
                onClick={() => setLoadTab("local")}
                className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                  loadTab === "local"
                    ? "text-teal-300 bg-[#0E0E14] border-b-2 border-teal-500"
                    : "text-[#888899] hover:text-white"
                }`}
              >
                Local Saved ({savedTemplates.length})
              </button>
              {isAdmin && (
                <button
                  onClick={() => setLoadTab("api")}
                  className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                    loadTab === "api"
                      ? "text-teal-300 bg-[#0E0E14] border-b-2 border-teal-500"
                      : "text-[#888899] hover:text-white"
                  }`}
                >
                  API Templates ({apiTemplates.length})
                </button>
              )}
            </div>

            {loadTab === "presets" ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Category filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 shrink-0 scrollbar-thin">
                  <button
                    onClick={() => setPresetCategoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      presetCategoryFilter === "all"
                        ? "bg-teal-500 text-black shadow-sm"
                        : "bg-[#171722] text-[#888899] hover:text-white hover:bg-[#1E1E2C]"
                    }`}
                  >
                    All ({BUILTIN_CANVAS_TEMPLATES.length})
                  </button>
                  {CATEGORIES.map((cat) => {
                    const count = BUILTIN_CANVAS_TEMPLATES.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setPresetCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                          presetCategoryFilter === cat
                            ? "bg-teal-500 text-black shadow-sm"
                            : "bg-[#171722] text-[#888899] hover:text-white hover:bg-[#1E1E2C]"
                        }`}
                      >
                        {cat.replace("-", " ")} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {BUILTIN_CANVAS_TEMPLATES.filter(
                    (p) => presetCategoryFilter === "all" || p.category === presetCategoryFilter,
                  ).map((preset) => (
                    <div
                      key={preset.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-[#2A2A38] bg-[#0E0E14] hover:border-teal-500/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                            {preset.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30 shrink-0">
                            {preset.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#888899] font-mono mb-3">
                          ID: {preset.id} · {preset.duration}s · {preset.layers.length} layers
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[#1C1C28]">
                        <button
                          onClick={() => handleSelectPreset(preset, false)}
                          className="flex-1 rounded-lg border border-teal-500 hover:bg-teal-500/10 py-1.5 text-xs font-semibold text-teal-400 transition-colors"
                        >
                          Load & Edit
                        </button>
                        <button
                          onClick={() => handleSelectPreset(preset, true)}
                          className="rounded-lg bg-teal-500 hover:bg-teal-400 px-3.5 py-1.5 text-xs font-bold text-black shadow-sm flex items-center gap-1 transition-colors"
                          title="Load this preset and publish directly to API catalog"
                        >
                          <UploadCloud size={13} /> Publish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : loadTab === "local" ? (
              savedTemplates.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-[#888899]">
                    No saved templates yet. Save your current work to access it
                    later.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedTemplates.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#2A2A38] bg-[#09090D] hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {saved.name}
                        </p>
                        <p className="text-[10px] text-[#888899] mt-0.5">
                          Saved {new Date(saved.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleLoadTemplate(saved.id)}
                          className="rounded-lg border border-teal-500 hover:bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedTemplate(saved.id)}
                          className="rounded-lg p-1.5 hover:bg-red-500/10 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : apiTemplatesLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-teal-400" size={20} />
                <p className="text-xs text-[#888899]">
                  Loading templates from API...
                </p>
              </div>
            ) : apiTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-[#888899]">
                  No templates found on API.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {apiTemplates.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2A2A38] bg-[#09090D] hover:border-teal-500/30 transition-all"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {saved.thumbnail && (
                        <img
                          src={saved.thumbnail}
                          className="w-12 aspect-video rounded border border-[#2A2A38] bg-black object-contain"
                          alt=""
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {saved.label || saved.name}
                          </p>
                          {saved.published === false && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                              Unpublished
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#888899] mt-0.5 font-mono">
                          {saved.id} · {saved.category}
                        </p>
                        {saved.creatorName && (
                          <p className="text-[9px] text-teal-400/80 mt-0.5">
                            by{" "}
                            {saved.creatorLink ? (
                              <a
                                href={saved.creatorLink}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline text-teal-300 font-semibold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {saved.creatorName}
                              </a>
                            ) : (
                              <span className="font-semibold">
                                {saved.creatorName}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {saved.published === false && (
                        <button
                          onClick={() =>
                            handlePublishApiTemplateDirectly(
                              saved.category,
                              saved.id,
                            )
                          }
                          disabled={publishingApiTemplateId === saved.id}
                          className="rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-black shadow-lg shadow-teal-500/10 transition-colors"
                        >
                          {publishingApiTemplateId === saved.id
                            ? "Publishing..."
                            : "Publish"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleLoadApiTemplate(saved.category, saved.id)
                        }
                        disabled={isLoadingApiTemplate}
                        className="rounded-lg border border-teal-500 hover:bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 transition-colors disabled:opacity-50"
                      >
                        {isLoadingApiTemplate ? "Loading..." : "Edit"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Sandbox */}
      {!template ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#09090D] overflow-y-auto">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Builtin Preset selector */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-teal-400" size={18} />
                  <h2 className="text-sm font-bold text-white">
                    Start with a Builtin Preset
                  </h2>
                </div>
                <span className="text-xs font-semibold text-teal-400">
                  {BUILTIN_CANVAS_TEMPLATES.length} Presets
                </span>
              </div>
              <p className="text-xs text-[#9A9AAA] leading-relaxed">
                Choose from pre-configured canvas animation templates covering
                all standard categories with balanced multi-textbox font sizing.
              </p>

              {/* Category filter pills in empty state */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setPresetCategoryFilter("all")}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    presetCategoryFilter === "all"
                      ? "bg-teal-500 text-black shadow-sm"
                      : "bg-[#171722] text-[#888899] hover:text-white"
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPresetCategoryFilter(cat)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors capitalize ${
                      presetCategoryFilter === cat
                        ? "bg-teal-500 text-black shadow-sm"
                        : "bg-[#171722] text-[#888899] hover:text-white"
                    }`}
                  >
                    {cat.replace("-", " ")}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-h-[420px] overflow-y-auto pr-1">
                {BUILTIN_CANVAS_TEMPLATES.filter(
                  (p) => presetCategoryFilter === "all" || p.category === presetCategoryFilter,
                ).map((preset) => (
                  <div
                    key={preset.id}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-[#2A2A38] bg-[#171722] hover:border-teal-500/50 hover:bg-[#1C1C2A] text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                          {preset.label}
                        </span>
                        <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 shrink-0">
                          {preset.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#888899] block font-mono mb-2.5">
                        {preset.duration}s · {preset.layers.length} layers
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#262638]">
                      <button
                        onClick={() => handleSelectPreset(preset, false)}
                        className="flex-1 py-1 rounded-lg border border-teal-500/50 hover:bg-teal-500/10 text-[11px] font-semibold text-teal-400 text-center transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleSelectPreset(preset, true)}
                        className="py-1 px-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[11px] font-bold text-black text-center transition-colors flex items-center gap-1"
                        title="Publish to API"
                      >
                        <UploadCloud size={11} /> Publish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Blank slate setup */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderPlus className="text-purple-400" size={18} />
                <h2 className="text-sm font-bold text-white">
                  Create Template from Scratch
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={newTemplateId}
                    onChange={(e) => setNewTemplateId(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => {
                      const label = e.target.value;
                      setNewLabel(label);
                      setNewTemplateId(toKebabCase(label));
                    }}
                    className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value as TemplateCategory)
                      }
                      className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      value={newDuration}
                      onChange={(e) =>
                        setNewDuration(parseFloat(e.target.value) || 3.0)
                      }
                      className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Canvas Width
                    </label>
                    <input
                      type="number"
                      value={newW}
                      onChange={(e) =>
                        setNewW(parseInt(e.target.value) || 1920)
                      }
                      className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Canvas Height
                    </label>
                    <input
                      type="number"
                      value={newH}
                      onChange={(e) =>
                        setNewH(parseInt(e.target.value) || 1080)
                      }
                      className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateBlank}
                className="w-full rounded-xl bg-purple-500 hover:bg-purple-400 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/10 transition-colors mt-2"
              >
                Create Blank Template
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar Left: Layers Panel */}
          <aside className="w-80 border-r border-[#2A2A38] bg-[#121219] flex flex-col shrink-0 min-h-0">
            {/* Header with Quick Insert Toolbar */}
            <div className="p-3 border-b border-[#2A2A38] shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888899] flex items-center gap-1.5">
                  <Layers size={13} className="text-teal-400" /> Layers (
                  {template.layers.length})
                </span>
              </div>
              <QuickInsertToolbar
                onInsert={handleQuickInsert}
                disabled={!template}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {template.layers.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center border border-dashed border-[#2A2A38] rounded-xl text-center p-4 gap-2">
                  <Layers size={22} className="text-[#2A2A38]" />
                  <p className="text-[11px] text-[#888899]">
                    Use the insert bar above to add your first layer.
                  </p>
                </div>
              ) : (
                (() => {
                  const containers = template.layers.filter(
                    (l) => l.kind === "container",
                  );
                  const rootLayers = [...template.layers]
                    .reverse()
                    .filter(
                      (l) =>
                        !l.parentId ||
                        !template.layers.some(
                          (p) => p.id === l.parentId && p.kind === "container",
                        ),
                    );

                  return rootLayers.map((layer) => {
                    const idx = template.layers.findIndex(
                      (l) => l.id === layer.id,
                    );
                    const isSelected = layer.id === selectedLayerId;
                    const isLocked = lockedLayers.has(layer.id);
                    const isHidden = layer.visible === false;
                    const isTop = idx === template.layers.length - 1;
                    const isBottom = idx === 0;
                    const isContainer = layer.kind === "container";

                    if (isContainer) {
                      const containerLayer = layer as TemplateContainerLayer;
                      const children = template.layers.filter(
                        (l) => l.parentId === layer.id,
                      );
                      const isCollapsed = collapsedContainers.has(layer.id);
                      const isDragTarget = dropTargetContainerId === layer.id;
                      const layout = containerLayer.layout || {
                        type: "flex",
                        direction: "column",
                        gap: 0,
                        alignItems: "center",
                      };

                      return (
                        <div
                          key={layer.id}
                          onDragOver={(e) => {
                            if (!dragLayerId || dragLayerId === layer.id)
                              return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDropTargetContainerId(layer.id);
                          }}
                          onDragLeave={() => {
                            if (dropTargetContainerId === layer.id)
                              setDropTargetContainerId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const droppedId =
                              e.dataTransfer.getData("text/plain") ||
                              dragLayerId;
                            if (droppedId && droppedId !== layer.id) {
                              handleMoveLayerToContainer(droppedId, layer.id);
                            }
                            setDragLayerId(null);
                            setDropTargetContainerId(null);
                          }}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isDragTarget
                              ? "bg-indigo-500/15 border-indigo-400 shadow-lg shadow-indigo-500/20"
                              : isSelected
                                ? "bg-indigo-500/10 border-indigo-500/60 shadow-md shadow-indigo-500/10"
                                : "bg-[#141420] border-[#2A2A3E] hover:border-[#3E3E56]"
                          }`}
                        >
                          {/* Container Header Card */}
                          <div
                            onClick={() => setSelectedLayerId(layer.id)}
                            className="flex items-center justify-between p-2.5 cursor-pointer select-none gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Expand / Collapse toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContainerCollapse(layer.id);
                                }}
                                className="p-1 -ml-1 rounded hover:bg-white/10 text-indigo-400 shrink-0 transition-colors"
                              >
                                {isCollapsed ? (
                                  <ChevronRight size={13} />
                                ) : (
                                  <ChevronDown size={13} />
                                )}
                              </button>

                              {/* Container Icon */}
                              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0">
                                <LayoutGrid size={12} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-bold text-white truncate leading-tight">
                                    {(layer as any).name || "Flex Container"}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold shrink-0">
                                    {children.length}{" "}
                                    {children.length === 1 ? "item" : "items"}
                                  </span>
                                </div>
                                <p className="text-[9px] font-mono text-indigo-400/80 uppercase font-semibold whitespace-nowrap truncate mt-0.5">
                                  Flex {layout.direction || "column"} ·{" "}
                                  {Number(layout.gap || 0)}px gap
                                </p>
                              </div>
                            </div>

                            {/* Visibility + Lock + Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVisibility(layer.id);
                                }}
                                title={
                                  isHidden ? "Show container" : "Hide container"
                                }
                                className={`p-1 rounded hover:bg-[#2A2A38] ${
                                  isHidden ? "text-red-400" : "text-[#888899]"
                                }`}
                              >
                                {isHidden ? (
                                  <EyeOff size={11} />
                                ) : (
                                  <Eye size={11} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLock(layer.id);
                                }}
                                title={
                                  isLocked
                                    ? "Unlock container"
                                    : "Lock container"
                                }
                                className={`p-1 rounded hover:bg-[#2A2A38] ${
                                  isLocked ? "text-amber-400" : "text-[#888899]"
                                }`}
                              >
                                {isLocked ? (
                                  <Lock size={11} />
                                ) : (
                                  <Unlock size={11} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateLayer(layer.id);
                                }}
                                title="Duplicate container"
                                className="p-1 rounded hover:bg-[#2A2A38] text-[#888899] hover:text-indigo-400"
                              >
                                <CopyPlus size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLayer(layer.id);
                                }}
                                title="Delete container"
                                className="p-1 rounded hover:bg-red-500/10 text-[#888899] hover:text-red-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Container Stack Reorder (when container selected) */}
                          {isSelected && (
                            <div className="flex items-center gap-0.5 px-3 pb-2 border-b border-indigo-500/20">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerStack(idx, "top");
                                }}
                                disabled={isTop}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-30"
                              >
                                <ChevronsUp size={10} /> Front
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerStack(idx, "up");
                                }}
                                disabled={isTop}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-30"
                              >
                                <ChevronUp size={10} /> Fwd
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerStack(idx, "down");
                                }}
                                disabled={isBottom}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-30"
                              >
                                <ChevronDown size={10} /> Back
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerStack(idx, "bottom");
                                }}
                                disabled={isBottom}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-30"
                              >
                                <ChevronsDown size={10} /> Behind
                              </button>
                            </div>
                          )}

                          {/* Nested Indented Children Tree */}
                          {!isCollapsed && (
                            <div className="p-2 pt-1.5 bg-[#0D0D15]/60 border-t border-[#222232]">
                              <div className="border-l-2 border-indigo-500/30 ml-2 pl-2 space-y-1.5 py-1">
                                {children.length === 0 ? (
                                  <div className="py-2.5 px-2 border border-dashed border-indigo-500/20 rounded-lg text-center">
                                    <p className="text-[10px] text-indigo-300/60 font-semibold">
                                      Empty Container · Drag layers here
                                    </p>
                                  </div>
                                ) : (
                                  children.map((child, childIdx) => {
                                    const childIdxInAll =
                                      template.layers.findIndex(
                                        (l) => l.id === child.id,
                                      );
                                    const isChildSelected =
                                      child.id === selectedLayerId;
                                    const isChildLocked = lockedLayers.has(
                                      child.id,
                                    );
                                    const isChildHidden =
                                      child.visible === false;
                                    const isChildTop =
                                      childIdx === children.length - 1;
                                    const isChildBottom = childIdx === 0;

                                    return (
                                      <div
                                        key={child.id}
                                        draggable
                                        onDragStart={(e) => {
                                          setDragLayerId(child.id);
                                          e.dataTransfer.effectAllowed = "move";
                                          e.dataTransfer.setData(
                                            "text/plain",
                                            child.id,
                                          );
                                        }}
                                        onDragEnd={() => {
                                          setDragLayerId(null);
                                          setDropTargetContainerId(null);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLayerId(child.id);
                                        }}
                                        className={`group flex flex-col rounded-lg border transition-all cursor-pointer ${
                                          isChildSelected
                                            ? "bg-teal-500/15 border-teal-400/70 shadow-sm"
                                            : "bg-[#181826] border-[#2A2A3C] hover:border-[#3E3E56]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between p-2 gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <span
                                              className="text-[#555566] hover:text-white cursor-grab shrink-0"
                                              title="Drag to reorder or move out"
                                            >
                                              <Move size={10} />
                                            </span>
                                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                                              #{childIdx + 1}
                                            </span>
                                            <div className="flex items-center justify-center w-5 h-5 rounded bg-[#222232] text-teal-400 shrink-0">
                                              {child.kind === "text" ? (
                                                (child as any)
                                                  .backgroundColor ? (
                                                  <Box
                                                    size={11}
                                                    className="text-cyan-400"
                                                  />
                                                ) : (
                                                  <Type size={11} />
                                                )
                                              ) : child.kind === "shape" ? (
                                                <Square
                                                  size={11}
                                                  className="text-amber-400"
                                                />
                                              ) : (
                                                <ImageIcon
                                                  size={11}
                                                  className="text-pink-400"
                                                />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-semibold text-white truncate leading-tight">
                                                {child.kind === "text"
                                                  ? child.content || "Text"
                                                  : (child as any).name ||
                                                    child.kind}
                                              </p>
                                              <p className="text-[8px] uppercase tracking-wider text-teal-400/70 font-semibold font-mono whitespace-nowrap truncate mt-0.5">
                                                {child.kind}
                                                {child.kind === "text" &&
                                                (child as any).backgroundColor
                                                  ? " · box"
                                                  : ""}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Child Actions */}
                                          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleVisibility(child.id);
                                              }}
                                              title={
                                                isChildHidden
                                                  ? "Show layer"
                                                  : "Hide layer"
                                              }
                                              className={`p-1 rounded hover:bg-[#2A2A38] ${
                                                isChildHidden
                                                  ? "text-red-400"
                                                  : "text-[#888899]"
                                              }`}
                                            >
                                              {isChildHidden ? (
                                                <EyeOff size={11} />
                                              ) : (
                                                <Eye size={11} />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLock(child.id);
                                              }}
                                              title={
                                                isChildLocked
                                                  ? "Unlock layer"
                                                  : "Lock layer"
                                              }
                                              className={`p-1 rounded hover:bg-[#2A2A38] ${
                                                isChildLocked
                                                  ? "text-amber-400"
                                                  : "text-[#888899]"
                                              }`}
                                            >
                                              {isChildLocked ? (
                                                <Lock size={11} />
                                              ) : (
                                                <Unlock size={11} />
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteLayer(child.id);
                                              }}
                                              title="Delete layer"
                                              className="p-1 rounded hover:bg-red-500/10 text-[#888899] hover:text-red-400"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Stack order if child selected */}
                                        {isChildSelected && (
                                          <div className="flex items-center justify-between px-2.5 py-1 border-t border-[#2A2A3C] bg-black/20">
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMoveLayerStack(
                                                    childIdxInAll,
                                                    "up",
                                                  );
                                                }}
                                                disabled={isChildTop}
                                                title="Move Forward in container"
                                                className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-teal-300 hover:bg-teal-500/20 disabled:opacity-30 flex items-center gap-0.5"
                                              >
                                                <ChevronUp size={9} /> Up
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMoveLayerStack(
                                                    childIdxInAll,
                                                    "down",
                                                  );
                                                }}
                                                disabled={isChildBottom}
                                                title="Move Backward in container"
                                                className="px-1.5 py-0.5 rounded text-[8px] font-semibold text-teal-300 hover:bg-teal-500/20 disabled:opacity-30 flex items-center gap-0.5"
                                              >
                                                <ChevronDown size={9} /> Down
                                              </button>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveLayerToContainer(
                                                  child.id,
                                                  null,
                                                );
                                              }}
                                              title="Eject layer from container to canvas root"
                                              className="px-2 py-0.5 rounded text-[8px] font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all flex items-center gap-1"
                                            >
                                              ⏏ Eject to Root
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Root Standalone Layer (not inside a container)
                    return (
                      <div
                        key={layer.id}
                        draggable
                        onDragStart={(e) => {
                          setDragLayerId(layer.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", layer.id);
                        }}
                        onDragEnd={() => {
                          setDragLayerId(null);
                          setDropTargetContainerId(null);
                        }}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`group flex flex-col rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-500/10 border-teal-500/60 shadow-md shadow-teal-500/10"
                            : "bg-[#181822] border-[#2A2A38] hover:border-[#3E3E52]"
                        }`}
                      >
                        {/* Layer row */}
                        <div className="flex items-center justify-between p-2.5 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[#333344] hover:text-[#666677] cursor-grab active:cursor-grabbing shrink-0"
                              title="Drag into a container"
                            >
                              <Move size={11} />
                            </span>
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#222232] text-teal-400 shrink-0">
                              {layer.kind === "text" ? (
                                (layer as any).backgroundColor ? (
                                  <Box size={13} className="text-cyan-400" />
                                ) : (
                                  <Type size={13} />
                                )
                              ) : layer.kind === "shape" ? (
                                <Square size={13} className="text-amber-400" />
                              ) : (
                                <ImageIcon
                                  size={13}
                                  className="text-pink-400"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-tight">
                                {layer.kind === "text"
                                  ? (layer.content || "Text").substring(0, 22)
                                  : `${layer.kind} (${(layer as any).shape || "layer"})`}
                              </p>
                              <p className="text-[9px] font-semibold tracking-wider uppercase text-teal-400/80 font-mono">
                                {layer.kind}
                                {layer.kind === "text" &&
                                (layer as any).backgroundColor
                                  ? " · box"
                                  : ""}
                              </p>
                            </div>
                          </div>

                          {/* Visibility + Lock + Actions */}
                          <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisibility(layer.id);
                              }}
                              title={isHidden ? "Show layer" : "Hide layer"}
                              className={`p-1 rounded hover:bg-[#2A2A38] ${
                                isHidden ? "text-red-400" : "text-[#888899]"
                              }`}
                            >
                              {isHidden ? (
                                <EyeOff size={11} />
                              ) : (
                                <Eye size={11} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLock(layer.id);
                              }}
                              title={isLocked ? "Unlock layer" : "Lock layer"}
                              className={`p-1 rounded hover:bg-[#2A2A38] ${
                                isLocked ? "text-amber-400" : "text-[#888899]"
                              }`}
                            >
                              {isLocked ? (
                                <Lock size={11} />
                              ) : (
                                <Unlock size={11} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateLayer(layer.id);
                              }}
                              title="Duplicate layer"
                              className="p-1 rounded hover:bg-[#2A2A38] text-[#888899] hover:text-teal-400"
                            >
                              <CopyPlus size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLayer(layer.id);
                              }}
                              title="Delete layer"
                              className="p-1 rounded hover:bg-red-500/10 text-[#888899] hover:text-red-400"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Stack ordering row (only when selected) */}
                        {isSelected && (
                          <div className="flex items-center gap-0.5 px-2.5 pb-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayerStack(idx, "top");
                              }}
                              disabled={isTop}
                              title="Bring to Front"
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-[#9999AA] hover:text-teal-300 hover:bg-teal-500/10 disabled:opacity-30"
                            >
                              <ChevronsUp size={10} /> Front
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayerStack(idx, "up");
                              }}
                              disabled={isTop}
                              title="Move Forward"
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-[#9999AA] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30"
                            >
                              <ChevronUp size={10} /> Fwd
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayerStack(idx, "down");
                              }}
                              disabled={isBottom}
                              title="Move Backward"
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-[#9999AA] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30"
                            >
                              <ChevronDown size={10} /> Back
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayerStack(idx, "bottom");
                              }}
                              disabled={isBottom}
                              title="Send to Back"
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold text-[#9999AA] hover:text-pink-300 hover:bg-pink-500/10 disabled:opacity-30"
                            >
                              <ChevronsDown size={10} /> Behind
                            </button>
                          </div>
                        )}

                        {/* Move into container quick buttons */}
                        {isSelected && containers.length > 0 && (
                          <div className="flex items-center gap-1 px-2.5 pb-2 flex-wrap border-t border-[#2A2A38]/50 pt-1.5">
                            <span className="text-[8px] text-[#666677] font-semibold">
                              Move into →
                            </span>
                            {containers.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerToContainer(layer.id, c.id);
                                }}
                                title={`Move into ${(c as any).name || "container"}`}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all"
                              >
                                <LayoutGrid size={9} />
                                {(c as any).name || "Container"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </aside>

          {/* Center Column: Preview and Scrubber controls */}
          <main className="flex-1 flex flex-col bg-[#09090D] min-w-0 h-full overflow-hidden p-6 gap-6">
            {/* Canvas Player Box — zoom/pan viewport */}
            <div
              ref={viewportRef}
              className="flex-1 relative rounded-2xl border border-[#2A2A38] overflow-hidden shadow-inner checkerboard select-none"
              style={{ cursor: isPanning ? "grab" : "default" }}
            >
              {/* Inner pan/zoom surface — centred then offset */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transition: isPanning ? "none" : "transform 0.05s ease-out",
                    pointerEvents: "auto",
                    // Display-size wrapper — CSS only, never touches canvas pixel buffer
                    width:
                      Math.round((template.canvasWidth * zoom) / 100) + "px",
                    height:
                      Math.round((template.canvasHeight * zoom) / 100) + "px",
                    flexShrink: 0,
                  }}
                >
                  {/*
                    The canvas buffer dimensions (width/height HTML attributes) are
                    intentionally NOT set here. The textTemplateRenderService scheduler
                    owns them — it sets canvas.width/canvas.height imperatively via
                    outputScale before drawing each frame, which avoids React clearing
                    the pixel buffer on every re-render.
                    CSS width/height (100% of wrapper) handle the display scaling.
                  */}
                  <canvas
                    ref={canvasRef}
                    data-template-preview-state={previewState}
                    className="rounded-lg border border-[#1A1A26] shadow-2xl"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* Error overlay */}
              {previewState === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#09090D]/80 p-6 text-center pointer-events-none">
                  <div className="max-w-md rounded-xl border border-red-500/40 bg-[#121219] px-5 py-4 shadow-xl">
                    <div className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-red-300">
                      <AlertTriangle size={16} /> Preview unavailable
                    </div>
                    <p className="text-xs text-[#B7B7C7]">
                      {previewError ||
                        "The native renderer could not produce a frame."}
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Zoom Toolbar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#101018]/90 border border-[#2A2A3A] shadow-xl backdrop-blur-md z-10">
                {/* Fit button */}
                <button
                  type="button"
                  onClick={fitToViewport}
                  title="Fit to viewport"
                  className="p-1.5 rounded-lg text-[#9999AA] hover:text-white hover:bg-[#2A2A38] transition-colors"
                >
                  <Maximize2 size={13} />
                </button>

                <div className="w-px h-4 bg-[#2A2A38]" />

                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={() => applyZoom(zoom - 25)}
                  disabled={zoom <= 25}
                  title="Zoom out (–25%)"
                  className="p-1.5 rounded-lg text-[#9999AA] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30 transition-colors"
                >
                  <ZoomOut size={13} />
                </button>

                {/* Zoom % preset picker */}
                <div className="flex items-center gap-0.5">
                  {[25, 50, 75, 100, 150, 200, 400].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setZoom(pct);
                        zoomRef.current = pct;
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                        zoom === pct
                          ? "bg-purple-500 text-white"
                          : "text-[#9999AA] hover:text-white hover:bg-[#2A2A38]"
                      }`}
                    >
                      {pct === 100
                        ? "1×"
                        : pct === 200
                          ? "2×"
                          : pct === 400
                            ? "4×"
                            : `${pct}%`}
                    </button>
                  ))}
                </div>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={() => applyZoom(zoom + 25)}
                  disabled={zoom >= 400}
                  title="Zoom in (+25%)"
                  className="p-1.5 rounded-lg text-[#9999AA] hover:text-white hover:bg-[#2A2A38] disabled:opacity-30 transition-colors"
                >
                  <ZoomIn size={13} />
                </button>

                <div className="w-px h-4 bg-[#2A2A38]" />

                {/* Reset */}
                <button
                  type="button"
                  onClick={resetZoomAndPan}
                  title="Reset zoom & pan"
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[#9999AA] hover:text-white hover:bg-[#2A2A38] transition-colors"
                >
                  {zoom}%
                </button>

                <div className="w-px h-4 bg-[#2A2A38]" />

                {/* Quality picker — Canvas2D renderer only (Auto/Sharp/Fast) */}
                <div className="flex items-center gap-0.5">
                  <Monitor size={11} className="text-[#666677]" />
                  {(["auto", "half", "quarter"] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPreviewQuality(q)}
                      title={
                        q === "auto"
                          ? "Auto quality (scales with zoom, max 2×)"
                          : q === "half"
                            ? "Sharp: 2× pixel buffer"
                            : "Fast: ½× pixel buffer"
                      }
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                        previewQuality === q
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "text-[#777788] hover:text-white"
                      }`}
                    >
                      {q === "quarter"
                        ? "Fast"
                        : q === "half"
                          ? "Sharp"
                          : "Auto"}
                    </button>
                  ))}
                </div>

                <div className="w-px h-4 bg-[#2A2A38]" />

                {/* GPU acceleration chip */}
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  title={
                    nativeGpuInfo?.adapterName
                      ? `Native GPU Compositor: ${nativeGpuInfo.adapterName} (${nativeGpuInfo.backend || "WebGPU"})`
                      : "Native GPU Compositor Active"
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPU: ACCEL</span>
                </div>

                <div className="w-px h-4 bg-[#2A2A38]" />

                {/* Pan hint */}
                <div
                  className={`flex items-center gap-1 px-1.5 text-[9px] font-semibold transition-colors ${isPanning ? "text-purple-400" : "text-[#555566]"}`}
                >
                  <Hand size={10} />
                  {isPanning ? "Panning" : "Space+Drag"}
                </div>
              </div>
            </div>

            {/* Playback & Customization Controls */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-4 shrink-0 flex flex-col gap-4">
              {/* Scrub timeline */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={
                    isPlaying
                      ? "Pause template preview"
                      : "Play template preview"
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-black hover:bg-teal-400 transition-colors"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#888899]">
                    <span>
                      Frame {Math.round(currentTime * templateFps)} /{" "}
                      {Math.round(template.duration * templateFps)}
                    </span>
                    <span>
                      {currentTime.toFixed(2)}s / {template.duration.toFixed(1)}
                      s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={template.duration}
                    step={1 / templateFps}
                    value={currentTime}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentTime(parseFloat(e.target.value));
                    }}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 rounded-lg bg-[#2A2A38]"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-[#171722] border border-[#2A2A38] rounded-lg px-2 py-1.5 shrink-0">
                  <span className="text-[10px] text-[#888899] font-mono">
                    Speed:
                  </span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) =>
                      setPlaybackSpeed(parseFloat(e.target.value))
                    }
                    className="bg-transparent text-xs text-white border-none outline-none font-mono font-bold cursor-pointer"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2.0}>2.0x</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#171722] border border-[#2A2A38] rounded-lg px-2 py-1.5 shrink-0">
                  <span className="text-[10px] text-[#888899] font-mono">
                    Duration:
                  </span>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={template.duration}
                    onChange={(e) => {
                      const newDuration = parseFloat(e.target.value) || 3.0;
                      setTemplate({ ...template, duration: newDuration });
                      // Reset time if it exceeds new duration
                      if (currentTime > newDuration) {
                        setCurrentTime(newDuration);
                      }
                    }}
                    className="bg-transparent text-xs text-white border-none outline-none font-mono font-bold w-12 text-right cursor-pointer"
                  />
                  <span className="text-[10px] text-[#666677] font-mono">
                    s
                  </span>
                </div>
              </div>

              {/* Onion Skin */}
              <div className="border-t border-[#2A2A38]/50 pt-2 pb-1">
                <OnionSkinControl
                  options={onionSkinOptions}
                  onChange={setOnionSkinOptions}
                />
              </div>
            </div>
          </main>

          {/* Sidebar Right: Inspector Panel */}
          <aside className="w-80 border-l border-[#2A2A38] bg-[#121219] flex flex-col shrink-0 overflow-y-auto">
            {/* Section Header */}
            <div className="p-4 border-b border-[#2A2A38] bg-[#151520] shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#888899] flex items-center gap-1.5">
                <Settings size={13} className="text-teal-400" />{" "}
                {selectedLayer ? "Layer Inspector" : "Template Settings"}
              </span>
            </div>

            {/* Inspector Body */}
            {selectedLayer ? (
              <div className="p-4 space-y-5">
                {/* Basic Layer details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Layer ID
                    </label>
                    <input
                      type="text"
                      value={selectedLayer.id}
                      onChange={(e) =>
                        handleUpdateLayerProperty("id", e.target.value)
                      }
                      className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  {selectedLayer.kind === "text" && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
                            Static Text Content (Multi-Line)
                          </label>
                          <span className="text-[9px] text-[#666677]">
                            Press Enter for new line
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={selectedLayer.content}
                          placeholder="Type text or press Enter for multiple lines..."
                          onChange={(e) =>
                            handleUpdateLayerProperty("content", e.target.value)
                          }
                          className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-sans resize-y leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Font Family
                          </label>
                          <select
                            value={selectedLayer.fontFamily}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "fontFamily",
                                e.target.value,
                              )
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          >
                            {SUPPORTED_FONT_FAMILIES.map((fam) => (
                              <option key={fam} value={fam}>
                                {fam}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Font Size (px)
                          </label>
                          <input
                            type="number"
                            value={selectedLayer.fontSize}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "fontSize",
                                parseInt(e.target.value) || 24,
                              )
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Text Color
                          </label>
                          <div className="flex gap-1">
                            <ClypraColorPicker
                              value={selectedLayer.color || "#ffffff"}
                              onChange={(val) =>
                                handleUpdateLayerProperty("color", val)
                              }
                              onChangeComplete={(val) =>
                                handleUpdateLayerProperty("color", val)
                              }
                              size="sm"
                              placement="bottom-start"
                              triggerClassName="clypra-swatch-trigger w-8 h-8 rounded border border-[#2A2A38]"
                            />
                            <input
                              type="text"
                              value={selectedLayer.color}
                              onChange={(e) =>
                                handleUpdateLayerProperty(
                                  "color",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Font Weight
                          </label>
                          <input
                            type="number"
                            min={100}
                            max={900}
                            step={100}
                            value={selectedLayer.fontWeight}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "fontWeight",
                                parseInt(e.target.value) || 400,
                              )
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Typography Multi-Line & Spacing Controls */}
                      <div className="grid grid-cols-2 gap-2 bg-[#12121c] p-2 rounded-lg border border-[#2A2A38]">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] font-semibold text-[#888899] uppercase">
                              Line Spacing
                            </label>
                            <span className="text-[9px] font-mono text-teal-300">
                              {Number(selectedLayer.lineHeight ?? 1.25).toFixed(
                                2,
                              )}
                              x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.8"
                            max="2.5"
                            step="0.05"
                            value={selectedLayer.lineHeight ?? 1.25}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "lineHeight",
                                parseFloat(e.target.value) || 1.25,
                              )
                            }
                            className="w-full accent-teal-400"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] font-semibold text-[#888899] uppercase">
                              Letter Spacing
                            </label>
                            <span className="text-[9px] font-mono text-teal-300">
                              {selectedLayer.letterSpacing ?? 0}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-5"
                            max="20"
                            step="0.5"
                            value={selectedLayer.letterSpacing ?? 0}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "letterSpacing",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full accent-teal-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Horizontal Align
                          </label>
                          <select
                            value={selectedLayer.align}
                            onChange={(e) =>
                              handleUpdateLayerProperty("align", e.target.value)
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Vertical Align
                          </label>
                          <select
                            value={selectedLayer.verticalAlign || "middle"}
                            onChange={(e) =>
                              handleUpdateLayerProperty(
                                "verticalAlign",
                                e.target.value,
                              )
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          >
                            <option value="top">Top</option>
                            <option value="middle">Middle</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                          Text Overflow & Auto-Wrap Strategy
                        </label>
                        <select
                          value={selectedLayer.overflow || "expand-panel"}
                          onChange={(e) =>
                            handleUpdateLayerProperty(
                              "overflow",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                        >
                          <option value="expand-panel">
                            Auto-Expand Box (Hug Multi-Line Text)
                          </option>
                          <option value="wrap">
                            Multi-Line Word Wrap (Wrap to Width / Container)
                          </option>
                          <option value="shrink">
                            Auto-Shrink Font Size (Fit in Single Line)
                          </option>
                          <option value="clip">Clip at Boundaries</option>
                        </select>
                      </div>

                      {/* Background Panel Properties */}
                      <div className="border-t border-[#2A2A38]/50 pt-3 mt-2 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                          Background Panel (Optional)
                        </h4>

                        {/* 1-Click Box Style Presets */}
                        <BoxStylePresetPicker
                          currentBackgroundColor={selectedLayer.backgroundColor}
                          currentBorderRadius={selectedLayer.backgroundRadius}
                          onApplyPreset={handleApplyBoxPreset}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">
                              Background Color
                            </label>
                            <div className="flex gap-1">
                              <ClypraColorPicker
                                value={
                                  selectedLayer.backgroundColor || "#000000"
                                }
                                onChange={(val) =>
                                  handleUpdateLayerProperty(
                                    "backgroundColor",
                                    val,
                                  )
                                }
                                onChangeComplete={(val) =>
                                  handleUpdateLayerProperty(
                                    "backgroundColor",
                                    val,
                                  )
                                }
                                size="sm"
                                placement="bottom-start"
                                triggerClassName="clypra-swatch-trigger w-8 h-8 rounded border border-[#2A2A38]"
                              />
                              <input
                                type="text"
                                value={selectedLayer.backgroundColor || ""}
                                onChange={(e) =>
                                  handleUpdateLayerProperty(
                                    "backgroundColor",
                                    e.target.value,
                                  )
                                }
                                placeholder="none"
                                className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500"
                              />
                            </div>
                            <p className="text-[9px] text-[#666677] mt-0.5">
                              Leave empty to disable
                            </p>
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">
                              Opacity (0-1)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.1}
                              value={selectedLayer.backgroundOpacity ?? 1}
                              onChange={(e) =>
                                handleUpdateLayerProperty(
                                  "backgroundOpacity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#2A2A38]/50 pt-2 mt-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">
                              Padding (px)
                            </label>
                            <button
                              type="button"
                              title={
                                selectedLayer._paddingLinked
                                  ? "Unlink sides"
                                  : "Link all sides"
                              }
                              onClick={() =>
                                handleUpdateLayerProperty(
                                  "_paddingLinked",
                                  !(selectedLayer as any)._paddingLinked,
                                )
                              }
                              className={`rounded p-0.5 text-[10px] transition-colors ${
                                (selectedLayer as any)._paddingLinked !== false
                                  ? "text-teal-400 bg-teal-500/10 border border-teal-500/30"
                                  : "text-[#666677] border border-[#2A2A38]"
                              }`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(["Top", "Right", "Bottom", "Left"] as const).map(
                              (side) => {
                                const key = `padding${side}` as
                                  | "paddingTop"
                                  | "paddingRight"
                                  | "paddingBottom"
                                  | "paddingLeft";
                                const legacyVal =
                                  (selectedLayer as any).padding ?? 0;
                                const val =
                                  (selectedLayer as any)[key] !== undefined
                                    ? (selectedLayer as any)[key]
                                    : legacyVal;
                                const linked =
                                  (selectedLayer as any)._paddingLinked !==
                                  false;
                                return (
                                  <div key={side}>
                                    <label className="block text-[9px] text-[#666677] mb-0.5">
                                      {side}
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={val}
                                      onChange={(e) => {
                                        const v = parseInt(e.target.value) || 0;
                                        if (linked) {
                                          // All 4 sides + clear legacy field in one atomic update
                                          handleUpdateMultipleLayerProperties({
                                            paddingTop: v,
                                            paddingRight: v,
                                            paddingBottom: v,
                                            paddingLeft: v,
                                            padding: undefined,
                                          });
                                        } else {
                                          // Single side + clear legacy field in one atomic update
                                          handleUpdateMultipleLayerProperties({
                                            [key]: v,
                                            padding: undefined,
                                          });
                                        }
                                      }}
                                      className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
                                    />
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">
                              Border Radius (px)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={selectedLayer.backgroundRadius ?? 0}
                              onChange={(e) =>
                                handleUpdateLayerProperty(
                                  "backgroundRadius",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">
                              Border Color
                            </label>
                            <div className="flex gap-1">
                              <ClypraColorPicker
                                value={
                                  selectedLayer.backgroundBorderColor ||
                                  "#ffffff"
                                }
                                onChange={(val) =>
                                  handleUpdateLayerProperty(
                                    "backgroundBorderColor",
                                    val,
                                  )
                                }
                                onChangeComplete={(val) =>
                                  handleUpdateLayerProperty(
                                    "backgroundBorderColor",
                                    val,
                                  )
                                }
                                size="sm"
                                placement="bottom-start"
                                triggerClassName="clypra-swatch-trigger w-8 h-8 rounded border border-[#2A2A38]"
                              />
                              <input
                                type="text"
                                value={
                                  selectedLayer.backgroundBorderColor || ""
                                }
                                onChange={(e) =>
                                  handleUpdateLayerProperty(
                                    "backgroundBorderColor",
                                    e.target.value,
                                  )
                                }
                                placeholder="none"
                                className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">
                              Border Width (px)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={selectedLayer.backgroundBorderWidth ?? 0}
                              onChange={(e) =>
                                handleUpdateLayerProperty(
                                  "backgroundBorderWidth",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLayer.kind === "shape" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Shape Style
                          </label>
                          <select
                            value={selectedLayer.shape}
                            onChange={(e) =>
                              handleUpdateLayerProperty("shape", e.target.value)
                            }
                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                          >
                            <option value="rect">Rectangle</option>
                            <option value="circle">Circle / Ellipse</option>
                            <option value="line">Line</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                            Fill Color
                          </label>
                          <div className="flex gap-1">
                            <ClypraColorPicker
                              value={selectedLayer.fill || "#ffffff"}
                              onChange={(val) =>
                                handleUpdateLayerProperty("fill", val)
                              }
                              onChangeComplete={(val) =>
                                handleUpdateLayerProperty("fill", val)
                              }
                              size="sm"
                              placement="bottom-start"
                              triggerClassName="clypra-swatch-trigger w-8 h-8 rounded border border-[#2A2A38]"
                            />
                            <input
                              type="text"
                              value={selectedLayer.fill}
                              onChange={(e) =>
                                handleUpdateLayerProperty(
                                  "fill",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLayer.kind === "image" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={selectedLayer.url}
                        onChange={(e) =>
                          handleUpdateLayerProperty("url", e.target.value)
                        }
                        className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  {selectedLayer.kind === "container" &&
                    (() => {
                      const container = selectedLayer as TemplateContainerLayer;
                      const layout = container.layout || {
                        type: "flex",
                        direction: "column",
                        gap: 16,
                        alignItems: "start",
                        justifyContent: "start",
                      };

                      return (
                        <div className="space-y-3.5 border-t border-[#2A2A38]/50 pt-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <LayoutGrid size={13} /> Flex Container Layout
                            </label>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                              {layout.direction === "row"
                                ? "ROW FLOW"
                                : "COLUMN FLOW"}
                            </span>
                          </div>

                          {/* Width Sizing Mode */}
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-1">
                              Container Width Sizing
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLayerProperty("width", "auto")
                                }
                                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                                  container.width === "auto" || !container.width
                                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                    : "bg-[#09090D] border-[#2A2A38] text-[#888899] hover:border-[#3E3E52]"
                                }`}
                              >
                                Hug Contents (Auto)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLayerProperty(
                                    "width",
                                    typeof container.width === "number"
                                      ? container.width
                                      : 520,
                                  )
                                }
                                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                                  typeof container.width === "number"
                                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                    : "bg-[#09090D] border-[#2A2A38] text-[#888899] hover:border-[#3E3E52]"
                                }`}
                              >
                                Fixed Width
                              </button>
                            </div>
                            {typeof container.width === "number" && (
                              <div className="flex items-center gap-2 mt-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg px-2 py-1">
                                <span className="text-[9px] text-[#888899]">
                                  Width:
                                </span>
                                <input
                                  type="number"
                                  min="100"
                                  max="2000"
                                  value={container.width}
                                  onChange={(e) =>
                                    handleUpdateLayerProperty(
                                      "width",
                                      parseInt(e.target.value, 10) || 500,
                                    )
                                  }
                                  className="w-full bg-transparent text-xs text-white outline-none"
                                />
                                <span className="text-[9px] text-[#666677]">
                                  px
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Direction Toggle */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateLayerProperty("layout", {
                                  ...layout,
                                  direction: "column",
                                })
                              }
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                                layout.direction === "column"
                                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                  : "bg-[#09090D] border-[#2A2A38] text-[#888899] hover:border-[#3E3E52]"
                              }`}
                            >
                              <Rows size={13} /> Column (Vertical)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateLayerProperty("layout", {
                                  ...layout,
                                  direction: "row",
                                })
                              }
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                                layout.direction === "row"
                                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                  : "bg-[#09090D] border-[#2A2A38] text-[#888899] hover:border-[#3E3E52]"
                              }`}
                            >
                              <Columns size={13} /> Row (Horizontal)
                            </button>
                          </div>

                          {/* Gap & Align Items */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-[#888899] mb-1">
                                Gap:{" "}
                                {typeof layout.gap === "number"
                                  ? layout.gap
                                  : 16}
                                px
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                step="2"
                                value={
                                  typeof layout.gap === "number"
                                    ? layout.gap
                                    : 16
                                }
                                onChange={(e) =>
                                  handleUpdateLayerProperty("layout", {
                                    ...layout,
                                    gap: parseInt(e.target.value, 10),
                                  })
                                }
                                className="w-full accent-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-[#888899] mb-1">
                                Align Items
                              </label>
                              <select
                                value={layout.alignItems || "start"}
                                onChange={(e) =>
                                  handleUpdateLayerProperty("layout", {
                                    ...layout,
                                    alignItems: e.target.value as any,
                                  })
                                }
                                className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                              >
                                <option value="start">
                                  Start (Left / Top)
                                </option>
                                <option value="center">Center</option>
                                <option value="end">
                                  End (Right / Bottom)
                                </option>
                                <option value="stretch">Stretch</option>
                              </select>
                            </div>
                          </div>

                          {/* Padding Controls */}
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-1">
                              Container Padding (T · R · B · L)
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(
                                [
                                  "paddingTop",
                                  "paddingRight",
                                  "paddingBottom",
                                  "paddingLeft",
                                ] as const
                              ).map((side, sIdx) => {
                                const labels = ["T", "R", "B", "L"];
                                const val = (layout as any)[side] ?? 16;
                                return (
                                  <div
                                    key={side}
                                    className="flex items-center gap-1 bg-[#09090D] border border-[#2A2A38] rounded px-1.5 py-1"
                                  >
                                    <span className="text-[8px] font-mono text-[#666677]">
                                      {labels[sIdx]}
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="120"
                                      value={typeof val === "number" ? val : 0}
                                      onChange={(e) =>
                                        handleUpdateLayerProperty("layout", {
                                          ...layout,
                                          [side]:
                                            parseInt(e.target.value, 10) || 0,
                                        })
                                      }
                                      className="w-full bg-transparent text-[10px] text-white text-center outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Box Appearance */}
                          <div className="border-t border-[#2A2A38]/30 pt-2 space-y-2">
                            <span className="text-[9px] font-semibold text-[#888899] uppercase tracking-wider block">
                              Box Appearance
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] text-[#888899] mb-1">
                                  Background Fill
                                </label>
                                <div className="flex gap-1">
                                  <ClypraColorPicker
                                    value={
                                      container.backgroundColor || "#0d0d15"
                                    }
                                    onChange={(val) =>
                                      handleUpdateLayerProperty(
                                        "backgroundColor",
                                        val,
                                      )
                                    }
                                    onChangeComplete={(val) =>
                                      handleUpdateLayerProperty(
                                        "backgroundColor",
                                        val,
                                      )
                                    }
                                    size="sm"
                                    placement="bottom-start"
                                    triggerClassName="clypra-swatch-trigger w-7 h-7 rounded border border-[#2A2A38]"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      container.backgroundColor || "#0d0d15"
                                    }
                                    onChange={(e) =>
                                      handleUpdateLayerProperty(
                                        "backgroundColor",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1 text-[10px] font-mono text-center text-white outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] text-[#888899] mb-1">
                                  Corner Radius:{" "}
                                  {container.backgroundRadius ?? 14}px
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="40"
                                  value={container.backgroundRadius ?? 14}
                                  onChange={(e) =>
                                    handleUpdateLayerProperty(
                                      "backgroundRadius",
                                      parseInt(e.target.value, 10),
                                    )
                                  }
                                  className="w-full accent-indigo-400 mt-1.5"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] text-[#888899] mb-1">
                                  Border Color
                                </label>
                                <div className="flex gap-1">
                                  <ClypraColorPicker
                                    value={
                                      container.backgroundBorderColor ||
                                      "#6366f1"
                                    }
                                    onChange={(val) =>
                                      handleUpdateLayerProperty(
                                        "backgroundBorderColor",
                                        val,
                                      )
                                    }
                                    onChangeComplete={(val) =>
                                      handleUpdateLayerProperty(
                                        "backgroundBorderColor",
                                        val,
                                      )
                                    }
                                    size="sm"
                                    placement="bottom-start"
                                    triggerClassName="clypra-swatch-trigger w-7 h-7 rounded border border-[#2A2A38]"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      container.backgroundBorderColor ||
                                      "#6366f1"
                                    }
                                    onChange={(e) =>
                                      handleUpdateLayerProperty(
                                        "backgroundBorderColor",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1 text-[10px] font-mono text-center text-white outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] text-[#888899] mb-1">
                                  Border Width:{" "}
                                  {container.backgroundBorderWidth ?? 1.5}px
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="0.5"
                                  value={container.backgroundBorderWidth ?? 1.5}
                                  onChange={(e) =>
                                    handleUpdateLayerProperty(
                                      "backgroundBorderWidth",
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  className="w-full accent-indigo-400 mt-1.5"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Parent Container Selector (for any layer) */}
                  {template.layers.some(
                    (l) => l.kind === "container" && l.id !== selectedLayer.id,
                  ) && (
                    <div className="border-t border-[#2A2A38]/50 pt-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1 flex items-center gap-1.5">
                        <LayoutGrid size={12} /> Parent Container
                      </label>
                      <select
                        value={selectedLayer.parentId || ""}
                        onChange={(e) =>
                          handleUpdateLayerProperty(
                            "parentId",
                            e.target.value || undefined,
                          )
                        }
                        className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="">None (Canvas Root)</option>
                        {template.layers
                          .filter(
                            (l) =>
                              l.kind === "container" &&
                              l.id !== selectedLayer.id,
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {(c as any).name ||
                                `Container (${c.id.substring(0, 8)})`}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Layer Layout & Alignment */}
                <div className="border-t border-[#2A2A38]/50 pt-4">
                  <QuickPositionGrid
                    x={selectedLayer.x}
                    y={selectedLayer.y}
                    width={selectedLayer.width}
                    height={selectedLayer.height}
                    canvasWidth={template.canvasWidth}
                    canvasHeight={template.canvasHeight}
                    isTextNode={selectedLayer.kind === "text"}
                    onUpdateBounds={(updates) =>
                      handleUpdateMultipleLayerProperties(updates as any)
                    }
                  />
                </div>

                {/* Transitions & Animations */}
                <div className="border-t border-[#2A2A38]/50 pt-4">
                  <LayerAnimationTimeline
                    animation={selectedLayer.animation}
                    totalDuration={template.duration}
                    onChange={(updatedAnimation) =>
                      handleUpdateMultipleLayerProperties({
                        animation: updatedAnimation,
                      })
                    }
                    onOpenCatalog={() => setShowMotionCatalog(true)}
                  />
                </div>

                {/* Kinetic Text Splitting (for text layers) */}
                {selectedLayer.kind === "text" && (
                  <TextSplitAnimatorControl
                    animator={
                      (selectedLayer as TemplateTextLayer).splitAnimator
                    }
                    onChange={(animator) =>
                      handleUpdateLayerProperty("splitAnimator", animator)
                    }
                  />
                )}

                {/* 9-Point Spatial Anchoring */}
                <ResponsiveAnchorControl
                  anchor={selectedLayer.anchor}
                  onChange={(anchor) =>
                    handleUpdateLayerProperty("anchor", anchor)
                  }
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={handleAspectRatioChange}
                />

                {/* Keyframe Editor */}
                <div className="border-t border-[#2A2A38]/50 pt-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] flex items-center gap-1.5">
                      <Clock size={13} className="text-purple-400" /> Keyframe
                      Animation
                    </h4>
                    <button
                      onClick={() => setShowKeyframeEditor(!showKeyframeEditor)}
                      className="text-[9px] text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      {showKeyframeEditor ? "Hide" : "Show"}
                    </button>
                  </div>

                  {showKeyframeEditor &&
                    (() => {
                      const getCount = (prop: string) => {
                        const v = (selectedLayer as any)[prop];
                        return isKeyframed(v) ? v.keyframes.length : 0;
                      };
                      const propLabelMap: Record<string, string> = {
                        x: "X Position",
                        y: "Y Position",
                        width: "Width",
                        height: "Height",
                        opacity: "Opacity",
                        fontSize: "Font Size",
                        fontWeight: "Font Weight",
                        color: "Text Color",
                        backgroundColor: "Background Color",
                        backgroundOpacity: "Background Opacity",
                        backgroundRadius: "Background Radius",
                        padding: "Padding",
                        backgroundBorderColor: "Border Color",
                        backgroundBorderWidth: "Border Width",
                        fill: "Fill Color",
                      };
                      const activeTracks = Object.entries(propLabelMap)
                        .map(([k, label]) => ({
                          key: k,
                          label,
                          count: getCount(k),
                        }))
                        .filter((t) => t.count > 0);

                      return (
                        <div className="space-y-3">
                          {activeTracks.length > 0 && (
                            <div className="rounded border border-purple-500/20 bg-purple-950/10 p-2.5 space-y-1.5">
                              <span className="text-[9px] font-semibold text-purple-300 uppercase tracking-wider block">
                                Active Animated Tracks ({activeTracks.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeTracks.map((track) => (
                                  <button
                                    key={track.key}
                                    type="button"
                                    onClick={() =>
                                      setSelectedProperty(track.key)
                                    }
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                      selectedProperty === track.key
                                        ? "bg-purple-500 text-white shadow-sm"
                                        : "bg-[#181822] text-[#CCC] border border-[#2A2A38] hover:border-purple-500/50"
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                                    <span>{track.label}</span>
                                    <span className="font-mono text-[9px] opacity-75">
                                      ({track.count})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[9px] text-[#888899] mb-1">
                              Animate Property
                            </label>
                            <select
                              value={selectedProperty || ""}
                              onChange={(e) =>
                                setSelectedProperty(e.target.value || null)
                              }
                              className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                            >
                              <option value="">Select property...</option>
                              {selectedLayer.kind === "text" && (
                                <>
                                  <option value="fontSize">
                                    Font Size{" "}
                                    {getCount("fontSize") > 0
                                      ? `• (${getCount("fontSize")} kf)`
                                      : ""}
                                  </option>
                                  <option value="fontWeight">
                                    Font Weight{" "}
                                    {getCount("fontWeight") > 0
                                      ? `• (${getCount("fontWeight")} kf)`
                                      : ""}
                                  </option>
                                  <option value="color">
                                    Text Color{" "}
                                    {getCount("color") > 0
                                      ? `• (${getCount("color")} kf)`
                                      : ""}
                                  </option>
                                  <option value="backgroundColor">
                                    Background Color{" "}
                                    {getCount("backgroundColor") > 0
                                      ? `• (${getCount("backgroundColor")} kf)`
                                      : ""}
                                  </option>
                                  <option value="backgroundOpacity">
                                    Background Opacity{" "}
                                    {getCount("backgroundOpacity") > 0
                                      ? `• (${getCount("backgroundOpacity")} kf)`
                                      : ""}
                                  </option>
                                  <option value="backgroundRadius">
                                    Background Radius{" "}
                                    {getCount("backgroundRadius") > 0
                                      ? `• (${getCount("backgroundRadius")} kf)`
                                      : ""}
                                  </option>
                                  <option value="padding">
                                    Padding{" "}
                                    {getCount("padding") > 0
                                      ? `• (${getCount("padding")} kf)`
                                      : ""}
                                  </option>
                                  <option value="backgroundBorderColor">
                                    Border Color{" "}
                                    {getCount("backgroundBorderColor") > 0
                                      ? `• (${getCount("backgroundBorderColor")} kf)`
                                      : ""}
                                  </option>
                                  <option value="backgroundBorderWidth">
                                    Border Width{" "}
                                    {getCount("backgroundBorderWidth") > 0
                                      ? `• (${getCount("backgroundBorderWidth")} kf)`
                                      : ""}
                                  </option>
                                </>
                              )}
                              {selectedLayer.kind === "shape" && (
                                <>
                                  <option value="fill">
                                    Fill Color{" "}
                                    {getCount("fill") > 0
                                      ? `• (${getCount("fill")} kf)`
                                      : ""}
                                  </option>
                                  {selectedLayer.stroke && (
                                    <>
                                      <option value="stroke.color">
                                        Stroke Color{" "}
                                        {getCount("stroke.color") > 0
                                          ? `• (${getCount("stroke.color")} kf)`
                                          : ""}
                                      </option>
                                      <option value="stroke.width">
                                        Stroke Width{" "}
                                        {getCount("stroke.width") > 0
                                          ? `• (${getCount("stroke.width")} kf)`
                                          : ""}
                                      </option>
                                    </>
                                  )}
                                </>
                              )}
                              <option value="x">
                                X Position{" "}
                                {getCount("x") > 0
                                  ? `• (${getCount("x")} kf)`
                                  : ""}
                              </option>
                              <option value="y">
                                Y Position{" "}
                                {getCount("y") > 0
                                  ? `• (${getCount("y")} kf)`
                                  : ""}
                              </option>
                              <option value="width">
                                Width{" "}
                                {getCount("width") > 0
                                  ? `• (${getCount("width")} kf)`
                                  : ""}
                              </option>
                              <option value="height">
                                Height{" "}
                                {getCount("height") > 0
                                  ? `• (${getCount("height")} kf)`
                                  : ""}
                              </option>
                              <option value="opacity">
                                Opacity (Display){" "}
                                {getCount("opacity") > 0
                                  ? `• (${getCount("opacity")} kf)`
                                  : ""}
                              </option>
                            </select>
                          </div>

                          {selectedProperty && (
                            <>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleAddKeyframe(selectedProperty)
                                  }
                                  className="flex-1 rounded bg-purple-500 hover:bg-purple-400 px-3 py-2 text-[10px] font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Plus size={12} /> Add Keyframe at{" "}
                                  {currentTime.toFixed(2)}s
                                </button>
                              </div>

                              {(() => {
                                const keyframes =
                                  getPropertyKeyframes(selectedProperty);
                                if (!keyframes || keyframes.length === 0) {
                                  return (
                                    <div className="rounded border border-dashed border-[#2A2A38] p-3 text-center">
                                      <p className="text-[10px] text-[#666677]">
                                        No keyframes yet. Click "Add Keyframe"
                                        to animate this property over time.
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2">
                                    <p className="text-[9px] text-[#888899] uppercase font-bold tracking-wider">
                                      Keyframes ({keyframes.length})
                                    </p>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                      {keyframes.map((kf, idx) => (
                                        <div
                                          key={idx}
                                          className="rounded border border-[#2A2A38] bg-[#0E0E14] p-2.5 space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-purple-400 font-bold">
                                              {kf.time.toFixed(2)}s
                                            </span>
                                            <button
                                              onClick={() =>
                                                handleRemoveKeyframe(
                                                  selectedProperty,
                                                  kf.time,
                                                )
                                              }
                                              className="text-[#666677] hover:text-red-400 transition-colors"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-[8px] text-[#666677] mb-0.5">
                                                Value
                                              </label>
                                              <input
                                                type={
                                                  typeof kf.value === "number"
                                                    ? "number"
                                                    : "text"
                                                }
                                                step={
                                                  selectedProperty ===
                                                    "opacity" ||
                                                  selectedProperty ===
                                                    "backgroundOpacity"
                                                    ? "0.05"
                                                    : typeof kf.value ===
                                                        "number"
                                                      ? "1"
                                                      : undefined
                                                }
                                                min={
                                                  selectedProperty ===
                                                    "opacity" ||
                                                  selectedProperty ===
                                                    "backgroundOpacity"
                                                    ? 0
                                                    : undefined
                                                }
                                                max={
                                                  selectedProperty ===
                                                    "opacity" ||
                                                  selectedProperty ===
                                                    "backgroundOpacity"
                                                    ? 1
                                                    : undefined
                                                }
                                                value={kf.value}
                                                onChange={(e) => {
                                                  const newValue =
                                                    typeof kf.value === "number"
                                                      ? parseFloat(
                                                          e.target.value,
                                                        ) || 0
                                                      : e.target.value;
                                                  handleUpdateKeyframe(
                                                    selectedProperty,
                                                    kf.time,
                                                    newValue,
                                                  );
                                                }}
                                                className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[8px] text-[#666677] mb-0.5">
                                                Easing
                                              </label>
                                              <select
                                                value={kf.easing || "linear"}
                                                onChange={(e) =>
                                                  handleUpdateKeyframe(
                                                    selectedProperty,
                                                    kf.time,
                                                    kf.value,
                                                    e.target
                                                      .value as TemplateEasingFunction,
                                                  )
                                                }
                                                className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                                              >
                                                <option value="linear">
                                                  Linear
                                                </option>
                                                <option value="ease">
                                                  Ease
                                                </option>
                                                <option value="ease-in">
                                                  Ease In
                                                </option>
                                                <option value="ease-out">
                                                  Ease Out
                                                </option>
                                                <option value="ease-in-out">
                                                  Ease In-Out
                                                </option>
                                                <option value="cubic-bezier">
                                                  Cubic Bezier (Custom)
                                                </option>
                                                <option value="spring">
                                                  Spring (Physics)
                                                </option>
                                                <option value="bounce">
                                                  Bounce
                                                </option>
                                              </select>
                                            </div>
                                          </div>
                                          {kf.easing === "cubic-bezier" && (
                                            <div className="pt-1">
                                              <BezierCurveEditor
                                                bezier={kf.bezier}
                                                onChange={(bezier) =>
                                                  handleUpdateKeyframeBezier(
                                                    selectedProperty,
                                                    kf.time,
                                                    bezier,
                                                  )
                                                }
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })()}
                </div>
              </div>
            ) : (
              // Template Metadata Inspector
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={template.id}
                    onChange={(e) =>
                      setTemplate((prev) =>
                        prev ? { ...prev, id: e.target.value } : null,
                      )
                    }
                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Title Name
                  </label>
                  <input
                    type="text"
                    value={template.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTemplate((prev) =>
                        prev
                          ? { ...prev, label: val, id: toKebabCase(val) }
                          : null,
                      );
                    }}
                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Category
                  </label>
                  <select
                    value={template.category}
                    onChange={(e) => {
                      const val = e.target.value as TemplateCategory;
                      setTemplate((prev) =>
                        prev ? { ...prev, category: val } : null,
                      );
                    }}
                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                    Timeline Duration (seconds)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={template.duration}
                    onChange={(e) =>
                      setTemplate((prev) =>
                        prev
                          ? {
                              ...prev,
                              duration: parseFloat(e.target.value) || 3.0,
                            }
                          : null,
                      )
                    }
                    className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={template.canvasWidth}
                      onChange={(e) =>
                        setTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                canvasWidth: parseInt(e.target.value) || 1920,
                              }
                            : null,
                        )
                      }
                      className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={template.canvasHeight}
                      onChange={(e) =>
                        setTemplate((prev) =>
                          prev
                            ? {
                                ...prev,
                                canvasHeight: parseInt(e.target.value) || 1080,
                              }
                            : null,
                        )
                      }
                      className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-[#2A2A38]/50 pt-4 flex flex-col gap-2">
                  <p className="text-[10px] text-[#888899] leading-relaxed">
                    Adjusting template dimensions affects coordinates mapping.
                    Canvas templates default to 1920x1080 resolution.
                  </p>
                </div>

                {/* Dynamic Variable Manager */}
                <div className="border-t border-[#2A2A38]/50 pt-4">
                  <TemplateVariableManager
                    variables={template.variables ?? []}
                    onChange={(vars) =>
                      setTemplate((prev) =>
                        prev ? { ...prev, variables: vars } : null,
                      )
                    }
                    onInsertVariable={handleInsertVariableToken}
                    variableValues={variableTestValues}
                    onVariableValueChange={(key, val) =>
                      setVariableTestValues((prev) => ({ ...prev, [key]: val }))
                    }
                  />
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Motion Catalog Modal */}
      {template && selectedLayer && (
        <MotionCatalogModal
          isOpen={showMotionCatalog}
          onClose={() => setShowMotionCatalog(false)}
          currentAnimation={selectedLayer.animation}
          onApplyToLayer={handleApplyMotionToLayer}
          onApplyToAllLayers={handleApplyMotionToAllLayers}
        />
      )}

      {/* Publish Template modal */}

      {showPublishModal && template && (
        <PublishTemplateModal
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          templateId={template.id}
          templateName={template.label}
          category={template.category}
          description={publishDescription}
          tagsInput={publishTagsInput}
          creatorName={publishCreatorName}
          creatorLink={publishCreatorLink}
          placement={publishPlacement}
          thumbnailFrame={thumbnailFrame}
          durationFrames={Math.round(template.duration * templateFps)}
          validationErrors={{}}
          lottieData={template} // pass full template
          thumbnailDataUrl={thumbnailDataUrl || undefined}
          previewVideoUrl={publishVideoDataUrl || undefined}
          isGeneratingVideo={isGeneratingPublishVideo}
          width={template.canvasWidth}
          height={template.canvasHeight}
          onTemplateIdChange={(v) =>
            setTemplate((prev) => (prev ? { ...prev, id: v } : null))
          }
          onTemplateNameChange={(v) =>
            setTemplate((prev) =>
              prev ? { ...prev, label: v, id: toKebabCase(v) } : null,
            )
          }
          onCategoryChange={(v) =>
            setTemplate((prev) => (prev ? { ...prev, category: v } : null))
          }
          onDescriptionChange={setPublishDescription}
          onTagsInputChange={setPublishTagsInput}
          onCreatorNameChange={setPublishCreatorName}
          onCreatorLinkChange={setPublishCreatorLink}
          onPlacementChange={setPublishPlacement}
          onThumbnailFrameChange={setThumbnailFrame}
          onUseCurrentFrame={() =>
            setThumbnailFrame(Math.round(currentTime * templateFps))
          }
          onPreviewThumbnail={async () => {
            const url = await captureThumbnail();
            setThumbnailDataUrl(url);
          }}
          onPublish={handlePublish}
          publishStatus={publishStatus}
          publishMessage={publishMessage}
          publishPrUrl={publishPrUrl}
          published={publishApproved}
          onPublishedChange={setPublishApproved}
          isAdmin={isAdmin}
        />
      )}

      {/* Preview Video Modal */}
      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A38]">
                <div className="flex items-center gap-2">
                  <Play size={18} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Preview Video
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#2A2A38] transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Video Player */}
              <div className="p-6 checkerboard">
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg border border-[#2A2A38]"
                  style={{ maxHeight: "70vh" }}
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2A2A38] flex items-center justify-between">
                <p className="text-[10px] text-[#888899]">
                  Preview of exported .webm video •{" "}
                  {template?.duration.toFixed(1)}s @ 30fps
                </p>
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = previewVideoUrl;
                    a.download = `${template?.id || "preview"}.webm`;
                    a.click();
                  }}
                  className="rounded-lg border border-[#2A2A38] hover:bg-[#2A2A38] px-3 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
