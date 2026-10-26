import { rmSync } from "node:fs";
import { runCheck } from "../lib/check";
import type { CheckOptions, CheckResult } from "../lib/check";
import { writeJson } from "../lib/fs";
import { projectPaths, readLedger } from "../lib/project";
import { inputHashFor } from "../lib/status";
import { recordStep } from "../lib/state";

export type CheckCommandResult = CheckResult;

/**
 * 命令层职责：跑检查、写 `.avp/check.json` 回执。
 * 只有「无 error 的全量检查」才更新回执与 state；`--only` 是查看视图，
 * 不能拿来把渲染闸染绿，所以过滤运行不碰回执。
 */
export async function runCheckCommand(
  root: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const paths = projectPaths(root);

  let result: CheckResult;
  try {
    result = await runCheck(root, options);
  } catch (err) {
    // 检查都跑不起来时，旧的绿色回执不能继续当渲染闸。
    rmSync(paths.checkReport, { force: true });
    throw err;
  }

  const filtered = (options.only ?? []).some((id) => id.trim() !== "");
  if (filtered) return result;

  if (result.errors.length > 0) {
    // 旧的绿色回执会让下游误判；有 error 就撤掉。
    rmSync(paths.checkReport, { force: true });
    return result;
  }

  const ledger = readLedger(root);
  const inputHash = inputHashFor("check", paths, ledger);
  writeJson(paths.checkReport, result);
  if (inputHash) {
    recordStep(root, "check", inputHash, [".avp/check.json"]);
  }
  return result;
}

const LEVEL_TITLES = {
  error: { title: "ERROR", prefix: "✗" },
  warning: { title: "WARNING", prefix: "!" },
  report: { title: "REPORT", prefix: "·" },
} as const;

/** 人话输出：按 level 分组，每条结论带 id / beat / fix。 */
export function renderCheck(result: CheckResult): string[] {
  const header =
    `${result.ok ? "✓" : "✗"} check：` +
    `${result.summary.errors} 个 error / ` +
    `${result.summary.warnings} 个 warning / ` +
    `${result.summary.reports} 个 report`;
  const lines = [header];

  const groups = [
    { level: "error" as const, findings: result.errors },
    { level: "warning" as const, findings: result.warnings },
    { level: "report" as const, findings: result.reports },
  ];

  for (const group of groups) {
    if (group.findings.length === 0) continue;
    const { title, prefix } = LEVEL_TITLES[group.level];
    lines.push("", title);
    for (const finding of group.findings) {
      const where = finding.beatId
        ? ` ${finding.beatId}`
        : finding.chapter
          ? ` 章节 ${finding.chapter}`
          : "";
      lines.push(`  ${prefix} [${finding.id}]${where}`);
      for (const line of finding.message.split("\n")) {
        lines.push(`      ${line}`);
      }
      if (finding.fix) lines.push(`      fix: ${finding.fix}`);
    }
  }

  if (
    result.summary.errors === 0 &&
    result.summary.warnings === 0 &&
    result.summary.reports === 0
  ) {
    lines.push("", "  没有发现问题。");
  }

  return lines;
}
