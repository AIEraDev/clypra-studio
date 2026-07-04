import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import RootApp from "./RootApp.tsx";
import "./index.css";
import { initializeFontSystem } from "@clypra-studio/engine";

// Initialize font system for lottie-web
initializeFontSystem();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
