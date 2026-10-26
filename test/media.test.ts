import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { compareFrames } from "../src/lib/media";
import { STILL_THRESHOLD_PERCENT } from "../src/lib/render-media";

function makePng(file: string, filter?: string): void {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=16x16:d=1",
      ...(filter ? ["-vf", filter] : []),
      "-frames:v",
      "1",
      file,
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}

describe("compareFrames", () => {
  let dir: string;
  let identical: string;
  let changed: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "avp-media-"));
    identical = join(dir, "identical.png");
    changed = join(dir, "changed.png");
    makePng(identical);
    // 16×16 里只改左上角一个像素：差异应为 1/256。
    makePng(changed, "drawbox=x=0:y=0:w=1:h=1:color=white:t=fill");
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("相同 PNG 的像素差为 0，低于静帧阈值", () => {
    const diff = compareFrames(identical, identical);
    assert.equal(diff.diffPercent, 0);
    assert.ok(diff.diffPercent < STILL_THRESHOLD_PERCENT);
  });

  test("单个像素变化按像素占比报告，越过静帧阈值", () => {
    const diff = compareFrames(identical, changed);
    assert.equal(diff.diffPercent, (1 / 256) * 100);
    assert.ok(diff.diffPercent > STILL_THRESHOLD_PERCENT);
  });
});
