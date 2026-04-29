import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface SearchConfig {
  rootDir: string;
  allowedDirs: string[];
}

export interface SearchResult {
  path: string;
  line: number;
  text: string;
}

const normalize = (value: string) => value.replaceAll("\\", "/").replace(/^\.\//, "");

const walk = async (rootDir: string, relativeDir: string, files: string[], limit: number) => {
  if (files.length >= limit) {
    return;
  }

  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (files.length >= limit) {
      return;
    }

    const relativePath = normalize(path.join(relativeDir, entry.name));

    if (["node_modules", ".next", ".git", "dist", "build", "coverage"].some((name) => relativePath.includes(`/${name}/`) || relativePath.startsWith(`${name}/`))) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(rootDir, relativePath, files, limit);
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    }
  }
};

const searchWithRg = async (config: SearchConfig, query: string, limit: number) => {
  const { stdout } = await execFileAsync(
    "rg",
    [
      "--line-number",
      "--fixed-strings",
      "--color",
      "never",
      "--glob",
      "!node_modules/**",
      "--glob",
      "!.next/**",
      "--glob",
      "!.git/**",
      query,
      ...config.allowedDirs,
    ],
    {
      cwd: config.rootDir,
      maxBuffer: 1024 * 1024,
    },
  );

  return stdout
    .split("\n")
    .filter(Boolean)
    .slice(0, limit)
    .map((line) => {
      const [filePath, lineNumber, ...rest] = line.split(":");
      return {
        path: filePath,
        line: Number(lineNumber),
        text: rest.join(":").trim(),
      };
    });
};

const searchWithNode = async (config: SearchConfig, query: string, limit: number): Promise<SearchResult[]> => {
  const files: string[] = [];

  for (const dir of config.allowedDirs) {
    try {
      await walk(config.rootDir, dir, files, 500);
    } catch {
      continue;
    }
  }

  const results: SearchResult[] = [];

  for (const filePath of files) {
    if (results.length >= limit) {
      break;
    }

    try {
      const content = await fs.readFile(path.join(config.rootDir, filePath), "utf-8");
      const lines = content.slice(0, 100_000).split("\n");

      lines.forEach((line, index) => {
        if (results.length < limit && line.includes(query)) {
          results.push({
            path: filePath,
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    } catch {
      continue;
    }
  }

  return results;
};

export const searchProjectText = async (
  config: SearchConfig,
  query: string,
  limit: number,
): Promise<SearchResult[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    return await searchWithRg(config, query, limit);
  } catch {
    return searchWithNode(config, query, limit);
  }
};

const compact = (value: string) => value.replace(/\s+/g, "");

export const searchProjectTextIgnoringWhitespace = async (
  config: SearchConfig,
  query: string,
  limit: number,
): Promise<SearchResult[]> => {
  const compactQuery = compact(query);

  if (!compactQuery) {
    return [];
  }

  const files: string[] = [];

  for (const dir of config.allowedDirs) {
    try {
      await walk(config.rootDir, dir, files, 500);
    } catch {
      continue;
    }
  }

  const results: SearchResult[] = [];

  for (const filePath of files) {
    if (results.length >= limit) {
      break;
    }

    try {
      const content = await fs.readFile(path.join(config.rootDir, filePath), "utf-8");
      const lines = content.slice(0, 100_000).split("\n");

      lines.forEach((line, index) => {
        if (results.length < limit && compact(line).includes(compactQuery)) {
          results.push({
            path: filePath,
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    } catch {
      continue;
    }
  }

  return results;
};
