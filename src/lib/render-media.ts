import { spawnSync } from "node:child_process";
import { copyFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BeatsManifest } from "./beats";
import { AvpError } from "./errors";
import { ensureDir, pathExists } from "./fs";
import { sha256File } from "./audio";
import {
  compareFrames,
  contactSheet,
  extractFrame,
  probeMedia,
  toolchainVersions,
} from "./media";
import type { ProjectPaths } from "./project";
import { SKILL_ROOT, skillCommit, skillMeta } from "./skill";

export const STILL_THRESHOLD_PERCENT = 0.1;

export function hyperframesBin(): string {
  const bin = join(SKILL_ROOT, "node_modules", ".bin", "hyperframes");
  if (!pathExists(bin)) {
    throw new AvpError(
      "hyperframes-missing",
      `找不到本地 hyperframes：${bin}\n在 skill 根运行 npm install（版本已固定）。`,
      { path: bin },
    );
  }
  return bin;
}

function fakeRenderEnabled(): boolean {
  return process.env.AVP_FAKE_RENDER === "1";
}

function runFfmpeg(args: string[], timeout = 120_000): void {
  const result = spawnSync("ffmpeg", args, {
    encoding: "utf8",
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new AvpError(
      "render-failed",
      `ffmpeg 失败：${(result.stderr || result.error?.message || "").trim().split("\n").slice(-5).join("\n")}`,
      { args },
    );
  }
}

function makeFakeVideo(output: string, totalMs: number): void {
  ensureDir(dirname(output));
  runFfmpeg([
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x101820:s=320x180:r=30",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=48000:cl=stereo",
    "-t",
    (totalMs / 1000).toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    output,
  ]);
}

export interface RenderVideoResult {
  file: string;
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string | null;
  audioCodec: string | null;
}

export function renderVideo(
  compositionDir: string,
  output: string,
  totalMs: number,
): RenderVideoResult {
  ensureDir(dirname(output));
  if (fakeRenderEnabled()) {
    makeFakeVideo(output, totalMs);
  } else {
    const bin = hyperframesBin();
    const result = spawnSync(
      bin,
      [
        "render",
        compositionDir,
        "--output",
        output,
        "--fps",
        "30",
        "--no-best-effort",
        "--quality",
        "standard",
      ],
      {
        encoding: "utf8",
        timeout: 30 * 60_000,
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, NO_COLOR: "1", CI: "1" },
      },
    );
    if (result.error || result.status !== 0) {
      throw new AvpError(
        "render-failed",
        `HyperFrames 渲染失败（exit ${String(result.status)}）。` +
          `\n${(result.stderr || result.stdout || result.error?.message || "").trim().split("\n").slice(-8).join("\n")}`,
        { composition: compositionDir },
      );
    }
  }

  if (!pathExists(output)) {
    throw new AvpError("render-failed", `渲染命令结束但没有产物：${output}`, {
      output,
    });
  }
  const info = probeMedia(output);
  if (!fakeRenderEnabled()) {
    if (info.width !== 1920 || info.height !== 1080) {
      throw new AvpError(
        "render-invalid",
        `成片分辨率 ${info.width}×${info.height}，DoD 要求 1920×1080。`,
        { width: info.width, height: info.height },
      );
    }
    if (Math.abs(info.fps - 30) > 0.01) {
      throw new AvpError(
        "render-invalid",
        `成片帧率 ${info.fps.toFixed(2)}，DoD 要求 30fps。`,
        { fps: info.fps },
      );
    }
    if (info.videoCodec !== "h264" || info.audioCodec !== "aac") {
      throw new AvpError(
        "render-invalid",
        `成片编码 ${info.videoCodec}/${info.audioCodec}，DoD 要求 h264/aac（静音也会在这里被抓住）。`,
        { videoCodec: info.videoCodec, audioCodec: info.audioCodec },
      );
    }
  }
  return {
    file: output,
    durationMs: info.durationMs,
    width: info.width,
    height: info.height,
    fps: info.fps,
    videoCodec: info.videoCodec,
    audioCodec: info.audioCodec,
  };
}

export interface BriefThumbnails {
  files: string[];
  atMs: number[];
}

export function makeThumbnails(
  compositionDir: string,
  outputDir: string,
  totalMs: number,
): BriefThumbnails {
  const atMs = [...new Set([
    500,
    Math.round(totalMs / 2),
    Math.max(0, totalMs - 500),
  ])].sort((a, b) => a - b);
  ensureDir(outputDir);
  const files: string[] = [];

  if (fakeRenderEnabled()) {
    atMs.forEach((at, index) => {
      const file = join(outputDir, `thumb-${index + 1}.png`);
      runFfmpeg([
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x${["1f6feb", "d29922", "3fb950"][index % 3]}:s=960x540:r=30`,
        "-frames:v",
        "1",
        file,
      ]);
      void at;
      files.push(file);
    });
    return { files, atMs };
  }

  const bin = hyperframesBin();
  const scratch = join(outputDir, ".snapshot");
  rmSync(scratch, { recursive: true, force: true });
  ensureDir(scratch);
  const result = spawnSync(
    bin,
    [
      "snapshot",
      compositionDir,
      "--at",
      atMs.map((ms) => (ms / 1000).toFixed(3)).join(","),
      "--no-end",
      "-o",
      scratch,
    ],
    { encoding: "utf8", timeout: 5 * 60_000, maxBuffer: 32 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0) {
    throw new AvpError(
      "brief-snapshot-failed",
      `HyperFrames 截缩略图失败：${(result.stderr || result.stdout || "").trim().split("\n").slice(-5).join("\n")}`,
      { composition: compositionDir },
    );
  }
  const shots = readdirSync(scratch)
    .filter((name) => /^frame-\d+.*\.png$/u.test(name))
    .sort();
  shots.forEach((name, index) => {
    const target = join(outputDir, `thumb-${index + 1}.png`);
    copyFileSync(join(scratch, name), target);
    files.push(target);
  });
  rmSync(scratch, { recursive: true, force: true });
  if (files.length === 0) {
    throw new AvpError(
      "brief-snapshot-failed",
      `没有截到缩略图：${outputDir}`,
      { outputDir },
    );
  }
  return { files, atMs };
}

export interface BeatStarts {
  id: string;
  startMs: number;
  durationMs: number;
}

export function beatStarts(beats: BeatsManifest["beats"]): BeatStarts[] {
  let startMs = 0;
  return beats.map((beat) => {
    const row = { id: beat.id, startMs, durationMs: beat.durationMs ?? 0 };
    startMs += beat.durationMs ?? 0;
    return row;
  });
}

export interface ArtifactsResult {
  contactSheet: { file: string; frames: number; columns: number; rows: number };
  stillReport: { file: string; staticBeats: string[] };
}

export function renderArtifacts(
  video: string,
  beats: BeatsManifest["beats"],
  outputDir: string,
): ArtifactsResult {
  const framesDir = join(outputDir, "frames");
  rmSync(framesDir, { recursive: true, force: true });
  ensureDir(framesDir);

  const rows = beatStarts(beats);
  const stills: {
    beatId: string;
    atMs: [number, number];
    ssim: number;
    diffPercent: number;
    static: boolean;
  }[] = [];

  rows.forEach((beat, index) => {
    const pad = Math.min(200, Math.max(0, beat.durationMs * 0.2));
    const entryAt = beat.startMs + pad;
    const dwellAt = Math.max(entryAt + 1, beat.startMs + beat.durationMs - pad);
    const entry = join(
      framesDir,
      `${String(index * 2).padStart(2, "0")}-${beat.id}-entry.png`,
    );
    const dwell = join(
      framesDir,
      `${String(index * 2 + 1).padStart(2, "0")}-${beat.id}-dwell.png`,
    );
    extractFrame(video, entryAt, entry);
    extractFrame(video, dwellAt, dwell);
    const diff = compareFrames(entry, dwell);
    stills.push({
      beatId: beat.id,
      atMs: [entryAt, dwellAt],
      ssim: diff.ssim,
      diffPercent: diff.diffPercent,
      static: diff.diffPercent < STILL_THRESHOLD_PERCENT,
    });
  });

  const sheetFile = join(outputDir, "contact-sheet.png");
  const sheet = contactSheet(framesDir, sheetFile, 6);

  const stillFile = join(outputDir, "still-report.json");
  const stillReport = {
    schemaVersion: 1,
    thresholdPercent: STILL_THRESHOLD_PERCENT,
    beats: stills,
    staticBeats: stills.filter((still) => still.static).map((still) => still.beatId),
  };
  writeFileSync(stillFile, `${JSON.stringify(stillReport, null, 2)}\n`, "utf8");

  return {
    contactSheet: { file: sheetFile, ...sheet },
    stillReport: { file: stillFile, staticBeats: stillReport.staticBeats },
  };
}

export interface RenderReceipt {
  schemaVersion: 1;
  renderedAt: string;
  skill: { name: string; version: string; commit: string };
  hashes: {
    beats: string;
    tts: string;
    check: string;
    composition: string;
    themeTokens: string;
  };
  toolchain: { ffmpeg: string; hyperframes: string; chromium: string | null };
  audio: { beat: string; file: string; sha256: string }[];
  output: {
    file: string;
    sha256: string;
    durationMs: number;
    width: number;
    height: number;
    fps: number;
    videoCodec: string | null;
    audioCodec: string | null;
  };
  contactSheet: {
    file: string;
    sha256: string;
    frames: number;
    columns: number;
    rows: number;
  };
  stillReport: { file: string; sha256: string; staticBeats: string[] };
}

export function writeRenderReceipt(
  paths: ProjectPaths,
  manifest: BeatsManifest,
  render: RenderVideoResult,
  artifacts: ArtifactsResult,
): RenderReceipt {
  const tokensPath = join(
    SKILL_ROOT,
    "themes",
    manifest.theme.id,
    "tokens.css",
  );
  const audio = manifest.beats
    .filter((beat) => beat.tts !== null)
    .map((beat) => {
      const file = join(paths.root, beat.audio);
      if (!pathExists(file)) {
        throw new AvpError(
          "audio-missing",
          `回执需要的音频不存在：${beat.audio}（节拍 ${beat.id}）。` +
            `\n先运行 avp tts；检查器本应在渲染前拦住这个问题。`,
          { beatId: beat.id, file: beat.audio },
        );
      }
      return { beat: beat.id, file: beat.audio, sha256: sha256File(file) };
    });

  const meta = skillMeta();
  const receipt: RenderReceipt = {
    schemaVersion: 1,
    renderedAt: new Date().toISOString(),
    skill: {
      name: meta.name,
      version: meta.version,
      commit: skillCommit(),
    },
    hashes: {
      beats: sha256File(paths.beats),
      tts: sha256File(paths.ttsManifest),
      check: sha256File(paths.checkReport),
      composition: sha256File(join(paths.composition, "index.html")),
      themeTokens: sha256File(tokensPath),
    },
    toolchain: toolchainVersions(hyperframesBin()),
    audio,
    output: {
      file: relativeTo(paths.root, render.file),
      sha256: sha256File(render.file),
      durationMs: render.durationMs,
      width: render.width,
      height: render.height,
      fps: render.fps,
      videoCodec: render.videoCodec,
      audioCodec: render.audioCodec,
    },
    contactSheet: {
      file: relativeTo(paths.root, artifacts.contactSheet.file),
      sha256: sha256File(artifacts.contactSheet.file),
      frames: artifacts.contactSheet.frames,
      columns: artifacts.contactSheet.columns,
      rows: artifacts.contactSheet.rows,
    },
    stillReport: {
      file: relativeTo(paths.root, artifacts.stillReport.file),
      sha256: sha256File(artifacts.stillReport.file),
      staticBeats: artifacts.stillReport.staticBeats,
    },
  };
  return receipt;
}

function relativeTo(root: string, file: string): string {
  return file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
}
