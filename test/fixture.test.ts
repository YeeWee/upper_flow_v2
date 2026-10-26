import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { cleanup, readJson, REPO_ROOT, runAvp, tempProject } from "./helpers";

/**
 * 验收夹具（examples/trae-harness）的 plan / tts 集成面。
 *
 * 只走 CLI：复制夹具内容到临时项目，断言退出码、--json 与落盘文件。
 * 音频用 fake 后端跑快车道；真 Kokoro 属于慢车道，由人工验收。
 */
const FIXTURE = join(REPO_ROOT, "examples", "trae-harness");

const CHAPTER_STEPS: Record<string, number> = {
  coldopen: 5,
  architecture: 6,
  results: 8,
  "v2-and-cta": 3,
};

/** 与 captions.ts 同口径的独立实现：全角 1、其余 0.5，向上取整。 */
function captionCells(text: string): number {
  let width = 0;
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const fullWidth =
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2000 && cp <= 0x206f) ||
      (cp >= 0x2e80 && cp <= 0x303e) ||
      (cp >= 0x3041 && cp <= 0x33ff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0xa000 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe19) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6);
    width += fullWidth ? 1 : 0.5;
  }
  return Math.ceil(width);
}

/** 数字 + 拉丁 / 专名 token 集合；caption 与 say 必须相等。 */
function tokens(text: string): string[] {
  const numbers = [...text.matchAll(/\d+(?:\.\d+)?%?/gu)].map((m) => m[0]);
  const latin = [...text.matchAll(/[A-Za-z][A-Za-z0-9._+-]*/gu)].map(
    (m) => m[0],
  );
  return [...new Set([...numbers, ...latin])].sort();
}

function copyFixture(dir: string): void {
  for (const file of ["article.md", "script.md", "outline.md", "project.json", "tts.json"]) {
    cpSync(join(FIXTURE, file), join(dir, file));
  }
  cpSync(join(FIXTURE, "presentation", "src"), join(dir, "presentation", "src"), {
    recursive: true,
  });
  mkdirSync(join(dir, "presentation", "public", "audio"), { recursive: true });
  for (const part of ["beats", "hooks"]) {
    cpSync(join(FIXTURE, "composition", part), join(dir, "composition", part), {
      recursive: true,
    });
  }
}

function wavCount(dir: string, chapter: string): number {
  const files = readdirSync(join(dir, "audio", chapter));
  return files.filter((file) => file.endsWith(".wav")).length;
}

describe("examples/trae-harness fixture", () => {
  let dir: string;

  before(() => {
    assert.ok(
      existsSync(join(FIXTURE, "script.md")),
      "夹具必须先有 script.md（由 ticket #9 重建）",
    );
    dir = tempProject("avp-fixture-");
    copyFixture(dir);
  });

  after(() => {
    cleanup(dir);
  });

  test("文章重建为 4 章 22 拍，字幕逐条手写且不超单行", () => {
    const plan = runAvp(["plan", "--json"], dir);
    assert.equal(plan.status, 0, plan.stderr);
    assert.equal(plan.json.ok, true);
    assert.equal(plan.json.chapters, 4);
    assert.equal(plan.json.beats, 22);

    const manifest = readJson(join(dir, "beats.json"));
    assert.equal(manifest.theme.id, "bold-signal");

    const counts: Record<string, number> = {};
    for (const beat of manifest.beats) {
      counts[beat.chapter] = (counts[beat.chapter] ?? 0) + 1;
    }
    assert.deepEqual(counts, CHAPTER_STEPS);
    assert.deepEqual(
      manifest.beats.map((beat: any) => beat.id),
      [
        "coldopen-1",
        "coldopen-2",
        "coldopen-3",
        "coldopen-4",
        "coldopen-5",
        "architecture-1",
        "architecture-2",
        "architecture-3",
        "architecture-4",
        "architecture-5",
        "architecture-6",
        "results-1",
        "results-2",
        "results-3",
        "results-4",
        "results-5",
        "results-6",
        "results-7",
        "results-8",
        "v2-and-cta-1",
        "v2-and-cta-2",
        "v2-and-cta-3",
      ],
    );

    for (const beat of manifest.beats) {
      assert.equal(beat.captionSource, "authored", `${beat.id} 必须手写字幕`);
      assert.ok(beat.caption.length > 0, `${beat.id} 字幕不能为空`);
      assert.ok(
        !beat.caption.includes("…") && !beat.caption.includes("..."),
        `${beat.id} 字幕不能加省略号`,
      );
      assert.ok(
        captionCells(beat.caption) <= 18,
        `${beat.id} 字幕 ${captionCells(beat.caption)} 全角，超过 18：${beat.caption}`,
      );
      assert.deepEqual(
        tokens(beat.caption),
        tokens(beat.say),
        `${beat.id} 的数字 / 专名集合与 say 不一致`,
      );
    }

    const statics = manifest.beats.filter(
      (beat: any) => beat.motion === "static",
    );
    assert.ok(
      statics.length >= 2 && statics.length <= 3,
      `刻意的静帧应 2–3 个，实际 ${statics.length}`,
    );
    assert.equal(
      manifest.beats.filter((beat: any) => beat.motion === "hook").length,
      22 - statics.length,
    );
  });

  test("22 拍用 fake 后端合成后，音频与回执完整且 status 前两步最新", () => {
    const config = readJson(join(dir, "tts.json"));
    config.backend = "fake";
    writeFileSync(join(dir, "tts.json"), JSON.stringify(config, null, 2));

    const tts = runAvp(["tts", "--json"], dir);
    assert.equal(tts.status, 0, tts.stderr);
    assert.equal(tts.json.ok, true);
    assert.equal(tts.json.synthesized, 22);
    assert.equal(tts.json.silent, 0);
    assert.equal(tts.json.complete, true);

    const manifest = readJson(join(dir, "beats.json"));
    const sum = manifest.beats.reduce(
      (total: number, beat: any) => total + beat.durationMs,
      0,
    );
    assert.equal(tts.json.totalDurationMs, sum);
    for (const beat of manifest.beats) {
      assert.ok(beat.durationMs > 0, `${beat.id} 应有实测时长`);
      assert.ok(beat.audio.endsWith(`/${beat.step + 1}.wav`));
      assert.ok(existsSync(join(dir, "audio", beat.chapter, `${beat.step + 1}.wav`)));
      assert.ok(
        existsSync(
          join(dir, "presentation", "public", "audio", beat.chapter, `${beat.step + 1}.wav`),
        ),
        `${beat.id} 应复制到演示的 public/audio`,
      );
    }

    for (const [chapter, steps] of Object.entries(CHAPTER_STEPS)) {
      assert.equal(wavCount(dir, chapter), steps, `${chapter} 音频数量`);
    }

    const ttsManifest = readJson(join(dir, ".avp", "tts.json"));
    assert.equal(Object.keys(ttsManifest.beats).length, 22);
    assert.equal(ttsManifest.backend, "fake");

    const status = runAvp(["status", "--json"], dir);
    assert.equal(status.status, 0, status.stderr);
    const byStep = Object.fromEntries(
      status.json.steps.map((step: any) => [step.step, step.status]),
    );
    assert.equal(byStep.plan, "current");
    assert.equal(byStep.tts, "current");
    assert.equal(byStep.compose, "pending");
    assert.equal(byStep.check, "pending");
    assert.equal(byStep.render, "pending");
  });

  test("compose + check 能在 22 拍夹具上全绿（warning 允许）", () => {
    const compose = runAvp(["compose", "--json"], dir);
    assert.equal(compose.status, 0, compose.stdout + compose.stderr);
    assert.equal(compose.json.clips, 22);
    assert.equal(compose.json.hooks, 19);
    assert.deepEqual(compose.json.warnings, []);

    const check = runAvp(["check", "--json"], dir);
    assert.equal(check.status, 0, check.stdout + check.stderr);
    assert.equal(check.json.ok, true);
    assert.deepEqual(check.json.errors, []);
    assert.ok(existsSync(join(dir, ".avp", "check.json")));
  });
});
