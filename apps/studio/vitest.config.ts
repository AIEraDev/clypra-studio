import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@clypra-studio\/engine(\/.*)?$/,
        replacement: path.resolve(__dirname, "../../packages/clypra-engine/src$1"),
      },
      {
        find: /^@clypra-studio\/runtime(\/.*)?$/,
        replacement: path.resolve(__dirname, "../../packages/runtime/src$1"),
      },
      {
        find: /^@clypra-studio\/ui(\/.*)?$/,
        replacement: path.resolve(__dirname, "../../packages/ui/src$1"),
      },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  test: {
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
