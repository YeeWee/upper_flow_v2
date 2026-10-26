import type { Narration } from "../../registry/types";

/**
 * 第 1 章 · 问题引入（5 拍）。
 *
 * `say` 与 script.md 的第 1–5 个 `---` 块逐字一致；`caption` 写给眼睛，
 * 单行 ≤ 18 全角字符（ASCII 计 0.5），数字 / 专名与 `say` 同集合。
 * `motion`: "hook" 走挂载钩子；"static" 是刻意的静帧。
 */
export const narrations: Narration[] = [
  // step 0 — 输入框 + 光标
  {
    say: "你把需求丢给 AI，它写代码。",
    caption: "需求丢给 AI",
    motion: "hook",
  },
  // step 1 — 三张故障卡
  {
    say: "也产生幻觉。跳过测试。自由发挥。",
    caption: "幻觉 / 跳测试 / 自由发挥",
    motion: "hook",
  },
  // step 2 — 品牌字标
  {
    say: "所以我们做了一个框架，叫 trae-harness。",
    caption: "框架：trae-harness",
    motion: "hook",
  },
  // step 3 — 边界诊断图
  {
    say: "不确定每个 Agent 的边界，就一定有幻觉的模糊空间。",
    caption: "Agent 边界 = 幻觉空间",
    motion: "hook",
  },
  // step 4 — 过渡问句
  {
    say: "它怎么做到的？",
    caption: "它怎么做到的？",
    motion: "hook",
  },
];
