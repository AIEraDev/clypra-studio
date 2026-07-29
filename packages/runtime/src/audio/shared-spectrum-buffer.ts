import type { FastBakedSpectrum } from "./wasm-spectrum-baker";

export class SharedSpectrumBuffer {
  public sharedArray: Float32Array;
  public totalFrames: number;

  constructor(totalFrames: number) {
    this.totalFrames = totalFrames;
    if (typeof SharedArrayBuffer !== "undefined") {
      const sab = new SharedArrayBuffer(
        totalFrames * 3 * Float32Array.BYTES_PER_ELEMENT
      );
      this.sharedArray = new Float32Array(sab);
    } else {
      // Standard Float32Array fallback if SharedArrayBuffer headers are missing
      this.sharedArray = new Float32Array(totalFrames * 3);
    }
  }

  /**
   * Called on Main Thread inside 144Hz requestAnimationFrame tick loop. Zero allocation.
   */
  public getFrameSpectrum(frameIdx: number): FastBakedSpectrum {
    if (frameIdx < 0 || frameIdx >= this.totalFrames) {
      return { bass: 0, mids: 0, treble: 0 };
    }

    const offset = frameIdx * 3;
    if (typeof Atomics !== "undefined" && this.sharedArray.buffer instanceof SharedArrayBuffer) {
      // Int32 view for Atomics load bitcast
      const int32View = new Int32Array(this.sharedArray.buffer);
      const float32View = new Float32Array(1);
      const int32Container = new Int32Array(float32View.buffer);

      int32Container[0] = Atomics.load(int32View, offset);
      const bass = float32View[0];

      int32Container[0] = Atomics.load(int32View, offset + 1);
      const mids = float32View[0];

      int32Container[0] = Atomics.load(int32View, offset + 2);
      const treble = float32View[0];

      return { bass, mids, treble };
    }

    return {
      bass: this.sharedArray[offset],
      mids: this.sharedArray[offset + 1],
      treble: this.sharedArray[offset + 2],
    };
  }

  public setFrameSpectrum(frameIdx: number, bass: number, mids: number, treble: number): void {
    const offset = frameIdx * 3;
    this.sharedArray[offset] = bass;
    this.sharedArray[offset + 1] = mids;
    this.sharedArray[offset + 2] = treble;
  }
}
