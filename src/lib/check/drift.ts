import { buildBeats, discoverChapters } from "../beats";
import { AvpError } from "../errors";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";

const DRIFT_FIELDS = [
  "id",
  "chapter",
  "chapterIndex",
  "step",
  "say",
  "caption",
  "captionSource",
  "audio",
  "motion",
  "textHash",
] as const;

function shorten(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 60 ? `${value.slice(0, 60)}...` : value;
  }
  return JSON.stringify(value);
}

function addDrift(
  ctx: CheckContext,
  beatId: string | undefined,
  chapter: string | undefined,
  field: string,
  message: string,
): void {
  ctx.findings.push({
    id: CHECK_IDS.beatsDrift,
    level: "error",
    ...(beatId ? { beatId } : {}),
    ...(chapter ? { chapter } : {}),
    field,
    message,
    fix: "narrations.ts 是唯一真相源：改完口播后运行 avp plan 重新生成 beats.json；不要手改 beats.json。",
  });
}

/**
 * error：beats.json 与 narrations.ts 重建结果逐字段对比。
 * durationMs / tts 由 tts 拥有，刻意不比；audio 仍比（路径必须来自源）。
 */
export async function checkDrift(ctx: CheckContext): Promise<void> {
  let source: ReturnType<typeof buildBeats>;
  try {
    const chapters = await discoverChapters(ctx.paths);
    source = buildBeats(chapters, ctx.manifest.theme);
  } catch (err) {
    const avp = err instanceof AvpError ? err : null;
    const beatId =
      typeof avp?.details?.beatId === "string" ? avp.details.beatId : undefined;
    const chapter =
      typeof avp?.details?.chapter === "string"
        ? avp.details.chapter
        : undefined;
    if (avp?.code === "caption-too-wide") {
      ctx.findings.push({
        id: CHECK_IDS.captionTooWide,
        level: "error",
        ...(beatId ? { beatId } : {}),
        ...(chapter ? { chapter } : {}),
        field: "caption",
        message: avp.message,
        fix: "把口播源里的 caption 压到 18 个全角字符以内；不要加省略号。",
      });
    }
    addDrift(
      ctx,
      beatId,
      chapter,
      "source",
      `无法从口播源重建节拍清单：${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  const actual = ctx.manifest.beats;
  const expected = source.beats;
  const count = Math.max(actual.length, expected.length);
  for (let index = 0; index < count; index++) {
    const current = actual[index];
    const next = expected[index];

    if (!next && current) {
      addDrift(
        ctx,
        current.id,
        current.chapter,
        "beats",
        `节拍清单比口播源多了 1 拍（${current.id}）。`,
      );
      continue;
    }
    if (next && !current) {
      addDrift(
        ctx,
        next.id,
        next.chapter,
        "beats",
        `口播源比节拍清单多了 1 拍（${next.id}）。`,
      );
      continue;
    }
    if (!next || !current) continue;

    for (const field of DRIFT_FIELDS) {
      if (current[field] === next[field]) continue;
      addDrift(
        ctx,
        current.id,
        current.chapter,
        field,
        `节拍 ${current.id} 的 ${field} 与口播源不一致。` +
          `\nbeats.json：${shorten(current[field])}` +
          `\nnarrations.ts：${shorten(next[field])}`,
      );
    }
  }
}
