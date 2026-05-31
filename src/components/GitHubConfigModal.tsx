import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, GitPullRequest, KeyRound, ListChecks, X } from "lucide-react";
import type { GitHubPublishConfig } from "../hooks/useGitHubPublish";
import { useGitHubPublish } from "../hooks/useGitHubPublish";

interface GitHubConfigModalProps {
  open: boolean;
  onClose: () => void;
}

function parseRepositoryInput(value: string): { owner: string; repo: string } {
  const trimmed = value.trim();
  const markdownMatch = trimmed.match(/\[[^\]]+\]\((https?:\/\/github\.com\/[^)]+)\)/i);
  const source = markdownMatch?.[1] || trimmed;
  const withoutProtocol = source.replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "");
  const withoutGit = withoutProtocol.replace(/\.git$/i, "").replace(/[\])]+$/g, "");
  const [owner = "", repo = ""] = withoutGit.split("/").filter(Boolean);
  return { owner, repo };
}

export function GitHubConfigModal({ open, onClose }: GitHubConfigModalProps) {
  const { getGithubConfig, saveGithubConfig } = useGitHubPublish();
  const [config, setConfig] = useState<GitHubPublishConfig>({ token: "", owner: "AIEraDev", repo: "clypra-api", branch: "main" });
  const [repositoryInput, setRepositoryInput] = useState("AIEraDev/clypra-api");

  useEffect(() => {
    if (!open) return;
    const saved = getGithubConfig();
    if (saved) {
      setConfig(saved);
      setRepositoryInput(`${saved.owner}/${saved.repo}`);
    }
  }, [open]);

  const normalized = useMemo(() => {
    const parsed = parseRepositoryInput(repositoryInput);
    return {
      token: config.token.trim(),
      owner: parsed.owner || config.owner.trim(),
      repo: parsed.repo || config.repo.trim(),
      branch: (config.branch || "main").trim(),
    };
  }, [config, repositoryInput]);

  const repoUrl = normalized.owner && normalized.repo ? `https://github.com/${normalized.owner}/${normalized.repo}` : "";
  const canSave = Boolean(normalized.token && normalized.owner && normalized.repo && normalized.branch);

  if (!open) return null;

  const updateToken = (value: string) => setConfig((current) => ({ ...current, token: value }));
  const updateBranch = (value: string) => setConfig((current) => ({ ...current, branch: value }));

  const save = () => {
    if (!canSave) return;
    saveGithubConfig(normalized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#121219] shadow-2xl">
        <div className="border-b border-[#2A2A38] bg-[#181824] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-teal-300">
                <GitPullRequest size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Create GitHub Pull Request</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9A9AAA]">
                  Studio creates a branch, uploads the JSON and PNG thumbnail, updates indexes, then opens a PR.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] p-1.5 text-[#888899] hover:bg-[#2A2A38] hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
            Repository
            <input
              value={repositoryInput}
              onChange={(event) => setRepositoryInput(event.target.value)}
              placeholder="AIEraDev/clypra-api or https://github.com/AIEraDev/clypra-api"
              className="mt-1 w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs normal-case text-white outline-none placeholder:text-[#555566] focus:border-[#7C6FFF]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888899]">
              Base Branch
              <input value={config.branch} onChange={(event) => updateBranch(event.target.value)} className="mt-1 w-full rounded-lg border border-[#2A2A38] bg-[#09090D] px-3 py-2 text-xs normal-case text-white outline-none focus:border-[#7C6FFF]" />
            </label>
            <div className="rounded-lg border border-[#2A2A38] bg-[#0B0B10] px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#888899]">Publish Branch</div>
              <div className="mt-1 truncate font-mono text-[11px] text-[#CCCCD6]">clypra-studio/&lt;type&gt;/&lt;id&gt;</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888899]">
              <KeyRound size={12} className="text-[#7C6FFF]" /> Personal Access Token
            </div>
            <input
              type="password"
              value={config.token}
              onChange={(event) => updateToken(event.target.value)}
              placeholder="Fine-scoped token with Contents + Pull requests access"
              className="w-full rounded-lg border border-[#2A2A38] bg-[#060609] px-3 py-2 text-xs text-white outline-none placeholder:text-[#555566] focus:border-[#7C6FFF]"
            />
            <p className="mt-2 text-[10px] leading-relaxed text-[#666677]">
              Stored only in this browser localStorage. A public repo still requires write permission to create branches and PRs.
            </p>
          </div>

          <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#888899]">
              <ListChecks size={12} className="text-teal-300" /> Required token setup
            </div>
            <ol className="list-decimal space-y-1.5 pl-4 text-[10px] leading-relaxed text-[#8F8FA0]">
              <li>Open <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer" className="text-teal-300 hover:underline">GitHub fine-grained tokens</a> and create a new token.</li>
              <li>Resource owner must own or have write access to the target repo.</li>
              <li>Repository access: select only <span className="font-mono text-[#D0D0DA]">{normalized.owner}/{normalized.repo}</span>.</li>
              <li>Repository permissions: <span className="font-mono text-[#D0D0DA]">Contents: Read and write</span> and <span className="font-mono text-[#D0D0DA]">Pull requests: Read and write</span>.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-[#2A2A38] bg-[#0B0B10] p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888899]">Resolved Target</div>
            {repoUrl ? (
              <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-[#2A2A38] bg-[#15151C] px-2.5 py-1.5 font-mono text-[11px] text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/10">
                <span className="truncate">{normalized.owner}/{normalized.repo}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            ) : (
              <span className="text-[11px] text-red-300">Enter a valid repository.</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#2A2A38] bg-[#15151C] p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#2A2A38] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2A2A38]">Cancel</button>
          <button type="button" onClick={save} disabled={!canSave} className="rounded-lg bg-[#7C6FFF] px-3 py-2 text-xs font-bold text-white hover:bg-[#6859FF] disabled:cursor-not-allowed disabled:opacity-50">Save PR Settings</button>
        </div>
      </div>
    </div>
  );
}
