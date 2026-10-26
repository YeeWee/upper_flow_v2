import { join } from "node:path";
import type { BeatsManifest } from "../beats";
import { AvpError } from "../errors";
import { pathExists, readJson } from "../fs";
import type { ProjectLedger, TtsConfig } from "../project";
import {
  BEATS_FILE,
  LEDGER_FILE,
  TTS_CONFIG_FILE,
  projectPaths,
} from "../project";
import type { TtsManifest } from "../tts";
import { checkAudio } from "./audio";
import { checkCaptions } from "./caption";
import { checkDrift } from "./drift";
import { checkHooks } from "./hooks";
import {
  checkDerivedCaptions,
  checkSchema,
  checkSkillCommit,
  checkSpeed,
  checkTokensHash,
  checkVoiceDivergence,
} from "./manifest";
import { checkDurationTable, checkStillFrames } from "./report";
import { CHECK_IDS, KNOWN_CHECK_IDS, sortFindings, summarize } from "./types";
import type {
  CheckContext,
  CheckOptions,
  CheckResult,
  Finding,
} from "./types";

function readRequired<T>(
  root: string,
  file: string,
  missingCode: string,
  missingMessage: string,
): T {
  const path = join(root, file);
  if (!pathExists(path)) {
    throw new AvpError(missingCode, missingMessage, { path });
  }
  return readJson<T>(path);
}

function validateOnly(only: string[] | undefined): Set<string> | null {
  const ids = (only ?? []).map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return null;

  const unknown = ids.filter((id) => !KNOWN_CHECK_IDS.includes(id));
  if (unknown.length > 0) {
    throw new AvpError(
      "unknown-check-id",
      `未知检查项：${unknown.join(", ")}。` +
        `\n可用检查项：${KNOWN_CHECK_IDS.join(", ")}`,
      { unknown, known: KNOWN_CHECK_IDS },
    );
  }
  return new Set(ids);
}

function buildResult(
  findings: Finding[],
  only: Set<string> | null,
): CheckResult {
  const selected = only
    ? findings.filter((finding) => only.has(finding.id))
    : findings;
  const errors = sortFindings(
    selected.filter((finding) => finding.level === "error"),
  );
  const warnings = sortFindings(
    selected.filter((finding) => finding.level === "warning"),
  );
  const reports = sortFindings(
    selected.filter((finding) => finding.level === "report"),
  );

  return {
    ok: errors.length === 0,
    command: "check",
    errors,
    warnings,
    reports,
    summary: summarize([...errors, ...warnings, ...reports]),
  };
}

/**
 * 全量机械检查。纯读：不写回执、不记 state —— 命令层用同一结果写
 * `.avp/check.json`，未来的 render 也直接调用它做渲染闸。
 */
export async function runCheck(
  root: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const only = validateOnly(options.only);
  const paths = projectPaths(root);

  const ledger = readRequired<ProjectLedger>(
    root,
    LEDGER_FILE,
    "not-a-project",
    `这里不是 avp 项目：${root}\n缺少 ${LEDGER_FILE}。先运行 avp init。`,
  );
  const config = readRequired<TtsConfig>(
    root,
    TTS_CONFIG_FILE,
    "missing-tts-config",
    `缺少 ${TTS_CONFIG_FILE}：${join(root, TTS_CONFIG_FILE)}\n先运行 avp init 或手动补一份。`,
  );
  const rawManifest = readRequired<BeatsManifest>(
    root,
    BEATS_FILE,
    "beats-missing",
    `缺少节拍清单：${join(root, BEATS_FILE)}\n先运行 avp plan。`,
  );

  const beatsValid = Array.isArray(rawManifest.beats);
  const manifest: BeatsManifest = {
    ...rawManifest,
    beats: beatsValid ? rawManifest.beats : [],
  };

  let ttsManifest: TtsManifest | null = null;
  if (pathExists(paths.ttsManifest)) {
    ttsManifest = readJson<TtsManifest>(paths.ttsManifest);
  }

  const ctx: CheckContext = {
    root,
    paths,
    ledger,
    config,
    manifest,
    beatsValid,
    ttsManifest,
    findings: [],
  };

  checkSchema(ctx);
  if (!beatsValid) {
    ctx.findings.push({
      id: CHECK_IDS.schemaUnknown,
      level: "error",
      message: "beats.json 的 beats 不是数组，无法逐拍检查。",
      field: "beats",
      fix: "运行 avp plan 重新生成节拍清单；不要手改 beats.json。",
    });
  }

  checkTokensHash(ctx);
  checkSpeed(ctx);
  checkSkillCommit(ctx);
  checkVoiceDivergence(ctx);

  if (beatsValid) {
    await checkDrift(ctx);
    checkAudio(ctx);
    checkCaptions(ctx);
    checkHooks(ctx);
    checkDerivedCaptions(ctx);
    checkDurationTable(ctx);
    checkStillFrames(ctx);
  }

  return buildResult(ctx.findings, only);
}
