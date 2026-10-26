import { join } from "node:path";
import { pathExists } from "./fs";
import { listFiles } from "./fs-list";
import { hashFiles } from "./hash";
import type { ProjectPaths, ProjectLedger } from "./project";
import { themeTokensPath } from "./skill";
import { STEP_IDS, readState } from "./state";
import type { StepId } from "./state";

export type StepStatus = "pending" | "stale" | "current";

export interface StepView {
  step: StepId;
  inputHash: string | null;
  outputs: string[];
  status: StepStatus;
}

const OUTPUTS: Record<StepId, string[]> = {
  plan: ["beats.json"],
  tts: [".avp/tts.json"],
  compose: ["composition/index.html"],
  check: [".avp/check.json"],
  render: ["output/receipt.json"],
};

export function stepOutputs(step: StepId): string[] {
  return OUTPUTS[step];
}

function planInputs(p: ProjectPaths): string[] {
  return [
    p.ledger,
    join(p.root, "script.md"),
    join(p.root, "outline.md"),
    p.registry,
    ...listFiles(p.chaptersDir, [".ts"]),
  ];
}

function ttsInputs(p: ProjectPaths): string[] {
  return [p.beats, p.ttsConfig];
}

function composeInputs(p: ProjectPaths, ledger: ProjectLedger): string[] {
  return [
    p.beats,
    themeTokensPath(ledger.theme.id),
    ...listFiles(p.bodies),
    ...listFiles(p.hooks),
  ];
}

function checkInputs(p: ProjectPaths): string[] {
  return [p.beats, p.ttsConfig, p.ledger, join(p.composition, "index.html")];
}

function renderInputs(p: ProjectPaths): string[] {
  return [p.beats, join(p.composition, "index.html"), p.checkReport, p.ledger];
}

/**
 * 每步的输入哈希。返回 null 表示输入尚不存在（还没到可执行的时候）。
 * 过期沿链路自然向下传播：上游文件变了，下游的输入哈希跟着变。
 */
export function inputHashFor(
  step: StepId,
  p: ProjectPaths,
  ledger: ProjectLedger,
): string | null {
  switch (step) {
    case "plan":
      return hashFiles(p.root, planInputs(p));
    case "tts":
      return pathExists(p.beats) ? hashFiles(p.root, ttsInputs(p)) : null;
    case "compose":
      return pathExists(p.beats)
        ? hashFiles(p.root, composeInputs(p, ledger))
        : null;
    case "check":
      return pathExists(join(p.composition, "index.html"))
        ? hashFiles(p.root, checkInputs(p))
        : null;
    case "render":
      return pathExists(p.checkReport)
        ? hashFiles(p.root, renderInputs(p))
        : null;
  }
}

export function collectStatus(
  p: ProjectPaths,
  ledger: ProjectLedger,
): StepView[] {
  const state = readState(p.root);
  return STEP_IDS.map((step) => {
    const record = state.steps[step];
    const outputs = OUTPUTS[step];
    const inputHash = inputHashFor(step, p, ledger);
    const missingOutput = outputs.some(
      (output) => !pathExists(join(p.root, output)),
    );

    let status: StepStatus;
    if (!record) {
      status = "pending";
    } else if (missingOutput || (inputHash && record.inputHash !== inputHash)) {
      status = "stale";
    } else {
      status = "current";
    }

    return { step, inputHash, outputs, status };
  });
}

export const STATUS_LABEL: Record<StepStatus, string> = {
  pending: "待办",
  stale: "过期",
  current: "最新",
};
