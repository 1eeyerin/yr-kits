import os from "node:os";
import path from "node:path";

export const createTempPath = (prefix: string, extension = "") => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return path.join(os.tmpdir(), `${prefix}-${suffix}${extension}`);
};
