/**
 * Phase 4K — Deterministic Frame Pipeline
 *
 * Runs the exact engine evaluation pass for a given time t:
 *   Document → Responsive Resolution → Asset Resolution → Layout Engine → Animation Runtime → EvaluatedSceneState
 *
 * Guaranteed byte-for-byte identical output for identical time inputs.
 * The editor preview and export pipeline consume this exact same evaluation flow.
 */

import type { OverlayDocument } from "../overlayDocumentSchema.js";
import { resolveDocumentForBreakpoint } from "../responsiveResolver.js";
import { runtimeAssetResolver } from "../assets/runtimeAssetResolver.js";
import { layoutEngine } from "../layoutEngine.js";
import { animationRuntime } from "../animationRuntime.js";
import {
  EXPORT_PROFILE_PRESETS,
  type ExportConfig,
  type EvaluatedExportFrame,
} from "./exportTypes.js";

/**
 * Resolve target canvas dimensions based on ExportConfig profile and scale.
 */
export function resolveExportCanvasDimensions(
  doc: OverlayDocument,
  config: Partial<ExportConfig> = {}
): { width: number; height: number } {
  const profile = config.profile ?? "custom";
  const scale = config.scale ?? 1.0;

  let baseW: number;
  let baseH: number;

  if (profile !== "custom" && EXPORT_PROFILE_PRESETS[profile]) {
    baseW = EXPORT_PROFILE_PRESETS[profile].width;
    baseH = EXPORT_PROFILE_PRESETS[profile].height;
  } else if (config.customWidth && config.customHeight) {
    baseW = config.customWidth;
    baseH = config.customHeight;
  } else {
    // Fall back to document canvas
    baseW = doc.canvas.width;
    baseH = doc.canvas.height;
  }

  return {
    width: Math.round(baseW * scale),
    height: Math.round(baseH * scale),
  };
}

/**
 * Evaluates a single export frame at time t.
 * Pure deterministic pass — returns resolved document, auto-layout bounds,
 * and evaluated scene state.
 */
export function evaluateExportFrame(
  doc: OverlayDocument,
  time: number,
  config: Partial<ExportConfig> = {}
): EvaluatedExportFrame {
  const breakpointId = config.breakpointId ?? doc.breakpoints?.activeId ?? null;
  const contextData = config.contextData ?? {};

  // 1. Responsive Resolution Pass
  let resolvedDoc = resolveDocumentForBreakpoint(doc, breakpointId);

  // 2. Resolve Export Dimensions
  const targetDims = resolveExportCanvasDimensions(resolvedDoc, config);
  if (config.profile && config.profile !== "custom") {
    resolvedDoc = {
      ...resolvedDoc,
      canvas: {
        ...resolvedDoc.canvas,
        width: targetDims.width,
        height: targetDims.height,
      },
    };
  }

  // 3. Asset Resolution (pre-warm)
  runtimeAssetResolver.warmDocument(resolvedDoc);

  // 4. Auto-Layout Pass
  const layoutState = layoutEngine.computeLayout(resolvedDoc, contextData);

  // 5. Animation Runtime Pass
  const evaluatedSceneState = animationRuntime.evaluateScene(resolvedDoc, {
    currentTime: time,
  });

  return {
    frameIndex: Math.round(time * (config.fps ?? 30)),
    time,
    resolvedDoc,
    layoutState,
    evaluatedSceneState,
    canvasWidth: targetDims.width,
    canvasHeight: targetDims.height,
  };
}
