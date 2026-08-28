import React, { useState, useEffect } from "react";
import { Music2 } from "lucide-react";
import { RailLabShell } from "../../components/RailLabShell";
import type { AudioLabViewMode, AudioAsset, DemoSampleTrack } from "./types";
import { useAudioLabState } from "./hooks/useAudioLabState";
import { useAudioWaveform } from "./hooks/useAudioWaveform";
import { useAudioCatalog } from "./hooks/useAudioCatalog";
import { AudioHeader } from "./components/AudioHeader";
import { AudioWaveformPlayer } from "./components/AudioWaveformPlayer";
import { AudioTelemetryBar } from "./components/AudioTelemetryBar";
import { AudioDropzone } from "./components/AudioDropzone";
import { AudioCoverArtCard } from "./components/AudioCoverArtCard";
import { AudioMetadataEditor } from "./components/AudioMetadataEditor";
import { AudioLicensingPanel } from "./components/AudioLicensingPanel";
import { AudioPreflightChecklist } from "./components/AudioPreflightChecklist";
import { AudioCatalogBrowser } from "./components/AudioCatalogBrowser";

export function AudioLabView() {
  const [viewMode, setViewMode] = useState<AudioLabViewMode>("studio");

  const lab = useAudioLabState();
  const catalog = useAudioCatalog();

  const waveform = useAudioWaveform({
    audioSource: lab.audioFile || lab.audioUrlOverride,
    initialDuration: Number(lab.duration) || 0,
    loopByDefault: lab.loopable,
  });

  // Sync loop state changes between form and player
  useEffect(() => {
    waveform.setIsLooping(lab.loopable);
  }, [lab.loopable]);

  // If waveform discovers calibrated duration, sync to state
  useEffect(() => {
    if (waveform.duration > 0 && (!lab.duration || Number(lab.duration) === 0)) {
      lab.setDuration(String(Math.round(waveform.duration * 100) / 100));
    }
  }, [waveform.duration, lab.duration, lab.setDuration]);

  const handleLoadSample = (sample: DemoSampleTrack) => {
    lab.loadSampleTrack(sample);
  };

  const handleOpenFromCatalog = (track: AudioAsset) => {
    lab.loadSampleTrack(track);
    setViewMode("studio");
  };

  return (
    <RailLabShell
      title="Audio Lab"
      description="Inspect waveforms, enrich metadata, calibrate licensing, and deploy editor-ready audio."
      icon={Music2}
    >
      <div className="flex h-full flex-col overflow-hidden bg-[#09090F]">
        {/* Navigation & Mode Control */}
        <AudioHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          catalogCount={catalog.totalCount}
          onLoadSample={handleLoadSample}
          onReset={lab.resetForm}
        />

        {/* Body View Mode Container */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {viewMode === "catalog" ? (
            <AudioCatalogBrowser
              tracks={catalog.filteredTracks}
              isLoading={catalog.isLoading}
              searchQuery={catalog.searchQuery}
              selectedCategory={catalog.selectedCategory}
              durationFilter={catalog.durationFilter}
              onSearchChange={catalog.setSearchQuery}
              onCategoryChange={catalog.setSelectedCategory}
              onDurationFilterChange={catalog.setDurationFilter}
              onLoadIntoStudio={handleOpenFromCatalog}
              onRefresh={catalog.refetch}
            />
          ) : (
            <div className="mx-auto max-w-7xl space-y-5 p-6">
              {/* Hero Section: Interactive Waveform Player Stage */}
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

              {/* Technical Telemetry Specs Bar */}
              <AudioTelemetryBar
                telemetry={waveform.telemetry}
                duration={waveform.duration || Number(lab.duration) || 0}
                bpm={lab.bpm}
                loopable={lab.loopable}
              />

              {/* 3-Column Balanced Workbench Grid */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Column 1: Audio Ingestion & Artwork */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#222232] bg-[#0E0E18] p-5 shadow-lg space-y-5">
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

                {/* Column 2: Metadata & AI Enrichment */}
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

                {/* Column 3: Rights, Quality Preflight & Publishing */}
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
          )}
        </div>
      </div>
    </RailLabShell>
  );
}

export default AudioLabView;
