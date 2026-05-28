import type { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import {
  textEffectConfigResponseSchema,
  deepResearchResponseSchema,
} from "./geminiSchemas";

export function createGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
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

    const ai = createGeminiClient();
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
        systemInstruction:
          "You are an expert typography and graphics designer who specializes in reversing custom 2D canvas text styling from sample images.",
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

    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Based on the user's creative visual styling prompt: "${prompt}", design a high-quality, professional 2D canvas text effect.
Translate this style metaphor into standard configuration parameters. Configure colors precisely using Hex format. Fully populate all fields including bevel, panel, and glowLayers (up to 3 layer slots if applicable).`,
        },
      ],
      config: {
        systemInstruction:
          "You are an elite web graphics designer who specializes in generating beautiful 2D canvas font styling from text descriptions.",
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

    const ai = createGeminiClient();
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

    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Perform typography design research on: "${topic}".
Return theme name, historical context, 3 visual rules, palette notes, a complete TextEffectConfig JSON, and extensionCode (canvas2d snippet for procedural extensions).`,
        },
      ],
      config: {
        systemInstruction:
          "You are a senior typographic design researcher and computational artist.",
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
