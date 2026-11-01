# Video Outline

> **主题**：`blueprint`（Checkpoint Plan 已选定）—— 工程蓝图：深海军蓝 + 绘图青 + IBM Plex Mono，2px 虚线角线与 60px 制图网格是签名；匹配「一套可以照着搭的系统」的图纸气质
> **总时长**：约 **23 分 42 秒**（1421.5s）；口播 214 拍，逐拍夹在 3–10s 后累加
> **章节数**：**12 章 / 214 拍**
> **语言**：中文通译口播；产品名 / 角色名 / 标签（Grok Bot、Cursor、Opus 5.5、Chief、Triage、Builder、Reviewer、Release、agent-ready、PR）保留英文原文
> **信息保留度**：原文 1,027 行 / 4,346 词；完整通译按 1.6–1.7 汉字/词 折算约 6,950–7,390 汉字；本稿正文 **4364 汉字** = 低口径 62.8% / 高口径 59.1%。压掉的是 14 段 prompt 的重复套话与逐条命令；事实项（12 个步骤、14 个 prompt 的关键约束、6 条会坏的事、7 条恢复路径、权限两张表、早报八字段）逐项对照后全部在位，见每章信息池。

> **埋扣**：你早上打开它，凭什么敢点合并 —— 第 4 拍抛出，第 214 拍总还扣
> **总还扣**：因为每一步都留了证据 —— 第 214 拍

---

## 1. coldopen — 凌晨三点的一条 issue（15 steps · ~102.5s）

**信息池**：
- 时间线：10 月 7 日马斯克宣布 Grok Bot 按任务挑后端，含 Claude Opus 5.5 —— 来源 article L29–L31
- 反例：建一个 Bot、丢一句需求、看它写 20 分钟代码 —— 来源 article L23
- 目标：午夜收 issue → 复现 → 委托 → 测试 → 评审 → 早上留一个 PR —— 来源 article L27
- 产出边界：不是合并的代码、不是上线，是带证据、可评审的活 —— 来源 article L45–L49
- 署名：Mori（@0xjmori），11 分钟阅读，2026-10-12 —— 来源 article L14–L15

> **张力线**：还扣「它自带持久环境，不是一个聊天框」@拍 11｜re-hook：凌晨那份草稿 PR 靠什么来｜interrupt@拍 12

**开发计划**：


- step 1 (~9s) — 黑底时间戳 03:00，一条 GitHub issue 卡片悬在空舞台
- step 2 (~6s) — 仓库面板：多出一条 fix 分支，旁挂草稿 PR 徽标
- step 3 (~6.5s) — 左右对比：聊天输入框 vs 一条流水线
- step 4 (~5.5s) — 居中大字问句，下方一枚变灰的合并按钮
- step 5 (~6s) — 单个 Bot 头像 + 输入框里一句「做个应用」
- step 6 (~7s) — 代码瀑布 + 20 分钟计时条
- step 7 (~6.5s) — 瀑布上盖一枚「自主 AI 工程师」标签
- step 8 (~7s) — 十月七日公告卡：日期 + 一行引文
- step 9 (~8.5s) — 后端名单列表，Claude Opus 5.5 高亮
- step 10 (~6s) — 箭头从「模型升级」拐向「流水线重搭」
- step 11 (~7.5s) — Grok Bot 侧栏四枚图标：电脑 / 浏览器 / 终端 / 例程
- step 12 (~7s) — 两半合拢：推理与持久环境拼成一支团队
- step 13 (~7s) — 三行产出说明：不是合并、不是上线、是能被评审的活
- step 14 (~6s) — 流程图上压一枚「可检查」印章
- step 15 (~7s) — 五个头像 + 一张手写规矩单

口播节选：
> 凌晨三点，一条打标的 GitHub issue 自己进来了。……问题只剩一个：你早上打开它，凭什么敢点合并？

---

## 2. routing — 模型路由：谁在选大脑（15 steps · ~105.0s）

**信息池**：
- 限制：用户不能按请求指定模型，平台没有 per-request picker —— 来源 article L39
- 引用：文档不保证某个特定后端服务每一次请求 —— 来源 article L91
- 原文架构图：YOU → GROK BOT → AI REASONING / EXECUTION → FINISHED WORK —— 来源 article L69–L89
- 免配置：不用单独 Claude 订阅，也不用贴 API key —— 来源 article L65
- 判断：模型负责推理，工作流负责让推理有用 —— 来源 article L97–L99

> **张力线**：还扣「模型是零件，流程是工厂」@拍 21｜re-hook：模型会换，那什么不会换｜interrupt@拍 28

**开发计划**：


- step 1 (~6s) — 标题「一个限制」+ 一枚被灰掉的模型选择器
- step 2 (~8s) — Grok Bot 横条做路由：请求进去，自动分发
- step 3 (~6.5s) — 请求级 picker 被划掉，只剩一行说明
- step 4 (~6.5s) — Opus 5.5 卡片，脚注写「不保证」
- step 5 (~6.5s) — 居中反问句：换个模型，系统还转吗
- step 6 (~7s) — 工厂图：模型是零件，流程是产线
- step 7 (~6s) — 架构图上半：YOU → GROK BOT
- step 8 (~6.5s) — 路由分叉：左推理、右执行
- step 9 (~6.5s) — 左列模型卡片堆，Opus 5.5 在最上
- step 10 (~6.5s) — 右列执行清单：云电脑 / 浏览器 / 终端 / 应用
- step 11 (~7s) — 订阅与 API key 两项被划掉
- step 12 (~10s) — 操作系统三层：接任务 → 读状态 → 认权限
- step 13 (~9.5s) — 一行结论：验收标准不跟着模型走
- step 14 (~6.5s) — 文档页脚注：只承诺路由
- step 15 (~6s) — 可替换的模型插槽

口播节选：
> 先把一个大多数人会忽略的限制说清楚：模型不是你点着选的。……模型负责推理，流程负责让推理有用。

---

## 3. computer — 同一台云端电脑（15 steps · ~107.0s）

**信息池**：
- 共享：同一台 persistent cloud computer，文件 / 浏览器会话 / 命令行凭证 —— 来源 article L107–L109
- 隔离：Cursor cloud agents 在各自的开发环境里跑 —— 来源 article L115
- 目录：`/workspace` 是文档写明的共享工作区 —— 来源 article L169
- 命令：`nproc` / `free -h` / `df -h /workspace` / `os-release` / `git --version` —— 来源 article L149–L167
- 警告：不要假设有 GPU 或固定内存 —— 来源 article L145

> **张力线**：还扣「协作是优点，抢文件是事故」@拍 35｜re-hook：五个 Bot 站在同一台机器上｜interrupt@拍 44

**开发计划**：


- step 1 (~5.5s) — 五个头像围着一台机器的缩略图
- step 2 (~6s) — 同一块桌面被五个窗口共享
- step 3 (~6s) — 三枚共享标签：文件 / 登录态 / 凭证
- step 4 (~6.5s) — 两栏对比：分屏 ≠ 分安全环境
- step 5 (~7.5s) — 两个 Bot 同时抓住同一份文件，冲突红叉
- step 6 (~8.5s) — 三台隔离环境，各自一条流水线
- step 7 (~7s) — 两层结构：主脑在电脑，重活在隔离环境
- step 8 (~6.5s) — GPU 与内存打上问号
- step 9 (~7.5s) — 命令行面板：核数 / 内存 / 磁盘
- step 10 (~8s) — 第二屏命令：系统版本 / Git 版本
- step 11 (~7s) — `/workspace` 目录树高亮
- step 12 (~10s) — 重建对比：workspace 文件留下，依赖丢
- step 13 (~7.5s) — 三台隔离环境与主脑之间的隔离墙
- step 14 (~7.5s) — 规格仪表盘：核数 / 内存 / 能塞多少并发
- step 15 (~6s) — 跨会话留下的文件

口播节选：
> 同一个账号底下，所有 Bot 用的是同一台云端电脑。……代码历史交给 Git，别交给你的记忆。

---

## 4. mission — 任务、证据与工作区（25 steps · ~165.0s）

**信息池**：
- 首流程：一条打了 `agent-ready` 标签的 issue → 一个草稿 PR —— 来源 article L181、L197–L199
- 六项证据：复现 / 失败测试 / 修复通过 / 改动清单 / 剩余风险 / 独立评审 —— 来源 article L199–L208
- 审批边界：永不合并、永不部署、不直接推主干 —— 来源 article L211–L213
- 五条 stop 条件 —— 来源 article L215–L220
- 目录：`/workspace/devdesk/{queue,issues,reviews,approved,logs}` —— 来源 article L238
- README 规矩六条（一个主人 / 当前状态 / 独立分支 / 证据落盘 / 不自动合并 / 升级模糊变更）—— 来源 article L240–L261
- 声明：这是自定约定，不是平台特殊格式 —— 来源 article L266

> **张力线**：还扣「文件比记忆可靠」@拍 69｜re-hook：第一个活该长什么样｜interrupt@拍 61

**开发计划**：


- step 1 (~9.5s) — 选择器：划掉「维护整仓」，只剩一条 issue
- step 2 (~8s) — 单线流程：issue → 复现 → 修复 → 草稿 PR
- step 3 (~6s) — 三枚禁令印章：不维护整仓 / 不部署 / 不无人值守
- step 4 (~6s) — 手动测试打钩，开关才解锁
- step 5 (~4.5s) — 终点线：小旗插在草稿 PR 上
- step 6 (~7.5s) — `agent-ready` 标签卡
- step 7 (~6.5s) — 草稿 PR 卡：标题 + diff 统计
- step 8 (~8.5s) — 六项证据清单逐项占位
- step 9 (~7s) — 边界三连：不合并 / 不部署 / 不推主干
- step 10 (~4.5s) — 五张 stop 卡片背面朝上
- step 11 (~8s) — 五条 stop 展开成列表
- step 12 (~6s) — 代价对比：编一个修复 vs 说复现不了
- step 13 (~7s) — 没有完成定义：绿勾底下是空心
- step 14 (~6s) — 有完成定义：文件夹里躺着证据
- step 15 (~5.5s) — 空工作区长出一棵目录树
- step 16 (~6s) — 五个目录胶囊：queue / issues / reviews / approved / logs
- step 17 (~6s) — README 文件浮层，六条规矩成行
- step 18 (~7s) — 一条 issue 一张卡，卡上钉一个 owner
- step 19 (~6.5s) — main 与 fix 两条分支线分开
- step 20 (~5s) — 合并与部署两枚封条
- step 21 (~7s) — 注脚：这是我们自己定的约定
- step 22 (~7s) — 每个 Bot 的固定路径：测试 / PR 链接 / 评审报告
- step 23 (~7.5s) — 上一轮对话灰掉，文件树还亮着
- step 24 (~6s) — 证据文件在树上发光
- step 25 (~6.5s) — 五个 Bot 认同同一个目录位置

口播节选：
> 证据要六样：复现、失败测试、测试通过、改动清单、剩余风险、独立评审。……模型可以忘掉上一轮对话，但不该猜测试结果存在哪。

---

## 5. roster — 一个 Chief 加四个专家（23 steps · ~159.0s）

**信息池**：
- 五角色表：Chief 结果 / Triage 复现分类 / Builder 修复与云 Agent / Reviewer 独立验证 / Release 交接 —— 来源 article L280–L287
- Chief 三条硬约束：不写生产代码、不以专家的话判定完成、不授权合并 —— 来源 article L293–L318
- Triage 六步：读报告 / 定预期 / 复现 / 留证据 / 写失败测试 / 存证据 —— 来源 article L328–L344
- Builder 七步 + 三禁止（不推主干 / 不合并 / 不部署）—— 来源 article L358–L372
- Reviewer 六项检查 + 阻断项四要素 —— 来源 article L384–L400
- Release 四条准入 + 六项交接 —— 来源 article L411–L427

> **张力线**：还扣「Release 只收四件齐的活」@拍 90｜re-hook：谁来对结果负责｜interrupt@拍 78

**开发计划**：


- step 1 (~6s) — 五个头像一字排开，各挂一枚职责标签
- step 2 (~6.5s) — Chief 卡：最终结果 + 调度
- step 3 (~7s) — Triage 卡：复现 + 分类
- step 4 (~8s) — Builder 卡，旁边牵出 Cursor 云 Agent
- step 5 (~6s) — Reviewer 卡：独立验证
- step 6 (~5.5s) — Release 卡：交接 + 汇报
- step 7 (~6.5s) — 收件箱里只剩 Chief 一个会话
- step 8 (~6s) — 看板：当前 issue + 下一步归属
- step 9 (~5.5s) — 三栏：产物 / 阻塞 / 缺证据
- step 10 (~7.5s) — Chief 角色卡，划掉「自己写生产代码」
- step 11 (~6.5s) — 两个对勾对比：专家说完成 ≠ 状态完成
- step 12 (~7.5s) — Triage 四件套：预期 / 实际 / 日志 / 截图
- step 13 (~6s) — 失败测试代码块 + 一行「不许猜原因」
- step 14 (~7.5s) — Builder 的最小修复：一行 diff 高亮
- step 15 (~6.5s) — 三格：独立分支 / 回归测试 / 测试通过
- step 16 (~6.5s) — 回执三样：diff / 测试输出 / 风险
- step 17 (~9s) — 摘要被划掉，评审产物浮上来
- step 18 (~8.5s) — Reviewer 六项检查列表
- step 19 (~9s) — 阻断项卡：文件 + 行号 + 证据 + 改法
- step 20 (~9s) — Release 四件套准入清单
- step 21 (~9s) — Triage 六步取证流程条
- step 22 (~5s) — 证据文件夹压过一句「做完了」
- step 23 (~4.5s) — 派活看板：一条活只有一个编号

口播节选：
> 现在建人。五个 Bot，但绝不是五个干一样活的 Bot。……Release 只收四件齐的活。

---

## 6. states — 让流程变成状态机（15 steps · ~100.5s）

**信息池**：
- 十个状态：NEW / TRIAGED / REPRODUCED / BUILDING / TESTED / REVIEWING / FAILED / REVIEW_PASSED / DRAFT_PR_READY / BLOCKED —— 来源 article L497–L507
- 归属：Triage 前段、Builder 中段、Reviewer 评审段、Release 收尾、Chief 协调 —— 来源 article L509–L514
- issue 文件夹六件套：task / status / evidence / implementation / review / handoff —— 来源 article L486–L495
- 状态机 ASCII：REVIEWING --FAILED--> BUILDING —— 来源 article L448–L476
- 声明：规则不等于强制，重要跳转要有脚本或审批兜底 —— 来源 article L528

> **张力线**：还扣「状态记录才是唯一真相」@拍 95｜re-hook：一条 issue 的一生怎么记｜interrupt@拍 94

**开发计划**：


- step 1 (~6.5s) — 群聊气泡散开、变灰
- step 2 (~7s) — issue 记录卡成为唯一亮点
- step 3 (~7s) — 状态条开始点亮，一格一个产物
- step 4 (~6.5s) — 六个状态胶囊依次亮到 REVIEWING
- step 5 (~6s) — FAILED 回退箭头指向 BUILDING
- step 6 (~6.5s) — DRAFT_PR_READY → HUMAN_APPROVAL 的终点门
- step 7 (~6s) — STATES.md 文件立在台面
- step 8 (~9.5s) — `issues/<id>/` 文件夹六件套
- step 9 (~8.5s) — 归属色带：Triage 前段 / Builder 中段
- step 10 (~8s) — 归属色带补完：Reviewer / Release
- step 11 (~6.5s) — 证据缺失时状态条断成两截
- step 12 (~7.5s) — 分支保护锁 + 脚本齿轮夹住状态机
- step 13 (~5.5s) — 十个状态网格，每格标一个归属
- step 14 (~5.5s) — 产物留痕：每格一个文件
- step 15 (~4s) — 卡住的记录也留档

口播节选：
> 群聊适合商量，但它不该当真相。……这些只是工作流规则，不是保证。

---

## 7. delegate — 把编码外包到隔离环境（14 steps · ~95.0s）

**信息池**：
- 委托契约（prompt 10）：新分支 / 保住回归测试 / 只改定义范围 / 跑相关测试 / 记录改动文件 / 准备草稿 PR —— 来源 article L550–L579
- 环境前置：先把仓库接上，配好依赖、测试、需要的服务 —— 来源 article L538
- 边界：云端 Agent 拿不到主脑电脑的文件与凭证 —— 来源 article L540
- 并行告诫：只并行独立任务，三个 Agent 改同一函数是协调问题 —— 来源 article L581–L585
- 兜底：委派不可用时，报告缺哪个集成，不要编造一次成功委派 —— 来源 article L559–L560

> **张力线**：还扣「并行只给独立的活」@拍 119｜re-hook：编码怎么外包出去｜interrupt@拍 109

**开发计划**：


- step 1 (~6.5s) — 编码任务从主脑推出，越过一道隔离线
- step 2 (~5.5s) — Grok Bot 调度台，任务卡排队
- step 3 (~8s) — 三台隔离环境各接一个任务
- step 4 (~7s) — 仓库接入 + 依赖 / 测试 / 服务三枚勾，接不上标红
- step 5 (~6.5s) — 隔离墙挡住文件与凭证
- step 6 (~7.5s) — Triage 的复现证据卡递往 Builder
- step 7 (~5.5s) — 移交箭头：复现已完成
- step 8 (~6.5s) — 契约三行：分支 / 回归测试 / 范围
- step 9 (~8s) — 回执卡：分支 / PR / 测试 / 改动文件 / 风险
- step 10 (~7.5s) — 一条 issue 旁的多个 agent 卡被划掉
- step 11 (~7s) — 两条互不相交的泳道并排跑
- step 12 (~6.5s) — 三个 agent 撞在同一个函数上
- step 13 (~7.5s) — 环境对齐检查：仓库文档 vs 云端环境
- step 14 (~5.5s) — 依赖报错面板

口播节选：
> 接下来是这套架构里最好玩的一段：把编码外包到隔离环境去跑。……三个 Agent 抢同一个函数，那不叫产能，那叫互相踩。

---

## 8. review — 给评审者证据（16 steps · ~101.5s）

**信息池**：
- 弱配置原文：`Fixed. Tests pass.` 然后直接收工 —— 来源 article L593–L597
- 评审六问（prompt 11）—— 来源 article L605–L638
- 三种结论：PASS / FAIL / BLOCKED —— 来源 article L625–L635
- 判据：评审员应试着找理由拒绝，不是复述摘要 —— 来源 article L640
- 限制：通过的测试不是绝对证明，难改动仍要人看 —— 来源 article L646

> **张力线**：还扣「摘要不是验证」@拍 135｜re-hook：活干完了之后呢｜interrupt@拍 126

**开发计划**：


- step 1 (~6s) — 一句「修好了、测试过了」+ 一扇评审门
- step 2 (~8s) — 弱配置屏：一句「修好了，测试过了」
- step 3 (~6s) — 覆盖检查栏是空的
- step 4 (~6s) — 二次配置屏：独立评审产物文件落下
- step 5 (~7.5s) — 阅读顺序图：先 issue，再 diff
- step 6 (~7.5s) — 六问序号 01 出现
- step 7 (~8s) — 六问之 1 与 2
- step 8 (~5.5s) — 六问之 3 与 4
- step 9 (~5.5s) — 六问之 5：结论要有执行日志
- step 10 (~4.5s) — 六问之 6：安全与兼容风险
- step 11 (~5s) — 三枚结论章：PASS / FAIL / BLOCKED
- step 12 (~7s) — FAIL 卡：文件 + 行号 + 可复现证据
- step 13 (~6.5s) — 评审员站在「拒绝」一侧
- step 14 (~5.5s) — 评审员不动代码，只交判断
- step 15 (~7s) — review.md 落盘，状态才推进
- step 16 (~6s) — 评审员与作者分坐两侧

口播节选：
> 强一点的配置，要求一份独立的评审产物，还得能查。……评审员的动作应该是努力拒掉它。

---

## 9. permissions — 权限写在提示词外面（18 steps · ~108.0s）

**信息池**：
- 自动清单八项：读代码 / 看 issue / 写复现报告 / 跑测试 / 改工作分支 / 准备草稿 PR / 写评审 / 更新状态 —— 来源 article L661–L668
- 批准清单：合并 / 部署 / 改线上库 / 轮换密钥 / 计费或登录 / 删数据 / 改仓库权限 —— 来源 article L670–L678
- 工程兜底：写进自动评审设置、分支保护、CI、云端 Agent 控制 —— 来源 article L681
- 判据：受保护分支比一句「不许合并」更硬 —— 来源 article L683
- 凭证：同一用户的 Bot 共享凭证，改名不隔离 —— 来源 article L685
- 交接：登录与 2FA 走安全交接，别贴进聊天 —— 来源 article L687

> **张力线**：还扣「受保护分支比提示词更硬」@拍 148｜re-hook：更强模型要不要更多权限｜interrupt@拍 144

**开发计划**：


- step 1 (~5s) — 刻度尺：更强推理 ≠ 更大权限
- step 2 (~7s) — 模型脚印越过边界线
- step 3 (~6s) — 绿区：可逆动作
- step 4 (~7s) — 自动清单前五项
- step 5 (~6.5s) — 自动清单后三项
- step 6 (~5s) — 红区门槛：需要批准
- step 7 (~4.5s) — 批准清单前四项
- step 8 (~6.5s) — 批准清单后四项
- step 9 (~7s) — 平台设置四枚开关
- step 10 (~6.5s) — 受保护分支上一把锁
- step 11 (~6.5s) — 一个钥匙串挂在五个 Bot 上
- step 12 (~5.5s) — 自动化准备，责任不外包
- step 13 (~6s) — 三层隔离：环境 / 仓库 / 集成
- step 14 (~7s) — 提示词与平台设置双写
- step 15 (~6s) — 2FA 走安全交接卡
- step 16 (~5.5s) — 需要人点头的清单被加粗
- step 17 (~6s) — 不可逆动作的门
- step 18 (~4.5s) — 提示词 vs 设置：谁更硬

口播节选：
> 模型更会推理，不代表它该拿到更多权限。……你要自动化的是准备，不是把责任也一起交出去。

---

## 10. skill-night — 存成技能，再开夜班（18 steps · ~122.5s）

**信息池**：
- 技能五段（prompt 12）：WHEN TO USE / INPUT / PROCESS 八步 / LIMITS / OUTPUT —— 来源 article L711–L752
- 判据：技能是方法，不是时间表 —— 来源 article L754
- 验证：先在另一条无害 issue 上跑一遍 —— 来源 article L758
- 例程（prompt 13）：23:00 / GitHub 事件 / 最多两条 / 停止条件六条 —— 来源 article L774–L814
- 事实：测试例程会真跑工具、真改文件 —— 来源 article L818
- 限制：定时任务不是无限连续进程 —— 来源 article L820

> **张力线**：还扣「技能是方法，不是排班」@拍 163｜re-hook：夜班之前还缺什么｜interrupt@拍 162

**开发计划**：


- step 1 (~5.5s) — 跑通过一次的顺序链 + 被划掉的「从零重写」
- step 2 (~7s) — 「别每条重写」斜线划过流程
- step 3 (~4.5s) — 一枚 `resolve-bug` 技能文件
- step 4 (~9s) — 技能五段结构折页
- step 5 (~5s) — 八步流程条
- step 6 (~7s) — 限制条款：不合并 / 不部署 / 两轮返修
- step 7 (~7.5s) — 三种触发方式：手动 / 事件 / 定时
- step 8 (~6s) — 第二遍实跑，一条无害 issue
- step 9 (~7s) — 同一个错 → 加一道机械检查
- step 10 (~5.5s) — 夜班例程卡：23:00
- step 11 (~5.5s) — 触发器收窄到一条标签
- step 12 (~8s) — 标签 + 上限两条
- step 13 (~10s) — 停止条件六枚
- step 14 (~9.5s) — 早晨报告卡
- step 15 (~7s) — 定时器被中断，状态仍在
- step 16 (~6.5s) — 测试例程也会真改文件
- step 17 (~6s) — 已在跑的 issue 卡片被跳过
- step 18 (~6s) — 中断后恢复点标记

口播节选：
> 技能是方法，不是时间表。……定时任务不是永动机。

---

## 11. recovery — 失败要能看清也能接手（19 steps · ~111.5s）

**信息池**：
- 七条恢复路径：超时 / 缺依赖 / 测试失败 / 评审失败 / 同错两次 / 缺权限 / 复现不了 —— 来源 article L838–L864
- 判据：同错两次就停并升级 —— 来源 article L855
- 早报（prompt 14）八字段：issue / owner / status / artifact / verification / review / next action / approval —— 来源 article L868–L910
- 要求：完成与尝试分开列 —— 来源 article L866
- 报告结尾：附一条对流程的改进建议 —— 来源 article L909
- 限制：通过的测试不是绝对证据 —— 来源 article L646

> **张力线**：还扣「失败得能看清、能接手」@拍 176｜re-hook：失败到底长什么样｜interrupt@拍 179

**开发计划**：


- step 1 (~7s) — Agent 头像打上裂纹
- step 2 (~5.5s) — 失败可读：日志 + 状态两栏
- step 3 (~5s) — 复现成功 → 修复 → 测试红
- step 4 (~5s) — 第二次改，同一测试还是红
- step 5 (~5s) — 额度计时器烧到天亮
- step 6 (~5s) — 七条恢复路径标题列
- step 7 (~6.5s) — TOOL TIMEOUT 分支
- step 8 (~5.5s) — MISSING DEPENDENCY 分支
- step 9 (~5.5s) — TEST FAILURE：改实现不改结果
- step 10 (~6.5s) — REVIEW FAILURE：退回一轮
- step 11 (~5.5s) — SAME FAILURE TWICE：停
- step 12 (~5s) — MISSING PERMISSION：申请或报卡住
- step 13 (~5.5s) — UNREPRODUCIBLE：交报告不编修复
- step 14 (~7.5s) — 通过的测试 ≠ 绝对证据
- step 15 (~10s) — 早报八字段表 + 一条流程改进建议
- step 16 (~6s) — 完成 / 尝试两栏分开
- step 17 (~4s) — 失败记录文件与解释气泡对比
- step 18 (~6s) — 早晨只需点一次「批」
- step 19 (~5.5s) — 没做的那一步写清楚

口播节选：
> 最有价值的 Agent，不是从不失败的那种，那种不存在。……做完的活和尝试过的活分开写。

---

## 12. ladder — 先跑一条 bug，再谈夜班（21 steps · ~144.0s）

**信息池**：
- 六条会坏的事：模型换 / 抢同一 issue / 电脑重建 / 评审循环 / 用量 / 敏感数据 —— 来源 article L918–L934
- 启用阶梯：一个安全 bug → 一次交接 → 一次独立评审 → 一个技能 → 夜班 —— 来源 article L936–L946
- 第一次运行 prompt：只跑一条 issue，不建云 Agent、不动生产、不开例程 —— 来源 article L954–L979
- 真正转变：价值不是五个 Bot 在跑，是你可以不看着 —— 来源 article L993–L1005
- 例外：某一步若要保证 Opus 5.5，得单独配 Claude API 或 Claude Code —— 来源 article L920–L923
- 成本：按套餐用量计费，额度用完即停；Cursor 按 token 计费，与底层模型无关 —— 来源 article L926–L932
- 引用：最强团队让你对「发生了什么」最不意外 —— 来源 article L1007

> **张力线**：还扣「先跑一条安全的 bug」@拍 202｜re-hook：这套东西会怎么坏｜interrupt@拍 197

**开发计划**：


- step 1 (~6s) — 六条故障标签排成一行
- step 2 (~6.5s) — 模型切换：任务合同不跟着动
- step 3 (~8s) — 两个 Bot 抢 issue，编号上锁
- step 4 (~10s) — 电脑重建：workspace 留着，依赖丢了
- step 5 (~6.5s) — 评审循环计数器封顶
- step 6 (~6.5s) — 成本按跑通的流程折算
- step 7 (~7s) — 敏感数据跨过边界
- step 8 (~6s) — 一排开关，只开第一枚
- step 9 (~3s) — 一枚「安全 bug」卡
- step 10 (~6s) — 一次成功交接 + 一次被评审的修复
- step 11 (~4s) — 技能 → 夜班，顺序箭头
- step 12 (~9s) — 今天：建 Chief + 一段话
- step 13 (~8.5s) — 第一条 issue 干净走到草稿 PR
- step 14 (~6s) — 三个开关保持关闭
- step 15 (~4s) — 第一周只跑一条
- step 16 (~4s) — 额度表：用完即停
- step 17 (~10s) — Opus 5.5 单配 Claude API 或 Code 的注脚
- step 18 (~8s) — Cursor 计费口径：token 不变
- step 19 (~7s) — 不再盯着屏幕
- step 20 (~8s) — 你定边界，团队干可逆的活
- step 21 (~10s) — 合并按钮 + 一条证据链

口播节选：
> 还有几件事一定会坏，提前知道比事后补便宜。……所以早上八点，你凭什么敢点合并？因为每一步都留了证据。

---

## 素材清单

### 全片通用
- ✓ 原文 `article.md`（1,027 行）—— 信息池与画面细节的唯一抽取源
- ✓ 主题 `blueprint` 的 `tokens.css` —— 颜色 / 字体 / 角线性格全部走 token
- ⚠️ 原文 12 张配图（`pbs.twimg.com` 链接，未落盘）—— 实现时用 CSS / SVG 重画架构图与状态机，不直接引用外链
- ⚠️ Grok Bot / Cursor / Claude 品牌字标 —— 只用纯文字字标，不使用 logo 图形

### 1. coldopen
- ✓ 时间戳 03:00、issue 卡、草稿 PR 徽标 —— 纯 CSS 绘制
- ⚠️ 十月七日公告截图 —— 用日期 + 引文卡代替（原文图 L31）

### 2. routing
- ✓ 路由分叉图 / 工厂图 —— SVG 绘制
- ⚠️ 原文架构 ASCII 图（L69–L89）—— 转成三栏分叉图，保留 YOU / GROK BOT / FINISHED WORK 三级

### 3. computer
- ✓ 命令行面板 —— 等宽字排版，命令来自 article L149–L167
- ✓ 三台隔离环境图 —— SVG

### 4. mission
- ✓ `agent-ready` 标签、六项证据清单、devdesk 目录树 —— 纯 HTML/CSS
- ⚠️ 五条 stop 条件全文 —— 画面只放关键词，完整句子由口播承担

### 5. roster
- ✓ 五个角色卡 + 职责标签 —— 列表逐个揭示
- ⚠️ 五段角色 prompt —— 画面只取每段最关键的一句

### 6. states
- ✓ 十状态状态机 —— SVG 节点 + 连线
- ✓ `issues/<id>/` 六件套 —— 文件树组件

### 7. delegate
- ✓ 隔离墙 / 三条泳道 —— SVG
- ⚠️ Cursor 控制台截图（不可用）—— 用回执卡抽象

### 8. review
- ✓ 六问清单、三枚结论章 —— HTML/CSS
- ✓ FAIL 卡（文件 + 行号 + 证据）—— 代码块样式

### 9. permissions
- ✓ 两张权限表 —— 双栏清单，逐项揭示
- ✓ 受保护分支锁、钥匙串 —— CSS 图形

### 10. skill-night
- ✓ 技能五段折页、八步流程条 —— HTML/CSS
- ✓ 二十三点例程卡、六条停止条件 —— 卡片组件

### 11. recovery
- ✓ 七条恢复路径分支图 —— SVG 树
- ✓ 早报八字段表 —— 表格组件

### 12. ladder
- ✓ 六条故障标签、启用阶梯 —— 横向阶梯图
- ✓ 首次运行三条禁令、额度表 —— 卡片组件
- ✓ 证据链 + 合并按钮 —— 收尾画面
