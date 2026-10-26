/**
 * 检查器的稳定入口：`runCheck(root)` 只读、可复用（未来 render 用它做渲染闸）。
 * 检查项按域拆在 `./check/*`，这里只做公开导出。
 */
export { runCheck } from "./check/index";
export { CHECK_IDS, KNOWN_CHECK_IDS } from "./check/types";
export type {
  CheckLevel,
  CheckOptions,
  CheckResult,
  CheckSummary,
  Finding,
} from "./check/types";
