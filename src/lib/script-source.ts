/**
 * 口播稿与本地产物的解析：`script.md` 的节拍块、`outline.md` 的 step 数。
 * 两种格式都可能被用户手改，因此这里只做「能解析才校验」的宽松解析。
 */

export interface ScriptBlock {
  /** 0-based 块序号。 */
  index: number;
  /** 原文（已 trim），用于报错时展示。 */
  text: string;
  /** 比较用归一化文本。 */
  normalized: string;
}

/**
 * 归一化只抹掉空白（块内换行 / 缩进不参与比较），并做 NFKC
 * （全角 ASCII → ASCII）。标点本身保留 —— caption 推导依赖它。
 */
export function normalizeScriptText(text: string): string {
  return text.normalize("NFKC").replace(/\s+/gu, "");
}

/** 按「独立一行 `---`」切块；空块保留（静音拍就是空块）。 */
export function parseScriptBlocks(text: string): ScriptBlock[] {
  const blocks: string[][] = [[]];
  for (const line of text.split(/\r?\n/u)) {
    if (line.trim() === "---") {
      blocks.push([]);
    } else {
      blocks[blocks.length - 1]!.push(line);
    }
  }
  return blocks.map((lines, index) => {
    const raw = lines.join("\n").trim();
    return { index, text: raw, normalized: normalizeScriptText(raw) };
  });
}

/**
 * 解析 outline.md 每章的 `- step N` 条数。
 *
 * 只认 `## ... <chapterId>` 标题下、以 `- step N` 开头的 bullets；
 * 标题认不出已知章节时该段直接忽略 —— 格式没写全时不要凭空造失败。
 */
export function parseOutlineStepCounts(
  text: string,
  chapterIds: string[],
): Map<string, number> {
  const known = new Set(chapterIds);
  const counts = new Map<string, number>();
  let current: string | null = null;

  for (const line of text.split(/\r?\n/u)) {
    if (/^##\s+/u.test(line) && !/^###/u.test(line)) {
      const candidate = /^##\s+(?:[0-9]+[.)]?\s+)?([a-z0-9][a-z0-9-]*)\b/u.exec(
        line,
      )?.[1];
      current = candidate && known.has(candidate) ? candidate : null;
      if (current && !counts.has(current)) counts.set(current, 0);
      continue;
    }
    if (current && /^\s*-\s*step\s+[0-9]+\b/u.test(line)) {
      counts.set(current, (counts.get(current) ?? 0) + 1);
    }
  }

  return counts;
}
