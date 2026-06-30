/**
 * Effect Validator
 *
 * Validates effect definitions before publishing to ensure quality and correctness.
 * Checks shader compilation, parameter schemas, graph structure, and metadata completeness.
 *
 * Phase 6 Week 10 - Publishing Pipeline #1
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    effectId: string;
    effectName: string;
    validatedAt: string;
    validator: string;
  };
}

export interface ValidationError {
  type: "shader" | "schema" | "graph" | "metadata" | "performance";
  severity: "error";
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: "shader" | "schema" | "graph" | "metadata" | "performance";
  severity: "warning";
  message: string;
  location?: string;
  suggestion?: string;
}

export interface EffectDefinition {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  schema: {
    parameters: Record<string, any>;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
  };
  nodes: any[];
  edges: any[];
  metadata: {
    author?: string;
    tags?: string[];
    thumbnail?: string;
    previewVideo?: string;
    requiredFeatures?: string[];
  };
  capabilities: {
    temporal: boolean;
    stateful: boolean;
    spatial: boolean;
    geometry: boolean;
    inputsCount: number;
  };
  requirements: {
    temporalRadius: number;
    preferredPrecision: string;
    multipass: boolean;
    supportsHalfResolution: boolean;
  };
  presets?: any[];
}

/**
 * Effect Validator
 */
export class EffectValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  /**
   * Validate an effect definition
   */
  validate(effect: EffectDefinition): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Run validation checks
    this.validateMetadata(effect);
    this.validateSchema(effect);
    this.validateGraph(effect);
    this.validateShaders(effect);
    this.validatePresets(effect);
    this.validatePerformance(effect);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        effectId: effect.id,
        effectName: effect.name,
        validatedAt: new Date().toISOString(),
        validator: "EffectValidator v1.0.0",
      },
    };
  }

  /**
   * Validate metadata completeness
   */
  private validateMetadata(effect: EffectDefinition): void {
    // Required fields
    if (!effect.id) {
      this.errors.push({
        type: "metadata",
        severity: "error",
        message: "Effect ID is required",
        suggestion: "Add a unique effect ID like 'video.my-effect'",
      });
    } else if (!effect.id.includes(".")) {
      this.warnings.push({
        type: "metadata",
        severity: "warning",
        message: "Effect ID should follow category.name pattern",
        location: `id: "${effect.id}"`,
        suggestion: "Use format like 'video.my-effect' or 'body.my-effect'",
      });
    }

    if (!effect.name) {
      this.errors.push({
        type: "metadata",
        severity: "error",
        message: "Effect name is required",
      });
    }

    if (!effect.version || !effect.version.match(/^\d+\.\d+\.\d+$/)) {
      this.errors.push({
        type: "metadata",
        severity: "error",
        message: "Valid semantic version is required (e.g., 1.0.0)",
        location: `version: "${effect.version}"`,
      });
    }

    if (!effect.description) {
      this.warnings.push({
        type: "metadata",
        severity: "warning",
        message: "Effect description is recommended",
        suggestion: "Add a brief description of what the effect does",
      });
    }

    if (!effect.category) {
      this.errors.push({
        type: "metadata",
        severity: "error",
        message: "Effect category is required",
        suggestion: "Use 'video', 'transition', 'body', or other category",
      });
    }

    // Metadata fields
    if (!effect.metadata) {
      this.warnings.push({
        type: "metadata",
        severity: "warning",
        message: "Metadata object is missing",
        suggestion: "Add metadata with author, tags, etc.",
      });
    } else {
      if (!effect.metadata.author) {
        this.warnings.push({
          type: "metadata",
          severity: "warning",
          message: "Author field is recommended",
        });
      }

      if (!effect.metadata.tags || effect.metadata.tags.length === 0) {
        this.warnings.push({
          type: "metadata",
          severity: "warning",
          message: "Tags are recommended for discoverability",
          suggestion: "Add relevant tags like ['blur', 'artistic', 'mask']",
        });
      }

      if (!effect.metadata.thumbnail) {
        this.warnings.push({
          type: "metadata",
          severity: "warning",
          message: "Thumbnail is recommended for preview",
        });
      }
    }
  }

  /**
   * Validate parameter schema
   */
  private validateSchema(effect: EffectDefinition): void {
    if (!effect.schema) {
      this.errors.push({
        type: "schema",
        severity: "error",
        message: "Schema is required",
      });
      return;
    }

    // Validate parameters
    if (!effect.schema.parameters) {
      this.warnings.push({
        type: "schema",
        severity: "warning",
        message: "No parameters defined",
        suggestion: "Effects typically have at least one adjustable parameter",
      });
    } else {
      for (const [key, param] of Object.entries(effect.schema.parameters)) {
        this.validateParameter(key, param);
      }
    }

    // Validate inputs
    if (!effect.schema.inputs) {
      this.errors.push({
        type: "schema",
        severity: "error",
        message: "Inputs schema is required",
      });
    }

    // Validate outputs
    if (!effect.schema.outputs) {
      this.errors.push({
        type: "schema",
        severity: "error",
        message: "Outputs schema is required",
      });
    }
  }

  /**
   * Validate a single parameter
   */
  private validateParameter(key: string, param: any): void {
    if (!param.type) {
      this.errors.push({
        type: "schema",
        severity: "error",
        message: `Parameter "${key}" missing type`,
        location: `parameters.${key}`,
      });
    }

    if (param.type === "number") {
      if (param.min === undefined || param.max === undefined) {
        this.warnings.push({
          type: "schema",
          severity: "warning",
          message: `Number parameter "${key}" should have min and max`,
          location: `parameters.${key}`,
        });
      }

      if (param.default === undefined) {
        this.warnings.push({
          type: "schema",
          severity: "warning",
          message: `Parameter "${key}" should have a default value`,
          location: `parameters.${key}`,
        });
      } else if (param.min !== undefined && param.max !== undefined) {
        if (param.default < param.min || param.default > param.max) {
          this.errors.push({
            type: "schema",
            severity: "error",
            message: `Parameter "${key}" default value out of range`,
            location: `parameters.${key}.default`,
            suggestion: `Default should be between ${param.min} and ${param.max}`,
          });
        }
      }
    }

    if (!param.label) {
      this.warnings.push({
        type: "schema",
        severity: "warning",
        message: `Parameter "${key}" missing label`,
        location: `parameters.${key}`,
        suggestion: "Add a human-readable label",
      });
    }

    if (!param.description) {
      this.warnings.push({
        type: "schema",
        severity: "warning",
        message: `Parameter "${key}" missing description`,
        location: `parameters.${key}`,
        suggestion: "Add a description of what this parameter does",
      });
    }
  }

  /**
   * Validate graph structure
   */
  private validateGraph(effect: EffectDefinition): void {
    if (!effect.nodes || effect.nodes.length === 0) {
      this.errors.push({
        type: "graph",
        severity: "error",
        message: "Effect must have at least one node",
      });
      return;
    }

    if (!effect.edges || effect.edges.length === 0) {
      this.warnings.push({
        type: "graph",
        severity: "warning",
        message: "Effect has no edges (disconnected nodes)",
      });
    }

    // Find input and output nodes
    const hasInput = effect.nodes.some((n) => n.type === "Input");
    const hasOutput = effect.nodes.some((n) => n.type === "Output");

    if (!hasInput) {
      this.errors.push({
        type: "graph",
        severity: "error",
        message: "Graph must have an Input node",
      });
    }

    if (!hasOutput) {
      this.errors.push({
        type: "graph",
        severity: "error",
        message: "Graph must have an Output node",
      });
    }

    // Check for duplicate node IDs
    const nodeIds = new Set<string>();
    for (const node of effect.nodes) {
      if (!node.id) {
        this.errors.push({
          type: "graph",
          severity: "error",
          message: "Node missing ID",
          location: `nodes[${effect.nodes.indexOf(node)}]`,
        });
        continue;
      }

      if (nodeIds.has(node.id)) {
        this.errors.push({
          type: "graph",
          severity: "error",
          message: `Duplicate node ID: "${node.id}"`,
          location: `nodes`,
        });
      }
      nodeIds.add(node.id);
    }

    // Validate edges reference valid nodes
    for (const edge of effect.edges) {
      if (!nodeIds.has(edge.from)) {
        this.errors.push({
          type: "graph",
          severity: "error",
          message: `Edge references non-existent node: "${edge.from}"`,
          location: `edges`,
        });
      }

      if (!nodeIds.has(edge.to)) {
        this.errors.push({
          type: "graph",
          severity: "error",
          message: `Edge references non-existent node: "${edge.to}"`,
          location: `edges`,
        });
      }
    }
  }

  /**
   * Validate shader code
   */
  private validateShaders(effect: EffectDefinition): void {
    const shaderNodes = effect.nodes.filter((n) => n.type === "ShaderNode");

    if (shaderNodes.length === 0) {
      this.warnings.push({
        type: "shader",
        severity: "warning",
        message: "Effect has no shader nodes",
        suggestion: "Most effects require at least one shader",
      });
      return;
    }

    for (const node of shaderNodes) {
      if (!node.params || !node.params.shader) {
        this.errors.push({
          type: "shader",
          severity: "error",
          message: `ShaderNode "${node.id}" missing shader code`,
          location: `nodes.${node.id}`,
        });
        continue;
      }

      const shader = node.params.shader;

      // Basic GLSL validation
      if (!shader.includes("void main()")) {
        this.errors.push({
          type: "shader",
          severity: "error",
          message: `ShaderNode "${node.id}" shader missing main() function`,
          location: `nodes.${node.id}.params.shader`,
        });
      }

      if (!shader.includes("gl_FragColor")) {
        this.warnings.push({
          type: "shader",
          severity: "warning",
          message: `ShaderNode "${node.id}" shader doesn't set gl_FragColor`,
          location: `nodes.${node.id}.params.shader`,
          suggestion: "Fragment shaders should set gl_FragColor",
        });
      }

      if (!shader.includes("precision")) {
        this.warnings.push({
          type: "shader",
          severity: "warning",
          message: `ShaderNode "${node.id}" shader missing precision qualifier`,
          location: `nodes.${node.id}.params.shader`,
          suggestion: "Add 'precision highp float;' or 'precision mediump float;'",
        });
      }

      // Check for common mistakes
      if (shader.includes("texture2D") && !shader.includes("sampler2D")) {
        this.warnings.push({
          type: "shader",
          severity: "warning",
          message: `ShaderNode "${node.id}" uses texture2D but no sampler2D uniforms`,
          location: `nodes.${node.id}.params.shader`,
        });
      }
    }
  }

  /**
   * Validate presets
   */
  private validatePresets(effect: EffectDefinition): void {
    if (!effect.presets || effect.presets.length === 0) {
      this.warnings.push({
        type: "metadata",
        severity: "warning",
        message: "Effect has no presets",
        suggestion: "Add at least 2-3 presets to demonstrate effect range",
      });
      return;
    }

    if (effect.presets.length < 2) {
      this.warnings.push({
        type: "metadata",
        severity: "warning",
        message: "Effect has only one preset",
        suggestion: "Add more presets to show different use cases",
      });
    }

    for (const preset of effect.presets) {
      if (!preset.id) {
        this.errors.push({
          type: "metadata",
          severity: "error",
          message: "Preset missing ID",
        });
      }

      if (!preset.name) {
        this.errors.push({
          type: "metadata",
          severity: "error",
          message: "Preset missing name",
        });
      }

      if (!preset.parameters) {
        this.errors.push({
          type: "metadata",
          severity: "error",
          message: `Preset "${preset.id}" missing parameters`,
        });
      }
    }
  }

  /**
   * Validate performance characteristics
   */
  private validatePerformance(effect: EffectDefinition): void {
    if (!effect.requirements) {
      this.warnings.push({
        type: "performance",
        severity: "warning",
        message: "Performance requirements not specified",
      });
      return;
    }

    const shaderNodeCount = effect.nodes.filter((n) => n.type === "ShaderNode").length;

    if (shaderNodeCount > 10) {
      this.warnings.push({
        type: "performance",
        severity: "warning",
        message: `Effect has ${shaderNodeCount} shader passes`,
        suggestion: "Consider optimizing to reduce pass count",
      });
    }

    if (effect.requirements.multipass && shaderNodeCount === 1) {
      this.warnings.push({
        type: "performance",
        severity: "warning",
        message: "Effect marked as multipass but has only one shader node",
        location: "requirements.multipass",
      });
    }

    if (!effect.requirements.multipass && shaderNodeCount > 1) {
      this.warnings.push({
        type: "performance",
        severity: "warning",
        message: "Effect has multiple passes but not marked as multipass",
        location: "requirements.multipass",
        suggestion: "Set multipass: true",
      });
    }
  }
}

/**
 * Convenience function to validate an effect
 */
export function validateEffect(effect: EffectDefinition): ValidationResult {
  const validator = new EffectValidator();
  return validator.validate(effect);
}
