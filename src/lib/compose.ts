import { copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AvpError } from "./errors";
import { ensureDir, pathExists, readText, writeText } from "./fs";
import { sha256 } from "./hash";
import { compileHook, inlineHookModule, probeHook } from "./hook";
import type { ProjectPaths } from "./project";
import { SKILL_ROOT, themeTokensPath } from "./skill";

export interface ComposeBeat {
  id: string;
  chapter: string;
  step: number;
  say: string;
  caption: string;
  audio: string;
  durationMs: number | null;
  motion: "hook" | "static";
}

export interface ComposeManifest {
  theme: { id: string; tokensHash: string };
  beats: ComposeBeat[];
}

export interface ComposeResult {
  totalMs: number;
  clips: number;
  hooks: number;
  warnings: string[];
}

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/u;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(3);
}

function readOptional(path: string): string {
  return pathExists(path) ? readFileSync(path, "utf8") : "";
}

function assertBeat(beat: ComposeBeat): void {
  if (!SAFE_ID.test(beat.id)) {
    throw new AvpError(
      "beat-id-invalid",
      `节拍 id「${beat.id}」只能用 a-z / 0-9 / -，且以字母数字开头。`,
      { beatId: beat.id, field: "id" },
    );
  }
  if (!Number.isFinite(beat.durationMs) || (beat.durationMs ?? 0) <= 0) {
    throw new AvpError(
      "duration-missing",
      `节拍 ${beat.id} 还没有实测时长（durationMs=${String(beat.durationMs)}）。` +
        `\n先运行 avp tts。`,
      { beatId: beat.id, field: "durationMs" },
    );
  }
}

/** 生成合成稿骨架；身体与钩子必须已经按拍分文件存在。 */
export function composeProject(
  paths: ProjectPaths,
  manifest: ComposeManifest,
): ComposeResult {
  const warnings: string[] = [];
  const beats = manifest.beats;
  if (beats.length === 0) {
    throw new AvpError("beats-empty", "beats.json 里没有节拍，无法生成合成稿。");
  }
  for (const beat of beats) assertBeat(beat);

  const tokensPath = themeTokensPath(manifest.theme.id);
  if (!pathExists(tokensPath)) {
    throw new AvpError(
      "theme-unknown",
      `主题「${manifest.theme.id}」缺少 tokens.css：${tokensPath}`,
      { theme: manifest.theme.id },
    );
  }
  const tokensCss = readFileSync(tokensPath, "utf8");
  const tokensHash = sha256(tokensCss);
  if (tokensHash !== manifest.theme.tokensHash) {
    throw new AvpError(
      "tokens-stale",
      `主题 tokens 已变，但节拍清单记的是旧哈希。` +
        `\nbeats.json: ${manifest.theme.tokensHash}\n当前 tokens: ${tokensHash}` +
        `\n运行 avp plan 重新生成节拍清单，再 compose。`,
      {
        field: "theme.tokensHash",
        recorded: manifest.theme.tokensHash,
        current: tokensHash,
        theme: manifest.theme.id,
      },
    );
  }

  const baseCss = readOptional(join(paths.presentation, "src", "styles", "base.css"));
  const atomsCss = readOptional(join(paths.presentation, "src", "styles", "atoms.css"));
  if (!atomsCss) {
    warnings.push(
      "presentation/src/styles/atoms.css 不存在：合成稿只内联 tokens + base，身体里的 atom-* 类可能没有样式。",
    );
  }

  const gsapSource = join(SKILL_ROOT, "node_modules", "gsap", "dist", "gsap.min.js");
  if (!pathExists(gsapSource)) {
    throw new AvpError(
      "gsap-missing",
      `找不到本地 gsap：${gsapSource}。\n在 skill 根运行 npm install（gsap 已固定版本）。`,
      { path: gsapSource },
    );
  }

  const hookModules: string[] = [];
  let hooks = 0;
  let totalMs = 0;
  const clipHtml: string[] = [];
  const audioHtml: string[] = [];
  const timelineBeats: {
    id: string;
    start: number;
    duration: number;
    caption: string;
    captionFromStart: boolean;
  }[] = [];

  for (const beat of beats) {
    const bodyPath = join(paths.bodies, `${beat.id}.body.html`);
    if (!pathExists(bodyPath)) {
      throw new AvpError(
        "body-missing",
        `节拍 ${beat.id} 缺少身体文件：composition/beats/${beat.id}.body.html` +
          `\n一拍一文件：只写这一拍的布局（用视觉原子），不要写 clip 外壳、秒数或音频。`,
        { beatId: beat.id, field: "body", path: bodyPath },
      );
    }
    const body = readText(bodyPath).trim();
    if (!body) {
      throw new AvpError(
        "body-empty",
        `节拍 ${beat.id} 的身体文件是空的：composition/beats/${beat.id}.body.html`,
        { beatId: beat.id, field: "body", path: bodyPath },
      );
    }
    if (/<script\b/iu.test(body)) {
      throw new AvpError(
        "body-script",
        `节拍 ${beat.id} 的身体里不允许 <script>：动效只能写在挂载钩子里。`,
        { beatId: beat.id, field: "body" },
      );
    }

    const hookPath = join(paths.hooks, `${beat.id}.hook.ts`);
    if (beat.motion === "hook") {
      if (!pathExists(hookPath)) {
        throw new AvpError(
          "hook-missing",
          `节拍 ${beat.id} 声明 motion: "hook"，但缺少钩子文件：composition/hooks/${beat.id}.hook.ts` +
            `\n写一个 export default (tl, root, ctx) => {…}；若这一拍刻意静止，把 narrations 里的 motion 改成 "static"。`,
          { beatId: beat.id, field: "hook", path: hookPath },
        );
      }
      const source = readText(hookPath);
      const start = totalMs / 1000;
      const duration = (beat.durationMs ?? 0) / 1000;
      probeHook(beat.id, source, { start, duration });
      hookModules.push(
        `  ${JSON.stringify(beat.id)}: ${inlineHookModule(beat.id, compileHook(beat.id, source))},`,
      );
      hooks++;
    } else if (pathExists(hookPath)) {
      warnings.push(`节拍 ${beat.id} 是 static，钩子文件被忽略。`);
    }

    const start = totalMs;
    const end = start + (beat.durationMs ?? 0);
    const startText = seconds(start);
    const durationText = seconds(beat.durationMs ?? 0);

    clipHtml.push(
      [
        `  <div class="clip" id="clip-${beat.id}" data-start="${startText}" data-duration="${durationText}" data-track-index="1">`,
        `    <div class="avp-body">`,
        body
          .split("\n")
          .map((line) => `      ${line}`)
          .join("\n"),
        `    </div>`,
        `    <div class="avp-caption" data-caption="${escapeHtml(beat.caption)}">${escapeHtml(beat.caption)}</div>`,
        `  </div>`,
      ].join("\n"),
    );

    // 静音拍没有音频文件；给空 src 会让 HyperFrames 在混音阶段硬失败。
    if (beat.say.trim() !== "") {
      audioHtml.push(
        `  <audio id="audio-${beat.id}" src="${escapeHtml(beat.audio)}" data-start="${startText}" data-duration="${durationText}" data-track-index="2" data-volume="1"></audio>`,
      );
    }

    timelineBeats.push({
      id: beat.id,
      start: start / 1000,
      duration: (beat.durationMs ?? 0) / 1000,
      caption: beat.caption,
      captionFromStart: beat.motion === "static",
    });
    totalMs = end;
  }

  const captionCss = [
    ".avp-caption {",
    "  position: absolute;",
    "  left: 8%; right: 8%; bottom: 5%;",
    "  padding: 14px 28px;",
    "  text-align: center;",
    "  font-family: var(--font-body);",
    "  font-size: 36px;",
    "  line-height: 1.4;",
    "  color: var(--text);",
    "  background: color-mix(in srgb, var(--shell) 78%, transparent);",
    "  border: 1px solid var(--rule);",
    "  border-radius: var(--r-card, 12px);",
    "  opacity: 0;",
    "}",
  ].join("\n");

  const shellCss = [
    "/* —— 合成稿外壳：骨架由 avp compose 生成，不要手改 —— */",
    "@font-face {",
    '  font-family: "Noto Sans SC";',
    '  src: local("Hiragino Sans GB"), local("STHeiti"), local("Noto Sans CJK SC"), local("Arial Unicode MS");',
    "  font-display: block;",
    "}",
    "@font-face {",
    '  font-family: "Inter";',
    '  src: local("Helvetica Neue"), local("Arial");',
    "  font-display: block;",
    "}",
    "html, body { width: 1920px; height: 1080px; overflow: hidden; }",
    "body { background: var(--shell); }",
    "#root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: var(--shell); }",
    ".clip { position: absolute; inset: 0; display: none; }",
    ".avp-body { position: absolute; inset: 0; padding: var(--stage-pad-y, 80px) var(--stage-pad-x, 96px); }",
    captionCss,
  ].join("\n");

  const timelineJson = JSON.stringify(timelineBeats);
  const timelineJs = `(function () {
  const beats = ${timelineJson};
  const tl = gsap.timeline({ paused: true });
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;

  const hooks = {
${hookModules.join("\n")}
  };

  beats.forEach(function (beat, index) {
    const clip = document.getElementById("clip-" + beat.id);
    const caption = clip ? clip.querySelector(".avp-caption") : null;
    if (!clip) return;
    const previous = index > 0 ? beats[index - 1] : null;
    if (previous) {
      const previousClip = document.getElementById("clip-" + previous.id);
      if (previousClip) tl.set(previousClip, { display: "none" }, beat.start);
    }
    tl.set(clip, { display: "block" }, beat.start);
    if (caption) {
      if (beat.captionFromStart) {
        tl.set(caption, { opacity: 1 }, beat.start);
      } else {
        tl.fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, beat.start + 0.3);
      }
      tl.to(caption, { opacity: 0, duration: 0.2, ease: "power2.in" }, Math.max(beat.start + 0.5, beat.start + beat.duration - 0.25));
    }
    tl.set(clip, { display: "none" }, beat.start + beat.duration);

    const hook = hooks[beat.id];
    if (hook) {
      hook(tl, clip, { start: beat.start, duration: beat.duration });
    }
  });
})();`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<meta name="generator" content="hyperframes" />
<meta name="avp:tokens-hash" content="${tokensHash}" />
<meta name="avp:theme" content="${escapeHtml(manifest.theme.id)}" />
<title>avp composition</title>
<style>
${shellCss}
</style>
<style>
${tokensCss}
</style>
<style>
${baseCss}
</style>
<style>
${atomsCss}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${seconds(totalMs)}" data-width="1920" data-height="1080" data-fps="30">
${clipHtml.join("\n")}
${audioHtml.join("\n")}
</div>
<script src="gsap.min.js"></script>
<script>
${timelineJs}
</script>
</body>
</html>
`;

  ensureDir(paths.composition);
  copyFileSync(gsapSource, join(paths.composition, "gsap.min.js"));
  writeText(join(paths.composition, "index.html"), html);

  // 合成稿必须自包含：HyperFrames 的音频 src 相对 composition/ 解析，
  // 不允许 ../ 逃出项目目录，否则渲染时静音。
  for (const beat of beats) {
    if (beat.say.trim() === "") continue;
    const source = join(paths.root, beat.audio);
    if (pathExists(source)) {
      const target = join(paths.composition, beat.audio);
      ensureDir(join(target, ".."));
      copyFileSync(source, target);
    } else {
      warnings.push(`节拍 ${beat.id} 的音频还不存在：${beat.audio}（先跑 avp tts）`);
    }
  }

  return { totalMs, clips: beats.length, hooks, warnings };
}
