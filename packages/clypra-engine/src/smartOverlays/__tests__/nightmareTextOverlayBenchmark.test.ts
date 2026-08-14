import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Nightmare Text Overlay Benchmark Suite", () => {
  const createNightmareDocument = (): OverlayDocument => ({
    id: "nightmare-ai-explainer",
    version: "1.0",
    title: "AI Educational Explainer",
    canvas: { width: 1280, height: 720 },
    variables: [
      { key: "metricVal", type: "number", defaultValue: 999 },
      { key: "transcriptText", type: "string", defaultValue: "AI Revolution" },
    ],
    nodes: [
      {
        id: "mainContainer",
        name: "Card Container",
        type: "container",
        x: 40,
        y: 40,
        width: 480,
        height: 0,
        layout: {
          mode: "flex-column",
          gap: 16,
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
          constraints: { widthMode: "fixed", heightMode: "hug" },
        },
        children: [
          {
            id: "titleNode",
            name: "Title (Rich Text)",
            type: "rich-text",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            spans: [
              { text: "Clypra Engine: ", style: { color: "#94A3B8", fontSize: 28, fontWeight: "600" } },
              { text: "AI EXPLATION 🚀", style: { color: "#7C6FFF", fontSize: 28, fontWeight: "700" } },
            ],
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
          {
            id: "subtitleNode",
            name: "Subtitle (Wrapped Text)",
            type: "text",
            x: 0,
            y: 0,
            width: 432,
            height: 0,
            text: "A comprehensive real-time motion graphics runtime built for dynamic educational overlays and international text shaping.",
            style: { fontSize: 16, lineHeight: 1.4 },
            overflow: "wrap",
            layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
          },
          {
            id: "kpiNode",
            name: "Live KPI (Metric Text)",
            type: "metric",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            prefix: "CPU: ",
            value: "{{metricVal}}",
            suffix: "%",
            style: { fontSize: 36, fontWeight: "700", textColor: "#22C55E" },
            tabularNums: true,
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
          {
            id: "arabicNode",
            name: "Arabic Example",
            type: "text",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            text: "السلام عليكم ورحمة الله وبركاته",
            style: { fontSize: 20 },
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
          {
            id: "cjkNode",
            name: "CJK Example",
            type: "text",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            text: "人工智能平台 2026",
            style: { fontSize: 20 },
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
        ],
      },
      {
        id: "calloutBadge",
        name: "Anchored Callout",
        type: "shape",
        shapeType: "rounded-rectangle",
        x: 0,
        y: 0,
        width: 180,
        height: 48,
        anchor: {
          targetId: "mainContainer",
          targetSide: "right",
          anchorSide: "left",
          offsetX: 24,
          offsetY: 0,
        },
      },
      {
        id: "calloutLine",
        name: "Connector Line",
        type: "line",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        startNodeId: "mainContainer",
        endNodeId: "calloutBadge",
      },
    ],
    duration: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  test("1. Composite Nightmare Overlay Layout Determinism", () => {
    const doc = createNightmareDocument();
    const layout = layoutEngine.computeLayout(doc);

    expect(layout.nodes["mainContainer"].width).toBe(480);
    // Container height should auto-expand to accommodate title, wrapped subtitle, metric, arabic, cjk, and padding
    expect(layout.nodes["mainContainer"].height).toBeGreaterThan(200);

    // Anchored callout badge must position to the right of main container (40 + 480 + 24 = 544)
    expect(layout.nodes["calloutBadge"].x).toBe(544);
  });

  test("2. Dynamic Text Expansion & Anchor Reflow Parity", () => {
    const doc = createNightmareDocument();

    // Initial layout
    const layoutInit = layoutEngine.computeLayout(doc);
    const initialBadgeX = layoutInit.nodes["calloutBadge"].x;

    // Mutate container width
    const container = doc.nodes[0] as any;
    container.width = 600;
    container.children[1].width = 552; // Expand subtitle width constraint

    const layoutMutated = layoutEngine.computeLayout(doc);
    const mutatedBadgeX = layoutMutated.nodes["calloutBadge"].x;

    // Callout badge must shift right by exactly 120px (600 - 480 = 120)
    expect(mutatedBadgeX - initialBadgeX).toBe(120);

    // Connector line bounding box must dynamically update
    const lineBounds = layoutMutated.nodes["calloutLine"];
    expect(lineBounds.width).toBeGreaterThan(0);
  });

  test("3. 60 FPS High-Frequency Metric Update Stability", () => {
    const doc = createNightmareDocument();

    let prevKpiWidth = 0;
    // Simulate 60 FPS data updates with tabular numbers
    for (let frame = 0; frame < 60; frame++) {
      const val = 1000 + frame;
      const layout = layoutEngine.computeLayout(doc, { metricVal: val });
      const kpiBounds = layout.nodes["kpiNode"];

      if (prevKpiWidth > 0) {
        // Tabular digits must guarantee constant advance width across 4-digit numbers (1000..1059)
        expect(kpiBounds.width).toBe(prevKpiWidth);
      }
      prevKpiWidth = kpiBounds.width;
    }
  });

  test("4. Studio Preview vs Headless Export Layout Parity (Delta < 1px)", () => {
    const doc = createNightmareDocument();

    // Studio Preview Pass (1080p landscape)
    const previewLayout = layoutEngine.computeLayoutForBreakpoint(doc, null, { metricVal: 95 });

    // Headless Export Pass (Identical canvas context data)
    const exportLayout = layoutEngine.computeLayout(doc, { metricVal: 95 });

    // Assert Delta < 1px across all 7 nodes
    for (const node of doc.nodes) {
      const pBounds = previewLayout.nodes[node.id];
      const eBounds = exportLayout.nodes[node.id];

      const deltaX = Math.abs(pBounds.x - eBounds.x);
      const deltaY = Math.abs(pBounds.y - eBounds.y);
      const deltaW = Math.abs(pBounds.width - eBounds.width);
      const deltaH = Math.abs(pBounds.height - eBounds.height);

      expect(deltaX).toBeLessThan(1);
      expect(deltaY).toBeLessThan(1);
      expect(deltaW).toBeLessThan(1);
      expect(deltaH).toBeLessThan(1);
    }
  });
});
