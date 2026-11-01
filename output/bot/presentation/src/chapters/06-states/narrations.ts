import type { Narration } from "../../registry/types";

/**
 * 第 6 章 · 把流程变成状态机（15 拍）。
 *
 * 原文 §4「Turn the workflow into a state machine」：issue 记录才是真相，
 * 十个状态 + 每章文件夹契约 + 归属规则。`say` 与 script.md 第 94–108 块一致。
 * 张力：还扣「状态记录才是唯一真相」@95｜re-hook@94｜interrupt@94。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：群聊不该是真相
  {
    say: "群聊适合商量，但它不该当真相，聊完就散了，也查不到。",
    caption: "群聊不该是真相",
  },
  // step 1 — 真相是 issue 记录
  {
    say: "真相应该是那条 issue 记录本身，谁都能读，谁都能查。",
    caption: "真相是 issue 记录",
  },
  // step 2 — 每次跳转都要有产物
  {
    say: "每条 issue 走固定的状态，每次跳转都要有一个产物跟着。",
    caption: "issue 每跳一格要产物",
  },
  // step 3 — 中断：状态条点亮
  {
    say: "新建、已分诊、已复现、在修、已测、在审，一步一格。",
    caption: "新建到在审，一路有据",
  },
  // step 4 — 失败回流
  {
    say: "审不过就退回在修。审过了才进已通过，不能跳格。",
    caption: "审不过退回在修",
  },
  // step 5 — 还扣：草稿 PR 就绪，停在人工批准
  {
    say: "再往后是草稿 PR 就绪，终点停在人工批准，等你点头。",
    caption: "草稿 PR 就绪，等人批",
  },
  // step 6 — 规则落成文件
  {
    say: "把状态规则写成文件，放进工作区，别只留在对话里。",
    caption: "状态规则写进文件",
  },
  // step 7 — 每条 issue 一个文件夹
  {
    say: "每条 issue 一个文件夹，里面六份东西：任务、状态、证据、实现、评审、交接。",
    caption: "一条 issue 一个文件夹",
  },
  // step 8 — 分段归属
  {
    say: "谁拥有哪几个状态写清楚：Triage 管前段，Builder 管中段。",
    caption: "Triage 前段，Builder 中段",
  },
  // step 9 — Reviewer / Release
  {
    say: "Reviewer 管评审段，Release 管收尾，中间不许越界。",
    caption: "Reviewer 评审，Release 收尾",
  },
  // step 10 — 没证据不推进
  {
    say: "没有证据就不许推进状态。没有明确同意，就不许标通过。",
    caption: "没有证据不推进",
  },
  // step 11 — 规则 ≠ 保证
  {
    say: "这些只是工作流规则，不是保证。真正的保证得靠分支保护和脚本。",
    caption: "规则要靠分支保护和脚本",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "十个状态，每个都有归属，每次跳转都有产物。",
    caption: "十个状态，各有归属",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "状态能回退，产物不能回退，每一格都要留痕。",
    caption: "状态能退，产物不能退",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "状态卡住也要记，卡住不是没发生。",
    caption: "卡住也要记一笔",
  },
];
