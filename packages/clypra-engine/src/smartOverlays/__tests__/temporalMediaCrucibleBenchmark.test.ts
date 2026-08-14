import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import { TemporalMediaEngine } from "../../assets/temporalMediaEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  VideoNode,
  AudioNode,
  LottieNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
} from "../overlayDocumentSchema.js";

describe("Phase 5: Temporal Media Primitives Crucible Benchmark", () => {
  const layoutEngine = new LayoutEngine();

  // =========================================================================
  // PRIMITIVE 1: VIDEO (Dual Visual/Audio & Timeline Playhead Mapping)
  // =========================================================================
  describe("Primitive 1: Video (Timeline Mapping & Aspect Ratio Sizing)", () => {
    it("1.1: should accurately calculate local playhead (tau) with speed, trimIn, and duration constraints", () => {
      // Scenario: Global t = 4.5s, Video starts at t = 1.5s with trimIn = 1.0s, speed = 2.0x
      // Expected elapsed = (4.5 - 1.5) * 2.0 = 6.0s -> localTime = 1.0 + 6.0 = 7.0s
      const resolved = TemporalMediaEngine.resolveLocalTime({
        timelineTime: 4.5,
        startTime: 1.5,
        trimIn: 1.0,
        trimOut: 10.0,
        speed: 2.0,
        loop: false,
      });

      expect(resolved.isActive).toBe(true);
      expect(resolved.localTime).toBeCloseTo(7.0, 4);
      expect(resolved.progress).toBeCloseTo(6.0 / 9.0, 4);
    });

    it("1.2: should wrap playhead and increment loopIteration when loop: true is enabled", () => {
      // Scenario: 4-second video loop (trimIn 0s, trimOut 4s). At global t = 10.5s with startTime = 0s
      // Elapsed = 10.5s -> 2 full loops (8s) + 2.5s remainder -> localTime = 2.5s, loopIteration = 2
      const resolved = TemporalMediaEngine.resolveLocalTime({
        timelineTime: 10.5,
        startTime: 0,
        trimIn: 0,
        trimOut: 4.0,
        loop: true,
      });

      expect(resolved.isActive).toBe(true);
      expect(resolved.localTime).toBeCloseTo(2.5, 4);
      expect(resolved.loopIteration).toBe(2);
      expect(resolved.progress).toBeCloseTo(2.5 / 4.0, 4);
    });

    it("1.3: should resolve Video node geometry preserving 16:9 intrinsic aspect ratio", () => {
      const doc: OverlayDocument = {
        id: "doc-video-test",
        version: "1.0",
        title: "Video Geometry",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "speaker-broll-video",
            name: "Speaker Video PIP",
            type: "video",
            assetId: "asset://videos/speaker-4k.mp4",
            x: 100,
            y: 100,
            width: 480,
            height: 0, // Auto height locked to 16:9
            intrinsicWidth: 1920,
            intrinsicHeight: 1080,
            aspectRatioLock: true,
          } as VideoNode,
        ],
        duration: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      const videoBounds = res["speaker-broll-video"];

      expect(videoBounds.width).toBe(480);
      expect(videoBounds.height).toBe(270); // 480 / (16/9) = 270
    });
  });

  // =========================================================================
  // PRIMITIVE 2: AUDIO (Waveforms, Fade Envelopes & Ducking)
  // =========================================================================
  describe("Primitive 2: Audio (Envelopes, Fades & Ducking)", () => {
    it("2.1: should evaluate linear volume fade-in and fade-out envelopes", () => {
      // 10s audio track starting at t = 0 with 2s fade-in and 2s fade-out, base volume = 0.8
      // At t = 1.0s (midpoint of fade-in) -> volume = 0.8 * (1.0 / 2.0) = 0.4
      const fadeInEval = TemporalMediaEngine.evaluateAudioVolume({
        timelineTime: 1.0,
        startTime: 0,
        duration: 10.0,
        volume: 0.8,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.0,
      });
      expect(fadeInEval.volume).toBeCloseTo(0.4, 4);

      // At t = 5.0s (sustain region) -> volume = 0.8
      const sustainEval = TemporalMediaEngine.evaluateAudioVolume({
        timelineTime: 5.0,
        startTime: 0,
        duration: 10.0,
        volume: 0.8,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.0,
      });
      expect(sustainEval.volume).toBeCloseTo(0.8, 4);

      // At t = 9.0s (midpoint of fade-out) -> remaining = 1.0s -> volume = 0.8 * (1.0 / 2.0) = 0.4
      const fadeOutEval = TemporalMediaEngine.evaluateAudioVolume({
        timelineTime: 9.0,
        startTime: 0,
        duration: 10.0,
        volume: 0.8,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.0,
      });
      expect(fadeOutEval.volume).toBeCloseTo(0.4, 4);
    });

    it("2.2: should apply decibel ducking attenuation when ducking is triggered", () => {
      // Base volume = 1.0, Ducking = -6 dB (~0.501 gain)
      const ducked = TemporalMediaEngine.evaluateAudioVolume({
        timelineTime: 4.0,
        startTime: 0,
        duration: 10.0,
        volume: 1.0,
        isDucked: true,
        duckingDb: -6,
      });

      expect(ducked.volume).toBeCloseTo(0.5012, 3);
    });
  });

  // =========================================================================
  // PRIMITIVE 3: LOTTIE (Vector Micro-Animation & Frame Quantization)
  // =========================================================================
  describe("Primitive 3: Lottie (Vector Micro-Animation & Frame Quantization)", () => {
    it("3.1: should quantize 60 FPS animation progress into discrete integer frame indices", () => {
      // 120-frame animation (2.0s duration at 60 FPS). At t = 0.5s -> frameIndex = 30
      const q1 = TemporalMediaEngine.quantizeLottieFrame({
        localTime: 0.5,
        totalFrames: 120,
        fps: 60,
        mode: "forward",
      });

      expect(q1.frameIndex).toBe(29); // 0-indexed frame 29 / 30th frame
      expect(q1.normalizedProgress).toBeCloseTo(0.25, 4);

      // Ping-pong mode: at t = 3.0s in 2.0s clip (cycle = 4.0s) -> cycleTime = 3.0s (> 2.0s)
      // Progress bounces back: 1.0 - (3.0 - 2.0) / 2.0 = 0.5 -> frameIndex = 59
      const qPing = TemporalMediaEngine.quantizeLottieFrame({
        localTime: 3.0,
        totalFrames: 120,
        fps: 60,
        mode: "pingpong",
      });

      expect(qPing.normalizedProgress).toBeCloseTo(0.5, 4);
      expect(qPing.frameIndex).toBe(59);
    });
  });

  // =========================================================================
  // HERO BENCHMARK: The Cinematic Video Podcast Lower-Third Overlay
  // =========================================================================
  describe("Hero Benchmark: The Cinematic Video Podcast Lower-Third Overlay", () => {
    it("should composite synchronized Video PIP + Audio Track with Fades + Animated Lottie Waveform + Typography at t = 3.5s", () => {
      const doc: OverlayDocument = {
        id: "doc-cinematic-podcast-hero",
        version: "1.0",
        title: "Cinematic Video Podcast Overlay",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          // 1. Root Lower-Third Container Frame
          {
            id: "podcast-lower-third-card",
            name: "Podcast Lower-Third Card",
            type: "frame",
            x: 80,
            y: 820,
            width: 0,
            height: 0,
            style: {
              fillColor: "rgba(15, 23, 42, 0.85)",
              borderRadius: 20,
              strokeColor: "#334155",
              strokeWidth: 1.5,
            },
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 20,
              padding: { top: 16, right: 28, bottom: 16, left: 18 },
            },
            children: [
              // 2. Video PIP (16:9 Round-Rect Preview)
              {
                id: "speaker-video-pip",
                name: "Speaker Video PIP",
                type: "video",
                assetId: "asset://videos/alex-rivera-camera.mp4",
                x: 0,
                y: 0,
                width: 160,
                height: 90,
                intrinsicWidth: 1920,
                intrinsicHeight: 1080,
                playback: {
                  startTime: 1.0,
                  trimIn: 2.0,
                  speed: 1.0,
                  loop: false,
                },
              } as VideoNode,

              // 3. Speaker Typography Stack (Column LayoutFrame)
              {
                id: "speaker-info-col",
                name: "Speaker Info Column",
                type: "frame",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                layout: {
                  mode: "flex-column",
                  constraints: { widthMode: "hug", heightMode: "hug" },
                  gap: 4,
                },
                children: [
                  {
                    id: "speaker-name",
                    name: "Speaker Name",
                    type: "text",
                    text: "Alex Rivera",
                    fontSize: 22,
                    style: { color: "#FFFFFF", fontWeight: "bold" },
                    x: 0,
                    y: 0,
                    width: 140,
                    height: 26,
                  } as PrimitiveTextNode,
                  {
                    id: "speaker-title",
                    name: "Speaker Role",
                    type: "text",
                    text: "VP of Product Engineering",
                    fontSize: 14,
                    style: { color: "#94A3B8" },
                    x: 0,
                    y: 0,
                    width: 190,
                    height: 18,
                  } as PrimitiveTextNode,
                ],
              } as FrameNode,

              // 4. Looping Lottie Animated Audio Waveform
              {
                id: "waveform-lottie",
                name: "Animated Audio Waveform",
                type: "lottie",
                assetId: "asset://lottie/audio-wave.json",
                fps: 60,
                speed: 1.0,
                loop: true,
                x: 0,
                y: 0,
                width: 48,
                height: 48,
              } as LottieNode,
            ],
          } as FrameNode,

          // 5. Synchronized Audio Track
          {
            id: "ambient-bg-music",
            name: "Ambient Background Music",
            type: "audio",
            assetId: "asset://audio/chill-lofi-theme.mp3",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            playback: {
              startTime: 0,
              trimIn: 0,
              volume: 0.6,
              fadeInDuration: 2.0,
              fadeOutDuration: 2.0,
            },
          } as AudioNode,
        ],
        duration: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Validate Spatial Layout Bounds
      const res = layoutEngine.computeLayout(doc).nodes;
      const card = res["podcast-lower-third-card"];
      const pip = res["speaker-video-pip"];
      const infoCol = res["speaker-info-col"];
      const waveform = res["waveform-lottie"];

      // Width = padLeft(18) + pip(160) + gap(20) + infoCol(190) + gap(20) + waveform(48) + padRight(28) = 484
      expect(card.width).toBe(484);
      // Height = padTop(16) + max(90, 48, 48) + padBottom(16) = 16 + 90 + 16 = 122
      expect(card.height).toBe(122);

      expect(pip.x).toBe(80 + 18);
      expect(infoCol.x).toBe(80 + 18 + 160 + 20); // 278
      expect(waveform.x).toBe(80 + 18 + 160 + 20 + 190 + 20); // 488

      // 2. Validate Temporal State at t = 3.5s
      const globalTime = 3.5;

      // Video playhead: started at t=1.0s with trimIn=2.0s -> tau = 2.0 + (3.5 - 1.0) = 4.5s
      const videoState = TemporalMediaEngine.resolveLocalTime({
        timelineTime: globalTime,
        startTime: 1.0,
        trimIn: 2.0,
        speed: 1.0,
        loop: false,
      });
      expect(videoState.isActive).toBe(true);
      expect(videoState.localTime).toBeCloseTo(4.5, 4);

      // Audio volume at t = 3.5s (post 2.0s fade-in) -> volume = 0.6
      const audioState = TemporalMediaEngine.evaluateAudioVolume({
        timelineTime: globalTime,
        startTime: 0,
        duration: 10.0,
        volume: 0.6,
        fadeInDuration: 2.0,
        fadeOutDuration: 2.0,
      });
      expect(audioState.volume).toBeCloseTo(0.6, 4);
      expect(audioState.isAudible).toBe(true);

      // Lottie animation frame at t = 3.5s (60 FPS, 120-frame loop) -> (3.5 % 2.0) = 1.5s -> frameIndex = floor(1.5/2.0 * 119) = 89
      const lottieState = TemporalMediaEngine.quantizeLottieFrame({
        localTime: globalTime,
        totalFrames: 120,
        fps: 60,
        loop: true,
      });
      expect(lottieState.normalizedProgress).toBeCloseTo(0.75, 4);
      expect(lottieState.frameIndex).toBe(89);
    });
  });
});
