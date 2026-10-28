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
      updateBeat(dir, 0, { caption: "SWE-bench 2 → 0 用 GPT-5" });
      const run = check(dir, ["--only=say-caption-token-mismatch"]);
      assert.equal(run.status, 1);
      const finding = findError(run, "say-caption-token-mismatch");
      assert.equal(finding.beatId, "example-1");
      assert.match(finding.message, /GPT-5/u);
      assert.match(finding.message, /多了/u);
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

  test("字幕含省略号是 warning：带 beat id、不拦 check、可按 id 过滤", () => {
    /** 从口播源改 caption 再 plan，保证 beats.json 不与 narrations.ts 漂移。 */
    function withCaption(caption: string, fn: (dir: string) => void): void {
      withClone((dir) => {
        writeNarrations(dir, [
          { say: SAYS[0]!, caption },
          { say: SAYS[1]! },
          { say: SAYS[2]!, motion: "static" },
        ]);
        const plan = runAvp(["plan", "--json"], dir);
        assert.equal(plan.status, 0, plan.stderr);
        // plan 会重写 beats.json；tts 把实测时长与 tts 元组写回去。
        const tts = runAvp(["tts", "--json"], dir);
        assert.equal(tts.status, 0, tts.stderr);
        fn(dir);
      });
    }

    withCaption("SWE-bench 2 → 0…", (dir) => {
      const run = check(dir);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      const finding = run.json.warnings.find(
        (item: any) => item.id === "caption-ellipsis",
      );
      assert.ok(finding, JSON.stringify(run.json.warnings));
      assert.equal(finding.beatId, "example-1");
      assert.equal(finding.chapter, "example");
      assert.equal(finding.field, "caption");
      assert.match(finding.message, /SWE-bench 2 → 0…/u);
      assert.match(finding.message, /截断/u);
      assert.ok(finding.fix);
      assert.match(finding.fix, /改写/u);
    });

    withCaption("SWE-bench 2 → 0...", (dir) => {
      const run = check(dir, ["--only=caption-ellipsis"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.deepEqual(run.json.errors, []);
      assert.equal(run.json.warnings.length, 1);
      assert.equal(run.json.warnings[0].id, "caption-ellipsis");
      assert.equal(run.json.warnings[0].beatId, "example-1");
      assert.match(run.json.warnings[0].message, /\.\.\./u);
      assert.deepEqual(run.json.reports, []);
    });

    withCaption("SWE-bench 2 → 0", (dir) => {
      const run = check(dir, ["--only=caption-ellipsis"]);
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
      // say 里的省略号不算：字幕才是给眼睛的那一行。
      updateBeat(dir, 0, { say: "SWE-bench 从 2 降到 0…" });
      const run = check(dir, ["--only=caption-ellipsis"]);
      assert.deepEqual(run.json.warnings, []);
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
      assert.match(derived.message, /1\/3/u);
      assert.match(derived.message, /example-2/u);
      assert.doesNotMatch(derived.message, /example-3/u);

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

// ---------------------------------------------------------------------------
// 张力检查（#18）：全部走 CLI 边界 —— 造临时项目、跑 check --json、读 findings。
// ---------------------------------------------------------------------------

interface TensionNarration {
  say: string;
  caption?: string;
}

interface TensionChapter {
  id: string;
  narrations: TensionNarration[];
  /** `> **张力线**：` 后面的内容；省略时给一个合法默认（还扣本章末拍 + re-hook）。 */
  tension?: string;
}

/**
 * fake 后端时长 = max(700, 字数 × 220 / speed) + 300ms 尾隙。
 * 用固定字数的中文长句造出可控的 25s / 40s / 47s / 65s / 70s 拍。
 */
const TENSION_FILLER =
  "这一句只是用来把口播拉长，让相邻还扣之间隔开足够久，观众才可能忘记开头提出的问题。";

function longTensionSay(chars: number, head = "先看这一段。"): string {
  let text = head;
  while ([...text].length < chars) text += TENSION_FILLER;
  return [...text].slice(0, chars).join("");
}

function narrationAlias(id: string): string {
  return `${id.replace(/[^a-z0-9]/gu, "_")}Narrations`;
}

function writeChapterRegistry(dir: string, ids: string[]): void {
  const imports = ids
    .map(
      (id, index) =>
        `import { narrations as ${narrationAlias(id)} } from "../chapters/0${index + 1}-${id}/narrations";`,
    )
    .join("\n");
  const entries = ids
    .map(
      (id) =>
        `  {\n    id: ${JSON.stringify(id)},\n    title: ${JSON.stringify(id)},\n    narrations: ${narrationAlias(id)},\n  },`,
    )
    .join("\n");
  writeFileSync(
    join(dir, "presentation", "src", "registry", "chapters.ts"),
    `import type { ChapterDef } from "./types";\n${imports}\n\nexport const CHAPTERS: ChapterDef[] = [\n${entries}\n];\n`,
    "utf8",
  );
}

function writeChapterNarrations(
  dir: string,
  folder: string,
  narrations: TensionNarration[],
): void {
  const body = narrations
    .map((entry) => {
      const fields = [`say: ${JSON.stringify(entry.say)}`];
      if (entry.caption !== undefined) {
        fields.push(`caption: ${JSON.stringify(entry.caption)}`);
      }
      fields.push(`motion: "static"`);
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");
  const folderPath = join(dir, "presentation", "src", "chapters", folder);
  mkdirSync(folderPath, { recursive: true });
  writeFileSync(
    join(folderPath, "narrations.ts"),
    `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = [\n${body}\n];\n`,
    "utf8",
  );
}

/**
 * 造一个带张力计划的项目：多章节 registry + narrations + script + outline，
 * 跑 plan 与 fake tts 拿到实测时长。所有拍都是 static，所以不需要钩子文件。
 */
function buildTensionProject(
  chapters: TensionChapter[],
  options: { plantBeat?: number; finalBeat?: number } = {},
): string {
  const dir = tempProject("avp-check-tension-");
  const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
  assert.equal(init.status, 0, init.stderr);

  writeChapterRegistry(
    dir,
    chapters.map((chapter) => chapter.id),
  );

  const says: string[] = [];
  const chapterBlocks: string[] = [];
  let globalBeat = 0;
  chapters.forEach((chapter, index) => {
    writeChapterNarrations(
      dir,
      `0${index + 1}-${chapter.id}`,
      chapter.narrations,
    );
    says.push(...chapter.narrations.map((narration) => narration.say));
    globalBeat += chapter.narrations.length;
    const tension =
      chapter.tension ??
      `还扣「本章先给一部分答案」@拍 ${globalBeat}｜re-hook：把本章挂回开头的问题`;
    chapterBlocks.push(
      `## ${index + 1}. ${chapter.id} — 测试章节\n\n> **张力线**：${tension}\n`,
    );
  });

  writeScript(dir, says);
  const totalBeats = globalBeat;
  const plantBeat = options.plantBeat ?? 1;
  const finalBeat = options.finalBeat ?? totalBeats;
  writeFileSync(
    join(dir, "outline.md"),
    [
      "# Video Outline",
      "",
      `> **埋扣**：全片要回答的那个问题到底是什么？ —— 第 ${plantBeat} 拍抛出，第 ${finalBeat} 拍总还扣`,
      `> **总还扣**：答案就在每一次兑现里。 —— 第 ${finalBeat} 拍`,
      "",
      ...chapterBlocks,
    ].join("\n"),
    "utf8",
  );

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
  return dir;
}

function withTensionProject(
  chapters: TensionChapter[],
  fn: (dir: string) => void,
  options: { plantBeat?: number; finalBeat?: number } = {},
): void {
  const dir = buildTensionProject(chapters, options);
  try {
    fn(dir);
  } finally {
    cleanup(dir);
  }
}

function durationSum(
  beats: any[],
  from: number,
  to: number,
): number {
  return beats
    .slice(from, to)
    .reduce((sum: number, beat: any) => sum + beat.durationMs, 0);
}

const TENSION_CHECK_IDS = new Set([
  "chapter-rehook-missing",
  "recall-gap",
  "interrupt-spacing",
  "numeric-run",
  "rhythm-uniformity",
]);

/** 只从 check --json 的公开结论里取张力类 findings。 */
function tensionIds(run: ReturnType<typeof runAvp>): string[] {
  return [...run.json.errors, ...run.json.warnings, ...run.json.reports]
    .map((finding: any) => finding.id)
    .filter((id: string) => TENSION_CHECK_IDS.has(id));
}

describe("avp check · 张力检查", () => {
  function check(
    dir: string,
    extra: string[] = [],
  ): ReturnType<typeof runAvp> {
    return runAvp(["check", "--json", ...extra], dir);
  }

  test("chapter-rehook-missing：章张力线缺 re-hook 报 warning，有 re-hook 不报", () => {
    const chapters: TensionChapter[] = [
      {
        id: "alpha",
        narrations: [
          { say: "第一句。", caption: "第一句" },
          { say: "第二句。", caption: "第二句" },
          { say: "第三句。", caption: "第三句" },
        ],
        tension: "还扣「本章的答案」@拍 3｜re-hook：把问题挂回开头",
      },
    ];

    withTensionProject(chapters, (dir) => {
      const run = check(dir, ["--only=chapter-rehook-missing"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.deepEqual(run.json.warnings, []);
    });

    withTensionProject(chapters, (dir) => {
      const outline = readFileSync(join(dir, "outline.md"), "utf8");
      writeFileSync(
        join(dir, "outline.md"),
        outline.replace("｜re-hook：把问题挂回开头", ""),
        "utf8",
      );
      const run = check(dir, ["--only=chapter-rehook-missing"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.equal(run.json.warnings.length, 1);
      const finding = run.json.warnings[0];
      assert.equal(finding.id, "chapter-rehook-missing");
      assert.equal(finding.level, "warning");
      assert.equal(finding.beatId, "alpha-1");
      assert.equal(finding.chapter, "alpha");
      assert.equal(finding.field, "rehook");
      assert.match(finding.message, /alpha/u);
      assert.match(finding.message, /re-hook/u);
      assert.ok(finding.fix);
    });
  });

  test("recall-gap：长片相邻还扣 >5 分钟报 warning，约 280s 不报，--only 只回该 id", () => {
    // 正例：前 7 拍各 ~47s → 第 1 拍抛出到第 8 拍部分还扣间隔 ~330s；
    // 第 8 拍到末拍只有 ~280s。总时长 ~675s > 10 分钟。
    const positive: TensionChapter[] = [
      {
        id: "alpha",
        narrations: [
          ...Array.from({ length: 7 }, () => ({
            say: longTensionSay(213),
            caption: "先看这一段",
          })),
          ...Array.from({ length: 4 }, () => ({
            say: longTensionSay(317),
            caption: "先看这一段",
          })),
          { say: longTensionSay(295), caption: "先看这一段" },
        ],
        tension: "还扣「先给一部分答案」@拍 8｜re-hook：把问题挂回开头",
      },
    ];
    withTensionProject(positive, (dir) => {
      const beats = readJson(join(dir, "beats.json")).beats;
      const total = durationSum(beats, 0, beats.length);
      assert.ok(total > 600_000, `正例总时长需 >10 分钟，实际 ${total}ms`);
      const gapMs = durationSum(beats, 0, 7);
      assert.ok(gapMs > 300_000, `正例间隔需 >5 分钟，实际 ${gapMs}ms`);

      const run = check(dir, ["--only=recall-gap"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.deepEqual(run.json.errors, []);
      assert.deepEqual(run.json.reports, []);
      assert.equal(run.json.warnings.length, 1);
      const finding = run.json.warnings[0];
      assert.equal(finding.id, "recall-gap");
      assert.equal(finding.level, "warning");
      assert.equal(finding.beatId, "alpha-8");
      assert.equal(finding.chapter, "alpha");
      assert.match(finding.message, /alpha-1/u);
      assert.match(finding.message, /alpha-8/u);
      assert.match(
        finding.message,
        new RegExp(`${(gapMs / 60_000).toFixed(1)} 分钟`, "u"),
      );
      assert.match(finding.message, /5 分钟/u);
      assert.ok(finding.fix);
      assert.deepEqual(run.json.summary, {
        errors: 0,
        warnings: 1,
        reports: 0,
      });
    });

    // 反例：同样 >10 分钟，但相邻 recall 间隔 ~280s，未超 5 分钟。
    const negative: TensionChapter[] = [
      {
        id: "alpha",
        narrations: [
          ...Array.from({ length: 7 }, () => ({
            say: longTensionSay(181),
            caption: "先看这一段",
          })),
          ...Array.from({ length: 4 }, () => ({
            say: longTensionSay(317),
            caption: "先看这一段",
          })),
          { say: longTensionSay(295), caption: "先看这一段" },
        ],
        tension: "还扣「先给一部分答案」@拍 8｜re-hook：把问题挂回开头",
      },
    ];
    withTensionProject(negative, (dir) => {
      const beats = readJson(join(dir, "beats.json")).beats;
      const total = durationSum(beats, 0, beats.length);
      assert.ok(total > 600_000, `反例仍需 >10 分钟，实际 ${total}ms`);
      const gapMs = durationSum(beats, 0, 7);
      assert.ok(gapMs < 300_000, `反例间隔需 <5 分钟，实际 ${gapMs}ms`);

      const run = check(dir, ["--only=recall-gap"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.warnings, []);
      assert.deepEqual(run.json.errors, []);
      assert.deepEqual(run.json.reports, []);
    });
  });

  test("interrupt-spacing：相邻 interrupt >120s 报 warning，<120s 不报", () => {
    const positive: TensionChapter[] = [
      {
        id: "alpha",
        narrations: Array.from({ length: 4 }, () => ({
          say: longTensionSay(213),
          caption: "先看这一段",
        })),
        tension:
          "还扣「先看边界」@拍 4｜re-hook：把问题挂回开头｜interrupt@拍 1",
      },
      {
        id: "beta",
        narrations: Array.from({ length: 4 }, () => ({
          say: longTensionSay(213),
          caption: "先看这一段",
        })),
        tension:
          "还扣「再看结果」@拍 5｜re-hook：把数字落到代价｜interrupt@拍 5",
      },
    ];
    withTensionProject(positive, (dir) => {
      const beats = readJson(join(dir, "beats.json")).beats;
      const gapMs = durationSum(beats, 0, 4);
      assert.ok(gapMs > 120_000, `正例间隔需 >120s，实际 ${gapMs}ms`);

      const run = check(dir, ["--only=interrupt-spacing"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.equal(run.json.warnings.length, 1);
      const finding = run.json.warnings[0];
      assert.equal(finding.id, "interrupt-spacing");
      assert.equal(finding.level, "warning");
      assert.equal(finding.beatId, "beta-1");
      assert.equal(finding.chapter, "beta");
      assert.match(finding.message, /alpha-1/u);
      assert.match(finding.message, /beta-1/u);
      assert.match(finding.message, /120/u);
      assert.match(
        finding.message,
        new RegExp(`${Number((gapMs / 1000).toFixed(1))} 秒`, "u"),
      );
      assert.ok(finding.fix);
    });

    // 反例：每拍 ~25s，相邻 interrupt 只隔 ~100s。
    const negative: TensionChapter[] = [
      {
        id: "alpha",
        narrations: Array.from({ length: 4 }, () => ({
          say: longTensionSay(113),
          caption: "先看这一段",
        })),
        tension:
          "还扣「先看边界」@拍 4｜re-hook：把问题挂回开头｜interrupt@拍 1",
      },
      {
        id: "beta",
        narrations: Array.from({ length: 4 }, () => ({
          say: longTensionSay(113),
          caption: "先看这一段",
        })),
        tension:
          "还扣「再看结果」@拍 5｜re-hook：把数字落到代价｜interrupt@拍 5",
      },
    ];
    withTensionProject(negative, (dir) => {
      const beats = readJson(join(dir, "beats.json")).beats;
      const gapMs = durationSum(beats, 0, 4);
      assert.ok(gapMs < 120_000, `反例间隔需 <120s，实际 ${gapMs}ms`);
      const run = check(dir, ["--only=interrupt-spacing"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.warnings, []);
    });
  });

  test("numeric-run：连续 3 拍、章内占比 >40% 分别报 warning；2 连与 40% 不报", () => {
    const numericSay = "这里出现了 3 个数字。";
    const numericCaption = "出现 3 个数字";
    const plainSay = "这一拍不放数字。";
    const plainCaption = "这一拍不放数字";
    const chapter = (
      numericIndices: number[],
      totalBeats: number,
      tension: string,
    ): TensionChapter => ({
      id: "alpha",
      narrations: Array.from({ length: totalBeats }, (_, index) =>
        numericIndices.includes(index)
          ? { say: numericSay, caption: numericCaption }
          : { say: plainSay, caption: plainCaption },
      ),
      tension,
    });

    // 3 连：3/8 = 37.5%，只触发连续 run。
    withTensionProject(
      [chapter([3, 4, 5], 8, "还扣「本章的答案」@拍 8｜re-hook：把问题挂回开头")],
      (dir) => {
        const run = check(dir, ["--only=numeric-run"]);
        assert.equal(run.status, 0, JSON.stringify(run.json.errors));
        assert.equal(run.json.ok, true);
        assert.equal(run.json.warnings.length, 1);
        const finding = run.json.warnings[0];
        assert.equal(finding.id, "numeric-run");
        assert.equal(finding.level, "warning");
        assert.equal(finding.beatId, "alpha-4");
        assert.equal(finding.chapter, "alpha");
        assert.match(finding.message, /连续/u);
        assert.match(finding.message, /alpha-4/u);
        assert.match(finding.message, /alpha-6/u);
        assert.match(finding.message, /3 拍/u);
      },
    );

    // 2 连 + 2/5 = 40%：两个阈值都没超。
    withTensionProject(
      [chapter([0, 1], 5, "还扣「本章的答案」@拍 5｜re-hook：把问题挂回开头")],
      (dir) => {
        const run = check(dir, ["--only=numeric-run"]);
        assert.equal(run.status, 0, JSON.stringify(run.json.errors));
        assert.deepEqual(run.json.warnings, []);
      },
    );

    // 3/5 = 60% 但数字拍不相邻：只触发占比。
    withTensionProject(
      [chapter([0, 2, 4], 5, "还扣「本章的答案」@拍 5｜re-hook：把问题挂回开头")],
      (dir) => {
        const run = check(dir, ["--only=numeric-run"]);
        assert.equal(run.status, 0, JSON.stringify(run.json.errors));
        assert.equal(run.json.warnings.length, 1);
        const finding = run.json.warnings[0];
        assert.equal(finding.id, "numeric-run");
        assert.equal(finding.beatId, "alpha-1");
        assert.match(finding.message, /3\/5/u);
        assert.match(finding.message, /60%/u);
        assert.doesNotMatch(finding.message, /连续/u);
      },
    );
  });

  test("rhythm-uniformity：4 拍句长完全相同只报 report，句长有差异不报", () => {
    const equal: TensionChapter[] = [
      {
        id: "alpha",
        narrations: Array.from({ length: 4 }, () => ({
          say: "同样长度的一句话。",
          caption: "同样长度",
        })),
        tension: "还扣「本章的答案」@拍 4｜re-hook：把问题挂回开头",
      },
    ];
    withTensionProject(equal, (dir) => {
      const run = check(dir, ["--only=rhythm-uniformity"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.deepEqual(run.json.warnings, []);
      assert.deepEqual(run.json.errors, []);
      assert.equal(run.json.reports.length, 1);
      const finding = run.json.reports[0];
      assert.equal(finding.id, "rhythm-uniformity");
      assert.equal(finding.level, "report");
      assert.equal(finding.beatId, "alpha-1");
      assert.equal(finding.chapter, "alpha");
      assert.match(finding.message, /0\.000/u);
      assert.match(finding.message, /变异系数/u);
      assert.match(finding.message, /8/u);
      assert.ok(finding.message.includes("/"));
    });

    const varied: TensionChapter[] = [
      {
        id: "alpha",
        narrations: [
          { say: "短。", caption: "短" },
          { say: "这一句话稍微长一点。", caption: "稍微长一点" },
          {
            say: "这一句比刚才那句还要再长一些。",
            caption: "还要再长一些",
          },
          {
            say: "最后这一句话写得最长，用来把句长变异系数拉开足够大的差距。",
            caption: "最长的一句",
          },
        ],
        tension: "还扣「本章的答案」@拍 4｜re-hook：把问题挂回开头",
      },
    ];
    withTensionProject(varied, (dir) => {
      const run = check(dir, ["--only=rhythm-uniformity"]);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.deepEqual(run.json.reports, []);
    });
  });

  test("全部张力结论只报不拦：ok 为 true、exit 0，warnings/reports 都在 JSON 里", () => {
    const alphaSays = Array.from({ length: 8 }, () => ({
      say: longTensionSay(213),
      caption: "先看这一段",
    }));
    const betaSays = Array.from({ length: 4 }, () => ({
      say: longTensionSay(317, "这是第 3 段。"),
      caption: "这是第 3 段",
    }));
    const chapters: TensionChapter[] = [
      {
        id: "alpha",
        narrations: alphaSays,
        tension:
          "还扣「先看边界」@拍 8｜re-hook：把问题挂回开头｜interrupt@拍 4",
      },
      {
        id: "beta",
        narrations: betaSays,
        tension:
          "还扣「再看结果」@拍 9｜re-hook：把数字落到代价｜interrupt@拍 10",
      },
    ];

    withTensionProject(chapters, (dir) => {
      // 手改 outline 去掉 alpha 的 re-hook：check 必须容忍，并报 warning。
      const outline = readFileSync(join(dir, "outline.md"), "utf8");
      writeFileSync(
        join(dir, "outline.md"),
        outline.replace("｜re-hook：把问题挂回开头", ""),
        "utf8",
      );

      const run = check(dir);
      assert.equal(run.status, 0, JSON.stringify(run.json.errors));
      assert.equal(run.json.ok, true);
      assert.deepEqual(run.json.errors, []);

      const warningIds = new Set(
        run.json.warnings.map((finding: any) => finding.id),
      );
      for (const id of [
        "chapter-rehook-missing",
        "recall-gap",
        "interrupt-spacing",
        "numeric-run",
      ]) {
        assert.ok(warningIds.has(id), `缺少 warning ${id}`);
      }
      const rhythm = run.json.reports.filter(
        (finding: any) => finding.id === "rhythm-uniformity",
      );
      assert.ok(rhythm.length >= 1, JSON.stringify(run.json.reports));

      const rehook = run.json.warnings.find(
        (finding: any) => finding.id === "chapter-rehook-missing",
      );
      assert.equal(rehook.beatId, "alpha-1");
      assert.equal(rehook.chapter, "alpha");

      const recall = run.json.warnings.find(
        (finding: any) => finding.id === "recall-gap",
      );
      assert.equal(recall.beatId, "alpha-8");
      assert.match(recall.message, /alpha-1/u);

      const interrupt = run.json.warnings.find(
        (finding: any) => finding.id === "interrupt-spacing",
      );
      assert.equal(interrupt.beatId, "beta-2");
      assert.match(interrupt.message, /alpha-4/u);

      const table = run.json.reports.find(
        (finding: any) => finding.id === "duration-table",
      );
      assert.ok(table);
      // check 的落盘回执仍然成立，render 闸不会因张力结论被拦。
      assert.equal(readJson(join(dir, ".avp", "check.json")).ok, true);
    });
  });

  test("没有张力计划的项目不崩、也不产生任何张力结论", () => {
    const chapters: TensionChapter[] = [
      {
        id: "alpha",
        narrations: [
          { say: "第一句。", caption: "第一句" },
          { say: "第二句。", caption: "第二句" },
          { say: "第三句。", caption: "第三句" },
        ],
      },
    ];
    withTensionProject(chapters, (dir) => {
      const outlinePath = join(dir, "outline.md");
      const outline = readFileSync(outlinePath, "utf8");
      const blanked = outline
        .split("\n")
        .filter(
          (line) =>
            !/^\s*>\s*\*\*(?:埋扣|总还扣|张力线)\*\*/u.test(line),
        )
        .join("\n");
      writeFileSync(outlinePath, blanked, "utf8");

      const blankRun = check(dir);
      assert.equal(blankRun.status, 0, JSON.stringify(blankRun.json.errors));
      assert.equal(blankRun.json.ok, true);
      assert.deepEqual(tensionIds(blankRun), []);

      rmSync(outlinePath);
      const missingRun = check(dir);
      assert.equal(missingRun.status, 0, JSON.stringify(missingRun.json.errors));
      assert.equal(missingRun.json.ok, true);
      assert.deepEqual(tensionIds(missingRun), []);
    });
  });
});
