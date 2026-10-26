import { sha256File } from "../audio";
import { pathExists } from "../fs";
import { shortHash } from "../hash";
import { skillCommit, themeTokensPath } from "../skill";
import { SPEED_MAX, SPEED_MIN } from "../tts";
import { CHECK_IDS } from "./types";
import type { CheckContext } from "./types";

/** schema 大版本必须认识；1.x 小版本向前兼容。 */
function assertSupportedSchema(
  ctx: CheckContext,
  file: string,
  version: unknown,
): void {
  const major =
    typeof version === "number" ? Math.trunc(version) : Number.NaN;
  if (Number.isFinite(major) && major === 1) return;

  ctx.findings.push({
    id: CHECK_IDS.schemaUnknown,
    level: "error",
    message:
      `${file} 的 schemaVersion=${String(version)}，本版只认识大版本 1。` +
      `\n未知大版本意味着字段形状可能已变；不要猜着升级。`,
    field: "schemaVersion",
    fix: "升级 skill 到认识该大版本，或把项目回退到匹配的 skill commit；不要手改 schemaVersion。",
  });
}

export function checkSchema(ctx: CheckContext): void {
  assertSupportedSchema(ctx, "project.json", ctx.ledger.schemaVersion);
  assertSupportedSchema(ctx, "beats.json", ctx.manifest.schemaVersion);
  assertSupportedSchema(ctx, "tts.json", ctx.config.schemaVersion);
  if (ctx.ttsManifest) {
    assertSupportedSchema(ctx, ".avp/tts.json", ctx.ttsManifest.schemaVersion);
  }
}

/**
 * warning：derived 字幕清单。
 * 不设成 error：否则 agent 会为了过检硬凑更差的句子。派生必须留痕。
 */
export function checkDerivedCaptions(ctx: CheckContext): void {
  const derived = ctx.manifest.beats.filter(
    (beat) => beat.captionSource === "derived",
  );
  if (derived.length === 0) return;

  const ids = derived.map((beat) => beat.id).join(", ");
  ctx.findings.push({
    id: CHECK_IDS.captionDerived,
    level: "warning",
    message:
      `推导字幕：${derived.length}/${ctx.manifest.beats.length} 拍（${ids}）。` +
      `\n这些屏幕文字不是人写的；改 say 会让它们悄悄变化。`,
    fix: "给这些拍手写 caption，再运行 avp plan；派生字幕会留痕但不受控。",
  });
}

/** error：主题 tokens 改了但 beats.json 记的还是旧哈希。 */
export function checkTokensHash(ctx: CheckContext): void {
  const theme = ctx.manifest.theme as
    | { id?: unknown; tokensHash?: unknown }
    | undefined;
  const themeId = typeof theme?.id === "string" ? theme.id : "";
  const recorded =
    typeof theme?.tokensHash === "string" ? theme.tokensHash : "";

  if (!themeId || !recorded) {
    ctx.findings.push({
      id: CHECK_IDS.tokensStale,
      level: "error",
      message:
        "beats.json 缺少 theme.id / theme.tokensHash，无法确认合成稿用的是哪一版视觉 tokens。",
      field: "theme",
      fix: "运行 avp plan 重新生成节拍清单，再运行 avp compose。",
    });
    return;
  }

  const tokensPath = themeTokensPath(themeId);
  if (!pathExists(tokensPath)) {
    ctx.findings.push({
      id: CHECK_IDS.tokensStale,
      level: "error",
      message: `主题「${themeId}」找不到 tokens.css：${tokensPath}`,
      field: "theme.id",
      fix: "选一个存在的主题后重新 avp plan；主题见 skill 的 themes/ 目录。",
    });
    return;
  }

  const current = sha256File(tokensPath);
  if (current !== recorded) {
    ctx.findings.push({
      id: CHECK_IDS.tokensStale,
      level: "error",
      message:
        `主题「${themeId}」的 tokens 已变，但节拍清单记的是旧哈希。` +
        `\nbeats.json: ${shortHash(recorded, 12)}　当前 tokens: ${shortHash(current, 12)}`,
      field: "theme.tokensHash",
      fix: "运行 avp plan 重新生成节拍清单，再运行 avp compose。",
    });
  }
}

function speedOutOfRange(speed: unknown): boolean {
  return (
    typeof speed !== "number" ||
    !Number.isFinite(speed) ||
    speed < SPEED_MIN ||
    speed > SPEED_MAX
  );
}

/** error：有效语速（章节覆盖或默认）越界。 */
export function checkSpeed(ctx: CheckContext): void {
  const defaultSpeed = ctx.config.default?.speed;
  if (speedOutOfRange(defaultSpeed)) {
    ctx.findings.push({
      id: CHECK_IDS.speedOutOfRange,
      level: "error",
      message:
        `tts.json 的默认语速 ${String(defaultSpeed)} 越界：只允许 ${SPEED_MIN}–${SPEED_MAX}。` +
        `\n超出范围是换了个人在念，不是节奏。`,
      field: "default.speed",
      fix: `把 tts.json 的 default.speed 改回 ${SPEED_MIN}–${SPEED_MAX}，再运行 avp tts。`,
    });
  }

  const chapters = Object.entries(ctx.config.chapters ?? {}).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  for (const [chapter, override] of chapters) {
    if (override?.speed === undefined) continue;
    if (!speedOutOfRange(override.speed)) continue;
    ctx.findings.push({
      id: CHECK_IDS.speedOutOfRange,
      level: "error",
      chapter,
      message:
        `章节「${chapter}」的语速 ${String(override.speed)} 越界：` +
        `只允许 ${SPEED_MIN}–${SPEED_MAX}。`,
      field: `chapters.${chapter}.speed`,
      fix: `把 tts.json 的 chapters.${chapter}.speed 改回 ${SPEED_MIN}–${SPEED_MAX}，再运行 avp tts。`,
    });
  }
}

/**
 * warning：音色偏离默认。
 * 章节覆盖报一次 chapter 级；逐拍记录的音色若没被章节覆盖解释，再报 beat 级。
 */
export function checkVoiceDivergence(ctx: CheckContext): void {
  const defaultVoice = ctx.config.default?.voice;
  if (typeof defaultVoice !== "string" || !defaultVoice) return;

  const chapters = Object.entries(ctx.config.chapters ?? {}).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const chapterOverrides = new Map<string, string>();
  for (const [chapter, override] of chapters) {
    if (typeof override?.voice !== "string" || override.voice === defaultVoice) {
      continue;
    }
    chapterOverrides.set(chapter, override.voice);
    ctx.findings.push({
      id: CHECK_IDS.voiceDivergence,
      level: "warning",
      chapter,
      message:
        `章节「${chapter}」用非默认音色「${override.voice}」（默认 ${defaultVoice}）。` +
        `\n音色是导演选择，该被人看见。`,
      field: `chapters.${chapter}.voice`,
      fix: "确认这是有意的；否则删掉章节覆盖或改回 default.voice，再运行 avp tts。",
    });
  }

  for (const beat of ctx.manifest.beats) {
    const voice = beat.tts?.voice;
    if (typeof voice !== "string" || voice === defaultVoice) continue;
    if (chapterOverrides.get(beat.chapter) === voice) continue;
    ctx.findings.push({
      id: CHECK_IDS.voiceDivergence,
      level: "warning",
      beatId: beat.id,
      chapter: beat.chapter,
      message:
        `节拍 ${beat.id} 记录的音色「${voice}」不是默认的「${defaultVoice}」，` +
        `也不是章节覆盖。`,
      field: "tts.voice",
      fix: "确认这是有意的导演选择；否则运行 avp tts 用默认音色重新合成。",
    });
  }
}

function displayCommit(commit: string): string {
  return commit === "unknown" ? "unknown" : shortHash(commit, 7);
}

/** warning：skill commit 漂移；询问用户续跑还是回到 pinned commit。 */
export function checkSkillCommit(ctx: CheckContext): void {
  const pinned = ctx.ledger.skill?.commit;
  if (typeof pinned !== "string" || !pinned) return;
  const current = skillCommit();
  if (pinned === current) return;

  ctx.findings.push({
    id: CHECK_IDS.skillCommitDrift,
    level: "warning",
    message:
      `项目记录的是 skill commit ${displayCommit(pinned)}，当前 skill 是 ${displayCommit(current)}。` +
      `\n同一份输入可能因此渲出不同成片。` +
      `\n询问用户：用新 skill 续跑并记新回执（re-pin），还是回到 pinned commit。`,
    field: "skill.commit",
    fix: "询问用户：用新 skill 续跑并记录新回执，还是回到项目 pinned commit。",
  });
}
