import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { defineConfig } from "vite";

export default defineConfig(() => {
  const packagesDir = path.resolve(__dirname, "../clypra-packages/packages");
  const hasWorkspacePackages = fs.existsSync(packagesDir);

  const workspaceAliases = hasWorkspacePackages
    ? [
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
      ]
    : [];

  return {
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime", "@floating-ui/react"],
      alias: [
        { find: /^react$/, replacement: path.resolve(__dirname, "node_modules/react") },
        { find: /^react-dom$/, replacement: path.resolve(__dirname, "node_modules/react-dom") },
        { find: /^react\/(.*)$/, replacement: path.resolve(__dirname, "node_modules/react/$1") },
        { find: /^react-dom\/(.*)$/, replacement: path.resolve(__dirname, "node_modules/react-dom/$1") },
        { find: /^@floating-ui\/react$/, replacement: path.resolve(__dirname, "node_modules/@floating-ui/react") },
        ...workspaceAliases,
        { find: "@", replacement: path.resolve(__dirname, "src") },
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@floating-ui/react"],
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
      fs: {
        allow: [
          path.resolve(__dirname, "."),
          path.resolve(__dirname, "../clypra-packages"),
        ],
      },
    },
  };
});
