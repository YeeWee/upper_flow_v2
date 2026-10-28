# 叙事张力基线（2026-10-28）

夹具：`examples/trae-harness`（article.md → 4 章 / 22 拍 → Kokoro 音频 → 成片）

- 改前：`a5b2081`（旧夹具，成片 `127.533s`，节拍累计 `127.525s`）
- 改后：`9842829`（测量时 `spec-13-tension-layer` tip；夹具内容与 `0537b1f` 相同，成片 `133.633s`，节拍累计 `133.625s`）
- 旧基线：`docs/evals/2026-10-26-baseline.md`（**未修改**；带日期的快照，价值在不被后来的结论污染）

评分维度固定 5 项，就是五个已实现的张力检查 id，各 1 分，满分 5 分。每项给一条可复核证据，具体到拍号与间隔。

## 结论

- 夹具：改前 **2/5** → 改后 **5/5**。
- 改前通过的两维：`interrupt-spacing`、`rhythm-uniformity`。失败的三个：`chapter-rehook-missing`、`recall-gap`、`numeric-run`。
- 改后 `avp check --json`：0 error / 0 条张力 warning；2 条 `rhythm-uniformity` report（architecture `0.220`、results `0.097`）。按 spec 的 report 语义，这一维记**带注记通过**，所以是 5/5；若把“出现 report”也当缺陷，则这一维记 fail、总分 4/5（见「局限」）。
- 长视频（#23，`>10 分钟` 档）：张力专项 **0 error / 0 warning / 12 report**，0 个新增非张力 error；全量 check 仍有 205 个**改前已存在**的 `hook-missing`（与张力无关）。

## 评分口径

- `chapter-rehook-missing` / `recall-gap` / `interrupt-spacing` / `numeric-run` 是 warning 级：0 条 = 通过，有 1 条及以上 = 失败。
- `rhythm-uniformity` 是 report 级：章内句长 CV < 0.25 只报、不拦。spec 的原话是“刻意的均匀是手法，但必须先被看见”。因此 report 不构成失败；本基线把它记为“带注记通过”，并保留注记内容。
- 改前没有张力计划。把新 check 直接跑在 `a5b2081` 上会得到 **0 条张力结论**（旧 `outline.md` 没有埋扣 / 总还扣 / 张力线，`checkTension` 直接跳过）——那是“没测”，不是“通过”。所以改前列按同一套判据手工核验 `beats.json`，并把拍号与秒数写进证据。

## 五维 rubric 与改前 / 改后

| 维度 | 判据 | 改前（a5b2081） | 改后（9842829） | 改前 | 改后 |
|---|---|---|---|---|---|
| `chapter-rehook-missing` | 每章首拍挂回埋扣或抛本章新问题；check 0 warning | 0/4：4 个章首全是陈述 / 过场，旧 outline 无张力线 | 4/4：outline 逐章声明 re-hook；check 0 warning | fail | pass |
| `recall-gap` | 埋扣后每 ≤5 分钟一次 recall；超限 warning | 无埋扣、0 个 recall 点 | 第 2 拍埋扣；第 4/11/19/22 拍 recall；最大间隔 46.3s | fail | pass |
| `interrupt-spacing` | 相邻 interrupt ≤120s；超限 warning | 无声明；4 个可观察形态突变，最大间隔 35.1s | 4 个声明点（5/8/17/22），最大间隔 52.8s；0 warning | pass | pass |
| `numeric-run` | 连续数字拍 ≤2；章内数字拍占比 ≤40%；超限 warning | results 8/8 数字拍，连续 8 拍，占比 100% | results 3/8，连续 2 拍，占比 37.5%；0 warning | fail | pass |
| `rhythm-uniformity` | 章内句长 CV <0.25 只 report；report 不是失败 | 全片 CV 0.513；旧管线 0 条 report（无计划，跳过） | 全片 CV 0.410；2 条 report（architecture 0.220、results 0.097） | pass（未被拦） | pass（带注记） |

**改前 2/5，改后 5/5。**

### 逐维证据

**`chapter-rehook-missing`** — 改前 4 个章首：coldopen-1「你把需求丢给 AI，它写代码。」、architecture-1「先说步骤隔离。每个子 Agent 只做当前步，不知道下一步。」、results-1「同一个模型，DeepSeek V4 Pro。11 轮 A、B 对照实验。」、v2-and-cta-1「而且 v2.0 不只做代码。……」。4/4 是陈述句 / 过场句，0/4 是问句；旧 outline 也没有张力线。改后 outline 4 章各 1 条 `re-hook`，check 0 warning；首拍分别是冷开场问句钩子、architecture-1「模型没换，换的是它每一步能看到什么」、results-1「同一个模型，只换流程」、v2-and-cta-1「这套规则不只管代码」。**注意：字面问句只有 1/4（coldopen-1）**；re-hook 可以是陈述句式的翻题，不要求问号。check 只验声明与拍号，首拍文本是人工核对的。

**`recall-gap`** — 改前旧 outline 无埋扣、无总还扣，全片 0 个 recall 点；coldopen-5「它怎么做到的？」在下一章立刻被回答，不算贯穿埋扣。改后埋扣在第 2 拍（`5.625s`），总还扣在第 22 拍；recall 点为第 2/4/11/19/22 拍（`5.625 / 18.500 / 54.675 / 100.975 / 125.725s`），相邻最大间隔 `46.300s`（第 11→19 拍，`0.772min`），首次还扣距埋扣 `12.875s`（`0.215min`）。check 的 `recall-gap` 只在总时长 >10 分钟时运行，133.6s 的夹具不触发；这是按同一条 5 分钟上限手工核验的。

**`interrupt-spacing`** — 改前没有 interrupt 声明，按可观察形态突变计 4 个点：coldopen-5 问句 `17.425s`、architecture-6 过渡 `47.950s`、results-6 性能段 `83.075s`、v2-and-cta-1 章首 `100.775s`；相邻间隔 `30.525 / 35.125 / 17.700s`，最大 `35.125s`、平均 `27.783s`，均 ≤120s。改后声明 interrupt 在第 5/8/17/22 拍（`23.300 / 38.650 / 91.425 / 125.725s`）；相邻 `15.350 / 52.775 / 34.300s`，最大 `52.775s`、平均 `34.142s`；0 warning。check 只查上界（>120s 才报），比 90s 更密不构成 warning。

**`numeric-run`** — 改前 results 8/8 拍含阿拉伯数字，最长连续 8 拍（results-1…results-8），占比 100%；architecture 2/6、33.3%、连续 2；v2 1/3、33.3%。改后 results 3/8（results-1/2/6，37.5%），最长连续 2；architecture 1/6（16.7%）；v2 1/3（33.3%）；coldopen 0/5；0 warning。判据是 `say` 里是否出现阿拉伯数字，纯词法，不判断数字是否被案例接地。

**`rhythm-uniformity`** — 判据是章内句长 CV <0.25 只落 report；report 不是失败，但均匀必须先被看见。改前全片 CV `0.513`（spec 记 `0.514`，同量级），章内 CV 为 coldopen `0.434`、architecture `0.390`、results `0.092`、v2 `0.159`。旧 outline 没有张力计划，新 check 在旧夹具上跳过（0 条 report）；所以这一分是“未被拦”，不是“旧稿节奏更好”——results / v2 本来就均匀，只是旧管线不显示它。改后全片 CV `0.410`；2 条 report 把均匀暴露出来：architecture `0.220`、results `0.097`；coldopen `0.406`、v2 `0.166`。按 report 语义记带注记通过；若把 report 当缺陷，这一维记 fail、总分 4/5。

## 量化表

改前取 `git show a5b2081:examples/trae-harness/beats.json`，改后取当前 `examples/trae-harness/beats.json`；秒数为节拍累计，成片时长来自 `output/receipt.json`（容器取整多 8ms）。

| 指标 | 改前（a5b2081） | 改后（9842829） |
|---|---:|---:|
| 成片时长 / 节拍累计 | 127.533s / 127.525s | 133.633s / 133.625s |
| 章 / 拍 | 4 / 22 | 4 / 22 |
| 埋扣 | 无 | 第 2 拍 @5.625s（0.094min） |
| 首次 recall（距埋扣） | 无 | 第 4 拍 @18.500s（+12.875s，0.215min） |
| recall 点 | 0 | 5（第 2/4/11/19/22 拍） |
| 最大 recall 间隔 | ∞（0 recall） | 46.300s（0.772min，第 11→19 拍） |
| 章首 re-hook | 0/4 | 4/4 |
| 章首字面问句 | 0/4 | 1/4 |
| results 数字拍（最长连跑 / 占比） | 8/8（8 / 100%） | 3/8（2 / 37.5%） |
| 全片数字拍最长连跑 | 8 | 2 |
| 全片问句 | 1（coldopen-5） | 4（coldopen-1/2/5、architecture-3） |
| 句长 CV：全片 | 0.513 | 0.410 |
| 句长 CV：coldopen | 0.434 | 0.406 |
| 句长 CV：architecture | 0.390 | 0.220（report） |
| 句长 CV：results | 0.092 | 0.097（report） |
| 句长 CV：v2-and-cta | 0.159 | 0.166 |
| caption 最大全角格 | 17（v2-and-cta-1） | 16（v2-and-cta-3） |
| say 总字符 / 字母数字 | 711 / 550 | 726 / 596 |
| caption 总字符 | 402 | 355 |
| `avp check` 全量 | 0 error / 1 warning / 23 report | 0 error / 1 warning / 25 report |
| 五维张力专项 | 0 / 0 / 0（无计划，跳过） | 0 / 0 / 2 |

改前 22 拍的问句只有 coldopen-5 一句；改后是 coldopen-1、coldopen-2、coldopen-5、architecture-3 四句。问句变多不等于钩子变好，语义仍要人看。

## 长视频对照（#23，不是夹具分数）

来源：`/tmp/t23-report.md`（ticket #23；25 分钟项目 `output/oneday-tension-validation`，只读原始副本 `output/oneday`）。它验证 `>10 分钟` 档，作为第二块面板，不参与夹具的 5 分制。

| 指标 | 改前 | 改后 |
|---|---:|---:|
| 总时长 | 25:44.66（1544.66s） | 24:40.25（1480.25s） |
| 埋扣 | — | 0.545min（第 8 拍） |
| 首次 recall | 15.23min | 0.865min（第 12 拍；距埋扣 0.32min） |
| 最大 recall 间隔 | 14.37min | 3.207min（mind-stages-12 → intelligence-formula-17） |
| 章首 re-hook | 0/14（10 陈述 + 4「X说：」） | 14/14 问句 |
| coldopen 句长 CV | 0.163 | 0.311 |
| 数字最长连跑 / 章内占比 | 2 / 0.12 | 2 / 0.12 |
| 张力专项 `--only` | — | 0 error / 0 warning / 12 report |
| 全量 check | 205 `hook-missing` + 1 `skill-commit-drift` | 205 + 1；0 个新增非张力 error |
| 章 / 拍 / id | 14 / 247 / — | 14 / 247 / 与改前逐 id 一致 |

报告 §6 的 caveat：14 个 interrupt 的最大间隔 `116.9s`，距 120s 上限只剩 `3.1s`；为压进上限，14 个声明点里有 12 个相对 notes 计划被挪动（解整体偏章边 / 末拍）。没有改 parser 或 check 来放宽判据。如果重新合成 TTS 导致时长漂移，`116.9s` 可能越过 120s，需要重跑 check。该任务未运行 compose / render，也未提交仓库。

## 局限

1. **语义判不了。** `chapter-rehook-missing` 只验 outline 的声明与拍号，不验“这句话是不是好钩子”；4/4 是计划事实，不是文笔证明。`numeric-run` 只查阿拉伯数字，查不出“数字后面有没有落到谁付出了什么”；案例接地（spec 明确“不可机械判”）不在五维里。`recall-gap` 的 recall 点来自声明，不是语义上的“观众真的被拉回来了”。
2. **均匀仍被报出来。** 夹具 2 条、长视频 12 条 `rhythm-uniformity` report。report 不是失败，但它说明这些章确实均匀；是否刻意，仍是作者判断。把 report 当缺陷的人会得到 4/5，而不是 5/5。
3. **夹具是 2.2 分钟，却按长片档优化。** 这是 spec 的显式豁免；`recall-gap` 的 >10 分钟门不会在夹具上自动跑，本基线是手工核验。分档边界由观众行为定，不为一个 2 分钟样本下调，但“夹具通过”不等于“2 分钟项目都该这么写”。
4. **25 分钟副本的全量 check 仍是红的。** 205 个 `hook-missing` 是改前已存在的视觉钩子缺失（副本 42/247 拍有 hook），与张力无关，本任务不改视觉，未补。不要把“张力 0 warning”读成“全量 0 error”。
5. **分数是判断，不是证明。** 改前没有张力计划，只能手工按判据核验；改后是“声明一致性 + 封闭词表启发式”，不是审稿。两个人对同一份稿子的观感可以不同；这份基线的作用是把可复核的事实钉死，让分歧落在判断上，而不是数字上。

## 复现命令

```bash
# 1) 现版夹具：全量 check（应为 0 error / 1 warning / 25 report）
cd examples/trae-harness
node ../../bin/avp.mjs check --json

# 2) 五维张力专项（应为 0 error / 0 warning / 2 report）
node ../../bin/avp.mjs check --json \
  --only=chapter-rehook-missing,recall-gap,interrupt-spacing,numeric-run,rhythm-uniformity

# 3) 改前 beats + 本文件的量化数字（从仓库根目录跑）
cd ../..
git show a5b2081:examples/trae-harness/beats.json > /tmp/t22-old-beats.json
node --import tsx --input-type=module - <<'NODE'
import { readFileSync } from "node:fs";
import { captionCells } from "./src/lib/captions.ts";

const len = (s) => [...s].filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
const cv = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length) / m; };
const start = (bs) => { let t = 0; return bs.map((b) => { const s = t; t += b.durationMs; return { ...b, startMs: s }; }); };
const gaps = (bs, nums) => nums.slice(1).map((n, i) => bs[n - 1].startMs - bs[nums[i] - 1].startMs);

for (const [name, p] of [["before", "/tmp/t22-old-beats.json"], ["after", "examples/trae-harness/beats.json"]]) {
  const bs = start(JSON.parse(readFileSync(p, "utf8")).beats);
  const by = Object.groupBy(bs, (b) => b.chapter);
  console.log(`\n== ${name} == total=${bs.reduce((s, b) => s + b.durationMs, 0)}ms`);
  console.log("whole CV", cv(bs.map((b) => len(b.say))).toFixed(3));
  console.log("questions", bs.filter((b) => /[？?]/u.test(b.say)).map((b) => b.id).join(","));
  console.log("caption max", Math.max(...bs.map((b) => captionCells(b.caption))), "sayChars", bs.reduce((s, b) => s + [...b.say].length, 0));
  for (const [id, x] of Object.entries(by)) {
    const f = x.map((b) => /\d/u.test(b.say));
    let run = 0, max = 0;
    for (const v of f) { run = v ? run + 1 : 0; max = Math.max(max, run); }
    console.log(` ${id} cv=${cv(x.map((b) => len(b.say))).toFixed(3)} numeric=${f.filter(Boolean).length}/${x.length} run=${max}`);
  }
}
const cur = start(JSON.parse(readFileSync("examples/trae-harness/beats.json", "utf8")).beats);
console.log("\nrecall starts", [2, 4, 11, 19, 22].map((n) => `${n}:${cur[n - 1].startMs}`).join(" "), "gaps", gaps(cur, [2, 4, 11, 19, 22]).join(","));
console.log("interrupt starts", [5, 8, 17, 22].map((n) => `${n}:${cur[n - 1].startMs}`).join(" "), "gaps", gaps(cur, [5, 8, 17, 22]).join(","));
NODE

# 4) 改前夹具上的张力 check：0 条结论 = 无计划被跳过，不是通过
REPO=$(pwd)
mkdir -p /tmp/t22-old
git archive a5b2081 examples/trae-harness | tar -x -C /tmp/t22-old
cd /tmp/t22-old/examples/trae-harness
node "$REPO/bin/avp.mjs" check --json \
  --only=chapter-rehook-missing,recall-gap,interrupt-spacing,numeric-run,rhythm-uniformity
```

长视频面板的源报告：`/tmp/t23-report.md`（ticket #23）。其中 §8 有该副本的张力专项与全量复现命令；注意副本是 gitignored 的 `output/oneday-tension-validation`，不在本基线提交内。
