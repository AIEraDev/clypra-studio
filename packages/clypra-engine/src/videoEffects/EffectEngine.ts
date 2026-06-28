/**
 * Effect Runtime Engine
 *
 * Manages the lifecycle of active effect graphs,
 * interpolates keyframe parameters, and coordinates rendering passes.
 */

import { EffectGraph, GraphNode } from "./EffectGraph.js";
import { EffectRenderer } from "./EffectRenderer.js";
import { EasingFunction } from "./types.js";

export class EffectEngine {
  private activeGraph: EffectGraph | null = null;
  private canvasPool: Map<string, HTMLCanvasElement> = new Map();

  constructor() {}

  /**
   * Set the active effect graph to execute
   */
  public loadGraph(graph: EffectGraph): void {
    this.activeGraph = graph;
    this.clearPool();
  }

  /**
   * Clear active graph and associated canvases
   */
  public unloadGraph(): void {
    this.activeGraph = null;
    this.clearPool();
  }

  /**
   * Evaluate node parameters at specific timestamp `t`
   */
  public evaluateParameters(node: GraphNode, time: number): Record<string, any> {
    const params = { ...node.params };
    if (!node.keyframes) return params;

    for (const [key, track] of Object.entries(node.keyframes)) {
      if (!track || track.length === 0) continue;

      // Sort track keyframes chronologically
      const sortedKeys = [...track].sort((a, b) => a.time - b.time);

      if (time <= sortedKeys[0].time) {
        params[key] = sortedKeys[0].value;
        continue;
      }

      if (time >= sortedKeys[sortedKeys.length - 1].time) {
        params[key] = sortedKeys[sortedKeys.length - 1].value;
        continue;
      }

      // Interpolate between keyframes
      for (let i = 0; i < sortedKeys.length - 1; i++) {
        const k0 = sortedKeys[i];
        const k1 = sortedKeys[i + 1];

        if (time >= k0.time && time <= k1.time) {
          const tRange = k1.time - k0.time;
          const tProgress = tRange === 0 ? 0 : (time - k0.time) / tRange;
          
          const easedProgress = this.applyEasing(k0.easing, tProgress);
          params[key] = this.interpolate(k0.value, k1.value, easedProgress);
          break;
        }
      }
    }

    return params;
  }

  /**
   * Render the active graph onto a Canvas 2D Context
   *
   * @param ctx Target canvas context
   * @param time Timestamp relative to effect start
   * @param sourceTexture Optional raw image source
   */
  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    time: number,
    sourceTexture?: CanvasImageSource
  ): void {
    if (!this.activeGraph) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Get topological execution order of nodes
    const execOrder = this.activeGraph.getExecutionOrder();
    
    // Store intermediate textures/canvases per node output
    const outputs = new Map<string, HTMLCanvasElement | OffscreenCanvas | CanvasImageSource>();

    for (const nodeId of execOrder) {
      const node = this.activeGraph.nodes.get(nodeId)!;
      
      // Resolve node inputs
      const upstreams = this.activeGraph.getUpstreamNodes(nodeId);

      // Create offscreen buffer canvas for intermediate steps
      const buffer = this.acquireCanvas(nodeId, width, height);
      const bufferCtx = buffer.getContext("2d")!;
      bufferCtx.clearRect(0, 0, width, height);

      // Node specific routing logic
      if (node.type === "source") {
        if (sourceTexture) {
          bufferCtx.drawImage(sourceTexture, 0, 0, width, height);
        }
        outputs.set(nodeId, buffer);
      } else {
        // Resolve parameter state at current time
        const evaluatedParams = this.evaluateParameters(node, time);
        const intensity = evaluatedParams.intensity ?? 1.0;

        // Draw primary input first if present
        if (upstreams.length > 0) {
          const mainInput = outputs.get(upstreams[0]);
          if (mainInput) {
            bufferCtx.drawImage(mainInput as any, 0, 0, width, height);
          }
        }

        // Apply shader modifier via standard EffectRenderer
        // Shaders will run on GPU/WebGL under the hood, fallback to Canvas 2D
        EffectRenderer.apply(bufferCtx as any, node.type as any, evaluatedParams, intensity, time);
        outputs.set(nodeId, buffer);
      }
    }

    // Final Node draws to the output context
    const finalNodeId = execOrder[execOrder.length - 1];
    const finalFrame = outputs.get(finalNodeId);
    if (finalFrame) {
      ctx.drawImage(finalFrame as any, 0, 0, width, height);
    }
  }

  /**
   * Interpolate values (numbers or colors)
   */
  private interpolate(val0: any, val1: any, progress: number): any {
    if (typeof val0 === "number" && typeof val1 === "number") {
      return val0 + (val1 - val0) * progress;
    }
    // Fallback if not numeric
    return progress < 0.5 ? val0 : val1;
  }

  /**
   * Easing curves mapping
   */
  private applyEasing(easing: EasingFunction, t: number): number {
    switch (easing) {
      case "ease-in":
      case "ease-in-quad":
        return t * t;
      case "ease-out":
      case "ease-out-quad":
        return t * (2 - t);
      case "ease-in-out":
      case "ease-in-out-quad":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case "linear":
      default:
        return t;
    }
  }

  /**
   * Acquire Offscreen Canvas context from reuse pool
   */
  private acquireCanvas(nodeId: string, w: number, h: number): HTMLCanvasElement {
    let canvas = this.canvasPool.get(nodeId);
    if (!canvas) {
      canvas = document.createElement("canvas");
      this.canvasPool.set(nodeId, canvas);
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return canvas;
  }

  private clearPool(): void {
    this.canvasPool.clear();
  }
}
