import React from 'react';
import { Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MetricGauge({
  reported = 0.95,
  measured = 0.89,
  difference = null,
  withinTolerance = null,
  isAuthoritative = false,
  toleranceThreshold = 0.02,
}) {
  const reportedPct = (reported * 100).toFixed(1);
  const measuredPct = (measured * 100).toFixed(1);
  const computedDiff = difference !== null ? difference : Math.abs(Number(reportedPct) - Number(measuredPct)).toFixed(2);
  const isMatch = withinTolerance !== null ? withinTolerance : Math.abs(reported - measured) <= toleranceThreshold;

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-border-line shadow-card-subtle relative overflow-hidden">
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-paleBlue text-deepBlue border border-border-line">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-primary">
              Metric Comparison Visualizer
            </h4>
            <p className="text-xs text-ink-muted">
              Standard tolerance threshold: ±{(toleranceThreshold * 100).toFixed(0)}% (0.02)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthoritative ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-surface-paleBlue text-deepBlue border border-border-line">
              <span className="w-1.5 h-1.5 rounded-full bg-status-teal animate-pulse" />
              Verified by FastAPI /audit
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-ink-muted bg-canvas border border-border-line">
              Interactive Preview
            </span>
          )}
        </div>
      </div>

      {/* Comparative Horizontal Bars */}
      <div className="space-y-6">
        {/* Reported Accuracy Bar */}
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-mono text-ink-secondary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-steel" />
              Published Paper Metric
            </span>
            <span className="font-mono font-bold text-base text-steel">
              {reportedPct}% <span className="text-xs text-ink-muted font-normal">({reported.toFixed(3)})</span>
            </span>
          </div>
          <div className="h-4 bg-canvas rounded-full overflow-hidden p-0.5 border border-border-line relative">
            <div
              style={{ width: `${Math.min(reported * 100, 100)}%`, transition: 'width 0.6s ease-out' }}
              className="h-full rounded-full bg-steel relative"
            />
          </div>
        </div>

        {/* Measured Accuracy Bar */}
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-mono text-ink-secondary flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-sm ${isMatch ? 'bg-status-teal' : 'bg-status-red'}`} />
              Measured Experiment Metric
            </span>
            <span className={`font-mono font-bold text-base ${isMatch ? 'text-status-teal' : 'text-status-red'}`}>
              {measuredPct}% <span className="text-xs text-ink-muted font-normal">({measured.toFixed(3)})</span>
            </span>
          </div>
          <div className="h-4 bg-canvas rounded-full overflow-hidden p-0.5 border border-border-line relative">
            <div
              style={{ width: `${Math.min(measured * 100, 100)}%`, transition: 'width 0.6s ease-out' }}
              className={`h-full rounded-full ${isMatch ? 'bg-status-teal' : 'bg-status-red'}`}
            />
          </div>
        </div>
      </div>

      {/* Discrepancy Breakdown Grid */}
      <div className="mt-6 pt-5 border-t border-border-line grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-canvas border border-border-line">
          <div className="text-[11px] font-mono text-ink-muted uppercase">Delta Gap</div>
          <div className="text-xl font-mono font-bold text-ink-primary mt-1 flex items-baseline gap-1">
            {computedDiff}
            <span className="text-xs font-normal text-ink-secondary">pp</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-canvas border border-border-line">
          <div className="text-[11px] font-mono text-ink-muted uppercase">Tolerance Status</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
            {isMatch ? (
              <span className="text-status-teal flex items-center gap-1 font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Within Tolerance (≤2%)
              </span>
            ) : (
              <span className="text-status-red flex items-center gap-1 font-mono font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy Alert (&gt;2%)
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-canvas border border-border-line">
          <div className="text-[11px] font-mono text-ink-muted uppercase">Reproduction Evidence</div>
          <div className="text-xs text-ink-secondary mt-1 font-mono leading-tight truncate">
            {isMatch ? 'High numerical alignment' : 'Significant divergence'}
          </div>
        </div>
      </div>

    </div>
  );
}
