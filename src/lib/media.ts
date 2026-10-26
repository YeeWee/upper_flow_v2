import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AvpError } from "./errors";

export interface MediaInfo {
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string | null;
  audioCodec: string | null;
}

function run(
  command: string,
  args: string[],
  options: { timeout?: number } = {},
): { stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeout ?? 120_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new AvpError(
      "media-command-failed",
      `${command} 失败：${(result.stderr || result.error?.message || "").trim().split("\n").slice(-4).join("\n")}`,
      { command, args },
    );
  }
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function parseFps(value: string | undefined): number {
  if (!value) return 0;
  const [num, den] = value.split("/").map(Number);
  if (!num) return 0;
  return den ? num / den : num;
}

export function probeMedia(file: string): MediaInfo {
  const { stdout } = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration",
    "-of",
    "json",
    file,
  ]);
  const parsed = JSON.parse(stdout) as {
    streams?: {
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
    }[];
    format?: { duration?: string };
  };
  const streams = parsed.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const audio = streams.find((stream) => stream.codec_type === "audio");
  const durationMs = Math.round(Number.parseFloat(parsed.format?.duration ?? "0") * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new AvpError("media-invalid", `读不出时长：${file}`, { file });
  }
  return {
    durationMs,
    width: video?.width ?? 0,
    height: video?.height ?? 0,
    fps: parseFps(video?.r_frame_rate),
    videoCodec: video?.codec_name ?? null,
    audioCodec: audio?.codec_name ?? null,
  };
}

/** 从成片精确抽一帧（-ss 放在输入前，快且不会因为解码丢帧）。 */
export function extractFrame(
  video: string,
  atMs: number,
  output: string,
): void {
  mkdirSync(dirname(output), { recursive: true });
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    (Math.max(0, atMs) / 1000).toFixed(3),
    "-i",
    video,
    "-frames:v",
    "1",
    output,
  ]);
}

export interface FrameDiff {
  ssim: number;
  diffPercent: number;
}

/** 两张同尺寸 PNG 的结构相似度；差异百分比 = (1 - SSIM) × 100。 */
export function compareFrames(a: string, b: string): FrameDiff {
  const { stderr } = run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "info",
    "-i",
    a,
    "-i",
    b,
    "-filter_complex",
    "[0:v][1:v]ssim",
    "-f",
    "null",
    "-",
  ]);
  const match = /All:([0-9.]+)/u.exec(stderr);
  if (!match) {
    throw new AvpError(
      "frame-compare-failed",
      `无法比较帧：${a} vs ${b}`,
      { a, b },
    );
  }
  const ssim = Number.parseFloat(match[1]!);
  return { ssim, diffPercent: Math.max(0, (1 - ssim) * 100) };
}

/** 把按顺序命名的帧拼成联系表；列数默认 6。 */
export function contactSheet(
  frameDir: string,
  output: string,
  columns = 6,
): { frames: number; columns: number; rows: number } {
  const frames = readdirSync(frameDir)
    .filter((name) => name.endsWith(".png"))
    .sort()
    .map((name) => join(frameDir, name));
  if (frames.length === 0) {
    throw new AvpError("contact-sheet-empty", `没有可用于联系表的帧：${frameDir}`, {
      frameDir,
    });
  }
  const rows = Math.ceil(frames.length / columns);
  mkdirSync(dirname(output), { recursive: true });
  // 逐帧 concat 比 glob 稳定：文件名顺序完全由调用方控制。
  const listPath = join(frameDir, "frames.txt");
  writeFileSync(
    listPath,
    frames.map((frame) => `file '${frame.replaceAll("'", "'\\''")}'`).join("\n"),
    "utf8",
  );
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-vf",
    `scale=320:-1,tile=${columns}x${rows}:padding=6:margin=6:color=0x111111`,
    "-frames:v",
    "1",
    output,
  ]);
  return { frames: frames.length, columns, rows };
}

export interface Toolchain {
  ffmpeg: string;
  hyperframes: string;
  chromium: string | null;
}

export function toolchainVersions(hyperframesBin: string): Toolchain {
  const ffmpeg = /ffmpeg version (\S+)/u.exec(
    run("ffmpeg", ["-version"]).stdout,
  )?.[1] ?? "unknown";

  const hyperframes = JSON.parse(
    readFileSync(
      join(hyperframesBin, "..", "..", "hyperframes", "package.json"),
      "utf8",
    ),
  ).version as string;

  let chromium: string | null = null;
  const browser = spawnSync(hyperframesBin, ["browser", "path"], {
    encoding: "utf8",
  });
  if (!browser.error && browser.status === 0) {
    const path = browser.stdout.trim();
    chromium = /-(\d+\.\d+\.\d+\.\d+)\//u.exec(path)?.[1] ?? null;
  }

  return { ffmpeg, hyperframes, chromium };
}
