import type { Narration } from "../../registry/types";

/**
 * 第 12 章 · 先跑一条 bug，再谈夜班（21 拍）。
 *
 * 原文 §6「WHAT BREAKS」+ THE FIRST RUN + THE REAL SHIFT：六条会坏的事、
 * 分级启用的顺序、真正的价值，以及总还扣。`say` 与 script.md 第 194–214 块一致。
 * 张力：还扣「先跑一条安全的 bug」@202｜re-hook@194｜interrupt@197｜总还扣@214。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：收尾不是泼冷水
  {
    say: "收尾这一段不是泼冷水，是提前告诉你哪里会先坏。",
    caption: "哪里会先坏",
  },
  // step 1 — 模型会换
  {
    say: "模型会换。任务合同和验收规则，别绑在某一个模型上。",
    caption: "任务合同别绑在模型上",
  },
  // step 2 — 两个 Bot 抢同一条 issue
  {
    say: "两个 Bot 抢同一条 issue，靠唯一编号和一个当前负责人挡住。",
    caption: "两个 Bot 抢 issue，靠编号",
  },
  // step 3 — 电脑会被重建
  {
    say: "常规重建里，workspace 的文件会留。装好的依赖会丢，最近几小时的改动也可能没。",
    caption: "workspace 会留，依赖会丢",
  },
  // step 4 — 评审循环转不停
  {
    say: "评审循环可能永远转下去。限轮次，同一个错重复就升级。",
    caption: "评审要限轮次",
  },
  // step 5 — 用量会用完
  {
    say: "用量会用完。按跑通的流程算成本，别按 issue 估。",
    caption: "别按 issue 估成本",
  },
  // step 6 — 中断：敏感数据跨边界
  {
    say: "敏感数据会跨边界。先看账号、凭证、代码敏感度和公司政策。",
    caption: "先看账号、凭证和策略",
  },
  // step 7 — 别一次全开
  {
    say: "别一次把所有零件都打开，那样你分不清是谁坏的。",
    caption: "别一次全打开",
  },
  // step 8 — 还扣：先跑一条安全的 bug
  {
    say: "先跑一条安全的 bug。",
    caption: "先跑一条安全的 bug",
  },
  // step 9 — 一次成功的交接
  {
    say: "再跑一次成功的交接。然后一次被独立评审过的修复。",
    caption: "再要一次被评审的修复",
  },
  // step 10 — 变成技能，最后开夜班
  {
    say: "再把它变成技能，然后才轮到夜班。",
    caption: "然后才轮到夜班",
  },
  // step 11 — 第一次运行：今天就能开始
  {
    say: "你不用等十二天。今天就建 Chief，粘一段话进去，只跑一条 issue。",
    caption: "今天建 Chief，只跑一条 issue",
  },
  // step 12 — 跑通后：存流程，再跑一遍
  {
    say: "等第一条 issue 干干净净走到草稿 PR，再把流程存下来，跑第二遍。",
    caption: "issue 走到草稿 PR 再存",
  },
  // step 13 — 第一次运行的三条禁令
  {
    say: "先不建云 agent，不动生产代码，也不开例程。",
    caption: "先不建云 agent，不动生产",
  },
  // step 14 — 第一周只跑一条
  {
    say: "第一周只跑一条，跑顺了再加一条。",
    caption: "第一周只跑一条",
  },
  // step 15 — 额度用完就停
  {
    say: "套餐额度用完就停，不自动加钱。",
    caption: "额度用完就停",
  },
  // step 16 — 真要保证某个后端，得单独配
  {
    say: "要保证某一步走 Opus 5.5，得单独配 Claude 的 API，或者用 Claude Code。",
    caption: "Opus 5.5 要单配 Claude API 或 Code",
  },
  // step 17 — Cursor 的计费口径
  {
    say: "Cursor 的文档还说，底层换没换模型，按 token 的计费不变。",
    caption: "Cursor 换模型不改 token 计费",
  },
  // step 18 — 真正的转变
  {
    say: "真正变的地方不是五个 Bot 在跑，是你不用一直盯着它们。",
    caption: "不用一直盯着 Bot",
  },
  // step 19 — 定义结果、边界和证据
  {
    say: "你定结果、定边界、定验收证据。团队干可逆的活，遇到大事再叫你。",
    caption: "你定边界，它干可逆的活",
  },
  // step 20 — 总还扣：落在末拍
  {
    say: "所以早上八点，你凭什么敢点合并？因为每一步都留了证据。让它们干活，按钮留在你手里。",
    caption: "每一步都留了证据",
  },
];
