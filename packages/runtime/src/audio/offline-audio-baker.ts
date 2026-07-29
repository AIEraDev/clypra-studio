import type { BakedFrameSpectrum } from "@clypra-studio/types";

export class OfflineAudioSpectrumBaker {
  private sampleRate = 44100;
  private channelData!: Float32Array;

  /**
   * Decodes an ArrayBuffer (e.g. uploaded MP3/WAV file) into Float32 PCM data
   */
  public async loadAudioFile(audioData: ArrayBuffer): Promise<number> {
    if (typeof OfflineAudioContext !== "undefined") {
      const offlineCtx = new OfflineAudioContext(1, 44100, 44100);
      const audioBuffer = await offlineCtx.decodeAudioData(audioData);
      this.sampleRate = audioBuffer.sampleRate;
      this.channelData = audioBuffer.getChannelData(0);
      return audioBuffer.duration;
    } else {
      // Fallback for non-browser testing
      this.channelData = new Float32Array(audioData);
      return this.channelData.length / this.sampleRate;
    }
  }

  /**
   * Directly loads raw PCM Float32Array for headless environments
   */
  public loadRawPCMData(sampleRate: number, channelData: Float32Array): number {
    this.sampleRate = sampleRate;
    this.channelData = channelData;
    return channelData.length / sampleRate;
  }

  /**
   * Pre-calculates FFT spectral energy for every single video frame.
   */
  public bakeSpectrumForExport(
    fps: number,
    fftSize = 512
  ): BakedFrameSpectrum[] {
    if (!this.channelData || this.channelData.length === 0) {
      return [];
    }

    const totalFrames = Math.floor((this.channelData.length / this.sampleRate) * fps);
    const bakedFrames: BakedFrameSpectrum[] = [];
    const windowSize = fftSize;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const timestamp = frameIndex / fps;
      const centerSampleIndex = Math.floor(timestamp * this.sampleRate);

      const pcmWindow = new Float32Array(windowSize);
      const halfWindow = Math.floor(windowSize / 2);

      for (let i = 0; i < windowSize; i++) {
        const sampleIdx = centerSampleIndex - halfWindow + i;
        if (sampleIdx >= 0 && sampleIdx < this.channelData.length) {
          // Apply Hann Windowing to prevent spectral leakage
          const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
          pcmWindow[i] = this.channelData[sampleIdx] * hann;
        } else {
          pcmWindow[i] = 0;
        }
      }

      // Compute Real-to-Complex FFT Magnitudes
      const magnitudes = this.computeFFTMagnitudes(pcmWindow, windowSize);

      // Extract frequency band energies
      const bass = this.extractBandEnergy(magnitudes, 20, 250, fftSize);
      const mids = this.extractBandEnergy(magnitudes, 250, 4000, fftSize);
      const treble = this.extractBandEnergy(magnitudes, 4000, 20000, fftSize);

      bakedFrames.push({
        frameIndex,
        timestamp,
        bass,
        mids,
        treble,
        rawBins: magnitudes,
      });
    }

    return bakedFrames;
  }

  /**
   * Computes magnitude spectrum |X[k]| = sqrt(Real^2 + Imag^2)
   */
  private computeFFTMagnitudes(buffer: Float32Array, N: number): Float32Array {
    const numBins = N / 2;
    const magnitudes = new Float32Array(numBins);

    for (let k = 0; k < numBins; k++) {
      let real = 0;
      let imag = 0;
      const angleStep = (2 * Math.PI * k) / N;

      for (let n = 0; n < N; n++) {
        const angle = angleStep * n;
        real += buffer[n] * Math.cos(angle);
        imag -= buffer[n] * Math.sin(angle);
      }

      // Magnitude normalized to [0, 1]
      magnitudes[k] = Math.sqrt(real * real + imag * imag) / (N / 2);
    }

    return magnitudes;
  }

  /**
   * Integrates magnitude energy between startHz and endHz
   */
  private extractBandEnergy(
    magnitudes: Float32Array,
    startHz: number,
    endHz: number,
    fftSize: number
  ): number {
    const nyquist = this.sampleRate / 2;
    const numBins = magnitudes.length;

    const startBin = Math.floor((startHz / nyquist) * numBins);
    const endBin = Math.min(Math.ceil((endHz / nyquist) * numBins), numBins - 1);

    if (startBin >= endBin) return 0.0;

    let sum = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += magnitudes[i];
    }

    const avg = sum / (endBin - startBin + 1);
    return Math.min(Math.max(avg * 2.5, 0.0), 1.0); // Scaled & clamped energy factor
  }
}
