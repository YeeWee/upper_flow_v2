import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

const EXAMPLE_SAYS = [
  "这是示例章节的第一步。把这一行换成你这一步的口播文案。",
  "第二步。每个数组元素对应章节里 step === N 的那一屏。长度必须严格相等。",
  "第三步。这个数组就是音频合成 + 自动播放的唯一真相源——再也不会和章节代码漂移。",
];

const EXAMPLE_CAPTIONS = [
  "第一步 · 换成你的文案",
  "第二步 · 每个数组元素一屏",
  "第三步 · 音频与自动播放同源",
];

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Write script.md as one beat per `---` block. */
function writeScript(dir: string, says: string[]): void {
  writeFileSync(join(dir, "script.md"), `${says.join("\n\n---\n\n")}\n`, "utf8");
}

/** Replace the template chapter's narrations with exact TS source. */
function writeNarrations(dir: string, body: string): void {
  writeFileSync(
    join(
      dir,
      "presentation",
      "src",
      "chapters",
      "01-example",
      "narrations.ts",
    ),
    `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = ${body};\n`,
    "utf8",
  );
}

/**
 * 3 拍单章节项目的张力计划（拍号全片 1-based）。`null` 表示刻意省略某条声明。
 * 章节能解析时张力计划是必需项，所以凡是「step 数与 narrations 对齐」的
 * outline 都得带上这三行。
 */
const TENSION_HOOK =
  "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 1 拍抛出，第 3 拍总还扣";
const TENSION_PAYOFF =
  "> **总还扣**：答案不在模型，在每条规则替它挡住的那一步。 —— 第 3 拍";
const TENSION_CHAPTER =
  "> **张力线**：还扣「边界不清，幻觉才有空间」@拍 2｜re-hook：开场把同一个模型的反差砸在脸上｜interrupt@拍 2";

const STEPS_3 = [
  "- step 1 (~3s) — 封面",
  "- step 2 (~3s) — 分栏",
  "- step 3 (~3s) — 收尾",
];

function writeOutline(dir: string, lines: string[]): void {
  writeFileSync(join(dir, "outline.md"), `${lines.join("\n")}\n`, "utf8");
}

function tensionOutline(
  parts: {
    hook?: string | null;
    payoff?: string | null;
    chapter?: string | null;
  } = {},
): string[] {
  const hook = parts.hook === undefined ? TENSION_HOOK : parts.hook;
  const payoff = parts.payoff === undefined ? TENSION_PAYOFF : parts.payoff;
  const chapter = parts.chapter === undefined ? TENSION_CHAPTER : parts.chapter;
  return [
    "# Video Outline",
    "",
    ...[hook, payoff].filter((line): line is string => line !== null),
    "",
    "## 1. example — 示例（3 steps · ~9s）",
    "",
    ...(chapter === null ? [] : [chapter, ""]),
    ...STEPS_3,
    "",
  ];
}

describe("avp plan", () => {
  let dir: string;

  before(() => {
    dir = tempProject();
    const init = runAvp(["init", "--theme=bold-signal", "--json"], dir);
    assert.equal(init.status, 0, init.stderr);
  });

  after(() => {
    cleanup(dir);
  });

  test("口播稿与章节一致时生成 3 拍节拍清单", () => {
    writeScript(dir, EXAMPLE_SAYS);

    const plan = runAvp(["plan", "--json"], dir);
    assert.equal(plan.status, 0, plan.stderr);
    assert.equal(plan.json.ok, true);
    assert.equal(plan.json.command, "plan");
    assert.equal(plan.json.chapters, 1);
    assert.equal(plan.json.beats, 3);
    assert.ok(plan.json.writes.includes("beats.json"));

    const manifest = readJson(join(dir, "beats.json"));
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.theme.id, "bold-signal");
    const tokens = readText(
      join(REPO_ROOT, "themes", "bold-signal", "tokens.css"),
    );
    assert.equal(manifest.theme.tokensHash, sha256(tokens));

    assert.equal(manifest.beats.length, 3);
    manifest.beats.forEach((beat: any, i: number) => {
      assert.equal(beat.id, `example-${i + 1}`);
      assert.equal(beat.chapter, "example");
      assert.equal(beat.chapterIndex, 0);
      assert.equal(beat.step, i);
      assert.equal(beat.say, EXAMPLE_SAYS[i]);
      assert.equal(beat.caption, EXAMPLE_CAPTIONS[i]);
      assert.equal(beat.captionSource, "authored");
      assert.equal(beat.audio, `audio/example/${i + 1}.wav`);
      assert.equal(beat.durationMs, null);
      assert.equal(beat.textHash, sha256(EXAMPLE_SAYS[i]!));
      assert.equal(beat.tts, null);
      assert.equal(beat.motion, "hook");
    });

    // 没有 approve 时不写批准记录
    assert.equal(existsSync(join(dir, ".avp", "approval.json")), false);

    // plan 成功后 status 里 plan 是最新
    const status = runAvp(["status", "--json"], dir);
    assert.equal(status.status, 0, status.stderr);
    const planStep = status.json.steps.find((s: any) => s.step === "plan");
    assert.equal(planStep.status, "current");
  });

  test("caption 缺失时推导，手写空串与静音拍保留 authored / static 语义", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);

      const longSay =
        "第一句要在逗号前停下才够短，但整句加上后半段就超过十八个字符了。";
      writeNarrations(
        project,
        `[
  { say: ${JSON.stringify(longSay)} },
  { say: "短句。", caption: "" },
  { say: "", caption: "静音过场" },
  { say: "", motion: "hook" },
  { say: "边界。", caption: "一二三四五六七八九十一二三四五六七八" },
]`,
      );
      writeScript(project, [longSay, "短句。", "", "", "边界。"]);

      const plan = runAvp(["plan", "--json"], project);
      assert.equal(plan.status, 0, plan.stderr);
      const beats = readJson(join(project, "beats.json")).beats;
      assert.equal(beats.length, 5);

      assert.equal(beats[0].caption, "第一句要在逗号前停下才够短");
      assert.equal(beats[0].captionSource, "derived");
      assert.equal(beats[0].motion, "hook");
      assert.ok(!beats[0].caption.includes("…"));

      // caption: "" 也是 authored，不是「缺失」
      assert.equal(beats[1].caption, "");
      assert.equal(beats[1].captionSource, "authored");

      // 静音拍默认 static；手写 caption 仍算 authored
      assert.equal(beats[2].say, "");
      assert.equal(beats[2].caption, "静音过场");
      assert.equal(beats[2].captionSource, "authored");
      assert.equal(beats[2].motion, "static");

      // 显式 motion 覆盖默认值；静音拍的空字幕是 authored 契约，不是推导
      assert.equal(beats[3].caption, "");
      assert.equal(beats[3].captionSource, "authored");
      assert.equal(beats[3].motion, "hook");

      // 恰好 18 个全角字符可以通过
      assert.equal(beats[4].caption, "一二三四五六七八九十一二三四五六七八");
    } finally {
      cleanup(project);
    }
  });

  test("字幕超宽报 caption-too-wide（手写与推导都拦，且指向 beat id）", () => {
    const authored = tempProject();
    const derived = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], authored).status, 0);
      writeNarrations(
        authored,
        `[{ say: "短句。", caption: "这是一个明显超过十八个全角字符宽度限制的自写字幕内容" }]`,
      );
      writeScript(authored, ["短句。"]);
      const tooWide = runAvp(["plan", "--json"], authored);
      assert.notEqual(tooWide.status, 0);
      assert.equal(tooWide.json.ok, false);
      assert.equal(tooWide.json.error.code, "caption-too-wide");
      assert.match(tooWide.json.error.message, /example-1/u);
      assert.match(tooWide.json.error.message, /caption/u);
      assert.equal(tooWide.json.error.details.captionSource, "authored");

      const longSay =
        "这一句话完全没有标点也没有逗号顿号冒号用来退让并且总长度超过十八个全角字符";
      assert.equal(runAvp(["init", "--json"], derived).status, 0);
      writeNarrations(derived, `[{ say: ${JSON.stringify(longSay)} }]`);
      writeScript(derived, [longSay]);
      const derivedWide = runAvp(["plan", "--json"], derived);
      assert.notEqual(derivedWide.status, 0);
      assert.equal(derivedWide.json.error.code, "caption-too-wide");
      assert.match(derivedWide.json.error.message, /example-1/u);
      assert.match(
        derivedWide.json.error.message,
        new RegExp(longSay, "u"),
      );
      assert.equal(derivedWide.json.error.details.captionSource, "derived");
      assert.equal(existsSync(join(derived, "beats.json")), false);
    } finally {
      cleanup(authored);
      cleanup(derived);
    }
  });

  test("口播稿块数或文本与 narrations.ts 漂移时拒绝 plan", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);

      writeScript(project, EXAMPLE_SAYS.slice(0, 2));
      const countDrift = runAvp(["plan", "--json"], project);
      assert.notEqual(countDrift.status, 0);
      assert.equal(countDrift.json.error.code, "script-drift");
      assert.equal(countDrift.json.error.details.actualBlocks, 2);
      assert.equal(countDrift.json.error.details.expectedBeats, 3);

      writeScript(project, ["这是完全不同的一句话。", ...EXAMPLE_SAYS.slice(1)]);
      const textDrift = runAvp(["plan", "--json"], project);
      assert.notEqual(textDrift.status, 0);
      assert.equal(textDrift.json.error.code, "script-drift");
      assert.match(textDrift.json.error.message, /example-1/u);
      assert.equal(textDrift.json.error.details.field, "say");
    } finally {
      cleanup(project);
    }
  });

  test("outline 能解析时校验 step 数，解析不出来时不制造假失败", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);
      writeScript(project, EXAMPLE_SAYS);

      writeFileSync(
        join(project, "outline.md"),
        [
          "# Video Outline",
          "",
          "## 1. example — 示例（4 steps · ~12s）",
          "",
          "- step 1 (~3s) — 封面",
          "- step 2 (~3s) — 分栏",
          "- step 3 (~3s) — 收尾",
          "- step 4 (~3s) — 多余的一拍",
          "",
        ].join("\n"),
        "utf8",
      );
      const outlineDrift = runAvp(["plan", "--json"], project);
      assert.notEqual(outlineDrift.status, 0);
      assert.equal(outlineDrift.json.error.code, "outline-step-count");
      assert.equal(outlineDrift.json.error.details.chapter, "example");
      assert.equal(outlineDrift.json.error.details.outline, 4);

      // 3 个 step 与 narrations 对齐时通过（章节能解析 → 张力计划也必需）
      writeOutline(project, tensionOutline());
      const aligned = runAvp(["plan", "--json"], project);
      assert.equal(aligned.status, 0, aligned.stderr);

      // 格式不可解析（没有章节标题 / step bullets）→ 跳过，不报错
      writeOutline(project, ["# 待写的开发计划", "", "先想清楚再拆 step。", ""]);
      const unparseable = runAvp(["plan", "--json"], project);
      assert.equal(unparseable.status, 0, unparseable.stderr);
    } finally {
      cleanup(project);
    }
  });

  test("plan --approve 写批准哈希；--after-plan 缺批准或稿子变了都拒绝", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);
      writeScript(project, EXAMPLE_SAYS);

      const notApproved = runAvp(["plan", "--after-plan", "--json"], project);
      assert.notEqual(notApproved.status, 0);
      assert.equal(notApproved.json.error.code, "plan-not-approved");
      assert.equal(existsSync(join(project, ".avp", "approval.json")), false);

      const approved = runAvp(["plan", "--approve", "--json"], project);
      assert.equal(approved.status, 0, approved.stderr);
      assert.ok(approved.json.writes.includes(".avp/approval.json"));
      assert.equal(typeof approved.json.approval.hash, "string");

      const approval = readJson(join(project, ".avp", "approval.json"));
      assert.equal(approval.schemaVersion, 1);
      assert.match(approval.hash, /^[0-9a-f]{64}$/u);
      assert.match(approval.scriptHash, /^[0-9a-f]{64}$/u);
      assert.match(approval.beatsHash, /^[0-9a-f]{64}$/u);
      assert.equal(
        approval.scriptHash,
        sha256(readText(join(project, "script.md"))),
      );
      assert.ok(!Number.isNaN(Date.parse(approval.approvedAt)));

      // 批准哈希 = sha256(script.md 原文 + 规范化节拍 JSON)
      const beats = readJson(join(project, "beats.json")).beats;
      // 批准只覆盖 plan 产出的字段；durationMs / tts 是 avp tts 的派生物。
      const approvalBeats = beats.map(({ durationMs, tts, ...rest }: any) => rest);
      const canonical = canonicalJson(approvalBeats);
      assert.equal(approval.beatsHash, sha256(canonical));
      assert.equal(
        approval.hash,
        sha256(readText(join(project, "script.md")) + canonical),
      );

      const accepted = runAvp(["plan", "--after-plan", "--json"], project);
      assert.equal(accepted.status, 0, accepted.stderr);

      // avp tts 会往 beats 回写 durationMs / tts；这不该弄脏批准哈希。
      const afterTtsDoc = readJson(join(project, "beats.json"));
      afterTtsDoc.beats[0].durationMs = 1234;
      afterTtsDoc.beats[0].tts = {
        backend: "fake",
        voice: "v",
        speed: 1,
        hash: "h",
      };
      writeFileSync(
        join(project, "beats.json"),
        JSON.stringify(afterTtsDoc, null, 2),
      );
      const afterTts = runAvp(["plan", "--after-plan", "--json"], project);
      assert.equal(afterTts.status, 0, afterTts.stderr);

      // 只改 script.md 的空白：say 不变，但批准哈希变了 → 必须重新批准
      writeFileSync(
        join(project, "script.md"),
        `${readText(join(project, "script.md"))}\n`,
        "utf8",
      );
      const drifted = runAvp(["plan", "--after-plan", "--json"], project);
      assert.notEqual(drifted.status, 0);
      assert.equal(drifted.json.error.code, "plan-not-approved");
      assert.notEqual(
        drifted.json.error.details.currentHash,
        drifted.json.error.details.approvedHash,
      );

      const reapproved = runAvp(["plan", "--approve", "--json"], project);
      assert.equal(reapproved.status, 0, reapproved.stderr);
      const acceptedAgain = runAvp(["plan", "--after-plan", "--json"], project);
      assert.equal(acceptedAgain.status, 0, acceptedAgain.stderr);
    } finally {
      cleanup(project);
    }
  });

  test("多章节按 chapters.ts 顺序出 id，且不 import 章节 React/CSS", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);

      // 第二章只有 narrations.ts；registry import 的组件文件故意不存在 ——
      // plan 只动态 import narrations.ts，不应碰到 React/CSS。
      const secondDir = join(
        project,
        "presentation",
        "src",
        "chapters",
        "02-second",
      );
      mkdirSync(secondDir, { recursive: true });
      writeFileSync(
        join(secondDir, "narrations.ts"),
        `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = [{ say: "第二章。", caption: "第二章" }];\n`,
        "utf8",
      );
      writeFileSync(
        join(project, "presentation", "src", "registry", "chapters.ts"),
        [
          'import type { ChapterDef } from "./types";',
          'import ExampleChapter from "../chapters/01-example/Example";',
          'import SecondChapter from "../chapters/02-second/Second";',
          'import { narrations as exampleNarrations } from "../chapters/01-example/narrations";',
          'import { narrations as secondNarrations } from "../chapters/02-second/narrations";',
          "",
          "export const CHAPTERS: ChapterDef[] = [",
          '  { id: "example", title: "示例章节", narrations: exampleNarrations, Component: ExampleChapter },',
          '  { id: "second", title: "第二章", narrations: secondNarrations, Component: SecondChapter },',
          "];",
          "",
        ].join("\n"),
        "utf8",
      );
      writeScript(project, [...EXAMPLE_SAYS, "第二章。"]);

      const plan = runAvp(["plan", "--json"], project);
      assert.equal(plan.status, 0, plan.stderr);
      assert.equal(plan.json.chapters, 2);
      assert.equal(plan.json.beats, 4);

      const beats = readJson(join(project, "beats.json")).beats;
      assert.deepEqual(
        beats.map((beat: any) => beat.id),
        ["example-1", "example-2", "example-3", "second-1"],
      );
      assert.equal(beats[3].chapter, "second");
      assert.equal(beats[3].chapterIndex, 1);
      assert.equal(beats[3].step, 0);
      assert.equal(beats[3].audio, "audio/second/1.wav");
    } finally {
      cleanup(project);
    }
  });

  test("status 在 plan 后显示最新，改 script.md 后显示过期", () => {
    const project = tempProject();
    try {
      assert.equal(runAvp(["init", "--json"], project).status, 0);
      writeScript(project, EXAMPLE_SAYS);
      assert.equal(runAvp(["plan", "--json"], project).status, 0);

      const current = runAvp(["status", "--json"], project);
      assert.equal(
        current.json.steps.find((s: any) => s.step === "plan").status,
        "current",
      );

      writeFileSync(
        join(project, "script.md"),
        `${readText(join(project, "script.md"))}\n改一句。\n`,
        "utf8",
      );
      const stale = runAvp(["status", "--json"], project);
      assert.equal(stale.status, 0, stale.stderr);
      assert.equal(
        stale.json.steps.find((s: any) => s.step === "plan").status,
        "stale",
      );
    } finally {
      cleanup(project);
    }
  });
});

/** 追加第二章（1 拍），返回项目目录；仿既有「多章节」测试的 registry 写法。 */
function projectWithSecondChapter(): string {
  const project = tempProject();
  assert.equal(runAvp(["init", "--json"], project).status, 0);
  const secondDir = join(
    project,
    "presentation",
    "src",
    "chapters",
    "02-second",
  );
  mkdirSync(secondDir, { recursive: true });
  writeFileSync(
    join(secondDir, "narrations.ts"),
    `import type { Narration } from "../../registry/types";\n\nexport const narrations: Narration[] = [{ say: "第二章。", caption: "第二章" }];\n`,
    "utf8",
  );
  writeFileSync(
    join(project, "presentation", "src", "registry", "chapters.ts"),
    [
      'import type { ChapterDef } from "./types";',
      'import ExampleChapter from "../chapters/01-example/Example";',
      'import SecondChapter from "../chapters/02-second/Second";',
      'import { narrations as exampleNarrations } from "../chapters/01-example/narrations";',
      'import { narrations as secondNarrations } from "../chapters/02-second/narrations";',
      "",
      "export const CHAPTERS: ChapterDef[] = [",
      '  { id: "example", title: "示例章节", narrations: exampleNarrations, Component: ExampleChapter },',
      '  { id: "second", title: "第二章", narrations: secondNarrations, Component: SecondChapter },',
      "];",
      "",
    ].join("\n"),
    "utf8",
  );
  writeScript(project, [...EXAMPLE_SAYS, "第二章。"]);
  return project;
}

describe("avp plan 张力计划", () => {
  /** 建一个 3 拍的单章节项目，并写好 script.md。 */
  function projectWithScript(): string {
    const project = tempProject();
    assert.equal(runAvp(["init", "--json"], project).status, 0);
    writeScript(project, EXAMPLE_SAYS);
    return project;
  }

  test("完整张力计划通过 plan；省略拍号、rehook 与 @ 拍 空格都容忍", () => {
    const project = projectWithScript();
    try {
      writeOutline(project, tensionOutline());
      const plan = runAvp(["plan", "--json"], project);
      assert.equal(plan.status, 0, plan.stderr);
      assert.equal(plan.json.ok, true);
      assert.equal(plan.json.beats, 3);
      assert.ok(plan.json.writes.includes("beats.json"));

      // 还扣 / re-hook 拍号省略 → 本章首拍；rehook 是容忍写法
      writeOutline(
        project,
        tensionOutline({
          chapter:
            "> **张力线**：还扣「边界不清，幻觉才有空间」｜rehook：开场把同一个模型的反差砸在脸上",
        }),
      );
      const omitted = runAvp(["plan", "--json"], project);
      assert.equal(omitted.status, 0, omitted.stderr);

      // `@拍` / `@ 拍` 都认；interrupt 可整段省略
      writeOutline(
        project,
        tensionOutline({
          chapter:
            "> **张力线**：还扣「边界不清，幻觉才有空间」@ 拍 2｜re-hook：把反差砸在脸上",
        }),
      );
      const spaced = runAvp(["plan", "--json"], project);
      assert.equal(spaced.status, 0, spaced.stderr);
    } finally {
      cleanup(project);
    }
  });

  test("多章节按全局 1-based 拍号校验：缺省落在本章首拍", () => {
    const project = projectWithSecondChapter();
    try {
      const globals = [
        "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 1 拍抛出，第 4 拍总还扣",
        "> **总还扣**：答案不在模型，在每条规则替它挡住的那一步。 —— 第 4 拍",
      ];
      const chapterOne =
        "> **张力线**：还扣「边界不清，幻觉才有空间」｜re-hook：把反差砸在脸上";
      const chapterTwo =
        "> **张力线**：还扣「答案就在流程里」｜rehook：把问题翻成哪一步漏了";

      // 省掉拍号 → 默认本章首拍（example=1、second=4），都在各自范围内
      writeOutline(project, [
        "# Video Outline",
        "",
        ...globals,
        "",
        "## 1. example — 示例（3 steps · ~9s）",
        "",
        chapterOne,
        "",
        ...STEPS_3,
        "",
        "## 2. second — 第二章（1 steps · ~3s）",
        "",
        chapterTwo,
        "",
        "- step 1 (~3s) — 第二章",
        "",
      ]);
      const valid = runAvp(["plan", "--json"], project);
      assert.equal(valid.status, 0, valid.stderr);

      // 第二章声明第 3 拍：全局存在，但不属于本章（本章只有第 4 拍）
      writeOutline(project, [
        "# Video Outline",
        "",
        ...globals,
        "",
        "## 1. example — 示例（3 steps · ~9s）",
        "",
        chapterOne,
        "",
        ...STEPS_3,
        "",
        "## 2. second — 第二章（1 steps · ~3s）",
        "",
        "> **张力线**：还扣「答案就在流程里」@拍 3｜re-hook：把问题翻成哪一步漏了",
        "",
        "- step 1 (~3s) — 第二章",
        "",
      ]);
      const outOfChapter = runAvp(["plan", "--json"], project);
      assert.notEqual(outOfChapter.status, 0);
      assert.equal(outOfChapter.json.error.code, "tension-beat-out-of-range");
      assert.equal(outOfChapter.json.error.details.field, "张力线:second");
      assert.equal(outOfChapter.json.error.details.beat, 3);
      assert.equal(outOfChapter.json.error.details.min, 4);
      assert.equal(outOfChapter.json.error.details.max, 4);
      assert.match(outOfChapter.json.error.message, /second/u);
    } finally {
      cleanup(project);
    }
  });

  test("章节能解析但完全没有张力声明时拒绝（张力计划是必需项）", () => {
    const project = projectWithScript();
    try {
      writeOutline(project, [
        "# Video Outline",
        "",
        "## 1. example — 示例（3 steps · ~9s）",
        "",
        ...STEPS_3,
        "",
      ]);
      const plan = runAvp(["plan", "--json"], project);
      assert.notEqual(plan.status, 0);
      assert.equal(plan.json.ok, false);
      assert.equal(plan.json.error.code, "tension-plan-missing");
      assert.equal(plan.json.error.details.field, "埋扣");
      assert.match(plan.json.error.message, /埋扣/u);
      // 拒绝时不能落 beats.json
      assert.equal(existsSync(join(project, "beats.json")), false);
    } finally {
      cleanup(project);
    }
  });

  test("缺总还扣时拒绝，且错误指向总还扣", () => {
    const project = projectWithScript();
    try {
      writeOutline(project, tensionOutline({ payoff: null }));
      const plan = runAvp(["plan", "--json"], project);
      assert.notEqual(plan.status, 0);
      assert.equal(plan.json.error.code, "tension-plan-missing");
      assert.equal(plan.json.error.details.field, "总还扣");
      assert.match(plan.json.error.message, /总还扣/u);
    } finally {
      cleanup(project);
    }
  });

  test("缺某章张力线时拒绝，details 指向具体章节", () => {
    const project = projectWithScript();
    try {
      writeOutline(project, tensionOutline({ chapter: null }));
      const plan = runAvp(["plan", "--json"], project);
      assert.notEqual(plan.status, 0);
      assert.equal(plan.json.error.code, "tension-plan-missing");
      assert.equal(plan.json.error.details.field, "张力线:example");
    } finally {
      cleanup(project);
    }
  });

  test("埋扣 / 总还扣 / 张力线拍号越界都拒绝，错误给出拍号与合法范围", () => {
    const project = projectWithScript();
    try {
      // 埋扣抛出拍越界（全片 3 拍）
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 4 拍抛出，第 3 拍总还扣",
        }),
      );
      const hookOut = runAvp(["plan", "--json"], project);
      assert.notEqual(hookOut.status, 0);
      assert.equal(hookOut.json.error.code, "tension-beat-out-of-range");
      assert.equal(hookOut.json.error.details.field, "埋扣");
      assert.equal(hookOut.json.error.details.beat, 4);
      assert.equal(hookOut.json.error.details.min, 1);
      assert.equal(hookOut.json.error.details.max, 3);
      assert.match(hookOut.json.error.message, /第 4 拍/u);
      assert.match(hookOut.json.error.message, /1\.\.3/u);

      // 总还扣拍号越界
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 1 拍抛出，第 9 拍总还扣",
          payoff:
            "> **总还扣**：答案不在模型，在每条规则替它挡住的那一步。 —— 第 9 拍",
        }),
      );
      const payoffOut = runAvp(["plan", "--json"], project);
      assert.notEqual(payoffOut.status, 0);
      assert.equal(payoffOut.json.error.code, "tension-beat-out-of-range");
      assert.equal(payoffOut.json.error.details.field, "总还扣");
      assert.equal(payoffOut.json.error.details.beat, 9);
      assert.equal(payoffOut.json.error.details.min, 1);
      assert.equal(payoffOut.json.error.details.max, 3);

      // 0 拍同样越界
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 0 拍抛出，第 3 拍总还扣",
        }),
      );
      const zero = runAvp(["plan", "--json"], project);
      assert.notEqual(zero.status, 0);
      assert.equal(zero.json.error.code, "tension-beat-out-of-range");
      assert.equal(zero.json.error.details.beat, 0);

      // 章节张力线拍号超出该章的全局范围
      writeOutline(
        project,
        tensionOutline({
          chapter:
            "> **张力线**：还扣「边界不清，幻觉才有空间」@拍 5｜re-hook：把反差砸在脸上｜interrupt@拍 2",
        }),
      );
      const chapterOut = runAvp(["plan", "--json"], project);
      assert.notEqual(chapterOut.status, 0);
      assert.equal(chapterOut.json.error.code, "tension-beat-out-of-range");
      assert.equal(chapterOut.json.error.details.field, "张力线:example");
      assert.equal(chapterOut.json.error.details.beat, 5);
      assert.equal(chapterOut.json.error.details.min, 1);
      assert.equal(chapterOut.json.error.details.max, 3);
      assert.match(chapterOut.json.error.message, /example/u);
    } finally {
      cleanup(project);
    }
  });

  test("总还扣不在末拍时拒绝（用越界错误，不给 tension-plan-invalid）", () => {
    const project = projectWithScript();
    try {
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 1 拍抛出，第 2 拍总还扣",
          payoff:
            "> **总还扣**：答案不在模型，在每条规则替它挡住的那一步。 —— 第 2 拍",
        }),
      );
      const plan = runAvp(["plan", "--json"], project);
      assert.notEqual(plan.status, 0);
      assert.equal(plan.json.error.code, "tension-beat-out-of-range");
      assert.equal(plan.json.error.details.field, "总还扣");
      assert.equal(plan.json.error.details.beat, 2);
      assert.equal(plan.json.error.details.expected, 3);
      assert.match(plan.json.error.message, /末拍/u);
    } finally {
      cleanup(project);
    }
  });

  test("埋扣声明的总还扣拍与总还扣声明不一致时拒绝", () => {
    const project = projectWithScript();
    try {
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 1 拍抛出，第 2 拍总还扣",
        }),
      );
      const plan = runAvp(["plan", "--json"], project);
      assert.notEqual(plan.status, 0);
      assert.equal(plan.json.error.code, "tension-beat-out-of-range");
      assert.equal(plan.json.error.details.field, "埋扣");
      assert.equal(plan.json.error.details.beat, 2);
      assert.equal(plan.json.error.details.expected, 3);
      assert.match(plan.json.error.message, /不一致/u);
      assert.match(plan.json.error.message, /第 3 拍/u);
    } finally {
      cleanup(project);
    }
  });

  test("张力行写坏时按缺失处理：不崩、不假通过", () => {
    const project = projectWithScript();
    try {
      // 拍号写坏：`@拍 四` 解析不出数字 → 整行按缺失处理，不能静默变成默认首拍
      writeOutline(
        project,
        tensionOutline({
          chapter:
            "> **张力线**：还扣「边界不清，幻觉才有空间」@拍 四｜re-hook：把反差砸在脸上",
        }),
      );
      const brokenBeat = runAvp(["plan", "--json"], project);
      assert.equal(brokenBeat.status, 1);
      assert.equal(brokenBeat.json.error.code, "tension-plan-missing");
      assert.equal(brokenBeat.json.error.details.field, "张力线:example");

      // 整行糊掉：没有「还扣」也没有「」→ 同样按缺失处理
      writeOutline(
        project,
        tensionOutline({ chapter: "> **张力线**：这段彻底写坏了" }),
      );
      const garbled = runAvp(["plan", "--json"], project);
      assert.equal(garbled.status, 1);
      assert.equal(garbled.json.error.code, "tension-plan-missing");
      assert.equal(garbled.json.error.details.field, "张力线:example");

      // 埋扣行拍号写坏 → 指向埋扣，不是崩
      writeOutline(
        project,
        tensionOutline({
          hook:
            "> **埋扣**：同一个模型，凭什么加上框架就能把 bug 清零？ —— 第 二 拍抛出，第 三 拍总还扣",
        }),
      );
      const brokenHook = runAvp(["plan", "--json"], project);
      assert.equal(brokenHook.status, 1);
      assert.equal(brokenHook.json.error.code, "tension-plan-missing");
      assert.equal(brokenHook.json.error.details.field, "埋扣");
    } finally {
      cleanup(project);
    }
  });

  test("没有 outline 或格式自由时不制造假失败", () => {
    // 没有 outline.md：plan 照常成功
    const noOutline = projectWithScript();
    try {
      const plan = runAvp(["plan", "--json"], noOutline);
      assert.equal(plan.status, 0, plan.stderr);
      assert.equal(plan.json.ok, true);
    } finally {
      cleanup(noOutline);
    }

    // 自由格式（没有可解析章节标题）：跳过张力校验
    const freeForm = projectWithScript();
    try {
      writeOutline(freeForm, [
        "# 待写的开发计划",
        "",
        "先想清楚再拆 step。张力计划之后再补。",
        "",
      ]);
      const plan = runAvp(["plan", "--json"], freeForm);
      assert.equal(plan.status, 0, plan.stderr);
      assert.equal(plan.json.ok, true);
    } finally {
      cleanup(freeForm);
    }

    // 只有不认识的标题（素材清单）也不算「章节可解析」
    const unknownHeading = projectWithScript();
    try {
      writeOutline(unknownHeading, [
        "# 视频大纲",
        "",
        "## 素材清单",
        "",
        "- 还没写",
        "",
      ]);
      const plan = runAvp(["plan", "--json"], unknownHeading);
      assert.equal(plan.status, 0, plan.stderr);
      assert.equal(plan.json.ok, true);
    } finally {
      cleanup(unknownHeading);
    }
  });
});

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
    .join(",")}}`;
}
