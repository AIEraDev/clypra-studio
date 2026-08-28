import React, { useEffect } from "react";
import { Music } from "lucide-react";
import { useAudioLabState } from "../../labs/audio/hooks/useAudioLabState";
import { useAudioWaveform } from "../../labs/audio/hooks/useAudioWaveform";
import { AudioWaveformPlayer } from "../../labs/audio/components/AudioWaveformPlayer";
import { AudioTelemetryBar } from "../../labs/audio/components/AudioTelemetryBar";
import { AudioDropzone } from "../../labs/audio/components/AudioDropzone";
import { AudioCoverArtCard } from "../../labs/audio/components/AudioCoverArtCard";
import { AudioMetadataEditor } from "../../labs/audio/components/AudioMetadataEditor";
import { AudioLicensingPanel } from "../../labs/audio/components/AudioLicensingPanel";
import { AudioPreflightChecklist } from "../../labs/audio/components/AudioPreflightChecklist";

export function AudioPublishPanel({
  variant = "drawer",
}: {
  variant?: "drawer" | "workspace";
}) {
  const isWorkspace = variant === "workspace";
  const lab = useAudioLabState();

  const waveform = useAudioWaveform({
    audioSource: lab.audioFile || lab.audioUrlOverride,
    initialDuration: Number(lab.duration) || 0,
    loopByDefault: lab.loopable,
  });

  useEffect(() => {
    waveform.setIsLooping(lab.loopable);
  }, [lab.loopable]);

  useEffect(() => {
    if (waveform.duration > 0 && (!lab.duration || Number(lab.duration) === 0)) {
      lab.setDuration(String(Math.round(waveform.duration * 100) / 100));
    }
  }, [waveform.duration, lab.duration, lab.setDuration]);

  return (
    <div
      className={`h-full overflow-y-auto text-sm text-white ${
        isWorkspace ? "p-6" : "p-4 space-y-4"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isWorkspace
            ? "mb-5 border-b border-[#20202A] pb-5"
            : "rounded-xl border border-[#2A2A38] bg-[#15151C] p-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`${
              isWorkspace ? "h-11 w-11" : "h-9 w-9"
            } flex shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.15)]`}
          >
            <Music size={isWorkspace ? 20 : 16} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Audio Publishing
            </p>
            <h3 className={`${isWorkspace ? "text-xl" : "text-sm"} font-bold text-white`}>
              Upload audio directly to Clypra R2
            </h3>
            <p
              className={`${
                isWorkspace ? "max-w-3xl text-sm" : "text-xs"
              } mt-1 leading-relaxed text-[#9A9AAA]`}
            >
              Calibrate audio playback, synthesize metadata with AI, specify licensing rights,
              and deploy immediately into the Clypra native asset registry.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Waveform Stage */}
      <div className="mb-5 space-y-3">
        <AudioWaveformPlayer
          peaks={waveform.peaks}
          isPlaying={waveform.isPlaying}
          currentTime={waveform.currentTime}
          duration={waveform.duration || Number(lab.duration) || 0}
          isLooping={waveform.isLooping}
          playbackRate={waveform.playbackRate}
          volume={waveform.volume}
          isMuted={waveform.isMuted}
          isDecoding={waveform.isDecoding}
          trackTitle={lab.name}
          trackAuthor={lab.author}
          category={lab.category}
          onTogglePlay={waveform.togglePlay}
          onSeekPercent={waveform.seekPercent}
          onReset={waveform.reset}
          onToggleLoop={waveform.togglePlay}
          onSetVolume={waveform.setVolume}
          onToggleMute={() => waveform.setIsMuted(!waveform.isMuted)}
          onSetPlaybackRate={waveform.setPlaybackRate}
        />

        <AudioTelemetryBar
          telemetry={waveform.telemetry}
          duration={waveform.duration || Number(lab.duration) || 0}
          bpm={lab.bpm}
          loopable={lab.loopable}
        />
      </div>

      {/* Grid Layout based on Workspace vs Drawer */}
      <div
        className={
          isWorkspace
            ? "grid grid-cols-1 gap-5 lg:grid-cols-3"
            : "space-y-4"
        }
      >
        {/* Step 1: Ingestion & Cover Art */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#222232] bg-[#0E0E18] p-5 shadow-lg space-y-4">
            <AudioDropzone
              audioFile={lab.audioFile}
              audioUrlOverride={lab.audioUrlOverride}
              onFileSelect={lab.handleAudioFileChange}
            />

            <div className="border-t border-[#1C1C2A] pt-4">
              <AudioCoverArtCard
                coverFile={lab.coverFile}
                coverPreviewUrl={lab.coverPreviewUrl}
                trackTitle={lab.name}
                trackAuthor={lab.author}
                category={lab.category}
                onCoverChange={lab.handleCoverFileChange}
              />
            </div>
          </div>
        </div>

        {/* Step 2: Metadata & AI */}
        <div className="space-y-4">
          <AudioMetadataEditor
            id={lab.id}
            name={lab.name}
            category={lab.category}
            description={lab.description}
            tagsInput={lab.tagsInput}
            bpm={lab.bpm}
            loopable={lab.loopable}
            aiStatus={lab.aiStatus}
            hasAudioSource={!!lab.audioFile || !!lab.audioUrlOverride}
            onIdChange={lab.setId}
            onNameChange={lab.setName}
            onCategoryChange={lab.setCategory}
            onDescriptionChange={lab.setDescription}
            onTagsInputChange={lab.setTagsInput}
            onAddTag={lab.addTag}
            onRemoveTag={lab.removeTag}
            onBpmChange={lab.setBpm}
            onLoopableChange={lab.setLoopable}
            onGenerateAiInfo={lab.handleGenerateInfo}
          />
        </div>

        {/* Step 3: Licensing & Publishing */}
        <div className="space-y-4">
          <AudioLicensingPanel
            author={lab.author}
            licenseType={lab.licenseType}
            licenseUrl={lab.licenseUrl}
            attributionRequired={lab.attributionRequired}
            sourceProvider={lab.sourceProvider}
            sourceUrl={lab.sourceUrl}
            safetyNotes={lab.safetyNotes}
            onAuthorChange={lab.setAuthor}
            onLicenseTypeChange={lab.setLicenseType}
            onLicenseUrlChange={lab.setLicenseUrl}
            onAttributionRequiredChange={lab.setAttributionRequired}
            onSourceProviderChange={lab.setSourceProvider}
            onSourceUrlChange={lab.setSourceUrl}
            onSafetyNotesChange={lab.setSafetyNotes}
          />

          <AudioPreflightChecklist
            preflightChecks={lab.preflightChecks}
            isReadyToPublish={lab.isReadyToPublish}
            validationMessage={lab.validationMessage}
            status={lab.status}
            isAdmin={lab.isAdmin}
            publishApproved={lab.publishApproved}
            onPublishApprovedChange={lab.setPublishApproved}
            onPublish={lab.handlePublish}
          />
        </div>
      </div>
    </div>
  );
}

export default AudioPublishPanel;
