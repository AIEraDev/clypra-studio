/**
 * @clypra/runtime — Telemetry Types
 *
 * Backend-neutral telemetry interface.
 * Both Pixi and future Rust backends emit the same events.
 */

export interface RuntimeTelemetry {
  // Frame lifecycle
  beginFrame(frame: number, timestamp: number): void;
  endFrame(frame: number, duration: number): void;

  // Compilation
  compileStart(): void;
  compileEnd(duration: number, nodeCount: number): void;

  // Planning
  planStart(): void;
  planEnd(duration: number, passCount: number, resourceCount: number): void;

  // Validation
  validateStart(): void;
  validateEnd(duration: number, errors: number, warnings: number): void;

  // Resource management
  resourceAllocated(id: string, width: number, height: number, transient: boolean): void;
  resourceReleased(id: string): void;
  resourceReused(id: string): void;

  // Pass execution
  passStart(name: string, shaderId: string): void;
  passEnd(name: string, duration: number): void;

  // Shader compilation
  shaderCompiled(shaderId: string, duration: number): void;

  // Texture operations
  textureUploaded(id: string, width: number, height: number, duration: number): void;
  textureDownloaded(id: string, duration: number): void;

  // Cache
  cacheHit(resourceId: string): void;
  cacheMiss(resourceId: string): void;

  // Presentation
  presentStart(): void;
  presentEnd(duration: number): void;

  // Errors
  error(subsystem: string, message: string, details?: unknown): void;
  warning(subsystem: string, message: string, details?: unknown): void;
}

/**
 * Frame telemetry data collected during a single frame render
 */
export interface FrameTelemetry {
  frameNumber: number;
  timestamp: number;

  // Timings (all in ms)
  compile: number;
  plan: number;
  validate: number;
  upload: number;
  render: number;
  present: number;
  total: number;

  // Counters
  nodeCount: number;
  passCount: number;
  resourceCount: number;
  transientCount: number;
  persistentCount: number;
  allocations: number;
  releases: number;
  reuses: number;
  uploads: number;
  cacheHits: number;
  cacheMisses: number;

  // Execution trace
  passes: PassExecutionLegacy[];
  resources: ResourceLifetime[];
  errors: TelemetryEvent[];
  warnings: TelemetryEvent[];
}

/**
 * Pass execution details (DEPRECATED - use PassExecution from state/types instead)
 */
export interface PassExecutionLegacy {
  name: string;
  shaderId: string;
  startTime: number;
  duration: number;
  inputs: string[];
  output: string;
  uniforms: Record<string, unknown>;
}

/**
 * Resource lifetime tracking
 */
export interface ResourceLifetime {
  id: string;
  width: number;
  height: number;
  transient: boolean;
  allocated: number; // timestamp
  released?: number; // timestamp
  reused: boolean;
}

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  timestamp: number;
  subsystem: string;
  message: string;
  details?: unknown;
}

/**
 * Telemetry collector that aggregates events into structured data
 */
export class TelemetryCollector implements RuntimeTelemetry {
  private currentFrame: Partial<FrameTelemetry> | null = null;
  private frameHistory: FrameTelemetry[] = [];
  private maxHistory = 300; // Keep last 5 seconds at 60 FPS

  private timers = new Map<string, number>();
  private resourceMap = new Map<string, ResourceLifetime>();

  beginFrame(frame: number, timestamp: number): void {
    this.currentFrame = {
      frameNumber: frame,
      timestamp,
      compile: 0,
      plan: 0,
      validate: 0,
      upload: 0,
      render: 0,
      present: 0,
      total: 0,
      nodeCount: 0,
      passCount: 0,
      resourceCount: 0,
      transientCount: 0,
      persistentCount: 0,
      allocations: 0,
      releases: 0,
      reuses: 0,
      uploads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      passes: [],
      resources: [],
      errors: [],
      warnings: [],
    };
    this.timers.set("frame", timestamp);
  }

  endFrame(frame: number, duration: number): void {
    if (!this.currentFrame) return;

    this.currentFrame.total = duration;
    this.currentFrame.resources = Array.from(this.resourceMap.values());

    this.frameHistory.push(this.currentFrame as FrameTelemetry);

    // Keep history bounded
    if (this.frameHistory.length > this.maxHistory) {
      this.frameHistory.shift();
    }

    this.currentFrame = null;
  }

  compileStart(): void {
    this.timers.set("compile", performance.now());
  }

  compileEnd(duration: number, nodeCount: number): void {
    if (this.currentFrame) {
      this.currentFrame.compile = duration;
      this.currentFrame.nodeCount = nodeCount;
    }
  }

  planStart(): void {
    this.timers.set("plan", performance.now());
  }

  planEnd(duration: number, passCount: number, resourceCount: number): void {
    if (this.currentFrame) {
      this.currentFrame.plan = duration;
      this.currentFrame.passCount = passCount;
      this.currentFrame.resourceCount = resourceCount;
    }
  }

  validateStart(): void {
    this.timers.set("validate", performance.now());
  }

  validateEnd(duration: number, errors: number, warnings: number): void {
    if (this.currentFrame) {
      this.currentFrame.validate = duration;
    }
  }

  resourceAllocated(id: string, width: number, height: number, transient: boolean): void {
    const resource: ResourceLifetime = {
      id,
      width,
      height,
      transient,
      allocated: performance.now(),
      reused: false,
    };
    this.resourceMap.set(id, resource);

    if (this.currentFrame) {
      this.currentFrame.allocations = (this.currentFrame.allocations || 0) + 1;
      if (transient) {
        this.currentFrame.transientCount = (this.currentFrame.transientCount || 0) + 1;
      } else {
        this.currentFrame.persistentCount = (this.currentFrame.persistentCount || 0) + 1;
      }
    }
  }

  resourceReleased(id: string): void {
    const resource = this.resourceMap.get(id);
    if (resource) {
      resource.released = performance.now();
    }

    if (this.currentFrame) {
      this.currentFrame.releases = (this.currentFrame.releases || 0) + 1;
    }
  }

  resourceReused(id: string): void {
    const resource = this.resourceMap.get(id);
    if (resource) {
      resource.reused = true;
    }

    if (this.currentFrame) {
      this.currentFrame.reuses = (this.currentFrame.reuses || 0) + 1;
    }
  }

  passStart(name: string, shaderId: string): void {
    this.timers.set(`pass:${name}`, performance.now());
  }

  passEnd(name: string, duration: number): void {
    if (this.currentFrame && this.currentFrame.passes) {
      this.currentFrame.passes.push({
        name,
        shaderId: name, // Will be updated by renderer with actual shader ID
        startTime: this.timers.get(`pass:${name}`) || 0,
        duration,
        inputs: [],
        output: "",
        uniforms: {},
      });
      this.currentFrame.render = (this.currentFrame.render || 0) + duration;
    }
  }

  shaderCompiled(shaderId: string, duration: number): void {
    // Track shader compilation (usually first-time only)
  }

  textureUploaded(id: string, width: number, height: number, duration: number): void {
    if (this.currentFrame) {
      this.currentFrame.uploads = (this.currentFrame.uploads || 0) + 1;
      this.currentFrame.upload = (this.currentFrame.upload || 0) + duration;
    }
  }

  textureDownloaded(id: string, duration: number): void {
    // Track texture downloads (for readback)
  }

  cacheHit(resourceId: string): void {
    if (this.currentFrame) {
      this.currentFrame.cacheHits = (this.currentFrame.cacheHits || 0) + 1;
    }
  }

  cacheMiss(resourceId: string): void {
    if (this.currentFrame) {
      this.currentFrame.cacheMisses = (this.currentFrame.cacheMisses || 0) + 1;
    }
  }

  presentStart(): void {
    this.timers.set("present", performance.now());
  }

  presentEnd(duration: number): void {
    if (this.currentFrame) {
      this.currentFrame.present = duration;
    }
  }

  error(subsystem: string, message: string, details?: unknown): void {
    if (this.currentFrame && this.currentFrame.errors) {
      this.currentFrame.errors.push({
        timestamp: performance.now(),
        subsystem,
        message,
        details,
      });
    }
  }

  warning(subsystem: string, message: string, details?: unknown): void {
    if (this.currentFrame && this.currentFrame.warnings) {
      this.currentFrame.warnings.push({
        timestamp: performance.now(),
        subsystem,
        message,
        details,
      });
    }
  }

  /**
   * Get the most recent frame telemetry
   */
  getLatestFrame(): FrameTelemetry | null {
    return this.frameHistory[this.frameHistory.length - 1] || null;
  }

  /**
   * Get frame history
   */
  getHistory(count?: number): FrameTelemetry[] {
    if (count === undefined) return [...this.frameHistory];
    return this.frameHistory.slice(-count);
  }

  /**
   * Get average metrics over last N frames
   */
  getAverageMetrics(frameCount = 60): {
    avgCompile: number;
    avgPlan: number;
    avgRender: number;
    avgTotal: number;
    fps: number;
  } {
    const frames = this.frameHistory.slice(-frameCount);
    if (frames.length === 0) {
      return { avgCompile: 0, avgPlan: 0, avgRender: 0, avgTotal: 0, fps: 0 };
    }

    const sum = frames.reduce(
      (acc, f) => ({
        compile: acc.compile + f.compile,
        plan: acc.plan + f.plan,
        render: acc.render + f.render,
        total: acc.total + f.total,
      }),
      { compile: 0, plan: 0, render: 0, total: 0 },
    );

    const count = frames.length;
    const avgTotal = sum.total / count;
    const fps = avgTotal > 0 ? 1000 / avgTotal : 0;

    return {
      avgCompile: sum.compile / count,
      avgPlan: sum.plan / count,
      avgRender: sum.render / count,
      avgTotal,
      fps,
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.frameHistory = [];
    this.resourceMap.clear();
  }
}

/**
 * No-op telemetry for production builds or when telemetry is disabled
 */
export class NoOpTelemetry implements RuntimeTelemetry {
  beginFrame(): void {}
  endFrame(): void {}
  compileStart(): void {}
  compileEnd(): void {}
  planStart(): void {}
  planEnd(): void {}
  validateStart(): void {}
  validateEnd(): void {}
  resourceAllocated(): void {}
  resourceReleased(): void {}
  resourceReused(): void {}
  passStart(): void {}
  passEnd(): void {}
  shaderCompiled(): void {}
  textureUploaded(): void {}
  textureDownloaded(): void {}
  cacheHit(): void {}
  cacheMiss(): void {}
  presentStart(): void {}
  presentEnd(): void {}
  error(): void {}
  warning(): void {}
}
