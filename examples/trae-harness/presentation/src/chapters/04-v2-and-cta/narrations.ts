import type { Narration } from "../../registry/types";

/**
 * 第 4 章 · v2.0 能力 + 行动召唤（3 拍）。
 *
 * step 2 是收尾静帧：总还扣 + CTA 同拍完成。
 * 张力：re-hook@1｜recall@3｜interrupt@3（全片拍 20/22/22）。
 */
export const narrations: Narration[] = [
  // step 0 — v2.0 类型自适应（章首重挂钩）
  {
    say: "到了 v2.0，这套规则不只管代码。视频项目，自动上 VISUAL_GATE。设计项目，走视觉验收。八个模板，十一个角色，按需加载。",
    caption: "v2.0：视频上 VISUAL_GATE",
    motion: "hook",
  },
  // step 1 — trae-acceptance 三层验收
  {
    say: "还有个验收引擎，trae-acceptance。浏览器自己点，画面自己看。跑完再双轨复盘。",
    caption: "trae-acceptance：三层保险",
    motion: "hook",
  },
  // step 2 — 终屏静帧：总还扣 + CTA
  {
    say: "trae-harness。答案不在模型，在每条规则替它挡住的那一步。GitHub 搜 zzzkeepdd 斜杠 trae-harness。",
    caption: "GitHub：zzzkeepdd / trae-harness",
    motion: "static",
  },
];
