/**
 * Phase 4R.2 — Platform-independent Visualization Definition & Registry
 *
 * Pure evaluation contract: (node, context) → evaluated geometry.
 * Completely decoupled from PixiJS or DOM renderer implementations.
 */

import type { OverlayDocument } from "./overlayDocumentSchema.js";
import type { PropertyDefinition } from "./componentRegistry.js";

export interface VisualizationEvaluationContext {
  width: number;
  height: number;
  t: number; // Normalized animation progress [0, 1]
  doc?: OverlayDocument;
}

export interface VisualizationCapabilities {
  dataBinding: boolean;
  animation: boolean;
  responsive: boolean;
}

export interface VisualizationDefinition<TNode = any, TGeometry = any> {
  type: string;
  name: string;
  category: "chart" | "metric" | "gauge" | "timeline" | "comparison" | "annotation";
  schema: PropertyDefinition[];
  supports: VisualizationCapabilities;
  evaluate(node: TNode, context: VisualizationEvaluationContext): TGeometry;
}

export class VisualizationRegistry {
  private definitions = new Map<string, VisualizationDefinition>();

  public register<TNode, TGeometry>(def: VisualizationDefinition<TNode, TGeometry>): void {
    this.definitions.set(def.type, def);
  }

  public get<TNode = any, TGeometry = any>(type: string): VisualizationDefinition<TNode, TGeometry> | undefined {
    return this.definitions.get(type);
  }

  public getAll(): VisualizationDefinition[] {
    return Array.from(this.definitions.values());
  }

  public has(type: string): boolean {
    return this.definitions.has(type);
  }
}

export const visualizationRegistry = new VisualizationRegistry();
