import { useEffect, useRef, useState } from "react";
import {
  evaluateOverlayDocument,
  type EvaluatedNode,
  type OverlayDocument,
} from "@clypra-studio/engine";
import type { NativeLabFrameRequest } from "../../../services/nativeLabClient";
import { getNativeLabClient } from "../../../services/nativeLabClient";

type NativeOverlayState = "probing" | "native" | "fallback";

function alpha(value: number | undefined, fallback = 1): number {
  if (value === undefined) return fallback;
  return value > 1 ? value / 100 : Math.max(0, Math.min(1, value));
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  node: EvaluatedNode,
  text: string,
) {
  const style = node.style;
  const size = style.fontSize ?? 20;
  const weight = style.fontWeight ?? "400";
  const family = style.fontFamily ?? "Inter, sans-serif";
  const lineHeight = (style.lineHeight ?? 1.2) * size;
  const maxWidth = Math.max(1, node.transform.width);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line || !lines.length) lines.push(line);
  const maxLines = (style as EvaluatedStyleWithExtras).maxLines;
  const visibleLines = maxLines ? lines.slice(0, maxLines) : lines;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = style.textColor ?? style.fillColor ?? "#ffffff";
  ctx.textAlign = style.textAlign ?? "left";
  ctx.textBaseline = "top";
  const x =
    style.textAlign === "center"
      ? maxWidth / 2
      : style.textAlign === "right"
      ? maxWidth
      : 0;
  visibleLines.forEach((value, index) =>
    ctx.fillText(value, x, index * lineHeight, maxWidth),
  );
}

type EvaluatedStyleWithExtras = EvaluatedNode["style"] & { maxLines?: number };

function drawEvaluatedNode(ctx: CanvasRenderingContext2D, node: EvaluatedNode) {
  if (!node.visible || node.style.opacity <= 0.001) return;
  const { x, y, width, height, rotation, scaleX, scaleY } = node.transform;
  const style = node.style;
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scaleX || 1, scaleY || 1);
  ctx.globalAlpha *= alpha(style.opacity);
  if (style.shadowColor || style.shadowBlur) {
    ctx.shadowColor = style.shadowColor ?? "rgba(0,0,0,0.5)";
    ctx.shadowBlur = style.shadowBlur ?? 0;
  }
  ctx.translate(-width / 2, -height / 2);

  const fill =
    style.fillColor ?? (node.type === "shape" ? "#334155" : undefined);
  const fillOpacity = alpha(style.fillOpacity);
  if (style.fillGradient?.colors?.length) {
    const gradient =
      style.fillGradient.type === "radial"
        ? ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            Math.max(width, height) / 2,
          )
        : ctx.createLinearGradient(0, 0, width, height);
    style.fillGradient.colors.forEach((color, index) =>
      gradient.addColorStop(
        index / Math.max(1, style.fillGradient!.colors.length - 1),
        color,
      ),
    );
    ctx.fillStyle = gradient;
    ctx.globalAlpha *= fillOpacity;
    roundedRect(ctx, 0, 0, width, height, style.borderRadius ?? 0);
    ctx.fill();
    ctx.globalAlpha /= Math.max(0.001, fillOpacity);
  } else if (fill) {
    ctx.fillStyle = fill;
    ctx.globalAlpha *= fillOpacity;
    roundedRect(ctx, 0, 0, width, height, style.borderRadius ?? 0);
    ctx.fill();
    ctx.globalAlpha /= Math.max(0.001, fillOpacity);
  }

  if (style.strokeColor && (style.strokeWidth ?? 0) > 0) {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth ?? 1;
    roundedRect(ctx, 0, 0, width, height, style.borderRadius ?? 0);
    ctx.stroke();
  }

  if (
    node.type === "text" ||
    node.type === "rich-text" ||
    node.type === "metric" ||
    node.type === "callout" ||
    node.type === "annotation"
  ) {
    const content =
      node.content?.text ??
      node.content?.formattedValue ??
      node.content?.props?.body ??
      node.content?.props?.label ??
      "";
    if (content) drawText(ctx, node, content);
  } else if (
    node.type === "line" ||
    node.type === "divider" ||
    node.type === "connector"
  ) {
    ctx.strokeStyle = style.strokeColor ?? "#94a3b8";
    ctx.lineWidth = style.strokeWidth ?? 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  } else if (
    node.type === "media" ||
    node.type === "video" ||
    node.type === "lottie"
  ) {
    ctx.fillStyle = "rgba(30,41,59,0.65)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(148,163,184,0.65)";
    ctx.strokeRect(4, 4, Math.max(0, width - 8), Math.max(0, height - 8));
  }

  ctx.restore();
  node.children?.forEach((child) => drawEvaluatedNode(ctx, child));
}

function rasterizeDocument(
  doc: OverlayDocument,
  currentTime: number,
  hasReferenceVideo: boolean,
  canvas: HTMLCanvasElement,
): ImageData {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx)
    throw new Error("Overlay native bridge could not create a raster context");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  if (
    !hasReferenceVideo &&
    scene.canvas.backgroundColor &&
    scene.canvas.backgroundColor !== "transparent"
  ) {
    ctx.fillStyle = scene.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  scene.nodes.forEach((node) => drawEvaluatedNode(ctx, node));
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
    getNativeLabClient()
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
            contractVersion: 1,
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
          void getNativeLabClient()
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
