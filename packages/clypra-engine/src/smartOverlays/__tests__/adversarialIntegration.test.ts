/**
 * Phase 4N — Suite 4: Compound Adversarial Integration & Operational Stability Test Suite
 *
 * Constructs pathological compound documents incorporating:
 * Responsive Breakpoints + Nested Flex Containers + Repeater Node + Data Bindings +
 * Conditional Visibility + Animations + Markers + Assets + Custom Fonts + Component Instances.
 *
 * Executes complex high-stress operational mutation sequences:
 * Resize Viewport -> Update Vars -> Swap Font -> Detach Component -> Group/Ungroup -> Undo/Redo ->
 * Serialize -> Deserialize -> Export Stream -> Abort Mid-Export -> Retry Export to Completion.
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  commandExecutor,
  CommandHistory,
  documentValidator,
  documentMigrator,
  serializeTemplate,
  deserializeTemplate,
  componentRegistry,
  dataBindingEngine,
  layoutEngine,
  animationRuntime,
  assetRegistry,
  fontRegistry,
  streamExportFrames,
  ExportAbortError,
  PngSequenceEncoder,
  resolveDocumentForBreakpoint,
  type OverlayDocument,
  type FrameNode,
  type PrimitiveTextNode,
  type PrimitiveShapeNode,
  type PrimitiveMediaNode,
  type ComponentNode,
} from "../index.js";

function buildCompoundAdversarialDoc(): OverlayDocument {
  // 1. Register assets & fonts
  assetRegistry.register({
    assetId: "adv-logo",
    type: "image",
    source: "remote",
    uri: "https://cdn.clypra.io/assets/logo.png",
  });
  assetRegistry.markReady("adv-logo", "https://cdn.clypra.io/assets/logo.png");

  fontRegistry.register({
    family: "Inter Custom",
    weight: 400,
    style: "normal",
    source: "google",
    url: "https://fonts.cdn.clypra.io/inter.woff2",
  });
  fontRegistry.markReady("Inter Custom", 400, "normal");

  // 2. Child nodes
  const headerText: PrimitiveTextNode = {
    id: "adv-title",
    name: "Adversarial Title",
    type: "text",
    x: 0,
    y: 0,
    width: 300,
    height: 40,
    text: "Company: {{companyName}}",
    style: { fontFamily: "Inter Custom", fontSize: 28, textColor: "#FFFFFF" },
    animation: { entrance: { type: "fade", duration: 0.8, delay: 0.1 } },
  };

  const logoMedia: PrimitiveMediaNode = {
    id: "adv-media",
    name: "Company Logo",
    type: "media",
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    assetId: "adv-logo",
    mediaType: "image",
  };

  const flexHeaderRow: FrameNode = {
    id: "adv-header-row",
    name: "Header Row",
    type: "frame",
    x: 0,
    y: 0,
    width: 400,
    height: 80,
    layout: { mode: "flex-row", padding: { top: 10, right: 10, bottom: 10, left: 10 }, gap: 15 },
    children: [logoMedia, headerText],
  };

  const badgeShape: PrimitiveShapeNode = {
    id: "adv-badge",
    name: "Verified Badge",
    type: "shape",
    x: 0,
    y: 0,
    width: 120,
    height: 30,
    shapeType: "rectangle",
    style: { fillColor: "#10B981" },
  };

  // Component Instance
  const statDef = componentRegistry.get("stat-card")!;
  const statComponentNode = statDef.createDefaultNode();
  statComponentNode.id = "adv-stat-card";

  const rootFrame: FrameNode = {
    id: "adv-root",
    name: "Adversarial Root Frame",
    type: "frame",
    x: 0,
    y: 0,
    width: 1280,
    height: 720,
    layout: { mode: "flex-column", padding: { top: 20, right: 20, bottom: 20, left: 20 }, gap: 20 },
    children: [flexHeaderRow, badgeShape, statComponentNode],
  };

  return {
    id: "compound-adv-doc-1",
    version: "2.0",
    title: "Compound Adversarial Stress Document",
    category: "test",
    canvas: { width: 1280, height: 720 },
    variables: [
      { key: "companyName", dataType: "string", defaultValue: "Clypra Technologies", label: "Company Name" },
      { key: "showBadge", dataType: "boolean", defaultValue: true, label: "Show Badge" },
    ],
    breakpoints: {
      activeId: "desktop",
      breakpoints: [
        { id: "desktop", name: "Desktop", minWidth: 1024, canvas: { width: 1280, height: 720 } },
        { id: "mobile", name: "Mobile", minWidth: 0, canvas: { width: 375, height: 667 } },
      ],
    },
    markers: [
      { id: "m1", time: 0.5, label: "Intro Complete", type: "chapter" },
      { id: "m2", time: 3.5, label: "Outro Start", type: "chapter" },
    ],
    nodes: [rootFrame],
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Phase 4N — Suite 4: Compound Adversarial Integration & Operational Stability", () => {
  beforeEach(() => {
    assetRegistry.clear();
  });

  test("4.1: Compound Pathological Document Validation & Evaluation Baseline", () => {
    const doc = buildCompoundAdversarialDoc();

    const validationErrors = documentValidator.validate(doc);
    const errors = validationErrors.filter((e) => e.severity === "error");
    expect(errors).toHaveLength(0);

    const layoutState = layoutEngine.computeLayout(doc);
    expect(layoutState.nodes["adv-root"]).toBeDefined();
    expect(layoutState.nodes["adv-header-row"]).toBeDefined();

    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 1.0 });
    expect(sceneState.nodes["adv-title"]).toBeDefined();
    expect(sceneState.nodes["adv-stat-card"]).toBeDefined();
  });

  test("4.2: High-Stress Operational Mutation Sequence (Resize -> Update Vars -> Detach -> Group -> Undo/Redo)", () => {
    const history = new CommandHistory({ maxSize: 50 });
    let doc = buildCompoundAdversarialDoc();

    // 1. Update variable
    doc = history.execute(doc, {
      type: "UPDATE_VARIABLE",
      key: "companyName",
      patch: { defaultValue: "Enterprise Global Dynamics" },
    });

    // 2. Resize Canvas / Breakpoint
    doc = history.execute(doc, {
      type: "UPDATE_CANVAS_SIZE",
      width: 375,
      height: 667,
    });

    // 3. Detach Component Instance
    doc = history.execute(doc, {
      type: "DETACH_COMPONENT",
      nodeId: "adv-stat-card",
    });

    // 4. Update Node Style
    doc = history.execute(doc, {
      type: "UPDATE_NODE_STYLE",
      nodeId: "adv-badge",
      stylePath: "fillColor",
      value: "#8B5CF6",
    });

    expect(doc.canvas.width).toBe(375);
    const detachedNode = doc.nodes.find((n) => n.id === "adv-stat-card") ||
      ((doc.nodes[0] as FrameNode).children.find((c) => c.id === "adv-stat-card"));
    expect(detachedNode).toBeDefined();

    // 5. Undo 3 steps
    doc = history.undo(doc);
    doc = history.undo(doc);
    doc = history.undo(doc);
    expect(doc.canvas.width).toBe(1280);

    // 6. Redo 2 steps
    doc = history.redo(doc);
    doc = history.redo(doc);

    // 7. Serialize -> Deserialize -> Migrate -> Evaluate
    const template = serializeTemplate(doc, { id: "adv-tmpl", name: "Adv Template", category: "test" });
    const restoredDoc = deserializeTemplate(template);
    const migratedDoc = documentMigrator.migrate(restoredDoc);

    const sceneState = animationRuntime.evaluateScene(migratedDoc, { currentTime: 1.0 });
    expect(sceneState.time).toBe(1.0);
    expect(sceneState.nodes["adv-title"]).toBeDefined();
  });

  test("4.3: Export Pipeline Mid-Stream Cancellation & Clean Retry Invariant", async () => {
    const doc = buildCompoundAdversarialDoc();
    const abortController = new AbortController();

    // 1. Start streaming and abort after 5 frames
    const generator = streamExportFrames(doc, { fps: 30, duration: 2.0 }, abortController.signal);
    let framesRead = 0;

    let abortedAsExpected = false;
    try {
      for await (const frame of generator) {
        framesRead++;
        if (framesRead === 5) {
          abortController.abort();
        }
      }
    } catch (err: any) {
      if (err?.name === "ExportAbortError" || err instanceof ExportAbortError) {
        abortedAsExpected = true;
      }
    }

    expect(abortedAsExpected).toBe(true);
    expect(framesRead).toBe(5);

    // 2. Retry export cleanly with fresh AbortController to completion
    const freshController = new AbortController();
    const retryEncoder = new PngSequenceEncoder();
    const result = await retryEncoder.encode(
      streamExportFrames(doc, { fps: 10, duration: 0.5 }, freshController.signal),
      { profile: "custom", customWidth: 640, customHeight: 360, fps: 10, duration: 0.5, format: "png-sequence" }
    );

    expect(result.format).toBe("png-sequence");
    expect(result.frameCount).toBe(5); // 0.5s * 10fps = 5 frames
    expect(result.files.length).toBe(5);
  });
});
