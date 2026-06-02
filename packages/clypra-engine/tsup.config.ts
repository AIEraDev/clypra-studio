import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Don't bundle peer/runtime deps — consumers bring their own
  external: ["lottie-web", "jszip", "@napi-rs/canvas"],
  // Exclude test files
  ignoreWatch: ["**/*.test.ts", "**/*.spec.ts"],
  esbuildOptions(options) {
    // Target modern browsers + Node 18+
    options.target = "es2022";
  },
});
