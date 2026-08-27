import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: [
      { find: /^react$/, replacement: path.resolve(__dirname, "node_modules/react/index.js") },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, "node_modules/react-dom/index.js") },
      { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, "node_modules/react-dom/client.js") },
      { find: /^react\/(.*)$/, replacement: path.resolve(__dirname, "node_modules/react/$1") },
      { find: /^react-dom\/(.*)$/, replacement: path.resolve(__dirname, "node_modules/react-dom/$1") },
      {
        find: /^@clypra-studio\/engine(\/.*)?$/,
        replacement: path.resolve(__dirname, "../clypra-packages/packages/clypra-engine/src$1"),
      },
      {
        find: /^@clypra-studio\/runtime(\/.*)?$/,
        replacement: path.resolve(__dirname, "../clypra-packages/packages/runtime/src$1"),
      },
      {
        find: /^@clypra-studio\/ui(\/.*)?$/,
        replacement: path.resolve(__dirname, "../clypra-packages/packages/ui/src$1"),
      },
      {
        find: /^@clypra\/ui-color-picker$/,
        replacement: path.resolve(__dirname, "../clypra-packages/packages/ui-color-picker/dist/index.js"),
      },
      {
        find: /^@clypra\/ui-color-picker\/(.*)$/,
        replacement: path.resolve(__dirname, "../clypra-packages/packages/ui-color-picker/dist/$1"),
      },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  test: {
    server: {
      deps: {
        inline: true,
      },
    },
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    },
  },
});
