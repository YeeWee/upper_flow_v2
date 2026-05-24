import "./Results.css";

export default function Results({ step }: { step: number }) {
  return (
    <div className="re-root">
      {step === 11 && (
        <div className="re-scene re-scene--11">
          <div className="re-experiment-card">
            <span className="re-model-tag">DeepSeek V4 Pro</span>
            <h1 className="re-title">11 轮 A/B 实验</h1>
            <p className="re-subtitle">有 Harness vs 没有 Harness</p>
          </div>
        </div>
      )}

      {step === 12 && (
        <div className="re-scene re-scene--12">
          <div className="re-data-row">
            <span className="re-val-old">90%</span>
            <span className="re-arrow" aria-hidden="true">&#x2192;</span>
            <span className="re-val-new">100%</span>
          </div>
          <p className="re-caption">满分 &middot; 零 bug 遗漏</p>
        </div>
      )}

      {step === 13 && (
        <div className="re-scene re-scene--13">
          <div className="re-data-row">
            <span className="re-label">测试断言密度</span>
            <span className="re-val-old">28 条</span>
            <span className="re-arrow" aria-hidden="true">&#x2192;</span>
            <span className="re-val-new">124 条</span>
          </div>
          <span className="re-badge-delta">+340%</span>
          <p className="re-caption">四倍密度</p>
        </div>
      )}

      {step === 14 && (
        <div className="re-scene re-scene--14">
          <div className="re-metric-pair">
            <div className="re-metric-card">
              <span className="re-metric-label">覆盖率</span>
              <div className="re-metric-values">
                <span className="re-val-old-sm">62%</span>
                <span className="re-arrow-sm" aria-hidden="true">&#x2192;</span>
                <span className="re-val-new-sm">85%</span>
              </div>
            </div>
            <div className="re-metric-card">
              <span className="re-metric-label">规范违规</span>
              <div className="re-metric-values">
                <span className="re-val-old-sm">100%</span>
                <span className="re-arrow-sm" aria-hidden="true">&#x2192;</span>
                <span className="re-val-new-sm neg">-60%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 15 && (
        <div className="re-scene re-scene--15">
          <div className="re-triple-row">
            <div className="re-badge-card">
              <span className="re-badge-label">安全防御</span>
              <span className="re-badge-num">&times;3.0</span>
            </div>
            <div className="re-badge-card">
              <span className="re-badge-label">Bug 复发率</span>
              <span className="re-badge-num neg">-91.7%</span>
            </div>
            <div className="re-badge-card">
              <span className="re-badge-label">性能加速</span>
              <span className="re-badge-num">&times;4.6</span>
            </div>
          </div>
        </div>
      )}

      {step === 16 && (
        <div className="re-scene re-scene--16">
          <div className="re-zero-block">
            <div className="re-zero-line">
              <span className="re-zero-from">2 bugs</span>
              <span className="re-arrow-lg" aria-hidden="true">&#x2192;</span>
              <span className="re-zero-to">0</span>
            </div>
            <p className="re-zero-label">SWE-bench 零回归</p>
          </div>
        </div>
      )}

      {step === 17 && (
        <div className="re-scene re-scene--17">
          <div className="re-roi-card">
            <span className="re-roi-context">花 20K token 省下 100K token</span>
            <span className="re-roi-num">529%</span>
            <span className="re-roi-label">净 ROI</span>
            <span className="re-roi-footer">L3 级任务 ROI &gt; 1000%</span>
          </div>
        </div>
      )}

      {step === 18 && (
        <div className="re-scene re-scene--18">
          <p className="re-quote">复杂度越高，回报越大。</p>
        </div>
      )}
    </div>
  );
}
