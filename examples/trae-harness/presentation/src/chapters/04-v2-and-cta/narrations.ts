import type { Narration } from "../../registry/types";

/**
 * 第 4 章 · v2.0 能力 + 行动召唤（3 拍）。
 *
 * step 2 是收尾静帧（motion: "static"）。
 */
export const narrations: Narration[] = [
  // step 0 — v2.0 类型自适应
  {
    say: "而且 v2.0 不只做代码。项目类型自适应：视频项目自动上 VISUAL_GATE，设计项目走视觉验收。8 个模板，11 个 Agent 角色，按需加载。",
    caption: "v2.0：VISUAL_GATE，8 模板 11 Agent",
    motion: "hook",
  },
  // step 1 — trae-acceptance 三层验收
  {
    say: "还有独立的验收引擎，trae-acceptance。浏览器自动化、视觉检查、双轨复盘，三层保险。",
    caption: "trae-acceptance：三层保险",
    motion: "hook",
  },
  // step 2 — 终屏静帧
  {
    say: "trae-harness。用确定性对抗模糊，用规则防幻觉。GitHub 搜 zzzkeepdd 斜杠 trae-harness。",
    caption: "GitHub：zzzkeepdd / trae-harness",
    motion: "static",
  },
];
