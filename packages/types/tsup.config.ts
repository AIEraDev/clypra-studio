import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    effect: "src/effect.ts",
    graph: "src/graph.ts",
    frame: "src/frame.ts",
    job: "src/job.ts",
    snapshot: "src/snapshot.ts",
    vefx: "src/vefx.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  splitting: false,
});
