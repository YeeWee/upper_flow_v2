import { readFileSync } from "node:fs";
import { join } from "node:path";
import { requireApproval, writeApproval } from "../lib/approval";
import { buildBeats, discoverChapters, writeBeats } from "../lib/beats";
import type { BeatsManifest, ChapterSource } from "../lib/beats";
import { AvpError } from "../lib/errors";
import { pathExists, readText } from "../lib/fs";
import {
  normalizeScriptText,
  parseOutlineStepCounts,
  parseScriptBlocks,
} from "../lib/script-source";
import { projectPaths, readLedger } from "../lib/project";
import { themeTokensPath } from "../lib/skill";
import { sha256 } from "../lib/hash";
import { planInputHash } from "../lib/status";
import { recordStep } from "../lib/state";

export interface PlanOptions {
  approve?: boolean;
  afterPlan?: boolean;
}

export interface PlanResult {
  chapters: number;
  beats: number;
  writes: string[];
  approval?: { hash: string; approvedAt: string };
}

/** script.md 的每个 `---` 块必须与每一拍的 say 一一对应。 */
function validateScript(scriptText: string, manifest: BeatsManifest): void {
  const blocks = parseScriptBlocks(scriptText);
  if (blocks.length !== manifest.beats.length) {
    throw new AvpError(
      "script-drift",
      `script.md 有 ${blocks.length} 个节拍块，章节共 ${manifest.beats.length} 拍。` +
        `\n两边必须同数同序：补 / 删 script.md 的 --- 块，或增删 narrations.ts 条目。`,
      {
        field: "say",
        expectedBeats: manifest.beats.length,
        actualBlocks: blocks.length,
      },
    );
  }

  manifest.beats.forEach((beat, index) => {
    const block = blocks[index]!;
    if (block.normalized !== normalizeScriptText(beat.say)) {
      throw new AvpError(
        "script-drift",
        `节拍 ${beat.id} 的 say 与 script.md 第 ${index + 1} 块不一致。` +
          `\nscript.md：${block.text || "（空块）"}` +
          `\nnarrations.ts：${beat.say || "（静音拍）"}` +
          `\n把两边改成同一句话（标点也一致），再运行 avp plan。`,
        {
          beatId: beat.id,
          field: "say",
          script: block.text,
          say: beat.say,
        },
      );
    }
  });
}

/**
 * outline 的 `## <chapterId>` + `- step N` 可解析时，校验每章 step 数；
 * 解析不出来（还没写 / 格式自由）时跳过，不制造假失败。
 */
function validateOutline(root: string, chapters: ChapterSource[]): void {
  const outlinePath = join(root, "outline.md");
  if (!pathExists(outlinePath)) return;

  const counts = parseOutlineStepCounts(
    readText(outlinePath),
    chapters.map((chapter) => chapter.id),
  );
  for (const chapter of chapters) {
    const count = counts.get(chapter.id);
    if (count === undefined || count === 0) continue;
    if (count !== chapter.narrations.length) {
      throw new AvpError(
        "outline-step-count",
        `outline.md 的章节「${chapter.id}」有 ${count} 个 step，` +
          `narrations.ts 有 ${chapter.narrations.length} 拍。` +
          `\n先同步 outline.md 的 - step 列表，再运行 avp plan。`,
        {
          chapter: chapter.id,
          field: "steps",
          outline: count,
          narrations: chapter.narrations.length,
        },
      );
    }
  }
}

export async function runPlan(
  root: string,
  options: PlanOptions = {},
): Promise<PlanResult> {
  if (options.approve && options.afterPlan) {
    throw new AvpError(
      "conflicting-flags",
      `--approve 与 --after-plan 不能同时使用：前者写批准，后者要求已有批准。`,
      { flags: ["approve", "after-plan"] },
    );
  }

  const ledger = readLedger(root);
  const paths = projectPaths(root);

  const chapters = await discoverChapters(paths);

  const tokensPath = themeTokensPath(ledger.theme.id);
  if (!pathExists(tokensPath)) {
    throw new AvpError(
      "theme-unknown",
      `主题「${ledger.theme.id}」缺少 tokens.css：${tokensPath}`,
      { theme: ledger.theme.id, path: tokensPath },
    );
  }
  const tokensHash = sha256(readFileSync(tokensPath));
  const manifest = buildBeats(chapters, {
    id: ledger.theme.id,
    tokensHash,
  });

  const scriptText = readText(join(root, "script.md"));
  validateScript(scriptText, manifest);
  validateOutline(root, chapters);

  writeBeats(root, manifest);
  const writes = ["beats.json"];
  let approval: PlanResult["approval"];

  if (options.approve) {
    const record = writeApproval(root, scriptText, manifest.beats);
    writes.push(".avp/approval.json");
    approval = { hash: record.hash, approvedAt: record.approvedAt };
  }

  if (options.afterPlan) {
    // 已有批准必须对得上当前稿子 + 节拍，否则拒绝（不许用 --after-plan 绕过停点）。
    requireApproval(root);
  }

  recordStep(root, "plan", planInputHash(paths, ledger), ["beats.json"]);

  return {
    chapters: chapters.length,
    beats: manifest.beats.length,
    writes,
    ...(approval ? { approval } : {}),
  };
}
