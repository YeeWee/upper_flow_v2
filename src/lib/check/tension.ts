import { join } from "node:path";
import type { Beat } from "../beats";
import { pathExists, readText } from "../fs";
import type { OutlineChapterTension } from "../script-source";
import {
  parseOutlineStepCounts,
  parseOutlineTension,
} from "../script-source";
import { durationOf } from "./report";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";

/** 长片档：总时长 > 10 分钟才查还扣间隔。 */
const LONG_FORM_MS = 600_000;
const RECALL_GAP_LIMIT_MS = 300_000;
const INTERRUPT_GAP_LIMIT_MS = 120_000;
const NUMERIC_RUN_LIMIT = 2;
const NUMERIC_RATIO_LIMIT = 0.4;
const RHYTHM_MIN_BEATS = 4;
const RHYTHM_CV_LIMIT = 0.25;

const ARABIC_DIGIT = /\d/u;
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

interface BeatSpan {
  /** 全片 1-based 拍号。 */
  number: number;
  beat: Beat;
  /** 该拍开始时间（前面各拍实测时长累加）。 */
  startMs: number;
}

interface ChapterSpans {
  id: string;
  beats: BeatSpan[];
}

/** 全片拍号与起始时间；章节按首次出现顺序保留。 */
function chapterSpans(beats: Beat[]): ChapterSpans[] {
  const chapters = new Map<string, ChapterSpans>();
  let startMs = 0;
  beats.forEach((beat, index) => {
    const span: BeatSpan = { number: index + 1, beat, startMs };
    const chapter = chapters.get(beat.chapter) ?? {
      id: beat.chapter,
      beats: [],
    };
    chapter.beats.push(span);
    chapters.set(beat.chapter, chapter);
    startMs += durationOf(beat);
  });
  return [...chapters.values()];
}

/** 分钟数保留一位小数（`432000ms` → `7.2`）。 */
function minutes(ms: number): string {
  return (ms / 60_000).toFixed(1);
}

/** 秒数去掉无意义的 `.0`（`432000ms` → `432`，`188640ms` → `188.6`）。 */
function seconds(ms: number): string {
  return String(Number((ms / 1000).toFixed(1)));
}

/**
 * warning：该章张力线缺 re-hook。没有张力线的章节同样算缺 —— 计划存在时
 * 每章都该把观众挂回埋扣。
 */
function checkChapterRehooks(
  ctx: CheckContext,
  chapters: ChapterSpans[],
  tensions: Map<string, OutlineChapterTension>,
): void {
  for (const chapter of chapters) {
    const tension = tensions.get(chapter.id);
    if (tension?.rehook && tension.rehook.trim() !== "") continue;
    const first = chapter.beats[0];
    if (!first) continue;

    ctx.findings.push({
      id: CHECK_IDS.chapterRehookMissing,
      level: "warning",
      beatId: first.beat.id,
      chapter: chapter.id,
      field: "rehook",
      message:
        `章节「${chapter.id}」的张力线` +
        `${tension ? "没有 re-hook 文本" : "整行缺失"}：本章首拍 ` +
        `${first.beat.id} 没有把观众挂回埋扣，或抛出本章的新问题。` +
        `\n在 outline.md 这一章的 **张力线** 里补 re-hook。`,
      fix:
        "在 outline.md 的章节张力线里补 `re-hook：<本章首拍要挂回的问题>`；" +
        "格式见 references/OUTLINE-FORMAT.md「张力计划」。",
    });
  }
}

/**
 * warning：长片相邻 recall 间隔 > 5 分钟。
 *
 * recall 点 = 埋扣抛出拍 + 每章声明的还扣拍（缺省本章首拍）+ 总还扣拍；
 * 按全片拍号排序去重，用起始时间算间隔。
 */
function checkRecallGaps(
  ctx: CheckContext,
  chapters: ChapterSpans[],
  plan: ReturnType<typeof parseOutlineTension>,
  spansByNumber: Map<number, BeatSpan>,
): void {
  const totalMs = ctx.manifest.beats.reduce(
    (sum, beat) => sum + durationOf(beat),
    0,
  );
  if (totalMs <= LONG_FORM_MS) return;

  const points: BeatSpan[] = [];
  const push = (number: number | undefined): void => {
    if (number === undefined) return;
    const span = spansByNumber.get(number);
    if (span) points.push(span);
  };

  push(plan.openLoop?.plantBeat);
  for (const chapter of chapters) {
    const tension = plan.chapters.get(chapter.id);
    if (!tension) continue;
    push(tension.payoffBeat ?? chapter.beats[0]?.number);
  }
  push(plan.finalPayoff?.beat);

  const seen = new Set<number>();
  const recallPoints = points
    .filter((span) => {
      if (seen.has(span.number)) return false;
      seen.add(span.number);
      return true;
    })
    .sort((a, b) => a.number - b.number);

  for (let index = 1; index < recallPoints.length; index += 1) {
    const previous = recallPoints[index - 1]!;
    const later = recallPoints[index]!;
    const gap = later.startMs - previous.startMs;
    if (gap <= RECALL_GAP_LIMIT_MS) continue;

    ctx.findings.push({
      id: CHECK_IDS.recallGap,
      level: "warning",
      beatId: later.beat.id,
      chapter: later.beat.chapter,
      field: "recall",
      message:
        `还扣间隔过长：${previous.beat.id} → ${later.beat.id} 相隔 ` +
        `${minutes(gap)} 分钟（${seconds(gap)}s），` +
        `超出长片 5 分钟（300s）上限 ${minutes(gap - RECALL_GAP_LIMIT_MS)} 分钟。` +
        `\n埋扣抛出后每 ≤5 分钟至少一次 recall。`,
      fix:
        "把这一段之间的部分还扣提前，或在本章张力线里补一次还扣；" +
        "改 outline.md 的拍号后重跑 check。",
    });
  }
}

/** warning：相邻声明的 interrupt 间隔 > 120 秒。 */
function checkInterruptSpacing(
  ctx: CheckContext,
  tensions: Map<string, OutlineChapterTension>,
  spansByNumber: Map<number, BeatSpan>,
): void {
  const points: BeatSpan[] = [];
  const seen = new Set<number>();
  for (const tension of tensions.values()) {
    const number = tension.interruptBeat;
    if (number === undefined || seen.has(number)) continue;
    const span = spansByNumber.get(number);
    if (!span) continue;
    seen.add(number);
    points.push(span);
  }
  points.sort((a, b) => a.number - b.number);

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const later = points[index]!;
    const gap = later.startMs - previous.startMs;
    if (gap <= INTERRUPT_GAP_LIMIT_MS) continue;

    ctx.findings.push({
      id: CHECK_IDS.interruptSpacing,
      level: "warning",
      beatId: later.beat.id,
      chapter: later.beat.chapter,
      field: "interrupt",
      message:
        `节奏中断间隔过长：${previous.beat.id} → ${later.beat.id} 相隔 ` +
        `${seconds(gap)} 秒，超出 120 秒上限 ` +
        `${seconds(gap - INTERRUPT_GAP_LIMIT_MS)} 秒。` +
        `\n每 90~120 秒安排一次形态突变。`,
      fix:
        "把章节张力线里的 `interrupt@拍` 前移，或在间隔过长的章节补一次中断。",
    });
  }
}

/** warning：连续数字拍 > 2，或章内数字拍占比 > 40%。 */
function checkNumericRuns(
  ctx: CheckContext,
  chapters: ChapterSpans[],
): void {
  for (const chapter of chapters) {
    const beats = chapter.beats;
    const first = beats[0];
    if (!first) continue;
    const numeric = beats.map((span) =>
      ARABIC_DIGIT.test(typeof span.beat.say === "string" ? span.beat.say : ""),
    );

    let runStart = 0;
    let runLength = 0;
    let longestStart = 0;
    let longestLength = 0;
    for (let index = 0; index <= numeric.length; index += 1) {
      if (index < numeric.length && numeric[index]) {
        if (runLength === 0) runStart = index;
        runLength += 1;
        if (runLength > longestLength) {
          longestLength = runLength;
          longestStart = runStart;
        }
      } else {
        runLength = 0;
      }
    }

    if (longestLength > NUMERIC_RUN_LIMIT) {
      const runBeats = beats.slice(
        longestStart,
        longestStart + longestLength,
      );
      const ids = runBeats.map((span) => span.beat.id);
      ctx.findings.push({
        id: CHECK_IDS.numericRun,
        level: "warning",
        beatId: ids[0]!,
        chapter: chapter.id,
        field: "say",
        message:
          `章节「${chapter.id}」连续数字拍 ${longestLength} 拍（上限 2）：` +
          `${ids.join("、")}。` +
          `\n数字连着念会让观众在清单里走神。`,
        fix:
          "连续数字拍 ≤2：把并列数字改成案例 / 代价，或中间插一拍非数字。",
      });
    }

    const numericCount = numeric.filter(Boolean).length;
    if (
      beats.length >= 3 &&
      numericCount / beats.length > NUMERIC_RATIO_LIMIT
    ) {
      const percent = Math.round((numericCount / beats.length) * 100);
      ctx.findings.push({
        id: CHECK_IDS.numericRun,
        level: "warning",
        beatId: first.beat.id,
        chapter: chapter.id,
        field: "say",
        message:
          `章节「${chapter.id}」数字拍 ${numericCount}/${beats.length} 拍，` +
          `占 ${percent}%，超过 40% 上限。` +
          `\n每个数字拍后面要落到「谁付出了什么」。`,
        fix: "把部分数字拍改成案例 / 感受；章内数字拍占比 ≤40%。",
      });
    }
  }
}

/** 句长 = say 里 Unicode 字母 / 数字的个数（标点与空白不算）。 */
function sentenceLength(say: string): number {
  let count = 0;
  for (const char of say) {
    if (LETTER_OR_NUMBER.test(char)) count += 1;
  }
  return count;
}

/**
 * report：章内句长变异系数 < 0.25（只对 ≥4 个非空拍生效）。
 * 刻意的均匀是手法 —— 只报不拦。
 */
function checkRhythm(ctx: CheckContext, chapters: ChapterSpans[]): void {
  for (const chapter of chapters) {
    const nonEmpty = chapter.beats.filter(
      (span) =>
        typeof span.beat.say === "string" && span.beat.say.trim() !== "",
    );
    if (nonEmpty.length < RHYTHM_MIN_BEATS) continue;

    const lengths = nonEmpty.map((span) => sentenceLength(span.beat.say));
    const mean =
      lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
    if (mean <= 0) continue;
    const variance =
      lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) /
      lengths.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv >= RHYTHM_CV_LIMIT) continue;

    const first = chapter.beats[0]!;
    ctx.findings.push({
      id: CHECK_IDS.rhythmUniformity,
      level: "report",
      beatId: first.beat.id,
      chapter: chapter.id,
      field: "say",
      message:
        `节奏均匀：章节「${chapter.id}」${lengths.length} 个非空拍句长变异系数 ` +
        `${cv.toFixed(3)}（< 0.25），平均 ${mean.toFixed(1)} 字。` +
        `\n逐拍句长：${lengths.join(" / ")}` +
        `\n刻意的均匀是手法；先看见，再决定要不要变。`,
    });
  }
}

/**
 * 张力检查入口：读 outline.md 的张力计划 + manifest 实测时长。
 *
 * 容忍人手删计划：outline 缺失、没有可解析章节标题、或整份计划为空时
 * 直接返回，不制造假失败 —— 计划缺失已由 `avp plan` 拦住。
 * 所有结论只落 warning / report，永不改变 `check.ok`。
 */
export function checkTension(ctx: CheckContext): void {
  const outlinePath = join(ctx.root, "outline.md");
  if (!pathExists(outlinePath)) return;

  const chapters = chapterSpans(ctx.manifest.beats);
  if (chapters.length === 0) return;

  const text = readText(outlinePath);
  const chapterIds = chapters.map((chapter) => chapter.id);
  // 与 plan 同一条容错边界：认不出已知章节标题就不校验。
  if (parseOutlineStepCounts(text, chapterIds).size === 0) return;

  const plan = parseOutlineTension(text, chapterIds);
  if (!plan.openLoop && !plan.finalPayoff && plan.chapters.size === 0) return;

  const spansByNumber = new Map<number, BeatSpan>();
  for (const chapter of chapters) {
    for (const span of chapter.beats) spansByNumber.set(span.number, span);
  }

  checkChapterRehooks(ctx, chapters, plan.chapters);
  checkRecallGaps(ctx, chapters, plan, spansByNumber);
  checkInterruptSpacing(ctx, plan.chapters, spansByNumber);
  checkNumericRuns(ctx, chapters);
  checkRhythm(ctx, chapters);
}
