/**
 * 视觉原子画廊 —— 契约的回归面。
 *
 * 每个原子 × 三种状态（.in / .lit / .dim）各排一遍。页面本身是静态
 * HTML（不经过 React），因为合成稿也是静态 HTML：如果原子只能在 React
 * 里渲染，那它就不是可共享的契约。
 *
 * 这里只挂状态类，不做动画 —— 动画实现不属于原子契约。
 */
import "../styles/fonts.css";
import "../styles/base.css";
import "../styles/tokens.css";
import "../styles/atoms.css";
import "./gallery.css";

type AtomState = "in" | "lit" | "dim";

const STATES: AtomState[] = ["in", "lit", "dim"];

interface AtomDef {
  /** 契约类名（root） */
  cls: string;
  title: string;
  /** 一句话说明这个原子负责什么 */
  blurb: string;
  /** 必填 DOM 外壳 */
  shell: string;
  render: (state: AtomState) => string;
}

const ATOMS: AtomDef[] = [
  {
    cls: "atom-kicker",
    title: "Kicker",
    blurb: "大写等宽眉标：给一个节拍定调，不抢主视觉。",
    shell: `<div class="atom-kicker in">Chapter 01 — Example</div>`,
    render: (state) => `
      <div class="atom-kicker ${state}">Chapter 01 — Example</div>`,
  },
  {
    cls: "atom-hero",
    title: "Hero",
    blurb: "主标题块。标题内的 <em> 自动取 accent。",
    shell: `<div class="atom-hero in">
  <h1 class="atom-hero__title">…</h1>
</div>`,
    render: (state) => `
      <div class="atom-hero ${state}">
        <h1 class="atom-hero__title">这是 <em>first step</em>.</h1>
      </div>`,
  },
  {
    cls: "atom-stat",
    title: "Stat / hero number",
    blurb: "大数字 + 小标签。数字字体 / 字重 / 字距由主题的 --hero-num-* 决定。",
    shell: `<div class="atom-stat in">
  <div class="atom-stat__value">02</div>
  <div class="atom-stat__label">Step</div>
</div>`,
    render: (state) => `
      <div class="atom-stat ${state}">
        <div class="atom-stat__value">02</div>
        <div class="atom-stat__label">Step</div>
      </div>`,
  },
  {
    cls: "atom-list",
    title: "List",
    blurb: "逐项列表。整组状态挂 root；逐个揭示时把状态挂到 .atom-list__item。",
    shell: `<ul class="atom-list in">
  <li class="atom-list__item">
    <span class="atom-list__mark">01</span><span>…</span>
  </li>
</ul>`,
    render: (state) => `
      <ul class="atom-list ${state}">
        <li class="atom-list__item">
          <span class="atom-list__mark">01</span>
          <span>Palette —— 调色板全部走 token</span>
        </li>
        <li class="atom-list__item">
          <span class="atom-list__mark">02</span>
          <span>Fonts —— 字体家族由主题决定</span>
        </li>
        <li class="atom-list__item">
          <span class="atom-list__mark">03</span>
          <span>Motion —— 动效时长由主题气质决定</span>
        </li>
      </ul>`,
  },
  {
    cls: "atom-card",
    title: "Card",
    blurb: "承载一段正文或一组细节。圆角 / 阴影来自主题。",
    shell: `<div class="atom-card in">
  <div class="atom-card__label">Label</div>
  <h2 class="atom-card__title">…</h2>
  <p class="atom-card__body">…</p>
</div>`,
    render: (state) => `
      <div class="atom-card ${state}">
        <div class="atom-card__label">Contract</div>
        <h2 class="atom-card__title">样式共享，代码不共享</h2>
        <p class="atom-card__body">
          演示与合成稿各自实现动画，只共享类名、DOM 外壳与状态类。
        </p>
      </div>`,
  },
  {
    cls: "atom-quote",
    title: "Quote",
    blurb: "左竖线引文。竖线颜色是状态最明显的信号。",
    shell: `<div class="atom-quote in">
  <p class="atom-quote__text">…</p>
  <div class="atom-quote__cite">…</div>
</div>`,
    render: (state) => `
      <div class="atom-quote ${state}">
        <p class="atom-quote__text">Replace this with your own chapters.</p>
        <div class="atom-quote__cite">CHAPTER-CRAFT.md</div>
      </div>`,
  },
  {
    cls: "atom-badge",
    title: "Badge",
    blurb: "等宽药丸标签：状态、来源、版本号。",
    shell: `<span class="atom-badge in">Theme-agnostic</span>`,
    render: (state) => `
      <span class="atom-badge ${state}">Theme-agnostic</span>`,
  },
  {
    cls: "atom-rule",
    title: "Rule",
    blurb: "分隔线。粗细 / 实虚线由主题的 --rule-w / --rule-style 决定。",
    shell: `<hr class="atom-rule in" />`,
    render: (state) => `
      <hr class="atom-rule ${state}" />`,
  },
  {
    cls: "atom-footer",
    title: "Footer",
    blurb: "底部信息条：左 note、右 cue。",
    shell: `<div class="atom-footer in">
  <span class="atom-footer__note">…</span>
  <span class="atom-footer__cue">…</span>
</div>`,
    render: (state) => `
      <div class="atom-footer ${state}">
        <span class="atom-footer__note">See CHAPTER-CRAFT.md</span>
        <span class="atom-footer__cue">Tap to advance</span>
      </div>`,
  },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderStates(atom: AtomDef): string {
  return STATES.map(
    (state) => `
      <div class="ag-cell">
        <div class="ag-cell-head">.${state}</div>
        <div class="ag-stage">${atom.render(state)}</div>
      </div>`,
  ).join("");
}

function renderAtom(atom: AtomDef): string {
  return `
    <section class="ag-atom" id="${atom.cls}">
      <div class="ag-atom-head">
        <div>
          <h2 class="ag-atom-title"><code>.${atom.cls}</code> ${atom.title}</h2>
          <p class="ag-atom-blurb">${atom.blurb}</p>
        </div>
        <pre class="ag-shell"><code>${escapeHtml(atom.shell)}</code></pre>
      </div>
      <div class="ag-states">${renderStates(atom)}</div>
    </section>`;
}

const gallery = document.querySelector<HTMLElement>("#gallery");
if (!gallery) throw new Error("atoms gallery: #gallery not found");

gallery.innerHTML = `
  <header class="ag-head">
    <p class="ag-eyebrow">AVP · Visual atoms</p>
    <h1 class="ag-title">视觉原子画廊</h1>
    <p class="ag-lede">
      每个原子 × <code>.in</code> / <code>.lit</code> / <code>.dim</code> 三态。
      状态色只来自当前主题的既有 token；动画实现不属于契约。
    </p>
    <div class="ag-legend">
      <span><code>.in</code> 已入场，基线</span>
      <span><code>.lit</code> 当前焦点</span>
      <span><code>.dim</code> 退为上下文</span>
      <span>${ATOMS.length} atoms · ${ATOMS.length * STATES.length} states</span>
    </div>
  </header>
  <main class="ag-list">${ATOMS.map(renderAtom).join("")}</main>`;
