import React, { useState } from "react";
import type { StickerCategory } from "../types/publish";
import { AlertCircle, CheckCircle, Loader2, Upload, Film, Sparkles } from "lucide-react";
import lottie from "lottie-web";
import { Player } from "@lottiefiles/react-lottie-player";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";
const STICKER_CATEGORIES: StickerCategory[] = ["emoji", "text", "gaming", "sports", "animals", "love", "mood", "food", "travel", "birthday", "frames", "shapes", "fashion", "retro", "illustration"];

type StickerFormat = "lottie";

interface FormData {
  id: string;
  name: string;
  category: StickerCategory;
  tags: string;
  isPremium: boolean;
  format: StickerFormat;
}

// Helper to extract a representative frame (thumbnail) from Lottie JSON data
const extractLottieThumbnail = (lottieJson: any, targetFrame?: number): Promise<{ dataUrl: string; totalFrames: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement("div");
      container.style.width = "512px";
      container.style.height = "512px";
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
        // Grab frame at targetFrame (or 10% progress by default to avoid blank frame)
        const frameToUse = targetFrame !== undefined
          ? Math.min(Math.max(0, targetFrame), totalFrames - 1)
          : Math.min(Math.max(0, Math.floor(totalFrames * 0.1)), totalFrames - 1);
        anim.goToAndStop(frameToUse, true);

        // Give it a tiny moment to complete rendering to canvas
        setTimeout(() => {
          try {
            const canvas = container.querySelector("canvas");
            if (canvas) {
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
        }, 100);
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

// Helper to convert base64 Data URL to a File object
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

export function StickerPublishPanel({ variant = "drawer" }: { variant?: "drawer" | "workspace" }) {
  const isWorkspace = variant === "workspace";
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    category: "emoji",
    tags: "",
    isPremium: false,
    format: "lottie",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [animatedFile, setAnimatedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [animatedPreview, setAnimatedPreview] = useState<string>("");
  
  const [lottieData, setLottieData] = useState<any>(null);
  const [extractingThumbnail, setExtractingThumbnail] = useState(false);
  const [totalFrames, setTotalFrames] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(0);

  const lottieInstanceRef = React.useRef<any>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [publishApproved, setPublishApproved] = useState(true);

  React.useEffect(() => {
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
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);


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

  const handleLottieSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("Please select a JSON file for Lottie animations");
      return;
    }

    setExtractingThumbnail(true);
    setError("");
    setSuccess("");

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      setLottieData(json);
      setAnimatedFile(file);
      
      const fileDataUrl = await fileToDataUrl(file);
      setAnimatedPreview(fileDataUrl);

      const { dataUrl, totalFrames: extractedTotal } = await extractLottieThumbnail(json);
      setTotalFrames(extractedTotal);
      
      const defaultFrame = Math.min(Math.max(0, Math.floor(extractedTotal * 0.1)), extractedTotal - 1);
      setSelectedFrame(defaultFrame);
      setImagePreview(dataUrl);
      
      const thumbFile = dataURLtoFile(dataUrl, `${file.name.replace(".json", "")}-thumb.png`);
      setImageFile(thumbFile);
    } catch (err: any) {
      setError(`Failed to process Lottie file: ${err.message}`);
      setAnimatedFile(null);
      setAnimatedPreview("");
      setLottieData(null);
      setImageFile(null);
      setImagePreview("");
      setTotalFrames(0);
      setSelectedFrame(0);
    } finally {
      setExtractingThumbnail(false);
    }
  };

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
      if (!lottieData) return;
      try {
        setExtractingThumbnail(true);
        const { dataUrl } = await extractLottieThumbnail(lottieData, frame);
        setImagePreview(dataUrl);

        const thumbFile = dataURLtoFile(dataUrl, `${animatedFile?.name.replace(".json", "")}-thumb.png`);
        setImageFile(thumbFile);
      } catch (err: any) {
        setError(`Failed to extract frame: ${err.message}`);
      } finally {
        setExtractingThumbnail(false);
      }
    }, 150);
  };

  const handleGenerateMetadata = async () => {
    if (!imagePreview) {
      setError("Please select a Lottie JSON file first");
      return;
    }

    setGeneratingMetadata(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/ai/sticker-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: imagePreview }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to generate sticker metadata");
      }

      const result = await response.json();

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

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Sticker name is required";
    if (!formData.id.trim()) return "Sticker ID is required";
    if (!animatedFile) return "Please select a Lottie JSON file";
    if (!imageFile) return "Failed to extract thumbnail image";
    return null;
  };

  const handlePublish = async () => {
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPublishing(true);

    try {
      const imageDataUrl = await fileToDataUrl(imageFile!);
      const animatedDataUrl = await fileToDataUrl(animatedFile!);

      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const body = {
        sticker: {
          id: formData.id,
          name: formData.name,
          category: formData.category,
          tags,
          format: "lottie",
          isAnimated: true,
          isPremium: false,
          published: isAdmin ? publishApproved : false,
        },
        imageFileDataUrl: imageDataUrl,
        lottieFileDataUrl: animatedDataUrl,
      };

      const response = await fetch(`${API_BASE_URL}/stickers/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setSuccess(result.message || "✅ Sticker uploaded to R2 successfully!");

      setFormData({
        id: "",
        name: "",
        category: "emoji",
        tags: "",
        isPremium: false,
        format: "lottie",
      });
      setImageFile(null);
      setAnimatedFile(null);
      setImagePreview("");
      setAnimatedPreview("");
      setLottieData(null);
      setTotalFrames(0);
      setSelectedFrame(0);
    } catch (err: any) {
      setError(`Failed to publish: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`h-full overflow-y-auto text-sm text-white ${isWorkspace ? "p-6" : "p-4"}`}>
      {/* Header */}
      <div className={`${isWorkspace ? "mb-5 border-b border-[#20202A] pb-5" : "mb-4 rounded-xl border border-[#2A2A38] bg-[#15151C] p-4"}`}>
        <div className="flex items-start gap-3">
          <span className={`${isWorkspace ? "h-11 w-11" : "h-9 w-9"} flex shrink-0 items-center justify-center rounded-lg border border-[#7C6FFF]/30 bg-[#7C6FFF]/10 text-[#B9B2FF]`}>
            <Upload size={isWorkspace ? 20 : 16} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">Sticker Library</p>
            <h3 className={`${isWorkspace ? "text-xl" : "text-sm"} font-bold`}>Publish Sticker to API</h3>
            <p className={`${isWorkspace ? "max-w-3xl text-sm" : "text-xs"} mt-1 leading-relaxed text-[#9A9AAA]`}>Publish Lottie animated stickers to the R2 bucket immediately.</p>
          </div>
        </div>
      </div>

      <div className={isWorkspace ? "grid grid-cols-[360px_minmax(0,1fr)_390px] items-start gap-5 max-[1260px]:grid-cols-[340px_minmax(0,1fr)] max-[920px]:grid-cols-1" : "space-y-4"}>
        {/* Column 1: Form Fields */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>1. Sticker Metadata</span>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Sticker Name <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Fire Emoji" className="flex-1 px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs" />
              <button onClick={handleGenerateMetadata} disabled={generatingMetadata || !imagePreview} title="AI-generate name, tags, and category from animation thumbnail" className="px-3 py-1.5 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2A2A38] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-xs">
                {generatingMetadata ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              </button>
            </div>
            {!imagePreview && <p className="mt-1 text-[10px] text-gray-500">Upload a Lottie JSON file first to use AI generation</p>}
          </div>

          {/* Auto-generated ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Sticker ID (auto-generated)</label>
            <input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} placeholder="sticker-category-name" className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-gray-400 focus:outline-none focus:border-[#7C6FFF] text-xs font-mono" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select value={formData.category} onChange={(e) => handleCategoryChange(e.target.value as StickerCategory)} className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white focus:outline-none focus:border-[#7C6FFF] text-xs">
              {STICKER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tags (comma-separated)</label>
            <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., fire, emoji, hot" className="w-full px-3 py-1.5 bg-[#09090D] border border-[#2A2A38] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#7C6FFF] text-xs" />
          </div>

          {/* Admin Moderation - Published toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#2A2A38] bg-[#0E0E12] select-none">
              <input
                id="sticker-publish-checkbox"
                type="checkbox"
                checked={publishApproved}
                onChange={(e) => setPublishApproved(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#09090D] text-teal-500 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="sticker-publish-checkbox" className="text-xs font-semibold text-white cursor-pointer">
                Approve and Publish immediately
              </label>
            </div>
          )}
        </section>

        {/* Column 2: Media Files and Previews */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>2. Media Assets</span>
          </div>

          {/* Lottie File Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Animation File <span className="text-red-400">*</span> (Lottie JSON)
            </label>
            <div className="flex flex-col gap-3">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed border-[#2A2A38] rounded-lg p-5 hover:border-[#7C6FFF] transition-colors bg-[#09090D]">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Film className="w-8 h-8 text-gray-500 mb-2" />
                    <p className="text-xs text-gray-300">{animatedFile ? animatedFile.name : "Click to select Lottie JSON file"}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Accepts only JSON files representing Lottie vector animations</p>
                  </div>
                </div>
                <input type="file" accept="application/json" onChange={handleLottieSelect} className="hidden" />
              </label>

              {extractingThumbnail && (
                <div className="flex items-center justify-center gap-2 py-3 bg-[#09090D] rounded-lg border border-[#2A2A38]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7C6FFF]" />
                  <span className="text-xs text-gray-400">Extracting thumbnail...</span>
                </div>
              )}
              {/* Previews side by side */}
              {(lottieData || imagePreview) && (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Live Preview */}
                    {lottieData && (
                      <div className="flex flex-col items-center p-3 rounded-lg border border-[#2A2A38] bg-[#09090D]">
                        <span className="text-[10px] font-mono text-gray-400 mb-2">Live Animation Preview</span>
                        <div className="w-32 h-32 flex items-center justify-center">
                          <Player
                            lottieRef={(instance) => {
                              lottieInstanceRef.current = instance;
                            }}
                            autoplay
                            loop
                            src={lottieData}
                            style={{ height: "100%", width: "100%" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const lottieInstance = lottieInstanceRef.current;
                            if (lottieInstance) {
                              if (lottieInstance.isPaused) {
                                lottieInstance.play();
                              } else {
                                lottieInstance.pause();
                              }
                            }
                          }}
                          className="mt-2 px-2 py-1 bg-[#1A1A24] hover:bg-[#2A2A38] rounded-md text-[10px] font-semibold text-gray-300 transition-colors cursor-pointer"
                        >
                          Play / Pause
                        </button>
                      </div>
                    )}

                    {/* Thumbnail Preview */}
                    {imagePreview && (
                      <div className="flex flex-col items-center p-3 rounded-lg border border-[#2A2A38] bg-[#09090D]">
                        <span className="text-[10px] font-mono text-gray-400 mb-2">Extracted Thumbnail</span>
                        <div className="w-32 h-32 rounded-lg overflow-hidden border border-[#2A2A38] shrink-0 bg-[#06060A] flex items-center justify-center">
                          <img src={imagePreview} alt="Extracted Thumbnail" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Frame Adjustment Slider */}
                  {totalFrames > 0 && (
                    <div className="p-3 bg-[#09090D] border border-[#2A2A38] rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-300">Thumbnail Frame</span>
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
                      <p className="text-[10px] text-gray-500">Drag to select a different frame as the static thumbnail.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 3: Publish controls & instructions */}
        <section className="rounded-xl border border-[#2A2A38] bg-[#101018] p-4 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#2A2A38] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#B9B2FF]">
            <span>3. Review &amp; Submit</span>
          </div>

          <div className="rounded-lg border border-[#2A2A38] bg-[#09090D] p-3 text-xs text-[#9A9AAA]">
            <p className="font-bold text-white mb-1">Upload validation</p>
            <p className="text-[11px] leading-relaxed">Ensure Lottie coordinates are centered. Large animation sequences must use compressed SVG path vectors to guarantee fast load times on devices.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-xs text-green-300">{success}</p>
            </div>
          )}

          {/* Publish Button */}
          <button onClick={handlePublish} disabled={publishing || extractingThumbnail || !animatedFile} className="w-full py-2.5 bg-[#7C6FFF] hover:bg-[#6C5FEF] disabled:bg-[#2A2A38] disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer">
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publish Sticker
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-500 text-center">Uploading directly packages and deploys assets to R2.</p>
        </section>
      </div>
    </div>
  );
}

