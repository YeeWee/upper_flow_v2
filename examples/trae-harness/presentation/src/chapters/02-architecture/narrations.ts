import type { Narration } from "../../registry/types";

/**
 * 第 2 章 · 四个核心机制（6 拍）。
 *
 * step 5 是刻意的静帧（部分还扣：四道锁串成一条不许蒙混的线）。
 * 张力：re-hook@1｜interrupt@3｜recall@6（全片拍 6/8/11）。
 */
export const narrations: Narration[] = [
  // step 0 — 步骤隔离（章首重挂钩）
  {
    say: "模型没换，换的是它每一步能看到什么。子 Agent 只做当前步。下一步看不到。",
    caption: "子 Agent 只看当前步",
    motion: "hook",
  },
  // step 1 — 信息瓶颈
  {
    say: "模块之间只传 200 token。单步上下文不到 400。",
    caption: "只传 200 token，上下文 400",
    motion: "hook",
  },
  // step 2 — 三 Agent 并行（中断点）
  {
    say: "三个 Agent 同时开工，不会打架？辩论、审核、开发，各管一段。",
    caption: "三个 Agent，各管一段",
    motion: "hook",
  },
  // step 3 — 铁面编排器 / Gate
  {
    say: "铁面编排器坐镇中间。Gate 不通过，就别想往前走。",
    caption: "Gate 不通过，不许前进",
    motion: "hook",
  },
  // step 4 — 四机制流水线
  {
    say: "四个机制串起来：隔离、限流、并行、把关。",
    caption: "隔离 · 限流 · 并行 · 把关",
    motion: "hook",
  },
  // step 5 — 静帧：部分还扣 + 挂回结果章
  {
    say: "四道锁全上，没有一步能蒙过去。模型没换，看它被逼成什么样。",
    caption: "模型没换，看被逼成什么样",
    motion: "static",
  },
];
