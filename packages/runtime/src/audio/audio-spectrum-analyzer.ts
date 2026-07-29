import type { FrequencyBand } from "@clypra-studio/types";

export class AudioSpectrumAnalyzer {
  private analyser?: AnalyserNode;
  private freqData?: Uint8Array;

  constructor(audioContext?: AudioContext, fftSize = 512) {
    if (audioContext) {
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = 0.3; // Hardware smoothing
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  public getAnalyserNode(): AnalyserNode | undefined {
    return this.analyser;
  }

  /**
   * Samples current audio frame and returns normalized energy for a frequency range [0.0, 1.0]
   */
  public getBandEnergy(
    band: FrequencyBand,
    customRange?: [number, number],
    sampleRate = 44100,
    mockByteData?: Uint8Array
  ): number {
    let data = mockByteData;

    if (!data && this.analyser && this.freqData) {
      this.analyser.getByteFrequencyData(this.freqData);
      data = this.freqData;
    }

    if (!data || data.length === 0) return 0.0;

    const binCount = data.length;
    const nyquist = sampleRate / 2;

    let [startHz, endHz] = [0, 0];

    switch (band) {
      case "bass":
        [startHz, endHz] = [20, 250];
        break;
      case "mids":
        [startHz, endHz] = [250, 4000];
        break;
      case "treble":
        [startHz, endHz] = [4000, 20000];
        break;
      case "custom":
        [startHz, endHz] = customRange || [20, 20000];
        break;
    }

    // Convert Hz to FFT Bin Indices
    const startBin = Math.floor((startHz / nyquist) * binCount);
    const endBin = Math.min(Math.ceil((endHz / nyquist) * binCount), binCount - 1);

    if (startBin >= endBin) return 0.0;

    // Calculate Average Energy across Bins
    let totalEnergy = 0;
    for (let i = startBin; i <= endBin; i++) {
      totalEnergy += data[i];
    }

    const avgByteValue = totalEnergy / (endBin - startBin + 1);
    return avgByteValue / 255.0; // Normalize to [0.0, 1.0]
  }
}
