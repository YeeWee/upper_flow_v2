import { join } from "node:path";
import { PLAN_OWNED_BEAT_FIELDS } from "./beats";
import type { Beat, BeatsManifest } from "./beats";
import { AvpError } from "./errors";
import { pathExists, readJson, readText, writeJson } from "./fs";
import { sha256, stableStringify } from "./hash";
import { assertSchemaVersion, projectPaths } from "./project";

/** `.avp/approval.json`：plan 停点的批准记录。 */
export interface ApprovalRecord {
  schemaVersion: 1;
  /** sha256(script.md 原文 + 规范化节拍 JSON)。 */
  hash: string;
  scriptHash: string;
  beatsHash: string;
  approvedAt: string;
}

export function approvalPath(root: string): string {
  return join(root, ".avp", "approval.json");
}

/**
 * 批准哈希只覆盖 plan 产出的字段；durationMs / tts 是 avp tts 的派生物，
 * 不能在批准之后把哈希改脏（否则 tts 一跑 --after-plan 永远对不上）。
 */
function approvalView(beat: Beat): Record<string, unknown> {
  return Object.fromEntries(
    PLAN_OWNED_BEAT_FIELDS.map((field) => [field, beat[field]]),
  );
}

/** 规范化节拍 JSON：键排序、无空白，是 beatsHash / 批准哈希的唯一输入。 */
export function canonicalBeatsJson(beats: Beat[]): string {
  return stableStringify(beats.map(approvalView));
}

export function computeBeatsHash(beats: Beat[]): string {
  return sha256(canonicalBeatsJson(beats));
}

export function computeApprovalHash(scriptText: string, beats: Beat[]): string {
  return sha256(scriptText + canonicalBeatsJson(beats));
}

export function writeApproval(
  root: string,
  scriptText: string,
  beats: Beat[],
): ApprovalRecord {
  const record: ApprovalRecord = {
    schemaVersion: 1,
    hash: computeApprovalHash(scriptText, beats),
    scriptHash: sha256(scriptText),
    beatsHash: computeBeatsHash(beats),
    approvedAt: new Date().toISOString(),
  };
  writeJson(approvalPath(root), record);
  return record;
}

export function readApproval(root: string): ApprovalRecord {
  const path = approvalPath(root);
  if (!pathExists(path)) {
    throw new AvpError(
      "plan-not-approved",
      `当前计划尚未批准：缺少 ${path}。` +
        `\n先运行 avp plan --approve（或让用户确认后批准）。`,
      { path },
    );
  }
  const record = readJson<ApprovalRecord>(path);
  assertSchemaVersion(record.schemaVersion, path);
  return record;
}

/**
 * 可复用闸门：给后续命令（tts / compose / render）检查「当前稿子 + 节拍」
 * 是否仍是用户批准的那一版。哈希对不上就拒绝执行，避免 --after-plan 变成
 * 绕过停点的后门。
 */
export function requireApproval(root: string): ApprovalRecord {
  const paths = projectPaths(root);
  const approval = readApproval(root);

  const scriptText = readText(join(root, "script.md"));
  if (!pathExists(paths.beats)) {
    throw new AvpError(
      "plan-not-approved",
      `当前计划尚未批准：缺少 ${paths.beats}。\n先运行 avp plan。`,
      { path: paths.beats },
    );
  }
  const manifest = readJson<BeatsManifest>(paths.beats);
  const currentHash = computeApprovalHash(scriptText, manifest.beats);

  if (currentHash !== approval.hash) {
    throw new AvpError(
      "plan-not-approved",
      `当前稿子或节拍与批准记录不一致：script.md / beats.json 已变。` +
        `\n重新过 plan 停点：avp plan --approve。`,
      {
        approvedHash: approval.hash,
        currentHash,
        approval: approvalPath(root),
      },
    );
  }
  return approval;
}
