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
  parseOutlineTension,
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

/** 越界 / 不在末拍的统一错误：spec 只允许两个张力错误 id，不自造第三个。 */
function beatOutOfRange(
  declared: string,
  beat: number,
  expected: { min: number; max: number } | { last: number },
  hint: string,
  /** 覆盖首句：规则不是「在范围内」而是「必须等于某拍」时，说清是哪条规则。 */
  headline?: string,
): AvpError {
  // 「必须等于第 N 拍」也表达成 min=max=N，让修复方只需读范围。
  const min = "last" in expected ? expected.last : expected.min;
  const max = "last" in expected ? expected.last : expected.max;
  const range =
    min === max ? `合法值只有第 ${min} 拍` : `合法范围 ${min}..${max}`;
  return new AvpError(
    "tension-beat-out-of-range",
    (headline ?? `张力计划里的「${declared}」声明了第 ${beat} 拍，${range}。`) +
      `\n${hint}\n改 outline.md 的拍号（拍号全片 1-based），再运行 avp plan。`,
    {
      field: declared,
      beat,
      min,
      max,
      ...("last" in expected ? { expected: expected.last } : {}),
    },
  );
}

/** 声明缺失的错误：details.field 直接指出补哪一行。 */
function tensionPlanMissing(field: string, reason: string): AvpError {
  return new AvpError(
    "tension-plan-missing",
    `outline.md 缺少张力计划里的「${field}」声明。${reason}` +
      `\n格式见 references/OUTLINE-FORMAT.md「张力计划」，补上再运行 avp plan。`,
    { field },
  );
}

/**
 * 张力计划的声明一致性校验（ADR 0003）：存在性、拍号越界、总还扣必须落在末拍。
 *
 * 与 step 数校验同一条前置条件：outline 不存在、或没有任何可解析的已知章节
 * 标题时跳过 —— 格式自由就跳过，不制造假失败。章节可解析时张力计划是必需项。
 */
function validateTensionPlan(
  root: string,
  chapters: ChapterSource[],
): void {
  const outlinePath = join(root, "outline.md");
  if (!pathExists(outlinePath)) return;

  const chapterIds = chapters.map((chapter) => chapter.id);
  const outlineText = readText(outlinePath);
  // 与 step 数校验共用同一份章节标题解析：认不出章节就不校验张力。
  if (parseOutlineStepCounts(outlineText, chapterIds).size === 0) return;

  const plan = parseOutlineTension(outlineText, chapterIds);
  const totalBeats = chapters.reduce(
    (sum, chapter) => sum + chapter.narrations.length,
    0,
  );
  const allBeats = { min: 1, max: totalBeats };

  const openLoop = plan.openLoop;
  const finalPayoff = plan.finalPayoff;
  if (!openLoop) {
    throw tensionPlanMissing(
      "埋扣",
      `全片需要一个贯穿的问题，写在前 3 分钟内抛出、末拍还扣。`,
    );
  }
  if (!finalPayoff) {
    throw tensionPlanMissing(
      "总还扣",
      `开头抛出的问题必须在末拍被真正回答。`,
    );
  }

  for (const [declared, beat] of [
    ["埋扣", openLoop.plantBeat],
    ["总还扣", finalPayoff.beat],
    ["埋扣", openLoop.payoffBeat],
  ] as const) {
    if (beat < allBeats.min || beat > allBeats.max) {
      throw beatOutOfRange(
        declared,
        beat,
        allBeats,
        `全片共 ${totalBeats} 拍，拍号从 1 开始。`,
      );
    }
  }
  if (openLoop.payoffBeat !== finalPayoff.beat) {
    throw beatOutOfRange(
      "埋扣",
      openLoop.payoffBeat,
      { last: finalPayoff.beat },
      `埋扣说第 ${openLoop.payoffBeat} 拍总还扣，总还扣声明说第 ` +
        `${finalPayoff.beat} 拍 —— 两处不一致，改到同一拍。`,
    );
  }
  if (finalPayoff.beat !== totalBeats) {
    throw beatOutOfRange(
      "总还扣",
      finalPayoff.beat,
      { last: totalBeats },
      `总还扣必须落在末拍：声明的第 ${finalPayoff.beat} 拍不是末拍。`,
    );
  }

  let chapterStart = 1;
  for (const chapter of chapters) {
    const chapterBeats = {
      min: chapterStart,
      max: chapterStart + chapter.narrations.length - 1,
    };
    chapterStart = chapterBeats.max + 1;

    const field = `张力线:${chapter.id}`;
    const tension = plan.chapters.get(chapter.id);
    if (!tension) {
      throw tensionPlanMissing(
        field,
        `章节「${chapter.id}」的 ## 标题下需要一行 ` +
          `> **张力线**：还扣「…」@拍 N｜re-hook：…｜interrupt@拍 N。`,
      );
    }

    // 省略的拍号按本章首拍补默认，再统一按本章范围校验。
    const declaredBeats = [
      tension.payoffBeat ?? chapterBeats.min,
      tension.rehookBeat ?? chapterBeats.min,
      ...(tension.interruptBeat === undefined ? [] : [tension.interruptBeat]),
    ];
    for (const beat of declaredBeats) {
      if (beat < chapterBeats.min || beat > chapterBeats.max) {
        throw beatOutOfRange(
          field,
          beat,
          chapterBeats,
          `章节「${chapter.id}」占第 ${chapterBeats.min}..${chapterBeats.max} 拍` +
            `（全片 1-based 连续编号）。`,
        );
      }
    }

    // 重挂钩 = 本章首拍：显式声明的拍号也必须等于首拍，不能落在章内其它拍。
    const rehookBeat = tension.rehookBeat ?? chapterBeats.min;
    if (rehookBeat !== chapterBeats.min) {
      throw beatOutOfRange(
        field,
        rehookBeat,
        { last: chapterBeats.min },
        `把 re-hook 的 @拍 改成 ${chapterBeats.min}，或整段省略（省略即本章首拍）。`,
        `re-hook 声明在第 ${rehookBeat} 拍，但重挂钩必须落在本章首拍 ` +
          `${chapterBeats.min} 拍。`,
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
  validateTensionPlan(root, chapters);

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
