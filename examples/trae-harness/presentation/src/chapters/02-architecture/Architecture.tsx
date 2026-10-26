import type { ChapterStepProps } from "../../registry/types";
import "./Architecture.css";

/**
 * 第 2 章 · 四个核心机制（6 拍，章内 0-based step）。
 *
 * 视觉演示：步骤隔离的断链流程图、200/400 token 的窄管、三 Agent
 * 并行轨道、Gate 闸门、四机制流水线。所有文字块走 atoms.css 契约。
 */
const ISOLATED_STEPS = ["解析需求", "生成代码", "跑测试"];

const LANES = [
  {
    label: "DEBATE",
    title: "辩论",
    body: "先把反例和边界吵出来，别急着写。",
  },
  {
    label: "REVIEW",
    title: "审核",
    body: "专门挑毛病，对着 Gate 一条条过。",
  },
  {
    label: "DEV",
    title: "开发",
    body: "只落当前步的代码，不越界。",
  },
];

const PIPELINE = ["隔离", "限流", "并行", "把关"];

export default function Architecture({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
      <div className="ar-scene scene-pad">
        <div className="ar-step" key={step}>
          <div className="atom-kicker in">02 / 机制 01</div>

          <div className="ar-head">
            <div className="atom-hero in">
              <h1 className="atom-hero__title">
                每个 Agent 只看<em>当前步</em>
              </h1>
            </div>
            <span className="atom-badge lit">ISOLATION</span>
          </div>

          <div className="ar-isolation">
            <div className="ar-flow" aria-hidden="true">
              {ISOLATED_STEPS.map((label, index) => (
                <div className={`ar-node ar-node--${index + 1}`} key={label}>
                  <span className="ar-node__no">STEP 0{index + 1}</span>
                  <span className="ar-node__label">{label}</span>
                  {index === 0 && <span className="ar-node__block">BLOCK</span>}
                </div>
              ))}
            </div>

            <ul className="atom-list in ar-aside">
              <li className="atom-list__item">
                <span className="atom-list__mark">01</span>
                <span>子 Agent 只拿当前步的输入</span>
              </li>
              <li className="atom-list__item">
                <span className="atom-list__mark">02</span>
                <span>下一步长什么样，它看不到</span>
              </li>
              <li className="atom-list__item">
                <span className="atom-list__mark">03</span>
                <span>越界就停，不靠自觉</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="ar-scene scene-pad">
        <div className="ar-step" key={step}>
          <div className="atom-kicker in">02 / 机制 02</div>

          <div className="ar-head">
            <div className="atom-hero in">
              <h1 className="atom-hero__title">
                信息只走<em>窄门</em>
              </h1>
            </div>
            <span className="atom-badge lit">BOTTLENECK</span>
          </div>

          <div className="ar-pipe">
            <div className="atom-stat in">
              <div className="atom-stat__value">200</div>
              <div className="atom-stat__label">token / 模块之间</div>
            </div>

            <div className="ar-channel" aria-hidden="true">
              <span className="ar-channel__wall ar-channel__wall--top" />
              <span className="ar-channel__wall ar-channel__wall--bottom" />
              <span className="ar-channel__gate" />
              <span className="ar-channel__dot ar-channel__dot--1" />
              <span className="ar-channel__dot ar-channel__dot--2" />
              <span className="ar-channel__dot ar-channel__dot--3" />
            </div>

            <div className="atom-stat dim">
              <div className="atom-stat__value">400</div>
              <div className="atom-stat__label">token / 上下文上限</div>
            </div>
          </div>

          <hr className="atom-rule in ar-rule" />

          <ul className="atom-list in ar-notes">
            <li className="atom-list__item">
              <span className="atom-list__mark">01</span>
              <span>模块之间只传 200 token，想多塞也塞不进去</span>
            </li>
            <li className="atom-list__item">
              <span className="atom-list__mark">02</span>
              <span>单个 Agent 的上下文压到 400 以内</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="ar-scene scene-pad">
        <div className="ar-step" key={step}>
          <div className="ar-head">
            <div>
              <div className="atom-kicker in">02 / 机制 03</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  3 条轨道<em>同时跑</em>
                </h1>
              </div>
            </div>
            <span className="atom-badge lit">PARALLEL</span>
          </div>

          <div className="ar-parallel">
            {LANES.map((lane, index) => (
              <div className={`ar-lane ar-lane--${index + 1}`} key={lane.title}>
                <span className="ar-lane__rail" aria-hidden="true">
                  <span className="ar-lane__pulse" />
                </span>
                <div className={`atom-card ${index === 1 ? "lit" : "in"}`}>
                  <div className="atom-card__label">{lane.label}</div>
                  <h2 className="atom-card__title">{lane.title}</h2>
                  <p className="atom-card__body">{lane.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="ar-parallel__foot">
            <span className="atom-badge dim">同一份需求</span>
            <span className="atom-badge in">三条独立上下文</span>
            <span className="atom-badge lit">最后一起过 Gate</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="ar-scene scene-pad">
        <div className="ar-step" key={step}>
          <div className="atom-kicker in">02 / 机制 04</div>

          <div className="ar-gate-wrap">
            <div className="ar-gate" aria-hidden="true">
              <span className="ar-gate__post ar-gate__post--left" />
              <span className="ar-gate__post ar-gate__post--right" />
              <span className="ar-gate__bar" />
              <span className="ar-gate__status">HOLD</span>
              <span className="ar-gate__lamp" />
            </div>

            <div className="ar-gate-copy">
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  铁面<em>编排器</em>
                </h1>
              </div>

              <ul className="atom-list in">
                <li className="atom-list__item">
                  <span className="atom-list__mark">01</span>
                  <span>Gate 不通过，不进入下一步</span>
                </li>
                <li className="atom-list__item">
                  <span className="atom-list__mark">02</span>
                  <span>没有“差不多得了”，只有过或不过</span>
                </li>
              </ul>

              <span className="atom-badge lit ar-gate-badge">GATE</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="ar-scene scene-pad">
        <div className="ar-step" key={step}>
          <div className="ar-pipe-head">
            <div>
              <div className="atom-kicker in">02 / 一条流水线</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  拼成一条<em>流水线</em>
                </h1>
              </div>
            </div>
            <div className="atom-stat lit">
              <div className="atom-stat__value">04</div>
              <div className="atom-stat__label">机制 / 一条线</div>
            </div>
          </div>

          <div className="ar-pipeline">
            <span className="ar-pipeline__line" aria-hidden="true" />
            {PIPELINE.map((label, index) => (
              <div className={`ar-pipe-node ar-pipe-node--${index + 1}`} key={label}>
                <span className="ar-pipe-node__no">0{index + 1}</span>
                <span className="ar-pipe-node__label">{label}</span>
              </div>
            ))}
          </div>

          <p className="ar-pipeline__note">
            隔离切断越界，限流压住上下文，并行拉高吞吐，Gate 守住出口。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ar-scene scene-pad">
      <div className="ar-static" key={step}>
        <div className="atom-kicker dim">02 / 过渡</div>
        <div className="atom-hero in">
          <h1 className="atom-hero__title">
            架构说完，<em>看效果</em>
          </h1>
        </div>
        <hr className="atom-rule lit ar-static__rule" />
        <div className="atom-footer in">
          <span className="atom-footer__note">下一章：11 轮 A、B 实验</span>
          <span className="atom-footer__cue">继续</span>
        </div>
      </div>
    </div>
  );
}
