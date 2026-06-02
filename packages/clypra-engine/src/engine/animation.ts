import type { SceneDocument, Keyframe } from "./schema";

export function ease(t: number, kind: Keyframe["easing"] = "linear"): number {
  switch (kind) {
    case "easeIn":
      return t * t;
    case "easeOut":
      return t * (2 - t);
    case "easeInOut":
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default:
      return t;
  }
}

function interpolateKeyframes(keyframes: Keyframe[], time: number): number {
  if (keyframes.length === 0) return 0;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time || 1;
      const localT = (time - a.time) / span;
      const eased = ease(localT, b.easing ?? "linear");
      return a.value + (b.value - a.value) * eased;
    }
  }
  return sorted[sorted.length - 1].value;
}

/** Resolve animated scalar at time (seconds) */
export function resolveAnimatedScalar(doc: SceneDocument, layerId: string, paramPath: string, baseValue: number, time: number): number {
  const track = doc.timeline.tracks.find((t) => t.layerId === layerId && t.paramPath === paramPath);
  if (!track || track.keyframes.length === 0) return baseValue;
  return interpolateKeyframes(track.keyframes, time);
}

/** Apply timeline to scene (returns shallow clone with updated layer params) */
export function applyTimelineAtTime(doc: SceneDocument, time: number): SceneDocument {
  const looped = doc.timeline.loop && doc.timeline.duration > 0 ? time % doc.timeline.duration : Math.min(time, doc.timeline.duration);

  const layers = doc.effectLayers.map((layer) => {
    let opacity = layer.opacity;
    const params = { ...layer.params };
    for (const track of doc.timeline.tracks) {
      if (track.layerId !== layer.id) continue;
      if (track.paramPath === "layerOpacity") {
        opacity = resolveAnimatedScalar(doc, layer.id, track.paramPath, opacity, looped);
        continue;
      }
      const parts = track.paramPath.split(".");
      let target: Record<string, unknown> = params;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof target[key] !== "object" || target[key] === null) {
          target[key] = {};
        }
        target = target[key] as Record<string, unknown>;
      }
      const leaf = parts[parts.length - 1];
      const current = typeof target[leaf] === "number" ? (target[leaf] as number) : 0;
      target[leaf] = resolveAnimatedScalar(doc, layer.id, track.paramPath, current, looped);
    }
    return { ...layer, opacity, params };
  });

  return { ...doc, effectLayers: layers };
}

export function createDefaultRevealTrack(layerId: string): SceneDocument["timeline"]["tracks"][0] {
  return {
    layerId,
    paramPath: "revealProgress",
    keyframes: [
      { time: 0, value: 0, easing: "easeOut" },
      { time: 1, value: 1, easing: "easeOut" },
    ],
  };
}

export function createPulseOpacityTrack(layerId: string): SceneDocument["timeline"]["tracks"][0] {
  return {
    layerId,
    paramPath: "layerOpacity",
    keyframes: [
      { time: 0, value: 0.6, easing: "easeInOut" },
      { time: 1, value: 1, easing: "easeInOut" },
      { time: 2, value: 0.6, easing: "easeInOut" },
    ],
  };
}
