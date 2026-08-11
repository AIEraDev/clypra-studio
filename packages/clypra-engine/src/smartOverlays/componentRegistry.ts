import type { SceneNode, OverlayDocument, ComponentNode, FrameNode } from "./overlayDocumentSchema.js";

/**
 * Self-describing property that participates in the inspector, animation,
 * data binding, and validation simultaneously. Replaces PropertySchemaField.
 * Fully backwards-compatible — all old fields are preserved.
 */
export interface PropertyDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "color" | "boolean" | "select" | "asset" | "json";
  defaultValue: any;

  // Authoring participation flags
  editable?: boolean;              // shown in inspector (default: true)
  animatable?: boolean;            // can drive keyframe animation (default: false)
  bindable?: boolean;              // can bind to a document variable (default: true)
  exportable?: boolean;            // included in template serialization (default: true)

  // Inspector rendering hints
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  group?: "Content" | "Layout" | "Style" | "Animation";

  // Validation
  required?: boolean;

  // Animation registry integration
  animationPropertyType?: "number" | "color" | "angle" | "discrete";
}

/** @deprecated Use PropertyDefinition instead */
export type PropertySchemaField = PropertyDefinition;

export type ComponentCategory =
  | "metrics" | "comparison" | "typography"
  | "process" | "code" | "social" | "people"
  | "media" | "layout" | "primitives";

export interface ComponentDefinition {
  type: string;
  name: string;
  category: ComponentCategory;
  description: string;
  defaultProps: Record<string, any>;
  variants?: string[];
  /** Human-readable labels for each variant key */
  variantLabels?: Record<string, string>;
  semanticAnimations?: string[];
  schema: PropertyDefinition[];
  /** Returns the canonical inner scene tree (FrameNode with children).
   *  Used when entering template editing mode. */
  structure?: () => FrameNode;
  createDefaultNode: () => ComponentNode | SceneNode;
}

class ComponentRegistry {
  private registry = new Map<string, ComponentDefinition>();

  public register(def: ComponentDefinition) {
    this.registry.set(def.type, def);
  }

  public get(type: string): ComponentDefinition | undefined {
    return this.registry.get(type);
  }

  public getAll(): ComponentDefinition[] {
    return Array.from(this.registry.values());
  }

  public getTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

export const componentRegistry = new ComponentRegistry();

// ── Register Built-in Components ──────────────────────────────────────────────────

// 1. Stat Card Component
componentRegistry.register({
  type: "stat-card",
  name: "Stat Metric Card",
  category: "metrics",
  description: "High-impact stat callout card with big number, label, and delta badge.",
  variants: ["default", "compact", "large", "bordered"],
  semanticAnimations: ["count-up", "scale-pop", "fade-in"],
  defaultProps: {
    value: "+142%",
    label: "User Growth & Engagement",
    delta: "+15% YoY",
    accentColor: "#7C6FFF",
    cardBackground: "#12121A",
    cardBorder: "#2A2A38"
  },
  schema: [
    { key: "value", label: "Big Metric Value", type: "text", defaultValue: "+142%", group: "Content", bindable: true, animatable: false },
    { key: "label", label: "Metric Label", type: "text", defaultValue: "User Growth & Engagement", group: "Content", bindable: true },
    { key: "delta", label: "Delta Badge Text", type: "text", defaultValue: "+15% YoY", group: "Content", bindable: true },
    { key: "accentColor", label: "Accent Highlight", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" },
    { key: "cardBackground", label: "Card Background", type: "color", defaultValue: "#12121A", group: "Style", animatable: true, animationPropertyType: "color" },
    { key: "cardBorder", label: "Card Border", type: "color", defaultValue: "#2A2A38", group: "Style" }
  ],
  createDefaultNode: () => ({
    id: `stat-${Date.now().toString(36)}`,
    name: "Stat Card Component",
    type: "component",
    componentType: "stat-card",
    x: 20,
    y: 20,
    width: 60,
    height: 60,
    props: {
      value: "+142%",
      label: "User Growth & Engagement",
      delta: "+15% YoY",
      accentColor: "#7C6FFF",
      cardBackground: "#12121A",
      cardBorder: "#2A2A38"
    }
  })
});

// 2. Blockquote Card Component
componentRegistry.register({
  type: "quote-card",
  name: "Executive Blockquote",
  category: "typography",
  description: "Elegant blockquote card with quotation mark, author title, and avatar.",
  variants: ["default", "minimal", "glassmorphic"],
  semanticAnimations: ["fade-in", "slide-right", "typewriter"],
  defaultProps: {
    quote: "Simplicity is about subtracting the obvious and adding the meaningful.",
    author: "John Maeda",
    title: "Executive Director & Designer",
    accentColor: "#7C6FFF",
    cardBackground: "#12121A"
  },
  schema: [
    { key: "quote", label: "Quote Text", type: "text", defaultValue: "Quote content here", group: "Content" },
    { key: "author", label: "Author Name", type: "text", defaultValue: "Author Name", group: "Content" },
    { key: "title", label: "Author Title", type: "text", defaultValue: "Executive Title", group: "Content" },
    { key: "accentColor", label: "Quotation Accent", type: "color", defaultValue: "#7C6FFF", group: "Style" }
  ],
  createDefaultNode: () => ({
    id: `quote-${Date.now().toString(36)}`,
    name: "Quote Card Component",
    type: "component",
    componentType: "quote-card",
    x: 15,
    y: 25,
    width: 70,
    height: 50,
    props: {
      quote: "Simplicity is about subtracting the obvious and adding the meaningful.",
      author: "John Maeda",
      title: "Executive Director & Designer",
      accentColor: "#7C6FFF"
    }
  })
});

// 3. IDE Code Snippet Window Component
componentRegistry.register({
  type: "code-block",
  name: "IDE Code Window",
  category: "code",
  description: "Developer IDE code window with window controls, language badge, and typewriter motion.",
  variants: ["vscode-dark", "monokai", "obsidian"],
  semanticAnimations: ["typewriter", "line-highlight", "fade-in"],
  defaultProps: {
    title: "script.ts",
    language: "typescript",
    code: "const overlay = new ClypraStudio();\noverlay.render();",
    cardBackground: "#0F0F17",
    cardBorder: "#2E2E40"
  },
  schema: [
    { key: "title", label: "Window Title", type: "text", defaultValue: "script.ts", group: "Content" },
    { key: "language", label: "Language", type: "select", defaultValue: "typescript", options: [
      { label: "TypeScript", value: "typescript" },
      { label: "JavaScript", value: "javascript" },
      { label: "Python", value: "python" },
      { label: "Rust", value: "rust" },
      { label: "Bash", value: "bash" }
    ], group: "Content" },
    { key: "code", label: "Code Snippet", type: "text", defaultValue: "console.log('Clypra Studio');", group: "Content" }
  ],
  createDefaultNode: () => ({
    id: `code-${Date.now().toString(36)}`,
    name: "Code Block Component",
    type: "component",
    componentType: "code-block",
    x: 10,
    y: 15,
    width: 80,
    height: 70,
    props: {
      title: "script.ts",
      language: "typescript",
      code: "const overlay = new ClypraStudio();\noverlay.render();"
    }
  })
});

// 4. Lower Third Speaker Banner Component
componentRegistry.register({
  type: "lower-third",
  name: "Speaker Lower Third",
  category: "social",
  description: "Professional broadcast lower-third with name, title, and accent stripe.",
  variants: ["default", "glass", "solid-stripe"],
  semanticAnimations: ["slide-right", "fade-in"],
  defaultProps: {
    name: "Sarah Jenkins",
    title: "Head of Product & Design",
    company: "Clypra Inc.",
    accentColor: "#7C6FFF"
  },
  schema: [
    { key: "name", label: "Speaker Name", type: "text", defaultValue: "Speaker Name", group: "Content" },
    { key: "title", label: "Speaker Title", type: "text", defaultValue: "Speaker Title", group: "Content" },
    { key: "company", label: "Company", type: "text", defaultValue: "Clypra Inc.", group: "Content" },
    { key: "accentColor", label: "Accent Bar Color", type: "color", defaultValue: "#7C6FFF", group: "Style" }
  ],
  createDefaultNode: () => ({
    id: `l3-${Date.now().toString(36)}`,
    name: "Lower Third Component",
    type: "component",
    componentType: "lower-third",
    x: 5,
    y: 75,
    width: 50,
    height: 18,
    props: {
      name: "Sarah Jenkins",
      title: "Head of Product & Design",
      company: "Clypra Inc.",
      accentColor: "#7C6FFF"
    }
  })
});

// ── Register Primitives ──────────────────────────────────────────────────────────

// 5. Primitive Text
componentRegistry.register({
  type: "text-primitive",
  name: "Text Layer",
  category: "typography",
  description: "Standalone text box with custom font, size, color, and weight.",
  defaultProps: { text: "Header Title" },
  schema: [
    { key: "text", label: "Text Content", type: "text", defaultValue: "Header Title", group: "Content" }
  ],
  createDefaultNode: () => ({
    id: `text-${Date.now().toString(36)}`,
    name: "Text Primitive",
    type: "text",
    x: 100,
    y: 100,
    width: 300,
    height: 60,
    text: "Header Title",
    style: {
      fontSize: 32,
      textColor: "#FFFFFF",
      fontFamily: "Inter",
      fontWeight: "bold"
    }
  } as any)
});

// 6. Primitive Shape (Rectangle)
componentRegistry.register({
  type: "rect-primitive",
  name: "Rectangle Shape",
  category: "layout",
  description: "Vector rectangle shape with fill color, border radius, and stroke.",
  defaultProps: {},
  schema: [],
  createDefaultNode: () => ({
    id: `rect-${Date.now().toString(36)}`,
    name: "Rectangle Primitive",
    type: "shape",
    shapeType: "rectangle",
    x: 120,
    y: 120,
    width: 200,
    height: 120,
    style: {
      fillColor: "#1C1C28",
      strokeColor: "#2E2E40",
      strokeWidth: 2,
      borderRadius: 12
    }
  } as any)
});

// 7. Primitive Shape (Circle)
componentRegistry.register({
  type: "circle-primitive",
  name: "Circle Shape",
  category: "layout",
  description: "Vector circle shape with custom fill and stroke styling.",
  defaultProps: {},
  schema: [],
  createDefaultNode: () => ({
    id: `circle-${Date.now().toString(36)}`,
    name: "Circle Primitive",
    type: "shape",
    shapeType: "circle",
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    style: {
      fillColor: "#7C6FFF",
      strokeColor: "#FFFFFF",
      strokeWidth: 2
    }
  } as any)
});

// 8. Primitive Media (Image Slot)
componentRegistry.register({
  type: "image-primitive",
  name: "Media Image Slot",
  category: "media",
  description: "Image or asset container for overlays.",
  defaultProps: { src: "" },
  schema: [
    { key: "src", label: "Image Source URL", type: "asset", defaultValue: "", group: "Content" }
  ],
  createDefaultNode: () => ({
    id: `img-${Date.now().toString(36)}`,
    name: "Image Primitive",
    type: "media",
    mediaType: "image",
    x: 200,
    y: 200,
    width: 240,
    height: 160,
    src: "",
    style: {
      fillColor: "#12121D",
      borderRadius: 8
    }
  } as any)
});

// 9. Frame Container Primitive
componentRegistry.register({
  type: "frame-primitive",
  name: "Layout Frame Container",
  category: "layout",
  description: "Container frame for grouping, nesting, and layout management.",
  defaultProps: {},
  schema: [],
  createDefaultNode: () => ({
    id: `frame-${Date.now().toString(36)}`,
    name: "Frame Container",
    type: "frame",
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    children: [],
    style: {
      fillColor: "#0E0E14",
      strokeColor: "#7C6FFF",
      strokeWidth: 1.5,
      borderRadius: 16
    }
  } as any)
});

// 10. Repeater List Primitive
componentRegistry.register({
  type: "repeater-primitive",
  name: "Data Repeater List",
  category: "metrics",
  description: "Dynamic data-driven list component with stagger animations.",
  defaultProps: {},
  schema: [],
  createDefaultNode: () => ({
    id: `repeater-${Date.now().toString(36)}`,
    name: "Data Repeater",
    type: "repeater",
    x: 80,
    y: 80,
    width: 320,
    height: 240,
    datasetBinding: "{{metrics}}",
    staggerDelay: 0.1,
    itemTemplate: {
      id: "template-item",
      name: "Repeater Item Template",
      type: "text",
      x: 0,
      y: 0,
      width: 320,
      height: 40,
      text: "{{item.name}}: {{item.value}}",
      style: { fontSize: 18, textColor: "#FFFFFF" }
    }
  } as any)
});

// ── Register 5 New Primitive-Composed Components ──────────────────────────────

// 11. Versus / Comparison Card
componentRegistry.register({
  type: "versus-card",
  name: "Versus Comparison Card",
  category: "comparison",
  description: "Side-by-side comparison card with two values and a divider.",
  variants: ["default", "colored", "bordered"],
  variantLabels: { default: "Default", colored: "Colored", bordered: "Bordered" },
  defaultProps: { labelA: "Team Alpha", valueA: "142", labelB: "Team Beta", valueB: "98", accentColor: "#7C6FFF" },
  schema: [
    { key: "labelA", label: "Left Label", type: "text", defaultValue: "Team Alpha", group: "Content", bindable: true },
    { key: "valueA", label: "Left Value", type: "text", defaultValue: "142", group: "Content", bindable: true, animatable: true, animationPropertyType: "discrete" as any },
    { key: "labelB", label: "Right Label", type: "text", defaultValue: "Team Beta", group: "Content", bindable: true },
    { key: "valueB", label: "Right Value", type: "text", defaultValue: "98", group: "Content", bindable: true, animatable: true, animationPropertyType: "discrete" as any },
    { key: "accentColor", label: "Accent Color", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" as any }
  ],
  createDefaultNode: () => ({
    id: `vs-${Date.now().toString(36)}`, name: "Versus Card", type: "component" as any,
    componentType: "versus-card", x: 20, y: 20, width: 40, height: 28,
    props: { labelA: "Team Alpha", valueA: "142", labelB: "Team Beta", valueB: "98", accentColor: "#7C6FFF" }
  })
});

// 12. Progress Bar
componentRegistry.register({
  type: "progress-bar",
  name: "Progress Bar",
  category: "metrics",
  description: "Labelled horizontal progress bar with animated fill.",
  variants: ["default", "pill", "thick"],
  defaultProps: { label: "Completion", value: 72, accentColor: "#7C6FFF", trackColor: "#1C1C28" },
  schema: [
    { key: "label", label: "Bar Label", type: "text", defaultValue: "Completion", group: "Content", bindable: true },
    { key: "value", label: "Progress (0-100)", type: "number", defaultValue: 72, min: 0, max: 100, step: 1, group: "Content", bindable: true, animatable: true, animationPropertyType: "number" as any },
    { key: "accentColor", label: "Fill Color", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" as any },
    { key: "trackColor", label: "Track Color", type: "color", defaultValue: "#1C1C28", group: "Style" }
  ],
  createDefaultNode: () => ({
    id: `pb-${Date.now().toString(36)}`, name: "Progress Bar", type: "component" as any,
    componentType: "progress-bar", x: 20, y: 20, width: 50, height: 10,
    props: { label: "Completion", value: 72, accentColor: "#7C6FFF", trackColor: "#1C1C28" }
  })
});

// 13. Lower Third Duo
componentRegistry.register({
  type: "lower-third-duo",
  name: "Lower Third — Duo",
  category: "people",
  description: "Broadcast lower-third with large name and smaller title line.",
  variants: ["default", "pill", "accent-left"],
  defaultProps: { name: "Dr. Alex Rivera", title: "Chief Product Officer", accentColor: "#7C6FFF" },
  schema: [
    { key: "name", label: "Display Name", type: "text", defaultValue: "Dr. Alex Rivera", group: "Content", bindable: true },
    { key: "title", label: "Role / Title", type: "text", defaultValue: "Chief Product Officer", group: "Content", bindable: true },
    { key: "accentColor", label: "Accent Color", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" as any }
  ],
  createDefaultNode: () => ({
    id: `l3d-${Date.now().toString(36)}`, name: "Lower Third Duo", type: "component" as any,
    componentType: "lower-third-duo", x: 5, y: 78, width: 45, height: 10,
    props: { name: "Dr. Alex Rivera", title: "Chief Product Officer", accentColor: "#7C6FFF" }
  })
});

// 14. Social Handle Card
componentRegistry.register({
  type: "social-handle",
  name: "Social Handle Card",
  category: "social",
  description: "Avatar + name + @handle card for social media profiles.",
  variants: ["default", "dark", "light"],
  defaultProps: { displayName: "Clypra Studio", handle: "@clyprastudio", platform: "twitter", avatarUrl: "", accentColor: "#7C6FFF" },
  schema: [
    { key: "displayName", label: "Display Name", type: "text", defaultValue: "Clypra Studio", group: "Content", bindable: true },
    { key: "handle", label: "Handle / Username", type: "text", defaultValue: "@clyprastudio", group: "Content", bindable: true },
    { key: "platform", label: "Platform", type: "select", defaultValue: "twitter", group: "Content", options: [
      { label: "X / Twitter", value: "twitter" }, { label: "Instagram", value: "instagram" },
      { label: "YouTube", value: "youtube" }, { label: "LinkedIn", value: "linkedin" }
    ]},
    { key: "avatarUrl", label: "Avatar Image URL", type: "asset", defaultValue: "", group: "Content", bindable: true },
    { key: "accentColor", label: "Accent Color", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" as any }
  ],
  createDefaultNode: () => ({
    id: `sh-${Date.now().toString(36)}`, name: "Social Handle", type: "component" as any,
    componentType: "social-handle", x: 20, y: 20, width: 36, height: 12,
    props: { displayName: "Clypra Studio", handle: "@clyprastudio", platform: "twitter", avatarUrl: "", accentColor: "#7C6FFF" }
  })
});

// 15. Step Card
componentRegistry.register({
  type: "step-card",
  name: "Process Step Card",
  category: "process",
  description: "Numbered step card for process flows, roadmaps, and tutorials.",
  variants: ["default", "minimal", "filled"],
  defaultProps: { stepNumber: "01", title: "Define the Goal", body: "Start by identifying the key outcome.", accentColor: "#7C6FFF" },
  schema: [
    { key: "stepNumber", label: "Step Number", type: "text", defaultValue: "01", group: "Content", bindable: true },
    { key: "title", label: "Step Title", type: "text", defaultValue: "Define the Goal", group: "Content", bindable: true },
    { key: "body", label: "Step Body Text", type: "text", defaultValue: "Start by identifying the key outcome.", group: "Content", bindable: true },
    { key: "accentColor", label: "Step Accent Color", type: "color", defaultValue: "#7C6FFF", group: "Style", animatable: true, animationPropertyType: "color" as any }
  ],
  createDefaultNode: () => ({
    id: `sc-${Date.now().toString(36)}`, name: "Step Card", type: "component" as any,
    componentType: "step-card", x: 20, y: 20, width: 48, height: 20,
    props: { stepNumber: "01", title: "Define the Goal", body: "Start by identifying the key outcome.", accentColor: "#7C6FFF" }
  })
});
