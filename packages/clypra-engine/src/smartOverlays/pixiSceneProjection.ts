import {
  Container,
  Text as PixiText,
  Graphics as PixiGraphics,
  TextStyle,
  type ColorSource,
} from "pixi.js";
import type { OverlayDocument, SceneNode, ComponentNode } from "./overlayDocumentSchema.js";
import { dataBindingEngine } from "./dataBindingEngine.js";
import { animationRuntime } from "./animationRuntime.js";
import { componentRegistry } from "./componentRegistry.js";
import { runtimeAssetResolver } from "./assets/runtimeAssetResolver.js";

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
   * Sync and project an OverlayDocument onto PixiJS display tree at currentTime
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

    // Clear stale containers if document ID changed
    if (this.rootContainer.label !== `OverlayDoc-${doc.id}`) {
      this.rootContainer.removeChildren();
      this.nodeMap.clear();
      this.rootContainer.label = `OverlayDoc-${doc.id}`;
    }

    // Render Canvas Backdrop
    if (doc.canvas.backgroundColor) {
      let bgGraphics = this.rootContainer.getChildByName("CanvasBackground") as PixiGraphics;
      if (!bgGraphics) {
        bgGraphics = new PixiGraphics();
        bgGraphics.name = "CanvasBackground";
        this.rootContainer.addChildAt(bgGraphics, 0);
      }
      bgGraphics.clear();
      bgGraphics.rect(0, 0, doc.canvas.width, doc.canvas.height);
      bgGraphics.fill({ color: doc.canvas.backgroundColor });
    }

    // Project root scene nodes
    for (const node of doc.nodes) {
      this.projectNode(node, this.rootContainer, doc, currentTime, fullContext, 0);
    }

    return this.rootContainer;
  }

  private projectNode(
    node: SceneNode,
    parentContainer: Container,
    doc: OverlayDocument,
    currentTime: number,
    context: Record<string, any>,
    inheritedDelay = 0
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
    }

    nodeContainer.visible = true;

    // Convert relative % to absolute px if required
    const absX = node.x < 100 ? (node.x / 100) * doc.canvas.width : node.x;
    const absY = node.y < 100 ? (node.y / 100) * doc.canvas.height : node.y;
    const absW = node.width <= 100 ? (node.width / 100) * doc.canvas.width : node.width;
    const absH = node.height <= 100 ? (node.height / 100) * doc.canvas.height : node.height;

    nodeContainer.x = absX + animState.translateX;
    nodeContainer.y = absY + animState.translateY;
    nodeContainer.alpha = animState.opacity;
    nodeContainer.scale.set(animState.scaleX, animState.scaleY);
    nodeContainer.rotation = (animState.rotation * Math.PI) / 180;

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
      this.renderChartNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "table") {
      this.renderTableNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "container") {
      this.renderContainerNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "callout") {
      this.renderCalloutNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "avatar") {
      this.renderAvatarNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "shape" || node.type === "frame") {
      this.renderShapeNode(node, nodeContainer, absW, absH);
    } else if (node.type === "media") {
      this.renderMediaNode(node as any, nodeContainer, absW, absH);
    } else if (node.type === "repeater") {
      const expanded = dataBindingEngine.expandRepeater(node as any, context);
      expanded.forEach((childNode, childIdx) => {
        const childDelay = animationRuntime.computeChildInheritedDelay(node.animation, childIdx, inheritedDelay);
        this.projectNode(childNode, nodeContainer, doc, currentTime, context, childDelay);
      });
    }

    // Render child nodes recursively if present (with parent-child stagger inheritance)
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((child, childIdx) => {
        const childDelay = animationRuntime.computeChildInheritedDelay(node.animation, childIdx, inheritedDelay);
        this.projectNode(child, nodeContainer, doc, currentTime, context, childDelay);
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
    let graphics = container.getChildByName("CardBox") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "CardBox";
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
      this.applyShadow(container, style.shadow);
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

    let pixiText = container.getChildByName("Text_main") as PixiText;
    if (!pixiText) {
      pixiText = new PixiText({ text: "" });
      pixiText.name = "Text_main";
      container.addChild(pixiText);
    }

    pixiText.text = displayText;
    pixiText.x = 0;
    pixiText.y = 0;
    pixiText.style = new TextStyle({
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
            // Pixi v8 uses angle (radians) + distance instead of offsetX/offsetY
            angle: Math.atan2(style.shadow.y ?? 0, style.shadow.x ?? 0),
            distance: Math.hypot(style.shadow.x ?? 0, style.shadow.y ?? 0),
            alpha: 0.6,
          }
        : false,
    });
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
    let placeholder = container.getChildByName("MediaPlaceholder") as PixiGraphics;
    if (!placeholder) {
      placeholder = new PixiGraphics();
      placeholder.name = "MediaPlaceholder";
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
    let graphics = container.getChildByName("ShapeGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "ShapeGraphics";
      container.addChild(graphics);
    }

    const style: Record<string, any> = (node as any).style || {};
    const fill = style.fillColor || "#1E1E28";
    const strokeColor = style.strokeColor || "#2E2E3E";
    const strokeWidth = style.strokeWidth ?? 0;
    const radius = style.borderRadius ?? 8;
    const fillOpacity = resolveAlpha(style.fillOpacity, 1);

    // Determine shape kind from componentType if available
    const shapeKind = (node as any).shapeKind || "rect";

    graphics.clear();

    if (shapeKind === "circle") {
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2;
      graphics.circle(cx, cy, r);
    } else if (shapeKind === "line") {
      graphics.moveTo(0, height / 2);
      graphics.lineTo(width, height / 2);
    } else {
      graphics.roundRect(0, 0, width, height, radius);
    }

    graphics.fill({ color: hexToNumber(fill), alpha: fillOpacity });

    if (strokeWidth > 0) {
      graphics.stroke({ color: hexToNumber(strokeColor), width: strokeWidth });
    }

    // Shadow
    if (style.shadow) {
      this.applyShadow(container, style.shadow);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private applyShadow(
    container: Container,
    shadow: { x: number; y: number; blur: number; color: string }
  ): void {
    // PixiJS v8 uses filter-based shadows; apply via CSS-like filter if available
    // For now, use a semi-transparent drop shadow Graphics underneath
    let shadowG = container.getChildByName("ShadowGraphics") as PixiGraphics;
    if (!shadowG) {
      shadowG = new PixiGraphics();
      shadowG.name = "ShadowGraphics";
      shadowG.alpha = 0.35;
      container.addChildAt(shadowG, 0);
    }
    // Shadow is a simple offset copy — simplified for WebGL preview
    shadowG.clear();
    shadowG.x = shadow.x ?? 0;
    shadowG.y = shadow.y ?? 4;
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
    let pixiText = container.getChildByName(`Text_${name}`) as PixiText;
    if (!pixiText) {
      pixiText = new PixiText({ text: "" });
      pixiText.name = `Text_${name}`;
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
    let graphics = container.getChildByName("GradientGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "GradientGraphics";
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
    let graphics = container.getChildByName("IconGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "IconGraphics";
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
    let graphics = container.getChildByName("DividerGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "DividerGraphics";
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
    const val = numericOverride !== undefined ? numericOverride : node.value;
    const formattedVal = `${node.prefix || ""}${val ?? ""}${node.suffix || ""}`;
    const textColor = node.style?.textColor || "#FFFFFF";
    const fontSize = node.style?.fontSize || 28;

    this.renderLabel(container, "value", formattedVal, 0, 0, fontSize, textColor, true);
    if (node.label) {
      this.renderLabel(container, "label", node.label, 0, fontSize + 4, 14, "#9CA3AF", false);
    }
  }

  private renderProgressNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByName("ProgressGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "ProgressGraphics";
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
    height: number
  ): void {
    let graphics = container.getChildByName("ChartGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "ChartGraphics";
      container.addChildAt(graphics, 0);
    }

    graphics.clear();
    // Chart bounding box
    graphics.roundRect(0, 0, width, height, 8);
    graphics.fill({ color: hexToNumber("#111827") });
    graphics.stroke({ color: hexToNumber("#1F2937"), width: 1 });

    // Render series bars / lines
    const seriesList = node.series || [];
    if (seriesList.length > 0 && seriesList[0].data) {
      const data = seriesList[0].data as number[];
      const maxVal = Math.max(1, ...data);
      const barWidth = Math.max(8, (width - 40) / data.length - 8);

      data.forEach((val, i) => {
        const barH = (val / maxVal) * (height - 60);
        const bx = 20 + i * (barWidth + 8);
        const by = height - 30 - barH;

        graphics.roundRect(bx, by, barWidth, barH, 4);
        graphics.fill({ color: hexToNumber(seriesList[0].color || "#6366F1") });
      });
    }

    this.renderLabel(container, "title", node.name || "Chart", 12, 10, 14, "#9CA3AF", true);
  }

  private renderTableNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByName("TableGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "TableGraphics";
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
    let graphics = container.getChildByName("ContainerGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "ContainerGraphics";
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
    let graphics = container.getChildByName("CalloutGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "CalloutGraphics";
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

  private renderAvatarNode(
    node: any,
    container: Container,
    width: number,
    height: number
  ): void {
    let graphics = container.getChildByName("AvatarGraphics") as PixiGraphics;
    if (!graphics) {
      graphics = new PixiGraphics();
      graphics.name = "AvatarGraphics";
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

