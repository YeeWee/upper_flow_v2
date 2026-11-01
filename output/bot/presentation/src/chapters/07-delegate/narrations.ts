import type { Narration } from "../../registry/types";

/**
 * 第 7 章 · 把编码外包到隔离环境（14 拍）。
 *
 * 原文 §4「Connect GitHub and Cursor cloud agents」：Builder → 云 Agent
 * 的委托契约，以及「只并行独立任务」的告诫。`say` 与 script.md 第 109–122 块一致。
 * 张力：还扣「并行只给独立的活」@119｜re-hook@109｜interrupt@109。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：把编码外包出去
  {
    say: "这段最反直觉：编码不在主脑上跑，而是丢进隔离环境。",
    caption: "把编码外包到隔离环境",
  },
  // step 1 — Grok Bot 调度
  {
    say: "Grok Bot 负责调度，那谁来真的动代码？",
    caption: "Grok Bot 负责调度",
  },
  // step 2 — Cursor 云 Agent 动手
  {
    say: "Cursor 的云端 Agent 在一个独立环境里改代码，互不打架。",
    caption: "Cursor 的 Agent 独立改码",
  },
  // step 3 — 先接仓库、配环境
  {
    say: "开这个之前先把仓库接上，依赖、测试、要跑的服务都配好。",
    caption: "先接仓库，配好依赖",
  },
  // step 4 — 中断：环境是分开的
  {
    say: "别指望云端 Agent 能摸到主脑电脑上的文件和凭证。",
    caption: "Agent 摸不到主脑文件",
  },
  // step 5 — 先复现，再委托
  {
    say: "第一条 issue，先让 Triage 复现，并把失败测试写下来。",
    caption: "Triage 先复现 issue",
  },
  // step 6 — 再交给 Builder
  {
    say: "复现完了，再把修复这件事交给 Builder。",
    caption: "再交给 Builder",
  },
  // step 7 — 委托契约的三条硬要求
  {
    say: "指令里要写明：独立分支、保住回归测试、只改这个范围。",
    caption: "独立分支，只改这个范围",
  },
  // step 8 — 要求回报的内容
  {
    say: "让它回报分支、PR 地址、测试结果、改了哪些文件、还剩什么风险。",
    caption: "回报分支、PR 和测试",
  },
  // step 9 — 一条 issue 只开一个执行者
  {
    say: "同一条 issue 上不要同时开多个执行者，除非活能干净拆开。",
    caption: "同一条 issue 只开一个",
  },
  // step 10 — 还扣：只并行独立任务
  {
    say: "并行只给互相独立的活：一个修后端，一个修前端，互不碰面。",
    caption: "并行只给独立的活",
  },
  // step 11 — 反例：抢同一个函数
  {
    say: "三个 Agent 抢同一个函数，那不叫产能，那叫互相踩。",
    caption: "三个 Agent 抢一个函数",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "云端环境得跟仓库文档对得上。接不上就报接不上，别编一次成功。",
    caption: "环境要对得上仓库文档",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "云端环境跑不起来，问题常在依赖，不在模型。",
    caption: "跑不起来多半是依赖",
  },
];
