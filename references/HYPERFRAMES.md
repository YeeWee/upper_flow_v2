# HyperFrames 渲染（Phase 5）

将 web-video-presentation 的 React 项目渲染成 MP4 视频文件。

Web 演示 → HyperFrames composition HTML → `output.mp4`

---

## 前置依赖（一次性）

HyperFrames 渲染需要以下工具链。Windows 上这些全部在本 `skill` 目录下安装过即可复用。

### 必须

| 工具 | 用途 | Windows 最低要求 |
|------|------|------------------|
| **Node.js** | 运行 HyperFrames CLI | v18+，`C:\Program Files\nodejs\` |
| **FFmpeg** | 编码 MP4 | 任意安装路径，需在 PATH 中 |
| **HyperFrames CLI** | 核心渲染引擎 | 从 [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) 构建 |
| **Kokoro-ONNX TTS** | 中文语音合成 | Python 包 `kokoro-onnx` + `misaki[zh]` |

### 可选

| 工具 | 用途 |
|------|------|
| **Edge TTS** | 备用 TTS（`pip install edge-tts`，需联网） |
| **bun / pnpm** | 构建 HyperFrames CLI 时的包管理器 |

---

## HyperFrames CLI 构建

```bash
# 1. 克隆源码
git clone https://github.com/heygen-com/hyperframes.git
cd hyperframes

# 2. 安装依赖（二选一）
pnpm install
# 或: bun install

# 3. 构建（Windows 上 build-copy.mjs 可能因中文路径 crash）
# 如果 crash → PowerShell Copy-Item 手动搬 studio dist / templates / skills / docker / docs
pnpm run --filter @hyperframes/core build
pnpm run --filter @hyperframes/cli build

# 4. 验证
node packages/cli/dist/cli.js --help
```

### Windows 中文路径已知问题

HyperFrames 的 `build-copy.mjs` 使用 `fs.cpSync`，在 Windows 上遇到中文路径（如 `动画`）会栈溢出（exit code 3221226505）。**解决方案**：核心包构建完成后，用 PowerShell 手动复制：

```powershell
$src = "packages/studio/dist"
$dst = "packages/cli/dist/studio"
# 不要用 Copy-Item -Recurse，直接用 robocopy 或逐文件搬
```

**最佳实践**：把 HyperFrames 源码放在纯 ASCII 路径下（如 `D:\hyperframes\`），避免一切中文路径问题。

---

## FFmpeg 可用性

HyperFrames CLI 通过 `child_process.execFileSync("ffmpeg", ...)` 调用 FFmpeg。**Node.js 进程内的 PATH 必须包含 FFmpeg 所在目录**。

### Windows 验证

```powershell
# 在终端里验证
ffmpeg -version | Select-Object -First 1

# 在 Node.js 里验证
node -e "require('child_process').execFileSync('ffmpeg', ['-version']); console.log('OK')"
```

如果终端能找到但 Node.js 找不到，把 `ffmpeg.exe` 复制到 `C:\Program Files\nodejs\` 或放入系统 PATH 用户变量。

---

## Kokoro TTS 音频合成

### 模型文件（首次使用需下载，约 340MB）

```
%USERPROFILE%\.cache\hyperframes\tts\models\kokoro-v1.0.onnx   (311 MB)
%USERPROFILE%\.cache\hyperframes\tts\voices\voices-v1.0.bin    (27 MB)
```

下载地址：
- https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
- https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

### Python 依赖

```bash
pip install kokoro-onnx misaki[zh] soundfile numpy
```

### 合成脚本

从所有章节的 `narrations.ts` 提取文本 → 逐个合成 WAV → 放入 `presentation/public/audio/<chapter>/`。

```python
import os
import soundfile as sf
from kokoro_onnx import Kokoro
from misaki import zh

model_path = os.path.join(os.environ["USERPROFILE"], ".cache", "hyperframes", "tts", "models", "kokoro-v1.0.onnx")
voices_path = os.path.join(os.environ["USERPROFILE"], ".cache", "hyperframes", "tts", "voices", "voices-v1.0.bin")

kokoro = Kokoro(model_path, voices_path)
g2p = zh.ZHG2P()

texts = [...]  # 从 narrations.ts 提取
voice = "zf_xiaoxiao"  # 4 个中文女声推荐这个（最清晰标准）

for i, text in enumerate(texts):
    phonemes, _ = g2p(text)
    samples, sr = kokoro.create(phonemes, voice=voice, is_phonemes=True, trim=False)
    sf.write(f"public/audio/{chapter}/{i+1}.wav", samples, sr)
```

### Kokoro 中文音色推荐

| 音色 | 特点 |
|------|------|
| `zf_xiaoxiao` ★ | 最清晰标准，接近专业配音 |
| `zf_xiaobei` | 年轻活泼 |
| `zf_xiaoni` | 温柔低音 |
| `zf_xiaoyi` | 中性平稳 |

---

## HyperFrames Composition HTML 构建

详细规范见 [`references/COMPOSITION.md`](COMPOSITION.md)。核心要点：

### 项目结构

```
my-video/
├── presentation/          # React 项目（Phase 2 产出）
│   └── public/audio/      # TTS 音频（Phase 3 产出）
├── hyperframes-project/   # HyperFrames 合成目录（Phase 5 创建）
│   ├── index.html         # 核心：composition HTML（手动/半自动构建）
│   └── audio/             # 音频的符号链接或副本
└── output.mp4             # 最终渲染产物
```

### Composition HTML 三要素

1. **日期元数据**：`<meta name="generator" content="hyperframes">` + GSAP CDN
2. **22+ 个 `<div class="clip">`**：每个 step 一个全屏容器，`id="clip-{N}"`
3. **22 个 `<audio>`**：`data-start="{秒}"` + `src="audio/{chapter}/{N}.wav"`
4. **GSAP Timeline**：控制 clip 切换、元素动画、**字幕条文字更新**

### 字幕条（必须）

```css
.subtitle-bar {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  background: rgba(253,251,247,0.92); backdrop-filter: blur(16px);
  border-top: 1px solid var(--rule);
  padding: 14px 48px; border-radius: 24px 24px 0 0;
  font-size: 20px; color: var(--text); text-align: center;
  max-width: 1200px; z-index: 100;
}
```

GSAP timeline 中每个 step 用 `.call()` 更新字幕：

```javascript
.call(() => {
  document.querySelector(".subtitle-bar__text").textContent = "当前口播文案...";
}, null, startTime);
```

### 颜色体系

必须使用 warm-keynote 暖色调（或所选主题的色板）。**禁止**纯黑背景、纯红标记。

### 缓动曲线

全部使用 **power4** 级别缓动：

```javascript
ease: "power4.out"       // 入场
ease: "power4.inOut"     // 过渡
```

---

## 渲染命令

```bash
cd <hyperframes-clone>
node packages/cli/dist/cli.js render \
  "<项目>/hyperframes-project" \
  -o "<项目>/output.mp4" \
  --fps 30
```

### 渲染阶段

| 进度 | 做了什么 | 耗时（参考） |
|------|----------|------------|
| 5% | 编译 HTML、拉取字体、内联 CDN 脚本 | ~10s |
| 10% | 提取音频轨道、处理 SDR 源 | ~5s |
| 25~70% | **逐帧捕获**（4110 帧 @ 137s） | 最长，6 worker 并行 |
| 75~90% | FFmpeg 编码视频 | ~30s |
| 100% | 封装 MP4 | ~5s |

典型耗时：137 秒视频约 3~5 分钟（取决于 CPU 核数和 GPU）。

### 首次渲染额外耗时

- 下载 Chrome（~101MB） — 仅一次，缓存到 `%LOCALAPPDATA%\hyperframes\`
- 下载 Google Fonts（Inter / Noto Sans SC）— 仅一次，缓存到 `%USERPROFILE%\.cache\hyperframes\fonts\`

### 输出文件解读

```
output.mp4: 1920×1080 30fps H.264 + AAC, ~8MB/分钟
```

---

## 常见问题

### "ffmpeg not found"

HyperFrames CLI 内部通过 Node.js 的 `child_process.execFileSync` 调 FFmpeg。必须在 Node.js 进程的 PATH 中找到。

**修复**：
1. `Copy-Item ffmpeg.exe C:\Program Files\nodejs\ -Force`（最简单）
2. 或确保 FFmpeg 在机器级 PATH 中且重新打开终端

### "AudioContext was not allowed to start"

无头 Chrome 的 Web Audio API 限制。**不影响渲染**——HyperFrames 走音频轨道合成，不依赖 Web Audio。

### "media_missing_id" lint

`<audio>` 缺少 `id` 属性。**render 会静音该音频**。必须给每个 `<audio>` 加唯一 `id`。

### Google Fonts 下载慢/失败

Composition 中 `<link href="fonts.googleapis.com">` 需要联网。如果离线：
1. 首次联网渲染一次（字体缓存到 `%USERPROFILE%\.cache\hyperframes\fonts\`）
2. 后续渲染直接用缓存，无需联网

### composition HTML 文件过大

单个 HTML 超过 500 行时 HyperFrames 会警告。对于 22 步的视频这是正常的——警告可以忽略，不影响渲染。

---

## 与 Phase 4（录屏）的关系

| | Phase 4 录屏 | Phase 5 HyperFrames |
|---|---|---|
| 输出格式 | 屏幕录像（需后期） | MP4 视频文件（直接可用） |
| 音频同步 | 手动对齐 | 天然精确同步 |
| 画质 | 取决于录屏软件 + 屏幕分辨率 | 1920×1080 无损 |
| 适合 | 快速预览、演示 | 最终交付、分发 |
| 依赖 | OBS / 系统录屏 | HyperFrames + FFmpeg |

**建议**：开发阶段用 Phase 4 录屏快速验证；最终产出走 Phase 5 HyperFrames 渲染。