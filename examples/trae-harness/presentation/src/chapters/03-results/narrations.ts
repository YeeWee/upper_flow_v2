import type { Narration } from "../../registry/types";

/**
 * 第 3 章 · 11 轮 A/B 实验数据（8 拍）。
 *
 * step 7 是刻意的静帧（部分还扣：同一模型，前后只差一套流程）。
 * 张力：re-hook@1｜interrupt@6｜recall@8（全片拍 12/17/19）。
 *
 * 数字拍只留 3 拍（12 / 13 / 17，37.5%，最长连续 2）。精确值
 * （11 轮、28→124、62→85、-60%、3 倍、-91.7%、L3、1000%）由画面承载，
 * 口播改用案例 / 代价接住，不让数字接数字。
 */
export const narrations: Narration[] = [
  // step 0 — 实验台（章首重挂钩）
  {
    say: "同一个 DeepSeek V4 Pro，只换流程。A、B 两组，同题对跑。",
    caption: "DeepSeek V4 Pro，A、B 两组",
    motion: "hook",
  },
  // step 1 — 正确率
  {
    say: "代码正确率，90% 到 100%。一个 bug 都没放过。",
    caption: "90% → 100%，没放过 bug",
    motion: "hook",
  },
  // step 2 — 断言密度（数字换成纸薄的处境）
  {
    say: "没框架的时候，测试薄得像张纸。现在它自己写，你半夜能睡整觉。",
    caption: "测试薄得像纸，现在它写满",
    motion: "hook",
  },
  // step 3 — 覆盖率 + 规范违规（数字换成没人测的处境）
  {
    say: "以前有些代码，上线前压根没人测。现在它先补测试，再挑规范。",
    caption: "没人测过的代码，它先补",
    motion: "hook",
  },
  // step 4 — 安全 + bug 复发（数字换成同一个坑）
  {
    say: "安全这关，它自己先过一遍。同一个坑，不会再踩第二次。",
    caption: "同一个坑，不再踩第二次",
    motion: "hook",
  },
  // step 5 — 性能 + SWE-bench（中断点）
  {
    say: "性能快了四倍多。SWE-bench 上，2 个 bug。清零。",
    caption: "SWE-bench：2 个 bug 清零",
    motion: "hook",
  },
  // step 6 — 成本账本（案例接地：你多花多少、净省多少）
  {
    say: "你多花两万 token 走流程，净省十万。ROI 五倍多。",
    caption: "两万 token 省十万，ROI 五倍多",
    motion: "hook",
  },
  // step 7 — 静帧：部分还扣
  {
    say: "同一模型，前后只差一套流程。任务越复杂，这套流程越值钱。",
    caption: "同一模型，只差一套流程",
    motion: "static",
  },
];
