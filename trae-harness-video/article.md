# trae-harness

多 Agent 协作框架 × 11 轮 A/B 实验

一个需求丢给 AI。

它写代码。也产生幻觉、跳过测试、自由发挥。

所以我们做了一个框架。

不确定每个 Agent 的边界，就一定有幻觉的模糊空间。

怎么做到的？

步骤隔离。每个子 Agent 只做当前步。不知道下一步。

信息瓶颈。模块间只传 200 token。上下文不到 400 token。

全程 3 子 Agent 并行。辩论 + 审核 + 开发。

铁面编排器。每个 Gate 不通过就别想往前走。

说完架构，看效果。

同一个模型。DeepSeek V4 Pro。

11 轮 A/B 实验。有没有 Harness，差距有多大？

代码正确性。90% 拉到 100%。

测试断言密度。28 条变 124 条。四倍。

覆盖率。62% 干到 85%。

代码规范违规砍掉六成。

安全防御覆盖翻了三倍。

同类 bug 复发率降了 91.7%。

性能加速 4.6 倍。

SWE-bench 回归。从两个 bug 干到零。

不光是质量。

花两万 token 跑流程。净省十万。

ROI 529%。

复杂度越高回报越大。L3 级任务 ROI 能超一千。

而且不只做代码。

v2.0。项目类型自适应。

视频项目自动上 VISUAL_GATE。设计项目走视觉验收。

8 个模板。11 个 Agent 角色。按需加载。

独立验收引擎 trae-acceptance。浏览器自动化 + 视觉 + 双轨复盘。

trae-harness。

用确定性对抗模糊。用规则防幻觉。

用 11 轮实验数据。量化给你看。

github.com/zzzkeepdd/trae-harness
github.com/zzzkeepdd/trae-harness-experiments
