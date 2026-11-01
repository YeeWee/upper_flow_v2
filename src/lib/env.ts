import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SKILL_ROOT } from "./skill";

/**
 * 极简 .env 加载：`KEY=VALUE`，`#` 注释，可选单/双引号。
 *
 * 只为「密钥不写进 tts.json」这条约束服务：`tts.json` 里存的是**变量名**
 * （`apiKeyEnv`），真正的值放在 skill 根目录或项目目录的 `.env` 里，不进仓。
 *
 * 读取顺序：skill 根 → 当前项目；**已存在的进程环境变量优先**（不覆盖），
 * 这样临时 `export` 的调试值仍然生效。
 */
export function loadDotEnv(
  dirs: string[] = [SKILL_ROOT, process.cwd()],
): string[] {
  const loaded: string[] = [];
  for (const dir of dirs) {
    const file = join(dir, ".env");
    if (!existsSync(file)) continue;
    let text = "";
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const raw of text.split(/\r?\n/u)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key)) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] !== undefined) continue;
      process.env[key] = value;
      loaded.push(key);
    }
  }
  return loaded;
}
