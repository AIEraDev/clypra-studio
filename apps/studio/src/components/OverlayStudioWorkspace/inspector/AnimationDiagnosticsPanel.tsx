import React, { useMemo } from "react";
import type { OverlayDocument } from "@clypra-studio/engine";
import { animationValidator } from "@clypra-studio/engine";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface AnimationDiagnosticsPanelProps {
  doc: OverlayDocument;
}

const SEVERITY_STYLES = {
  error: {
    icon: AlertCircle,
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    badgeColor: "bg-red-500/20 text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    badgeColor: "bg-amber-500/20 text-amber-400",
  },
  info: {
    icon: Info,
    textColor: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    badgeColor: "bg-sky-500/20 text-sky-400",
  },
} as const;

export function AnimationDiagnosticsPanel({
  doc,
}: AnimationDiagnosticsPanelProps) {
  const diagnostics = useMemo(() => animationValidator.validate(doc), [doc]);

  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warnCount = diagnostics.filter((d) => d.severity === "warning").length;

  return (
    <div className="bg-[#0F0F14] rounded-xl border border-white/6 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          Animation Diagnostics
        </span>
        {diagnostics.length > 0 && (
          <div className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                {warnCount} warning{warnCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
        {diagnostics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <span className="text-[12px] text-emerald-400 font-medium">
              All animations valid
            </span>
          </div>
        ) : (
          diagnostics.map((diag, i) => {
            const styles = SEVERITY_STYLES[diag.severity];
            const Icon = styles.icon;
            return (
              <div
                key={`${diag.nodeId}-${diag.code}-${i}`}
                className={`flex items-start gap-2 p-2 rounded-lg border ${styles.bgColor} ${styles.borderColor}`}
              >
                <Icon
                  size={13}
                  className={`${styles.textColor} mt-0.5 shrink-0`}
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-violet-300 truncate">
                      {diag.nodeName}
                    </span>
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${styles.badgeColor}`}
                    >
                      {diag.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    {diag.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
