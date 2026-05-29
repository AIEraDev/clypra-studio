import type { SceneDocument } from "./schema";
import { newLayerId } from "./schema";

/** Attach MVP demo animation tracks (shadow drift + optional mask reveal) */
export function ensureDefaultTimeline(doc: SceneDocument): SceneDocument {
  if (doc.timeline.tracks.length > 0) return doc;

  const shadowLayer = doc.effectLayers.find((l) => l.type === "shadow");
  const maskLayer = doc.effectLayers.find((l) => l.type === "mask");

  const tracks: SceneDocument["timeline"]["tracks"] = [];

  if (shadowLayer) {
    tracks.push({
      layerId: shadowLayer.id,
      paramPath: "shadowOffsetY",
      keyframes: [
        { time: 0, value: (shadowLayer.params.shadowOffsetY as number) ?? 5, easing: "easeInOut" },
        {
          time: doc.timeline.duration / 2,
          value: ((shadowLayer.params.shadowOffsetY as number) ?? 5) + 8,
          easing: "easeInOut",
        },
        {
          time: doc.timeline.duration,
          value: (shadowLayer.params.shadowOffsetY as number) ?? 5,
          easing: "easeInOut",
        },
      ],
    });
  }

  if (maskLayer) {
    tracks.push({
      layerId: maskLayer.id,
      paramPath: "revealProgress",
      keyframes: [
        { time: 0, value: 0, easing: "easeOut" },
        { time: doc.timeline.duration * 0.85, value: 1, easing: "easeOut" },
      ],
    });
    maskLayer.enabled = false;
  }

  return {
    ...doc,
    effectLayers: doc.effectLayers.map((l) => ({ ...l })),
    timeline: { ...doc.timeline, tracks },
  };
}

export function cloneSceneWithNewIds(doc: SceneDocument): SceneDocument {
  const idMap = new Map<string, string>();
  const effectLayers = doc.effectLayers.map((l) => {
    const id = newLayerId();
    idMap.set(l.id, id);
    return { ...l, id, params: { ...l.params } };
  });
  const tracks = doc.timeline.tracks.map((t) => ({
    ...t,
    layerId: idMap.get(t.layerId) ?? t.layerId,
    keyframes: t.keyframes.map((k) => ({ ...k })),
  }));
  return { ...doc, effectLayers, timeline: { ...doc.timeline, tracks } };
}
