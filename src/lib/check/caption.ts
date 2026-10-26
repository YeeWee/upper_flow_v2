import { CAPTION_MAX_CELLS, captionCells, exceedsCaptionWidth } from "../captions";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";
import { missingTokens, extraTokens } from "./tokens";

/** error：字幕宽度 + say/caption 的数字/专名集合。authored / derived 都检查。 */
export function checkCaptions(ctx: CheckContext): void {
  for (const beat of ctx.manifest.beats) {
    const caption = typeof beat.caption === "string" ? beat.caption : "";
    const say = typeof beat.say === "string" ? beat.say : "";

    if (
      typeof beat.caption === "string" &&
      exceedsCaptionWidth(beat.caption)
    ) {
      ctx.findings.push({
        id: CHECK_IDS.captionTooWide,
        level: "error",
        beatId: beat.id,
        chapter: beat.chapter,
        field: "caption",
        message:
          `节拍 ${beat.id} 的 ${beat.captionSource} caption 超宽：` +
          `「${caption}」${captionCells(caption)} 个全角字符（上限 ${CAPTION_MAX_CELLS}）。` +
          `\n改短文案；不要加省略号。`,
        fix: `把 caption 压到 ${CAPTION_MAX_CELLS} 个全角字符以内（ASCII 记 0.5）；不要加省略号。`,
      });
    }

    const missing = missingTokens(say, caption);
    const extra = extraTokens(say, caption);
    if (missing.length > 0 || extra.length > 0) {
      const differences: string[] = [];
      if (missing.length > 0) {
        differences.push(`少了 say 里的数字/专名：${missing.join("、")}`);
      }
      if (extra.length > 0) {
        differences.push(`多了 say 里没有的数字/专名：${extra.join("、")}`);
      }
      ctx.findings.push({
        id: CHECK_IDS.sayCaptionTokenMismatch,
        level: "error",
        beatId: beat.id,
        chapter: beat.chapter,
        field: "caption",
        message:
          `节拍 ${beat.id} 的 caption 与 say 的数字/专名不一致：${differences.join("；")}。` +
          `\nsay：「${say}」` +
          `\ncaption：「${caption}」`,
        fix: "caption 与 say 的数字/专名集合必须一致：补上缺的，删掉凭空多出来的；可改写句式。",
      });
    }
  }
}
