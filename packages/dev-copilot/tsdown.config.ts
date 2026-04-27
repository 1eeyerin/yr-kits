import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/types/index.ts",
    "src/bin/dev-copilot.ts",
    "src/bin/bridge.ts",
  ],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: true,
  platform: "node",
  sourcemap: true,
  minify: false,
});
