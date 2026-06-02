import { describe, expect, it } from "vitest";
import { createEmptyScene, newLayerId } from "./schema";
import { applyTimelineAtTime } from "./animation";
import {
  addKeyframeAtTime,
  addTrack,
  moveKeyframe,
  upsertKeyframe,
} from "./timelineMutations";
import type { AnimTrack } from "./schema";

describe("timelineMutations", () => {
  it("merges keyframes near the same time", () => {
    const track: AnimTrack = {
      layerId: "a",
      paramPath: "shadowOffsetY",
      keyframes: [{ time: 0, value: 5 }],
    };
    const next = upsertKeyframe(track, 0.02, 8);
    expect(next.keyframes).toHaveLength(1);
    expect(next.keyframes[0].value).toBe(8);
  });

  it("animates layerOpacity on the layer object", () => {
    const layerId = newLayerId();
    let doc = createEmptyScene({
      effectLayers: [
        {
          id: layerId,
          type: "glow",
          name: "Glow",
          enabled: true,
          opacity: 1,
          blendMode: "source-over",
          target: "text",
          params: { blur: 20, opacity: 80 },
        },
      ],
    });
    doc = addTrack(doc, layerId, "layerOpacity", [
      { time: 0, value: 0.2, easing: "linear" },
      { time: 1, value: 1, easing: "linear" },
    ]);
    const mid = applyTimelineAtTime(doc, 0.5);
    const layer = mid.effectLayers[0];
    expect(layer.opacity).toBeCloseTo(0.6, 1);
  });

  it("moves keyframe time within duration", () => {
    const layerId = newLayerId();
    let doc = createEmptyScene({
      timeline: { duration: 2, fps: 30, loop: false, tracks: [] },
      effectLayers: [
        {
          id: layerId,
          type: "shadow",
          name: "Shadow",
          enabled: true,
          opacity: 1,
          blendMode: "source-over",
          target: "text",
          params: { shadowOffsetY: 4 },
        },
      ],
    });
    doc = addTrack(doc, layerId, "shadowOffsetY", [{ time: 0, value: 4 }]);
    doc = addKeyframeAtTime(doc, 0, 1, 10);
    doc = moveKeyframe(doc, 0, 1, 1.5, 2);
    expect(doc.timeline.tracks[0].keyframes[1].time).toBe(1.5);
  });
});
