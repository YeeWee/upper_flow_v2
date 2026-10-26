import type { Narration } from "../../registry/types";

/**
 * 第 2 章 · 四个核心机制（6 拍）。
 *
 * step 5 是刻意的静帧过渡（motion: "static"）。
 */
export const narrations: Narration[] = [
  // step 0 — 步骤隔离
  {
    say: "先说步骤隔离。每个子 Agent 只做当前步，不知道下一步。",
    caption: "步骤隔离：Agent 只看当前步",
    motion: "hook",
  },
  // step 1 — 信息瓶颈
  {
    say: "还有信息瓶颈。模块之间只传 200 token，上下文不到 400 token。",
    caption: "只传 200 token，上下文 400",
    motion: "hook",
  },
  // step 2 — 三 Agent 并行
  {
    say: "全程 3 个子 Agent 并行。辩论、审核、开发，各管一段。",
    caption: "3 个 Agent：辩论、审核、开发",
    motion: "hook",
  },
  // step 3 — 铁面编排器 / Gate
  {
    say: "铁面编排器坐镇中间。Gate 不通过，就别想往前走一步。",
    caption: "Gate 不通过，不许前进",
    motion: "hook",
  },
  // step 4 — 四机制流水线
  {
    say: "拼成一条流水线：隔离、限流、并行、把关。",
    caption: "隔离 · 限流 · 并行 · 把关",
    motion: "hook",
  },
  // step 5 — 过渡静帧
  {
    say: "架构说完，看效果。",
    caption: "架构说完，看效果",
    motion: "static",
  },
];
