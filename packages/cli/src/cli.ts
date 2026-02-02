import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { copyTemplate } from "@yr-kits/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function getRegistryTemplatesPath(): string {
  const registryPkgPath = require.resolve("@yr-kits/registry/package.json");
  const registryRoot = dirname(registryPkgPath);
  return join(registryRoot, "templates");
}

const TEMPLATE_MAP: Record<string, string> = {
  "strict-props-with-children": "utils/strict-props-with-children",
};

const program = new Command();

program
  .name("yr-kits")
  .description("유틸/컴포넌트 자동 설치 CLI")
  .version("0.0.0");

program
  .command("add <name>")
  .description("유틸 또는 컴포넌트 추가")
  .option(
    "-d, --dest <path>",
    "대상 디렉터리 (기본: ./src/types)",
    process.cwd() + "/src/types",
  )
  .action(async (name: string, options: { dest?: string }) => {
    const templateKey = TEMPLATE_MAP[name];
    if (!templateKey) {
      console.error(`알 수 없는 이름: ${name}`);
      console.error(`지원: ${Object.keys(TEMPLATE_MAP).join(", ")}`);
      process.exit(1);
    }
    const destDir = options.dest ?? join(process.cwd(), "src/types");
    const registryPath = getRegistryTemplatesPath();
    try {
      const destPath = await copyTemplate(registryPath, templateKey, destDir);
      console.log(`추가됨: ${destPath}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program.parse();
