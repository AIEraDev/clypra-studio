import { describe, it, expect } from "vitest";
import { CAPABILITY_REGISTRY, getCapabilityReport } from "../capabilityRegistry.js";

describe("Phase 4R.1 — Executable Capability Registry & Probe Suite", () => {
  it("registers capability entries for all 19 primitive node types", () => {
    expect(Object.keys(CAPABILITY_REGISTRY).length).toBe(19);
    expect(CAPABILITY_REGISTRY["shape-rectangle"]).toBeDefined();
    expect(CAPABILITY_REGISTRY["chart-bar"]).toBeDefined();
    expect(CAPABILITY_REGISTRY["gauge-meter"]).toBeDefined();
  });

  it("executes capability probes dynamically for registered visual primitives", () => {
    for (const [id, capability] of Object.entries(CAPABILITY_REGISTRY)) {
      if (capability.testProbe) {
        const passed = capability.testProbe();
        expect(passed, `Capability probe failed for ${id}`).toBe(true);
      }
    }
  });

  it("computes capability report reflecting honest desktop missing status across all 19 primitives", () => {
    const report = getCapabilityReport();
    expect(report.total).toBe(19);
    // Verified honest status: desktop IPC deserializer for ConformanceNode is currently missing in Rust
    expect(report.missingDesktop).toBe(19);
  });
});
