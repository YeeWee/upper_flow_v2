/**
 * say / caption 的数字与拉丁专名集合比较。
 *
 * 规则（spec §5）：caption 只能比 say 多内容，不能少；少一个数字或拼错专名
 * 就是 error。全角数字经 NFKC 归一到 ASCII；比较大小写不敏感。
 */

const NUMBER_PATTERN = /\d+(?:[.,]\d+)*%?/gu;
const LATIN_PATTERN = /[A-Za-z][A-Za-z0-9]*(?:[-_.][A-Za-z0-9]+)*/gu;

/** 纯单位不是「专名」：300ms vs 300 毫秒 不该判成不一致。 */
const UNIT_TOKENS = new Set([
  "ms",
  "s",
  "sec",
  "secs",
  "min",
  "mins",
  "h",
  "hr",
  "hrs",
  "kg",
  "km",
  "cm",
  "mm",
  "m",
  "g",
  "gb",
  "mb",
  "kb",
  "tb",
  "fps",
  "px",
  "k",
  "b",
  "x",
]);

interface Token {
  /** 比较用的规范键（小写、去千分位）。 */
  key: string;
  /** 回显给用户的原文（NFKC 后）。 */
  text: string;
}

function extractTokens(text: string): Token[] {
  const normalized = text.normalize("NFKC");
  const tokens: Token[] = [];
  const seen = new Set<string>();

  const push = (key: string, display: string): void => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    tokens.push({ key, text: display });
  };

  for (const match of normalized.matchAll(NUMBER_PATTERN)) {
    const display = match[0].replaceAll(",", "");
    push(display.toLowerCase(), display);
  }
  for (const match of normalized.matchAll(LATIN_PATTERN)) {
    const display = match[0];
    const key = display.toLowerCase();
    if (UNIT_TOKENS.has(key)) continue;
    push(key, display);
  }

  return tokens;
}

/** say 里有、caption 里没有的数字/专名（按出现顺序，已去重）。 */
export function missingTokens(say: string, caption: string): string[] {
  const captionKeys = new Set(extractTokens(caption).map((token) => token.key));
  return extractTokens(say)
    .filter((token) => !captionKeys.has(token.key))
    .map((token) => token.text);
}

export { extractTokens };
