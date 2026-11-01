import type { Narration } from "../../registry/types";

/**
 * 第 3 章 · 那台共享的云端电脑（15 拍）。
 *
 * 原文 §2：所有 Bot 共用同一台机器与同一套凭证，Cursor 云 Agent 反而是
 * 隔离环境；先摸底再设计重活。`say` 与 script.md 第 31–45 块一致。
 * 张力：还扣「协作是优点，抢文件是事故」@35｜re-hook@31｜interrupt@44。
 */
export const narrations: Narration[] = [
  // step 0 — 重挂钩：先看清共用的是什么
  {
    say: "建五个机器人之前，先看清它们到底共用什么。",
    caption: "先看清它们共用什么",
  },
  // step 1 — 一台机器 + 五个窗口
  {
    say: "同一个账号底下，所有 Bot 用的是同一台云端电脑。",
    caption: "所有 Bot 用同一台电脑",
  },
  // step 2 — 三样共享：文件 / 登录态 / 凭证
  {
    say: "文件、浏览器登录态、命令行凭证，三样全是共享的。",
    caption: "文件、登录态、凭证共享",
  },
  // step 3 — 分屏 ≠ 分环境
  {
    say: "它们能开不同的屏幕、分开聊天，但不是分开的安全环境。",
    caption: "不是不同的安全环境",
  },
  // step 4 — 中断：还扣（协作优点 / 抢文件事故）
  {
    say: "协作的时候这是优点，两个人抢同一份文件的时候，这就是事故。",
    caption: "抢同一份文件就是事故",
  },
  // step 5 — Cursor 云 Agent 是另一条路
  {
    say: "Cursor 的云端 Agent 不一样，它们在各自的开发环境里跑代码。",
    caption: "Cursor 的 Agent 各自跑",
  },
  // step 6 — 两层结构：主脑 / 隔离环境
  {
    say: "所以这套团队两边都用：调度在主电脑，重活丢进隔离环境。",
    caption: "主脑在电脑，重活在隔离",
  },
  // step 7 — 别假设硬件
  {
    say: "别假设那台电脑有 GPU，也别猜它内存多大，先看再说。",
    caption: "别假设有 GPU，也别猜内存",
  },
  // step 8 — 摸底命令面板
  {
    say: "让它自己报家底：几个核、多少内存、磁盘、系统、Git 版本。",
    caption: "核数、内存、磁盘、Git",
  },
  // step 9 — /workspace 约定
  {
    say: "重要文件放 workspace，那是官方文档里写明的共享工作区。",
    caption: "项目文件放 workspace",
  },
  // step 10 — 外部备份 + Git 历史
  {
    say: "再留一份外部备份。代码历史交给 Git，别交给你的记忆。",
    caption: "备份在外面，历史进 Git",
  },
  // step n — 收束：补一个article里的事实，别让这一章停在半空
  {
    say: "常规重建里，workspace 的文件会留；装好的依赖会丢，最近的改动也可能没了。",
    caption: "workspace 会留，依赖会丢",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "Cursor 的云端 Agent 能接独立的活，不用抢同一个目录。",
    caption: "Cursor Agent 接独立活",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "这台机器的规格决定你能塞多少并发，别拿文档里的示例当配置。",
    caption: "规格决定能塞多少并发",
  },
  // step n — 收束：把article里的细节补成拍，别让节奏断掉
  {
    say: "云端电脑的文件会跨会话留下，所以别人的东西也在。",
    caption: "文件会跨会话留下",
  },
];
