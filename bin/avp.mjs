#!/usr/bin/env node
/**
 * `avp` 分发器：从 skill 目录（或 PATH 上的 npm link）运行，以 cwd 判定项目。
 *
 * 工具随 skill，项目只存产物：这里负责把 src/cli.ts 交给 skill 自带的 tsx，
 * 不要求项目目录里安装任何依赖。
 */
import { tsImport } from "tsx/esm/api";

try {
  await tsImport("../src/cli.ts", import.meta.url);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
