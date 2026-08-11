import type {
  SmartOverlayClip,
  SmartOverlayStyle,
  SmartOverlayType,
  SmartOverlayContentUnion
} from "./smartOverlayTypes.js";

export interface ScratchElementBlock {
  id: string;
  type: "text" | "number" | "badge" | "code" | "avatar" | "bar" | "divider";
  label: string;
  slotBinding?: string; // e.g. "value", "label", "quote", "author", "code"
  defaultValue: string;
  x: number;          // relative % (0 - 100)
  y: number;          // relative % (0 - 100)
  width: number;      // relative % (0 - 100)
  height: number;     // px
  fontSize?: number;  // px
  fontWeight?: "normal" | "bold" | "600" | "800";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  textAlign?: "left" | "center" | "right";
}

export interface ScratchOverlayTemplate {
  id: string;
  name: string;
  category: SmartOverlayType;
  description: string;
  width: number;
  height: number;
  blocks: ScratchElementBlock[];
  style: SmartOverlayStyle;
}

export function createDefaultScratchBlock(type: ScratchElementBlock["type"]): ScratchElementBlock {
  const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  switch (type) {
    case "number":
      return {
        id: `block-${uid}`,
        type: "number",
        label: "Big Metric Value",
        slotBinding: "value",
        defaultValue: "+142%",
        x: 10,
        y: 20,
        width: 80,
        height: 70,
        fontSize: 56,
        fontWeight: "bold",
        color: "#7C6FFF",
        textAlign: "center"
      };
    case "text":
      return {
        id: `block-${uid}`,
        type: "text",
        label: "Text Label",
        slotBinding: "label",
        defaultValue: "Custom Scratch Label",
        x: 10,
        y: 55,
        width: 80,
        height: 35,
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
        textAlign: "center"
      };
    case "badge":
      return {
        id: `block-${uid}`,
        type: "badge",
        label: "Delta Badge",
        slotBinding: "delta",
        defaultValue: "+15% YoY",
        x: 35,
        y: 75,
        width: 30,
        height: 30,
        fontSize: 12,
        fontWeight: "bold",
        color: "#7C6FFF",
        backgroundColor: "rgba(124, 111, 255, 0.2)",
        borderRadius: 15,
        textAlign: "center"
      };
    case "code":
      return {
        id: `block-${uid}`,
        type: "code",
        label: "Code Box",
        slotBinding: "code",
        defaultValue: "const app = new ClypraStudio();",
        x: 5,
        y: 15,
        width: 90,
        height: 100,
        fontSize: 14,
        fontWeight: "normal",
        color: "#A78BFA",
        backgroundColor: "#0F0F17",
        borderColor: "#2E2E40",
        borderRadius: 8,
        textAlign: "left"
      };
    case "bar":
      return {
        id: `block-${uid}`,
        type: "bar",
        label: "Accent Line",
        slotBinding: "accent",
        defaultValue: "",
        x: 5,
        y: 5,
        width: 90,
        height: 4,
        color: "#7C6FFF",
        backgroundColor: "#7C6FFF",
        borderRadius: 2
      };
    case "divider":
      return {
        id: `block-${uid}`,
        type: "divider",
        label: "Divider Line",
        defaultValue: "",
        x: 10,
        y: 48,
        width: 80,
        height: 1,
        color: "#2A2A38",
        backgroundColor: "#2A2A38"
      };
    default:
      return {
        id: `block-${uid}`,
        type: "text",
        label: "Text Block",
        slotBinding: "text",
        defaultValue: "New Block",
        x: 10,
        y: 30,
        width: 80,
        height: 40,
        fontSize: 16,
        color: "#FFFFFF",
        textAlign: "center"
      };
  }
}

export function createBlankScratchTemplate(category: SmartOverlayType = "stat", empty = true): ScratchOverlayTemplate {
  const templateId = `custom-scratch-${Date.now().toString(36)}`;
  const initialBlocks = empty
    ? []
    : [
        createDefaultScratchBlock("number"),
        createDefaultScratchBlock("text"),
        createDefaultScratchBlock("badge")
      ];

  return {
    id: templateId,
    name: "Custom Scratch Overlay",
    category,
    description: "Hand-crafted custom smart overlay designed in Clypra Studio.",
    width: 640,
    height: 280,
    blocks: initialBlocks,
    style: {
      presetId: templateId,
      layout: "center-card",
      fontFamily: "Inter",
      fontSize: 20,
      textColor: "#FFFFFF",
      highlightColor: "#7C6FFF",
      cardBackgroundColor: "#12121A",
      cardBorderColor: "#2A2A38",
      cardOpacity: 0.95,
      animationStyle: "scale-pop"
    }
  };
}

export function convertScratchTemplateToClip(template: ScratchOverlayTemplate): SmartOverlayClip {
  let content: SmartOverlayContentUnion;

  // Extract content data based on element slot bindings
  const valueBlock = template.blocks.find((b) => b.slotBinding === "value" || b.type === "number");
  const labelBlock = template.blocks.find((b) => b.slotBinding === "label" || b.type === "text");
  const deltaBlock = template.blocks.find((b) => b.slotBinding === "delta" || b.type === "badge");
  const quoteBlock = template.blocks.find((b) => b.slotBinding === "quote");
  const authorBlock = template.blocks.find((b) => b.slotBinding === "author");
  const codeBlock = template.blocks.find((b) => b.slotBinding === "code" || b.type === "code");

  switch (template.category) {
    case "stat":
      content = {
        type: "stat",
        data: {
          value: valueBlock?.defaultValue || "+100%",
          label: labelBlock?.defaultValue || "Custom Metric",
          delta: deltaBlock?.defaultValue || "+10%"
        }
      };
      break;

    case "quote":
      content = {
        type: "quote",
        data: {
          quote: quoteBlock?.defaultValue || labelBlock?.defaultValue || "Custom blockquote text.",
          author: authorBlock?.defaultValue || "Author Name",
          title: "Executive Title"
        }
      };
      break;

    case "code":
      content = {
        type: "code",
        data: {
          title: "script.ts",
          language: "typescript",
          code: codeBlock?.defaultValue || "console.log('Custom Scratch Code');"
        }
      };
      break;

    case "lower-third":
      content = {
        type: "lower-third",
        data: {
          name: authorBlock?.defaultValue || valueBlock?.defaultValue || "Speaker Name",
          title: labelBlock?.defaultValue || "Speaker Title"
        }
      };
      break;

    case "social":
      content = {
        type: "social",
        data: {
          platform: "x",
          name: authorBlock?.defaultValue || "Custom Name",
          handle: labelBlock?.defaultValue || "@customhandle",
          metrics: "100K Followers"
        }
      };
      break;

    default:
      content = {
        type: "stat",
        data: {
          value: valueBlock?.defaultValue || "+100%",
          label: labelBlock?.defaultValue || "Custom Metric"
        }
      };
      break;
  }

  return {
    id: template.id,
    kind: "smart-overlay",
    overlayType: template.category,
    content,
    style: template.style,
    startTime: 0,
    duration: 5
  };
}
