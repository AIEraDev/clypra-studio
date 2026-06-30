import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "graph/index": "src/graph/index.ts",
    "planner/index": "src/planner/index.ts",
    "pixi/index": "src/pixi/index.ts",
    "resources/index": "src/resources/index.ts",
    "validation/index": "src/validation/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
