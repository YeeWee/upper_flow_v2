import { AvpError } from "./errors";

/** 烧录字幕单行上限：18 个全角字符（ASCII 计 0.5，向上取整）。 */
export const CAPTION_MAX_CELLS = 18;

const SENTENCE_END = /[。！？；]/u;
const CLAUSE_END = /[，、：]/u;

/**
 * 全角字符（CJK 汉字 / 假名 / 谚文 / 全角标点 / 中文排版常用的通用标点）计 1，
 * 其余（ASCII 等）计 0.5。
 */
function isFullWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2000 && codePoint <= 0x206f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3041 && codePoint <= 0x33ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

/** 字幕宽度（单位：全角字符，未取整）。 */
export function captionWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += isFullWidth(char.codePointAt(0)!) ? 1 : 0.5;
  }
  return width;
}

/** 字幕宽度取整后的单元格数。 */
export function captionCells(text: string): number {
  return Math.ceil(captionWidth(text));
}

export function exceedsCaptionWidth(text: string): boolean {
  return captionCells(text) > CAPTION_MAX_CELLS;
}

function assertWidth(beatId: string, text: string, source: "authored" | "derived"): void {
  if (!exceedsCaptionWidth(text)) return;
  throw new AvpError(
    "caption-too-wide",
    `节拍 ${beatId} 的 ${source} caption 超宽：` +
      `「${text}」${captionCells(text)} 个全角字符（上限 ${CAPTION_MAX_CELLS}）。` +
      `\n改短文案；不要加省略号。`,
    {
      beatId,
      field: "caption",
      captionSource: source,
      text,
      cells: captionCells(text),
      maxCells: CAPTION_MAX_CELLS,
    },
  );
}

function cutBefore(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);
  return (match ? text.slice(0, match.index) : text).trim();
}

/**
 * caption 缺失时从 say 推导：
 * 1. 取第一个 `。！？；` 之前的分句；
 * 2. 仍超宽则退到第一个 `，、：` 之前；
 * 3. 再超宽 → `caption-too-wide`。
 * 永不添加省略号。
 */
export function deriveCaption(beatId: string, say: string): string {
  if (say === "") return "";

  const sentence = cutBefore(say, SENTENCE_END);
  if (!exceedsCaptionWidth(sentence)) return sentence;

  const clause = cutBefore(say, CLAUSE_END);
  if (!exceedsCaptionWidth(clause)) return clause;

  throw new AvpError(
    "caption-too-wide",
    `节拍 ${beatId} 的 caption 无法从 say 推导到 ${CAPTION_MAX_CELLS} 个全角字符以内：` +
      `「${clause}」${captionCells(clause)} 个全角字符。` +
      `\n手写 caption，或把 say 的第一句改短；不要加省略号。`,
    {
      beatId,
      field: "caption",
      captionSource: "derived",
      text: clause,
      say,
      cells: captionCells(clause),
      maxCells: CAPTION_MAX_CELLS,
    },
  );
}

/** 手写 caption 同样受单行宽度限制。 */
export function assertAuthoredCaption(beatId: string, caption: string): void {
  assertWidth(beatId, caption, "authored");
}
