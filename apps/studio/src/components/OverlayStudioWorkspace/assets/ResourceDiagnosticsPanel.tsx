import React from "react";
import {
  assetRegistry,
  fontRegistry,
  type OverlayDocument,
  type DocumentCommand,
} from "@clypra-studio/engine";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Image,
} from "lucide-react";

interface ResourceDiagnosticsPanelProps {
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function ResourceDiagnosticsPanel({
  doc,
  onExecuteCommand,
}: ResourceDiagnosticsPanelProps) {
  const manifestAssets = doc.assetManifest?.assets || [];

  // Inspect missing/error assets
  const assetIssues: Array<{ assetId: string; status: string; message: string }> = [];
  for (const asset of manifestAssets) {
    const state = assetRegistry.getState(asset.assetId);
    if (state === "missing") {
      assetIssues.push({
        assetId: asset.assetId,
        status: "missing",
        message: `Asset "${asset.assetId}" is missing from registry (using checkerboard fallback)`,
      });
    } else if (state === "error") {
      const entry = assetRegistry.get(asset.assetId);
      assetIssues.push({
        assetId: asset.assetId,
        status: "error",
        message: `Asset "${asset.assetId}" failed to load: ${entry?.error || "Unknown error"}`,
      });
    }
  }

  // Inspect font issues across text nodes
  const fontIssues: Array<{ family: string; message: string }> = [];
  const inspectFonts = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.style?.fontRef) {
        const ref = n.style.fontRef;
        const state = fontRegistry.getState(ref.family, ref.weight, ref.style);
        if (state === "missing" || state === "error") {
          fontIssues.push({
            family: ref.family,
            message: `Font "${ref.family}" (${ref.weight}) is unavailable (using system fallback)`,
          });
        }
      }
      if (n.children) inspectFonts(n.children);
    }
  };
  inspectFonts(doc.nodes);

  const totalIssues = assetIssues.length + fontIssues.length;

  return (
    <div className="bg-[#151519] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Image size={12} className="text-violet-400" />
          Resource Diagnostics
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
            totalIssues === 0
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          {totalIssues === 0 ? "All Resources Ready" : `${totalIssues} Issue${totalIssues > 1 ? "s" : ""}`}
        </span>
      </div>

      {totalIssues === 0 ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[11px] font-medium">
          <CheckCircle2 size={13} />
          <span>All document assets & fonts resolved cleanly.</span>
        </div>
      ) : (
        <div className="space-y-1.5 pt-1">
          {assetIssues.map((issue) => (
            <div
              key={issue.assetId}
              className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]"
            >
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="flex-1 truncate">{issue.message}</span>
            </div>
          ))}

          {fontIssues.map((issue) => (
            <div
              key={issue.family}
              className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]"
            >
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              <span className="flex-1 truncate">{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
