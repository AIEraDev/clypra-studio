import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  handleAnalyzeStyle,
  handleDeepResearch,
  handleGenerateName,
  handleGeneratePromptStyle,
} from "./api/handlers";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.post("/api/analyze-style", handleAnalyzeStyle);
app.post("/api/generate-prompt-style", handleGeneratePromptStyle);
app.post("/api/generate-name", handleGenerateName);
app.post("/api/deep-research", handleDeepResearch);

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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
