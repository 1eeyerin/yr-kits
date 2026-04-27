import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const getChangedFiles = (patchPreview: string) => {
  const regex = /^\+\+\+ b\/(.+)$/gm;
  const changedFiles = new Set<string>();

  let match = regex.exec(patchPreview);
  while (match) {
    changedFiles.add(match[1]);
    match = regex.exec(patchPreview);
  }

  return [...changedFiles];
};

interface TextReplacement {
  path: string;
  oldText: string;
  newText: string;
}

export const normalizeUnifiedPatch = (patchPreview: string) => {
  const withoutFence = patchPreview
    .replace(/^```(?:diff|patch)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const diffStartIndex = withoutFence.indexOf("diff --git ");

  return diffStartIndex >= 0
    ? withoutFence.slice(diffStartIndex).trim()
    : withoutFence;
};

export const validatePatchPaths = (
  patchPreview: string,
  validatePath: (filePath: string) => string,
) => {
  const changedFiles = getChangedFiles(patchPreview);

  if (!changedFiles.length) {
    throw new Error("패치에서 변경 파일을 찾을 수 없습니다.");
  }

  changedFiles.forEach(validatePath);

  return changedFiles;
};

export const checkUnifiedPatch = async (patchPreview: string, cwd: string) => {
  const tempFilePath = path.join(
    os.tmpdir(),
    `dev-copilot-check-${Date.now()}-${Math.random().toString(16).slice(2)}.patch`,
  );

  await fs.writeFile(tempFilePath, `${patchPreview.trimEnd()}\n`, "utf-8");

  try {
    await execFileAsync("git", ["apply", "--check", tempFilePath], { cwd });
  } catch (error) {
    const detail =
      error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: unknown }).stderr)
        : error instanceof Error
          ? error.message
          : "알 수 없는 patch 검증 오류";

    throw new Error(`적용 가능한 diff를 생성하지 못했습니다: ${detail.trim()}`);
  } finally {
    await fs.rm(tempFilePath, { force: true });
  }
};

const createGitPatch = async (
  filePath: string,
  oldContent: string,
  newContent: string,
) => {
  const tempDir = path.join(
    os.tmpdir(),
    `dev-copilot-diff-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const oldFilePath = path.join(tempDir, "old", filePath);
  const newFilePath = path.join(tempDir, "new", filePath);

  await fs.mkdir(path.dirname(oldFilePath), { recursive: true });
  await fs.mkdir(path.dirname(newFilePath), { recursive: true });
  await fs.writeFile(oldFilePath, oldContent, "utf-8");
  await fs.writeFile(newFilePath, newContent, "utf-8");

  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "diff",
        "--no-index",
        "--no-ext-diff",
        "--src-prefix=a/",
        "--dst-prefix=b/",
        "--",
        path.join("old", filePath),
        path.join("new", filePath),
      ],
      { cwd: tempDir },
    ).catch((error: unknown) => {
      const typedError = error as { stdout?: string; code?: number };

      if (typedError.code === 1 && typedError.stdout) {
        return { stdout: typedError.stdout };
      }

      throw error;
    });

    return stdout
      .replaceAll(`a/old/${filePath}`, `a/${filePath}`)
      .replaceAll(`b/new/${filePath}`, `b/${filePath}`)
      .trim();
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
};

export const createPatchFromTextReplacements = async (
  replacements: TextReplacement[],
  cwd: string,
  validatePath: (filePath: string) => string,
) => {
  const byPath = new Map<string, TextReplacement[]>();

  for (const replacement of replacements) {
    const normalizedPath = validatePath(replacement.path);
    const current = byPath.get(normalizedPath) ?? [];
    current.push(replacement);
    byPath.set(normalizedPath, current);
  }

  const patches: string[] = [];

  for (const [filePath, fileReplacements] of byPath.entries()) {
    const absolutePath = path.join(cwd, filePath);
    const oldContent = await fs.readFile(absolutePath, "utf-8");
    let newContent = oldContent;

    for (const replacement of fileReplacements) {
      if (!newContent.includes(replacement.oldText)) {
        throw new Error(`원문을 파일에서 찾을 수 없습니다: ${filePath}`);
      }

      newContent = newContent.replace(replacement.oldText, replacement.newText);
    }

    if (newContent === oldContent) {
      continue;
    }

    patches.push(await createGitPatch(filePath, oldContent, newContent));
  }

  const patchPreview = patches.join("\n").trim();

  if (!patchPreview) {
    throw new Error("변경할 내용이 없습니다.");
  }

  return patchPreview;
};

export const applyUnifiedPatch = async (
  patchPreview: string,
  cwd: string,
  actor: string,
) => {
  const tempFilePath = path.join(
    os.tmpdir(),
    `dev-copilot-${Date.now()}-${Math.random().toString(16).slice(2)}.patch`,
  );

  await fs.writeFile(tempFilePath, `${patchPreview.trimEnd()}\n`, "utf-8");

  try {
    await execFileAsync("git", ["apply", "--check", tempFilePath], { cwd });
    await execFileAsync("git", ["apply", tempFilePath], { cwd });

    const changedFiles = getChangedFiles(patchPreview);

    return {
      actor,
      changedFiles,
    };
  } catch (error) {
    const detail =
      error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: unknown }).stderr)
        : error instanceof Error
          ? error.message
          : "알 수 없는 patch 적용 오류";

    throw new Error(`patch 적용에 실패했습니다: ${detail.trim()}`);
  } finally {
    await fs.rm(tempFilePath, { force: true });
  }
};
