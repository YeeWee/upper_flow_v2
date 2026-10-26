import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import {
  cleanup,
  readJson,
  readText,
  REPO_ROOT,
  runAvp,
  tempProject,
} from "./helpers";

describe("avp init / status", () => {
  let dir: string;

  before(() => {
    dir = tempProject();
  });

  after(() => {
    cleanup(dir);
  });

  test("初始化一个新项目并查询状态", () => {
    const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
    assert.equal(init.status, 0, init.stderr);
    assert.equal(init.json.ok, true);
    assert.equal(init.json.alreadyInitialized, false);
    assert.equal(init.json.theme, "bold-signal");

    // 项目账本与 TTS 配置
    const ledger = readJson(join(dir, "project.json"));
    assert.equal(ledger.schemaVersion, 1);
    assert.equal(ledger.skill.name, "article-video-production");
    assert.equal(ledger.theme.id, "bold-signal");

    const tts = readJson(join(dir, "tts.json"));
    assert.equal(tts.schemaVersion, 1);
    assert.equal(tts.backend, "kokoro");
    assert.equal(tts.default.speed, 1.0);

    // 演示脚手架落到项目里，主题 tokens 已注入
    assert.ok(existsSync(join(dir, "presentation", "package.json")));
    assert.ok(existsSync(join(dir, "presentation", "src", "App.tsx")));
    const projectTokens = readText(
      join(dir, "presentation", "src", "styles", "tokens.css"),
    );
    const themeTokens = readText(
      join(REPO_ROOT, "themes", "bold-signal", "tokens.css"),
    );
    assert.equal(projectTokens, themeTokens);

    // 视觉原子层随脚手架落地：画廊入口、样式契约、演示已接入
    assert.ok(existsSync(join(dir, "presentation", "atoms.html")));
    const atomsCss = readText(
      join(dir, "presentation", "src", "styles", "atoms.css"),
    );
    for (const atom of [
      "kicker",
      "hero",
      "stat",
      "list",
      "card",
      "quote",
      "badge",
      "rule",
      "footer",
    ]) {
      for (const state of ["in", "lit", "dim"]) {
        assert.match(atomsCss, new RegExp(`\\.atom-${atom}\\.${state}\\b`));
      }
    }
    const example = readText(
      join(dir, "presentation", "src", "chapters", "01-example", "Example.tsx"),
    );
    assert.match(example, /atom-hero in/);
    assert.match(example, /atom-hero lit/);
    assert.match(example, /atom-quote dim/);

    // status 四列，新项目全部待办
    const status = runAvp(["status", "--json"], dir);
    assert.equal(status.status, 0, status.stderr);
    assert.equal(status.json.ok, true);
    assert.equal(status.json.steps.length, 5);
    for (const step of status.json.steps) {
      assert.ok(["plan", "tts", "compose", "check", "render"].includes(step.step));
      assert.ok(Array.isArray(step.outputs) && step.outputs.length > 0);
      assert.equal(step.status, "pending");
      assert.ok("inputHash" in step);
    }
  });

  test("重复 init 不覆盖已有项目", () => {
    const marker = join(dir, "presentation", "KEEP-ME.txt");
    writeFileSync(marker, "在 init 之前写的文件");

    const second = runAvp(["init", "--json"], dir);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(second.json.alreadyInitialized, true);
    assert.ok(existsSync(marker));
  });

  test("未知主题给出可机械修复的错误", () => {
    const other = tempProject();
    try {
      const result = runAvp(["init", "--theme=no-such-theme", "--json"], other);
      assert.notEqual(result.status, 0);
      assert.equal(result.json.ok, false);
      assert.equal(result.json.error.code, "theme-unknown");
    } finally {
      cleanup(other);
    }
  });

  test("不在项目目录里运行 status 会失败", () => {
    const other = tempProject();
    try {
      const result = runAvp(["status", "--json"], other);
      assert.notEqual(result.status, 0);
      assert.equal(result.json.error.code, "not-a-project");
    } finally {
      cleanup(other);
    }
  });

  test("status 也拒绝位置参数，避免静默使用 cwd", () => {
    const result = runAvp(["status", "some/dir", "--json"], dir);
    assert.notEqual(result.status, 0);
    assert.match(result.json.error.message, /status 不接受位置参数/u);
  });
});
