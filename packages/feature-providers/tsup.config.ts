import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
    "segmentation/index": "src/segmentation/index.ts",
    "chroma-key/index": "src/chroma-key/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
});
