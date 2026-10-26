import type { ChapterStepProps } from "../../registry/types";
import "./Results.css";

/**
 * 第 3 章 · 11 轮 A/B 实验数据（8 拍，章内 0-based step）。
 *
 * 每一步换一种数据演示：A/B 实验设计、正确率柱、断言密度条、覆盖率
 * 双环、安全 / 复发折线、性能轨 + SWE-bench 归零、成本账本、L3 台阶。
 * 所有文字块走 atoms.css 契约。
 */
const AB_PIPS = Array.from({ length: 11 }, (_, index) => index + 1);

export default function Results({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 实验台</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  同一个模型，只换 <em>Harness</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">DEEPSEEK V4 PRO</span>
          </div>

          <div className="re-setup">
            <div className="re-setup__copy">
              <div className="atom-stat in">
                <div className="atom-stat__value">11</div>
                <div className="atom-stat__label">轮 A、B 对照</div>
              </div>

              <ul className="atom-list in">
                <li className="atom-list__item">
                  <span className="atom-list__mark">A</span>
                  <span>无 Harness：模型自己发挥</span>
                </li>
                <li className="atom-list__item">
                  <span className="atom-list__mark">B</span>
                  <span>有 Harness：隔离、限流、Gate 全开</span>
                </li>
                <li className="atom-list__item">
                  <span className="atom-list__mark">=</span>
                  <span>同一模型、同一批任务，只换流程</span>
                </li>
              </ul>
            </div>

            <div className="re-ab" aria-hidden="true">
              <div className="re-ab__lane re-ab__lane--a">
                <span className="re-ab__label">A / 无 Harness</span>
                <div className="re-ab__pips">
                  {AB_PIPS.map((pip) => (
                    <span className="re-ab__pip" key={`a-${pip}`} />
                  ))}
                </div>
              </div>
              <div className="re-ab__lane re-ab__lane--b">
                <span className="re-ab__label">B / 有 Harness</span>
                <div className="re-ab__pips">
                  {AB_PIPS.map((pip) => (
                    <span className="re-ab__pip" key={`b-${pip}`} />
                  ))}
                </div>
              </div>
              <span className="re-ab__divider" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 指标 01</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  正确率 <em>90% → 100%</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">满分 · 0 bug</span>
          </div>

          <div className="re-metric">
            <div className="re-bars" aria-hidden="true">
              <div className="re-bar re-bar--a">
                <span className="re-bar__fill" style={{ height: "90%" }} />
                <span className="re-bar__value">90%</span>
                <span className="re-bar__cap">A / 无 Harness</span>
              </div>
              <div className="re-bar re-bar--b">
                <span className="re-bar__fill" style={{ height: "100%" }} />
                <span className="re-bar__value">100%</span>
                <span className="re-bar__cap">B / 有 Harness</span>
              </div>
            </div>

            <div className="re-metric__copy">
              <div className="atom-stat lit">
                <div className="atom-stat__value">100%</div>
                <div className="atom-stat__label">代码正确率</div>
              </div>
              <p className="re-lede">
                11 轮里没有一轮掉链子。满分不是“差不多”，是一个 bug 都没放过。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 指标 02</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  断言密度 <em>28 → 124</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">4 倍</span>
          </div>

          <div className="re-assert">
            <div className="re-assert__rows" aria-hidden="true">
              <div className="re-assert__row">
                <span className="re-assert__name">A</span>
                <span className="re-assert__track">
                  <span className="re-assert__fill re-assert__fill--a" style={{ width: "22.5%" }} />
                </span>
                <span className="re-assert__num">28</span>
              </div>
              <div className="re-assert__row">
                <span className="re-assert__name">B</span>
                <span className="re-assert__track">
                  <span className="re-assert__fill re-assert__fill--b" style={{ width: "100%" }} />
                </span>
                <span className="re-assert__num">124</span>
              </div>
              <div className="re-assert__bracket">
                <span className="re-assert__bracket-label">×4</span>
              </div>
            </div>

            <div className="re-assert__copy">
              <div className="atom-stat in">
                <div className="atom-stat__value">124</div>
                <div className="atom-stat__label">条测试断言</div>
              </div>
              <p className="re-lede">测试写得比代码还认真：每一步都留下可复核的断言。</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 指标 03</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  覆盖率 <em>62% → 85%</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge in">规范违规 -60%</span>
          </div>

          <div className="re-coverage">
            <div className="re-rings" aria-hidden="true">
              <div className="re-ring">
                <svg viewBox="0 0 160 160" className="re-ring__svg">
                  <circle className="re-ring__track" cx="80" cy="80" r="66" />
                  <circle className="re-ring__fill re-ring__fill--a" cx="80" cy="80" r="66" />
                </svg>
                <span className="re-ring__value">62%</span>
                <span className="re-ring__cap">A / 无 Harness</span>
              </div>
              <div className="re-ring re-ring--lit">
                <svg viewBox="0 0 160 160" className="re-ring__svg">
                  <circle className="re-ring__track" cx="80" cy="80" r="66" />
                  <circle className="re-ring__fill re-ring__fill--b" cx="80" cy="80" r="66" />
                </svg>
                <span className="re-ring__value">85%</span>
                <span className="re-ring__cap">B / 有 Harness</span>
              </div>
            </div>

            <div className="re-coverage__copy">
              <div className="atom-stat lit">
                <div className="atom-stat__value">-60%</div>
                <div className="atom-stat__label">代码规范违规</div>
              </div>
              <div className="re-cut" aria-hidden="true">
                <span className="re-cut__block" />
                <span className="re-cut__blade" />
              </div>
              <p className="re-lede">覆盖率补上来的同时，违规量被一刀切掉六成。</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 指标 04</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  安全 <em>3 倍</em>，复发 <em>-91.7%</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">SECURITY</span>
          </div>

          <div className="re-safety">
            <div className="re-safety__stats">
              <div className="atom-stat in">
                <div className="atom-stat__value">3×</div>
                <div className="atom-stat__label">安全防御覆盖</div>
              </div>
              <div className="atom-stat lit">
                <div className="atom-stat__value">-91.7%</div>
                <div className="atom-stat__label">同类 bug 复发率</div>
              </div>
            </div>

            <div className="re-spark" aria-hidden="true">
              <span className="re-spark__label">同类 bug 复发</span>
              <svg viewBox="0 0 560 260" className="re-spark__svg">
                <line className="re-spark__axis" x1="20" y1="220" x2="540" y2="220" />
                <polyline
                  className="re-spark__line"
                  points="20,60 90,86 160,92 230,142 300,158 370,196 440,214 520,222"
                />
                <circle className="re-spark__dot" cx="520" cy="222" r="7" />
              </svg>
              <span className="re-spark__note">同样的坑，不踩第二次</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 指标 05</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  性能 <em>4.6 倍</em>，SWE-bench 归零
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">SPEED + REGRESSION</span>
          </div>

          <div className="re-performance">
            <div className="re-speed" aria-hidden="true">
              <span className="re-speed__rail">
                <span className="re-speed__streak re-speed__streak--1" />
                <span className="re-speed__streak re-speed__streak--2" />
                <span className="re-speed__streak re-speed__streak--3" />
              </span>
              <span className="re-speed__mark">4.6×</span>
              <span className="re-speed__cap">性能加速</span>
            </div>

            <div className="re-swe">
              <span className="atom-badge dim">SWE-bench</span>
              <div className="re-swe__numbers">
                <span className="re-swe__from">2</span>
                <span className="re-swe__arrow">→</span>
                <span className="re-swe__to">0</span>
              </div>
              <span className="re-swe__cap">回归 bug</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="re-scene scene-pad">
        <div className="re-step" key={step}>
          <div className="re-head">
            <div>
              <div className="atom-kicker in">03 / 成本账本</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  花 <em>2 万</em>，省 <em>10 万</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">ROI 529%</span>
          </div>

          <div className="re-roi">
            <div className="re-tokens" aria-hidden="true">
              <div className="re-token-row">
                <span className="re-token-row__label">投入</span>
                <span className="re-token-row__track">
                  <span className="re-token-row__fill re-token-row__fill--in" style={{ width: "20%" }} />
                </span>
                <span className="re-token-row__num">2 万</span>
              </div>
              <div className="re-token-row">
                <span className="re-token-row__label">净省</span>
                <span className="re-token-row__track">
                  <span className="re-token-row__fill re-token-row__fill--out" style={{ width: "100%" }} />
                </span>
                <span className="re-token-row__num">10 万</span>
              </div>
              <span className="re-tokens__note">token 账本</span>
            </div>

            <div className="re-roi__copy">
              <div className="atom-stat lit">
                <div className="atom-stat__value">529%</div>
                <div className="atom-stat__label">ROI</div>
              </div>
              <p className="re-lede">投入一块钱，回报五块多。流程本身是要花钱的，但省得更多。</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="re-scene scene-pad">
      <div className="re-static" key={step}>
        <div className="atom-kicker dim">03 / 复杂度</div>
        <div className="atom-hero in">
          <h1 className="atom-hero__title">
            复杂度越高，<em>回报越大</em>
          </h1>
        </div>

        <div className="re-stairs" aria-hidden="true">
          <span className="re-stair re-stair--1">L1</span>
          <span className="re-stair re-stair--2">L2</span>
          <span className="re-stair re-stair--3 re-stair--lit">L3</span>
        </div>

        <div className="atom-stat lit re-static__stat">
          <div className="atom-stat__value">1000%</div>
          <div className="atom-stat__label">L3 任务 ROI</div>
        </div>

        <div className="atom-footer in">
          <span className="atom-footer__note">L3 · ROI &gt; 1000%</span>
          <span className="atom-footer__cue">下一章：v2.0</span>
        </div>
      </div>
    </div>
  );
}
