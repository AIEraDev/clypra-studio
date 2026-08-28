import React from "react";
import {
  ShieldCheck,
  ExternalLink,
  Lock,
  Scale,
  FileCheck,
} from "lucide-react";
import { LICENSE_TYPES, type LicenseType } from "../types";

interface AudioLicensingPanelProps {
  author: string;
  licenseType: LicenseType;
  licenseUrl: string;
  attributionRequired: boolean;
  sourceProvider: string;
  sourceUrl: string;
  safetyNotes: string;
  onAuthorChange: (author: string) => void;
  onLicenseTypeChange: (license: LicenseType) => void;
  onLicenseUrlChange: (url: string) => void;
  onAttributionRequiredChange: (required: boolean) => void;
  onSourceProviderChange: (provider: string) => void;
  onSourceUrlChange: (url: string) => void;
  onSafetyNotesChange: (notes: string) => void;
}

const LICENSE_DESCRIPTIONS: Record<LicenseType, string> = {
  cc0: "Public Domain Dedication — Universal free commercial use without attribution.",
  "cc-by": "Attribution — Allows commercial & remixing, requires crediting author.",
  "royalty-free": "Royalty-Free — Licensed for worldwide video editor distribution.",
  "public-domain": "Public Domain — Expired or dedicated copyright, free for all uses.",
};

export function AudioLicensingPanel({
  author,
  licenseType,
  licenseUrl,
  attributionRequired,
  sourceProvider,
  sourceUrl,
  safetyNotes,
  onAuthorChange,
  onLicenseTypeChange,
  onLicenseUrlChange,
  onAttributionRequiredChange,
  onSourceProviderChange,
  onSourceUrlChange,
  onSafetyNotesChange,
}: AudioLicensingPanelProps) {
  const isSecureUrl = /^https:\/\//i.test(sourceUrl.trim());

  return (
    <section className="space-y-4 rounded-xl border border-[#222232] bg-[#0E0E18] p-5 shadow-lg">
      <div className="flex items-center gap-2 border-b border-[#1E1E2C] pb-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-500/20 text-[11px] font-bold text-teal-300">
          3
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Rights, Licensing & Origin
        </h3>
      </div>

      {/* Author / Rights Holder */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
          Creator / Rights Holder <span className="text-teal-400">*</span>
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="e.g., Composer Name or Studio Team"
          className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* License Type & Attribution Toggle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            <Scale size={12} className="text-teal-400" />
            <span>License Contract <span className="text-teal-400">*</span></span>
          </label>
          <select
            value={licenseType}
            onChange={(e) => onLicenseTypeChange(e.target.value as LicenseType)}
            className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none cursor-pointer"
          >
            {LICENSE_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#0E0E18] text-white">
                {type.toUpperCase()}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-[#707086] leading-tight">
            {LICENSE_DESCRIPTIONS[licenseType]}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Attribution Requirement
          </label>
          <label className="flex h-9.5 cursor-pointer items-center justify-between rounded-lg border border-[#262638] bg-[#090910] px-3 transition-colors hover:border-teal-500/40">
            <span className="text-xs text-gray-200">Require creator credit</span>
            <input
              type="checkbox"
              checked={attributionRequired}
              onChange={(e) => onAttributionRequiredChange(e.target.checked)}
              className="h-4 w-4 rounded border-[#303046] bg-[#141420] text-teal-500 focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {/* License URL */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
          License Deed URL <span className="text-[#55556E] font-normal lowercase">(optional)</span>
        </label>
        <input
          type="text"
          value={licenseUrl}
          onChange={(e) => onLicenseUrlChange(e.target.value)}
          placeholder="https://creativecommons.org/licenses/..."
          className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Source Provider and HTTPS Source URL */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
            Source Provider <span className="text-teal-400">*</span>
          </label>
          <input
            type="text"
            value={sourceProvider}
            onChange={(e) => onSourceProviderChange(e.target.value)}
            placeholder="e.g., Freesound, Clypra Labs, Pixabay"
            className="w-full rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
              Source URL <span className="text-teal-400">*</span>
            </label>
            {sourceUrl && isSecureUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-[10px] text-teal-400 hover:underline"
              >
                <span>Verify</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="https://freesound.org/sounds/..."
            className={`w-full rounded-lg border bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:outline-none ${
              sourceUrl && !isSecureUrl
                ? "border-red-500/50 focus:border-red-500 text-red-200"
                : "border-[#262638] focus:border-teal-500"
            }`}
          />
          {sourceUrl && !isSecureUrl && (
            <p className="mt-1 text-[10px] text-red-400">Must begin with https://</p>
          )}
        </div>
      </div>

      {/* Safety and Review Notes */}
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8A9E]">
          <FileCheck size={12} className="text-emerald-400" />
          <span>Safety & Review Notes <span className="text-[#55556E] font-normal lowercase">(optional)</span></span>
        </label>
        <textarea
          rows={2}
          value={safetyNotes}
          onChange={(e) => onSafetyNotesChange(e.target.value)}
          placeholder="Verified public domain release, cleared for creator exports without DMCA risks..."
          className="w-full resize-none rounded-lg border border-[#262638] bg-[#090910] px-3 py-2 text-xs text-white placeholder:text-[#505064] focus:border-teal-500 focus:outline-none"
        />
      </div>
    </section>
  );
}
