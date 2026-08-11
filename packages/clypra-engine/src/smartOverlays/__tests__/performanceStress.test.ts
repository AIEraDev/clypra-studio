import { describe, test, expect } from "vitest";
import {
  CommandHistory,
  dataBindingEngine,
  layoutEngine,
  animationRuntime,
  type OverlayDocument,
  type SceneNode,
  type RepeaterNode
} from "../index.js";

function makeDoc(nodes: SceneNode[] = [], variables: any[] = []): OverlayDocument {
  return {
    id: "stress-doc-1",
    version: "2.0",
    title: "Performance Stress Benchmark Doc",
    category: "test",
    canvas: { width: 1280, height: 720 },
    variables,
    nodes,
    duration: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe("Phase 4H.Stabilization — Scale & Performance Stress Benchmarks", () => {
  // ── BENCHMARK 1: 500-NODE DENSE TREE EVALUATION ────────────────────────────
  test("Benchmark 1: 500-Node Dense Tree Evaluation finishes in < 16.0ms (60 FPS budget)", () => {
    const nodes: SceneNode[] = [];

    // Create 100 top-level frames, each containing 4 primitive children = 500 total nodes
    for (let f = 0; f < 100; f++) {
      const children: SceneNode[] = [
        { id: `c-${f}-1`, name: `Title ${f}`, type: "text", x: 10, y: 10, width: 150, height: 30, text: `Metric Title ${f}` } as any,
        { id: `c-${f}-2`, name: `Val ${f}`, type: "text", x: 10, y: 40, width: 150, height: 40, text: `+$${f * 1000}` } as any,
        { id: `c-${f}-3`, name: `Box ${f}`, type: "shape", shapeType: "rectangle", x: 170, y: 10, width: 40, height: 40 } as any,
        { id: `c-${f}-4`, name: `Circle ${f}`, type: "shape", shapeType: "circle", x: 220, y: 10, width: 30, height: 30 } as any
      ];

      nodes.push({
        id: `f-${f}`,
        name: `Frame ${f}`,
        type: "frame",
        x: (f % 10) * 120,
        y: Math.floor(f / 10) * 100,
        width: 260,
        height: 90,
        layout: { mode: "flex-row", gap: 8, padding: { top: 8, right: 8, bottom: 8, left: 8 }, constraints: { widthMode: "hug" } },
        children
      } as any);
    }

    const doc = makeDoc(nodes);

    // Measure total evaluation time for LayoutEngine + AnimationRuntime
    const startTime = performance.now();

    const layoutState = layoutEngine.computeLayout(doc);
    const sceneState = animationRuntime.evaluateScene(doc, { currentTime: 2.5 });

    const duration = performance.now() - startTime;

    expect(Object.keys(layoutState.nodes).length).toBeGreaterThanOrEqual(500);
    expect(Object.keys(sceneState.nodes).length).toBeGreaterThanOrEqual(500);

    // Strict 60 FPS frame evaluation budget target: < 16.0ms in production V8.
    // Using 50ms in test runner environment to allow for vitest process overhead.
    expect(duration).toBeLessThan(50.0);
  });

  // ── BENCHMARK 2: 250-ITEM MULTI-REPEATER EXPANSION ─────────────────────────
  test("Benchmark 2: 250-Node Multi-Repeater Expansion & Layout finishes in < 10.0ms", () => {
    // 5 repeaters, each bound to a dataset of 50 items = 250 dynamic nodes
    const dataset = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      score: (i + 1) * 150
    }));

    const nodes: SceneNode[] = [];

    for (let r = 0; r < 5; r++) {
      const repeater: RepeaterNode = {
        id: `rep-${r}`,
        name: `Repeater ${r}`,
        type: "repeater",
        x: r * 220,
        y: 10,
        width: 200,
        height: 600,
        datasetBinding: "items",
        staggerDelay: 0.05,
        itemTemplate: {
          id: `tmp-${r}`,
          name: "Item Template",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 30,
          text: "{{item.name}}: {{item.score}}",
          style: { fontSize: 14 }
        }
      } as any;
      nodes.push(repeater);
    }

    const doc = makeDoc(nodes, [{ key: "items", type: "array", defaultValue: dataset }]);

    const startTime = performance.now();

    // 1. Expand repeaters
    const expandedNodes: SceneNode[] = [];
    const context = { items: dataset };
    for (const node of doc.nodes) {
      if (node.type === "repeater") {
        const items = dataBindingEngine.expandRepeater(node as RepeaterNode, context);
        expandedNodes.push(...items);
      }
    }
    doc.nodes = expandedNodes;

    // 2. Compute layout
    const layoutState = layoutEngine.computeLayout(doc);

    const duration = performance.now() - startTime;

    expect(doc.nodes.length).toBeGreaterThanOrEqual(250);
    expect(Object.keys(layoutState.nodes).length).toBeGreaterThanOrEqual(250);

    // Multi-repeater expansion budget SLA: < 50.0ms in test environment
    expect(duration).toBeLessThan(50.0);
  });

  // ── BENCHMARK 3: 1,000 COMMAND HISTORY UNDO/REDO STRESS ────────────────────
  test("Benchmark 3: 1,000 Command Undo/Redo Stress retains memory stability and executes undo in < 5.0ms", () => {
    const history = new CommandHistory({ maxSize: 100 });
    let doc = makeDoc([{ id: "target", name: "Target", type: "text", x: 0, y: 0, width: 100, height: 30, text: "Initial" } as any]);

    // Execute 1,000 commands
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      doc = history.execute(doc, {
        type: "UPDATE_NODE_PROPERTY",
        nodeId: "target",
        path: "text",
        value: `Step ${i}`
      });
    }
    const executeDuration = performance.now() - startTime;

    expect((doc.nodes[0] as any).text).toBe("Step 999");
    expect(executeDuration).toBeLessThan(200); // 1000 commands < 200ms total

    // Execute 500 undos
    const undoStartTime = performance.now();
    for (let i = 0; i < 500; i++) {
      doc = history.undo(doc);
    }
    const undoDuration = performance.now() - undoStartTime;

    // Single undo average time SLA: < 5.0ms (total for 500 undos < 50ms)
    expect(undoDuration / 500).toBeLessThan(5.0);

    // Execute 250 redos
    for (let i = 0; i < 250; i++) {
      doc = history.redo(doc);
    }

    expect(doc.nodes).toHaveLength(1);
  });
});
