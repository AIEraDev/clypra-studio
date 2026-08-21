import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const packagesDir = path.resolve(__dirname, "../../packages");

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        // Workspace packages — map bare name AND all subpaths to source.
        {
          find: /^@clypra-studio\/runtime(\/.*)?$/,
          replacement: `${packagesDir}/runtime/src$1`,
        },
        {
          find: /^@clypra-studio\/ui(\/.*)?$/,
          replacement: `${packagesDir}/ui/src$1`,
        },
        {
          find: /^@clypra\/ui-color-picker(\/.*)?$/,
          replacement: `${packagesDir}/ui-color-picker/src$1`,
        },
        {
          find: /^@clypra-studio\/engine(\/.*)?$/,
          replacement: `${packagesDir}/clypra-engine/src$1`,
        },
        // Non-source-aliased packages — keep simple string alias
        {
          find: "@clypra-studio/native-render-wasm",
          replacement: `${packagesDir}/native-render-wasm/src/index.ts`,
        },
        { find: "@", replacement: path.resolve(__dirname, ".") },
      ],
    },
    optimizeDeps: {
      entries: [
        // Studio app entry (always included by default, listed explicitly)
        "src/main.tsx",
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
