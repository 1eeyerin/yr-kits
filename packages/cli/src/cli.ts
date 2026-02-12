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
  "strict-props-with-children": "types/strict-props-with-children",
};

const TEMPLATE_TO_ALIAS: Record<
  string,
  "utils" | "types" | "components" | "ui" | "lib" | "hooks"
> = {
  "types/strict-props-with-children": "types",
};

const program = new Command();

program
  .name("yr-kits")
  .description("CLI to add utilities & components")
  .version("0.1.0");

program
  .command("add <name>")
  .description("지정한 이름의 유틸 또는 컴포넌트를 프로젝트에 추가합니다.")
  .option(
    "-d, --dest <path>",
    "복사할 대상 디렉터리 경로. 설정 파일·기본값보다 우선합니다.",
  )
  .action(async (name: string, options: { dest?: string }) => {
    const templateKey = TEMPLATE_MAP[name];
    if (!templateKey) {
      console.error(
        `💬 [${name}]는 존재하는 템플릿이 아닙니다.\n---\n사용 가능한 목록 : [${Object.keys(TEMPLATE_MAP).join(", ")}]`,
      );
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
      console.log(`[${destPath}]에 성공적으로 추가 되었어요 😎`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
