# Video Outline

> **主题**：`bold-signal`（Checkpoint Plan 待选定）—— 暗底 + 焦点橙 + 大字数据冲击，适合技术产品发布与实验数据展示
> **总时长**：约 2 分 10 秒（口播 ~520 字 ÷ 4 字/秒）
> **章节数**：4 章 / 22 步

---

## 1. coldopen — 问题引入（5 steps · ~28s）

**信息池**：
- 产品名：trae-harness —— 多 Agent 协作框架
- 核心痛点：AI 写代码时产生幻觉、跳过测试、自由发挥
- 根因：Agent 边界不确定 → 幻觉模糊空间
- 来源：article 全段

**开发计划**：

- step 1 (~4s) — hero 大标题卡：「你把需求丢给 AI」
- step 2 (~5s) — 三行问题清单：幻觉 / 跳过测试 / 自由发挥
- step 3 (~6s) — 品牌名登场：trae-harness
- step 4 (~7s) — 根因诊断：「边界不确定 = 幻觉空间」
- step 5 (~6s) — 过渡钩子：「它怎么解决的？」

口播节选：
> 你把需求丢给 AI，它写代码。也产生幻觉。跳过测试。自由发挥。所以有人做了一个框架，叫 trae-harness。不确定每个 Agent 的边界，就一定有幻觉的模糊空间。

---

## 2. architecture — 四大核心机制（6 steps · ~35s）

**信息池**：
- 步骤隔离：子 Agent 只做当前步，不知道下一步
- 信息瓶颈：模块间只传 200 token，上下文 < 400 token
- 3 子 Agent 并行：辩论 + 审核 + 开发
- 铁面编排器：Gate 不通过不前进
- 来源：article 中段「怎么做到的？」段落

**开发计划**：

- step 6 (~6s) — 章节标题：「四个核心机制」+ 第一机制卡片入场
- step 7 (~7s) — 步骤隔离图解：单步 Agent 盒子，箭头阻断
- step 8 (~6s) — 信息瓶颈可视化：200 token / 400 token 双数字对比
- step 9 (~7s) — 三 Agent 并行架构图：辩论 / 审核 / 开发三列
- step 10 (~5s) — 铁面编排器：Gate 图标 + 红绿灯状态
- step 11 (~4s) — 过渡钩子：「说完架构，看效果」

口播节选：
> 它怎么解决的？四个字：步骤隔离。每个子 Agent 只做当前步。不知道下一步是什么。还有信息瓶颈。模块间只传 200 token。上下文不到 400 token。全程三个子 Agent 并行跑。铁面编排器坐镇中间——Gate 不通过，别想往前走一步。

---

## 3. results — 11 轮 A/B 实验数据（8 steps · ~55s）

**信息池**：
- 模型：DeepSeek V4 Pro
- 实验轮次：11 轮 A/B
- 代码正确率：90% → **100%**
- 测试断言密度：28 → **124 条**（4x）
- 覆盖率：62% → **85%**
- 代码规范违规：砍掉 **60%**
- 安全防御覆盖：翻 **3x**
- 同类 bug 复发率：降 **91.7%**
- 性能加速：**4.6x**
- SWE-bench 回归：2 bugs → **0**
- Token 成本：花 2 万省 10 万，ROI **529%**
- L3 级任务 ROI 超 **1000%**
- 来源：article 「看效果」数据段

**开发计划**：

- step 12 (~4s) — 实验背景卡：DeepSeek V4 Pro / 11 轮 A/B
- step 13 (~6s) — 数据仪表盘第一行：正确率 90→100%（满分徽章）
- step 14 (~6s) — 第二行：测试断言 28→124（4x 放大动画）
- step 15 (~6s) — 第三行：覆盖率 62→85% + 规范违规 -60%
- step 16 (~7s) — 第四行：安全 3x + bug 复发 -91.7% + 性能 4.6x
- step 17 (~6s) — SWE-bench：2→0（归零动画）
- step 18 (~7s) — ROI 卡片：2万→10万 / 529% / L3超1000%
- step 19 (~9s) — 金句定格：「复杂度越高回报越大」+ GitHub 链接

口播节选：
> 架构说完，看效果。同一个模型，DeepSeek V4 Pro。11 轮 A/B 实验。代码正确率从 90% 拉到 100%。测试断言密度 28 条变 124 条，翻了四倍。覆盖率 62% 干到 85%。安全防御翻了三倍。同类 bug 复发率降了 91.7%。性能加速 4.6 倍。SWE-bench 从两个 bug 干到零。花两万 token 跑流程，净省十万。ROI 529%。复杂度越高回报越大。

---

## 4. v2-and-cta — v2.0 能力 + 行动召唤（3 steps · ~22s）

**信息池**：
- v2.0 特性：项目类型自适应
- VISUAL_GATE：视频项目自动上视觉验收门
- 视觉验收：设计项目走视觉检查
- 8 个模板 / 11 个 Agent 角色 / 按需加载
- trae-acceptance：浏览器自动化 + 视觉 + 双轨复盘
- GitHub：github.com/zzzkeepdd/trae-harness
- GitHub Experiments：github.com/zzzkeepdd/trae-harness-experiments
- Slogan：用确定性对抗模糊 / 用规则防幻觉 / 用数据量化
- 来源：article 末段

**开发计划**：

- step 20 (~8s) — v2.0 特性展开：自适应 / 8模板 / 11角色 / acceptance 引擎
- step 21 (~8s) — 品牌 slogan 三行逐字显现 + 两 GitHub 链接
- step 22 (~6s) — 终屏 CTA：GitHub 二维码 / Star 提示 / END

口播节选：
> v2.0 不止做代码。项目类型自适应。视频上 VISUAL_GATE，设计走视觉验收。8 个模板，11 个 Agent 角色。独立验收引擎 trae-acceptance，三层保险。trae-harness。用确定性对抗模糊。用规则防幻觉。用 11 轮实验数据量化给你看。GitHub 搜 zzzkeepdd slash trae-harness。

---

## 素材清单

### 1. coldopen
- ⚠️ Hero 背景纹理（暗色科技感）
- ⚠️ trae-harness logo / wordmark

### 2. architecture
- ⚠️ Agent 架构图素材（三列并行示意）
- ⚠️ Gate / 编排器图标

### 3. results
- ✓ 所有数字数据（内嵌文本渲染，无需外部图片）
- ⚠️ 数据增长动画素材（可选：柱状图 / 计数器）

### 4. v2-and-cta
- ⚠️ GitHub QR Code（两个仓库）
- ✓ Slogan 文本（内嵌渲染）

## 自检

- [x] 每个 step 都是单一句屏幕内容描述，无动画/手段/时长行
- [x] 无具体毫秒/秒数（除 `(~Ts)` 口播估时）
- [x] 每章首段都有信息池 block，≥3 条 article 抽取项，带来源标注
- [x] step `(~Ts)` 累加 ≈ 130s（顶部声明 ~130s，误差合理）
- [x] 章节切分符合 3~8 步 / 30~60s 一聚焦主题
- [x] 末尾素材清单分章节列出，✓/⚠️ 标注清楚
