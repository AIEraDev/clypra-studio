import { describe, test, expect } from "vitest";
import { layoutEngine } from "../layoutEngine.js";
import type { OverlayDocument } from "../overlayDocumentSchema.js";

describe("Text Primitive & Measurement Engine Validation", () => {
  test("Intrinsic Measurement for Standard Text", () => {
    const doc: OverlayDocument = {
      id: "test-doc",
      version: "1.0",
      title: "Text Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "t1",
          name: "Short Text",
          type: "text",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          text: "Hello World",
          style: { fontSize: 20 },
          layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const bounds = layout.nodes["t1"];
    expect(bounds.width).toBeGreaterThan(100);
    expect(bounds.height).toBe(24); // 20 * 1.2
  });

  test("Tabular Numerals Width Stability (Numeric Jitter Prevention)", () => {
    const makeDoc = (val: string, tabularNums: boolean): OverlayDocument => ({
      id: "doc-num",
      version: "1.0",
      title: "Metric Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "m1",
          name: "Metric Value",
          type: "text",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          text: val,
          style: { fontSize: 24 },
          tabularNums,
          layout: { constraints: { widthMode: "hug", heightMode: "hug" } },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const layout111 = layoutEngine.computeLayout(makeDoc("1111", true)).nodes["m1"];
    const layout888 = layoutEngine.computeLayout(makeDoc("8888", true)).nodes["m1"];

    // Under tabularNums, 4 digits must yield identical advance width
    expect(layout111.width).toEqual(layout888.width);
  });

  test("Scale-Down Overflow Policy (Auto-Shrinking Font Size)", () => {
    const doc: OverlayDocument = {
      id: "doc-scale",
      version: "1.0",
      title: "Scale Down Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "t_scale",
          name: "Long Nameplate",
          type: "text",
          x: 0,
          y: 0,
          width: 200, // Constrained container width
          height: 40,
          text: "Dr. Bartholomew Montgomery-Smith The Great",
          style: { fontSize: 32 },
          overflow: "scale-down",
          minFontSize: 12,
          layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const bounds = layout.nodes["t_scale"];
    expect(bounds.width).toBe(200);
    // Height should reflect the auto-shrunk font size single line
    expect(bounds.height).toBeLessThan(32 * 1.2);
  });

  test("Auto-Wrap Non-Linear Height Curve (Height = f(Width))", () => {
    const doc: OverlayDocument = {
      id: "doc-wrap",
      version: "1.0",
      title: "Auto Wrap Test",
      canvas: { width: 1280, height: 720 },
      variables: [],
      nodes: [
        {
          id: "t_wrap",
          name: "Wrapped Paragraph",
          type: "text",
          x: 0,
          y: 0,
          width: 150, // Narrow container forces multi-line wrap
          height: 0,
          text: "A very long explanation of machine learning overlay systems and layout evaluation.",
          style: { fontSize: 20 },
          overflow: "wrap",
          layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
        },
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const layout = layoutEngine.computeLayout(doc);
    const bounds = layout.nodes["t_wrap"];
    expect(bounds.width).toBe(150);
    // Should be wrapped into multiple lines, resulting in height > single line (24px)
    expect(bounds.height).toBeGreaterThan(48);
  });
});
