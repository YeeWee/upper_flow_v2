/**
 * 口播稿与本地产物的解析：`script.md` 的节拍块、`outline.md` 的 step 数与
 * 张力计划。两种格式都可能被用户手改，因此这里只做「能解析才校验」的宽松解析。
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

/** outline 的二级标题：是标题但不是已知章节时返回 null，不是标题时 undefined。 */
function outlineChapterHeading(
  line: string,
  known: Set<string>,
): string | null | undefined {
  if (!/^##\s+/u.test(line) || /^###/u.test(line)) return undefined;
  const candidate = /^##\s+(?:[0-9]+[.)]?\s+)?([a-z0-9][a-z0-9-]*)\b/u.exec(
    line,
  )?.[1];
  return candidate && known.has(candidate) ? candidate : null;
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
    const heading = outlineChapterHeading(line, known);
    if (heading !== undefined) {
      current = heading;
      if (current && !counts.has(current)) counts.set(current, 0);
      continue;
    }
    if (current && /^\s*-\s*step\s+[0-9]+\b/u.test(line)) {
      counts.set(current, (counts.get(current) ?? 0) + 1);
    }
  }

  return counts;
}

export interface OutlineOpenLoop {
  /** 埋扣那句话。 */
  text: string;
  /** 抛出拍（全片 1-based）。 */
  plantBeat: number;
  /** 声明的总还扣拍（全片 1-based）。 */
  payoffBeat: number;
}

export interface OutlineFinalPayoff {
  /** 总还扣那句话。 */
  text: string;
  /** 总还扣拍（全片 1-based）。 */
  beat: number;
}

export interface OutlineChapterTension {
  /** `还扣「...」` 里的部分答案。 */
  payoff: string;
  /** 还扣拍号；省略时为 undefined，由调用方按本章首拍补默认。 */
  payoffBeat?: number;
  /** re-hook 文本；整段省略时为 undefined。 */
  rehook?: string;
  /** re-hook 拍号；省略时为 undefined，由调用方按本章首拍补默认。 */
  rehookBeat?: number;
  /** interrupt 拍号；未声明 interrupt 时为 undefined。 */
  interruptBeat?: number;
}

export interface OutlineTensionPlan {
  openLoop?: OutlineOpenLoop;
  finalPayoff?: OutlineFinalPayoff;
  /** 章节张力线：键是章节 id，只收能解析的行。 */
  chapters: Map<string, OutlineChapterTension>;
}

/** 去掉行首引用块标记（`> `），让 `> **埋扣**` 与裸 `**埋扣**` 都能认。 */
function stripOutlineQuote(line: string): string {
  return line.replace(/^\s*>\s?/u, "").trim();
}

/**
 * `@拍 <n>` 段：没写返回 undefined，写了但读不出数字返回 null
 * （整行按坏行处理，不静默退回默认拍号）。
 */
function parseBeatMarker(text: string): number | null | undefined {
  const marker = /@\s*拍/u.exec(text);
  if (!marker) return undefined;
  const digit = /@\s*拍\s*(-?[0-9]+)/u.exec(text);
  if (!digit) return null;
  const beat = Number(digit[1]);
  return Number.isSafeInteger(beat) ? beat : null;
}

/** 把 `还扣「...」` 段拆成答案与（可选的）拍号；坏行返回 null。 */
function parsePayoffSegment(
  segment: string,
): { payoff: string; beat?: number } | null {
  const match = /^还扣\s*[「『]([^」』]*)[」』]\s*(.*)$/u.exec(segment.trim());
  if (!match) return null;
  const rested = parseBeatMarker(match[2] ?? "");
  if (rested === null) return null;
  return rested === undefined
    ? { payoff: match[1]! }
    : { payoff: match[1]!, beat: rested };
}

/**
 * 把 `re-hook：...` / `rehook@拍 2：...` 段拆成文本与（可选的）拍号。
 * 不是 re-hook 段返回 undefined（忽略）；写了拍号但读不出数字返回 null（整行坏）。
 */
function parseRehookSegment(
  segment: string,
): { rehook?: string; beat?: number } | null | undefined {
  if (!/^re-?hook\b/iu.test(segment.trim())) return undefined;
  const beat = parseBeatMarker(segment);
  if (beat === null) return null;
  const text = segment
    .replace(/@\s*拍\s*-?[0-9]+/u, "")
    .replace(/^re-?hook\b/iu, "")
    .replace(/^[\s：:]+/u, "")
    .trim();
  return {
    ...(text ? { rehook: text } : {}),
    ...(beat === undefined ? {} : { beat }),
  };
}

/** 声明尾巴（`—— 第 2 拍抛出，第 22 拍总还扣`）从正文里切掉，只留那句话。 */
function declarationText(body: string): string {
  return body
    .replace(
      /\s*(?:——|—|--)\s*第\s*-?[0-9]+\s*拍[^—]*$/u,
      "",
    )
    .trim();
}

/** 解析一行 `**张力线**：...`；任何一段写坏都返回 null（整行按缺失处理）。 */
function parseChapterTensionLine(line: string): OutlineChapterTension | null {
  const body = /^\*\*张力线\*\*\s*[：:]\s*(.*)$/u.exec(line)?.[1];
  if (body === undefined) return null;

  const segments = body.split(/[｜|]/u).map((segment) => segment.trim());
  const payoffSegment = segments.find((segment) => /^还扣/u.test(segment));
  if (!payoffSegment) return null;
  const payoff = parsePayoffSegment(payoffSegment);
  if (!payoff) return null;

  const tension: OutlineChapterTension = { payoff: payoff.payoff };
  if (payoff.beat !== undefined) tension.payoffBeat = payoff.beat;

  for (const segment of segments) {
    const rehook = parseRehookSegment(segment);
    if (rehook === null) return null;
    if (rehook === undefined) continue;
    if (rehook.rehook) tension.rehook = rehook.rehook;
    if (rehook.beat !== undefined) tension.rehookBeat = rehook.beat;
  }

  const interruptSegment = segments.find((segment) =>
    /^interrupt\b/iu.test(segment),
  );
  if (interruptSegment) {
    const beat = parseBeatMarker(interruptSegment);
    if (beat === null) return null;
    if (beat !== undefined) tension.interruptBeat = beat;
  }

  return tension;
}

/**
 * 解析 outline.md 的张力计划（ADR 0003）。
 *
 * 三行格式见 references/OUTLINE-FORMAT.md：
 * - 全片 `> **埋扣**：<一句话> —— 第 <N> 拍抛出，第 <M> 拍总还扣`
 * - 全片 `> **总还扣**：<那句话> —— 第 <M> 拍`
 * - 每章 `> **张力线**：还扣「<部分答案>」@拍 <k>｜re-hook：<...>｜interrupt@拍 <i>`
 *
 * 全程不抛错：认不出的行按「没写」处理，缺省拍号返回 undefined，由 plan 补默认
 * 并校验范围 —— 写坏的张力行等同于缺声明，不许静默变成合法计划。
 */
export function parseOutlineTension(
  text: string,
  chapterIds: string[],
): OutlineTensionPlan {
  const known = new Set(chapterIds);
  const plan: OutlineTensionPlan = { chapters: new Map() };
  let current: string | null = null;

  for (const rawLine of text.split(/\r?\n/u)) {
    const heading = outlineChapterHeading(rawLine, known);
    if (heading !== undefined) {
      current = heading;
      continue;
    }

    const line = stripOutlineQuote(rawLine);
    if (!line) continue;

    const hook = /^\*\*埋扣\*\*\s*[：:]\s*(.*)$/u.exec(line)?.[1];
    if (hook !== undefined) {
      const plant = /第\s*(-?[0-9]+)\s*拍抛出/u.exec(hook);
      const payoff = /第\s*(-?[0-9]+)\s*拍总还扣/u.exec(hook);
      if (!plan.openLoop && plant && payoff) {
        plan.openLoop = {
          text: declarationText(hook),
          plantBeat: Number(plant[1]),
          payoffBeat: Number(payoff[1]),
        };
      }
      continue;
    }

    const finalPayoff = /^\*\*总还扣\*\*\s*[：:]\s*(.*)$/u.exec(line)?.[1];
    if (finalPayoff !== undefined) {
      const beat = /第\s*(-?[0-9]+)\s*拍/u.exec(finalPayoff);
      if (!plan.finalPayoff && beat) {
        plan.finalPayoff = {
          text: declarationText(finalPayoff),
          beat: Number(beat[1]),
        };
      }
      continue;
    }

    if (!current || plan.chapters.has(current)) continue;
    const tension = parseChapterTensionLine(line);
    if (tension) plan.chapters.set(current, tension);
  }

  return plan;
}
