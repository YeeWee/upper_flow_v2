import { spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fakeDurationMs, probeDurationMs, sha256File, writeSilentWav } from "./audio";
import { readBeats } from "./beats";
import type { BeatTts, BeatsManifest } from "./beats";
import { AvpError } from "./errors";
import { ensureDir, pathExists, readJson, writeJson } from "./fs";
import { sha256 } from "./hash";
import type { ProjectLedger, ProjectPaths, TtsConfig } from "./project";
import { readTtsConfig } from "./project";
import { inputHashFor } from "./status";
import { recordStep } from "./state";
import { SKILL_ROOT } from "./skill";

/** 缓存键 / 回执哈希的 schema 大版本；改合成契约时一起 bump。 */
export const TTS_SCHEMA_VERSION = 1;
/** 实测时长之后留的尾隙：让 Auto 模式不切得太急。 */
export const TTS_TAIL_MS = 300;
/** 静音拍没有音频，给一个可渲染的固定时长。 */
export const SILENT_BEAT_MS = 1500;

/** 语速区间：超出范围是换了个人在念，不是节奏。 */
export const SPEED_MIN = 0.95;
export const SPEED_MAX = 1.05;

export interface TtsManifestEntry {
  hash: string | null;
  path: string | null;
  sha256: string | null;
  durationMs: number;
  voice: string | null;
  speed: number | null;
  silent: boolean;
}

export interface TtsManifest {
  schemaVersion: 1;
  backend: string;
  totalDurationMs: number;
  beats: Record<string, TtsManifestEntry>;
}

interface CacheEntry {
  file: string;
  sha256: string;
  durationMs: number;
  backend: string;
  voice: string;
  speed: number;
}

interface CacheFile {
  schemaVersion: 1;
  entries: Record<string, CacheEntry>;
}

export interface TtsOptions {
  chapter?: string;
  afterPlan?: boolean;
}

export interface TtsResult {
  synthesized: number;
  cached: number;
  silent: number;
  complete: boolean;
  totalDurationMs: number;
  warnings: string[];
}

/** 缓存键 = hash(say + backend + voice + speed + schemaVersion)。 */
export function ttsCacheKey(input: {
  say: string;
  backend: string;
  voice: string;
  speed: number;
}): string {
  return sha256(
    [
      input.say,
      input.backend,
      input.voice,
      input.speed.toFixed(4),
      String(TTS_SCHEMA_VERSION),
    ].join("\u0000"),
  );
}

function validateConfig(config: TtsConfig, manifest: BeatsManifest): void {
  if (config.backend === "qwen") {
    assertQwenConfig(config);
  } else if (config.backend !== "kokoro" && config.backend !== "fake") {
    throw new AvpError(
      "tts-backend-unknown",
      `未知 TTS 后端「${config.backend}」；只认识 kokoro / qwen / fake。` +
        `\n音色 id 是后端作用域内的，因此后端必须显式写进 tts.json。`,
      { field: "backend", backend: config.backend },
    );
  }
  if (
    typeof config.default?.voice !== "string" ||
    !config.default.voice ||
    typeof config.default?.speed !== "number"
  ) {
    throw new AvpError(
      "tts-config-invalid",
      `tts.json 缺少 default.voice / default.speed。`,
      { field: "default" },
    );
  }

  const chapters = new Set(manifest.beats.map((beat) => beat.chapter));
  for (const chapter of Object.keys(config.chapters ?? {})) {
    if (!chapters.has(chapter)) {
      throw new AvpError(
        "tts-chapter-unknown",
        `tts.json 的 chapters 覆盖了一个不存在的章节「${chapter}」。` +
          `\n现有章节：${[...chapters].join(", ")}`,
        { chapter, field: "chapters" },
      );
    }
  }

  for (const beat of manifest.beats) {
    const { speed } = resolveVoiceSpeed(config, beat.chapter);
    if (!Number.isFinite(speed) || speed < SPEED_MIN || speed > SPEED_MAX) {
      throw new AvpError(
        "speed-out-of-range",
        `节拍 ${beat.id} 的语速 ${String(speed)} 越界：只允许 ${SPEED_MIN}–${SPEED_MAX}。` +
          `\n超出范围是换了个人在念，不是节奏；回到区间内再合成。`,
        {
          beatId: beat.id,
          chapter: beat.chapter,
          field: "speed",
          speed,
          min: SPEED_MIN,
          max: SPEED_MAX,
        },
      );
    }
  }
}

function resolveVoiceSpeed(
  config: TtsConfig,
  chapter: string,
): { voice: string; speed: number } {
  const override = config.chapters?.[chapter];
  return {
    voice: override?.voice ?? config.default.voice,
    speed: override?.speed ?? config.default.speed,
  };
}

function findKokoroPython(root: string): string {
  const candidates = [
    process.env.AVP_PYTHON,
    join(root, ".venv", "bin", "python"),
    "python3",
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const probe = spawnSync(
      candidate,
      ["-c", "import kokoro_onnx, misaki, soundfile"],
      { encoding: "utf8", stdio: ["ignore", "ignore", "ignore"] },
    );
    if (!probe.error && probe.status === 0) return candidate;
  }

  throw new AvpError(
    "tts-python-missing",
    `跑 Kokoro 需要一个装了 kokoro-onnx / misaki[zh] / soundfile 的 Python。` +
      `\n试过：${candidates.join(", ")}` +
      `\n安装（uv 示例）：` +
      `\n  uv venv .venv --python python3.11` +
      `\n  uv pip install --python .venv/bin/python kokoro-onnx soundfile 'misaki[zh]'` +
      `\n或用 AVP_PYTHON 指向已有的 arm64 Python。`,
    { candidates },
  );
}

function synthesizeKokoro(
  root: string,
  text: string,
  voice: string,
  speed: number,
  outPath: string,
  beatId: string,
): void {
  const python = findKokoroPython(root);
  ensureDir(join(root, ".avp", "tmp"));
  const textPath = join(root, ".avp", "tmp", `${beatId}.txt`);
  // 文本用 UTF-8 文件传递，避免命令行转义。
  writeFileSync(textPath, text, "utf8");

  const result = spawnSync(
    python,
    [
      join(SKILL_ROOT, "scripts", "kokoro_tts.py"),
      "--text-file",
      textPath,
      "--out",
      outPath,
      "--voice",
      voice,
      "--speed",
      String(speed),
    ],
    { cwd: root, encoding: "utf8", timeout: 180_000 },
  );

  rmSync(textPath, { force: true });

  if (result.error || result.status !== 0) {
    throw new AvpError(
      "tts-synthesis-failed",
      `节拍 ${beatId} 的 Kokoro 合成失败（exit ${String(result.status)}）。` +
        `\n${(result.stderr || result.error?.message || "").trim().split("\n").slice(-6).join("\n")}`,
      { beatId, voice, speed },
    );
  }
}

function synthesize(
  root: string,
  backend: string,
  text: string,
  voice: string,
  speed: number,
  outPath: string,
  beatId: string,
): void {
  ensureDir(dirname(outPath));
  if (backend === "fake") {
    writeSilentWav(outPath, fakeDurationMs(text, speed));
    return;
  }
  if (backend === "kokoro") {
    synthesizeKokoro(root, text, voice, speed, outPath, beatId);
    return;
  }
  if (backend === "qwen") {
    synthesizeQwen(root, text, voice, outPath, beatId);
    return;
  }
  throw new AvpError(
    "tts-backend-unknown",
    `未知 TTS 后端「${backend}」。`,
    { backend },
  );
}

function qwenKeyName(config: TtsConfig): string {
  return config.http?.apiKeyEnv ?? "AVP_TTS_API_KEY";
}

/** 缺地址 / 缺密钥就早点失败，别等跑了两百拍才发现。 */
export function assertQwenConfig(config: TtsConfig): void {
  const baseUrl = config.http?.baseUrl;
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new AvpError(
      "tts-config-invalid",
      `后端 qwen 需要 tts.json 里的 http.baseUrl，例如 "http://192.168.2.10:3000"。`,
      { field: "http.baseUrl" },
    );
  }
  const envName = qwenKeyName(config);
  if (!process.env[envName]) {
    throw new AvpError(
      "tts-key-missing",
      `后端 qwen 需要 API key：请设置环境变量 ${envName}。` +
        `\n密钥不写进 tts.json（那是要进仓库的文件），只写变量名。`,
      { env: envName },
    );
  }
}

/**
 * 走 OpenAI 兼容的 /v1/audio/speech。返回的 wav 直接落盘再统一转成
 * 24k 单声道 16bit——不同后端的采样率/位深不一致，统一之后下游
 * 混音与时长测量都不用分支。
 */
/**
 * 粗估基频：24k 单声道 PCM16，取中间一段有声帧做归一化自相关，取中位数。
 * 精度到几 Hz 就够——它只用来判断"这次回来的还是不是同一个人"。
 */
export function medianF0H(file: string): number {
  const buf = readFileSync(file);
  const sr = 24000;
  const total = Math.floor((buf.length - 44) / 2);
  if (total < sr * 0.3) return 0;
  const at = (i: number): number => buf.readInt16LE(44 + i * 2) / 32768;

  let peak = 0;
  for (let i = 0; i < total; i += 7) peak = Math.max(peak, Math.abs(at(i)));
  if (peak === 0) return 0;

  // 参数与离线校验脚本保持一致，避免"客户端判合格、人耳听是另一个人"。
  const frame = Math.floor(sr * 0.04);
  const hop = Math.floor(sr * 0.03);
  const lagMin = Math.floor(sr / 400);
  const lagMax = Math.floor(sr / 70);
  const out: number[] = [];

  for (let off = 2000; off + frame + lagMax < total; off += hop) {
    let energy = 0;
    for (let i = 0; i < frame; i += 5) energy += Math.abs(at(off + i));
    if (energy / (frame / 5) < peak * 0.18) continue;

    let best = 0;
    let bestLag = 0;
    for (let lag = lagMin; lag <= lagMax; lag += 1) {
      let sum = 0;
      let e1 = 0;
      let e2 = 0;
      for (let i = 0; i + lag < frame; i += 1) {
        const a = at(off + i);
        const b = at(off + i + lag);
        sum += a * b;
        e1 += a * a;
        e2 += b * b;
      }
      const norm = sum / Math.sqrt(e1 * e2 + 1e-12);
      if (norm > best) {
        best = norm;
        bestLag = lag;
      }
    }
    if (best > 0.5 && bestLag > 0) out.push(sr / bestLag);
  }

  if (out.length === 0) return 0;
  out.sort((a, b) => a - b);
  return out[Math.floor(out.length / 2)] ?? 0;
}

/** 打一次 HTTP，落成 raw wav；失败抛错。 */
function requestQwenWav(
  root: string,
  config: TtsConfig,
  text: string,
  voice: string,
  beatId: string,
  tag: string,
): string {
  const baseUrl = (config.http?.baseUrl ?? "").replace(/\/+$/, "");
  const model = config.http?.model ?? "Qwen3-TTS";
  const key = process.env[qwenKeyName(config)] ?? "";
  ensureDir(join(root, ".avp", "tmp"));
  const bodyPath = join(root, ".avp", "tmp", `${beatId}.${tag}.json`);
  const rawPath = join(root, ".avp", "tmp", `${beatId}.${tag}.wav`);

  writeFileSync(bodyPath, JSON.stringify({ model, input: text, voice, response_format: "wav" }), "utf8");
  const result = spawnSync(
    "curl",
    ["-sS", "--max-time", "180", "-o", rawPath, "-w", "%{http_code}", "-X", "POST",
     `${baseUrl}/v1/audio/speech`, "-H", `Authorization: Bearer ${key}`,
     "-H", "Content-Type: application/json", "-d", `@${bodyPath}`],
    { cwd: root, encoding: "utf8", timeout: 190_000 },
  );
  rmSync(bodyPath, { force: true });

  const status = (result.stdout ?? "").trim();
  if (result.error || result.status !== 0 || status !== "200") {
    const detail = pathExists(rawPath)
      ? readFileSync(rawPath, "utf8").slice(0, 400)
      : (result.stderr || result.error?.message || "");
    rmSync(rawPath, { force: true });
    throw new AvpError(
      "tts-synthesis-failed",
      `节拍 ${beatId} 的 Qwen3-TTS 合成失败（http ${status || "?"}）。` +
        `\nPOST ${baseUrl}/v1/audio/speech  model=${model} voice=${voice}` +
        `\n${detail.trim()}`,
      { beatId, voice, model, baseUrl, status },
    );
  }
  return rawPath;
}

/** raw wav → 24k 单声道 16bit + 统一响度。 */
function normalizeWav(rawPath: string, outPath: string, beatId: string): void {
  const convert = spawnSync(
    "ffmpeg",
    ["-v", "error", "-y", "-i", rawPath,
     "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
     "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", outPath],
    { encoding: "utf8", timeout: 120_000 },
  );
  if (convert.error || convert.status !== 0) {
    throw new AvpError(
      "tts-synthesis-failed",
      `节拍 ${beatId} 的音频转码失败：\n${(convert.stderr || convert.error?.message || "").trim()}`,
      { beatId },
    );
  }
}

/**
 * 走 OpenAI 兼容的 /v1/audio/speech。
 *
 * 有些网关（含 Qwen3-TTS 的若干转售）不认 voice：同一个 voice 每次回来的
 * 人声基频能在 120–270Hz 之间跳。配置了 http.voiceMatch 就重试几次，挑最
 * 接近目标基频的那条；没配就一次定稿。
 */
function synthesizeQwen(
  root: string,
  text: string,
  voice: string,
  outPath: string,
  beatId: string,
): void {
  const config = readTtsConfig(root);
  assertQwenConfig(config);
  ensureDir(dirname(outPath));

  const match = config.http?.voiceMatch;
  const attempts = match ? Math.max(1, Math.min(8, match.maxAttempts ?? 4)) : 1;
  const target = match?.targetHz ?? 0;
  const tolerance = match?.toleranceHz ?? 20;

  let bestDiff = Number.POSITIVE_INFINITY;
  let bestF0 = 0;
  let accepted = false;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const raw = requestQwenWav(root, config, text, voice, beatId, `a${String(attempt)}`);
    const tmpOut = `${outPath}.try${String(attempt)}.wav`;
    normalizeWav(raw, tmpOut, beatId);
    rmSync(raw, { force: true });

    const f0 = target > 0 ? medianF0H(tmpOut) : 0;
    const diff = target > 0 ? Math.abs(f0 - target) : 0;

    if (diff < bestDiff) {
      bestDiff = diff;
      bestF0 = f0;
      copyFileSync(tmpOut, outPath);
    }
    rmSync(tmpOut, { force: true });

    if (target === 0 || diff <= tolerance) {
      accepted = true;
      break;
    }
  }

  if (!accepted) {
    // 没抓到理想音色也要留个可用的，并在 stderr 之外留痕（不中断整批）。
    process.stderr.write(
      `[tts] ${beatId} 音色未落到目标区间（最近 ${Math.round(bestF0)}Hz，` +
        `目标 ${target}±${tolerance}Hz），用了最接近的一条。\n`,
    );
  }
}

function readCache(path: string): CacheFile {
  if (!pathExists(path)) return { schemaVersion: 1, entries: {} };
  const cache = readJson<CacheFile>(path);
  if (cache.schemaVersion !== 1 || typeof cache.entries !== "object") {
    throw new AvpError(
      "schema-unknown",
      `${path} 的缓存格式不受支持（schemaVersion=${String(cache.schemaVersion)}）。`,
      { path },
    );
  }
  return cache;
}

export function runTts(
  root: string,
  paths: ProjectPaths,
  ledger: ProjectLedger,
  options: TtsOptions = {},
): TtsResult {
  const manifest = readBeats(root);
  const config = readTtsConfig(root);
  const warnings: string[] = [];
  validateConfig(config, manifest);

  const chapters = new Set(manifest.beats.map((beat) => beat.chapter));
  if (options.chapter && !chapters.has(options.chapter)) {
    throw new AvpError(
      "chapter-unknown",
      `没有章节「${options.chapter}」。现有章节：${[...chapters].join(", ")}`,
      { chapter: options.chapter },
    );
  }

  const cachePath = join(root, ".avp", "tts-cache.json");
  const cache = readCache(cachePath);
  const ttsManifest: TtsManifest = {
    schemaVersion: 1,
    backend: config.backend,
    totalDurationMs: 0,
    beats: {},
  };

  let synthesized = 0;
  let cached = 0;
  let silent = 0;

  for (const beat of manifest.beats) {
    const audioPath = join(root, beat.audio);

    if (beat.say.trim() === "") {
      silent++;
      beat.durationMs = SILENT_BEAT_MS;
      beat.tts = null;
      ttsManifest.beats[beat.id] = {
        hash: null,
        path: null,
        sha256: null,
        durationMs: SILENT_BEAT_MS,
        voice: null,
        speed: null,
        silent: true,
      };
      ttsManifest.totalDurationMs += SILENT_BEAT_MS;
      continue;
    }

    const { voice, speed } = resolveVoiceSpeed(config, beat.chapter);
    if (voice !== config.default.voice) {
      warnings.push(
        `节拍 ${beat.id} 用了非默认音色「${voice}」（默认 ${config.default.voice}）：这是导演选择，确认是有意的。`,
      );
    }

    const key = ttsCacheKey({ say: beat.say, backend: config.backend, voice, speed });
    const entry = cache.entries[key];
    const audioOk =
      pathExists(audioPath) && entry && sha256File(audioPath) === entry.sha256;
    const allowed =
      options.chapter === undefined || options.chapter === beat.chapter;

    // avp plan 会重建 beats.json，把 durationMs / tts 重置为 null；这并不
    // 代表音频失效。只要 say / backend / voice / speed 的缓存键没变且音频
    // sha256 对得上，就恢复元数据并命中缓存，而不是重跑模型。
    const cachedBeat = Boolean(
      entry && audioOk && (beat.tts === null || beat.tts.hash === key),
    );

    if (cachedBeat && entry) {
      beat.tts = beat.tts ?? { backend: config.backend, voice, speed, hash: key };
      beat.durationMs = beat.durationMs ?? entry.durationMs;
      cached++;
    } else if (!allowed) {
      // 只重合成指定章节；其它章保留旧值（没合成过就留空，最后判 incomplete）。
    } else {
      synthesize(
        root,
        config.backend,
        beat.say,
        voice,
        speed,
        audioPath,
        beat.id,
      );
      const measured = probeDurationMs(audioPath);
      const durationMs = measured + TTS_TAIL_MS;
      const digest = sha256File(audioPath);
      const tts: BeatTts = { backend: config.backend, voice, speed, hash: key };
      beat.tts = tts;
      beat.durationMs = durationMs;
      cache.entries[key] = {
        file: beat.audio,
        sha256: digest,
        durationMs,
        backend: config.backend,
        voice,
        speed,
      };
      synthesized++;
    }

    // 已有音频时，把它放到演示的 public/ 下，让 ?auto=1 能播。
    if (pathExists(audioPath)) {
      const publicPath = join(paths.presentation, "public", beat.audio);
      ensureDir(join(publicPath, ".."));
      copyFileSync(audioPath, publicPath);
    }

    const digest = pathExists(audioPath) ? sha256File(audioPath) : null;
    ttsManifest.beats[beat.id] = {
      hash: beat.tts?.hash ?? null,
      path: beat.tts ? beat.audio : null,
      sha256: digest,
      durationMs: beat.durationMs ?? 0,
      voice: beat.tts?.voice ?? null,
      speed: beat.tts?.speed ?? null,
      silent: false,
    };
    ttsManifest.totalDurationMs += beat.durationMs ?? 0;
  }

  writeJson(cachePath, cache);
  writeJson(paths.beats, manifest);
  writeJson(paths.ttsManifest, ttsManifest);

  const complete = manifest.beats.every((beat) => {
    if (beat.say.trim() === "") return true;
    return (
      beat.tts !== null &&
      beat.durationMs !== null &&
      beat.durationMs > 0 &&
      pathExists(join(root, beat.audio))
    );
  });

  if (complete) {
    recordStep(root, "tts", inputHashFor("tts", paths, ledger) ?? "", [
      ".avp/tts.json",
    ]);
  }

  return {
    synthesized,
    cached,
    silent,
    complete,
    totalDurationMs: ttsManifest.totalDurationMs,
    warnings,
  };
}
