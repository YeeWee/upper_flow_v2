import type { BeatsManifest } from "../beats";
import type { ProjectLedger, ProjectPaths, TtsConfig } from "../project";
import type { TtsManifest } from "../tts";

export type CheckLevel = "error" | "warning" | "report";

/**
 * 一条检查结论。`id` 是稳定的检查项 id（见 CHECK_IDS），用于 `--only` 过滤；
 * `beatId` / `chapter` / `field` 让 agent 能直接定位到要改的那一处。
 */
export interface Finding {
  id: string;
  level: CheckLevel;
  message: string;
  beatId?: string;
  chapter?: string;
  field?: string;
  fix?: string;
  /** 仅 still-frames report：意图时间戳（毫秒），渲染链负责填实际像素差。 */
  atMs?: [number, number];
  kind?: "still";
}

export interface CheckSummary {
  errors: number;
  warnings: number;
  reports: number;
}

export interface CheckResult {
  ok: boolean;
  command: "check";
  errors: Finding[];
  warnings: Finding[];
  reports: Finding[];
  summary: CheckSummary;
}

export interface CheckOptions {
  /** 只输出这些检查项；未知 id 直接拒绝，避免拼错后静默通过。 */
  only?: string[];
}

export interface CheckContext {
  root: string;
  paths: ProjectPaths;
  ledger: ProjectLedger;
  config: TtsConfig;
  manifest: BeatsManifest;
  /** beats.json 的 beats 是否为数组；为 false 时跳过逐拍检查。 */
  beatsValid: boolean;
  ttsManifest: TtsManifest | null;
  findings: Finding[];
}

/** 检查项 id 的唯一清单：代码、`--only` 校验、文档表格共用。 */
export const CHECK_IDS = {
  schemaUnknown: "schema-unknown",
  audioPathMismatch: "audio-path-mismatch",
  audioMissing: "audio-missing",
  audioTtsMissing: "audio-tts-missing",
  audioTtsMismatch: "audio-tts-mismatch",
  audioDurationMismatch: "audio-duration-mismatch",
  silentBeatInvalid: "silent-beat-invalid",
  captionTooWide: "caption-too-wide",
  sayCaptionTokenMismatch: "say-caption-token-mismatch",
  beatsDrift: "beats-drift",
  hookMissing: "hook-missing",
  hookOverrun: "hook-overrun",
  hookNotSeekSafe: "hook-not-seek-safe",
  hookEmpty: "hook-empty",
  hookInvalid: "hook-invalid",
  tokensStale: "tokens-stale",
  speedOutOfRange: "speed-out-of-range",
  captionDerived: "caption-derived",
  voiceDivergence: "voice-divergence",
  skillCommitDrift: "skill-commit-drift",
  durationTable: "duration-table",
  stillFrames: "still-frames",
} as const;

export const KNOWN_CHECK_IDS: readonly string[] = Object.values(CHECK_IDS);

/** 确定性排序：无 beat 的项目级结论在前，再按 beat id（自然序）与检查 id。 */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const byBeat = (a.beatId ?? "").localeCompare(b.beatId ?? "", "en", {
      numeric: true,
      sensitivity: "base",
    });
    if (byBeat !== 0) return byBeat;
    const byId = a.id.localeCompare(b.id);
    if (byId !== 0) return byId;
    return a.message.localeCompare(b.message);
  });
}

export function summarize(findings: Finding[]): CheckSummary {
  return {
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
    reports: findings.filter((finding) => finding.level === "report").length,
  };
}
