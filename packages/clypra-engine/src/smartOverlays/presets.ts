import type { SmartOverlayPreset } from "./smartOverlayTypes.js";

export const SMART_OVERLAY_PRESETS: SmartOverlayPreset[] = [
  {
    id: "stat-growth-metric",
    name: "Growth Metric Stat Card",
    category: "stat",
    description: "Prominent metric card featuring big numbers, glow highlights, and growth delta badge.",
    previewThumbnail: "",
    defaultContent: {
      type: "stat",
      data: {
        value: "+142%",
        label: "User Growth & Engagement",
        delta: "+15% YoY",
        icon: "trending-up"
      }
    },
    style: {
      presetId: "stat-growth-metric",
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 22,
      textColor: "#FFFFFF",
      highlightColor: "#7C6FFF",
      cardBackgroundColor: "#12121A",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "scale-pop"
    }
  },
  {
    id: "quote-executive-testimonial",
    name: "Executive Quote Card",
    category: "quote",
    description: "Elegant blockquote card with large quotation glyph, custom typography, and author line.",
    previewThumbnail: "",
    defaultContent: {
      type: "quote",
      data: {
        quote: "Design is not just what it looks like and feels like. Design is how it works.",
        author: "Steve Jobs",
        title: "Co-Founder, Apple"
      }
    },
    style: {
      presetId: "quote-executive-testimonial",
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 24,
      textColor: "#E2E8F0",
      highlightColor: "#7C6FFF",
      cardBackgroundColor: "#0E0E14",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "fade"
    }
  },
  {
    id: "code-terminal-snippet",
    name: "Developer Code Block",
    category: "code",
    description: "IDE window snippet with red/yellow/green header buttons, syntax highlighting, and line numbers.",
    previewThumbnail: "",
    defaultContent: {
      type: "code",
      data: {
        title: "clypraEngine.ts",
        language: "typescript",
        code: "const overlay = new SmartOverlayRenderer(clip);\noverlay.draw(ctx, time, 1920, 1080);"
      }
    },
    style: {
      presetId: "code-terminal-snippet",
      layout: "center-card",
      fontFamily: "monospace",
      fontSize: 16,
      textColor: "#38BDF8",
      highlightColor: "#F43F5E",
      cardBackgroundColor: "#0A0A0F",
      cardBorderColor: "#1E293B",
      cardOpacity: 0.95,
      animationStyle: "typewriter"
    }
  },
  {
    id: "list-animated-points",
    name: "Feature Points List",
    category: "list",
    description: "Animated bullet points list card with active focus highlights per item.",
    previewThumbnail: "",
    defaultContent: {
      type: "list",
      data: {
        title: "Key Platform Capabilities",
        items: [
          { id: "1", text: "Hardware-accelerated GPU WebGL compositor", startTime: 0, endTime: 5 },
          { id: "2", text: "Multi-track timeline with sub-frame snapping", startTime: 1, endTime: 5 },
          { id: "3", text: "Smart overlay automation and AI extraction", startTime: 2, endTime: 5 }
        ]
      }
    },
    style: {
      presetId: "list-animated-points",
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 20,
      textColor: "#94A3B8",
      highlightColor: "#7C6FFF",
      cardBackgroundColor: "#12121A",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "slide-stagger"
    }
  },
  {
    id: "comparison-before-after",
    name: "Comparison Card",
    category: "comparison",
    description: "Dual-column comparison card contrasting Before vs After metrics.",
    previewThumbnail: "",
    defaultContent: {
      type: "comparison",
      data: {
        title: "Performance Upgrade Impact",
        left: { title: "Legacy Canvas 2D", points: ["30 FPS", "Software raster"], color: "#EF4444" },
        right: { title: "Clypra WebGL GPU", points: ["144 FPS", "Hardware accelerated"], color: "#10B981" }
      }
    },
    style: {
      presetId: "comparison-before-after",
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 20,
      textColor: "#FFFFFF",
      highlightColor: "#10B981",
      cardBackgroundColor: "#12121A",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "scale-pop"
    }
  },
  {
    id: "social-profile-badge",
    name: "Social Profile Card",
    category: "social",
    description: "Social media handle badge card featuring verified mark and follower count.",
    previewThumbnail: "",
    defaultContent: {
      type: "social",
      data: {
        platform: "x",
        name: "Clypra Studio",
        handle: "@clyprastudio",
        verified: true,
        metrics: "1.2M Followers"
      }
    },
    style: {
      presetId: "social-profile-badge",
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 18,
      textColor: "#FFFFFF",
      highlightColor: "#38BDF8",
      cardBackgroundColor: "#0F172A",
      cardBorderColor: "#1E293B",
      cardOpacity: 0.95,
      animationStyle: "fade"
    }
  },
  {
    id: "lower-third-speaker",
    name: "Speaker Lower Third",
    category: "lower-third",
    description: "Broadcast-ready lower third banner featuring speaker name, role, and accent bar.",
    previewThumbnail: "",
    defaultContent: {
      type: "lower-third",
      data: {
        name: "Alex Rivera",
        title: "Lead AI Systems Architect"
      }
    },
    style: {
      presetId: "lower-third-speaker",
      layout: "lower-third",
      fontFamily: "Inter",
      fontSize: 24,
      textColor: "#FFFFFF",
      highlightColor: "#7C6FFF",
      cardBackgroundColor: "#09090D",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "slide-stagger"
    }
  }
];
