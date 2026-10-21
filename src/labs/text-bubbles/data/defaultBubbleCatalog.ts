import type { TextBubblePreset } from "@clypra-studio/engine";

/**
 * Three intentionally different art directions, each backed by a canonical
 * engine shape so Studio previews remain representative of editor output.
 */
export const DEFAULT_BUBBLE_CATALOG: TextBubblePreset[] = [
  {
    schemaVersion: 1,
    id: "bubble-speech-chalk-rose",
    version: 1,
    name: "Rose Chalk Dialogue",
    category: "speech",
    tags: ["speech", "chalk", "hand-drawn", "rose", "dialogue"],
    layout: {
      contentBounds: { x: 0.1, y: 0.12, width: 0.8, height: 0.58 },
      minWidth: 220,
      minHeight: 112,
      preserveAspectRatio: false,
      padding: { top: 22, right: 34, bottom: 42, left: 34 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 36,
      fontWeight: 500,
      fontStyle: "italic",
      textDecoration: "none",
      color: "#fffdf8",
    },
    sampleText: "Hey Guys",
  },
  {
    schemaVersion: 1,
    id: "bubble-comic-bam",
    version: 1,
    name: "Ink Pop!",
    category: "comic",
    tags: ["comic", "ink", "burst", "hand-drawn", "impact"],
    layout: {
      contentBounds: { x: 0.18, y: 0.2, width: 0.64, height: 0.56 },
      minWidth: 172,
      minHeight: 118,
      preserveAspectRatio: true,
      padding: { top: 28, right: 34, bottom: 28, left: 34 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Impact, Arial Black, sans-serif",
      fontSize: 34,
      fontWeight: 700,
      fontStyle: "normal",
      textDecoration: "none",
      color: "#1d1a17",
    },
    sampleText: "WOW!",
  },
  {
    schemaVersion: 1,
    id: "bubble-cloud-dotted",
    version: 1,
    name: "Daydream Cloud",
    category: "cute",
    tags: ["cute", "cloud", "thought", "doodle", "soft"],
    layout: {
      contentBounds: { x: 0.12, y: 0.16, width: 0.76, height: 0.58 },
      minWidth: 178,
      minHeight: 108,
      preserveAspectRatio: false,
      padding: { top: 24, right: 30, bottom: 30, left: 30 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 27,
      fontWeight: 600,
      fontStyle: "normal",
      textDecoration: "none",
      color: "#44344d",
    },
    sampleText: "Thinking of you",
  },
];
