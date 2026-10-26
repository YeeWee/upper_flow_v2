# 渲染链

`avp render` 把合成稿渲染成成片，并留下可归因的回执、联系表与静帧报告。
渲染前**强制**过 `avp check`：有 error 就拒绝，不会先渲了再说。

---

## 两道命令

```bash
avp render --brief   # 渲染闸简报：check 结论 / 时长表 / 3 张缩略图，不产片
avp render           # 真渲染：mp4 + 回执 + 联系表 + 静帧报告
avp render --after-plan  # 额外核对当前稿子仍是被批准的版本
```

`render` 会先幂等执行一次 `compose`（合成稿是可重建派生物），再跑
`check`。任何 error → `check-failed`，退出码 1，不产生 `output/output.mp4`。

---

## 产物

| 路径 | 内容 |
|---|---|
| `output/output.mp4` | 成片：1920×1080 / 30fps / H.264 + AAC，字幕已烧录 |
| `output/receipt.json` | 渲染回执（见下） |
| `output/contact-sheet.png` | 联系表：每拍 2 帧（入场后 / 驻留末），6 列 |
| `output/still-report.json` | 静帧报告：每拍两帧的 SSIM / 差异百分比，只报不拦 |
| `output/brief/thumb-*.png` | 渲染闸的 3 张缩略图（brief 产物） |
| `output/frames/` | 联系表原始帧（可删） |

### 联系表

- 每拍抽两帧：`start + 0.2s`（入场后）与 `start + duration − 0.2s`（驻留末）。
- 22 拍 = 44 帧，`6` 列，行数 `ceil(44/6)=8`。
- 帧按 `00-<beat>-entry.png`、`01-<beat>-dwell.png` 命名，顺序稳定。
- 它是烧录字幕的校对面：字幕看不清/被裁，先看这里。

### 静帧报告

同一拍两帧用 FFmpeg `ssim` 比较；**差异 < 0.1%** 记为 `static`。
这是启发式，`report` 级别，**永不阻断渲染**——刻意的静止是手法。
阻断条件只留给机械问题：音频缺失、字幕超宽、`check` 失败。

---

## 回执

`output/receipt.json`（schemaVersion 1）包含：

```jsonc
{
  "schemaVersion": 1,
  "renderedAt": "…",
  "skill": { "name": "article-video-production", "version": "0.1.0", "commit": "…" },
  "hashes": {
    "beats": "…", "tts": "…", "check": "…",
    "composition": "…", "themeTokens": "…"
  },
  "toolchain": { "ffmpeg": "9.0.2", "hyperframes": "0.8.33", "chromium": "152.0.7977.30" },
  "audio": [{ "beat": "coldopen-1", "file": "audio/coldopen/1.wav", "sha256": "…" }],
  "output": {
    "file": "output/output.mp4", "sha256": "…",
    "durationMs": 131100, "width": 1920, "height": 1080,
    "fps": 30, "videoCodec": "h264", "audioCodec": "aac"
  },
  "contactSheet": { "file": "output/contact-sheet.png", "sha256": "…", "frames": 44, "columns": 6, "rows": 8 },
  "stillReport": { "file": "output/still-report.json", "sha256": "…", "staticBeats": ["coldopen-4"] }
}
```

「再渲一次为什么不一样」可以逐层定位：先比 `hashes.*`，再比
`toolchain.*`，最后比 `audio[].sha256` 与 `output.sha256`。

---

## 渲染器与确定性

- 固定 `hyperframes@0.8.33`，调用
  `hyperframes render <composition> --output … --fps 30 --no-best-effort --quality standard`。
- `--no-best-effort`：缺音频时**硬失败**，不会偷偷输出无声视频。
- Chrome 由 HyperFrames 自带缓存（`~/.cache/hyperframes/chrome/`）；渲染前
  不下载、不联网解析字体（字体注入走确定性映射）。
- 合成稿只允许 seek-safe 动效：`repeat: -1`、`rAF`、`Date.now()`、定时器
  在 `compose` 阶段就被拒绝。同一输入两次渲染的时长与帧数应一致。
- 渲染失败、分辨率/帧率/编码不符合 DoD、音频轨缺失 → 命令报错并给尾部
  日志；不会写「成功」回执。

### 快速通道（测试 / 无 GPU 环境）

`AVP_FAKE_RENDER=1` 用 FFmpeg 生成一段同长的占位视频（320×180，含 AAC），
并走同一套回执 / 联系表 / 静帧代码。它**不**做 1080p 校验，只是让快车道
在秒级验证结构；真实验收必须去掉这个环境变量。

---

## 环境与平台

| 依赖 | 要求 |
|---|---|
| Node.js | ≥ 22（本 skill 在 26.3.0 验证） |
| FFmpeg / ffprobe | PATH 中可用；本 skill 在 9.0.2 验证。无 `drawtext`/`subtitles` 也能渲——字幕是 HTML，不是 FFmpeg 滤镜 |
| HyperFrames | skill 固定 `0.8.33`（devDependency），不要 clone 上游源码自己 build |
| Chromium | 首次 `hyperframes browser path` 会给出缓存路径；之后离线可用 |
| 字体 | 走主题注入；不依赖 Google Fonts 在线拉取 |

### Windows 中文路径

HyperFrames 旧版的 `fs.cpSync` 在中文路径下可能栈溢出。本 skill 不再要求
clone 上游，因此不会触发构建期复制；若自行安装 HyperFrames，把它放到
纯 ASCII 路径（如 `D:\hyperframes\`）。项目路径含中文时，`avp` 内部统一
用 `path.join`，但交给 Chromium 的 `file://` URL 会做编码，不要在
`composition/` 里写死含空格的相对路径。

### 首次渲染的下载

Chrome 与字体只在第一次下载，缓存在 `~/.cache/hyperframes/`（Windows 为
`%LOCALAPPDATA%\hyperframes\`）。断网后只要缓存完整仍可渲染；缺缓存时
`render` 会报错，不会静默产出无声/无字体的片子。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `check-failed` | 按 `avp check --json` 的 findings 修；不要绕过渲染闸 |
| `render-failed` | 看 stderr 尾部；常见是合成稿 JS 报错 / Chromium 缓存损坏 |
| `render-invalid`：分辨率或编码不对 | 检查合成稿 `data-width/data-height` 与 HyperFrames 版本 |
| 成片没有声音 | 合成稿每个 `<audio>` 必须有唯一 `id`；`compose` 已生成，若手改过则重跑 |
| 音画错位 | 看 `beats.json` 的 `audio` 路径与 `durationMs`；路径错位在 `check` 就会被抓 |
| 联系表某拍是黑帧 | 该拍身体为空 / clip 没显示 / 音频时长为 0 |
| 两次渲染不一致 | 先比回执哈希；若 `check`/`beats` 没变，检查钩子里是否混入时钟/随机数 |
| 想快速跑测试 | `AVP_FAKE_RENDER=1 avp render` |
