#!/usr/bin/env python3
"""Kokoro-ONNX 中文合成后端（由 `avp tts --backend kokoro` 调用）。

- 输入：纯文本文件（避免命令行转义问题）
- 输出：24kHz 单声道 PCM16 WAV
- 依赖：kokoro-onnx + misaki[zh] + soundfile
- 模型默认读 HyperFrames 缓存；可用 KOKORO_MODEL / KOKORO_VOICES 覆盖。

stdout 只输出一行 JSON（供调用方解析），日志一律走 stderr。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

DEFAULT_MODEL = "~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx"
DEFAULT_VOICES = "~/.cache/hyperframes/tts/voices/voices-v1.0.bin"


def fail(message: str, code: int = 1) -> "NoReturn":  # noqa: F821
    print(f"kokoro_tts: {message}", file=sys.stderr)
    raise SystemExit(code)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Kokoro-ONNX Chinese TTS")
    parser.add_argument("--text-file", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--voice", default="zf_xiaoxiao")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--model", default=os.environ.get("KOKORO_MODEL", DEFAULT_MODEL))
    parser.add_argument("--voices", default=os.environ.get("KOKORO_VOICES", DEFAULT_VOICES))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    text = Path(args.text_file).read_text(encoding="utf8").strip()
    if not text:
        fail("empty text (silent beats are skipped by the CLI)")

    model = Path(args.model).expanduser()
    voices = Path(args.voices).expanduser()
    for path in (model, voices):
        if not path.is_file():
            fail(
                f"missing model file: {path}\n"
                "download: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0"
            )

    try:
        from kokoro_onnx import Kokoro
        from misaki import zh
        import soundfile as sf
    except ImportError as err:
        fail(
            f"missing Python dependency: {err}\n"
            "install: uv pip install kokoro-onnx soundfile 'misaki[zh]'"
        )

    g2p = zh.ZHG2P()
    phonemes, _ = g2p(text)
    if not phonemes:
        fail("grapheme-to-phoneme produced no phonemes")

    kokoro = Kokoro(str(model), str(voices))
    samples, sample_rate = kokoro.create(
        phonemes, voice=args.voice, speed=args.speed, is_phonemes=True, trim=False
    )

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out), samples, sample_rate, subtype="PCM_16")

    print(
        json.dumps(
            {
                "ok": True,
                "path": str(out),
                "voice": args.voice,
                "speed": args.speed,
                "sampleRate": sample_rate,
                "durationMs": round(len(samples) / sample_rate * 1000),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
