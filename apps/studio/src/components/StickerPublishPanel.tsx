import React, { useState } from "react";
import type { StickerPublishPayload, StickerCategory } from "../types/publish";
import { AlertCircle, CheckCircle, Loader2, Upload, Image as ImageIcon, Film, Sparkles } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";
const STICKER_CATEGORIES: StickerCategory[] = ["emoji", "text", "gaming", "sports", "animals", "love", "mood", "food", "travel", "birthday", "frames", "shapes", "fashion", "retro", "illustration"];

type StickerFormat = "static" | "gif" | "lottie";

interface FormData {
  id: string;
  name: string;
  category: StickerCategory;
  tags: string;
  isPremium: boolean;
  format: StickerFormat;
}

export function StickerPublishPanel() {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    category: "emoji",
    tags: "",
    isPremium: false,
    format: "static",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [animatedFile, setAnimatedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [animatedPreview, setAnimatedPreview] = useState<string>("");

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [generatingMetadata, setGeneratingMetadata] = useState(false);

  // Generate ID from name
  const generateId = (name: string, category: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `sticker-${category}-${slug}`;
  };

  // Handle name change and auto-generate ID
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      id: generateId(name, prev.category),
    }));
  };

  // Handle category change and update ID
  const handleCategoryChange = (category: StickerCategory) => {
    setFormData((prev) => ({
      ...prev,
      category,
      id: generateId(prev.name, category),
    }));
  };

  // Convert file to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|webp|jpeg|jpg|gif)$/)) {
      setError("Please select a PNG, WebP, JPG, or GIF image");
      return;
    }

    // Validate file matches the selected format
    if (formData.format === "static" && file.type === "image/gif") {
      setError("GIF files cannot be used with STATIC format. Please switch to GIF format or upload PNG/WebP.");
      return;
    }

    if (formData.format === "static" && !file.type.match(/^image\/(png|webp)$/)) {
      setError("STATIC format only accepts PNG or WebP images.");
      return;
    }

    setImageFile(file);
    const dataUrl = await fileToDataUrl(file);
    setImagePreview(dataUrl);

    // If GIF is uploaded for GIF format, also set it as the animation file
    if (file.type === "image/gif" && formData.format === "gif") {
      setAnimatedFile(file);
      setAnimatedPreview(dataUrl);
    }

    setError("");
  };

  // Handle animated file selection
  const handleAnimatedSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on format
    if (formData.format === "gif" && !file.type.match(/^image\/gif$/)) {
      setError("Please select a GIF file for animated stickers");
      return;
    }

    if (formData.format === "lottie" && !file.type.match(/^application\/json$/)) {
      setError("Please select a JSON file for Lottie animations");
      return;
    }

    setAnimatedFile(file);
    const dataUrl = await fileToDataUrl(file);
    setAnimatedPreview(dataUrl);
    setError("");
  };

  // Handle format change
  const handleFormatChange = (format: StickerFormat) => {
    setFormData((prev) => ({ ...prev, format }));
    // Clear animated file if switching formats
    setAnimatedFile(null);
    setAnimatedPreview("");
  };

  // AI-powered metadata generation
  const handleGenerateMetadata = async () => {
    if (!imageFile && !imagePreview) {
      setError("Please upload an image first");
      return;
    }

    setGeneratingMetadata(true);
    setError("");

    try {
      const imageDataUrl = imagePreview || (await fileToDataUrl(imageFile!));

      const response = await fetch(`${API_BASE_URL}/ai/sticker-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to generate sticker metadata");
      }

      const result = await response.json();

      // Apply AI-generated metadata
      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        tags: result.tags || prev.tags,
        category: (result.category as StickerCategory) || prev.category,
        id: generateId(result.name || prev.name, result.category || prev.category),
      }));

      setSuccess("✨ AI generated metadata successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(`AI generation failed: ${err.message}`);
    } finally {
      setGeneratingMetadata(false);
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Sticker name is required";
    if (!formData.id.trim()) return "Sticker ID is required";
    if (!imageFile) return "Please select an image file";

    // Validate that GIF files must use GIF format
    if (imageFile.type === "image/gif" && formData.format === "static") {
      return "GIF files must use GIF format, not STATIC. Please select GIF format or use PNG/WebP for static stickers.";
    }

    // Validate that static format only accepts PNG/WebP
    if (formData.format === "static" && !imageFile.type.match(/^image\/(png|webp)$/)) {
      return "Static stickers must be in PNG or WebP format. For GIF stickers, select GIF format.";
    }

    const isAnimated = formData.format !== "static";
    if (isAnimated && !animatedFile) {
      return `Please select a ${formData.format.toUpperCase()} file for animation`;
    }

    return null;
  };

  // Handle publish
  const handlePublish = async () => {
    setError("");
    setSuccess("");

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPublishing(true);

    try {
      // Convert files to data URLs
      const imageDataUrl = await fileToDataUrl(imageFile!);
      const animatedDataUrl = animatedFile ? await fileToDataUrl(animatedFile) : undefined;

      // Prepare payload
      const isAnimated = formData.format !== "static";
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload: StickerPublishPayload = {
        id: formData.id,
        category: formData.category,
        metadata: {
          name: formData.name,
          tags,
          isPremium: formData.isPremium,
          format: formData.format,
          isAnimated,
          safety: {
            status: "approved",
            reviewedAt: new Date().toISOString(),
          },
        },
        imageFile: {
          name: imageFile!.name,
          dataUrl: imageDataUrl,
        },
      };

      // Publish to R2
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";

      const response = await fetch(`${API_BASE_URL}/stickers/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setSuccess(result.message || "✅ Sticker uploaded to R2 successfully!");

      // Reset form
      setFormData({
        id: "",
        name: "",
        category: "emoji",
        tags: "",
        isPremium: false,
        format: "static",
      });
      setImageFile(null);
      setAnimatedFile(null);
      setImagePreview("");
      setAnimatedPreview("");
    } catch (err: any) {
      setError(`Failed to publish: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-[#7C6FFF]" />
        <h2 className="text-xl font-bold text-white">Publish Sticker to API</h2>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Sticker Name <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Fire Emoji" className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C6FFF]" />
          <button onClick={handleGenerateMetadata} disabled={generatingMetadata || !imagePreview} title="AI-generate name, tags, and category from image" className="px-4 py-2 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2a2a2a] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
            {generatingMetadata ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
        {!imagePreview && <p className="mt-1 text-xs text-gray-500">Upload an image first to use AI generation</p>}
      </div>

      {/* Auto-generated ID */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Sticker ID (auto-generated)</label>
        <input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} placeholder="sticker-category-name" className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C6FFF]" />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <select value={formData.category} onChange={(e) => handleCategoryChange(e.target.value as StickerCategory)} className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#7C6FFF]">
          {STICKER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Format <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {(["static", "gif", "lottie"] as StickerFormat[]).map((format) => (
            <button key={format} onClick={() => handleFormatChange(format)} className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${formData.format === format ? "bg-[#7C6FFF] text-white" : "bg-[#0f0f0f] text-gray-400 border border-[#2a2a2a] hover:border-[#7C6FFF]"}`}>
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Tags (comma-separated)</label>
        <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., fire, emoji, hot" className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C6FFF]" />
      </div>

      {/* Premium Toggle */}
      <div className="mb-6 flex items-center gap-3">
        <input type="checkbox" id="premium" checked={formData.isPremium} onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })} className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0f0f0f] text-[#7C6FFF] focus:ring-2 focus:ring-[#7C6FFF]" />
        <label htmlFor="premium" className="text-sm text-gray-300 cursor-pointer">
          Premium Sticker (shows sparkle badge)
        </label>
      </div>

      {/* Image File */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Image File <span className="text-red-400">*</span>
          {formData.format !== "static" && " (thumbnail)"}
        </label>
        <div className="flex items-start gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 hover:border-[#7C6FFF] transition-colors">
              <div className="flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">{imageFile ? imageFile.name : "Click to select PNG/WebP/GIF image"}</p>
                {!imageFile && formData.format === "static" && <p className="text-xs text-gray-500 mt-1">STATIC format: PNG/WebP only</p>}
                {!imageFile && formData.format === "gif" && <p className="text-xs text-gray-500 mt-1">Upload a GIF file</p>}
              </div>
            </div>
            <input type="file" accept="image/png,image/webp,image/jpeg,image/gif" onChange={handleImageSelect} className="hidden" />
          </label>
          {imagePreview && (
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#2a2a2a]">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-[#0f0f0f]" />
            </div>
          )}
        </div>
      </div>

      {/* Animated File (for GIF and Lottie) */}
      {formData.format !== "static" && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Animation File <span className="text-red-400">*</span>
            {formData.format === "gif" ? " (GIF)" : " (Lottie JSON)"}
          </label>
          <div className="flex items-start gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-4 hover:border-[#7C6FFF] transition-colors">
                <div className="flex flex-col items-center justify-center text-center">
                  <Film className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">{animatedFile ? animatedFile.name : `Click to select ${formData.format === "gif" ? "GIF" : "JSON"} file`}</p>
                </div>
              </div>
              <input type="file" accept={formData.format === "gif" ? "image/gif" : "application/json"} onChange={handleAnimatedSelect} className="hidden" />
            </label>
            {animatedPreview && formData.format === "gif" && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#2a2a2a]">
                <img src={animatedPreview} alt="Animation" className="w-full h-full object-contain bg-[#0f0f0f]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      {/* Publish Button */}
      <button onClick={handlePublish} disabled={publishing} className="w-full py-3 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2a2a2a] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
        {publishing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Publish Sticker
          </>
        )}
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">Publishing uploads sticker directly to R2 bucket.</p>
    </div>
  );
}
