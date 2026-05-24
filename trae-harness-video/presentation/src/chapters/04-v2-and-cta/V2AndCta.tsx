import "./V2AndCta.css";

export default function V2AndCta({ step }: { step: number }) {
  return (
    <div className="vc-root">
      {step === 19 && (
        <div className="vc-scene vc-scene--19">
          <h1 className="vc-version">v2.0</h1>
          <div className="vc-grid">
            <div className="vc-feature" style={{ "--vc-d": "0ms" } as React.CSSProperties}>
              <span className="vc-feature-title">项目类型自适应</span>
              <span className="vc-feature-desc">代码 / 视频 / 设计，自动切换工作流</span>
            </div>
            <div className="vc-feature" style={{ "--vc-d": "120ms" } as React.CSSProperties}>
              <span className="vc-feature-title">VISUAL_GATE</span>
              <span className="vc-feature-desc">视觉验收门控，像素级校验</span>
            </div>
            <div className="vc-feature" style={{ "--vc-d": "240ms" } as React.CSSProperties}>
              <span className="vc-feature-title">8 模板 &middot; 11 角色</span>
              <span className="vc-feature-desc">覆盖全栈场景的 Agent 矩阵</span>
            </div>
            <div className="vc-feature vc-feature--engine" style={{ "--vc-d": "360ms" } as React.CSSProperties}>
              <span className="vc-feature-title">trae-acceptance 引擎</span>
              <span className="vc-feature-desc">独立验收 / 浏览器自动化 / 视觉检查 / 双轨复盘</span>
            </div>
          </div>
        </div>
      )}

      {step === 20 && (
        <div className="vc-scene vc-scene--20">
          <div className="vc-slogan-block">
            <p className="vc-slogan-line" style={{ "--vc-i": "0" } as React.CSSProperties}>用确定性对抗模糊</p>
            <p className="vc-slogan-line" style={{ "--vc-i": "1" } as React.CSSProperties}>用规则防幻觉</p>
            <p className="vc-slogan-line" style={{ "--vc-i": "2" } as React.CSSProperties}>用 11 轮实验数据量化给你看</p>
          </div>
          <div className="vc-links">
            <a
              className="vc-link-card"
              href="https://github.com/zzzkeepdd/trae-harness"
              target="_blank"
              rel="noopener noreferrer"
              data-no-advance
            >
              <span className="vc-link-icon" aria-hidden="true">&#x1F4BB;</span>
              <span>github.com/zzzkeepdd/<strong>trae-harness</strong></span>
            </a>
            <a
              className="vc-link-card"
              href="https://github.com/zzzkeepdd/trae-harness-experiments"
              target="_blank"
              rel="noopener noreferrer"
              data-no-advance
            >
              <span className="vc-link-icon" aria-hidden="true">&#x1F4CA;</span>
              <span>github.com/zzzkeepdd/<strong>trae-harness-experiments</strong></span>
            </a>
          </div>
        </div>
      )}

      {step === 21 && (
        <div className="vc-scene vc-scene--21">
          <div className="vc-glow-bg" aria-hidden="true" />
          <h1 className="vc-brand">trae-harness</h1>
          <div className="vc-cta-row">
            <a
              className="vc-star-btn"
              href="https://github.com/zzzkeepdd/trae-harness"
              target="_blank"
              rel="noopener noreferrer"
              data-no-advance
            >
              <svg className="vc-star-svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L6.327.668A.75.75 0 018 .25z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
          <span className="vc-end-mark">END</span>
        </div>
      )}
    </div>
  );
}
