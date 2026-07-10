/**
 * @clypra-studio/engine — Pipeline V2: Null Backend
 *
 * @deprecated Use @clypra/runtime/renderer instead
 * The runtime version (NullRenderer) is more complete and follows the same interface.
 * This file will be removed in v3.0.0
 *
 * A mock execution backend representing a headless/CPU-free queue.
 * Implements RenderBackend to record submitted command buffers, rendering lists, and pass executions.
 * Enables automated integration tests to prove planner scheduling without requiring WebGL/WebGPU surface allocations.
 */

import type { RenderBackend, CommandBuffer, Command } from "./types";
import type { RenderPass } from "../planner/types";

export interface RecordedExecution {
  readonly commandBuffer: CommandBuffer;
  readonly timestamp: number;
}

export interface ResourceAllocation {
  readonly id: string;
  readonly type: "texture" | "buffer";
  readonly width: number;
  readonly height: number;
  readonly format: string;
  readonly allocatedAt: number;
}

export interface ShaderCompilation {
  readonly shaderId: string;
  readonly source: string;
  readonly compiledAt: number;
}

/**
 * NullBackend is a mock implementation that records all operations without performing actual GPU work.
 * Useful for testing graph compilation, validation, and scheduling without a graphics context.
 */
export class NullBackend implements RenderBackend {
  private initialized = false;
  private canvasElement?: HTMLCanvasElement;
  private resources = new Map<string, ResourceAllocation>();
  private shaders = new Map<string, ShaderCompilation>();
  private executionHistory: RecordedExecution[] = [];
  private resourceAllocationOrder: string[] = [];
  private resourceReleaseOrder: string[] = [];

  /**
   * Initialize the backend (no-op for NullBackend, but records initialization state).
   */
  async init(canvasElement?: HTMLCanvasElement): Promise<void> {
    if (this.initialized) {
      throw new Error("NullBackend already initialized");
    }
    this.canvasElement = canvasElement;
    this.initialized = true;
  }

  /**
   * Allocate a resource (records allocation without actual memory allocation).
   */
  allocateResource(id: string, type: "texture" | "buffer", width: number, height: number, format: string): void {
    if (!this.initialized) {
      throw new Error("NullBackend not initialized");
    }

    if (this.resources.has(id)) {
      throw new Error(`Resource "${id}" already allocated`);
    }

    const allocation: ResourceAllocation = {
      id,
      type,
      width,
      height,
      format,
      allocatedAt: Date.now(),
    };

    this.resources.set(id, allocation);
    this.resourceAllocationOrder.push(id);
  }

  /**
   * Release a resource (records release without actual deallocation).
   */
  releaseResource(id: string): void {
    if (!this.initialized) {
      throw new Error("NullBackend not initialized");
    }

    if (!this.resources.has(id)) {
      throw new Error(`Resource "${id}" not found for release`);
    }

    this.resources.delete(id);
    this.resourceReleaseOrder.push(id);
  }

  /**
   * Compile a shader (records compilation without actual GPU compilation).
   */
  compileShader(shaderId: string, sourceGLSLOrWGSL: string): void {
    if (!this.initialized) {
      throw new Error("NullBackend not initialized");
    }

    if (this.shaders.has(shaderId)) {
      throw new Error(`Shader "${shaderId}" already compiled`);
    }

    const compilation: ShaderCompilation = {
      shaderId,
      source: sourceGLSLOrWGSL,
      compiledAt: Date.now(),
    };

    this.shaders.set(shaderId, compilation);
  }

  /**
   * Submit a command buffer for execution (records submission without actual rendering).
   */
  async submit(commandBuffer: CommandBuffer): Promise<void> {
    if (!this.initialized) {
      throw new Error("NullBackend not initialized");
    }

    // Validate that all referenced resources exist
    for (const passEntry of commandBuffer.passes) {
      for (const cmd of passEntry.commands) {
        if (cmd.resourceId && !this.resources.has(cmd.resourceId)) {
          throw new Error(`Command references non-existent resource "${cmd.resourceId}" in pass "${passEntry.pass.id}"`);
        }
      }

      // Validate render pass resources
      for (const inputId of passEntry.pass.inputs) {
        if (!this.resources.has(inputId)) {
          throw new Error(`Render pass "${passEntry.pass.id}" references non-existent input resource "${inputId}"`);
        }
      }

      if (!this.resources.has(passEntry.pass.output)) {
        throw new Error(`Render pass "${passEntry.pass.id}" references non-existent output resource "${passEntry.pass.output}"`);
      }

      // Validate shader compilation
      if (!this.shaders.has(passEntry.pass.shaderId)) {
        throw new Error(`Render pass "${passEntry.pass.id}" references uncompiled shader "${passEntry.pass.shaderId}"`);
      }
    }

    // Record the execution
    const execution: RecordedExecution = {
      commandBuffer,
      timestamp: Date.now(),
    };

    this.executionHistory.push(execution);
  }

  /**
   * Read pixels from a resource (returns empty buffer for NullBackend).
   */
  async readPixels(resourceId: string): Promise<Uint8Array> {
    if (!this.initialized) {
      throw new Error("NullBackend not initialized");
    }

    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource "${resourceId}" not found for readPixels`);
    }

    // Return empty buffer with correct size
    const pixelCount = resource.width * resource.height * 4; // RGBA
    return new Uint8Array(pixelCount);
  }

  /**
   * Destroy the backend and release all resources.
   */
  destroy(): void {
    if (!this.initialized) {
      return;
    }

    this.resources.clear();
    this.shaders.clear();
    this.executionHistory = [];
    this.resourceAllocationOrder = [];
    this.resourceReleaseOrder = [];
    this.initialized = false;
    this.canvasElement = undefined;
  }

  // ============================
  // Testing & Inspection Methods
  // ============================

  /**
   * Returns whether the backend has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Returns all allocated resources.
   */
  getAllocatedResources(): ResourceAllocation[] {
    return Array.from(this.resources.values());
  }

  /**
   * Returns the order in which resources were allocated.
   */
  getResourceAllocationOrder(): string[] {
    return [...this.resourceAllocationOrder];
  }

  /**
   * Returns the order in which resources were released.
   */
  getResourceReleaseOrder(): string[] {
    return [...this.resourceReleaseOrder];
  }

  /**
   * Returns all compiled shaders.
   */
  getCompiledShaders(): ShaderCompilation[] {
    return Array.from(this.shaders.values());
  }

  /**
   * Returns the execution history (all submitted command buffers).
   */
  getExecutionHistory(): RecordedExecution[] {
    return [...this.executionHistory];
  }

  /**
   * Returns the last submitted command buffer, or undefined if none.
   */
  getLastExecution(): RecordedExecution | undefined {
    return this.executionHistory[this.executionHistory.length - 1];
  }

  /**
   * Returns the number of passes in the last submitted command buffer.
   */
  getLastPassCount(): number {
    const last = this.getLastExecution();
    return last ? last.commandBuffer.passes.length : 0;
  }

  /**
   * Returns the pass names from the last execution in order.
   */
  getLastPassNames(): string[] {
    const last = this.getLastExecution();
    if (!last) return [];
    return last.commandBuffer.passes.map((p) => p.pass.name);
  }

  /**
   * Returns the shader IDs used in the last execution in order.
   */
  getLastShaderIds(): string[] {
    const last = this.getLastExecution();
    if (!last) return [];
    return last.commandBuffer.passes.map((p) => p.pass.shaderId);
  }

  /**
   * Checks if a specific resource is currently allocated.
   */
  hasResource(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * Checks if a specific shader is compiled.
   */
  hasShader(shaderId: string): boolean {
    return this.shaders.has(shaderId);
  }

  /**
   * Returns the canvas element if provided during init.
   */
  getCanvasElement(): HTMLCanvasElement | undefined {
    return this.canvasElement;
  }

  /**
   * Resets all recorded state (useful for test cleanup).
   */
  reset(): void {
    this.resources.clear();
    this.shaders.clear();
    this.executionHistory = [];
    this.resourceAllocationOrder = [];
    this.resourceReleaseOrder = [];
  }
}
