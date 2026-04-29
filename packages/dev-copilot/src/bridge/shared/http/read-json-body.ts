import type { IncomingMessage } from "node:http";

export const readJsonBody = async <T>(request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(raw) as T;
};
