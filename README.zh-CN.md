# article-video-production

**把一篇文章或口播稿，做成一支可归因、可重渲的 16:9 成片。**

旧名 `web-video-presentation` 已退役。默认产物是 MP4（`avp render`）；
网页演示负责决策与预览，录屏降级为附录。

---

## 它做什么

```text
article.md
   │  avp init            项目账本 + TTS 配置 + 演示脚手架
   │  avp plan            script.md / outline.md / narrations.ts → beats.json
   ▼
◆ 停点 1 · Plan          稿子 / 开发计划 / 主题 / 素材 / 模式 一次对齐
   │  avp plan --approve
   │  avp tts [--chapter]  合成音频，ffprobe 实测时长回写
   │  avp compose         生成合成稿骨架；身体 + 钩子手写
   │  avp check           分级检查（error / warning / report）
   ▼
◆ 停点 2 · 渲染闸        check 结论 + 时长表 + 3 张缩略图 → 人回「渲」
   │  avp render           mp4 + 回执 + 联系表 + 静帧报告
   ▼
◆ 停点 3 · 成片复审      联系表 / 抽查帧 / 静帧报告
   │
   └─ 附录：RECORDING（录屏路径，非默认）
```

适用：文章转口播视频、产品演示、技术讲解、发布会 / keynote 风格短片。
不适用：真人出镜剪辑、纯素材混剪。

---

## 七条命令

| 命令 | 作用 |
|---|---|
| `avp init` | 初始化项目（`project.json` / `tts.json` / `presentation/`） |
| `avp plan` | 校验稿子与章节，生成 `beats.json`；`--approve` 写批准哈希 |
| `avp tts` | 按拍合成 WAV，回写实测 `durationMs`；`--chapter` 只重做一章 |
| `avp compose` | 生成 `composition/index.html` 骨架，拼入身体与钩子 |
| `avp check` | 三级检查；有 error 退出 1，warning / report 不拦 |
| `avp render` | 过 check 后渲 mp4；`--brief` 只给渲染闸，不产片 |
| `avp status` | 四列状态：步骤 / 输入哈希 / 产物 / 状态 |

退出码：**0 = 成功；非 0 = 失败，并给出可机械修复的原因**。
`--json` 给 agent 读，人话输出给停点用。

---

## 四份账本

| 账本 | 谁是真相源 |
|---|---|
| `project.json` | 项目身份、主题、skill 版本 / commit |
| `beats.json` | 节拍、字幕、音频路径、实测时长、motion |
| `tts.json` | 后端、默认 / 章节音色与语速 |
| `output/receipt.json` | 渲染回执：工具链、哈希、音频 / 成片 sha256 |

派生物：`composition/index.html`、`presentation/public/audio/`、`output/`。

---

## 检查分级

- **error**：阻断渲染。音频缺失 / 路径不符 / 回执过期 / 静音拍坏 / 字幕超宽 /
  say 与 caption 数字专名不一致 / 口播源漂移 / 钩子缺失·超拍·非 seek-safe /
  tokens 过期 / 语速越界。
- **warning**：可见不拦。派生字幕 / 音色偏离 / skill commit 漂移。
- **report**：只报。时长表 / 静帧时段。

`render --brief` 就是停点 2：一行 check 结论、一行时长表、一行缩略图路径。

---

## 仓库结构

```text
article-video-production/
├── bin/avp.mjs              # CLI 分发（tsx）
├── src/                     # init / plan / tts / compose / check / render
├── templates/               # Vite + React + TS 演示脚手架 + 视觉原子
├── themes/                  # 23 套 tokens.css
├── references/              # 8 份契约文档（见下）
├── examples/trae-harness/   # 22 拍真实夹具：文章 → 音频 → 成片
├── docs/adr/                # 架构决定
└── docs/evals/              # 质量基线 rubric
```

---

## 快速开始

```bash
node bin/avp.mjs init --dir=my-video --theme=bold-signal
cd my-video
# 写 script.md / outline.md / presentation/src/chapters/*/narrations.ts
node ../bin/avp.mjs plan
node ../bin/avp.mjs plan --approve
AVP_PYTHON=/path/to/venv/bin/python node ../bin/avp.mjs tts
node ../bin/avp.mjs compose
node ../bin/avp.mjs check
node ../bin/avp.mjs render
```

完整例子见 [examples/trae-harness](./examples/trae-harness)：4 章 / 22 拍 /
127.5s，含 22 条真实 Kokoro 音频与最终成片。

---

## 文档

| 文档 | 内容 |
|---|---|
| [SCRIPT-STYLE.md](./references/SCRIPT-STYLE.md) | 文章 → 口播稿：信息保留、风骨、平台变体 |
| [OUTLINE-FORMAT.md](./references/OUTLINE-FORMAT.md) | 开发计划字段、信息池、素材清单 |
| [CHAPTER-CRAFT.md](./references/CHAPTER-CRAFT.md) | 单章实现规则与完工自检 |
| [THEMES.md](./references/THEMES.md) | 23 套主题、token 契约、派生流程 |
| [TTS.md](./references/TTS.md) | 后端契约、缓存键、语速边界、静音拍 |
| [COMPOSE.md](./references/COMPOSE.md) | 合成稿：身体 / 钩子 / 原子 / 字幕 |
| [RENDER.md](./references/RENDER.md) | 环境、渲染闸、回执、联系表、故障排查 |
| [RECORDING.md](./references/RECORDING.md) | 附录：录屏与后期 |

其他：[EXAMPLES](./references/EXAMPLES/README.md)、[GLOSSARY](./GLOSSARY.md)、
[ADR](./docs/adr/)、[质量基线](./docs/evals/)。

---

## 版本

`0.1.0`。设计决定见 [docs/adr/0001](./docs/adr/0001-two-artifacts-derive-composition.md) 与
[docs/adr/0002](./docs/adr/0002-atoms-shared-by-contract.md)。
