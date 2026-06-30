import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "graph/index": "src/graph/index.ts",
    "planner/index": "src/planner/index.ts",
    "job/index": "src/job/index.ts",
    "executor/index": "src/executor/index.ts",
    "state/index": "src/state/index.ts",
    "pixi/index": "src/pixi/index.ts",
    "null/index": "src/null/index.ts",
    "resources/index": "src/resources/index.ts",
    "validation/index": "src/validation/index.ts",
    "telemetry/index": "src/telemetry/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
