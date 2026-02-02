import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * 템플릿 파일 하나를 대상 디렉터리에 복사합니다.
 * @param templatesPath - templates 디렉터리 절대 경로
 * @param templateKey - 템플릿 상대 경로 (확장자 제외, 예: 'types/strict-props-with-children')
 * @param destDir - 복사할 대상 디렉터리 절대 경로
 * @returns 복사된 파일의 절대 경로
 */
export async function copyTemplate(
  templatesPath: string,
  templateKey: string,
  destDir: string,
): Promise<string> {
  const ext = ".ts";
  const sourcePath = join(templatesPath, `${templateKey}${ext}`);
  const destPath = join(destDir, `${templateKey}${ext}`);

  const content = await readFile(sourcePath, "utf-8");
  const destParent = join(destPath, "..");
  await mkdir(destParent, { recursive: true });
  await writeFile(destPath, content, "utf-8");

  return destPath;
}
