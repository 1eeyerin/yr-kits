import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/cli.ts", "src/utils/ime-enter-handler.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  platform: "node",
  minify: true,
});
