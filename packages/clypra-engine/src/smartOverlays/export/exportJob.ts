/**
 * Phase 4K / 4L / 4M — ExportJob Controller
 *
 * Stateful, decoupled job orchestrator managing document snapshotting, preflight validation,
 * streaming frame rendering, media encoding, status differentiation, and AbortSignal cancellation.
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import { exportValidator } from "./exportValidator.js";
import { streamExportFrames, ExportAbortError } from "./streamingFramePipeline.js";
import { mediaEncoderRegistry } from "./mediaEncoder.js";
import type {
  ExportConfig,
  JobStatus,
  ExportProgress,
  ExportValidationDiagnostic,
  EncodedOutput,
  ExportJobRecord,
} from "./exportTypes.js";

function nanoid6(): string {
  return Math.random().toString(36).slice(2, 8);
}

export type JobChangeListener = (job: ExportJob) => void;

export class ExportJob {
  public id: string;
  public doc: OverlayDocument;
  /** Immutable document snapshot captured at job creation time */
  public docSnapshot: OverlayDocument;
  public config: ExportConfig;
  public status: JobStatus = "queued";
  public progress: ExportProgress;
  public diagnostics: ExportValidationDiagnostic[] = [];
  public output?: EncodedOutput;
  public error?: string;
  public createdAt: string;
  public completedAt?: string;
  public retryCount = 0;

  private abortController = new AbortController();
  private listeners = new Set<JobChangeListener>();

  constructor(doc: OverlayDocument, config: ExportConfig) {
    this.id = `job-${nanoid6()}`;
    this.doc = doc;
    // Snapshot isolation: deep clone doc to freeze state at job creation time
    this.docSnapshot = JSON.parse(JSON.stringify(doc));
    this.config = config;
    this.createdAt = new Date().toISOString();
    this.progress = {
      stage: "queued",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: Math.max(1, Math.ceil((config.duration ?? doc.duration ?? 5) * (config.fps ?? 30))),
      percent: 0,
      currentTime: 0,
    };
  }

  public subscribe(listener: JobChangeListener): () => void {
    this.listeners.add(listener);
    listener(this);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        // Suppress listener errors
      }
    }
  }

  /**
   * Run preflight validation on the captured document snapshot.
   * Returns true if export is allowed (zero error diagnostics).
   */
  public validate(): boolean {
    this.status = "validating";
    this.progress.stage = "validating";
    this.diagnostics = exportValidator.validate(this.docSnapshot, this.config);
    this.notify();

    const hasErrors = this.diagnostics.some((d) => d.severity === "error");
    return !hasErrors;
  }

  /**
   * Start executing the export job using docSnapshot.
   * Preflight errors block execution; warnings permit execution with advisory.
   */
  public async start(): Promise<EncodedOutput> {
    const isAllowed = this.validate();
    if (!isAllowed) {
      this.status = "failed";
      this.progress.stage = "failed";
      this.error = "Preflight validation failed with errors.";
      this.completedAt = new Date().toISOString();
      this.output = undefined;
      this.notify();
      throw new Error(this.error);
    }

    try {
      this.status = "rendering";
      this.progress.stage = "rendering";
      this.notify();

      const signal = this.abortController.signal;
      const frameStream = streamExportFrames(this.docSnapshot, this.config, signal);
      const encoder = mediaEncoderRegistry.get(this.config.format ?? "png-sequence");

      this.status = "encoding";
      this.progress.stage = "encoding";
      this.notify();

      const output = await encoder.encode(frameStream, this.config, signal, (p) => {
        this.progress = { ...p, stage: this.status === "rendering" ? "rendering" : "encoding" };
        this.notify();
      });

      if (signal.aborted) {
        throw new ExportAbortError();
      }

      const hasWarnings = this.diagnostics.some((d) => d.severity === "warning");
      this.output = output;
      this.status = hasWarnings ? "completed-with-warnings" : "completed";
      this.progress.stage = this.status;
      this.progress.percent = 100;
      this.completedAt = new Date().toISOString();
      this.notify();

      return output;
    } catch (err: any) {
      this.output = undefined; // Partial output cleanup
      if (err instanceof ExportAbortError || err.name === "ExportAbortError" || this.abortController.signal.aborted) {
        this.status = "cancelled";
        this.progress.stage = "cancelled";
        this.error = "Export job was cancelled by user.";
      } else {
        this.status = "failed";
        this.progress.stage = "failed";
        this.error = err.message || "Export processing error";
      }
      this.completedAt = new Date().toISOString();
      this.notify();
      throw err;
    }
  }

  /**
   * Retry executing a failed or cancelled export job using the document snapshot.
   */
  public async retry(): Promise<EncodedOutput> {
    this.retryCount += 1;
    this.abortController = new AbortController();
    this.status = "queued";
    this.error = undefined;
    this.output = undefined;
    this.progress = {
      stage: "queued",
      renderedFrames: 0,
      encodedFrames: 0,
      totalFrames: Math.max(1, Math.ceil((this.config.duration ?? this.docSnapshot.duration ?? 5) * (this.config.fps ?? 30))),
      percent: 0,
      currentTime: 0,
    };
    return this.start();
  }

  /**
   * Cancel job execution immediately via AbortSignal.
   */
  public cancel(): void {
    if (this.status === "completed" || this.status === "completed-with-warnings" || this.status === "failed" || this.status === "cancelled") {
      return;
    }
    this.abortController.abort();
    this.output = undefined;
    this.status = "cancelled";
    this.progress.stage = "cancelled";
    this.error = "Export job was cancelled by user.";
    this.completedAt = new Date().toISOString();
    this.notify();
  }

  public toRecord(): ExportJobRecord {
    return {
      id: this.id,
      documentId: this.docSnapshot.id,
      documentTitle: this.docSnapshot.title,
      config: this.config,
      status: this.status,
      progress: { ...this.progress },
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      output: this.output,
      diagnostics: [...this.diagnostics],
      error: this.error,
      retryCount: this.retryCount,
      docSnapshot: this.docSnapshot,
    };
  }
}
