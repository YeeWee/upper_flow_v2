# 音频合成（TTS）

`avp tts` 把 `beats.json` 里每一拍的 `say` 合成成音频，**用实测时长回写
beats**。音频是时间的真相：分镜、timecode、check、render 都读这份实测值，
不读字数估算。

> **真相源链**：`narrations.ts` → `script.md` 校验 → `beats.json`（含 `audio`
> 路径与 `durationMs`）→ `avp tts` 落音频并回写 `durationMs`。`outline.md`
> 不参与音频合成；`caption` 只服务画面字幕，不送 TTS。

---

## 一条命令

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

安装（Apple Silicon 示例）：

```bash
uv venv .venv --python python3.11
uv pip install --python .venv/bin/python kokoro-onnx soundfile 'misaki[zh]'
export AVP_PYTHON="$PWD/.venv/bin/python"
```

### fake（快速通道）

`"backend": "fake"` 写一段等长静音 WAV，时长 = `max(700ms, 字数 × 220ms ÷
speed)`。用于流水线 / 测试 / 没有模型的本机；产出的 `beats.json` 结构与
kokoro 完全一致，之后把 backend 改回 kokoro 再跑 `avp tts` 即可。

> `fake` 不是"假装成功"：它明确写进 `tts.json` 与 `.avp/tts.json`，`status`
> 照常显示，渲染不出来是渲染层的事。

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
4. TTS 进程隔离：一次一拍，失败带 beat id 与 stderr 尾部，方便重跑。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `tts-python-missing` | 按提示建 venv 装 `kokoro-onnx soundfile 'misaki[zh]'`，或 `AVP_PYTHON=...` |
| `tts-synthesis-failed` | 看 stderr 尾部；常见是模型未缓存 / 文本含控制字符 |
| `speed-out-of-range` | 把 `tts.json` 的有效语速调回 0.95–1.05 |
| `tts-backend-unknown` | `backend` 只认 `kokoro` / `fake` |
| `tts-chapter-unknown` | `chapters` 里写了不存在的章节 id |
| `tts.json` 改了但 status 仍"最新" | status 读的是输入哈希；改配置后应先重跑 `avp tts` |
| 演示里没声音 | 确认 `presentation/public/audio/<chapter>/<N>.wav` 存在；`?auto=1` 需先按一次空格 |
| 想跳过批准停点 | 不行：`--after-plan` 会核对批准哈希；改稿后要重新 `avp plan --approve` |
