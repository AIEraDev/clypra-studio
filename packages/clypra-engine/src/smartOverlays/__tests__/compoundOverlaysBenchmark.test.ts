import { describe, it, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { animationRuntime } from "../animationRuntime.js";
import { resolveSpatialConstraints } from "../spatial/spatialConstraints.js";
import type {
  OverlayDocument,
  ContainerNode,
  PrimitiveTextNode,
  PrimitiveShapeNode,
  PrimitiveMediaNode,
  MetricNode,
  RepeaterNode,
  IconNode,
} from "../overlayDocumentSchema.js";

describe("Stage 2D — Dynamic Compound Overlays Benchmark Suite", () => {

  // ---------------------------------------------------------------------------
  // Benchmark 1 — Broadcast Lower Third Card
  // ---------------------------------------------------------------------------
  it("Benchmark 1: Builds a Broadcast Lower Third Card using a single root Rectangle container", () => {
    const accentBar: PrimitiveShapeNode = {
      id: "accent-bar",
      name: "Brand Accent Bar",
      type: "shape",
      shapeType: "rectangle",
      x: 0,
      y: 0,
      width: 6,
      height: 48,
      style: { fill: "#3B82F6" },
    };

    const avatar: PrimitiveMediaNode = {
      id: "speaker-avatar",
      name: "Speaker Avatar",
      type: "media",
      mediaType: "avatar",
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      src: "https://example.com/avatar.jpg",
      style: { cornerRadius: 24 },
    };

    const titleText: PrimitiveTextNode = {
      id: "speaker-name",
      name: "Speaker Name",
      type: "text",
      x: 0,
      y: 0,
      width: 180,
      height: 24,
      text: "{{ speaker.name }}",
      style: { fontSize: 18, fontWeight: "bold", fill: "#FFFFFF" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const titleRole: PrimitiveTextNode = {
      id: "speaker-title",
      name: "Speaker Title",
      type: "text",
      x: 0,
      y: 0,
      width: 220,
      height: 18,
      text: "{{ speaker.title }}",
      style: { fontSize: 14, fill: "#9CA3AF" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const textColumn: ContainerNode = {
      id: "speaker-text-col",
      name: "Text Column",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-column",
        gap: 4,
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [titleText, titleRole],
    };

    const lowerThirdRoot: ContainerNode = {
      id: "lower-third-root",
      name: "Lower Third Card",
      type: "container",
      x: 80,
      y: 920,
      width: 0,
      height: 0,
      clipContent: true,
      style: {
        fill: "rgba(15, 23, 42, 0.9)",
        stroke: "rgba(255, 255, 255, 0.15)",
        strokeWidth: 1,
        cornerRadius: 12,
        shadow: { color: "rgba(0,0,0,0.4)", blur: 20, offsetX: 0, offsetY: 6 },
      },
      layout: {
        mode: "flex-row",
        gap: 16,
        padding: { top: 12, right: 24, bottom: 12, left: 16 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      animation: {
        entrance: {
          type: "slide",
          direction: "up",
          duration: 0.6,
          delay: 0.2,
          easing: "ease-out",
        },
      },
      children: [accentBar, avatar, textColumn],
    };

    const doc: OverlayDocument = {
      id: "doc-bench-1",
      version: 1,
      name: "Lower Third Benchmark",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [lowerThirdRoot],
      variables: [],
    };

    // Evaluate layout with speaker data
    const context = {
      speaker: { name: "Dr. Elena Rostova", title: "Chief AI Architect, Clypra Research" },
    };

    const computedLayout = layoutEngine.computeLayout(doc, context);
    const cardBounds = computedLayout.nodes["lower-third-root"];

    expect(cardBounds.x).toBe(80);
    expect(cardBounds.y).toBe(920);
    expect(cardBounds.width).toBeGreaterThan(350);
    expect(cardBounds.height).toBeGreaterThan(60);

    // Evaluate animation state at t = 0.5s (during slide-up entrance)
    const animState = animationRuntime.evaluateScene(doc, { currentTime: 0.5 });
    expect(animState.nodes["lower-third-root"].opacity).toBeGreaterThan(0);
    expect(animState.nodes["lower-third-root"].opacity).toBeLessThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // Benchmark 2 — Dynamic Live KPI Metric Card
  // ---------------------------------------------------------------------------
  it("Benchmark 2: Builds a Live KPI Metric Card with dynamic data expressions and status badges", () => {
    const kpiMetric: MetricNode = {
      id: "kpi-mrr",
      name: "MRR Metric",
      type: "metric",
      x: 0,
      y: 0,
      width: 150,
      height: 36,
      prefix: "$",
      value: "{{ kpi.value }}",
      suffix: "",
      label: "",
      style: { fontSize: 28, fontWeight: "bold", fill: "#10B981" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const badgeText: PrimitiveTextNode = {
      id: "badge-pct",
      name: "Change Badge Text",
      type: "text",
      x: 0,
      y: 0,
      width: 50,
      height: 20,
      text: "{{ kpi.change }}%",
      style: { fontSize: 12, fontWeight: "bold", fill: "#10B981" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const badgeContainer: ContainerNode = {
      id: "change-badge",
      name: "Badge Pill",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      style: {
        fill: "rgba(16, 185, 129, 0.15)",
        cornerRadius: 999,
      },
      layout: {
        mode: "flex-row",
        padding: { top: 4, right: 10, bottom: 4, left: 10 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [badgeText],
    };

    const headerRow: ContainerNode = {
      id: "kpi-header-row",
      name: "Header Row",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-row",
        gap: 12,
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [kpiMetric, badgeContainer],
    };

    const progressBar: PrimitiveShapeNode = {
      id: "kpi-progress",
      name: "Progress Indicator Bar",
      type: "shape",
      shapeType: "rectangle",
      x: 0,
      y: 0,
      width: 140,
      height: 6,
      cornerRadius: 3,
      style: { fill: "#10B981" },
    };

    const kpiCardRoot: ContainerNode = {
      id: "kpi-card-root",
      name: "KPI Card Container",
      type: "container",
      x: 1500,
      y: 100,
      width: 0,
      height: 0,
      style: {
        fill: "rgba(30, 41, 59, 0.95)",
        stroke: "rgba(255, 255, 255, 0.1)",
        strokeWidth: 1,
        cornerRadius: 16,
        shadow: { color: "rgba(0,0,0,0.3)", blur: 24, offsetX: 0, offsetY: 8 },
      },
      layout: {
        mode: "flex-column",
        gap: 12,
        padding: { top: 20, right: 24, bottom: 20, left: 24 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [headerRow, progressBar],
    };

    const doc: OverlayDocument = {
      id: "doc-bench-2",
      version: 1,
      name: "KPI Metric Benchmark",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [kpiCardRoot],
      variables: [],
    };

    // State 1: KPI value = 12500, change = +18.4
    const state1 = layoutEngine.computeLayout(doc, { kpi: { value: 12500, change: "+18.4" } });
    const width1 = state1.nodes["kpi-card-root"].width;

    // State 2: KPI value = 12500000 (8 figures), change = +142.5
    const state2 = layoutEngine.computeLayout(doc, { kpi: { value: 12500000, change: "+142.5" } });
    const width2 = state2.nodes["kpi-card-root"].width;

    expect(width2).toBeGreaterThan(width1);
    expect(state1.nodes["change-badge"].width).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Benchmark 3 — Interactive Video Callout & Connector Pin
  // ---------------------------------------------------------------------------
  it("Benchmark 3: Builds an Interactive Video Callout Card anchored to a subject tracking pin with safe-area clamping", () => {
    const icon: IconNode = {
      id: "target-icon",
      name: "Target Icon",
      type: "icon",
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      iconName: "crosshair",
      style: { fill: "#EF4444" },
    };

    const label: PrimitiveTextNode = {
      id: "target-label",
      name: "Subject Label",
      type: "text",
      x: 0,
      y: 0,
      width: 140,
      height: 20,
      text: "OBJECT DETECTED",
      style: { fontSize: 14, fontWeight: "bold", fill: "#FFFFFF" },
      layout: { constraints: { widthMode: "hug" } },
    };

    const calloutRoot: ContainerNode = {
      id: "callout-card",
      name: "Callout Container",
      type: "container",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      clipContent: true,
      style: {
        fill: "rgba(17, 24, 39, 0.95)",
        stroke: "#EF4444",
        strokeWidth: 1.5,
        cornerRadius: 8,
      },
      layout: {
        mode: "flex-row",
        gap: 10,
        padding: { top: 10, right: 16, bottom: 10, left: 14 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [icon, label],
    };

    const doc: OverlayDocument = {
      id: "doc-bench-3",
      version: 1,
      name: "Callout Benchmark",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [calloutRoot],
      variables: [],
    };

    // Calculate layout bounds
    const computedLayout = layoutEngine.computeLayout(doc);
    const initialBounds = computedLayout.nodes["callout-card"];

    // Anchor to subject tracking pin at x = 1850 (near right canvas boundary)
    const trackingVideoState = {
      time: 2.5,
      activeSubjects: {
        tracked_subject: { x: 1800, y: 400, width: 80, height: 80 },
      },
    };

    const initialTransform = {
      x: initialBounds.x,
      y: initialBounds.y,
      width: initialBounds.width,
      height: initialBounds.height,
      opacity: 1,
      visible: true,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    const resolvedTransform = resolveSpatialConstraints(
      initialTransform,
      { anchorTo: "tracked_subject", preferPlacement: "side-right", safeMargin: 40 },
      trackingVideoState,
      1920,
      1080
    );

    // Verify safe margin clamping: x + width <= 1920 - 40 = 1880
    expect(resolvedTransform.x + resolvedTransform.width).toBeLessThanOrEqual(1880);

    // Calculate connector vector start & end
    const connectorStart = {
      x: resolvedTransform.x,
      y: resolvedTransform.y + resolvedTransform.height / 2,
    };
    const connectorEnd = {
      x: trackingVideoState.activeSubjects.tracked_subject.x + 40,
      y: trackingVideoState.activeSubjects.tracked_subject.y + 40,
    };

    expect(connectorStart.x).toBe(resolvedTransform.x);
    expect(connectorEnd.x).toBe(1840);
  });

  // ---------------------------------------------------------------------------
  // Benchmark 4 — Multi-Card Repeater Overlay
  // ---------------------------------------------------------------------------
  it("Benchmark 4: Builds a Multi-Card Repeater Overlay that dynamically expands height for array datasets", () => {
    const cardTitle: PrimitiveTextNode = {
      id: "card-item-title",
      name: "Card Title",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 24,
      text: "{{ item.title }}",
      style: { fontSize: 16, fontWeight: "bold", fill: "#FFFFFF" },
    };

    const cardDesc: PrimitiveTextNode = {
      id: "card-item-desc",
      name: "Card Desc",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 18,
      text: "{{ item.desc }}",
      style: { fontSize: 13, fill: "#9CA3AF" },
    };

    const cardItemTemplate: ContainerNode = {
      id: "card-item-template",
      name: "Card Item",
      type: "container",
      x: 0,
      y: 0,
      width: 260,
      height: 60,
      style: {
        fill: "rgba(30, 41, 59, 0.8)",
        stroke: "rgba(255, 255, 255, 0.1)",
        strokeWidth: 1,
        cornerRadius: 8,
      },
      layout: {
        mode: "flex-column",
        gap: 4,
        padding: { top: 10, right: 16, bottom: 10, left: 16 },
      },
      children: [cardTitle, cardDesc],
    };

    const cardRepeater: RepeaterNode = {
      id: "cards-repeater",
      name: "Cards Repeater",
      type: "repeater",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      datasetBinding: "cards",
      direction: "vertical",
      itemTemplate: cardItemTemplate,
      layout: {
        gap: 12,
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
    };

    const repeaterOverlayRoot: ContainerNode = {
      id: "repeater-overlay-root",
      name: "Repeater Overlay Root",
      type: "container",
      x: 100,
      y: 100,
      width: 0,
      height: 0,
      style: {
        fill: "rgba(15, 23, 42, 0.95)",
        cornerRadius: 16,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      layout: {
        mode: "flex-column",
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [cardRepeater],
    };

    const doc: OverlayDocument = {
      id: "doc-bench-4",
      version: 1,
      name: "Repeater Benchmark",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [repeaterOverlayRoot],
      variables: [],
    };

    // State 1: 3 cards -> total height = (3 * 60) + (2 * 12) + 40 = 244
    const state1 = layoutEngine.computeLayout(doc, {
      cards: [
        { title: "Card 1", desc: "First item" },
        { title: "Card 2", desc: "Second item" },
        { title: "Card 3", desc: "Third item" },
      ],
    });
    expect(state1.nodes["repeater-overlay-root"].height).toBe(244);

    // State 2: 5 cards -> total height = (5 * 60) + (4 * 12) + 40 = 388
    const state2 = layoutEngine.computeLayout(doc, {
      cards: [
        { title: "Card 1", desc: "First item" },
        { title: "Card 2", desc: "Second item" },
        { title: "Card 3", desc: "Third item" },
        { title: "Card 4", desc: "Fourth item" },
        { title: "Card 5", desc: "Fifth item" },
      ],
    });
    expect(state2.nodes["repeater-overlay-root"].height).toBe(388);
    expect(state2.nodes["repeater-overlay-root"].height).toBeGreaterThan(state1.nodes["repeater-overlay-root"].height);
  });
});
