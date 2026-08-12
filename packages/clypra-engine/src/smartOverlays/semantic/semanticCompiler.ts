import type { OverlayDocument, SceneNode, FrameNode } from "../overlayDocumentSchema.js";
import type { SemanticOverlayDefinition, SemanticContent } from "./semanticTypes.js";

/**
 * Pure compiler that transforms a Semantic Overlay Definition + Content payload
 * into a canonical v2.0 OverlayDocument scene graph.
 *
 * Compilation pipeline:
 *  Semantic Overlay Intent -> Slot Binding -> Scene Node Graph -> Layout Rules -> Animation Tracks
 */
export function compileSemanticOverlay(
  definition: SemanticOverlayDefinition,
  content: SemanticContent
): OverlayDocument {
  const canvasWidth = definition.canvasDefaults?.width || 1280;
  const canvasHeight = definition.canvasDefaults?.height || 720;
  const theme = content.theme || {};
  const primaryColor = theme.primaryColor || "#7C6FFF";
  const textColor = theme.textColor || "#FFFFFF";
  const bgColor = theme.backgroundColor || "#1C1C28";
  const fontFamily = theme.fontFamily || "Inter";

  const nodes: SceneNode[] = [];

  // Helper to extract value or default
  function getSlotValue(slotId: string): any {
    if (content.values[slotId] !== undefined) {
      return content.values[slotId];
    }
    const slotDef = definition.slots.find((s) => s.id === slotId);
    return slotDef?.defaultValue ?? "";
  }

  if (definition.intent === "compare") {
    // Build a two-column comparison card graph
    const titleVal = getSlotValue("title") || "Comparison";
    const leftItem = getSlotValue("leftItem") || { label: "Option A", value: "Details A" };
    const rightItem = getSlotValue("rightItem") || { label: "Option B", value: "Details B" };

    const comparisonContainer: FrameNode = {
      id: "container-comparison",
      name: "Comparison Container",
      type: "frame",
      x: 140,
      y: 160,
      width: 1000,
      height: 400,
      layout: {
        mode: "flex-column",
        gap: 24,
        padding: { top: 32, right: 32, bottom: 32, left: 32 }
      },
      style: {
        fillColor: bgColor,
        strokeColor: primaryColor,
        strokeWidth: 2,
        borderRadius: 20
      },
      children: [
        {
          id: "text-title",
          name: "Comparison Title",
          type: "text",
          x: 0,
          y: 0,
          width: 936,
          height: 50,
          text: String(titleVal),
          style: {
            fontSize: 32,
            fontWeight: "bold",
            textColor,
            fontFamily,
            textAlign: "center"
          },
          animation: {
            entrance: { type: "fade", duration: 0.6 }
          }
        },
        {
          id: "row-cards",
          name: "Cards Row",
          type: "frame",
          x: 0,
          y: 74,
          width: 936,
          height: 260,
          layout: {
            mode: "flex-row",
            gap: 32
          },
          children: [
            {
              id: "card-left",
              name: "Left Card",
              type: "frame",
              x: 0,
              y: 0,
              width: 452,
              height: 260,
              style: {
                fillColor: "#252538",
                borderRadius: 16
              },
              layout: {
                mode: "flex-column",
                gap: 16,
                padding: { top: 24, right: 24, bottom: 24, left: 24 }
              },
              children: [
                {
                  id: "left-label",
                  name: "Left Label",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 404,
                  height: 40,
                  text: String(leftItem.label || leftItem),
                  style: { fontSize: 24, fontWeight: "bold", textColor: primaryColor, fontFamily }
                },
                {
                  id: "left-val",
                  name: "Left Value",
                  type: "text",
                  x: 0,
                  y: 56,
                  width: 404,
                  height: 120,
                  text: String(leftItem.value || ""),
                  style: { fontSize: 18, textColor, fontFamily }
                }
              ],
              animation: {
                entrance: { type: "slide", duration: 0.8, delay: 0.2 }
              }
            },
            {
              id: "card-right",
              name: "Right Card",
              type: "frame",
              x: 484,
              y: 0,
              width: 452,
              height: 260,
              style: {
                fillColor: "#252538",
                borderRadius: 16
              },
              layout: {
                mode: "flex-column",
                gap: 16,
                padding: { top: 24, right: 24, bottom: 24, left: 24 }
              },
              children: [
                {
                  id: "right-label",
                  name: "Right Label",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 404,
                  height: 40,
                  text: String(rightItem.label || rightItem),
                  style: { fontSize: 24, fontWeight: "bold", textColor: primaryColor, fontFamily }
                },
                {
                  id: "right-val",
                  name: "Right Value",
                  type: "text",
                  x: 0,
                  y: 56,
                  width: 404,
                  height: 120,
                  text: String(rightItem.value || ""),
                  style: { fontSize: 18, textColor, fontFamily }
                }
              ],
              animation: {
                entrance: { type: "slide", duration: 0.8, delay: 0.4 }
              }
            }
          ]
        }
      ]
    };
    nodes.push(comparisonContainer);
  } else {
    // Default intent layout (inform / explain / annotate / etc.)
    const headerText = getSlotValue("title") || getSlotValue("heading") || definition.name;
    const bodyText = getSlotValue("body") || getSlotValue("subtitle") || getSlotValue("text") || "";

    const mainCard: FrameNode = {
      id: "container-main",
      name: `${definition.name} Card`,
      type: "frame",
      x: 100,
      y: 100,
      width: 800,
      height: 300,
      layout: {
        mode: "flex-column",
        gap: 16,
        padding: { top: 32, right: 32, bottom: 32, left: 32 }
      },
      style: {
        fillColor: bgColor,
        strokeColor: primaryColor,
        strokeWidth: 2,
        borderRadius: 16
      },
      children: [
        {
          id: "node-header",
          name: "Header Text",
          type: "text",
          x: 0,
          y: 0,
          width: 736,
          height: 44,
          text: String(headerText),
          style: {
            fontSize: 28,
            fontWeight: "bold",
            textColor: primaryColor,
            fontFamily
          },
          animation: {
            entrance: { type: "fade", duration: 0.6 }
          }
        },
        {
          id: "node-body",
          name: "Body Text",
          type: "text",
          x: 0,
          y: 60,
          width: 736,
          height: 160,
          text: String(bodyText),
          style: {
            fontSize: 18,
            textColor,
            fontFamily,
            lineHeight: 1.4
          },
          animation: {
            entrance: { type: "slide", duration: 0.8, delay: 0.2 }
          }
        }
      ]
    };
    nodes.push(mainCard);
  }

  return {
    id: `semantic-doc-${definition.id}`,
    version: "2.0",
    title: definition.name,
    category: "semantic",
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: definition.canvasDefaults?.backgroundColor || "transparent"
    },
    duration: definition.defaultBehavior?.duration || 5.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    nodes
  };
}
