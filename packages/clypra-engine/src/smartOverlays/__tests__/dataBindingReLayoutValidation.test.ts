import { describe, it, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import type { OverlayDocument, ContainerNode, PrimitiveTextNode, MetricNode, RepeaterNode } from "../overlayDocumentSchema.js";

describe("Stage 2A — Data Binding & Dynamic Expression Re-Layout Suite", () => {

  // ---------------------------------------------------------------------------
  // Test 1 — Variable Expression Interpolation
  // ---------------------------------------------------------------------------
  it("Test 1: Evaluates single, nested, and missing mustache variable expressions correctly", () => {
    const textNode: PrimitiveTextNode = {
      id: "var-text",
      name: "User Greeting",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      text: "Hello {{ user.profile.name }}",
      style: { fontSize: 20 },
      layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
    };

    const doc: OverlayDocument = {
      id: "doc-db-1",
      version: 1,
      name: "Variable Interpolation Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [textNode],
      variables: [],
    };

    // Case A: Context with nested user name
    const stateA = layoutEngine.computeLayout(doc, {
      user: { profile: { name: "Alice Developer" } },
    });
    // "Hello Alice Developer" (21 chars * 20 * 0.55 = 231)
    expect(stateA.nodes["var-text"].width).toBe(231);

    // Case B: Context with missing profile -> replaces missing mustache with empty string ("Hello ")
    const stateB = layoutEngine.computeLayout(doc, {});
    // "Hello " (6 chars * 20 * 0.55 = 66)
    expect(stateB.nodes["var-text"].width).toBe(66);
  });

  // ---------------------------------------------------------------------------
  // Test 2 — Formatted Metric Re-Layout
  // ---------------------------------------------------------------------------
  it("Test 2: Formatted Metric Node expands container dynamically when numeric values scale", () => {
    const metricNode: MetricNode = {
      id: "mrr-metric",
      name: "MRR Metric",
      type: "metric",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      prefix: "$",
      value: "{{ mrr }}",
      suffix: "/mo",
      label: "MRR",
      style: { fontSize: 24 },
      layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
    };

    const metricContainer: ContainerNode = {
      id: "metric-card",
      name: "Metric Card",
      type: "container",
      x: 50,
      y: 50,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-row",
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [metricNode],
    };

    const doc: OverlayDocument = {
      id: "doc-db-2",
      version: 1,
      name: "Metric Re-Layout Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [metricContainer],
      variables: [],
    };

    // State 1: mrr = 500 -> "$500/mo MRR" (11 chars * 24 * 0.55 = 146). Card width = 146 + 48 = 194
    const state1 = layoutEngine.computeLayout(doc, { mrr: 500 });
    expect(state1.nodes["metric-card"].width).toBe(194);

    // State 2: mrr = 1250000 -> "$1250000/mo MRR" (15 chars * 24 * 0.55 = 198). Card width = 198 + 48 = 246
    const state2 = layoutEngine.computeLayout(doc, { mrr: 1250000 });
    expect(state2.nodes["metric-card"].width).toBe(246);
    expect(state2.nodes["metric-card"].width).toBeGreaterThan(state1.nodes["metric-card"].width);
  });

  // ---------------------------------------------------------------------------
  // Test 3 — Repeater Dataset Generation
  // ---------------------------------------------------------------------------
  it("Test 3: Repeater Node dynamically instantiates list items and expands stack height", () => {
    const itemTextTemplate: PrimitiveTextNode = {
      id: "item-template-text",
      name: "Item Label",
      type: "text",
      x: 0,
      y: 0,
      width: 150,
      height: 30,
      text: "{{ item.name }}",
      style: { fontSize: 18 },
    };

    const repeater: RepeaterNode = {
      id: "feature-repeater",
      name: "Feature List",
      type: "repeater",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      datasetBinding: "features",
      direction: "vertical",
      itemTemplate: itemTextTemplate,
      layout: {
        gap: 10,
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
    };

    const repeaterContainer: ContainerNode = {
      id: "list-container",
      name: "List Card",
      type: "container",
      x: 100,
      y: 100,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-column",
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [repeater],
    };

    const doc: OverlayDocument = {
      id: "doc-db-3",
      version: 1,
      name: "Repeater Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [repeaterContainer],
      variables: [],
    };

    // State A: 2 items in dataset -> total height = (2 * 30) + 10 + 40 = 110
    const stateA = layoutEngine.computeLayout(doc, {
      features: [{ name: "Feature A" }, { name: "Feature B" }],
    });
    expect(stateA.nodes["list-container"].height).toBe(110);
    expect(stateA.nodes["feature-repeater-item-0"]).toBeDefined();
    expect(stateA.nodes["feature-repeater-item-1"]).toBeDefined();

    // State B: 4 items in dataset -> total height = (4 * 30) + (3 * 10) + 40 = 190
    const stateB = layoutEngine.computeLayout(doc, {
      features: [
        { name: "Feature A" },
        { name: "Feature B" },
        { name: "Feature C" },
        { name: "Feature D" },
      ],
    });
    expect(stateB.nodes["list-container"].height).toBe(190);
    expect(stateB.nodes["feature-repeater-item-3"]).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Test 4 — Conditional Visibility & Gap Collapse
  // ---------------------------------------------------------------------------
  it("Test 4: Hidden child node collapses gap and shrinks parent container bounds cleanly", () => {
    const badge1: PrimitiveTextNode = {
      id: "badge-1",
      name: "Badge 1",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: "Badge 1",
    };

    const badge2: PrimitiveTextNode = {
      id: "badge-2",
      name: "Badge 2 (Conditional)",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: "Badge 2",
      visible: "{{ showBadge2 }}",
    };

    const badge3: PrimitiveTextNode = {
      id: "badge-3",
      name: "Badge 3",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      text: "Badge 3",
    };

    const stackContainer: ContainerNode = {
      id: "badge-stack",
      name: "Badge Stack Container",
      type: "container",
      x: 50,
      y: 50,
      width: 0,
      height: 0,
      layout: {
        mode: "flex-column",
        gap: 10,
        padding: { top: 15, right: 15, bottom: 15, left: 15 },
        constraints: { widthMode: "hug", heightMode: "hug" },
      },
      children: [badge1, badge2, badge3],
    };

    const doc: OverlayDocument = {
      id: "doc-db-4",
      version: 1,
      name: "Conditional Visibility Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [stackContainer],
      variables: [],
    };

    // State 1: showBadge2 = true -> 3 items -> height = (3 * 40) + (2 * 10) + 30 = 170
    const state1 = layoutEngine.computeLayout(doc, { showBadge2: true });
    expect(state1.nodes["badge-stack"].height).toBe(170);
    // Badge 3 position: y = 50 + 15 + 40 + 10 + 40 + 10 = 165
    expect(state1.nodes["badge-3"].y).toBe(165);

    // State 2: showBadge2 = false -> 2 items active -> height = (2 * 40) + (1 * 10) + 30 = 120
    const state2 = layoutEngine.computeLayout(doc, { showBadge2: false });
    expect(state2.nodes["badge-stack"].height).toBe(120);
    expect(state2.nodes["badge-2"].width).toBe(0);
    // Badge 3 position shifts up: y = 50 + 15 + 40 + 10 = 115
    expect(state2.nodes["badge-3"].y).toBe(115);
  });

  // ---------------------------------------------------------------------------
  // Test 5 — Expression Safety Invariants
  // ---------------------------------------------------------------------------
  it("Test 5: Gracefully handles expression syntax errors, nulls, and undefined properties without engine crash", () => {
    const textNode: PrimitiveTextNode = {
      id: "safe-text",
      name: "Safe Text",
      type: "text",
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      text: "Value: {{ invalid.property.path | 'Fallback' }}",
      style: { fontSize: 20 },
      layout: { constraints: { widthMode: "hug" } },
    };

    const doc: OverlayDocument = {
      id: "doc-db-5",
      version: 1,
      name: "Expression Safety Test",
      canvas: { width: 1920, height: 1080, fps: 60, duration: 10 },
      nodes: [textNode],
      variables: [],
    };

    expect(() => {
      const computed = layoutEngine.computeLayout(doc, { invalid: null });
      expect(computed.nodes["safe-text"]).toBeDefined();
    }).not.toThrow();
  });
});
