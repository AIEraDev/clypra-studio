// api/index.ts
import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

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
      res.status(400).json({ error: "Missing image" });
      return;
    }
    const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;
    const imagePart = { inlineData: { mimeType: mimeType || "image/png", data: cleanBase64 } };
    const textPart = { text: "Analyze the text effect..." }; // Map your prompt query logic here

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      // (Your systemInstruction and responseSchema definitions here)
    });

    res.json({ success: true, config: JSON.parse((response.text || "{}").trim()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate prompt-styles
app.post("/api/generate-prompt-style", async (req, res) => {
  // (Your prompt generation logic here...)
});

// Endpoint to generate names
app.post("/api/generate-name", async (req, res) => {
  // (Your style name generator logic here...)
});

// Endpoint to do deep research
app.post("/api/deep-research", async (req, res) => {
  // (Your deep research logic here...)
});

// Export the Express app as a serverless output
export default app;