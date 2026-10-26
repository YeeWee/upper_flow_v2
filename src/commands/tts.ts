import { requireApproval } from "../lib/approval";
import { projectPaths, readLedger } from "../lib/project";
import { runTts } from "../lib/tts";
import type { TtsOptions, TtsResult } from "../lib/tts";

export type TtsCommandResult = TtsResult;

export function runTtsCommand(root: string, options: TtsOptions): TtsCommandResult {
  const ledger = readLedger(root);
  const paths = projectPaths(root);
  if (options.afterPlan) requireApproval(root);
  return runTts(root, paths, ledger, options);
}
