/**
 * Phase 4K / 4L / 4M — Production Export & Rendering Pipeline Types
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import type { LayoutComputedState } from "../layoutEngine.js";
import type { EvaluatedSceneState } from "../animationRuntime.js";

export type ExportProfile =
  | "720p-landscape"
  | "1080p-landscape"
  | "1080p-portrait"
  | "1080p-square"
  | "4:5-portrait"
  | "custom";

export interface ProfileCanvasDimensions {
  width: number;
  height: number;
}

export const EXPORT_PROFILE_PRESETS: Record<Exclude<ExportProfile, "custom">, ProfileCanvasDimensions> = {
  "720p-landscape": { width: 1280, height: 720 },
  "1080p-landscape": { width: 1920, height: 1080 },
  "1080p-portrait": { width: 1080, height: 1920 },
  "1080p-square": { width: 1080, height: 1080 },
  "4:5-portrait": { width: 1080, height: 1350 },
};

export type ExportFormat = "png-sequence" | "webm" | "gif" | "raw-frames";

export interface ExportConfig {
  profile: ExportProfile;
  /** Breakpoint ID for responsive resolution. null = base document canvas */
  breakpointId?: string | null;
  /** Target resolution width when profile === 'custom' */
  customWidth?: number;
  /** Target resolution height when profile === 'custom' */
  customHeight?: number;
  /** Resolution multiplier (e.g. 1.0 = 100%, 2.0 = 200% super-sampled) */
  scale?: number;
  /** Frames per second for sequence stepping */
  fps?: number;
  /** Duration override in seconds. Defaults to document duration */
  duration?: number;
  /** If true, background color is cleared to transparent (RGBA alpha = 0) */
  transparent?: boolean;
  /** Target export output format */
  format?: ExportFormat;
  /** Context data overrides for variable evaluation during export */
  contextData?: Record<string, any>;
}

export type ExportDiagnosticSeverity = "error" | "warning" | "info";

export type ExportDiagnosticCode =
  | "MISSING_ASSET"
  | "MISSING_FONT"
  | "INVALID_BINDING"
  | "DURATION_OVERFLOW"
  | "UNRESOLVED_CONSTRAINTS"
  | "SUBPIXEL_DIMENSIONS"
  | "NON_STANDARD_FPS"
  | "RENDERER_FAILURE"
  | "CORS_TAINT_WARNING"
  | "REMOTE_ASSET_TIMEOUT"
  | "SNAPSHOT_ISOLATION_ERROR";

export interface ExportValidationDiagnostic {
  severity: ExportDiagnosticSeverity;
  code: ExportDiagnosticCode;
  nodeId?: string;
  message: string;
  details?: Record<string, any>;
}

export interface EvaluatedExportFrame {
  frameIndex: number;
  time: number;
  resolvedDoc: OverlayDocument;
  layoutState: LayoutComputedState;
  evaluatedSceneState: EvaluatedSceneState;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ExportFrameDescriptor {
  frameIndex: number;
  time: number;
  width: number;
  height: number;
  dataUrl?: string;
  blob?: Blob;
  imageData?: ImageData;
}

export interface ExportProgress {
  stage:
    | "queued"
    | "validating"
    | "rendering"
    | "encoding"
    | "completed"
    | "completed-with-warnings"
    | "cancelled"
    | "failed";
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
  percent: number;
  currentTime: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Phase 4L / 4M Job & Encoder Types
// ---------------------------------------------------------------------------

export type JobStatus =
  | "queued"
  | "validating"
  | "rendering"
  | "encoding"
  | "completed"
  | "completed-with-warnings"
  | "cancelled"
  | "failed";

export interface EncodedFileEntry {
  name: string;
  blob: Blob;
}

export interface EncodedOutput {
  format: ExportFormat;
  blob?: Blob;
  dataUrl?: string;
  files?: EncodedFileEntry[];
  frameCount: number;
  sizeBytes?: number;
}

export interface MediaEncoder {
  format: ExportFormat;
  encode(
    frames: AsyncIterable<EvaluatedExportFrame>,
    config: ExportConfig,
    signal?: AbortSignal,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<EncodedOutput>;
}

export interface ExportJobRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  config: ExportConfig;
  status: JobStatus;
  progress: ExportProgress;
  createdAt: string;
  completedAt?: string;
  output?: EncodedOutput;
  diagnostics: ExportValidationDiagnostic[];
  error?: string;
  retryCount?: number;
  docSnapshot?: OverlayDocument;
}
