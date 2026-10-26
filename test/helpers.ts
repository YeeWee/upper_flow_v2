import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const AVP_BIN = join(REPO_ROOT, "bin", "avp.mjs");

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
  json: any;
}

export function runAvp(args: string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [AVP_BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  let json: unknown;
  try {
    json = JSON.parse(stdout);
  } catch {
    json = undefined;
  }
  return { status: result.status, stdout, stderr, json };
}

export function tempProject(prefix = "avp-test-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function readJson(path: string): any {
  return JSON.parse(readText(path));
}
