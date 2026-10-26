import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assertAuthoredCaption, deriveCaption } from "./captions";
import { AvpError } from "./errors";
import { pathExists, readJson, readText, writeJson } from "./fs";
import { sha256 } from "./hash";
import { assertSchemaVersion, projectPaths } from "./project";
import type { ProjectPaths } from "./project";

export type NarrationMotion = "hook" | "static";

/** 口播条目契约：say 给耳朵，caption 给眼睛。 */
export interface NarrationEntry {
  say: string;
  caption?: string;
  motion?: NarrationMotion;
}

export interface ChapterSource {
  id: string;
  title: string;
  narrations: NarrationEntry[];
}

export interface BeatTts {
  backend: string;
  voice: string;
  speed: number;
  hash: string;
}

export interface Beat {
  id: string;
  chapter: string;
  chapterIndex: number;
  step: number;
  say: string;
  caption: string;
  captionSource: "authored" | "derived";
  audio: string;
  durationMs: number | null;
  textHash: string;
  tts: BeatTts | null;
  motion: NarrationMotion;
}

export interface BeatsManifest {
  schemaVersion: 1;
  theme: { id: string; tokensHash: string };
  beats: Beat[];
}

/**
 * plan 拥有、批准哈希与漂移检查共同覆盖的节拍字段。
 * durationMs / tts 是 tts 的派生物，刻意不在此列。
 */
export const PLAN_OWNED_BEAT_FIELDS = [
  "id",
  "chapter",
  "chapterIndex",
  "step",
  "say",
  "caption",
  "captionSource",
  "audio",
  "motion",
  "textHash",
] as const;

interface ChapterEntry {
  id: string;
  title: string;
  narrationAlias?: string;
}

function chaptersArrayBody(registry: string): string {
  const match = /export\s+const\s+CHAPTERS\b[\s\S]*?=\s*\[([\s\S]*?)\];/u.exec(
    registry,
  );
  if (!match) {
    throw new AvpError(
      "chapters-unreadable",
      `无法从 chapters.ts 解析 CHAPTERS 数组；期望 export const CHAPTERS = [...]。`,
      { field: "CHAPTERS" },
    );
  }
  return match[1]!;
}

function parseChapterEntries(body: string): ChapterEntry[] {
  const entries: ChapterEntry[] = [];
  for (const block of body.matchAll(/\{([^{}]*)\}/gu)) {
    const source = block[1]!;
    const id = /\bid:\s*["']([^"']+)["']/u.exec(source)?.[1];
    if (!id) {
      throw new AvpError(
        "chapters-unreadable",
        `chapters.ts 里有一个章节条目缺少 id。`,
        { field: "id" },
      );
    }
    const title = /\btitle:\s*["']([^"']*)["']/u.exec(source)?.[1] ?? id;
    const narrationAlias = /\bnarrations:\s*([A-Za-z_$][\w$]*)/u.exec(
      source,
    )?.[1];
    entries.push({ id, title, narrationAlias });
  }
  return entries;
}

function narrationImportFolders(registry: string): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const match of registry.matchAll(
    /import\s*\{\s*narrations\s+as\s+([A-Za-z_$][\w$]*)\s*\}\s*from\s*["']\.\.\/chapters\/([^"']+)\/narrations["']/gu,
  )) {
    aliases.set(match[1]!, match[2]!);
  }
  return aliases;
}

function findChapterFolder(chaptersDir: string, id: string): string | undefined {
  let folders: string[] = [];
  try {
    folders = readdirSync(chaptersDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return undefined;
  }
  const exact = folders.filter((folder) => folder === id);
  const suffixed = folders.filter((folder) => folder.endsWith(`-${id}`));
  const matches = [...exact, ...suffixed];
  if (matches.length > 1) {
    throw new AvpError(
      "chapter-folder-ambiguous",
      `章节「${id}」匹配到多个文件夹：${matches.join(", ")}。` +
        `\n保留一个，或在 chapters.ts 里用 import 别名显式指向。`,
      { chapter: id, folders: matches },
    );
  }
  return matches[0];
}

function validateNarration(
  chapter: string,
  step: number,
  entry: unknown,
): NarrationEntry {
  const fail = (field: string, reason: string): never => {
    throw new AvpError(
      "narration-invalid",
      `章节「${chapter}」第 ${step + 1} 拍：${field} ${reason}`,
      { chapter, step, field },
    );
  };

  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    fail("条目", "必须是对象 { say, caption?, motion? }");
  }
  const record = entry as Record<string, unknown>;
  if (typeof record.say !== "string") {
    fail("say", "必须是字符串（静音拍写 \"\"）");
  }
  if (record.caption !== undefined && typeof record.caption !== "string") {
    fail("caption", "必须是字符串");
  }
  if (
    record.motion !== undefined &&
    record.motion !== "hook" &&
    record.motion !== "static"
  ) {
    fail("motion", '必须是 "hook" 或 "static"');
  }
  return {
    say: record.say as string,
    ...(record.caption !== undefined
      ? { caption: record.caption as string }
      : {}),
    ...(record.motion !== undefined
      ? { motion: record.motion as NarrationMotion }
      : {}),
  };
}

/**
 * 章节顺序来自项目里的 chapters.ts；每个章节的 narrations.ts 用动态 import
 * 读取（只 import 这个 React-free 文件，React/CSS 永不进入 CLI 进程）。
 */
export async function discoverChapters(
  paths: ProjectPaths,
): Promise<ChapterSource[]> {
  const registry = readText(paths.registry);
  const entries = parseChapterEntries(chaptersArrayBody(registry));
  const aliases = narrationImportFolders(registry);
  const chapters: ChapterSource[] = [];

  for (const entry of entries) {
    const folder =
      (entry.narrationAlias ? aliases.get(entry.narrationAlias) : undefined) ??
      findChapterFolder(paths.chaptersDir, entry.id);
    if (!folder) {
      throw new AvpError(
        "chapter-source-missing",
        `章节「${entry.id}」找不到 narrations.ts：` +
          `期望目录 presentation/src/chapters/<NN>-${entry.id}/。`,
        { chapter: entry.id, expected: `src/chapters/<NN>-${entry.id}/narrations.ts` },
      );
    }

    const file = join(paths.chaptersDir, folder, "narrations.ts");
    let mod: { narrations?: unknown };
    try {
      mod = (await import(pathToFileURL(file).href)) as { narrations?: unknown };
    } catch (err) {
      throw new AvpError(
        "narration-source-missing",
        `无法加载章节「${entry.id}」的 narrations.ts：${file}\n` +
          `${err instanceof Error ? err.message : String(err)}`,
        { chapter: entry.id, path: file },
      );
    }
    if (!Array.isArray(mod.narrations)) {
      throw new AvpError(
        "narration-source-invalid",
        `章节「${entry.id}」的 narrations.ts 必须 export 名为 narrations 的数组。`,
        { chapter: entry.id, path: file, field: "narrations" },
      );
    }

    chapters.push({
      id: entry.id,
      title: entry.title,
      narrations: mod.narrations.map((item, step) =>
        validateNarration(entry.id, step, item),
      ),
    });
  }

  if (chapters.length === 0) {
    throw new AvpError(
      "chapters-empty",
      `chapters.ts 里没有任何章节；先注册至少一章再运行 avp plan。`,
      { field: "CHAPTERS" },
    );
  }
  return chapters;
}

/** 由章节口播生成节拍清单；caption / motion 默认值在这里落定。 */
export function buildBeats(
  chapters: ChapterSource[],
  theme: BeatsManifest["theme"],
): BeatsManifest {
  const beats: Beat[] = [];

  chapters.forEach((chapter, chapterIndex) => {
    chapter.narrations.forEach((narration, step) => {
      const id = `${chapter.id}-${step + 1}`;
      const say = narration.say;

      let caption: string;
      let captionSource: Beat["captionSource"];
      if (narration.caption !== undefined) {
        caption = narration.caption;
        captionSource = "authored";
        assertAuthoredCaption(id, caption);
      } else if (say === "") {
        // 静音拍不做字幕推导：空字幕是手写的契约（types.ts 承诺无派生字幕）。
        caption = "";
        captionSource = "authored";
      } else {
        caption = deriveCaption(id, say);
        captionSource = "derived";
      }

      beats.push({
        id,
        chapter: chapter.id,
        chapterIndex,
        step,
        say,
        caption,
        captionSource,
        audio: `audio/${chapter.id}/${step + 1}.wav`,
        durationMs: null,
        textHash: sha256(say),
        tts: null,
        motion: narration.motion ?? (say === "" ? "static" : "hook"),
      });
    });
  });

  return { schemaVersion: 1, theme, beats };
}

/** 读取项目里的 beats.json（供 tts / compose / check 复用，不重复解析）。 */
export function readBeats(root: string): BeatsManifest {
  const path = projectPaths(root).beats;
  if (!pathExists(path)) {
    throw new AvpError("beats-missing", `缺少节拍清单：${path}\n先运行 avp plan。`, {
      path,
    });
  }
  const manifest = readJson<BeatsManifest>(path);
  assertSchemaVersion(manifest.schemaVersion, path);
  return manifest;
}

/** 写回 beats.json（tts 会更新 durationMs / tts 字段）。 */
export function writeBeats(root: string, manifest: BeatsManifest): void {
  writeJson(projectPaths(root).beats, manifest);
}
