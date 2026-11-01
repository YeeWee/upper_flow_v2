import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outline = readFileSync(join(root, "outline.md"), "utf8");
const beatsDir = join(root, "composition", "beats");
const hooksDir = join(root, "composition", "hooks");
mkdirSync(beatsDir, { recursive: true });
mkdirSync(hooksDir, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const chapters = [];
let cur = null;
for (const line of outline.split("\n")) {
  const h = /^## (\d+)\. ([a-z0-9-]+) — (.*)（\d+ steps · ~[0-9.]+s）$/.exec(line);
  if (h) { cur = { n: h[1], id: h[2], title: h[3], steps: [] }; chapters.push(cur); continue; }
  if (line.startsWith("## 素材清单")) { cur = null; continue; }
  if (!cur) continue;
  const s = /^- step (\d+) \(~[0-9.]+s\) — (.+)$/.exec(line);
  if (s) cur.steps.push({ k: Number(s[1]), text: s[2] });
}

let created = 0, skipped = 0;
for (const ch of chapters) {
  for (const st of ch.steps) {
    const id = `${ch.id}-${st.k}`;
    const bodyPath = join(beatsDir, `${id}.body.html`);
    if (existsSync(bodyPath)) { skipped += 1; continue; }
    const body = `<style>
.scaf { position:absolute; inset:0; padding:var(--stage-pad-y) var(--stage-pad-x); display:flex; flex-direction:column; justify-content:center; gap:34px; }
.scaf__kick { font-family:var(--font-mono); font-size:15px; letter-spacing:.28em; color:var(--text-mute); text-transform:uppercase; }
.scaf__title { font-family:var(--font-display-cn); font-weight:700; font-size:76px; line-height:1.18; letter-spacing:-.02em; color:var(--text); max-width:24ch; }
.scaf__rule { width:220px; height:0; border-top:2px dashed var(--rule); }
.scaf__note { font-family:var(--font-mono); font-size:16px; letter-spacing:.16em; color:var(--text-mute); }
.scaf__note b { color:var(--accent); font-weight:500; }
</style>
<!-- placeholder：待实现（本拍画面见 outline） -->
<div class="scaf">
  <div class="scaf__kick">${ch.n} / ${esc(ch.id)} · step ${st.k}</div>
  <div class="scaf__title">${esc(st.text)}</div>
  <div class="scaf__rule"></div>
  <div class="scaf__note"><b>${esc(ch.title)}</b> · 占位画面，实现时替换</div>
</div>
`;
    writeFileSync(bodyPath, body);
    const hookPath = join(hooksDir, `${id}.hook.ts`);
    if (!existsSync(hookPath)) {
      writeFileSync(hookPath, `export default function (tl: gsap.core.Timeline, root: HTMLElement, ctx: { start: number; duration: number }) {\n  tl.from(root.querySelector(".scaf__kick"), { opacity: 0, duration: 0.4 }, ctx.start + 0.05);\n  tl.from(root.querySelector(".scaf__title"), { opacity: 0, y: 22, duration: 0.6, ease: "power3.out" }, ctx.start + 0.1);\n  tl.from(root.querySelector(".scaf__rule"), { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, ctx.start + 0.5);\n  tl.from(root.querySelector(".scaf__note"), { opacity: 0, duration: 0.45 }, ctx.start + 0.8);\n}\n`);
    }
    created += 1;
  }
}
console.log("created", created, "skipped", skipped);
