import type { Narration } from "../../registry/types";

/**
 * 第 10 章 · 存成技能，再开夜班（18 拍）。
 *
 * 原文 §5「Save the process as a reusable skill」+「Add a routine that
 * runs while you sleep」。`say` 与 script.md 第 157–174 块一致。
 * 张力：还扣「技能是方法，不是排班」@163｜re-hook@157｜interrupt@162。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：你有一条跑通的顺序
  {
    say: "这条顺序你跑通过一次。能不能别每次从零重写？",
    caption: "你有一条跑通的顺序",
  },
  // step 1 — 别每条都重写
  {
    say: "复现、修复、评审、交接。别每条 issue 都从头重写一遍。",
    caption: "别每条 issue 都重写",
  },
  // step 2 — 存成技能
  {
    say: "把它原样存成一个技能，下次直接调。",
    caption: "把它存成一个技能",
  },
  // step 3 — 技能写什么
  {
    say: "技能写的不是排班，是方法：何时用、输入什么、几步、边界在哪、产出什么。",
    caption: "技能写方法，不写排班",
  },
  // step 4 — 八步流程
  {
    say: "流程八步，从分诊复现一直走到最终交接。",
    caption: "八步，从复现到交接",
  },
  // step 5 — 限制写死
  {
    say: "限制写死：不合并、不部署、最多两轮返修、测试说不清就停。",
    caption: "最多两轮返修",
  },
  // step 6 — 还扣：方法可手动可定时
  {
    say: "技能是方法，不是时间表。手动、事件触发、定时任务都能调它。",
    caption: "方法能手动，也能定时",
  },
  // step 7 — 先跑第二遍无害 issue
  {
    say: "自动化之前，先拿一条无害的 issue 再跑一遍。",
    caption: "先拿无害的 issue 试",
  },
  // step 8 — 第二遍还错 → 改流程 / 加检查
  {
    say: "第二遍还错在同一个地方，就改流程，或者加一个机械检查。",
    caption: "同一个地方再错就加检查",
  },
  // step 9 — 夜班例程
  {
    say: "接下来才是夜班：每天二十三点跑一次的例程。",
    caption: "然后才是夜班",
  },
  // step 10 — 中断：触发器要窄
  {
    say: "触发器要窄。别让每条评论都来叫醒五个 Bot。",
    caption: "别让评论叫醒五个 Bot",
  },
  // step 11 — 第一条无人值守规则
  {
    say: "第一次无人值守，只用 agent-ready 标签，还要限制条数。",
    caption: "只用 agent-ready 标签",
  },
  // step 12 — 停止条件
  {
    say: "例程里写清停止条件：没权限、复现不了、反复失败、用量到顶、评审有阻断、改动太敏感。",
    caption: "写清停止条件",
  },
  // step 13 — 产出是报告
  {
    say: "早上的产出是一份报告，不是一堆你没读过的对话。报告写清楚，早上那一下才敢点。",
    caption: "早上的产出是一份报告",
  },
  // step 14 — 定时任务不是永动机
  {
    say: "定时任务不是永动机。用量、故障、电脑恢复，都会打断它。",
    caption: "定时任务不是永动机",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "测试例程会真的改文件，输入要安全，边界跟正式跑一样。",
    caption: "测试例程也会真改文件",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "跳过已经在跑的 issue，别让同一条活派两遍。",
    caption: "跳过在跑的 issue",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "例行任务会被打断，恢复点写在状态里，不在记忆里。",
    caption: "恢复点写进状态",
  },
];
