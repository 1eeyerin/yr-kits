import { randomUUID } from "node:crypto";

interface ProposedPatch {
  patchId: string;
  approvalToken: string;
  patchPreview: string;
  allowedPaths: string[];
  createdAt: number;
}

const patchStore = new Map<string, ProposedPatch>();
const TTL_MS = 1000 * 60 * 15;

const pruneExpired = () => {
  const now = Date.now();

  for (const [key, value] of patchStore.entries()) {
    if (now - value.createdAt > TTL_MS) {
      patchStore.delete(key);
    }
  }
};

export const createProposedPatch = (patchPreview: string, allowedPaths: string[]) => {
  pruneExpired();

  const patchId = randomUUID();
  const approvalToken = `approve:${patchId}`;

  patchStore.set(patchId, {
    patchId,
    approvalToken,
    patchPreview,
    allowedPaths,
    createdAt: Date.now(),
  });

  return {
    patchId,
    approvalToken,
  };
};

export const getProposedPatch = (patchId: string, approvalToken: string) => {
  pruneExpired();

  const item = patchStore.get(patchId);

  if (!item || item.approvalToken !== approvalToken) {
    return null;
  }

  return item;
};

export const deleteProposedPatch = (patchId: string) => {
  patchStore.delete(patchId);
};
