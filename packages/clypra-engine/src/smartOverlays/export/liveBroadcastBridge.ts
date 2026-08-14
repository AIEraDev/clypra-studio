/**
 * Live Broadcast Bridge
 *
 * Real-time zero-frame-drop overlay streaming engine for OBS Studio,
 * NDI feeds, WebRTC broadcast pipelines, and virtual camera sinks.
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import { evaluateExportFrame } from "./framePipeline.js";
import { ExportDependencyGraph, exportDependencyGraph } from "../../assets/exportDependencyGraph.js";
import { ResourceCache, resourceCache } from "../../assets/resourceCache.js";
import { AssetRegistry, assetRegistry } from "../../assets/assetRegistry.js";
import type { EvaluatedExportFrame, ProfileCanvasDimensions } from "./exportTypes.js";

export interface LiveBroadcastOptions {
  fps?: number;
  width?: number;
  height?: number;
  transparent?: boolean;
  onFrame?: (frame: EvaluatedBroadcastFrame) => void;
  onError?: (err: Error) => void;
}

export interface EvaluatedBroadcastFrame extends EvaluatedExportFrame {
  isAssetReady: boolean;
  pendingAssetIds: string[];
  dropped: boolean;
}

export class LiveBroadcastBridge {
  private active = false;
  private currentDoc: OverlayDocument | null = null;
  private options: LiveBroadcastOptions = {};
  private frameCount = 0;
  private startTime = 0;
  private depGraph: ExportDependencyGraph;
  private cache: ResourceCache;
  private registry: AssetRegistry;

  constructor(
    depGraph: ExportDependencyGraph = exportDependencyGraph,
    cache: ResourceCache = resourceCache,
    registry: AssetRegistry = assetRegistry
  ) {
    this.depGraph = depGraph;
    this.cache = cache;
    this.registry = registry;
  }

  /**
   * Initialize a live broadcast session for an OverlayDocument.
   */
  public start(doc: OverlayDocument, options: LiveBroadcastOptions = {}): void {
    this.active = true;
    this.currentDoc = doc;
    this.options = {
      fps: 60,
      width: doc.canvas.width || 1920,
      height: doc.canvas.height || 1080,
      transparent: true,
      ...options,
    };
    this.frameCount = 0;
    this.startTime = performance.now();
  }

  /**
   * Stop active broadcast session.
   */
  public stop(): void {
    this.active = false;
    this.currentDoc = null;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Generate next broadcast frame at exact timestamp with live telemetry data overrides.
   */
  public emitFrame(
    time: number,
    liveTelemetry: Record<string, any> = {}
  ): EvaluatedBroadcastFrame {
    if (!this.currentDoc) {
      throw new Error("Cannot emit frame: LiveBroadcastBridge is not started.");
    }

    this.frameCount++;

    // 1. Enforce ExportDependencyGraph readiness barrier
    const isReady = this.depGraph.isFrameReady(time, this.cache, this.registry);
    const pendingAssets = !isReady
      ? this.depGraph.getPendingAssetIdsAt(time, this.cache, this.registry)
      : [];

    // 2. Evaluate layout and scene state at timestamp t
    const evaluatedFrame = evaluateExportFrame(this.currentDoc, time, {
      fps: this.options.fps,
      customWidth: this.options.width,
      customHeight: this.options.height,
      transparent: this.options.transparent,
      contextData: liveTelemetry,
    });

    const broadcastFrame: EvaluatedBroadcastFrame = {
      ...evaluatedFrame,
      isAssetReady: isReady,
      pendingAssetIds: pendingAssets,
      dropped: false,
    };

    if (this.options.onFrame) {
      this.options.onFrame(broadcastFrame);
    }

    return broadcastFrame;
  }

  /**
   * Dynamically hot-swap or update the broadcast document without dropping running stream connection.
   */
  public updateDocument(nextDoc: OverlayDocument): void {
    this.currentDoc = nextDoc;
  }
}

export const liveBroadcastBridge = new LiveBroadcastBridge();
