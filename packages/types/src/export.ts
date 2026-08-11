/**
 * @clypra-studio/types — Production Export & Media Encoding Contract Types
 *
 * Shared export contract types across engine, studio UI, background workers, and encoders.
 */

import type { OverlayDocument } from "./overlay.js";

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
  layoutState: any;
  evaluatedSceneState: any;
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
