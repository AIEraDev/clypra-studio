import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  IconNode,
  LineNode,
  ConnectorNode,
  PrimitiveTextNode,
  PrimitiveMediaNode,
  PrimitiveShapeNode,
} from "../overlayDocumentSchema.js";

describe("Phase 4: Vector & Annotation Primitives Crucible Benchmark", () => {
  const layoutEngine = new LayoutEngine();

  // =========================================================================
  // PRIMITIVE 1: ICON (Vector Glyph Primitive)
  // =========================================================================
  describe("Primitive 1: Icon (Vector Glyph Primitive)", () => {
    it("1.1: should resolve intrinsic dimensions (default 24px and specified size)", () => {
      const doc: OverlayDocument = {
        id: "doc-icon-test",
        version: "1.0",
        title: "Icon Intrinsic",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "icon-default",
            name: "Default Icon",
            type: "icon",
            iconName: "lucide:cpu",
            x: 50,
            y: 50,
            width: 0,
            height: 0,
          } as IconNode,
          {
            id: "icon-48",
            name: "48px Icon",
            type: "icon",
            iconName: "lucide:zap",
            size: 48,
            x: 100,
            y: 50,
            width: 0,
            height: 0,
          } as IconNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      expect(res["icon-default"].width).toBe(24);
      expect(res["icon-default"].height).toBe(24);

      expect(res["icon-48"].width).toBe(48);
      expect(res["icon-48"].height).toBe(48);
    });

    it("1.2: should participate seamlessly in LayoutFrame flex alignment with text", () => {
      const doc: OverlayDocument = {
        id: "doc-icon-frame",
        version: "1.0",
        title: "Icon in Frame",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "badge-frame",
            name: "Badge Frame",
            type: "frame",
            x: 100,
            y: 100,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 8,
              padding: { top: 10, right: 16, bottom: 10, left: 16 },
            },
            children: [
              {
                id: "cpu-icon",
                name: "CPU Icon",
                type: "icon",
                iconName: "cpu",
                size: 20,
                x: 0,
                y: 0,
                width: 20,
                height: 20,
              } as IconNode,
              {
                id: "cpu-text",
                name: "CPU Text",
                type: "text",
                text: "Apple M3 Max",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 120,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      const frame = res["badge-frame"];
      const icon = res["cpu-icon"];
      const text = res["cpu-text"];

      // Width: padLeft(16) + icon(20) + gap(8) + text(120) + padRight(16) = 180
      expect(frame.width).toBe(180);
      // Height: padTop(10) + max(20, 20) + padBottom(10) = 40
      expect(frame.height).toBe(40);

      // Icon & Text Positions inside frame
      expect(icon.x).toBe(100 + 16);
      expect(text.x).toBe(100 + 16 + 20 + 8); // 144
    });
  });

  // =========================================================================
  // PRIMITIVE 2: LINE (Geometric Relationship Primitive)
  // =========================================================================
  describe("Primitive 2: Line (Geometric Relationship Primitive)", () => {
    it("2.1: should accurately compute bounding box for diagonal, horizontal and vertical lines", () => {
      const doc: OverlayDocument = {
        id: "doc-line-test",
        version: "1.0",
        title: "Line Test",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "diag-line",
            name: "Diagonal Line",
            type: "line",
            x: 0,
            y: 0,
            startX: 100,
            startY: 150,
            endX: 400,
            endY: 550,
            width: 0,
            height: 0,
            strokeColor: "#3B82F6",
            strokeWidth: 3,
            strokeCap: "round",
          } as LineNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      expect(res["diag-line"].x).toBe(100);
      expect(res["diag-line"].y).toBe(150);
      expect(res["diag-line"].width).toBe(300); // 400 - 100
      expect(res["diag-line"].height).toBe(400); // 550 - 150
    });
  });

  // =========================================================================
  // PRIMITIVE 3: CONNECTOR (Relational Graph Primitive)
  // =========================================================================
  describe("Primitive 3: Connector (Relational Graph Primitive)", () => {
    it("3.1: should resolve directional anchors (top, bottom, left, right, center)", () => {
      const targetA: PrimitiveShapeNode = {
        id: "node-a",
        name: "Box A",
        type: "shape",
        shapeType: "rectangle",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      };

      const targetB: PrimitiveShapeNode = {
        id: "node-b",
        name: "Box B",
        type: "shape",
        shapeType: "rectangle",
        x: 600,
        y: 400,
        width: 150,
        height: 80,
      };

      const connector: ConnectorNode = {
        id: "conn-a-to-b",
        name: "Connector",
        type: "connector",
        fromNodeId: "node-a",
        toNodeId: "node-b",
        fromAnchor: "right", // (100 + 200, 100 + 50) = (300, 150)
        toAnchor: "top", // (600 + 75, 400) = (675, 400)
        lineStyle: "orthogonal",
        arrowHead: "end",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };

      const doc: OverlayDocument = {
        id: "doc-conn-test",
        version: "1.0",
        title: "Connector Test",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [targetA, targetB, connector],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;
      const connBounds = res["conn-a-to-b"];

      // From (300, 150) to (675, 400)
      expect(connBounds.x).toBe(300);
      expect(connBounds.y).toBe(150);
      expect(connBounds.width).toBe(675 - 300); // 375
      expect(connBounds.height).toBe(400 - 150); // 250
    });

    it("3.2: should dynamically track targets when node geometry changes without manual offsets", () => {
      const doc: OverlayDocument = {
        id: "doc-tracking-test",
        version: "1.0",
        title: "Dynamic Tracking",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          {
            id: "source-node",
            name: "Source",
            type: "shape",
            shapeType: "circle",
            x: 200,
            y: 200,
            width: 80,
            height: 80,
          } as PrimitiveShapeNode,
          {
            id: "target-card",
            name: "Target Card",
            type: "frame",
            x: 700,
            y: 300,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              padding: 10,
            },
            children: [
              {
                id: "dynamic-label",
                name: "Label",
                type: "text",
                text: "Short",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 80,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,
          {
            id: "dynamic-conn",
            name: "Dynamic Connector",
            type: "connector",
            fromNodeId: "source-node",
            toNodeId: "target-card",
            fromAnchor: "center",
            toAnchor: "left",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          } as ConnectorNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Initial layout (Short label)
      const res1 = layoutEngine.computeLayout(doc).nodes;
      // Source center = (200 + 40, 200 + 40) = (240, 240)
      // Target left anchor = (700, 300 + (10 + 20 + 10)/2) = (700, 320)
      expect(res1["dynamic-conn"].x).toBe(240);
      expect(res1["dynamic-conn"].y).toBe(240);
      expect(res1["dynamic-conn"].width).toBe(700 - 240); // 460
      expect(res1["dynamic-conn"].height).toBe(320 - 240); // 80

      // Now expand label text width to 300
      (doc.nodes[1] as FrameNode).children![0].width = 300;
      const res2 = layoutEngine.computeLayout(doc).nodes;

      // Target card width grew from 100 to 320, but left anchor remains at x=700
      expect(res2["dynamic-conn"].width).toBe(460);
    });
  });

  // =========================================================================
  // HERO BENCHMARK: The AI Hardware Explainer Annotation Overlay
  // =========================================================================
  describe("Hero Benchmark: The AI Hardware Explainer Annotation Overlay", () => {
    it("should composite central device image with 4 dynamic connector callouts (Icon + Text)", () => {
      const doc: OverlayDocument = {
        id: "doc-ai-explainer-hero",
        version: "1.0",
        title: "AI Hardware Explainer Overlay",
        canvas: { width: 1920, height: 1080 },
        variables: [],
        nodes: [
          // 1. Central Hero Laptop Image
          {
            id: "laptop-center-image",
            name: "MacBook Pro Central Image",
            type: "media",
            mediaType: "image",
            assetId: "asset://devices/macbook-pro.png",
            x: 660,
            y: 340,
            width: 600,
            height: 400,
            intrinsicWidth: 1200,
            intrinsicHeight: 800,
          } as PrimitiveMediaNode,

          // 2. Callout A: Top-Left (CPU)
          {
            id: "callout-cpu",
            name: "CPU Callout Card",
            type: "frame",
            x: 200,
            y: 180,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 10,
              padding: { top: 12, right: 18, bottom: 12, left: 14 },
            },
            children: [
              {
                id: "cpu-glyph",
                name: "CPU Icon",
                type: "icon",
                iconName: "lucide:cpu",
                size: 24,
                x: 0,
                y: 0,
                width: 24,
                height: 24,
              } as IconNode,
              {
                id: "cpu-title",
                name: "CPU Text",
                type: "text",
                text: "Apple M3 Max Chip",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 140,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,

          // 3. Callout B: Top-Right (RAM)
          {
            id: "callout-ram",
            name: "RAM Callout Card",
            type: "frame",
            x: 1400,
            y: 180,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 10,
              padding: { top: 12, right: 18, bottom: 12, left: 14 },
            },
            children: [
              {
                id: "ram-glyph",
                name: "RAM Icon",
                type: "icon",
                iconName: "lucide:memory-stick",
                size: 24,
                x: 0,
                y: 0,
                width: 24,
                height: 24,
              } as IconNode,
              {
                id: "ram-title",
                name: "RAM Text",
                type: "text",
                text: "128GB Unified RAM",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 150,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,

          // 4. Callout C: Bottom-Left (GPU)
          {
            id: "callout-gpu",
            name: "GPU Callout Card",
            type: "frame",
            x: 200,
            y: 800,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 10,
              padding: { top: 12, right: 18, bottom: 12, left: 14 },
            },
            children: [
              {
                id: "gpu-glyph",
                name: "GPU Icon",
                type: "icon",
                iconName: "lucide:gpu",
                size: 24,
                x: 0,
                y: 0,
                width: 24,
                height: 24,
              } as IconNode,
              {
                id: "gpu-title",
                name: "GPU Text",
                type: "text",
                text: "40-Core GPU",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 110,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,

          // 5. Callout D: Bottom-Right (Battery)
          {
            id: "callout-battery",
            name: "Battery Callout Card",
            type: "frame",
            x: 1400,
            y: 800,
            width: 0,
            height: 0,
            layout: {
              mode: "flex-row",
              constraints: { widthMode: "hug", heightMode: "hug" },
              alignItems: "center",
              gap: 10,
              padding: { top: 12, right: 18, bottom: 12, left: 14 },
            },
            children: [
              {
                id: "battery-glyph",
                name: "Battery Icon",
                type: "icon",
                iconName: "lucide:battery",
                size: 24,
                x: 0,
                y: 0,
                width: 24,
                height: 24,
              } as IconNode,
              {
                id: "battery-title",
                name: "Battery Text",
                type: "text",
                text: "22-Hour Battery Life",
                fontSize: 16,
                x: 0,
                y: 0,
                width: 160,
                height: 20,
              } as PrimitiveTextNode,
            ],
          } as FrameNode,

          // 6. Connectors from Laptop to Callout Cards
          {
            id: "conn-cpu",
            name: "Laptop -> CPU Connector",
            type: "connector",
            fromNodeId: "laptop-center-image",
            toNodeId: "callout-cpu",
            fromAnchor: { x: 0.3, y: 0.3 }, // Normalized UV hotspot on laptop motherboard
            toAnchor: "right",
            lineStyle: "bezier",
            arrowHead: "start",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          } as ConnectorNode,
          {
            id: "conn-ram",
            name: "Laptop -> RAM Connector",
            type: "connector",
            fromNodeId: "laptop-center-image",
            toNodeId: "callout-ram",
            fromAnchor: { x: 0.7, y: 0.3 },
            toAnchor: "left",
            lineStyle: "bezier",
            arrowHead: "start",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          } as ConnectorNode,
          {
            id: "conn-gpu",
            name: "Laptop -> GPU Connector",
            type: "connector",
            fromNodeId: "laptop-center-image",
            toNodeId: "callout-gpu",
            fromAnchor: { x: 0.3, y: 0.7 },
            toAnchor: "right",
            lineStyle: "orthogonal",
            arrowHead: "start",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          } as ConnectorNode,
          {
            id: "conn-battery",
            name: "Laptop -> Battery Connector",
            type: "connector",
            fromNodeId: "laptop-center-image",
            toNodeId: "callout-battery",
            fromAnchor: { x: 0.7, y: 0.8 },
            toAnchor: "left",
            lineStyle: "orthogonal",
            arrowHead: "start",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          } as ConnectorNode,
        ],
        duration: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;

      // 1. Laptop Center bounds: x=660, y=340, width=600, height=400
      expect(res["laptop-center-image"].x).toBe(660);
      expect(res["laptop-center-image"].y).toBe(340);
      expect(res["laptop-center-image"].width).toBe(600);
      expect(res["laptop-center-image"].height).toBe(400);

      // 2. CPU Callout Hug bounds: padLeft(14) + icon(24) + gap(10) + text(140) + padRight(18) = 206
      const cpuCard = res["callout-cpu"];
      expect(cpuCard.width).toBe(206);
      expect(cpuCard.height).toBe(48); // 12 + 24 + 12

      // 3. CPU Connector bounds:
      // fromPt on laptop (UV: 0.3, 0.3) = (660 + 180, 340 + 120) = (840, 460)
      // toPt on cpuCard right anchor = (200 + 206, 180 + 24) = (406, 204)
      const connCpu = res["conn-cpu"];
      expect(connCpu.x).toBe(406);
      expect(connCpu.y).toBe(204);
      expect(connCpu.width).toBe(840 - 406); // 434
      expect(connCpu.height).toBe(460 - 204); // 256

      // 4. RAM Callout Hug bounds: padLeft(14) + icon(24) + gap(10) + text(150) + padRight(18) = 216
      const ramCard = res["callout-ram"];
      expect(ramCard.width).toBe(216);

      // 5. RAM Connector bounds:
      // fromPt on laptop (UV: 0.7, 0.3) = (660 + 420, 340 + 120) = (1080, 460)
      // toPt on ramCard left anchor = (1400, 180 + 24) = (1400, 204)
      const connRam = res["conn-ram"];
      expect(connRam.x).toBe(1080);
      expect(connRam.y).toBe(204);
      expect(connRam.width).toBe(1400 - 1080); // 320
      expect(connRam.height).toBe(460 - 204); // 256
    });
  });
});
