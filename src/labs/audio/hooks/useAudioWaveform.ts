import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioTelemetry } from "../types";

const NUM_WAVEFORM_BARS = 96;

/**
 * Generates synthetic waveform peaks based on seed or duration
 * Used while decoding is in progress or if Web Audio API decode fails / in test runners.
 */
export function generateFallbackPeaks(seed: string | number, count = NUM_WAVEFORM_BARS): number[] {
  const seedNum = typeof seed === "number" ? seed : seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    // Harmonic envelope curve: attack, decay, sustain, release
    const envelope = Math.sin(t * Math.PI) * 0.7 + 0.3;
    const wave1 = Math.sin(i * 0.35 + seedNum) * 0.25;
    const wave2 = Math.cos(i * 0.18 + seedNum * 0.5) * 0.2;
    const raw = (0.35 + wave1 + wave2) * envelope;
    peaks.push(Math.max(0.08, Math.min(1.0, Number(raw.toFixed(3)))));
  }
  return peaks;
}

/**
 * Extracts normalized peak values from an AudioBuffer channel
 */
export function extractPeaksFromAudioBuffer(
  buffer: AudioBuffer,
  numBars = NUM_WAVEFORM_BARS,
): number[] {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    // Normalize with a minimum height for visually appealing waveform
    peaks.push(Math.max(0.08, Math.min(1.0, max)));
  }

  return peaks;
}

export function useAudioWaveform({
  audioSource,
  initialDuration = 0,
  loopByDefault = false,
}: {
  audioSource: File | string | null;
  initialDuration?: number;
  loopByDefault?: boolean;
}) {
  const [peaks, setPeaks] = useState<number[]>(() => generateFallbackPeaks(42));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [isLooping, setIsLooping] = useState(loopByDefault);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [telemetry, setTelemetry] = useState<Partial<AudioTelemetry>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Initialize or clean up HTML Audio element
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audioRef.current = audio;

    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.pause();
      audio.src = "";
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Update loop property
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Update volume & mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Time tracking animation loop when playing
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handle source changes: decode audio buffer & set audio.src
  useEffect(() => {
    // Reset playback state
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);

    // Revoke old object URL if any
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!audioSource) {
      setPeaks(generateFallbackPeaks(101));
      setDuration(0);
      setTelemetry({});
      return;
    }

    let isMounted = true;
    setIsDecoding(true);

    let srcUrl = "";
    let fileObj: File | null = null;

    if (typeof audioSource === "string") {
      srcUrl = audioSource;
      setPeaks(generateFallbackPeaks(audioSource));
    } else {
      fileObj = audioSource;
      srcUrl = URL.createObjectURL(fileObj);
      objectUrlRef.current = srcUrl;
      setPeaks(generateFallbackPeaks(fileObj.name));
    }

    if (audioRef.current) {
      audioRef.current.src = srcUrl;
      audioRef.current.load();
    }

    // Attempt Web Audio API decoding
    const decodePromise = async () => {
      try {
        let arrayBuffer: ArrayBuffer;
        if (fileObj) {
          arrayBuffer = await fileObj.arrayBuffer();
        } else {
          const res = await fetch(srcUrl);
          arrayBuffer = await res.arrayBuffer();
        }

        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioCtxClass) {
          if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new AudioCtxClass();
          }
          const ctx = audioContextRef.current;
          const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));

          if (isMounted) {
            const extracted = extractPeaksFromAudioBuffer(decoded, NUM_WAVEFORM_BARS);
            setPeaks(extracted);
            setDuration(decoded.duration);
            setTelemetry({
              sampleRate: decoded.sampleRate,
              channels: decoded.numberOfChannels,
              duration: decoded.duration,
              fileSize: fileObj ? fileObj.size : undefined,
              mimeType: fileObj ? fileObj.type : undefined,
            });
          }
        }
      } catch {
        // Fallback peaks already generated and set
        if (fileObj && isMounted) {
          setTelemetry({
            fileSize: fileObj.size,
            mimeType: fileObj.type,
          });
        }
      } finally {
        if (isMounted) {
          setIsDecoding(false);
        }
      }
    };

    void decodePromise();

    return () => {
      isMounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [audioSource]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Resume AudioContext if suspended by browser autoplay policy
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Handle playback denial gracefully
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    const boundedTime = Math.max(0, Math.min(time, duration || 0));
    audioRef.current.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  }, [duration]);

  const seekPercent = useCallback(
    (fraction: number) => {
      const targetTime = fraction * (duration || 0);
      seek(targetTime);
    },
    [duration, seek],
  );

  const reset = useCallback(() => {
    seek(0);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [seek, isPlaying]);

  return {
    peaks,
    isPlaying,
    currentTime,
    duration,
    isLooping,
    playbackRate,
    volume,
    isMuted,
    isDecoding,
    telemetry,
    togglePlay,
    seek,
    seekPercent,
    reset,
    setIsLooping,
    setPlaybackRate,
    setVolume,
    setIsMuted,
  };
}
