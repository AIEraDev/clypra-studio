import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limits to handle base64 images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint to analyze text style from an image
app.post("/api/analyze-style", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
       res.status(400).json({ error: "Missing image data" });
       return;
    }

    const cleanBase64 = image.includes("base64,")
      ? image.split("base64,")[1]
      : image;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze the text effect in the provided sample image. Deconstruct its styling characteristics to generate a JSON configuration object that matches the following strict system parameters. Ensure colors are returned in Hex format (e.g. "#FF0000").
Observe if it is minimalist, standard classic, vibrant neon (with heavy glow outer layers), 3D extruded (with bevel enabled), or gothic text.
Be very precise and creative in mapping the visual colors, gradient stops, stroke rules, background panel backing, 3D/bevel depth, and multi-layer glows (one, two, or three glows).`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      config: {
        systemInstruction: "You are an expert typography and typography graphics designer who specializes in reversing custom 2D canvas text styling, shadows, fills, slopes, bevels, and glows from sample images.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            effectName: { type: Type.STRING, description: "Descriptive artistic name of the detected style (e.g., 'Retro Chrome', 'Cyber Neon')" },
            fontFamily: { type: Type.STRING, description: "A close matched standard web-safe font-family like 'Inter', 'monospace', 'Impact', 'Georgia', 'Arial Black', 'Courier New', 'Verdana'" },
            fontWeight: { type: Type.INTEGER, description: "Thickness value, 400 (normal) to 900 (ultra bold)" },
            fontStyle: { type: Type.STRING, description: "'normal' or 'italic'" },
            fontSize: { type: Type.INTEGER, description: "Suggested display size between 40 and 120" },
            letterSpacing: { type: Type.INTEGER, description: "Spacing index, between -5 and 20" },
            lineHeight: { type: Type.NUMBER, description: "Suggested line height ratio between 0.8 and 2.0" },
            fillType: { type: Type.STRING, description: "'solid', 'linear', 'radial', or 'none'" },
            fillColor: { type: Type.STRING, description: "Base hexadecimal color (e.g. '#FFFFFF')" },
            fillGradientAngle: { type: Type.INTEGER, description: "Gradient direction in degrees (0 to 360)" },
            fillGradientStops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  color: { type: Type.STRING },
                  offset: { type: Type.INTEGER, description: "Int range from 0 to 100" }
                },
                required: ["color", "offset"]
              }
            },
            strokeEnabled: { type: Type.BOOLEAN },
            strokeColor: { type: Type.STRING },
            strokeWidth: { type: Type.INTEGER, description: "Stroke outline thickness, 0 to 20" },
            strokePosition: { type: Type.STRING, description: "'outside', 'center', or 'inside'" },
            strokeOpacity: { type: Type.INTEGER, description: "0 to 100" },
            strokeLineJoin: { type: Type.STRING, description: "'round', 'miter', or 'bevel'" },
            glowLayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  enabled: { type: Type.BOOLEAN },
                  color: { type: Type.STRING },
                  blur: { type: Type.INTEGER, description: "Glow blur from 0 to 150" },
                  opacity: { type: Type.INTEGER, description: "Glow opacity from 0 to 100" },
                  type: { type: Type.STRING, description: "'outer' or 'inner'" }
                },
                required: ["enabled", "color", "blur", "opacity", "type"]
              }
            },
            shadowEnabled: { type: Type.BOOLEAN },
            shadowColor: { type: Type.STRING },
            shadowBlur: { type: Type.INTEGER, description: "Shadow blur size 0 to 60" },
            shadowOffsetX: { type: Type.INTEGER, description: "X offset -50 to 50" },
            shadowOffsetY: { type: Type.INTEGER, description: "Y offset -50 to 50" },
            shadowOpacity: { type: Type.INTEGER, description: "0 to 100" },
            shadowType: { type: Type.STRING, description: "'drop' or 'inner'" },
            bevelEnabled: { type: Type.BOOLEAN },
            bevelDepth: { type: Type.INTEGER, description: "Bevel extrusion depth 0 to 15" },
            bevelHighlight: { type: Type.STRING, description: "Highlight hex color, e.g. '#FFFFFF'" },
            bevelShadow: { type: Type.STRING, description: "Shading shadow hex color, e.g. '#000000'" },
            bevelDirection: { type: Type.STRING, description: "'bottom-right', 'bottom', or 'right'" },
            panelEnabled: { type: Type.BOOLEAN },
            panelColor: { type: Type.STRING },
            panelOpacity: { type: Type.INTEGER, description: "Panel backdrop transparency 0 to 100" },
            panelRadius: { type: Type.INTEGER, description: "Panel corner curve 0 to 45" },
            panelPaddingX: { type: Type.INTEGER, description: "0 to 60" },
            panelPaddingY: { type: Type.INTEGER, description: "0 to 30" },
            panelStrokeEnabled: { type: Type.BOOLEAN },
            panelStrokeColor: { type: Type.STRING },
            panelStrokeWidth: { type: Type.INTEGER, description: "Panel border thickness 1 to 8" }
          },
          required: [
            "effectName", "fontFamily", "fontWeight", "fontStyle", "fontSize",
            "letterSpacing", "lineHeight", "fillType", "fillColor", "fillGradientAngle", "fillGradientStops",
            "strokeEnabled", "strokeColor", "strokeWidth", "strokePosition", "strokeOpacity", "strokeLineJoin",
            "glowLayers", "shadowEnabled", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "shadowOpacity", "shadowType",
            "bevelEnabled", "bevelDepth", "bevelHighlight", "bevelShadow", "bevelDirection",
            "panelEnabled", "panelColor", "panelOpacity", "panelRadius", "panelPaddingX", "panelPaddingY", "panelStrokeEnabled"
          ]
        }
      }
    });

    const configText = response.text || "{}";
    const configData = JSON.parse(configText.trim());
    res.json({ success: true, config: configData });
  } catch (error: any) {
    console.error("Analysis API failed:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error in Style Analysis" });
  }
});

// Endpoint to generate text style effect parameters from a text prompt
app.post("/api/generate-prompt-style", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
       res.status(400).json({ error: "Missing prompt" });
       return;
    }

    const textPart = {
      text: `Based on the user's creative visual styling prompt: "${prompt}", design a high-quality, professional 2D canvas text effect. 
Translate this style metaphor into standard configuration parameters.
Example styles:
- If prompt is "gold lava", create a rich orange-red-yellow gradient fill, with deep orange inner shadow, outer glowLayers of fire orange, 3D/bevel extrusion with yellow highlights and deep black shadows.
- If prompt is "vaporwave neon", use hot pink or neon violet stroke, zero fill (none fill), multiple cyan/magenta outer glows, futuristic Montserrat/Impact fonts, letterSpacing 8.
- If prompt is "clean slate", go standard, solid off-white, thin subtle black center stroke, slight drop shadow, and clean Inter typography.

Configure colors precisely using Hex format. Fully populate all fields including bevel, panel, and glowLayers (up to 3 layer slots if applicable).`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [textPart],
      config: {
        systemInstruction: "You are an elite web graphics designer and expert artist who specializes in generating beautiful, harmonized 2D canvas font styling, fills, strokes, glows, 3D bevels, and backdrop configurations based on text descriptions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            effectName: { type: Type.STRING, description: "Descriptive artistic name of the generated style matching the prompt concept" },
            fontFamily: { type: Type.STRING, description: "A close matched standard web-safe font-family like 'Inter', 'monospace', 'Impact', 'Georgia', 'Arial Black', 'Courier New', 'Verdana'" },
            fontWeight: { type: Type.INTEGER, description: "Thickness value, 400 (normal) to 900 (ultra bold)" },
            fontStyle: { type: Type.STRING, description: "'normal' or 'italic'" },
            fontSize: { type: Type.INTEGER, description: "Suggested display size between 40 and 120" },
            letterSpacing: { type: Type.INTEGER, description: "Spacing index, between -5 and 20" },
            lineHeight: { type: Type.NUMBER, description: "Suggested line height ratio between 0.8 and 2.0" },
            fillType: { type: Type.STRING, description: "'solid', 'linear', 'radial', or 'none'" },
            fillColor: { type: Type.STRING, description: "Base hexadecimal color (e.g. '#FFFFFF')" },
            fillGradientAngle: { type: Type.INTEGER, description: "Gradient direction in degrees (0 to 360)" },
            fillGradientStops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  color: { type: Type.STRING },
                  offset: { type: Type.INTEGER, description: "Int range from 0 to 100" }
                },
                required: ["color", "offset"]
              }
            },
            strokeEnabled: { type: Type.BOOLEAN },
            strokeColor: { type: Type.STRING },
            strokeWidth: { type: Type.INTEGER, description: "Stroke outline thickness, 0 to 20" },
            strokePosition: { type: Type.STRING, description: "'outside', 'center', or 'inside'" },
            strokeOpacity: { type: Type.INTEGER, description: "0 to 100" },
            strokeLineJoin: { type: Type.STRING, description: "'round', 'miter', or 'bevel'" },
            glowLayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  enabled: { type: Type.BOOLEAN },
                  color: { type: Type.STRING },
                  blur: { type: Type.INTEGER, description: "Glow blur from 0 to 150" },
                  opacity: { type: Type.INTEGER, description: "Glow opacity from 0 to 100" },
                  type: { type: Type.STRING, description: "'outer' or 'inner'" }
                },
                required: ["enabled", "color", "blur", "opacity", "type"]
              }
            },
            shadowEnabled: { type: Type.BOOLEAN },
            shadowColor: { type: Type.STRING },
            shadowBlur: { type: Type.INTEGER, description: "Shadow blur size 0 to 60" },
            shadowOffsetX: { type: Type.INTEGER, description: "X offset -50 to 50" },
            shadowOffsetY: { type: Type.INTEGER, description: "Y offset -50 to 50" },
            shadowOpacity: { type: Type.INTEGER, description: "0 to 100" },
            shadowType: { type: Type.STRING, description: "'drop' or 'inner'" },
            bevelEnabled: { type: Type.BOOLEAN },
            bevelDepth: { type: Type.INTEGER, description: "Bevel extrusion depth 0 to 15" },
            bevelHighlight: { type: Type.STRING, description: "Highlight hex color, e.g. '#FFFFFF'" },
            bevelShadow: { type: Type.STRING, description: "Shading shadow hex color, e.g. '#000000'" },
            bevelDirection: { type: Type.STRING, description: "'bottom-right', 'bottom', or 'right'" },
            panelEnabled: { type: Type.BOOLEAN },
            panelColor: { type: Type.STRING },
            panelOpacity: { type: Type.INTEGER, description: "Panel backdrop transparency 0 to 100" },
            panelRadius: { type: Type.INTEGER, description: "Panel corner curve 0 to 45" },
            panelPaddingX: { type: Type.INTEGER, description: "0 to 60" },
            panelPaddingY: { type: Type.INTEGER, description: "0 to 30" },
            panelStrokeEnabled: { type: Type.BOOLEAN },
            panelStrokeColor: { type: Type.STRING },
            panelStrokeWidth: { type: Type.INTEGER, description: "Panel border thickness 1 to 8" }
          },
          required: [
            "effectName", "fontFamily", "fontWeight", "fontStyle", "fontSize",
            "letterSpacing", "lineHeight", "fillType", "fillColor", "fillGradientAngle", "fillGradientStops",
            "strokeEnabled", "strokeColor", "strokeWidth", "strokePosition", "strokeOpacity", "strokeLineJoin",
            "glowLayers", "shadowEnabled", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "shadowOpacity", "shadowType",
            "bevelEnabled", "bevelDepth", "bevelHighlight", "bevelShadow", "bevelDirection",
            "panelEnabled", "panelColor", "panelOpacity", "panelRadius", "panelPaddingX", "panelPaddingY", "panelStrokeEnabled"
          ]
        }
      }
    });

    const configText = response.text || "{}";
    const configData = JSON.parse(configText.trim());
    res.json({ success: true, config: configData });
  } catch (error: any) {
    console.error("Prompt Generation API failed:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error in Style Prompt Generation" });
  }
});

// Endpoint to generate a creative, descriptive name for a text effect configuration
app.post("/api/generate-name", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
       res.status(400).json({ error: "Missing config data" });
       return;
    }

    const textPart = {
      text: `Generate an incredibly creative, premium, catchy, design-oriented name (1 to 3 words) for a typography design with the following visual style configuration:
${JSON.stringify(config, null, 2)}

Rules:
- Evoke a strong visual vibe from the colors, glows, 3D structures, and font family (e.g., gold and shiny fits "Solar Obsidian" or "Imperial Aureum", retro blues and pinks suggest "Vapor Horizon", neon outlines fit "Laser Grid", sleek clean weights suggest "Swiss Mono").
- Keep it highly scannable, artistic, and short. Do not use generic filler words like 'fancy' or 'cool'. Return a single name in the response object.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [textPart],
      config: {
        systemInstruction: "You are an elite brand naming specialist and graphic style curator. You suggest incredible, evocative typography and preset names that sound like premium graphic templates.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedName: { type: Type.STRING, description: "Single descriptive name under 3 words that fits the text style mood" }
          },
          required: ["suggestedName"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultData = JSON.parse(resultText.trim());
    res.json({ success: true, suggestedName: resultData.suggestedName });
  } catch (error: any) {
    console.error("Name generation failed:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error in Name Generation" });
  }
});

// Endpoint to execute a deep typography design research task and generate custom canvas extensions
app.post("/api/deep-research", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
       res.status(400).json({ error: "Missing research topic query descriptor" });
       return;
    }

    const textPart = {
      text: `Perform high-fidelity typography and visual design deep research on the following request: "${topic}".
Deconstruct this movement, vibe, or subculture into:
1. Design movement name
2. Brief historical and cultural design context
3. 3 key rules of styling or color usage
4. Critical palette colors in hex format
5. A matching standard canvas TextEffectConfig JSON object
6. An advanced JavaScript/canvas2d snippet illustrating how to build procedural extendability tools for this exact style (e.g. custom gridlines, digital static overlays, fluid stains, chrome gradients, background flow lines, or particle dusts that are not supported in standard sliders).

Ensure the configuration is fully completed (with solid, linear, radial or none fill, text shadow, bevel enabling, multi-layer outer/inner glows, and optional panel board backing).`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [textPart],
      config: {
        systemInstruction: "You are a senior typographic design historian, lead design researcher, and computational artist. You deconstruct visual subcultures, translate them into standard configuration payloads, and create custom canvas extensions to extend the drawing context beyond standard boundaries.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeName: { type: Type.STRING, description: "Descriptive design name for this researched visual concept" },
            historicalContext: { type: Type.STRING, description: "2-3 sentence cultural and aesthetic deconstruction of this theme" },
            visualRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 key graphical design principles characterizing this theme"
            },
            paletteDeconstruction: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Brief meanings and mood effects mapped to standard colors"
            },
            config: {
              type: Type.OBJECT,
              description: "A standard TextEffectConfig compatible JSON payload reflecting the researched style",
              properties: {
                effectName: { type: Type.STRING },
                fontFamily: { type: Type.STRING, description: "Standard web-safe or custom Google Font name: 'Poppins', 'Bebas Neue', 'Permanent Marker', 'Montserrat', 'Inter', 'monospace', 'Playfair Display'" },
                fontWeight: { type: Type.INTEGER },
                fontStyle: { type: Type.STRING },
                fontSize: { type: Type.INTEGER },
                letterSpacing: { type: Type.INTEGER },
                lineHeight: { type: Type.NUMBER },
                fillType: { type: Type.STRING },
                fillColor: { type: Type.STRING },
                fillGradientAngle: { type: Type.INTEGER },
                fillGradientStops: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      color: { type: Type.STRING },
                      offset: { type: Type.INTEGER }
                    },
                    required: ["color", "offset"]
                  }
                },
                strokeEnabled: { type: Type.BOOLEAN },
                strokeColor: { type: Type.STRING },
                strokeWidth: { type: Type.INTEGER },
                strokePosition: { type: Type.STRING },
                strokeOpacity: { type: Type.INTEGER },
                strokeLineJoin: { type: Type.STRING },
                glowLayers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      enabled: { type: Type.BOOLEAN },
                      color: { type: Type.STRING },
                      blur: { type: Type.INTEGER },
                      opacity: { type: Type.INTEGER },
                      type: { type: Type.STRING }
                    },
                    required: ["enabled", "color", "blur", "opacity", "type"]
                  }
                },
                shadowEnabled: { type: Type.BOOLEAN },
                shadowColor: { type: Type.STRING },
                shadowBlur: { type: Type.INTEGER },
                shadowOffsetX: { type: Type.INTEGER },
                shadowOffsetY: { type: Type.INTEGER },
                shadowOpacity: { type: Type.INTEGER },
                shadowType: { type: Type.STRING },
                bevelEnabled: { type: Type.BOOLEAN },
                bevelDepth: { type: Type.INTEGER },
                bevelHighlight: { type: Type.STRING },
                bevelShadow: { type: Type.STRING },
                bevelDirection: { type: Type.STRING },
                panelEnabled: { type: Type.BOOLEAN },
                panelColor: { type: Type.STRING },
                panelOpacity: { type: Type.INTEGER },
                panelRadius: { type: Type.INTEGER },
                panelPaddingX: { type: Type.INTEGER },
                panelPaddingY: { type: Type.INTEGER },
                panelStrokeEnabled: { type: Type.BOOLEAN },
                panelStrokeColor: { type: Type.STRING },
                panelStrokeWidth: { type: Type.INTEGER }
              },
              required: [
                "effectName", "fontFamily", "fontWeight", "fontStyle", "fontSize",
                "letterSpacing", "lineHeight", "fillType", "fillColor", "fillGradientAngle", "fillGradientStops",
                "strokeEnabled", "strokeColor", "strokeWidth", "strokePosition", "strokeOpacity", "strokeLineJoin",
                "glowLayers", "shadowEnabled", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "shadowOpacity", "shadowType",
                "bevelEnabled", "bevelDepth", "bevelHighlight", "bevelShadow", "bevelDirection",
                "panelEnabled", "panelColor", "panelOpacity", "panelRadius", "panelPaddingX", "panelPaddingY", "panelStrokeEnabled"
              ]
            },
            extensionCode: {
              type: Type.STRING,
              description: "Full commented HTML5 canvas rendering functions showing developers how to draw custom code extensions (or advanced context 2d filter shaders) corresponding to this movement"
            }
          },
          required: ["themeName", "historicalContext", "visualRules", "paletteDeconstruction", "config", "extensionCode"]
        }
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText.trim());
    res.json({ success: true, ...reportData });
  } catch (error: any) {
    console.error("Deep Research API failed:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error in Deep Research" });
  }
});


// Vite middleware flow
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
