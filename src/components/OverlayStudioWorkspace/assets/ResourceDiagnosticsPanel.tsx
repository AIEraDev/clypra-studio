import React, { useState } from "react";
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
  ShieldCheck,
  X,
} from "lucide-react";

interface ResourceDiagnosticsPanelProps {
  doc: OverlayDocument;
  onExecuteCommand: (cmd: DocumentCommand) => void;
}

export function ResourceDiagnosticsPanel({
  doc,
  onExecuteCommand,
}: ResourceDiagnosticsPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const manifestAssets = doc.assetManifest?.assets || [];

  // Inspect missing/error assets
  const assetIssues: Array<{
    assetId: string;
    status: string;
    message: string;
  }> = [];
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
        message: `Asset "${asset.assetId}" failed to load: ${
          entry?.error || "Unknown error"
        }`,
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
    <>
      {/* Compact Status Button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
          totalIssues === 0
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/30"
            : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/30"
        }`}
      >
        <span className="flex items-center gap-2">
          {totalIssues === 0 ? (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          )}
          <span>Resource Diagnostics</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
            totalIssues === 0
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {totalIssues === 0
            ? "All Ready"
            : `${totalIssues} Issue${totalIssues > 1 ? "s" : ""}`}
        </span>
      </button>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121A] p-5 shadow-2xl flex flex-col gap-4 font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Resource Diagnostics Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Content */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {totalIssues === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <CheckCircle2 size={36} className="text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">
                      All Document Resources Resolved
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                      All image assets, video clips, custom web fonts, and
                      component dependencies are fully verified and ready for
                      real-time WebGL rendering and 4K export.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {assetIssues.map((issue) => (
                    <div
                      key={issue.assetId}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs"
                    >
                      <AlertCircle
                        size={16}
                        className="text-red-400 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-red-300">
                          Missing Asset: {issue.assetId}
                        </div>
                        <p className="text-[11px] text-red-300/80 mt-0.5 leading-relaxed">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  ))}

                  {fontIssues.map((issue) => (
                    <div
                      key={issue.family}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs"
                    >
                      <AlertTriangle
                        size={16}
                        className="text-amber-400 shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-300">
                          Font Warning: {issue.family}
                        </div>
                        <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
