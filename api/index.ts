import express from "express";
import dotenv from "dotenv";
import {
  handleAnalyzeStyle,
  handleDeepResearch,
  handleGenerateName,
  handleGeneratePromptStyle,
} from "./handlers";

dotenv.config();

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.post("/api/analyze-style", handleAnalyzeStyle);
app.post("/api/generate-prompt-style", handleGeneratePromptStyle);
app.post("/api/generate-name", handleGenerateName);
app.post("/api/deep-research", handleDeepResearch);

export default app;
