# SKILL.md Phase 5 扩展补丁

本文档描述对 `web-video-presentation/SKILL.md` 的新增内容。
将以下各节按位置插入 SKILL.md。

---

## 修改 1：工作流总览（替换现有 Phase 4 → 新增 Phase 5）

**在 SKILL.md 的「工作流总览」ASCII 图中，将 Phase 4 之后追加：**

```
   ▼
[Checkpoint Render]    ← 新增！是否渲染 MP4
   ▼
Phase 5   渲染 MP4（新增）
   5.1  TTS 合成（复用 Phase 3）
   5.2  构建 HyperFrames composition
   5.3  HyperFrames CLI 渲染
```

**同时将 Phase 4 标题改为：**

```
Phase 4   录屏 + 后期（可选 —— 快速预览用）
```

---

## 修改 2：文件读取指南（追加 Phase 5 行）

**在「各阶段文件读取指南」表格末尾追加：**

| 阶段 | 必读 | 一次性 |
|------|------|--------|
| Phase 5 渲染 MP4 | `references/HYPERFRAMES.md` + `references/COMPOSITION.md` + `outline.md`（全文）+ 当前主题 `tokens.css` | —— |

---

## 修改 3：Phase 3 扩展（TTS 方案增加 Kokoro）

**在 Phase 3「音频合成」节的末尾，`synthesize-audio` 命令说明之后，追加：**

### TTS 引擎选择

本 Skill 默认走 MiniMax CLI (`mmx-cli`)。如果用户没有 MiniMax API Key，提供本地 Kokoro TTS 作为退化路径：

**Kokoro TTS（本地、免费、离线）**

```bash
pip install kokoro-onnx misaki[zh] soundfile numpy
```

需要下载模型文件（一次性，约 340MB）：
- `kokoro-v1.0.onnx` → `%USERPROFILE%\.cache\hyperframes\tts\models\`
- `voices-v1.0.bin` → `%USERPROFILE%\.cache\hyperframes\tts\voices\`

中文推荐音色 `zf_xiaoxiao`（最清晰标准）。

合成脚本流程：从所有 `narrations.ts` 提取文本 → `misaki.zh.ZHG2P()` 转音素 → `Kokoro.create()` 合成 → `soundfile.write()` 输出 WAV。

---

## 修改 4：新增 Phase 5 —— 渲染 MP4

**在 SKILL.md 的 Phase 4 之后插入以下完整内容：**

---

## Checkpoint Render —— 是否渲染 MP4

Phase 4 录屏适合快速验证。正式输出需要**无压缩、音画精确同步**的 MP4，
走 HyperFrames 渲染。

```
网页完成了，dev server 跑着。要不要渲染成 MP4？

  ✓ 渲染 → 进入 Phase 5：
    1. TTS 合成音频（如果 Phase 3 已合成则跳过）
    2. 构建 HyperFrames composition HTML
    3. HyperFrames CLI → output.mp4

  ✗ 不渲染 → 结束。用 Phase 4 录屏。
```

---

## Phase 5 —— HyperFrames 渲染 MP4

完整指引见 [`references/HYPERFRAMES.md`](references/HYPERFRAMES.md)，
composition 构建规范见 [`references/COMPOSITION.md`](references/COMPOSITION.md)。

### 5.1 确认音频

如果 Phase 3 已合成 → 音频在 `presentation/public/audio/`，直接复用。
如果跳过 Phase 3 → 现在用 Kokoro TTS 合成（见 Phase 3 扩展节）。

### 5.2 构建 HyperFrames composition

```bash
mkdir -p hyperframes-project/audio
cp -r presentation/public/audio/* hyperframes-project/audio/
```

然后构建 `hyperframes-project/index.html`。一个完整的 HTML 文件，包含：

1. 22 个 `<div class="clip">` 全屏容器（每个 step 一个）
2. 22 个 `<audio>` 元素（`data-start` + `id`）
3. 底部字幕条 `.subtitle-bar`
4. GSAP Timeline（clip 切换 + 元素动画 + 字幕更新）
5. 主题色板 CSS（从 presentation 的 tokens.css 提取）
6. 40px 网格图案背景 + 所有卡片用暖色阴影

**构建方式**：agent 按 [`references/COMPOSITION.md`](references/COMPOSITION.md) 规范，
从 `outline.md` 的每步内容 + `narrations.ts` 的口播文本，**全自动生成完整的 composition HTML**。

### 5.3 渲染

```bash
cd <hyperframes-clone-root>
node packages/cli/dist/cli.js render \
  "<项目>/hyperframes-project" \
  -o "<项目>/output.mp4" \
  --fps 30
```

### 5.4 验证

检查文件大小、时长无误。首次渲染会下载 Chrome (~101MB) 和 Google Fonts，后续有缓存。

---

## 修改 5：更新「相关资源」表

**在 SKILL.md 末尾的「相关资源」表追加：**

| 文件 | 何时读 | 内容 |
|------|--------|------|
| [`references/HYPERFRAMES.md`](references/HYPERFRAMES.md) | Phase 5 必读 | 完整渲染流程、环境依赖、常见问题 |
| [`references/COMPOSITION.md`](references/COMPOSITION.md) | Phase 5 必读 | composition HTML 构建规范、Clip 设计、GSAP 规则 |

---

## 修改 6：更新 CSS 动画原则文档引用

**Phase 2.4「实现单章」节中引用 `references/CHAPTER-CRAFT.md` 时，追加：**

> Phase 5 composition HTML 中的动画与 Phase 2 章节 React 组件的动画是**两套独立的实现**：
> React 组件的 CSS transition/animation 只用于 dev server 预览；
> HyperFrames composition 的 GSAP timeline 才是渲染 MP4 的实际动画。
> 两者视觉上应一致（同一主题色板），但代码互不依赖。