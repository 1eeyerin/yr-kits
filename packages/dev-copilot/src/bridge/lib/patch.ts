import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { createTempPath } from "../shared/lib/temp-path";

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

const getGitApplyDirectoryArgs = async (cwd: string) => {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--show-prefix"], {
      cwd,
    });
    const prefix = stdout.trim().replace(/\/$/, "");

    return prefix ? ["--directory", prefix] : [];
  } catch {
    return [];
  }
};

interface TextReplacement {
  path: string;
  oldText: string;
  newText: string;
}

const withOriginalLineIndent = (content: string, oldText: string, newText: string) => {
  if (!newText.includes("\n")) {
    return newText;
  }

  const matchIndex = content.indexOf(oldText);

  if (matchIndex < 0) {
    return newText;
  }

  const lineStartIndex = content.lastIndexOf("\n", matchIndex) + 1;
  const linePrefix = content.slice(lineStartIndex, matchIndex);
  const indent = linePrefix.match(/^[ \t]*/)?.[0] ?? "";

  return indent ? newText.replaceAll("\n", `\n${indent}`) : newText;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createWhitespaceTolerantPattern = (value: string) => {
  const tokens = value.trim().split(/\s+/).filter(Boolean);

  if (!tokens.length) {
    return null;
  }

  return new RegExp(tokens.map(escapeRegExp).join("\\s+"));
};

const replaceText = (
  content: string,
  oldText: string,
  newText: string,
) => {
  if (content.includes(oldText)) {
    return {
      replaced: true,
      content: content.replace(
        oldText,
        withOriginalLineIndent(content, oldText, newText),
      ),
    };
  }

  const whitespaceTolerantPattern = createWhitespaceTolerantPattern(oldText);
  const match = whitespaceTolerantPattern?.exec(content);

  if (!match) {
    return {
      replaced: false,
      content,
    };
  }

  const matchedText = match[0];

  return {
    replaced: true,
    content: content.replace(
      matchedText,
      withOriginalLineIndent(content, matchedText, newText),
    ),
  };
};

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
  const tempFilePath = createTempPath("dev-copilot-check", ".patch");

  await fs.writeFile(tempFilePath, patchPreview, "utf-8");

  try {
    const directoryArgs = await getGitApplyDirectoryArgs(cwd);
    await execFileAsync("git", ["apply", "--check", ...directoryArgs, tempFilePath], { cwd });
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
  const tempDir = createTempPath("dev-copilot-diff");
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
      .replaceAll(`b/new/${filePath}`, `b/${filePath}`);
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
      const result = replaceText(newContent, replacement.oldText, replacement.newText);

      if (!result.replaced) {
        throw new Error(`원문을 파일에서 찾을 수 없습니다: ${filePath}`);
      }

      newContent = result.content;
    }

    if (newContent === oldContent) {
      continue;
    }

    patches.push(await createGitPatch(filePath, oldContent, newContent));
  }

  const patchPreview = patches.join("\n");

  if (!patchPreview.trim()) {
    throw new Error("변경할 내용이 없습니다.");
  }

  return patchPreview;
};

export const applyUnifiedPatch = async (
  patchPreview: string,
  cwd: string,
  actor: string,
) => {
  const tempFilePath = createTempPath("dev-copilot", ".patch");

  await fs.writeFile(tempFilePath, patchPreview, "utf-8");

  try {
    const directoryArgs = await getGitApplyDirectoryArgs(cwd);
    const { stdout: statOutput } = await execFileAsync(
      "git",
      ["apply", "--numstat", ...directoryArgs, tempFilePath],
      { cwd },
    );

    if (!statOutput.trim()) {
      throw new Error("patch가 실제 파일 변경을 만들지 않았습니다.");
    }

    await execFileAsync("git", ["apply", "--check", ...directoryArgs, tempFilePath], { cwd });
    await execFileAsync("git", ["apply", ...directoryArgs, tempFilePath], { cwd });

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
