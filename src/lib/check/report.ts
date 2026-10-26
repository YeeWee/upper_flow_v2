import { CHECK_IDS } from "./types";
import type { CheckContext, Finding } from "./types";

function durationOf(beat: { durationMs: number | null }): number {
  return typeof beat.durationMs === "number" && Number.isFinite(beat.durationMs)
    ? Math.max(0, beat.durationMs)
    : 0;
}

/** report：每章拍数 / 总毫秒 + 全片合计 + 逐拍明细。永不阻断。 */
export function checkDurationTable(ctx: CheckContext): void {
  const byChapter = new Map<string, { count: number; ms: number }>();
  for (const beat of ctx.manifest.beats) {
    const row = byChapter.get(beat.chapter) ?? { count: 0, ms: 0 };
    row.count += 1;
    row.ms += durationOf(beat);
    byChapter.set(beat.chapter, row);
  }

  const totalMs = ctx.manifest.beats.reduce(
    (sum, beat) => sum + durationOf(beat),
    0,
  );
  const rows = [...byChapter.entries()].map(
    ([chapter, row]) => `  ${chapter}  ${row.count} 拍  ${row.ms}ms`,
  );
  const perBeat = ctx.manifest.beats
    .map((beat) => `${beat.id}=${durationOf(beat)}ms`)
    .join(", ");

  ctx.findings.push({
    id: CHECK_IDS.durationTable,
    level: "report",
    message: [
      "时长表",
      ...rows,
      `  合计  ${ctx.manifest.beats.length} 拍  ${totalMs}ms`,
      `  逐拍：${perBeat || "（无节拍）"}`,
    ].join("\n"),
  });
}

/**
 * report：每拍两个意图静帧时间戳。
 * 渲染链在 atMs 两处截图并比对像素差；静止是手法，因此永不阻断。
 */
export function checkStillFrames(ctx: CheckContext): void {
  let start = 0;
  for (const beat of ctx.manifest.beats) {
    const duration = durationOf(beat);
    const from = start + 200;
    const to = Math.max(from, start + duration - 200);
    const finding: Finding = {
      id: CHECK_IDS.stillFrames,
      level: "report",
      beatId: beat.id,
      chapter: beat.chapter,
      message:
        `静帧：${beat.id} 在 ${from}–${to}ms 各抓一帧（` +
        `渲染链比对像素差，只报不拦）。`,
      atMs: [from, to],
      kind: "still",
    };
    ctx.findings.push(finding);
    start += duration;
  }
}
