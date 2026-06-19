import React, { useState, useEffect, useRef, useMemo } from "react";
import { Download, Copy, Plus, Play, Pause, Loader2, FolderPlus, ArrowLeft, Sparkles, FileJson, UploadCloud, X, RefreshCw, AlertTriangle, CheckCircle, Info, Layers, Lock, Unlock, Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Settings, Image as ImageIcon, Sparkle, Clock } from "lucide-react";

import { TemplateRenderer, BUILTIN_CANVAS_TEMPLATES, TemplateCategory, TextTemplate, TemplateLayer, TemplateTextLayer, TemplateShapeLayer, TemplateImageLayer, LayerAnimation, AnimationPreset, AnimatableValue, TemplateKeyframe, TemplateEasingFunction, addKeyframe, removeTemplateKeyframe, isKeyframed } from "@clypra/engine";
import { PublishTemplateModal } from "./PublishTemplateModal";

export interface TemplateWorkspaceProps {
  onBackToDesign: () => void;
}

const CATEGORIES: TemplateCategory[] = ["lower-third", "title-card", "caption", "callout", "social", "countdown"];
const PLACEMENTS = ["lower-third", "center", "top", "full-frame"] as const;

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TemplateWorkspace({ onBackToDesign }: TemplateWorkspaceProps) {

  // Template State
  const [template, setTemplate] = useState<TextTemplate | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Preview / Customization States
  const [customTexts, setCustomTexts] = useState({
    primary: "Primary Text",
    secondary: "Secondary Text",
    accent: "Accent Text",
  });

  // Sync customTexts with layer content when template loads or changes
  useEffect(() => {
    if (!template) return;

    const newCustomTexts = { ...customTexts };
    let hasChanges = false;

    for (const layer of template.layers) {
      if (layer.kind === "text" && layer.role && layer.role !== "none") {
        const roleKey = layer.role as "primary" | "secondary" | "accent";
        // Only update if the current value is still the default placeholder
        if (newCustomTexts[roleKey] === `${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)} Text`) {
          newCustomTexts[roleKey] = layer.content;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      setCustomTexts(newCustomTexts);
    }
  }, [template?.id, template?.layers]); // Only re-run when template changes
  const [colorOverrides, setColorOverrides] = useState<Map<string, string>>(new Map());

  // Playback / Timeline clock
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [thumbnailFrame, setThumbnailFrame] = useState(0);

  // New template configurations
  const [newTemplateId, setNewTemplateId] = useState("my-custom-template");
  const [newLabel, setNewLabel] = useState("My Custom Template");
  const [newCategory, setNewCategory] = useState<TemplateCategory>("lower-third");
  const [newW, setNewW] = useState(1920);
  const [newH, setNewH] = useState(1080);
  const [newDuration, setNewDuration] = useState(3.0);

  // Workspace visual layers settings
  const [lockedLayers, setLockedLayers] = useState<Set<string>>(new Set());
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());

  // Keyframe Editor State
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showKeyframeEditor, setShowKeyframeEditor] = useState(false);

  // Preview Video State
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Publishing States
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishPrUrl, setPublishPrUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [publishVideoDataUrl, setPublishVideoDataUrl] = useState<string | null>(null);
  const [isGeneratingPublishVideo, setIsGeneratingPublishVideo] = useState(false);
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTagsInput, setPublishTagsInput] = useState("");
  const [publishPlacement, setPublishPlacement] = useState<(typeof PLACEMENTS)[number]>("center");

  // Auto-save notification
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Saved templates management
  const [savedTemplates, setSavedTemplates] = useState<Array<{ id: string; name: string; savedAt: number }>>([]);
  const [showSavedTemplates, setShowSavedTemplates] = useState(false);

  // Load template session from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("clypra_canvas_studio_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setTemplate(parsed.template);
          setSelectedLayerId(parsed.selectedLayerId);
          setCustomTexts(parsed.customTexts || { primary: "Primary Text", secondary: "Secondary Text", accent: "Accent Text" });
          if (parsed.colorOverrides) {
            setColorOverrides(new Map(Object.entries(parsed.colorOverrides)));
          }
          setThumbnailFrame(parsed.thumbnailFrame || 0);
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

  const applyCustomizations = (renderer: TemplateRenderer) => {
    if (!template) return;
    for (const layer of template.layers) {
      if (hiddenLayers.has(layer.id)) {
        renderer.updateLayer(layer.id, {
          x: -9999,
          y: -9999,
        });
        continue;
      }

      const overrides: any = {};
      if (layer.kind === "text") {
        if (layer.role && layer.role !== "none") {
          if (layer.role === "primary") {
            overrides.content = customTexts.primary;
          } else if (layer.role === "secondary") {
            overrides.content = customTexts.secondary;
          } else if (layer.role === "accent") {
            overrides.content = customTexts.accent;
          }
        }
      }

      const colorOverride = colorOverrides.get(layer.id);
      if (colorOverride) {
        if (layer.kind === "text") {
          overrides.color = colorOverride;
        } else if (layer.kind === "shape") {
          overrides.fill = colorOverride;
        }
      }

      if (Object.keys(overrides).length > 0) {
        renderer.updateLayer(layer.id, overrides);
      }
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
          customTexts,
          colorOverrides: Object.fromEntries(colorOverrides),
          thumbnailFrame,
        };
        localStorage.setItem("clypra_canvas_studio_session", JSON.stringify(data));
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to save session", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [template, selectedLayerId, customTexts, colorOverrides, thumbnailFrame]);

  // Preview Redraw Loop
  useEffect(() => {
    if (!template || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Build template rendering snapshot with overrides applied
    const renderer = new TemplateRenderer(template);
    applyCustomizations(renderer);

    renderer.drawFrame(ctx, currentTime);

    // Draw selection bounding outline on active layer
    if (selectedLayerId) {
      const activeLayer = template.layers.find((l) => l.id === selectedLayerId);
      if (activeLayer) {
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(activeLayer.x, activeLayer.y, activeLayer.width, activeLayer.height);
        ctx.restore();
      }
    }
  }, [template, currentTime, customTexts, colorOverrides, selectedLayerId, hiddenLayers]);

  // RequestAnimationFrame tick for playing previews
  const tick = (timestamp: number) => {
    if (previousTimeRef.current !== null && template) {
      const elapsed = (timestamp - previousTimeRef.current) / 1000;
      const nextTime = currentTime + elapsed * playbackSpeed;
      if (nextTime >= template.duration) {
        setCurrentTime(0);
      } else {
        setCurrentTime(nextTime);
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
  }, [isPlaying, currentTime, playbackSpeed, template]);

  // Save current template to library
  const handleSaveTemplate = () => {
    if (!template) return;

    const name = prompt("Enter a name for this template:", template.label || template.id);
    if (!name) return;

    const savedId = `saved_${Date.now()}`;
    const savedTemplate = {
      template,
      selectedLayerId,
      customTexts,
      colorOverrides: Object.fromEntries(colorOverrides),
      thumbnailFrame,
    };

    // Save template data
    localStorage.setItem(`clypra_saved_template_${savedId}`, JSON.stringify(savedTemplate));

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
    localStorage.setItem("clypra_saved_templates_list", JSON.stringify(newList));

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
      setCustomTexts(parsed.customTexts || { primary: "Primary Text", secondary: "Secondary Text", accent: "Accent Text" });
      if (parsed.colorOverrides) {
        setColorOverrides(new Map(Object.entries(parsed.colorOverrides)));
      }
      setThumbnailFrame(parsed.thumbnailFrame || 0);
      setCurrentTime(0);
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
    if (!confirm("Are you sure you want to delete this saved template?")) return;

    localStorage.removeItem(`clypra_saved_template_${savedId}`);
    const newList = savedTemplates.filter((t) => t.id !== savedId);
    setSavedTemplates(newList);
    localStorage.setItem("clypra_saved_templates_list", JSON.stringify(newList));
  };

  // Start a new template (saves current to session)
  const handleNewTemplate = () => {
    if (template && !confirm("Start a new template? Your current work is auto-saved and can be resumed later.")) {
      return;
    }

    setTemplate(null);
    setSelectedLayerId(null);
    setCustomTexts({ primary: "Primary Text", secondary: "Secondary Text", accent: "Accent Text" });
    setColorOverrides(new Map());
    setIsPlaying(false);
    setCurrentTime(0);
    setSaveStatus("idle");
  };

  // Reset/Clear workspace sandbox
  const handleResetSession = () => {
    if (!confirm("Are you sure you want to clear your current progress and reset the sandbox? All unsaved modifications will be permanently lost.")) {
      return;
    }
    localStorage.removeItem("clypra_canvas_studio_session");
    setTemplate(null);
    setSelectedLayerId(null);
    setCustomTexts({ primary: "Primary Text", secondary: "Secondary Text", accent: "Accent Text" });
    setColorOverrides(new Map());
    setIsPlaying(false);
    setCurrentTime(0);
    setSaveStatus("idle");
  };

  // Preset Selection Trigger
  const handleSelectPreset = (preset: TextTemplate) => {
    const clone = JSON.parse(JSON.stringify(preset)) as TextTemplate;
    setTemplate(clone);
    setSelectedLayerId(clone.layers[0]?.id || null);
    setCurrentTime(0);
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

  // Add layer handler
  const handleAddLayer = (kind: "text" | "shape" | "image") => {
    if (!template) return;
    const id = `layer-${Date.now().toString(36)}`;
    const animation: LayerAnimation = {
      in: "slide-up",
      out: "fade",
      inDuration: 0.5,
      outDuration: 0.3,
      hold: "full",
    };

    // Center new layers on canvas
    const centerX = template.canvasWidth / 2;
    const centerY = template.canvasHeight / 2;

    let newLayer: TemplateLayer;
    if (kind === "text") {
      const width = 600;
      const height = 100;
      newLayer = {
        kind: "text",
        id,
        content: "New Text Layer",
        fontFamily: "Poppins",
        fontSize: 48,
        fontWeight: 400,
        color: "#ffffff",
        align: "center",
        x: centerX - width / 2, // Center horizontally
        y: centerY - height / 2, // Center vertically
        width,
        height,
        animation,
        role: "primary",
      };
    } else if (kind === "shape") {
      const width = 400;
      const height = 200;
      newLayer = {
        kind: "shape",
        id,
        shape: "rect",
        fill: "#7c6fff",
        x: centerX - width / 2, // Center horizontally
        y: centerY - height / 2, // Center vertically
        width,
        height,
        animation,
      };
    } else {
      const width = 400;
      const height = 300;
      newLayer = {
        kind: "image",
        id,
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
        x: centerX - width / 2, // Center horizontally
        y: centerY - height / 2, // Center vertically
        width,
        height,
        animation,
      };
    }

    setTemplate({
      ...template,
      layers: [...template.layers, newLayer],
    });
    setSelectedLayerId(id);
  };

  // Remove Layer
  const handleDeleteLayer = (id: string) => {
    if (!template) return;
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
    const updated = new Set(hiddenLayers);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setHiddenLayers(updated);
  };

  const toggleLock = (id: string) => {
    const updated = new Set(lockedLayers);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setLockedLayers(updated);
  };

  // Reorder layers (bottom to top list reordering)
  const handleMoveLayer = (idx: number, dir: "up" | "down") => {
    if (!template) return;
    const layers = [...template.layers];
    if (dir === "up" && idx < layers.length - 1) {
      const temp = layers[idx];
      layers[idx] = layers[idx + 1];
      layers[idx + 1] = temp;
    } else if (dir === "down" && idx > 0) {
      const temp = layers[idx];
      layers[idx] = layers[idx - 1];
      layers[idx - 1] = temp;
    }
    setTemplate({ ...template, layers });
  };

  // Update selected layer property
  const handleUpdateLayerProperty = (property: string, value: any) => {
    if (!template || !selectedLayerId) return;
    setTemplate({
      ...template,
      layers: template.layers.map((l) => {
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
    });
  };

  // Get keyframes for a property
  const getPropertyKeyframes = (property: string): TemplateKeyframe<any>[] | null => {
    if (!selectedLayer) return null;
    const value = (selectedLayer as any)[property];
    if (isKeyframed(value)) {
      return value.keyframes;
    }
    return null;
  };

  // Add keyframe at current time
  const handleAddKeyframe = (property: string, easing: TemplateEasingFunction = "ease-in-out") => {
    if (!template || !selectedLayerId || !selectedLayer) return;

    const currentValue = (selectedLayer as any)[property];
    const newKeyframedValue = addKeyframe(currentValue, currentTime, currentValue, easing);

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
  const handleUpdateKeyframe = (property: string, time: number, newValue: any, easing?: TemplateEasingFunction) => {
    if (!template || !selectedLayerId || !selectedLayer) return;

    const currentValue = (selectedLayer as any)[property];
    if (!isKeyframed(currentValue)) return;

    const keyframes = currentValue.keyframes.map((kf: TemplateKeyframe<any>) => {
      if (Math.abs(kf.time - time) < 0.01) {
        return { ...kf, value: newValue, easing: easing ?? kf.easing };
      }
      return kf;
    });

    handleUpdateLayerProperty(property, { keyframes });
  };

  interface CropRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  }

  const getCanvasCropRect = (canvas: HTMLCanvasElement, padding = 15): CropRect | null => {
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

  const getTemplateCropRect = (padding = 15): CropRect | null => {
    if (!template) return null;
    const canvas = document.createElement("canvas");
    canvas.width = template.canvasWidth;
    canvas.height = template.canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const renderer = new TemplateRenderer(template);
    applyCustomizations(renderer);
    // Render at the middle of the duration where all layers are fully resolved
    const midTime = template.duration / 2;
    renderer.drawFrame(ctx, midTime);

    return getCanvasCropRect(canvas, padding);
  };

  // Export static high-res thumbnail frame
  const captureThumbnail = async (crop = true): Promise<string> => {
    if (!template) return "";
    const offscreen = document.createElement("canvas");
    offscreen.width = template.canvasWidth;
    offscreen.height = template.canvasHeight;
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return "";

    const renderer = new TemplateRenderer(template);
    applyCustomizations(renderer);

    // Draw using same layout logic at thumbnail frame time
    const fps = 30;
    const time = thumbnailFrame / fps;
    renderer.drawFrame(oCtx, time);

    if (crop) {
      const rect = getTemplateCropRect();
      if (rect) {
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = rect.width;
        croppedCanvas.height = rect.height;
        const croppedCtx = croppedCanvas.getContext("2d");
        if (croppedCtx) {
          croppedCtx.drawImage(offscreen, rect.minX, rect.minY, rect.width, rect.height, 0, 0, rect.width, rect.height);
          return croppedCanvas.toDataURL("image/png");
        }
      }
    }

    return offscreen.toDataURL("image/png");
  };

  // Generate preview video with proper frame timing
  const generatePreviewVideo = async (): Promise<string> => {
    if (!template) return "";

    const renderer = new TemplateRenderer(template);
    applyCustomizations(renderer);
    const fps = 30;
    const totalFrames = Math.ceil(template.duration * fps);

    // Render the middle frame onto a temporary canvas to determine the crop rectangle
    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = template.canvasWidth;
    renderCanvas.height = template.canvasHeight;
    const renderCtx = renderCanvas.getContext("2d");
    if (!renderCtx) return "";

    const cropRect = getTemplateCropRect();

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
    const hasRequestFrame = tempTrack && typeof tempTrack.requestFrame === "function";
    tempStream.getTracks().forEach((t) => t.stop());

    // Create MediaRecorder stream
    const stream = canvas.captureStream(hasRequestFrame ? 0 : fps);
    const videoTrack = stream.getVideoTracks()[0] as any;
    const chunks: Blob[] = [];

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();

      let currentFrame = 0;
      const startTime = performance.now();

      const tick = () => {
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
          
          // Render full size
          renderCtx.clearRect(0, 0, template.canvasWidth, template.canvasHeight);
          renderer.drawFrame(renderCtx, time);

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
              cropRect.height
            );
          } else {
            ctx.drawImage(renderCanvas, 0, 0);
          }

          if (hasRequestFrame && typeof videoTrack.requestFrame === "function") {
            videoTrack.requestFrame();
          }

          currentFrame++;
        }

        if (currentFrame < totalFrames) {
          requestAnimationFrame(tick);
        } else {
          mediaRecorder.stop();
          stream.getTracks().forEach((t) => t.stop());
        }
      };

      requestAnimationFrame(tick);
    });
  };

  const handleOpenPublish = async () => {
    if (!template) return;
    try {
      setPublishDescription(`Canvas-based template: ${template.label}`);
      setPublishTagsInput(template.category || "");
      setPublishPlacement("center");
      setPublishVideoDataUrl(null);
      
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
      captureThumbnail().then((url) => {
        setThumbnailDataUrl(url);
      }).catch((err) => {
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
      const thumbnailUrl = thumbnailDataUrl || await captureThumbnail();

      // Use pre-recorded video or record now
      let videoUrl = publishVideoDataUrl;
      if (!videoUrl) {
        setPublishMessage("Recording preview animation…");
        videoUrl = await generatePreviewVideo();
      }

      setPublishMessage("Uploading files to clypra-api…");

      const response = await fetch("https://clypra-worker-api.abdulkabirmusa.com/text-templates/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: {
            ...template,
            description: publishDescription,
            tags: publishTagsInput.split(",").map((t) => t.trim()).filter(Boolean),
          },
          thumbnailDataUrl: thumbnailUrl,
          previewDataUrl: videoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setPublishStatus("published");
      const lottieUrl = `https://clypra-worker-api.abdulkabirmusa.com/media/text-templates/${template.category}/${template.id}.json`;
      setPublishPrUrl(lottieUrl);
      setPublishMessage(`${result.message || "Template published successfully"}`);
    } catch (error) {
      setPublishStatus("failed");
      setPublishMessage(error instanceof Error ? error.message : "Publishing failed");
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
  const selectedLayer = template?.layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#09090D] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-[#2A2A38] bg-[#121219] px-6 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBackToDesign} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2A38] hover:bg-[#2A2A38] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkle size={18} className="text-teal-400" />
            <h1 className="text-sm font-bold text-white tracking-tight">Clypra Canvas Template Studio</h1>
          </div>
          {template && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#2A2A38] bg-[#1A1A26] text-teal-300">{template.category}</span>}
        </div>

        <div className="flex items-center gap-4">
          {saveStatus === "saving" && (
            <span className="text-[11px] text-[#888899] flex items-center gap-1.5 font-medium">
              <Loader2 size={12} className="animate-spin text-teal-400" /> Auto-saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[11px] text-teal-400 flex items-center gap-1.5 font-medium">
              <CheckCircle size={12} /> Auto-saved
            </span>
          )}
          {template && (
            <>
              <button onClick={handleSaveTemplate} className="rounded-lg border border-[#2A2A38] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#2A2A38] transition-all flex items-center gap-1.5">
                <Copy size={13} /> Save Template
              </button>
              <button onClick={handleDownloadThumbnail} className="rounded-lg border border-[#2A2A38] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#2A2A38] transition-all flex items-center gap-1.5" title="Download cropped template thumbnail as PNG">
                <Download size={13} /> Download PNG
              </button>
              <button onClick={() => setShowSavedTemplates(true)} className="rounded-lg border border-[#2A2A38] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#2A2A38] transition-all flex items-center gap-1.5">
                <FolderPlus size={13} /> Load ({savedTemplates.length})
              </button>
              <button onClick={handleNewTemplate} className="rounded-lg border border-[#2A2A38] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#2A2A38] transition-all flex items-center gap-1.5">
                <Plus size={13} /> New
              </button>
              <button onClick={handleGeneratePreview} disabled={isGeneratingPreview} className="rounded-lg border border-purple-500 hover:bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
              <button onClick={handleOpenPublish} className="rounded-lg bg-teal-500 hover:bg-teal-400 px-4 py-1.5 text-xs font-bold text-black shadow-lg shadow-teal-500/10 flex items-center gap-1.5 transition-colors">
                <UploadCloud size={14} /> Publish Template
              </button>
            </>
          )}
        </div>
      </header>

      {/* Saved Templates Modal */}
      {showSavedTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus size={16} className="text-teal-400" />
                Saved Templates ({savedTemplates.length})
              </h3>
              <button onClick={() => setShowSavedTemplates(false)} className="rounded-lg p-1.5 hover:bg-[#2A2A38] transition-colors">
                <X size={16} />
              </button>
            </div>

            {savedTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-[#888899]">No saved templates yet. Save your current work to access it later.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedTemplates.map((saved) => (
                  <div key={saved.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2A2A38] bg-[#09090D] hover:border-teal-500/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{saved.name}</p>
                      <p className="text-[10px] text-[#888899] mt-0.5">Saved {new Date(saved.savedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => handleLoadTemplate(saved.id)} className="rounded-lg border border-teal-500 hover:bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 transition-colors">
                        Load
                      </button>
                      <button onClick={() => handleDeleteSavedTemplate(saved.id)} className="rounded-lg p-1.5 hover:bg-red-500/10 text-red-400 transition-colors">
                        <Trash2 size={14} />
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
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Builtin Preset selector */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-teal-400" size={18} />
                <h2 className="text-sm font-bold text-white">Start with a Builtin Preset</h2>
              </div>
              <p className="text-xs text-[#9A9AAA] leading-relaxed">Choose from pre-configured canvas animation templates covering all standard launch categories.</p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {BUILTIN_CANVAS_TEMPLATES.map((preset) => (
                  <button key={preset.id} onClick={() => handleSelectPreset(preset)} className="flex flex-col items-start p-4 rounded-xl border border-[#2A2A38] bg-[#171722] hover:border-teal-500/50 hover:bg-[#1C1C2A] text-left transition-all">
                    <span className="text-xs font-bold text-white">{preset.label}</span>
                    <span className="text-[10px] text-teal-400 font-semibold mt-1 uppercase tracking-wider">{preset.category}</span>
                    <span className="text-[10px] text-[#888899] mt-2 font-mono">
                      {preset.duration}s · {preset.layers.length} layers
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Blank slate setup */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderPlus className="text-purple-400" size={18} />
                <h2 className="text-sm font-bold text-white">Create Template from Scratch</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Template ID</label>
                  <input type="text" value={newTemplateId} onChange={(e) => setNewTemplateId(e.target.value)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs font-mono text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Label Name</label>
                  <input type="text" value={newLabel} onChange={(e) => {
                    const label = e.target.value;
                    setNewLabel(label);
                    setNewTemplateId(toKebabCase(label));
                  }} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Category</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as TemplateCategory)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Duration (seconds)</label>
                    <input type="number" step={0.1} value={newDuration} onChange={(e) => setNewDuration(parseFloat(e.target.value) || 3.0)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Canvas Width</label>
                    <input type="number" value={newW} onChange={(e) => setNewW(parseInt(e.target.value) || 1920)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Canvas Height</label>
                    <input type="number" value={newH} onChange={(e) => setNewH(parseInt(e.target.value) || 1080)} className="w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                </div>
              </div>

              <button onClick={handleCreateBlank} className="w-full rounded-xl bg-purple-500 hover:bg-purple-400 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/10 transition-colors mt-2">
                Create Blank Template
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar Left: Layers Panel */}
          <aside className="w-72 border-r border-[#2A2A38] bg-[#121219] flex flex-col shrink-0 min-h-0">
            <div className="p-4 border-b border-[#2A2A38] flex items-center justify-between shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#888899] flex items-center gap-1.5">
                <Layers size={13} className="text-teal-400" /> Layers
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleAddLayer("text")} className="rounded border border-[#2A2A38] px-2 py-1 text-[10px] font-semibold hover:bg-[#2A2A38] text-white flex items-center gap-1">
                  <Plus size={10} /> Text
                </button>
                <button onClick={() => handleAddLayer("shape")} className="rounded border border-[#2A2A38] px-2 py-1 text-[10px] font-semibold hover:bg-[#2A2A38] text-white flex items-center gap-1">
                  <Plus size={10} /> Shape
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {template.layers.length === 0 ? (
                <div className="h-40 flex items-center justify-center border border-dashed border-[#2A2A38] rounded-xl text-center p-4">
                  <p className="text-[11px] text-[#888899]">No layers added yet. Click Add Text or Add Shape to begin building.</p>
                </div>
              ) : (
                [...template.layers].reverse().map((layer, reverseIdx) => {
                  const idx = template.layers.length - 1 - reverseIdx;
                  const isSelected = layer.id === selectedLayerId;
                  const isLocked = lockedLayers.has(layer.id);
                  const isHidden = hiddenLayers.has(layer.id);

                  return (
                    <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "bg-teal-500/10 border-teal-500/50" : "bg-[#181822] border-[#2A2A38] hover:border-[#3E3E52]"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-[#555566] shrink-0">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{layer.kind === "text" ? layer.content : `${layer.kind} (${(layer as any).shape || "layer"})`}</p>
                          <p className="text-[9px] text-teal-400 font-semibold tracking-wider uppercase mt-0.5">{layer.kind}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(layer.id);
                          }}
                          className={`p-1 rounded hover:bg-[#2A2A38] ${isHidden ? "text-red-400" : "text-[#888899]"}`}
                        >
                          {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLock(layer.id);
                          }}
                          className={`p-1 rounded hover:bg-[#2A2A38] ${isLocked ? "text-amber-400" : "text-[#888899]"}`}
                        >
                          {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(idx, "up");
                          }}
                          disabled={idx === template.layers.length - 1}
                          className="p-1 rounded hover:bg-[#2A2A38] text-[#888899] disabled:opacity-30"
                        >
                          <ChevronUp size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(idx, "down");
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-[#2A2A38] text-[#888899] disabled:opacity-30"
                        >
                          <ChevronDown size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLayer(layer.id);
                          }}
                          className="p-1 rounded hover:bg-red-500/10 text-[#888899] hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Center Column: Preview and Scrubber controls */}
          <main className="flex-1 flex flex-col bg-[#09090D] min-w-0 h-full overflow-hidden p-6 gap-6">
            {/* Canvas Player Box */}
            <div className="flex-1 flex items-center justify-center bg-[#07070A] rounded-2xl border border-[#2A2A38] relative overflow-hidden p-4 shadow-inner">
              <canvas
                ref={canvasRef}
                width={template.canvasWidth}
                height={template.canvasHeight}
                className="max-w-full max-h-full rounded-lg border border-[#1A1A26] shadow-lg"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Playback & Customization Controls */}
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] p-4 shrink-0 flex flex-col gap-4">
              {/* Scrub timeline */}
              <div className="flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-black hover:bg-teal-400 transition-colors">
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#888899]">
                    <span>
                      Frame {Math.round(currentTime * 30)} / {Math.round(template.duration * 30)}
                    </span>
                    <span>
                      {currentTime.toFixed(2)}s / {template.duration.toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={template.duration}
                    step={0.033}
                    value={currentTime}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentTime(parseFloat(e.target.value));
                    }}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 rounded-lg bg-[#2A2A38]"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-[#171722] border border-[#2A2A38] rounded-lg px-2 py-1.5 shrink-0">
                  <span className="text-[10px] text-[#888899] font-mono">Speed:</span>
                  <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} className="bg-transparent text-xs text-white border-none outline-none font-mono font-bold cursor-pointer">
                    <option value={0.5}>0.5x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2.0}>2.0x</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#171722] border border-[#2A2A38] rounded-lg px-2 py-1.5 shrink-0">
                  <span className="text-[10px] text-[#888899] font-mono">Duration:</span>
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
                  <span className="text-[10px] text-[#666677] font-mono">s</span>
                </div>
              </div>

              {/* Custom Live Testing Values */}
              <div className="border-t border-[#2A2A38]/50 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-teal-400" />
                  <span className="text-[10px] font-bold text-[#888899] uppercase tracking-wider">Test Customizations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#888899] mb-1">Primary Text</label>
                    <input type="text" value={customTexts.primary} onChange={(e) => setCustomTexts({ ...customTexts, primary: e.target.value })} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#888899] mb-1">Secondary Text</label>
                    <input type="text" value={customTexts.secondary} onChange={(e) => setCustomTexts({ ...customTexts, secondary: e.target.value })} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#888899] mb-1">Accent Text</label>
                    <input type="text" value={customTexts.accent} onChange={(e) => setCustomTexts({ ...customTexts, accent: e.target.value })} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar Right: Inspector Panel */}
          <aside className="w-80 border-l border-[#2A2A38] bg-[#121219] flex flex-col shrink-0 overflow-y-auto">
            {/* Section Header */}
            <div className="p-4 border-b border-[#2A2A38] bg-[#151520] shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#888899] flex items-center gap-1.5">
                <Settings size={13} className="text-teal-400" /> {selectedLayer ? "Layer Inspector" : "Template Settings"}
              </span>
            </div>

            {/* Inspector Body */}
            {selectedLayer ? (
              <div className="p-4 space-y-5">
                {/* Basic Layer details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Layer ID</label>
                    <input type="text" value={selectedLayer.id} onChange={(e) => handleUpdateLayerProperty("id", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono" />
                  </div>

                  {selectedLayer.kind === "text" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Static Text Content</label>
                        <input type="text" value={selectedLayer.content} onChange={(e) => handleUpdateLayerProperty("content", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Font Family</label>
                          <select value={selectedLayer.fontFamily} onChange={(e) => handleUpdateLayerProperty("fontFamily", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                            <option value="Poppins">Poppins</option>
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Roboto">Roboto</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Font Size (px)</label>
                          <input type="number" value={selectedLayer.fontSize} onChange={(e) => handleUpdateLayerProperty("fontSize", parseInt(e.target.value) || 24)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Text Color</label>
                          <div className="flex gap-1">
                            <input type="color" value={selectedLayer.color} onChange={(e) => handleUpdateLayerProperty("color", e.target.value)} className="w-8 h-8 rounded border border-[#2A2A38] bg-transparent outline-none cursor-pointer" />
                            <input type="text" value={selectedLayer.color} onChange={(e) => handleUpdateLayerProperty("color", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Align</label>
                          <select value={selectedLayer.align} onChange={(e) => handleUpdateLayerProperty("align", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Font Weight</label>
                        <input type="number" min={100} max={900} step={100} value={selectedLayer.fontWeight} onChange={(e) => handleUpdateLayerProperty("fontWeight", parseInt(e.target.value) || 400)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                        <p className="text-[9px] text-[#666677] mt-0.5">100 (Thin) to 900 (Black)</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Role / Placement Mapping</label>
                        <select value={selectedLayer.role || "none"} onChange={(e) => handleUpdateLayerProperty("role", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                          <option value="none">none (Use Static Content)</option>
                          <option value="primary">primary (Primary Text)</option>
                          <option value="secondary">secondary (Secondary Subtext)</option>
                          <option value="accent">accent (Attribution / Highlight)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Overflow Strategy</label>
                        <select value={selectedLayer.overflow || "clip"} onChange={(e) => handleUpdateLayerProperty("overflow", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                          <option value="clip">clip (Safety Net Clipping)</option>
                          <option value="wrap">wrap (Approach 5: Multi-line Word Wrap)</option>
                          <option value="shrink">shrink (Approach 1: Auto-Fit/Shrink Font Size)</option>
                          <option value="expand-panel">expand-panel (Approach 2: Dynamic Panel Expansion)</option>
                        </select>
                      </div>

                      {/* Background Panel Properties */}
                      <div className="border-t border-[#2A2A38]/50 pt-3 mt-2 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Background Panel (Optional)</h4>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Background Color</label>
                            <div className="flex gap-1">
                              <input type="color" value={selectedLayer.backgroundColor || "#000000"} onChange={(e) => handleUpdateLayerProperty("backgroundColor", e.target.value)} className="w-8 h-8 rounded border border-[#2A2A38] bg-transparent outline-none cursor-pointer" />
                              <input type="text" value={selectedLayer.backgroundColor || ""} onChange={(e) => handleUpdateLayerProperty("backgroundColor", e.target.value)} placeholder="none" className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500" />
                            </div>
                            <p className="text-[9px] text-[#666677] mt-0.5">Leave empty to disable</p>
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Opacity (0-1)</label>
                            <input type="number" min={0} max={1} step={0.1} value={selectedLayer.backgroundOpacity ?? 1} onChange={(e) => handleUpdateLayerProperty("backgroundOpacity", parseFloat(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Padding (px)</label>
                            <input type="number" min={0} value={selectedLayer.padding ?? 0} onChange={(e) => handleUpdateLayerProperty("padding", parseInt(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Border Radius (px)</label>
                            <input type="number" min={0} value={selectedLayer.backgroundRadius ?? 0} onChange={(e) => handleUpdateLayerProperty("backgroundRadius", parseInt(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Border Color</label>
                            <div className="flex gap-1">
                              <input type="color" value={selectedLayer.backgroundBorderColor || "#ffffff"} onChange={(e) => handleUpdateLayerProperty("backgroundBorderColor", e.target.value)} className="w-8 h-8 rounded border border-[#2A2A38] bg-transparent outline-none cursor-pointer" />
                              <input type="text" value={selectedLayer.backgroundBorderColor || ""} onChange={(e) => handleUpdateLayerProperty("backgroundBorderColor", e.target.value)} placeholder="none" className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#888899] mb-0.5">Border Width (px)</label>
                            <input type="number" min={0} value={selectedLayer.backgroundBorderWidth ?? 0} onChange={(e) => handleUpdateLayerProperty("backgroundBorderWidth", parseInt(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLayer.kind === "shape" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Shape Style</label>
                          <select value={selectedLayer.shape} onChange={(e) => handleUpdateLayerProperty("shape", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                            <option value="rect">Rectangle</option>
                            <option value="circle">Circle / Ellipse</option>
                            <option value="line">Line</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Fill Color</label>
                          <div className="flex gap-1">
                            <input type="color" value={selectedLayer.fill} onChange={(e) => handleUpdateLayerProperty("fill", e.target.value)} className="w-8 h-8 rounded border border-[#2A2A38] bg-transparent outline-none cursor-pointer" />
                            <input type="text" value={selectedLayer.fill} onChange={(e) => handleUpdateLayerProperty("fill", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1 py-1.5 text-xs font-mono text-center text-white outline-none focus:border-teal-500" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedLayer.kind === "image" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Image URL</label>
                      <input type="text" value={selectedLayer.url} onChange={(e) => handleUpdateLayerProperty("url", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                  )}
                </div>

                {/* Layer Layout Coordinates */}
                <div className="border-t border-[#2A2A38]/50 pt-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Layout Bounds (px)</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">X Coordinate</label>
                      <input type="number" value={selectedLayer.x} onChange={(e) => handleUpdateLayerProperty("x", parseInt(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Y Coordinate</label>
                      <input type="number" value={selectedLayer.y} onChange={(e) => handleUpdateLayerProperty("y", parseInt(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Width</label>
                      <input type="number" value={selectedLayer.width} onChange={(e) => handleUpdateLayerProperty("width", parseInt(e.target.value) || 50)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Height</label>
                      <input type="number" value={selectedLayer.height} onChange={(e) => handleUpdateLayerProperty("height", parseInt(e.target.value) || 50)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                  </div>
                </div>

                {/* Layer Transitions & Animations */}
                <div className="border-t border-[#2A2A38]/50 pt-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Transitions & Animations</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Entrance Preset</label>
                      <select value={selectedLayer.animation.in} onChange={(e) => handleUpdateLayerProperty("animation.in", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500">
                        <option value="fade">fade</option>
                        <option value="slide-up">slide-up</option>
                        <option value="slide-down">slide-down</option>
                        <option value="slide-left">slide-left</option>
                        <option value="slide-right">slide-right</option>
                        <option value="scale-in">scale-in</option>
                        <option value="blur-in">blur-in</option>
                        <option value="typewriter">typewriter</option>
                        <option value="none">none</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Duration (in)</label>
                      <input type="number" step={0.1} value={selectedLayer.animation.inDuration} onChange={(e) => handleUpdateLayerProperty("animation.inDuration", parseFloat(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Exit Preset</label>
                      <select value={selectedLayer.animation.out} onChange={(e) => handleUpdateLayerProperty("animation.out", e.target.value)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500">
                        <option value="fade">fade</option>
                        <option value="slide-down">slide-down</option>
                        <option value="slide-up">slide-up</option>
                        <option value="scale-out">scale-out</option>
                        <option value="blur-out">blur-out</option>
                        <option value="none">none</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#888899] mb-0.5">Duration (out)</label>
                      <input type="number" step={0.1} value={selectedLayer.animation.outDuration} onChange={(e) => handleUpdateLayerProperty("animation.outDuration", parseFloat(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#888899] mb-0.5">Hold Timing</label>
                    <select value={selectedLayer.animation.hold} onChange={(e) => handleUpdateLayerProperty("animation.hold", e.target.value === "full" ? "full" : parseFloat(e.target.value) || 0)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1 text-xs text-white outline-none focus:border-teal-500">
                      <option value="full">hold full timeline between transition</option>
                      <option value={1}>1.0 second</option>
                      <option value={2}>2.0 seconds</option>
                    </select>
                  </div>
                </div>

                {/* Keyframe Editor */}
                <div className="border-t border-[#2A2A38]/50 pt-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888899] flex items-center gap-1.5">
                      <Clock size={13} className="text-purple-400" /> Keyframe Animation
                    </h4>
                    <button onClick={() => setShowKeyframeEditor(!showKeyframeEditor)} className="text-[9px] text-purple-400 hover:text-purple-300 font-semibold">
                      {showKeyframeEditor ? "Hide" : "Show"}
                    </button>
                  </div>

                  {showKeyframeEditor && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] text-[#888899] mb-1">Animate Property</label>
                        <select value={selectedProperty || ""} onChange={(e) => setSelectedProperty(e.target.value || null)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500">
                          <option value="">Select property...</option>
                          {selectedLayer.kind === "text" && (
                            <>
                              <option value="fontSize">Font Size</option>
                              <option value="fontWeight">Font Weight</option>
                              <option value="color">Text Color</option>
                              <option value="backgroundColor">Background Color</option>
                              <option value="backgroundOpacity">Background Opacity</option>
                              <option value="backgroundRadius">Background Radius</option>
                              <option value="padding">Padding</option>
                              <option value="backgroundBorderColor">Border Color</option>
                              <option value="backgroundBorderWidth">Border Width</option>
                            </>
                          )}
                          {selectedLayer.kind === "shape" && (
                            <>
                              <option value="fill">Fill Color</option>
                              {selectedLayer.stroke && (
                                <>
                                  <option value="stroke.color">Stroke Color</option>
                                  <option value="stroke.width">Stroke Width</option>
                                </>
                              )}
                            </>
                          )}
                          <option value="x">X Position</option>
                          <option value="y">Y Position</option>
                          <option value="width">Width</option>
                          <option value="height">Height</option>
                          <option value="opacity">Opacity (Display)</option>
                        </select>
                      </div>

                      {selectedProperty && (
                        <>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAddKeyframe(selectedProperty)} className="flex-1 rounded bg-purple-500 hover:bg-purple-400 px-3 py-2 text-[10px] font-bold text-white transition-colors flex items-center justify-center gap-1.5">
                              <Plus size={12} /> Add Keyframe at {currentTime.toFixed(2)}s
                            </button>
                          </div>

                          {(() => {
                            const keyframes = getPropertyKeyframes(selectedProperty);
                            if (!keyframes || keyframes.length === 0) {
                              return (
                                <div className="rounded border border-dashed border-[#2A2A38] p-3 text-center">
                                  <p className="text-[10px] text-[#666677]">No keyframes yet. Click "Add Keyframe" to animate this property over time.</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                <p className="text-[9px] text-[#888899] uppercase font-bold tracking-wider">Keyframes ({keyframes.length})</p>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {keyframes.map((kf, idx) => (
                                    <div key={idx} className="rounded border border-[#2A2A38] bg-[#0E0E14] p-2.5 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-purple-400 font-bold">{kf.time.toFixed(2)}s</span>
                                        <button onClick={() => handleRemoveKeyframe(selectedProperty, kf.time)} className="text-[#666677] hover:text-red-400 transition-colors">
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[8px] text-[#666677] mb-0.5">Value</label>
                                          <input
                                            type={typeof kf.value === "number" ? "number" : "text"}
                                            value={kf.value}
                                            onChange={(e) => {
                                              const newValue = typeof kf.value === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
                                              handleUpdateKeyframe(selectedProperty, kf.time, newValue);
                                            }}
                                            className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[8px] text-[#666677] mb-0.5">Easing</label>
                                          <select value={kf.easing || "linear"} onChange={(e) => handleUpdateKeyframe(selectedProperty, kf.time, kf.value, e.target.value as TemplateEasingFunction)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-1.5 py-1 text-[10px] text-white outline-none focus:border-purple-500">
                                            <option value="linear">Linear</option>
                                            <option value="ease">Ease</option>
                                            <option value="ease-in">Ease In</option>
                                            <option value="ease-out">Ease Out</option>
                                            <option value="ease-in-out">Ease In-Out</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Template Metadata Inspector
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Template ID</label>
                  <input type="text" value={template.id} onChange={(e) => setTemplate(prev => prev ? { ...prev, id: e.target.value } : null)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Title Name</label>
                  <input type="text" value={template.label} onChange={(e) => {
                    const val = e.target.value;
                    setTemplate(prev => prev ? { ...prev, label: val, id: toKebabCase(val) } : null);
                  }} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Category</label>
                  <select value={template.category} onChange={(e) => {
                    const val = e.target.value as TemplateCategory;
                    setTemplate(prev => prev ? { ...prev, category: val } : null);
                  }} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Timeline Duration (seconds)</label>
                  <input type="number" step={0.1} value={template.duration} onChange={(e) => setTemplate(prev => prev ? { ...prev, duration: parseFloat(e.target.value) || 3.0 } : null)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Width (px)</label>
                    <input type="number" value={template.canvasWidth} onChange={(e) => setTemplate(prev => prev ? { ...prev, canvasWidth: parseInt(e.target.value) || 1920 } : null)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899] mb-1">Height (px)</label>
                    <input type="number" value={template.canvasHeight} onChange={(e) => setTemplate(prev => prev ? { ...prev, canvasHeight: parseInt(e.target.value) || 1080 } : null)} className="w-full rounded border border-[#2A2A38] bg-[#09090D] px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500 font-mono" />
                  </div>
                </div>

                <div className="border-t border-[#2A2A38]/50 pt-4 flex flex-col gap-2">
                  <p className="text-[10px] text-[#888899] leading-relaxed">Adjusting template dimensions affects coordinates mapping. Canvas templates default to 1920x1080 resolution.</p>
                </div>
              </div>
            )}
          </aside>
        </div>
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
          placement={publishPlacement}
          thumbnailFrame={thumbnailFrame}
          durationFrames={Math.round(template.duration * 30)}
          validationErrors={{}}
          lottieData={template} // pass full template
          thumbnailDataUrl={thumbnailDataUrl || undefined}
          previewVideoUrl={publishVideoDataUrl || undefined}
          isGeneratingVideo={isGeneratingPublishVideo}
          width={template.canvasWidth}
          height={template.canvasHeight}
          onTemplateIdChange={(v) => setTemplate(prev => prev ? { ...prev, id: v } : null)}
          onTemplateNameChange={(v) => setTemplate(prev => prev ? { ...prev, label: v, id: toKebabCase(v) } : null)}
          onCategoryChange={(v) => setTemplate(prev => prev ? { ...prev, category: v } : null)}
          onDescriptionChange={setPublishDescription}
          onTagsInputChange={setPublishTagsInput}
          onPlacementChange={setPublishPlacement}
          onThumbnailFrameChange={setThumbnailFrame}
          onUseCurrentFrame={() => setThumbnailFrame(Math.round(currentTime * 30))}
          onPreviewThumbnail={async () => {
            const url = await captureThumbnail();
            setThumbnailDataUrl(url);
          }}
          onPublish={handlePublish}
          publishStatus={publishStatus}
          publishMessage={publishMessage}
          publishPrUrl={publishPrUrl}
        />
      )}

      {/* Preview Video Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewVideoUrl(null)}>
          <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl border border-[#2A2A38] bg-[#121219] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A38]">
                <div className="flex items-center gap-2">
                  <Play size={18} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Preview Video</h3>
                </div>
                <button onClick={() => setPreviewVideoUrl(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#2A2A38] transition-colors">
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Video Player */}
              <div className="p-6 bg-[#09090D]">
                <video src={previewVideoUrl} controls autoPlay loop className="w-full rounded-lg border border-[#2A2A38]" style={{ maxHeight: "70vh" }} />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#2A2A38] flex items-center justify-between">
                <p className="text-[10px] text-[#888899]">Preview of exported .webm video • {template?.duration.toFixed(1)}s @ 30fps</p>
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
