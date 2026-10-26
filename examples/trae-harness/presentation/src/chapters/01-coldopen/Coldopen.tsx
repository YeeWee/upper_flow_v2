import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

/**
 * 第 1 章 · 问题引入（5 拍，章内 0-based step）。
 *
 * 每一拍是一屏；视觉块全部走 atoms.css 的契约（类名 + 必填 DOM 外壳 +
 * `.in / .lit / .dim`）。章节只负责「哪个原子放在哪里」和内容驱动的
 * CSS 演示（输入框、故障卡、轨道环、边界图、机制清单）。
 *
 * `key={step}` 让每一步的子树重新挂载，CSS keyframes 才能从 0 播一遍。
 */
const FAULTS = [
  {
    label: "01 / 幻觉",
    title: "编一个不存在的接口",
    body: "看起来很像真的，跑起来就炸。",
  },
  {
    label: "02 / 跳测试",
    title: "测试？下次一定",
    body: "没人盯着，就先跳过再说。",
  },
  {
    label: "03 / 自由发挥",
    title: "顺手改你没让改的",
    body: "边界一松，范围就开始膨胀。",
  },
];

const MECHS = ["步骤隔离", "信息瓶颈", "三 Agent 并行", "铁面 Gate"];

export default function Coldopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
      <div className="co-scene scene-pad">
        <div className="co-step" key={step}>
          <div className="atom-kicker in">01 / 需求 → 代码</div>

          <div className="co-cover">
            <div className="atom-hero in">
              <h1 className="atom-hero__title">
                <span className="co-line co-line--1">把需求</span>
                <span className="co-line co-line--2">
                  丢给 <em>AI</em>
                </span>
              </h1>
            </div>

            <div className="co-prompt co-rise co-rise--1">
              <span className="co-prompt__label">PROMPT</span>
              <span className="co-prompt__text">做一个能自测的登录页</span>
              <span className="co-prompt__caret" aria-hidden="true" />
            </div>

            <div className="co-code co-rise co-rise--2" aria-hidden="true">
              <span className="co-code__line">
                <span className="co-code__no">01</span>
                export function login() {"{"}
              </span>
              <span className="co-code__line">
                <span className="co-code__no">02</span>
                {"  "}const user = await auth();
              </span>
              <span className="co-code__line co-code__line--dim">
                <span className="co-code__no">03</span>
                {"  "}return buildSession(user);
              </span>
              <span className="co-code__line co-code__line--dim">
                <span className="co-code__no">04</span>
                {"}"}
              </span>
            </div>
          </div>

          <div className="atom-footer in">
            <span className="atom-footer__note">一条需求 · 一次生成</span>
            <span className="atom-footer__cue">它写代码</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="co-scene scene-pad">
        <div className="co-step" key={step}>
          <div className="co-problem-head">
            <div>
              <div className="atom-kicker in">01 / 故障现场</div>
              <div className="atom-hero in">
                <h1 className="atom-hero__title">
                  它不只写代码，<em>也会翻车</em>。
                </h1>
              </div>
            </div>
            <span className="atom-badge dim co-problem-head__tag">
              HALLUCINATION / SKIP / FREESTYLE
            </span>
          </div>

          <div className="co-faults">
            {FAULTS.map((fault, index) => (
              <div className={`co-fault co-rise co-rise--${index + 1}`} key={fault.label}>
                <div className={`atom-card ${index === 0 ? "lit" : "in"}`}>
                  <div className="atom-card__label">{fault.label}</div>
                  <h2 className="atom-card__title">{fault.title}</h2>
                  <p className="atom-card__body">{fault.body}</p>
                </div>
                <span className="co-fault__sweep" aria-hidden="true" />
              </div>
            ))}
          </div>

          <hr className="atom-rule in co-problem-rule" />
          <div className="atom-footer in">
            <span className="atom-footer__note">同一个需求，三种走样</span>
            <span className="atom-footer__cue">所以需要一个框架</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="co-scene scene-pad">
        <div className="co-step" key={step}>
          <div className="atom-kicker lit">01 / 代号</div>

          <div className="co-brand">
            <span className="co-focal" aria-hidden="true" />
            <div className="atom-hero in">
              <h1 className="atom-hero__title">
                <em>trae-harness</em>
              </h1>
            </div>
            <p className="co-brand__sub">
              多 Agent 协作框架 <span className="co-brand__dot" /> 11 轮 A/B 实验
            </p>

            <div className="co-orbit" aria-hidden="true">
              <span className="co-orbit__ring" />
              <span className="co-orbit__core" />
              <span className="co-orbit__node co-orbit__node--a">辩论</span>
              <span className="co-orbit__node co-orbit__node--b">审核</span>
              <span className="co-orbit__node co-orbit__node--c">开发</span>
            </div>
          </div>

          <div className="co-brand__meta">
            <span className="atom-badge dim">MULTI-AGENT</span>
            <span className="atom-badge lit">HARNESS</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="co-scene scene-pad">
        <div className="co-step" key={step}>
          <div className="atom-kicker in">01 / 根因</div>

          <div className="co-root">
            <div className="atom-quote lit">
              <p className="atom-quote__text">
                边界不确定，<em>幻觉</em>就有空间。
              </p>
              <div className="atom-quote__cite">每个 Agent 的边界</div>
            </div>

            <div className="co-boundary" aria-hidden="true">
              <div className="co-boundary__box">
                <span className="co-boundary__name">Agent A</span>
                <span className="co-boundary__line" />
                <span className="co-boundary__line co-boundary__line--short" />
              </div>
              <div className="co-boundary__gap">
                <span>?</span>
              </div>
              <div className="co-boundary__box">
                <span className="co-boundary__name">Agent B</span>
                <span className="co-boundary__line" />
                <span className="co-boundary__line co-boundary__line--short" />
              </div>
              <span className="co-boundary__fog" />
            </div>
          </div>

          <div className="co-root__meta">
            <span className="atom-badge dim">BOUNDARY</span>
            <span className="atom-badge lit">不确定 = 模糊空间</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="co-scene scene-pad">
      <div className="co-step" key={step}>
        <div className="atom-kicker in">01 / 过渡</div>

        <div className="co-ask">
          <div className="atom-hero in">
            <h1 className="atom-hero__title">
              它<em>怎么</em>做到的？
            </h1>
          </div>

          <ul className="atom-list in co-mechs">
            {MECHS.map((mech, index) => (
              <li
                className={`atom-list__item co-mechs__item co-rise co-rise--${index + 1}`}
                key={mech}
              >
                <span className="atom-list__mark">0{index + 1}</span>
                <span>{mech}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="atom-footer in">
          <span className="atom-footer__note">下一章：四个机制</span>
          <span className="atom-footer__cue">继续</span>
        </div>
      </div>
    </div>
  );
}
