import React, { useRef } from "react";
import {
  assetRegistry,
  type AssetRef,
  type DocumentCommand,
  type PrimitiveMediaNode,
} from "@clypra-studio/engine";
import { Image, Upload, AlertTriangle } from "lucide-react";

interface AssetSelectorProps {
  node: PrimitiveMediaNode;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function AssetSelector({ node, onExecuteCommand }: AssetSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAssetId = node.assetId || "";
  const allAssets = assetRegistry.list();
  const currentEntry = currentAssetId
    ? assetRegistry.get(currentAssetId)
    : undefined;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssetId = e.target.value;
    onExecuteCommand({
      type: "SET_ASSET_REF",
      nodeId: node.id,
      assetId: newAssetId,
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const assetId = `asset-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const ref: AssetRef = {
      assetId,
      kind: file.type.startsWith("video") ? "video" : "image",
      source: "local",
      uri: blobUrl,
      metadata: { originalFilename: file.name, mimeType: file.type },
    };

    assetRegistry.register(ref);
    assetRegistry.markReady(assetId, blobUrl);

    onExecuteCommand({ type: "REGISTER_ASSET", asset: ref });
    onExecuteCommand({ type: "SET_ASSET_REF", nodeId: node.id, assetId });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-[#151519] border border-white/6 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
          <Image size={11} className="text-violet-400" />
          Asset Reference
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
        >
          <Upload size={10} />
          Upload New
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.svg"
          className="hidden"
          onChange={handleFileImport}
        />
      </div>

      {/* Asset Dropdown */}
      <select
        value={currentAssetId}
        onChange={handleSelectChange}
        className="w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors"
      >
        <option value="">-- None (Missing Asset) --</option>
        {allAssets.map((asset) => (
          <option key={asset.assetId} value={asset.assetId}>
            {asset.assetId} ({asset.kind} • {asset.source})
          </option>
        ))}
      </select>

      {/* Selected Asset Details Card */}
      {currentEntry ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1C1C22] border border-white/4">
          <div className="w-8 h-8 rounded bg-[#151519] overflow-hidden flex items-center justify-center shrink-0">
            {currentEntry.resolvedUrl ? (
              <img
                src={currentEntry.resolvedUrl}
                alt={currentAssetId}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image size={14} className="text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-mono text-violet-300 truncate">
              {currentAssetId}
            </p>
            <p className="text-[9px] text-gray-500 flex items-center gap-1">
              <span className="uppercase text-gray-400">
                {currentEntry.ref.kind}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                {currentEntry.refCount} node
                {currentEntry.refCount > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>
      ) : currentAssetId ? (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold">
          <AlertTriangle size={12} />
          <span>Asset "{currentAssetId}" not in registry (using fallback)</span>
        </div>
      ) : null}
    </div>
  );
}
