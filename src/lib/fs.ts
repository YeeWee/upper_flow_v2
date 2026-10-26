import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative as pathRelative, sep } from "node:path";
import { AvpError } from "./errors";

export function pathExists(path: string): boolean {
  return existsSync(path);
}

/** 项目内展示用路径：相对 root，并统一成 POSIX 分隔符。 */
export function relativeTo(root: string, file: string): string {
  return pathRelative(root, file).split(sep).join("/");
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readText(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new AvpError("file-missing", `找不到文件：${path}`, { path });
  }
}

export function readJson<T = unknown>(path: string): T {
  const raw = readText(path);
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new AvpError(
      "json-invalid",
      `JSON 解析失败：${path}\n${err instanceof Error ? err.message : String(err)}`,
      { path },
    );
  }
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, path);
}

export function writeJson(path: string, value: unknown): void {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}
