# legacy —— 旧手工版产物（只作对照，不是真相源）

这个目录是 ticket #9 之前 `trae-harness-video/` 的全部旧产物。它们是**手工搭出来的**，
不是 `avp` 流水线的产物；保留在这里只为了做画面 / 节奏的对照，**不能作为任何内容的
真相源**。需要改口播稿、字幕、音频、画面时，改项目根目录下的
`script.md` / `outline.md` / `presentation/`，然后按 `avp plan` → `avp tts` 重跑。

## 这里有什么

| 路径 | 旧角色 | 为什么不能当真相源 |
|---|---|---|
| `script.md` / `outline.md` | 旧口播稿 / 旧开发计划 | 只有 15 个 `---` 块，与 22 拍 `narrations.ts` 没有可追溯的对应关系 |
| `presentation/` | 旧 React 演示 | 后 3 章的 `step ===` 用的是**全局** 1-based 编号（5..21），而运行时给的是章内 0-based（0..n-1）：22 拍里 16 拍是空白舞台 |
| `presentation/public/audio/` | 旧音频（38 个 WAV） | 演示用「章内 1..n」，合成稿用「全片 1..22」两套编号；交集只有 6 个文件，各有 16 个孤儿。`results/` 的两组甚至是两次不同合成 |
| `hyperframes-project/index.html` | 旧合成稿 | 22 个 `<audio>` 全部没有 `id`（混音器跳过 → 无声）；`data-duration` 是 137s 估时，实测音频 131.1s；60+ 处动画写死在全局秒上 |
| `gen_audio.py` / `gen_kokoro_audio.py` | 旧音频生成脚本 | 把 22 条口播文本**逐字硬编码**进 Python；写死 Windows 盘符；只写「章内 1..n」 |
| `run-render.mjs` / `run-render.cjs` / `render.bat` / `render.ps1` / `go.cmd` | 旧渲染壳 | 写死 `d:\动画\...`、外部 HyperFrames checkout、Windows PATH 分隔符；macOS 上逐行失效 |
| `check-path.js` | 旧诊断脚本 | 只查 ffmpeg 是否在 PATH，没有产物 / 回执 / 日志 |

## 当前真相源

- 文章（唯一输入）：[`../article.md`](../article.md)
- 口播稿 / 开发计划：`../script.md` / `../outline.md`
- 节拍清单 / 音频 / TTS 回执：`../beats.json` / `../audio/` / `../.avp/tts.json`
- 演示（可点、可验收）：`../presentation/`

> 旧产物里的内容与新手写版**允许不同**。spec #1 明确：结构必须满足 DoD，
> 画面内容与旧手工版不同不算回归失败。
