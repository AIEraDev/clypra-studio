import type { AnimTrack, Keyframe, SceneDocument } from "./schema";
import { readLayerScalar } from "./animatableParams";

export function trackId(track: AnimTrack): string {
  return `${track.layerId}::${track.paramPath}`;
}

export function findTrackIndex(doc: SceneDocument, layerId: string, paramPath: string): number {
  return doc.timeline.tracks.findIndex(
    (t) => t.layerId === layerId && t.paramPath === paramPath
  );
}

export function getLayerById(doc: SceneDocument, layerId: string) {
  return doc.effectLayers.find((l) => l.id === layerId);
}

export function updateTimeline(
  doc: SceneDocument,
  patch: Partial<SceneDocument["timeline"]>
): SceneDocument {
  return { ...doc, timeline: { ...doc.timeline, ...patch } };
}

export function setTracks(doc: SceneDocument, tracks: AnimTrack[]): SceneDocument {
  return updateTimeline(doc, { tracks });
}

export function pruneTracksForLayer(doc: SceneDocument, layerId: string): SceneDocument {
  return setTracks(
    doc,
    doc.timeline.tracks.filter((t) => t.layerId !== layerId)
  );
}

export function addTrack(
  doc: SceneDocument,
  layerId: string,
  paramPath: string,
  initialKeyframes?: Keyframe[]
): SceneDocument {
  if (findTrackIndex(doc, layerId, paramPath) >= 0) return doc;
  const layer = getLayerById(doc, layerId);
  const base = layer ? readLayerScalar(layer, paramPath) : 0;
  const track: AnimTrack = {
    layerId,
    paramPath,
    keyframes: initialKeyframes ?? [{ time: 0, value: base, easing: "easeInOut" }],
  };
  return setTracks(doc, [...doc.timeline.tracks, track]);
}

export function removeTrack(doc: SceneDocument, trackIndex: number): SceneDocument {
  const tracks = doc.timeline.tracks.filter((_, i) => i !== trackIndex);
  return setTracks(doc, tracks);
}

export function updateTrack(
  doc: SceneDocument,
  trackIndex: number,
  updater: (track: AnimTrack) => AnimTrack
): SceneDocument {
  const tracks = doc.timeline.tracks.map((t, i) => (i === trackIndex ? updater(t) : t));
  return setTracks(doc, tracks);
}

export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

const KEYFRAME_MERGE_EPS = 0.04;

export function upsertKeyframe(
  track: AnimTrack,
  time: number,
  value?: number,
  easing?: Keyframe["easing"]
): AnimTrack {
  const clampedTime = Math.max(0, time);
  const existingIdx = track.keyframes.findIndex(
    (k) => Math.abs(k.time - clampedTime) < KEYFRAME_MERGE_EPS
  );
  if (existingIdx >= 0) {
    const next = [...track.keyframes];
    next[existingIdx] = {
      ...next[existingIdx],
      time: clampedTime,
      value: value ?? next[existingIdx].value,
      easing: easing ?? next[existingIdx].easing,
    };
    return { ...track, keyframes: sortKeyframes(next) };
  }
  const resolvedValue = value ?? (track.keyframes[0]?.value ?? 0);
  return {
    ...track,
    keyframes: sortKeyframes([
      ...track.keyframes,
      { time: clampedTime, value: resolvedValue, easing: easing ?? "easeInOut" },
    ]),
  };
}

export function addKeyframeAtTime(
  doc: SceneDocument,
  trackIndex: number,
  time: number,
  value?: number
): SceneDocument {
  return updateTrack(doc, trackIndex, (track) => {
    const layer = getLayerById(doc, track.layerId);
    const resolved =
      value ?? (layer ? readLayerScalar(layer, track.paramPath) : track.keyframes[0]?.value ?? 0);
    return upsertKeyframe(track, time, resolved);
  });
}

export function moveKeyframe(
  doc: SceneDocument,
  trackIndex: number,
  keyframeIndex: number,
  time: number,
  duration: number
): SceneDocument {
  const clamped = Math.max(0, Math.min(duration, time));
  return updateTrack(doc, trackIndex, (track) => {
    const kfs = [...track.keyframes];
    if (keyframeIndex < 0 || keyframeIndex >= kfs.length) return track;
    kfs[keyframeIndex] = { ...kfs[keyframeIndex], time: clamped };
    return { ...track, keyframes: sortKeyframes(kfs) };
  });
}

export function updateKeyframe(
  doc: SceneDocument,
  trackIndex: number,
  keyframeIndex: number,
  patch: Partial<Keyframe>
): SceneDocument {
  return updateTrack(doc, trackIndex, (track) => {
    const kfs = track.keyframes.map((k, i) => (i === keyframeIndex ? { ...k, ...patch } : k));
    return { ...track, keyframes: sortKeyframes(kfs) };
  });
}

export function removeKeyframe(
  doc: SceneDocument,
  trackIndex: number,
  keyframeIndex: number
): SceneDocument {
  return updateTrack(doc, trackIndex, (track) => ({
    ...track,
    keyframes: track.keyframes.filter((_, i) => i !== keyframeIndex),
  }));
}

export function duplicateTrackAtPlayhead(
  doc: SceneDocument,
  trackIndex: number,
  previewTime: number
): SceneDocument {
  const track = doc.timeline.tracks[trackIndex];
  if (!track) return doc;
  const layer = getLayerById(doc, track.layerId);
  const value = layer ? readLayerScalar(layer, track.paramPath) : 0;
  return addKeyframeAtTime(doc, trackIndex, previewTime, value);
}
