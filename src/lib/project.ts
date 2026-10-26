import { join, resolve } from "node:path";
import { AvpError } from "./errors";
import { pathExists, readJson, writeJson } from "./fs";

export const LEDGER_FILE = "project.json";
export const TTS_CONFIG_FILE = "tts.json";
export const BEATS_FILE = "beats.json";

export interface SkillRef {
  name: string;
  version: string;
  commit: string;
}

export interface ProjectLedger {
  schemaVersion: 1;
  skill: SkillRef;
  theme: { id: string };
  createdAt: string;
}

export interface TtsConfig {
  schemaVersion: 1;
  backend: string;
  default: { voice: string; speed: number };
  chapters: Record<string, { voice?: string; speed?: number }>;
}

export interface ProjectPaths {
  root: string;
  ledger: string;
  ttsConfig: string;
  beats: string;
  presentation: string;
  chaptersDir: string;
  registry: string;
  audio: string;
  composition: string;
  bodies: string;
  hooks: string;
  output: string;
  stateDir: string;
  state: string;
  checkReport: string;
  ttsManifest: string;
  receipt: string;
}

export function projectPaths(root: string): ProjectPaths {
  const presentation = join(root, "presentation");
  const composition = join(root, "composition");
  return {
    root,
    ledger: join(root, LEDGER_FILE),
    ttsConfig: join(root, TTS_CONFIG_FILE),
    beats: join(root, BEATS_FILE),
    presentation,
    chaptersDir: join(presentation, "src", "chapters"),
    registry: join(presentation, "src", "registry", "chapters.ts"),
    audio: join(root, "audio"),
    composition,
    bodies: join(composition, "beats"),
    hooks: join(composition, "hooks"),
    output: join(root, "output"),
    stateDir: join(root, ".avp"),
    state: join(root, ".avp", "state.json"),
    checkReport: join(root, ".avp", "check.json"),
    ttsManifest: join(root, ".avp", "tts.json"),
    receipt: join(root, "output", "receipt.json"),
  };
}

export function resolveProjectRoot(cwd: string, dir?: string): string {
  return resolve(cwd, dir ?? ".");
}

export function readLedger(root: string): ProjectLedger {
  const path = join(root, LEDGER_FILE);
  if (!pathExists(path)) {
    throw new AvpError(
      "not-a-project",
      `这里不是 avp 项目：${root}\n缺少 ${LEDGER_FILE}。先运行 avp init。`,
      { root },
    );
  }
  const ledger = readJson<ProjectLedger>(path);
  assertSchemaVersion(ledger.schemaVersion, LEDGER_FILE);
  return ledger;
}

export function readTtsConfig(root: string): TtsConfig {
  const path = join(root, TTS_CONFIG_FILE);
  if (!pathExists(path)) {
    throw new AvpError(
      "missing-tts-config",
      `缺少 ${TTS_CONFIG_FILE}：${path}\n先运行 avp init 或手动补一份。`,
      { path },
    );
  }
  const config = readJson<TtsConfig>(path);
  assertSchemaVersion(config.schemaVersion, TTS_CONFIG_FILE);
  return config;
}

export function writeLedger(root: string, ledger: ProjectLedger): void {
  writeJson(join(root, LEDGER_FILE), ledger);
}

/**
 * schema 大版本未知时拒绝执行，而不是猜着升级。
 * 小版本（1.x）可以向前兼容。
 */
export function assertSchemaVersion(
  version: unknown,
  file: string,
  supportedMajor = 1,
): void {
  const major =
    typeof version === "number" ? Math.trunc(version) : Number.NaN;
  if (!Number.isFinite(major) || major !== supportedMajor) {
    throw new AvpError(
      "schema-unknown",
      `${file} 的 schemaVersion=${String(version)}，本版只认识大版本 ${supportedMajor}。` +
        `\n请升级 skill，或把项目回退到匹配的 skill commit。`,
      { file, schemaVersion: version, supportedMajor },
    );
  }
}
