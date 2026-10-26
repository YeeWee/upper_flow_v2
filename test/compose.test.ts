import assert from "node:assert/strict";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
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

const TOKENS = join(REPO_ROOT, "themes", "bold-signal", "tokens.css");
const { createHash } = await import("node:crypto");
const { readFileSync } = await import("node:fs");
const tokensHash = createHash("sha256").update(readFileSync(TOKENS)).digest("hex");

function beatsFixture() {
  return {
    schemaVersion: 1,
    theme: { id: "bold-signal", tokensHash },
    beats: [
      {
        id: "b1",
        chapter: "alpha",
        chapterIndex: 0,
        step: 0,
        say: "第一拍。",
        caption: "第一拍",
        captionSource: "authored",
        audio: "audio/alpha/1.wav",
        durationMs: 1500,
        textHash: "t1",
        tts: { backend: "fake", voice: "zf_xiaoxiao", speed: 1, hash: "h1" },
        motion: "hook",
      },
      {
        id: "b2",
        chapter: "alpha",
        chapterIndex: 0,
        step: 1,
        say: "第二拍。",
        caption: "第二拍",
        captionSource: "authored",
        audio: "audio/alpha/2.wav",
        durationMs: 2000,
        textHash: "t2",
        tts: { backend: "fake", voice: "zf_xiaoxiao", speed: 1, hash: "h2" },
        motion: "static",
      },
      {
        id: "b3",
        chapter: "beta",
        chapterIndex: 1,
        step: 0,
        say: "第三拍。",
        caption: "第三拍",
        captionSource: "authored",
        audio: "audio/beta/1.wav",
        durationMs: 1000,
        textHash: "t3",
        tts: { backend: "fake", voice: "zf_xiaoxiao", speed: 1, hash: "h3" },
        motion: "hook",
      },
    ],
  };
}

function writeBodies(dir: string): void {
  const bodies = join(dir, "composition", "beats");
  const hooks = join(dir, "composition", "hooks");
  mkdirSync(bodies, { recursive: true });
  mkdirSync(hooks, { recursive: true });
  writeFileSync(
    join(bodies, "b1.body.html"),
    `<div class="atom-hero in"><h1 class="atom-hero__title">第一<em>拍</em></h1></div>`,
  );
  writeFileSync(
    join(bodies, "b2.body.html"),
    `<div class="atom-stat in"><div class="atom-stat__value">02</div><div class="atom-stat__label">第二</div></div>`,
  );
  writeFileSync(
    join(bodies, "b3.body.html"),
    `<div class="atom-quote in"><blockquote>第三拍</blockquote></div>`,
  );
  writeFileSync(
    join(hooks, "b1.hook.ts"),
    `export default function (tl, root, ctx) {\n  tl.from(root.querySelector(".atom-hero__title"), { y: 40, opacity: 0, duration: 0.6 }, ctx.start + 0.1);\n}\n`,
  );
  writeFileSync(
    join(hooks, "b3.hook.ts"),
    `export default function (tl, root, ctx) {\n  tl.to(root.querySelector(".atom-quote"), { opacity: 1, duration: 0.4 }, ctx.start + 0.1);\n}\n`,
  );
  // static 拍可以有旧钩子文件，compose 忽略并给出警告。
  writeFileSync(
    join(hooks, "b2.hook.ts"),
    `export default function () {}\n`,
  );
}

describe("avp compose", () => {
  let dir: string;
  let goodB3Hook: string;
  let goodBody: string;

  before(() => {
    dir = tempProject();
    const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
    assert.equal(init.status, 0, init.stderr);
    writeFileSync(join(dir, "beats.json"), JSON.stringify(beatsFixture(), null, 2));
    writeBodies(dir);
    mkdirSync(join(dir, "audio", "alpha"), { recursive: true });
    mkdirSync(join(dir, "audio", "beta"), { recursive: true });
    writeFileSync(join(dir, "audio", "alpha", "1.wav"), "wav");
    writeFileSync(join(dir, "audio", "alpha", "2.wav"), "wav");
    writeFileSync(join(dir, "audio", "beta", "1.wav"), "wav");
    goodB3Hook = readText(join(dir, "composition", "hooks", "b3.hook.ts"));
    goodBody = readText(join(dir, "composition", "beats", "b2.body.html"));
  });

  after(() => cleanup(dir));

  test("按拍生成 clip / audio / 字幕 / 本地 gsap 并记录 compose", () => {
    const run = runAvp(["compose", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.clips, 3);
    assert.equal(run.json.hooks, 2);
    assert.equal(run.json.totalMs, 4500);

    const html = readText(join(dir, "composition", "index.html"));
    assert.match(html, /id="clip-b1" data-start="0\.000" data-duration="1\.500"/);
    assert.match(html, /id="clip-b2" data-start="1\.500" data-duration="2\.000"/);
    assert.match(html, /id="clip-b3" data-start="3\.500" data-duration="1\.000"/);
    assert.match(html, /id="audio-b1" src="audio\/alpha\/1.wav"/);
    assert.match(html, /data-composition-id="main" data-start="0" data-duration="4\.500"/);
    assert.match(html, new RegExp(`avp:tokens-hash" content="${tokensHash}"`));
    assert.match(html, /beat\.start \+ 0\.3/);
    assert.match(html, /window\.__timelines\["main"\]/);
    assert.match(html, /atom-hero__title/);
    assert.ok(existsSync(join(dir, "composition", "gsap.min.js")));
    assert.ok(existsSync(join(dir, "composition", "audio", "alpha", "1.wav")));
    assert.equal(run.json.warnings.length, 1);
    assert.match(run.json.warnings[0], /static/);

    const status = runAvp(["status", "--json"], dir);
    const compose = status.json.steps.find((step: any) => step.step === "compose");
    assert.equal(compose.status, "current");
  });

  test("schemaVersion 未知大版本时拒绝 compose，且不重写合成稿", () => {
    const beatsPath = join(dir, "beats.json");
    const indexPath = join(dir, "composition", "index.html");
    const originalBeats = readText(beatsPath);
    const originalHtml = readText(indexPath);
    const doc = readJson(beatsPath);
    doc.schemaVersion = 2;
    writeFileSync(beatsPath, JSON.stringify(doc, null, 2));
    try {
      const run = runAvp(["compose", "--json"], dir);
      assert.notEqual(run.status, 0);
      assert.equal(run.json.error.code, "schema-unknown");
      assert.equal(readText(indexPath), originalHtml);
    } finally {
      writeFileSync(beatsPath, originalBeats);
    }
  });

  test("静音拍不生成 audio 元素（空 src 会让混音硬失败）", () => {
    const file = join(dir, "beats.json");
    const doc = readJson(file);
    const backup = doc.beats[2];
    doc.beats[2] = {
      ...backup,
      say: "",
      caption: "",
      captionSource: "authored",
      durationMs: 1500,
      tts: null,
      motion: "hook",
    };
    writeFileSync(file, JSON.stringify(doc, null, 2));
    const run = runAvp(["compose", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    const html = readText(join(dir, "composition", "index.html"));
    assert.doesNotMatch(html, /id="audio-b3"/);
    assert.match(html, /id="clip-b3"/);
    doc.beats[2] = backup;
    writeFileSync(file, JSON.stringify(doc, null, 2));
  });

  test("缺身体 / 缺钩子 / 身体里带 script 都拒绝", () => {
    renameSync(
      join(dir, "composition", "beats", "b2.body.html"),
      join(dir, "composition", "beats", "b2.body.html.bak"),
    );
    let run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "body-missing");
    renameSync(
      join(dir, "composition", "beats", "b2.body.html.bak"),
      join(dir, "composition", "beats", "b2.body.html"),
    );

    renameSync(
      join(dir, "composition", "hooks", "b1.hook.ts"),
      join(dir, "composition", "hooks", "b1.hook.ts.bak"),
    );
    run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "hook-missing");
    renameSync(
      join(dir, "composition", "hooks", "b1.hook.ts.bak"),
      join(dir, "composition", "hooks", "b1.hook.ts"),
    );

    writeFileSync(join(dir, "composition", "beats", "b2.body.html"), `${goodBody}<script>bad()</script>`);
    run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "body-script");
    writeFileSync(join(dir, "composition", "beats", "b2.body.html"), goodBody);
  });

  test("钩子超长 / 空钩子 / 非 seek-safe 写法都拒绝", () => {
    writeFileSync(
      join(dir, "composition", "hooks", "b3.hook.ts"),
      `export default function (tl, root, ctx) { tl.to(root, { opacity: 1, duration: 3 }, ctx.start); }`,
    );
    let run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "hook-overrun");

    writeFileSync(
      join(dir, "composition", "hooks", "b3.hook.ts"),
      `export default function (_tl, _root, _ctx) { return undefined; }`,
    );
    run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "hook-empty");

    writeFileSync(
      join(dir, "composition", "hooks", "b3.hook.ts"),
      `export default function (tl, root, ctx) { tl.to(root, { opacity: 1, duration: 0.4, repeat: -1 }, ctx.start); }`,
    );
    run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "hook-not-seek-safe");

    writeFileSync(join(dir, "composition", "hooks", "b3.hook.ts"), goodB3Hook);
  });

  test("tokens 哈希对不上时拒绝（主题漂移）", () => {
    const beats = readJson(join(dir, "beats.json"));
    beats.theme.tokensHash = "0".repeat(64);
    writeFileSync(join(dir, "beats.json"), JSON.stringify(beats, null, 2));
    const run = runAvp(["compose", "--json"], dir);
    assert.equal(run.json.error.code, "tokens-stale");

    beats.theme.tokensHash = tokensHash;
    writeFileSync(join(dir, "beats.json"), JSON.stringify(beats, null, 2));
  });

  test("--after-plan 缺少批准记录时拒绝执行", () => {
    const run = runAvp(["compose", "--after-plan", "--json"], dir);
    assert.notEqual(run.status, 0);
    assert.equal(run.json.error.code, "plan-not-approved");
  });
});
