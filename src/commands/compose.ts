import { requireApproval } from "../lib/approval";
import { readBeats } from "../lib/beats";
import { composeProject } from "../lib/compose";
import { projectPaths, readLedger } from "../lib/project";
import { inputHashFor } from "../lib/status";
import { recordStep } from "../lib/state";

export interface ComposeCommandResult {
  totalMs: number;
  clips: number;
  hooks: number;
  warnings: string[];
}

export function runComposeCommand(
  root: string,
  options: { afterPlan?: boolean } = {},
): ComposeCommandResult {
  const ledger = readLedger(root);
  const paths = projectPaths(root);
  if (options.afterPlan) requireApproval(root);

  const manifest = readBeats(root);
  const result = composeProject(paths, manifest);

  recordStep(root, "compose", inputHashFor("compose", paths, ledger) ?? "", [
    "composition/index.html",
  ]);

  return result;
}
