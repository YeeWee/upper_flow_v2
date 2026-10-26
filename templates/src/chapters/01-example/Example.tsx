import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./Example.css";

/**
 * Reference chapter — replace with your own.
 *
 * Demonstrates the per-step takeover pattern, the design-token system, and
 * the visual-atom contract: every visual block is an atom from
 * `styles/atoms.css` (class + required DOM shell + `.in / .lit / .dim`).
 * Step 0 renders its atoms `.in`, step 1 `.lit`, step 2 `.dim`, so the demo
 * exercises all three states. Animation lives in the chapter (MaskReveal);
 * the atoms only own how each state looks.
 *
 * See references/CHAPTER-CRAFT.md "视觉原子" and /atoms.html.
 */
export default function ExampleChapter({ step }: ChapterStepProps) {
  /* Step 0 — magazine cover: rule + kicker + hero + footer, all `.in` */
  if (step === 0) {
    return (
      <div className="ex-scene scene-pad">
        <header className="masthead">
          <span className="brand">Your Presentation</span>
          <span className="issue">Issue · 01 — Replace this</span>
        </header>
        <hr
          className="atom-rule in"
          style={{ marginTop: "var(--space-5)" }}
        />

        <div className="ex-cover-body">
          <div className="atom-kicker in">Chapter 01 — Example</div>
          <div className="atom-hero in">
            <h1 className="atom-hero__title">
              <MaskReveal show duration={900}>
                <span>这是&nbsp;</span>
              </MaskReveal>
              <MaskReveal show delay={300} duration={900}>
                <em>first&nbsp;step</em>
              </MaskReveal>
              <MaskReveal show delay={650} duration={900}>
                <span>.</span>
              </MaskReveal>
            </h1>
          </div>
          <div className="atom-footer in">
            <span className="atom-footer__note">Issue 01 · Example</span>
            <span className="atom-footer__cue">Tap anywhere to advance</span>
          </div>
        </div>
      </div>
    );
  }

  /* Step 1 — split layout: stat + hero + list + badge, all `.lit` */
  if (step === 1) {
    return (
      <div className="ex-scene scene-pad">
        <header className="masthead">
          <span className="brand">Your Presentation</span>
          <span className="issue">Issue · 01</span>
        </header>
        <hr
          className="atom-rule lit"
          style={{ marginTop: "var(--space-5)" }}
        />

        <div className="ex-split">
          <div className="atom-stat lit">
            <div className="atom-stat__value">02</div>
            <div className="atom-stat__label">Step</div>
          </div>
          <div className="ex-split-body">
            <div className="atom-kicker lit">每一步</div>
            <div className="atom-hero lit">
              <h2 className="atom-hero__title">
                <MaskReveal show duration={900}>
                  <span>独占&nbsp;</span>
                </MaskReveal>
                <MaskReveal show delay={300} duration={900}>
                  <em>整个屏幕</em>
                </MaskReveal>
                <MaskReveal show delay={650} duration={900}>
                  <span>.</span>
                </MaskReveal>
              </h2>
            </div>
            <ul className="atom-list lit">
              <li className="atom-list__item">
                <span className="atom-list__mark">01</span>
                <span>Palette —— 调色板与字体全部由主题 token 决定</span>
              </li>
              <li className="atom-list__item">
                <span className="atom-list__mark">02</span>
                <span>Personality —— hero 数字、分割线、卡片性格随主题变</span>
              </li>
              <li className="atom-list__item">
                <span className="atom-list__mark">03</span>
                <span>Contract —— 章节只写布局，视觉状态交给原子</span>
              </li>
            </ul>
            <div className="ex-split-meta">
              <span className="atom-badge lit">Theme-agnostic</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Step 2 — pull-quote close, all `.dim` */
  return (
    <div className="ex-scene scene-pad ex-close">
      <div className="ex-close-inner">
        <div className="atom-kicker dim">Now</div>
        <div className="atom-quote dim">
          <p className="atom-quote__text">
            <MaskReveal show duration={1100}>
              <span>Replace this with </span>
            </MaskReveal>
            <MaskReveal show delay={400} duration={1100}>
              <em>your own&nbsp;</em>
            </MaskReveal>
            <MaskReveal show delay={760} duration={1100}>
              <span>chapters.</span>
            </MaskReveal>
          </p>
          <div className="atom-quote__cite">CHAPTER-CRAFT.md</div>
        </div>
        <div className="atom-footer dim">
          <span className="atom-footer__note">
            See SKILL.md / CHAPTER-CRAFT.md / THEMES.md
          </span>
        </div>
      </div>
    </div>
  );
}
