/**
 * @clypra/runtime — Resource Validator
 *
 * Validates resource bindings and availability.
 */

import type { ResourceValidationResult, ValidationIssue } from "./types";
import type { FrameGraph, RenderPass } from "../planner/types";

/**
 * Resource Validator
 *
 * Validates that all required resources are properly bound.
 */
export class ResourceValidator {
  /**
   * Validate a frame graph's resources
   */
  validate(frameGraph: FrameGraph): ResourceValidationResult {
    const issues: ValidationIssue[] = [];
    const boundResources = new Set<string>();
    const missingResources: string[] = [];

    // Collect all allocated resources
    for (const resource of frameGraph.resourceRequests) {
      boundResources.add(resource.id);
    }

    // Check each pass
    for (const pass of frameGraph.passes) {
      this.validatePass(pass, boundResources, issues, missingResources);
    }

    return {
      valid: issues.filter((i) => i.type === "error").length === 0,
      issues,
      boundResources: Array.from(boundResources),
      missingResources: Array.from(new Set(missingResources)),
    };
  }

  /**
   * Validate a single render pass
   */
  private validatePass(pass: RenderPass, boundResources: Set<string>, issues: ValidationIssue[], missingResources: string[]): void {
    // Check input resources
    for (const input of pass.inputs) {
      if (!boundResources.has(input)) {
        issues.push({
          type: "error",
          category: "resource",
          message: `Pass "${pass.id}" references missing input resource: ${input}`,
          details: { passId: pass.id, resourceId: input },
        });
        missingResources.push(input);
      }
    }

    // Check output resource
    if (!boundResources.has(pass.output)) {
      issues.push({
        type: "error",
        category: "resource",
        message: `Pass "${pass.id}" references missing output resource: ${pass.output}`,
        details: { passId: pass.id, resourceId: pass.output },
      });
      missingResources.push(pass.output);
    }

    // Validate uniforms
    this.validateUniforms(pass, issues);

    // Check for common issues
    this.checkPassConfiguration(pass, issues);
  }

  /**
   * Validate uniforms
   */
  private validateUniforms(pass: RenderPass, issues: ValidationIssue[]): void {
    const uniforms = pass.uniforms;

    // Check for undefined uniforms
    for (const [key, value] of Object.entries(uniforms)) {
      if (value === undefined || value === null) {
        issues.push({
          type: "warning",
          category: "resource",
          message: `Pass "${pass.id}" has undefined uniform: ${key}`,
          details: { passId: pass.id, uniformName: key },
        });
      }

      // Check for NaN values
      if (typeof value === "number" && isNaN(value)) {
        issues.push({
          type: "error",
          category: "resource",
          message: `Pass "${pass.id}" has NaN uniform value: ${key}`,
          details: { passId: pass.id, uniformName: key },
        });
      }
    }
  }

  /**
   * Check pass configuration
   */
  private checkPassConfiguration(pass: RenderPass, issues: ValidationIssue[]): void {
    // Warn about passes with no inputs
    if (pass.inputs.length === 0 && pass.shaderId !== "copy" && pass.shaderId !== "blit") {
      issues.push({
        type: "warning",
        category: "resource",
        message: `Pass "${pass.id}" has no input resources`,
        details: { passId: pass.id },
      });
    }

    // Warn about empty shader ID
    if (!pass.shaderId || pass.shaderId.trim() === "") {
      issues.push({
        type: "error",
        category: "resource",
        message: `Pass "${pass.id}" has empty shader ID`,
        details: { passId: pass.id },
      });
    }
  }

  /**
   * Validate resource descriptors
   */
  validateDescriptors(descriptors: Array<{ id: string; width: number; height: number }>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const ids = new Set<string>();

    for (const descriptor of descriptors) {
      // Check for duplicate IDs
      if (ids.has(descriptor.id)) {
        issues.push({
          type: "error",
          category: "resource",
          message: `Duplicate resource ID: ${descriptor.id}`,
          details: { resourceId: descriptor.id },
        });
      }
      ids.add(descriptor.id);

      // Check dimensions
      if (descriptor.width <= 0 || descriptor.height <= 0) {
        issues.push({
          type: "error",
          category: "resource",
          message: `Invalid resource dimensions for "${descriptor.id}": ${descriptor.width}x${descriptor.height}`,
          details: { resourceId: descriptor.id, width: descriptor.width, height: descriptor.height },
        });
      }

      // Warn about very large textures
      if (descriptor.width > 4096 || descriptor.height > 4096) {
        issues.push({
          type: "warning",
          category: "performance",
          message: `Large texture size for "${descriptor.id}": ${descriptor.width}x${descriptor.height}`,
          details: { resourceId: descriptor.id, width: descriptor.width, height: descriptor.height },
        });
      }
    }

    return issues;
  }
}
