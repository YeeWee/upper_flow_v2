#!/usr/bin/env bash
# 诊断 Kokoro 离线合成环境：解释器 / 依赖包 / 模型文件。
#
# 只读、不联网、不改任何东西。退出码 0 = 可以合成，1 = 有东西缺。
#
#   bash scripts/check-tts-env.sh
#   AVP_PYTHON=/tmp/avp-tts-clean/bin/python bash scripts/check-tts-env.sh
#
# 说明见 references/TTS.md「kokoro（默认，真声）」。

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_MODEL="~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx"
DEFAULT_VOICES="~/.cache/hyperframes/tts/voices/voices-v1.0.bin"
MODEL="${KOKORO_MODEL:-$DEFAULT_MODEL}"
VOICES="${KOKORO_VOICES:-$DEFAULT_VOICES}"
FAILED=0

fail() { printf '  ✗ %s\n' "$1"; FAILED=1; }
pass() { printf '  ✓ %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }

expand() {
  # `~` 不会被变量赋值展开；交给 shell 再展开一次。
  eval printf '%s' "$1"
}

echo "Kokoro TTS 环境检查"
echo

# --- 解释器 ---------------------------------------------------------------
echo "[1/3] Python 解释器"
CANDIDATES=()
[ -n "${AVP_PYTHON:-}" ] && CANDIDATES+=("$AVP_PYTHON")
[ -x "$ROOT/.venv/bin/python" ] && CANDIDATES+=("$ROOT/.venv/bin/python")
command -v python3 >/dev/null 2>&1 && CANDIDATES+=("$(command -v python3)")

PYTHON=""
for candidate in ${CANDIDATES[@]+"${CANDIDATES[@]}"}; do
  if ! command -v "$candidate" >/dev/null 2>&1; then
    info "跳过不存在的路径：$candidate"
    continue
  fi
  version="$("$candidate" -c 'import sys; print("%d.%d.%d" % sys.version_info[:3])' 2>/dev/null)"
  if [ -z "$version" ]; then
    info "跳过跑不起来的解释器：$candidate"
    continue
  fi
  imports="$("$candidate" -c 'import kokoro_onnx, misaki, soundfile' 2>&1)"
  status=$?
  if [ "$status" -ne 0 ]; then
    info "${candidate}（Python ${version}）缺依赖：$(printf '%s' "$imports" | tail -1)"
    continue
  fi
  PYTHON="$candidate"
  pass "${candidate}（Python ${version}，kokoro_onnx / misaki / soundfile 均可 import）"
  case "$version" in
    3.10.*|3.11.*|3.12.*) ;;
    *) info "警告：清单验证范围是 3.10–3.12；这个版本能 import 但未经验证。" ;;
  esac
  break
done

if [ -z "$PYTHON" ]; then
  fail "没有可用的解释器。装依赖（Python 3.10–3.12）："
  info "uv venv .venv --python 3.12"
  info "uv pip install --python .venv/bin/python -r scripts/requirements-tts.txt"
  info "export AVP_PYTHON=\"$ROOT/.venv/bin/python\""
  info "症状：avp tts 会先报 tts-python-missing，合成根本不会开始。"
fi

# --- 模型文件 -------------------------------------------------------------
echo
echo "[2/3] 模型文件（不在仓库里，需联网下载一次）"
check_model() {
  label="$1"; path="$2"; min_bytes="$3"
  real="$(expand "$path")"
  if [ ! -f "$real" ]; then
    fail "$label 不存在：$real"
    info "下载：https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0"
    return
  fi
  bytes="$(wc -c <"$real" | tr -d ' ')"
  if [ "$bytes" -lt "$min_bytes" ]; then
    fail "$label 只有 $bytes 字节，像是下载中断 / 存成了网页错误页：$real"
    return
  fi
  pass "${label}（$bytes 字节）：$real"
}
check_model "kokoro-v1.0.onnx" "$MODEL" 300000000
check_model "voices-v1.0.bin" "$VOICES" 20000000

# --- 合成契约 -------------------------------------------------------------
echo
echo "[3/3] 输出契约"
pass "脚本会写 24kHz PCM16 mono WAV（单段独立进程）"
info "默认缓存：~/.cache/hyperframes/tts/{models,voices}/"
if [ -n "${KOKORO_MODEL:-}${KOKORO_VOICES:-}" ]; then
  info "已用环境变量覆盖模型路径（KOKORO_MODEL / KOKORO_VOICES）"
fi

echo
if [ "$FAILED" -ne 0 ]; then
  echo "结论：还缺东西，先按上面的提示补；合成前不会自动下载模型。"
  exit 1
fi
echo "结论：就绪。可以跑 avp tts。"
