/**
 * @clypra/runtime — Shader Validator
 *
 * Validates GLSL shaders for compilation and correctness.
 */

import type { ShaderValidationResult, ValidationIssue } from "./types";

/**
 * Shader Validator
 *
 * Validates GLSL shaders without requiring a full WebGL context.
 */
export class ShaderValidator {
  /**
   * Validate a GLSL shader
   */
  validate(source: string, type: "vertex" | "fragment"): ShaderValidationResult {
    const issues: ValidationIssue[] = [];
    const uniformsFound: string[] = [];
    const attributesFound: string[] = [];

    // Parse uniforms
    const uniformMatches = source.matchAll(/uniform\s+(\w+)\s+(\w+);/g);
    for (const match of uniformMatches) {
      uniformsFound.push(match[2]);
    }

    // Parse attributes (vertex shaders only)
    if (type === "vertex") {
      const attributeMatches = source.matchAll(/attribute\s+(\w+)\s+(\w+);/g);
      for (const match of attributeMatches) {
        attributesFound.push(match[2]);
      }
    }

    // Check for common issues
    this.checkSyntax(source, issues);
    this.checkPrecision(source, issues);
    this.checkMainFunction(source, issues);

    return {
      valid: issues.filter((i) => i.type === "error").length === 0,
      compiled: true, // Will be set by actual compilation
      issues,
      uniformsFound,
      attributesFound,
    };
  }

  /**
   * Validate shader compilation with WebGL context
   */
  validateWithContext(gl: WebGLRenderingContext | WebGL2RenderingContext, source: string, type: "vertex" | "fragment"): ShaderValidationResult {
    const result = this.validate(source, type);

    try {
      const shaderType = type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
      const shader = gl.createShader(shaderType);

      if (!shader) {
        result.issues.push({
          type: "error",
          category: "shader",
          message: "Failed to create shader",
        });
        result.compiled = false;
        result.valid = false;
        return result;
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      result.compiled = compiled;

      if (!compiled) {
        const log = gl.getShaderInfoLog(shader);
        result.issues.push({
          type: "error",
          category: "shader",
          message: `Shader compilation failed: ${log}`,
        });
        result.valid = false;
      }

      gl.deleteShader(shader);
    } catch (error) {
      result.issues.push({
        type: "error",
        category: "shader",
        message: `Shader validation error: ${error}`,
      });
      result.compiled = false;
      result.valid = false;
    }

    return result;
  }

  /**
   * Check syntax issues
   */
  private checkSyntax(source: string, issues: ValidationIssue[]): void {
    // Check for missing semicolons
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip empty lines and preprocessor directives
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
        return;
      }

      // Check for statements that should end with semicolon
      if (!trimmed.endsWith(";") && !trimmed.endsWith("{") && !trimmed.endsWith("}") && trimmed.length > 0) {
        issues.push({
          type: "warning",
          category: "shader",
          message: "Possible missing semicolon",
          location: { line: index + 1 },
        });
      }
    });
  }

  /**
   * Check precision declarations
   */
  private checkPrecision(source: string, issues: ValidationIssue[]): void {
    // Fragment shaders should have precision declarations
    if (!source.includes("precision")) {
      issues.push({
        type: "warning",
        category: "shader",
        message: "Missing precision qualifier (e.g., precision highp float;)",
      });
    }
  }

  /**
   * Check for main function
   */
  private checkMainFunction(source: string, issues: ValidationIssue[]): void {
    if (!source.includes("void main()")) {
      issues.push({
        type: "error",
        category: "shader",
        message: "Missing main function",
      });
    }
  }
}
