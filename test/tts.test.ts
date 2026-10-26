import assert from "node:assert/strict";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import {
  cleanup,
  readJson,
  REPO_ROOT,
  runAvp,
  tempProject,
} from "./helpers";

const TOKENS = join(REPO_ROOT, "themes", "bold-signal", "tokens.css");
const { createHash } = await import("node:crypto");
const { readFileSync } = await import("node:fs");

function beatsFixture(backend = "fake") {
  return {
    schemaVersion: 1,
    theme: {
      id: "bold-signal",
      tokensHash: createHash("sha256").update(readFileSync(TOKENS)).digest("hex"),
    },
    beats: [
      {
        id: "alpha-1",
        chapter: "alpha",
        chapterIndex: 0,
        step: 0,
        say: "第一段测试口播。",
        caption: "第一段",
        captionSource: "authored",
        audio: "audio/alpha/1.wav",
        durationMs: null,
        textHash: "t1",
        tts: null,
        motion: "hook",
      },
      {
        id: "alpha-2",
        chapter: "alpha",
        chapterIndex: 0,
        step: 1,
        say: "",
        caption: "",
        captionSource: "authored",
        audio: "audio/alpha/2.wav",
        durationMs: null,
        textHash: "t2",
        tts: null,
        motion: "static",
      },
      {
        id: "beta-1",
        chapter: "beta",
        chapterIndex: 1,
        step: 0,
        say: "第三段口播，稍长一点点。",
        caption: "第三段",
        captionSource: "authored",
        audio: "audio/beta/1.wav",
        durationMs: null,
        textHash: "t3",
        tts: null,
        motion: "hook",
      },
    ],
  };
}

describe("avp tts", () => {
  let dir: string;

  before(() => {
    dir = tempProject();
    const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
    assert.equal(init.status, 0, init.stderr);
    writeFileSync(join(dir, "beats.json"), JSON.stringify(beatsFixture(), null, 2));
    const tts = readJson(join(dir, "tts.json"));
    tts.backend = "fake";
    writeFileSync(join(dir, "tts.json"), JSON.stringify(tts, null, 2));
  });

  after(() => cleanup(dir));

  test("合成音频、回写实测时长，并让 status 显示最新", () => {
    const run = runAvp(["tts", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.ok, true);
    assert.equal(run.json.synthesized, 2);
    assert.equal(run.json.silent, 1);
    assert.equal(run.json.complete, true);

    const beats = readJson(join(dir, "beats.json"));
    const [first, silent, third] = beats.beats;
    assert.equal(silent.durationMs, 1500);
    assert.equal(silent.tts, null);
    assert.ok(first.durationMs > 300);
    assert.equal(first.tts.backend, "fake");
    assert.equal(first.tts.hash.length, 64);
    assert.ok(third.durationMs > 300);

    assert.ok(existsSync(join(dir, "audio", "alpha", "1.wav")));
    assert.ok(existsSync(join(dir, "audio", "beta", "1.wav")));
    assert.ok(existsSync(join(dir, "presentation", "public", "audio", "alpha", "1.wav")));

    const manifest = readJson(join(dir, ".avp", "tts.json"));
    assert.equal(manifest.beats["alpha-2"].silent, true);
    assert.equal(
      manifest.totalDurationMs,
      first.durationMs + 1500 + third.durationMs,
    );

    const status = runAvp(["status", "--json"], dir);
    const tts = status.json.steps.find((step: any) => step.step === "tts");
    assert.equal(tts.status, "current");
  });

  test("未变输入不重复合成", () => {
    const run = runAvp(["tts", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.synthesized, 0);
    assert.equal(run.json.cached, 2);
  });

  test("改一章语速只重合成该章", () => {
    const tts = readJson(join(dir, "tts.json"));
    tts.chapters = { beta: { speed: 1.03 } };
    writeFileSync(join(dir, "tts.json"), JSON.stringify(tts, null, 2));

    const run = runAvp(["tts", "--chapter=beta", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.synthesized, 1);
    assert.equal(run.json.cached, 1);
    assert.equal(run.json.complete, true);

    const beats = readJson(join(dir, "beats.json"));
    assert.equal(beats.beats[2].tts.speed, 1.03);
    assert.equal(beats.beats[0].tts.speed, 1);
  });

  test("语速越界 / 未知后端 / 未知章节都拒绝", () => {
    const original = readJson(join(dir, "tts.json"));
    const badSpeed = structuredClone(original);
    badSpeed.chapters = { beta: { speed: 1.2 } };
    writeFileSync(join(dir, "tts.json"), JSON.stringify(badSpeed, null, 2));
    const speed = runAvp(["tts", "--json"], dir);
    assert.notEqual(speed.status, 0);
    assert.equal(speed.json.error.code, "speed-out-of-range");

    const badBackend = structuredClone(original);
    badBackend.backend = "nope";
    writeFileSync(join(dir, "tts.json"), JSON.stringify(badBackend, null, 2));
    const backend = runAvp(["tts", "--json"], dir);
    assert.equal(backend.json.error.code, "tts-backend-unknown");

    writeFileSync(join(dir, "tts.json"), JSON.stringify(original, null, 2));
    const chapter = runAvp(["tts", "--chapter=nope", "--json"], dir);
    assert.equal(chapter.json.error.code, "chapter-unknown");
  });

  test("音频丢了会重新合成", () => {
    rmSync(join(dir, "audio", "beta", "1.wav"));
    const run = runAvp(["tts", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.synthesized, 1);
    assert.ok(existsSync(join(dir, "audio", "beta", "1.wav")));
  });

  test("--after-plan 缺少批准记录时拒绝执行", () => {
    const run = runAvp(["tts", "--after-plan", "--json"], dir);
    assert.notEqual(run.status, 0);
    assert.equal(run.json.error.code, "plan-not-approved");
  });
});
