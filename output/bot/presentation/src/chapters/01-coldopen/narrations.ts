import type { Narration } from "../../registry/types";

/**
 * 第 1 章 · 凌晨三点的一条 issue（14 拍）。
 *
 * `say` 与 script.md 第 1–12 个 `---` 块逐字一致；`caption` 写给眼睛，
 * 单行 ≤ 18 全角字符，数字 / 专名与 `say` 同集合。
 * 张力：埋扣@4｜re-hook@1｜interrupt@12。
 */
export const narrations: Narration[] = [
  // step 0 — 黑场 + 时间戳：钩子第一句给场景
  {
    say: "凌晨三点，一条打标的 GitHub issue 自己进来了。办公室里没人醒着。",
    caption: "GitHub issue 凌晨进来",
  },
  // step 1 — 对话列表里多出一个分支 + 草稿 PR
  {
    say: "天还没亮，一份装着修复的草稿 PR 已经挂在仓库里。",
    caption: "草稿 PR 挂在仓库里",
  },
  // step 2 — 你睡着 → 工作继续（对比屏）
  {
    say: "这件事最有意思的地方，不是又多了个会写代码的聊天框。",
    caption: "这不是又一个聊天框",
  },
  // step 3 — 埋扣：把问题挂起来，当拍不回答
  {
    say: "问题只剩一个：你早上打开它，凭什么敢点合并？",
    caption: "凭什么敢点合并",
  },
  // step 4 — 错误用法：一个 Bot + 一句需求
  {
    say: "大部分人第一次用 Grok Bot，基本都这么用。",
    caption: "第一次用 Grok Bot",
  },
  // step 5 — 看它写二十分钟代码
  {
    say: "建一个机器人，丢一句做个应用，然后看它写二十分钟代码。",
    caption: "建个机器人，看它写代码",
  },
  // step 6 — 屏幕上出现「自主 AI 工程师」
  {
    say: "代码一行一行往外冒，你就管这个叫自主的 AI 工程师。",
    caption: "这叫自主 AI 工程师",
  },
  // step 7 — 十月七号公告（原文截图位）
  {
    say: "十月七号，马斯克说 Grok Bot 会按任务挑最合适的后端。",
    caption: "Grok Bot 按任务挑模型",
  },
  // step 8 — 名单里出现 Claude Opus 5.5
  {
    say: "名单里包括 Claude Opus 5.5，一个更擅长长链条推理的模型。",
    caption: "包括 Claude Opus 5.5",
  },
  // step 9 — 中断：这条消息改的是架构
  {
    say: "这条消息改的不是模型版本，是整条流水线该怎么搭。",
    caption: "改的是流水线怎么搭",
  },
  // step 10 — 分工图：Grok Bot 提供环境
  {
    say: "Grok Bot 出电脑、浏览器、终端、长期上下文和定时例程。",
    caption: "Grok Bot 出电脑和终端",
  },
  // step 11 — 分工图合拢：推理 + 环境 = 团队
  {
    say: "Opus 5.5 负责推理，环境负责持久，缺一个都不成团队。",
    caption: "Opus 5.5 出推理",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "产出不是合并的代码，也不是上线。是带证据、能评审的活。",
    caption: "产出是能评审的活",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "这套流程的终点不是全自动，是每一步都能被检查。",
    caption: "终点是每一步可查",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "一个人加五个 Bot 能跑成一支小队，前提是先有人写规矩。",
    caption: "先有人给 Bot 写规矩",
  },
];
