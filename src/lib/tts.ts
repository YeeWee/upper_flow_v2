import { spawnSync } from "node:child_process";
import { copyFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fakeDurationMs, probeDurationMs, sha256File, writeSilentWav } from "./audio";
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

function validateConfig(
  config: TtsConfig,
  manifest: BeatsManifest,
  warnings: string[],
): { voice: string; speed: number } {
  if (config.backend !== "kokoro" && config.backend !== "fake") {
    throw new AvpError(
      "tts-backend-unknown",
      `未知 TTS 后端「${config.backend}」；只认识 kokoro / fake。` +
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
    const override = config.chapters?.[beat.chapter];
    const speed = override?.speed ?? config.default.speed;
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

  return { voice: config.default.voice, speed: config.default.speed };
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
  throw new AvpError(
    "tts-backend-unknown",
    `未知 TTS 后端「${backend}」。`,
    { backend },
  );
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
  const manifest = readJson<BeatsManifest>(paths.beats);
  if (manifest.schemaVersion !== 1) {
    throw new AvpError(
      "schema-unknown",
      `beats.json 的 schemaVersion=${String(manifest.schemaVersion)}，本版只认识 1。`,
      { field: "schemaVersion" },
    );
  }
  const config = readTtsConfig(root);
  const warnings: string[] = [];
  validateConfig(config, manifest, warnings);

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

    const cachedBeat =
      entry &&
      audioOk &&
      beat.tts?.hash === key &&
      beat.durationMs !== null &&
      beat.durationMs > 0;

    if (cachedBeat) {
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
