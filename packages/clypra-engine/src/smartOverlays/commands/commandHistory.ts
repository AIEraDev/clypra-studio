import type { OverlayDocument } from "../overlayDocumentSchema.js";
import type { DocumentCommand } from "./commandTypes.js";
import { commandExecutor } from "./commandExecutor.js";

export interface CommandHistoryOptions {
  maxSize?: number;
}

export class CommandHistory {
  private past: DocumentCommand[] = [];
  private future: DocumentCommand[] = [];
  private maxSize: number;

  constructor(options: CommandHistoryOptions = {}) {
    this.maxSize = options.maxSize || 50;
  }

  public execute(doc: OverlayDocument, command: DocumentCommand): OverlayDocument {
    const { nextDocument, inverseCommand } = commandExecutor.execute(doc, command);

    this.past.push(inverseCommand);
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
    this.future = []; // Clear redo stack on new command execution

    return nextDocument;
  }

  public undo(doc: OverlayDocument): OverlayDocument {
    if (this.past.length === 0) return doc;

    const inverseCmd = this.past.pop()!;
    const { nextDocument, inverseCommand: redoCmd } = commandExecutor.execute(doc, inverseCmd);

    this.future.push(redoCmd);
    return nextDocument;
  }

  public redo(doc: OverlayDocument): OverlayDocument {
    if (this.future.length === 0) return doc;

    const redoCmd = this.future.pop()!;
    const { nextDocument, inverseCommand: undoCmd } = commandExecutor.execute(doc, redoCmd);

    this.past.push(undoCmd);
    return nextDocument;
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public clear(): void {
    this.past = [];
    this.future = [];
  }
}
