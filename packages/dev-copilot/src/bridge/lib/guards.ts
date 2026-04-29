import path from "node:path";

export const resolveAndValidatePath = (
  filePath: string,
  allowedPaths: string[],
  rootDir?: string,
) => {
  if (!filePath) {
    throw new Error("허용되지 않은 파일 경로입니다.");
  }

  let normalizedInput = filePath.replaceAll("\\", "/");

  if (rootDir) {
    const normalizedRootDir = rootDir.replaceAll("\\", "/").replace(/\/+$/, "");

    if (normalizedInput.startsWith(`${normalizedRootDir}/`)) {
      normalizedInput = normalizedInput.slice(normalizedRootDir.length + 1);
    }
  }

  if (path.isAbsolute(normalizedInput) || normalizedInput.includes("..")) {
    throw new Error("허용되지 않은 파일 경로입니다.");
  }

  const normalized = normalizedInput;
  const firstSegment = normalized.split("/")[0];
  const allowAll = allowedPaths.includes(".") || allowedPaths.includes("*");

  if (!allowAll && !allowedPaths.includes(firstSegment)) {
    throw new Error(`허용 경로 외 파일은 수정할 수 없습니다: ${firstSegment}`);
  }

  return normalized;
};
