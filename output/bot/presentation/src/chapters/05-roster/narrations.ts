import type { Narration } from "../../registry/types";

/**
 * 第 5 章 · 一个 Chief 加四个专家（23 拍）。
 *
 * 原文 §3「Create the Chief and four specialists」：五个角色 + 五段角色
 * prompt 里真正决定行为的约束。`say` 与 script.md 第 71–93 块一致。
 * 张力：还扣「Release 只收四件齐的活」@90｜re-hook@71｜interrupt@78。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：五个 Bot，五份职责
  {
    say: "一个 Chief 带四个专家，每个人只守一道关口。",
    caption: "一个 Chief，四个专家",
  },
  // step 1 — Chief：结果与调度
  {
    say: "Chief 管最终结果，负责把活分下去、把进度收回来。",
    caption: "Chief 管最终结果",
  },
  // step 2 — Triage：复现与分类
  {
    say: "Triage 复现问题，把 bug 分类，给出能重复的证据。",
    caption: "Triage 复现 bug",
  },
  // step 3 — Builder：修复 + 云 Agent
  {
    say: "Builder 管修复，还要带 Cursor 的云端 Agent 一起干。",
    caption: "Builder 带 Cursor 的 Agent",
  },
  // step 4 — Reviewer：独立验证
  {
    say: "Reviewer 独立验证，不看结论，只看证据。",
    caption: "Reviewer 只看证据",
  },
  // step 5 — Release：交接与汇报
  {
    say: "Release 准备交接，负责把状态汇报给你。",
    caption: "Release 准备交接",
  },
  // step 6 — 中断：只找 Chief 一个人
  {
    say: "正常干活，你只找 Chief 一个人，别在群里喊五个。",
    caption: "只找 Chief 一个人",
  },
  // step 7 — Chief 要知道当前 issue
  {
    say: "它得知道现在哪条 issue 在做，下一步该归谁。",
    caption: "哪条 issue 归谁",
  },
  // step 8 — 还要知道产物与阻塞
  {
    say: "还得知道产物在哪，卡在哪，哪些证据还没交。",
    caption: "产物在哪，卡在哪",
  },
  // step 9 — Chief 不写生产代码
  {
    say: "给 Chief 的角色说明里有一句最关键的：不要自己写生产代码。",
    caption: "Chief 不自己写代码",
  },
  // step 10 — 专家说做完 ≠ 完成
  {
    say: "也不要因为某个专家说做完了，就把 issue 标成完成。",
    caption: "issue 不能靠一句话完成",
  },
  // step 11 — 中断：Triage 的要求是证据
  {
    say: "Triage 要的是证据：预期是什么，实际错在哪，日志和截图。",
    caption: "Triage 要的是证据",
  },
  // step 12 — 不猜原因
  {
    say: "能写失败测试就写。证据不支持的时候，不许猜原因。",
    caption: "证据不够就不许猜",
  },
  // step 13 — Builder：最小安全修复
  {
    say: "Builder 接手已复现的问题，只找最小的、最安全的那一刀。",
    caption: "Builder 找最小的修复",
  },
  // step 14 — 分支 + 回归测试 + 测试
  {
    say: "独立分支，保住那条失败的回归测试，改完跑相关测试。",
    caption: "保住失败的回归测试",
  },
  // step 15 — 交回三样
  {
    say: "然后把 diff、测试输出和没想清楚的风险一起交回来。",
    caption: "交回 diff 和测试输出",
  },
  // step 16 — Reviewer 不看摘要
  {
    say: "Reviewer 不看摘要。摘要不是验证，复述别人结论的 Agent 也不算。",
    caption: "Reviewer 不信 Agent 摘要",
  },
  // step 17 — 要看原始材料
  {
    say: "它要看原始 issue、复现证据、真实 diff、测试结果和边界情况。",
    caption: "看原始 issue 和真 diff",
  },
  // step 18 — 阻断项格式
  {
    say: "每个阻断问题都要给文件行号、理由、证据和改法。这些才是早上敢点头的理由。",
    caption: "阻断项要给行号和证据",
  },
  // step 19 — 还扣：Release 只收四件齐的活
  {
    say: "Release 只收四件齐的活：草稿 PR、检查通过、评审过、没有阻断项。",
    caption: "Release 只收齐的 PR",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "Triage 的动作是六步：读报告、定预期、复现、留证据、写测试、存证据。",
    caption: "Triage 六步取证",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "它不要你觉得它做完了，它要你看得见证据。",
    caption: "要看得见证据",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "同一条活只能派一次，编号对上才开工。",
    caption: "同一条活只派一次",
  },
];
