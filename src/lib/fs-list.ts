import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathExists } from "./fs";

/** 递归列出目录下所有文件；目录不存在时返回空数组。 */
export function listFiles(dir: string, extensions?: string[]): string[] {
  if (!pathExists(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(path, extensions));
    } else if (
      !extensions ||
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      out.push(path);
    }
  }
  return out.sort();
}
