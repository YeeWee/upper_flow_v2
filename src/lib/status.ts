import { join } from "node:path";
import type { BeatsManifest } from "./beats";
import { pathExists, readJson } from "./fs";
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

function planInputs(p: ProjectPaths, ledger: ProjectLedger): string[] {
  return [
    p.ledger,
    join(p.root, "script.md"),
    join(p.root, "outline.md"),
    p.registry,
    themeTokensPath(ledger.theme.id),
    ...listFiles(p.chaptersDir, [".ts"]),
  ];
}

/**
 * plan 的输入哈希。`avp plan` 成功后用它 recordStep，`status` 用同一函数判定
 * 是否最新 —— 两边共用一份定义，避免「plan 记的哈希和 status 算的不一样」。
 */
export function planInputHash(
  p: ProjectPaths,
  ledger: ProjectLedger,
): string {
  return hashFiles(p.root, planInputs(p, ledger));
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

/**
 * check 读什么就哈希什么：节拍清单、TTS 配置与回执、项目账本、主题 tokens、
 * 口播源、钩子、合成稿，以及每拍音频内容。任何一项变了，check 都应重跑。
 */
function checkInputs(p: ProjectPaths, ledger: ProjectLedger): string[] {
  const inputs = [
    p.beats,
    p.ttsConfig,
    p.ledger,
    p.ttsManifest,
    themeTokensPath(ledger.theme.id),
    p.registry,
    ...listFiles(p.chaptersDir, [".ts"]),
    ...listFiles(p.hooks, [".ts"]),
    join(p.composition, "index.html"),
  ];

  try {
    const manifest = readJson<BeatsManifest>(p.beats);
    const beats = Array.isArray(manifest.beats) ? manifest.beats : [];
    for (const beat of beats) {
      if (typeof beat?.audio === "string" && beat.audio) {
        inputs.push(join(p.root, beat.audio));
      }
    }
  } catch {
    // beats.json 本身已在输入里；解析失败留给 plan / check 报错。
  }

  return inputs;
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
      return planInputHash(p, ledger);
    case "tts":
      return pathExists(p.beats) ? hashFiles(p.root, ttsInputs(p)) : null;
    case "compose":
      return pathExists(p.beats)
        ? hashFiles(p.root, composeInputs(p, ledger))
        : null;
    case "check":
      return pathExists(p.beats)
        ? hashFiles(p.root, checkInputs(p, ledger))
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
    } else if (
      missingOutput ||
      // 输入已消失（如删掉 .avp/check.json）不能算最新：记录还在就说明
      // 这一步跑过，而它依赖的输入已经不在了。
      inputHash === null ||
      record.inputHash !== inputHash
    ) {
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
