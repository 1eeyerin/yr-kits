import {
  applyUnifiedPatch,
  checkUnifiedPatch,
  createPatchFromTextReplacements,
  validatePatchPaths,
} from "../../lib/patch";
import { resolveAndValidatePath } from "../../lib/guards";
import {
  createProposedPatch,
  deleteProposedPatch,
  getProposedPatch,
} from "../../lib/store";

import type { DevCopilotBridgeConfig } from "../../shared/config/bridge-config";

const sanitizeAllowedPaths = (fileHints?: string[]) => {
  if (!fileHints?.length) {
    return null;
  }

  const sanitized = fileHints
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value === "." || value === "*" || /^[A-Za-z0-9._-]+$/.test(value));

  return sanitized.length ? Array.from(new Set(sanitized)) : null;
};

export const resolveAllowedPaths = (
  config: DevCopilotBridgeConfig,
  fileHints?: string[],
) => {
  const resolved = sanitizeAllowedPaths(fileHints) ?? config.allowedPaths;

  // 대부분의 웹 프로젝트에서 src가 실질 수정 대상이므로 누락 시 보정한다.
  if (!resolved.includes(".") && !resolved.includes("*") && !resolved.includes("src")) {
    return [...resolved, "src"];
  }

  return resolved;
};

export const buildPatchPreview = async (
  changes: Array<{ path: string; oldText: string; newText: string }> | undefined,
  config: DevCopilotBridgeConfig,
  allowedPaths: string[],
) => {
  if (!changes?.length) {
    return "";
  }

  return createPatchFromTextReplacements(changes, config.rootDir, (filePath) =>
    resolveAndValidatePath(filePath, allowedPaths, config.rootDir),
  );
};

export const validatePatchPreview = async (
  patchPreview: string,
  config: DevCopilotBridgeConfig,
  allowedPaths: string[],
) => {
  validatePatchPaths(patchPreview, (filePath) =>
    resolveAndValidatePath(filePath, allowedPaths, config.rootDir),
  );
  await checkUnifiedPatch(patchPreview, config.rootDir);
};

export const saveProposedPatch = (patchPreview: string, allowedPaths: string[]) => {
  return createProposedPatch(patchPreview, allowedPaths);
};

export const applySavedPatch = async (
  config: DevCopilotBridgeConfig,
  patchId: string,
  approvalToken: string,
) => {
  const proposedPatch = getProposedPatch(patchId, approvalToken);

  if (!proposedPatch) {
    throw new Error("유효하지 않거나 만료된 patchId입니다.");
  }

  validatePatchPaths(proposedPatch.patchPreview, (filePath) =>
    resolveAndValidatePath(
      filePath,
      proposedPatch.allowedPaths?.length ? proposedPatch.allowedPaths : config.allowedPaths,
      config.rootDir,
    ),
  );

  const result = await applyUnifiedPatch(
    proposedPatch.patchPreview,
    config.rootDir,
    "local-codex-bridge",
  );
  deleteProposedPatch(patchId);

  return result;
};
