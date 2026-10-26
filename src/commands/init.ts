import { cpSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AvpError } from "../lib/errors";
import { ensureDir, pathExists, readJson, readText, writeJson, writeText } from "../lib/fs";
import type { ProjectLedger, TtsConfig } from "../lib/project";
import { LEDGER_FILE, TTS_CONFIG_FILE } from "../lib/project";
import { skillMeta, templateDir, themeTokensPath } from "../lib/skill";
import { emptyState, writeState } from "../lib/state";

export interface InitResult {
  alreadyInitialized: boolean;
  root: string;
  theme: string;
  created: string[];
}

const DEFAULT_THEME = "bold-signal";

export function runInit(root: string, theme = DEFAULT_THEME): InitResult {
  ensureDir(root);
  const ledgerPath = join(root, LEDGER_FILE);

  if (pathExists(ledgerPath)) {
    const ledger = readJson<ProjectLedger>(ledgerPath);
    return {
      alreadyInitialized: true,
      root,
      theme: ledger.theme?.id ?? theme,
      created: [],
    };
  }

  const tokens = themeTokensPath(theme);
  if (!pathExists(tokens)) {
    throw new AvpError(
      "theme-unknown",
      `没有主题「${theme}」：${tokens}\n可用主题见 themes/ 目录。`,
      { theme },
    );
  }

  const presentation = join(root, "presentation");
  if (pathExists(presentation) && readdirSync(presentation).length > 0) {
    throw new AvpError(
      "presentation-exists",
      `presentation/ 已存在且非空，但缺少 ${LEDGER_FILE}。` +
        `\n为避免覆盖已有内容，先移走 presentation/，或补一份项目账本。`,
      { presentation },
    );
  }

  const created: string[] = [];

  // 演示脚手架来自 skill 自带模板：不跑 npm create vite，也不联网。
  cpSync(templateDir(), presentation, { recursive: true });
  writeText(join(presentation, "src", "styles", "tokens.css"), readText(tokens));
  created.push("presentation/");

  for (const dir of [
    "audio",
    "composition/beats",
    "composition/hooks",
    "output",
    ".avp",
  ]) {
    ensureDir(join(root, dir));
    created.push(`${dir}/`);
  }

  const meta = skillMeta();
  const ledger: ProjectLedger = {
    schemaVersion: 1,
    skill: meta,
    theme: { id: theme },
    createdAt: new Date().toISOString(),
  };
  writeJson(ledgerPath, ledger);
  created.push(LEDGER_FILE);

  const tts: TtsConfig = {
    schemaVersion: 1,
    backend: "kokoro",
    default: { voice: "zf_xiaoxiao", speed: 1.0 },
    chapters: {},
  };
  writeJson(join(root, TTS_CONFIG_FILE), tts);
  created.push(TTS_CONFIG_FILE);

  writeState(root, emptyState());
  created.push(".avp/state.json");

  return { alreadyInitialized: false, root, theme, created };
}
