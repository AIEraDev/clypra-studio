import { useEffect, useRef, useState } from "react";
import {
  evaluateOverlayDocument,
  renderEvaluatedSceneToCanvas,
  type OverlayDocument,
} from "@clypra-studio/engine";
import type { NativeLabFrameRequest } from "../../../services/nativeRenderClient";
import { getNativeRenderClient, NATIVE_RENDER_CONTRACT_VERSION } from "../../../services/nativeRenderClient";

type NativeOverlayState = "probing" | "native" | "fallback";

function rasterizeDocument(
  doc: OverlayDocument,
  currentTime: number,
  hasReferenceVideo: boolean,
  canvas: HTMLCanvasElement,
): ImageData {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx)
    throw new Error("Overlay native bridge could not create a raster context");
  const scene = evaluateOverlayDocument(
    doc,
    {
      variables: Object.fromEntries(
        doc.variables.map((variable) => [variable.key, variable.defaultValue]),
      ),
      activeBreakpointId: doc.breakpoints?.activeId,
    },
    currentTime,
  );
  renderEvaluatedSceneToCanvas(scene, ctx, {
    background: !hasReferenceVideo,
  });
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function useNativeOverlayApp(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  doc: OverlayDocument,
  currentTime: number,
  hasReferenceVideo = false,
): NativeOverlayState {
  const [state, setState] = useState<NativeOverlayState>("probing");
  const docRef = useRef(doc);
  const timeRef = useRef(currentTime);
  const referenceRef = useRef(hasReferenceVideo);
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef("");
  const revisionRef = useRef("");

  docRef.current = doc;
  timeRef.current = currentTime;
  referenceRef.current = hasReferenceVideo;
  // updatedAt is not guaranteed to change for every drag/resize mutation, so
  // include the declarative node graph in the cache key. This keeps the native
  // preview and Canvas2D fallback invalidated by the same document revision.
  revisionRef.current = `${doc.id}:${doc.schemaVersion ?? 0}:${
    doc.updatedAt
  }:${JSON.stringify(doc.nodes)}`;

  useEffect(() => {
    let cancelled = false;
    getNativeRenderClient()
      .handshake()
      .then((handshake) => {
        if (cancelled) return;
        setState(
          handshake.gpu.available && handshake.gpu.state === "ready"
            ? "native"
            : "fallback",
        );
      })
      .catch(() => {
        if (!cancelled) setState("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raster = document.createElement("canvas");
    raster.width = doc.canvas.width;
    raster.height = doc.canvas.height;
    let frameId = 0;
    let disposed = false;

    const render = () => {
      const currentDoc = docRef.current;
      const time = timeRef.current;
      const revision = revisionRef.current;
      const key = `${revision}:${time.toFixed(4)}:${referenceRef.current}`;
      if (!inFlightRef.current && lastKeyRef.current !== key) {
        try {
          const pixels = rasterizeDocument(
            currentDoc,
            time,
            referenceRef.current,
            raster,
          );
          const request: NativeLabFrameRequest = {
            contractVersion: NATIVE_RENDER_CONTRACT_VERSION,
            requestId: `studio-overlay:${Date.now()}`,
            frameTime: {
              frameIndex: Math.floor(time * 60),
              ticks: Math.floor(time * 1_000_000),
              timescale: 1_000_000,
            },
            project: {
              schemaVersion: 1,
              projectRevision: revision,
              canvasWidth: raster.width,
              canvasHeight: raster.height,
              clearColor: [0, 0, 0, 0],
              videoLayers: [],
              rasterLayers: [
                {
                  assetId: "studio-overlay-raster",
                  rgba: Array.from(pixels.data),
                  width: raster.width,
                  height: raster.height,
                  x: 0,
                  y: 0,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 0,
                  blendMode: "normal",
                },
              ],
              transition: null,
            },
            outputWidth: canvas.width,
            outputHeight: canvas.height,
            quality: "full",
            colorPolicy: {
              version: 1,
              workingSpace: "linear-rec709",
              outputFormat: "rgba8Srgb",
              toneMapHdrToSdr: true,
              displayProfile: "srgb-reference",
            },
            renderGraphVersion: 1,
          };
          inFlightRef.current = true;
          void getNativeRenderClient()
            .renderFrame(request)
            .then(async (result) => {
              if (disposed) return;
              const bitmap = await createImageBitmap(result.image);
              const output = canvas.getContext("2d");
              if (output) {
                output.clearRect(0, 0, canvas.width, canvas.height);
                output.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
              }
              bitmap.close();
              lastKeyRef.current = key;
              setState("native");
            })
            .catch(() => {
              if (disposed) return;
              const output = canvas.getContext("2d");
              if (output)
                output.drawImage(raster, 0, 0, canvas.width, canvas.height);
              setState("fallback");
            })
            .finally(() => {
              inFlightRef.current = false;
            });
        } catch {
          const output = canvas.getContext("2d");
          if (output)
            output.drawImage(raster, 0, 0, canvas.width, canvas.height);
          setState("fallback");
        }
      }
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
    };
  }, [
    canvasRef,
    doc.canvas.height,
    doc.canvas.width,
    doc.id,
    doc.nodes.length,
    doc.schemaVersion,
    doc.updatedAt,
  ]);

  return state;
}
