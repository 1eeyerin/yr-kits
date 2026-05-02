#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { initEslint, type EslintTarget } from "./utils/init-eslint.js";
import { initPrettier } from "./utils/init-prettier.js";
import { DEFAULT_CONFIG } from "./utils/config.js";
import { copyTemplate } from "./utils/copy-template.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getTemplatesPath(): string {
  return join(__dirname, "templates");
}

const TEMPLATE_MAP: Record<string, string> = {
  "strict-props-with-children": "types/strict-props-with-children",
  "ime-enter-handler": "utils/ime-enter-handler",
  "use-body-scroll-lock": "hooks/use-body-scroll-lock",
  "tooltip-viewport-clamp": "utils/tooltip-viewport-clamp",
};

const TEMPLATE_TO_ALIAS: Record<
  string,
  "utils" | "types" | "components" | "ui" | "lib" | "hooks"
> = {
  "types/strict-props-with-children": "types",
  "utils/ime-enter-handler": "utils",
  "hooks/use-body-scroll-lock": "hooks",
  "utils/tooltip-viewport-clamp": "utils",
};

const program = new Command();

async function runEslintInit(options: { target?: string; skipInstall?: boolean }) {
  if (options.target !== "react" && options.target !== "next") {
    console.error("💬 --target react 또는 --target next를 지정해주세요.");
    process.exit(1);
  }

  try {
    const result = await initEslint({
      cwd: process.cwd(),
      templatesPath: getTemplatesPath(),
      target: options.target as EslintTarget,
      skipInstall: options.skipInstall,
    });

    if (result.backupPath) {
      console.log(`기존 ESLint 설정을 백업했어요: ${result.backupPath}`);
    }

    if (result.lintScriptAdded) {
      console.log("package.json에 lint 스크립트를 추가했어요.");
    }

    if (options.skipInstall) {
      console.log("의존성 설치를 건너뛰었어요.");
    } else {
      console.log(`${result.packageManager}로 ESLint 의존성 설치를 완료했어요.`);
    }

    console.log(`eslint.config.mjs에 ${result.target} 설정을 추가했어요.`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function runPrettierInit(options: { skipInstall?: boolean }) {
  try {
    const result = await initPrettier({
      cwd: process.cwd(),
      templatesPath: getTemplatesPath(),
      skipInstall: options.skipInstall,
    });

    if (result.backupPaths.length > 0) {
      console.log(`기존 Prettier 설정을 백업했어요: ${result.backupPaths.join(", ")}`);
    }

    if (result.formatScriptAdded) {
      console.log("package.json에 format 스크립트를 추가했어요.");
    }

    if (options.skipInstall) {
      console.log("의존성 설치를 건너뛰었어요.");
    } else {
      console.log(`${result.packageManager}로 Prettier 의존성 설치를 완료했어요.`);
    }

    console.log(".prettierrc.js 설정을 추가했어요.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

program
  .name("yr-kits")
  .description("프론트엔드 프로젝트에 유틸리티, 훅, 타입, 설정 파일을 추가하는 CLI")
  .version("0.1.0");

program
  .command("add <name>")
  .description("💬 지정한 이름의 유틸 또는 컴포넌트를 프로젝트에 추가합니다.")
  .option("-d, --dest <path>", "복사할 대상 디렉터리 경로")
  .action(async (name: string, options: { dest?: string }) => {
    const templateKey = TEMPLATE_MAP[name];
    if (!templateKey) {
      console.error(
        `💬 [${name}]는 존재하는 템플릿이 아닙니다.\n---\n사용 가능한 목록 : [${Object.keys(TEMPLATE_MAP).join(", ")}]`,
      );
      process.exit(1);
    }
    const cwd = process.cwd();
    const aliasKey = TEMPLATE_TO_ALIAS[templateKey];
    const defaultDir =
      aliasKey && DEFAULT_CONFIG.aliases[aliasKey]
        ? join(cwd, DEFAULT_CONFIG.aliases[aliasKey]!)
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

program
  .command("eslint")
  .description("💬 ESLint 설정 파일을 추가합니다.")
  .option("--target <target>", "eslint 설정 대상: react 또는 next")
  .option("--skip-install", "의존성 설치를 건너뜁니다.")
  .action(runEslintInit);

program
  .command("prettier")
  .description("💬 Prettier 설정 파일을 추가합니다.")
  .option("--skip-install", "의존성 설치를 건너뜁니다.")
  .action(runPrettierInit);

program.parse();
