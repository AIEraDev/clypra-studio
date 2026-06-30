/**
 * Runtime Validation Suite Test Runner
 *
 * Executes the validation suite to prove the runtime works correctly.
 */

import { describe, it, expect } from "vitest";
import { RuntimeValidationSuite } from "../validation/runtime-suite";

describe("Runtime Validation Suite", () => {
  it("should pass all validation tests", async () => {
    const suite = new RuntimeValidationSuite();
    const result = await suite.runAll();

    // Print results
    console.log("\n═══════════════════════════════════════");
    console.log(`Total: ${result.total}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    console.log("═══════════════════════════════════════\n");

    // All tests must pass
    expect(result.failed).toBe(0);
    expect(result.passed).toBe(result.total);
  });

  it("should pass identity tests", async () => {
    const suite = new RuntimeValidationSuite();
    const result = await suite.runCategory("identity");

    expect(result.failed).toBe(0);
  });

  it("should pass uniform tests", async () => {
    const suite = new RuntimeValidationSuite();
    const result = await suite.runCategory("uniform");

    expect(result.failed).toBe(0);
  });

  it("should pass multipass tests", async () => {
    const suite = new RuntimeValidationSuite();
    const result = await suite.runCategory("multipass");

    expect(result.failed).toBe(0);
  });

  it("should pass resource tests", async () => {
    const suite = new RuntimeValidationSuite();
    const result = await suite.runCategory("resource");

    expect(result.failed).toBe(0);
  });
});
