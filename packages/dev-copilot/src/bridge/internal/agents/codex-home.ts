import { access, copyFile, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

let codexExecutionEnvPromise: Promise<NodeJS.ProcessEnv> | null = null;

const copyIfExists = async (sourcePath: string, targetPath: string) => {
  try {
    await access(sourcePath);
    await copyFile(sourcePath, targetPath);
  } catch {
    return;
  }
};

const writeIsolatedConfig = async (targetPath: string) => {
  try {
    const existingConfig = await readFile(targetPath, "utf-8");

    if (existingConfig === "") {
      return;
    }
  } catch {
    // no-op
  }

  await writeFile(targetPath, "", "utf-8");
};

const resolveSourceCodexHome = (env: NodeJS.ProcessEnv = process.env) => {
  return env.CODEX_HOME?.trim() || join(homedir(), ".codex");
};

const createIsolatedCodexHome = async (sourceCodexHome: string) => {
  const isolatedCodexHome = await mkdtemp(join(tmpdir(), "dev-copilot-codex-home-"));
  await copyIfExists(join(sourceCodexHome, "auth.json"), join(isolatedCodexHome, "auth.json"));
  await copyIfExists(
    join(sourceCodexHome, ".credentials.json"),
    join(isolatedCodexHome, ".credentials.json"),
  );
  await writeIsolatedConfig(join(isolatedCodexHome, "config.toml"));

  return isolatedCodexHome;
};

export const getCodexExecutionEnv = async (options?: { sourceCodexHome?: string }) => {
  if (codexExecutionEnvPromise) {
    return codexExecutionEnvPromise;
  }

  codexExecutionEnvPromise = (async () => {
    const sourceCodexHome = options?.sourceCodexHome ?? resolveSourceCodexHome();
    const isolatedCodexHome = await createIsolatedCodexHome(sourceCodexHome);

    return {
      CODEX_HOME: isolatedCodexHome,
    } satisfies NodeJS.ProcessEnv;
  })();

  return codexExecutionEnvPromise;
};

export const __internal = {
  resetCodexExecutionEnvCacheForTests: () => {
    codexExecutionEnvPromise = null;
  },
  resolveSourceCodexHome,
};
