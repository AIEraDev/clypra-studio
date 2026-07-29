import type { BakedFrameSpectrum } from "@clypra-studio/types";
import { OfflineAudioSpectrumBaker } from "./offline-audio-baker";
import type { UniformBufferManager } from "../keyframe/uniform-buffer-manager";

export class OfflineVideoRenderExporter {
  private bakedSpectrum: BakedFrameSpectrum[] = [];

  public async prepareAudio(audioFileBuffer: ArrayBuffer, fps: number): Promise<void> {
    const baker = new OfflineAudioSpectrumBaker();
    await baker.loadAudioFile(audioFileBuffer);
    this.bakedSpectrum = baker.bakeSpectrumForExport(fps, 512);
  }

  public setBakedSpectrum(spectrum: BakedFrameSpectrum[]): void {
    this.bakedSpectrum = spectrum;
  }

  public getFrameSpectrum(frameIndex: number): BakedFrameSpectrum {
    return (
      this.bakedSpectrum[frameIndex] || {
        frameIndex,
        timestamp: frameIndex / 60,
        bass: 0,
        mids: 0,
        treble: 0,
        rawBins: new Float32Array(256),
      }
    );
  }
}
