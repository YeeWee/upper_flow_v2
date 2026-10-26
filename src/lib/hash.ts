import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

export function sha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashJson(value: unknown): string {
  return sha256(stableStringify(value));
}

/** 键排序后的 JSON，保证同一对象不同书写顺序得到同一哈希。 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

/**
 * 对一组文件求输入哈希：路径 + 内容一起进哈希。
 * 文件缺失也会留下 "missing" 标记 —— 「删掉输入」同样让下游过期。
 */
export function hashFiles(root: string, paths: string[]): string {
  const hash = createHash("sha256");
  for (const path of [...paths].sort()) {
    hash.update(`\u0000${relative(root, path)}\u0000`);
    try {
      hash.update(readFileSync(path));
    } catch {
      hash.update("\u0000missing\u0000");
    }
  }
  return hash.digest("hex");
}

export function shortHash(hash: string | null, length = 12): string {
  if (!hash) return "—";
  return hash.slice(0, length);
}
