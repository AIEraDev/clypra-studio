import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  type OverlayDocument,
  type DocumentCommand,
  CommandHistory,
  documentValidator,
  documentMigrator
} from "@clypra-studio/engine";

const DRAFT_STORAGE_KEY = "clypra_studio_active_project_draft_v2";

const createDefaultDoc = (): OverlayDocument => ({
  id: `custom-doc-${Date.now().toString(36)}`,
  version: "2.0",
  title: "Untitled Smart Overlay",
  category: "custom",
  canvas: {
    width: 1280,
    height: 720,
    backgroundColor: "#12121A"
  },
  variables: [],
  nodes: [],
  duration: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export function useOverlayDocument(initialDoc?: OverlayDocument) {
  const [doc, setDoc] = useState<OverlayDocument>(() => {
    if (initialDoc) {
      return documentMigrator.migrate(initialDoc);
    }
    // Attempt to resume from local auto-save draft
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const targetDoc = parsed.document || parsed;
        if (targetDoc && typeof targetDoc === "object" && (targetDoc.nodes || targetDoc.canvas)) {
          return documentMigrator.migrate(targetDoc);
        }
      }
    } catch {}
    return createDefaultDoc();
  });

  const historyRef = useRef<CommandHistory>(new CommandHistory({ maxSize: 50 }));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  // Auto-save draft on every modification
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(doc));
      setLastSavedTime(new Date());
    } catch {}
  }, [doc]);

  /**
   * Dispatch a transactional command
   */
  const executeCommand = useCallback(
    (command: DocumentCommand) => {
      setDoc((prevDoc) => {
        const nextDoc = historyRef.current.execute(prevDoc, command);
        updateHistoryState();
        return nextDoc;
      });
    },
    [updateHistoryState]
  );

  /**
   * Undo last command
   */
  const undo = useCallback(() => {
    setDoc((prevDoc) => {
      const nextDoc = historyRef.current.undo(prevDoc);
      updateHistoryState();
      return nextDoc;
    });
  }, [updateHistoryState]);

  /**
   * Redo last command
   */
  const redo = useCallback(() => {
    setDoc((prevDoc) => {
      const nextDoc = historyRef.current.redo(prevDoc);
      updateHistoryState();
      return nextDoc;
    });
  }, [updateHistoryState]);

  /**
   * Load an external document into the editor
   */
  const loadDocument = useCallback(
    (newDoc: OverlayDocument) => {
      const migrated = documentMigrator.migrate(newDoc);
      historyRef.current.clear();
      updateHistoryState();
      setDoc(migrated);
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(migrated));
        setLastSavedTime(new Date());
      } catch {}
    },
    [updateHistoryState]
  );

  /**
   * Start a new clean document
   */
  const newDocument = useCallback(() => {
    const fresh = createDefaultDoc();
    historyRef.current.clear();
    updateHistoryState();
    setDoc(fresh);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fresh));
      setLastSavedTime(new Date());
    } catch {}
  }, [updateHistoryState]);

  /**
   * Lint diagnostics
   */
  const diagnostics = useMemo(() => documentValidator.validate(doc), [doc]);

  return {
    doc,
    setDoc,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    loadDocument,
    newDocument,
    lastSavedTime,
    diagnostics
  };
}
