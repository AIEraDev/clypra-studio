import {
  Container,
  Text as PixiText,
  Graphics as PixiGraphics,
  TextStyle,
  BlurFilter,
  type ColorSource,
} from "pixi.js";
import type { OverlayDocument, SceneNode, ComponentNode } from "./overlayDocumentSchema.js";
import { evaluateOverlayDocument } from "./runtime/evaluator.js";
import type { EvaluatedScene, EvaluatedNode } from "./runtime/evaluatedScene.js";
import { dataBindingEngine } from "./dataBindingEngine.js";
import { animationRuntime } from "./animationRuntime.js";
import { componentRegistry } from "./componentRegistry.js";
import { runtimeAssetResolver } from "./assets/runtimeAssetResolver.js";
import { visualizationEngine } from "./visualizationEngine.js";
import { visualizationRegistry } from "./visualizationRegistry.js";
import { visualizationRendererRegistry } from "./visualizationProjection.js";
import { layoutEngine, type LayoutComputedState } from "./layoutEngine.js";
import "./gaugeVisualization.js";
import "./timelineVisualization.js";
import "./annotationVisualization.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToNumber(hex: string | undefined, fallback = 0x1e1e28): number {
  if (!hex) return fallback;
  const clean = hex.replace("#", "");
  const val = parseInt(clean, 16);
  return isNaN(val) ? fallback : val;
}

function resolveAlpha(opacity: number | undefined, fallback = 1): number {
  if (opacity === undefined) return fallback;
  // Treat values > 1 as percentage (0-100)
  return opacity > 1 ? opacity / 100 : opacity;
}

// ---------------------------------------------------------------------------
// PixiSceneProjection
// ---------------------------------------------------------------------------

export class PixiSceneProjection {
  public rootContainer: Container;
  private nodeMap = new Map<string, Container>();

  constructor() {
    this.rootContainer = new Container();
    this.rootContainer.label = "OverlayDocumentRoot";
  }

  /**
   * Sync and project an OverlayDocument onto PixiJS display tree at currentTime.
   * Evaluates document via evaluateOverlayDocument to maintain single semantic runtime authority.
   */
  public project(
    doc: OverlayDocument,
    currentTime: number,
    contextData: Record<string, any> = {},
    /** Optional ephemeral preview overrides — never persisted to the document */
    previewContext: Record<string, any> = {}
  ): Container {
    const fullContext = {
      ...doc.variables.reduce((acc, v) => ({ ...acc, [v.key]: v.defaultValue }), {}),
      ...contextData,
      ...previewContext,
    };

    // Single Runtime Evaluator Authority — evaluate doc at explicit currentTime t
    const evaluatedScene = evaluateOverlayDocument(
      doc,
      { variables: fullContext, activeBreakpointId: doc.breakpoints?.activeId },
      currentTime
    );

    return this.projectEvaluatedScene(evaluatedScene, doc, currentTime, fullContext);
  }

  /**
   * Directly project a renderer-neutral EvaluatedScene onto PixiJS display objects.
   */
  public projectEvaluatedScene(
    evaluatedScene: EvaluatedScene,
    doc?: OverlayDocument,
    currentTime = 0,
    context: Record<string, any> = {}
  ): Container {
    // Clear stale containers if document ID changed
    if (this.rootContainer.label !== `OverlayDoc-${evaluatedScene.metadata.documentId}`) {
      this.rootContainer.removeChildren();
      this.nodeMap.clear();
      this.rootContainer.label = `OverlayDoc-${evaluatedScene.metadata.documentId}`;
    }

    // Render Canvas Backdrop
    if (
      evaluatedScene.canvas.backgroundColor &&
      evaluatedScene.canvas.backgroundColor !== "transparent" &&
      !context.hasReferenceVideo &&
      !context.hideCanvasBackground
    ) {
      let bgGraphics = this.rootContainer.getChildByLabel("CanvasBackground") as PixiGraphics;
      if (!bgGraphics) {
        bgGraphics = new PixiGraphics();
        bgGraphics.label = "CanvasBackground";
        this.rootContainer.addChildAt(bgGraphics, 0);
      }
      bgGraphics.clear();
      bgGraphics.rect(0, 0, evaluatedScene.canvas.width, evaluatedScene.canvas.height);
      bgGraphics.fill({ color: evaluatedScene.canvas.backgroundColor });
    } else {
      let bgGraphics = this.rootContainer.getChildByLabel("CanvasBackground") as PixiGraphics;
      if (bgGraphics) {
        bgGraphics.clear();
      }
    }

    // Project root nodes
    if (doc) {
      const activeNodeIds = new Set<string>();
      const collectNodeIds = (nodes: SceneNode[]) => {
        for (const n of nodes) {
          activeNodeIds.add(n.id);
          if ("children" in n && Array.isArray((n as any).children)) {
            collectNodeIds((n as any).children);
          }
          if (n.type === "repeater") {
            const expanded = dataBindingEngine.expandRepeater(n as any, context);
            for (const child of expanded) {
              activeNodeIds.add(child.id);
            }
          }
        }
      };
      collectNodeIds(doc.nodes);

      // Clean up removed / stale nodes from previous frames (e.g. on Undo / Redo / Delete)
      for (const [nodeId, container] of Array.from(this.nodeMap.entries())) {
        if (!activeNodeIds.has(nodeId)) {
          if (container.parent) {
            container.parent.removeChild(container);
          }
          try {
            container.destroy({ children: true });
          } catch {}
          this.nodeMap.delete(nodeId);
        }
      }

      const computedLayout = layoutEngine.computeLayout(doc, context);

      for (let i = 0; i < doc.nodes.length; i++) {
        this.projectNode(
          doc.nodes[i],
          this.rootContainer,
          doc,
          currentTime,
          context,
          0,
          i,
          null,
          computedLayout,
        );
      }
    } else {
      for (const [, container] of this.nodeMap.entries()) {
        if (container.parent) {
          container.parent.removeChild(container);
        }
        try {
          container.destroy({ children: true });
        } catch {}
      }
      this.nodeMap.clear();
    }

    return this.rootContainer;
  }

  private projectNode(
    node: SceneNode,
    parentContainer: Container,
    doc: OverlayDocument,
    currentTime: number,
    context: Record<string, any>,
    inheritedDelay = 0,
    targetIndex = -1,
    parentNode: SceneNode | null = null,
    computedLayout?: LayoutComputedState,
  ): void {
    // 1. Evaluate visibilityExpression — hide node entirely if falsy
    if (node.visibilityExpression) {
      const isVisible = dataBindingEngine.evaluateCondition(node.visibilityExpression, context);
      if (!isVisible) {
        const existing = this.nodeMap.get(node.id);
        if (existing) existing.visible = false;
        return;
      }
    }

    // 2. Evaluate Data Bindings
    dataBindingEngine.evaluateNodeBindings(node, context);

    // 3. Evaluate Motion & Animation State (with inherited hierarchical delay)
    const animState = animationRuntime.evaluateNodeState(node, currentTime, doc.duration, {
      doc,
      inheritedDelay
    });

    if (animState.opacity <= 0.001) {
      const existing = this.nodeMap.get(node.id);
      if (existing) existing.visible = false;
      return;
    }

    let nodeContainer = this.nodeMap.get(node.id);
    if (!nodeContainer) {
      nodeContainer = new Container();
      nodeContainer.label = node.name || node.id;
      this.nodeMap.set(node.id, nodeContainer);
      parentContainer.addChild(nodeContainer);
    } else if (nodeContainer.parent !== parentContainer) {
      if (nodeContainer.parent) {
        nodeContainer.parent.removeChild(nodeContainer);
      }
      parentContainer.addChild(nodeContainer);
    }

    nodeContainer.label = node.name || node.id;
    nodeContainer.visible = true;

    // Ensure display list z-order matches document node order
    if (targetIndex >= 0 && parentContainer.children.length > 0) {
      const backgroundLabels = new Set([
        "CanvasBackground",
        "ShadowGraphics",
        "ShapeGraphics",
        "ContainerGraphics",
        "CalloutGraphics",
      ]);
      let bgOffset = 0;
      for (const child of parentContainer.children) {
        if (child.label && backgroundLabels.has(child.label)) {
          bgOffset++;
        }
      }
      const desiredIndex = Math.min(
        targetIndex + bgOffset,
        parentContainer.children.length - 1
      );
      if (
        desiredIndex >= 0 &&
        parentContainer.children[desiredIndex] !== nodeContainer
      ) {
        parentContainer.setChildIndex(nodeContainer, desiredIndex);
      }
    }

    // Resolve node coordinates using computed layout geometry (supports Flex Row/Col, Hug, Fill, Gap)
    const nodeLayoutBounds = computedLayout?.nodes[node.id];
    const parentLayoutBounds = parentNode
      ? computedLayout?.nodes[parentNode.id]
      : null;

    let absX: number;
    let absY: number;
    let absW: number;
    let absH: number;

    if (parentNode && nodeLayoutBounds && parentLayoutBounds) {
      // Relative to parent container coordinates in Pixi scene hierarchy
      absX = nodeLayoutBounds.x - parentLayoutBounds.x;
      absY = nodeLayoutBounds.y - parentLayoutBounds.y;
      absW = nodeLayoutBounds.width;
      absH = nodeLayoutBounds.height;
    } else if (nodeLayoutBounds) {
      absX = nodeLayoutBounds.x;
      absY = nodeLayoutBounds.y;
      absW = nodeLayoutBounds.width;
      absH = nodeLayoutBounds.height;
    } else {
      absX = node.x;
      absY = node.y;
      absW = node.width;
      absH = node.height;
    }

    nodeContainer.pivot.set(absW / 2, absH / 2);
    nodeContainer.position.set(absX + absW / 2 + animState.translateX, absY + absH / 2 + animState.translateY);
    const rawOpacity = (node.style as any)?.opacity ?? (node as any).opacity ?? 1;
    const nodeOpacity = typeof rawOpacity === "number" ? (rawOpacity > 1 ? rawOpacity / 100 : rawOpacity) : 1;
    nodeContainer.alpha = Math.max(0, Math.min(1, animState.opacity * nodeOpacity));
    nodeContainer.scale.set(animState.scaleX, animState.scaleY);
    nodeContainer.rotation = (animState.rotation * Math.PI) / 180;

    const backdropBlurVal = (node.style as any)?.backdropBlur ?? (node as any).backdropBlur ?? 0;
    if (backdropBlurVal > 0) {
      try {
        const blurFilter = new BlurFilter({ strength: Math.min(backdropBlurVal, 40) });
        nodeContainer.filters = [blurFilter];
      } catch {
        nodeContainer.filters = [];
      }
    } else {
      nodeContainer.filters = [];
    }
    // Clip Content (Mask children/overflow to node bounds & border radius)
    if (Boolean((node as any).clipContent)) {
      let maskG = (nodeContainer as any)._clipMaskGraphics as PixiGraphics;
      if (!maskG) {
        maskG = new PixiGraphics();
        (nodeContainer as any)._clipMaskGraphics = maskG;
        nodeContainer.addChild(maskG);
      }
      maskG.clear();
      const radius = (node.style as any)?.borderRadius ?? 0;
      if (radius > 0) {
        maskG.roundRect(0, 0, absW, absH, radius);
      } else {
        maskG.rect(0, 0, absW, absH);
      }
      maskG.fill({ color: 0xffffff });
      maskG.renderable = false;
      nodeContainer.mask = maskG;
    } else {
      if ((nodeContainer as any)._clipMaskGraphics) {
        const oldG = (nodeContainer as any)._clipMaskGraphics;
        nodeContainer.removeChild(oldG);
        oldG.destroy();
        (nodeContainer as any)._clipMaskGraphics = null;
      }
      nodeContainer.mask = null;
    }

    // Render node according to primitive / component type
    if (node.type === "component") {
      (node as any)._numericOverride = animState.numericValueOverride;
      this.renderComponentNode(
        node as ComponentNode,
        nodeContainer,
        absW,
        absH,
        animState.typewriterProgress
      );
    } else if (node.type === "text") {
      this.renderTextNode(node, nodeContainer, absW, absH, animState.typewriterProgress);
    } else if (node.type === "rich-text") {
      this.renderRichTextNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "gradient") {
      this.renderGradientNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "icon") {
      this.renderIconNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "divider") {
      this.renderDividerNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "metric") {
      this.renderMetricNode(node as any, nodeContainer, absW, absH, animState.numericValueOverride);
    } else if (node.type === "progress") {
      this.renderProgressNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "chart") {
      this.renderChartNode(node as any, nodeContainer, absW, absH, currentTime, doc.duration);
    } else if (visualizationRegistry.has(node.type) && visualizationRendererRegistry.has(node.type)) {
      this.renderVisualizationNode(node as any, nodeContainer, absW, absH, currentTime, doc);
    } else if (node.type === "table") {
      this.renderTableNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "container") {
      this.renderContainerNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "callout") {
      this.renderCalloutNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "avatar") {
      this.renderAvatarNode(node as any, nodeContainer, absW, absH);
    } else if (
      node.type === "shape" ||
      node.type === "frame" ||
      node.type === "line" ||
      node.type === "connector" ||
      (node as any).type === "circle" ||
      (node as any).type === "rectangle"
    ) {
      this.renderShapeNode(node, nodeContainer, absW, absH);
    } else if (node.type === "media") {
      this.renderMediaNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "repeater") {
      const expanded = dataBindingEngine.expandRepeater(node as any, context);
      expanded.forEach((childNode, childIdx) => {
        const childDelay = animationRuntime.computeChildInheritedDelay(node.animation, childIdx, inheritedDelay);
        this.projectNode(childNode, nodeContainer, doc, currentTime, context, childDelay, childIdx, node, computedLayout);
      });
    }

    // Render child nodes recursively if present (with parent-child stagger inheritance)
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child, childIdx) => {
        const childDelay = animationRuntime.computeChildInheritedDelay(node.animation, childIdx, inheritedDelay);
        this.projectNode(child, nodeContainer, doc, currentTime, context, childDelay, childIdx, node, computedLayout);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Component
  // ---------------------------------------------------------------------------

  private renderComponentNode(
    node: ComponentNode,
    container: Container,
    width: number,
    height: number,
    typewriterProgress: number
  ): void {
    let graphics = container.getChildByLabel("CardBox") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "CardBox";
      container.addChild(graphics);
    }

    const bg = node.props.cardBackground || "#12121A";
    const border = node.props.cardBorder || node.props.accentColor || "#7C6FFF";
    const accent = node.props.accentColor || "#7C6FFF";
    // Merge node.style appearance overrides
    const style: Record<string, any> = (node as any).style || {};
    const fillColor = style.fillColor || bg;
    const strokeColor = style.strokeColor || border;
    const strokeWidth = style.strokeWidth ?? 2;
    const radius = style.borderRadius ?? 16;
    const fillOpacity = resolveAlpha(style.fillOpacity, 0.95);

    graphics.clear();
    graphics.roundRect(0, 0, width, height, radius);
    graphics.fill({ color: hexToNumber(fillColor), alpha: fillOpacity });
    if (strokeWidth > 0) {
      graphics.stroke({ color: hexToNumber(strokeColor), width: strokeWidth, alpha: 0.8 });
    }

    // Render Component Accent Bar
    graphics.roundRect(0, 0, width, 5, 2);
    graphics.fill({ color: hexToNumber(accent) });

    // Render shadow if defined
    if (style.shadow) {
      this.applyShadow(container, style.shadow, width, height, radius);
    }

    // Render Component Text Labels
    if (node.componentType === "stat-card") {
      const displayVal = (node as any)._numericOverride !== undefined
        ? String(Math.round((node as any)._numericOverride))
        : (node.props.value || "+100%");
      this.renderLabel(container, "Value", displayVal, 20, 20, 48, accent, true);
      this.renderLabel(container, "Label", node.props.label || "Metric Label", 20, 75, 18, "#FFFFFF", false);
      if (node.props.delta) {
        this.renderLabel(container, "Delta", node.props.delta, width - 120, 25, 13, accent, true);
      }
    } else if (node.componentType === "quote-card") {
      const displayText = node.props.quote || "";
      const charCount = Math.floor(displayText.length * typewriterProgress);
      const visibleQuote = displayText.substring(0, charCount);
      this.renderLabel(container, "Quote", `"${visibleQuote}"`, 25, 25, 18, "#FFFFFF", false);
      this.renderLabel(container, "Author", `— ${node.props.author || "Author Name"}`, 25, height - 35, 14, accent, true);
    } else if (node.componentType === "code-block") {
      this.renderLabel(container, "Title", node.props.title || "script.ts", 20, 15, 12, "#A78BFA", true);
      const codeText = node.props.code || "";
      const visibleCode = codeText.substring(0, Math.floor(codeText.length * typewriterProgress));
      this.renderLabel(container, "Code", visibleCode, 20, 45, 14, "#00FFCC", false, "Fira Code");
    } else if (node.componentType === "lower-third") {
      this.renderLabel(container, "Name", node.props.name || "Speaker Name", 20, 15, 22, "#FFFFFF", true);
      this.renderLabel(container, "Title", node.props.title || "Speaker Title", 20, 45, 14, accent, false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Text primitive (full typography)
  // ---------------------------------------------------------------------------

  private renderTextNode(
    node: SceneNode,
    container: Container,
    width: number,
    height: number,
    typewriterProgress: number
  ): void {
    const rawText = (node as any).text || "";
    const visibleText = rawText.substring(0, Math.floor(rawText.length * typewriterProgress));
    const style: Record<string, any> = (node as any).style || {};

    // Resolve font: fontRef (4I) > fontFamily (legacy)
    let fontFamily = style.fontFamily || "Inter";
    if (style.fontRef) {
      const resolved = runtimeAssetResolver.resolveFont(
        style.fontRef.family,
        style.fontRef.weight ?? 400,
        style.fontRef.style ?? "normal"
      );
      fontFamily = resolved.resolvedFamily;
    }

    const fontSize = style.fontSize || 20;
    const color = style.textColor || "#FFFFFF";
    const fontWeight = style.fontWeight || "400";
    const lineHeight = style.lineHeight ?? 1.2;
    const letterSpacing = style.letterSpacing ?? 0;
    const textAlign = (style.textAlign as "left" | "center" | "right") || "left";
    const textTransform: string = style.textTransform || "none";

    let displayText = visibleText;
    if (textTransform === "uppercase") displayText = displayText.toUpperCase();
    else if (textTransform === "lowercase") displayText = displayText.toLowerCase();

    const textStyle = new TextStyle({
      fontFamily,
      fontSize,
      fill: color as ColorSource,
      fontWeight: fontWeight as any,
      lineHeight: lineHeight * fontSize,
      letterSpacing,
      align: textAlign,
      wordWrap: true,
      wordWrapWidth: width,
      dropShadow: style.shadow
        ? {
            color: style.shadow.color || "#000000",
            blur: style.shadow.blur ?? 0,
            angle: Math.atan2(style.shadow.y ?? 0, style.shadow.x ?? 0),
            distance: Math.hypot(style.shadow.x ?? 0, style.shadow.y ?? 0),
            alpha: 0.6,
          }
        : false,
    });

    let pixiText = container.getChildByLabel("Text_main") as PixiText;
    if (!pixiText) {
      pixiText = new PixiText({ text: "", style: textStyle });
      pixiText.label = "Text_main";
      container.addChild(pixiText);
    }

    pixiText.text = displayText;
    pixiText.x = 0;
    pixiText.y = 0;
    pixiText.style = textStyle;
  }

  // ---------------------------------------------------------------------------
  // Render: Media (image / icon / svg / avatar)
  // Deterministic fallback for pending / missing / error states — never throws
  // ---------------------------------------------------------------------------

  private renderMediaNode(
    node: { assetId?: string; src?: string; mediaType: string },
    container: Container,
    width: number,
    height: number
  ): void {
    let placeholder = container.getChildByLabel("MediaPlaceholder") as PixiGraphics;
    if (!placeholder) {
      placeholder = new PixiGraphics();
      placeholder.label = "MediaPlaceholder";
      container.addChild(placeholder);
    }

    placeholder.clear();

    if (node.assetId) {
      const resolved = runtimeAssetResolver.resolve(node.assetId);

      if (resolved.state === "ready" && resolved.url) {
        // Asset is ready — render a tinted green rect as stand-in
        // (full Sprite loading via PIXI.Assets requires async and is Studio-layer concern)
        placeholder.rect(0, 0, width, height).fill({ color: 0x1a2a1a, alpha: 0.6 });
        placeholder.rect(4, 4, width - 8, height - 8).stroke({ color: 0x44cc44, width: 1.5 });
        return;
      }

      if (resolved.state === "loading" || resolved.state === "pending") {
        // Grey shimmer placeholder
        placeholder.rect(0, 0, width, height).fill({ color: 0x2a2a35, alpha: 0.8 });
        placeholder.rect(0, 0, width, 2).fill({ color: 0x7c6fff, alpha: 0.6 });
        return;
      }
    }

    // Missing / error / no assetId — checkerboard pattern
    const cellSize = 12;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isDark = (r + c) % 2 === 0;
        placeholder
          .rect(c * cellSize, r * cellSize, cellSize, cellSize)
          .fill({ color: isDark ? 0x2a2a35 : 0x3a3a45, alpha: 0.9 });
      }
    }
    // Error border
    placeholder.rect(0, 0, width, height).stroke({ color: 0xff4466, width: 1, alpha: 0.6 });
  }

  // ---------------------------------------------------------------------------
  // Render: Shape / Frame (full appearance)
  // ---------------------------------------------------------------------------

  private renderShapeNode(
    node: SceneNode,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("ShapeGraphics") as PixiGraphics;
    const shadowG = container.getChildByLabel("ShadowGraphics");
    const desiredBgIndex = shadowG ? 1 : 0;

    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "ShapeGraphics";
      container.addChildAt(graphics, Math.min(desiredBgIndex, container.children.length));
    } else {
      const currentIdx = container.children.indexOf(graphics);
      if (currentIdx !== desiredBgIndex && container.children.length > desiredBgIndex) {
        container.setChildIndex(graphics, desiredBgIndex);
      }
    }

    const style: Record<string, any> = (node as any).style || {};
    const fill =
      style.fillColor ||
      (node as any).fillColor ||
      (node as any).strokeColor ||
      "#3B82F6";
    const strokeColor =
      style.strokeColor || (node as any).strokeColor || fill;
    const strokeWidth =
      style.strokeWidth ?? (node as any).strokeWidth ?? 0;
    const radius = style.borderRadius ?? (node as any).borderRadius ?? 0;
    const fillOpacity = resolveAlpha(
      style.fillOpacity ?? (node as any).fillOpacity,
      1
    );

    // Determine shape kind
    const shapeKind = (node as any).shapeKind || node.type || "rect";

    graphics.clear();

    if (shapeKind === "circle" || (node as any).type === "circle") {
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2;
      graphics.circle(cx, cy, r);
      graphics.fill({ color: hexToNumber(fill), alpha: fillOpacity });
      if (strokeWidth > 0) {
        graphics.stroke({ color: hexToNumber(strokeColor), width: strokeWidth });
      }
    } else if (shapeKind === "line" || node.type === "line") {
      const lineThickness = Math.max(1, height || strokeWidth || 2);
      if (radius > 0) {
        graphics.roundRect(0, 0, width, lineThickness, radius);
      } else {
        graphics.rect(0, 0, width, lineThickness);
      }
      graphics.fill({ color: hexToNumber(fill), alpha: fillOpacity });
      if (strokeWidth > 0 && strokeColor !== fill) {
        graphics.stroke({ color: hexToNumber(strokeColor), width: 1 });
      }
    } else if (shapeKind === "connector" || node.type === "connector") {
      const lineThickness = Math.max(1, strokeWidth || 2);
      graphics.moveTo(0, height / 2);
      graphics.lineTo(width, height / 2);
      graphics.stroke({ color: hexToNumber(fill), width: lineThickness });
    } else {
      if (radius > 0) {
        graphics.roundRect(0, 0, width, height, radius);
      } else {
        graphics.rect(0, 0, width, height);
      }
      graphics.fill({ color: hexToNumber(fill), alpha: fillOpacity });
      if (strokeWidth > 0) {
        graphics.stroke({ color: hexToNumber(strokeColor), width: strokeWidth });
      }
    }

    // Shadow
    const shadow = style.shadow || (node.style as any)?.shadow || (node as any).shadow;
    if (shadow) {
      this.applyShadow(container, shadow, width, height, radius, shapeKind);
    } else {
      const shadowG = container.getChildByLabel("ShadowGraphics");
      if (shadowG) {
        container.removeChild(shadowG);
        shadowG.destroy();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private applyShadow(
    container: Container,
    shadow: { x?: number; y?: number; blur?: number; color?: string },
    width: number,
    height: number,
    radius = 8,
    shapeKind = "rect"
  ): void {
    let shadowG = container.getChildByLabel("ShadowGraphics") as PixiGraphics;
    if (!shadowG) {
      shadowG = new PixiGraphics();
      shadowG.label = "ShadowGraphics";
      container.addChildAt(shadowG, 0);
    } else {
      if (container.children.indexOf(shadowG) !== 0) {
        container.setChildIndex(shadowG, 0);
      }
    }

    shadowG.clear();
    const offX = shadow.x ?? 0;
    const offY = shadow.y ?? 8;
    const shadowColor = hexToNumber(shadow.color || "#000000");
    const shadowBlur = shadow.blur ?? 16;

    if (shapeKind === "circle") {
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2;
      shadowG.circle(cx + offX, cy + offY, r);
    } else if (shapeKind === "line") {
      shadowG.moveTo(offX, height / 2 + offY);
      shadowG.lineTo(width + offX, height / 2 + offY);
    } else {
      shadowG.roundRect(offX, offY, width, height, radius);
    }

    shadowG.fill({ color: shadowColor, alpha: 0.7 });

    if (shadowBlur > 0) {
      try {
        const blurFilter = new BlurFilter({ strength: Math.min(shadowBlur, 40) });
        shadowG.filters = [blurFilter];
      } catch {
        shadowG.filters = [];
      }
    } else {
      shadowG.filters = [];
    }
  }

  private renderLabel(
    container: Container,
    name: string,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string,
    bold: boolean,
    fontFamily = "Inter",
    letterSpacing = 0
  ): void {
    const textStyle = new TextStyle({
      fontFamily,
      fontSize,
      fill: color as ColorSource,
      fontWeight: bold ? "bold" : "normal",
      letterSpacing,
    });
    let pixiText = container.getChildByLabel(`Text_${name}`) as PixiText;
    if (!pixiText) {
      pixiText = new PixiText({ text: "", style: textStyle });
      pixiText.label = `Text_${name}`;
      container.addChild(pixiText);
    }

    pixiText.text = text;
    pixiText.x = x;
    pixiText.y = y;
    pixiText.style = new TextStyle({
      fontFamily,
      fontSize,
      fill: color as ColorSource,
      fontWeight: bold ? "bold" : "normal",
      letterSpacing,
    });
  }

  // ---------------------------------------------------------------------------
  // Render: Primitive Implementations (Phase 4O)
  // ---------------------------------------------------------------------------

  private renderRichTextNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    const spans = node.spans || [];
    let currentX = 0;

    spans.forEach((span: any, idx: number) => {
      const fontSize = span.style?.fontSize || node.style?.fontSize || 20;
      const color = span.style?.textColor || node.style?.textColor || "#FFFFFF";
      const bold = span.style?.fontWeight === "bold";
      this.renderLabel(container, `span_${idx}`, span.text || "", currentX, 0, fontSize, color, bold);
      currentX += (span.text || "").length * fontSize * 0.55;
    });
  }

  private renderGradientNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("GradientGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "GradientGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    const stops = node.stops || [{ offset: 0, color: "#8B5CF6" }, { offset: 1, color: "#3B82F6" }];
    const firstColor = stops[0]?.color || "#8B5CF6";
    const radius = node.style?.borderRadius || 8;

    graphics.roundRect(0, 0, width, height, radius);
    graphics.fill({ color: hexToNumber(firstColor), alpha: node.style?.opacity ?? 1 });
  }

  private renderIconNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("IconGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "IconGraphics";
      container.addChild(graphics);
    }

    graphics.clear();
    const color = node.style?.fillColor || "#10B981";
    const size = Math.min(width, height);
    graphics.circle(size / 2, size / 2, size / 2);
    graphics.fill({ color: hexToNumber(color) });
  }

  private renderDividerNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("DividerGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "DividerGraphics";
      container.addChild(graphics);
    }

    graphics.clear();
    const strokeColor = node.style?.strokeColor || "#374151";
    const thickness = node.thickness || 2;

    if (node.orientation === "vertical") {
      graphics.rect(0, 0, thickness, height);
    } else {
      graphics.rect(0, 0, width, thickness);
    }
    graphics.fill({ color: hexToNumber(strokeColor) });
  }

  private renderMetricNode(
    node: any,
    container: Container,
    width: number,
    height: number,
    numericOverride?: number
  ): void {
    const rawValue = typeof node.value === "number" ? node.value : Number(node.value) || 0;
    const displayValue = numericOverride !== undefined ? numericOverride : rawValue;
    const textColor = node.style?.textColor || "#FFFFFF";
    const fontSize = node.style?.fontSize || 28;
    const format: string = node.format ?? "number";
    const decimals: number = node.decimals ?? (format === "currency" ? 2 : 0);

    // ── Format primary value ────────────────────────────────────────────────────────
    let formattedVal: string;
    if (format === "compact") {
      if (Math.abs(displayValue) >= 1_000_000) formattedVal = `${(displayValue / 1_000_000).toFixed(1)}M`;
      else if (Math.abs(displayValue) >= 1_000) formattedVal = `${(displayValue / 1_000).toFixed(1)}K`;
      else formattedVal = displayValue.toFixed(decimals);
    } else if (format === "percent") {
      formattedVal = `${displayValue.toFixed(decimals)}%`;
    } else {
      formattedVal = displayValue.toFixed(decimals);
    }
    const displayStr = `${node.prefix || ""}${formattedVal}${node.suffix || ""}`;

    this.renderLabel(container, "value", displayStr, 0, 0, fontSize, textColor, true);

    // ── Label ──────────────────────────────────────────────────────────────────────
    if (node.label) {
      this.renderLabel(container, "label", node.label, 0, fontSize + 6, 12, "#9CA3AF", false);
    }

    // ── Delta / trend (Phase 4Q) ───────────────────────────────────────────────────
    const labelOffset = node.label ? fontSize + 26 : fontSize + 10;
    if (node.showDelta || node.showTrend) {
      let deltaPct: number;
      if (node.trend !== undefined) {
        deltaPct = node.trend;
      } else if (node.previousValue !== undefined && node.previousValue !== 0) {
        deltaPct = ((rawValue - node.previousValue) / Math.abs(node.previousValue)) * 100;
      } else {
        deltaPct = 0;
      }

      const dir: string = node.trendDirection ?? (deltaPct >= 0 ? "up" : "down");
      const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "►";
      const deltaColor = dir === "up" ? "#45FF72" : dir === "down" ? "#FF4141" : "#9CA3AF";
      const sign = deltaPct >= 0 ? "+" : "";
      const deltaStr = node.showDelta
        ? `${arrow} ${sign}${deltaPct.toFixed(1)}%`
        : arrow;

      this.renderLabel(container, "delta", deltaStr, 0, labelOffset, 14, deltaColor, false);
    }
  }

  private renderProgressNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("ProgressGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "ProgressGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    const val = typeof node.value === "number" ? node.value : 0;
    const max = typeof node.max === "number" ? node.max : 100;
    const ratio = Math.min(1, Math.max(0, val / max));

    const trackColor = node.trackColor || "#1F2937";
    const fillColor = node.fillColor || "#3B82F6";

    // Track
    graphics.roundRect(0, 0, width, height, height / 2);
    graphics.fill({ color: hexToNumber(trackColor) });

    // Fill
    if (ratio > 0) {
      graphics.roundRect(0, 0, width * ratio, height, height / 2);
      graphics.fill({ color: hexToNumber(fillColor) });
    }

    if (node.showLabel) {
      const pctText = `${Math.round(ratio * 100)}%`;
      this.renderLabel(container, "pct", pctText, width + 8, 0, 14, "#FFFFFF", true);
    }
  }

  private renderChartNode(
    node: any,
    container: Container,
    width: number,
    height: number,
    currentTime: number,
    docDuration: number
  ): void {
    // ── Animation t [0,1] ────────────────────────────────────────────────────────
    const animConf = node.chartAnimation;
    let t = 1;
    if (animConf && animConf.mode !== "none") {
      const duration = animConf.duration ?? 1.2;
      t = Math.min(1, Math.max(0, currentTime / duration));
    }

    // ── Geometry from VisualizationEngine ───────────────────────────────────
    const geo = visualizationEngine.evaluate(node, width, height, t);
    const chartType: string = node.chartType ?? "bar";
    const isPieFamily = chartType === "pie" || chartType === "donut";

    // ── Background (shared) ──────────────────────────────────────────────────
    let bgGfx = container.getChildByLabel("ChartBg") as PixiGraphics;
    if (!bgGfx) { bgGfx = new PixiGraphics(); bgGfx.label = "ChartBg"; container.addChildAt(bgGfx, 0); }
    bgGfx.clear();
    bgGfx.roundRect(0, 0, width, height, 8);
    bgGfx.fill({ color: hexToNumber(node.style?.fillColor ?? "#111827") });
    bgGfx.stroke({ color: hexToNumber("#1F2937"), width: 1 });

    if (isPieFamily) {
      // ── Pie / Donut ─────────────────────────────────────────────────────────
      let arcGfx = container.getChildByLabel("ChartArcs") as PixiGraphics;
      if (!arcGfx) { arcGfx = new PixiGraphics(); arcGfx.label = "ChartArcs"; container.addChild(arcGfx); }
      arcGfx.clear();

      const cx = geo.centerX;
      const cy = geo.centerY;

      for (const arc of geo.arcs) {
        if (arc.endAngle <= arc.startAngle) continue;
        arcGfx.moveTo(cx, cy);
        arcGfx.arc(cx, cy, arc.outerRadius, arc.startAngle, arc.endAngle);
        arcGfx.lineTo(cx, cy);
        arcGfx.fill({ color: hexToNumber(arc.color) });

        // Inner hole for donut
        if (arc.innerRadius > 0) {
          arcGfx.moveTo(cx + arc.innerRadius, cy);
          arcGfx.arc(cx, cy, arc.innerRadius, 0, Math.PI * 2);
          arcGfx.fill({ color: hexToNumber(node.style?.fillColor ?? "#111827") });
        }

        // Percentage labels
        if (node.showPercentageLabels !== false && arc.rawValue > 0) {
          this.renderLabel(
            container, `arcLbl_${arc.seriesId}`,
            arc.labelText,
            arc.labelX - 12, arc.labelY - 7,
            11, "#FFFFFF", true
          );
        }
      }
    } else {
      // ── Grid lines (bar / line / area) ────────────────────────────────────────
      const showGrid = node.showGrid ?? node.axis?.showGrid ?? true;
      let gridGfx = container.getChildByLabel("ChartGrid") as PixiGraphics;
      if (!gridGfx) { gridGfx = new PixiGraphics(); gridGfx.label = "ChartGrid"; container.addChild(gridGfx); }
      gridGfx.clear();
      if (showGrid) {
        for (const gl of geo.gridLines) {
          gridGfx.moveTo(geo.plotArea.x, gl.y);
          gridGfx.lineTo(geo.plotArea.x + geo.plotArea.w, gl.y);
          gridGfx.stroke({ color: hexToNumber("#1F2937"), width: 1, alpha: 0.6 });
        }
      }

      // ── Axis labels ─────────────────────────────────────────────────────────────
      if (node.axis?.showLabels !== false) {
        geo.yAxisLabels.forEach((lbl, i) => {
          this.renderLabel(container, `yLbl_${i}`, lbl.text, lbl.x - 40, lbl.y - 7, 11, "#6B7280", false);
        });
      }
      geo.xAxisLabels.forEach((lbl, i) => {
        this.renderLabel(container, `xLbl_${i}`, lbl.text, lbl.x - 30, lbl.y, 11, "#9CA3AF", false);
      });

      if (chartType === "bar") {
        // ── Bars ──────────────────────────────────────────────────────────────────
        const roundedR = (node.barStyle?.rounded ?? 4);
        const seriesIds = [...new Set(geo.bars.map((b) => b.seriesId))];
        for (const sid of seriesIds) {
          const gfxName = `ChartBars-${sid}`;
          let barGfx = container.getChildByLabel(gfxName) as PixiGraphics;
          if (!barGfx) { barGfx = new PixiGraphics(); barGfx.label = gfxName; container.addChild(barGfx); }
          barGfx.clear();
          for (const bar of geo.bars.filter((b) => b.seriesId === sid && b.active && b.h > 0)) {
            barGfx.roundRect(bar.x, bar.y, bar.w, bar.h, roundedR);
            barGfx.fill({ color: hexToNumber(bar.color) });
          }
        }

        // Bar value labels (count-up)
        const countUp = animConf?.countUpLabels ?? true;
        geo.bars.forEach((bar) => {
          if (!bar.active || bar.h < 4) return;
          const lv = countUp ? bar.labelText : String(Math.round(bar.rawValue));
          this.renderLabel(container, `barLbl_${bar.seriesId}_${bar.categoryIndex}`,
            lv, bar.x + bar.w / 2 - 15, bar.y - 18, 12, "#FFFFFF", true);
        });
      } else if (chartType === "line" || chartType === "area") {
        // ── Area fill (rendered first, below line) ───────────────────────────
        const showArea = chartType === "area" || node.showAreaFill;
        const areaOpacity = node.areaFillOpacity ?? 0.25;
        if (showArea) {
          const seriesIds = [...new Set(geo.linePoints.map((p) => p.seriesId))];
          // Render in reverse order so first series is on top
          [...seriesIds].reverse().forEach((sid, ri) => {
            const aName = `ChartArea-${sid}`;
            let aGfx = container.getChildByLabel(aName) as PixiGraphics;
            if (!aGfx) { aGfx = new PixiGraphics(); aGfx.label = aName; container.addChild(aGfx); }
            aGfx.clear();
            const pts = geo.linePoints.filter((p) => p.seriesId === sid && p.active)
              .sort((a, b) => a.categoryIndex - b.categoryIndex);
            if (pts.length < 2) return;
            aGfx.moveTo(pts[0].x, pts[0].baseY);
            pts.forEach((p) => aGfx.lineTo(p.x, p.y));
            aGfx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].baseY);
            aGfx.closePath();
            aGfx.fill({ color: hexToNumber(pts[0].color), alpha: areaOpacity });
          });
        }

        // ── Line paths ────────────────────────────────────────────────────────
        const lineSeriesIds = [...new Set(geo.linePoints.map((p) => p.seriesId))];
        for (const sid of lineSeriesIds) {
          const lName = `ChartLine-${sid}`;
          let lGfx = container.getChildByLabel(lName) as PixiGraphics;
          if (!lGfx) { lGfx = new PixiGraphics(); lGfx.label = lName; container.addChild(lGfx); }
          lGfx.clear();
          const pts = geo.linePoints.filter((p) => p.seriesId === sid && p.active)
            .sort((a, b) => a.categoryIndex - b.categoryIndex);
          if (pts.length === 0) continue;
          lGfx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) lGfx.lineTo(pts[i].x, pts[i].y);
          lGfx.stroke({ color: hexToNumber(pts[0].color), width: 2.5 });
        }

        // ── Data point dots ──────────────────────────────────────────────────
        const pointR = node.pointRadius ?? 4;
        let dotGfx = container.getChildByLabel("ChartDots") as PixiGraphics;
        if (!dotGfx) { dotGfx = new PixiGraphics(); dotGfx.label = "ChartDots"; container.addChild(dotGfx); }
        dotGfx.clear();
        for (const p of geo.linePoints.filter((p) => p.active)) {
          dotGfx.circle(p.x, p.y, pointR);
          dotGfx.fill({ color: hexToNumber(p.color) });
          dotGfx.circle(p.x, p.y, pointR - 1.5);
          dotGfx.fill({ color: hexToNumber("#111827") });
        }
      }
    }

    // ── Legend (shared) ────────────────────────────────────────────────────────
    let legendGfx = container.getChildByLabel("ChartLegend") as PixiGraphics;
    if (!legendGfx) { legendGfx = new PixiGraphics(); legendGfx.label = "ChartLegend"; container.addChild(legendGfx); }
    legendGfx.clear();
    geo.legendEntries.forEach((entry, i) => {
      legendGfx.rect(entry.x, entry.y - 6, 12, 12);
      legendGfx.fill({ color: hexToNumber(entry.color) });
      this.renderLabel(container, `legend_${i}`, entry.label, entry.x + 16, entry.y - 7, 11, "#D1D5DB", false);
    });

    // ── Chart title (shared) ──────────────────────────────────────────────────
    const chartTitle = node.title || node.name || "";
    if (chartTitle && !isPieFamily) {
      this.renderLabel(container, "chartTitle", chartTitle, geo.plotArea.x, 10, 13, "#9CA3AF", false);
    }
  }

  private renderTableNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("TableGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "TableGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    graphics.roundRect(0, 0, width, height, 8);
    graphics.fill({ color: hexToNumber("#111827") });

    const cols = node.columns || [];
    let curX = 12;
    cols.forEach((col: any, idx: number) => {
      this.renderLabel(container, `col_${idx}`, col.label || col.key, curX, 10, 14, "#9CA3AF", true);
      curX += col.width || 120;
    });
  }

  private renderContainerNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("ContainerGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "ContainerGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    const bg = node.style?.backgroundColor || "#111827";
    const radius = node.style?.borderRadius || 12;
    const stroke = node.style?.strokeColor;

    graphics.roundRect(0, 0, width, height, radius);
    graphics.fill({ color: hexToNumber(bg) });

    if (stroke) {
      graphics.stroke({ color: hexToNumber(stroke), width: node.style?.strokeWidth || 1 });
    }
  }

  private renderCalloutNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("CalloutGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "CalloutGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    const bg = node.style?.backgroundColor || "#1E1B4B";
    const stroke = node.style?.strokeColor || "#4338CA";
    const radius = node.style?.borderRadius || 12;

    graphics.roundRect(0, 0, width, height, radius);
    graphics.fill({ color: hexToNumber(bg) });
    graphics.stroke({ color: hexToNumber(stroke), width: 1 });

    this.renderLabel(container, "title", node.title || "Callout", 16, 12, 16, "#FFFFFF", true);
    this.renderLabel(container, "body", node.body || "", 16, 36, 13, "#94A3B8", false);
  }

  private renderVisualizationNode(
    node: any,
    container: Container,
    width: number,
    height: number,
    currentTime: number,
    doc?: OverlayDocument
  ): void {
    const def = visualizationRegistry.get(node.type)!;
    const renderer = visualizationRendererRegistry.get(node.type)!;
    const animConf = node.chartAnimation;
    let t = 1;
    if (animConf && animConf.mode !== "none") {
      const duration = animConf.duration ?? 1.2;
      t = Math.min(1, Math.max(0, currentTime / duration));
    }
    const geo = def.evaluate(node, { width, height, t, doc });
    const ctx = {
      container,
      hexToNumber,
      renderLabel: (p: Container, n: string, txt: string, x: number, y: number, s?: number, c?: string, b?: boolean, f?: string) =>
        this.renderLabel(p, n, txt, x, y, s, c, b, f),
    };
    renderer.render(geo, ctx);
  }

  private renderAvatarNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByLabel("AvatarGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.label = "AvatarGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    const size = Math.min(width, height);
    const radius = node.shape === "circle" ? size / 2 : node.shape === "rounded" ? 8 : 0;

    graphics.roundRect(0, 0, size, size, radius);
    graphics.fill({ color: hexToNumber("#4B5563") });

    if (node.initials) {
      this.renderLabel(container, "initials", node.initials, size / 4, size / 4, Math.floor(size / 2.5), "#FFFFFF", true);
    }
  }
}

export const pixiSceneProjection = new PixiSceneProjection();

