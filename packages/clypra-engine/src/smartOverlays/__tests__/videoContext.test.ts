import { describe, it, expect } from "vitest";
import { sampleVideoContextAtTime, type VideoContext } from "../context/videoContext.js";
import { evaluateOverlayDocument } from "../runtime/evaluator.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Ticket 4: VideoContext Abstraction & Temporal Sampling", () => {
  const mockVideoContext: VideoContext = {
    canvas: { width: 1920, height: 1080 },
    duration: 10.0,
    shots: [
      { id: "shot-1", startTime: 0.0, endTime: 4.5, label: "Wide Intro" },
      { id: "shot-2", startTime: 4.5, endTime: 10.0, label: "Close-up Speaker" }
    ],
    subjects: [
      {
        id: "subject-speaker",
        label: "Primary Speaker",
        type: "person",
        track: [
          { time: 0.0, region: { id: "p0", x: 100, y: 100, width: 200, height: 400, confidence: 0.95 } },
          { time: 10.0, region: { id: "p10", x: 300, y: 100, width: 200, height: 400, confidence: 0.95 } }
        ]
      }
    ],
    safeRegions: [
      { id: "action-safe", x: 96, y: 54, width: 1728, height: 972 }
    ],
    subtitleRegion: { x: 460, y: 920, width: 1000, height: 100 },
    transcript: [
      { id: "t1", startTime: 0.0, endTime: 3.0, text: "Welcome to Clypra Smart Overlays", speakerId: "subject-speaker" },
      { id: "t2", startTime: 3.0, endTime: 7.0, text: "Notice how overlays position themselves dynamically", speakerId: "subject-speaker" }
    ]
  };

  const mockDoc: OverlayDocument = {
    id: "doc-video-test",
    version: "2.0",
    title: "Video Context Test Overlay",
    category: "test",
    canvas: { width: 1920, height: 1080 },
    duration: 10.0,
    createdAt: "2026-08-12T00:00:00Z",
    updatedAt: "2026-08-12T00:00:00Z",
    variables: [],
    nodes: [
      {
        id: "text-subtitle-callout",
        type: "text",
        x: 200,
        y: 200,
        width: 400,
        height: 60,
        text: "Video Aware Callout"
      }
    ]
  };

  it("should evaluate active shot and transcript segment at time t", () => {
    const stateAt2s = sampleVideoContextAtTime(mockVideoContext, 2.0);
    expect(stateAt2s.activeShot?.id).toBe("shot-1");
    expect(stateAt2s.activeTranscriptSegment?.text).toBe("Welcome to Clypra Smart Overlays");
    expect(stateAt2s.activeSpeakerId).toBe("subject-speaker");

    const stateAt5s = sampleVideoContextAtTime(mockVideoContext, 5.0);
    expect(stateAt5s.activeShot?.id).toBe("shot-2");
    expect(stateAt5s.activeTranscriptSegment?.text).toBe("Notice how overlays position themselves dynamically");
  });

  it("should interpolate tracked subject bounding boxes smoothly between keyframes", () => {
    // At t=5.0 (midway between t=0 x=100 and t=10 x=300), x should be 200
    const stateAt5s = sampleVideoContextAtTime(mockVideoContext, 5.0);
    const speakerBox = stateAt5s.activeSubjects["subject-speaker"];

    expect(speakerBox).toBeDefined();
    expect(speakerBox.x).toBe(200);
    expect(speakerBox.y).toBe(100);
  });

  it("should integrate VideoContext into evaluateOverlayDocument and populate EvaluatedScene.videoState", () => {
    const scene = evaluateOverlayDocument(mockDoc, { video: mockVideoContext }, 5.0);

    expect(scene).toBeDefined();
    expect(scene.videoState).toBeDefined();
    expect(scene.videoState?.activeShot?.label).toBe("Close-up Speaker");
    expect(scene.videoState?.activeSubjects["subject-speaker"].x).toBe(200);
  });
});
