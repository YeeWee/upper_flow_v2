import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import {
  cleanup,
  readJson,
  runAvp,
  tempProject,
} from "./helpers";

const SAYS = ["SWE-bench 从 2 降到 0。", "短句。", ""];
const CAPTIONS = ["SWE-bench 2 → 0", undefined, undefined];

function writeScript(dir: string, says: string[]): void {
  writeFileSync(join(dir, "script.md"), `${says.join("\n\n---\n\n")}\n`, "utf8");
}

function writeNarrations(
  dir: string,
  entries: { say: string; caption?: string; motion?: "hook" | "static" }[],
): void {
  const body = entries
    .map((entry) => {
      const fields = [`say: ${JSON.stringify(entry.say)}`];
      if (entry.caption !== undefined) {
        fields.push(`caption: ${JSON.stringify(entry.caption)}`);
      }
      if (entry.motion !== undefined) {
        fields.push(`motion: ${JSON.stringify(entry.motion)}`);
      }
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");
  writeFileSync(
    join(
      dir,
      "presentation",
      "src",
      "chapters",
      "01-example",
      "narrations.ts",
    ),
    `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = [\n${body}\n];\n`,
    "utf8",
  );
}

function writeBodiesAndHooks(dir: string): void {
  const bodies = join(dir, "composition", "beats");
  const hooks = join(dir, "composition", "hooks");
  mkdirSync(bodies, { recursive: true });
  mkdirSync(hooks, { recursive: true });
  writeFileSync(
    join(bodies, "example-1.body.html"),
    `<div class="atom-stat in"><div class="atom-stat__value">2 → 0</div><div class="atom-stat__label">SWE-bench</div></div>`,
  );
  writeFileSync(
    join(bodies, "example-2.body.html"),
    `<div class="atom-hero in"><h1 class="atom-hero__title">短句</h1></div>`,
  );
  writeFileSync(
    join(bodies, "example-3.body.html"),
    `<div class="atom-rule in"></div>`,
  );
  writeFileSync(
    join(hooks, "example-1.hook.ts"),
    `export default function (tl, root, ctx) {\n  tl.from(root.querySelector(".atom-stat__value"), { y: 30, opacity: 0, duration: 0.4 }, ctx.start + 0.1);\n}\n`,
  );
  writeFileSync(
    join(hooks, "example-2.hook.ts"),
    `export default function (tl, root, ctx) {\n  tl.from(root.querySelector(".atom-hero__title"), { y: 20, opacity: 0, duration: 0.3 }, ctx.start + 0.1);\n}\n`,
  );
}

function buildBaseProject(): string {
  const dir = tempProject("avp-check-base-");
  const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
  assert.equal(init.status, 0, init.stderr);

  writeNarrations(
    dir,
    SAYS.map((say, index) => ({
      say,
      ...(CAPTIONS[index] !== undefined ? { caption: CAPTIONS[index] } : {}),
      ...(index === 2 ? { motion: "static" as const } : {}),
    })),
  );
  writeScript(dir, SAYS);

  const plan = runAvp(["plan", "--json"], dir);
  assert.equal(plan.status, 0, plan.stderr);

  const ttsConfig = readJson(join(dir, "tts.json"));
  ttsConfig.backend = "fake";
  writeFileSync(
    join(dir, "tts.json"),
    `${JSON.stringify(ttsConfig, null, 2)}\n`,
    "utf8",
  );
  const tts = runAvp(["tts", "--json"], dir);
  assert.equal(tts.status, 0, tts.stderr);

  writeBodiesAndHooks(dir);
  const compose = runAvp(["compose", "--json"], dir);
  assert.equal(compose.status, 0, compose.stderr);

  return dir;
}

describe("avp check", () => {
  let base: string;

  before(() => {
    base = buildBaseProject();
  });

  after(() => {
    cleanup(base);
  });

  /** Clone the pristine fixture so every test can mutate freely. */
  function withClone(fn: (dir: string) => void): void {
    const parent = tempProject("avp-check-case-");
    const dir = join(parent, "project");
    try {
      cpSync(base, dir, { recursive: true });
      fn(dir);
    } finally {
      cleanup(parent);
    }
  }

  function check(
    dir: string,
    extra: string[] = [],
    json = true,
  ): ReturnType<typeof runAvp> {
    return runAvp(["check", ...(json ? ["--json"] : []), ...extra], dir);
  }

  function findError(run: ReturnType<typeof runAvp>, id: string): any {
    const finding = run.json.errors.find((item: any) => item.id === id);
    assert.ok(finding, `expected error ${id}; got ${JSON.stringify(run.json)}`);
    return finding;
  }

  function writeJsonAt(dir: string, rel: string, value: unknown): void {
    writeFileSync(
      join(dir, rel),
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8",
    );
  }

  function updateBeat(dir: string, index: number, patch: object): void {
    const manifest = readJson(join(dir, "beats.json"));
    Object.assign(manifest.beats[index], patch);
    writeJsonAt(dir, "beats.json", manifest);
  }

  test("音频缺失、路径不符、tts 回执过期、静音拍时长错误都报 error", () => {
    withClone((dir) => {
      // 先跑一次绿的，确认回执存在；再删音频，回执必须被撤掉。
      assert.equal(check(dir).status, 0);
      assert.ok(existsSync(join(dir, ".avp", "check.json")));
      rmSync(join(dir, "audio", "example", "1.wav"));
      const missing = check(dir);
      assert.equal(missing.status, 1);
      assert.equal(missing.json.ok, false);
      const finding = findError(missing, "audio-missing");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.chapter, "example");
      assert.equal(finding.field, "audio");
      assert.match(finding.message, /audio\/example\/1\.wav/u);
      assert.ok(finding.fix);
      assert.equal(existsSync(join(dir, ".avp", "check.json")), false);
    });

    withClone((dir) => {
      updateBeat(dir, 1, { audio: "audio/example/9.wav" });
      const run = check(dir);
      assert.equal(run.status, 1);
      const finding = findError(run, "audio-path-mismatch");
      assert.equal(finding.beatId, "example-2");
      assert.equal(finding.field, "audio");
      assert.match(finding.message, /audio\/example\/2\.wav/u);
      findError(run, "audio-missing");
    });

    withClone((dir) => {
      const manifest = readJson(join(dir, ".avp", "tts.json"));
      manifest.beats["example-1"].durationMs += 500;
      writeJsonAt(dir, ".avp/tts.json", manifest);
      const run = check(dir);
      const finding = findError(run, "audio-duration-mismatch");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.field, "durationMs");
    });

    withClone((dir) => {
      const manifest = readJson(join(dir, ".avp", "tts.json"));
      delete manifest.beats["example-1"];
      writeJsonAt(dir, ".avp/tts.json", manifest);
      const run = check(dir);
      const finding = findError(run, "audio-tts-missing");
      assert.equal(finding.beatId, "example-1");
      assert.match(finding.message, /\.avp\/tts\.json/u);
    });

    withClone((dir) => {
      const manifest = readJson(join(dir, ".avp", "tts.json"));
      manifest.beats["example-1"].sha256 = "0".repeat(64);
      writeJsonAt(dir, ".avp/tts.json", manifest);
      const run = check(dir);
      const finding = findError(run, "audio-tts-mismatch");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.field, "sha256");
    });

    withClone((dir) => {
      updateBeat(dir, 0, { tts: null });
      const run = check(dir);
      const finding = findError(run, "audio-tts-missing");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.field, "tts");
    });

    withClone((dir) => {
      updateBeat(dir, 2, { durationMs: 1000 });
      const run = check(dir);
      const finding = findError(run, "silent-beat-invalid");
      assert.equal(finding.beatId, "example-3");
      assert.equal(finding.field, "durationMs");
    });

    withClone((dir) => {
      updateBeat(dir, 2, {
        tts: { backend: "fake", voice: "zf_xiaoxiao", speed: 1, hash: "x" },
      });
      const run = check(dir);
      const finding = findError(run, "silent-beat-invalid");
      assert.equal(finding.beatId, "example-3");
      assert.equal(finding.field, "tts");
    });
  });

  test("字幕超宽、数字/专名不一致：全角数字归一，连字符专名按整词比较", () => {
    withClone((dir) => {
      updateBeat(dir, 1, {
        caption: "一二三四五六七八九十一二三四五六七八九十",
      });
      const run = check(dir, ["--only=caption-too-wide"]);
      assert.equal(run.status, 1);
      const finding = findError(run, "caption-too-wide");
      assert.equal(finding.beatId, "example-2");
      assert.equal(finding.field, "caption");
      assert.match(finding.message, /20 个全角字符/u);
      assert.match(finding.message, /上限 18/u);
      assert.ok(finding.fix);
    });

    withClone((dir) => {
      updateBeat(dir, 0, { caption: "SWE bench 2 → 0" });
      const run = check(dir, ["--only=say-caption-token-mismatch"]);
      assert.equal(run.status, 1);
      const finding = findError(run, "say-caption-token-mismatch");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.field, "caption");
      assert.match(finding.message, /SWE-bench/u);
    });

    withClone((dir) => {
      updateBeat(dir, 0, {
        say: "覆盖率 ９０％。",
        caption: "覆盖率 90%",
      });
      const run = check(dir, ["--only=say-caption-token-mismatch"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.errors, []);
    });

    withClone((dir) => {
      updateBeat(dir, 0, { say: "ROI 90%。", caption: "90" });
      const run = check(dir, ["--only=say-caption-token-mismatch"]);
      const finding = findError(run, "say-caption-token-mismatch");
      assert.match(finding.message, /ROI/u);
      assert.match(finding.message, /90%/u);
    });
  });

  test("口播源漂移：say 改动与拍数变化都报 beats-drift", () => {
    withClone((dir) => {
      writeNarrations(dir, [
        { say: SAYS[0]!, caption: CAPTIONS[0] },
        { say: "改过的口播。" },
        { say: "", motion: "static" },
      ]);
      const run = check(dir, ["--only=beats-drift"]);
      assert.equal(run.status, 1);
      const finding = run.json.errors.find(
        (item: any) => item.beatId === "example-2" && item.field === "say",
      );
      assert.ok(finding, JSON.stringify(run.json.errors));
      assert.match(finding.message, /改过的口播/u);
      assert.match(finding.message, /narrations\.ts/u);
      assert.ok(finding.fix);
    });

    withClone((dir) => {
      writeNarrations(dir, [
        { say: SAYS[0]!, caption: CAPTIONS[0] },
        { say: "短句。" },
        { say: "", motion: "static" },
        { say: "多出来的一拍。", caption: "多一拍" },
      ]);
      const run = check(dir, ["--only=beats-drift"]);
      assert.equal(run.status, 1);
      const extra = run.json.errors.find(
        (item: any) => item.beatId === "example-4" && item.field === "beats",
      );
      assert.ok(extra, JSON.stringify(run.json.errors));
      assert.match(extra.message, /多了/u);
    });
  });

  test("motion: hook 缺钩子时 check 报 error；compose 拒绝；composition 缺失不崩", () => {
    withClone((dir) => {
      rmSync(join(dir, "composition", "index.html"));
      rmSync(join(dir, "composition", "hooks", "example-1.hook.ts"));

      const run = check(dir);
      assert.equal(run.status, 1);
      assert.equal(run.json.command, "check");
      const finding = findError(run, "hook-missing");
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.field, "hook");
      assert.match(finding.message, /example-1\.hook\.ts/u);
      assert.ok(finding.fix);

      const compose = runAvp(["compose", "--json"], dir);
      assert.notEqual(compose.status, 0);
      assert.equal(compose.json.error.code, "hook-missing");
    });
  });

  test("钩子超拍、非 seek-safe、空钩子、非法钩子都报 error", () => {
    withClone((dir) => {
      const hook = join(dir, "composition", "hooks", "example-1.hook.ts");

      writeFileSync(
        hook,
        `export default function (tl, root, ctx) { tl.to(root, { opacity: 1, duration: 5 }, ctx.start + 0.1); }\n`,
      );
      let run = check(dir, ["--only=hook-overrun"]);
      assert.equal(run.status, 1);
      const overrun = findError(run, "hook-overrun");
      assert.equal(overrun.beatId, "example-1");
      assert.match(overrun.message, /超过该拍时长/u);

      writeFileSync(
        hook,
        `export default function (tl, root, ctx) { tl.to(root, { opacity: 1, duration: 0.4, repeat: -1 }, ctx.start); }\n`,
      );
      run = check(dir, ["--only=hook-not-seek-safe"]);
      assert.equal(run.status, 1);
      assert.equal(findError(run, "hook-not-seek-safe").beatId, "example-1");

      writeFileSync(hook, `export default function () {}\n`);
      run = check(dir, ["--only=hook-empty"]);
      assert.equal(run.status, 1);
      assert.equal(findError(run, "hook-empty").beatId, "example-1");

      writeFileSync(hook, `export default 42;\n`);
      run = check(dir, ["--only=hook-invalid"]);
      assert.equal(run.status, 1);
      assert.equal(findError(run, "hook-invalid").beatId, "example-1");
      assert.match(findError(run, "hook-invalid").message, /export default/u);
    });
  });

  test("tokensHash 过期、语速越界、schema 未知大版本都报 error", () => {
    withClone((dir) => {
      const manifest = readJson(join(dir, "beats.json"));
      manifest.theme.tokensHash = "0".repeat(64);
      writeJsonAt(dir, "beats.json", manifest);
      const run = check(dir, ["--only=tokens-stale"]);
      assert.equal(run.status, 1);
      const finding = findError(run, "tokens-stale");
      assert.equal(finding.field, "theme.tokensHash");
      assert.match(finding.message, /bold-signal/u);
    });

    withClone((dir) => {
      const config = readJson(join(dir, "tts.json"));
      config.chapters = { example: { speed: 1.2 } };
      writeJsonAt(dir, "tts.json", config);
      const run = check(dir, ["--only=speed-out-of-range"]);
      assert.equal(run.status, 1);
      const finding = findError(run, "speed-out-of-range");
      assert.equal(finding.chapter, "example");
      assert.equal(finding.field, "chapters.example.speed");
      assert.match(finding.message, /0\.95–1\.05/u);
    });

    withClone((dir) => {
      const config = readJson(join(dir, "tts.json"));
      config.default.speed = 0.9;
      writeJsonAt(dir, "tts.json", config);
      const run = check(dir, ["--only=speed-out-of-range"]);
      assert.equal(run.status, 1);
      assert.equal(findError(run, "speed-out-of-range").field, "default.speed");
    });

    for (const file of ["beats.json", "tts.json", "project.json"]) {
      withClone((dir) => {
        const value = readJson(join(dir, file));
        value.schemaVersion = 2;
        writeJsonAt(dir, file, value);
        const run = check(dir, ["--only=schema-unknown"]);
        assert.equal(run.status, 1, file);
        const finding = findError(run, "schema-unknown");
        assert.match(finding.message, new RegExp(file.replace(".", "\\."), "u"));
        assert.equal(finding.field, "schemaVersion");
      });
    }

    withClone((dir) => {
      const manifest = readJson(join(dir, "beats.json"));
      manifest.schemaVersion = 1.5;
      writeJsonAt(dir, "beats.json", manifest);
      const run = check(dir, ["--only=schema-unknown"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.errors, []);
    });
  });

  test("音色偏离与 skill commit 漂移是 warning：只报不拦，exit 0", () => {
    withClone((dir) => {
      const config = readJson(join(dir, "tts.json"));
      config.chapters = { example: { voice: "zf_xiaobei" } };
      writeJsonAt(dir, "tts.json", config);
      const run = check(dir);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      const finding = run.json.warnings.find(
        (item: any) =>
          item.id === "voice-divergence" &&
          item.chapter === "example" &&
          !item.beatId,
      );
      assert.ok(finding, JSON.stringify(run.json.warnings));
      assert.match(finding.message, /zf_xiaobei/u);
      assert.match(finding.message, /zf_xiaoxiao/u);
      assert.ok(run.json.warnings.some((item: any) => item.id === "caption-derived"));
    });

    withClone((dir) => {
      const manifest = readJson(join(dir, "beats.json"));
      manifest.beats[0].tts.voice = "zf_xiaobei";
      writeJsonAt(dir, "beats.json", manifest);
      const run = check(dir);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      const finding = run.json.warnings.find(
        (item: any) =>
          item.id === "voice-divergence" && item.beatId === "example-1",
      );
      assert.ok(finding, JSON.stringify(run.json.warnings));
      assert.equal(finding.field, "tts.voice");
    });

    withClone((dir) => {
      const ledger = readJson(join(dir, "project.json"));
      ledger.skill.commit = "0".repeat(40);
      writeJsonAt(dir, "project.json", ledger);
      const run = check(dir);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      const finding = run.json.warnings.find(
        (item: any) => item.id === "skill-commit-drift",
      );
      assert.ok(finding, JSON.stringify(run.json.warnings));
      assert.match(finding.message, /0000000/u);
      assert.match(finding.message, /pinned commit/u);
      assert.ok(finding.fix);
    });
  });

  test("--only 过滤检查项；未知 id 拒绝；过滤运行不写渲染闸回执", () => {
    withClone((dir) => {
      const run = check(dir, ["--only=caption-derived"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.command, "check");
      assert.deepEqual(run.json.errors, []);
      assert.equal(run.json.warnings.length, 1);
      assert.equal(run.json.warnings[0].id, "caption-derived");
      assert.deepEqual(run.json.reports, []);
      assert.deepEqual(run.json.summary, {
        errors: 0,
        warnings: 1,
        reports: 0,
      });
      assert.equal(existsSync(join(dir, ".avp", "check.json")), false);
    });

    withClone((dir) => {
      const run = check(dir, ["--only=audio-missing"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.errors, []);
      assert.deepEqual(run.json.warnings, []);
      assert.deepEqual(run.json.reports, []);
      assert.deepEqual(run.json.summary, {
        errors: 0,
        warnings: 0,
        reports: 0,
      });
    });

    withClone((dir) => {
      const run = check(dir, ["--only=no-such-check"]);
      assert.equal(run.status, 1);
      assert.equal(run.json.ok, false);
      assert.equal(run.json.error.code, "unknown-check-id");
      assert.match(run.json.error.message, /audio-missing/u);
    });
  });

  test("人话输出按 level 分组并打印 fix", () => {
    withClone((dir) => {
      rmSync(join(dir, "audio", "example", "1.wav"));
      const run = check(dir, [], false);
      assert.equal(run.status, 1);
      assert.match(run.stdout, /ERROR/u);
      assert.match(run.stdout, /audio-missing/u);
      assert.match(run.stdout, /fix:/u);
      assert.match(run.stdout, /WARNING/u);
      assert.match(run.stdout, /REPORT/u);
      assert.match(run.stdout, /example-1/u);
    });
  });

  test("未知 flag 与位置参数被拒绝", () => {
    withClone((dir) => {
      const flag = runAvp(["check", "--nope", "--json"], dir);
      assert.equal(flag.status, 1);
      assert.equal(flag.json.error.code, "unknown-flag");

      const positional = runAvp(["check", "foo", "--json"], dir);
      assert.equal(positional.status, 1);
      assert.match(positional.json.error.message, /不接受位置参数/u);
    });
  });

  test("status 把 hooks / 回执 / 音频算进 check 的输入哈希", () => {
    withClone((dir) => {
      assert.equal(check(dir).status, 0);
      const checkStep = (): any =>
        runAvp(["status", "--json"], dir).json.steps.find(
          (step: any) => step.step === "check",
        );
      assert.equal(checkStep().status, "current");

      writeFileSync(
        join(dir, "composition", "hooks", "example-1.hook.ts"),
        `${readFileSync(join(dir, "composition", "hooks", "example-1.hook.ts"), "utf8")}\n// touched\n`,
      );
      assert.equal(checkStep().status, "stale");

      assert.equal(check(dir).status, 0);
      assert.equal(checkStep().status, "current");

      const audioPath = join(dir, "audio", "example", "1.wav");
      const bytes = readFileSync(audioPath);
      bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 0xff;
      writeFileSync(audioPath, bytes);
      assert.equal(checkStep().status, "stale");
      const run = check(dir);
      assert.equal(run.status, 1);
      findError(run, "audio-tts-mismatch");
    });
  });

  test("findings 按 beat id 自然序稳定排序", () => {
    withClone((dir) => {
      const wide = "一二三四五六七八九十一二三四五六七八九十";
      updateBeat(dir, 1, { caption: wide });
      updateBeat(dir, 0, { caption: wide });
      const run = check(dir, ["--only=caption-too-wide"]);
      assert.equal(run.status, 1);
      assert.deepEqual(
        run.json.errors.map((item: any) => item.beatId),
        ["example-1", "example-2"],
      );
    });
  });

  test("干净项目输出三级结果：没有 error，derived warning，时长表与静帧 report", () => {
    withClone((dir) => {
      const run = check(dir);
      assert.equal(run.status, 0, `${run.stderr}\n${JSON.stringify(run.json.errors, null, 2)}`);
      assert.equal(run.json.ok, true);
      assert.equal(run.json.command, "check");
      assert.deepEqual(run.json.errors, []);

      const derived = run.json.warnings.find(
        (item: any) => item.id === "caption-derived",
      );
      assert.ok(derived);
      assert.match(derived.message, /2\/3/u);
      assert.match(derived.message, /example-2/u);
      assert.match(derived.message, /example-3/u);

      const beats = readJson(join(dir, "beats.json")).beats;
      const total = beats.reduce(
        (sum: number, beat: any) => sum + beat.durationMs,
        0,
      );
      const table = run.json.reports.find(
        (item: any) => item.id === "duration-table",
      );
      assert.ok(table);
      assert.match(table.message, /example/u);
      assert.match(table.message, /3 拍/u);
      assert.match(table.message, new RegExp(String(total), "u"));
      assert.match(table.message, /example-1/u);

      const stills = run.json.reports.filter(
        (item: any) => item.id === "still-frames",
      );
      assert.equal(stills.length, 3);
      let start = 0;
      beats.forEach((beat: any, index: number) => {
        assert.equal(stills[index].beatId, beat.id);
        assert.deepEqual(stills[index].atMs, [
          start + 200,
          start + beat.durationMs - 200,
        ]);
        assert.equal(stills[index].kind, "still");
        start += beat.durationMs;
      });

      assert.deepEqual(run.json.summary, {
        errors: 0,
        warnings: 1,
        reports: 4,
      });

      const receipt = readJson(join(dir, ".avp", "check.json"));
      assert.equal(receipt.ok, true);
      assert.equal(receipt.command, "check");
      assert.equal(receipt.summary.reports, 4);

      const status = runAvp(["status", "--json"], dir);
      const checkStep = status.json.steps.find(
        (step: any) => step.step === "check",
      );
      assert.equal(checkStep.status, "current");
    });
  });
});
