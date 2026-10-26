import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { AvpError } from "./errors";

/** ffprobe 实测时长（毫秒）。音频是真相，估时不是。 */
export function probeDurationMs(file: string): number {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ],
    { encoding: "utf8" },
  );
  if (result.error || result.status !== 0) {
    throw new AvpError(
      "ffprobe-failed",
      `ffprobe 读不出音频时长：${file}\n${result.stderr?.trim() ?? result.error?.message ?? ""}`,
      { file },
    );
  }
  const seconds = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new AvpError("audio-invalid", `音频时长无效：${file}`, { file });
  }
  return Math.round(seconds * 1000);
}

export function sha256File(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/**
 * 写一段确定长度的静音 WAV（PCM16 / mono）。
 * 假 TTS 后端用它把快车道保持在秒级，不依赖 Python 或网络。
 */
export function writeSilentWav(
  file: string,
  durationMs: number,
  sampleRate = 24_000,
): void {
  const frames = Math.max(1, Math.round((durationMs / 1000) * sampleRate));
  const dataBytes = frames * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buffer);
}

/** 假 TTS 的时长规则：每个可见字符 220ms，至少 700ms。 */
export function fakeDurationMs(text: string, speed: number): number {
  const chars = [...text].length;
  return Math.max(700, Math.round((chars * 220) / speed));
}
