import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "src/__tests__/gpu"),
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: "esnext",
    minify: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/__tests__/gpu/test-harness.html"),
      },
    },
  },
});
