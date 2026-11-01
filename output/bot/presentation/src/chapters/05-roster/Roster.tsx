import type { ChapterStepProps } from "../../registry/types";

/**
 * 占位章节：第 1 步（Plan）只定节奏与信息密度，画面在实现阶段重写。
 * 这里用视觉原子搭一个能点、能对音频的最小骨架，方便停点 1 走查。
 */
export default function Roster({ step }: ChapterStepProps) {
  return (
    <div
      className="scene-pad"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "var(--space-5, 24px)",
        minHeight: "100%",
      }}
    >
      <div className="atom-kicker in">Chapter 05 — roster</div>
      <div className="atom-hero in">
        <h1 className="atom-hero__title">
          一个 Chief 加四个专家
        </h1>
      </div>
      <div className="atom-stat in">
        <div className="atom-stat__value">{String(step + 1).padStart(2, "0")}</div>
        <div className="atom-stat__label">step · 本章画面待实现</div>
      </div>
      <div className="atom-footer in">
        <span className="atom-footer__note">Plan 停点 · 剧本与节拍已定</span>
      </div>
    </div>
  );
}
