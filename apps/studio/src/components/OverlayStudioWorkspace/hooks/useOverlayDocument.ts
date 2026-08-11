import { useState, useCallback, useRef, useMemo } from "react";
import {
  type OverlayDocument,
  type DocumentCommand,
  CommandHistory,
  documentValidator,
  documentMigrator
} from "@clypra-studio/engine";

const initialDefaultDoc: OverlayDocument = {
  id: "custom-doc-scratch",
  version: "2.0",
  title: "Revenue Growth Overlay",
  category: "stat",
  canvas: {
    width: 1280,
    height: 720,
    backgroundColor: "#12121A"
  },
  variables: [
    { key: "revenue", type: "string", defaultValue: "+142%", label: "Revenue Growth" },
    { key: "label", type: "string", defaultValue: "User Growth & Engagement", label: "Metric Title" },
    { key: "delta", type: "string", defaultValue: "+15% YoY", label: "Delta Badge" }
  ],
  nodes: [
    {
      id: "stat-main",
      name: "Revenue Stat Card",
      type: "component",
      componentType: "stat-card",
      x: 320,
      y: 220,
      width: 640,
      height: 280,
      props: {
        value: "{{revenue}}",
        label: "{{label}}",
        delta: "{{delta}}",
        accentColor: "#7C6FFF",
        cardBackground: "#12121A",
        cardBorder: "#2A2A38"
      },
      animation: {
        entrance: { type: "scale", duration: 0.5, easing: "ease-out" }
      }
    }
  ],
  duration: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function useOverlayDocument(initialDoc?: OverlayDocument) {
  const [doc, setDoc] = useState<OverlayDocument>(() =>
    initialDoc ? documentMigrator.migrate(initialDoc) : initialDefaultDoc
  );

  const historyRef = useRef<CommandHistory>(new CommandHistory({ maxSize: 50 }));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

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
    diagnostics
  };
}
