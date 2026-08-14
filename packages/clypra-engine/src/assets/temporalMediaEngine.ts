/**
 * Temporal Media Engine
 *
 * Governing evaluation subsystem for time-dependent media primitives (Video, Audio, Lottie).
 * Resolves local playheads, audio volume envelopes, Lottie frame quantization,
 * and timeline synchronization.
 */

export interface LocalTimeQuery {
  timelineTime: number; // Global timeline time t (seconds)
  startTime?: number; // Timeline offset when element begins playing (seconds, default: 0)
  trimIn?: number; // Source start offset (seconds, default: 0)
  trimOut?: number; // Source end offset (seconds)
  sourceDuration?: number; // Full length of the media asset (seconds)
  speed?: number; // Playback rate multiplier (default: 1.0)
  loop?: boolean; // Wrap local playhead when reaching playable duration
}

export interface ResolvedLocalTime {
  localTime: number; // Resolved playhead within source media asset (seconds)
  isActive: boolean; // Whether the element is currently visible/audible at t
  progress: number; // Normalized play progress [0.0, 1.0] within the playable clip
  loopIteration: number; // Current loop cycle index (0 for initial iteration)
}

export interface AudioVolumeQuery {
  timelineTime: number; // Global timeline time t (seconds)
  startTime?: number; // Timeline offset when audio starts (seconds, default: 0)
  duration: number; // Playable duration (seconds)
  volume?: number; // Base master volume [0.0, 1.0] (default: 1.0)
  muted?: boolean; // Hard mute flag
  fadeInDuration?: number; // Fade-in envelope length in seconds
  fadeOutDuration?: number; // Fade-out envelope length in seconds
  duckingDb?: number; // Attenuation in decibels when ducked (e.g. -6 dB)
  isDucked?: boolean; // Ducking trigger flag (e.g. voiceover active)
}

export interface EvaluatedAudioVolume {
  volume: number; // Effective linear volume multiplier [0.0, 1.0]
  isAudible: boolean;
}

export interface LottieFrameQuery {
  localTime: number; // Local time playhead in seconds
  totalFrames: number; // Total number of keyframes in Lottie JSON
  fps?: number; // Frame rate (default: 60)
  mode?: "forward" | "reverse" | "pingpong";
  speed?: number; // Playback speed multiplier (default: 1.0)
  loop?: boolean;
}

export interface QuantizedLottieFrame {
  frameIndex: number; // Discrete frame index [0, totalFrames - 1]
  normalizedProgress: number; // [0.0, 1.0]
}

export class TemporalMediaEngine {
  /**
   * Resolve local source playhead (tau) from global timeline timestamp (t).
   */
  public static resolveLocalTime(query: LocalTimeQuery): ResolvedLocalTime {
    const {
      timelineTime,
      startTime = 0,
      trimIn = 0,
      trimOut,
      sourceDuration,
      speed = 1.0,
      loop = false,
    } = query;

    // Check if playback hasn't started yet
    if (timelineTime < startTime) {
      return {
        localTime: trimIn,
        isActive: false,
        progress: 0,
        loopIteration: 0,
      };
    }

    const effectiveSpeed = speed > 0 ? speed : 1.0;
    const elapsedSinceStart = (timelineTime - startTime) * effectiveSpeed;

    const maxSourceTime = trimOut ?? sourceDuration ?? Infinity;
    const playableDuration = Math.max(0.0001, maxSourceTime - trimIn);

    if (!loop && elapsedSinceStart >= playableDuration) {
      return {
        localTime: trimIn + playableDuration,
        isActive: false,
        progress: 1.0,
        loopIteration: 0,
      };
    }

    const loopIteration = Math.floor(elapsedSinceStart / playableDuration);
    const loopOffset = elapsedSinceStart % playableDuration;
    const localTime = trimIn + loopOffset;
    const progress = Math.min(1.0, Math.max(0.0, loopOffset / playableDuration));

    return {
      localTime,
      isActive: true,
      progress,
      loopIteration,
    };
  }

  /**
   * Evaluate audio volume applying fade-in, fade-out, and ducking envelopes.
   */
  public static evaluateAudioVolume(query: AudioVolumeQuery): EvaluatedAudioVolume {
    const {
      timelineTime,
      startTime = 0,
      duration,
      volume = 1.0,
      muted = false,
      fadeInDuration = 0,
      fadeOutDuration = 0,
      duckingDb = 0,
      isDucked = false,
    } = query;

    if (muted || volume <= 0 || timelineTime < startTime || timelineTime > startTime + duration) {
      return { volume: 0, isAudible: false };
    }

    let multiplier = 1.0;
    const elapsed = timelineTime - startTime;
    const remaining = startTime + duration - timelineTime;

    // Apply Fade-In (linear ramp)
    if (fadeInDuration > 0 && elapsed < fadeInDuration) {
      multiplier *= Math.max(0, elapsed / fadeInDuration);
    }

    // Apply Fade-Out (linear ramp)
    if (fadeOutDuration > 0 && remaining < fadeOutDuration) {
      multiplier *= Math.max(0, remaining / fadeOutDuration);
    }

    // Apply Ducking (convert dB to linear gain: 10^(dB/20))
    if (isDucked && duckingDb !== 0) {
      const duckGain = Math.pow(10, -Math.abs(duckingDb) / 20);
      multiplier *= duckGain;
    }

    const effectiveVolume = Math.min(1.0, Math.max(0.0, volume * multiplier));
    return {
      volume: effectiveVolume,
      isAudible: effectiveVolume > 0.001,
    };
  }

  /**
   * Quantize Lottie animation timeline into discrete frame index and normalized progress.
   */
  public static quantizeLottieFrame(query: LottieFrameQuery): QuantizedLottieFrame {
    const {
      localTime,
      totalFrames,
      fps = 60,
      mode = "forward",
      speed = 1.0,
      loop = true,
    } = query;

    if (totalFrames <= 1) {
      return { frameIndex: 0, normalizedProgress: 0 };
    }

    const effectiveSpeed = speed > 0 ? speed : 1.0;
    const durationSeconds = (totalFrames / fps) / effectiveSpeed;
    const elapsed = Math.max(0, localTime);

    let progress = 0;
    if (mode === "pingpong") {
      const cycleDuration = durationSeconds * 2;
      const cycleTime = loop ? (elapsed % cycleDuration) : Math.min(elapsed, cycleDuration);
      if (cycleTime <= durationSeconds) {
        progress = cycleTime / durationSeconds;
      } else {
        progress = 1.0 - (cycleTime - durationSeconds) / durationSeconds;
      }
    } else if (mode === "reverse") {
      const wrappedTime = loop ? (elapsed % durationSeconds) : Math.min(elapsed, durationSeconds);
      progress = 1.0 - (wrappedTime / durationSeconds);
    } else {
      // forward
      const wrappedTime = loop ? (elapsed % durationSeconds) : Math.min(elapsed, durationSeconds);
      progress = wrappedTime / durationSeconds;
    }

    const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
    const frameIndex = Math.min(
      totalFrames - 1,
      Math.max(0, Math.floor(clampedProgress * (totalFrames - 1)))
    );

    return {
      frameIndex,
      normalizedProgress: clampedProgress,
    };
  }
}
