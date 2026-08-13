import { useEffect, useRef } from "react";
import {
  pixiSceneProjection,
  pixiSelectionOverlay,
  type OverlayDocument,
  type SceneNode
} from "@clypra-studio/engine";
import { usePixiRenderer } from "@clypra-studio/ui";
import type { Ticker } from "pixi.js";

/**
 * Wires the existing reusable PixiRenderer onto a canvas element for the Overlay Studio.
 *
 * Strategy:
 *   - usePixiRenderer handles the PixiApplication lifecycle, Strict Mode safety, WeakMap registry.
 *   - On init, we add pixiSceneProjection.rootContainer + pixiSelectionOverlay.overlayContainer
 *     to the PixiRenderer's overlay layer and start the ticker in live-preview mode.
 *   - The 60 FPS ticker reads from mutable refs — React state NEVER updates inside the loop.
 */
export function usePixiApp(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  doc: OverlayDocument,
  currentTime: number,
  selectedNode: SceneNode | null,
  hasReferenceVideo = false
) {
  const { width, height } = doc.canvas;

  // Mutable refs — React writes, rAF loop reads. Zero setState in the hot path.
  const docRef = useRef<OverlayDocument>(doc);
  const currentTimeRef = useRef<number>(currentTime);
  const selectedNodeRef = useRef<SceneNode | null>(selectedNode);
  const hasReferenceVideoRef = useRef<boolean>(hasReferenceVideo);

  docRef.current = doc;
  currentTimeRef.current = currentTime;
  selectedNodeRef.current = selectedNode;
  hasReferenceVideoRef.current = hasReferenceVideo;

  const rendererRef = usePixiRenderer(
    canvasRef,
    width,
    height,
    // onInit — called once by usePixiRenderer after PixiApplication is ready
    (renderer) => {
      const app = renderer.getApp();
      if (!app) return;

      // Add scene projection root and selection overlay into the PixiRenderer's overlay layer
      const overlayLayer = renderer.getOverlayContainer();
      if (overlayLayer) {
        // Scene projection root — sits inside the overlay layer
        overlayLayer.addChild(pixiSceneProjection.rootContainer);
        // Selection handles sit above the scene
        overlayLayer.addChild(pixiSelectionOverlay.overlayContainer);
      }

      // Start the ticker in live-preview mode (PixiRenderer inits with autoStart: false)
      app.ticker.start();

      // 60 FPS projection loop — reads mutable refs, never touches React
      app.ticker.add((_ticker: Ticker) => {
        try {
          pixiSceneProjection.project(
            docRef.current,
            currentTimeRef.current,
            {},
            { hasReferenceVideo: hasReferenceVideoRef.current }
          );

          const selNode = selectedNodeRef.current;
          if (selNode) {
            pixiSelectionOverlay.renderSelection(selNode, docRef.current);
          } else {
            pixiSelectionOverlay.clearSelection();
          }
        } catch (err) {
          // Prevent ticker loop from dying on transient context recovery
        }
      });
    }
  );

  return rendererRef;
}
