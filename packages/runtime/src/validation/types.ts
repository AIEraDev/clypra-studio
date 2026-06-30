/**
 * @clypra/runtime — Validation Types
 */

export interface ValidationIssue {
  type: "error" | "warning";
  category: "shader" | "resource" | "graph" | "performance";
  message: string;
  details?: any;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ShaderValidationResult extends ValidationResult {
  compiled: boolean;
  uniformsFound: string[];
  attributesFound: string[];
}

export interface ResourceValidationResult extends ValidationResult {
  boundResources: string[];
  missingResources: string[];
}
