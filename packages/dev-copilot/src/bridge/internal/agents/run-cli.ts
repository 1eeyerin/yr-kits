import { spawn } from "node:child_process";

interface RunCliOptions {
  cwd: string;
  timeoutMs: number;
  maxBuffer?: number;
  env?: NodeJS.ProcessEnv;
}

export interface RunCliResult {
  stdout: string;
  stderr: string;
}

export const runCli = (command: string, args: string[], options: RunCliOptions) => {
  return new Promise<RunCliResult>((resolve, reject) => {
    const maxBuffer = options.maxBuffer ?? 1024 * 1024 * 5;
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NO_COLOR: "1",
        ...options.env,
      },
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutLength = 0;
    let stderrLength = 0;
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, options.timeoutMs);

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      child.kill("SIGTERM");
      reject(error);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutLength += chunk.length;
      if (stdoutLength > maxBuffer) {
        fail(new Error(`${command} stdout이 허용된 크기를 초과했습니다.`));
        return;
      }
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrLength += chunk.length;
      if (stderrLength > maxBuffer) {
        fail(new Error(`${command} stderr가 허용된 크기를 초과했습니다.`));
        return;
      }
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      fail(error);
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
      const stderr = Buffer.concat(stderrChunks).toString("utf-8");

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const error = new Error(stderr || `${command} 실행에 실패했습니다. code=${code ?? "unknown"}`);
      Object.assign(error, {
        stdout,
        stderr,
        signal,
        killed: signal === "SIGTERM",
        code,
      });
      reject(error);
    });
  });
};
