/**
 * Publish Mode Selector
 *
 * Allows users to choose between GitHub (PR-based) and R2 (instant) publishing
 */

import { useState, useEffect } from "react";
import { getR2Config } from "../../services/r2Service";
import { getGithubConfig } from "../../hooks/useGitHubPublish";

export type PublishMode = "github" | "r2";

interface PublishModeSelectorProps {
  value: PublishMode;
  onChange: (mode: PublishMode) => void;
  className?: string;
}

export function PublishModeSelector({ value, onChange, className = "" }: PublishModeSelectorProps) {
  const [hasGitHub, setHasGitHub] = useState(false);
  const [hasR2, setHasR2] = useState(false);

  useEffect(() => {
    setHasGitHub(!!getGithubConfig());
    setHasR2(!!getR2Config());
  }, []);

  if (!hasGitHub && !hasR2) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 ${className}`}>
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>No publishing method configured.</strong>
          <br />
          Configure GitHub or R2 publishing in Settings to publish content.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Publishing Method</label>

      <div className="grid grid-cols-2 gap-3">
        {/* GitHub Option */}
        <button
          type="button"
          onClick={() => hasGitHub && onChange("github")}
          disabled={!hasGitHub}
          className={`
            relative p-4 text-left rounded-lg border-2 transition-all
            ${value === "github" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}
            ${hasGitHub ? "hover:border-blue-300 cursor-pointer" : "opacity-50 cursor-not-allowed"}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">GitHub</span>
            </div>
            {value === "github" && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Create PR for review before publishing</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>Community contributions</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>Review workflow</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>100MB file limit</span>
            </div>
          </div>
          {!hasGitHub && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">Not configured</div>}
        </button>

        {/* R2 Option */}
        <button
          type="button"
          onClick={() => hasR2 && onChange("r2")}
          disabled={!hasR2}
          className={`
            relative p-4 text-left rounded-lg border-2 transition-all
            ${value === "r2" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}
            ${hasR2 ? "hover:border-orange-300 cursor-pointer" : "opacity-50 cursor-not-allowed"}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.983 2.508l7.75 4.423a.5.5 0 01.25.433v8.552a.5.5 0 01-.25.433l-7.75 4.423a.5.5 0 01-.5 0l-7.75-4.423a.5.5 0 01-.25-.433V7.364a.5.5 0 01.25-.433l7.75-4.423a.5.5 0 01.5 0z" />
              </svg>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">R2</span>
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Instant</span>
            </div>
            {value === "r2" && (
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Publish directly to production instantly</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>No review needed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>Unlimited file size</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>•</span>
              <span>Faster uploads</span>
            </div>
          </div>
          {!hasR2 && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">Not configured</div>}
        </button>
      </div>

      {value === "r2" && hasR2 && (
        <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-800 dark:text-orange-300">
            ⚡ <strong>Instant publishing:</strong> Content will be live immediately without review. Make sure it meets quality standards.
          </p>
        </div>
      )}
    </div>
  );
}
