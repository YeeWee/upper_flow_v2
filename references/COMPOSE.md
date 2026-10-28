# 合成稿（composition）

`avp compose` 把节拍清单变成 HyperFrames 可渲染的静态 HTML。**骨架是生成
的，身体和钩子是手写的**——这条边界决定了什么该改、什么改了会被覆盖。

> 真相源：`beats.json`（时长 / 字幕 / 音频路径）→ `composition/`（身体 +
> 钩子）→ `composition/index.html`（生成物）。不要手改 `index.html`；改完
> 身体或钩子后重跑 `avp compose`。

---

## 目录

```
composition/
├── index.html                  # 生成物：不要手改
├── gsap.min.js                 # 生成物：本地 GSAP 副本（不查网）
├── audio/<chapter>/<N>.wav     # 生成物：从项目根复制，保证 self-contained
├── beats/<beat-id>.body.html   # 手写：这一拍的视觉 DOM
└── hooks/<beat-id>.hook.ts     # 手写：这一拍的入场时间线（motion: hook 才需要）
```

`avp compose` 是幂等的：同一份输入重复执行，`index.html` 字节一致。

---

## 生成的骨架

`index.html` 包含：

- `<meta name="avp:tokens-hash" content="…">`：主题 tokens 的内容哈希；
- 内联的 `tokens.css` + `base.css` + `atoms.css`；
- 每个节拍一个 `.clip`：

```html
<div class="clip" id="clip-coldopen-1"
     data-start="0.000" data-duration="3.650" data-track-index="1">
  <div class="avp-body"><!-- body.html 原样拼入 --></div>
  <div class="avp-caption" data-caption="需求丢给 AI">需求丢给 AI</div>
</div>
```

- 每个有声节拍一个音频元素：

```html
<audio id="audio-coldopen-1" src="audio/coldopen/1.wav"
       data-start="0.000" data-duration="3.650"
       data-track-index="2" data-volume="1"></audio>
```

- 一个暂停的 GSAP 主时间线 `window.__timelines["main"]`；钩子按
  `ctx.start` 绝对定位。

硬约束（生成器已处理，不要绕过）：

- 音频 `src` **相对 `composition/`**，禁止 `../`；复制音频而不是软链。
- 每个 `<audio>` 的 `id` 唯一：`audio-<beat-id>`。
- **静音拍不生成 `<audio>`**。空 `src` 会让 HyperFrames 混音阶段硬失败
  （`audio_processing_failed`），不是「静音」。
- 字幕不是 clip，没有 `data-start`：hook 拍在 `beat.start + 0.3s` 淡入，给眼睛留一口气；static 拍从 `beat.start` 就显示，保证「刻意静止」的拍两帧一致。

---

## 身体（body）

文件：`composition/beats/<beat-id>.body.html`。

- 一段 **HTML 片段**，不是完整页面；不要 `<html>` / `<head>` / `<body>`。
- **禁止 `<script>`**：`compose` 会报 `body-script`。动效只能走钩子。
- 用视觉原子：类名 + **必填 DOM 外壳** + `.in / .lit / .dim` 三态。
  原子契约见 `atoms.css` 顶部注释；不要自造原子，也不要写 `@keyframes`。
- 布局可以内联 `style`（`display:grid` / `gap` / `padding`）——布局是这一拍
  的私有决定，不属于原子契约。
- 内容来自 `outline.md` 的信息池；禁止在身体里写正文段落以外的新事实。
- 文件缺失 → `body-missing`；空文件 → `body-empty`；都是 error。

示例：

```html
<div style="height:100%;display:flex;flex-direction:column;justify-content:center;gap:24px">
  <div class="atom-kicker lit">01 / 需求 → 代码</div>
  <div class="atom-hero in">
    <h1 class="atom-hero__title">把需求<br />丢给 <em>AI</em></h1>
  </div>
</div>
```

---

## 钩子（hook）

文件：`composition/hooks/<beat-id>.hook.ts`。只有 `motion: "hook"` 的拍需要；
`motion: "static"` 的拍刻意静止，即使有旧钩子也会被忽略并 warning。

签名：

```ts
export default function (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  ctx: { start: number; duration: number },
): void;
```

`tl` 是主时间线；**所有位置都用 `ctx.start + 偏移` 的绝对值**，不要用
`tl.to(..., "+=0.2")`——`+=` 依赖前一次调用，重排会漂。

```ts
export default function (tl, root, ctx) {
  tl.from(root.querySelector(".atom-hero__title"),
    { y: 44, opacity: 0, duration: 0.75, ease: "power4.out" },
    ctx.start + 0.12);
}
```

### seek-safe 红线

合成稿会被逐帧 seek，下列写法在 `compose` 阶段就被拒绝
（`hook-not-seek-safe`）：

- `repeat: -1` / 无限循环；
- `requestAnimationFrame`；
- `Date.now()` / `performance.now()`；
- `setTimeout` / `setInterval`。

也禁止：`export` 其它东西、空钩子（`hook-empty`）、语法错误
（`hook-invalid`）、钩子总长超过 `ctx.duration`（`hook-overrun`）。

### 时长

`probeHook` 用一份假 timeline 量钩子的总长；**最后一个 tween 的结束时间
必须 ≤ `ctx.duration`**。动画是口播的从属，不是反过来。

---

## 字幕

- 来源：`beats.json` 的 `caption`；`captionSource: "authored"` 是人写的，
  `"derived"` 是从 `say` 推导的，check 会给 warning 留痕。
- 宽度：**≤ 18 全角格**（ASCII 0.5，向上取整）；超出 → `caption-too-wide`，
  渲染前就拦。
- 数字 / 专名集合必须与 `say` 一致（`say-caption-token-mismatch`）：
  字幕可以更短，但不能把 `200` 写成 `两百`。
- 永不补省略号（`…` / `...` 都算，`caption-ellipsis` warning）：截断是改写，
  不是省略。
- 字幕条由生成器统一渲染在底部，**不要**在身体里自己画字幕。

推导规则（`caption` 缺失时）：按 `。！？；` 切句，再按 `，、：` 切分句；
取能放进 18 格的第一段；都放不下就报错，让作者手写。

---

## 主题与 tokens

- 主题由 `project.json` 的 `theme.id` 决定；`plan` 把 `tokens.css` 的
  `sha256` 写进 `beats.json` 的 `theme.tokensHash`。
- `compose` 重新计算当前 tokens 哈希：对不上 → `tokens-stale` error，
  先 `avp plan` 再 compose。
- 原子只消费既有 token；**不新增 token 名**。主体色、强调色、字体、间距
  都从 `tokens.css` 来，身体里不写死 hex。

---

## 与演示项目的关系

`presentation/` 是决策面（Vite + React，可交互预览）；`composition/` 是
渲染面（静态 HTML + GSAP）。**两套代码，一份契约**：

- 共享的是 `atoms.css` 的类名 + DOM 外壳 + 三态，不是 React 组件；
- 章节可以自由设计布局，但原子 DOM 必须一致；
- 改 `templates/src/styles/atoms.css` 会改变两端，必须同时回归
  `presentation` 与 `composition`。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `body-missing` | 缺 `composition/beats/<id>.body.html` |
| `body-script` | 身体里有 `<script>`；动效搬到钩子 |
| `hook-missing` | `motion: "hook"` 却没有钩子；补文件或改 `static` 后重跑 `plan` |
| `hook-overrun` | 钩子最后一个 tween 超过拍长；缩短或提前 |
| `hook-not-seek-safe` | 去掉无限循环 / rAF / 时钟 / 定时器 |
| `tokens-stale` | 主题 tokens 改过；重跑 `avp plan` 再 compose |
| 渲染时静音 | 检查音频 `src` 是否相对 `composition/`；不要 `../` |
| 渲染报 `audio_processing_failed` | 静音拍被写成了空 `src` 的 `<audio>`；重跑 compose |
