import type { Narration } from "../../registry/types";

/**
 * 第 1 章 · 问题引入（5 拍）。
 *
 * `say` 与 script.md 的第 1–5 个 `---` 块逐字一致；`caption` 写给眼睛，
 * 单行 ≤ 18 全角字符（ASCII 计 0.5），数字 / 专名与 `say` 同集合。
 * `motion`: "hook" 走挂载钩子；"static" 是刻意的静帧。
 * 张力：re-hook@1｜埋扣@2｜recall@4｜interrupt@5。
 */
export const narrations: Narration[] = [
  // step 0 — 输入框 + 光标：3 秒内给代价
  {
    say: "需求丢给 AI，代码一行一行往外冒。你敢直接上线吗？",
    caption: "AI 写的代码，敢上线吗",
    motion: "hook",
  },
  // step 1 — 三张故障卡 + 埋扣（当拍不回答）
  {
    say: "它编接口、跳过测试、改你没让改的。同一个模型，凭什么加上框架就能把 bug 清零？",
    caption: "同一个模型，凭什么 bug 清零",
    motion: "hook",
  },
  // step 2 — 品牌字标
  {
    say: "所以我们做了个多 Agent 协作框架。叫 trae-harness。",
    caption: "trae-harness：多 Agent 协作",
    motion: "hook",
  },
  // step 3 — 边界诊断图（部分还扣）
  {
    say: "根子不在模型。边界不清，它就有地方编。",
    caption: "边界不清，它就有地方编",
    motion: "hook",
  },
  // step 4 — 过渡问句（中断点）
  {
    say: "那它到底怎么做到的？",
    caption: "它到底怎么做到的？",
    motion: "hook",
  },
];
