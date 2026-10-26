---
name: article-video-production
description: 把文章或口播稿做成可归因、可重渲的 16:9 成片。默认路径是渲染 MP4：article.md → avp init/plan（口播稿 + outline + 节拍清单）→ 停点 1 对齐 → avp tts（实测时长）→ avp compose（静态合成稿 + GSAP 钩子）→ avp check（error/warning/report 三级）→ 停点 2 渲染闸（check + 时长表 + 3 张缩略图）→ avp render（mp4 + 回执 + 联系表 + 静帧报告）→ 停点 3 成片复审。网页演示用于决策与预览，录屏降级为附录。适用：文章转视频、产品演示、技术讲解、keynote 短片。
---

# Article Video Production

把一篇文章或口播稿，做成一支**可归因、可重渲**的成片。核心不是"生成
页面"，而是把每个决定落成账本，让 `check` 能拦住漂移、让 `render` 能
复现同一支片。

> 本 skill 的默认产物是 MP4。`presentation/` 是用来给人看、给人点、
> 给定点验收的**决策面**；`composition/` 才是渲染面。录屏只是附录。

---

## 流水线

```text
article.md
   │  avp init            项目账本 + TTS 配置 + 演示脚手架
   │  avp plan            script.md / outline.md / narrations.ts → beats.json
   ▼
◆ 停点 1 · Plan          稿 / outline / 主题 / 素材 / 开发模式 一次对齐
   │  avp plan --approve
   │  avp tts [--chapter]  Kokoro / fake；ffprobe 实测 + 300ms 尾隙
   │  avp compose         生成骨架；身体 + 钩子手写
   │  avp check           三级检查
   ▼
◆ 停点 2 · 渲染闸        check 结论 + 时长表 + 3 张缩略图 → 人回「渲」
   │  avp render          mp4 + 回执 + 联系表 + 静帧报告
   ▼
◆ 停点 3 · 成片复审      联系表 / 抽查帧 / 静帧报告
   │
   └─ 附录：RECORDING（录屏 + 后期，非默认）
```

---

## 七条命令

| 命令 | 输入 | 产出 |
|---|---|---|
| `avp init` | 主题 id | `project.json`、`tts.json`、`presentation/` |
| `avp plan` | `script.md`、`outline.md`、`narrations.ts` | `beats.json`；`--approve` 写 `.avp/approval.json` |
| `avp tts` | `beats.json`、`tts.json` | `audio/<ch>/<N>.wav`、`.avp/tts.json`、回写时长 |
| `avp compose` | `beats.json`、`composition/beats` / `hooks` | `composition/index.html` |
| `avp check` | 全部账本 + 源 | 三级 findings；无 error 写 `.avp/check.json` |
| `avp render` | 以上全部 | `output/output.mp4`、回执、联系表、静帧报告 |
| `avp status` | 全部账本 | 四列状态：步骤 / 输入哈希 / 产物 / 状态 |

通用：`--json`、`--dir=<path>`、`--help`。退出码 **0 = 成功；非 0 = 失败且
原因可机械修复**。`--after-plan` 会核对批准哈希；改稿后必须重新批准。

---

## 停点

### 停点 1 · Plan

`avp plan` 通过后停。一次对齐 5 件事：稿子 / outline / 主题 / 素材 /
开发模式（第 1 章必须主线程做完并验收，之后可逐章 / 顺序 / 并行）。
用户确认后执行 `avp plan --approve`——批准哈希 = `script.md` + 节拍的
计划字段；tts 回写的 `durationMs/tts` 不会弄脏它。

### 停点 2 · 渲染闸

`avp render --brief` 输出三行：check 结论 / 时长表 / 3 张缩略图。**不产
mp4**。人只需回一个字「渲」或指出要改的拍。有 error 时 render 直接
`check-failed`，不允许先渲了再说。

### 停点 3 · 成片复审

看 `output/contact-sheet.png`（每拍 2 帧，6 列）和 `output/still-report.json`。
静帧是启发式，**只报不拦**：刻意的静止是手法；阻断只留给机械问题。

---

## 四份账本

| 账本 | 谁写 | 用途 |
|---|---|---|
| `project.json` | `init` | 项目身份 / 主题 / skill 版本与 commit |
| `beats.json` | `plan`、`tts` | 节拍、字幕、音频路径、实测时长、motion |
| `tts.json` | 人 | 后端、默认 / 章节音色与语速 |
| `output/receipt.json` | `render` | 工具链、哈希、音频 / 成片 sha256 |

派生物（可删可重建）：`presentation/public/audio/`、`composition/index.html`、
`composition/audio/`、`output/`。**不要手改派生物**——改源，再跑对应命令。

> 夹具例外：`examples/trae-harness/presentation/public/audio/` 与成品
> `output/` 一并入库，保证 clone 后开箱可演示、可复审；普通项目按上面的
> 派生物规则忽略即可。

---

## 检查分级

| 级别 | 行为 | 典型项 |
|---|---|---|
| **error** | 阻断 render，退出 1 | 音频缺失 / 路径不符 / tts 回执过期 / 静音拍坏 / 字幕超宽 / say-caption 数字专名不一致 / 口播源漂移 / 钩子缺失·超拍·非 seek-safe / tokens 过期 / 语速越界 |
| **warning** | 可见，不拦 | 派生字幕 / 音色偏离 / skill commit 漂移 |
| **report** | 只报 | 时长表 / 静帧时段 |

`check` 没有"警告即失败"的开关；要放行必须修 error，不能把 warning 调成
静音。`--only=<ids>` 只是查看视图，不写回执、不能给渲染闸放行。

---

## 工作目录

```text
my-video/
├── article.md                  # 原文，保留（画面信息源）
├── script.md                   # 口播稿：--- 分块 = 节拍
├── outline.md                  # 开发计划：章节 / step / 信息池 / 素材
├── project.json                # 项目账本
├── beats.json                  # 节拍清单（与 narrations.ts 同数同序）
├── tts.json                    # 后端 + 音色 + 语速
├── presentation/               # Vite + React + TS 演示（决策面）
│   └── src/chapters/<NN>-<id>/narrations.ts   # say/caption/motion 真相源
├── composition/
│   ├── beats/<beat-id>.body.html   # 手写身体
│   └── hooks/<beat-id>.hook.ts     # 手写钩子
├── audio/<chapter>/<N>.wav
├── .avp/                       # 批准 / TTS 回执 / 检查回执
└── output/                     # mp4 / 回执 / 联系表 / 静帧报告
```

`narrations.ts` 是 step 数与 `say/caption` 的唯一真相源；`beats.json`
是时长与音频路径的唯一真相源；`outline.md` 不参与 TTS。

---

## 内容阶段

1. 识别输入：原文 → 一次产出 `script.md` + `outline.md`；直接口播稿 →
   落盘后补 `outline.md`；只有主题 → 先要素材，不替用户构思。
2. `script.md` 按 [`SCRIPT-STYLE.md`](references/SCRIPT-STYLE.md) 写；
   用 `---` 切节拍，每块一个 `say`。
3. `outline.md` 按 [`OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) 写；
   **只规划节奏与信息密度，不规划动画**。
4. 两份都先走自检，再进停点 1。

### 口播与字幕

```ts
interface Narration {
  say: string;                 // 给耳朵；送 TTS
  caption?: string;            // 给眼睛；单行 ≤18 全角，可不等于 say
  motion?: "hook" | "static";  // 默认 say 非空 hook / say 为空 static
}
```

- `caption` 缺失时 `plan` 推导，并留 `captionSource: "derived"` warning；
- `caption` 不得补省略号；数字 / 专名集合必须与 `say` 一致；
- `say: ""` = 静音拍：不合成，`durationMs=1500`，`tts=null`，不生成 audio 元素。

---

## 单章实现

读 [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md)（单入口）。要点：

- 每屏独占 1920×1080 舞台；一章一个 `Component`，按 `step` 分支；
- 动效优先用**视觉原子**：类名 + 必填 DOM 外壳 + `.in/.lit/.dim`，见
  [`COMPOSE.md`](references/COMPOSE.md) 与 `templates/src/styles/atoms.css`；
- 第 1 章必须主线程做完 + 人验收；之后逐章 / 顺序 / 并行由停点 1 决定；
- 做完一章先走自检（Agent Teams → subAgent → 自检），修完再推进。

`references/EXAMPLES/` 是**旧写法**的结构 anchor：只看 step 切分、字号
对比、揭示顺序，不要照抄 `hk-*` / `lr-*` 私有类。

---

## 音频

读 [`TTS.md`](references/TTS.md)。默认 `kokoro`，测试可用 `fake`。

- 后端必填：音色 id 有后端作用域；
- 语速 0.95–1.05，越界 error；音色偏离 warning；
- 实测时长 = ffprobe + 300ms 尾隙，回写 `beats.json`；
- 缓存键 `sha256(say + backend + voice + speed + schemaVersion)`；
- 改稿后重跑 `avp plan`，再 `avp tts`；不要手改时长。

---

## 合成稿与渲染

- 身体：`composition/beats/<id>.body.html`，HTML 片段、禁止 `<script>`；
- 钩子：`composition/hooks/<id>.hook.ts`，`(tl, root, ctx) => void`，所有
  位置用 `ctx.start + …` 绝对值；禁止 `repeat:-1` / rAF / 时钟 / 定时器；
- 字幕在生成器里统一渲染，`start + 0.3s`；
- 完整约定见 [`COMPOSE.md`](references/COMPOSE.md)；
- 环境、渲染闸、回执、故障见 [`RENDER.md`](references/RENDER.md)。

渲染前必须过 `avp check`；`render --brief` 是停点 2，`render` 才产片。

---

## 硬性自检协议

机械项交给 `avp check`；人面项（稿子 / outline / 单章）仍要自检：

| 产出 | 清单 |
|---|---|
| `script.md` | [`SCRIPT-STYLE.md`](references/SCRIPT-STYLE.md) 三层自检 |
| `outline.md` | [`OUTLINE-FORMAT.md`](references/OUTLINE-FORMAT.md) 自检 |
| 单章 | [`CHAPTER-CRAFT.md`](references/CHAPTER-CRAFT.md) 完工自检 |

执行顺序：独立 reviewer（Agent Teams）→ subAgent → 严格自检。拿到 fail
项**先改完再汇报**；不允许"目测一遍就放行"。

---

## 附录：录屏

录屏不是默认路径。只有在需要真人操作画面、或客户要求原始录屏时才用。
流程、三种播放模式（Manual / Audio / Auto）、`?auto=1`、端口与后期见
[`RECORDING.md`](references/RECORDING.md)。

---

## 文档索引（8 份）

| 文档 | 何时读 |
|---|---|
| [SCRIPT-STYLE.md](references/SCRIPT-STYLE.md) | 写口播稿 |
| [OUTLINE-FORMAT.md](references/OUTLINE-FORMAT.md) | 写开发计划 |
| [CHAPTER-CRAFT.md](references/CHAPTER-CRAFT.md) | 实现单章 |
| [THEMES.md](references/THEMES.md) | 选 / 造主题 |
| [TTS.md](references/TTS.md) | 合成音频 |
| [COMPOSE.md](references/COMPOSE.md) | 写身体 / 钩子 |
| [RENDER.md](references/RENDER.md) | 渲染 / 回执 / 排查 |
| [RECORDING.md](references/RECORDING.md) | 附录：录屏 |

其他：[EXAMPLES](references/EXAMPLES/README.md)、[GLOSSARY](GLOSSARY.md)、
[docs/adr](docs/adr)、[docs/evals](docs/evals)。
