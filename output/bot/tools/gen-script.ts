import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extractTokens } from "../../../src/lib/check/tokens";
import { captionCells } from "../../../src/lib/captions";

const root = join(import.meta.dirname, "..");
const chaptersDir = join(root, "presentation", "src", "chapters");
const folders = readdirSync(chaptersDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "01-example")
  .map((entry) => entry.name)
  .sort();

const blocks: string[] = [];
let cells = 0;
const problems: string[] = [];

for (const folder of folders) {
  const mod = (await import(
    pathToFileURL(join(chaptersDir, folder, "narrations.ts")).href
  )) as { narrations: { say: string; caption?: string }[] };
  mod.narrations.forEach((entry, index) => {
    const beat = `${folder}-${index + 1}`;
    blocks.push(entry.say);
    cells += entry.say.replace(/\s/gu, "").length;
    const caption = entry.caption ?? "";
    if (caption.includes("…") || caption.includes("...")) {
      problems.push(`${beat}: caption 含省略号「${caption}」`);
    }
    if (caption && captionCells(caption) > 18) {
      problems.push(`${beat}: caption ${captionCells(caption)} 格超宽「${caption}」`);
    }
    const sayTokens = new Set(extractTokens(entry.say).map((t) => t.key));
    const capTokens = new Set(extractTokens(caption).map((t) => t.key));
    const missing = [...sayTokens].filter((key) => !capTokens.has(key));
    const extra = [...capTokens].filter((key) => !sayTokens.has(key));
    if (missing.length > 0)
      problems.push(`${beat}: caption 少了 ${missing.join("、")}`);
    if (extra.length > 0)
      problems.push(`${beat}: caption 多了 ${extra.join("、")}`);
    if (entry.caption === undefined) problems.push(`${beat}: 缺手写 caption`);
  });
}

writeFileSync(join(root, "script.md"), blocks.join("\n\n---\n\n") + "\n");

console.log(
  `chapters=${folders.length} beats=${blocks.length} chars=${cells} est=${(cells / 4 / 60).toFixed(1)}min`,
);
console.log(problems.length ? problems.join("\n") : "captions ok");
