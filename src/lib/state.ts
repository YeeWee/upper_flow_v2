import { join } from "node:path";
import { pathExists, readJson, writeJson } from "./fs";

export const STEP_IDS = ["plan", "tts", "compose", "check", "render"] as const;
export type StepId = (typeof STEP_IDS)[number];

export interface StepRecord {
  inputHash: string;
  outputs: string[];
  at: string;
}

export interface AvpState {
  schemaVersion: 1;
  steps: Partial<Record<StepId, StepRecord>>;
}

export function statePath(root: string): string {
  return join(root, ".avp", "state.json");
}

export function emptyState(): AvpState {
  return { schemaVersion: 1, steps: {} };
}

export function readState(root: string): AvpState {
  const path = statePath(root);
  if (!pathExists(path)) return emptyState();
  const state = readJson<AvpState>(path);
  if (state.schemaVersion !== 1) {
    throw new Error(
      `${path} 的 schemaVersion=${String(state.schemaVersion)} 不受支持`,
    );
  }
  return state;
}

export function writeState(root: string, state: AvpState): void {
  writeJson(statePath(root), state);
}

export function recordStep(
  root: string,
  step: StepId,
  inputHash: string,
  outputs: string[],
): void {
  const state = readState(root);
  state.steps[step] = {
    inputHash,
    outputs,
    at: new Date().toISOString(),
  };
  writeState(root, state);
}
