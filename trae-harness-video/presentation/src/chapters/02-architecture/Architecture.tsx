import { useEffect, useRef } from "react";
import type { ChapterStepProps } from "../../registry/types";
import "./Architecture.css";

const AGENTS = [
  { dot: "red", name: "Agent-Debate", role: "辩论" },
  { dot: "yellow", name: "Agent-Review", role: "审核" },
  { dot: "green", name: "Agent-Dev", role: "开发" },
];

const HOOK_LINES = [
  { text: "同一个模型。", hl: false },
  { text: "DeepSeek V4 Pro。", hl: true },
  { text: "差距有多大？", hl: false },
];

const localStep = (s: number) => s - 5;

export default function Architecture({ step }: ChapterStepProps) {
  const prevRef = useRef(step);

  useEffect(() => {
    prevRef.current = step;
  }, [step]);

  if (step === 5) {
    return (
      <div className="ar-chapter">
        <div className={`ar-chapter__title${localStep(step) >= 0 ? " in" : ""}`}>
          核心机制
        </div>
        <div className={`ar-mech-card${localStep(step) >= 0 ? " in" : ""}`}>
          <div className="ar-mech-card__icon">01</div>
          <div className="ar-mech-card__label">步骤隔离</div>
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="ar-isolation">
        <div className={`ar-iso-box${localStep(step) >= 1 ? " in" : ""}`}>
          <span className="ar-iso-box__tag">Sub-Agent</span>
          <span className="ar-iso-box__name">Agent A</span>
        </div>
        <div className={`ar-iso-arrow${localStep(step) >= 1 ? " in" : ""}`}>
          <div className="ar-iso-arrow__line" />
          <div className="ar-iso-gate">
            <span className="ar-iso-gate__bar" />
            Gate
          </div>
        </div>
        <div className={`ar-iso-box ar-iso-box--right${localStep(step) >= 1 ? " in" : ""}`}>
          <span className="ar-iso-box__tag">Output</span>
          <span className="ar-iso-box__name">结果</span>
        </div>
      </div>
    );
  }

  if (step === 7) {
    const ls = localStep(step);
    return (
      <div className="ar-bottleneck">
        <div className={`ar-bn-num${ls >= 2 ? " in" : ""}`} style={{ transitionDelay: "0ms" }}>
          <span className="ar-bn-num__val">200</span>
          <span className="ar-bn-num__label">token / 模块间传递</span>
        </div>
        <div className={`ar-bn-funnel${ls >= 2 ? " in" : ""}`} style={{ transitionDelay: "200ms" }}>
          <div className="ar-bn-funnel__top" />
          <div className="ar-bn-funnel__mid" />
          <div className="ar-bn-funnel__bot" />
          <span className="ar-bn-funnel__arrow">↓</span>
        </div>
        <div className={`ar-bn-num${ls >= 2 ? " in" : ""}`} style={{ transitionDelay: "350ms" }}>
          <span className="ar-bn-num__val">&lt;400</span>
          <span className="ar-bn-num__label">token / 单步上下文</span>
        </div>
      </div>
    );
  }

  if (step === 8) {
    const ls = localStep(step);
    return (
      <div className="ar-agents">
        <div className={`ar-agents__header${ls >= 3 ? " in" : ""}`}>3 子 Agent 并行</div>
        <div className="ar-agents__row">
          {AGENTS.map((a, i) => (
            <div
              key={a.name}
              className={`ar-agent-col${ls >= 3 ? " in" : ""}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className={`ar-agent-col__dot ar-agent-col__dot--${a.dot}`} />
              <div className="ar-agent-col__name">{a.name}</div>
              <div className="ar-agent-col__role">{a.role}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 9) {
    const ls = localStep(step);
    return (
      <div className="ar-orchestrator">
        <div className={`ar-orch-card${ls >= 4 ? " in" : ""}`}>
          <span className="ar-orch-card__icon">⚙</span>
          <span className="ar-orch-card__name">编排器</span>
          <span className="ar-orch-card__sub">Orchestrator</span>
        </div>
        <div className={`ar-orch-gates${ls >= 4 ? " in" : ""}`}>
          <div className="ar-orch-gate">
            <div className="ar-orch-gate__light ar-orch-gate__light--block" />
            <span className="ar-orch-gate__label">阻止</span>
          </div>
          <div className="ar-orch-gate">
            <div className="ar-orch-gate__light ar-orch-gate__light--pass" />
            <span className="ar-orch-gate__label">放行</span>
          </div>
        </div>
        <div className={`ar-orch-rule${ls >= 4 ? " in" : ""}`}>
          Gate 不通过 = 不前进
        </div>
      </div>
    );
  }

  if (step === 10) {
    const ls = localStep(step);
    return (
      <div className="ar-hook">
        {HOOK_LINES.map((l, i) => (
          <div
            key={i}
            className={`ar-hook__line${ls >= 5 ? " in" : ""}${l.hl ? " ar-hook__line--hl" : ""}`}
            style={{ transitionDelay: `${i * 140}ms` }}
          >
            {l.text}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
