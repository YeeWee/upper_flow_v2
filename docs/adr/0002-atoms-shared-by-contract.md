# 视觉原子以 CSS + DOM + 状态类共享，而非 React 组件

演示（React，`templates/` 与项目里的 `presentation/`）与合成稿（静态 HTML/GSAP）刻意保留两份代码（见 [ADR 0001](0001-two-artifacts-derive-composition.md)）。它们之间唯一可共享的视觉单位是**类名 + 必填 DOM 外壳 + `.in / .lit / .dim` 状态类**，样式表落在 `templates/src/styles/atoms.css`，由 `avp init` 随模板拷进项目。原子只定义「每个状态长什么样」，**不含动画实现**：演示用 CSS keyframes 把状态加上去，合成稿用挂载钩子把同样的状态加上去。

## 为什么不能共享代码

- 合成稿是静态 HTML，不能 `import` JSX / TSX；共享只能停在 CSS + DOM 契约这一层。
- React 章节是 `(step) => JSX` 的函数，不是可序列化的 DOM。让合成稿「自动导出演示的画面」在技术上不成立；服务端渲染也只能得到某一 step 的静态快照，拿不到逐拍编排。
- 两端的动画运行时不同：演示是 CSS keyframes / React 状态，合成稿是 GSAP timeline + 逐帧 seek。把其中一端的实现共享给另一端，等于让渲染器去模拟播放时的副作用，违反「逐帧可复现」。
- 共享 Web Component 会引入 shadow DOM 的 token 穿透问题，并给静态合成稿增加一层运行时；为一份样式契约付这个代价不划算。

## 后果

- **原子只能消费既有 token**：状态色来自 `--text` / `--text-2` / `--text-mute` / `--text-faint` / `--accent` / `--accent-soft` / `--rule` / `--surface*` 等；23 套主题不新增 token 名、不改文件。主题的性格 knob（`--rule-*` / `--hero-num-*` / `--dur-*` / `--stage-pad-*`）要真正生效，`base.css` 必须先于 `tokens.css` 载入——这是本次一起修掉的层叠顺序。
- **画廊是回归面**：`atoms.html`（dev 下 `/atoms.html`，build 下 `dist/atoms.html`）把每个原子 × `.in/.lit/.dim` 各排一遍。契约漂移没有自动断言，只能靠人看这个页面；新增或修改原子必须同步画廊。
- **加一个原子的成本**：改 `atoms.css` + 画廊 + `CHAPTER-CRAFT.md` 的类名表。两端的「怎么动」仍各写一遍，这是明知代价：共享视觉语言，不共享实现。
- **契约是弱约束**：CSS 类名写错不会报错，只会悄悄失去样式。因此画廊是必要的，不能把「原子层存在」当成「原子层被正确使用」。
