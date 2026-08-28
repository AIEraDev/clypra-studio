import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  CloudUpload,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import type { PreflightCheckItem } from "../types";

interface AudioPreflightChecklistProps {
  preflightChecks: PreflightCheckItem[];
  isReadyToPublish: boolean;
  validationMessage: string | null;
  status: "idle" | "publishing" | "published" | "failed";
  isAdmin: boolean;
  publishApproved: boolean;
  onPublishApprovedChange: (approved: boolean) => void;
  onPublish: () => void;
}

export function AudioPreflightChecklist({
  preflightChecks,
  isReadyToPublish,
  validationMessage,
  status,
  isAdmin,
  publishApproved,
  onPublishApprovedChange,
  onPublish,
}: AudioPreflightChecklistProps) {
  const passedCount = preflightChecks.filter((c) => c.status === "passed").length;
  const totalCount = preflightChecks.length;
  const isPublishing = status === "publishing";

  return (
    <div className="space-y-4 rounded-xl border border-[#222232] bg-[#0E0E18] p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1E1E2C] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Preflight & R2 Deployment
        </h3>
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
            isReadyToPublish
              ? "bg-teal-500/20 text-teal-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {passedCount}/{totalCount} Checks Passed
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {preflightChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-2.5 rounded-lg border border-[#1A1A28] bg-[#0A0A10] p-2.5 text-xs"
          >
            {check.status === "passed" ? (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-400" />
            ) : check.status === "warning" ? (
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
            ) : (
              <XCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-200">{check.label}</div>
              <div
                className={`truncate text-[10px] ${
                  check.status === "passed" ? "text-[#7A7A8E]" : "text-amber-300/80"
                }`}
              >
                {check.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin instant approval */}
      {isAdmin && (
        <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 p-3">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-teal-200">
                Immediate Catalog Publishing
              </div>
              <div className="text-[10px] text-teal-300/70">
                Bypasses staging review and publishes directly to production R2 index
              </div>
            </div>
            <input
              type="checkbox"
              checked={publishApproved}
              onChange={(e) => onPublishApprovedChange(e.target.checked)}
              className="h-4 w-4 rounded border-teal-500/40 bg-[#090910] text-teal-500 focus:ring-teal-500"
            />
          </label>
        </div>
      )}

      {/* Validation Warning Alert if not ready */}
      {validationMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">Preflight requirement pending:</span>{" "}
            <span>{validationMessage}</span>
          </div>
        </div>
      )}

      {/* Publish Action Button */}
      <button
        type="button"
        onClick={onPublish}
        disabled={!isReadyToPublish || isPublishing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_25px_rgba(20,184,166,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
      >
        {isPublishing ? (
          <Loader2 size={16} className="animate-spin text-black" />
        ) : (
          <CloudUpload size={16} className="text-black" />
        )}
        <span>
          {isPublishing
            ? "Packaging & Uploading to R2..."
            : status === "published"
            ? "Uploaded to R2 (Upload Again)"
            : "Upload & Publish to R2"}
        </span>
      </button>

      <p className="text-center text-[10px] text-[#606076]">
        Uploaded assets are indexed and streamable immediately in the Clypra native video editor.
      </p>
    </div>
  );
}
