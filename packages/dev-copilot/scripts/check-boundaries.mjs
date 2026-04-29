import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { globSync } from "node:fs";

const root = cwd();
const files = globSync("src/**/*.{ts,tsx}", { cwd: root, exclude: ["src/components/**", "src/hooks/**", "src/lib/**", "src/bridge/**", "src/types/**"] });

const layerOf = (filePath) => {
  const normalized = filePath.replaceAll("\\", "/");

  if (normalized.startsWith("src/app/")) return "app";
  if (normalized.startsWith("src/widgets/")) return "widgets";
  if (normalized.startsWith("src/features/")) return "features";
  if (normalized.startsWith("src/entities/")) return "entities";
  if (normalized.startsWith("src/shared/")) return "shared";
  return null;
};

const allowed = {
  app: ["widgets", "features", "entities", "shared", "app"],
  widgets: ["features", "entities", "shared", "widgets"],
  features: ["entities", "shared", "features"],
  entities: ["shared", "entities"],
  shared: ["shared"],
};

const getImportSpecifiers = (code) => {
  const matches = [...code.matchAll(/from\s+["']([^"']+)["']/g)];
  return matches.map((match) => match[1]);
};

const resolveRelativeImport = (filePath, specifier) => {
  const baseDir = join(root, filePath, "..");
  const fullPath = join(baseDir, specifier);
  const normalized = relative(root, fullPath).replaceAll("\\", "/");
  return normalized;
};

const violations = [];

for (const filePath of files) {
  const fromLayer = layerOf(filePath);
  if (!fromLayer) continue;

  const content = readFileSync(join(root, filePath), "utf8");
  const imports = getImportSpecifiers(content);

  for (const specifier of imports) {
    let targetLayer = null;

    if (specifier.startsWith("@/")) {
      const [, layer] = specifier.split("/");
      targetLayer = layer;
    } else if (specifier.startsWith(".")) {
      const resolved = resolveRelativeImport(filePath, specifier);
      targetLayer = layerOf(resolved);
    }

    if (!targetLayer) continue;

    if (!allowed[fromLayer].includes(targetLayer)) {
      violations.push(`${filePath}: ${fromLayer} -> ${targetLayer} 금지 import (${specifier})`);
    }
  }
}

if (violations.length) {
  console.error("FSD Lite import 경계 위반\n");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("FSD Lite import 경계 검사 통과");
