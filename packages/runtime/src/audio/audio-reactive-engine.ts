import type { AnimatedProperty, AudioBinding } from "@clypra-studio/types";
import { KeyframeEvaluator } from "../keyframe/keyframe-evaluator";
import { AudioSpectrumAnalyzer } from "./audio-spectrum-analyzer";

export class AudioReactiveKeyframeEngine {
  private baseEvaluator: KeyframeEvaluator;
  private spectrumAnalyzer: AudioSpectrumAnalyzer;
  private smoothedAudioState: Map<string, number> = new Map();

  constructor(analyzer: AudioSpectrumAnalyzer) {
    this.baseEvaluator = new KeyframeEvaluator();
    this.spectrumAnalyzer = analyzer;
  }

  /**
   * Evaluates a parameter incorporating keyframe curves + real-time audio energy
   */
  public evaluateProperty(
    prop: AnimatedProperty,
    currentTime: number,
    binding?: AudioBinding,
    mockByteData?: Uint8Array
  ): number {
    // 1. Evaluate Base Keyframe Value at timeline position
    const baseValue = this.baseEvaluator.evaluate(prop, currentTime);

    // If no audio binding exists for this property, return raw keyframe value
    if (!binding) return baseValue;

    // 2. Read Normalized Energy Level for bound frequency range
    let rawEnergy = this.spectrumAnalyzer.getBandEnergy(
      binding.band,
      binding.customFreqRange,
      44100,
      mockByteData
    );

    // 3. Apply Noise Floor Threshold
    if (rawEnergy < binding.minThreshold) {
      rawEnergy = 0.0;
    } else {
      // Re-map range [minThreshold, 1.0] -> [0.0, 1.0]
      rawEnergy = (rawEnergy - binding.minThreshold) / (1.0 - binding.minThreshold);
    }

    // 4. Apply Attack / Release Exponential Smoothing
    const prevSmoothed = this.smoothedAudioState.get(binding.propertyId) || 0.0;
    const alpha = 1.0 - Math.min(Math.max(binding.smoothing, 0.0), 0.99);
    const smoothedEnergy = prevSmoothed + alpha * (rawEnergy - prevSmoothed);
    this.smoothedAudioState.set(binding.propertyId, smoothedEnergy);

    // 5. Apply Sensitivity Scaling
    const audioModulation = smoothedEnergy * binding.sensitivity;

    // 6. Blend Audio Modulation with Base Keyframe Value
    switch (binding.blendMode) {
      case "add":
        return baseValue + audioModulation;

      case "multiply":
        return baseValue * (1.0 + audioModulation);

      case "override":
        return audioModulation;

      default:
        return baseValue;
    }
  }
}
