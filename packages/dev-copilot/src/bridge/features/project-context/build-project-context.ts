import {
  searchProjectText,
  searchProjectTextIgnoringWhitespace,
} from "./search-strategies";

interface CopilotContextParams {
  selectedText?: string;
  route?: string;
  fileHints?: string[];
}

const findBySelectedText = async (
  rootDir: string,
  allowedDirs: string[],
  text: string,
) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  const candidates = [
    normalized,
    normalized.slice(0, 120),
    ...normalized.split(/[.!?]\s+/).filter((item) => item.length > 12),
  ];

  for (const candidate of candidates) {
    const results = await searchProjectText({ rootDir, allowedDirs }, candidate, 8);
    if (results.length) {
      return { query: candidate, results };
    }
  }

  for (const candidate of candidates) {
    const results = await searchProjectTextIgnoringWhitespace(
      { rootDir, allowedDirs },
      candidate,
      8,
    );
    if (results.length) {
      return { query: `${candidate} (ignore-whitespace)`, results };
    }
  }

  return { query: normalized, results: [] };
};

export const buildCopilotProjectContext = async (
  rootDir: string,
  allowedDirs: string[],
  params: CopilotContextParams,
) => {
  const routeQuery = params.route?.startsWith("/")
    ? `app${params.route === "/" ? "" : params.route}/page.tsx`
    : params.route;

  const selectedText = params.selectedText?.trim();
  const textMatches = selectedText
    ? await findBySelectedText(rootDir, allowedDirs, selectedText)
    : { query: "", results: [] };

  const routeMatches = routeQuery
    ? await searchProjectText({ rootDir, allowedDirs }, routeQuery, 5)
    : [];

  return JSON.stringify(
    {
      project: {
        allowedDirs,
      },
      requestContext: {
        route: params.route,
        fileHints: params.fileHints,
      },
      selectedTextLookup: textMatches,
      routeLookup: routeMatches,
      guidance:
        "selectedTextLookup.results의 path와 text를 우선 사용해 path/oldText/newText 수정안을 작성하세요.",
    },
    null,
    2,
  );
};
