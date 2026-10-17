import type { TextBubblePreset } from "@clypra-studio/engine";

export const DEFAULT_BUBBLE_CATALOG: TextBubblePreset[] = [
  // ── 1. Torn Paper (Signature preset matching CapCut reference) ────────────
  {
    schemaVersion: 1,
    id: "bubble-paper-torn",
    version: 1,
    name: "Torn Paper",
    category: "paper",
    tags: ["paper", "torn", "grunge", "caption", "rough"],
    layout: {
      contentBounds: { x: 0.08, y: 0.12, width: 0.84, height: 0.76 },
      minWidth: 160,
      minHeight: 56,
      preserveAspectRatio: false,
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Impact, sans-serif",
      fontSize: 32,
      fontWeight: 700,
      fontStyle: "italic",
      textDecoration: "underline",
      color: "#ef4444",
    },
    sampleText: "Hey Man, I don't care about what you doing",
  },

  // ── 2. Torn Paper Beige ───────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-paper-torn-beige",
    version: 1,
    name: "Torn Paper Beige",
    category: "paper",
    tags: ["paper", "torn", "beige", "vintage", "caption"],
    layout: {
      contentBounds: { x: 0.08, y: 0.12, width: 0.84, height: 0.76 },
      minWidth: 150,
      minHeight: 52,
      preserveAspectRatio: false,
      padding: { top: 14, right: 22, bottom: 14, left: 22 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Georgia, serif",
      fontSize: 28,
      fontWeight: 600,
      fontStyle: "normal",
      textDecoration: "none",
      color: "#451a03",
    },
    sampleText: "Vintage Paper Note",
  },

  // ── 3. Kraft Paper Note ───────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-paper-kraft",
    version: 1,
    name: "Kraft Paper Strip",
    category: "paper",
    tags: ["paper", "kraft", "cardboard", "rustic", "brown"],
    layout: {
      contentBounds: { x: 0.06, y: 0.1, width: 0.88, height: 0.8 },
      minWidth: 140,
      minHeight: 48,
      preserveAspectRatio: false,
      padding: { top: 12, right: 20, bottom: 12, left: 20 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 26,
      fontWeight: 700,
      color: "#271c19",
    },
    sampleText: "Handcrafted Goods",
  },

  // ── 4. Speech Balloon Round ───────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-speech-round",
    version: 1,
    name: "Speech Balloon",
    category: "speech",
    tags: ["speech", "bubble", "dialogue", "chat", "tail"],
    layout: {
      contentBounds: { x: 0.08, y: 0.08, width: 0.84, height: 0.68 },
      minWidth: 120,
      minHeight: 64,
      preserveAspectRatio: false,
      padding: { top: 16, right: 20, bottom: 28, left: 20 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 24,
      fontWeight: 600,
      color: "#000000",
    },
    sampleText: "Hello there!",
  },

  // ── 5. Dotted Cloud ───────────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-cloud-dotted",
    version: 1,
    name: "Dotted Cloud",
    category: "cute",
    tags: ["cloud", "cute", "dream", "thought", "fluffy"],
    layout: {
      contentBounds: { x: 0.12, y: 0.12, width: 0.76, height: 0.76 },
      minWidth: 130,
      minHeight: 70,
      preserveAspectRatio: false,
      padding: { top: 18, right: 22, bottom: 18, left: 22 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Comic Sans MS, cursive, sans-serif",
      fontSize: 24,
      fontWeight: 700,
      color: "#1e293b",
    },
    sampleText: "Don't worry, be happy",
  },

  // ── 6. Comic BAM Starburst ────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-comic-bam",
    version: 1,
    name: "Comic Burst",
    category: "comic",
    tags: ["comic", "burst", "action", "starburst", "pop"],
    layout: {
      contentBounds: { x: 0.18, y: 0.18, width: 0.64, height: 0.64 },
      minWidth: 160,
      minHeight: 90,
      preserveAspectRatio: false,
      padding: { top: 24, right: 32, bottom: 24, left: 32 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Impact, sans-serif",
      fontSize: 34,
      fontWeight: 900,
      color: "#000000",
    },
    sampleText: "BAM!!",
  },

  // ── 7. Dark Hero Comic Burst ──────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-comic-dark-hero",
    version: 1,
    name: "Dark Hero Burst",
    category: "comic",
    tags: ["comic", "hero", "dark", "red", "action"],
    layout: {
      contentBounds: { x: 0.18, y: 0.18, width: 0.64, height: 0.64 },
      minWidth: 160,
      minHeight: 90,
      preserveAspectRatio: false,
      padding: { top: 24, right: 32, bottom: 24, left: 32 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Impact, sans-serif",
      fontSize: 32,
      fontWeight: 900,
      color: "#ef4444",
    },
    sampleText: "CRASH!",
  },

  // ── 8. Sunny Ribbon Banner ────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-ribbon-sunny",
    version: 1,
    name: "Sunny Ribbon",
    category: "banner",
    tags: ["ribbon", "banner", "yellow", "sale", "flag"],
    layout: {
      contentBounds: { x: 0.12, y: 0.1, width: 0.76, height: 0.8 },
      minWidth: 150,
      minHeight: 50,
      preserveAspectRatio: false,
      padding: { top: 12, right: 28, bottom: 12, left: 28 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 26,
      fontWeight: 800,
      color: "#000000",
    },
    sampleText: "SUPER SALE",
  },

  // ── 9. Minimalist Card ────────────────────────────────────────────────────
  {
    schemaVersion: 1,
    id: "bubble-card-minimal",
    version: 1,
    name: "Minimal Card",
    category: "labels",
    tags: ["card", "clean", "minimal", "label", "rounded"],
    layout: {
      contentBounds: { x: 0.05, y: 0.05, width: 0.9, height: 0.9 },
      minWidth: 110,
      minHeight: 44,
      preserveAspectRatio: false,
      padding: { top: 10, right: 18, bottom: 10, left: 18 },
      sizingMode: "auto-fit",
    },
    defaultTextStyle: {
      fontFamily: "Inter, sans-serif",
      fontSize: 24,
      fontWeight: 500,
      color: "#ffffff",
    },
    sampleText: "Quick Tag",
  },
];
