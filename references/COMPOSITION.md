# HyperFrames Composition HTML 构建规范

从 `presentation/` 项目生成 HyperFrames 可渲染的 composition HTML。

## 文件位置

`<项目根>/hyperframes-project/index.html` 是唯一需要的文件。
`<项目根>/hyperframes-project/audio/` 放音频副本。
最终产物 `output.mp4`。

## index.html 骨架

文档头部：Google Fonts (Inter + Noto Sans SC + JetBrains Mono) + GSAP CDN。

CSS 变量从所选主题 tokens.css 提取。body 1920x1080 + 40px 暖色网格背景。每个 step 一个 `.clip` div，初始 display:none，底部固定字幕条。

## Clip 设计

| 类型 | 场景 | 动画 |
|------|------|------|
| Hero | 标题/大数字 | scale 0.85→1 + opacity |
| DataCard | 指标对比 | y 30→0 + scale 0.96→1 |
| List | 多项并列 | stagger 0.12~0.18s |
| Badge | 小徽章 | scale 0→1 |
| Quote | 金句 | y 20→0 + opacity |

颜色：accent teal `#14b8a6` / 暖红 `#c45a3b` / 暖琥珀 `#d4943a` / 暖绿 `#3a9a6c` / 正文 `#43302b`。

## 音频

文件命名 `audio/{chapter}/{N}.wav`，N 从 1 开始。每个 `<audio>` 必须有唯一 `id="audio-N"`，`data-start` 从 0 累加。时长估算：中文约 3~4 字/秒。

## GSAP Timeline

每个 step：fadeOut 前 clip → set display:none → fadeIn 新 clip → 元素入场 → setSubtitle() 更新字幕（淡入淡出 0.15s）。

缓动：power4.inOut（出）/ power4.out（入）。硬规则：禁止 `repeat: -1`，禁止 CSS opacity:0 + GSAP from({opacity:0})，元素入场在 clip 显身后 0.1~0.3s。

## 渲染

`node packages/cli/dist/cli.js render "项目/hyperframes-project" -o "output.mp4" --fps 30`

## 反模式

| 错误 | 正确 |
|------|------|
| repeat:-1 | 有限 repeat |
| CSS opacity:0 + GSAP from({opacity:0}) | 去掉 CSS opacity |
| `<audio>` 无 id | `id="audio-N"` |
| `#000` / `#dc2626` | `#f5efe1` / `#c45a3b` |
| 默认 ease | power4 系列 |