import React, { useState } from "react";
import { ArrowUpDown, Beaker, Copy, Download, Loader2, Settings, Sparkles, UploadCloud } from "lucide-react";
import type { Preset, TextEffectConfig } from "@clypra/engine";
import type { SceneDocument } from "@clypra/engine";
import { ExportBadge } from "./StudioChrome";
import { getEffectRepresentation } from "../codeGenerator";
import { useGitHubPublish } from "../hooks/useGitHubPublish";
import { GitHubConfigModal } from "./GitHubConfigModal";
import { PublishEffectModal } from "./PublishEffectModal";
import type { EffectApiCategory as ModalEffectApiCategory } from "./PublishEffectModal";

type CodeTab = "engine" | "definition" | "lab";

const EFFECT_API_CATEGORIES = [
  "3d", "neon", "metallic", "glitch", "retro", "gradient", "grunge", "outline", "shadow", "elements", "luxury",
  "essentials", "color", "light", "stylize", "distort",
  "vintage", "modern", "cinematic", "bw"
] as const;

export type EffectApiCategory = (typeof EFFECT_API_CATEGORIES)[number];

interface ResearchResult {
  themeName: string;
  historicalContext: string;
  visualRules: string[];
  paletteDeconstruction: string[];
  config: TextEffectConfig;
  extensionCode: string;
}

interface ExportLabPanelProps {
  isMobile: boolean;
  mobileActiveTab: "controls" | "preview" | "code";
  activeTab: CodeTab;
  onActiveTabChange: (tab: CodeTab) => void;
  engineFormat: "ts" | "js" | "txt" | "html";
  onEngineFormatChange: (format: "ts" | "js" | "txt" | "html") => void;
  definitionFormat: "ts" | "json" | "txt" | "html";
  onDefinitionFormatChange: (format: "ts" | "json" | "txt" | "html") => void;
  activeEffectId: string;
  config: TextEffectConfig;
  scene: SceneDocument;
  highlightedCode: string;
  currentCodeText: string;
  copiedCodeFeedback: boolean;
  onCopyCode: () => void;
  onDownloadCode: () => void;
  researchTopic: string;
  onResearchTopicChange: (topic: string) => void;
  researchStatus: "idle" | "researching" | "completed" | "failed";
  researchError: string | null;
  researchLogs: string[];
  researchResult: ResearchResult | null;
  onExecuteResearch: () => void;
  onApplyResearchResult: () => void;
  blendAId: string;
  blendBId: string;
  blendRatio: number;
  onBlendAIdChange: (id: string) => void;
  onBlendBIdChange: (id: string) => void;
  onBlendRatioChange: (ratio: number) => void;
  onPerformBlend: () => void;
  presets: Preset[];
  onCaptureEffectThumbnail: () => string | null;
  effectApiCategory: EffectApiCategory;
  onEffectApiCategoryChange: (category: EffectApiCategory) => void;
}

export function ExportLabPanel({ isMobile, mobileActiveTab, activeTab, onActiveTabChange, engineFormat, onEngineFormatChange, definitionFormat, onDefinitionFormatChange, activeEffectId, config, scene, highlightedCode, currentCodeText, copiedCodeFeedback, onCopyCode, onDownloadCode, researchTopic, onResearchTopicChange, researchStatus, researchError, researchLogs, researchResult, onExecuteResearch, onApplyResearchResult, blendAId, blendBId, blendRatio, onBlendAIdChange, onBlendBIdChange, onBlendRatioChange, onPerformBlend, presets, onCaptureEffectThumbnail, effectApiCategory, onEffectApiCategoryChange }: ExportLabPanelProps) {
  const virtualTarget = activeTab === "engine" ? (engineFormat === "html" ? `${activeEffectId}-sandbox.html` : `${activeEffectId}-engine.${engineFormat}`) : definitionFormat === "html" ? `${activeEffectId}-sandbox.html` : `${activeEffectId}-definition.${definitionFormat}`;
  const { publishEffect, getGithubConfig } = useGitHubPublish();
  const [showGithubConfig, setShowGithubConfig] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published" | "failed">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishPrUrl, setPublishPrUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  // Metadata state
  const [effectId, setEffectId] = useState(activeEffectId);
  const [effectName, setEffectName] = useState(config.effectName || "");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ id?: string; name?: string }>({});

  const handleOpenPublishModal = () => {
    const thumbnail = onCaptureEffectThumbnail();
    if (!thumbnail) {
      setPublishStatus("failed");
      setPublishMessage("Preview canvas is not ready.");
      return;
    }

    if (!getGithubConfig()) {
      setShowGithubConfig(true);
      return;
    }

    // Set initial values
    setThumbnailDataUrl(thumbnail);
    setEffectId(activeEffectId);
    setEffectName(config.effectName || "");
    setDescription("");
    setTagsInput("");
    setValidationErrors({});
    setPublishStatus("idle");
    setPublishMessage(null);
    setPublishPrUrl(null);
    setShowPublishModal(true);
  };

  const handlePublishEffect = async () => {
    // Validate
    const errors: { id?: string; name?: string } = {};
    if (!effectId.trim()) errors.id = "Effect ID is required";
    if (!effectName.trim()) errors.name = "Effect name is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setPublishStatus("publishing");
    setPublishPrUrl(null);
    setPublishMessage("Creating publish branch, uploading files, and opening PR…");

    try {
      const definition = getEffectRepresentation(config) as any;
      definition.id = effectId;
      definition.name = effectName;
      definition.description = description;
      definition.tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      definition.category = effectApiCategory;

      const result = await publishEffect({
        id: definition.id,
        category: definition.category,
        definition,
        thumbnailDataUrl: thumbnailDataUrl!,
      });

      setPublishStatus("published");
      setPublishPrUrl(result.prUrl);
      setPublishMessage(`PR ready: ${result.branch} · ${result.files.length} files`);
    } catch (error) {
      setPublishStatus("failed");
      setPublishPrUrl(null);
      setPublishMessage(error instanceof Error ? error.message : "Publish failed.");
    }
  };

  return (
    <section id="right-code-panel" className={`${isMobile && mobileActiveTab !== "code" ? "hidden" : "flex"} relative w-full shrink-0 flex-col overflow-hidden border-l border-[#2A2A38] bg-[#15151C] md:w-[${isMobile ? "full" : "360px"}]`}>
      <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A38] bg-[#1E1E26] p-1">
        <div className="flex w-full rounded-lg border border-[#2A2A38]/60 bg-[#0D0D11] p-0.5">
          {[
            { id: "engine" as const, label: "Engine Code" },
            { id: "definition" as const, label: "Clypra Spec" },
            { id: "lab" as const, label: "Lab & Extend", icon: Beaker },
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => onActiveTabChange(tab.id)} className={`flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-center font-sans text-[10px] font-semibold uppercase tracking-wide transition-all ${activeTab === tab.id ? (tab.id === "lab" ? "bg-teal-500 text-black" : "bg-[#7C6FFF] text-white") : tab.id === "lab" ? "text-teal-400 hover:text-teal-300" : "text-clypra-muted hover:text-white"}`}>
              {tab.icon ? <tab.icon size={10} /> : null}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "lab" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#111116] font-sans text-[#A0A0B0]">
          <div className="shrink-0 border-b border-[#2A2A38] bg-[#16161F] p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
              <Beaker size={13} className="text-teal-400" /> Typographic Research & Extend Lab
            </h4>
            <p className="mt-1 text-[10px] leading-normal text-clypra-muted">Research, blend, and extend styles while keeping generated payloads compatible with the current renderer.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-auto p-4">
            <div className="space-y-3 rounded-lg border border-[#2A2A38] bg-[#181824] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#7C6FFF]">
                  <Sparkles size={11} className="text-teal-400" /> Deep Research
                </span>
                <span className="font-mono text-[9px] text-gray-500">Gemini</span>
              </div>
              <div className="flex gap-2">
                <input id="lab-research-topic-input" type="text" value={researchTopic} onChange={(event) => onResearchTopicChange(event.target.value)} placeholder="e.g. Acid Neon Glow, Bauhaus Mono" disabled={researchStatus === "researching"} className="min-w-0 flex-1 rounded-lg border border-gray-800 bg-[#09090D] px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:border-teal-400 focus:outline-none disabled:opacity-50" />
                <button id="lab-research-submit-btn" type="button" onClick={onExecuteResearch} disabled={researchStatus === "researching" || !researchTopic.trim()} className="rounded-lg bg-teal-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black transition-all hover:bg-teal-400 disabled:opacity-50">
                  {researchStatus === "researching" ? "Running" : "Query"}
                </button>
              </div>

              {researchStatus === "researching" && (
                <div className="space-y-1.5 rounded-lg border border-dashed border-gray-800 bg-[#09090D] p-3">
                  <div className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase text-teal-400">
                    <Loader2 size={11} className="animate-spin" />
                    Synthesizing
                  </div>
                  {researchLogs.map((log, index) => (
                    <div key={`${log}-${index}`} className="pl-4 font-mono text-[9px] leading-snug text-gray-500">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {researchStatus === "failed" && <div className="rounded-lg border border-red-900/40 bg-red-950/40 p-3 font-mono text-[10px] text-red-300">Query Error: {researchError}</div>}

              {researchStatus === "completed" && researchResult && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-teal-500/20 bg-[#09090D]/80 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="truncate text-[11px] font-bold uppercase tracking-wide text-teal-400">{researchResult.themeName}</h5>
                      <button type="button" onClick={onApplyResearchResult} className="rounded border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-teal-400 hover:bg-teal-500/25">
                        Apply
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-gray-300">{researchResult.historicalContext}</p>
                  </div>
                  <div className="space-y-1">
                    {researchResult.visualRules.map((rule, index) => (
                      <p key={`${rule}-${index}`} className="text-[10px] leading-relaxed text-gray-300">
                        {rule}
                      </p>
                    ))}
                  </div>
                  <pre className="max-h-[140px] overflow-auto rounded-lg border border-gray-800 bg-[#08080C] p-2 font-mono text-[9px] leading-relaxed text-teal-300">{researchResult.extensionCode}</pre>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-[#2A2A38] bg-[#181824] p-4">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#7C6FFF]">
                <ArrowUpDown size={11} className="text-teal-400" /> Style Blender
              </span>
              <select id="blend-select-a" value={blendAId} onChange={(event) => onBlendAIdChange(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-[#09090D] px-2.5 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none">
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.isCustom ? "Saved " : ""}
                    {preset.name}
                  </option>
                ))}
              </select>
              <select id="blend-select-b" value={blendBId} onChange={(event) => onBlendBIdChange(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-[#09090D] px-2.5 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none">
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.isCustom ? "Saved " : ""}
                    {preset.name}
                  </option>
                ))}
              </select>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[9px] text-gray-500">
                  <span>Blend balance</span>
                  <span>{Math.round(blendRatio * 100)}%</span>
                </div>
                <input id="blend-factor-slider" type="range" min="0" max="1" step="0.05" value={blendRatio} onChange={(event) => onBlendRatioChange(parseFloat(event.target.value))} className="w-full accent-teal-400" />
              </div>
              <button id="perform-blend-action-btn" type="button" onClick={onPerformBlend} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7C6FFF] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#6c5eff]">
                <Beaker size={12} /> Render Composite Blend
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A38] bg-[#111116] px-4 py-2">
            <ExportBadge />
            <span className="font-mono text-[10px] text-clypra-muted">
              {config.canvasWidth}×{config.canvasHeight} · {scene.timeline.duration}s
            </span>
          </div>
          <div className="flex shrink-0 flex-col border-b border-[#2A2A38] bg-[#111116]">
            <div className="flex items-center gap-3 border-b border-[#2A2A38]/40 bg-[#16161F] px-4 py-2">
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-clypra-muted">Virtual Export Target</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-bold text-gray-300" title={virtualTarget}>
                {virtualTarget}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-1 justify-start">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="shrink-0 font-mono text-[10px] uppercase text-[#555566]">Format:</span>

                {activeTab === "engine" ? (
                  <select id="engine-format-dropdown" value={engineFormat} onChange={(event) => onEngineFormatChange(event.target.value as ExportLabPanelProps["engineFormat"])} className="min-w-0 flex-1 rounded border border-[#2A2A38] bg-[#0A0A0E] px-2 py-1.5 text-[11px] font-medium text-white focus:border-[#7C6FFF] focus:outline-none">
                    <option value="ts">TypeScript (.ts)</option>
                    <option value="js">JavaScript (.js)</option>
                    <option value="html">Interactive Sandbox (.html)</option>
                    <option value="txt">Text Only (.txt)</option>
                  </select>
                ) : (
                  <select id="definition-format-dropdown" value={definitionFormat} onChange={(event) => onDefinitionFormatChange(event.target.value as ExportLabPanelProps["definitionFormat"])} className="min-w-0 flex-1 rounded border border-[#2A2A38] bg-[#0A0A0E] px-2 py-1.5 text-[11px] font-medium text-white focus:border-[#7C6FFF] focus:outline-none">
                    <option value="ts">TypeScript (.ts)</option>
                    <option value="json">Raw JSON (.json)</option>
                    <option value="html">Interactive Sandbox (.html)</option>
                    <option value="txt">Text Only (.txt)</option>
                  </select>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                <button id="copy-code-cloner-btn" type="button" onClick={onCopyCode} className="flex flex-1 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-[#2A2A38] bg-[#1E1E26] px-3 py-1 text-[10px] font-semibold text-white hover:bg-[#2A2A38]">
                  <Copy size={11} className={copiedCodeFeedback ? "text-green-500" : "text-white"} />
                  {copiedCodeFeedback ? "Copied" : "Copy"}
                </button>

                <button id="download-code-btn" type="button" onClick={onDownloadCode} className="flex flex-1 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-[#7C6FFF]/45 bg-[#7C6FFF]/25 px-3 py-1 text-[10px] font-bold text-white hover:bg-[#7C6FFF]/35">
                  <Download size={11} className="text-[#a89fff]" />
                  Download
                </button>

                <select id="effect-api-category-select" value={effectApiCategory} onChange={(event) => onEffectApiCategoryChange(event.target.value as EffectApiCategory)} className="shrink-0 cursor-pointer flex-1 rounded border border-[#2A2A38] bg-[#0A0A0E] px-2 py-1 text-[10px] font-semibold text-white outline-none hover:bg-[#15151C] focus:border-teal-500" title="API category for PR publishing">
                  {EFFECT_API_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button id="github-settings-btn" type="button" onClick={() => setShowGithubConfig(true)} className="flex flex-1 shrink-0 justify-center cursor-pointer items-center gap-1.5 rounded border border-[#2A2A38] bg-[#1E1E26] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#2A2A38]" title="GitHub settings">
                  <Settings size={11} />
                  Settings
                </button>

                <button id="publish-effect-api-btn" type="button" onClick={handleOpenPublishModal} disabled={publishStatus === "publishing"} className="flex flex-1 justify-center cursor-pointer shrink-0 items-center gap-1.5 rounded border border-teal-500/45 bg-teal-500/20 px-3 py-1 text-[10px] font-bold text-teal-200 hover:bg-teal-500/30 disabled:opacity-50 whitespace-nowrap">
                  {publishStatus === "publishing" ? <Loader2 size={11} className="animate-spin" /> : <UploadCloud size={11} />}
                  Publish to API
                </button>
              </div>
            </div>
          </div>

          {publishMessage ? (
            <div className={`flex items-center justify-between gap-3 border-b border-[#2A2A38] px-4 py-2 font-mono text-[10px] ${publishStatus === "failed" ? "bg-red-950/30 text-red-300" : publishStatus === "published" ? "bg-teal-950/30 text-teal-300" : "bg-[#111116] text-[#888899]"}`}>
              <span className="min-w-0 truncate">{publishMessage}</span>
              {publishPrUrl ? (
                <a href={publishPrUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded border border-teal-500/40 bg-teal-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-teal-200 hover:bg-teal-500/20">
                  Open PR
                </a>
              ) : null}
            </div>
          ) : null}

          <div id="hljs-code-scroller" className="flex flex-1 overflow-auto bg-[#09090D] p-4 font-mono">
            <div className="mr-2.5 flex w-[18px] select-none flex-col border-r border-[#1E1E26] pr-2.5 text-right font-mono text-[10px] font-semibold leading-5 text-[#313142]">
              {currentCodeText.split("\n").map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            <pre className="flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-5 text-gray-300">
              <code className="language-typescript block bg-transparent" style={{ fontFamily: "'JetBrains Mono', monospace" }} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          </div>

          <div className="shrink-0 border-t border-[#2A2A38] bg-[#15151C] p-3 text-center font-sans text-[10px] leading-normal text-clypra-muted">
            Ready for Clypra integration under <span className="font-mono text-gray-400">/features/text-effects/</span>
          </div>
        </>
      )}
      <GitHubConfigModal open={showGithubConfig} onClose={() => setShowGithubConfig(false)} />
      <PublishEffectModal open={showPublishModal} onClose={() => setShowPublishModal(false)} effectId={effectId} effectName={effectName} category={effectApiCategory as ModalEffectApiCategory} description={description} tagsInput={tagsInput} validationErrors={validationErrors} config={config} thumbnailDataUrl={thumbnailDataUrl || undefined} onEffectIdChange={setEffectId} onEffectNameChange={setEffectName} onCategoryChange={(cat) => onEffectApiCategoryChange(cat as EffectApiCategory)} onDescriptionChange={setDescription} onTagsInputChange={setTagsInput} onPublish={handlePublishEffect} publishStatus={publishStatus} publishMessage={publishMessage} publishPrUrl={publishPrUrl} />
    </section>
  );
}
