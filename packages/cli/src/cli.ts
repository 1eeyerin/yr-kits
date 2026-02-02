#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { copyTemplate } from "./copy-template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getTemplatesPath(): string {
  return join(__dirname, "..", "templates");
}

const TEMPLATE_MAP: Record<string, string> = {
  "strict-props-with-children": "utils/strict-props-with-children",
};

const TEMPLATE_TO_ALIAS: Record<
  string,
  "utils" | "types" | "components" | "ui" | "lib" | "hooks"
> = {
  "utils/strict-props-with-children": "utils",
};

const program = new Command();

program
  .name("yr-kits")
  .description("유틸/컴포넌트 자동 설치 CLI")
  .version("0.1.0");

program
  .command("add <name>")
  .description("유틸 또는 컴포넌트 추가")
  .option("-d, --dest <path>", "대상 디렉터리 (설정 파일·기본값보다 우선)")
  .action(async (name: string, options: { dest?: string }) => {
    const templateKey = TEMPLATE_MAP[name];
    if (!templateKey) {
      console.error(`알 수 없는 이름: ${name}`);
      console.error(`지원: ${Object.keys(TEMPLATE_MAP).join(", ")}`);
      process.exit(1);
    }
    const cwd = process.cwd();
    const config = await loadConfig(cwd);
    const aliasKey = TEMPLATE_TO_ALIAS[templateKey];
    const defaultDir =
      aliasKey && config.aliases[aliasKey]
        ? join(cwd, config.aliases[aliasKey]!)
        : join(cwd, "src/utils");
    const destDir = options.dest ?? defaultDir;
    const templatesPath = getTemplatesPath();
    const useBasename = !!aliasKey;
    try {
      const destPath = await copyTemplate(templatesPath, templateKey, destDir, {
        useBasename,
      });
      console.log(`추가됨: ${destPath}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
