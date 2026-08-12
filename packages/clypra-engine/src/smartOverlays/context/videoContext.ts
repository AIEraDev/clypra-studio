export interface BoundingRegion {
  id: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface TemporalKeyframedRegion {
  time: number; // Seconds
  region: BoundingRegion;
}

export interface TrackedSubject {
  id: string;
  label: string;
  type: "person" | "face" | "object" | "speaker";
  track: TemporalKeyframedRegion[];
}

export interface ShotBoundary {
  id: string;
  startTime: number; // Seconds
  endTime: number; // Seconds
  label?: string;
}

export interface SubtitleRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  active?: boolean;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speakerId?: string;
}

export interface VideoContext {
  canvas: {
    width: number;
    height: number;
  };
  duration: number; // Total video duration in seconds
  shots?: ShotBoundary[];
  subjects?: TrackedSubject[];
  safeRegions?: BoundingRegion[];
  subtitleRegion?: SubtitleRegion;
  transcript?: TranscriptSegment[];
  semanticMarkers?: Array<{ time: number; label: string; category?: string }>;
}

export interface EvaluatedVideoStateAtTime {
  time: number;
  activeShot?: ShotBoundary;
  activeSubjects: Record<string, BoundingRegion>; // subjectId -> interpolated bounding box at t
  activeTranscriptSegment?: TranscriptSegment;
  activeSpeakerId?: string;
  subtitleRegion?: SubtitleRegion;
  safeRegions: BoundingRegion[];
}

/**
 * Pure helper function to sample VideoContext at explicit playhead time `t`.
 * Interpolates subject bounding boxes between keyframe samples deterministically.
 */
export function sampleVideoContextAtTime(
  videoCtx: VideoContext,
  time: number
): EvaluatedVideoStateAtTime {
  const activeShot = videoCtx.shots?.find(
    (s) => time >= s.startTime && time <= s.endTime
  );

  const activeTranscriptSegment = videoCtx.transcript?.find(
    (tr) => time >= tr.startTime && time <= tr.endTime
  );

  const activeSubjects: Record<string, BoundingRegion> = {};

  if (videoCtx.subjects) {
    for (const subject of videoCtx.subjects) {
      if (!subject.track || subject.track.length === 0) continue;

      // Sort track by time
      const sortedTrack = [...subject.track].sort((a, b) => a.time - b.time);

      if (time <= sortedTrack[0].time) {
        activeSubjects[subject.id] = sortedTrack[0].region;
      } else if (time >= sortedTrack[sortedTrack.length - 1].time) {
        activeSubjects[subject.id] = sortedTrack[sortedTrack.length - 1].region;
      } else {
        // Linear interpolation between previous and next keyframes
        for (let i = 0; i < sortedTrack.length - 1; i++) {
          const prev = sortedTrack[i];
          const next = sortedTrack[i + 1];
          if (time >= prev.time && time <= next.time) {
            const factor = (time - prev.time) / (next.time - prev.time || 1);
            activeSubjects[subject.id] = {
              id: subject.id,
              name: subject.label,
              x: prev.region.x + (next.region.x - prev.region.x) * factor,
              y: prev.region.y + (next.region.y - prev.region.y) * factor,
              width: prev.region.width + (next.region.width - prev.region.width) * factor,
              height: prev.region.height + (next.region.height - prev.region.height) * factor,
              confidence: Math.min(prev.region.confidence ?? 1, next.region.confidence ?? 1)
            };
            break;
          }
        }
      }
    }
  }

  return {
    time,
    activeShot,
    activeSubjects,
    activeTranscriptSegment,
    activeSpeakerId: activeTranscriptSegment?.speakerId,
    subtitleRegion: videoCtx.subtitleRegion,
    safeRegions: videoCtx.safeRegions || []
  };
}
