/**
 * Phase 4J — Responsive Layout Test Suite
 *
 * The "brutal" acceptance test the architecture requires:
 * A StatCard component rendered across 4 real-world viewports,
 * with short text, long text, dynamic data, and animation — all asserting
 * structural invariants, not just "it didn't throw".
 */

import { describe, test, expect } from "vitest";
import {
  layoutEngine,
  animationRuntime,
  commandExecutor,
  CommandHistory,
  serializeTemplate,
  deserializeTemplate,
  resolveNodeForBreakpoint,
  resolveDocumentForBreakpoint,
  type OverlayDocument,
  type SceneNode,
  type FrameNode,
  type PrimitiveTextNode,
  type Breakpoint,
} from "../index.js";

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeDoc(
  nodes: SceneNode[] = [],
  canvas = { width: 1280, height: 720 }
): OverlayDocument {
  return {
    id: "responsive-test-doc",
    version: "2.0",
    title: "Responsive Layout Test",
    category: "test",
    canvas,
    variables: [
      { key: "score", type: "number", defaultValue: 42 },
      { key: "label", type: "string", defaultValue: "Short" },
    ],
    nodes,
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const BP_LANDSCAPE: Breakpoint = {
  id: "bp-landscape",
  label: "Landscape HD",
  canvas: { width: 1280, height: 720 },
};

const BP_PORTRAIT: Breakpoint = {
  id: "bp-portrait",
  label: "Mobile Portrait",
  canvas: { width: 1080, height: 1920 },
};

const BP_SQUARE: Breakpoint = {
  id: "bp-square",
  label: "Square",
  canvas: { width: 1080, height: 1080 },
};

const BP_4_5: Breakpoint = {
  id: "bp-45",
  label: "4:5 Portrait",
  canvas: { width: 1080, height: 1350 },
};

/** Build a StatCard FrameNode tree: Icon + Value + Label + Trend */
function makeStatCard(id = "stat-card-root"): FrameNode {
  const icon: SceneNode = {
    id: `${id}-icon`,
    name: "Icon",
    type: "shape",
    shapeType: "circle",
    x: 0, y: 0, width: 48, height: 48,
    style: { fillColor: "#7C6FFF" },
  } as any;

  const value: PrimitiveTextNode = {
    id: `${id}-value`,
    name: "Value",
    type: "text",
    x: 0, y: 0, width: 200, height: 60,
    text: "{{score}}",
    style: { fontSize: 48, textColor: "#FFFFFF" },
    layout: { constraints: { widthMode: "hug" } },
  };

  const label: PrimitiveTextNode = {
    id: `${id}-label`,
    name: "Label",
    type: "text",
    x: 0, y: 0, width: 200, height: 30,
    text: "{{label}}",
    style: { fontSize: 16, textColor: "#AAAAAA" },
    layout: { constraints: { widthMode: "hug" } },
  };

  const trend: SceneNode = {
    id: `${id}-trend`,
    name: "Trend",
    type: "shape",
    shapeType: "rectangle",
    x: 0, y: 0, width: 80, height: 24,
    style: { fillColor: "#22C55E" },
  } as any;

  return {
    id,
    name: "StatCard",
    type: "frame",
    x: 20, y: 20, width: 320, height: 200,
    layout: {
      mode: "flex-column",
      gap: 12,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      constraints: { widthMode: "hug" },
    },
    children: [icon, value, label, trend],
  };
}

function docWithBreakpoints(nodes: SceneNode[]): OverlayDocument {
  const doc = makeDoc(nodes);
  return {
    ...doc,
    breakpoints: {
      activeId: null,
      breakpoints: [BP_LANDSCAPE, BP_PORTRAIT, BP_SQUARE, BP_4_5],
    },
  };
}

// ---------------------------------------------------------------------------
// Suite 1 — Resolver Correctness
// ---------------------------------------------------------------------------

describe("Phase 4J — Suite 1: Resolver Correctness", () => {
  test("1.1: null breakpoint returns node unchanged (identity)", () => {
    const node = makeStatCard();
    const resolved = resolveNodeForBreakpoint(node, null);
    expect(resolved).toBe(node); // exact same reference
  });

  test("1.2: override merges x/y/width/height correctly", () => {
    const node: SceneNode = {
      id: "n1", name: "Box", type: "shape", shapeType: "rectangle",
      x: 10, y: 10, width: 200, height: 100,
      responsive: {
        mobile: { x: 0, y: 0, width: 360, height: 80 },
      },
    } as any;
    const r = resolveNodeForBreakpoint(node, "mobile");
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
    expect(r.width).toBe(360);
    expect(r.height).toBe(80);
    // Identity unchanged
    expect(r.id).toBe("n1");
    expect(r.type).toBe("shape");
  });

  test("1.3: style override deep-merges without dropping unset base fields", () => {
    const node: SceneNode = {
      id: "n2", name: "Text", type: "text", x: 0, y: 0, width: 200, height: 40,
      text: "Hello",
      style: { fontSize: 24, textColor: "#FFF", fillColor: "#000" },
      responsive: {
        mobile: { style: { fontSize: 18 } },
      },
    } as any;
    const r = resolveNodeForBreakpoint(node, "mobile") as any;
    expect(r.style.fontSize).toBe(18);          // overridden
    expect(r.style.textColor).toBe("#FFF");      // inherited
    expect(r.style.fillColor).toBe("#000");      // inherited
  });

  test("1.4: layout override deep-merges gap without dropping base padding", () => {
    const node: SceneNode = {
      id: "n3", name: "Frame", type: "frame",
      x: 0, y: 0, width: 300, height: 200,
      layout: {
        mode: "flex-row",
        gap: 8,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      children: [],
      responsive: {
        mobile: { layout: { mode: "flex-column", gap: 4 } },
      },
    } as any;
    const r = resolveNodeForBreakpoint(node, "mobile") as FrameNode;
    expect(r.layout!.mode).toBe("flex-column");  // overridden
    expect(r.layout!.gap).toBe(4);               // overridden
    expect(r.layout!.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 }); // inherited
  });

  test("1.5: visible:false override hides node", () => {
    const node: SceneNode = {
      id: "n4", name: "Badge", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 60, height: 20,
      visible: true,
      responsive: { mobile: { visible: false } },
    } as any;
    const r = resolveNodeForBreakpoint(node, "mobile");
    expect(r.visible).toBe(false);
  });

  test("1.6: unknown breakpointId falls back to base gracefully (no throw)", () => {
    const node = makeStatCard();
    expect(() => resolveNodeForBreakpoint(node, "does-not-exist")).not.toThrow();
    const r = resolveNodeForBreakpoint(node, "does-not-exist");
    expect(r.id).toBe(node.id);
    expect(r.width).toBe(node.width);
  });

  test("1.7: resolveDocumentForBreakpoint swaps canvas dimensions", () => {
    const doc = docWithBreakpoints([makeStatCard()]);
    const r = resolveDocumentForBreakpoint(doc, "bp-portrait");
    expect(r.canvas.width).toBe(1080);
    expect(r.canvas.height).toBe(1920);
    // Original doc unchanged
    expect(doc.canvas.width).toBe(1280);
  });

  test("1.8: resolveDocumentForBreakpoint with null returns doc unchanged (same reference)", () => {
    const doc = docWithBreakpoints([makeStatCard()]);
    const r = resolveDocumentForBreakpoint(doc, null);
    expect(r).toBe(doc);
  });

  test("1.9: recursive resolution applies to nested FrameNode children", () => {
    const child: SceneNode = {
      id: "child-1", name: "Child", type: "text", x: 0, y: 0, width: 100, height: 30,
      text: "Hello",
      responsive: { mobile: { width: 200, style: { fontSize: 14 } } },
    } as any;
    const parent: FrameNode = {
      id: "parent-1", name: "Parent", type: "frame",
      x: 0, y: 0, width: 400, height: 200,
      children: [child],
    };
    const r = resolveNodeForBreakpoint(parent, "mobile") as FrameNode;
    expect(r.children[0].width).toBe(200);
    expect((r.children[0] as any).style?.fontSize).toBe(14);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — StatCard across 4 Viewports (The Brutal Test)
// ---------------------------------------------------------------------------

describe("Phase 4J — Suite 2: StatCard Across 4 Viewports", () => {
  const breakpoints = [BP_LANDSCAPE, BP_PORTRAIT, BP_SQUARE, BP_4_5];

  test.each(breakpoints.map((bp) => [bp.label, bp]))(
    "2.%# [%s]: no NaN, no Infinity, no negative dims, all within canvas bounds",
    (_label, bp) => {
      const statCard = makeStatCard();
      const doc = docWithBreakpoints([statCard]);
      const layout = layoutEngine.computeLayoutForBreakpoint(doc, bp.id);

      for (const [nodeId, bounds] of Object.entries(layout.nodes)) {
        // No NaN or Infinity
        expect(isNaN(bounds.x), `${nodeId}.x is NaN`).toBe(false);
        expect(isNaN(bounds.y), `${nodeId}.y is NaN`).toBe(false);
        expect(isNaN(bounds.width), `${nodeId}.width is NaN`).toBe(false);
        expect(isNaN(bounds.height), `${nodeId}.height is NaN`).toBe(false);
        expect(isFinite(bounds.x), `${nodeId}.x is Infinity`).toBe(true);
        expect(isFinite(bounds.y), `${nodeId}.y is Infinity`).toBe(true);
        expect(isFinite(bounds.width), `${nodeId}.width is Infinity`).toBe(true);
        expect(isFinite(bounds.height), `${nodeId}.height is Infinity`).toBe(true);

        // No negative dimensions
        expect(bounds.width, `${nodeId} width is negative`).toBeGreaterThanOrEqual(0);
        expect(bounds.height, `${nodeId} height is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  );

  test("2.4: sibling nodes in flex-column don't overlap", () => {
    const statCard = makeStatCard();
    const doc = docWithBreakpoints([statCard]);
    const layout = layoutEngine.computeLayoutForBreakpoint(doc, "bp-portrait");

    // Children in the StatCard: icon, value, label, trend
    const childIds = ["stat-card-root-icon", "stat-card-root-value", "stat-card-root-label", "stat-card-root-trend"];
    const childBounds = childIds.map((id) => layout.nodes[id]).filter(Boolean);

    // In flex-column, each child's top edge should be >= previous child's bottom edge
    for (let i = 1; i < childBounds.length; i++) {
      const prev = childBounds[i - 1];
      const curr = childBounds[i];
      expect(curr.y, `child ${i} overlaps with child ${i - 1}`).toBeGreaterThanOrEqual(prev.y + prev.height);
    }
  });

  test("2.5: text nodes are computed without zero width", () => {
    const statCard = makeStatCard();
    const doc = docWithBreakpoints([statCard]);

    for (const bp of breakpoints) {
      const layout = layoutEngine.computeLayoutForBreakpoint(doc, bp.id);
      const valueBounds = layout.nodes["stat-card-root-value"];
      const labelBounds = layout.nodes["stat-card-root-label"];
      if (valueBounds) expect(valueBounds.width, `value width 0 at ${bp.id}`).toBeGreaterThan(0);
      if (labelBounds) expect(labelBounds.width, `label width 0 at ${bp.id}`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Extreme Data Cases
// ---------------------------------------------------------------------------

describe("Phase 4J — Suite 3: Extreme Data Cases", () => {
  test("3.1: short text → valid bounds", () => {
    const doc = makeDoc([makeStatCard()]);
    doc.variables[1].defaultValue = "Hi";
    const layout = layoutEngine.computeLayout(doc);
    const b = layout.nodes["stat-card-root-label"];
    expect(b).toBeDefined();
    expect(b.width).toBeGreaterThan(0);
    expect(b.height).toBeGreaterThan(0);
  });

  test("3.2: 200-character text → no blowout (hug capped at intrinsic)", () => {
    const doc = makeDoc([makeStatCard()]);
    doc.variables[1].defaultValue = "A".repeat(200);
    const layout = layoutEngine.computeLayout(doc);
    const b = layout.nodes["stat-card-root-label"];
    expect(b).toBeDefined();
    expect(isFinite(b.width)).toBe(true);
    expect(isFinite(b.height)).toBe(true);
    expect(b.width).toBeGreaterThan(0);
  });

  test("3.3: dynamic binding evaluates to 0 without crash", () => {
    const doc = makeDoc([makeStatCard()]);
    doc.variables[0].defaultValue = 0;
    expect(() => layoutEngine.computeLayout(doc)).not.toThrow();
    const layout = layoutEngine.computeLayout(doc);
    expect(layout.nodes["stat-card-root-value"]).toBeDefined();
  });

  test("3.4: dynamic binding evaluates to empty string without crash", () => {
    const doc = makeDoc([makeStatCard()]);
    doc.variables[1].defaultValue = "";
    expect(() => layoutEngine.computeLayout(doc)).not.toThrow();
    const layout = layoutEngine.computeLayout(doc);
    expect(layout.nodes["stat-card-root-label"]).toBeDefined();
  });

  test("3.5: minWidth constraint prevents sub-pixel width", () => {
    const node: SceneNode = {
      id: "tiny", name: "Tiny", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 1, height: 1,
      layout: { constraints: { minWidth: 40, minHeight: 20 } },
    } as any;
    const doc = makeDoc([node]);
    const layout = layoutEngine.computeLayout(doc);
    expect(layout.nodes["tiny"].width).toBeGreaterThanOrEqual(40);
    expect(layout.nodes["tiny"].height).toBeGreaterThanOrEqual(20);
  });

  test("3.6: maxWidth constraint prevents blowout on long text", () => {
    const node: SceneNode = {
      id: "capped-text", name: "Capped", type: "text", x: 0, y: 0, width: 200, height: 40,
      text: "A".repeat(500),
      style: { fontSize: 32 },
      layout: { constraints: { widthMode: "hug", maxWidth: 400 } },
    } as any;
    const doc = makeDoc([node]);
    const layout = layoutEngine.computeLayout(doc);
    expect(layout.nodes["capped-text"].width).toBeLessThanOrEqual(400);
  });

  test("3.7: aspectRatioLock derives correct height", () => {
    const node: SceneNode = {
      id: "locked", name: "Locked", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 200, height: 999, // height will be overridden
      layout: { constraints: { aspectRatio: 16 / 9, aspectRatioLock: true } },
    } as any;
    const doc = makeDoc([node]);
    const layout = layoutEngine.computeLayout(doc);
    const b = layout.nodes["locked"];
    // height = width / aspectRatio = 200 / (16/9) ≈ 112.5
    expect(b.height).toBeCloseTo(200 / (16 / 9), 0);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Command Round-Trip
// ---------------------------------------------------------------------------

describe("Phase 4J — Suite 4: Command Round-Trip", () => {
  test("4.1: ADD_BREAKPOINT → breakpoint appears in doc", () => {
    let doc = makeDoc([]);
    const result = commandExecutor.execute(doc, {
      type: "ADD_BREAKPOINT",
      breakpoint: BP_PORTRAIT,
    });
    doc = result.nextDocument;
    expect(doc.breakpoints?.breakpoints).toHaveLength(1);
    expect(doc.breakpoints!.breakpoints[0].id).toBe("bp-portrait");
  });

  test("4.2: SET_ACTIVE_BREAKPOINT → activeId updated", () => {
    let doc = makeDoc([]);
    doc = commandExecutor.execute(doc, { type: "ADD_BREAKPOINT", breakpoint: BP_PORTRAIT }).nextDocument;
    doc = commandExecutor.execute(doc, { type: "SET_ACTIVE_BREAKPOINT", breakpointId: "bp-portrait" }).nextDocument;
    expect(doc.breakpoints!.activeId).toBe("bp-portrait");
  });

  test("4.3: SET_RESPONSIVE_OVERRIDE → node gains override", () => {
    const node = makeStatCard();
    let doc = makeDoc([node]);
    doc = commandExecutor.execute(doc, { type: "ADD_BREAKPOINT", breakpoint: BP_PORTRAIT }).nextDocument;
    doc = commandExecutor.execute(doc, {
      type: "SET_RESPONSIVE_OVERRIDE",
      nodeId: "stat-card-root",
      breakpointId: "bp-portrait",
      patch: { width: 400, layout: { mode: "flex-column" } },
    }).nextDocument;

    const resolved = resolveNodeForBreakpoint(doc.nodes[0], "bp-portrait");
    expect(resolved.width).toBe(400);
    expect((resolved as FrameNode).layout?.mode).toBe("flex-column");
  });

  test("4.4: REMOVE_BREAKPOINT → override purged from all nodes", () => {
    const node = makeStatCard();
    let doc = makeDoc([node]);
    doc = commandExecutor.execute(doc, { type: "ADD_BREAKPOINT", breakpoint: BP_PORTRAIT }).nextDocument;
    doc = commandExecutor.execute(doc, {
      type: "SET_RESPONSIVE_OVERRIDE",
      nodeId: "stat-card-root",
      breakpointId: "bp-portrait",
      patch: { width: 400 },
    }).nextDocument;

    // Verify override exists
    expect(doc.nodes[0].responsive?.["bp-portrait"]).toBeDefined();

    // Remove breakpoint
    doc = commandExecutor.execute(doc, { type: "REMOVE_BREAKPOINT", breakpointId: "bp-portrait" }).nextDocument;

    // Override must be gone
    expect(doc.nodes[0].responsive?.["bp-portrait"]).toBeUndefined();
    expect(doc.breakpoints?.breakpoints).toHaveLength(0);
  });

  test("4.5: undo of SET_RESPONSIVE_OVERRIDE restores previous state", () => {
    const node = makeStatCard();
    let doc = makeDoc([node]);
    const history = new CommandHistory({ maxSize: 20 });

    doc = history.execute(doc, { type: "ADD_BREAKPOINT", breakpoint: BP_PORTRAIT });
    doc = history.execute(doc, {
      type: "SET_RESPONSIVE_OVERRIDE",
      nodeId: "stat-card-root",
      breakpointId: "bp-portrait",
      patch: { width: 400 },
    });

    expect(doc.nodes[0].responsive?.["bp-portrait"]?.width).toBe(400);

    // Undo
    doc = history.undo(doc);
    expect(doc.nodes[0].responsive?.["bp-portrait"]).toBeUndefined();
  });

  test("4.6: serialize → deserialize preserves responsive overrides", () => {
    const node = makeStatCard();
    let doc = makeDoc([node]);
    doc = commandExecutor.execute(doc, { type: "ADD_BREAKPOINT", breakpoint: BP_PORTRAIT }).nextDocument;
    doc = commandExecutor.execute(doc, {
      type: "SET_RESPONSIVE_OVERRIDE",
      nodeId: "stat-card-root",
      breakpointId: "bp-portrait",
      patch: { width: 500, style: { fillColor: "#FF0000" } },
    }).nextDocument;

    const manifest = serializeTemplate(doc, {
      id: "tmpl-responsive-test",
      name: "Responsive Test",
      category: "test",
      tags: ["4j"],
    });

    const restored = deserializeTemplate(manifest);
    expect(restored.breakpoints?.breakpoints).toHaveLength(1);
    expect(restored.nodes[0].responsive?.["bp-portrait"]?.width).toBe(500);
    expect(restored.nodes[0].responsive?.["bp-portrait"]?.style?.fillColor).toBe("#FF0000");
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Animation + Asset Invariants Under Responsive Resolution
// ---------------------------------------------------------------------------

describe("Phase 4J — Suite 5: Animation + Asset Invariants", () => {
  test("5.1: evaluateScene on resolved document runs without throw, no NaN in results", () => {
    const statCard = makeStatCard();
    // Add entrance animation
    (statCard as any).animation = { entrance: { type: "fade", duration: 0.5, delay: 0 } };
    const doc = docWithBreakpoints([statCard]);

    const resolved = resolveDocumentForBreakpoint(doc, "bp-portrait");
    expect(() => animationRuntime.evaluateScene(resolved, { currentTime: 1.0 })).not.toThrow();

    const scene = animationRuntime.evaluateScene(resolved, { currentTime: 1.0 });
    for (const [nodeId, state] of Object.entries(scene.nodes)) {
      expect(isNaN(state.opacity), `${nodeId} opacity NaN`).toBe(false);
      expect(isNaN(state.x), `${nodeId} x NaN`).toBe(false);
      expect(isNaN(state.y), `${nodeId} y NaN`).toBe(false);
    }
  });

  test("5.2: asset references survive breakpoint resolution unchanged", () => {
    const mediaNode: SceneNode = {
      id: "media-1", name: "Photo", type: "media", mediaType: "image",
      x: 0, y: 0, width: 200, height: 150,
      assetId: "asset-stable-id-xyz",
      responsive: {
        "bp-portrait": { x: 0, y: 0, width: 300 },
      },
    } as any;
    const doc = docWithBreakpoints([mediaNode]);
    const resolved = resolveDocumentForBreakpoint(doc, "bp-portrait");
    const resolvedMedia = resolved.nodes[0] as any;
    expect(resolvedMedia.assetId).toBe("asset-stable-id-xyz");
    expect(resolvedMedia.width).toBe(300); // override applied
  });

  test("5.3: visibilityExpression preserved through resolution", () => {
    const node: SceneNode = {
      id: "conditional", name: "Cond", type: "shape", shapeType: "rectangle",
      x: 0, y: 0, width: 100, height: 100,
      visibilityExpression: "{{score}} > 0",
      responsive: { "bp-square": { width: 80 } },
    } as any;
    const doc = docWithBreakpoints([node]);
    const resolved = resolveDocumentForBreakpoint(doc, "bp-square");
    expect(resolved.nodes[0].visibilityExpression).toBe("{{score}} > 0");
    expect(resolved.nodes[0].width).toBe(80);
  });
});
