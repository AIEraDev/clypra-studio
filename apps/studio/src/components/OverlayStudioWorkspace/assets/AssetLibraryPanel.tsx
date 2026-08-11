import React, { useState, useRef } from "react";
import {
  assetRegistry,
  runtimeAssetResolver,
  type OverlayDocument,
  type DocumentCommand,
  type AssetRef,
  type AssetKind,
  type PrimitiveMediaNode,
} from "@clypra-studio/engine";
import {
  Image,
  Upload,
  Link,
  Plus,
  Trash2,
  Search,
  FileImage,
  Video,
  Smile,
  Globe,
  HardDrive,
} from "lucide-react";

interface AssetLibraryPanelProps {
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

type FilterKind = "all" | "image" | "video" | "icon";

const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";
const LABEL_CLS = "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";

export function AssetLibraryPanel({ doc, onExecuteCommand }: AssetLibraryPanelProps) {
  const [filter, setFilter] = useState<FilterKind>("all");
  const [search, setSearch] = useState("");
  const [showRemoteForm, setShowRemoteForm] = useState(false);

  // Remote form state
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteAssetId, setRemoteAssetId] = useState("");
  const [remoteKind, setRemoteKind] = useState<AssetKind>("image");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read assets from document manifest or registry
  const manifestAssets = doc.assetManifest?.assets || [];

  // Compute live list of assets (merging document manifest + active registry entries)
  const registeredAssets = assetRegistry.list();
  const allAssetsMap = new Map<string, AssetRef>();
  for (const a of manifestAssets) allAssetsMap.set(a.assetId, a);
  for (const a of registeredAssets) allAssetsMap.set(a.assetId, a);
  const allAssets = Array.from(allAssetsMap.values());

  const filteredAssets = allAssets.filter((asset) => {
    if (filter !== "all" && asset.kind !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        asset.assetId.toLowerCase().includes(q) ||
        (asset.uri && asset.uri.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle local file import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const assetId = `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const kind: AssetKind = file.type.startsWith("video") ? "video" : "image";

    const ref: AssetRef = {
      assetId,
      kind,
      source: "local",
      uri: blobUrl,
      metadata: {
        originalFilename: file.name,
        mimeType: file.type,
      },
    };

    // Register in engine
    assetRegistry.register(ref);
    assetRegistry.markReady(assetId, blobUrl);

    // Dispatch command to add to document assetManifest
    onExecuteCommand({ type: "REGISTER_ASSET", asset: ref });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle remote URL add
  const handleAddRemote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl.trim()) return;

    const assetId =
      remoteAssetId.trim() ||
      `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const ref: AssetRef = {
      assetId,
      kind: remoteKind,
      source: "remote",
      uri: remoteUrl.trim(),
    };

    assetRegistry.register(ref);
    assetRegistry.markReady(assetId, remoteUrl.trim());

    onExecuteCommand({ type: "REGISTER_ASSET", asset: ref });

    setRemoteUrl("");
    setRemoteAssetId("");
    setShowRemoteForm(false);
  };

  // Insert asset into scene as PrimitiveMediaNode
  const handleInsertNode = (asset: AssetRef) => {
    const mediaNode: PrimitiveMediaNode = {
      id: `media-${Date.now().toString(36)}`,
      name: asset.metadata?.originalFilename || asset.assetId,
      type: "media",
      mediaType: asset.kind === "icon" ? "icon" : "image",
      assetId: asset.assetId,
      src: asset.uri,
      x: 100,
      y: 100,
      width: asset.metadata?.width || 300,
      height: asset.metadata?.height || 200,
    };

    onExecuteCommand({ type: "ADD_NODE", node: mediaNode });
  };

  // Delete asset from manifest
  const handleDeleteAsset = (assetId: string) => {
    onExecuteCommand({ type: "REMOVE_ASSET", assetId });
    assetRegistry.release(assetId);
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F14] overflow-hidden">
      {/* ── TOP ACTION BAR ───────────────────────────────────────────── */}
      <div className="p-3 border-b border-white/[0.05] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Image size={12} className="text-violet-400" />
            Asset Catalog
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            >
              <Upload size={11} />
              Import
            </button>
            <button
              type="button"
              onClick={() => setShowRemoteForm((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              <Link size={11} />
              URL
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.svg"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Remote form dropdown */}
        {showRemoteForm && (
          <form
            onSubmit={handleAddRemote}
            className="p-2.5 bg-[#151519] border border-white/[0.08] rounded-xl flex flex-col gap-2 mt-1"
          >
            <div>
              <label className={LABEL_CLS}>Asset URI (HTTPS)</label>
              <input
                type="url"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className={INPUT_CLS}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>Asset ID (Optional)</label>
                <input
                  type="text"
                  value={remoteAssetId}
                  onChange={(e) => setRemoteAssetId(e.target.value)}
                  placeholder="hero-bg"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Kind</label>
                <select
                  value={remoteKind}
                  onChange={(e) => setRemoteKind(e.target.value as AssetKind)}
                  className={INPUT_CLS}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="icon">Icon</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setShowRemoteForm(false)}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-colors"
              >
                Add Asset
              </button>
            </div>
          </form>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by ID or URI…"
            className="w-full bg-[#151519] border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white focus:border-violet-500 outline-none placeholder:text-gray-600"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {(["all", "image", "video", "icon"] as FilterKind[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === f
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── ASSET LIST / GRID ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <Image size={28} className="text-gray-600 mb-2 opacity-50" />
            <p className="text-[12px] font-semibold text-gray-400">No assets found</p>
            <p className="text-[10px] text-gray-600 mt-1 max-w-[180px]">
              Import a local image or add a remote URI to populate your catalog.
            </p>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const entry = assetRegistry.get(asset.assetId);
            const state = entry?.state || "pending";
            const refCount = entry?.refCount || 0;
            const resolvedUrl = entry?.resolvedUrl || asset.uri;

            return (
              <div
                key={asset.assetId}
                className="group relative bg-[#151519] border border-white/[0.06] hover:border-violet-500/30 rounded-xl p-2.5 transition-all flex gap-3 items-center"
              >
                {/* Thumbnail Preview Box */}
                <div className="w-12 h-12 rounded-lg bg-[#1C1C22] border border-white/[0.06] overflow-hidden flex items-center justify-center shrink-0 relative">
                  {resolvedUrl && state === "ready" ? (
                    <img
                      src={resolvedUrl}
                      alt={asset.assetId}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : asset.kind === "video" ? (
                    <Video size={18} className="text-violet-400" />
                  ) : asset.kind === "icon" ? (
                    <Smile size={18} className="text-emerald-400" />
                  ) : (
                    <FileImage size={18} className="text-gray-500" />
                  )}

                  {/* State badge indicator */}
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${
                      state === "ready"
                        ? "bg-emerald-400"
                        : state === "loading"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-red-400"
                    }`}
                  />
                </div>

                {/* Metadata Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold font-mono text-violet-300 truncate">
                      {asset.assetId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-semibold text-gray-500">
                    <span className="uppercase px-1 py-0.2 rounded bg-white/[0.06] text-gray-400">
                      {asset.kind}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {asset.source === "remote" ? (
                        <Globe size={9} className="text-sky-400" />
                      ) : (
                        <HardDrive size={9} className="text-amber-400" />
                      )}
                      {asset.source}
                    </span>
                    {refCount > 0 && (
                      <span className="text-emerald-400 font-bold">
                        {refCount} node{refCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleInsertNode(asset)}
                    title="Insert as Media Node"
                    className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(asset.assetId)}
                    title="Remove Asset"
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
