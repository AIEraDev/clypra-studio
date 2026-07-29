export interface FastBakedSpectrum {
  bass: number;
  mids: number;
  treble: number;
}

export class WasmAudioSpectrumBaker {
  private wasmModule: any;

  constructor(wasmModuleInstance?: any) {
    this.wasmModule = wasmModuleInstance;
  }

  /**
   * Bakes entire audio PCM track into per-frame spectrum bands using Wasm SIMD (or JS fallback)
   */
  public bakeSpectrumFast(
    pcmData: Float32Array,
    sampleRate = 44100,
    fps = 60,
    fftSize = 512
  ): FastBakedSpectrum[] {
    const totalSamples = pcmData.length;
    const totalFrames = Math.floor((totalSamples / sampleRate) * fps);

    if (this.wasmModule && this.wasmModule._bake_audio_spectrum) {
      const pcmBytes = totalSamples * Float32Array.BYTES_PER_ELEMENT;
      const pcmPtr = this.wasmModule._malloc(pcmBytes);
      this.wasmModule.HEAPF32.set(pcmData, pcmPtr / Float32Array.BYTES_PER_ELEMENT);

      const outLength = totalFrames * 3;
      const outBytes = outLength * Float32Array.BYTES_PER_ELEMENT;
      const outPtr = this.wasmModule._malloc(outBytes);

      this.wasmModule._bake_audio_spectrum(
        pcmPtr,
        totalSamples,
        sampleRate,
        fps,
        fftSize,
        outPtr
      );

      const rawResultView = new Float32Array(
        this.wasmModule.HEAPF32.buffer,
        outPtr,
        outLength
      );

      const bakedFrames: FastBakedSpectrum[] = new Array(totalFrames);
      for (let i = 0; i < totalFrames; i++) {
        const idx = i * 3;
        bakedFrames[i] = {
          bass: rawResultView[idx],
          mids: rawResultView[idx + 1],
          treble: rawResultView[idx + 2],
        };
      }

      this.wasmModule._free(pcmPtr);
      this.wasmModule._free(outPtr);

      return bakedFrames;
    }

    // High-performance JavaScript Fallback when Wasm binary is not linked
    const bakedFrames: FastBakedSpectrum[] = new Array(totalFrames);
    const windowSize = fftSize;
    const halfWindow = Math.floor(windowSize / 2);

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const timestamp = frameIdx / fps;
      const centerSample = Math.floor(timestamp * sampleRate);

      let bassSum = 0;
      let midsSum = 0;
      let trebleSum = 0;
      let bassCount = 0;
      let midsCount = 0;
      let trebleCount = 0;

      const numBins = windowSize / 2;
      const nyquist = sampleRate / 2;

      for (let k = 0; k < numBins; k++) {
        const freqHz = (k / numBins) * nyquist;
        let real = 0;
        let imag = 0;
        const angleStep = (2 * Math.PI * k) / windowSize;

        for (let n = 0; n < windowSize; n++) {
          const sampleIdx = centerSample - halfWindow + n;
          let sampleVal = 0;
          if (sampleIdx >= 0 && sampleIdx < totalSamples) {
            sampleVal = pcmData[sampleIdx];
          }
          const hann = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (windowSize - 1)));
          const windowed = sampleVal * hann;
          const angle = angleStep * n;
          real += windowed * Math.cos(angle);
          imag -= windowed * Math.sin(angle);
        }

        const mag = Math.sqrt(real * real + imag * imag) / (windowSize / 2);

        if (freqHz >= 20 && freqHz < 250) {
          bassSum += mag;
          bassCount++;
        } else if (freqHz >= 250 && freqHz < 4000) {
          midsSum += mag;
          midsCount++;
        } else if (freqHz >= 4000 && freqHz <= 20000) {
          trebleSum += mag;
          trebleCount++;
        }
      }

      bakedFrames[frameIdx] = {
        bass: bassCount > 0 ? Math.min((bassSum / bassCount) * 2.5, 1.0) : 0,
        mids: midsCount > 0 ? Math.min((midsSum / midsCount) * 2.5, 1.0) : 0,
        treble: trebleCount > 0 ? Math.min((trebleSum / trebleCount) * 2.5, 1.0) : 0,
      };
    }

    return bakedFrames;
  }
}
