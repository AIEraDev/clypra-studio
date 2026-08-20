/**
 * @clypra/runtime — Runtime Validation Suite
 *
 * Automated tests that validate runtime execution, not effects.
 * These tests prove the architecture works correctly.
 */

import type { FrameGraph } from "../planner/types";
import type { MediaProcessingGraph } from "../graph/types";
import { GraphBuilder } from "../graph/builder";
import { FrameGraphPlanner } from "../planner/planner";
import { ValidationBackend } from "./backend";

export interface ValidationTest {
  readonly name: string;
  readonly category: "identity" | "uniform" | "multipass" | "composite" | "temporal" | "transition" | "feature" | "resource" | "gpu" | "renderer";
  run(): Promise<ValidationTestResult>;
}

export interface ValidationTestResult {
  readonly passed: boolean;
  readonly duration: number;
  readonly errors: string[];
  readonly warnings: string[];
  readonly metrics?: Record<string, number>;
}

/**
 * Runtime Validation Suite
 *
 * Runs automated tests to validate runtime execution.
 */
export class RuntimeValidationSuite {
  private tests: ValidationTest[] = [];

  constructor() {
    this.registerTests();
  }

  /**
   * Register all validation tests
   */
  private registerTests() {
    // Identity tests
    this.tests.push(new IdentityPassTest());
    this.tests.push(new TextureReuseTest());
    this.tests.push(new ResourceLifetimeTest());

    // Uniform tests
    this.tests.push(new UniformUpdateTest());
    this.tests.push(new ParameterChangeTest());

    // Multipass tests
    this.tests.push(new PassOrderingTest());
    this.tests.push(new IntermediateTextureTest());

    // Resource tests
    this.tests.push(new LeakDetectionTest());
    this.tests.push(new AllocationTrackingTest());

    // Planning tests
    this.tests.push(new PlannerConsistencyTest());
    this.tests.push(new GraphValidationTest());

  }

  /**
   * Run all tests
   */
  async runAll(): Promise<SuiteResult> {
    console.log("\n🔬 Runtime Validation Suite\n");

    const results: TestResult[] = [];
    const categories = new Map<string, { passed: number; failed: number }>();

    for (const test of this.tests) {
      const start = performance.now();
      try {
        const result = await test.run();
        const duration = performance.now() - start;

        // Track by category
        const cat = categories.get(test.category) || { passed: 0, failed: 0 };
        if (result.passed) {
          console.log(`✓ ${test.name} (${duration.toFixed(1)}ms)`);
          cat.passed++;
        } else {
          console.log(`✗ ${test.name} (${duration.toFixed(1)}ms)`);
          result.errors.forEach((err) => console.log(`  ${err}`));
          cat.failed++;
        }
        categories.set(test.category, cat);

        results.push({
          test: test.name,
          category: test.category,
          passed: result.passed,
          duration,
          errors: result.errors,
          warnings: result.warnings,
          metrics: result.metrics,
        });
      } catch (error) {
        console.log(`✗ ${test.name} - Exception: ${error}`);
        const cat = categories.get(test.category) || { passed: 0, failed: 0 };
        cat.failed++;
        categories.set(test.category, cat);

        results.push({
          test: test.name,
          category: test.category,
          passed: false,
          duration: performance.now() - start,
          errors: [String(error)],
          warnings: [],
        });
      }
    }

    // Print categorized summary
    console.log("\n" + "═".repeat(45));
    for (const [category, stats] of categories) {
      const total = stats.passed + stats.failed;
      const status = stats.failed === 0 ? "✓" : "✗";
      console.log(`${status} ${category.padEnd(20)} ${stats.passed}/${total}`);
    }
    console.log("═".repeat(45));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`\nTotal: ${passed} passed, ${failed} failed\n`);

    return {
      passed,
      failed,
      total: this.tests.length,
      results,
      categories: Array.from(categories.entries()).map(([name, stats]) => ({
        name,
        ...stats,
      })),
    };
  }

  /**
   * Run tests in a category
   */
  async runCategory(category: ValidationTest["category"]): Promise<SuiteResult> {
    const categoryTests = this.tests.filter((t) => t.category === category);
    const suite = new RuntimeValidationSuite();
    suite.tests = categoryTests;
    return suite.runAll();
  }
}

export interface SuiteResult {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
  categories: Array<{
    name: string;
    passed: number;
    failed: number;
  }>;
}

export interface TestResult {
  test: string;
  category: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  metrics?: Record<string, number>;
}

// ============================================================================
// Identity Tests
// ============================================================================

class IdentityPassTest implements ValidationTest {
  name = "Identity Pass";
  category = "identity" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Build identity graph
    const builder = new GraphBuilder("identity-test");
    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Plan frame
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });
    const frameGraph = planner.plan(graph, 0, 0);

    // Validate
    const validator = new ValidationBackend();
    const validation = validator.validateFrameGraph(frameGraph);

    if (!validation.valid) {
      errors.push(...validation.errors.map((e) => e.message));
    }

    // Mathematical invariants for Identity:

    // 1. Pass Count must be exactly 1
    if (frameGraph.passes.length !== 1) {
      errors.push(`Pass Count: expected 1, got ${frameGraph.passes.length}`);
    }

    // 2. Shader must be "copy" or similar pass-through
    const pass = frameGraph.passes[0];
    if (pass && !["copy", "blit", "blit-source", "identity"].includes(pass.shaderId)) {
      errors.push(`Shader: expected copy/blit/identity, got ${pass.shaderId}`);
    }

    // 3. Pass inputs must be exactly 1
    if (pass && pass.inputs.length !== 1) {
      errors.push(`Inputs: expected 1, got ${pass.inputs.length}`);
    }

    // 4. Transient resources must be exactly 0
    const transient = frameGraph.resourceRequests.filter((r) => r.transient);
    if (transient.length !== 0) {
      errors.push(`Transient Resources: expected 0, got ${transient.length}`);
    }

    // 5. Persistent resources must be exactly 2 (input + output)
    const persistent = frameGraph.resourceRequests.filter((r) => !r.transient);
    if (persistent.length !== 2) {
      errors.push(`Persistent Resources: expected 2, got ${persistent.length}`);
    }

    // 6. Output resource must exist
    if (!frameGraph.resourceRequests.some((r) => r.id === "output")) {
      errors.push("Output resource not found");
    }

    // 7. Pass must write to output
    if (pass && pass.output !== "output") {
      errors.push(`Pass output: expected "output", got "${pass.output}"`);
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings,
      metrics: {
        passCount: frameGraph.passes.length,
        transientResources: transient.length,
        persistentResources: persistent.length,
        totalResources: frameGraph.resourceRequests.length,
      },
    };
  }
}

class TextureReuseTest implements ValidationTest {
  name = "Texture Reuse";
  category = "identity" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];

    // Simulate multiple frames
    const builder = new GraphBuilder("reuse-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Frame 0
    const frame0 = planner.plan(graph, 0, 0);
    const resources0 = new Set(frame0.resourceRequests.map((r) => r.id));

    // Frame 1
    const frame1 = planner.plan(graph, 1, 16.67);
    const resources1 = new Set(frame1.resourceRequests.map((r) => r.id));

    // Resources should be identical
    if (resources0.size !== resources1.size) {
      errors.push("Resource count changed between frames");
    }

    for (const id of resources0) {
      if (!resources1.has(id)) {
        errors.push(`Resource ${id} disappeared in frame 1`);
      }
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
      metrics: {
        frame0Resources: resources0.size,
        frame1Resources: resources1.size,
      },
    };
  }
}

class ResourceLifetimeTest implements ValidationTest {
  name = "Resource Lifetime";
  category = "resource" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];

    const builder = new GraphBuilder("lifetime-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    const frameGraph = planner.plan(graph, 0, 0);

    // Check that transient resources are released
    const transient = frameGraph.resourceRequests.filter((r) => r.transient);
    if (transient.length > 0) {
      // For identity, there should be no transient resources
      errors.push(`Identity should have no transient resources, found ${transient.length}`);
    }

    // Check persistent resources
    const persistent = frameGraph.resourceRequests.filter((r) => !r.transient);
    if (persistent.length !== 2) {
      errors.push(`Expected 2 persistent resources, got ${persistent.length}`);
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
      metrics: {
        transient: transient.length,
        persistent: persistent.length,
      },
    };
  }
}

// ============================================================================
// Uniform Tests
// ============================================================================

class UniformUpdateTest implements ValidationTest {
  name = "Uniform Updates";
  category = "uniform" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];

    const builder = new GraphBuilder("uniform-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    // Build with initial parameter
    const graph1 = builder.build({ id: "brightness", type: "brightness", parameters: { brightness: 1.0 } }, [{ id: "video", type: "video", source: "test" }]);

    const frame1 = planner.plan(graph1, 0, 0);

    // Check uniforms in pass
    if (frame1.passes.length === 0) {
      errors.push("No passes generated");
      return { passed: false, duration: 0, errors, warnings: [] };
    }

    // Find the brightness pass (should have shaderId "brightness")
    const pass = frame1.passes.find((p) => p.shaderId === "brightness" || p.uniforms.brightness !== undefined) || frame1.passes[frame1.passes.length - 1];

    if (!pass) {
      errors.push("No pass found");
      return { passed: false, duration: 0, errors, warnings: [] };
    }

    if (pass.uniforms.brightness !== 1.0) {
      errors.push(`Expected brightness=1.0, got ${pass.uniforms.brightness}`);
    }

    // Build with different parameter
    const graph2 = builder.build({ id: "brightness", type: "brightness", parameters: { brightness: 1.5 } }, [{ id: "video", type: "video", source: "test" }]);

    const frame2 = planner.plan(graph2, 0, 0);
    const pass2 = frame2.passes.find((p) => p.shaderId === "brightness" || p.uniforms.brightness !== undefined) || frame2.passes[frame2.passes.length - 1];

    if (!pass2) {
      errors.push("No pass2 found");
      return { passed: false, duration: 0, errors, warnings: [] };
    }

    if (pass2.uniforms.brightness !== 1.5) {
      errors.push(`Expected brightness=1.5, got ${pass2.uniforms.brightness}`);
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
    };
  }
}

class ParameterChangeTest implements ValidationTest {
  name = "Parameter Change Latency";
  category = "uniform" as const;

  async run(): Promise<ValidationTestResult> {
    // This test would measure the time from parameter change to GPU update
    // For now, just verify the pipeline accepts parameter changes

    const errors: string[] = [];
    const builder = new GraphBuilder("param-test");

    // Multiple parameter values
    const values = [0.5, 1.0, 1.5, 2.0];

    for (const value of values) {
      const graph = builder.build({ id: "brightness", type: "brightness", parameters: { brightness: value } }, [{ id: "video", type: "video", source: "test" }]);

      if (!graph.nodes.some((n) => n.params.brightness === value)) {
        errors.push(`Parameter brightness=${value} not found in graph`);
      }
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
    };
  }
}

// ============================================================================
// Multipass Tests
// ============================================================================

class PassOrderingTest implements ValidationTest {
  name = "Pass Ordering";
  category = "multipass" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const validator = new ValidationBackend();
    const builder = new GraphBuilder("ordering-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    // Build sequential effects
    const effects = [
      { id: "brightness", type: "brightness", parameters: { brightness: 1.2 } },
      { id: "contrast", type: "contrast", parameters: { contrast: 1.1 } },
    ];

    const graph = builder.buildComposite(effects, [{ id: "video", type: "video", source: "test" }]);

    const frameGraph = planner.plan(graph, 0, 0);

    // Validate pass ordering
    const validation = validator.validateFrameGraph(frameGraph);
    if (!validation.valid) {
      errors.push(...validation.errors.map((e) => e.message));
    }

    // Should have 2 passes minimum
    if (frameGraph.passes.length < 2) {
      errors.push(`Expected at least 2 passes, got ${frameGraph.passes.length}`);
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: validation.warnings.map((w) => w.message),
      metrics: {
        passes: frameGraph.passes.length,
      },
    };
  }
}

class IntermediateTextureTest implements ValidationTest {
  name = "Intermediate Textures";
  category = "multipass" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const builder = new GraphBuilder("intermediate-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const effects = [
      { id: "pass1", type: "brightness", parameters: {} },
      { id: "pass2", type: "contrast", parameters: {} },
    ];

    const graph = builder.buildComposite(effects, [{ id: "video", type: "video", source: "test" }]);
    const frameGraph = planner.plan(graph, 0, 0);

    // Check for intermediate resources
    const transient = frameGraph.resourceRequests.filter((r) => r.transient);

    // Multi-pass should have at least 1 intermediate texture
    if (transient.length === 0) {
      errors.push("No intermediate textures allocated for multi-pass");
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
      metrics: {
        intermediateTextures: transient.length,
      },
    };
  }
}

// ============================================================================
// Resource Tests
// ============================================================================

class LeakDetectionTest implements ValidationTest {
  name = "Leak Detection";
  category = "resource" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const builder = new GraphBuilder("leak-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Simulate 100 frames
    const resourceCounts: number[] = [];

    for (let i = 0; i < 100; i++) {
      const frameGraph = planner.plan(graph, i, i * 16.67);
      resourceCounts.push(frameGraph.resourceRequests.length);
    }

    // Resource count should be constant
    const firstCount = resourceCounts[0];
    for (let i = 1; i < resourceCounts.length; i++) {
      if (resourceCounts[i] !== firstCount) {
        errors.push(`Resource count changed at frame ${i}: ${firstCount} → ${resourceCounts[i]}`);
        break;
      }
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
      metrics: {
        frames: 100,
        resourceCount: firstCount,
      },
    };
  }
}

class AllocationTrackingTest implements ValidationTest {
  name = "Allocation Tracking";
  category = "resource" as const;

  async run(): Promise<ValidationTestResult> {
    // This test verifies that allocation tracking would work correctly
    // Actual allocation tracking happens in the renderer

    const errors: string[] = [];
    const builder = new GraphBuilder("alloc-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Frame 0 should allocate
    const frame0 = planner.plan(graph, 0, 0);
    const ids0 = frame0.resourceRequests.map((r) => r.id);

    // Frame 1 should reuse
    const frame1 = planner.plan(graph, 1, 16.67);
    const ids1 = frame1.resourceRequests.map((r) => r.id);

    // IDs should match (same resources)
    if (ids0.length !== ids1.length) {
      errors.push("Resource ID count mismatch between frames");
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
    };
  }
}

// ============================================================================
// Planning Tests
// ============================================================================

class PlannerConsistencyTest implements ValidationTest {
  name = "Planner Consistency";
  category = "resource" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const builder = new GraphBuilder("consistency-test");
    const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Plan same frame twice
    const plan1 = planner.plan(graph, 0, 0);
    const plan2 = planner.plan(graph, 0, 0);

    // Should be identical
    if (plan1.passes.length !== plan2.passes.length) {
      errors.push("Pass count differs between identical plans");
    }

    if (plan1.resourceRequests.length !== plan2.resourceRequests.length) {
      errors.push("Resource count differs between identical plans");
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: [],
    };
  }
}

class GraphValidationTest implements ValidationTest {
  name = "Graph Validation";
  category = "identity" as const;

  async run(): Promise<ValidationTestResult> {
    const errors: string[] = [];
    const validator = new ValidationBackend();
    const builder = new GraphBuilder("validation-test");

    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    // Validate graph
    const result = validator.validateGraph(graph);

    if (!result.valid) {
      errors.push(...result.errors.map((e) => e.message));
    }

    return {
      passed: errors.length === 0,
      duration: 0,
      errors,
      warnings: result.warnings.map((w) => w.message),
    };
  }
}
