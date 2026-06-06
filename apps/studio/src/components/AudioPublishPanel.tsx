import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Music, Sparkles, UploadCloud } from "lucide-react";
import { useGitHubPublish, type AudioPublishPayload } from "../hooks/useGitHubPublish";
import { generateAudioMetadata } from "../services/geminiService";

const AUDIO_CATEGORIES: AudioPublishPayload["category"][] = ["music", "lo-fi", "chill", "cinematic", "epic", "upbeat", "corporate", "hip-hop", "trap", "electronic", "synth", "acoustic", "indie", "jazz", "soul", "ambient", "background", "sfx", "transition", "impact", "ui", "notifications", "voice"];
const LICENSE_TYPES: AudioPublishPayload["metadata"]["license"]["type"][] = ["cc0", "cc-by", "royalty-free", "public-domain"];

function toKebabId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function readAudioDuration(file: File): Promise<number> {
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

export function AudioPublishPanel() {
  const { publishAudio } = useGitHubPublish();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AudioPublishPayload["category"]>("music");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [author, setAuthor] = useState("");
  const [duration, setDuration] = useState("");
  const [bpm, setBpm] = useState("");
  const [loopable, setLoopable] = useState(false);
  const [licenseType, setLicenseType] = useState<AudioPublishPayload["metadata"]["license"]["type"]>("cc0");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [attributionRequired, setAttributionRequired] = useState(false);
  const [sourceProvider, setSourceProvider] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "failed">("idle");
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const validationMessage = useMemo(() => {
    if (!audioFile) return "Choose an audio file.";
    if (!id.trim()) return "Asset ID is required.";
    if (!name.trim()) return "Display name is required.";
    if (!author.trim()) return "Author is required.";
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) return "Duration must be greater than zero.";
    if (!sourceProvider.trim() || !sourceUrl.trim()) return "Source provider and source URL are required.";
    if (!/^https:\/\//i.test(sourceUrl.trim())) return "Source URL must use HTTPS.";
    return null;
  }, [audioFile, author, duration, id, name, sourceProvider, sourceUrl]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!id) setId(toKebabId(value));
  };

  const handleAudioFileChange = async (file: File | null) => {
    setAudioFile(file);
    if (!file) return;

    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    if (!name) setName(baseName);
    if (!id) setId(toKebabId(baseName));

    try {
      const seconds = await readAudioDuration(file);
      if (seconds > 0 && !duration) {
        setDuration(String(Math.round(seconds * 100) / 100));
      }
    } catch {
      // Duration can still be entered manually; keep this non-blocking.
    }
  };

  const handleGenerateInfo = async () => {
    if (!audioFile) {
      setAiStatus("failed");
      setAiMessage("Choose an audio file first.");
      return;
    }

    setAiStatus("generating");
    setAiMessage(null);

    try {
      const metadata = await generateAudioMetadata({
        fileName: audioFile.name,
        currentName: name,
        currentCategory: category,
        currentDescription: description,
        currentTags: tagsInput,
        author,
        duration: Number(duration) || undefined,
      });

      setName(metadata.name);
      setId(toKebabId(metadata.id || metadata.name));
      setCategory(metadata.category);
      setDescription(metadata.description);
      setTagsInput(metadata.tags.join(", "));
      setLoopable(metadata.loopable);
      if (metadata.bpm) setBpm(String(Math.round(metadata.bpm)));
      setAiStatus("idle");
    } catch (error) {
      setAiStatus("failed");
      setAiMessage(error instanceof Error ? error.message : "Failed to generate audio metadata");
    }
  };

  const handlePublish = async () => {
    if (validationMessage || !audioFile) return;
    setStatus("publishing");
    setMessage(null);
    setPrUrl(null);

    try {
      const [audioDataUrl, coverArtDataUrl] = await Promise.all([fileToDataUrl(audioFile), coverFile ? fileToDataUrl(coverFile) : Promise.resolve(undefined)]);
      const result = await publishAudio({
        id: id.trim(),
        category,
        audioFile: {
          name: audioFile.name,
          dataUrl: audioDataUrl,
        },
        coverArtDataUrl,
        metadata: {
          name: name.trim(),
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
            status: "approved",
            reviewedAt: new Date().toISOString(),
            notes: safetyNotes.trim() || undefined,
          },
        },
      });

      setStatus("published");
      setMessage(`Created ${result.files.length} files on ${result.branch}`);
      setPrUrl(result.prUrl);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Failed to publish audio");
    }
  };

  return (
    <div className="border-b border-(--studio-border) p-3 space-y-3">
      <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-200">
          <Music size={14} />
          Public Audio Library
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-teal-100/70">Publish only audio you own or have a license to distribute publicly. Approved files become available in Clypra through the API.</p>
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">Audio File</label>
      <input type="file" accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/ogg,.mp3,.wav,.m4a,.aac,.flac,.ogg" onChange={(event) => void handleAudioFileChange(event.target.files?.[0] || null)} className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white" />

      <button type="button" onClick={handleGenerateInfo} disabled={!audioFile || aiStatus === "generating"} className="flex w-full items-center justify-center gap-2 rounded-md border border-purple-500/30 bg-purple-500/15 px-3 py-2 text-[12px] font-semibold text-purple-200 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50">
        {aiStatus === "generating" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Generate Info with AI
      </button>

      {aiMessage && (
        <div className="flex items-start gap-2 rounded border border-red-500/20 bg-red-500/10 p-2 text-[10px] text-red-200">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{aiMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Name" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
        <input value={id} onChange={(event) => setId(toKebabId(event.target.value))} placeholder="asset-id" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] font-mono text-white outline-none focus:border-teal-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={category} onChange={(event) => setCategory(event.target.value as AudioPublishPayload["category"])} className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500">
          {AUDIO_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Duration seconds" inputMode="decimal" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
      </div>

      <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author / rights holder" className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" rows={2} className="w-full resize-none rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
      <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="tags, comma, separated" className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />

      <div className="grid grid-cols-2 gap-2">
        <input value={bpm} onChange={(event) => setBpm(event.target.value)} placeholder="BPM optional" inputMode="numeric" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
        <label className="flex items-center gap-2 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white">
          <input type="checkbox" checked={loopable} onChange={(event) => setLoopable(event.target.checked)} />
          Loopable
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={licenseType} onChange={(event) => setLicenseType(event.target.value as AudioPublishPayload["metadata"]["license"]["type"])} className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500">
          {LICENSE_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white">
          <input type="checkbox" checked={attributionRequired} onChange={(event) => setAttributionRequired(event.target.checked)} />
          Attribution
        </label>
      </div>

      <input value={licenseUrl} onChange={(event) => setLicenseUrl(event.target.value)} placeholder="License URL optional" className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
      <div className="grid grid-cols-2 gap-2">
        <input value={sourceProvider} onChange={(event) => setSourceProvider(event.target.value)} placeholder="Source provider" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
        <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://source.example/item" className="rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">Cover Art</label>
      <input type="file" accept="image/png" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="w-full rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white" />
      <textarea value={safetyNotes} onChange={(event) => setSafetyNotes(event.target.value)} placeholder="Review notes, copyright confirmation, source notes" rows={2} className="w-full resize-none rounded border border-(--studio-border) bg-(--studio-control) px-2 py-1.5 text-[11px] text-white outline-none focus:border-teal-500" />

      {validationMessage && (
        <div className="flex items-start gap-2 rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-200">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{validationMessage}</span>
        </div>
      )}

      {message && (
        <div className={`flex items-start gap-2 rounded border p-2 text-[10px] ${status === "failed" ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-teal-500/20 bg-teal-500/10 text-teal-200"}`}>
          {status === "failed" ? <AlertTriangle size={12} className="mt-0.5 shrink-0" /> : <CheckCircle size={12} className="mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {prUrl && (
        <a href={prUrl} target="_blank" rel="noreferrer" className="block rounded border border-(--studio-border) bg-(--studio-control) px-3 py-2 text-center text-[11px] font-semibold text-white hover:bg-(--studio-hover)">
          Open Pull Request
        </a>
      )}

      <button type="button" onClick={handlePublish} disabled={!!validationMessage || status === "publishing"} className="flex w-full items-center justify-center gap-2 rounded-md border border-teal-500/30 bg-teal-500/15 px-3 py-2 text-[12px] font-semibold text-teal-200 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50">
        {status === "publishing" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        Publish Audio to API
      </button>
    </div>
  );
}
