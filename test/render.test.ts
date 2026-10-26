import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const tokensHash = createHash("sha256").update(readFileSync(TOKENS)).digest("hex");

process.env.AVP_FAKE_RENDER = "1";

function writeNarrations(dir: string): void {
  const entries = [
    { say: "第一拍。", caption: "第一拍", motion: "hook" },
    { say: "", motion: "static" },
    { say: "第三拍。", caption: "第三拍", motion: "hook" },
  ];
  const body = entries
    .map((entry) => {
      const fields = [`say: ${JSON.stringify(entry.say)}`];
      if ("caption" in entry) fields.push(`caption: ${JSON.stringify(entry.caption)}`);
      fields.push(`motion: ${JSON.stringify(entry.motion)}`);
      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");
  writeFileSync(
    join(dir, "presentation", "src", "chapters", "01-example", "narrations.ts"),
    `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = [\n${body}\n];\n`,
    "utf8",
  );
  writeFileSync(
    join(dir, "script.md"),
    "第一拍。\n\n---\n\n\n\n---\n\n第三拍。\n",
    "utf8",
  );
}

function writeBodies(dir: string): void {
  mkdirSync(join(dir, "composition", "beats"), { recursive: true });
  mkdirSync(join(dir, "composition", "hooks"), { recursive: true });
  for (const id of ["example-1", "example-3"]) {
    writeFileSync(
      join(dir, "composition", "beats", `${id}.body.html`),
      `<div class="atom-hero in"><h1 class="atom-hero__title">${id}</h1></div>`,
    );
    writeFileSync(
      join(dir, "composition", "hooks", `${id}.hook.ts`),
      `export default function (tl, root, ctx) {\n  tl.from(root.querySelector(".atom-hero__title"), { y: 40, opacity: 0, duration: 0.5 }, ctx.start + 0.1);\n}\n`,
    );
  }
  writeFileSync(
    join(dir, "composition", "beats", "example-2.body.html"),
    `<div class="atom-quote in"><p class="atom-quote__text">静默</p></div>`,
  );
}

describe("avp render", () => {
  let dir: string;

  before(() => {
    dir = tempProject();
    const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
    assert.equal(init.status, 0, init.stderr);
    writeNarrations(dir);
    const tts = readJson(join(dir, "tts.json"));
    tts.backend = "fake";
    writeFileSync(join(dir, "tts.json"), JSON.stringify(tts, null, 2));
    writeBodies(dir);
    const plan = runAvp(["plan", "--json"], dir);
    assert.equal(plan.status, 0, plan.stdout + plan.stderr);
    const synthesize = runAvp(["tts", "--json"], dir);
    assert.equal(synthesize.status, 0, synthesize.stderr);
    const compose = runAvp(["compose", "--json"], dir);
    assert.equal(compose.status, 0, compose.stderr);
    const check = runAvp(["check", "--json"], dir);
    assert.equal(check.status, 0, check.stdout + check.stderr);
  });

  after(() => {
    cleanup(dir);
    delete process.env.AVP_FAKE_RENDER;
  });

  test("--brief 只给 check 结论 / 时长表 / 3 张缩略图，不产片", () => {
    const run = runAvp(["render", "--brief", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.brief, true);
    assert.equal(run.json.thumbnails.length, 3);
    assert.equal(run.json.check.errors, 0);
    assert.equal(run.json.chapters.length, 1);
    for (const file of run.json.thumbnails) {
      assert.ok(existsSync(join(dir, file)), file);
    }
    assert.equal(existsSync(join(dir, "output", "output.mp4")), false);

    const human = runAvp(["render", "--brief"], dir);
    assert.equal(human.status, 0, human.stderr);
    const lines = human.stdout.trim().split("\n");
    assert.equal(lines.length, 3);
    assert.match(lines[0]!, /^check：0 个 error/);
    assert.match(lines[1]!, /^时长：/);
    assert.match(lines[2]!, /^缩略图：/);
  });

  test("完整渲染产出 mp4 / 回执 / 联系表 / 静帧报告", () => {
    const run = runAvp(["render", "--json"], dir);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.json.brief, false);
    assert.ok(existsSync(join(dir, "output", "output.mp4")));
    assert.ok(existsSync(join(dir, "output", "receipt.json")));
    assert.ok(existsSync(join(dir, "output", "contact-sheet.png")));
    assert.ok(existsSync(join(dir, "output", "still-report.json")));

    const receipt = readJson(join(dir, "output", "receipt.json"));
    assert.equal(receipt.schemaVersion, 1);
    assert.equal(receipt.output.file, "output/output.mp4");
    assert.equal(receipt.output.sha256.length, 64);
    assert.equal(receipt.audio.length, 2);
    assert.ok(receipt.hashes.beats.length === 64);
    assert.ok(receipt.hashes.check.length === 64);
    assert.equal(receipt.toolchain.hyperframes, "0.8.33");
    assert.equal(receipt.contactSheet.frames, 6);
    assert.equal(receipt.contactSheet.columns, 6);

    const still = readJson(join(dir, "output", "still-report.json"));
    assert.equal(still.beats.length, 3);
    assert.ok(Array.isArray(still.staticBeats));

    const status = runAvp(["status", "--json"], dir);
    const render = status.json.steps.find((step: any) => step.step === "render");
    assert.equal(render.status, "current");
  });

  test("删掉 check 回执后 render 的输入哈希为 null，status 报 stale", () => {
    // 自成一体：先确保 render 已记录，再删掉它的输入。
    const rendered = runAvp(["render", "--json"], dir);
    assert.equal(rendered.status, 0, rendered.stderr);
    const checkReport = join(dir, ".avp", "check.json");
    const backup = readFileSync(checkReport);
    rmSync(checkReport);
    try {
      const status = runAvp(["status", "--json"], dir);
      const render = status.json.steps.find(
        (step: any) => step.step === "render",
      );
      assert.equal(render.inputHash, null);
      assert.equal(render.status, "stale");
    } finally {
      writeFileSync(checkReport, backup);
    }
  });

  test("check 有 error 时拒绝渲染，且不产片", () => {
    const audio = join(dir, "audio", "example", "1.wav");
    const backup = readFileSync(audio);
    rmSync(audio);
    const run = runAvp(["render", "--json"], dir);
    assert.notEqual(run.status, 0);
    assert.equal(run.json.error.code, "check-failed");
    assert.ok(run.json.error.details.findings.length >= 1);

    writeFileSync(audio, backup);
    const retry = runAvp(["render", "--json"], dir);
    assert.equal(retry.status, 0, retry.stderr);
  });
});
