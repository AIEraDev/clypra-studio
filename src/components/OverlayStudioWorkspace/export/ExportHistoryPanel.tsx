import React from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileVideo,
} from "lucide-react";
import type { ExportJobRecord } from "@clypra-studio/engine";

interface ExportHistoryPanelProps {
  records: ExportJobRecord[];
  onClearHistory?: () => void;
}

export const ExportHistoryPanel: React.FC<ExportHistoryPanelProps> = ({
  records,
  onClearHistory,
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0F0F14]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileVideo size={14} className="text-violet-400" />
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-300">
            Export History
          </span>
        </div>
        {records.length > 0 && onClearHistory && (
          <button
            onClick={onClearHistory}
            className="text-[10px] text-gray-500 hover:text-gray-300 font-semibold transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <Clock size={28} className="text-gray-600 mb-2 opacity-50" />
            <p className="text-xs font-semibold text-gray-400">
              No export jobs yet
            </p>
            <p className="text-[10px] text-gray-600 mt-1 max-w-[180px]">
              Exported frames and videos will appear here.
            </p>
          </div>
        ) : (
          records.map((job) => {
            const isCompleted = job.status === "completed";
            const isFailed = job.status === "failed";
            const isCancelled = job.status === "cancelled";

            return (
              <div
                key={job.id}
                className="rounded-xl border border-white/5 bg-[#151519] p-3 space-y-2 transition-all hover:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    )}
                    {isFailed && (
                      <AlertCircle size={14} className="text-red-400" />
                    )}
                    {isCancelled && (
                      <Clock size={14} className="text-amber-400" />
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {job.documentTitle}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isCompleted
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : isFailed
                          ? "bg-red-500/15 text-red-400 border border-red-500/25"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                  <span>{job.config.format}</span>
                  <span>{job.progress.totalFrames} frames</span>
                  <span>
                    {new Date(job.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {job.error && (
                  <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded p-1.5 leading-tight">
                    {job.error}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
