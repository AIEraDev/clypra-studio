import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Music, Settings, Zap, FileAudio, Image as ImageIcon, Sparkles } from "lucide-react";
import { generateAudioMetadata } from "../services/geminiService";
import { useR2Upload } from "../hooks/useR2Upload";

const AUDIO_CATEGORIES = ["music", "lo-fi", "chill", "cinematic", "epic", "upbeat", "corporate", "hip-hop", "trap", "electronic", "synth", "acoustic", "indie", "jazz", "soul", "ambient", "background", "sfx", "transition", "impact", "ui", "notifications", "voice"] as const;
const LICENSE_TYPES = ["cc0", "cc-by", "royalty-free", "public-domain"] as const;
const FIELD_INPUT_CLASS = "w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-teal-500";

type AudioCategory = (typeof AUDIO_CATEGORIES)[number];
type LicenseType = (typeof LICENSE_TYPES)[number];

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

export function AudioPublishPanel({ variant = "drawer" }: { variant?: "drawer" | "workspace" }) {
  const { uploadAudio: uploadToR2, isConfigured: isR2Configured, getConfig: getR2Config, setConfig: setR2Config } = useR2Upload();
  const isWorkspace = variant === "workspace";
  const [showR2Config, setShowR2Config] = useState(false);
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("clypra-assets");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
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
  const [message, setMessage] = useState<string | null>(null);
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

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
    if (!name) setName(baseName);
    if (!id) setId(toKebabId(baseName));

    try {
      const seconds = await readAudioDuration(file);
      if (seconds > 0 && !duration) {
        setDuration(String(Math.round(seconds * 100) / 100));
      }
    } catch {
      // Duration can still be entered manually
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

  const handleSaveR2Config = () => {
    if (!r2AccountId.trim() || !r2AccessKeyId.trim() || !r2SecretKey.trim() || !r2BucketName.trim()) {
      setMessage("All R2 configuration fields are required.");
      setStatus("failed");
      return;
    }
    setR2Config({
      accountId: r2AccountId.trim(),
      accessKeyId: r2AccessKeyId.trim(),
      secretAccessKey: r2SecretKey.trim(),
      bucketName: r2BucketName.trim(),
    });
    setShowR2Config(false);
    setMessage("R2 configuration saved successfully!");
    setStatus("published");
    setTimeout(() => {
      setMessage(null);
      setStatus("idle");
    }, 2000);
  };

  const loadR2Config = () => {
    const config = getR2Config();
    if (config) {
      setR2AccountId(config.accountId);
      setR2AccessKeyId(config.accessKeyId);
      setR2SecretKey(config.secretAccessKey);
      setR2BucketName(config.bucketName);
    }
  };

  const handlePublish = async () => {
    if (validationMessage || !audioFile) return;

    if (!isR2Configured) {
      setStatus("failed");
      setMessage("R2 is not configured. Click the Settings icon to configure R2 credentials.");
      return;
    }

    setStatus("publishing");
    setMessage(null);

    try {
      const [audioDataUrl, coverArtDataUrl] = await Promise.all([fileToDataUrl(audioFile), coverFile ? fileToDataUrl(coverFile) : Promise.resolve(undefined)]);

      const payload = {
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
            status: "approved" as const,
            reviewedAt: new Date().toISOString(),
            notes: safetyNotes.trim() || undefined,
          },
        },
      };

      const result = await uploadToR2(payload);
      setStatus("published");
      setMessage(result.message || "Audio uploaded to R2 successfully! Available immediately in Clypra app.");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Failed to upload audio");
    }
  };

  return (
    <div className={`h-full overflow-y-auto text-sm text-white ${isWorkspace ? "p-6" : "p-4"}`}>
      {/* Header */}
      <div className={`${isWorkspace ? "mb-5 border-b border-[#20202A] pb-5" : "mb-4 rounded-xl border border-[#2A2A38] bg-[#15151C] p-4"}`}>
        <div className="flex items-start gap-3">
          <span className={`${isWorkspace ? "h-11 w-11" : "h-9 w-9"} flex shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300`}>
            <Music size={isWorkspace ? 20 : 16} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Audio Library</p>
            <h3 className={`${isWorkspace ? "text-xl" : "text-sm"} font-bold`}>Upload audio instantly to R2</h3>
            <p className={`${isWorkspace ? "max-w-3xl text-sm" : "text-xs"} mt-1 leading-relaxed text-[#9A9AAA]`}>Upload audio you own or have a license to distribute. Files are uploaded directly to R2 and available immediately in Clypra.</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300">
            <Music size={16} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Audio Library</p>
            <h3 className="text-sm font-bold">Upload audio, configure metadata, publish instantly</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9A9AAA]">Upload audio you own or have a license to distribute. Choose R2 for instant availability or GitHub PR for review workflow.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowR2Config(!showR2Config);
              if (!showR2Config) loadR2Config();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2A2A38] bg-[#11111A] text-[#DADAE4] hover:text-white"
            title="Configure R2"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* R2 Configuration Panel */}
      {showR2Config && (
        <div className="mb-4 rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
              <Settings size={12} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">R2 Configuration</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">Configure Cloudflare R2 credentials for direct uploads</p>
            </div>
          </div>
          <div className="space-y-3">
            <Field label="Account ID" required>
              <input value={r2AccountId} onChange={(e) => setR2AccountId(e.target.value)} placeholder="Enter your R2 account ID" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Access Key ID" required>
              <input value={r2AccessKeyId} onChange={(e) => setR2AccessKeyId(e.target.value)} placeholder="Enter access key ID" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Secret Access Key" required>
              <input value={r2SecretKey} onChange={(e) => setR2SecretKey(e.target.value)} type="password" placeholder="Enter secret access key" className={FIELD_INPUT_CLASS} />
            </Field>
            <Field label="Bucket Name">
              <input value={r2BucketName} onChange={(e) => setR2BucketName(e.target.value)} placeholder="clypra-assets" className={FIELD_INPUT_CLASS} />
            </Field>
            <button type="button" onClick={handleSaveR2Config} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-500">
              <CheckCircle size={14} />
              Save Configuration
            </button>
          </div>
        </div>
      )}

      <div className={isWorkspace ? "grid grid-cols-[360px_minmax(0,1fr)_390px] items-start gap-5 max-[1260px]:grid-cols-[340px_minmax(0,1fr)] max-[920px]:grid-cols-1" : "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_390px]"}>
        {/* Main Content */}
        <div className="space-y-4">
          {/* Step 1: Upload Audio */}
          <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
            <StepHeader step="1" title="Upload Audio File" description="Select your audio file to upload (MP3, WAV, M4A, AAC, FLAC, OGG)" />
            <div className="mt-4">
              <Field label="Audio File" required>
                <div className="relative">
                  <input type="file" accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/ogg,.mp3,.wav,.m4a,.aac,.flac,.ogg" onChange={(event) => void handleAudioFileChange(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-teal-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-teal-100" />
                  {audioFile && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/10 p-2">
                      <FileAudio size={14} className="text-teal-300" />
                      <span className="text-[10px] text-teal-200">{audioFile.name}</span>
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {audioFile && (
              <button type="button" onClick={handleGenerateInfo} disabled={!audioFile || aiStatus === "generating"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50">
                {aiStatus === "generating" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiStatus === "generating" ? "Generating..." : "Generate Metadata with AI"}
              </button>
            )}

            {aiMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{aiMessage}</span>
              </div>
            )}
          </section>

          {/* Step 2: Basic Info */}
          <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
            <StepHeader step="2" title="Basic Information" description="Provide audio details and classification" />
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Display Name" required>
                  <input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Enter audio name" className={FIELD_INPUT_CLASS} />
                </Field>
                <Field label="Asset ID" required>
                  <input value={id} onChange={(event) => setId(toKebabId(event.target.value))} placeholder="auto-generated-id" className={`${FIELD_INPUT_CLASS} font-mono`} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category" required>
                  <select value={category} onChange={(event) => setCategory(event.target.value as AudioCategory)} className={FIELD_INPUT_CLASS}>
                    {AUDIO_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Duration (seconds)" required>
                  <input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="0.00" inputMode="decimal" className={FIELD_INPUT_CLASS} />
                </Field>
              </div>

              <Field label="Description">
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Brief description of the audio" rows={3} className={`${FIELD_INPUT_CLASS} resize-none`} />
              </Field>

              <Field label="Tags">
                <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="tags, comma, separated" className={FIELD_INPUT_CLASS} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="BPM (optional)">
                  <input value={bpm} onChange={(event) => setBpm(event.target.value)} placeholder="120" inputMode="numeric" className={FIELD_INPUT_CLASS} />
                </Field>
                <Field label="Loopable">
                  <label className="flex items-center gap-2 rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white">
                    <input type="checkbox" checked={loopable} onChange={(event) => setLoopable(event.target.checked)} className="h-4 w-4" />
                    <span>Loop-friendly audio</span>
                  </label>
                </Field>
              </div>
            </div>
          </section>

          {/* Step 3: Legal & Source */}
          <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
            <StepHeader step="3" title="Legal & Source" description="License information and audio source" />
            <div className="mt-4 space-y-4">
              <Field label="Author / Rights Holder" required>
                <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Enter author name" className={FIELD_INPUT_CLASS} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="License Type" required>
                  <select value={licenseType} onChange={(event) => setLicenseType(event.target.value as LicenseType)} className={FIELD_INPUT_CLASS}>
                    {LICENSE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Attribution">
                  <label className="flex items-center gap-2 rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs text-white">
                    <input type="checkbox" checked={attributionRequired} onChange={(event) => setAttributionRequired(event.target.checked)} className="h-4 w-4" />
                    <span>Require attribution</span>
                  </label>
                </Field>
              </div>

              <Field label="License URL (optional)">
                <input value={licenseUrl} onChange={(event) => setLicenseUrl(event.target.value)} placeholder="https://creativecommons.org/licenses/..." className={FIELD_INPUT_CLASS} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Source Provider" required>
                  <input value={sourceProvider} onChange={(event) => setSourceProvider(event.target.value)} placeholder="e.g., Freesound, Pixabay" className={FIELD_INPUT_CLASS} />
                </Field>
                <Field label="Source URL" required>
                  <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://source.example/item" className={FIELD_INPUT_CLASS} />
                </Field>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={`${isWorkspace ? "sticky top-0 max-h-[calc(100vh-140px)] overflow-y-auto max-[1260px]:col-span-2 max-[920px]:col-span-1" : "lg:sticky lg:top-4"} space-y-4`}>
          {/* Cover Art */}
          <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">Cover Art</p>
              <p className="mt-1 text-[11px] text-[#9A9AAA]">Optional thumbnail for the audio</p>
            </div>
            <Field label="Upload Image">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="block w-full text-xs text-[#9A9AAA] file:mr-3 file:rounded-md file:border-0 file:bg-teal-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-teal-100" />
              {coverFile && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/10 p-2">
                  <ImageIcon size={14} className="text-teal-300" />
                  <span className="text-[10px] text-teal-200">{coverFile.name}</span>
                </div>
              )}
            </Field>
          </section>

          {/* Safety Notes */}
          <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4">
            <Field label="Safety & Review Notes">
              <textarea value={safetyNotes} onChange={(event) => setSafetyNotes(event.target.value)} placeholder="Copyright confirmation, review notes, source verification..." rows={4} className={`${FIELD_INPUT_CLASS} resize-none`} />
            </Field>
          </section>

          {/* Validation Message */}
          {validationMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${status === "failed" ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-green-500/25 bg-green-500/10 text-green-200"}`}>
              {status === "failed" ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle size={14} className="mt-0.5 shrink-0" />}
              <div>
                <p>{message}</p>
              </div>
            </div>
          )}

          {/* Publish Button */}
          <button type="button" onClick={handlePublish} disabled={!!validationMessage || status === "publishing"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "publishing" ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {status === "publishing" ? "Uploading..." : "Upload to R2"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function StepHeader({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-xs font-black text-white">{step}</span>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
