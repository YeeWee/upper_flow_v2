import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** skill 根 = 仓库根。工具随 skill，项目只存产物。 */
export const SKILL_ROOT = fileURLToPath(new URL("../../", import.meta.url));

export interface SkillMeta {
  name: string;
  version: string;
  commit: string;
}

interface PackageJson {
  name?: string;
  version?: string;
}

export function skillMeta(): SkillMeta {
  let pkg: PackageJson = {};
  try {
    pkg = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as PackageJson;
  } catch {
    // 保持命令可运行：包信息缺失不是用户可修复的错误。
  }
  return {
    name: pkg.name ?? "article-video-production",
    version: pkg.version ?? "0.0.0",
    commit: skillCommit(),
  };
}

export function skillCommit(): string {
  try {
    return execFileSync("git", ["-C", SKILL_ROOT, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export function themesDir(): string {
  return fileURLToPath(new URL("../../themes/", import.meta.url));
}

export function themeTokensPath(themeId: string): string {
  return fileURLToPath(
    new URL(`../../themes/${themeId}/tokens.css`, import.meta.url),
  );
}

export function templateDir(): string {
  return fileURLToPath(new URL("../../templates/", import.meta.url));
}
