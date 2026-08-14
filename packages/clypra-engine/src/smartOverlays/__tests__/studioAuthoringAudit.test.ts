import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { SMART_OVERLAY_PRESETS } from "../presets.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Studio Authoring Audit Suite (7 Benchmark Overlays)", () => {
  test("1. All 7 Benchmark Overlay Presets Exist in Registry", () => {
    expect(SMART_OVERLAY_PRESETS.length).toBeGreaterThanOrEqual(7);

    const presetIds = SMART_OVERLAY_PRESETS.map((p) => p.id);
    expect(presetIds).toContain("lower-third-speaker");
    expect(presetIds).toContain("comparison-before-after");
    expect(presetIds).toContain("stat-growth-metric");
    expect(presetIds).toContain("code-terminal-snippet");
    expect(presetIds).toContain("quote-executive-testimonial");
    expect(presetIds).toContain("list-animated-points");
    expect(presetIds).toContain("social-profile-badge");
  });

  test("2. Layout Engine Structural Evaluation Across All 7 Presets", () => {
    for (const preset of SMART_OVERLAY_PRESETS) {
      // Build test overlay document from preset configuration
      const doc: OverlayDocument = {
        id: `doc-${preset.id}`,
        version: "1.0",
        title: preset.name,
        canvas: { width: 1280, height: 720 },
        variables: [
          { key: "value", type: "string", defaultValue: "+142%" },
          { key: "name", type: "string", defaultValue: "Alex Rivera" },
          { key: "title", type: "string", defaultValue: "AI Architect" },
        ],
        nodes: [
          {
            id: `card-${preset.id}`,
            name: preset.name,
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
                id: `title-${preset.id}`,
                name: "Header",
                type: "text",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                text: preset.defaultContent.data.title || preset.defaultContent.data.name || preset.name,
                style: { fontSize: preset.style.fontSize || 24, textColor: preset.style.textColor },
                layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
              },
            ],
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const layout = layoutEngine.computeLayout(doc);
      const cardBounds = layout.nodes[`card-${preset.id}`];

      expect(cardBounds).toBeDefined();
      expect(cardBounds.width).toBe(480);
      expect(cardBounds.height).toBeGreaterThan(40);
    }
  });

  test("3. Data Binding Evaluation Parity", () => {
    const context = { name: "Dr. Bartholomew", role: "Principal Architect" };
    const resolvedName = dataBindingEngine.evaluateString("{{name}}", context);
    const resolvedRole = dataBindingEngine.evaluateString("{{role}}", context);

    expect(resolvedName).toBe("Dr. Bartholomew");
    expect(resolvedRole).toBe("Principal Architect");
  });

  test("4. Studio Preview vs Headless Export Layout Parity Across Presets (Delta < 1px)", () => {
    for (const preset of SMART_OVERLAY_PRESETS) {
      const doc: OverlayDocument = {
        id: `parity-${preset.id}`,
        version: "1.0",
        title: preset.name,
        canvas: { width: 1280, height: 720 },
        variables: [],
        nodes: [
          {
            id: "rootNode",
            name: "Root",
            type: "text",
            x: 100,
            y: 100,
            width: 0,
            height: 0,
            text: preset.name,
            style: { fontSize: 24 },
            layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
          },
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const previewLayout = layoutEngine.computeLayoutForBreakpoint(doc, null);
      const exportLayout = layoutEngine.computeLayout(doc);

      const p = previewLayout.nodes["rootNode"];
      const e = exportLayout.nodes["rootNode"];

      expect(Math.abs(p.x - e.x)).toBeLessThan(1);
      expect(Math.abs(p.y - e.y)).toBeLessThan(1);
      expect(Math.abs(p.width - e.width)).toBeLessThan(1);
      expect(Math.abs(p.height - e.height)).toBeLessThan(1);
    }
  });
});
