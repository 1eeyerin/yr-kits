import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface ProjectContextConfig {
  rootDir: string;
  allowedDirs: string[];
  ignoredDirs: string[];
  maxReadBytes: number;
  maxSearchResults: number;
}

interface CopilotContextParams {
  selectedText?: string;
  route?: string;
  fileHints?: string[];
}

interface SearchResult {
  path: string;
  line: number;
  text: string;
}

const normalizeRelativePath = (filePath: string) => {
  return filePath.replaceAll("\\", "/").replace(/^\.\/+/, "");
};

const isIgnoredPath = (relativePath: string, config: ProjectContextConfig) => {
  const segments = normalizeRelativePath(relativePath).split("/");
  return segments.some((segment) => config.ignoredDirs.includes(segment));
};

const walk = async (
  relativeDir: string,
  config: ProjectContextConfig,
  results: string[],
  limit: number,
) => {
  if (results.length >= limit || isIgnoredPath(relativeDir, config)) {
    return;
  }

  const absoluteDir = path.join(config.rootDir, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (results.length >= limit) {
      return;
    }

    const relativePath = normalizeRelativePath(path.join(relativeDir, entry.name));

    if (isIgnoredPath(relativePath, config)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(relativePath, config, results, limit);
      continue;
    }

    if (entry.isFile()) {
      results.push(relativePath);
    }
  }
};

const listProjectFiles = async (
  config: ProjectContextConfig,
  query?: string,
  limit = 80,
) => {
  const results: string[] = [];

  for (const allowedDir of config.allowedDirs) {
    const absoluteDir = path.join(config.rootDir, allowedDir);

    try {
      const stat = await fs.stat(absoluteDir);

      if (stat.isDirectory()) {
        await walk(allowedDir, config, results, limit);
      }
    } catch {
      continue;
    }
  }

  if (!query) {
    return results;
  }

  return results.filter((filePath) => filePath.toLowerCase().includes(query.toLowerCase()));
};

const readProjectFile = async (
  config: ProjectContextConfig,
  filePath: string,
  maxBytes = config.maxReadBytes,
) => {
  const absolutePath = path.join(config.rootDir, normalizeRelativePath(filePath));
  const content = await fs.readFile(absolutePath, "utf-8");

  return {
    path: filePath,
    content: content.slice(0, maxBytes),
  };
};

const searchWithRg = async (
  config: ProjectContextConfig,
  query: string,
  limit: number,
) => {
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

const searchWithNode = async (
  config: ProjectContextConfig,
  query: string,
  limit: number,
) => {
  const files = await listProjectFiles(config, undefined, 500);
  const results: SearchResult[] = [];

  for (const filePath of files) {
    if (results.length >= limit) {
      break;
    }

    try {
      const file = await readProjectFile(config, filePath, 100_000);
      const lines = file.content.split("\n");

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

const searchProjectText = async (
  config: ProjectContextConfig,
  query: string,
  limit = config.maxSearchResults,
) => {
  if (!query.trim()) {
    return [];
  }

  try {
    return await searchWithRg(config, query, limit);
  } catch {
    return searchWithNode(config, query, limit);
  }
};

const findComponentByText = async (
  config: ProjectContextConfig,
  text: string,
  limit = 8,
) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  const candidates = [
    normalized,
    normalized.slice(0, 120),
    ...normalized.split(/[.!?]\s+/).filter((item) => item.length > 12),
  ];

  for (const candidate of candidates) {
    const results = await searchProjectText(config, candidate, limit);

    if (results.length) {
      return {
        query: candidate,
        results,
      };
    }
  }

  return {
    query: normalized,
    results: [],
  };
};

const readJsonFile = async (rootDir: string, filePath: string) => {
  try {
    const content = await fs.readFile(path.join(rootDir, filePath), "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getProjectContext = async (config: ProjectContextConfig) => {
  const packageJson = await readJsonFile(config.rootDir, "package.json");
  const tsconfig = await readJsonFile(config.rootDir, "tsconfig.json");

  return {
    rootDir: config.rootDir,
    allowedDirs: config.allowedDirs,
    packageName: packageJson?.name,
    scripts: packageJson?.scripts,
    dependencies: packageJson?.dependencies,
    devDependencies: packageJson?.devDependencies,
    tsconfigPaths: (tsconfig?.compilerOptions as { paths?: unknown } | undefined)
      ?.paths,
  };
};

export const buildCopilotProjectContext = async (
  rootDir: string,
  allowedDirs: string[],
  params: CopilotContextParams,
) => {
  const config: ProjectContextConfig = {
    rootDir,
    allowedDirs,
    ignoredDirs: [".git", ".next", "node_modules", "coverage", "public", "dist", "build"],
    maxReadBytes: 30_000,
    maxSearchResults: 20,
  };

  const project = await getProjectContext(config);
  const selectedText = params.selectedText?.trim();
  const routeQuery = params.route?.startsWith("/")
    ? `app${params.route === "/" ? "" : params.route}/page.tsx`
    : params.route;

  const textMatches = selectedText
    ? await findComponentByText(config, selectedText, 8)
    : { query: "", results: [] };
  const routeMatches = routeQuery
    ? await searchProjectText(config, routeQuery, 5)
    : [];

  return JSON.stringify(
    {
      project,
      requestContext: {
        route: params.route,
        fileHints: params.fileHints,
      },
      selectedTextLookup: textMatches,
      routeLookup: routeMatches,
      guidance:
        "이 컨텍스트는 로컬 프로젝트에서 수집한 실제 코드 검색 결과입니다. 수정 제안은 이 결과를 우선 근거로 삼고 path/oldText/newText 기반으로 작성하세요.",
    },
    null,
    2,
  );
};
