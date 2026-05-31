import type { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { textEffectConfigResponseSchema, deepResearchResponseSchema } from "./geminiSchemas";

function getRequestGeminiApiKey(req: Request): string {
  const headerValue = req.header("X-Clypra-Gemini-Key") || req.header("x-clypra-gemini-key") || "";
  return headerValue.trim() || process.env.GEMINI_API_KEY || "";
}

export function createGeminiClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Add one in Studio AI Tools → Gemini API Key, or configure GEMINI_API_KEY on the server.");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });
}

export async function handleAnalyzeStyle(req: Request, res: Response) {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      res.status(400).json({ error: "Missing image data" });
      return;
    }

    const ai = createGeminiClient(getRequestGeminiApiKey(req));
    const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/png",
            data: cleanBase64,
          },
        },
        {
          text: `Analyze the text effect in the provided sample image. Deconstruct its styling characteristics to generate a JSON configuration object that matches the following strict system parameters. Ensure colors are returned in Hex format (e.g. "#FF0000").
Observe if it is minimalist, standard classic, vibrant neon (with heavy glow outer layers), 3D extruded (with bevel enabled), or gothic text.
Be very precise and creative in mapping the visual colors, gradient stops, stroke rules, background panel backing, 3D/bevel depth, and multi-layer glows.`,
        },
      ],
      config: {
        systemInstruction: "You are an expert typography and graphics designer who specializes in reversing custom 2D canvas text styling from sample images.",
        responseMimeType: "application/json",
        responseSchema: textEffectConfigResponseSchema,
      },
    });

    const configData = JSON.parse((response.text || "{}").trim());
    res.json({ success: true, config: configData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Analysis API failed:", error);
    res.status(500).json({ error: message });
  }
}

export async function handleGeneratePromptStyle(req: Request, res: Response) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    const ai = createGeminiClient(getRequestGeminiApiKey(req));
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Based on the user's creative visual styling prompt: "${prompt}", design a high-quality, professional 2D canvas text effect.
Translate this style metaphor into standard configuration parameters. Configure colors precisely using Hex format. Fully populate all fields including bevel, panel, and glowLayers (up to 3 layer slots if applicable).`,
        },
      ],
      config: {
        systemInstruction: "You are an elite web graphics designer who specializes in generating beautiful 2D canvas font styling from text descriptions.",
        responseMimeType: "application/json",
        responseSchema: textEffectConfigResponseSchema,
      },
    });

    const configData = JSON.parse((response.text || "{}").trim());
    res.json({ success: true, config: configData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Prompt Generation API failed:", error);
    res.status(500).json({ error: message });
  }
}

export async function handleGenerateName(req: Request, res: Response) {
  try {
    const { config } = req.body;
    if (!config) {
      res.status(400).json({ error: "Missing config data" });
      return;
    }

    const ai = createGeminiClient(getRequestGeminiApiKey(req));
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate a creative premium name (1 to 3 words) for this typography style:\n${JSON.stringify(config, null, 2)}`,
        },
      ],
      config: {
        systemInstruction: "You are an elite brand naming specialist for typography presets.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedName: { type: Type.STRING },
          },
          required: ["suggestedName"],
        },
      },
    });

    const resultData = JSON.parse((response.text || "{}").trim());
    res.json({ success: true, suggestedName: resultData.suggestedName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Name generation failed:", error);
    res.status(500).json({ error: message });
  }
}

export async function handleDeepResearch(req: Request, res: Response) {
  try {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Missing research topic" });
      return;
    }

    const ai = createGeminiClient(getRequestGeminiApiKey(req));
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Perform typography design research on: "${topic}".
Return theme name, historical context, 3 visual rules, palette notes, a complete TextEffectConfig JSON, and extensionCode (canvas2d snippet for procedural extensions).`,
        },
      ],
      config: {
        systemInstruction: "You are a senior typographic design researcher and computational artist.",
        responseMimeType: "application/json",
        responseSchema: deepResearchResponseSchema,
      },
    });

    const reportData = JSON.parse((response.text || "{}").trim());
    res.json({ success: true, ...reportData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Deep Research API failed:", error);
    res.status(500).json({ error: message });
  }
}

export async function handleGenerateLottieMetadata(req: Request, res: Response) {
  try {
    const { templateName, currentId, currentDescription, currentTags, currentCategory, lottieData } = req.body;
    if (!templateName && !lottieData) {
      res.status(400).json({ error: "Missing template data" });
      return;
    }

    const ai = createGeminiClient(getRequestGeminiApiKey(req));

    // Available categories
    const availableCategories = ["lower-third", "title-card", "outro", "kinetic", "broadcast", "social", "cinematic", "minimal", "energetic", "documentary"];

    // Build context about the Lottie animation
    let context = `Template Name: ${templateName || "Untitled"}\n`;
    if (currentId) context += `Current ID: ${currentId}\n`;
    if (currentCategory) context += `Current Category: ${currentCategory}\n`;
    if (currentDescription) context += `Current Description: ${currentDescription}\n`;
    if (currentTags) context += `Current Tags: ${currentTags}\n`;

    // Add Lottie structure info if available
    if (lottieData) {
      const layers = lottieData.layers || [];
      const textLayers = layers.filter((l: any) => l.ty === 5);
      const shapeLayers = layers.filter((l: any) => l.ty === 4);
      context += `\nAnimation Info:\n`;
      context += `- Duration: ${lottieData.op || 0} frames at ${lottieData.fr || 30}fps\n`;
      context += `- Dimensions: ${lottieData.w}x${lottieData.h}\n`;
      context += `- Text Layers: ${textLayers.length}\n`;
      context += `- Shape Layers: ${shapeLayers.length}\n`;
      context += `- Total Layers: ${layers.length}\n`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate unique, professional metadata for a Lottie animation template based on this information:

${context}

Available Categories (you MUST choose ONE from this list):
${availableCategories.map((c) => `- ${c}`).join("\n")}

Category Definitions:
- lower-third: Text overlays at bottom of screen (news, interviews, captions)
- title-card: Opening titles, intro screens, chapter headers
- outro: Ending screens, credits, call-to-action
- kinetic: Dynamic, fast-paced motion graphics with lots of movement
- broadcast: Professional TV/news style graphics
- social: Social media posts, stories, reels
- cinematic: Film-style, dramatic, high-production value
- minimal: Clean, simple, understated design
- energetic: High-energy, vibrant, exciting animations
- documentary: Informative, educational, storytelling style

Create:
1. **category**: Choose the MOST appropriate category from the available list above
2. **id**: A unique kebab-case ID (lowercase, hyphens, descriptive, 3-5 words)
3. **name**: A human-readable name (proper capitalization, 2-4 words)
4. **description**: A compelling description (1-2 sentences, highlight use cases)
5. **tags**: 5-8 relevant tags (lowercase, single words or hyphenated phrases)

Make the metadata unique, professional, and SEO-friendly. Focus on the animation's style, purpose, and visual characteristics.`,
        },
      ],
      config: {
        systemInstruction: "You are an expert in motion graphics, animation, and digital content metadata. You create unique, descriptive, and professional metadata for Lottie animations that helps users discover and understand templates. You MUST select a category from the provided list.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["category", "id", "name", "description", "tags"],
        },
      },
    });

    const metadata = JSON.parse((response.text || "{}").trim());
    res.json({ success: true, ...metadata });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Lottie metadata generation failed:", error);
    res.status(500).json({ error: message });
  }
}
