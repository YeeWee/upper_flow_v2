import { CAPTION_MAX_CELLS, captionCells, exceedsCaptionWidth } from "../captions";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";
import { missingTokens } from "./tokens";

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
    if (missing.length > 0) {
      ctx.findings.push({
        id: CHECK_IDS.sayCaptionTokenMismatch,
        level: "error",
        beatId: beat.id,
        chapter: beat.chapter,
        field: "caption",
        message:
          `节拍 ${beat.id} 的 caption 少了 say 里的数字/专名：${missing.join("、")}。` +
          `\nsay：「${say}」` +
          `\ncaption：「${caption}」`,
        fix: "把 say 里的数字/专名写进 caption（可改写句式，但不能丢数字或拼错专名）。",
      });
    }
  }
}
