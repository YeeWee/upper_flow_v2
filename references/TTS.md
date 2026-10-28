# TTS（音频合成）

`avp tts` 把 `beats.json` 里每一拍的 `say` 合成成音频，**用实测时长回写
beats**。音频是时间的真相：分镜、timecode、check、render 都读这份实测值，
不读字数估算。

> **真相源链**：`narrations.ts` → `script.md` 校验 → `beats.json`（含 `audio`
> 路径与 `durationMs`）→ `avp tts` 落音频并回写 `durationMs`。`outline.md`
> 不参与音频合成；`caption` 只服务画面字幕，不送 TTS。

---

## 命令面

```bash
avp tts                 # 合成所有缺音频的拍
avp tts --chapter=02    # 只重合成一章
avp tts --after-plan    # 要求当前稿子仍是被批准的那一版
avp status              # 看 tts 这一步是 待办 / 过期 / 最新
```

产物：

| 路径 | 作用 |
|---|---|
| `audio/<chapter>/<step>.wav` | 合成稿与演示共用的音频（24kHz PCM16 mono） |
| `.avp/tts.json` | 回执：每拍哈希 / 音频 sha256 / 实测时长 / 音色 / 语速 |
| `.avp/tts-cache.json` | 按内容寻址的缓存，换稿 / 换后端才失效 |
| `presentation/public/audio/...` | 演示 `?auto=1` 直接读的副本 |
| `beats.json` | `durationMs` 与 `tts { backend, voice, speed, hash }` 被回写 |

`avp tts` 是**幂等**的：`say / backend / voice / speed` 没变就命中缓存，
不重复调用模型；音频文件被删或内容被改（sha256 对不上）会重新合成。

---

## 后端契约

`tts.json` 里 **backend 是必填**的，因为音色 id 是后端作用域内的：
`zf_xiaoxiao` 只在 Kokoro 里成立，换后端不能默认沿用。

```json
{
  "schemaVersion": 1,
  "backend": "kokoro",
  "default": { "voice": "zf_xiaoxiao", "speed": 1.0 },
  "chapters": {
    "03-data": { "speed": 1.03 },
    "05-quote": { "voice": "zf_xiaoxiao", "speed": 0.98 }
  }
}
```

### kokoro（默认，真声）

- 实现：`scripts/kokoro_tts.py` + `kokoro-onnx` + `misaki[zh]` + `soundfile`。
- 需要 Python 解释器，按顺序找：`$AVP_PYTHON` → 项目 `.venv/bin/python` →
  `python3`。找不到会报 `tts-python-missing` 并给安装命令，**不会静默降级**。
- 输出 24kHz PCM16 mono WAV；模型 / 词表缓存在
  `~/.cache/hyperframes/tts/`，首次需联网。
- 单段合成是独立进程，一拍的失败只影响这一拍。

#### 依赖安装

清单在 [`scripts/requirements-tts.txt`](../scripts/requirements-tts.txt)：
`kokoro-onnx` / `soundfile` / `misaki[zh]`，外加显式钉住的 `onnxruntime` 与
`numpy`。**Python 3.10–3.12 可装，推荐 3.12**（本清单只在 3.12.14 / macOS arm64
上验证）。`kokoro-onnx` 要求 <3.14、`misaki` 要求 <3.13，所以系统自带的新版
`python3` 很可能装不上。

```bash
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r scripts/requirements-tts.txt
export AVP_PYTHON="$PWD/.venv/bin/python"
avp tts
```

#### 模型文件（不在仓库里）

两个二进制合计 ≈ 337 MiB，**故意不入仓**：体积太大，而且就是同一份公开权重。
新机器需要联网下载一次，之后完全离线（`avp tts` 不会在合成时联网）。

| 文件 | 大小 | 默认缓存路径 |
|---|---|---|
| `kokoro-v1.0.onnx` | 325,532,387 B（≈310 MiB） | `~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx` |
| `voices-v1.0.bin` | 28,214,398 B（≈27 MiB） | `~/.cache/hyperframes/tts/voices/voices-v1.0.bin` |

下载地址：<https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0>
（取 release 里的同名 asset）。

```bash
mkdir -p ~/.cache/hyperframes/tts/models ~/.cache/hyperframes/tts/voices
curl -L -o ~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o ~/.cache/hyperframes/tts/voices/voices-v1.0.bin \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

#### 覆盖解释器与模型路径

`avp tts` 调脚本时只传文本 / 输出 / 音色 / 语速，**解释器和模型路径只由环境
变量决定**：

```bash
export AVP_PYTHON="$PWD/.venv/bin/python"          # 可选；默认找项目 .venv
export KOKORO_MODEL=/shared/models/kokoro-v1.0.onnx
export KOKORO_VOICES=/shared/models/voices-v1.0.bin
avp tts --chapter=coldopen
```

直接跑脚本时同样认这三个变量（`~` 会被展开）：

```bash
printf '你把需求丢给 AI，它写代码。\n' > /tmp/t.txt
"$AVP_PYTHON" scripts/kokoro_tts.py --text-file /tmp/t.txt --out /tmp/t.wav \
  --voice zf_xiaoxiao --speed 1
```

#### 我缺什么？

| 症状 | 缺什么 / 怎么修 |
|---|---|
| `tts-python-missing`（会列出试过的解释器） | 三个候选里没有一个能 import 那三个包；按清单装，或用 `AVP_PYTHON` 指向装好的解释器 |
| 脚本 stderr：`missing Python dependency: No module named 'kokoro_onnx'` | 依赖装到了别的解释器；用 `--python "$AVP_PYTHON"` 重装 |
| 脚本 stderr：`missing model file: …`（并打印下载地址） | 模型文件不在该路径；见上一节，或设 `KOKORO_MODEL` / `KOKORO_VOICES` |
| 安装报 `no matching distribution`，或 import 时 `onnxruntime` 崩 | Python 版本或 CPU 架构不对：要 3.10–3.12 的 arm64 / x86_64 解释器 |
| 脚本 stderr：`grapheme-to-phoneme produced no phonemes` | 文本问题（纯符号 / 空白），不是环境问题 |
| 下载中断 / 存成网页 | 文件明显小于上表的字节数；下面这个脚本会报"只有 N 字节" |

一次查完（只读、不联网，退出码 0 = 就绪）：

```bash
bash scripts/check-tts-env.sh
```

#### 验收：重建夹具那 22 条 wav

```bash
cd examples/trae-harness
avp tts        # avp = 仓库根目录的 ./avp；环境变量按上一节设置
```

判据：22 条 wav 全部重新落盘，且与仓库里的同名文件**逐字节相同**。最快的锚点
是 `audio/coldopen/1.wav`：3.350s / 24kHz / PCM16 / mono，sha256
`db2d5c29a383a712a295a0588134f7ce33955542ed48d96fa3283be08f1984b4`。语速、音色、
模型任一不同哈希就会变——这正是"可归因"的用法。

### fake（快速通道）

`"backend": "fake"` 写一段等长静音 WAV，时长 = `max(700ms, 字数 × 220ms ÷
speed)`。用于流水线 / 测试 / 没有模型的本机；产出的 `beats.json` 结构与
kokoro 完全一致，之后把 backend 改回 kokoro 再跑 `avp tts` 即可。

> **`fake` 产出的是静音占位，不能替代真声成片**。它是全零采样，不是低音量
> 的真声；用它跑通的片子没有口播。`fake` 只验证流水线（时长、字幕、渲染
> 同步），最终成片必须换回 `kokoro` 重跑 `avp tts`。`tts.json` 与
> `.avp/tts.json` 会记下 `backend: fake`，事后可追溯。

---

## 语速边界

每拍的有效语速必须在 **0.95–1.05**（含）。超出直接报
`speed-out-of-range`，并指出 beat id / chapter。

- 这个区间是"同一个人念快/念慢一点"，不是"换一个人"；
- 节奏问题优先拆句、改稿、加静音拍，不要靠 1.3 倍速硬压；
- 章节覆盖 `chapters.<id>` 只能覆盖真实存在的章节，否则
  `tts-chapter-unknown`。

## 音色混用

`chapters.<id>.voice` 可以换音色（访谈、引语）。只要与 `default.voice`
不同，`avp tts` 会在输出里给 warning：这是导演选择，必须是有意的，不能
因为配置手滑悄悄变成两个人声。

---

## 静音拍与尾隙

- `say: ""` 的拍不合成、不占 TTS 调用；`durationMs` 固定 **1500ms** 供
  渲染，`tts: null`。
- 有声拍写回 `实测时长 + 300ms` 尾隙。尾隙让 Auto 模式不切得太急；渲染
  仍以 `beats.json` 的 `durationMs` 为准。
- `--chapter` 只重合成指定章；其它章保留旧值。全部有音频时 `status` 的
  tts 才是"最新"，否则保持"待办/过期"。

---

## 可复现性

1. **缓存键** = `sha256(say + backend + voice + speed + schemaVersion)`。
   改一个标点也会重合成；只改别的拍的 caption 不会。
2. **回执**记录每个音频文件的 sha256 与实测时长；`avp check` 用它判断
   音频是否被替换。
3. **渲染前不查网**：kokoro 的模型必须已经在缓存里；缺模型时命令报错，
   不会边渲染边下载。
4. **模型缓存不入仓**：`~/.cache/hyperframes/tts/` 下的两个二进制只下载一次，
   git 里只存合成后的 wav（夹具那 22 条）与 sha256 回执。换机器时按
   「模型文件」一节重新下载即可。
5. **依赖钉版本**：`scripts/requirements-tts.txt` 里的 pin 与验证环境一致；
   依赖漂移会改变输出，等同换了一个后端。
6. TTS 进程隔离：一次一拍，失败带 beat id 与 stderr 尾部，方便重跑。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `tts-python-missing` | 按 `scripts/requirements-tts.txt` 装依赖，或 `AVP_PYTHON=...` 指向装好的解释器 |
| `tts-synthesis-failed` | 看 stderr 尾部；常见是模型未缓存（`missing model file`）/ 下载不完整 / 文本含控制字符 |
| 模型报"missing model file" | 按「模型文件」一节下载到默认缓存，或设 `KOKORO_MODEL` / `KOKORO_VOICES` |
| 装依赖报 `no matching distribution` | Python 不在 3.10–3.12，或不是本机架构的 wheel；换 `uv venv --python 3.12` 的 arm64 / x86_64 解释器 |
| 分不清缺包还是缺模型 | 跑 `bash scripts/check-tts-env.sh`，它分开报这两项 |
| `speed-out-of-range` | 把 `tts.json` 的有效语速调回 0.95–1.05 |
| `tts-backend-unknown` | `backend` 只认 `kokoro` / `fake` |
| `tts-chapter-unknown` | `chapters` 里写了不存在的章节 id |
| `tts.json` 改了但 status 仍"最新" | status 读的是输入哈希；改配置后应先重跑 `avp tts` |
| 演示里没声音 | 确认 `presentation/public/audio/<chapter>/<N>.wav` 存在；`?auto=1` 需先按一次空格 |
| 想跳过批准停点 | 不行：`--after-plan` 会核对批准哈希；改稿后要重新 `avp plan --approve` |
