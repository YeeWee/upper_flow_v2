import { projectPaths, readLedger } from "../lib/project";
import { collectStatus, STATUS_LABEL } from "../lib/status";
import type { StepView } from "../lib/status";
import { shortHash } from "../lib/hash";

export interface StatusResult {
  project: {
    root: string;
    skill: { name: string; version: string; commit: string };
    theme: string;
  };
  steps: StepView[];
}

export function runStatus(root: string): StatusResult {
  const ledger = readLedger(root);
  const paths = projectPaths(root);
  return {
    project: {
      root,
      skill: ledger.skill,
      theme: ledger.theme.id,
    },
    steps: collectStatus(paths, ledger),
  };
}

/** 四列：步骤 / 输入哈希 / 产物 / 状态。 */
export function renderStatusTable(result: StatusResult): string[] {
  const rows = [
    ["STEP", "INPUT HASH", "OUTPUT", "STATUS"],
    ...result.steps.map((step) => [
      step.step,
      shortHash(step.inputHash),
      step.outputs[0] ?? "—",
      STATUS_LABEL[step.status],
    ]),
  ];
  const widths = rows[0]!.map((_, col) =>
    Math.max(...rows.map((row) => row[col]!.length)),
  );
  const lines = rows.map((row) =>
    row
      .map((cell, col) => cell.padEnd(widths[col]!))
      .join("  ")
      .trimEnd(),
  );
  return lines;
}
