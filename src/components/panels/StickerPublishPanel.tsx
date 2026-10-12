import React, { useState, useRef, useEffect } from "react";
import type { StickerCategory } from "../../types/publish";
import {
  Loader2,
  Upload,
  Film,
  Scan,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  ShieldCheck,
  FileCode,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import lottie from "lottie-web";
import { Player } from "@lottiefiles/react-lottie-player";
import {
  inspectStickerAsset,
  calculateSha256,
  MAX_LOTTIE_BYTES,
  MAX_ASSET_BYTES,
  type AssetScanResult,
} from "@clypra-studio/engine";
import { getStudioApiBaseUrl } from "../../services/apiConfig";

const API_BASE_URL = getStudioApiBaseUrl();

export const STICKER_CATEGORIES: StickerCategory[] = [
  "reaction",
  "emoji",
  "social",
  "arrow",
  "shape",
  "frame",
  "callout",
  "celebration",
  "nature",
  "object",
  "misc",
];

export type SpdxLicense =
  | "CC0-1.0"
  | "CC-BY-4.0"
  | "CC-BY-SA-4.0"
  | "Apache-2.0"
  | "MIT"
  | "LicenseRef-Clypra-Original"
  | "LicenseRef-Contributor-Grant";

export const SPDX_LICENSES: {
  id: SpdxLicense;
  label: string;
  requiresAttribution: boolean;
  requiresSource: boolean;
  warning?: string;
}[] = [
  {
    id: "CC-BY-4.0",
    label: "CC-BY-4.0 (Creative Commons Attribution 4.0)",
    requiresAttribution: true,
    requiresSource: true,
  },
  {
    id: "CC0-1.0",
    label: "CC0-1.0 (Public Domain Dedication)",
    requiresAttribution: false,
    requiresSource: true,
  },
  {
    id: "LicenseRef-Clypra-Original",
    label: "LicenseRef-Clypra-Original (First-party Clypra Studio Asset)",
    requiresAttribution: false,
    requiresSource: false,
  },
  {
    id: "LicenseRef-Contributor-Grant",
    label: "LicenseRef-Contributor-Grant (Community Contributor Grant)",
    requiresAttribution: false,
    requiresSource: false,
  },
  {
    id: "Apache-2.0",
    label: "Apache-2.0 (Apache License 2.0)",
    requiresAttribution: false,
    requiresSource: true,
  },
  {
    id: "MIT",
    label: "MIT License",
    requiresAttribution: false,
    requiresSource: true,
  },
  {
    id: "CC-BY-SA-4.0",
    label: "CC-BY-SA-4.0 (Creative Commons ShareAlike 4.0)",
    requiresAttribution: true,
    requiresSource: true,
    warning: "ShareAlike requires explicit CI authorization (--allow-sharealike).",
  },
];

type StickerKind = "lottie" | "webp" | "png" | "svg";
type PreviewBg = "dark" | "light" | "checkerboard";

interface FormState {
  id: string;
  name: string;
  category: StickerCategory;
  tags: string;
  kind: StickerKind;
}

interface LicenseState {
  spdx: SpdxLicense;
  author: string;
  sourceUrl: string;
  attributionRequired: boolean;
  attributionText: string;
  modified: boolean;
  rightsConfirmed: boolean;
}

interface ProvenanceState {
  origin: "upstream" | "original" | "contributor";
  upstreamId: string;
}

// Convert base64 Data URL to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Extract a 256x256 thumbnail frame from Lottie JSON
const extractLottieThumbnail = (
  lottieJson: any,
  targetFrame?: number,
): Promise<{ dataUrl: string; totalFrames: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement("div");
      container.style.width = "256px";
      container.style.height = "256px";
      container.style.position = "absolute";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const anim = lottie.loadAnimation({
        container: container,
        renderer: "canvas",
        loop: false,
        autoplay: false,
        animationData: lottieJson,
      });

      anim.addEventListener("DOMLoaded", () => {
        const totalFrames = anim.totalFrames;
        const frameToUse =
          targetFrame !== undefined
            ? Math.min(Math.max(0, targetFrame), totalFrames - 1)
            : Math.min(
                Math.max(0, Math.floor(totalFrames * 0.1)),
                totalFrames - 1,
              );
        anim.goToAndStop(frameToUse, true);

        setTimeout(() => {
          try {
            const canvas = container.querySelector("canvas");
            if (canvas) {
              const exportCanvas = document.createElement("canvas");
              exportCanvas.width = 256;
              exportCanvas.height = 256;
              const ctx = exportCanvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(canvas, 0, 0, 256, 256);
                const dataUrl = exportCanvas.toDataURL("image/png");
                anim.destroy();
                document.body.removeChild(container);
                resolve({ dataUrl, totalFrames });
                return;
              }
              const dataUrl = canvas.toDataURL("image/png");
              anim.destroy();
              document.body.removeChild(container);
              resolve({ dataUrl, totalFrames });
            } else {
              anim.destroy();
              document.body.removeChild(container);
              reject(new Error("Canvas element not found in Lottie container"));
            }
          } catch (err) {
            anim.destroy();
            document.body.removeChild(container);
            reject(err);
          }
        }, 120);
      });

      anim.addEventListener("data_failed", () => {
        document.body.removeChild(container);
        reject(new Error("Lottie animation data failed to load"));
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Extract a 256x256 thumbnail from static image file (PNG, WebP, SVG)
const extractStaticThumbnail = (file: File): Promise<{ dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get 2D canvas context"));
      }
      ctx.clearRect(0, 0, 256, 256);
      const scale = Math.min(256 / img.width, 256 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (256 - w) / 2;
      const y = (256 - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/png") });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image file into canvas"));
    };
    img.src = url;
  });
};

export function StickerPublishPanel({
  variant = "drawer",
}: {
  variant?: "drawer" | "workspace";
}) {
  const isWorkspace = variant === "workspace";

  // Form State
  const [formData, setFormData] = useState<FormState>({
    id: "",
    name: "",
    category: "reaction",
    tags: "",
    kind: "lottie",
  });

  // License State
  const [license, setLicense] = useState<LicenseState>({
    spdx: "CC-BY-4.0",
    author: "",
    sourceUrl: "",
    attributionRequired: true,
    attributionText: "",
    modified: false,
    rightsConfirmed: false,
  });

  // Provenance State
  const [provenance, setProvenance] = useState<ProvenanceState>({
    origin: "upstream",
    upstreamId: "",
  });

  // Asset Files and Inspection
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primarySha256, setPrimarySha256] = useState<string>("");
  const [scanResult, setScanResult] = useState<AssetScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Previews
  const [lottieData, setLottieData] = useState<any>(null);
  const [staticPreviewUrl, setStaticPreviewUrl] = useState<string>("");
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [extractingThumbnail, setExtractingThumbnail] = useState<boolean>(false);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [selectedFrame, setSelectedFrame] = useState<number>(0);
  const [previewBg, setPreviewBg] = useState<PreviewBg>("dark");

  // Submission & Staging Output
  const [staging, setStaging] = useState<boolean>(false);
  const [stagedManifest, setStagedManifest] = useState<any | null>(null);
  const [copiedManifest, setCopiedManifest] = useState<boolean>(false);
  const [generatingMetadata, setGeneratingMetadata] = useState<boolean>(false);

  const lottieInstanceRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate canonical slug ID: sticker-<category>-<slug>
  const generateId = (name: string, category: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug ? `sticker-${category}-${slug}` : "";
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      id: generateId(name, prev.category),
    }));
  };

  const handleCategoryChange = (category: StickerCategory) => {
    setFormData((prev) => ({
      ...prev,
      category,
      id: generateId(prev.name, category),
    }));
  };

  // Sync SPDX license rules
  const handleSpdxChange = (spdx: SpdxLicense) => {
    const config = SPDX_LICENSES.find((l) => l.id === spdx);
    const requiresAttr = config?.requiresAttribution ?? false;
    const isOriginal = spdx === "LicenseRef-Clypra-Original";
    const isContributor = spdx === "LicenseRef-Contributor-Grant";

    setLicense((prev) => ({
      ...prev,
      spdx,
      attributionRequired: requiresAttr || prev.attributionRequired,
    }));

    if (isOriginal) {
      setProvenance((prev) => ({ ...prev, origin: "original" }));
    } else if (isContributor) {
      setProvenance((prev) => ({ ...prev, origin: "contributor" }));
    } else {
      setProvenance((prev) => ({ ...prev, origin: "upstream" }));
    }
  };

  // File Selection and Deep Inspection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict rejection of forbidden GIF formats
    if (file.name.toLowerCase().endsWith(".gif") || file.type === "image/gif") {
      toast.error(
        "GIF format is strictly forbidden. Please upload Lottie (.json), WebP (.webp), PNG (.png), or SVG (.svg).",
      );
      return;
    }

    setIsScanning(true);
    setStagedManifest(null);

    try {
      const buffer = await file.arrayBuffer();
      const u8 = new Uint8Array(buffer);
      const sha256 = await calculateSha256(u8);
      const inspection = inspectStickerAsset(u8, file.name);

      setPrimarySha256(sha256);
      setScanResult(inspection);
      setPrimaryFile(file);

      // Determine Kind
      let kind: StickerKind = "lottie";
      if (inspection.mime === "image/webp") kind = "webp";
      else if (inspection.mime === "image/png") kind = "png";
      else if (inspection.mime === "image/svg+xml") kind = "svg";

      setFormData((prev) => ({ ...prev, kind }));

      if (!inspection.valid) {
        toast.error(`Asset failed integrity scan: ${inspection.errors[0]}`);
        setLottieData(null);
        setStaticPreviewUrl("");
        setThumbnailDataUrl("");
        setThumbnailFile(null);
        return;
      }

      // Handle Lottie Animation
      if (kind === "lottie") {
        setStaticPreviewUrl("");
        const text = new TextDecoder().decode(u8);
        const json = JSON.parse(text);
        setLottieData(json);

        setExtractingThumbnail(true);
        const { dataUrl, totalFrames: extractedTotal } =
          await extractLottieThumbnail(json);
        setTotalFrames(extractedTotal);
        const defaultFrame = Math.min(
          Math.max(0, Math.floor(extractedTotal * 0.1)),
          extractedTotal - 1,
        );
        setSelectedFrame(defaultFrame);
        setThumbnailDataUrl(dataUrl);

        const thumbFile = dataURLtoFile(
          dataUrl,
          `${file.name.replace(/\.json$/i, "")}-thumb.png`,
        );
        setThumbnailFile(thumbFile);
      } else {
        // Handle Static Asset (WebP, PNG, SVG)
        setLottieData(null);
        const previewUrl = URL.createObjectURL(file);
        setStaticPreviewUrl(previewUrl);

        setExtractingThumbnail(true);
        const { dataUrl } = await extractStaticThumbnail(file);
        setThumbnailDataUrl(dataUrl);
        const thumbFile = dataURLtoFile(
          dataUrl,
          `${file.name.replace(/\.[a-z0-9]+$/i, "")}-thumb.png`,
        );
        setThumbnailFile(thumbFile);
      }

      toast.success(
        `Asset inspected successfully: SHA-256 ${sha256.substring(0, 10)}...`,
      );
    } catch (err: any) {
      toast.error(`Failed to process asset: ${err.message}`);
      setScanResult({
        valid: false,
        errors: [err.message],
        bytes: file.size,
        mime: "application/octet-stream",
      });
    } finally {
      setIsScanning(false);
      setExtractingThumbnail(false);
    }
  };

  // Thumbnail Frame Scrubbing for Lottie
  const handleFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10);
    setSelectedFrame(frame);

    const lottieInstance = lottieInstanceRef.current;
    if (lottieInstance) {
      lottieInstance.goToAndStop(frame, true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!lottieData || !primaryFile) return;
      try {
        setExtractingThumbnail(true);
        const { dataUrl } = await extractLottieThumbnail(lottieData, frame);
        setThumbnailDataUrl(dataUrl);
        const thumbFile = dataURLtoFile(
          dataUrl,
          `${primaryFile.name.replace(/\.json$/i, "")}-thumb.png`,
        );
        setThumbnailFile(thumbFile);
      } catch (err: any) {
        toast.error(`Failed to extract frame: ${err.message}`);
      } finally {
        setExtractingThumbnail(false);
      }
    }, 120);
  };

  // Metadata AI Helper
  const handleGenerateMetadata = async () => {
    if (!thumbnailDataUrl) {
      toast.error("Please upload and validate a sticker asset first");
      return;
    }

    setGeneratingMetadata(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/sticker-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: thumbnailDataUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to auto-generate metadata");
      }

      const result = await response.json();
      const detectedName = result.name || formData.name;
      const detectedCat = STICKER_CATEGORIES.includes(result.category)
        ? (result.category as StickerCategory)
        : formData.category;

      setFormData((prev) => ({
        ...prev,
        name: detectedName,
        tags: result.tags || prev.tags,
        category: detectedCat,
        id: generateId(detectedName, detectedCat),
      }));

      toast.success("AI generated metadata applied!");
    } catch (err: any) {
      toast.error(`AI metadata generation: ${err.message}`);
    } finally {
      setGeneratingMetadata(false);
    }
  };

  // Form Validation
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Sticker name is required.";
    if (!formData.id.trim()) return "Sticker ID is required.";
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(formData.id)) {
      return "Sticker ID must be 3-64 characters, lowercase alphanumeric and hyphens.";
    }

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagsArray.length === 0) {
      return "At least 1 tag is required (e.g. fire, emoji).";
    }
    if (tagsArray.length > 12) {
      return "Maximum 12 tags allowed.";
    }

    if (!primaryFile || !scanResult || !scanResult.valid) {
      return "A valid, verified asset file is required.";
    }
    if (!thumbnailFile) {
      return "Thumbnail generation failed. Please re-select the asset.";
    }

    if (!license.author.trim()) {
      return "Author is required in the license block.";
    }

    const requiresSource =
      license.spdx !== "LicenseRef-Clypra-Original" &&
      license.spdx !== "LicenseRef-Contributor-Grant";
    if (requiresSource) {
      if (!license.sourceUrl.trim()) {
        return "Source URL is required for third-party and upstream licenses.";
      }
      if (!/^https?:\/\//i.test(license.sourceUrl.trim())) {
        return "Source URL must be a valid HTTP or HTTPS web address.";
      }
    }

    if (
      license.attributionRequired ||
      license.spdx === "CC-BY-4.0" ||
      license.spdx === "CC-BY-SA-4.0"
    ) {
      if (!license.attributionText.trim()) {
        return "Attribution text is required for CC-BY licensed stickers.";
      }
    }

    if (!license.rightsConfirmed) {
      return "You must confirm that this asset complies with the declared license.";
    }

    return null;
  };

  // Upload to R2 Staging and Generate Validated Manifest
  const handleStageAndValidate = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setStaging(true);
    try {
      // Step 1: Upload Primary Asset to /stickers/stage
      const primaryForm = new FormData();
      primaryForm.append("file", primaryFile!);
      primaryForm.append("stickerId", formData.id);

      const primaryRes = await fetch(`${API_BASE_URL}/stickers/stage`, {
        method: "POST",
        body: primaryForm,
      });

      if (!primaryRes.ok) {
        const errJson = await primaryRes.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Failed to stage primary asset (${primaryRes.status})`,
        );
      }
      const primaryData = await primaryRes.json();

      // Step 2: Upload Thumbnail Asset to /stickers/stage
      const thumbForm = new FormData();
      thumbForm.append("file", thumbnailFile!);
      thumbForm.append("stickerId", formData.id);

      const thumbRes = await fetch(`${API_BASE_URL}/stickers/stage`, {
        method: "POST",
        body: thumbForm,
      });

      if (!thumbRes.ok) {
        const errJson = await thumbRes.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Failed to stage thumbnail asset (${thumbRes.status})`,
        );
      }
      const thumbData = await thumbRes.json();

      // Step 3: Assemble Full Manifest v1
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const isAnimated = formData.kind === "lottie" || formData.kind === "webp";

      const manifest: any = {
        schemaVersion: 1,
        id: formData.id,
        name: formData.name.trim(),
        category: formData.category,
        tags,
        kind: formData.kind,
        animated: isAnimated,
        files: {
          primary: {
            r2Key: primaryData.r2Key,
            sha256: primaryData.sha256,
            bytes: primaryData.bytes,
            mime: primaryData.mime,
          },
          thumbnail: {
            r2Key: thumbData.r2Key,
            sha256: thumbData.sha256,
            bytes: thumbData.bytes,
            mime: thumbData.mime,
          },
        },
        dimensions: primaryData.dimensions ||
          scanResult?.dimensions || { width: 512, height: 512 },
        license: {
          spdx: license.spdx,
          author: license.author.trim(),
          attributionRequired:
            license.attributionRequired ||
            license.spdx === "CC-BY-4.0" ||
            license.spdx === "CC-BY-SA-4.0",
          modified: license.modified,
        },
        provenance: {
          origin: provenance.origin,
          uploadedVia: "studio",
          submissionId,
        },
        status: "review",
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (license.sourceUrl.trim()) {
        manifest.license.sourceUrl = license.sourceUrl.trim();
      }
      if (license.attributionText.trim()) {
        manifest.license.attributionText = license.attributionText.trim();
      }
      if (provenance.upstreamId.trim()) {
        manifest.provenance.upstreamId = provenance.upstreamId.trim();
      }

      if (isAnimated && (primaryData.animation || scanResult?.animation)) {
        manifest.animation = primaryData.animation || scanResult?.animation;
      }

      // Step 4: Validate Manifest against Server Schema
      const allowShareAlike = license.spdx === "CC-BY-SA-4.0";
      const valRes = await fetch(
        `${API_BASE_URL}/stickers/validate-manifest?allowShareAlike=${allowShareAlike}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manifest),
        },
      );

      if (!valRes.ok) {
        const valData = await valRes.json().catch(() => ({}));
        throw new Error(
          valData.errors?.[0] || "Manifest schema validation failed on server",
        );
      }

      setStagedManifest(manifest);
      toast.success("Sticker staged to R2 and manifest verified by API!");
    } catch (err: any) {
      toast.error(`Staging failed: ${err.message}`);
    } finally {
      setStaging(false);
    }
  };

  const copyManifestJson = () => {
    if (!stagedManifest) return;
    navigator.clipboard.writeText(JSON.stringify(stagedManifest, null, 2));
    setCopiedManifest(true);
    toast.success("Manifest JSON copied to clipboard");
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  const downloadManifestJson = () => {
    if (!stagedManifest) return;
    const blob = new Blob([JSON.stringify(stagedManifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stagedManifest.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${stagedManifest.id}.json`);
  };

  return (
    <div
      className={`h-full overflow-y-auto text-sm text-white ${
        isWorkspace ? "p-6" : "p-4"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isWorkspace
            ? "mb-5 border-b border-[#20202A] pb-5"
            : "mb-4 rounded-xl border border-[#2A2A38] bg-[#15151C] p-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`${
              isWorkspace ? "h-11 w-11" : "h-9 w-9"
            } flex shrink-0 items-center justify-center rounded-lg border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 text-[#B9B2FF]`}
          >
            <ShieldCheck size={isWorkspace ? 20 : 16} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
              Studio Sticker Builder
            </p>
            <h3 className={`${isWorkspace ? "text-xl" : "text-sm"} font-bold`}>
              Inspect, Stage &amp; Submit Sticker
            </h3>
            <p
              className={`${
                isWorkspace ? "max-w-3xl text-sm" : "text-xs"
              } mt-1 leading-relaxed text-[#9A9AAA]`}
            >
              Verify Lottie/vector assets against Clypra standards, upload to
              R2 staging, and generate a review manifest for clypra-api.
            </p>
          </div>
        </div>
      </div>

      <div
        className={
          isWorkspace
            ? "grid grid-cols-[380px_minmax(0,1fr)_420px] items-start gap-5 max-[1300px]:grid-cols-[340px_minmax(0,1fr)] max-[960px]:grid-cols-1"
            : "space-y-4"
        }
      >
        {/* Column 1: Asset Inspection & Metadata */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>1. Asset Upload &amp; Metadata</span>
          </div>

          {/* Primary File Drop */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Sticker Asset File <span className="text-red-400">*</span>
            </label>
            <label className="cursor-pointer block">
              <div
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  scanResult && !scanResult.valid
                    ? "border-red-500/50 bg-red-950/10"
                    : scanResult?.valid
                      ? "border-emerald-500/50 bg-emerald-950/10"
                      : "border-[#2A2A38] hover:border-[#7C6FFF] bg-[#09090D]"
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  {isScanning ? (
                    <Loader2 className="w-8 h-8 text-[#7C6FFF] animate-spin mb-2" />
                  ) : scanResult?.valid ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  ) : scanResult && !scanResult.valid ? (
                    <XCircle className="w-8 h-8 text-red-400 mb-2" />
                  ) : (
                    <Film className="w-8 h-8 text-gray-500 mb-2" />
                  )}
                  <p className="text-xs font-medium text-gray-200">
                    {primaryFile ? primaryFile.name : "Select or Drop Sticker Asset"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Accepts Lottie JSON (&le; 300KB), WebP, PNG, or SVG (&le; 2MB).
                    <br />
                    <span className="text-amber-400/90 font-mono">
                      GIF format is strictly prohibited.
                    </span>
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".json,.webp,.png,.svg,application/json,image/webp,image/png,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Inline Scan Diagnostics Card */}
          {scanResult && (
            <div
              className={`rounded-lg p-3 text-xs border ${
                scanResult.valid
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                  : "border-red-500/30 bg-red-950/20 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-1">
                {scanResult.valid ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Integrity Scan Passed</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-red-400" />
                    <span>Integrity Scan Failed</span>
                  </>
                )}
              </div>
              <div className="space-y-0.5 text-[11px] font-mono opacity-90">
                <p>MIME: {scanResult.mime}</p>
                <p>Size: {(scanResult.bytes / 1024).toFixed(1)} KB</p>
                {scanResult.dimensions && (
                  <p>
                    Dimensions: {scanResult.dimensions.width} &times;{" "}
                    {scanResult.dimensions.height} px
                  </p>
                )}
                {scanResult.animation && (
                  <p>
                    Duration: {scanResult.animation.durationMs}ms @{" "}
                    {scanResult.animation.fps} fps (
                    {scanResult.animation.lottie.layerCount} layers)
                  </p>
                )}
              </div>
              {!scanResult.valid && (
                <ul className="mt-2 list-disc list-inside space-y-1 text-[11px] text-red-300">
                  {scanResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Sticker Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Sticker Name <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Glowing Fire"
                className="flex-1 px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs"
              />
              <button
                type="button"
                onClick={handleGenerateMetadata}
                disabled={generatingMetadata || !thumbnailDataUrl}
                title="Auto-detect name, tags, and category"
                className="px-3 py-1.5 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2A2A38] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              >
                {generatingMetadata ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Scan className="w-3.5 h-3.5" />
                )}
                <span>AI</span>
              </button>
            </div>
          </div>

          {/* Canonical ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Sticker ID (Canonical slug) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="sticker-category-name"
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-gray-300 focus:outline-none focus:border-[#7C6FFF] text-xs font-mono"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as StickerCategory)
              }
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white focus:outline-none focus:border-[#7C6FFF] text-xs font-mono"
            >
              {STICKER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Tags (comma-separated) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="e.g. fire, flame, reaction, hot"
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs"
            />
          </div>
        </section>

        {/* Column 2: Canvas Preview with Background & Controls */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>2. Interactive Preview &amp; Thumbnail</span>
            {/* Background Selector */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewBg("dark")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  previewBg === "dark"
                    ? "bg-[#7C6FFF] text-white"
                    : "bg-[#1C1C26] text-gray-400 hover:text-white"
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg("light")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  previewBg === "light"
                    ? "bg-[#7C6FFF] text-white"
                    : "bg-[#1C1C26] text-gray-400 hover:text-white"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg("checkerboard")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  previewBg === "checkerboard"
                    ? "bg-[#7C6FFF] text-white"
                    : "bg-[#1C1C26] text-gray-400 hover:text-white"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div
            className={`w-full h-72 rounded-xl border border-[#2A2A38] flex items-center justify-center relative overflow-hidden transition-colors ${
              previewBg === "dark"
                ? "bg-[#09090D]"
                : previewBg === "light"
                  ? "bg-[#F3F3F6]"
                  : ""
            }`}
            style={
              previewBg === "checkerboard"
                ? {
                    backgroundImage:
                      "repeating-conic-gradient(#202028 0% 25%, #14141A 0% 50%)",
                    backgroundSize: "20px 20px",
                  }
                : undefined
            }
          >
            {lottieData ? (
              <div className="w-56 h-56 flex items-center justify-center">
                <Player
                  lottieRef={(instance) => {
                    lottieInstanceRef.current = instance;
                  }}
                  autoplay
                  loop
                  src={lottieData}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            ) : staticPreviewUrl ? (
              <img
                src={staticPreviewUrl}
                alt="Sticker Preview"
                className="max-w-[80%] max-h-[80%] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 text-xs">
                <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                <span>Upload an asset to preview</span>
              </div>
            )}

            {/* Dimension Badge */}
            {scanResult?.dimensions && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-gray-300">
                {scanResult.dimensions.width} &times;{" "}
                {scanResult.dimensions.height} px
              </div>
            )}
          </div>

          {/* Lottie Frame Scrubbing */}
          {lottieData && totalFrames > 0 && (
            <div className="p-3 bg-[#09090D] border border-[#2A2A38] rounded-lg space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300">
                  Thumbnail Scrubbing Frame
                </span>
                <span className="font-mono text-[#B9B2FF] bg-[#7C6FFF]/10 px-2 py-0.5 rounded">
                  Frame {selectedFrame} / {totalFrames - 1}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={selectedFrame}
                onChange={handleFrameChange}
                className="w-full h-1 bg-[#2A2A38] rounded-lg appearance-none cursor-pointer accent-[#7C6FFF]"
              />
              <p className="text-[10px] text-gray-500">
                Scrub to choose the representative 256&times;256 thumbnail frame.
              </p>
            </div>
          )}

          {/* Thumbnail preview badge */}
          {thumbnailDataUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#2A2A38] bg-[#09090D]">
              <div className="w-14 h-14 rounded-md border border-[#2A2A38] bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={thumbnailDataUrl}
                  alt="Extracted Thumbnail"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-gray-200">
                  Generated Thumbnail (256&times;256)
                </p>
                <p className="text-[11px] text-gray-400">
                  PNG format &bull; Used in catalog grid &amp; offline starter bundle
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Column 3: Mandatory Licensing, Rights & Manifest Gate */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>3. Mandatory Licensing &amp; Rights Gate</span>
          </div>

          {/* SPDX License Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              License (SPDX) <span className="text-red-400">*</span>
            </label>
            <select
              value={license.spdx}
              onChange={(e) => handleSpdxChange(e.target.value as SpdxLicense)}
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white focus:outline-none focus:border-[#7C6FFF] text-xs font-mono"
            >
              {SPDX_LICENSES.map((lic) => (
                <option key={lic.id} value={lic.id}>
                  {lic.label}
                </option>
              ))}
            </select>
            {license.spdx === "CC-BY-SA-4.0" && (
              <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                ShareAlike requires --allow-sharealike CI approval.
              </p>
            )}
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Author / Designer <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={license.author}
              onChange={(e) =>
                setLicense({ ...license, author: e.target.value })
              }
              placeholder="e.g. Google Noto Emoji Team"
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs"
            />
          </div>

          {/* Source URL (Mandatory for non-original) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Source URL{" "}
              {license.spdx !== "LicenseRef-Clypra-Original" &&
                license.spdx !== "LicenseRef-Contributor-Grant" && (
                  <span className="text-red-400">*</span>
                )}
            </label>
            <input
              type="url"
              value={license.sourceUrl}
              onChange={(e) =>
                setLicense({ ...license, sourceUrl: e.target.value })
              }
              placeholder="https://github.com/googlefonts/noto-emoji"
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs font-mono"
            />
          </div>

          {/* Attribution Text (Mandatory for CC-BY) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Attribution Notice{" "}
              {(license.attributionRequired ||
                license.spdx === "CC-BY-4.0" ||
                license.spdx === "CC-BY-SA-4.0") && (
                <span className="text-red-400">*</span>
              )}
            </label>
            <textarea
              rows={2}
              value={license.attributionText}
              onChange={(e) =>
                setLicense({ ...license, attributionText: e.target.value })
              }
              placeholder="e.g. Designed by Google Noto Color Emoji under CC BY 4.0 license"
              className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs"
            />
          </div>

          {/* Checkboxes: Modified & Rights Grant */}
          <div className="space-y-2 pt-1 border-t border-[#2A2A38]">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={license.modified}
                onChange={(e) =>
                  setLicense({ ...license, modified: e.target.checked })
                }
                className="mt-0.5 h-3.5 w-3.5 rounded border-[#2A2A38] bg-[#09090D] text-[#7C6FFF] focus:ring-[#7C6FFF]"
              />
              <span className="text-[11px] text-gray-300">
                This asset has been modified from its upstream original.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={license.rightsConfirmed}
                onChange={(e) =>
                  setLicense({ ...license, rightsConfirmed: e.target.checked })
                }
                className="mt-0.5 h-3.5 w-3.5 rounded border-[#2A2A38] bg-[#09090D] text-[#7C6FFF] focus:ring-[#7C6FFF]"
              />
              <span className="text-[11px] text-gray-300 font-semibold">
                I verify that this asset complies with the declared license and
                Clypra distribution requirements. <span className="text-red-400">*</span>
              </span>
            </label>
          </div>

          {/* Stage & Validate Button */}
          <button
            type="button"
            onClick={handleStageAndValidate}
            disabled={staging || !scanResult?.valid || !primaryFile}
            className="w-full py-2.5 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2A2A38] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-[#7C6FFF]/20"
          >
            {staging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Staging to R2 &amp; Validating...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Stage to R2 &amp; Generate Manifest</span>
              </>
            )}
          </button>

          {/* Staged Result Card */}
          {stagedManifest && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span>Staged &amp; Manifest Ready</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                  status: review
                </span>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed">
                Raw assets uploaded to R2 staging prefix. Save the manifest to{" "}
                <code className="text-[#B9B2FF] font-mono">
                  data/stickers/{stagedManifest.id}.json
                </code>{" "}
                and open a Pull Request in <code className="text-[#B9B2FF]">clypra-api</code>.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyManifestJson}
                  className="flex-1 py-1.5 bg-[#1C1C28] hover:bg-[#282838] text-white rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors"
                >
                  {copiedManifest ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedManifest ? "Copied" : "Copy JSON"}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadManifestJson}
                  className="flex-1 py-1.5 bg-[#7C6FFF] hover:bg-[#6C5FEF] text-white rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors"
                >
                  <Download size={14} />
                  <span>Download Manifest</span>
                </button>
              </div>

              {/* JSON preview */}
              <div className="max-h-40 overflow-y-auto rounded bg-black/60 p-2 font-mono text-[10px] text-gray-300 border border-emerald-500/20">
                <pre>{JSON.stringify(stagedManifest, null, 2)}</pre>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StickerPublishPanel;
