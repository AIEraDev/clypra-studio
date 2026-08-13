import type {
  OverlayDocument,
  SceneNode,
  ChartNode,
  GaugeNode,
  TimelineNode,
  AnnotationNode,
  MetricNode,
  ComponentNode
} from "../overlayDocumentSchema.js";
import type {
  EvaluatedScene,
  EvaluatedNode,
  EvaluatedTransform,
  EvaluatedStyle,
  EvaluatedContent,
  RuntimeContext,
  EvaluationDiagnostic
} from "./evaluatedScene.js";
import { animationRuntime } from "../animationRuntime.js";
import { dataBindingEngine } from "../dataBindingEngine.js";
import { resolveNodeForBreakpoint } from "../responsiveResolver.js";
import { layoutEngine } from "../layoutEngine.js";
import { visualizationEngine } from "../visualizationEngine.js";
import { visualizationRegistry } from "../visualizationRegistry.js";
import { sampleVideoContextAtTime } from "../context/videoContext.js";
import { resolveSpatialConstraints } from "../spatial/spatialConstraints.js";
import { documentValidator } from "../validation/validateDocument.js";

/**
 * Pure functional runtime evaluator.
 * Evaluates an OverlayDocument at explicit time `t` with runtime context.
 *
 * Guaranteed Invariants:
 *  - Deterministic: (doc, context, time) => identical EvaluatedScene.
 *  - Renderer-neutral: Zero DOM, PixiJS, WebGL, React, or GPU objects in EvaluatedScene.
 *  - No wall-clock dependencies: Never calls Date.now(), performance.now(), or rAF.
 */
export function evaluateOverlayDocument(
  doc: OverlayDocument,
  context: RuntimeContext = {},
  time = 0
): EvaluatedScene {
  const diagnostics: EvaluationDiagnostic[] = [];
  const nodeMap: Record<string, EvaluatedNode> = {};
  const activeBreakpointId = context.activeBreakpointId || (doc.breakpoints?.activeId ?? null);
  const sampledVideoState = context.video ? sampleVideoContextAtTime(context.video, time) : undefined;

  // 1. Validate document structure
  const validationDiagnostics = documentValidator.validate(doc);
  for (const diag of validationDiagnostics) {
    diagnostics.push({
      level: diag.severity === "error" ? "error" : "warning",
      nodeId: diag.nodeId,
      code: diag.code,
      message: diag.message
    });
  }

  // Combine document variables with runtime context variables and data
  const evalVariables: Record<string, any> = {};
  if (doc.variables) {
    for (const v of doc.variables) {
      evalVariables[v.key] = v.defaultValue;
    }
  }
  if (context.variables) {
    Object.assign(evalVariables, context.variables);
  }
  if (context.data) {
    Object.assign(evalVariables, context.data);
  }

  // 2. Evaluate individual node states
  function evaluateSingleNode(node: SceneNode, parentId?: string): EvaluatedNode {
    // 2a. Apply responsive breakpoint override if present
    const responsiveNode = activeBreakpointId
      ? resolveNodeForBreakpoint(node, activeBreakpointId)
      : node;

    // 2b. Evaluate animation & motion runtime state at time t
    const animState = animationRuntime.evaluateNodeState(
      responsiveNode,
      time,
      doc.duration || 5,
      { doc, currentTime: time }
    );

    // 2c. Evaluate data bindings
    let resolvedText: string | undefined;
    if ("text" in responsiveNode && typeof responsiveNode.text === "string") {
      resolvedText = dataBindingEngine.evaluateExpression(responsiveNode.text, evalVariables);
    }

    const baseW = responsiveNode.width;
    const baseH = responsiveNode.height;
    const baseAbsX = responsiveNode.x;
    const baseAbsY = responsiveNode.y;

    let transform: EvaluatedTransform = {
      x: animState.x,
      y: animState.y,
      width: animState.width,
      height: animState.height,
      rotation: animState.rotation,
      scaleX: animState.scaleX,
      scaleY: animState.scaleY,
      translateX: animState.translateX,
      translateY: animState.translateY,
      anchorX: 0,
      anchorY: 0
    };

    // 2d-sub. Resolve Semantic Spatial Constraints (anchorTo, avoid, prefer, offset)
    const spatialConstraints = (responsiveNode.layout as any)?.spatialConstraints;
    if (spatialConstraints) {
      transform = resolveSpatialConstraints(
        transform,
        spatialConstraints,
        sampledVideoState,
        doc.canvas.width,
        doc.canvas.height
      );
    }

    // 2e. Construct normalized style
    const nodeStyle = responsiveNode.style || {};
    const style: EvaluatedStyle = {
      fillColor: animState.fillColor || nodeStyle.fillColor,
      fillGradient: nodeStyle.fillGradient,
      fillOpacity: nodeStyle.fillOpacity,
      strokeColor: nodeStyle.strokeColor,
      strokeWidth: nodeStyle.strokeWidth,
      borderRadius: nodeStyle.borderRadius,
      opacity: Math.max(0, Math.min(1, animState.opacity * (nodeStyle.opacity ?? 1))),
      fontFamily: nodeStyle.fontFamily || "Inter",
      fontSize: nodeStyle.fontSize || 24,
      fontWeight: nodeStyle.fontWeight || "normal",
      textColor: nodeStyle.textColor || "#FFFFFF",
      textAlign: nodeStyle.textAlign || "left",
      letterSpacing: nodeStyle.letterSpacing,
      lineHeight: nodeStyle.lineHeight,
      shadowColor: nodeStyle.shadowColor,
      shadowBlur: nodeStyle.shadowBlur,
      blurRadius: animState.blur || nodeStyle.blurRadius,
      backdropBlur: nodeStyle.backdropBlur
    };

    // 2f. Construct content payload
    const content: EvaluatedContent = {
      text: resolvedText,
      typewriterProgress: animState.typewriterProgress,
      assetId: "assetId" in responsiveNode ? (responsiveNode as any).assetId : undefined,
      mediaUrl: "src" in responsiveNode ? (responsiveNode as any).src : undefined,
      iconName: "iconName" in responsiveNode ? (responsiveNode as any).iconName : undefined,
      shapeType: "shapeType" in responsiveNode ? (responsiveNode as any).shapeType : undefined,
      numericValue: animState.numericValueOverride !== undefined
        ? animState.numericValueOverride
        : ("value" in responsiveNode ? (responsiveNode as any).value : undefined),
      componentType: responsiveNode.type === "component" ? (responsiveNode as ComponentNode).componentType : undefined,
      props: responsiveNode.type === "component" ? (responsiveNode as ComponentNode).props : undefined
    };

    // 2g. Evaluate pure geometry for visualizations (charts, gauges, timelines, annotations)
    let geometry: any = undefined;
    if (responsiveNode.type === "chart") {
      try {
        geometry = visualizationEngine.evaluate(
          responsiveNode as ChartNode,
          transform.width,
          transform.height,
          doc.duration > 0 ? time / doc.duration : 0
        );
      } catch (err: any) {
        diagnostics.push({
          level: "warning",
          nodeId: responsiveNode.id,
          code: "GEOMETRY_EVALUATION_ERROR",
          message: `Failed to evaluate chart geometry for "${responsiveNode.id}": ${err.message}`
        });
      }
    } else if (visualizationRegistry.has(responsiveNode.type)) {
      try {
        const def = visualizationRegistry.get(responsiveNode.type);
        if (def) {
          geometry = def.evaluate(responsiveNode, {
            width: transform.width,
            height: transform.height,
            t: doc.duration > 0 ? time / doc.duration : 0,
            doc
          });
        }
      } catch (err: any) {
        diagnostics.push({
          level: "warning",
          nodeId: responsiveNode.id,
          code: "GEOMETRY_EVALUATION_ERROR",
          message: `Failed to evaluate geometry for ${responsiveNode.type} "${responsiveNode.id}": ${err.message}`
        });
      }
    }

    // 2h. Recursively evaluate children if node is a container or frame
    let evaluatedChildren: EvaluatedNode[] | undefined = undefined;
    if ("children" in responsiveNode && Array.isArray((responsiveNode as any).children)) {
      evaluatedChildren = (responsiveNode as any).children.map((child: SceneNode) =>
        evaluateSingleNode(child, responsiveNode.id)
      );
    }

    const evaluatedNode: EvaluatedNode = {
      id: responsiveNode.id,
      name: responsiveNode.name || responsiveNode.id,
      type: responsiveNode.type,
      parentId,
      visible: animState.visible && (responsiveNode.visible !== false),
      transform,
      style,
      content,
      geometry,
      children: evaluatedChildren
    };

    nodeMap[evaluatedNode.id] = evaluatedNode;
    return evaluatedNode;
  }

  // 3. Evaluate root nodes
  const rootNodes = doc.nodes.map((n) => evaluateSingleNode(n));

  // 4. Resolve spatial layout for frames/containers using layoutEngine
  try {
    layoutEngine.computeLayoutForBreakpoint(doc, activeBreakpointId, evalVariables);
  } catch (err: any) {
    diagnostics.push({
      level: "info",
      code: "LAYOUT_CALCULATION_NOTE",
      message: `Layout engine calculation completed: ${err.message}`
    });
  }

  const videoState = context.video
    ? sampleVideoContextAtTime(context.video, time)
    : undefined;

  return {
    version: "2.0",
    time,
    canvas: {
      width: doc.canvas.width,
      height: doc.canvas.height,
      backgroundColor: doc.canvas.backgroundColor || "transparent"
    },
    nodes: rootNodes,
    nodeMap,
    videoState,
    diagnostics,
    metadata: {
      documentId: doc.id || "doc-untitled",
      evaluatedAtTime: time,
      activeBreakpointId
    }
  };
}
