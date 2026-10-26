import { useEffect, useRef } from "react";
import type { ChapterStepProps } from "../../registry/types";
import "./ColdOpen.css";

const PROBLEMS = [
  "产生幻觉",
  "跳过测试",
  "自由发挥",
];

export default function ColdOpen({ step }: ChapterStepProps) {
  const prevRef = useRef(step);

  useEffect(() => {
    prevRef.current = step;
  }, [step]);

  if (step === 0) {
    return (
      <div className="co-hero">
        <div className={`co-hero__title${step >= 0 ? " in" : ""}`}>
          你把需求丢给 AI
        </div>
        <div className={`co-hero__sub${step >= 0 ? " in" : ""}`}>
          它写代码
        </div>
        <div className={`co-hero__glow${step >= 0 ? " in" : ""}`} />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="co-problems">
        {PROBLEMS.map((text, i) => (
          <div key={text} className={`co-problem${i <= step - 1 ? " in" : ""}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <span className="co-problem__mark">✗</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="co-brand">
        <div className={`co-brand__name${step >= 2 ? " in" : ""}`}>
          trae-harness
        </div>
        <div className={`co-brand__desc${step >= 2 ? " in" : ""}`}>
          多 Agent 协作框架 × 11 轮 A/B 实验
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="co-diagnosis">
        <div className={`co-diagnosis__card${step >= 3 ? " in" : ""}`}>
          <p className="co-diagnosis__text">
            不确定每个 Agent 的<span className="co-diagnosis__hl">边界</span>，
            就一定有<span className="co-diagnosis__hl">幻觉空间</span>。
          </p>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="co-hook">
        <div className={`co-hook__q${step >= 4 ? " in" : ""}`}>
          它怎么解决的？
        </div>
        <div className={`co-hook__arrow${step >= 4 ? " in" : ""}`}>↓</div>
      </div>
    );
  }

  return null;
}
