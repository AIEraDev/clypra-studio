import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getStudioApiBaseUrl } from "../../services/apiConfig";
import { getStoredAuthToken } from "../../services/authSession";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useAudioCatalog } from "./hooks/useAudioCatalog";
import { useAudioIngest } from "./hooks/useAudioIngest";
import type { AudioAsset } from "./types";
import {
  AUDIO_CATEGORIES,
  CATEGORY_TAG_SUGGESTIONS,
  type AudioCategory,
} from "./types";

function toKebab(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AudioLabView() {
  const isAdmin = useIsAdmin();

  // Mode: "upload" vs "catalog"
  const [viewMode, setViewMode] = useState<"upload" | "catalog">("upload");
  const catalog = useAudioCatalog({ enabled: viewMode === "catalog" });

  // Audio ingest state machine
  const ingest = useAudioIngest(false /* Start empty, no mock data */);

  // Cover art
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<AudioCategory>("music");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [licenseType, setLicenseType] = useState("cc0");
  const [requireCredit, setRequireCredit] = useState(false);
  const [sourceProvider, setSourceProvider] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tempo, setTempo] = useState<number | string>("");
  const [seamlessLoop, setSeamlessLoop] = useState(false);
  const [licenseDeed, setLicenseDeed] = useState("");
  const [directPublish, setDirectPublish] = useState(false);

  // Tag management state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Upload state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [publishingTrackId, setPublishingTrackId] = useState<string | null>(null);

  // Catalog preview
  const [catalogPlayingId, setCatalogPlayingId] = useState<string | null>(null);
  const catalogAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clear tags when category changes
  useEffect(() => {
    setSelectedTags([]);
  }, [selectedCategory]);

  // Tag utility functions
  const validateTag = (tag: string): string | null => {
    const cleaned = tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleaned || cleaned.length > 30) return null;
    return cleaned;
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = () => {
    const validated = validateTag(customTagInput);
    if (!validated) {
      toast.error("Invalid tag format. Use lowercase and hyphens only.");
      return;
    }
    if (selectedTags.includes(validated)) {
      toast.error("Tag already added.");
      return;
    }
    setSelectedTags((prev) => [...prev, validated]);
    setCustomTagInput("");
    toast.success(`Tag "${validated}" added`);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  // Derived validation
  const isExtracted = ingest.isExtractedFromVideo;
  const hasDoneFile = ingest.status === "done";
  const rightsOk = !isExtracted || ingest.rightsConfirmed;
  const formValid =
    hasDoneFile &&
    rightsOk &&
    name.trim() !== "" &&
    slug.trim() !== "" &&
    author.trim() !== "" &&
    sourceProvider.trim() !== "" &&
    sourceUrl.trim() !== "";

  // Footer status text
  let statusText = "";
  let footerDotClass = "w-2 h-2 rounded-full shrink-0";
  if (ingest.status === "loading-engine") {
    statusText = "Preparing in-browser extractor (ffmpeg.wasm)…";
    footerDotClass += " bg-primary animate-pulse";
  } else if (ingest.status === "extracting") {
    statusText = `Extracting audio stream from ${ingest.metadata.name}…`;
    footerDotClass += " bg-primary animate-pulse";
  } else if (ingest.status === "error") {
    statusText = "Extraction failed — resolve the error above before uploading";
    footerDotClass += " bg-error";
  } else if (ingest.status === "idle") {
    statusText = "Select an audio or video file to begin";
    footerDotClass += " bg-outline";
  } else if (!hasDoneFile) {
    statusText = "Action needed: Please provide an audio master asset";
    footerDotClass += " bg-outline";
  } else if (isExtracted && !ingest.rightsConfirmed) {
    statusText = "Action required: Confirm video extraction copyright rights";
    footerDotClass += " bg-tertiary-container";
  } else if (!name.trim() || !slug.trim()) {
    statusText = "Error: Display name and slug are required";
    footerDotClass += " bg-error";
  } else if (!author.trim()) {
    statusText = "Error: Creator / rights holder is required";
    footerDotClass += " bg-error";
  } else if (!sourceProvider.trim() || !sourceUrl.trim()) {
    statusText = "Error: Source provider and URL required";
    footerDotClass += " bg-error";
  } else if (isUploaded) {
    statusText = "Audio published successfully to catalog";
    footerDotClass += " bg-primary";
  } else {
    statusText = `Ready to upload (All required fields valid${selectedTags.length > 0 ? `, ${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} selected` : ""})`;
    footerDotClass += " bg-primary";
  }

  // File status indicator in section header
  let fileStatusLabel = "Ready";
  let fileStatusClass = "font-caption text-caption flex items-center gap-1";
  if (ingest.status === "idle") {
    fileStatusLabel = "Awaiting file";
    fileStatusClass += " text-outline";
  } else if (ingest.status === "loading-engine") {
    fileStatusLabel = "Loading engine";
    fileStatusClass += " text-primary";
  } else if (ingest.status === "extracting") {
    fileStatusLabel = `Extracting ${ingest.extractProgress}%`;
    fileStatusClass += " text-primary";
  } else if (ingest.status === "done") {
    fileStatusLabel = "Ready";
    fileStatusClass += " text-primary";
  } else if (ingest.status === "error") {
    fileStatusLabel = "Error";
    fileStatusClass += " text-error";
  }

  // Clean up cover preview URL
  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  // Handle name change and auto slug
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === toKebab(name)) {
      setSlug(toKebab(val));
    }
  };

  // Handle file picked from the unified dropzone
  const handleMediaFile = (file: File) => {
    setIsUploaded(false);
    ingest.ingestFile(file, (suggestedName, suggestedSlug) => {
      if (!name) {
        setName(suggestedName);
        setSlug(suggestedSlug);
      }
    });
  };

  // Handle Cover File selection
  const handleCoverSelect = (file: File | null) => {
    if (!file) return;
    setCoverFile(file);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  // Reset form
  const handleReset = () => {
    ingest.resetAll();
    setCoverFile(null);
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setName("");
    setSlug("");
    setSelectedCategory("music");
    setDescription("");
    setAuthor("");
    setLicenseType("cc0");
    setRequireCredit(false);
    setSourceProvider("");
    setSourceUrl("");
    setTempo("");
    setSeamlessLoop(false);
    setLicenseDeed("");
    setDirectPublish(false);
    setIsUploaded(false);
    setIsProcessing(false);
    setSelectedTags([]);
    setCustomTagInput("");
    toast.success("Workbench reset successfully");
  };

  // Upload Audio Submission
  const handleUploadClick = async () => {
    if (!isAdmin) {
      toast.error(
        "Admin access required. Only administrators can upload audio to production.",
      );
      return;
    }

    if (!hasDoneFile) {
      toast.error("Please drop or browse an audio or video file");
      return;
    }

    if (isExtracted && !ingest.rightsConfirmed) {
      toast.error(
        "Please confirm you have the rights to extract and publish this audio",
      );
      return;
    }

    if (!name.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!author.trim()) {
      toast.error("Creator / rights holder is required");
      return;
    }

    if (!sourceProvider.trim() || !sourceUrl.trim()) {
      toast.error("Source provider and URL are required");
      return;
    }

    setIsProcessing(true);

    try {
      let audioFileDataUrl = "";
      if (ingest.audioFile) {
        audioFileDataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result || ""));
          reader.onerror = rej;
          reader.readAsDataURL(ingest.audioFile!);
        });
      }

      let coverArtDataUrl: string | undefined = undefined;
      if (coverFile) {
        coverArtDataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result || ""));
          reader.onerror = rej;
          reader.readAsDataURL(coverFile);
        });
      }

      const payload = {
        audio: {
          id: slug.trim(),
          name: name.trim(),
          category: selectedCategory.toLowerCase(),
          description: description.trim(),
          tags: [...new Set([selectedCategory, ...selectedTags])],
          author: author.trim(),
          duration: ingest.metadata.duration || 222,
          bpm: tempo ? Number(tempo) : 124,
          loopable: seamlessLoop,
          license: {
            type: licenseType,
            url: licenseDeed.trim() || undefined,
            attributionRequired: requireCredit,
          },
          source: {
            provider: sourceProvider.trim(),
            url: sourceUrl.trim(),
          },
          safety: {
            status: "approved" as const,
            reviewedAt: new Date().toISOString(),
          },
          published: directPublish,
          fileName: ingest.metadata.name || `${slug}.wav`,
        },
        audioFileDataUrl,
        coverArtDataUrl,
      };

      const token = getStoredAuthToken();
      const res = await fetch(`${getStudioApiBaseUrl()}/audio/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          (errJson as any).error ||
            (errJson as any).message ||
            `Upload failed (${res.status}: ${res.statusText})`,
        );
      }

      setIsUploaded(true);
      toast.success("Audio published successfully to Clypra catalog!");
      catalog.refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio in catalog
  const toggleCatalogPlay = (track: AudioAsset) => {
    if (catalogPlayingId === track.id) {
      catalogAudioRef.current?.pause();
      setCatalogPlayingId(null);
      return;
    }

    if (catalogAudioRef.current) {
      catalogAudioRef.current.pause();
    }

    const audio = new Audio(track.audioUrl);
    catalogAudioRef.current = audio;
    audio.onended = () => setCatalogPlayingId(null);
    audio
      .play()
      .then(() => {
        setCatalogPlayingId(track.id);
      })
      .catch(() => {
        toast.error("Audio playback stream failed");
        setCatalogPlayingId(null);
      });
  };

  // Load track from catalog into the upload/authoring form
  const handleLoadTrackFromCatalog = (track: AudioAsset) => {
    setName(track.name);
    setSlug(track.id);
    const catMatch = AUDIO_CATEGORIES.find(
      (c) => c.toLowerCase() === String(track.category).toLowerCase(),
    );
    if (catMatch) setSelectedCategory(catMatch);
    setDescription(track.description || "");
    setAuthor(track.author || "Clypra Artist");
    setLicenseType((track.license?.type as string) || "cc0");
    setRequireCredit(!!track.license?.attributionRequired);
    setSourceProvider(track.source?.provider || "Clypra Studio");
    setSourceUrl(track.source?.url || "https://clypra.abdulkabirmusa.com");
    if (track.bpm) setTempo(track.bpm);
    setSeamlessLoop(!!track.loopable);
    setLicenseDeed(track.license?.url || "");
    setSelectedTags(track.tags || []);
    // Populate ingest metadata for catalog-loaded track
    ingest.setMetadata({
      name: `${track.id}.wav`,
      format: "WAV",
      size: "18.4 MB",
      duration: track.duration || 180,
      durationFormatted: formatDuration(track.duration || 180),
      spec: "48kHz / 24-bit stereo",
    });
    ingest.setIsExtractedFromVideo(false);
    ingest.setStatus("done");
    setViewMode("upload");
    toast.success(`Loaded "${track.name}" into editor`);
  };

  // Admin publish/unpublish toggle
  const handleTogglePublish = async (
    track: AudioAsset,
    nextPublishState: boolean,
  ) => {
    if (!isAdmin) {
      toast.error("Only administrators can change audio publication status.");
      return;
    }
    setPublishingTrackId(track.id);
    try {
      await catalog.togglePublish(track, nextPublishState);
      toast.success(
        nextPublishState
          ? `"${track.name}" published to catalog`
          : `"${track.name}" unpublished successfully`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update publication status",
      );
    } finally {
      setPublishingTrackId(null);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-low border-b border-outline-variant">
        <div className="h-14 max-w-[960px] mx-auto px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-xs select-none tracking-tight">
              <Link
                to="/studio"
                className="font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors"
              >
                Studio
              </Link>
              <span className="font-label-sm text-label-sm text-outline-variant font-normal">
                /
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
                Audio Lab
              </span>
            </div>
            <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
            <nav
              className="flex items-center gap-space-md h-14"
              data-active-classes="text-primary border-b-2 border-primary"
            >
              <button
                type="button"
                aria-current={viewMode === "upload" ? "page" : undefined}
                className={`h-14 flex items-center px-space-xs font-label-md transition-colors cursor-pointer ${
                  viewMode === "upload"
                    ? "text-primary border-b-2 border-primary"
                    : "text-label-md text-on-surface-variant hover:text-on-surface"
                }`}
                data-path="upload"
                onClick={() => setViewMode("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                aria-current={viewMode === "catalog" ? "page" : undefined}
                className={`h-14 flex items-center px-space-xs font-label-md transition-colors cursor-pointer ${
                  viewMode === "catalog"
                    ? "text-primary border-b-2 border-primary"
                    : "text-label-md text-on-surface-variant hover:text-on-surface"
                }`}
                data-path="catalog"
                onClick={() => setViewMode("catalog")}
              >
                Catalog
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <button
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-error transition-colors px-space-xs py-space-xs cursor-pointer"
              id="reset-all-btn"
              type="button"
              title="Clear current track and reset form"
              onClick={handleReset}
            >
              Reset
            </button>
            <div className="h-3 w-px bg-outline-variant"></div>
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer"
              title={isAdmin ? "Admin User" : "User Profile"}
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full pt-14 bg-background min-h-screen">
        {viewMode === "upload" ? (
          <div className="flex flex-col w-full pb-48">
            <div className="w-full max-w-[720px] mx-auto px-4 sm:px-6 pt-6 h-[calc(100dvh-8rem)] overflow-auto">
              <div className="flex flex-col gap-8">
                {/* SECTION 1: FILE UPLOAD */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        File
                      </span>
                      <span className="font-caption text-caption text-outline">
                        Audio or video master &amp; artwork
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={fileStatusClass}
                        id="file-status-indicator"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            ingest.status === "idle"
                              ? "bg-outline"
                              : ingest.status === "error"
                                ? "bg-error"
                                : "bg-primary animate-pulse"
                          }`}
                        ></span>
                        <span id="file-status-label">{fileStatusLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dropzones Row — always visible */}
                  <div
                    className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3"
                    id="dropzones-container"
                  >
                    {/* Unified Audio & Video Dropzone */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        id="main-dropzone"
                        htmlFor="media-input"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleMediaFile(file);
                        }}
                        className="group relative flex flex-col items-center justify-center min-h-[120px] px-4 py-5 rounded-lg border border-dashed border-outline-variant hover:border-primary bg-surface-container-low transition-colors cursor-pointer select-none"
                      >
                        <input
                          accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.mp4,.mov,.webm,.mkv,audio/*,video/*"
                          className="sr-only"
                          id="media-input"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMediaFile(file);
                            // Reset so same file can be re-selected
                            e.target.value = "";
                          }}
                        />
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <div className="flex items-center gap-1.5 text-outline group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[22px]">
                              video_file
                            </span>
                            <span className="text-outline-variant">/</span>
                            <span className="material-symbols-outlined text-[22px]">
                              audiotrack
                            </span>
                          </div>
                          <p className="font-label-md text-label-md text-on-surface">
                            Drop an audio or video file.{" "}
                            <span className="text-primary underline underline-offset-2">
                              browse
                            </span>
                          </p>
                          <p className="font-caption text-caption text-outline">
                            Audio is extracted from video automatically. MP3,
                            WAV, M4A, FLAC, MP4, MOV, WEBM (Max 500 MB)
                          </p>
                        </div>
                      </label>
                      <div className="flex items-center justify-between px-1">
                        <p className="font-caption text-[11px] text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-outline">
                            verified_user
                          </span>
                          Only extract audio from videos you own or are licensed
                          to use.
                        </p>
                        <span
                          className={`${
                            ingest.isLargeFile ? "flex" : "hidden"
                          } font-caption text-[11px] text-tertiary-container items-center gap-1`}
                          id="large-file-hint"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            hourglass_top
                          </span>
                          Large file (&gt;200MB): extraction may take a few
                          minutes
                        </span>
                      </div>
                    </div>

                    {/* Cover Artwork Thumbnail Target */}
                    <label
                      htmlFor="cover-input"
                      className="group relative flex flex-col items-center justify-center h-[120px] sm:h-auto rounded-lg border border-dashed border-outline-variant hover:border-primary bg-surface-container-low transition-colors cursor-pointer select-none text-center p-2 overflow-hidden"
                    >
                      <input
                        ref={coverInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        id="cover-input"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverSelect(file);
                        }}
                      />
                      {coverPreviewUrl ? (
                        <img
                          src={coverPreviewUrl}
                          alt="Cover art preview"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                            add_photo_alternate
                          </span>
                          <span className="font-caption text-caption text-on-surface-variant mt-1 leading-tight">
                            Cover art
                          </span>
                          <span className="font-caption text-[10px] text-outline leading-tight">
                            Optional
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* STATE: LOADING ENGINE (WASM) */}
                  <div
                    id="state-loading-engine"
                    className={`${
                      ingest.status === "loading-engine" ? "flex" : "hidden"
                    } items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-container border border-outline-variant animate-pulse`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-outline-variant">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          Preparing extractor…
                        </span>
                        <span className="font-caption text-caption text-outline">
                          Loading WebAssembly audio engine (ffmpeg.wasm
                          client-side sandbox)
                        </span>
                      </div>
                    </div>
                    <span className="font-caption text-caption text-primary font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary-container/20">
                      WASM Readying
                    </span>
                  </div>

                  {/* STATE: EXTRACTING PROGRESS ROW */}
                  <div
                    id="state-extracting"
                    className={`${
                      ingest.status === "extracting" ? "flex" : "hidden"
                    } flex-col gap-2 p-3.5 rounded-lg bg-surface-container border border-outline-variant`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-primary shrink-0 border border-outline-variant">
                          <span className="material-symbols-outlined text-[18px] animate-spin">
                            sync
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-label-md text-label-md text-on-surface truncate"
                              id="extracting-filename"
                            >
                              {ingest.originalVideoFile?.name ?? "video.mp4"}
                            </span>
                            <span className="font-caption text-[11px] px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-mono shrink-0">
                              EXTRACTING
                            </span>
                          </div>
                          <span
                            className="font-caption text-caption text-outline"
                            id="extracting-status-sub"
                          >
                            Demuxing AAC audio stream from container…
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="font-label-md font-mono text-primary font-semibold"
                          id="extract-percent-label"
                        >
                          {ingest.extractProgress}%
                        </span>
                        <button
                          id="cancel-extract-btn"
                          className="font-label-sm text-label-sm text-outline hover:text-error transition-colors px-2 py-1 rounded hover:bg-surface-container-highest cursor-pointer"
                          type="button"
                          onClick={() => ingest.cancelExtraction()}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {/* Accessible Progress Bar */}
                    <div
                      aria-label="Audio extraction progress"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={ingest.extractProgress}
                      className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-outline-variant"
                      id="extract-progressbar"
                      role="progressbar"
                    >
                      <div
                        className="bg-primary h-full transition-all duration-200 rounded-full"
                        id="extract-progress-fill"
                        style={{ width: `${ingest.extractProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between font-caption text-[11px] text-outline">
                      <span id="extract-elapsed">
                        Elapsed: {formatElapsed(ingest.elapsedSeconds)}
                      </span>
                      <span>Client-side DSP (No data leaves your device)</span>
                    </div>
                  </div>

                  {/* STATE: EXTRACTED / AUDIO DONE STATE ROW */}
                  <div
                    id="file-row"
                    className={`${
                      ingest.status === "done" ? "flex" : "hidden"
                    } items-center justify-between gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant text-primary"
                        id="file-icon-box"
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          id="file-icon"
                        >
                          audiotrack
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-label-md text-label-md text-on-surface truncate"
                            id="file-display-name"
                          >
                            {ingest.metadata.name}
                          </span>
                          <span
                            className="font-caption text-caption px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-mono shrink-0"
                            id="file-format-badge"
                          >
                            {ingest.metadata.format}
                          </span>
                          {ingest.isExtractedFromVideo && (
                            <span
                              className="inline-flex items-center gap-1 font-caption text-[11px] px-2 py-0.5 rounded-full bg-secondary-container/20 border border-secondary text-secondary shrink-0"
                              id="extracted-badge"
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                video_library
                              </span>
                              Extracted from video
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-2 font-caption text-caption text-outline"
                          id="file-metadata-row"
                        >
                          <span id="file-meta-size">
                            {ingest.metadata.size}
                          </span>
                          <span>•</span>
                          <span id="file-meta-duration">
                            {ingest.metadata.durationFormatted}
                          </span>
                          <span>•</span>
                          <span
                            className="text-on-surface-variant"
                            id="file-meta-spec"
                          >
                            {ingest.metadata.spec}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        id="download-audio-btn"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface-container-highest text-on-surface hover:text-primary hover:border-primary transition-colors border border-outline-variant cursor-pointer"
                        title="Download standalone audio file"
                        type="button"
                        onClick={() => ingest.downloadAudio()}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          download
                        </span>
                        <span className="hidden sm:inline">Download audio</span>
                      </button>
                      <button
                        id="replace-file-btn"
                        className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface-container-highest text-on-surface hover:text-primary transition-colors border border-outline-variant cursor-pointer"
                        type="button"
                        onClick={() =>
                          document.getElementById("media-input")?.click()
                        }
                      >
                        Replace
                      </button>
                      <button
                        id="remove-file-btn"
                        aria-label="Remove audio file"
                        className="p-1 rounded text-outline hover:text-error transition-colors cursor-pointer"
                        type="button"
                        onClick={() => ingest.removeFile()}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* STATE: ERROR INLINE ALERT */}
                  <div
                    id="state-error"
                    className={`${
                      ingest.status === "error" ? "flex" : "hidden"
                    } flex-col gap-2 p-3.5 rounded-lg bg-error-container/20 border border-error/50 text-on-surface`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
                          error
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="font-label-md text-label-md text-error font-semibold"
                            id="error-title"
                          >
                            {ingest.errorTitle}
                          </span>
                          <p
                            className="font-body-sm text-body-sm text-on-surface-variant"
                            id="error-message"
                          >
                            {ingest.errorMessage}
                          </p>
                        </div>
                      </div>
                      <button
                        id="dismiss-error-btn"
                        aria-label="Dismiss alert"
                        className="text-outline hover:text-on-surface p-1 cursor-pointer"
                        type="button"
                        onClick={() => ingest.setStatus("idle")}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          close
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/40">
                      <button
                        id="error-retry-btn"
                        className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface-container-high text-on-surface hover:text-primary border border-outline-variant transition-colors flex items-center gap-1 cursor-pointer"
                        type="button"
                        onClick={() =>
                          ingest.retry((n, s) => {
                            if (!name) {
                              setName(n);
                              setSlug(s);
                            }
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          refresh
                        </span>
                        Retry
                      </button>
                      <button
                        id="error-another-btn"
                        className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-transparent text-outline hover:text-on-surface transition-colors cursor-pointer"
                        type="button"
                        onClick={() => {
                          ingest.setStatus("idle");
                          document.getElementById("media-input")?.click();
                        }}
                      >
                        Choose another file
                      </button>
                    </div>
                  </div>
                </section>

                {/* SECTION 2: DETAILS FORM */}
                <section className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Details
                      </span>
                      <span className="font-caption text-caption text-outline">
                        Metadata, attribution &amp; indexing
                      </span>
                    </div>
                    <span className="font-caption text-caption text-outline">
                      * Required
                    </span>
                  </div>

                  {/* VIDEO EXTRACTION RIGHTS SAFEGUARD */}
                  {ingest.isExtractedFromVideo && (
                    <div
                      className="flex flex-col gap-2 p-3.5 rounded-lg bg-surface-container-low border border-primary/40 transition-all"
                      id="rights-safeguard-box"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                          policy
                        </span>
                        <div className="flex flex-col gap-1 w-full">
                          <label
                            className="flex items-start gap-2.5 cursor-pointer select-none"
                            htmlFor="rights-confirmation"
                          >
                            <input
                              className="w-4 h-4 mt-0.5 rounded bg-surface-container-lowest border-outline text-primary focus:ring-0 focus:outline-none accent-[#00e5bf] cursor-pointer"
                              id="rights-confirmation"
                              required
                              type="checkbox"
                              checked={ingest.rightsConfirmed}
                              onChange={(e) =>
                                ingest.setRightsConfirmed(e.target.checked)
                              }
                            />
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-medium">
                                I own this content or have the rights to publish
                                its audio.{" "}
                                <span className="text-primary">*</span>
                              </span>
                              <span className="font-caption text-caption text-outline">
                                Required for assets extracted from video
                                containers to prevent copyright infringement.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two-column Grid Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Display Name */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                        htmlFor="track-name"
                      >
                        Display name <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline"
                        id="track-name"
                        placeholder="e.g. Sub Pulse Alpha"
                        required
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </div>

                    {/* Slug Field */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                        htmlFor="track-slug"
                      >
                        Slug <span className="text-primary">*</span>
                      </label>
                      <div className="flex items-center h-10 rounded bg-surface-container-low border border-outline-variant focus-within:border-primary overflow-hidden transition-colors">
                        <span className="px-3 font-caption text-caption text-outline bg-surface-container-highest/60 select-none border-r border-outline-variant flex items-center h-full">
                          audio/
                        </span>
                        <input
                          className="w-full h-full px-3 bg-transparent text-on-surface font-body-md text-body-md focus:outline-none"
                          id="track-slug"
                          required
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Chip Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                      Category <span className="text-primary">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5" id="category-group">
                      {AUDIO_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        // Display name mapping
                        const displayName =
                          cat === "ui-interface"
                            ? "UI & Interface"
                            : cat
                                .split("-")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(" ");
                        return (
                          <button
                            key={cat}
                            className={`cat-chip px-3 py-1.5 rounded text-label-sm font-label-sm border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-surface-container border-primary text-primary"
                                : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline"
                            }`}
                            data-selected={isSelected ? "true" : "false"}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                          >
                            {displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tag Suggestions Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface-variant">
                        Tags{" "}
                        {selectedTags.length > 0 && `(${selectedTags.length})`}
                      </label>
                      <span className="font-caption text-caption text-outline">
                        Select suggested or add custom
                      </span>
                    </div>

                    {/* Suggested Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_TAG_SUGGESTIONS[selectedCategory].map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-3 py-1.5 rounded text-label-sm font-label-sm border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary-container border-primary text-primary"
                                : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline"
                            }`}
                            aria-pressed={isSelected}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Tag Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomTag();
                          }
                        }}
                        placeholder="Add custom tag (kebab-case)"
                        className="flex-1 h-10 px-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline"
                        aria-label="Custom tag input"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-4 py-2 rounded bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant hover:border-outline transition-colors text-label-sm font-label-sm cursor-pointer"
                        aria-label="Add custom tag"
                      >
                        Add
                      </button>
                    </div>

                    {/* Selected Tags Display */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 rounded bg-surface-container-low border border-outline-variant">
                        {selectedTags.map((tag) => (
                          <div
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-container border border-primary text-primary text-label-sm font-label-sm"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-error transition-colors cursor-pointer"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                close
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description with Character Counter */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant"
                        htmlFor="track-description"
                      >
                        Description{" "}
                        <span className="font-caption text-caption text-outline">
                          (Optional)
                        </span>
                      </label>
                      <span
                        className="font-caption text-caption text-outline"
                        id="char-counter"
                      >
                        {description.length} / 300
                      </span>
                    </div>
                    <textarea
                      className="w-full p-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline resize-none"
                      id="track-description"
                      maxLength={300}
                      placeholder="Key characteristics, instrumentation, feel, and suggested synchronizations..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Creator / Rights Holder */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                      htmlFor="track-creator"
                    >
                      Creator / rights holder{" "}
                      <span className="text-primary">*</span>
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors"
                      id="track-creator"
                      required
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </div>

                  {/* License & Credit Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                        htmlFor="track-license"
                      >
                        License <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <select
                          className="w-full h-10 px-3 pr-8 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                          id="track-license"
                          value={licenseType}
                          onChange={(e) => setLicenseType(e.target.value)}
                        >
                          <option value="cc0">
                            Creative Commons Zero (CC0)
                          </option>
                          <option value="cc-by">
                            Creative Commons Attribution (CC-BY 4.0)
                          </option>
                          <option value="commercial-royalty-free">
                            Studio Royalty-Free Commercial
                          </option>
                          <option value="exclusive">
                            Exclusive Production License
                          </option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 h-10 px-3 rounded bg-surface-container-low border border-outline-variant hover:border-outline cursor-pointer select-none transition-colors">
                      <input
                        className="w-4 h-4 rounded bg-surface-container-lowest border-outline-variant text-primary focus:ring-0 focus:outline-none accent-[#00e5bf] cursor-pointer"
                        id="require-credit"
                        type="checkbox"
                        checked={requireCredit}
                        onChange={(e) => setRequireCredit(e.target.checked)}
                      />
                      <span className="font-label-md text-label-md text-on-surface">
                        Require credit in commercial releases
                      </span>
                    </label>
                  </div>

                  {/* Source Provider & Source URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                        htmlFor="source-provider"
                      >
                        Source provider <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors"
                        id="source-provider"
                        required
                        type="text"
                        value={sourceProvider}
                        onChange={(e) => setSourceProvider(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1"
                        htmlFor="source-url"
                      >
                        Source URL (https){" "}
                        <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors"
                        id="source-url"
                        pattern="https://.*"
                        required
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Collapsible Advanced Details */}
                  <details
                    className="group rounded-lg bg-surface-container-low border border-outline-variant overflow-hidden"
                    open
                  >
                    <summary className="flex items-center justify-between p-3.5 cursor-pointer select-none text-on-surface hover:text-primary transition-colors">
                      <span className="font-label-md text-label-md font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          tune
                        </span>
                        Advanced details (Tempo, Loop, License Deed URL)
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-outline transition-transform duration-200 group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="p-4 pt-1 border-t border-outline-variant flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        {/* Tempo / BPM */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="font-label-sm text-label-sm text-on-surface-variant"
                            htmlFor="track-tempo"
                          >
                            Tempo (BPM)
                          </label>
                          <div className="relative">
                            <input
                              className="w-full h-9 px-3 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors"
                              id="track-tempo"
                              max="300"
                              min="30"
                              type="number"
                              value={tempo}
                              onChange={(e) => setTempo(e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-caption text-caption text-outline">
                              BPM
                            </span>
                          </div>
                        </div>
                        {/* Seamless Loop Switch */}
                        <div className="flex items-center justify-between sm:justify-start sm:gap-4 pt-2 sm:pt-4">
                          <span className="font-label-md text-label-md text-on-surface">
                            Seamless loop
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              checked={seamlessLoop}
                              className="sr-only peer"
                              id="seamless-loop"
                              type="checkbox"
                              onChange={(e) =>
                                setSeamlessLoop(e.target.checked)
                              }
                            />
                            <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:border-surface-container-highest after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary"></div>
                          </label>
                        </div>
                      </div>
                      {/* License Deed URL */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="font-label-sm text-label-sm text-on-surface-variant"
                          htmlFor="license-deed"
                        >
                          License deed URL
                        </label>
                        <input
                          className="w-full h-9 px-3 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors"
                          id="license-deed"
                          type="url"
                          value={licenseDeed}
                          onChange={(e) => setLicenseDeed(e.target.value)}
                        />
                      </div>
                    </div>
                  </details>
                </section>
              </div>
            </div>

            {/* STICKY FOOTER BAR */}
            <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-low/95 backdrop-blur border-t border-outline-variant">
              <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status indicator */}
                <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                  <span
                    className={footerDotClass}
                    id="footer-status-dot"
                  ></span>
                  <span id="status-text">{statusText}</span>
                </div>
                {/* Action items */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      checked={directPublish}
                      className="w-4 h-4 rounded bg-surface-container-lowest border-outline-variant text-primary focus:ring-0 focus:outline-none accent-[#00e5bf] cursor-pointer"
                      id="direct-publish"
                      type="checkbox"
                      onChange={(e) => setDirectPublish(e.target.checked)}
                    />
                    <span className="font-caption text-caption text-outline hover:text-on-surface transition-colors whitespace-nowrap">
                      Publish to production
                    </span>
                  </label>
                  <button
                    className="h-9 px-5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    id="upload-button"
                    type="button"
                    disabled={isProcessing || !formValid}
                    onClick={handleUploadClick}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                        <span>Uploading...</span>
                      </>
                    ) : isUploaded ? (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          check
                        </span>
                        <span>Uploaded</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">
                          upload
                        </span>
                        <span>Upload Audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isAdmin ? (
          /* NON-ADMIN ACCESS GUARD */
          <div className="w-full max-w-[720px] mx-auto px-4 py-16 text-center">
            <div className="p-8 rounded-xl bg-surface-container border border-outline-variant flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Admin Access Required
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                The Clypra Master Music Catalog and publishing management tools are restricted to administrators. Please sign in with an administrator account to view and publish tracks.
              </p>
              <button
                type="button"
                onClick={() => setViewMode("upload")}
                className="mt-2 px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold hover:brightness-110 transition-colors cursor-pointer"
              >
                Back to Studio Upload
              </button>
            </div>
          </div>
        ) : (
          /* ADMIN MASTER CATALOG VIEW MODE */
          <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-6 pb-28">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      library_music
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        Master Music Catalog
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary text-on-primary">
                        Admin Only
                      </span>
                    </div>
                    <p className="font-caption text-caption text-outline">
                      Manage publication status and sync live with Clypra Assets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={catalog.refetch}
                    disabled={catalog.isLoading}
                    className="h-9 px-3 rounded bg-surface-container text-on-surface-variant hover:text-primary border border-outline-variant transition-colors flex items-center gap-1.5 font-label-sm text-label-sm cursor-pointer disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        catalog.isLoading ? "animate-spin" : ""
                      }`}
                    >
                      refresh
                    </span>
                    {catalog.isLoading ? "Refreshing…" : "Refresh"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("upload")}
                    className="h-9 px-3 rounded bg-primary text-on-primary hover:brightness-110 font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      add
                    </span>
                    Upload Track
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-lowest border border-outline-variant w-fit">
                  <button
                    type="button"
                    aria-label="Filter all tracks"
                    className={`px-3 py-1 rounded text-label-sm font-label-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      catalog.statusFilter === "all"
                        ? "bg-surface-container text-primary font-semibold shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    onClick={() => catalog.setStatusFilter("all")}
                  >
                    <span>All</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-surface-container-highest text-on-surface">
                      {catalog.tracks.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Filter published tracks"
                    className={`px-3 py-1 rounded text-label-sm font-label-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      catalog.statusFilter === "published"
                        ? "bg-surface-container text-emerald-400 font-semibold shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    onClick={() => catalog.setStatusFilter("published")}
                  >
                    <span>Published</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-500/20 text-emerald-300">
                      {
                        catalog.tracks.filter((t) => t.published !== false)
                          .length
                      }
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Filter draft tracks"
                    className={`px-3 py-1 rounded text-label-sm font-label-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      catalog.statusFilter === "draft"
                        ? "bg-surface-container text-amber-400 font-semibold shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    onClick={() => catalog.setStatusFilter("draft")}
                  >
                    <span>Drafts</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-500/20 text-amber-300">
                      {
                        catalog.tracks.filter((t) => t.published === false)
                          .length
                      }
                    </span>
                  </button>
                </div>

                <div className="relative flex-1 max-w-sm">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={catalog.searchQuery}
                    onChange={(e) => catalog.setSearchQuery(e.target.value)}
                    placeholder="Search audio by title, genre, creator, or tags..."
                    className="w-full h-9 pl-9 pr-3 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-on-surface font-body-md text-body-md transition-colors placeholder:text-outline text-sm"
                  />
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded text-caption font-label-sm border transition-colors cursor-pointer ${
                    catalog.selectedCategory === "all"
                      ? "bg-surface-container border-primary text-primary"
                      : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline"
                  }`}
                  onClick={() => catalog.setSelectedCategory("all")}
                >
                  All Categories
                </button>
                {AUDIO_CATEGORIES.map((cat) => {
                  const isSel =
                    catalog.selectedCategory.toLowerCase() ===
                    cat.toLowerCase();
                  const displayName =
                    cat === "ui-interface"
                      ? "UI & Interface"
                      : cat
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" ");
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`px-2.5 py-1 rounded text-caption font-label-sm border transition-colors cursor-pointer ${
                        isSel
                          ? "bg-surface-container border-primary text-primary"
                          : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline"
                      }`}
                      onClick={() =>
                        catalog.setSelectedCategory(cat.toLowerCase())
                      }
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>

              {/* Track Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.filteredTracks.map((track) => {
                  const isPlaying = catalogPlayingId === track.id;
                  const isPublishing = publishingTrackId === track.id;
                  const isPublished = track.published !== false;

                  return (
                    <div
                      key={track.id}
                      className={`p-4 rounded-lg bg-surface-container border transition-colors flex flex-col justify-between gap-3 ${
                        isPublished
                          ? "border-outline-variant hover:border-outline"
                          : "border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleCatalogPlay(track)}
                            className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant text-primary hover:scale-105 transition-all cursor-pointer"
                            title={isPlaying ? "Pause" : "Play"}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isPlaying ? "pause" : "play_arrow"}
                            </span>
                          </button>
                          <div className="min-w-0">
                            <h3 className="font-label-md text-label-md text-on-surface font-semibold truncate">
                              {track.name}
                            </h3>
                            <p className="font-caption text-caption text-outline truncate">
                              {track.author} • {formatDuration(track.duration)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`font-caption text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              isPublished
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isPublished ? "Published" : "Draft"}
                          </span>
                          <span className="font-caption text-[11px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                            {track.category}
                          </span>
                        </div>
                      </div>

                      {track.description && (
                        <p className="font-caption text-caption text-on-surface-variant line-clamp-2">
                          {track.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                        <div className="flex items-center gap-2 font-caption text-caption text-outline">
                          <span>
                            {track.bpm ? `${track.bpm} BPM` : "Variable"}
                          </span>
                          <span>•</span>
                          <span>{track.loopable ? "Loop" : "Single-shot"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isPublishing}
                            onClick={() =>
                              handleTogglePublish(track, !isPublished)
                            }
                            className={`px-2.5 py-1 text-label-sm font-label-sm rounded border font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                              isPublished
                                ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                            title={
                              isPublished
                                ? "Unpublish from catalog"
                                : "Publish to catalog"
                            }
                          >
                            <span
                              className={`material-symbols-outlined text-[14px] ${
                                isPublishing ? "animate-spin" : ""
                              }`}
                            >
                              {isPublishing
                                ? "sync"
                                : isPublished
                                  ? "visibility_off"
                                  : "publish"}
                            </span>
                            {isPublishing
                              ? "Saving…"
                              : isPublished
                                ? "Unpublish"
                                : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLoadTrackFromCatalog(track)}
                            className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-primary text-on-primary font-semibold hover:brightness-110 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              edit
                            </span>
                            Load into Studio
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {catalog.filteredTracks.length === 0 && !catalog.isLoading && (
                  <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-[24px]">
                        music_off
                      </span>
                    </div>
                    <p className="font-label-md text-label-md text-on-surface font-medium">
                      No audio tracks found.
                    </p>
                    <p className="font-caption text-caption text-outline max-w-sm">
                      {catalog.searchQuery ||
                      catalog.selectedCategory !== "all" ||
                      catalog.statusFilter !== "all"
                        ? "No tracks match your current filters. Try resetting the search or category."
                        : "The master catalog is currently empty. Upload your first audio track to get started."}
                    </p>
                    {catalog.searchQuery ||
                    catalog.selectedCategory !== "all" ||
                    catalog.statusFilter !== "all" ? (
                      <button
                        type="button"
                        onClick={() => {
                          catalog.setSearchQuery("");
                          catalog.setSelectedCategory("all");
                          catalog.setStatusFilter("all");
                        }}
                        className="mt-1 px-3 py-1.5 rounded bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant font-label-sm text-label-sm transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setViewMode("upload")}
                        className="mt-1 px-4 py-2 rounded bg-primary text-on-primary hover:brightness-110 font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                      >
                        Upload First Track
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant">
        <div className="max-w-[960px] mx-auto px-margin-desktop py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant">
            <span>Engine: v2.4.1-lossless</span>
            <span className="text-outline-variant">•</span>
            <span>48kHz / 24-bit DSP</span>
          </div>
          <div className="font-caption text-caption text-on-surface-variant">
            Precision Technical Minimalism
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AudioLabView;
