import type { Narration } from "../../registry/types";

/**
 * 第 3 章 · 11 轮 A/B 实验数据（8 拍）。
 *
 * step 7 是单数字金句静帧（motion: "static"）。
 */
export const narrations: Narration[] = [
  // step 0 — 实验台
  {
    say: "同一个模型，DeepSeek V4 Pro。11 轮 A、B 对照实验。",
    caption: "DeepSeek V4 Pro，11 轮 A、B",
    motion: "hook",
  },
  // step 1 — 正确率
  {
    say: "代码正确率，从 90% 拉到 100%。满分，一个 bug 都没放过。",
    caption: "90% → 100%，没放过 bug",
    motion: "hook",
  },
  // step 2 — 断言密度
  {
    say: "测试断言密度，从 28 条涨到 124 条，翻了 4 倍。",
    caption: "断言 28 → 124，翻了 4 倍",
    motion: "hook",
  },
  // step 3 — 覆盖率 + 规范违规
  {
    say: "覆盖率从 62% 干到 85%。代码规范违规，直接砍掉 60%。",
    caption: "覆盖率 62% → 85%，违规 -60%",
    motion: "hook",
  },
  // step 4 — 安全 + bug 复发
  {
    say: "安全防御覆盖翻了 3 倍。同类 bug 复发率降了 91.7%。",
    caption: "安全 3 倍，bug 复发 -91.7%",
    motion: "hook",
  },
  // step 5 — 性能 + SWE-bench
  {
    say: "性能加速 4.6 倍。SWE-bench 回归，从 2 个 bug 干到 0。",
    caption: "4.6 倍；SWE-bench 2 → 0 bug",
    motion: "hook",
  },
  // step 6 — ROI
  {
    say: "不只质量。花 2 万 token 跑流程，净省 10 万。ROI 529%。",
    caption: "2 万 token → 省 10 万，ROI 529%",
    motion: "hook",
  },
  // step 7 — L3 金句静帧
  {
    say: "复杂度越高，回报越大。L3 级任务，ROI 能超 1000%。",
    caption: "L3 任务 ROI 超 1000%",
    motion: "static",
  },
];
