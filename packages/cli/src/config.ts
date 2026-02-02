import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface YrKitsConfig {
  aliases: {
    utils?: string;
    types?: string;
    components?: string;
    ui?: string;
    lib?: string;
    hooks?: string;
  };
}

const CONFIG_FILENAMES = ["yr-kits.json", ".yr-kits.json"];

export const DEFAULT_CONFIG: YrKitsConfig = {
  aliases: {
    utils: "src/utils",
    types: "src/types",
    components: "src/components",
    ui: "src/shared/ui",
    lib: "src/shared/lib",
    hooks: "src/hooks",
  },
};

/**
 * cwd에 yr-kits.json 또는 .yr-kits.json이 있으면 그대로 읽고,
 * 없으면 기본값을 반환합니다.
 */
export async function loadConfig(cwd: string): Promise<YrKitsConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const path = join(cwd, filename);
    try {
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as Partial<YrKitsConfig>;
      const aliases = { ...DEFAULT_CONFIG.aliases };
      if (parsed.aliases && typeof parsed.aliases === "object") {
        Object.assign(aliases, parsed.aliases);
      }
      return { aliases };
    } catch {
      continue;
    }
  }
  return { ...DEFAULT_CONFIG };
}
