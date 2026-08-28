import React from "react";
import {
  FileAudio,
  Radio,
  Clock,
  HardDrive,
  Activity,
  Repeat,
} from "lucide-react";
import type { AudioTelemetry } from "../types";

interface AudioTelemetryBarProps {
  telemetry: Partial<AudioTelemetry>;
  duration: number;
  bpm?: string | number;
  loopable?: boolean;
}

export function AudioTelemetryBar({
  telemetry,
  duration,
  bpm,
  loopable,
}: AudioTelemetryBarProps) {
  const sampleRateDisplay = telemetry.sampleRate
    ? `${(telemetry.sampleRate / 1000).toFixed(1)} kHz`
    : "44.1 kHz";

  const channelsDisplay =
    telemetry.channels === 1
      ? "Mono (1ch)"
      : telemetry.channels === 2
      ? "Stereo (2ch)"
      : telemetry.channels
      ? `${telemetry.channels} ch`
      : "Stereo";

  const fileSizeDisplay = telemetry.fileSize
    ? `${(telemetry.fileSize / (1024 * 1024)).toFixed(2)} MB`
    : null;

  const mimeDisplay = telemetry.mimeType
    ? telemetry.mimeType.replace("audio/", "").toUpperCase()
    : "AUDIO";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#20202E] bg-[#0C0C14] p-2.5 text-xs text-[#8A8A9E]">
      {/* Format */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
        <FileAudio size={13} className="text-teal-400" />
        <span className="font-mono text-[11px] font-bold text-white">{mimeDisplay}</span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
        <Clock size={13} className="text-cyan-400" />
        <span className="text-[11px] text-[#A0A0B2]">
          Duration: <strong className="text-white">{duration > 0 ? `${duration.toFixed(2)}s` : "0.00s"}</strong>
        </span>
      </div>

      {/* Sample Rate */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
        <Radio size={13} className="text-purple-400" />
        <span className="text-[11px] text-[#A0A0B2]">
          Sample: <strong className="text-white">{sampleRateDisplay}</strong>
        </span>
      </div>

      {/* Channels */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
        <span className="text-[11px] text-[#A0A0B2]">
          Channels: <strong className="text-white">{channelsDisplay}</strong>
        </span>
      </div>

      {/* File Size */}
      {fileSizeDisplay && (
        <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
          <HardDrive size={13} className="text-emerald-400" />
          <span className="text-[11px] text-[#A0A0B2]">
            Size: <strong className="text-white">{fileSizeDisplay}</strong>
          </span>
        </div>
      )}

      {/* BPM */}
      {bpm ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
          <Activity size={13} className="text-amber-400" />
          <span className="text-[11px] text-[#A0A0B2]">
            Tempo: <strong className="text-white">{bpm} BPM</strong>
          </span>
        </div>
      ) : null}

      {/* Loop status */}
      <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-[#252536] bg-[#12121C] px-2.5 py-1">
        <Repeat size={13} className={loopable ? "text-teal-400" : "text-[#55556E]"} />
        <span className="text-[11px] text-[#A0A0B2]">
          {loopable ? (
            <span className="text-teal-300 font-semibold">Loop Ready</span>
          ) : (
            <span>One-Shot</span>
          )}
        </span>
      </div>
    </div>
  );
}
