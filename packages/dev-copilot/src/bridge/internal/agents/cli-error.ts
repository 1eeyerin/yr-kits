export interface CliErrorDetails {
  message: string;
  stderr: string;
  stdout: string;
  signal: string;
  killed: boolean;
  merged: string;
}

export const extractCliErrorDetails = (error: unknown): CliErrorDetails => {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const message = error instanceof Error ? error.message : String(error);
  const stderr = typeof record?.stderr === "string" ? record.stderr : "";
  const stdout = typeof record?.stdout === "string" ? record.stdout : "";
  const signal = typeof record?.signal === "string" ? record.signal : "";
  const killed = record?.killed === true;
  const merged = [message, stderr, stdout, signal, killed ? "killed" : ""]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");

  return {
    message,
    stderr,
    stdout,
    signal,
    killed,
    merged,
  };
};

export const isCliTimeout = (details: CliErrorDetails) => {
  return /SIGTERM|timed out|timeout/i.test(details.merged);
};

export const isCliCommandMissing = (details: CliErrorDetails) => {
  return /ENOENT/.test(details.merged);
};
