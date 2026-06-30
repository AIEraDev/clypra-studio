/**
 * @clypra/runtime — Frame Graph Optimizer
 *
 * Optimizes frame graphs for better performance.
 * - Merges redundant passes
 * - Reorders passes for better cache locality
 * - Reduces transient resource usage
 */

import type { FrameGraph, RenderPass, ResourceRequest } from "./types";

export interface OptimizationResult {
  optimized: FrameGraph;
  stats: {
    passesRemoved: number;
    resourcesReduced: number;
    estimatedSavingsMs: number;
  };
}

/**
 * FrameGraphOptimizer - Optimizes frame graphs
 */
export class FrameGraphOptimizer {
  /**
   * Optimize a frame graph
   */
  optimize(frameGraph: FrameGraph): OptimizationResult {
    let optimized = frameGraph;
    let passesRemoved = 0;
    let resourcesReduced = 0;

    // Merge redundant passes
    const { passes: mergedPasses, removed: passRemoved } = this.mergeRedundantPasses(optimized.passes);
    passesRemoved += passRemoved;
    optimized = { ...optimized, passes: mergedPasses };

    // Reduce transient resources
    const { resources: reducedResources, reduced: resourceReduced } = this.reduceTransientResources(optimized.resourceRequests, optimized.passes);
    resourcesReduced += resourceReduced;
    optimized = { ...optimized, resourceRequests: reducedResources };

    // Reorder passes for cache locality
    const reorderedPasses = this.reorderPasses(optimized.passes);
    optimized = { ...optimized, passes: reorderedPasses };

    return {
      optimized,
      stats: {
        passesRemoved,
        resourcesReduced,
        estimatedSavingsMs: this.estimateSavings(passesRemoved, resourcesReduced),
      },
    };
  }

  /**
   * Merge redundant passes
   */
  private mergeRedundantPasses(passes: readonly RenderPass[]): {
    passes: readonly RenderPass[];
    removed: number;
  } {
    const merged: RenderPass[] = [];
    const seen = new Set<string>();
    let removed = 0;

    for (const pass of passes) {
      // Create a key based on shader and inputs
      const key = `${pass.shaderId}:${pass.inputs.join(",")}`;

      if (seen.has(key)) {
        removed++;
        continue;
      }

      seen.add(key);
      merged.push(pass);
    }

    return { passes: merged, removed };
  }

  /**
   * Reduce transient resource allocations
   */
  private reduceTransientResources(
    resources: readonly ResourceRequest[],
    passes: readonly RenderPass[],
  ): {
    resources: readonly ResourceRequest[];
    reduced: number;
  } {
    const reduced: ResourceRequest[] = [];
    const transient: ResourceRequest[] = [];
    let reducedCount = 0;

    // Separate transient from persistent
    for (const resource of resources) {
      if (resource.transient) {
        transient.push(resource);
      } else {
        reduced.push(resource);
      }
    }

    // Build resource usage map
    const usage = this.buildResourceUsageMap(transient, passes);

    // Pool transient resources that don't overlap
    const pooled = this.poolResources(transient, usage);
    reducedCount = transient.length - pooled.length;

    reduced.push(...pooled);

    return { resources: reduced, reduced: reducedCount };
  }

  /**
   * Build resource usage map (which passes use which resources)
   */
  private buildResourceUsageMap(resources: ResourceRequest[], passes: readonly RenderPass[]): Map<string, number[]> {
    const usage = new Map<string, number[]>();

    for (const resource of resources) {
      usage.set(resource.id, []);
    }

    passes.forEach((pass, index) => {
      for (const input of pass.inputs) {
        if (usage.has(input)) {
          usage.get(input)!.push(index);
        }
      }
      if (usage.has(pass.output)) {
        usage.get(pass.output)!.push(index);
      }
    });

    return usage;
  }

  /**
   * Pool resources that don't have overlapping usage
   */
  private poolResources(resources: ResourceRequest[], usage: Map<string, number[]>): ResourceRequest[] {
    const pooled: ResourceRequest[] = [];
    const processed = new Set<string>();

    for (const resource of resources) {
      if (processed.has(resource.id)) continue;

      const resourceUsage = usage.get(resource.id) || [];

      // Try to find another resource with non-overlapping usage
      let found = false;
      for (const other of resources) {
        if (other.id === resource.id || processed.has(other.id)) continue;
        if (other.format !== resource.format) continue;
        if (other.width !== resource.width || other.height !== resource.height) continue;

        const otherUsage = usage.get(other.id) || [];

        // Check if usage overlaps
        const overlaps = resourceUsage.some((idx) => otherUsage.includes(idx));
        if (!overlaps) {
          // Can reuse this resource
          processed.add(other.id);
          found = true;
        }
      }

      if (!found || pooled.length === 0) {
        pooled.push(resource);
      }
      processed.add(resource.id);
    }

    return pooled;
  }

  /**
   * Reorder passes for better cache locality
   */
  private reorderPasses(passes: readonly RenderPass[]): readonly RenderPass[] {
    // Build dependency graph
    const deps = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    for (const pass of passes) {
      deps.set(pass.id, new Set());
      inDegree.set(pass.id, 0);
    }

    // Calculate dependencies
    for (const pass of passes) {
      for (const input of pass.inputs) {
        // Find pass that outputs this resource
        const producer = passes.find((p) => p.output === input);
        if (producer) {
          deps.get(pass.id)!.add(producer.id);
          inDegree.set(pass.id, inDegree.get(pass.id)! + 1);
        }
      }
    }

    // Topological sort (Kahn's algorithm)
    const sorted: RenderPass[] = [];
    const queue: RenderPass[] = [];

    // Start with passes that have no dependencies
    for (const pass of passes) {
      if (inDegree.get(pass.id) === 0) {
        queue.push(pass);
      }
    }

    while (queue.length > 0) {
      const pass = queue.shift()!;
      sorted.push(pass);

      // Update in-degrees
      for (const other of passes) {
        if (deps.get(other.id)!.has(pass.id)) {
          const newDegree = inDegree.get(other.id)! - 1;
          inDegree.set(other.id, newDegree);

          if (newDegree === 0) {
            queue.push(other);
          }
        }
      }
    }

    return sorted;
  }

  /**
   * Estimate performance savings
   */
  private estimateSavings(passesRemoved: number, resourcesReduced: number): number {
    // Rough estimates:
    // - Each pass costs ~1ms
    // - Each resource allocation costs ~0.5ms
    return passesRemoved * 1.0 + resourcesReduced * 0.5;
  }
}
