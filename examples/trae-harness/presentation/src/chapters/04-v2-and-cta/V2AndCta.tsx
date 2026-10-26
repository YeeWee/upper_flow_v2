import type { ChapterStepProps } from "../../registry/types";
import "./V2AndCta.css";

/**
 * 第 4 章 · v2.0 能力与行动召唤（3 拍，章内 0-based step）。
 *
 * step 0 用类型路由图讲“项目类型自适应”；step 1 用三层验收卡讲
 * trae-acceptance；step 2 是收尾静帧（slogan + GitHub + QR 占位）。
 * 所有文字块走 atoms.css 契约。
 */
const LAYERS = [
  {
    label: "01 / BROWSER",
    title: "浏览器自动化",
    body: "真的点一遍，不靠想象验收。",
  },
  {
    label: "02 / VISION",
    title: "视觉检查",
    body: "截图比对，布局漂移一眼看见。",
  },
  {
    label: "03 / REVIEW",
    title: "双轨复盘",
    body: "过程和结果两条线一起回看。",
  },
];

export default function V2AndCta({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
      <div className="vc-scene scene-pad">
        <div className="vc-step" key={step}>
          <div className="vc-head">
            <div>
              <div className="atom-kicker in">04 / v2.0</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  项目类型<em>自适应</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">v2.0</span>
          </div>

          <div className="vc-router">
            <div className="vc-router__core" aria-hidden="true">
              v2.0
            </div>
            <span className="vc-router__line" aria-hidden="true" />

            <div className="vc-router__branch vc-router__branch--a">
              <div className="atom-card in">
                <div className="atom-card__label">VIDEO</div>
                <h2 className="atom-card__title">视频项目</h2>
                <p className="atom-card__body">自动上 VISUAL_GATE，画面不过关不放行。</p>
              </div>
            </div>

            <div className="vc-router__branch vc-router__branch--b">
              <div className="atom-card lit">
                <div className="atom-card__label">DESIGN</div>
                <h2 className="atom-card__title">设计项目</h2>
                <p className="atom-card__body">走视觉验收，版式和状态都要对。</p>
              </div>
            </div>
          </div>

          <div className="vc-badges">
            <span className="atom-badge dim">8 个模板</span>
            <span className="atom-badge in">11 个 Agent 角色</span>
            <span className="atom-badge lit">按需加载</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="vc-scene scene-pad">
        <div className="vc-step" key={step}>
          <div className="vc-head">
            <div>
              <div className="atom-kicker in">04 / 验收引擎</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  <em>trae-acceptance</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">三层保险</span>
          </div>

          <div className="vc-layers">
            {LAYERS.map((layer, index) => (
              <div className={`vc-layer vc-layer--${index + 1}`} key={layer.title}>
                <span className="vc-layer__ring" aria-hidden="true" />
                <div className={`atom-card ${index === 2 ? "lit" : "in"}`}>
                  <div className="atom-card__label">{layer.label}</div>
                  <h2 className="atom-card__title">{layer.title}</h2>
                  <p className="atom-card__body">{layer.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="vc-lede">
            浏览器自动化、视觉检查、双轨复盘 —— 一层不够，就叠三层。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-scene scene-pad">
      <div className="vc-static" key={step}>
        <div className="atom-kicker dim">04 / 收尾</div>

        <div className="atom-quote lit vc-quote">
          <p className="atom-quote__text">
            用确定性对抗模糊，
            <br />
            用规则防幻觉。
          </p>
          <div className="atom-quote__cite">trae-harness</div>
        </div>

        <div className="vc-cta">
          <div className="atom-card in vc-cta__card">
            <div className="atom-card__label">GITHUB</div>
            <h2 className="atom-card__title">zzzkeepdd/trae-harness</h2>
            <p className="atom-card__body">
              搜仓库名进主仓库；实验数据在 trae-harness-experiments。
            </p>
          </div>

          <div className="vc-qr" aria-hidden="true">
            <span className="vc-qr__mark" />
            <span className="vc-qr__text">QR · 待提供</span>
          </div>
        </div>

        <div className="atom-footer in">
          <span className="atom-footer__note">11 轮实验数据 · 量化给你看</span>
          <span className="atom-footer__cue">trae-harness</span>
        </div>
      </div>
    </div>
  );
}
