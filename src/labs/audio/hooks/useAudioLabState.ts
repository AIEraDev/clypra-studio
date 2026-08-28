import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getStudioApiBaseUrl } from "../../../services/apiConfig";
import type {
  AudioAsset,
  AudioCategory,
  DemoSampleTrack,
  LicenseType,
  PreflightCheckItem,
} from "../types";

const API_BASE_URL = getStudioApiBaseUrl();

export function toKebabId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read audio duration"));
    };
    audio.src = objectUrl;
  });
}

export function useAudioLabState() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrlOverride, setAudioUrlOverride] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AudioCategory>("music");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [author, setAuthor] = useState("");
  const [duration, setDuration] = useState("");
  const [bpm, setBpm] = useState("");
  const [loopable, setLoopable] = useState(false);
  const [licenseType, setLicenseType] = useState<LicenseType>("cc0");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [attributionRequired, setAttributionRequired] = useState(false);
  const [sourceProvider, setSourceProvider] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "failed">("idle");
  const [isAdmin, setIsAdmin] = useState(false);
  const [publishApproved, setPublishApproved] = useState(true);

  // Check admin privileges from stored token
  useEffect(() => {
    const token = localStorage.getItem("clypra_auth_token");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(!!payload.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Update cover preview when coverFile changes
  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [coverFile]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const addTag = useCallback((newTag: string) => {
    const trimmed = newTag.replace(/^#/, "").trim();
    if (!trimmed) return;
    setTagsInput((prev) => {
      const currentTags = prev
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (currentTags.includes(trimmed)) return prev;
      return [...currentTags, trimmed].join(", ");
    });
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setTagsInput((prev) => {
      const currentTags = prev
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return currentTags.filter((t) => t !== tagToRemove).join(", ");
    });
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (!id || id === toKebabId(name)) {
        setId(toKebabId(value));
      }
    },
    [id, name],
  );

  const handleAudioFileChange = useCallback(
    async (file: File | null) => {
      setAudioFile(file);
      setAudioUrlOverride(null);
      if (!file) return;

      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
      if (!name) setName(baseName);
      if (!id) setId(toKebabId(baseName));

      try {
        const seconds = await readAudioDuration(file);
        if (seconds > 0) {
          setDuration(String(Math.round(seconds * 100) / 100));
        }
      } catch {
        // Duration can still be entered manually
      }
    },
    [id, name],
  );

  const handleCoverFileChange = useCallback((file: File | null) => {
    setCoverFile(file);
  }, []);

  const loadSampleTrack = useCallback((track: DemoSampleTrack | AudioAsset) => {
    setName(track.name);
    setId(track.id);
    setCategory((track.category as AudioCategory) || "music");
    setDescription(track.description || "");
    setTagsInput(track.tags ? track.tags.join(", ") : "");
    setAuthor(track.author || "Clypra Artist");
    setDuration(track.duration ? String(track.duration) : "");
    setBpm(track.bpm ? String(track.bpm) : "");
    setLoopable(!!track.loopable);
    setLicenseType((track.license?.type as LicenseType) || "cc0");
    setLicenseUrl(track.license?.url || "");
    setAttributionRequired(!!track.license?.attributionRequired);
    setSourceProvider(track.source?.provider || "Clypra Studio");
    setSourceUrl(track.source?.url || "https://clypra.abdulkabirmusa.com");
    setAudioUrlOverride(track.audioUrl);
    setAudioFile(null);
    if (track.coverArtUrl) {
      setCoverPreviewUrl(track.coverArtUrl);
    }
    toast.success(`Loaded sample: ${track.name}`);
  }, []);

  const resetForm = useCallback(() => {
    setAudioFile(null);
    setAudioUrlOverride(null);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setId("");
    setName("");
    setCategory("music");
    setDescription("");
    setTagsInput("");
    setAuthor("");
    setDuration("");
    setBpm("");
    setLoopable(false);
    setLicenseType("cc0");
    setLicenseUrl("");
    setAttributionRequired(false);
    setSourceProvider("");
    setSourceUrl("");
    setSafetyNotes("");
    setStatus("idle");
    setAiStatus("idle");
  }, []);

  // Preflight checklist
  const preflightChecks = useMemo<PreflightCheckItem[]>(() => {
    const hasAudio = !!audioFile || !!audioUrlOverride;
    const durNum = Number(duration);
    const validDuration = Number.isFinite(durNum) && durNum > 0;
    const validIdentity = !!id.trim() && !!name.trim();
    const validAuthor = !!author.trim();
    const validSource =
      !!sourceProvider.trim() &&
      !!sourceUrl.trim() &&
      /^https:\/\//i.test(sourceUrl.trim());
    const validLicense = !!licenseType;

    return [
      {
        id: "audio",
        label: "Audio File Ingested",
        status: hasAudio ? "passed" : "failed",
        detail: hasAudio
          ? audioFile
            ? `${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(2)} MB)`
            : "Remote Audio Stream Loaded"
          : "Please drop or select an audio file (MP3, WAV, FLAC, etc.)",
      },
      {
        id: "duration",
        label: "Audio Duration Calibrated",
        status: validDuration ? "passed" : "failed",
        detail: validDuration
          ? `${durNum.toFixed(2)} seconds calibrated`
          : "Duration must be greater than zero",
      },
      {
        id: "identity",
        label: "Track Title & Asset ID",
        status: validIdentity ? "passed" : "failed",
        detail: validIdentity
          ? `ID: ${id}`
          : "Provide a track name and slug ID",
      },
      {
        id: "author",
        label: "Rights Holder / Creator",
        status: validAuthor ? "passed" : "failed",
        detail: validAuthor ? `By: ${author}` : "Author credit is required",
      },
      {
        id: "source",
        label: "Source Provider & HTTPS URL",
        status: validSource ? "passed" : "failed",
        detail: validSource
          ? `${sourceProvider} — Secure HTTPS verified`
          : "Valid source provider and secure https:// URL required",
      },
      {
        id: "license",
        label: "License Contract",
        status: validLicense ? "passed" : "failed",
        detail: `Preset: ${licenseType.toUpperCase()}${
          attributionRequired ? " (Attribution Required)" : ""
        }`,
      },
    ];
  }, [
    audioFile,
    audioUrlOverride,
    duration,
    id,
    name,
    author,
    sourceProvider,
    sourceUrl,
    licenseType,
    attributionRequired,
  ]);

  const validationMessage = useMemo(() => {
    const failed = preflightChecks.find((c) => c.status === "failed");
    return failed ? failed.detail : null;
  }, [preflightChecks]);

  const isReadyToPublish = useMemo(() => {
    return preflightChecks.every((c) => c.status === "passed");
  }, [preflightChecks]);

  const handleGenerateInfo = useCallback(async () => {
    if (!audioFile && !audioUrlOverride) {
      setAiStatus("failed");
      toast.error("Provide an audio file or sample first.");
      return;
    }

    setAiStatus("generating");

    try {
      const fileName = audioFile ? audioFile.name : `${id || "track"}.mp3`;
      const response = await fetch(`${API_BASE_URL}/ai/audio-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          currentName: name,
          currentCategory: category,
          currentDescription: description,
          currentTags: tagsInput,
          author,
          duration: Number(duration) || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to generate audio metadata",
        );
      }

      const metadata = await response.json();

      if (metadata.name) setName(metadata.name);
      if (metadata.id || metadata.name) setId(toKebabId(metadata.id || metadata.name));
      if (metadata.category) setCategory(metadata.category);
      if (metadata.description) setDescription(metadata.description);
      if (Array.isArray(metadata.tags)) setTagsInput(metadata.tags.join(", "));
      if (typeof metadata.loopable === "boolean") setLoopable(metadata.loopable);
      if (metadata.bpm) setBpm(String(Math.round(metadata.bpm)));

      setAiStatus("idle");
      toast.success("AI generated metadata enriched!");
    } catch (error) {
      setAiStatus("failed");
      toast.error(
        error instanceof Error ? error.message : "Failed to generate audio metadata",
      );
    }
  }, [audioFile, audioUrlOverride, author, category, description, duration, id, name, tagsInput]);

  const handlePublish = useCallback(async () => {
    if (!isReadyToPublish) {
      if (validationMessage) toast.error(validationMessage);
      return;
    }

    if (!audioFile && !audioUrlOverride) {
      toast.error("Please provide an audio file to upload.");
      return;
    }

    setStatus("publishing");

    try {
      let audioDataUrl = "";
      if (audioFile) {
        audioDataUrl = await fileToDataUrl(audioFile);
      } else if (audioUrlOverride) {
        // Fetch remote sample and convert to data url
        const res = await fetch(audioUrlOverride);
        const blob = await res.blob();
        const fileFromBlob = new File([blob], `${id}.mp3`, { type: blob.type || "audio/mpeg" });
        audioDataUrl = await fileToDataUrl(fileFromBlob);
      }

      const coverArtDataUrl = coverFile
        ? await fileToDataUrl(coverFile)
        : undefined;

      const payload = {
        audio: {
          id: id.trim(),
          name: name.trim(),
          category,
          description: description.trim(),
          tags,
          author: author.trim(),
          duration: Number(duration),
          bpm: bpm ? Number(bpm) : undefined,
          loopable,
          license: {
            type: licenseType,
            url: licenseUrl.trim() || undefined,
            attributionRequired,
          },
          source: {
            provider: sourceProvider.trim(),
            url: sourceUrl.trim(),
          },
          safety: {
            status: "approved" as const,
            reviewedAt: new Date().toISOString(),
            notes: safetyNotes.trim() || undefined,
          },
          published: isAdmin ? publishApproved : false,
          fileName: audioFile ? audioFile.name : `${id}.mp3`,
        },
        audioFileDataUrl: audioDataUrl,
        coverArtDataUrl,
      };

      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Upload failed: ${response.statusText}`,
        );
      }

      const result = await response.json();

      setStatus("published");
      toast.success(
        result.message ||
          "Audio uploaded to R2 successfully! Available immediately in Clypra app.",
      );
    } catch (error) {
      setStatus("failed");
      toast.error(error instanceof Error ? error.message : "Failed to upload audio");
    }
  }, [
    isReadyToPublish,
    validationMessage,
    audioFile,
    audioUrlOverride,
    coverFile,
    id,
    name,
    category,
    description,
    tags,
    author,
    duration,
    bpm,
    loopable,
    licenseType,
    licenseUrl,
    attributionRequired,
    sourceProvider,
    sourceUrl,
    safetyNotes,
    isAdmin,
    publishApproved,
  ]);

  return {
    audioFile,
    audioUrlOverride,
    coverFile,
    coverPreviewUrl,
    id,
    name,
    category,
    description,
    tags,
    tagsInput,
    author,
    duration,
    bpm,
    loopable,
    licenseType,
    licenseUrl,
    attributionRequired,
    sourceProvider,
    sourceUrl,
    safetyNotes,
    status,
    aiStatus,
    isAdmin,
    publishApproved,
    preflightChecks,
    validationMessage,
    isReadyToPublish,
    setId,
    setName: handleNameChange,
    setCategory,
    setDescription,
    setTagsInput,
    addTag,
    removeTag,
    setAuthor,
    setDuration,
    setBpm,
    setLoopable,
    setLicenseType,
    setLicenseUrl,
    setAttributionRequired,
    setSourceProvider,
    setSourceUrl,
    setSafetyNotes,
    setPublishApproved,
    handleAudioFileChange,
    handleCoverFileChange,
    loadSampleTrack,
    resetForm,
    handleGenerateInfo,
    handlePublish,
  };
}
