import { join } from "node:path";
import { sha256File } from "../audio";
import type { Beat } from "../beats";
import { pathExists } from "../fs";
import { SILENT_BEAT_MS } from "../tts";
import type { TtsManifestEntry } from "../tts";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";

function expectedAudioPath(beat: Beat): string {
  return `audio/${beat.chapter}/${beat.step + 1}.wav`;
}

function addAudioError(
  ctx: CheckContext,
  id: string,
  beat: Beat,
  field: string,
  message: string,
  fix: string,
): void {
  ctx.findings.push({
    id,
    level: "error",
    beatId: beat.id,
    chapter: beat.chapter,
    field,
    message,
    fix,
  });
}

function addTtsMismatch(
  ctx: CheckContext,
  beat: Beat,
  field: string,
  message: string,
): void {
  addAudioError(
    ctx,
    CHECK_IDS.audioTtsMismatch,
    beat,
    field,
    message,
    "运行 avp tts 刷新 .avp/tts.json 回执；不要手改回执。",
  );
}

function ttsEntry(
  ctx: CheckContext,
  beat: Beat,
): TtsManifestEntry | undefined {
  if (!ctx.ttsManifest) return undefined;
  const entries = ctx.ttsManifest.beats;
  if (typeof entries !== "object" || entries === null) return undefined;
  return entries[beat.id];
}

/** error：音频路径 / 文件 / 回执 / 静音拍契约。一次报全部坏拍，不只报第一拍。 */
export function checkAudio(ctx: CheckContext): void {
  for (const beat of ctx.manifest.beats) {
    const audio = typeof beat.audio === "string" ? beat.audio : "";
    const expected = expectedAudioPath(beat);
    if (audio !== expected) {
      addAudioError(
        ctx,
        CHECK_IDS.audioPathMismatch,
        beat,
        "audio",
        `beats.json 的 audio 是「${audio}」，按章节/步应为「${expected}」。` +
          `\n音频路径必须来自节拍清单，不做 step+1 推导。`,
        "让 audio 等于 audio/<chapter>/<step+1>.wav；改口播后运行 avp plan 重新生成。",
      );
    }

    const audioPath = audio ? join(ctx.root, audio) : "";
    const fileExists = Boolean(audioPath) && pathExists(audioPath);
    const silent = typeof beat.say === "string" && beat.say.trim() === "";
    // 静音拍没有音频文件，只校验路径形状；非静音拍必须有真实文件。
    if (!silent && !fileExists) {
      addAudioError(
        ctx,
        CHECK_IDS.audioMissing,
        beat,
        "audio",
        `找不到音频文件：${audio || "（空路径）"}（项目根下）。` +
          `\n渲染器会直接跳过这段旁白。`,
        "补回音频文件，或运行 avp tts 重新合成。",
      );
    }

    if (silent) {
      if (beat.durationMs !== SILENT_BEAT_MS) {
        addAudioError(
          ctx,
          CHECK_IDS.silentBeatInvalid,
          beat,
          "durationMs",
          `静音拍必须固定 ${SILENT_BEAT_MS}ms，当前是 ${String(beat.durationMs)}ms。`,
          `运行 avp tts 把静音拍写成 durationMs=${SILENT_BEAT_MS}、tts=null。`,
        );
      }
      if (beat.tts !== null) {
        addAudioError(
          ctx,
          CHECK_IDS.silentBeatInvalid,
          beat,
          "tts",
          "静音拍必须 tts=null，当前带了 tts 元组。",
          "运行 avp tts；静音拍不合成、不写 tts 元组。",
        );
      }
      if (ctx.ttsManifest) {
        const entry = ttsEntry(ctx, beat);
        if (!entry) {
          addAudioError(
            ctx,
            CHECK_IDS.audioTtsMissing,
            beat,
            ".avp/tts.json",
            `.avp/tts.json 里没有静音拍 ${beat.id} 的条目（回执过期）。`,
            "运行 avp tts 刷新回执。",
          );
        } else if (
          entry.silent !== true ||
          entry.path !== null ||
          entry.hash !== null ||
          entry.sha256 !== null ||
          entry.durationMs !== SILENT_BEAT_MS
        ) {
          addTtsMismatch(
            ctx,
            beat,
            "silent",
            `.avp/tts.json 的静音条目与 beats.json 不一致：` +
              `应 silent=true / path=null / sha256=null / durationMs=${SILENT_BEAT_MS}。`,
          );
        }
      }
      continue;
    }

    // 非静音拍：beats.json 必须有完整 tts 元组与实测时长。
    if (beat.tts === null || typeof beat.tts !== "object") {
      addAudioError(
        ctx,
        CHECK_IDS.audioTtsMissing,
        beat,
        "tts",
        "非静音拍缺少 tts 元组（backend / voice / speed / hash）。",
        "运行 avp tts 回写 tts 元组与实测时长。",
      );
    } else {
      const tuple = beat.tts;
      if (
        typeof tuple.backend !== "string" ||
        !tuple.backend ||
        typeof tuple.voice !== "string" ||
        !tuple.voice ||
        typeof tuple.speed !== "number" ||
        !Number.isFinite(tuple.speed) ||
        typeof tuple.hash !== "string" ||
        !tuple.hash
      ) {
        addAudioError(
          ctx,
          CHECK_IDS.audioTtsMissing,
          beat,
          "tts",
          "tts 元组不完整：backend / voice / speed / hash 都必须有值。",
          "运行 avp tts 重新回写 tts 元组。",
        );
      }
    }

    if (typeof beat.durationMs !== "number" || beat.durationMs <= 0) {
      addAudioError(
        ctx,
        CHECK_IDS.audioTtsMissing,
        beat,
        "durationMs",
        `非静音拍没有实测时长（durationMs=${String(beat.durationMs)}）。`,
        "运行 avp tts；时长必须来自 ffprobe 实测 + 300ms 尾隙。",
      );
    }

    if (!ctx.ttsManifest) {
      addAudioError(
        ctx,
        CHECK_IDS.audioTtsMissing,
        beat,
        ".avp/tts.json",
        "缺少 .avp/tts.json 回执，无法核对音频与节拍。",
        "运行 avp tts 生成回执。",
      );
      continue;
    }

    const entry = ttsEntry(ctx, beat);
    if (!entry) {
      addAudioError(
        ctx,
        CHECK_IDS.audioTtsMissing,
        beat,
        ".avp/tts.json",
        `.avp/tts.json 里没有节拍 ${beat.id} 的条目（回执过期）。`,
        "运行 avp tts 刷新回执。",
      );
      continue;
    }

    if (entry.silent !== false) {
      addTtsMismatch(
        ctx,
        beat,
        "silent",
        `.avp/tts.json 把节拍 ${beat.id} 记成 silent=true，但这一拍有口播。`,
      );
    }
    if (entry.path !== beat.audio) {
      addTtsMismatch(
        ctx,
        beat,
        "path",
        `.avp/tts.json 的 path「${String(entry.path)}」与 beats.json 的「${beat.audio}」不一致。`,
      );
    }
    if (beat.tts && entry.hash !== beat.tts.hash) {
      addTtsMismatch(
        ctx,
        beat,
        "hash",
        `.avp/tts.json 的 hash 与 beats.json 的 tts.hash 不一致（缓存键漂移）。`,
      );
    }
    if (beat.durationMs !== entry.durationMs) {
      addAudioError(
        ctx,
        CHECK_IDS.audioDurationMismatch,
        beat,
        "durationMs",
        `.avp/tts.json 的 durationMs=${String(entry.durationMs)} 与 ` +
          `beats.json 的 ${String(beat.durationMs)} 不一致（回执过期）。`,
        "运行 avp tts 刷新实测时长；durationMs 由 tts 拥有，不要手改。",
      );
    }
    if (fileExists) {
      const digest = sha256File(audioPath);
      if (entry.sha256 !== digest) {
        addTtsMismatch(
          ctx,
          beat,
          "sha256",
          `.avp/tts.json 的 sha256 与磁盘音频不一致（音频被替换或回执过期）。`,
        );
      }
    }
  }
}
